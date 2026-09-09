/**
 * Logica de marcacion de asistencia, compartida por los dos protocolos de
 * lector: el simulado (/api/lector, matching biometrico 1:N) y el real
 * ZKTeco ADMS (/iclock, el dispositivo ya identifica y solo envia el PIN).
 * CU-13 Marcar asistencia con huella · CU-16 Huella no reconocida
 */
const repo = require("../repositorios/marcacion");
const { descifrar, generarTemplateSimulado } = require("./cifrado");
const { emitirASesion } = require("./tiempoReal");

function error(mensaje, tipo) {
  return Object.assign(new Error(mensaje), { tipo });
}

async function obtenerSesionActiva(idAmbiente) {
  const sesion = await repo.buscarSesionActivaEnAmbiente(idAmbiente);
  if (!sesion) throw error("No hay una sesión de clase activa en este ambiente", "sin_sesion");
  return sesion;
}

// regla CU-13: tardanza si supera los minutos de tolerancia configurados
function calcularEstado(horaInicio, tolerancia) {
  const inicioClase = new Date(`${new Date().toISOString().slice(0, 10)}T${horaInicio}`);
  const minutosTarde = (Date.now() - inicioClase.getTime()) / 60000;
  return minutosTarde > tolerancia ? "tardanza" : "presente";
}

async function registrarAsistencia(sesion, aprendiz) {
  const tolerancia = await repo.obtenerTolerancia();
  const estado = calcularEstado(sesion.hora_inicio, tolerancia);
  const idAsistencia = await repo.insertarAsistencia(sesion.id_sesion, aprendiz.id_usuario, estado);
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
  const plantillas = await repo.buscarPlantillasDeFicha(sesion.id_ficha);
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
  const aprendiz = await repo.buscarAprendizPorDocumentoEnFicha(documento, sesion.id_ficha);

  if (!aprendiz) {
    emitirASesion(sesion.id_sesion, "huella_no_reconocida", { hora: new Date(), pin: documento });
    throw error("PIN no corresponde a ningún aprendiz matriculado en la ficha de esta sesión", "no_reconocida");
  }
  return registrarAsistencia(sesion, aprendiz);
}

module.exports = { marcarPorHuella, marcarPorDocumento };
