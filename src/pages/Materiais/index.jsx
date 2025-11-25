import React, { useEffect, useState } from "react";
import CadastroForm from "../../components/Cadastrar";
import Nav from "../../components/Nav";
import "./styles.css";
import { FaEdit, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import API_URL from "@/config/api";

function Materiais({ usuario, onLogout }) {
  const [materiais, setMateriais] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [materialSelecionado, setMaterialSelecionado] = useState(null);
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

  // 🔥 FUNÇÃO CORRIGIDA - usa a rota de busca quando há termo
  const carregarMateriais = async () => {
    setCarregando(true);
    try {
      let url;
      
      if (termo && termo.trim()) {
        // 🔥 USA A ROTA DE BUSCA PAGINADA
        url = `${API_URL}/api/material/search?termo=${encodeURIComponent(termo)}&page=${pagina}&limit=${limit}`;
      } else {
        // Listagem normal
        url = `${API_URL}/api/material?page=${pagina}&limit=${limit}`;
      }
      
      console.log("🔍 Carregando:", url);
      const res = await fetch(url);
      
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      
      const data = await res.json();
      console.log("📦 Dados recebidos:", data);
      
      setMateriais(data.data || data); // 🔥 CORREÇÃO: data.data OU data (para compatibilidade)
      setTotal(data.total || data.length || 0);
    } catch (error) {
      console.error("❌ Erro ao carregar materiais:", error);
      setMateriais([]);
      setTotal(0);
    } finally {
      setCarregando(false);
    }
  };

  // 🔥 EFFECT CORRIGIDO - sincroniza com a URL
  useEffect(() => {
    console.log("🔄 URL mudou:", { termoQuery, pageQuery });
    setTermo(termoQuery);
    setPagina(pageQuery);
  }, [location.search]); // 🔥 OBSERVA MUDANÇAS NA URL

  // 🔥 EFFECT PRINCIPAL - carrega quando pagina ou termo mudam
  useEffect(() => {
    console.log("🎯 Carregando materiais:", { pagina, termo });
    carregarMateriais();
  }, [pagina, termo]);

  // 🔥 PAGINAÇÃO
  const totalPaginas = Math.ceil(total / limit);
  
  const handlePageChange = (novaPagina) => {
    console.log("📄 Mudando para página:", novaPagina);
    setPagina(novaPagina);
    
    const params = new URLSearchParams();
    if (termo) params.append("termo", termo);
    params.append("page", novaPagina);
    
    navigate(`/materiais?${params.toString()}`);
  };

  // 🔥 STATUS DA BUSCA
  const exibirStatusBusca = () => {
    if (carregando) {
      return <div className="alert alert-info">Carregando...</div>;
    }
    
    if (termo && materiais.length === 0) {
      return (
        <div className="alert alert-warning">
          Nenhum material encontrado para "<strong>{termo}</strong>"
          <button 
            className="btn btn-sm btn-outline-secondary ms-2"
            onClick={() => navigate("/materiais")}
          >
            Limpar busca
          </button>
        </div>
      );
    }
    
    if (termo && materiais.length > 0) {
      return (
        <div className="alert alert-success">
          {total} material(s) encontrado(s) para "<strong>{termo}</strong>"
          <button 
            className="btn btn-sm btn-outline-secondary ms-2"
            onClick={() => navigate("/materiais")}
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
    if (materialSelecionado) {
      const element = document.getElementById("cadastroOffcanvas");
      if (element) {
        const offcanvas = new window.bootstrap.Offcanvas(element);
        offcanvas.show();
      }
    }
  }, [materialSelecionado]);

  const handleExcluir = (id) => {
    if (window.confirm("Deseja realmente excluir este material?")) {
      fetch(`${API_URL}/api/material/${id}`, {
        method: "DELETE",
        credentials: "include"
      })
        .then((res) => {
          if (res.ok) {
            carregarMateriais(); // Recarrega a lista
          }
        })
        .catch((err) => console.error("Erro ao excluir Material:", err));
    }
  };

  const handleEditar = (material) => {
    console.log("Editando Material:", material);
    setEditandoId(material.id);
    setMaterialSelecionado(material);
  };
  
  const handleNovo = () => {
    setEditandoId(null);
    setMaterialSelecionado(null);
  };

  return (
    <>
      <Nav usuario={usuario} onLogout={onLogout}>
        <div className="materiais-container">
          <div className="card-panel">
            <h2 className="titulo">
              {termo ? `Busca: "${termo}"` : "Lista de Materiais"}
            </h2>

            {exibirStatusBusca()}

            {materiais.length === 0 && !carregando ? (
              <p className="mensagem-vazia">
                {termo ? "Nenhum material encontrado." : "Nenhum material cadastrado."}
              </p>
            ) : (
              <>
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}></th>
                      <th>Descrição</th>
                      <th>Marca</th>
                      <th>Preço</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materiais.map((mat) => {
                      const isIncompleto = mat.incompleto === true;
                      
                      return (
                        <tr key={mat.id} className={isIncompleto ? 'table-warning' : ''}>
                          <td data-label="">
                            {isIncompleto && (
                              <span 
                                className="badge bg-warning" 
                                title="Material incompleto - necessita atenção"
                                style={{ 
                                  width: '12px', 
                                  height: '12px', 
                                  borderRadius: '50%',
                                  display: 'inline-block',
                                  padding: 0
                                }}
                              >
                              </span>
                            )}
                          </td>
                          <td data-label="Descrição">
                            {mat.descricao}
                            {isIncompleto && (
                              <small className="text-muted d-block" style={{ fontSize: '0.8em' }}>
                                Pendente de informações
                              </small>
                            )}
                          </td>
                          <td data-label="Marca">
                            {mat.marca || (
                              <span className="text-muted" style={{ fontStyle: 'italic' }}>
                                {isIncompleto ? 'Não informado' : '-'}
                              </span>
                            )}
                          </td>
                          <td data-label="Preço">
                            {mat.preco > 0 ? (
                              `R$ ${mat.preco.toFixed(2)}`
                            ) : (
                              <span className="text-muted" style={{ fontStyle: 'italic' }}>
                                {isIncompleto ? 'Não informado' : '0.00'}
                              </span>
                            )}
                          </td>
                          <td data-label="Ações" className="acoes">
                            <FaEdit
                              className="icon icon-edit"
                              title="Editar"
                              onClick={() => handleEditar(mat)}
                            />
                            <FaTrash
                              className="icon icon-delete"
                              title="Excluir"
                              onClick={() => handleExcluir(mat.id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Paginação */}
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
                      Página {pagina} de {totalPaginas}
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
            {/* Cabeçalho com botão Novo */}
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
      
      {/* Cadastro genérico configurado */}
      <CadastroForm
        titulo="Cadastro de Materiais"
        endpoint={`${API_URL}/api/material`}
        campos={[
          { nome: "descricao", label: "Descrição", required: true },
          { nome: "marca", label: "Marca" },
          { nome: "preco", label: "Preço", type: "number", step: "0.01", required: true },
        ]}
        camposExtras={[
          { nome: "file", tipo: "file", label: "Upload de arquivo (CSV/XLSX)", accept: ".csv,.xlsx" }
        ]}
        initialData={materialSelecionado}
        editingId={editandoId}
        onCadastroSucesso={carregarMateriais}
        onClose={() => {
          setEditandoId(null);
          setMaterialSelecionado(null);
        }}
      />
    </>
  );
}

export default Materiais;
