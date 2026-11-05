import { Routes, Route } from "react-router";

import Rutas from "./pages/Rutas/Rutas";
import Quejas from "./pages/Quejas/Quejas";
import Login from "./pages/Login/Login";
import Inicio from "./pages/Inicio";
import NoEncontrado from "./pages/NoEncontrado";

import RutaProtegida from "./components/RutaProtegida";

import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RutaProtegida />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/rutas" element={<Rutas />} />
        <Route path="/reportes" element={<Quejas />} />
      </Route>

      <Route path="*" element={<NoEncontrado />} />
    </Routes>
  );
}

export default App;
