import { useEffect } from "react";
import Icono from "./Iconos.jsx";

/**
 * Aviso flotante (esquina inferior) para el resultado de una acción.
 * Reemplaza al mensaje fijo en la parte de arriba de la página, que se quedaba
 * pegado para siempre y quedaba tapado cuando había un formulario abierto.
 * Los de éxito se cierran solos; los de error esperan a que el usuario los lea.
 *
 * Uso: <Aviso mensaje={mensaje} alCerrar={() => setMensaje(null)} />
 * donde `mensaje` es { tipo: "exito" | "error", texto }.
 */
const DURACION_EXITO_MS = 4500;

export default function Aviso({ mensaje, alCerrar }) {
  useEffect(() => {
    if (mensaje?.tipo !== "exito") return undefined;
    const temporizador = setTimeout(alCerrar, DURACION_EXITO_MS);
    return () => clearTimeout(temporizador);
  }, [mensaje]); // solo se reinicia con un mensaje nuevo, no con cada render de la página

  if (!mensaje) return null;
  const esError = mensaje.tipo === "error";
  return (
    <div className={`aviso-flotante ${esError ? "error" : "exito"}`} role={esError ? "alert" : "status"}>
      <Icono nombre={esError ? "alerta" : "verificado"} size="1.2em" />
      <span>{mensaje.texto}</span>
      <button type="button" onClick={alCerrar} aria-label="Cerrar aviso">
        <Icono nombre="cerrar" size="1em" />
      </button>
    </div>
  );
}
