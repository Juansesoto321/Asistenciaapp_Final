/**
 * Formato de textos compartido por las páginas.
 */

/** Plazo en horas como texto: "1 día", "3 días", "1 hora" o "18 horas". */
export function textoPlazo(horas) {
  if (horas % 24 === 0) {
    const dias = horas / 24;
    return `${dias} ${dias === 1 ? "día" : "días"}`;
  }
  return `${horas} ${horas === 1 ? "hora" : "horas"}`;
}

/** Solo la primera letra en mayúscula: "miércoles, 23 de septiembre" -> "Miércoles, 23 de septiembre". */
export const mayusculaInicial = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** "Hora" de un campo TIME de la base de datos sin los segundos: "07:00". */
export const horaCorta = (hora) => String(hora || "").slice(0, 5);
