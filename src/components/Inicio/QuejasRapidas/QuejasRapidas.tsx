import stylesQuejas from "./QuejasRapidas.module.css";


function QuejasRapidas({tituloQueja, descripcionQueja, imagenQueja}) {

    return (
        <div className={stylesQuejas["contenedor"]}>
            <div className={stylesQuejas["contenedor-reportes"]}>
                <h3>{tituloQueja}</h3>
                <p>{descripcionQueja}</p>
                <img src={imagenQueja}></img>
            </div>
        </div>
    );
}

export default QuejasRapidas;