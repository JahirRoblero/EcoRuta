import "./ComponenteImagen.css";
import ParteCamionBasura from "../../assets/img/ParteCamionBasura.png";

function ComponenteImagen () {

    return (
       <div className="contenedorImagen">
            <img src={ParteCamionBasura} className="imagen-camion"></img>
       </div>
    );
}

export default ComponenteImagen;