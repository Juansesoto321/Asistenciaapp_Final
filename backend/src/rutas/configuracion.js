/** Configuracion del sistema: tolerancia, % minimo, ventana de justificacion */
const express = require("express");
const controlador = require("../controladores/configuracion");
const { autenticar, autorizar } = require("../middleware/autenticar");

const router = express.Router();
router.use(autenticar);

router.get("/", controlador.obtener);
router.put("/", autorizar("coordinador", "programador"), controlador.actualizar);

module.exports = router;
