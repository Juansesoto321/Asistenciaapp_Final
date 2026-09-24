/**
 * Anillo con el porcentaje de asistencia. Verde si cumple el mínimo, ámbar si
 * va justo (hasta 15 puntos por debajo) y rojo si está lejos del mínimo.
 */
export function colorAsistencia(porcentaje, minimo = 80) {
  if (porcentaje >= minimo) return "var(--verde)";
  if (porcentaje >= minimo - 15) return "var(--ambar)";
  return "var(--rojo)";
}

export default function AnilloAsistencia({ porcentaje, minimo = 80, tamano = 120 }) {
  const color = colorAsistencia(porcentaje, minimo);
  const grosor = Math.round(tamano / 11);
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const centro = tamano / 2;
  return (
    <div className="anillo-progreso" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} role="img" aria-label={`Asistencia ${porcentaje}%`}>
        <circle cx={centro} cy={centro} r={radio} fill="none" stroke="var(--borde)" strokeWidth={grosor} />
        <circle cx={centro} cy={centro} r={radio} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round"
                strokeDasharray={circunferencia} strokeDashoffset={circunferencia * (1 - porcentaje / 100)}
                transform={`rotate(-90 ${centro} ${centro})`} />
      </svg>
      <div className="centro" style={{ color, fontSize: Math.round(tamano / 5) }}>{porcentaje}%</div>
    </div>
  );
}
