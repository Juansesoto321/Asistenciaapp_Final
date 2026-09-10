import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { api } from "../servicios/api";
import { useAuth } from "../contexto/AuthContext.jsx";
import Icono from "../componentes/Iconos.jsx";

/** Verde si cumple el mínimo, ámbar si va justo, rojo si está por debajo. */
function colorAsistencia(porcentaje, minimo = 80) {
  if (porcentaje >= minimo) return "var(--verde)";
  if (porcentaje >= minimo - 15) return "var(--ambar)";
  return "var(--rojo)";
}

function AnilloAsistencia({ porcentaje, minimo = 80 }) {
  const color = colorAsistencia(porcentaje, minimo);
  const r = 44, c = 2 * Math.PI * r;
  return (
    <div className="anillo-progreso" style={{ width: 108, height: 108 }}>
      <svg width="108" height="108" role="img" aria-label={`Asistencia promedio ${porcentaje}%`}>
        <circle cx="54" cy="54" r={r} fill="none" stroke="var(--borde)" strokeWidth="10" />
        <circle cx="54" cy="54" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={c * (1 - porcentaje / 100)}
                transform="rotate(-90 54 54)" />
      </svg>
      <div className="centro" style={{ color, fontSize: 22 }}>{porcentaje}%</div>
    </div>
  );
}

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
          <h1>Hola, {sesion.usuario.nombres}</h1>
          <p>{new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        {!esAprendiz && !esGestorAcademico && <Link to="/sesiones" className="boton"><Icono nombre="sesiones" /> Ir a sesiones de hoy</Link>}
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
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "stretch", marginBottom: 14 }}>
          <div className="tarjeta" style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 280, flex: "1 1 280px" }}>
            <AnilloAsistencia porcentaje={Number(datos.promedio_asistencia)} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Asistencia promedio</div>
              <p style={{ color: "var(--tinta-suave)", fontSize: 13, margin: "4px 0 0" }}>
                {Number(datos.promedio_asistencia) >= 80
                  ? "Por encima del mínimo del 80 %."
                  : "Por debajo del mínimo del 80 %."}
              </p>
            </div>
          </div>
          <div className="fila-tarjetas" style={{ flex: "3 1 420px", marginBottom: 0 }}>
            <div className="tarjeta-metrica"><div className="valor">{datos.fichas_activas}</div><div className="nombre">Fichas activas</div></div>
            <div className="tarjeta-metrica"><div className="valor">{datos.aprendices_activos}</div><div className="nombre">Aprendices activos</div></div>
            <div className="tarjeta-metrica">
              <div className="valor" style={{ color: datos.sesiones_hoy > 0 ? "var(--azul)" : undefined }}>{datos.sesiones_hoy}</div>
              <div className="nombre">Sesiones hoy</div>
            </div>
          </div>
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
            <Link className="boton suave" to="/usuarios"><Icono nombre="usuarios" /> Gestionar usuarios</Link>
            <Link className="boton suave" to="/fichas"><Icono nombre="fichas" /> Fichas y matrículas</Link>
            <Link className="boton suave" to="/ambientes"><Icono nombre="ambientes" /> Lectores biométricos</Link>
            <Link className="boton suave" to="/reportes"><Icono nombre="reportes" /> Búsqueda avanzada</Link>
          </>)}
          {rol === "instructor" && (<>
            <Link className="boton suave" to="/sesiones"><Icono nombre="sesiones" /> Iniciar clase de hoy</Link>
            <Link className="boton suave" to="/justificaciones"><Icono nombre="justificaciones" /> Revisar justificaciones</Link>
            <Link className="boton suave" to="/reportes"><Icono nombre="reportes" /> Reportes de mis fichas</Link>
          </>)}
          {rol === "programador" && (<>
            <Link className="boton suave" to="/fichas"><Icono nombre="fichas" /> Gestionar fichas</Link>
            <Link className="boton suave" to="/horarios"><Icono nombre="horarios" /> Organizar horarios</Link>
          </>)}
          {rol === "aprendiz" && (<>
            <Link className="boton suave" to="/mi-asistencia"><Icono nombre="asistencia" /> Ver mi historial completo</Link>
            <Link className="boton suave" to="/perfil"><Icono nombre="perfil" /> Actualizar mis datos</Link>
          </>)}
        </div>
      </div>
    </>
  );
}
