import "./BarraLeteral.css";
import cerrar from "../../assets/img/cerrar.svg";

function BarraLateral({estaAbierto, alCerrar}) {
    return (
        <div className={estaAbierto ?"contenedor-barralateral" : "contenedor-barralateral-cerrado"}>
            <button className="cerrar" onClick={()=>alCerrar}>
                <img className="imagenCerrar" src={cerrar}></img>
            </button>
            <div className="opciones">
                <button>Inicio</button>
                <button>Rutas</button>
                <button>Puntos de basura</button>
                <button>Quejas y subjerencias</button>
                <button>Bandejas</button>
            </div>
        </div>
    );
}

export default BarraLateral;