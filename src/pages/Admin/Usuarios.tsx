import { useCallback, useEffect, useState } from "react";
import TablaDatos from "../../components/Admin/TablaDatos";
import type { Columna } from "../../components/Admin/TablaDatos";
import ModalConfirmacion from "../../components/Admin/ModalConfirmacion";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerUsuarios,
  activarUsuario,
  desactivarUsuario,
  cambiarRolUsuario,
} from "../../services/adminUsuariosApi";
import styles from "./Usuarios.module.css";

type RolBD = "ADMINISTRADOR" | "CONDUCTOR" | "CIUDADANO";

interface Usuario {
  correo: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  rol: RolBD;
  activo: boolean;
  coloniaNombre: string | null;
  coloniaCodigoPostal: string | null;
  fechaRegistro: string;
}

interface CambioRol {
  usuario: Usuario;
  rolNuevo: RolBD;
}

const NOMBRE_ROL: Record<RolBD, string> = {
  ADMINISTRADOR: "Administrador",
  CONDUCTOR: "Operador",
  CIUDADANO: "Ciudadano",
};

const ROLES: RolBD[] = ["CIUDADANO", "CONDUCTOR", "ADMINISTRADOR"];

function correoDelToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const base = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const datos = JSON.parse(atob(base)) as { sub?: unknown };
    return typeof datos.sub === "string" ? datos.sub.toLowerCase() : null;
  } catch {
    return null;
  }
}

function mensajeDeError(error: unknown, mensaje409: string): string {
  const estado = (error as { status?: number } | null)?.status;
  if (estado === 400) return "El rol elegido no es válido.";
  if (estado === 403) return "No tienes permisos para administrar usuarios.";
  if (estado === 404) return "El usuario ya no existe.";
  if (estado === 409) return mensaje409;
  return "No se pudo conectar con el servidor. Intenta de nuevo.";
}

export default function Usuarios() {
  const { token } = useAuth();
  const miCorreo = correoDelToken(token);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtroRol, setFiltroRol] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usuarioADesactivar, setUsuarioADesactivar] = useState<Usuario | null>(null);
  const [cambioRol, setCambioRol] = useState<CambioRol | null>(null);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const rol = filtroRol === "TODOS" ? undefined : filtroRol;
      const datos = (await obtenerUsuarios(rol)) as Usuario[];
      setUsuarios(datos);
    } catch (e) {
      setUsuarios([]);
      setError(mensajeDeError(e, "No se pudo cargar la lista."));
    } finally {
      setCargando(false);
    }
  }, [filtroRol]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtroEstado === "ACTIVOS") return u.activo;
    if (filtroEstado === "INACTIVOS") return !u.activo;
    return true;
  });

  const esMiCuenta = (u: Usuario) => miCorreo !== null && u.correo.toLowerCase() === miCorreo;

  const marcarActivo = (correo: string, activo: boolean) => {
    setUsuarios((lista) =>
      lista.map((u) => (u.correo === correo ? { ...u, activo } : u)),
    );
  };

  const activar = async (usuario: Usuario) => {
    setProcesando(true);
    setError(null);
    try {
      await activarUsuario(usuario.correo);
      marcarActivo(usuario.correo, true);
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo activar la cuenta."));
    } finally {
      setProcesando(false);
    }
  };

  const confirmarDesactivacion = async () => {
    if (!usuarioADesactivar) return;
    const { correo } = usuarioADesactivar;
    setProcesando(true);
    setError(null);
    try {
      await desactivarUsuario(correo);
      marcarActivo(correo, false);
    } catch (e) {
      setError(mensajeDeError(e, "No puedes desactivar tu propia cuenta."));
    } finally {
      setProcesando(false);
      setUsuarioADesactivar(null);
    }
  };

  const confirmarCambioRol = async () => {
    if (!cambioRol) return;
    const { usuario, rolNuevo } = cambioRol;
    setProcesando(true);
    setError(null);
    try {
      await cambiarRolUsuario(usuario.correo, rolNuevo);
      setUsuarios((lista) =>
        filtroRol !== "TODOS" && filtroRol !== rolNuevo
          ? lista.filter((u) => u.correo !== usuario.correo)
          : lista.map((u) => (u.correo === usuario.correo ? { ...u, rol: rolNuevo } : u)),
      );
    } catch (e) {
      setError(mensajeDeError(e, "No puedes cambiar tu propio rol."));
    } finally {
      setProcesando(false);
      setCambioRol(null);
    }
  };

  const columnas: Columna<Usuario>[] = [
    {
      clave: "nombre",
      titulo: "Nombre",
      ordenable: true,
      valor: (u) => `${u.nombre} ${u.apellidoPaterno}`,
    },
    { clave: "correo", titulo: "Correo", ordenable: true },
    {
      clave: "rol",
      titulo: "Rol",
      ordenable: true,
      valor: (u) => NOMBRE_ROL[u.rol] ?? u.rol,
      render: (u) =>
        esMiCuenta(u) ? (
          <span>{NOMBRE_ROL[u.rol] ?? u.rol} (tú)</span>
        ) : (
          <select
            className={styles.selectorRol}
            value={u.rol}
            disabled={procesando}
            aria-label={`Rol de ${u.nombre}`}
            onChange={(evento) =>
              setCambioRol({ usuario: u, rolNuevo: evento.target.value as RolBD })
            }
          >
            {ROLES.map((rol) => (
              <option key={rol} value={rol}>
                {NOMBRE_ROL[rol]}
              </option>
            ))}
          </select>
        ),
    },
    { clave: "coloniaNombre", titulo: "Colonia", ordenable: true },
    {
      clave: "activo",
      titulo: "Estado",
      ordenable: true,
      valor: (u) => (u.activo ? "Activo" : "Inactivo"),
      render: (u) => (
        <span className={u.activo ? styles.etiquetaActivo : styles.etiquetaInactivo}>
          {u.activo ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <header className={styles.encabezado}>
        <h1>Usuarios</h1>
        <p>Consulta y administra las cuentas registradas</p>
      </header>

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <button className={styles.botonDesactivar} onClick={cargarUsuarios}>
            Reintentar
          </button>
        </div>
      )}

      <TablaDatos
        datos={usuariosFiltrados}
        columnas={columnas}
        obtenerClave={(u) => u.correo}
        cargando={cargando}
        placeholderBusqueda="Buscar por nombre, correo o colonia..."
        mensajeVacio="No hay usuarios con estos filtros"
        filtros={
          <>
            <select
              className={styles.selector}
              value={filtroRol}
              onChange={(evento) => setFiltroRol(evento.target.value)}
            >
              <option value="TODOS">Todos los roles</option>
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="CONDUCTOR">Operador</option>
              <option value="CIUDADANO">Ciudadano</option>
            </select>
            <select
              className={styles.selector}
              value={filtroEstado}
              onChange={(evento) => setFiltroEstado(evento.target.value)}
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVOS">Activos</option>
              <option value="INACTIVOS">Inactivos</option>
            </select>
          </>
        }
        acciones={(u) =>
          u.activo ? (
            <button
              className={styles.botonDesactivar}
              disabled={procesando}
              onClick={() => setUsuarioADesactivar(u)}
            >
              Desactivar
            </button>
          ) : (
            <button
              className={styles.botonActivar}
              disabled={procesando}
              onClick={() => activar(u)}
            >
              Activar
            </button>
          )
        }
      />

      <ModalConfirmacion
        abierto={usuarioADesactivar !== null}
        titulo="Desactivar usuario"
        mensaje={`${usuarioADesactivar?.nombre ?? ""} ya no podrá iniciar sesión. ¿Deseas continuar?`}
        textoConfirmar="Desactivar"
        onConfirmar={confirmarDesactivacion}
        onCancelar={() => setUsuarioADesactivar(null)}
      />

      <ModalConfirmacion
        abierto={cambioRol !== null}
        titulo="Cambiar rol"
        mensaje={
          cambioRol
            ? `¿Cambiar el rol de ${cambioRol.usuario.nombre} de ${NOMBRE_ROL[cambioRol.usuario.rol]} a ${NOMBRE_ROL[cambioRol.rolNuevo]}?`
            : ""
        }
        textoConfirmar="Cambiar rol"
        onConfirmar={confirmarCambioRol}
        onCancelar={() => setCambioRol(null)}
      />
    </div>
  );
}