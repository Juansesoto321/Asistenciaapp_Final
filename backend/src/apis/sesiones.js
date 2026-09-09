/**
 * CU-12 Iniciar sesion de clase · CU-14 Supervisar en tiempo real
 * CU-15 Asistencia manual/override · cierre con generacion de justificaciones (72h)
 */
const express = require("express");
const { autenticar, autorizar } = require("../middleware/autenticar");
const controlador = require("../controladores/sesiones");

const router = express.Router();
router.use(autenticar);

router.get("/hoy", autorizar("instructor", "administrador"), controlador.horariosDeHoy);
router.post("/iniciar", autorizar("instructor", "administrador"), controlador.iniciarSesion);
router.get("/:id", controlador.verDetalle);
router.post("/:id/asistencia-manual", autorizar("instructor", "administrador"), controlador.registrarAsistenciaManual);
router.post("/:id/cerrar", autorizar("instructor", "administrador"), controlador.cerrarSesion);
router.delete("/:id", autorizar("administrador"), controlador.eliminarSesion);

module.exports = router;
