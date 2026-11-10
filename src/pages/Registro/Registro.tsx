import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router";

import styles from "./Registro.module.css";
import logoEcorruta from "../../assets/img/LogoEcorrutaBlanco.png";

import { registrarUsuario } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/Inicio/Footer/Footer";

interface RespuestaPostal {
  cp: string;
  estado: string;
  municipio: string;
  asentamientos: {
    nombre: string;
    tipo: string;
  }[];
}

function Registro() {
  const navigate = useNavigate();
  const { guardarSesion } = useAuth();

  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [correo, setCorreo] = useState("");

  const [codigoPostal, setCodigoPostal] = useState("");
  const [colonias, setColonias] = useState<string[]>([]);
  const [coloniaNombre, setColoniaNombre] = useState("");

  const [municipio, setMunicipio] = useState("");
  const [estado, setEstado] = useState("");

  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");

  const [buscando, setBuscando] = useState(false);
  const [registrando, setRegistrando] = useState(false);

  const [errorCP, setErrorCP] = useState("");
  const [error, setError] = useState("");

  const cambiarCodigoPostal = (e: ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, "").slice(0, 5);

    setCodigoPostal(valor);
    setColoniaNombre("");
    setColonias([]);
    setMunicipio("");
    setEstado("");
    setErrorCP("");
    setBuscando(false);
  };

  useEffect(() => {
    if (!/^\d{5}$/.test(codigoPostal)) return;

    const controlador = new AbortController();

    async function buscarColonias() {
      setBuscando(true);
      setErrorCP("");

      try {
        const respuesta = await fetch(
          `https://postali.app/api/v1/mx/cp/${codigoPostal}`,
          { signal: controlador.signal },
        );

        if (!respuesta.ok) {
          throw new Error(
            respuesta.status === 404
              ? "Código postal no encontrado"
              : "No se pudieron consultar las colonias",
          );
        }

        const datos: RespuestaPostal = await respuesta.json();

        if (controlador.signal.aborted) return;

        const nombres = [
          ...new Set(
            (datos.asentamientos ?? []).map((a) => a.nombre).filter(Boolean),
          ),
        ].sort((a, b) => a.localeCompare(b, "es"));

        setColonias(nombres);
        setMunicipio(datos.municipio);
        setEstado(datos.estado);

        if (nombres.length === 0) {
          setErrorCP("No se encontraron colonias");
        }
      } catch (err: unknown) {
        if (controlador.signal.aborted) return;

        setColonias([]);
        setErrorCP(
          err instanceof Error
            ? err.message
            : "Error consultando el código postal",
        );
      } finally {
        if (!controlador.signal.aborted) {
          setBuscando(false);
        }
      }
    }

    buscarColonias();

    return () => controlador.abort();
  }, [codigoPostal]);

  const manejarRegistro = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (contrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (contrasena.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres");
      return;
    }

    if (!colonias.includes(coloniaNombre)) {
      setError("Debes seleccionar una colonia válida");
      return;
    }

    setRegistrando(true);

    try {
      const respuesta = await registrarUsuario({
        nombre: nombre.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        correo: correo.trim().toLowerCase(),
        codigoPostal,
        coloniaNombre,
        contrasena,
        confirmarContrasena,
      });

      guardarSesion(respuesta.token);

      navigate("/rutas", { replace: true });
    } catch (err: unknown) {
      const fallo = err as Error & {
        status?: number;
      };

      if (fallo.status === 409) {
        setError("El correo ya está registrado");
      } else if (fallo.status === 422) {
        setError("La colonia seleccionada no está disponible en EcoRuta");
      } else if (fallo.status === 400) {
        setError("Revisa los datos del formulario");
      } else {
        setError("No se pudo crear la cuenta");
      }
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <main className={styles.contenedor}>
      <nav className={styles.barraContenedor}>
        <div className={styles["contenedor-izquierdo"]}>
          <img className={styles.logoOaxaca} src={logoEcorruta} alt="EcoRuta" />

          <div className="titulo">
            <h1>Ecorruta</h1>
            <p>GOBIERNO DEL ESTADO</p>
          </div>
        </div>
      </nav>

      <form onSubmit={manejarRegistro} className={styles.formulario}>
        <h2 className={styles.tituloRegistro}>Registro de ciudadano</h2>

        <div className={styles.grupoFormulario}>
          <label htmlFor="nombre">Nombre:</label>
          <input
            id="nombre"
            type="text"
            maxLength={60}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div className={styles.grupoFormulario}>
          <label htmlFor="apellidoPaterno">Apellido paterno:</label>
          <input
            id="apellidoPaterno"
            type="text"
            maxLength={60}
            value={apellidoPaterno}
            onChange={(e) => setApellidoPaterno(e.target.value)}
            required
          />
        </div>

        <div className={styles.grupoFormulario}>
          <label htmlFor="apellidoMaterno">Apellido materno:</label>
          <input
            id="apellidoMaterno"
            type="text"
            maxLength={60}
            value={apellidoMaterno}
            onChange={(e) => setApellidoMaterno(e.target.value)}
          />
        </div>

        <div className={styles.grupoFormulario}>
          <label htmlFor="correo">Correo electrónico:</label>
          <input
            id="correo"
            type="email"
            maxLength={254}
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>

        <div className={styles.grupoFormulario}>
          <label htmlFor="codigoPostal">Código postal:</label>
          <input
            id="codigoPostal"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            pattern="[0-9]{5}"
            placeholder="68000"
            value={codigoPostal}
            onChange={cambiarCodigoPostal}
            required
          />
        </div>

        {buscando && <p>Buscando colonias...</p>}

        {errorCP && (
          <p role="alert" style={{ color: "red" }}>
            {errorCP}
          </p>
        )}

        <div className={styles.grupoFormulario}>
          <label htmlFor="colonia">Selecciona tu colonia:</label>
          <select
            id="colonia"
            value={coloniaNombre}
            onChange={(e) => setColoniaNombre(e.target.value)}
            disabled={buscando || colonias.length === 0}
            required
          >
            <option value="">
              {buscando
                ? "Buscando..."
                : colonias.length
                  ? "Selecciona una colonia"
                  : "Ingresa tu código postal"}
            </option>

            {colonias.map((colonia) => (
              <option key={colonia} value={colonia}>
                {colonia}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.grupoFormulario}>
          <label htmlFor="contrasena">Contraseña:</label>
          <input
            id="contrasena"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
        </div>

        <div className={styles.grupoFormulario}>
          <label htmlFor="confirmarContrasena">Confirmar contraseña:</label>
          <input
            id="confirmarContrasena"
            type="password"
            autoComplete="new-password"
            value={confirmarContrasena}
            onChange={(e) => setConfirmarContrasena(e.target.value)}
            required
          />

          {error && (
            <p role="alert" style={{ color: "red" }}>
              {error}
            </p>
          )}
        </div>

        <button type="submit" disabled={registrando || buscando}>
          {registrando ? "Registrando..." : "Crear cuenta"}
        </button>

        <p>
          ¿Ya tienes cuenta? <a href="/login">Iniciar sesión</a>
        </p>
      </form>
      <Footer></Footer>
    </main>
  );
}

export default Registro;
