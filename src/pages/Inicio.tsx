import Barra from "../components/Barra/Barra";
import ComponenteImagen from "../components/ComponenteImagen/ComponenteImagen";
import BarraLateral from "../components/BarraLateral/BarraLateral";
import { useState } from "react";

function Inicio(){

    const[estaAbierto, setEstaAbierto] = useState(false);

    return<>
        <Barra></Barra>
        <ComponenteImagen></ComponenteImagen>
        <BarraLateral estaAbierto={estaAbierto} alCerrar = {() => setEstaAbierto(false)}></BarraLateral>
    </>
}

export default Inicio;