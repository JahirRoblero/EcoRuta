import { useNavigate } from "react-router";

import styles from "./BarraLeteral.module.css";
import cerrar from "../../../assets/img/cerrar.svg";

function BarraLateral({ estaAbierto, alCerrar }) {
  const navegar = useNavigate();

  const irA = (ruta) => {
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

        <button onClick={() => irA("/quejas-sugerencias")}>
          Quejas y sugerencias
        </button>

        <button onClick={() => irA("/bandejas")}>Bandejas</button>
      </div>
    </div>
  );
}

export default BarraLateral;
