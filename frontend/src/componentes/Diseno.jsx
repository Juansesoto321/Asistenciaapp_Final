import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../servicios/api";
import { conectarTiempoReal } from "../servicios/socket";
import { useAuth } from "../contexto/AuthContext.jsx";
import IconoHuella from "./IconoHuella.jsx";
import IconoSoporte from "./IconoSoporte.jsx";
import Icono from "./Iconos.jsx";

const SOPORTE = <IconoSoporte />;
const ico = (nombre) => <Icono nombre={nombre} />;

const MENUS = {
  coordinador: [
    ["/panel", ico("panel"), "Panel"],
    ["/usuarios", ico("usuarios"), "Usuarios"],
    ["/fichas", ico("fichas"), "Fichas"],
    ["/ambientes", ico("ambientes"), "Ambientes y lectores"],
    ["/horarios", ico("horarios"), "Horarios"],
    ["/competencias", ico("competencias"), "Competencias"],
    ["/sesiones", ico("sesiones"), "Sesiones de clase"],
    ["/justificaciones", ico("justificaciones"), "Justificaciones"],
    ["/reportes", ico("reportes"), "Reportes"],
    ["/configuracion", ico("configuracion"), "Configuración"],
    ["/notificaciones", ico("notificaciones"), "Notificaciones"],
    ["/soporte", SOPORTE, "Soporte"],
  ],
  instructor: [
    ["/panel", ico("panel"), "Panel"],
    ["/sesiones", ico("sesiones"), "Mis clases de hoy"],
    ["/fichas", ico("fichas"), "Mis fichas"],
    ["/horarios", ico("horarios"), "Mis horarios"],
    ["/competencias", ico("competencias"), "Competencias"],
    ["/justificaciones", ico("justificaciones"), "Justificaciones"],
    ["/reportes", ico("reportes"), "Reportes"],
    ["/notificaciones", ico("notificaciones"), "Notificaciones"],
    ["/soporte", SOPORTE, "Soporte"],
  ],
  // Mismas opciones del coordinador salvo "Usuarios": el programador apoya la
  // planeacion academica pero no administra cuentas.
  programador: [
    ["/panel", ico("panel"), "Panel"],
    ["/fichas", ico("fichas"), "Fichas"],
    ["/ambientes", ico("ambientes"), "Ambientes y lectores"],
    ["/horarios", ico("horarios"), "Horarios"],
    ["/competencias", ico("competencias"), "Competencias"],
    ["/sesiones", ico("sesiones"), "Sesiones de clase"],
    ["/justificaciones", ico("justificaciones"), "Justificaciones"],
    ["/reportes", ico("reportes"), "Reportes"],
    ["/configuracion", ico("configuracion"), "Configuración"],
    ["/notificaciones", ico("notificaciones"), "Notificaciones"],
    ["/perfil", ico("perfil"), "Mi perfil"],
    ["/soporte", SOPORTE, "Soporte"],
  ],
  aprendiz: [
    ["/panel", ico("panel"), "Panel"],
    ["/mi-asistencia", ico("asistencia"), "Mi asistencia"],
    ["/notificaciones", ico("notificaciones"), "Notificaciones"],
    ["/perfil", ico("perfil"), "Mi perfil"],
    ["/soporte", SOPORTE, "Soporte"],
  ],
};

export default function Diseno({ children }) {
  const { sesion, cerrarSesion } = useAuth();
  const navegar = useNavigate();
  const menu = MENUS[sesion.usuario.rol] || [];
  const [notifPendientes, setNotifPendientes] = useState(0);

  // Numerito de notificaciones sin leer, cualquier rol, actualizado en vivo.
  useEffect(() => {
    const cargar = () => api("/notificaciones/contador").then((r) => setNotifPendientes(r.pendientes)).catch(() => {});
    cargar();
    const socket = conectarTiempoReal();
    socket.on("notificaciones:actualizadas", cargar);
    return () => socket.disconnect();
  }, [sesion.usuario.id]);

  return (
    <div className="aplicacion">
      <aside className="barra-lateral">
        <div className="marca">
          <div className="icono"><IconoHuella size="1.3em" /></div>
          <div>
            AsistenciaApp
            <small>SENA · Control de asistencia</small>
          </div>
        </div>
        <nav>
          {menu.map(([ruta, icono, nombre]) => (
            <NavLink key={ruta} to={ruta} className={({ isActive }) => (isActive ? "activo" : "")}
                     style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span><span>{icono}</span> {nombre}</span>
              {ruta === "/notificaciones" && notifPendientes > 0 && (
                <span style={{
                  background: "var(--rojo)", color: "#fff", borderRadius: 999, minWidth: 18, height: 18,
                  fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
                }}>
                  {notifPendientes > 99 ? "99+" : notifPendientes}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="pie-usuario">
          <b>{sesion.usuario.nombres} {sesion.usuario.apellidos}</b>
          <span style={{ textTransform: "capitalize" }}>{sesion.usuario.rol}</span>
          <div>
            <button onClick={() => { cerrarSesion(); navegar("/"); }}>Cerrar sesión →</button>
          </div>
        </div>
      </aside>
      <main className="contenido">{children}</main>
    </div>
  );
}
