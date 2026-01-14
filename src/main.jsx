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
  const [autenticado, setAutenticado] = useState(() => {
    return !!localStorage.getItem("usuario");
  });
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem("usuario");
    return salvo ? JSON.parse(salvo) : null;
  });

  if (!autenticado) {
    return (
      <Login
        onLoginSuccess={(userData) => {
          setUsuario(userData);
          setAutenticado(true);
          localStorage.setItem("usuario", JSON.stringify(userData));
        }}
      />
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    setUsuario(null);
    setAutenticado(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home usuario={usuario} onLogout={handleLogout} />} />
        <Route path="/tecnicos" element={<Tecnicos usuario={usuario} onLogout={handleLogout} />} />
        <Route path="/clientes" element={<Clientes usuario={usuario} onLogout={handleLogout} />} />
        <Route path="/materiais" element={<Materiais usuario={usuario} onLogout={handleLogout} />} />
        <Route path="/servico" element={<Servico usuario={usuario} onLogout={handleLogout} />} />
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
