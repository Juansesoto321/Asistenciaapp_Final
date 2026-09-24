/** Cliente HTTP con el token JWT de la sesion. */
const guardarSesion = (datos) => localStorage.setItem("sesion", JSON.stringify(datos));
const cerrarSesion = () => localStorage.removeItem("sesion");

/** Segundos de expiración que trae el token (campo `exp` del JWT). */
function expiracionDelToken(token) {
  try {
    const carga = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return carga.exp || 0;
  } catch {
    return 0;
  }
}

/**
 * Devuelve la sesión guardada, o null si no hay o si el token ya venció
 * (dura 8 horas). Así, quien vuelve al día siguiente ve el inicio de sesión
 * en vez de una pantalla que falla en la primera petición.
 */
function obtenerSesion() {
  let sesion = null;
  try {
    sesion = JSON.parse(localStorage.getItem("sesion") || "null");
  } catch {
    sesion = null;
  }
  if (sesion && expiracionDelToken(sesion.token) * 1000 <= Date.now()) {
    cerrarSesion();
    return null;
  }
  return sesion;
}

async function api(ruta, opciones = {}) {
  const sesion = obtenerSesion();
  const r = await fetch(`/api${ruta}`, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      ...(sesion?.token ? { Authorization: `Bearer ${sesion.token}` } : {}),
      ...opciones.headers,
    },
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  });
  const datos = await r.json().catch(() => ({}));
  if (r.status === 401 && sesion) { cerrarSesion(); window.location.href = "/"; }
  if (!r.ok) throw new Error(datos.mensaje || "Error de servidor");
  return datos;
}

export { api, guardarSesion, obtenerSesion, cerrarSesion };
