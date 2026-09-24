/**
 * Entorno de las pruebas. Cada archivo de prueba lo importa ANTES que
 * cualquier módulo de src/, para que estos valores ganen sobre el .env:
 *
 * - Base de datos aparte (asistenciaapp_pruebas): nunca se toca la de desarrollo.
 * - Sin SMTP y con NODE_ENV=test: en pruebas jamás se envían correos reales.
 * - Claves propias de prueba, no las del .env.
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const archivoEnv = path.join(__dirname, "../.env");
const envLocal = fs.existsSync(archivoEnv) ? dotenv.parse(fs.readFileSync(archivoEnv)) : {};

function urlDePruebas() {
  if (process.env.DATABASE_URL_PRUEBAS) return process.env.DATABASE_URL_PRUEBAS;
  // Mismo servidor y credenciales que el .env, pero otra base de datos
  const url = new URL(envLocal.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/asistenciaapp");
  url.pathname = "/asistenciaapp_pruebas";
  return url.toString();
}

Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: urlDePruebas(),
  JWT_SECRETO: "secreto-exclusivo-de-las-pruebas-automaticas",
  CLAVE_CIFRADO: "ab".repeat(32),
  CORREO_HOST: "",
  URL_FRONTEND: "http://localhost:5173",
});
