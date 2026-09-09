/**
 * CU-05 Gestionar fichas · CU-06 Matricular · CU-07 Ambientes y lectores
 * CU-08 Horarios · CU-09 Monitorear lectores
 */
const express = require("express");
const { autenticar, autorizar } = require("../middleware/autenticar");
const controlador = require("../controladores/academico");

const router = express.Router();
router.use(autenticar);

// ---------- PERIODOS ----------
router.get("/periodos", controlador.listarPeriodos);
router.get("/instructores", autorizar("administrador", "programador"), controlador.listarInstructores);
router.post("/periodos", autorizar("administrador", "programador"), controlador.crearPeriodo);

// ---------- FICHAS (CU-05) ----------
router.get("/fichas", controlador.listarFichas);

router.post("/fichas", autorizar("administrador", "programador"), controlador.crearFicha);

// ---------- MATRICULAS (CU-06) ----------
router.get("/fichas/:id/matriculas", controlador.listarMatriculas);
router.post("/fichas/:id/matriculas", autorizar("administrador"), controlador.matricular);
router.patch("/matriculas/:id", autorizar("administrador"), controlador.cambiarEstadoMatricula);

// ---------- AMBIENTES Y DISPOSITIVOS (CU-07) ----------
router.get("/ambientes", controlador.listarAmbientes);
router.post("/ambientes", autorizar("administrador"), controlador.crearAmbiente);

// Asociar lector al ambiente: genera la clave API que usara el dispositivo
router.post("/ambientes/:id/dispositivo", autorizar("administrador"), controlador.asociarDispositivo);

// CU-09: panel de monitoreo de lectores
router.get("/dispositivos", autorizar("administrador"), controlador.listarDispositivos);

// ---------- HORARIOS (CU-08) ----------
router.get("/horarios", controlador.listarHorarios);

router.post("/horarios", autorizar("administrador", "programador"), controlador.crearHorario);

router.delete("/horarios/:id", autorizar("administrador", "programador"), controlador.eliminarHorario);

module.exports = router;
