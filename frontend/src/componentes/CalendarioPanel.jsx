import { useMemo } from "react";

const NOMBRES_DIA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Clave "YYYY-MM-DD" en horario local, para no desfasar el día por husos horarios.
export function claveFecha(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

//cambiio de horario

/**
 * Calendario mensual interactivo.
 *
 * @param mes          Date del mes visible (cualquier día de ese mes).
 * @param onCambiarMes (delta:number) => void — navega -1 / +1 mes.
 * @param datosPorDia  { "YYYY-MM-DD": { estado: "verde"|"ambar"|"rojo"|"neutro", etiqueta?: string } }
 * @param onDiaClick   (clave, info) => void — solo se llama si el día tiene datos.
 * @param leyenda      Nodo opcional con la leyenda de colores.
 * @param cargando     Muestra un estado de carga sutil sobre la grilla.
 */
export default function CalendarioPanel({ mes, onCambiarMes, datosPorDia, onDiaClick, leyenda, cargando }) {
  const celdas = useMemo(() => {
    const primero = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const inicioSemana = (primero.getDay() + 6) % 7; // lunes = 0
    const diasEnMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    const filas = [];
    for (let i = 0; i < inicioSemana; i++) filas.push(null);
    for (let d = 1; d <= diasEnMes; d++) filas.push(new Date(mes.getFullYear(), mes.getMonth(), d));
    return filas;
  }, [mes]);

  const hoy = claveFecha(new Date());

  return (
    <div className="tarjeta calendario-panel">
      <div className="calendario-cabecera">
        <button type="button" className="boton mini suave" onClick={() => onCambiarMes(-1)} aria-label="Mes anterior">‹</button>
        <h3>{NOMBRES_MES[mes.getMonth()]} {mes.getFullYear()}</h3>
        <button type="button" className="boton mini suave" onClick={() => onCambiarMes(1)} aria-label="Mes siguiente">›</button>
      </div>

      {leyenda && <div className="calendario-leyenda">{leyenda}</div>}

      <div className="calendario-grilla calendario-nombres">
        {NOMBRES_DIA.map((d) => <div key={d} className="calendario-nombre-dia">{d}</div>)}
      </div>

      <div className={`calendario-grilla ${cargando ? "calendario-cargando" : ""}`}>
        {celdas.map((fecha, i) => {
          if (!fecha) return <div key={`vacia-${i}`} className="calendario-celda vacia" />;
          const clave = claveFecha(fecha);
          const info = datosPorDia[clave];
          const esHoy = clave === hoy;
          return (
            <button
              type="button"
              key={clave}
              className={`calendario-celda ${info ? `estado-${info.estado}` : ""} ${esHoy ? "hoy" : ""}`}
              onClick={() => info && onDiaClick(clave, info)}
              disabled={!info}
              title={info?.etiqueta || ""}
            >
              <span className="numero-dia">{fecha.getDate()}</span>
              {info?.etiqueta && <span className="etiqueta-celda">{info.etiqueta}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
