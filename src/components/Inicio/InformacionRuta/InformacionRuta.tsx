import styles from "./InformacionRuta.module.css";

function InformacionRuta({ ruta }) {
  return (
    <div className={styles["contenedor-rutas"]}>
      <div className={styles.rutas}>
        <h1>RUTA</h1>
        <p>{ruta}</p>
      </div>

      <button className={styles["boton-cambiar-ruta"]}>Cambiar ruta</button>
    </div>
  );
}

export default InformacionRuta;
