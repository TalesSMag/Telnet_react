import React, { useEffect, useState } from "react";
import CadastroForm from "../../components/Cadastrar";
import Nav from "../../components/Nav";
import "./styles.css";
import { FaEdit, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import API_URL from "@/config/api";

function Clientes({ usuario, onLogout }) {
  const [clientes, setClientes] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
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
  const carregarClientes = async () => {
    setCarregando(true);
    try {
      let url;
      
      if (termo && termo.trim()) {
        url = `${API_URL}/cliente/search?termo=${encodeURIComponent(termo)}&page=${pagina}&limit=${limit}`;
      } else {
        url = `${API_URL}/api/cliente?page=${pagina}&limit=${limit}`;
      }
      
      console.log("🔍 Carregando clientes:", url);
      const res = await fetch(url);
      
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      
      const data = await res.json();
      console.log("📦 Dados recebidos do backend:", data);
      
      // 🔥 VERIFICA SE A ESTRUTURA ESTÁ CORRETA
      if (data.data && typeof data.total === 'number') {
        setClientes(data.data);
        setTotal(data.total);
      } else {
        // Fallback para estrutura antiga
        console.warn("⚠️ Estrutura antiga detectada, usando fallback");
        setClientes(data);
        setTotal(data.length);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar clientes:", error);
      setClientes([]);
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
    console.log("🎯 Carregando clientes:", { pagina, termo });
    carregarClientes();
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
    navigate(`/clientes?${params.toString()}`);
  };

  // 🔥 STATUS DA BUSCA
  const exibirStatusBusca = () => {
    if (carregando) {
      return <div className="alert alert-info">Carregando...</div>;
    }
    
    if (termo && clientes.length === 0) {
      return (
        <div className="alert alert-warning">
          Nenhum cliente encontrado para "<strong>{termo}</strong>"
          <button 
            className="btn btn-sm btn-outline-secondary ms-2"
            onClick={() => navigate("/clientes")}
          >
            Limpar busca
          </button>
        </div>
      );
    }
    
    if (termo && clientes.length > 0) {
      return (
        <div className="alert alert-success">
          {total} cliente(s) encontrado(s) para "<strong>{termo}</strong>"
          <button 
            className="btn btn-sm btn-outline-secondary ms-2"
            onClick={() => navigate("/clientes")}
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
    if (clienteSelecionado) {
      const element = document.getElementById("cadastroOffcanvas");
      if (element) {
        const offcanvas = new window.bootstrap.Offcanvas(element);
        offcanvas.show();
      }
    }
  }, [clienteSelecionado]);

  const handleExcluir = (id) => {
    if (window.confirm("Deseja realmente excluir este cliente?")) {
      fetch(`http://localhost:3003/api/cliente/${id}`, {
        method: "DELETE",
        credentials: "include"
      })
        .then((res) => {
          if (res.ok) {
            carregarClientes();
          }
        })
        .catch((err) => console.error("Erro ao excluir cliente:", err));
    }
  };

  const handleEditar = (cliente) => {
    console.log("Editando cliente:", cliente);
    setEditandoId(cliente.id);
    setClienteSelecionado(cliente);
  };
  
  const handleNovo = () => {
    setEditandoId(null);
    setClienteSelecionado(null);
  };

  return (
    <>
      <Nav usuario={usuario} onLogout={onLogout}>
        <div className="clientes-container">
          <div className="card-panel">
            <h2 className="titulo">
              {termo ? `Busca: "${termo}"` : "Lista de Clientes"}
            </h2>

            {exibirStatusBusca()}

            {clientes.length === 0 && !carregando ? (
              <p className="mensagem-vazia">
                {termo ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado."}
              </p>
            ) : (
              <>
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Contato</th>
                      <th>Empresa</th>
                      <th>CNPJ</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((cli) => (
                      <tr key={cli.id}>
                        <td>{cli.nome}</td>
                        <td>{cli.contato}</td>
                        <td>{cli.empresa}</td>
                        <td>{cli.CNPJ}</td>
                        <td className="acoes">
                          <FaEdit
                            className="icon icon-edit"
                            title="Editar"
                            onClick={() => handleEditar(cli)}
                          />
                          <FaTrash
                            className="icon icon-delete"
                            title="Excluir"
                            onClick={() => handleExcluir(cli.id)}
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
        titulo="Cadastro de Clientes"
        endpoint={`${API_URL}/api/cliente`}
        campos={[
          { nome: "nome", label: "Nome", required: true },
          { nome: "contato", label: "Contato" },
          { nome: "empresa", label: "Empresa" },
          { nome: "CNPJ", label: "CNPJ", required: true },
        ]}
        initialData={clienteSelecionado}
        editingId={editandoId}
        onCadastroSucesso={carregarClientes}
        onClose={() => {
          setEditandoId(null);
          setClienteSelecionado(null);
        }}
      />
    </>
  );
}

export default Clientes;
