/** CU-04 Gestionar usuarios · CU-06 Carga masiva · CU-22 Aprobar solicitudes */
const express = require("express");
const controlador = require("../controladores/usuarios");
const { autenticar, autorizar } = require("../middleware/autenticar");

const router = express.Router();
router.use(autenticar, autorizar("administrador"));

router.get("/", controlador.listar);
router.post("/", controlador.crear);
router.put("/:id", controlador.editar);
router.patch("/:id/estado", controlador.cambiarEstado);
router.post("/carga-masiva", controlador.cargaMasiva);

module.exports = router;
