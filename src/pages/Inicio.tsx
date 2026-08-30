import Barra from "../components/Barra/Barra";
import ComponenteImagen from "../components/ComponenteImagen/ComponenteImagen";
import BarraLateral from "../components/BarraLateral/BarraLateral";
import Mapa from "../components/Mapa/Mapa";
import InformacionRuta from "../components/InformacionRuta/InformacionRuta";
import "./Inicio.css";
import { useEffect, useState } from "react";

function Inicio() {
  const [estaAbierto, setEstaAbierto] = useState(false);

  const posiciones = [
    { latitud: 17.0732, longitud: -96.7266 },
    { latitud: 17.0735, longitud: -96.7269 },
    { latitud: 17.0738, longitud: -96.7272 },
    { latitud: 17.0741, longitud: -96.7276 },
    { latitud: 17.0745, longitud: -96.728 },
    { latitud: 17.0749, longitud: -96.7285 },
    { latitud: 17.0753, longitud: -96.729 },
  ];

  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndice((indiceAnterior) => {
        if (indiceAnterior >= posiciones.length - 1) {
          return indiceAnterior;
        }

        return indiceAnterior + 1;
      });
    }, 2000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <>
      <Barra estaAbierto={estaAbierto} alCerrar={() => setEstaAbierto(true)} />

      <div className="contenedor-componente-imagen">
        <ComponenteImagen />
      </div>

      {estaAbierto && (
        <div
          className="fondo-oscuro"
          onClick={() => setEstaAbierto(false)}
        ></div>
      )}

      <InformacionRuta ruta={"CANDIANI"}></InformacionRuta>

      <div className="contenedor-mapa">
        <Mapa
          latitud={posiciones[indice].latitud}
          longitud={posiciones[indice].longitud}
        />
      </div>

      <BarraLateral
        estaAbierto={estaAbierto}
        alCerrar={() => setEstaAbierto(false)}
      />
    </>
  );
}

export default Inicio;
