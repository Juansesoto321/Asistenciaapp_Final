import { useEffect, useState } from "react";
import { api } from "../../servicios/api";
import { useAuth } from "../../contexto/AuthContext.jsx";
import Cargando from "../../componentes/Cargando.jsx";
import Aviso from "../../componentes/Aviso.jsx";
import Vacio from "../../componentes/Vacio.jsx";

export default function Soporte() {
  const { sesion } = useAuth();
  const rol = sesion.usuario.rol;
  const [tickets, setTickets] = useState(null);
  const [f, setF] = useState({ tipo: "huella", descripcion: "" });
  const [mensaje, setMensaje] = useState(null);

  const cargar = () =>
    api("/soporte").then(setTickets).catch((e) => { setTickets([]); setMensaje({ tipo: "error", texto: e.message }); });
  useEffect(() => { cargar(); }, []);

  async function crear() {
    try {
      const r = await api("/soporte", { method: "POST", body: f });
      setMensaje({ tipo: "exito", texto: r.mensaje });
      setF({ tipo: "huella", descripcion: "" }); cargar();
    } catch (e) { setMensaje({ tipo: "error", texto: e.message }); }
  }

  async function cambiarEstado(t, estado) {
    try {
      await api(`/soporte/${t.id_ticket}`, { method: "PATCH", body: { estado } });
      cargar();
    } catch (e) { setMensaje({ tipo: "error", texto: e.message }); }
  }

  return (
    <>
      <div className="cabecera-pagina">
        <div><h1>Soporte</h1><p>Reporta problemas con tu huella, errores de asistencia o dudas del sistema.</p></div>
      </div>
      <Aviso mensaje={mensaje} alCerrar={() => setMensaje(null)} />

      <div className="tarjeta" style={{ marginBottom: 18, maxWidth: 640 }}>
        <label>Tipo de problema</label>
        <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
          <option value="huella">Mi huella no es reconocida</option>
          <option value="error_asistencia">Error en un registro de asistencia</option>
          <option value="cuenta">Problema con mi cuenta</option>
          <option value="otro">Otro</option>
        </select>
        <label>Descripción detallada</label>
        <textarea rows={3} value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} />
        <button className="boton" style={{ marginTop: 14 }} disabled={!f.descripcion.trim()} onClick={crear}>Registrar ticket</button>
      </div>

      <div className="tabla-desplazable">
      <table className="tabla">
        <thead><tr><th>#</th>{["coordinador", "programador"].includes(rol) && <th>Usuario</th>}<th>Tipo</th><th>Descripción</th><th>Estado</th>{["coordinador", "programador"].includes(rol) && <th></th>}</tr></thead>
        <tbody>
          {(tickets || []).map((t) => (
            <tr key={t.id_ticket}>
              <td><b>{t.id_ticket}</b></td>
              {["coordinador", "programador"].includes(rol) && <td>{t.usuario}</td>}
              <td>{t.tipo.replaceAll("_", " ")}</td>
              <td>{t.descripcion}</td>
              <td><span className={`insignia ${t.estado === "resuelto" ? "presente" : t.estado === "en_proceso" ? "tardanza" : "pendiente"}`}>{t.estado.replaceAll("_", " ")}</span></td>
              {["coordinador", "programador"].includes(rol) && (
                <td style={{ display: "flex", gap: 6 }}>
                  {t.estado !== "resuelto" && <button className="boton mini exito" onClick={() => cambiarEstado(t, "resuelto")}>Resolver</button>}
                  {t.estado === "abierto" && <button className="boton mini suave" onClick={() => cambiarEstado(t, "en_proceso")}>En proceso</button>}
                </td>
              )}
            </tr>
          ))}
          {tickets === null && <tr><td colSpan={6}><Cargando /></td></tr>}
          {tickets?.length === 0 && <tr><td colSpan={6}><Vacio icono="configuracion" titulo="No hay tickets registrados" /></td></tr>}
        </tbody>
      </table>
      </div>
    </>
  );
}
