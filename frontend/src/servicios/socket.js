/**
 * Conexión de tiempo real (Socket.IO) autenticada con el mismo token de la
 * API. El servidor toma el rol y el id del token: el cliente ya no los envía.
 */
import { io } from "socket.io-client";
import { obtenerSesion } from "./api";

export function conectarTiempoReal() {
  return io({ auth: { token: obtenerSesion()?.token } });
}
