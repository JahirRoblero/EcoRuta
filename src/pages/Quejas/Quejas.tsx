import { useState } from "react";
import Barra from "../../components/Inicio/Barra/Barra";
import BarraLateral from "../../components/Inicio/BarraLateral/BarraLateral";
import styles from "./Quejas.module.css";

 function Quejas(){
    const [estAbierto, setAbierto]=useState(false);



    return (
        <>
        <Barra estaAbierto={setAbierto} alCerrar={() =>
            setAbierto(true)}/>

            {estAbierto && (
                <div
                    className={styles["fondo-oscuro"]}
                    onClick={() => setAbierto(false)}
                    ></div>
            )} 

            <main className={styles.contenedor}>
                <h1 className={styles.titulo}>Quejas y Sugerencias </h1>
                <p className={styles.subtitulo}>
                        Ayudanos a mejorar el servicio de recolecion de residuos. Comparte
                        tu queja o sugerencia y con gusto le daremos seguimiento. 
                </p>

                <form className={styles.formulario}>
                    <div className={styles.campo}>
                        <label className={styles.etiquetas}>
                            Tipo <span className={styles.requerido}>*</span>
                        </label>
                        <div className={styles["grupo-radio"]}>
                            <label className={styles["opcion-radio"]}>
                                <input type="radio" name="tipo" value="queja" required />
                                Queja
                            </label>
                            <label className={styles["opcion-radio"]}>
                                <input type="radio" name="tipo" value="sugerencia" />
                                Sugerencia
                            </label>
                        </div>
                    </div>

                    <div className={styles.campo}>
                        <label className={styles.etiqueta} htmlFor="categoria">
                            Categoria <span className={styles.requerido}>*</span>
                        </label>
                        <select id="categoria" name="categoria" className={styles.control} required>
                            <option value="">Selecciona una opcion</option>
                            <option value="recoleccion-no-realizada">Recoleccion no Realizada</option>
                            <option value="basura-acomulada">Basura acomulada</option>
                            <option value="contenedor-danado">Contenedor danado</option>
                            <option value="sugerencia-ruta">Sugerencia de Ruta</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>

                    <div className={styles.campo}>
                        <label className={styles.etiqueta} htmlFor="asunto">
                            Asunto <span className={styles.requerido}>*</span>
                        </label>
                        <input
                            type="text"
                            id="asunto"
                            name="asunto"
                            className={styles.control}
                            placeholder="Eje. Basura no recolectada en l;a calle 5 de ma"
                            maxLength={100}
                            required/>
                    </div>

                    <div className={styles.campo}>
                        <label className={styles.etiqueta} htmlFor="descripcion">
                            Descripcion <span className={styles.requerido}>*</span>
                            </label>
                                <textarea
                                id="descripcion"
                                name="descripcion"
                                className={styles.control}
                                rows={5}
                                placeholder="Describe cpn detalle la situacion..." maxLength={500}
                                required>
                                </textarea>

                    </div>

                                <div className={styles.campo}>
                                    <label className={styles.etiqueta} htmlFor="direccion">
                                        colonia / Direccion <span className={styles.requerido}>*</span>
                                        
                                    </label>
                                    <input
                                    type="text"
                                    id="direccion"
                                    name="direccion"
                                    className={styles.control}
                                    placeholder="Ej. Colonia Reforma, calle Juarez # 103" required/>
                                
                                    
                                </div>

                                <div className={styles.campo}>
                                    <label className={styles.etiqueta} htmlFor="nombre">
                                        Nombre <span className={styles.opcional}>(opcional)</span>
                                        </label>
                                            <input
                                            type="text"
                                            id="nombre"
                                            name="nombre"
                                            className={styles.control}
                                            placeholder="Tu nombre"/>
                                        </div>

                                        <div className={styles.campo}>
                                            <label className={styles.etiqueta} htmlFor="contacto">
                                                Correo o telefono{" "}
                                                <span className={styles.opcional}>(opcional, para seguimineto )</span>

                                            </label>
                                            <input
                                            type="text"
                                            id="contacto"
                                            name="contacto"
                                            className={styles.control}
                                            placeholder="correo@ejemplo.com  o 951 347 45 90"
                                            />
                                        </div>
                                        <div className={styles.acciones}>
                                            <button type="reset" className={styles["boton-secundario"]}>
                                                Limpiar
                                            </button>
                                            <button type="submit" className={styles["boton-primario"]}>
                                                enviar
                                            </button>
                                        </div>
                </form>
            </main>
  
            <BarraLateral
            estaAbierto={setAbierto}
            alCerrar={()=> setAbierto(false)}
            />
            </>
  
    );
 }

 export default Quejas;