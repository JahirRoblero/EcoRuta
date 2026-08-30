import Barra from "../components/Barra/Barra";
import ComponenteImagen from "../components/ComponenteImagen/ComponenteImagen";
import BarraLateral from "../components/BarraLateral/BarraLateral";
import "./Inicio.css";
import { useState } from "react";

function Inicio() {
  const [estaAbierto, setEstaAbierto] = useState(false);

  return (
    <>
      <Barra estaAbierto={estaAbierto} alCerrar={() => setEstaAbierto(true)} />

      <ComponenteImagen />

      <BarraLateral
        estaAbierto={estaAbierto}
        alCerrar={() => setEstaAbierto(false)}
      />
    </>
  );
}

export default Inicio;
