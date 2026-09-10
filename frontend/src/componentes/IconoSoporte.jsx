/**
 * Icono de soporte (salvavidas) en SVG: el emoji 🛟 es de 2021 y tampoco
 * lo dibuja la fuente de emojis de Windows 10 (mismo problema que la huella).
 * Usa `currentColor` para verse igual que el resto de iconos del menú.
 */
export default function IconoSoporte({ size = "1.05em", style, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: size, height: size, display: "inline-block", verticalAlign: "-0.18em", flexShrink: 0, ...style }}
      {...props}
    >
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.6" />
      <line x1="12" y1="3.5" x2="12" y2="8.4" />
      <line x1="12" y1="15.6" x2="12" y2="20.5" />
      <line x1="3.5" y1="12" x2="8.4" y2="12" />
      <line x1="15.6" y1="12" x2="20.5" y2="12" />
    </svg>
  );
}
