import { createContext, useCallback, useContext, useRef, useState } from "react";

/**
 * Diálogos de confirmación con el estilo de la aplicación. Reemplazan a
 * confirm() y prompt() del navegador, que bloquean la página, no se pueden
 * estilizar y se ven distintos en cada sistema operativo.
 */
const ContextoConfirmar = createContext(null);

export function ConfirmarProvider({ children }) {
  const [dialogo, setDialogo] = useState(null);
  const [texto, setTexto] = useState("");
  const resolver = useRef(null);

  const abrir = useCallback(
    (opciones) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setTexto(opciones.valorInicial || "");
        setDialogo(opciones);
      }),
    []
  );

  function cerrar(valor) {
    resolver.current?.(valor);
    resolver.current = null;
    setDialogo(null);
  }

  const pideTexto = dialogo?.tipo === "texto";
  const aceptar = () => cerrar(pideTexto ? texto.trim() || null : true);
  const cancelar = () => cerrar(pideTexto ? null : false);

  return (
    <ContextoConfirmar.Provider value={abrir}>
      {children}
      {dialogo && (
        <div className="superposicion" onClick={cancelar}>
          <div
            className="modal modal-confirmar"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === "Escape" && cancelar()}
          >
            <h2>{dialogo.titulo}</h2>
            {dialogo.mensaje && <p className="texto-confirmar">{dialogo.mensaje}</p>}
            {pideTexto && (
              <input
                autoFocus
                value={texto}
                placeholder={dialogo.placeholder}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && texto.trim() && aceptar()}
                style={{ marginTop: 12 }}
              />
            )}
            <div className="acciones-modal">
              {/* En acciones destructivas el foco inicial queda en Cancelar */}
              <button className="boton suave" onClick={cancelar} autoFocus={!pideTexto}>
                {dialogo.textoCancelar || "Cancelar"}
              </button>
              <button
                className={`boton ${dialogo.peligro ? "peligro-solido" : ""}`}
                onClick={aceptar}
                disabled={pideTexto && !texto.trim()}
              >
                {dialogo.textoConfirmar || "Aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ContextoConfirmar.Provider>
  );
}

/**
 * confirmar({ titulo, mensaje, textoConfirmar, peligro })        -> Promise<boolean>
 * pedirTexto({ titulo, mensaje, placeholder, textoConfirmar })    -> Promise<string | null>
 */
export function useConfirmar() {
  const abrir = useContext(ContextoConfirmar);
  return {
    confirmar: (opciones) => abrir({ ...opciones, tipo: "confirmar" }),
    pedirTexto: (opciones) => abrir({ ...opciones, tipo: "texto" }),
  };
}
