/** CU-21 Soporte tecnico */
const express = require("express");
const controlador = require("../controladores/soporte");
const { autenticar, autorizar } = require("../middleware/autenticar");

const router = express.Router();
router.use(autenticar);

router.post("/", controlador.crear);
router.get("/", controlador.listar);
router.patch("/:id", autorizar("administrador"), controlador.cambiarEstado);

module.exports = router;
