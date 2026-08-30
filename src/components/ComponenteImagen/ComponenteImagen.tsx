import "./ComponenteImagen.css";
import ParteCamionBasura from "../../assets/img/oaxaca.png";
import oaxacaLimpia from "../../assets/img/oaxaca limpia.png";
import { useState } from "react";

function ComponenteImagen() {
  const [imagenActual, setImagenActual] = useState(0);

  const imagenes = [ParteCamionBasura, oaxacaLimpia];

  return (
    <div className="contenedorImagen">
      <div
        className="carrusel"
        style={{
          transform: `translateX(-${imagenActual * 100}%)`,
        }}
      >
        {imagenes.map((imagen, index) => (
          <img
            key={index}
            src={imagen}
            className="imagen-camion"
            alt={`Imagen ${index + 1}`}
          />
        ))}
      </div>

      <div className="bolitas">
        {imagenes.map((_, index) => (
          <button
            key={index}
            className={
              imagenActual === index ? "bolita bolita-activa" : "bolita"
            }
            onClick={() => setImagenActual(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default ComponenteImagen;
