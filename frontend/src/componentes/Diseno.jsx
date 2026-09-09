import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { api } from "../servicios/api";
import { useAuth } from "../contexto/AuthContext.jsx";
import IconoHuella from "./IconoHuella.jsx";
import IconoSoporte from "./IconoSoporte.jsx";

const SOPORTE = <IconoSoporte />;

const MENUS = {
  coordinador: [
    ["/panel", "📊", "Panel"],
    ["/usuarios", "👥", "Usuarios"],
    ["/fichas", "📚", "Fichas"],
    ["/ambientes", "🏫", "Ambientes y lectores"],
    ["/horarios", "🗓️", "Horarios"],
    ["/sesiones", "🕒", "Sesiones de clase"],
    ["/justificaciones", "📄", "Justificaciones"],
    ["/reportes", "🔎", "Reportes"],
    ["/configuracion", "⚙️", "Configuración"],
    ["/notificaciones", "🔔", "Notificaciones"],
    ["/soporte", SOPORTE, "Soporte"],
  ],
  instructor: [
    ["/panel", "📊", "Panel"],
    ["/sesiones", "🕒", "Mis clases de hoy"],
    ["/fichas", "📚", "Mis fichas"],
    ["/horarios", "🗓️", "Mis horarios"],
    ["/justificaciones", "📄", "Justificaciones"],
    ["/reportes", "🔎", "Reportes"],
    ["/notificaciones", "🔔", "Notificaciones"],
    ["/soporte", SOPORTE, "Soporte"],
  ],
  // Mismas opciones del coordinador salvo "Usuarios": el programador apoya la
  // planeacion academica pero no administra cuentas.
  programador: [
    ["/panel", "📊", "Panel"],
    ["/fichas", "📚", "Fichas"],
    ["/ambientes", "🏫", "Ambientes y lectores"],
    ["/horarios", "🗓️", "Horarios"],
    ["/sesiones", "🕒", "Sesiones de clase"],
    ["/justificaciones", "📄", "Justificaciones"],
    ["/reportes", "🔎", "Reportes"],
    ["/configuracion", "⚙️", "Configuración"],
    ["/notificaciones", "🔔", "Notificaciones"],
    ["/perfil", "👤", "Mi perfil"],
    ["/soporte", SOPORTE, "Soporte"],
  ],
  aprendiz: [
    ["/panel", "📊", "Panel"],
    ["/mi-asistencia", "🗒️", "Mi asistencia"],
    ["/notificaciones", "🔔", "Notificaciones"],
    ["/perfil", "👤", "Mi perfil"],
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
    const socket = io();
    socket.emit("unirse_panel", { rol: sesion.usuario.rol, id: sesion.usuario.id });
    socket.on("notificaciones:actualizadas", cargar);
    return () => socket.disconnect();
  }, [sesion.usuario.id, sesion.usuario.rol]);

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
