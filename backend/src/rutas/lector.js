/**
 * Endpoint que consume el LECTOR BIOMETRICO simulado.
 * Emula el protocolo PUSH de ZKTeco: el dispositivo envia las marcaciones
 * al servidor. Autenticacion por clave API del dispositivo.
 * CU-13 Marcar asistencia con huella · CU-16 Huella no reconocida · CU-09 heartbeat
 */
const express = require("express");
const { autenticarDispositivo } = require("../middleware/autenticarDispositivo");
const controlador = require("../controladores/lector");

const router = express.Router();

router.post("/heartbeat", autenticarDispositivo, controlador.heartbeat);
router.post("/marcacion", autenticarDispositivo, controlador.marcacion);

module.exports = router;
