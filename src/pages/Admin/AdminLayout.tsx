import { Outlet } from "react-router";
import BarraLateralAdmin from "../../components/Admin/BarraLateralAdmin";
import styles from "./AdminLayout.module.css";

export default function AdminLayout() {
  return (
    <div className={styles.layout}>
      <BarraLateralAdmin />

      <main className={styles.contenido}>
        <Outlet />
      </main>
    </div>
  );
}