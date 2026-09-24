/**
 * Logica de marcacion de asistencia, compartida por los dos protocolos de
 * lector: el simulado (/api/lector, matching biometrico 1:N) y el real
 * ZKTeco ADMS (/iclock, el dispositivo ya identifica y solo envia el PIN).
 * CU-13 Marcar asistencia con huella · CU-16 Huella no reconocida
 */
const modelo = require("../modelos/marcacion");
const { descifrar, generarTemplateSimulado } = require("./cifrado");
const { emitirASesion } = require("./tiempoReal");
const { error } = require("../utilidades/errores");

async function obtenerSesionActiva(idAmbiente) {
  const sesion = await modelo.buscarSesionActivaEnAmbiente(idAmbiente);
  if (!sesion) throw error("No hay una sesión de clase activa en este ambiente", "sin_sesion");
  return sesion;
}

/**
 * Regla CU-13: tardanza si supera los minutos de tolerancia configurados.
 * La hora de inicio se ubica en el dia LOCAL de la marcacion. Antes se usaba
 * la fecha en UTC, que en Colombia ya es "mañana" desde las 7:00 p. m.: en las
 * clases nocturnas nadie quedaba con tardanza.
 */
function calcularEstado(horaInicio, tolerancia, ahora = new Date()) {
  const [horas, minutos, segundos = 0] = String(horaInicio).split(":").map(Number);
  const inicioClase = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), horas, minutos, segundos);
  const minutosTarde = (ahora - inicioClase) / 60000;
  return minutosTarde > tolerancia ? "tardanza" : "presente";
}

async function registrarAsistencia(sesion, aprendiz) {
  const tolerancia = await modelo.obtenerTolerancia();
  const estado = calcularEstado(sesion.hora_inicio, tolerancia);
  const idAsistencia = await modelo.insertarAsistencia(sesion.id_sesion, aprendiz.id_usuario, estado);
  if (!idAsistencia) return { duplicada: true, aprendiz, estado: null };

  emitirASesion(sesion.id_sesion, "marcacion", {
    id_aprendiz: aprendiz.id_usuario,
    nombres: aprendiz.nombres,
    apellidos: aprendiz.apellidos,
    estado,
    hora_marca: new Date(),
    metodo: "huella",
  });
  return { duplicada: false, aprendiz, estado };
}

/** Protocolo simulado: identifica al aprendiz comparando el template leido contra las plantillas cifradas de la ficha */
async function marcarPorHuella(idAmbiente, lectura) {
  const sesion = await obtenerSesionActiva(idAmbiente);
  const plantillas = await modelo.buscarPlantillasDeFicha(sesion.id_ficha);
  const templateLeido = generarTemplateSimulado(lectura);

  let aprendiz = null;
  for (const p of plantillas) {
    try {
      if (descifrar(p) === templateLeido) { aprendiz = p; break; }
    } catch { /* plantilla corrupta: se ignora */ }
  }

  if (!aprendiz) {
    emitirASesion(sesion.id_sesion, "huella_no_reconocida", { hora: new Date() });
    throw error("Huella no reconocida. Reintenta (máximo 3 veces) o pide registro manual al instructor", "no_reconocida");
  }
  return registrarAsistencia(sesion, aprendiz);
}

/** Protocolo real ADMS: el dispositivo ya identifico y envia el PIN (=documento) */
async function marcarPorDocumento(idAmbiente, documento) {
  const sesion = await obtenerSesionActiva(idAmbiente);
  const aprendiz = await modelo.buscarAprendizPorDocumentoEnFicha(documento, sesion.id_ficha);

  if (!aprendiz) {
    emitirASesion(sesion.id_sesion, "huella_no_reconocida", { hora: new Date(), pin: documento });
    throw error("PIN no corresponde a ningún aprendiz matriculado en la ficha de esta sesión", "no_reconocida");
  }
  return registrarAsistencia(sesion, aprendiz);
}

module.exports = { marcarPorHuella, marcarPorDocumento, calcularEstado };
