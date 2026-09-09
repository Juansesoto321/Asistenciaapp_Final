import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";
import { api, obtenerSesion } from "../servicios/api";
import IconoHuella from "../componentes/IconoHuella.jsx";

export default function SesionEnVivo() {
  const { id } = useParams();
  const navegar = useNavigate();
  const rol = obtenerSesion().usuario.rol;

  const [sesion, setSesion] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const [modal, setModal] = useState(null);
  const [manual, setManual] = useState({
    estado: "presente",
    motivo: "",
  });
  const [mensaje, setMensaje] = useState(null);
  const [plazo, setPlazo] = useState(72);
  const [cerrando, setCerrando] = useState(false);

  const socketRef = useRef(null);

  const cargar = () => {
    api("/sesiones/" + id)
      .then((datos) => {
        setSesion(datos);
      })
      .catch((e) => {
        setMensaje({
          tipo: "error",
          texto: e.message,
        });
      });
  };

  useEffect(() => {
    cargar();

    api("/configuracion")
      .then((configuracion) => {
        if (
          configuracion &&
          configuracion.horas_justificacion
        ) {
          setPlazo(configuracion.horas_justificacion);
        }
      })
      .catch(() => {
        setPlazo(72);
      });

    const socket = io();

    socketRef.current = socket;

    socket.emit("unirse_sesion", id);

    socket.on("marcacion", (marcacion) => {
      setSesion((actual) => {
        if (!actual) {
          return actual;
        }

        return {
          ...actual,
          aprendices: actual.aprendices.map((aprendiz) => {
            if (
              aprendiz.id_usuario !==
              marcacion.id_aprendiz
            ) {
              return aprendiz;
            }

            return {
              ...aprendiz,
              estado: marcacion.estado,
              hora_marca: marcacion.hora_marca,
              metodo: marcacion.metodo,
            };
          }),
        };
      });
    });

    socket.on("huella_no_reconocida", () => {
      setAlerta(
        "Huella no reconocida en el lector. Si el aprendiz insiste, usa el registro manual."
      );

      setTimeout(() => {
        setAlerta(null);
      }, 8000);
    });

    return () => {
      socket.emit("salir_sesion", id);
      socket.disconnect();
    };
  }, [id]);

  async function guardarManual() {
    if (!modal) {
      return;
    }

    if (!manual.motivo.trim()) {
      setMensaje({
        tipo: "error",
        texto: "Debes ingresar una justificación.",
      });

      return;
    }

    try {
      const respuesta = await api(
        "/sesiones/" + id + "/asistencia-manual",
        {
          method: "POST",
          body: {
            id_aprendiz: modal.id_usuario,
            estado: manual.estado,
            motivo: manual.motivo,
          },
        }
      );

      setMensaje({
        tipo: "exito",
        texto: respuesta.mensaje,
      });

      setModal(null);

      setManual({
        estado: "presente",
        motivo: "",
      });

      cargar();
    } catch (e) {
      setMensaje({
        tipo: "error",
        texto: e.message,
      });
    }
  }

  async function cerrar() {
    if (cerrando) {
      return;
    }

    const horas = Number(plazo);

    const texto =
      horas % 24 === 0
        ? horas / 24 + " día(s)"
        : horas + " horas";

    const confirmar = window.confirm(
      "Al cerrar, los aprendices sin marca quedarán AUSENTES y recibirán el enlace de justificación (" +
        texto +
        "). ¿Cerrar la sesión?"
    );

    if (!confirmar) {
      return;
    }

    setCerrando(true);
    setMensaje(null);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 800)
      );

      const respuesta = await api(
        "/sesiones/" + id + "/cerrar",
        {
          method: "POST",
        }
      );

      setMensaje({
        tipo: "exito",
        texto: respuesta.mensaje,
      });

      await cargar();
    } catch (e) {
      setMensaje({
        tipo: "error",
        texto: e.message,
      });
    } finally {
      setCerrando(false);
    }
  }

  async function eliminar() {
    if (!confirm("Esto elimina PERMANENTEMENTE esta sesión, con toda su asistencia y justificaciones asociadas. No se puede deshacer. ¿Continuar?")) return;
    try {
      await api(`/sesiones/${id}`, { method: "DELETE" });
      navegar("/sesiones");
    } catch (e) { setMensaje({ tipo: "error", texto: e.message }); }
  }

  if (!sesion) {
    return (
      <div className="vacio">
        Cargando sesión…
      </div>
    );
  }

  const marcados = sesion.aprendices.filter(
    (aprendiz) => aprendiz.estado
  ).length;

  return (
    <>
      <div className="cabecera-pagina">
        <div>
          <Link
            to="/sesiones"
            style={{ fontSize: 13.5 }}
          >
            ← Sesiones de hoy
          </Link>

          <h1>
            {sesion.estado === "activa" && (
              <span className="pulso" />
            )}

            Ficha {sesion.numero_ficha} · Ambiente{" "}
            {sesion.numero_ambiente}
          </h1>

          <p>
            {sesion.programa} ·{" "}
            {new Date(sesion.fecha).toLocaleDateString(
              "es-CO"
            )}{" "}
            · {sesion.hora_inicio.slice(0, 5)}–
            {sesion.hora_fin.slice(0, 5)} ·{" "}
            <b>
              {marcados}/{sesion.aprendices.length}
            </b>{" "}
            registrados
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {sesion.estado === "activa" ? (
            <button
              className="boton peligro"
              onClick={cerrar}
              disabled={cerrando}
            >
              {cerrando
                ? "⏳ Cerrando sesión..."
                : "⏹ Cerrar sesión de clase"}
            </button>
          ) : (
            <span className="insignia cerrada">
              Sesión cerrada
            </span>
          )}
          {["coordinador", "programador"].includes(rol) &&
            <button className="boton mini suave" onClick={eliminar} title="Borra la sesión y su asistencia permanentemente">🗑 Eliminar sesión</button>}
        </div>
      </div>

      {alerta && (
        <div className="mensaje error">
          ⚠️ {alerta}
        </div>
      )}

      {mensaje && (
        <div className={"mensaje " + mensaje.tipo}>
          {mensaje.texto}
        </div>
      )}

      <table className="tabla">
        <thead>
          <tr>
            <th>Aprendiz</th>
            <th>Documento</th>
            <th>Huella</th>
            <th>Estado</th>
            <th>Hora</th>
            <th>Método</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {sesion.aprendices.map((aprendiz) => (
            <tr key={aprendiz.id_usuario}>
              <td>
                {aprendiz.nombres}{" "}
                {aprendiz.apellidos}
              </td>

              <td>{aprendiz.documento}</td>

              <td>
                {aprendiz.tiene_huella ? (
                  <IconoHuella title="Huella registrada" />
                ) : (
                  <span title="Sin huella registrada: usar manual">
                    ✋
                  </span>
                )}
              </td>

              <td>
                {aprendiz.estado ? (
                  <span
                    className={
                      "insignia " + aprendiz.estado
                    }
                  >
                    {aprendiz.estado}
                  </span>
                ) : (
                  <span
                    style={{
                      color: "var(--tinta-suave)",
                    }}
                  >
                    esperando…
                  </span>
                )}
              </td>

              <td>
                {aprendiz.hora_marca
                  ? new Date(
                      aprendiz.hora_marca
                    ).toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </td>

              <td>
                {aprendiz.metodo ? (
                  <span
                    className={
                      "insignia " + aprendiz.metodo
                    }
                  >
                    {aprendiz.metodo}
                  </span>
                ) : (
                  "—"
                )}
              </td>

              <td>
                <button
                  className="boton mini suave"
                  onClick={() => {
                    setModal(aprendiz);

                    setManual({
                      estado:
                        aprendiz.estado ||
                        "presente",
                      motivo: "",
                    });
                  }}
                  disabled={cerrando}
                >
                  ✍ Manual
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <div
          className="superposicion"
          onClick={() => setModal(null)}
        >
          <div
            className="modal"
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >
            <h2>
              Registro manual · {modal.nombres}{" "}
              {modal.apellidos}
            </h2>

            <p
              style={{
                color: "var(--tinta-suave)",
                fontSize: 13.5,
              }}
            >
              Para casos excepcionales: lesión, lector
              caído o huella no reconocida. Queda trazado
              en auditoría.
            </p>

            <label>Estado</label>

            <select
              value={manual.estado}
              onChange={(evento) =>
                setManual({
                  ...manual,
                  estado: evento.target.value,
                })
              }
            >
              <option value="presente">
                Presente
              </option>

              <option value="tardanza">
                Tardanza
              </option>

              <option value="ausente">
                Ausente
              </option>

              <option value="justificada">
                Justificada
              </option>
            </select>

            <label>
              Justificación del registro manual
              (obligatoria)
            </label>

            <textarea
              rows={3}
              value={manual.motivo}
              onChange={(evento) =>
                setManual({
                  ...manual,
                  motivo: evento.target.value,
                })
              }
              placeholder="Ej.: lesión en la mano derecha, el lector no reconoció la huella tras 3 intentos…"
            />

            <div className="acciones-modal">
              <button
                className="boton suave"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>

              <button
                className="boton"
                disabled={!manual.motivo.trim()}
                onClick={guardarManual}
              >
                Guardar registro
              </button>
            </div>
          </div>
        </div>
      )}

      {cerrando && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "35px 45px",
              textAlign: "center",
              minWidth: "300px",
              boxShadow:
                "0 10px 40px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              style={{
                width: "45px",
                height: "45px",
                border: "4px solid #ddd",
                borderTopColor: "#333",
                borderRadius: "50%",
                margin: "0 auto 20px",
                animation:
                  "girar 0.8s linear infinite",
              }}
            />

            <h2
              style={{
                margin: "0 0 10px",
              }}
            >
              Cerrando sesión
            </h2>

            <p
              style={{
                margin: 0,
                color: "#666",
              }}
            >
              Espere un momento, estamos procesando
              el cierre de la clase...
            </p>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes girar {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </>
  );
}