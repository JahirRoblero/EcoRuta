import styles from "./NoEncontrado.module.css";
import ecorruta404 from "../../src/assets/img/Ecorrutasa404.png";
export default function NoEncontrado() {
  return (
    <main className={styles["pagina-no-encontrada"]}>
      <img className={styles.imagen} src={ecorruta404}></img>
      <h1>404 - El lugar que buscas no existe</h1>
      <p>La página que buscas no existe en EcoRuta.</p>
    </main>
  );
}
