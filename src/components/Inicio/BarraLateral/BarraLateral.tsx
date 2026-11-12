import { useNavigate } from "react-router";

import styles from "./BarraLeteral.module.css";
import cerrar from "../../../assets/img/cerrar.svg";

interface BarraLateralProps {
  estaAbierto: boolean;
  alCerrar: () => void;
}

function BarraLateral({ estaAbierto, alCerrar }: BarraLateralProps) {
  const navegar = useNavigate();

  const irA = (ruta: string) => {
    navegar(ruta);
    alCerrar();
  };

  return (
    <div
      className={
        estaAbierto
          ? styles["contenedor-barralateral"]
          : styles["contenedor-barralateral-cerrado"]
      }
    >
      <button className={styles.cerrar} onClick={() => alCerrar()}>
        <img className={styles.imagenCerrar} src={cerrar}></img>
      </button>

      <div className={styles.opciones}>
        <button onClick={() => irA("/")}>Inicio</button>

        <button onClick={() => irA("/rutas")}>Rutas</button>

        <button onClick={() => irA("/puntos-basura")}>Puntos de basura</button>

        <button onClick={() => irA("/reportes")}>Reportes</button>

        <button onClick={() => irA("/mi-perfil")}>Mi perfil</button>
      </div>
    </div>
  );
}

export default BarraLateral;
