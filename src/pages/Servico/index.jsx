import React, { useEffect, useState } from "react";
import CadastroForm from "../../components/Cadastrar";
import Nav from "../../components/Nav";
import "./styles.css";
import { FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaFileDownload } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import API_URL from "@/config/api";

// ... manter imports do PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Logo from "../../assets/Telnet(logo).png";

function Servico({ usuario, onLogout }) {
  const [servico, setServico] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
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
  const carregarServicos = async () => {
    setCarregando(true);
    try {
      let url;
      
      if (termo && termo.trim()) {
        url = `${API_URL}/api/servico/search?termo=${encodeURIComponent(termo)}&page=${pagina}&limit=${limit}`;
      } else {
        url = `${API_URL}/api/servico?page=${pagina}&limit=${limit}`;
        if (termo) url += `&termo=${encodeURIComponent(termo)}`;
      }
      
      console.log("🔍 Carregando serviços:", url);
      const res = await fetch(url);
      
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      
      const data = await res.json();
      
      setServico(data.data || data);
      setTotal(data.total || data.length || 0);
    } catch (error) {
      console.error("❌ Erro ao carregar serviços:", error);
      setServico([]);
      setTotal(0);
    } finally {
      setCarregando(false);
    }
  };

  // 🔥 SINCRONIZA COM URL
  useEffect(() => {
    setTermo(termoQuery);
    setPagina(pageQuery);
  }, [location.search]);

  // 🔥 CARREGA DADOS
  useEffect(() => {
    carregarServicos();
  }, [pagina, termo]);

  // 🔥 PAGINAÇÃO
  const totalPaginas = Math.ceil(total / limit);
  
  const handlePageChange = (novaPagina) => {
    setPagina(novaPagina);
    const params = new URLSearchParams();
    if (termo) params.append("termo", termo);
    params.append("page", novaPagina);
    navigate(`/servico?${params.toString()}`);
  };

  // 🔥 STATUS DA BUSCA
  const exibirStatusBusca = () => {
    if (carregando) {
      return <div className="alert alert-info">Carregando...</div>;
    }
    
    if (termo && servico.length === 0) {
      return (
        <div className="alert alert-warning">
          Nenhum serviço encontrado para "<strong>{termo}</strong>"
          <button 
            className="btn btn-sm btn-outline-secondary ms-2"
            onClick={() => navigate("/servico")}
          >
            Limpar busca
          </button>
        </div>
      );
    }
    
    if (termo && servico.length > 0) {
      return (
        <div className="alert alert-success">
          {total} serviço(s) encontrado(s) para "<strong>{termo}</strong>"
          <button 
            className="btn btn-sm btn-outline-secondary ms-2"
            onClick={() => navigate("/servico")}
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
    if (servicoSelecionado) {
      const element = document.getElementById("cadastroOffcanvas");
      if (element) {
        const offcanvas = new window.bootstrap.Offcanvas(element);
        offcanvas.show();
      }
    }
  }, [servicoSelecionado]);

  const handleExcluir = (id) => {
    if (window.confirm("Deseja realmente excluir este serviço?")) {
      fetch(`${API_URL}/api/servico/${id}`, {
        method: "DELETE",
        credentials: "include"
      })
        .then((res) => {
          if (res.ok) {
            setServico(servico.filter((ser) => ser.id !== id));
          }
        })
        .catch((err) => console.error("Erro ao excluir Serviço:", err));
    }
  };

  const handleEditar = async (servico) => {
    console.log("Editando Serviço:", servico);
  
    try {
      // 🧹 Limpa o estado atual antes de carregar novos dados
      setServicoSelecionado((prev) => ({
        ...prev,
        materiais: [],
      }));
  
      // 🔹 Busca os materiais associados ao serviço
      const resMateriais = await fetch(`http://localhost:3003/api/materialpedido/servico/${servico.id}`);
      if (!resMateriais.ok) {
        throw new Error(`Erro ao buscar materiais (${resMateriais.status})`);
      }
  
      const materiaisData = await resMateriais.json();
  
      // 🔹 Normaliza os dados do serviço para o formulário
      const dadosNormalizados = {
        ...servico,
  
        // 🧩 Cliente
        nome: servico.cliente?.nome || "",
        contato: servico.cliente?.contato || "",
        empresa: servico.cliente?.empresa || "",
        CNPJ: servico.cliente?.CNPJ || "",
  
        // 🚗 Kilometragem — nunca "null"
        kilometragem: servico.kilometragem ?? 0,
  
        // 📅 Datas e horários — evita erros de formato
        data: servico.data ? servico.data.split("T")[0] : "",
        horaChegada: servico.horaChegada ? servico.horaChegada.substring(0, 5) : "",
        horaSaida: servico.horaSaida ? servico.horaSaida.substring(0, 5) : "",
  
        // 🔘 Status — trata número ou objeto
        status: servico.status?.id || servico.status_id || "",
  
        // 🧱 Materiais — garante que não duplica ao editar novamente
        materiais: Array.isArray(materiaisData)
          ? materiaisData.map((m) => ({
              id: m.material?.id || m.id || "",
              descricao: m.material?.descricao || m.descricao || "",
              marca: m.material?.marca || m.marca || "",
              preco: Number(m.material?.preco ?? m.preco ?? 0),
              quantidade: Number(m.quantidade ?? 1),
            }))
          : [],
      };
  
      // 🧩 Atualiza o serviço e evita duplicações
      setEditandoId(servico.id);
      setServicoSelecionado(dadosNormalizados);
    } catch (error) {
      console.error("Erro ao carregar materiais do serviço:", error);
      alert("Erro ao carregar materiais deste serviço. Verifique a conexão com o servidor.");
    }
  };

  // 🔥 ADICIONAR ESTA FUNÇÃO QUE ESTAVA FALTANDO
  const handleNovo = () => {
    setEditandoId(null);
    setServicoSelecionado(null);
  };

  const handleDownload = async (id) => { 
    try {
      const res = await fetch(`http://localhost:3003/api/servico/${id}/detalhes`);
      const data = await res.json();
  
      if (!data || !data.servico) {
        alert("Não foi possível carregar os dados do serviço.");
        return;
      }
  
      const servico = data.servico;
      const materiais = data.materiais || [];
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
  
      // === CABEÇALHO ===
      doc.addImage(Logo, "PNG", 14, 10, 25, 20);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("TELNET", 45, 15);
      doc.setFontSize(10);
      doc.text("Telecomunicações e Informática", 45, 20);
      doc.setFont("helvetica", "normal");
      doc.text("Cel.: (53) 981015050", 45, 25);
  
      // === LINHA DIVISÓRIA ===
      doc.setLineWidth(0.5);
      doc.line(14, 32, pageWidth - 14, 32);
  
      // === DATA E TÍTULO ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Data Emissão: ${new Date().toLocaleDateString("pt-BR")}`, 14, 42);
      doc.setFontSize(14);
      doc.text("FICHA MÃO DE OBRA", pageWidth / 2, 42, { align: "center" });
  
      // === SEÇÃO CLIENTE ===
      let y = 52;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Cliente:", 14, y);
      
      y += 8;
  
      // Dados do cliente - corrigindo campos
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Nome: ${servico.cliente?.nome || "—"}`, 14, y);
      doc.text(`Contato: ${servico.cliente?.contato || "—"}`, pageWidth / 2, y);
      y += 5;
      doc.text(`Empresa: ${servico.cliente?.empresa || "—"}`, 14, y);
      doc.text(`CNPJ: ${servico.cliente?.CNPJ || "—"}`, pageWidth / 2, y);
      y += 5;
      doc.text(`Chegada: ${servico.horaChegada?.substring(0, 5) || "—"}`, 14, y);
      doc.text(`Saída: ${servico.horaSaida?.substring(0, 5) || "—"}`, pageWidth / 2, y);
      y += 5;
      doc.text(`Kilometragem: ${servico.kilometragem || "—"}`, 14, y);
      y += 10;
  
      // === SEÇÃO SERVIÇOS ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Serviços", 14, y);
      y += 8;
  
      // Descrição do serviço
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const descricao = servico.descricaoServico || "—";
      const descricaoLines = doc.splitTextToSize(descricao, pageWidth - 30);
      descricaoLines.forEach(line => {
        if (y > pageHeight - 50) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 14, y);
        y += 4;
      });
  
      y += 8;
  
      // === SEÇÃO MATERIAIS ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Materiais", 14, y);
      y += 8;
  
      // Materiais - com tabela organizada
      if (materiais.length > 0) {
        // Cabeçalho da tabela
        doc.setFillColor(240, 240, 240);
        doc.rect(14, y, pageWidth - 28, 6, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("Descrição", 16, y + 4);
        doc.text("Marca", pageWidth - 75, y + 4);
        doc.text("Preço Unit.", pageWidth - 30, y + 4, { align: "right" });
        
        y += 10;
  
        // Itens da tabela
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        
        materiais.forEach((material, index) => {
          if (y > pageHeight - 50) {
            doc.addPage();
            y = 20;
            // Redesenha cabeçalho na nova página
            doc.setFillColor(240, 240, 240);
            doc.rect(14, y, pageWidth - 28, 6, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.text("Descrição", 16, y + 4);
            doc.text("Marca", pageWidth - 75, y + 4);
            doc.text("Preço Unit.", pageWidth - 30, y + 4, { align: "right" });
            y += 10;
            doc.setFont("helvetica", "normal");
            // RESETA O index PARA 0 QUANDO MUDA DE PÁGINA
            index = 0;
          }
          
          const descricaoMaterial = material.material?.descricao || "—";
          const marcaMaterial = material.material?.marca || "—";
          const precoMaterial = material.material?.preco ? Number(material.material.preco).toFixed(2) : "0.00";
          const quantidadeMaterial = material.quantidade || 1;
          
          // Quebra texto longo da descrição
          const descLines = doc.splitTextToSize(`${quantidadeMaterial}x ${descricaoMaterial}`, 100);
          const marcaLines = doc.splitTextToSize(marcaMaterial, 25);
          
          const maxLines = Math.max(descLines.length, marcaLines.length);
          const lineHeight = 4;
          
          // ADICIONEI ESPAÇO ANTES DO PRIMEIRO ITEM (apenas para o primeiro item da página)
          if (index === 0 || y === 28) { // 28 = 20 (início página) + 8 (cabeçalho)
            y += 2;
          }

          for (let i = 0; i < maxLines; i++) {
            if (i === 0) {
              // Primeira linha mostra todos os dados
              doc.text(descLines[i] || "", 16, y);
              doc.text(marcaLines[i] || "", pageWidth - 75, y);
              doc.text(`R$ ${precoMaterial}`, pageWidth - 30, y, { align: "right" });
            } else {
              // Linhas subsequentes (apenas para textos quebrados)
              doc.text(descLines[i] || "", 16, y);
              doc.text(marcaLines[i] || "", pageWidth - 75, y);
            }
            y += lineHeight;
          }
          
          y += 2; // Espaço entre itens
        });
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("—", 14, y);
        y += 5;
      }
  
      // === RODAPÉ ===
      const footerY = pageHeight - 20;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("GRAFICA GARIBALDI FONE: (53) 3225-5426 05 Tls. 3x50 a 00A.051 a 00A.300 02/2020", 
               pageWidth / 2, footerY, { align: "center" });
  
      // === ASSINATURA ===
      const assinaturaY = footerY - 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Assinatura do Cliente", pageWidth / 2, assinaturaY, { align: "center" });
      doc.line(pageWidth / 2 - 40, assinaturaY + 2, pageWidth / 2 + 40, assinaturaY + 2);
  
      // === TOTAIS ===
      if (servico.total) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Total: R$ ${Number(servico.total).toFixed(2)}`, pageWidth - 20, footerY - 5, { align: "right" });
      }
  
      doc.save(`Servico_${servico.id}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar documento:", error);
    }
  };
   
  return (
    <>
    <Nav usuario={usuario} onLogout={onLogout}>
      <div className="servico-container">
        <div className="card-panel">
          <h2 className="titulo">Lista de Serviços</h2>

          {exibirStatusBusca()}

          {servico.length === 0 && !carregando ? (
            <p className="mensagem-vazia">
              {termo ? "Nenhum serviço encontrado." : "Nenhum serviço cadastrado."}
            </p>
          ) : (
            <>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Descrição</th>
                    <th>Data</th>
                    <th>Chegada</th>
                    <th>Saida</th>
                    <th>Valor do Serviço</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                {servico.map((ser) => (
                    <tr key={ser.id}>
                        <td data-label="Cliente">{ser.cliente?.nome || "Sem cliente"}</td>
                        <td data-label="Descrição">{ser.descricaoServico || "—"}</td>
                        <td data-label="Data">{ser.data? new Date(ser.data + "T00:00:00").toLocaleDateString("pt-BR", {timeZone: "UTC",}):"—"}</td>
                        <td data-label="Chegada">{ser.horaChegada?.substring(0, 5) || "—"}</td>
                        <td data-label="Saída">{ser.horaSaida?.substring(0, 5) || "—"}</td>
                        <td data-label="Valor do Serviço">{ser.total ? Number(ser.total).toFixed(2) : "0.00"}</td>
                        <td data-label="Ações" className="acoes">
                        <FaFileDownload
                          className="icon icon-download"
                          title="Baixar Relatório"
                          onClick={() => handleDownload(ser.id)}
                        />  
                        <FaEdit
                            className="icon icon-edit"
                            title="Editar"
                            onClick={() => handleEditar(ser)}
                        />
                        <FaTrash
                            className="icon icon-delete"
                            title="Excluir"
                            onClick={() => handleExcluir(ser.id)}
                        />
                        </td>
                    </tr>
                    ))}
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
      titulo="Cadastro de Serviço"
      endpoint={`${API_URL}/api/servico`}
      campos={[
        { nome: "tecnico", label: "Técnico", tipo: "especial", required: true },
        { nome: "nome", label: "Cliente", tipo: "especial", required: true },
        { nome: "contato", label: "Contato" },
        { nome: "empresa", label: "Empresa" },
        { nome: "CNPJ", label: "CNPJ" },
        { nome: "descricaoServico", label: "Descrição", tipo: "textarea" },
        { nome: "horaChegada", label: "Chegada", tipo: "hora" },
        { nome: "horaSaida", label: "Saida", tipo: "hora" },
        { nome: "data", label: "Data", tipo: "data"  },
        { nome: "kilometragem", label: "Kilometragem"  },
        { nome: "status", label: "Status", tipo: "status"  },
        { nome: "materiais", label: "Materiais", tipo: "materiais"  },
        { nome: "valorServico", label: "Valor do Serviço", tipo: "number" },
        { nome: "total", label: "Total", tipo: "total" },
      ]}
      initialData={servicoSelecionado}
      editingId={editandoId}
      onCadastroSucesso={carregarServicos}
      onClose={() => {
        setEditandoId(null);
        setServicoSelecionado(null);
      }}
    />
  </>
  );
}

export default Servico;
