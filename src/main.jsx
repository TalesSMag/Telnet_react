import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Search from "./components/Search";
import Home from "./pages/Home";
import Tecnicos from "./pages/Tecnicos";
import Clientes from "./pages/Clientes";
import Materiais from "./pages/Materiais";
import Servico from "./pages/Servico";
import Login from "./pages/Login";

function Main() {
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState(null);

  if (!autenticado) {
    return (
      <Login
        onLoginSuccess={(userData) => {
          setUsuario(userData);
          setAutenticado(true);
        }}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home usuario={usuario} onLogout={() => setAutenticado(false)} />} />
        <Route path="/tecnicos" element={<Tecnicos usuario={usuario} onLogout={() => setAutenticado(false)} />} />
        <Route path="/clientes" element={<Clientes usuario={usuario} onLogout={() => setAutenticado(false)} />} />
        <Route path="/materiais" element={<Materiais usuario={usuario} onLogout={() => setAutenticado(false)} />} />
        <Route path="/servico" element={<Servico usuario={usuario} onLogout={() => setAutenticado(false)} />} />
        <Route path="/search" element={<Search />} />
        {/* Qualquer rota inválida manda pra Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Main />
  </StrictMode>
);
