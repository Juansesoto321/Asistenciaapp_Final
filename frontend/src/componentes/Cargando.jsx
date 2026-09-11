/**
 * Indicador de carga. Evita mostrar "no hay datos" mientras la consulta todavía
 * está en curso, algo que en una red lenta confunde al usuario.
 */
export default function Cargando({ texto = "Cargando…" }) {
  return (
    <div className="vacio cargando" role="status">
      <span className="giro" aria-hidden="true" />
      {texto}
    </div>
  );
}
