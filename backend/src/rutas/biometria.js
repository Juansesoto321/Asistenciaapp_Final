/** CU-10 Enrollment con consentimiento · CU-11 Derecho al borrado (Ley 1581/2012) */
const express = require("express");
const controlador = require("../controladores/biometria");
const { autenticar, autorizar } = require("../middleware/autenticar");

const router = express.Router();
router.use(autenticar);

router.get("/consentimiento/texto", controlador.textoConsentimiento);
router.get("/:idAprendiz/estado", controlador.estado);
router.post("/enrolar", autorizar("administrador", "instructor"), controlador.enrolar);
router.delete("/:idAprendiz", autorizar("administrador"), controlador.eliminar);

module.exports = router;
