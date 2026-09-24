import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
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
    ["/horarios", ico("horarios"), "Mi horario"],
    ["/notificaciones", ico("notificaciones"), "Notificaciones"],
    ["/perfil", ico("perfil"), "Mi perfil"],
    ["/soporte", SOPORTE, "Soporte"],
  ],
};

const iniciales = ({ nombres = "", apellidos = "" }) =>
  `${nombres.trim().charAt(0)}${apellidos.trim().charAt(0)}`.toUpperCase();

function Contador({ valor }) {
  if (!valor) return null;
  return <span className="contador-notif">{valor > 99 ? "99+" : valor}</span>;
}

export default function Diseno({ children }) {
  const { sesion, cerrarSesion } = useAuth();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const usuario = sesion.usuario;
  const menu = MENUS[usuario.rol] || [];
  const [notifPendientes, setNotifPendientes] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false); // solo aplica en pantallas angostas

  // Numerito de notificaciones sin leer, cualquier rol, actualizado en vivo.
  useEffect(() => {
    const cargar = () => api("/notificaciones/contador").then((r) => setNotifPendientes(r.pendientes)).catch(() => {});
    cargar();
    const socket = conectarTiempoReal();
    socket.on("notificaciones:actualizadas", cargar);
    return () => socket.disconnect();
  }, [usuario.id]);

  // En celular el menú se cierra al cambiar de página o con la tecla Escape
  useEffect(() => { setMenuAbierto(false); }, [pathname]);
  useEffect(() => {
    if (!menuAbierto) return undefined;
    const alTeclear = (e) => { if (e.key === "Escape") setMenuAbierto(false); };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [menuAbierto]);

  return (
    <div className="aplicacion">
      {/* Barra superior: solo se ve en celulares y tabletas (ver estilos.css) */}
      <header className="barra-superior">
        <button className="boton-menu" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú" aria-expanded={menuAbierto}>
          <Icono nombre="menu" size="1.4em" />
        </button>
        <Link to="/panel" className="marca-mini">
          <span className="icono"><IconoHuella size="1.1em" /></span>
          AsistenciaApp
        </Link>
        <Link to="/notificaciones" className="boton-menu campana" aria-label={`Notificaciones: ${notifPendientes} sin leer`}>
          <Icono nombre="notificaciones" size="1.3em" />
          <Contador valor={notifPendientes} />
        </Link>
      </header>

      <div className={`fondo-menu ${menuAbierto ? "visible" : ""}`} onClick={() => setMenuAbierto(false)} aria-hidden="true" />

      <aside className={`barra-lateral ${menuAbierto ? "abierta" : ""}`} aria-label="Menú principal">
        <div className="marca">
          <div className="icono"><IconoHuella size="1.3em" /></div>
          <div>
            AsistenciaApp
            <small>SENA · Control de asistencia</small>
          </div>
          <button className="boton-menu cerrar-menu" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú">
            <Icono nombre="cerrar" size="1.2em" />
          </button>
        </div>
        <nav>
          {menu.map(([ruta, icono, nombre]) => (
            <NavLink key={ruta} to={ruta} className={({ isActive }) => (isActive ? "activo" : "")}>
              <span className="enlace-menu">{icono} {nombre}</span>
              {ruta === "/notificaciones" && <Contador valor={notifPendientes} />}
            </NavLink>
          ))}
        </nav>
        <div className="pie-usuario">
          <div className="avatar" aria-hidden="true">{iniciales(usuario)}</div>
          <div className="datos-usuario">
            <b title={`${usuario.nombres} ${usuario.apellidos}`}>{usuario.nombres} {usuario.apellidos}</b>
            <span>{usuario.rol}</span>
          </div>
          <button className="boton-salir" onClick={() => { cerrarSesion(); navegar("/"); }} title="Cerrar sesión" aria-label="Cerrar sesión">
            <Icono nombre="salir" size="1.15em" />
          </button>
        </div>
      </aside>
      <main className="contenido">{children}</main>
    </div>
  );
}
