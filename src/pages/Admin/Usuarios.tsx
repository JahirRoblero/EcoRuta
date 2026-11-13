import { useState } from "react";
import TablaDatos from "../../components/Admin/TablaDatos";
import type { Columna } from "../../components/Admin/TablaDatos";
import ModalConfirmacion from "../../components/Admin/ModalConfirmacion";
import styles from "./Usuarios.module.css";

interface Usuario {
  correo: string;
  nombre: string;
  apellido_paterno: string;
  rol_nombre: "ADMINISTRADOR" | "OPERADOR" | "CIUDADANO";
  colonia_nombre: string | null;
  activo: boolean;
}

const USUARIOS_PRUEBA: Usuario[] = [
  { correo: "maria.lopez@correo.com", nombre: "María", apellido_paterno: "López", rol_nombre: "CIUDADANO", colonia_nombre: "Reforma", activo: true },
  { correo: "juan.perez@correo.com", nombre: "Juan", apellido_paterno: "Pérez", rol_nombre: "OPERADOR", colonia_nombre: "Centro", activo: true },
  { correo: "ana.ruiz@correo.com", nombre: "Ana", apellido_paterno: "Ruiz", rol_nombre: "CIUDADANO", colonia_nombre: "San Felipe del Agua", activo: false },
  { correo: "admin@ecoruta.mx", nombre: "Carlos", apellido_paterno: "Méndez", rol_nombre: "ADMINISTRADOR", colonia_nombre: null, activo: true },
];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS_PRUEBA);
  const [filtroRol, setFiltroRol] = useState("TODOS");
  const [usuarioADesactivar, setUsuarioADesactivar] = useState<Usuario | null>(null);

  const usuariosFiltrados =
    filtroRol === "TODOS" ? usuarios : usuarios.filter((u) => u.rol_nombre === filtroRol);

  const columnas: Columna<Usuario>[] = [
    {
      clave: "nombre",
      titulo: "Nombre",
      ordenable: true,
      valor: (u) => `${u.nombre} ${u.apellido_paterno}`,
    },
    { clave: "correo", titulo: "Correo", ordenable: true },
    { clave: "rol_nombre", titulo: "Rol", ordenable: true },
    { clave: "colonia_nombre", titulo: "Colonia", ordenable: true },
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

  const confirmarDesactivacion = () => {
    if (!usuarioADesactivar) return;
    setUsuarios((lista) =>
      lista.map((u) =>
        u.correo === usuarioADesactivar.correo ? { ...u, activo: false } : u,
      ),
    );
    setUsuarioADesactivar(null);
  };

  return (
    <div>
      <header className={styles.encabezado}>
        <h1>Usuarios</h1>
        <p>Consulta y administra las cuentas registradas</p>
      </header>

      <TablaDatos
        datos={usuariosFiltrados}
        columnas={columnas}
        obtenerClave={(u) => u.correo}
        placeholderBusqueda="Buscar por nombre, correo o colonia..."
        filtros={
          <select
            className={styles.selector}
            value={filtroRol}
            onChange={(evento) => setFiltroRol(evento.target.value)}
          >
            <option value="TODOS">Todos los roles</option>
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="OPERADOR">Operador</option>
            <option value="CIUDADANO">Ciudadano</option>
          </select>
        }
        acciones={(u) =>
          u.activo ? (
            <button className={styles.botonDesactivar} onClick={() => setUsuarioADesactivar(u)}>
              Desactivar
            </button>
          ) : (
            <span className={styles.sinAccion}>—</span>
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