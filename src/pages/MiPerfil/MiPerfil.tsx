import { useState } from "react";
import Barra from "../../components/Inicio/Barra/Barra";
import BarraLateral from "../../components/Inicio/BarraLateral/BarraLateral";

function MiPerfil() {
  const [estaAbierto, setEstaAbierto] = useState(false);
  return (
    <div>
      <Barra
        estaAbierto={estaAbierto}
        alCerrar={() => setEstaAbierto(true)}
      ></Barra>
      <BarraLateral
        estaAbierto={estaAbierto}
        alCerrar={() => setEstaAbierto(false)}
      ></BarraLateral>
      <main></main>
    </div>
  );
}

export default MiPerfil;
