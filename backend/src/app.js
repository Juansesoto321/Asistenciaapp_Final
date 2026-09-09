/**
 * AsistenciaApp · Punto de entrada
 * Sistema de Control de Asistencia con Lector de Huella Digital · SENA 2026
 *
 * Aqui solo se configuran middlewares, se montan las rutas y se levanta el
 * servidor. La logica vive en: rutas -> controladores -> servicios -> repositorios.
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const tiempoReal = require("./servicios/tiempoReal");
const tareasProgramadas = require("./servicios/tareasProgramadas");
const logs = require("./servicios/logs");
const { manejadorErrores, rutaNoEncontrada } = require("./middleware/manejadorErrores");

// Red de seguridad: un error sin capturar en cualquier punto no debe tumbar
// el servidor. Queda registrado para poder revisarlo despues.
process.on("unhandledRejection", (err) => {
  console.error("Rechazo no manejado:", err);
  logs.registrar({ mensaje: `Rechazo no manejado: ${err?.message || err}`, traza: err?.stack });
});
process.on("uncaughtException", (err) => {
  console.error("Excepción no capturada:", err);
  logs.registrar({ mensaje: `Excepción no capturada: ${err?.message || err}`, traza: err?.stack });
});

const app = express();
const servidor = http.createServer(app);
tiempoReal.inicializar(servidor);

app.use(cors());
app.use(express.json({ limit: "10mb" })); // adjuntos de justificacion en base64

// Salud del servicio (publica)
app.get("/api/salud", (_req, res) => res.json({ ok: true, servicio: "AsistenciaApp", fecha: new Date() }));

// Rutas con prefijo propio (el orden importa: las publicas primero)
app.use("/api/auth", require("./rutas/auth"));
app.use("/api/lector", require("./rutas/lector"));            // dispositivo (clave API)
app.use("/api/justificaciones", require("./rutas/justificaciones")); // incluye rutas publicas por token
app.use("/api/usuarios", require("./rutas/usuarios"));
app.use("/api/biometria", require("./rutas/biometria"));
app.use("/api/sesiones", require("./rutas/sesiones"));
app.use("/api/reportes", require("./rutas/reportes"));
app.use("/api/notificaciones", require("./rutas/notificaciones"));
app.use("/api/soporte", require("./rutas/soporte"));
app.use("/api/configuracion", require("./rutas/configuracion"));
app.use("/api/logs", require("./rutas/logs"));
app.use("/api/competencias", require("./rutas/competencias"));
// Routers montados en /api (requieren token): SIEMPRE al final
app.use("/api", require("./rutas/academico"));

// Protocolo real ZKTeco PUSH/ADMS (lectores fisicos como el SenseFace 2A).
// Rutas fijas por el protocolo: no llevan prefijo /api.
app.use("/iclock", require("./rutas/adms"));

// Control de errores: SIEMPRE al final, despues de todas las rutas
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

tareasProgramadas.iniciar();

const PUERTO = process.env.PUERTO || 4000;
servidor.listen(PUERTO, () => {
  console.log(`\nAsistenciaApp backend escuchando en http://localhost:${PUERTO}`);
  console.log("Socket.IO activo para supervisión en tiempo real\n");
});
