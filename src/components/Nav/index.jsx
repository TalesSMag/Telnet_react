import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import { FaUserCircle } from 'react-icons/fa';
import logo from '../../assets/Telnet(logo).png';
import { Link, useNavigate } from "react-router-dom";
import Search from "../Search";

function Nav({ onLogout, usuario = {}, children }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavClick = (path) => {
    // Fecha o offcanvas se estiver aberto
    const offcanvasElement = document.querySelector(".offcanvas.show");
    if (offcanvasElement) {
      const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
      if (bsOffcanvas) bsOffcanvas.hide();
    }

    // Navega para a rota
    navigate(path);
  };

  return (
    <div id="home-container" className="d-flex flex-column vh-100">
      {/* Navbar superior */}
      <nav className="navbar px-4 w-100">
        <Link to="/" className="navbar-brand d-flex align-items-center">
          <img src={logo} alt="Logo" width="120" height="80" className="ms-5 me-5" />
        </Link>

        {/* Botão toggle da sidebar (mobile) */}
        <button
          className="btn d-lg-none me-2"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#sidebarOffcanvas"
          aria-controls="sidebarOffcanvas"
        >
          ☰
        </button>

        {/* Barra de pesquisa */}
        <div className="flex-grow-1 ms-3 me-3 search-container" style={{ maxWidth: "500px" }}>
          <Search />
        </div>

        {/* Ícone do usuário */}
        <div className="ms-auto position-relative">
          <FaUserCircle
            size={32}
            className="text-dark user-icon"
            style={{ cursor: 'pointer' }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          />

          {/* Dropdown do usuário */}
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

      {/* Corpo da página */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar fixa (desktop) */}
        <nav className="bg-dark text-white sidebar p-3 d-none d-lg-block">
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

        {/* Conteúdo principal */}
        <div className="flex-grow-1 p-4" style={{ background: "#f8f9fa" }}>
          {children}
        </div>

        {/* Sidebar Offcanvas (mobile) */}
        <div
          className="offcanvas offcanvas-start bg-dark text-white"
          tabIndex="-1"
          id="sidebarOffcanvas"
        >
          <div className="offcanvas-header border-bottom border-secondary">
            <h5 className="offcanvas-title">Menu</h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
          </div>
          <div className="offcanvas-body px-3">
            <ul className="nav flex-column">
              <li className="nav-item mb-2">
                <button className="nav-link text-white" onClick={() => handleNavClick("/servico")}>
                  Serviços
                </button>
              </li>
              <li className="nav-item mb-2">
                <button className="nav-link text-white" onClick={() => handleNavClick("/materiais")}>
                  Materiais
                </button>
              </li>
              <li className="nav-item mb-2">
                <button className="nav-link text-white" onClick={() => handleNavClick("/clientes")}>
                  Clientes
                </button>
              </li>
              <li className="nav-item mb-2">
                <button className="nav-link text-white" onClick={() => handleNavClick("/tecnicos")}>
                  Técnicos
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Nav;
