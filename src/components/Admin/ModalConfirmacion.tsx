import styles from "./ModalConfirmacion.module.css";

interface ModalConfirmacionProps {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
}: ModalConfirmacionProps) {
  if (!abierto) return null;

  return (
    <div className={styles.fondo} onClick={onCancelar}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 className={styles.titulo}>{titulo}</h2>
        <p className={styles.mensaje}>{mensaje}</p>

        <div className={styles.acciones}>
          <button className={styles.botonCancelar} onClick={onCancelar}>
            {textoCancelar}
          </button>
          <button className={styles.botonConfirmar} onClick={onConfirmar}>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}