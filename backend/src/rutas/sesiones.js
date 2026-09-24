/**
 * CU-12 Iniciar sesion de clase · CU-14 Supervisar en tiempo real
 * CU-15 Asistencia manual/override · cierre con generacion de justificaciones (72h)
 */
const express = require("express");
const { autenticar, autorizar } = require("../middleware/autenticar");
const controlador = require("../controladores/sesiones");

const router = express.Router();
router.use(autenticar);

const SUPERVISION = ["instructor", "coordinador", "programador"];

router.get("/hoy", autorizar(...SUPERVISION), controlador.horariosDeHoy);
router.post("/iniciar", autorizar(...SUPERVISION), controlador.iniciarSesion);
router.get("/:id", autorizar(...SUPERVISION), controlador.verDetalle);
router.post("/:id/asistencia-manual", autorizar(...SUPERVISION), controlador.registrarAsistenciaManual);
router.post("/:id/cerrar", autorizar(...SUPERVISION), controlador.cerrarSesion);
router.delete("/:id", autorizar("coordinador", "programador"), controlador.eliminarSesion);

module.exports = router;
