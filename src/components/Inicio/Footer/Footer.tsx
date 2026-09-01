import styles from "./Footer.module.css";
import logoOaxaca from "../../../assets/img/logoOaxacaOficial.png";
import locationIcon from "../../../assets/img/locationFilled.svg";
import web from "../../../assets/img/www.svg";
import phone from "../../../assets/img/phone.svg";
import o89 from "../../../assets/img/089.png";
import emergencias from "../../../assets/img/911.png";

function Footer() {
  return (
    <>
      <div className={styles["contenedor-general"]}>
        <div className={styles["contenedor-informacion"]}>
          <div className={styles.logoContenedor}>
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

            <div className={styles.datos}>
              <img src={phone} className={styles["iconos-pequeños"]}></img>
              <p>
                Tel. <code>(951)</code>5018100 Ext. 40033 y 40124
              </p>
            </div>

            <div className={styles.datos}>
              <img src={web} className={styles["iconos-pequeños"]}></img>
              <p>www.oaxaca.gob.mx</p>
            </div>
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

          <div className={styles["atencion-ciudadana"]}>
            <img src={o89} className={styles["iconos-medianos"]}></img>
            <img src={emergencias} className={styles["iconos-medianos"]}></img>
          </div>
        </div>
      </div>
    </>
  );
}

export default Footer;
