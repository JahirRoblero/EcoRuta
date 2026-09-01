import styles from "./ComponenteImagen.module.css";
import ParteCamionBasura from "../../../assets/img/oaxaca.png";
import oaxacaLimpia from "../../../assets/img/oaxaca limpia.png";
import oaxacaBarriendo from "../../../assets/img/oaxacaBarriendo.jpg";

import { useState } from "react";

function ComponenteImagen() {
  const [imagenActual, setImagenActual] = useState(0);

  const imagenes = [ParteCamionBasura, oaxacaLimpia, oaxacaBarriendo];

  return (
    <div className={styles.contenedorImagen}>
      <div
        className={styles.carrusel}
        style={{
          transform: `translateX(-${imagenActual * 100}%)`,
        }}
      >
        {imagenes.map((imagen, index) => (
          <img
            key={index}
            src={imagen}
            className={styles["imagen-camion"]}
            alt={`Imagen ${index + 1}`}
          />
        ))}
      </div>

      <div className={styles.bolitas}>
        {imagenes.map((_, index) => (
          <button
            key={index}
            className={
              imagenActual === index ? styles["bolita"] + " " + styles["bolita-activa"] : styles["bolita"]
            }
            onClick={() => setImagenActual(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default ComponenteImagen;
