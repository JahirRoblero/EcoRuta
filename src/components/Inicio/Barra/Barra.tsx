import styles from "./Barra.module.css";
import logoOaxaca from "../../../assets/img/logoOaxacaOficial.png";
import imagenBarra from "../../../assets/img/menu.svg";

function Barra({ estaAbierto, alCerrar }) {
  return (
    <nav className={styles.barraContenedor}>
      <div className={styles["contenedor-izquierdo"]}>
        <img className={styles.logoOaxaca} src={logoOaxaca}></img>

        <div className="titulo">
          <h1>Ecorruta</h1>
          <p>GOBIERNO DEL ESTADO</p>
        </div>
      </div>

      <button onClick={() => alCerrar()} className={styles["boton-imagen"]}>
        <img className="imagenBarra" src={imagenBarra}></img>
      </button>
    </nav>
  );
}

export default Barra;
