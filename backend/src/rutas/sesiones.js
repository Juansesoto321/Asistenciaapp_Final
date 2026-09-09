/**
 * CU-12 Iniciar sesion de clase · CU-14 Supervisar en tiempo real
 * CU-15 Asistencia manual/override · cierre con generacion de justificaciones (72h)
 */
const express = require("express");
const { autenticar, autorizar } = require("../middleware/autenticar");
const controlador = require("../controladores/sesiones");

const router = express.Router();
router.use(autenticar);

router.get("/hoy", autorizar("instructor", "coordinador", "programador"), controlador.horariosDeHoy);
router.post("/iniciar", autorizar("instructor", "coordinador", "programador"), controlador.iniciarSesion);
router.get("/:id", controlador.verDetalle);
router.post("/:id/asistencia-manual", autorizar("instructor", "coordinador", "programador"), controlador.registrarAsistenciaManual);
router.post("/:id/cerrar", autorizar("instructor", "coordinador", "programador"), controlador.cerrarSesion);
router.delete("/:id", autorizar("coordinador", "programador"), controlador.eliminarSesion);

module.exports = router;
