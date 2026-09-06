import { useState } from "react";
import Barra from "../../components/Inicio/Barra/Barra";
import BarraLateral from "../../components/Inicio/BarraLateral/BarraLateral";
import styles from "./Quejas.module.css";
import Footer from "../../components/Inicio/Footer/Footer";



const datosIniciales = {
  tipo: "",
  categoria: "",
  asunto: "",
  descripcion: "",
  direccion: "",
  nombre: "",
  contacto: "",
};

function Quejas() {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [datos, setDatos] = useState(datosIniciales);
  const [enviado, setEnviado] = useState(false);

  const alCambiar = (e) => {
    const { name, value } = e.target;
    setDatos((anterior) => ({ ...anterior, [name]: value }));
  };

  const alEnviar = (e) => {
    e.preventDefault();
    console.log("Datos enviados:", datos);
    setEnviado(true);
    setDatos(datosIniciales);
    setTimeout(() => setEnviado(false), 5000);
  };

  const alLimpiar = () => {
    setDatos(datosIniciales);
  };

  return (
    <>
      <Barra estaAbierto={estaAbierto} alCerrar={() => setEstaAbierto(true)} />

      {estaAbierto && (
        <div
          className={styles["fondo-oscuro"]}
          onClick={() => setEstaAbierto(false)}
        ></div>
      )}

      <main className={styles.contenedor}>
        <h1 className={styles.titulo}>Quejas y Sugerencias</h1>
        <p className={styles.subtitulo}>
          Ayúdanos a mejorar el servicio de recolección de residuos. Comparte
          tu queja o sugerencia y con gusto le daremos seguimiento.
        </p>

        {enviado && (
          <div className={styles["mensaje-exito"]} role="status">
            ¡Gracias! Tu reporte fue enviado con éxito.
          </div>
        )}

        <form className={styles.formulario} onSubmit={alEnviar}>
          <div className={styles.campo}>
            <label className={styles.etiqueta}>
              Tipo <span className={styles.requerido}>*</span>
            </label>
            <div className={styles["grupo-radio"]}>
              <label className={styles["opcion-radio"]}>
                <input
                  type="radio"
                  name="tipo"
                  value="queja"
                  checked={datos.tipo === "queja"}
                  onChange={alCambiar}
                  required
                />
                Queja
              </label>
              <label className={styles["opcion-radio"]}>
                <input
                  type="radio"
                  name="tipo"
                  value="sugerencia"
                  checked={datos.tipo === "sugerencia"}
                  onChange={alCambiar}
                />
                Sugerencia
              </label>
            </div>
          </div>

          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="categoria">
              Categoría <span className={styles.requerido}>*</span>
            </label>
            <select
              id="categoria"
              name="categoria"
              className={styles.control}
              value={datos.categoria}
              onChange={alCambiar}
              required
            >
              <option value="">Selecciona una opción</option>
              <option value="recoleccion-no-realizada">Recolección no realizada</option>
              <option value="basura-acumulada">Basura acumulada</option>
              <option value="contenedor-danado">Contenedor dañado</option>
              <option value="sugerencia-ruta">Sugerencia de ruta</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="asunto">
              Asunto <span className={styles.requerido}>*</span>
            </label>
            <input
              type="text"
              id="asunto"
              name="asunto"
              className={styles.control}
              placeholder="Ej. Basura no recolectada en calle 5 de mayo"
              maxLength={100}
              value={datos.asunto}
              onChange={alCambiar}
              required
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="descripcion">
              Descripción <span className={styles.requerido}>*</span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              className={styles.control}
              rows={5}
              placeholder="Describe con detalle la situación..."
              maxLength={500}
              value={datos.descripcion}
              onChange={alCambiar}
              required
            ></textarea>
          </div>

          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="direccion">
              Colonia / Dirección <span className={styles.requerido}>*</span>
            </label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              className={styles.control}
              placeholder="Ej. Colonia Reforma, calle Juárez #123"
              value={datos.direccion}
              onChange={alCambiar}
              required
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="nombre">
              Nombre <span className={styles.opcional}>(opcional)</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              className={styles.control}
              placeholder="Tu nombre"
              value={datos.nombre}
              onChange={alCambiar}
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="contacto">
              Correo o teléfono{" "}
              <span className={styles.opcional}>(opcional, para seguimiento)</span>
            </label>
            <input
              type="text"
              id="contacto"
              name="contacto"
              className={styles.control}
              placeholder="correo@ejemplo.com o 951 000 0000"
              value={datos.contacto}
              onChange={alCambiar}
            />
          </div>

          <div className={styles.acciones}>
            <button
              type="button"
              onClick={alLimpiar}
              className={styles["boton-secundario"]}
            >
              Limpiar
            </button>
            <button type="submit" className={styles["boton-primario"]}>
              Enviar
            </button>
          </div>
        </form>
      </main>

      <Footer/>

      <BarraLateral
        estaAbierto={estaAbierto}
        alCerrar={() => setEstaAbierto(false)}
      />
    </>
  );
}

export default Quejas;