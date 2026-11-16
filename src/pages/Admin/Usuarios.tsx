import { useCallback, useEffect, useState } from "react";
import TablaDatos from "../../components/Admin/TablaDatos";
import type { Columna } from "../../components/Admin/TablaDatos";
import ModalConfirmacion from "../../components/Admin/ModalConfirmacion";
import {
  obtenerUsuarios,
  activarUsuario,
  desactivarUsuario,
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

const NOMBRE_ROL: Record<RolBD, string> = {
  ADMINISTRADOR: "Administrador",
  CONDUCTOR: "Operador",
  CIUDADANO: "Ciudadano",
};

function mensajeDeError(error: unknown): string {
  const estado = (error as { status?: number } | null)?.status;
  if (estado === 403) return "No tienes permisos para administrar usuarios.";
  if (estado === 404) return "El usuario ya no existe.";
  if (estado === 409) return "No puedes desactivar tu propia cuenta.";
  return "No se pudo conectar con el servidor. Intenta de nuevo.";
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtroRol, setFiltroRol] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usuarioADesactivar, setUsuarioADesactivar] = useState<Usuario | null>(null);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const rol = filtroRol === "TODOS" ? undefined : filtroRol;
      const datos = (await obtenerUsuarios(rol)) as Usuario[];
      setUsuarios(datos);
    } catch (e) {
      setUsuarios([]);
      setError(mensajeDeError(e));
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
      setError(mensajeDeError(e));
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
      setError(mensajeDeError(e));
    } finally {
      setProcesando(false);
      setUsuarioADesactivar(null);
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
    </div>
  );
}