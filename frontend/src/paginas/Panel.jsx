import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { api, obtenerSesion } from "../servicios/api";
import CalendarioPanel, { claveFecha } from "../componentes/CalendarioPanel";

const ETIQUETA_ESTADO = { presente: "P", tardanza: "T", ausente: "A", justificada: "J" };
const COLOR_ESTADO = { presente: "verde", justificada: "verde", tardanza: "ambar", ausente: "rojo" };

function primerYUltimoDia(mes) {
  const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const fin = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { fecha_inicio: iso(inicio), fecha_fin: iso(fin) };
}

export default function Panel() {
  const sesion = obtenerSesion();
  const rol = sesion.usuario.rol;
  const esAprendiz = rol === "aprendiz";

  const [datos, setDatos] = useState(null);       // /reportes/estadisticas (admin/instructor)
  const [historial, setHistorial] = useState(null); // /reportes/mi-historial (aprendiz)
  const [registrosMes, setRegistrosMes] = useState([]); // /reportes/busqueda del mes visible (admin/instructor)
  const [cargandoMes, setCargandoMes] = useState(false);
  const [mes, setMes] = useState(() => new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null); // { clave, info }
  const [pendientes, setPendientes] = useState(null); // justificaciones por revisar (instructor/admin)

  useEffect(() => {
    if (esAprendiz) api("/reportes/mi-historial").then(setHistorial).catch(() => {});
    else api("/reportes/estadisticas").then(setDatos).catch(() => {});
  }, []);

  // Contador de justificaciones pendientes, en tiempo real (instructor/administrador)
  useEffect(() => {
    if (esAprendiz) return;
    const cargarPendientes = () => api("/justificaciones/pendientes/contador").then((r) => setPendientes(r.pendientes)).catch(() => {});
    cargarPendientes();
    const socket = io();
    socket.emit("unirse_panel", { rol, id: sesion.usuario.id });
    socket.on("justificaciones:actualizadas", cargarPendientes);
    return () => socket.disconnect();
  }, [esAprendiz]);

  // Para instructor/administrador: trae los registros del mes visible cada vez que cambia.
  useEffect(() => {
    if (esAprendiz) return;
    const { fecha_inicio, fecha_fin } = primerYUltimoDia(mes);
    setCargandoMes(true);
    api(`/reportes/busqueda?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`)
      .then(setRegistrosMes)
      .catch(() => setRegistrosMes([]))
      .finally(() => setCargandoMes(false));
  }, [mes, esAprendiz]);

  // ---- Datos del calendario: aprendiz (a partir de su historial ya cargado) ----
  const datosPorDiaAprendiz = useMemo(() => {
    if (!historial?.detalle) return {};
    const mapa = {};
    for (const d of historial.detalle) {
      const clave = String(d.fecha).slice(0, 10);
      mapa[clave] = { estado: COLOR_ESTADO[d.estado] || "neutro", etiqueta: ETIQUETA_ESTADO[d.estado] || "", registro: d };
    }
    return mapa;
  }, [historial]);

  // ---- Datos del calendario: instructor/administrador (agregado del mes visible) ----
  const datosPorDiaEquipo = useMemo(() => {
    if (esAprendiz) return {};
    const porDia = {};
    for (const r of registrosMes) {
      const clave = String(r.fecha).slice(0, 10);
      if (!porDia[clave]) porDia[clave] = { total: 0, asistieron: 0, porFicha: {} };
      const dia = porDia[clave];
      dia.total += 1;
      if (["presente", "tardanza", "justificada"].includes(r.estado)) dia.asistieron += 1;
      if (!dia.porFicha[r.numero_ficha]) dia.porFicha[r.numero_ficha] = { presente: 0, tardanza: 0, ausente: 0, justificada: 0 };
      dia.porFicha[r.numero_ficha][r.estado] = (dia.porFicha[r.numero_ficha][r.estado] || 0) + 1;
    }
    const resultado = {};
    for (const [clave, dia] of Object.entries(porDia)) {
      const porcentaje = dia.total ? Math.round((dia.asistieron / dia.total) * 100) : 0;
      const estado = porcentaje >= 80 ? "verde" : porcentaje >= 60 ? "ambar" : "rojo";
      resultado[clave] = { estado, etiqueta: `${porcentaje}%`, porcentaje, porFicha: dia.porFicha };
    }
    return resultado;
  }, [registrosMes, esAprendiz]);

  const datosPorDia = esAprendiz ? datosPorDiaAprendiz : datosPorDiaEquipo;

  function cambiarMes(delta) {
    setMes((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>Hola, {sesion.usuario.nombres} 👋</h1>
          <p>{new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        {!esAprendiz && <Link to="/sesiones" className="boton">🕒 Ir a sesiones de hoy</Link>}
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

      {!esAprendiz && datos && (
        <p style={{ color: "var(--tinta-suave)", fontSize: 13.5, margin: "-8px 0 16px" }}>
          <b style={{ color: "var(--tinta)" }}>{datos.fichas_activas}</b> fichas activas ·{" "}
          <b style={{ color: "var(--tinta)" }}>{datos.aprendices_activos}</b> aprendices activos ·{" "}
          <b style={{ color: "var(--tinta)" }}>{datos.sesiones_hoy}</b> sesiones hoy ·{" "}
          <b style={{ color: pendientes > 0 ? "var(--ambar)" : "var(--tinta)" }}>{pendientes ?? 0}</b> justificaciones pendientes
        </p>
      )}

      {esAprendiz && historial?.resumen && (
        <>
          {historial.resumen.porcentaje < historial.resumen.minimo && (
            <div className="mensaje error">
              ⚠️ Tu asistencia ({historial.resumen.porcentaje}%) está por debajo del mínimo institucional ({historial.resumen.minimo}%).
            </div>
          )}
          <p style={{ color: "var(--tinta-suave)", fontSize: 13.5, margin: "-4px 0 16px" }}>
            Asistencia acumulada: <b style={{ color: "var(--tinta)" }}>{historial.resumen.porcentaje}%</b> ·{" "}
            {historial.resumen.presentes} presentes · {historial.resumen.tardanzas} tardanzas · {historial.resumen.ausencias} ausencias
          </p>
        </>
      )}

      <CalendarioPanel
        mes={mes}
        onCambiarMes={cambiarMes}
        datosPorDia={datosPorDia}
        cargando={!esAprendiz && cargandoMes}
        onDiaClick={(clave, info) => setDiaSeleccionado({ clave, info })}
        leyenda={
          esAprendiz ? (
            <>
              <span><i style={{ background: "var(--verde)" }} /> Presente / justificada</span>
              <span><i style={{ background: "var(--ambar)" }} /> Tardanza</span>
              <span><i style={{ background: "var(--rojo)" }} /> Ausente</span>
            </>
          ) : (
            <>
              <span><i style={{ background: "var(--verde)" }} /> Asistencia ≥ 80%</span>
              <span><i style={{ background: "var(--ambar)" }} /> Asistencia 60–79%</span>
              <span><i style={{ background: "var(--rojo)" }} /> Asistencia &lt; 60%</span>
            </>
          )
        }
      />

      <div className="tarjeta" style={{ marginTop: 18 }}>
        <h3>Accesos rápidos</h3>
        <p style={{ color: "var(--tinta-suave)", margin: "8px 0 14px" }}>Lo más usado según tu rol.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {rol === "administrador" && (<>
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
          {rol === "aprendiz" && (<>
            <Link className="boton suave" to="/mi-asistencia">🗒️ Ver mi historial completo</Link>
            <Link className="boton suave" to="/perfil">👤 Actualizar mis datos</Link>
          </>)}
        </div>
      </div>

      {diaSeleccionado && (
        <div className="superposicion" onClick={() => setDiaSeleccionado(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {new Date(diaSeleccionado.clave + "T00:00:00").toLocaleDateString("es-CO", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </h2>

            {esAprendiz ? (
              <div style={{ marginTop: 14 }}>
                <span className={`insignia ${diaSeleccionado.info.registro.estado}`}>{diaSeleccionado.info.registro.estado}</span>
                <p style={{ marginTop: 10, fontSize: 13.5, color: "var(--tinta-suave)" }}>
                  Hora de marca: {diaSeleccionado.info.registro.hora || "—"} · Método: {diaSeleccionado.info.registro.metodo}
                </p>
                {diaSeleccionado.info.registro.observacion && (
                  <div className="tarjeta" style={{ background: "var(--violeta-50)", marginTop: 10 }}>
                    {diaSeleccionado.info.registro.observacion}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: 13.5, color: "var(--tinta-suave)", marginBottom: 10 }}>
                  Asistencia del día: <b style={{ color: "var(--tinta)" }}>{diaSeleccionado.info.porcentaje}%</b>
                </p>
                {Object.entries(diaSeleccionado.info.porFicha).map(([ficha, conteo]) => (
                  <div key={ficha} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--borde)" }}>
                    <b>{ficha}</b>
                    <div style={{ display: "flex", gap: 6 }}>
                      {conteo.presente > 0 && <span className="insignia presente">{conteo.presente} P</span>}
                      {conteo.tardanza > 0 && <span className="insignia tardanza">{conteo.tardanza} T</span>}
                      {conteo.justificada > 0 && <span className="insignia justificada">{conteo.justificada} J</span>}
                      {conteo.ausente > 0 && <span className="insignia ausente">{conteo.ausente} A</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="acciones-modal">
              {!esAprendiz && <Link to="/reportes" className="boton suave">Ver en Reportes →</Link>}
              <button className="boton" onClick={() => setDiaSeleccionado(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
