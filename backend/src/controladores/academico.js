const servicio = require("../servicios/academico");

function responderError(res, error, mensaje) {
  if (error.code === "23505") return res.status(400).json({ mensaje: "El registro ya existe" });
  if (error.code === "23514") return res.status(400).json({ mensaje: "La fecha fin debe ser posterior a la fecha inicio" });
  if (error.tipo === "conflicto_horario" || error.tipo === "validacion") return res.status(400).json({ mensaje: error.message });
  console.error(error);
  return res.status(500).json({ mensaje });
}

async function listarPeriodos(_req, res) {
  try {
    res.json(await servicio.obtenerPeriodos());
  } catch (error) {
    responderError(res, error, "Error al listar los periodos");
  }
}

async function listarInstructores(_req, res) {
  try {
    res.json(await servicio.obtenerInstructores());
  } catch (error) {
    responderError(res, error, "Error al listar los instructores");
  }
}

async function crearPeriodo(req, res) {
  try {
    res.status(201).json(await servicio.crearPeriodo(req.body));
  } catch (error) {
    responderError(res, error, "Error al crear el periodo");
  }
}

async function listarFichas(req, res) {
  try {
    res.json(await servicio.obtenerFichas(req.usuario));
  } catch (error) {
    responderError(res, error, "Error al listar las fichas");
  }
}

async function crearFicha(req, res) {
  try {
    res.status(201).json(await servicio.crearFicha(req.body, req.usuario));
  } catch (error) {
    responderError(res, error, "Error al crear la ficha");
  }
}

async function listarHorarios(req, res) {
  try {
    res.json(await servicio.obtenerHorarios(req.usuario));
  } catch (error) {
    responderError(res, error, "Error al listar los horarios");
  }
}

async function crearHorario(req, res) {
  try {
    res.status(201).json(await servicio.crearHorario(req.body, req.usuario));
  } catch (error) {
    responderError(res, error, "Error al crear el horario");
  }
}

async function eliminarHorario(req, res) {
  try {
    await servicio.eliminarHorario(req.params.id, req.usuario);
    res.json({ mensaje: "Horario eliminado" });
  } catch (error) {
    if (error.code === "23503") return res.status(400).json({ mensaje: "No se puede eliminar: ya existen sesiones de clase registradas para este horario" });
    responderError(res, error, "Error al eliminar el horario");
  }
}

// ---------- MATRICULAS (CU-06) ----------
async function listarMatriculas(req, res) {
  try {
    res.json(await servicio.obtenerMatriculasDeFicha(req.params.id));
  } catch (error) {
    responderError(res, error, "Error al listar las matrículas");
  }
}

async function matricular(req, res) {
  try {
    res.json(await servicio.matricularAprendices(req.params.id, req.body.ids_aprendices, req.usuario));
  } catch (error) {
    responderError(res, error, "Error al matricular aprendices");
  }
}

async function cambiarEstadoMatricula(req, res) {
  try {
    await servicio.cambiarEstadoMatricula(req.params.id, req.body.estado, req.usuario);
    res.json({ mensaje: "Matrícula actualizada" });
  } catch (error) {
    responderError(res, error, "Error al actualizar la matrícula");
  }
}

// ---------- AMBIENTES Y DISPOSITIVOS (CU-07, CU-09) ----------
async function listarAmbientes(_req, res) {
  try {
    res.json(await servicio.obtenerAmbientes());
  } catch (error) {
    responderError(res, error, "Error al listar los ambientes");
  }
}

async function crearAmbiente(req, res) {
  try {
    res.status(201).json(await servicio.crearAmbiente(req.body, req.usuario));
  } catch (error) {
    if (error.code === "23503") return res.status(400).json({ mensaje: "El periodo indicado no existe" });
    responderError(res, error, "Error al crear el ambiente");
  }
}

async function asociarDispositivo(req, res) {
  try {
    res.status(201).json(await servicio.asociarDispositivo(req.params.id, req.body, req.usuario));
  } catch (error) {
    if (error.code === "23505") return res.status(400).json({ mensaje: "Serial duplicado o el ambiente ya tiene un lector asociado" });
    responderError(res, error, "Error al registrar el dispositivo");
  }
}

async function listarDispositivos(_req, res) {
  try {
    res.json(await servicio.obtenerDispositivos());
  } catch (error) {
    responderError(res, error, "Error al listar los dispositivos");
  }
}

module.exports = {
  listarPeriodos,
  listarInstructores,
  crearPeriodo,
  listarFichas,
  crearFicha,
  listarHorarios,
  crearHorario,
  eliminarHorario,
  listarMatriculas,
  matricular,
  cambiarEstadoMatricula,
  listarAmbientes,
  crearAmbiente,
  asociarDispositivo,
  listarDispositivos,
};
