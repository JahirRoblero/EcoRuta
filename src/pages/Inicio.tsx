import Barra from "../components/Inicio/Barra/Barra";
import ComponenteImagen from "../components/Inicio/ComponenteImagen/ComponenteImagen";
import BarraLateral from "../components/Inicio/BarraLateral/BarraLateral";
import Mapa from "../components/Inicio/Mapa/Mapa";
import InformacionRuta from "../components/Inicio/InformacionRuta/InformacionRuta";
import Footer from "../components/Inicio/Footer/Footer";
import stylesInicio from "./Inicio.module.css";
import QuejasRapidas from "../components/Inicio/QuejasRapidas/QuejasRapidas";

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
    <div className={stylesInicio.pagina}>
      <Barra estaAbierto={estaAbierto} alCerrar={() => setEstaAbierto(true)} />

      <main className={stylesInicio["contenido"]}>
        <div className={stylesInicio["contenedor-componente-imagen"]}>
          <ComponenteImagen />
        </div>

        <InformacionRuta ruta={"CANDIANI"}></InformacionRuta>

        <div className={stylesInicio["contenedor-mapa"]}>
          <Mapa
            latitud={posiciones[indice].latitud}
            longitud={posiciones[indice].longitud}
          />
        </div>

        <QuejasRapidas></QuejasRapidas>
      </main>

      {estaAbierto && (
        <div
          className={stylesInicio["fondo-oscuro"]}
          onClick={() => setEstaAbierto(false)}
        ></div>
      )}

      <Footer></Footer>
      <BarraLateral
        estaAbierto={estaAbierto}
        alCerrar={() => setEstaAbierto(false)}
      />
    </div>
  );
}

export default Inicio;
