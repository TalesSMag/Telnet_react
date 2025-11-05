import React, { useEffect, useState } from "react";
import CadastroForm from "../../components/Cadastrar";
import Nav from "../../components/Nav";
import "./styles.css";
import { FaEdit, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import API_URL from "@/config/api";

function Tecnicos({ usuario, onLogout }) {
  const [tecnicos, setTecnicos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState(null);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search);
  const termoQuery = query.get("termo") || "";
  const pageQuery = parseInt(query.get("page")) || 1;
  const limit = 5;

  const [pagina, setPagina] = useState(pageQuery);
  const [termo, setTermo] = useState(termoQuery);

  // 🔥 FUNÇÃO ÚNICA - busca paginada
  const carregarTecnicos = async () => {
    setCarregando(true);
    try {
      let url;
      
      if (termo && termo.trim()) {
        url = `${API_URL}/api/tecnico/search?termo=${encodeURIComponent(termo)}&page=${pagina}&limit=${limit}`;
      } else {
        url = `${API_URL}/api/tecnico?page=${pagina}&limit=${limit}`;
      }
      
      console.log("🔍 Carregando técnicos:", url);
      const res = await fetch(url);
      
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      
      const data = await res.json();
      console.log("📦 Dados recebidos do backend:", data);
      
      // 🔥 VERIFICA SE A ESTRUTURA ESTÁ CORRETA
      if (data.data && typeof data.total === 'number') {
        setTecnicos(data.data);
        setTotal(data.total);
      } else {
        // Fallback para estrutura antiga
        console.warn("⚠️ Estrutura antiga detectada, usando fallback");
        setTecnicos(data);
        setTotal(data.length);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar técnicos:", error);
      setTecnicos([]);
      setTotal(0);
    } finally {
      setCarregando(false);
    }
  };

  // 🔥 SINCRONIZA COM URL
  useEffect(() => {
    console.log("🔄 URL mudou:", { termoQuery, pageQuery });
    setTermo(termoQuery);
    setPagina(pageQuery);
  }, [location.search]);

  // 🔥 CARREGA DADOS
  useEffect(() => {
    console.log("🎯 Carregando técnicos:", { pagina, termo });
    carregarTecnicos();
  }, [pagina, termo]);

  // 🔥 PAGINAÇÃO
  const totalPaginas = Math.ceil(total / limit);
  console.log("📊 Paginação:", { total, limit, totalPaginas, pagina });
  
  const handlePageChange = (novaPagina) => {
    console.log("📄 Mudando para página:", novaPagina);
    setPagina(novaPagina);
    const params = new URLSearchParams();
    if (termo) params.append("termo", termo);
    params.append("page", novaPagina);
    navigate(`/tecnicos?${params.toString()}`);
  };

  // 🔥 STATUS DA BUSCA
  const exibirStatusBusca = () => {
    if (carregando) {
      return <div className="alert alert-info">Carregando...</div>;
    }
    
    if (termo && tecnicos.length === 0) {
      return (
        <div className="alert alert-warning">
          Nenhum técnico encontrado para "<strong>{termo}</strong>"
          <button 
            className="btn btn-sm btn-outline-secondary ms-2"
            onClick={() => navigate("/tecnicos")}
          >
            Limpar busca
          </button>
        </div>
      );
    }
    
    if (termo && tecnicos.length > 0) {
      return (
        <div className="alert alert-success">
          {total} técnico(s) encontrado(s) para "<strong>{termo}</strong>"
          <button 
            className="btn btn-sm btn-outline-secondary ms-2"
            onClick={() => navigate("/tecnicos")}
          >
            Limpar busca
          </button>
        </div>
      );
    }
    
    return null;
  };

  // 🔥 ABRIR OFFCANVAS PARA EDIÇÃO
  useEffect(() => {
    if (tecnicoSelecionado) {
      const element = document.getElementById("cadastroOffcanvas");
      if (element) {
        const offcanvas = new window.bootstrap.Offcanvas(element);
        offcanvas.show();
      }
    }
  }, [tecnicoSelecionado]);

  const handleExcluir = (id) => {
    if (window.confirm("Deseja realmente excluir este técnico?")) {
      fetch(`${API_URL}/api/tecnico/${id}`, {
        method: "DELETE",
        credentials: "include"
      })
        .then((res) => {
          if (res.ok) {
            carregarTecnicos();
          }
        })
        .catch((err) => console.error("Erro ao excluir técnico:", err));
    }
  };

  const handleEditar = (tecnico) => {
    console.log("Editando técnico:", tecnico);
    setEditandoId(tecnico.id);
    setTecnicoSelecionado(tecnico);
  };
  
  const handleNovo = () => {
    setEditandoId(null);
    setTecnicoSelecionado(null);
  };

  return (
    <>
      <Nav usuario={usuario} onLogout={onLogout}>
        <div className="tecnicos-container">
          <div className="card-panel">
            <h2 className="titulo">
              {termo ? `Busca: "${termo}"` : "Lista de Técnicos"}
            </h2>

            {exibirStatusBusca()}

            {tecnicos.length === 0 && !carregando ? (
              <p className="mensagem-vazia">
                {termo ? "Nenhum técnico encontrado." : "Nenhum técnico cadastrado."}
              </p>
            ) : (
              <>
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>CPF</th>
                      <th>Contato</th>
                      <th>FatorRH</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tecnicos.map((tec) => (
                      <tr key={tec.id}>
                        <td>{tec.nome}</td>
                        <td>{tec.CPF}</td>
                        <td>{tec.contato}</td>
                        <td>{tec.fatorRH}</td>
                        <td className="acoes">
                          <FaEdit
                            className="icon icon-edit"
                            title="Editar"
                            onClick={() => handleEditar(tec)}
                          />
                          <FaTrash
                            className="icon icon-delete"
                            title="Excluir"
                            onClick={() => handleExcluir(tec.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 🔥 PAGINAÇÃO */}
                {totalPaginas > 1 && (
                  <div className="paginacao">
                    <button
                      disabled={pagina === 1 || carregando}
                      onClick={() => handlePageChange(pagina - 1)}
                    >
                      <FaChevronLeft color="white" />
                      Anterior
                    </button>
                    <span>
                      Página {pagina} de {totalPaginas} {carregando && "(carregando...)"}
                    </span>
                    <button
                      disabled={pagina === totalPaginas || carregando}
                      onClick={() => handlePageChange(pagina + 1)}
                    >
                      Próxima 
                      <FaChevronRight color="white" />
                    </button>
                  </div>
                )}
              </>
            )}
            
            {/* Botão Novo */}
            <div className="card-panel-header">
              <button
                className="btn-novo"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#cadastroOffcanvas"
                onClick={handleNovo}
              >
                + Novo
              </button>
            </div>
          </div>
        </div>
      </Nav>
      
      <CadastroForm
        key={editandoId || "novo"}
        titulo="Cadastro de Técnico"
        endpoint={`${API_URL}/api/tecnico`}
        campos={[
          { nome: "nome", label: "Nome", required: true },
          { nome: "CPF", label: "CPF", required: true },
          { nome: "contato", label: "Contato" },
          { nome: "fatorRH", label: "Fator RH" },
        ]}
        initialData={tecnicoSelecionado}
        editingId={editandoId}
        onCadastroSucesso={carregarTecnicos}
        onClose={() => {
          setEditandoId(null);
          setTecnicoSelecionado(null);
        }}
      />
    </>
  );
}

export default Tecnicos;
