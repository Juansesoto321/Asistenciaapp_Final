import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../servicios/api";

/**
 * Botón de una clase de hoy: iniciarla, supervisarla en vivo o ver su resumen.
 * Lo usan la página de Sesiones y el panel del instructor.
 * `horario` es una fila de GET /api/sesiones/hoy.
 */
export default function AccionSesion({ horario, alError }) {
  const navegar = useNavigate();
  const [iniciando, setIniciando] = useState(false);

  async function iniciar() {
    setIniciando(true);
    try {
      const r = await api("/sesiones/iniciar", { method: "POST", body: { id_horario: horario.id_horario } });
      navegar(`/sesiones/${r.id_sesion}`);
    } catch (e) {
      alError?.(e.message);
      setIniciando(false);
    }
  }

  if (horario.estado_sesion === "activa")
    return <button className="boton mini" onClick={() => navegar(`/sesiones/${horario.id_sesion}`)}>Supervisar →</button>;
  if (horario.estado_sesion === "cerrada")
    return <button className="boton mini suave" onClick={() => navegar(`/sesiones/${horario.id_sesion}`)}>Ver resumen</button>;
  return (
    <button className="boton mini" disabled={iniciando} onClick={iniciar}>
      {iniciando ? "Iniciando…" : "Iniciar sesión de hoy"}
    </button>
  );
}
