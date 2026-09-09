/** CU-20 Notificaciones */
const express = require("express");
const controlador = require("../controladores/notificaciones");
const { autenticar } = require("../middleware/autenticar");

const router = express.Router();
router.use(autenticar);

router.get("/", controlador.listar);
router.get("/contador", controlador.contador);
router.patch("/:id/leida", controlador.marcarLeida);

module.exports = router;
