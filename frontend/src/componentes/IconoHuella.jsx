/**
 * Icono de huella dactilar en SVG (no emoji): el emoji de huella (🫆) es de
 * 2023 y Windows 10 nunca recibio la fuente que lo dibuja, se ve como un
 * cuadro vacio. Este SVG se ve igual en cualquier sistema operativo.
 *
 * Se dibuja como una huella real: crestas ovaladas concéntricas con cortes.
 * pathLength="100" hace que el patrón de cada cresta se exprese en % de su
 * contorno, así los cortes caen en el mismo lugar sin importar el tamaño.
 */
const CRESTAS = [
  // [radio horizontal, radio vertical, patrón de trazo, desfase]
  [2.1, 2.8, "72 28", 38],
  [4.2, 5.4, "60 8 32", 10],
  [6.3, 7.9, "48 7 35 10", 28],
  [8.4, 10.1, "40 8 38 14", 18],
];

export default function IconoHuella({ size = "1em", style, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
      style={{ width: size, height: size, display: "inline-block", verticalAlign: "-0.15em", flexShrink: 0, ...style }}
      {...props}
    >
      {CRESTAS.map(([rx, ry, patron, desfase]) => (
        <ellipse key={rx} cx="12" cy="12.5" rx={rx} ry={ry} pathLength="100"
                 strokeDasharray={patron} strokeDashoffset={desfase} />
      ))}
    </svg>
  );
}
