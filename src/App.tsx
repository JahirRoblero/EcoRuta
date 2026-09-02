import { Routes, Route } from "react-router";

import Inicio from "./pages/Inicio";
import Rutas from "./pages/Rutas/Rutas";
import Quejas from "./pages/Quejas/Quejas";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/rutas" element={<Rutas/>} />
      <Route path="/quejas" element={<Quejas />} />
    </Routes>
  );
}

export default App;
