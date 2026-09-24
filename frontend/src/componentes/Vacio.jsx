import Icono from "./Iconos.jsx";

/**
 * Estado vacío con ícono: explica por qué no hay nada y, si aplica, qué hacer.
 * Uso: <Vacio icono="justificaciones" titulo="No hay justificaciones">Texto de ayuda</Vacio>
 */
export default function Vacio({ icono = "panel", titulo, children }) {
  return (
    <div className="vacio">
      <Icono nombre={icono} size="2.2em" className="vacio-icono" />
      {titulo && <p className="vacio-titulo">{titulo}</p>}
      {children && <p className="vacio-texto">{children}</p>}
    </div>
  );
}
