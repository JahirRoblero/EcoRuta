import styles from "./Footer.module.css";
import logoOaxaca from "../../../assets/img/logoOaxacaOficial.png";
import locationIcon from "../../../assets/img/locationFilled.svg";

function Footer() {
  return (
    <>
      <div className={styles["contenedor-general"]}>
        <div className={styles["contenedor-informacion"]}>
          <div>
            <img className={styles.logoOaxaca} src={logoOaxaca}></img>
            <h4>OAXACA</h4>
          </div>
          <div className={styles.contacto}>
            <h4>CONTACTO</h4>
            <div className={styles.datos}>
              <img
                src={locationIcon}
                className={styles["iconos-pequeños"]}
              ></img>
              <p>
                Av. José María Morelos 108, <br />
                CALZADA MADERO, Centro, <br />
                68000 Oaxaca de Juárez, Oax.
              </p>
            </div>

            <p>www.oaxaca.gob.mx</p>
          </div>

          <div className={styles["atencion-ciudadana"]}>
            <h4>ATENCIÓN CIUDADANA</h4>

            <p>Palacio de Gobierno</p>
            <p>
              Tel. <code>(951)</code>5018100 Ext. 40033 y 40124
            </p>
            <p>Ciudad Administrativa</p>
            <p>
              Tel. <code>(951)</code>5015000 Ext.13274 y 11259
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Footer;
