import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import styles from "./Login.module.css";
import { iniciarSesion } from "../../services/api";
import logoOaxaca from "../../assets/img/logoOaxacaOficial.png";
import oaxacaLimpia from "../../assets/img/Oaxaca LimpiaVerde.png";
import logoEcorrutaBlanco from "../../assets/img/LogoEcorrutaCirculo.png";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const { guardarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const manejarLogin = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const datos = await iniciarSesion(correo, contrasena);

      guardarSesion(datos.token);

      const destino = location.state?.from?.pathname || "/";

      navigate(destino, { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <nav className={styles.barraContenedor}>
        <div className={styles["contenedor-izquierdo"]}>
          <img className={styles.logoOaxaca} src={logoOaxaca}></img>

          <div className="titulo">
            <h1>Ecorruta</h1>
            <p>GOBIERNO DEL ESTADO</p>
          </div>
        </div>
      </nav>
      <main className={styles["pagina-login"]}>
        <div className={styles.divisioniIzquierda}>
          <img
            className={styles.logisimo}
            src={logoEcorrutaBlanco}
            alt="Oaxaca Limpia"
          ></img>
          <h1 className={styles.titulo}>Ingresa con tu e‑mail</h1>

          <form className={styles.formulario} onSubmit={manejarLogin}>
            <div>
              <label htmlFor="correo">Correo electrónico: </label>
              <input
                id="correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="contrasena">Contraseña: </label>
              <input
                id="contrasena"
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />
            </div>
            {error && <p role="alert">{error}</p>}
            <button
              className={styles.botonIniciarSesion}
              type="submit"
              disabled={cargando}
            >
              {cargando ? "Ingresando..." : "Iniciar sesión"}
            </button>

            <button
              className={styles.botonRegistro}
              onClick={() => navigate("/registro")}
              type="button"
            >
              Registrate
            </button>
          </form>
        </div>

        <div className={styles.divisionDerecha}>
          <img
            className={styles.oaxacaLimpia}
            src={logoEcorrutaBlanco}
            alt="Oaxaca Limpia"
          ></img>
        </div>
      </main>
    </>
  );
}
