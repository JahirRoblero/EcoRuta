import styles from "./Barra.module.css";
import imagenBarra from "../../../assets/img/menu.svg";
import logoEcorruta from "../../../assets/img/LogoEcorrutaBlanco.png";
import { obtenerDatosPrivados } from "../../../services/api";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router";

interface BarraProps {
  estaAbierto: boolean;
  alCerrar: () => void;
}

function Barra({ alCerrar }: BarraProps) {
  const [nombre, setNombre] = useState("");
  const [cargandoNombre, setCargandoNombre] = useState(true);
  const { cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const manejarCerrarSesion = () => {
    cerrarSesion();
    navigate("/login", { replace: true });
  };
  useEffect(() => {
    let activo = true;

    obtenerDatosPrivados()
      .then((datos) => {
        if (activo) {
          setNombre(datos.nombre);
        }
      })
      .catch((error) => {
        console.error("Error al obtener el nombre:", error);
      })
      .finally(() => {
        if (activo) {
          setCargandoNombre(false);
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  return (
    <nav className={styles.barraContenedor}>
      <div className={styles["contenedor-izquierdo"]}>
        <button
          className={styles.botonParaInicio}
          onClick={() => (window.location.href = "/")}
        >
          <img
            className={styles.logoOaxaca}
            src={logoEcorruta}
            alt="Ecorruta"
          />
        </button>

        <div className="titulo">
          <h1>Ecorruta</h1>
          <p>POR UNA COLONIA MÁS LIMPIA</p>
        </div>
      </div>

      <div className={styles.contenedorDerecho}>
        <div className={styles.datosUsuario}>
          <button
            className={styles.nombreUsuario}
            onClick={() => (window.location.href = "mi-perfil")}
          >
            {cargandoNombre ? "Cargando..." : `Hola, ${nombre || "Usuario"}`}
          </button>

          <button
            type="button"
            className={styles.cerrarSesion}
            onClick={manejarCerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>

        <button
          type="button"
          onClick={alCerrar}
          className={styles["boton-imagen"]}
        >
          <img src={imagenBarra} alt="Abrir menú" />
        </button>
      </div>
    </nav>
  );
}

export default Barra;
