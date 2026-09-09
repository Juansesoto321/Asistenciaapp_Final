/**
 * Estructura curricular: Competencia -> Resultado de Aprendizaje (RAP) -> Tematica.
 * Incluye la carga masiva desde CSV que pidio el instructor.
 */
const repo = require("../repositorios/competencias");
const { enTransaccion } = require("../repositorios/transaccion");
const { auditar } = require("./auditoria");

function error(mensaje, tipo) {
  return Object.assign(new Error(mensaje), { tipo });
}

// ---------- COMPETENCIAS ----------
async function listarCompetencias(buscar) {
  return repo.listarCompetencias(buscar);
}

async function crearCompetencia({ codigo, nombre }, usuario) {
  if (!nombre?.trim()) throw error("El nombre de la competencia es obligatorio", "validacion");
  const competencia = await repo.crearCompetencia({ codigo: codigo?.trim(), nombre: nombre.trim() });
  await auditar(usuario.id, "crear_competencia", "competencia", competencia.id_competencia);
  return competencia;
}

async function editarCompetencia(id, { codigo, nombre }, usuario) {
  if (!nombre?.trim()) throw error("El nombre de la competencia es obligatorio", "validacion");
  const competencia = await repo.editarCompetencia(id, { codigo: codigo?.trim(), nombre: nombre.trim() });
  if (!competencia) throw error("Competencia no encontrada", "no_encontrado");
  await auditar(usuario.id, "editar_competencia", "competencia", Number(id));
  return competencia;
}

async function eliminarCompetencia(id, usuario) {
  const borrada = await repo.eliminarCompetencia(id);
  if (!borrada) throw error("Competencia no encontrada", "no_encontrado");
  await auditar(usuario.id, "eliminar_competencia", "competencia", Number(id));
}

// ---------- RESULTADOS DE APRENDIZAJE ----------
async function listarRaps(idCompetencia) {
  return repo.listarRaps(idCompetencia);
}

async function crearRap({ id_competencia, codigo, nombre }, usuario) {
  if (!id_competencia) throw error("Selecciona la competencia a la que pertenece", "validacion");
  if (!codigo?.trim()) throw error("El código del resultado de aprendizaje es obligatorio", "validacion");
  if (!nombre?.trim()) throw error("El nombre del resultado de aprendizaje es obligatorio", "validacion");

  const rap = await repo.crearRap({ idCompetencia: id_competencia, codigo: codigo.trim(), nombre: nombre.trim() });
  await auditar(usuario.id, "crear_rap", "resultado_aprendizaje", rap.id_rap);
  return rap;
}

async function editarRap(id, { id_competencia, codigo, nombre }, usuario) {
  if (!codigo?.trim() || !nombre?.trim())
    throw error("El código y el nombre del resultado de aprendizaje son obligatorios", "validacion");
  const rap = await repo.editarRap(id, { idCompetencia: id_competencia, codigo: codigo.trim(), nombre: nombre.trim() });
  if (!rap) throw error("Resultado de aprendizaje no encontrado", "no_encontrado");
  await auditar(usuario.id, "editar_rap", "resultado_aprendizaje", Number(id));
  return rap;
}

async function eliminarRap(id, usuario) {
  const borrado = await repo.eliminarRap(id);
  if (!borrado) throw error("Resultado de aprendizaje no encontrado", "no_encontrado");
  await auditar(usuario.id, "eliminar_rap", "resultado_aprendizaje", Number(id));
}

// ---------- TEMATICAS ----------
async function crearTematica({ id_rap, nombre }, usuario) {
  if (!id_rap) throw error("Selecciona el resultado de aprendizaje", "validacion");
  if (!nombre?.trim()) throw error("El nombre de la temática es obligatorio", "validacion");
  const existente = await repo.buscarTematica(id_rap, nombre.trim());
  if (existente) throw error("Ese resultado de aprendizaje ya tiene esa temática", "validacion");

  const tematica = await repo.crearTematica({ idRap: id_rap, nombre: nombre.trim() });
  await auditar(usuario.id, "crear_tematica", "tematica", tematica.id_tematica);
  return tematica;
}

async function eliminarTematica(id, usuario) {
  const borrada = await repo.eliminarTematica(id);
  if (!borrada) throw error("Temática no encontrada", "no_encontrado");
  await auditar(usuario.id, "eliminar_tematica", "tematica", Number(id));
}

// ---------- CARGA MASIVA ----------
const SEPARADORES = [";", "\t", ","];
const ENCABEZADOS = ["competencia", "codigo", "código", "resultado", "tematica", "temática"];

function detectarSeparador(linea) {
  return SEPARADORES.reduce((mejor, sep) =>
    linea.split(sep).length > linea.split(mejor).length ? sep : mejor, SEPARADORES[0]);
}

/**
 * Formato esperado (una fila por temática):
 *   competencia ; codigo_rap ; resultado_aprendizaje ; tematica
 * La temática es opcional. Acepta ; , o tabulación, y una fila de encabezados.
 */
function parsearCsv(contenido) {
  const lineas = String(contenido || "").split(/\r?\n/).filter((l) => l.trim());
  if (!lineas.length) throw error("El archivo está vacío", "validacion");

  const separador = detectarSeparador(lineas[0]);
  const primera = lineas[0].toLowerCase();
  const tieneEncabezado = ENCABEZADOS.some((e) => primera.includes(e)) && !/\d{3}/.test(lineas[0]);

  return lineas.slice(tieneEncabezado ? 1 : 0).map((linea, i) => {
    const campos = linea.split(separador).map((c) => c.trim().replace(/^"|"$/g, ""));
    return {
      fila: i + (tieneEncabezado ? 2 : 1),
      competencia: campos[0],
      codigoRap: campos[1],
      resultado: campos[2],
      tematica: campos[3] || null,
    };
  });
}

/**
 * Inserta lo que falte y reutiliza lo que ya existe (validando la competencia
 * por nombre y el RAP por codigo, como indico el instructor). Todo va en una
 * sola transaccion: o entra el archivo completo o no entra nada.
 */
async function cargaMasiva(contenido, usuario) {
  const filas = parsearCsv(contenido);
  const resumen = {
    competencias_nuevas: 0,
    raps_nuevos: 0,
    tematicas_nuevas: 0,
    filas_procesadas: 0,
    errores: [],
  };

  await enTransaccion(async (cliente) => {
    for (const f of filas) {
      if (!f.competencia || !f.codigoRap || !f.resultado) {
        resumen.errores.push({ fila: f.fila, error: "Faltan competencia, código o resultado de aprendizaje" });
        continue;
      }

      let competencia = await repo.buscarCompetenciaPorNombre(f.competencia, cliente);
      if (!competencia) {
        competencia = await repo.crearCompetencia({ nombre: f.competencia }, cliente);
        resumen.competencias_nuevas++;
      }

      let rap = await repo.buscarRapPorCodigo(f.codigoRap, cliente);
      if (!rap) {
        rap = await repo.crearRap(
          { idCompetencia: competencia.id_competencia, codigo: f.codigoRap, nombre: f.resultado },
          cliente
        );
        resumen.raps_nuevos++;
      }

      if (f.tematica) {
        const existente = await repo.buscarTematica(rap.id_rap, f.tematica, cliente);
        if (!existente) {
          await repo.crearTematica({ idRap: rap.id_rap, nombre: f.tematica }, cliente);
          resumen.tematicas_nuevas++;
        }
      }

      resumen.filas_procesadas++;
    }
  });

  await auditar(usuario.id, "carga_masiva_competencias", "competencia", null, resumen);
  return resumen;
}

module.exports = {
  listarCompetencias,
  crearCompetencia,
  editarCompetencia,
  eliminarCompetencia,
  listarRaps,
  crearRap,
  editarRap,
  eliminarRap,
  crearTematica,
  eliminarTematica,
  cargaMasiva,
};
