/**
 * Lectores biométricos: identificación del equipo y señal de vida (CU-09).
 * Lo usan los dos protocolos: el simulado (/api/lector) y el real ADMS (/iclock).
 */
const modelo = require("../modelos/dispositivo");
const { error } = require("../utilidades/errores");

/** Protocolo simulado: el lector se identifica con serial + clave de API. */
async function autenticar(serial, claveApi) {
  if (!serial || !claveApi) throw error("Dispositivo no autorizado", "credenciales");
  const dispositivo = await modelo.buscarPorCredenciales(serial, claveApi);
  if (!dispositivo) throw error("Dispositivo no autorizado", "credenciales");
  return dispositivo;
}

/**
 * Protocolo ADMS: el equipo solo informa su serial (el protocolo de fábrica no
 * admite clave). Si está registrado, cuenta como señal de vida.
 */
async function identificarPorSerial(serial) {
  const dispositivo = serial ? await modelo.buscarPorSerial(serial) : null;
  if (dispositivo) await modelo.marcarEnLinea(dispositivo.id_dispositivo);
  return dispositivo;
}

async function registrarLatido(idDispositivo) {
  await modelo.marcarEnLinea(idDispositivo);
}

module.exports = { autenticar, identificarPorSerial, registrarLatido };
