import { useEffect, useMemo, useState } from "react";
import { api } from "../servicios/api";
import { useAuth } from "../contexto/AuthContext.jsx";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
// Orden de semana laboral (lunes a domingo), aunque dia_semana en BD sea 0=domingo
const ORDEN_SEMANA = [1, 2, 3, 4, 5, 6, 0];
const VACIO = {
  id_ficha: "", id_ambiente: "", id_instructor: "", id_periodo: "",
  dia_semana: "1", hora_inicio: "07:00", hora_fin: "13:00", id_rap: "", id_tematica: "",
};

// Paleta estable por ficha, para distinguir bloques de un vistazo
const COLORES = ["#6d4aff", "#0e9f6e", "#d97706", "#dc2626", "#0284c7", "#7c3aed", "#be185d"];
const colorDe = (idFicha) => COLORES[Number(idFicha) % COLORES.length];

const ALTO_HORA = 56; // px por hora en la grilla
const aMinutos = (hora) => {
  const [h, m] = String(hora).split(":");
  return Number(h) * 60 + Number(m);
};
const comoHora = (minutos) =>
  `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

export default function Horarios() {
  const { sesion } = useAuth();
  const rol = sesion.usuario.rol;
  const puedeEditar = ["coordinador", "programador"].includes(rol);
  const esInstructor = rol === "instructor";

  const [horarios, setHorarios] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [raps, setRaps] = useState([]);

  // El instructor ve lo suyo sin elegir nada; los demás deben filtrar primero.
  const [tipoFiltro, setTipoFiltro] = useState(esInstructor ? "instructor" : "");
  const [valorFiltro, setValorFiltro] = useState(esInstructor ? String(sesion.usuario.id) : "");
  const [aplicado, setAplicado] = useState(esInstructor);

  const [modal, setModal] = useState(null); // null | "nuevo" | horario a editar
  const [detalle, setDetalle] = useState(null);
  const [f, setF] = useState(VACIO);
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api("/competencias/raps").then(setRaps).catch(() => {});
    if (puedeEditar) {
      api("/fichas").then(setFichas);
      api("/ambientes").then(setAmbientes);
      api("/instructores").then(setInstructores);
      api("/periodos").then(setPeriodos);
    }
  }, []);

  useEffect(() => { if (esInstructor) cargar(); }, []);

  function cargar(tipo = tipoFiltro, valor = valorFiltro) {
    if (!esInstructor && (!tipo || !valor)) return;
    setCargando(true);
    const parametro = { instructor: "id_instructor", ficha: "id_ficha", ambiente: "id_ambiente" }[tipo];
    const consulta = esInstructor ? "" : `?${parametro}=${valor}`;
    api(`/horarios${consulta}`)
      .then((datos) => { setHorarios(datos); setAplicado(true); })
      .catch((e) => setMensaje({ tipo: "error", texto: e.message }))
      .finally(() => setCargando(false));
  }

  // Rango horario visible: se ajusta a lo que realmente hay programado
  const rango = useMemo(() => {
    if (!horarios.length) return { desde: 6 * 60, hasta: 22 * 60 };
    const desde = Math.min(...horarios.map((h) => aMinutos(h.hora_inicio)));
    const hasta = Math.max(...horarios.map((h) => aMinutos(h.hora_fin)));
    return { desde: Math.floor(desde / 60) * 60, hasta: Math.ceil(hasta / 60) * 60 };
  }, [horarios]);

  const horasEje = useMemo(() => {
    const filas = [];
    for (let m = rango.desde; m <= rango.hasta; m += 60) filas.push(m);
    return filas;
  }, [rango]);

  const tematicasDelRap = useMemo(
    () => raps.find((r) => String(r.id_rap) === String(f.id_rap))?.tematicas || [],
    [raps, f.id_rap]
  );

  function abrirNuevo() {
    setF(VACIO);
    setModal("nuevo");
  }

  function abrirEdicion(h) {
    setF({
      id_ficha: h.id_ficha, id_ambiente: h.id_ambiente, id_instructor: h.id_instructor,
      id_periodo: h.id_periodo, dia_semana: String(h.dia_semana),
      hora_inicio: h.hora_inicio.slice(0, 5), hora_fin: h.hora_fin.slice(0, 5),
      id_rap: h.id_rap || "", id_tematica: h.id_tematica || "",
    });
    setDetalle(null);
    setModal(h);
  }

  async function guardar() {
    if (!f.id_ficha || !f.id_ambiente || !f.id_instructor || !f.id_periodo || !f.hora_inicio || !f.hora_fin)
      return setMensaje({ tipo: "error", texto: "Completa todos los campos obligatorios" });
    const cuerpo = { ...f, id_rap: f.id_rap || null, id_tematica: f.id_tematica || null };
    try {
      if (modal === "nuevo") await api("/horarios", { method: "POST", body: cuerpo });
      else await api(`/horarios/${modal.id_horario}`, { method: "PUT", body: cuerpo });
      setMensaje({ tipo: "exito", texto: modal === "nuevo" ? "Horario creado sin conflictos" : "Horario actualizado" });
      setModal(null); setF(VACIO); cargar();
    } catch (e) { setMensaje({ tipo: "error", texto: e.message }); }
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este horario?")) return;
    try {
      await api(`/horarios/${id}`, { method: "DELETE" });
      setDetalle(null); cargar();
    } catch (e) { setMensaje({ tipo: "error", texto: e.message }); }
  }

  const opcionesFiltro = { instructor: instructores, ficha: fichas, ambiente: ambientes }[tipoFiltro] || [];

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <h1>{esInstructor ? "Mis horarios" : "Calendario de horarios"}</h1>
          <p>Vista semanal de las clases programadas. El sistema valida que no haya cruces de instructor ni de ambiente.</p>
        </div>
        {puedeEditar && <button className="boton" onClick={abrirNuevo}>+ Nuevo horario</button>}
      </div>
      {mensaje && <div className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}

      {!esInstructor && (
        <div className="tarjeta" style={{ marginBottom: 18 }}>
          <b>¿Qué horario quieres ver?</b>
          <p style={{ color: "var(--tinta-suave)", fontSize: 13.5, margin: "4px 0 10px" }}>
            Elige primero por quién o por dónde quieres consultar.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label>Buscar por</label>
              <select value={tipoFiltro} onChange={(e) => { setTipoFiltro(e.target.value); setValorFiltro(""); setAplicado(false); }}>
                <option value="">Selecciona…</option>
                <option value="instructor">Instructor</option>
                <option value="ficha">Ficha</option>
                <option value="ambiente">Ambiente</option>
              </select>
            </div>
            <div style={{ minWidth: 260 }}>
              <label>{tipoFiltro ? tipoFiltro.charAt(0).toUpperCase() + tipoFiltro.slice(1) : "Valor"}</label>
              <select value={valorFiltro} disabled={!tipoFiltro} onChange={(e) => { setValorFiltro(e.target.value); setAplicado(false); }}>
                <option value="">Selecciona…</option>
                {tipoFiltro === "instructor" && opcionesFiltro.map((i) => (
                  <option key={i.id_usuario} value={i.id_usuario}>{i.nombres} {i.apellidos}</option>
                ))}
                {tipoFiltro === "ficha" && opcionesFiltro.map((x) => (
                  <option key={x.id_ficha} value={x.id_ficha}>{x.numero_ficha} · {x.programa}</option>
                ))}
                {tipoFiltro === "ambiente" && opcionesFiltro.map((a) => (
                  <option key={a.id_ambiente} value={a.id_ambiente}>{a.numero_ambiente} · {a.sede_centro}</option>
                ))}
              </select>
            </div>
            <button className="boton" disabled={!tipoFiltro || !valorFiltro} onClick={() => cargar()}>Ver calendario</button>
          </div>
        </div>
      )}

      {cargando && <div className="vacio">Cargando calendario…</div>}

      {!cargando && !aplicado && (
        <div className="vacio">Selecciona un instructor, una ficha o un ambiente para ver su calendario.</div>
      )}

      {!cargando && aplicado && !horarios.length && (
        <div className="vacio">No hay clases programadas para esa selección.</div>
      )}

      {!cargando && aplicado && !!horarios.length && (
        <div className="tarjeta" style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: `60px repeat(${ORDEN_SEMANA.length}, minmax(150px, 1fr))`, minWidth: 900 }}>
            <div />
            {ORDEN_SEMANA.map((dia) => (
              <div key={dia} style={{ textAlign: "center", fontWeight: 700, padding: "6px 0", borderBottom: "1px solid var(--borde)" }}>
                {DIAS[dia]}
              </div>
            ))}

            {/* Eje de horas */}
            <div style={{ position: "relative", height: horasEje.length * ALTO_HORA }}>
              {horasEje.map((m, i) => (
                <div key={m} style={{ position: "absolute", top: i * ALTO_HORA - 7, right: 8, fontSize: 12, color: "var(--tinta-suave)" }}>
                  {comoHora(m)}
                </div>
              ))}
            </div>

            {/* Una columna por día */}
            {ORDEN_SEMANA.map((dia) => {
              const delDia = horarios.filter((h) => h.dia_semana === dia);
              return (
                <div key={dia} style={{ position: "relative", height: horasEje.length * ALTO_HORA, borderLeft: "1px solid var(--borde)" }}>
                  {horasEje.map((m, i) => (
                    <div key={m} style={{ position: "absolute", top: i * ALTO_HORA, left: 0, right: 0, borderTop: "1px solid var(--borde)", opacity: 0.5 }} />
                  ))}
                  {delDia.map((h) => {
                    const inicio = aMinutos(h.hora_inicio);
                    const fin = aMinutos(h.hora_fin);
                    const top = ((inicio - rango.desde) / 60) * ALTO_HORA;
                    const alto = Math.max(((fin - inicio) / 60) * ALTO_HORA, 34);
                    return (
                      <button
                        key={h.id_horario}
                        onClick={() => setDetalle(h)}
                        title="Ver detalle"
                        style={{
                          position: "absolute", top, left: 4, right: 4, height: alto - 3,
                          background: colorDe(h.id_ficha), color: "#fff", border: 0,
                          borderRadius: 8, padding: "5px 7px", textAlign: "left",
                          cursor: "pointer", overflow: "hidden", fontSize: 11.5, lineHeight: 1.25,
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>
                          {h.hora_inicio.slice(0, 5)}–{h.hora_fin.slice(0, 5)}
                        </div>
                        <div>Ficha {h.numero_ficha} · Amb. {h.numero_ambiente}</div>
                        {h.tematica && <div style={{ opacity: 0.95 }}>{h.tematica}</div>}
                        {!h.tematica && h.competencia && <div style={{ opacity: 0.95 }}>{h.competencia}</div>}
                        {!h.competencia && <div style={{ opacity: 0.8, fontStyle: "italic" }}>Sin competencia asignada</div>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {detalle && (
        <div className="superposicion" onClick={() => setDetalle(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{DIAS[detalle.dia_semana]} · {detalle.hora_inicio.slice(0, 5)} – {detalle.hora_fin.slice(0, 5)}</h2>
            <table className="tabla">
              <tbody>
                <tr><td><b>Ficha</b></td><td>{detalle.numero_ficha} · {detalle.programa}</td></tr>
                <tr><td><b>Instructor</b></td><td>{detalle.instructor}</td></tr>
                <tr><td><b>Ambiente</b></td><td>{detalle.numero_ambiente}{detalle.sede_centro ? ` · ${detalle.sede_centro}` : ""}</td></tr>
                <tr><td><b>Competencia</b></td><td>{detalle.competencia || "— sin asignar —"}</td></tr>
                <tr><td><b>Resultado de aprendizaje</b></td><td>{detalle.codigo_rap ? `${detalle.codigo_rap} · ${detalle.resultado_aprendizaje}` : "— sin asignar —"}</td></tr>
                <tr><td><b>Temática</b></td><td>{detalle.tematica || "— sin asignar —"}</td></tr>
              </tbody>
            </table>
            <div className="acciones-modal">
              <button className="boton suave" onClick={() => setDetalle(null)}>Cerrar</button>
              {puedeEditar && <button className="boton mini peligro" onClick={() => eliminar(detalle.id_horario)}>Eliminar</button>}
              {puedeEditar && <button className="boton" onClick={() => abrirEdicion(detalle)}>Editar</button>}
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="superposicion" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{modal === "nuevo" ? "Nuevo horario" : "Editar horario"}</h2>
            <div className="rejilla-2">
              <div>
                <label>Ficha *</label>
                <select required value={f.id_ficha} onChange={(e) => setF({ ...f, id_ficha: e.target.value })}>
                  <option value="">Selecciona…</option>
                  {fichas.map((x) => <option key={x.id_ficha} value={x.id_ficha}>{x.numero_ficha} · {x.programa}</option>)}
                </select>
              </div>
              <div>
                <label>Ambiente *</label>
                <select required value={f.id_ambiente} onChange={(e) => setF({ ...f, id_ambiente: e.target.value })}>
                  <option value="">Selecciona…</option>
                  {ambientes.map((a) => <option key={a.id_ambiente} value={a.id_ambiente}>{a.numero_ambiente} · {a.sede_centro}</option>)}
                </select>
              </div>
            </div>
            <div className="rejilla-2">
              <div>
                <label>Instructor *</label>
                <select required value={f.id_instructor} onChange={(e) => setF({ ...f, id_instructor: e.target.value })}>
                  <option value="">Selecciona…</option>
                  {instructores.map((i) => <option key={i.id_usuario} value={i.id_usuario}>{i.nombres} {i.apellidos}</option>)}
                </select>
              </div>
              <div>
                <label>Periodo *</label>
                <select required value={f.id_periodo} onChange={(e) => setF({ ...f, id_periodo: e.target.value })}>
                  <option value="">Selecciona…</option>
                  {periodos.map((p) => <option key={p.id_periodo} value={p.id_periodo}>{p.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="rejilla-2">
              <div>
                <label>Día de la semana *</label>
                <select required value={f.dia_semana} onChange={(e) => setF({ ...f, dia_semana: e.target.value })}>
                  {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="rejilla-2">
                <div><label>Inicio *</label><input required type="time" value={f.hora_inicio} onChange={(e) => setF({ ...f, hora_inicio: e.target.value })} /></div>
                <div><label>Fin *</label><input required type="time" value={f.hora_fin} onChange={(e) => setF({ ...f, hora_fin: e.target.value })} /></div>
              </div>
            </div>
            <div className="rejilla-2">
              <div>
                <label>Resultado de aprendizaje</label>
                <select value={f.id_rap} onChange={(e) => setF({ ...f, id_rap: e.target.value, id_tematica: "" })}>
                  <option value="">— sin asignar —</option>
                  {raps.map((r) => <option key={r.id_rap} value={r.id_rap}>{r.codigo} · {r.nombre}</option>)}
                </select>
              </div>
              <div>
                <label>Temática</label>
                <select value={f.id_tematica} disabled={!f.id_rap} onChange={(e) => setF({ ...f, id_tematica: e.target.value })}>
                  <option value="">— sin asignar —</option>
                  {tematicasDelRap.map((t) => <option key={t.id_tematica} value={t.id_tematica}>{t.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="acciones-modal">
              <button className="boton suave" onClick={() => setModal(null)}>Cancelar</button>
              <button className="boton" onClick={guardar}>{modal === "nuevo" ? "Guardar horario" : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
