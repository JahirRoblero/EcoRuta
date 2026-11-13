import styles from "./Dashboard.module.css";

const TARJETAS = [
  { etiqueta: "Usuarios activos", valor: "—" },
  { etiqueta: "Operadores", valor: "—" },
  { etiqueta: "Rutas registradas", valor: "—" },
  { etiqueta: "Reportes pendientes", valor: "—" },
];

export default function Dashboard() {
  return (
    <div>
      <header className={styles.encabezado}>
        <h1>Dashboard</h1>
        <p>Resumen general del sistema</p>
      </header>

      <section className={styles.tarjetas}>
        {TARJETAS.map((tarjeta) => (
          <article key={tarjeta.etiqueta} className={styles.tarjeta}>
            <span className={styles.etiqueta}>{tarjeta.etiqueta}</span>
            <span className={styles.valor}>{tarjeta.valor}</span>
          </article>
        ))}
      </section>

      <p className={styles.nota}>
        Los contadores se conectarán al backend en la siguiente fase.
      </p>
    </div>
  );
}