/**
 * Consulta del registro de errores del backend (soporte tecnico).
 */
const express = require("express");
const { autenticar, autorizar } = require("../middleware/autenticar");
const controlador = require("../controladores/logs");

const router = express.Router();
router.use(autenticar, autorizar("coordinador", "programador"));

router.get("/", controlador.listar);
router.get("/descargar", controlador.descargar);

module.exports = router;
