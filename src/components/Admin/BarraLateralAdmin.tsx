import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import logoOaxaca from "../../assets/img/logoOaxacaOficial.png";
import styles from "./BarraLateralAdmin.module.css";

const OPCIONES = [
  { ruta: "/admin", etiqueta: "Dashboard", exacto: true },
  { ruta: "/admin/usuarios", etiqueta: "Usuarios" },
  { ruta: "/admin/operadores", etiqueta: "Operadores" },
  { ruta: "/admin/rutas", etiqueta: "Rutas" },
  { ruta: "/admin/reportes", etiqueta: "Reportes" },
];

export default function BarraLateralAdmin() {
  const { cerrarSesion } = useAuth();
  const navegar = useNavigate();

  const salir = () => {
    cerrarSesion();
    navegar("/login", { replace: true });
  };

  return (
    <aside className={styles.barra}>
      <div className={styles.encabezado}>
        <img src={logoOaxaca} alt="Logo Oaxaca" className={styles.logo} />
        <div>
          <h2>Ecorruta</h2>
          <p>Panel de administrador</p>
        </div>
      </div>

      <nav className={styles.menu}>
        {OPCIONES.map((opcion) => (
          <NavLink
            key={opcion.ruta}
            to={opcion.ruta}
            end={opcion.exacto}
            className={({ isActive }) =>
              `${styles.opcion} ${isActive ? styles.activo : ""}`
            }
          >
            {opcion.etiqueta}
          </NavLink>
        ))}
      </nav>

      <button type="button" className={styles.salir} onClick={salir}>
        Cerrar sesión
      </button>
    </aside>
  );
}