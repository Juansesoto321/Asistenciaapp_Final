/**
 * CU-01 Iniciar sesion · CU-02 Recuperar contrasena · CU-03 Actualizar perfil
 * CU-22 Auto-registro con aprobacion del coordinador
 */
const express = require("express");
const controlador = require("../controladores/auth");
const { autenticar } = require("../middleware/autenticar");

const router = express.Router();

router.post("/login", controlador.login);
router.post("/registro", controlador.registro);
router.post("/recuperar", controlador.recuperar);
router.post("/restablecer", controlador.restablecer);
router.get("/perfil", autenticar, controlador.verPerfil);
router.put("/perfil", autenticar, controlador.actualizarPerfil);

module.exports = router;
