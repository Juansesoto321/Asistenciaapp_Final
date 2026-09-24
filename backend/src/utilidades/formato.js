/**
 * Utilidades de formato compartidas por los servicios (correos, reportes).
 */

const ENTIDADES_HTML = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/**
 * Escapa texto que escribe un usuario antes de meterlo en el HTML de un correo.
 * Sin esto, alguien que se registre con el nombre `<a href="...">` inyecta
 * enlaces en los correos que envía la plataforma.
 */
function escaparHtml(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ENTIDADES_HTML[c]);
}

/** Fecha de una clase en texto: "martes, 9 de septiembre". */
function fechaLarga(fecha) {
  return new Date(fecha).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
}

/** AAAA-MM-DD en la hora local (toISOString usaría UTC y podría cambiar el día). */
function fechaIso(fecha) {
  const d = new Date(fecha);
  const dosDigitos = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
}

/** Texto legible de un plazo en horas: "3 día(s)" o "18 horas". */
function textoPlazo(horas) {
  return horas % 24 === 0 ? `${horas / 24} día(s)` : `${horas} horas`;
}

/**
 * Celda de CSV para Excel (separador ";"). Encierra en comillas cuando hace
 * falta y neutraliza fórmulas: una observación que empiece por "=" o "+" se
 * ejecutaría como fórmula al abrir el archivo.
 */
function celdaCsv(valor) {
  let texto = String(valor ?? "");
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

module.exports = { escaparHtml, fechaLarga, fechaIso, textoPlazo, celdaCsv };
