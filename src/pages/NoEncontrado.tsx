import styles from "./NoEncontrado.module.css";

export default function NoEncontrado() {
  return (
    <main className={styles["pagina-no-encontrada"]}>
      <h1>404 - El lugar que buscas no existe</h1>
      <p>La página que buscas no existe en EcoRuta.</p>
    </main>
  );
}
