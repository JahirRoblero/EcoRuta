import stylesQuejas from "./QuejasRapidas.module.css";


function QuejasRapidas() {

    return (
        <div className={stylesQuejas["contenedor"]}>
            <h2>Reportes Recientes</h2>
            <p>Los reportes mas recientes de tu zona</p>

            <div className={stylesQuejas["contenedor-reportes"]}>
                <h3>Ya se lleno el camion</h3>
                <p>El camion de la basura no esta recibiendo mas basura</p>
            </div>
        </div>
    );
}

export default QuejasRapidas;