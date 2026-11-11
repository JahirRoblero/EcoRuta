import { Routes, Route } from "react-router";

import Rutas from "./pages/Rutas/Rutas";
import Quejas from "./pages/Quejas/Quejas";
import Login from "./pages/Login/Login";
import Inicio from "./pages/Inicio";
import NoEncontrado from "./pages/NoEncontrado";

import RutaProtegida from "./components/RutaProtegida";
import Reportes from "./pages/Reportes/Reportes";
import "./App.css";
import PuntosBasura from "./pages/PuntosBasura/PuntosBasura";
import Registro from "./pages/Registro/Registro";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<RutaProtegida />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/rutas" element={<Rutas />} />
        <Route path="/crear-reportes" element={<Quejas />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/puntos-basura" element={<PuntosBasura />} />
      </Route>

      <Route path="*" element={<NoEncontrado />} />
    </Routes>
  );
}

export default App;
