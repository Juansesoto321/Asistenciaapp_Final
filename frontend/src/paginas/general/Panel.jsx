import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../servicios/api";
import { conectarTiempoReal } from "../../servicios/socket";
import { useAuth } from "../../contexto/AuthContext.jsx";
import Icono from "../../componentes/Iconos.jsx";
import Aviso from "../../componentes/Aviso.jsx";
import Cargando from "../../componentes/Cargando.jsx";
import Vacio from "../../componentes/Vacio.jsx";
import AccionSesion from "../../componentes/AccionSesion.jsx";
import AnilloAsistencia from "../../componentes/AnilloAsistencia.jsx";
import { horaCorta, mayusculaInicial } from "../../utilidades/formato";
import { nombreDelDia, proximaClase } from "../../utilidades/fechas";

const MAX_CLASES_EN_PANEL = 5;

const ACCESOS = {
  coordinador: [
    ["/usuarios", "usuarios", "Gestionar usuarios"],
    ["/fichas", "fichas", "Fichas y matrículas"],
    ["/horarios", "horarios", "Calendario de horarios"],
    ["/ambientes", "ambientes", "Lectores biométricos"],
    ["/reportes", "reportes", "Búsqueda avanzada"],
  ],
  instructor: [
    ["/justificaciones", "justificaciones", "Revisar justificaciones"],
    ["/horarios", "horarios", "Mis horarios"],
    ["/fichas", "fichas", "Mis fichas"],
    ["/reportes", "reportes", "Reportes de mis fichas"],
  ],
  programador: [
    ["/fichas", "fichas", "Gestionar fichas"],
    ["/horarios", "horarios", "Organizar horarios"],
    ["/competencias", "competencias", "Competencias y RAP"],
    ["/ambientes", "ambientes", "Ambientes y lectores"],
  ],
  aprendiz: [
    ["/mi-asistencia", "asistencia", "Ver mi historial completo"],
    ["/horarios", "horarios", "Ver mi horario de la semana"],
    ["/perfil", "perfil", "Actualizar mis datos"],
    ["/soporte", "alerta", "Reportar un problema"],
  ],
};

function Metrica({ valor, nombre, color, a, atencion }) {
  const contenido = (<>
    <div className="valor" style={color ? { color } : undefined}>
      {atencion && <span className="pulso" style={{ background: "var(--ambar)" }} />}
      {valor ?? "—"}
    </div>
    <div className="nombre">{nombre}</div>
  </>);
  const clase = `tarjeta-metrica${a ? " enlace" : ""}${atencion ? " atencion" : ""}`;
  return a ? <Link to={a} className={clase}>{contenido}</Link> : <div className={clase}>{contenido}</div>;
}

function Accesos({ rol }) {
  return (
    <div className="tarjeta">
      <h3 style={{ fontSize: 16 }}>Accesos rápidos</h3>
      <div className="accesos">
        {(ACCESOS[rol] || []).map(([ruta, icono, texto]) => (
          <Link key={ruta} className="boton suave" to={ruta}><Icono nombre={icono} /> {texto}</Link>
        ))}
      </div>
    </div>
  );
}

// ---------- Instructor y coordinador ----------
function PanelSupervision({ rol, alError }) {
  const [datos, setDatos] = useState(null);
  const [pendientes, setPendientes] = useState(null);
  const [clases, setClases] = useState(null);

  useEffect(() => {
    api("/reportes/estadisticas").then(setDatos).catch((e) => alError(e.message));
    api("/sesiones/hoy").then(setClases).catch(() => setClases([]));
  }, []);

  // Contador de justificaciones pendientes, en tiempo real
  useEffect(() => {
    const cargarPendientes = () => api("/justificaciones/pendientes/contador").then((r) => setPendientes(r.pendientes)).catch(() => {});
    cargarPendientes();
    const socket = conectarTiempoReal();
    socket.on("justificaciones:actualizadas", cargarPendientes);
    return () => socket.disconnect();
  }, []);

  if (!datos) return <Cargando />;
  const promedio = Number(datos.promedio_asistencia);

  return (<>
    <div className="resumen-panel">
      <div className="tarjeta tarjeta-anillo">
        <AnilloAsistencia porcentaje={promedio} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Asistencia promedio</div>
          <p style={{ color: "var(--tinta-suave)", fontSize: 13, marginTop: 4 }}>
            {rol === "instructor" ? "De tus fichas" : "De todas las fichas"} · mínimo 80 %
          </p>
          <span className={`insignia ${promedio >= 80 ? "activa" : "ausente"}`} style={{ marginTop: 8 }}>
            {promedio >= 80 ? "Cumple el mínimo" : "Bajo el mínimo"}
          </span>
        </div>
      </div>
      <div className="metricas-2x2">
        <Metrica valor={datos.fichas_activas} nombre="Fichas activas" a="/fichas" />
        <Metrica valor={datos.aprendices_activos} nombre="Aprendices activos" />
        <Metrica valor={datos.sesiones_hoy} nombre="Sesiones iniciadas hoy" color={datos.sesiones_hoy > 0 ? "var(--azul)" : undefined} />
        <Metrica valor={pendientes} nombre="Justificaciones por revisar" a="/justificaciones" atencion={pendientes > 0} />
      </div>
    </div>

    <div className="dos-columnas">
      <div className="tarjeta">
        <div className="titulo-tarjeta">
          <h3>{rol === "instructor" ? "Tus clases de hoy" : "Clases de hoy"}</h3>
          {clases?.length > MAX_CLASES_EN_PANEL && <Link to="/sesiones" style={{ fontSize: 13.5 }}>Ver todas →</Link>}
        </div>
        {clases === null ? <Cargando /> : clases.length === 0 ? (
          <Vacio icono="sesiones" titulo="No hay clases programadas para hoy" />
        ) : (
          <ul className="lista-clases">
            {clases.slice(0, MAX_CLASES_EN_PANEL).map((h) => (
              <li key={h.id_horario}>
                <div>
                  <span className="hora-clase">{horaCorta(h.hora_inicio)} – {horaCorta(h.hora_fin)}</span>
                  <small>Ficha {h.numero_ficha} · Ambiente {h.numero_ambiente}</small>
                </div>
                <AccionSesion horario={h} alError={alError} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <Accesos rol={rol} />
    </div>
  </>);
}

// ---------- Programador (planeación académica) ----------
function PanelPlaneacion({ alError }) {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    Promise.all([api("/fichas"), api("/horarios"), api("/periodos"), api("/competencias")])
      .then(([fichas, horarios, periodos, competencias]) => setDatos({
        fichas: fichas.filter((f) => f.estado === "activa").length,
        horarios: horarios.length,
        periodos: periodos.length,
        competencias: competencias.length,
      }))
      .catch((e) => alError(e.message));
  }, []);

  if (!datos) return <Cargando />;
  return (<>
    <div className="metricas-4">
      <Metrica valor={datos.fichas} nombre="Fichas activas" a="/fichas" />
      <Metrica valor={datos.horarios} nombre="Horarios programados" a="/horarios" />
      <Metrica valor={datos.competencias} nombre="Competencias" a="/competencias" />
      <Metrica valor={datos.periodos} nombre="Periodos académicos" a="/configuracion" />
    </div>
    <Accesos rol="programador" />
  </>);
}

// ---------- Aprendiz ----------
function PanelAprendiz({ alError }) {
  const [historial, setHistorial] = useState(null);
  const [horarios, setHorarios] = useState(null);

  useEffect(() => {
    api("/reportes/mi-historial").then(setHistorial).catch((e) => alError(e.message));
    api("/horarios").then(setHorarios).catch(() => setHorarios([]));
  }, []);

  if (!historial) return <Cargando />;
  const r = historial.resumen;
  const siguiente = horarios ? proximaClase(horarios) : null;

  return (<>
    {r && r.porcentaje < r.minimo && (
      <div className="mensaje error alerta-banda" role="alert">
        <Icono nombre="alerta" size="1.2em" />
        <span>
          Tu asistencia ({r.porcentaje} %) está por debajo del mínimo ({r.minimo} %). Habla con tu instructor y
          justifica tus inasistencias a tiempo.
        </span>
      </div>
    )}

    {r ? (
      <div className="resumen-panel">
        <div className="tarjeta tarjeta-anillo">
          <AnilloAsistencia porcentaje={r.porcentaje} minimo={r.minimo} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Mi asistencia</div>
            <p style={{ color: "var(--tinta-suave)", fontSize: 13, margin: "4px 0 8px" }}>Mínimo institucional: {r.minimo} %</p>
            <Link to="/mi-asistencia" style={{ fontSize: 13.5, fontWeight: 600 }}>Ver historial →</Link>
          </div>
        </div>
        <div className="metricas-2x2">
          <Metrica valor={r.presentes} nombre="Presentes" color="var(--verde)" />
          <Metrica valor={r.tardanzas} nombre="Tardanzas" color="var(--ambar)" />
          <Metrica valor={r.justificadas} nombre="Justificadas" color="var(--azul)" />
          <Metrica valor={r.ausencias} nombre="Ausencias" color="var(--rojo)" />
        </div>
      </div>
    ) : (
      <div className="tarjeta" style={{ marginBottom: 14 }}>
        <Vacio icono="fichas" titulo="Todavía no estás matriculado en una ficha">
          Cuando la coordinación te matricule, aquí verás tu asistencia y tus clases.
        </Vacio>
      </div>
    )}

    <div className="dos-columnas">
      <div className="tarjeta">
        <div className="titulo-tarjeta">
          <h3>Próxima clase</h3>
          <Link to="/horarios" style={{ fontSize: 13.5 }}>Mi horario →</Link>
        </div>
        {horarios === null ? <Cargando /> : !siguiente ? (
          <Vacio icono="horarios" titulo="No tienes clases en los próximos días" />
        ) : (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <b style={{ fontSize: 18 }}>{mayusculaInicial(nombreDelDia(siguiente.fecha))}</b>
              {siguiente.enCurso && <span className="insignia activa"><span className="pulso" />En curso</span>}
            </div>
            <p className="hora-clase" style={{ color: "var(--violeta-700)", fontWeight: 700, margin: "4px 0 10px" }}>
              {horaCorta(siguiente.horario.hora_inicio)} – {horaCorta(siguiente.horario.hora_fin)}
            </p>
            <p style={{ color: "var(--tinta-suave)", fontSize: 14, lineHeight: 1.6 }}>
              Ambiente <b style={{ color: "var(--tinta)" }}>{siguiente.horario.numero_ambiente}</b>
              {siguiente.horario.sede_centro ? ` · ${siguiente.horario.sede_centro}` : ""}<br />
              Instructor: {siguiente.horario.instructor}<br />
              {siguiente.horario.tematica || siguiente.horario.competencia || "Tema por asignar"}
            </p>
          </div>
        )}
      </div>
      <Accesos rol="aprendiz" />
    </div>
  </>);
}

export default function Panel() {
  const { sesion } = useAuth();
  const rol = sesion.usuario.rol;
  const [mensaje, setMensaje] = useState(null);
  const alError = (texto) => setMensaje({ tipo: "error", texto });

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Hola, {sesion.usuario.nombres}</h1>
          <p>{mayusculaInicial(new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}</p>
        </div>
      </div>
      <Aviso mensaje={mensaje} alCerrar={() => setMensaje(null)} />

      {rol === "aprendiz" && <PanelAprendiz alError={alError} />}
      {rol === "programador" && <PanelPlaneacion alError={alError} />}
      {(rol === "instructor" || rol === "coordinador") && <PanelSupervision rol={rol} alError={alError} />}
    </>
  );
}
