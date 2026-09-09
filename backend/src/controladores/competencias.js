const servicio = require("../servicios/competencias");
const { traducirCodigos } = require("../middleware/manejadorErrores");

const DUPLICADO = {
  23505: "Ya existe una competencia con ese nombre o un resultado con ese código",
  23503: "La competencia o el resultado de aprendizaje indicado no existe",
};

// ---------- COMPETENCIAS ----------
async function listarCompetencias(req, res, next) {
  try {
    res.json(await servicio.listarCompetencias(req.query.buscar));
  } catch (error) {
    next(error);
  }
}

async function crearCompetencia(req, res, next) {
  try {
    res.status(201).json(await servicio.crearCompetencia(req.body, req.usuario));
  } catch (error) {
    next(traducirCodigos(error, DUPLICADO));
  }
}

async function editarCompetencia(req, res, next) {
  try {
    res.json(await servicio.editarCompetencia(req.params.id, req.body, req.usuario));
  } catch (error) {
    next(traducirCodigos(error, DUPLICADO));
  }
}

async function eliminarCompetencia(req, res, next) {
  try {
    await servicio.eliminarCompetencia(req.params.id, req.usuario);
    res.json({ mensaje: "Competencia eliminada" });
  } catch (error) {
    next(traducirCodigos(error, {
      23503: "No se puede eliminar: hay horarios asociados a esta competencia",
    }));
  }
}

// ---------- RESULTADOS DE APRENDIZAJE ----------
async function listarRaps(req, res, next) {
  try {
    res.json(await servicio.listarRaps(req.query.id_competencia));
  } catch (error) {
    next(error);
  }
}

async function crearRap(req, res, next) {
  try {
    res.status(201).json(await servicio.crearRap(req.body, req.usuario));
  } catch (error) {
    next(traducirCodigos(error, DUPLICADO));
  }
}

async function editarRap(req, res, next) {
  try {
    res.json(await servicio.editarRap(req.params.id, req.body, req.usuario));
  } catch (error) {
    next(traducirCodigos(error, DUPLICADO));
  }
}

async function eliminarRap(req, res, next) {
  try {
    await servicio.eliminarRap(req.params.id, req.usuario);
    res.json({ mensaje: "Resultado de aprendizaje eliminado" });
  } catch (error) {
    next(traducirCodigos(error, {
      23503: "No se puede eliminar: hay horarios asociados a este resultado de aprendizaje",
    }));
  }
}

// ---------- TEMATICAS ----------
async function crearTematica(req, res, next) {
  try {
    res.status(201).json(await servicio.crearTematica(req.body, req.usuario));
  } catch (error) {
    next(traducirCodigos(error, DUPLICADO));
  }
}

async function eliminarTematica(req, res, next) {
  try {
    await servicio.eliminarTematica(req.params.id, req.usuario);
    res.json({ mensaje: "Temática eliminada" });
  } catch (error) {
    next(traducirCodigos(error, {
      23503: "No se puede eliminar: hay horarios asociados a esta temática",
    }));
  }
}

// ---------- CARGA MASIVA ----------
async function cargaMasiva(req, res, next) {
  try {
    res.json(await servicio.cargaMasiva(req.body.contenido, req.usuario));
  } catch (error) {
    next(traducirCodigos(error, DUPLICADO));
  }
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
