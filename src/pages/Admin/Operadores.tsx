import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import TablaDatos from "../../components/Admin/TablaDatos";
import type { Columna } from "../../components/Admin/TablaDatos";
import {
  obtenerOperadores,
  obtenerVehiculos,
  crearOperador,
} from "../../services/adminOperadoresApi";
import styles from "./Operadores.module.css";

interface Operador {
  correo: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  activo: boolean;
  fechaRegistro: string | null;
}

type EstadoVehiculo = "DISPONIBLE" | "EN_RUTA" | "MANTENIMIENTO" | "FUERA_SERVICIO";

interface Vehiculo {
  placa: string;
  numeroEconomico: string;
  marca: string | null;
  modelo: string | null;
  capacidadKg: number | null;
  estado: EstadoVehiculo;
  activo: boolean;
}

interface FormularioAlta {
  correo: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  contrasenaTemporal: string;
}

type ErroresFormulario = Partial<Record<keyof FormularioAlta | "general", string>>;

const FORMULARIO_VACIO: FormularioAlta = {
  correo: "",
  nombre: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  contrasenaTemporal: "",
};

const NOMBRE_ESTADO_VEHICULO: Record<EstadoVehiculo, string> = {
  DISPONIBLE: "Disponible",
  EN_RUTA: "En ruta",
  MANTENIMIENTO: "Mantenimiento",
  FUERA_SERVICIO: "Fuera de servicio",
};

const CLASE_ESTADO_VEHICULO: Record<EstadoVehiculo, string> = {
  DISPONIBLE: styles.estadoDisponible,
  EN_RUTA: styles.estadoEnRuta,
  MANTENIMIENTO: styles.estadoMantenimiento,
  FUERA_SERVICIO: styles.estadoFuera,
};

// Mismas reglas que el backend (SolicitudCrearOperadorDTO).
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PATRON_CONTRASENA = /^(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,72}$/;

function validar(datos: FormularioAlta): ErroresFormulario {
  const errores: ErroresFormulario = {};
  if (!PATRON_CORREO.test(datos.correo.trim())) errores.correo = "Escribe un correo válido.";
  if (!datos.nombre.trim()) errores.nombre = "El nombre es obligatorio.";
  if (!datos.apellidoPaterno.trim()) errores.apellidoPaterno = "El apellido paterno es obligatorio.";
  if (!PATRON_CONTRASENA.test(datos.contrasenaTemporal)) {
    errores.contrasenaTemporal = "Mínimo 8 caracteres, con al menos un número y un carácter especial.";
  }
  return errores;
}

function mensajeDeError(error: unknown): string {
  const estado = (error as { status?: number } | null)?.status;
  if (estado === 403) return "No tienes permisos para administrar operadores.";
  return "No se pudo conectar con el servidor. Intenta de nuevo.";
}

function formatearFecha(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Operadores() {
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [filtroVehiculo, setFiltroVehiculo] = useState("TODOS");
  const [cargandoOperadores, setCargandoOperadores] = useState(true);
  const [cargandoVehiculos, setCargandoVehiculos] = useState(true);
  const [errorOperadores, setErrorOperadores] = useState<string | null>(null);
  const [errorVehiculos, setErrorVehiculos] = useState<string | null>(null);

  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [formulario, setFormulario] = useState<FormularioAlta>(FORMULARIO_VACIO);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [guardando, setGuardando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargarOperadores = useCallback(async () => {
    setCargandoOperadores(true);
    setErrorOperadores(null);
    try {
      setOperadores((await obtenerOperadores()) as Operador[]);
    } catch (e) {
      setOperadores([]);
      setErrorOperadores(mensajeDeError(e));
    } finally {
      setCargandoOperadores(false);
    }
  }, []);

  const cargarVehiculos = useCallback(async () => {
    setCargandoVehiculos(true);
    setErrorVehiculos(null);
    try {
      const estado = filtroVehiculo === "TODOS" ? undefined : filtroVehiculo;
      setVehiculos((await obtenerVehiculos(estado)) as Vehiculo[]);
    } catch (e) {
      setVehiculos([]);
      setErrorVehiculos(mensajeDeError(e));
    } finally {
      setCargandoVehiculos(false);
    }
  }, [filtroVehiculo]);

  useEffect(() => {
    cargarOperadores();
  }, [cargarOperadores]);

  useEffect(() => {
    cargarVehiculos();
  }, [cargarVehiculos]);

  const abrirFormulario = () => {
    setFormulario(FORMULARIO_VACIO);
    setErrores({});
    setMostrarContrasena(false);
    setAviso(null);
    setFormularioAbierto(true);
  };

  const cerrarFormulario = () => {
    if (guardando) return;
    setFormularioAbierto(false);
    setFormulario(FORMULARIO_VACIO);
  };

  const cambiarCampo = (campo: keyof FormularioAlta, valor: string) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actual) => ({ ...actual, [campo]: undefined, general: undefined }));
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    const encontrados = validar(formulario);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setGuardando(true);
    try {
      const creado = (await crearOperador({
        correo: formulario.correo.trim(),
        nombre: formulario.nombre.trim(),
        apellidoPaterno: formulario.apellidoPaterno.trim(),
        apellidoMaterno: formulario.apellidoMaterno.trim() || null,
        contrasenaTemporal: formulario.contrasenaTemporal,
      })) as Operador;
      setOperadores((lista) => [...lista, creado]);
      setFormularioAbierto(false);
      setFormulario(FORMULARIO_VACIO);
      setAviso(`Se dio de alta a ${creado.nombre} ${creado.apellidoPaterno}. Entrégale la contraseña temporal en persona.`);
    } catch (e) {
      const estado = (e as { status?: number } | null)?.status;
      if (estado === 409) setErrores({ correo: "Ya existe una cuenta con ese correo." });
      else if (estado === 400) setErrores({ general: "Revisa los datos: alguno no cumple las reglas." });
      else setErrores({ general: mensajeDeError(e) });
    } finally {
      setGuardando(false);
    }
  };

  const columnasOperadores: Columna<Operador>[] = [
    {
      clave: "nombre",
      titulo: "Nombre",
      ordenable: true,
      valor: (o) => [o.nombre, o.apellidoPaterno, o.apellidoMaterno].filter(Boolean).join(" "),
    },
    { clave: "correo", titulo: "Correo", ordenable: true },
    {
      clave: "fechaRegistro",
      titulo: "Alta",
      ordenable: true,
      valor: (o) => o.fechaRegistro ?? "",
      render: (o) => formatearFecha(o.fechaRegistro),
    },
    {
      clave: "activo",
      titulo: "Estado",
      ordenable: true,
      valor: (o) => (o.activo ? "Activo" : "Inactivo"),
      render: (o) => (
        <span className={`${styles.etiqueta} ${o.activo ? styles.estadoDisponible : styles.estadoFuera}`}>
          {o.activo ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ];

  const columnasVehiculos: Columna<Vehiculo>[] = [
    { clave: "numeroEconomico", titulo: "No. económico", ordenable: true },
    { clave: "placa", titulo: "Placa", ordenable: true },
    {
      clave: "marca",
      titulo: "Unidad",
      ordenable: true,
      valor: (v) => [v.marca, v.modelo].filter(Boolean).join(" ") || "—",
    },
    {
      clave: "capacidadKg",
      titulo: "Capacidad",
      ordenable: true,
      valor: (v) => v.capacidadKg ?? "",
      render: (v) => (v.capacidadKg != null ? `${Number(v.capacidadKg).toLocaleString("es-MX")} kg` : "—"),
    },
    {
      clave: "estado",
      titulo: "Estado",
      ordenable: true,
      valor: (v) => NOMBRE_ESTADO_VEHICULO[v.estado] ?? v.estado,
      render: (v) => (
        <span className={`${styles.etiqueta} ${CLASE_ESTADO_VEHICULO[v.estado] ?? ""}`}>
          {NOMBRE_ESTADO_VEHICULO[v.estado] ?? v.estado}
        </span>
      ),
    },
  ];

  return (
    <div className={styles.pagina}>
      <header className={styles.encabezado}>
        <div>
          <h1>Operadores</h1>
          <p>Conductores registrados y unidades de recolección</p>
        </div>
        <button className={styles.botonPrincipal} onClick={abrirFormulario}>
          Dar de alta conductor
        </button>
      </header>

      {aviso && (
        <div className={styles.aviso} role="status">
          <span>{aviso}</span>
          <button className={styles.botonCerrarAviso} onClick={() => setAviso(null)} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}

      <section className={styles.seccion}>
        <h2>Conductores</h2>
        {errorOperadores && (
          <div className={styles.error} role="alert">
            <span>{errorOperadores}</span>
            <button className={styles.botonSecundario} onClick={cargarOperadores}>
              Reintentar
            </button>
          </div>
        )}
        <TablaDatos
          datos={operadores}
          columnas={columnasOperadores}
          obtenerClave={(o) => o.correo}
          cargando={cargandoOperadores}
          placeholderBusqueda="Buscar por nombre o correo..."
          mensajeVacio="Todavía no hay conductores registrados"
        />
      </section>

      <section className={styles.seccion}>
        <h2>Vehículos</h2>
        {errorVehiculos && (
          <div className={styles.error} role="alert">
            <span>{errorVehiculos}</span>
            <button className={styles.botonSecundario} onClick={cargarVehiculos}>
              Reintentar
            </button>
          </div>
        )}
        <TablaDatos
          datos={vehiculos}
          columnas={columnasVehiculos}
          obtenerClave={(v) => v.placa}
          cargando={cargandoVehiculos}
          placeholderBusqueda="Buscar por placa, número o marca..."
          mensajeVacio="No hay vehículos con este estado"
          filtros={
            <select
              className={styles.selector}
              value={filtroVehiculo}
              onChange={(evento) => setFiltroVehiculo(evento.target.value)}
              aria-label="Filtrar vehículos por estado"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="EN_RUTA">En ruta</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="FUERA_SERVICIO">Fuera de servicio</option>
            </select>
          }
        />
      </section>

      {formularioAbierto && (
        <div className={styles.fondo} onClick={cerrarFormulario}>
          <form
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-alta"
            onClick={(evento) => evento.stopPropagation()}
            onSubmit={guardar}
            noValidate
          >
            <h2 id="titulo-alta">Dar de alta conductor</h2>
            <p className={styles.ayuda}>
              La contraseña temporal se guarda cifrada y no se vuelve a mostrar. Entrégasela al conductor en persona.
            </p>

            <label className={styles.campo}>
              <span>Correo</span>
              <input
                id="alta-correo"
                type="email"
                autoComplete="off"
                value={formulario.correo}
                onChange={(e) => cambiarCampo("correo", e.target.value)}
                aria-invalid={Boolean(errores.correo)}
              />
              {errores.correo && <small className={styles.errorCampo}>{errores.correo}</small>}
            </label>

            <label className={styles.campo}>
              <span>Nombre</span>
              <input
                id="alta-nombre"
                maxLength={60}
                value={formulario.nombre}
                onChange={(e) => cambiarCampo("nombre", e.target.value)}
                aria-invalid={Boolean(errores.nombre)}
              />
              {errores.nombre && <small className={styles.errorCampo}>{errores.nombre}</small>}
            </label>

            <div className={styles.fila}>
              <label className={styles.campo}>
                <span>Apellido paterno</span>
                <input
                  id="alta-apellido-paterno"
                  maxLength={60}
                  value={formulario.apellidoPaterno}
                  onChange={(e) => cambiarCampo("apellidoPaterno", e.target.value)}
                  aria-invalid={Boolean(errores.apellidoPaterno)}
                />
                {errores.apellidoPaterno && (
                  <small className={styles.errorCampo}>{errores.apellidoPaterno}</small>
                )}
              </label>
              <label className={styles.campo}>
                <span>Apellido materno (opcional)</span>
                <input
                  id="alta-apellido-materno"
                  maxLength={60}
                  value={formulario.apellidoMaterno}
                  onChange={(e) => cambiarCampo("apellidoMaterno", e.target.value)}
                />
              </label>
            </div>

            <label className={styles.campo}>
              <span>Contraseña temporal</span>
              <div className={styles.contrasena}>
                <input
                  id="alta-contrasena"
                  type={mostrarContrasena ? "text" : "password"}
                  autoComplete="new-password"
                  maxLength={72}
                  value={formulario.contrasenaTemporal}
                  onChange={(e) => cambiarCampo("contrasenaTemporal", e.target.value)}
                  aria-invalid={Boolean(errores.contrasenaTemporal)}
                />
                <button
                  type="button"
                  className={styles.botonSecundario}
                  onClick={() => setMostrarContrasena((v) => !v)}
                >
                  {mostrarContrasena ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {errores.contrasenaTemporal ? (
                <small className={styles.errorCampo}>{errores.contrasenaTemporal}</small>
              ) : (
                <small className={styles.pista}>Mínimo 8 caracteres, un número y un carácter especial.</small>
              )}
            </label>

            {errores.general && <div className={styles.error}>{errores.general}</div>}

            <div className={styles.acciones}>
              <button type="button" className={styles.botonSecundario} onClick={cerrarFormulario} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className={styles.botonPrincipal} disabled={guardando}>
                {guardando ? "Guardando…" : "Dar de alta"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
