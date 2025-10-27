import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import { FaUserCircle } from 'react-icons/fa';
import logo from '../../assets/Telnet(logo).png'; // Ajuste o caminho do logo conforme seu projeto
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Search from "../Search";

function Nav({ onLogout, usuario = {}, children }) {

  const [dropdownOpen, setDropdownOpen] = useState(false);
  //const [materiaisPendentes, setMateriaisPendentes] = useState(0);

  /*
  const carregarPendentes = async () => {
    try {
      const res = await fetch("http://localhost:3003/api/material/incompletos");
      const data = await res.json();
      setMateriaisPendentes(data.length);
    } catch (error) {
      console.error("Erro ao carregar materiais incompletos:", error);
    }
  };

  useEffect(() => {
    carregarPendentes();
    window.addEventListener("materiaisIncompletosAtualizados", carregarPendentes);
    return () => window.removeEventListener("materiaisIncompletosAtualizados", carregarPendentes);
  }, []);
  */
  return (
    <div id="home-container" className="d-flex flex-column vh-100">
      {/* Navbar superior */}
      <nav className="navbar px-4 w-100">
        {/* Logo como botão que leva para a Home */}
        <Link to="/" className="navbar-brand d-flex align-items-center">
          <img src={logo} alt="Logo" width="120" height="80" className="ms-5 me-5" />
        </Link>

        {/* Botão toggle da sidebar apenas em telas pequenas */}
        <button className="btn d-lg-none me-2" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas" aria-controls="sidebarOffcanvas">
          ☰
        </button>

        {/* Barra de pesquisa */}
        <div className="flex-grow-1 ms-3 me-3" style={{ maxWidth: "500px" }}>
          <Search />
        </div>

        {/* Ícone do usuário */}
        <div className="ms-auto position-relative">
          <FaUserCircle
            size={32}
            className="text-dark"
            style={{ cursor: 'pointer' }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          />

          {/* Dropdown */}
          {dropdownOpen && (
            <div
              className="dropdown-menu dropdown-menu-end show"
              style={{ position: 'absolute', right: 0, marginTop: '10px' }}
            >
              <div className="px-3 py-2">
                <strong>{usuario.nome || ''}</strong>
                <br />
                <small>CPF: {usuario.CPF || ''}</small>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout-btn text-center" onClick={onLogout}>
                Sair
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Área abaixo da navbar */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar fixa em telas grandes */}
        <nav className="bg-dark text-white sidebar p-3 d-none d-lg-block" style={{ width: "200px" }}>
          <ul className="nav flex-column">
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/servico">Serviços</Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/materiais">Materiais</Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/clientes">Clientes</Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-white" to="/tecnicos">Técnicos</Link>
            </li>
          </ul>
        </nav>

        {/* === Conteúdo da página === */}
        <div className="flex-grow-1 p-4" style={{ background: "#f8f9fa" }}>
          {children}
        </div>

        {/* Sidebar Offcanvas para telas pequenas */}
        <div className="offcanvas offcanvas-start bg-dark text-white" tabIndex="-1" id="sidebarOffcanvas">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">Menu</h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
          </div>
          <div className="offcanvas-body">
            <ul className="nav flex-column">
              <li className="nav-item mb-2">
                <a className="nav-link text-white" href="#">Serviços</a>
              </li>
              <li className="nav-item mb-2">
                <a className="nav-link text-white" href="#">Materiais</a>
              </li>
              <li className="nav-item mb-2">
                <a className="nav-link text-white" href="#">Clientes</a>
              </li>
              <li className="nav-item mb-2">
                <a className="nav-link text-white" href="#">Técnicos</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Nav;
