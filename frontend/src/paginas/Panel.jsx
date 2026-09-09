import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { api } from "../servicios/api";
import { useAuth } from "../contexto/AuthContext.jsx";

export default function Panel() {
  const { sesion } = useAuth();
  const rol = sesion.usuario.rol;
  const esAprendiz = rol === "aprendiz";
  const esGestorAcademico = rol === "programador";

  const [datos, setDatos] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [datosGestor, setDatosGestor] = useState(null); // fichas/horarios/periodos (programador)
  const [pendientes, setPendientes] = useState(null); // justificaciones por revisar (instructor/admin)

  useEffect(() => {
    if (esAprendiz) api("/reportes/mi-historial").then(setHistorial).catch(() => {});
    else if (esGestorAcademico) {
      // El rol programador no tiene acceso a /reportes/estadisticas (es de
      // asistencia); se arman sus propias cifras con lo que sí puede ver.
      Promise.all([api("/fichas"), api("/horarios"), api("/periodos")])
        .then(([fichas, horarios, periodos]) => setDatosGestor({
          fichas_activas: fichas.filter((f) => f.estado === "activa").length,
          horarios_programados: horarios.length,
          periodos: periodos.length,
        }))
        .catch(() => {});
    } else api("/reportes/estadisticas").then(setDatos).catch(() => {});
  }, [esAprendiz, esGestorAcademico]);

  // Contador de justificaciones pendientes, en tiempo real (instructor/coordinador)
  useEffect(() => {
    if (esAprendiz || esGestorAcademico) return;
    const cargarPendientes = () => api("/justificaciones/pendientes/contador").then((r) => setPendientes(r.pendientes)).catch(() => {});
    cargarPendientes();
    const socket = io();
    socket.emit("unirse_panel", { rol, id: sesion.usuario.id });
    socket.on("justificaciones:actualizadas", cargarPendientes);
    return () => socket.disconnect();
  }, [esAprendiz, esGestorAcademico]);

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Hola, {sesion.usuario.nombres} 👋</h1>
          <p>{new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        {!esAprendiz && !esGestorAcademico && <Link to="/sesiones" className="boton">🕒 Ir a sesiones de hoy</Link>}
      </div>

      {!esAprendiz && pendientes > 0 && (
        <Link
          to="/justificaciones"
          className="tarjeta"
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--ambar-suave)", border: "1px solid #fcd9a8", marginBottom: 14, padding: "14px 18px",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", color: "var(--ambar)", fontWeight: 700, fontSize: 14.5 }}>
            <span className="pulso" style={{ background: "var(--ambar)" }} />
            {pendientes} justificaci{pendientes === 1 ? "ón" : "ones"} pendiente{pendientes === 1 ? "" : "s"} por revisar
          </span>
          <span style={{ color: "var(--ambar)", fontWeight: 700, fontSize: 13 }}>Revisar →</span>
        </Link>
      )}

      {!esAprendiz && !esGestorAcademico && datos && (
        <div className="fila-tarjetas">
          <div className="tarjeta-metrica"><div className="valor">{datos.fichas_activas}</div><div className="nombre">Fichas activas</div></div>
          <div className="tarjeta-metrica"><div className="valor">{datos.aprendices_activos}</div><div className="nombre">Aprendices activos</div></div>
          <div className="tarjeta-metrica"><div className="valor">{datos.sesiones_hoy}</div><div className="nombre">Sesiones hoy</div></div>
          <div className="tarjeta-metrica"><div className="valor">{datos.promedio_asistencia}%</div><div className="nombre">Asistencia promedio</div></div>
        </div>
      )}

      {esGestorAcademico && datosGestor && (
        <div className="fila-tarjetas">
          <div className="tarjeta-metrica"><div className="valor">{datosGestor.fichas_activas}</div><div className="nombre">Fichas activas</div></div>
          <div className="tarjeta-metrica"><div className="valor">{datosGestor.horarios_programados}</div><div className="nombre">Horarios programados</div></div>
          <div className="tarjeta-metrica"><div className="valor">{datosGestor.periodos}</div><div className="nombre">Periodos</div></div>
        </div>
      )}

      {esAprendiz && historial?.resumen && (
        <div className="fila-tarjetas">
          <div className="tarjeta-metrica">
            <div className="valor" style={{ color: historial.resumen.porcentaje < historial.resumen.minimo ? "var(--rojo)" : "var(--verde)" }}>
              {historial.resumen.porcentaje}%
            </div>
            <div className="nombre">Mi asistencia</div>
          </div>
          <div className="tarjeta-metrica"><div className="valor">{historial.resumen.presentes}</div><div className="nombre">Presentes</div></div>
          <div className="tarjeta-metrica"><div className="valor">{historial.resumen.tardanzas}</div><div className="nombre">Tardanzas</div></div>
          <div className="tarjeta-metrica"><div className="valor">{historial.resumen.ausencias}</div><div className="nombre">Ausencias</div></div>
        </div>
      )}

      <div className="tarjeta">
        <h3>Accesos rápidos</h3>
        <p style={{ color: "var(--tinta-suave)", margin: "8px 0 14px" }}>Lo más usado según tu rol.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {rol === "coordinador" && (<>
            <Link className="boton suave" to="/usuarios">👥 Gestionar usuarios</Link>
            <Link className="boton suave" to="/fichas">📚 Fichas y matrículas</Link>
            <Link className="boton suave" to="/ambientes">🏫 Lectores biométricos</Link>
            <Link className="boton suave" to="/reportes">🔎 Búsqueda avanzada</Link>
          </>)}
          {rol === "instructor" && (<>
            <Link className="boton suave" to="/sesiones">🕒 Iniciar clase de hoy</Link>
            <Link className="boton suave" to="/justificaciones">📄 Revisar justificaciones</Link>
            <Link className="boton suave" to="/reportes">🔎 Reportes de mis fichas</Link>
          </>)}
          {rol === "programador" && (<>
            <Link className="boton suave" to="/fichas">📚 Gestionar fichas</Link>
            <Link className="boton suave" to="/horarios">🗓️ Organizar horarios</Link>
          </>)}
          {rol === "aprendiz" && (<>
            <Link className="boton suave" to="/mi-asistencia">🗒️ Ver mi historial completo</Link>
            <Link className="boton suave" to="/perfil">👤 Actualizar mis datos</Link>
          </>)}
        </div>
      </div>
    </>
  );
}
