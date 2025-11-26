import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { IMaskInput } from "react-imask"; // máscara segura
import { AiFillPlusCircle } from 'react-icons/ai';
import API_URL from "@/config/api";
import "./styles.css";

function CadastroForm({ titulo, endpoint, campos, onCadastroSucesso, initialData, editingId, onClose, camposExtras = [] }) {
  const [formData, setFormData] = useState({});
  const [clientesSugeridos, setClientesSugeridos] = useState([]);
  const [carregandoClientes, setCarregandoClientes] = useState(false);
  const [tecnicosSugeridos, setTecnicosSugeridos] = useState([]);
  const [carregandoTecnicos, setCarregandoTecnicos] = useState(false);
  const [materialQuantidade, setMaterialQuantidade] = useState(1); // quantidade antes de adicionar
  const [selectedMaterial, setSelectedMaterial] = useState(null);  // material selecionado da sugestão
  const [materialBusca, setMaterialBusca] = useState("");
  const [materiaisSugeridos, setMateriaisSugeridos] = useState([]);
  const [materiaisPendentes, setMateriaisPendentes] = useState([]);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [file, setFile] = useState(null); // para campos do tipo file

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        materiais: initialData.materiais ? [...initialData.materiais] : [],
      });
    } else {
      setFormData({});
    }
  }, [initialData, editingId]);

  const handleFileUpload = async (file) => {
    if (!file) return;
  
    const formDataFile = new FormData(); // ✅ renomeado para não confundir
    formDataFile.append("file", file);
  
    try {
      setMensagem({
        tipo: "info",
        texto: "📂 Enviando e processando arquivo, aguarde...",
      });
  
      console.log("📤 Iniciando upload automático...");
      const response = await fetch(`${API_URL}/api/material/upload`, {
        method: "POST",
        body: formDataFile,
      });
  
      const result = await response.json();
      console.log("✅ Upload finalizado:", result);
  
      if (!response.ok) {
        throw new Error(result.msg || "Erro ao processar o arquivo");
      }
  
      // ✅ Pega os materiais existentes do estado atual
      const materiaisExistentes = formData?.materiais || [];
  
      const listaMateriais =
        Array.isArray(result) ? result : result.materiais || [];
      
      const novosMateriais = listaMateriais.filter((novo) =>
        !materiaisExistentes.some(
          (existente) =>
            existente.descricao.trim().toLowerCase() ===
            novo.descricao.trim().toLowerCase()
        )
      );

  
      if (novosMateriais.length < result.length) {
        console.log("⚠️ Alguns materiais foram ignorados por já existirem.");
      }
  
      // 🔹 Atualiza apenas com os novos
      setFormData((prev) => ({
        ...prev,
        materiais: [...(prev.materiais || []), ...novosMateriais],
      }));
  
      setMensagem({
        tipo: "sucesso",
        texto: `✅ Importação concluída! ${novosMateriais.length} novos materiais adicionados.`,
      });
  
      // 🔁 Atualiza listagem automaticamente, se callback existir
      if (typeof onCadastroSucesso === "function") {
        onCadastroSucesso();
      }
  
      // ⏳ Fecha automaticamente o offcanvas após 2s
      setTimeout(() => {
        console.log("⏳ Fechando offcanvas após upload...");
  
        const offcanvasElement = document.querySelector(".offcanvas.show");
        if (offcanvasElement) {
          const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
          bsOffcanvas?.hide();
        }
  
        const backdrop = document.querySelector(".offcanvas-backdrop");
        if (backdrop) backdrop.remove();
  
        document.body.classList.remove("offcanvas-open");
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
  
        setMensagem({ tipo: "", texto: "" });
        setFile(null);
        setFormData({});
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error("❌ Erro no upload automático:", error);
      setMensagem({
        tipo: "erro",
        texto: "❌ Falha ao enviar o arquivo: " + error.message,
      });
    }
  };

  const handleChange = async (nome, valor, e) => {
  if (e?.target?.type === "file") {
    const arquivo = e.target.files[0];
    setFile(arquivo);

    if (!arquivo) return;

    const formDataUpload = new FormData();
    formDataUpload.append("file", arquivo);

    try {
      setMensagem({ tipo: "info", texto: "📂 Enviando e processando arquivo, aguarde..." });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/material/upload`, {
        method: "POST",
        body: formDataUpload,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || "Erro ao processar o arquivo");
      }

      setMensagem({
        tipo: "sucesso",
        texto: `✅ ${result.msg} — ${result.count} registros (Inseridos: ${result.inseridos}, Atualizados: ${result.atualizados})`,
      });

      // Atualiza tabela automaticamente, se callback estiver definido
      if (typeof onCadastroSucesso === "function") {
        onCadastroSucesso();
      }

    } catch (error) {
      console.error("Erro no upload:", error);
      setMensagem({
        tipo: "erro",
        texto: "❌ Falha ao enviar o arquivo: " + error.message,
      });
    }

    } else if (nome && typeof nome === "string") {
      // campo normal
      setFormData((prev) => ({ ...prev, [nome]: valor }));
    }
  };


  const buscarCliente = async (nome) => {
    if (!nome || nome.length < 2) {
      setClientesSugeridos([]);
      return;
    }
    setCarregandoClientes(true);
    try {
      const res = await fetch(`${API_URL}/api/cliente/search?termo=${nome}`);
      if (res.ok) {
        const dados = await res.json();
        setClientesSugeridos(dados);
      } else {
        setClientesSugeridos([]); // Nenhum cliente encontrado
      }
    } catch (err) {
      console.error("Erro ao buscar cliente:", err);
      setClientesSugeridos([]);
    } finally {
      setCarregandoClientes(false);
    }
  };
  
  const selecionarCliente = (cliente) => {
    setFormData((prev) => ({
      ...prev,
      nome: cliente.nome,
      contato: cliente.contato,
      empresa: cliente.empresa,
      CNPJ: cliente.CNPJ,
      cliente_id: cliente.id, // 🔹 chave estrangeira
    }));
    setClientesSugeridos([]);
  };

  const buscarTecnico = async (nome) => {
    if (!nome || nome.length < 2) {
      setTecnicosSugeridos([]);
      return;
    }
    setCarregandoTecnicos(true);
    try {
      const res = await fetch(`${API_URL}/api/tecnico/search?termo=${nome}`);
      if (res.ok) {
        const dados = await res.json();
        setTecnicosSugeridos(dados);
      } else {
        setTecnicosSugeridos([]);
      }
    } catch (err) {
      console.error("Erro ao buscar técnico:", err);
      setTecnicosSugeridos([]);
    } finally {
      setCarregandoTecnicos(false);
    }
  };
  
  const selecionarTecnico = (tecnico) => {
    setFormData((prev) => ({
      ...prev,
      tecnico: { id: tecnico.id, nome: tecnico.nome }, // 🔹 guarda id e nome
    }));
    setTecnicosSugeridos([]);
  };

  const fetchMateriaisSugestao = async (term) => {
    if (!term || term.length < 2) {
      setMateriaisSugeridos([]);
      return;
    }
    try {
      // OBS: usa a rota de search que você definiu no backend
      const res = await fetch(
        `${API_URL}/api/material/search?termo=${encodeURIComponent(
          term
        )}`
      );
      if (!res.ok) {
        setMateriaisSugeridos([]);
        return;
      }
      const dados = await res.json();
      // backend deve retornar array de materiais com { id, descricao, preco, ... }
      setMateriaisSugeridos(dados);
    } catch (err) {
      console.error("erro buscar materiais:", err);
      setMateriaisSugeridos([]);
    }
  };

  const handleMaterialSuggestionClick = (m) => {
    setSelectedMaterial(m);
    setMaterialBusca(m.descricao); // mostra descrição no input
    setMateriaisSugeridos([]);
    setMaterialQuantidade(1);
  };

  const addOrMergeMaterial = () => {
    if (!materialBusca.trim()) return;
    
    const quantidade = Number(materialQuantidade) || 1;
    
    setFormData((prev) => {
      const curr = prev.materiais ? [...prev.materiais] : [];
      
      if (selectedMaterial) {
        // Material existente
        const idx = curr.findIndex((x) => x.id === selectedMaterial.id);
        if (idx >= 0) {
          curr[idx] = {
            ...curr[idx],
            quantidade: Number(curr[idx].quantidade || 0) + quantidade,
          };
        } else {
          curr.push({
            id: selectedMaterial.id,
            descricao: selectedMaterial.descricao,
            preco: Number(selectedMaterial.preco || 0),
            quantidade,
            // 🔹 Status oculto para materiais existentes
            _status: 'existente'
          });
        }
      } else {
        // 🔹 NOVO MATERIAL - status oculto
        const novoMaterialId = `pendente_${Date.now()}`;
        curr.push({
          id: novoMaterialId,
          descricao: materialBusca,
          preco: 0, // Preço temporário
          quantidade,
          // 🔹 Status oculto - sem interface
          _status: 'pendente',
          _tempId: novoMaterialId,
          _precoPendente: true
        });
      }
      
      return { ...prev, materiais: curr };
    });
    
    // Limpa os campos
    setSelectedMaterial(null);
    setMaterialBusca("");
    setMaterialQuantidade(1);
    setMateriaisSugeridos([]);
  };

  const removeMaterialAt = (idx) => {
    setFormData((prev) => {
      const curr = [...(prev.materiais || [])];
      curr.splice(idx, 1);
      return { ...prev, materiais: curr };
    });
  };

  const calcularTotalMateriais = () => {
    return (formData.materiais || []).reduce(
      (acc, m) => acc + Number(m.preco || 0) * Number(m.quantidade || 0),
      0
    );
  };

  const calcularTotalGeral = () => {
    const valorServico = parseFloat(formData.valorServico) || 0;
    const valorMateriais = (formData.materiais || []).reduce(
      (acc, m) => acc + m.preco * m.quantidade,
      0
    );
    return valorServico + valorMateriais;
  };
  
  const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("🎯 handleSubmit disparado");
  console.log("📁 Valor atual de file:", file);
  console.log("📋 formData atual:", formData);

  try {
    // 🔹 1) Se houver arquivo, processa upload e ignora validações de campos
    if (file) {
      console.log("📂 Entrou no bloco de upload de arquivo");
      const formDataFile = new FormData();
      formDataFile.append("file", file);
    
      console.log("📤 Enviando arquivo para upload...");
      const uploadRes = await fetch(`${API_URL}/api/material/upload`, {
        method: "POST",
        body: formDataFile,
      });
    
      if (!uploadRes.ok) {
        throw new Error("Falha no upload do arquivo");
      }
    
      const result = await uploadRes.json();
      console.log("✅ Upload concluído com sucesso:", result);
    
      setMensagem({
        tipo: "sucesso",
        texto: `Arquivo importado com sucesso! ${result.count || ""} materiais adicionados.`,
      });
    
      // ✅ Aguarda 2 segundos antes de fechar automaticamente
      setTimeout(() => {
        console.log("⏳ Fechando offcanvas automaticamente...");
    
        const offcanvasElement = document.querySelector(".offcanvas.show");
        if (offcanvasElement) {
          const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
          if (bsOffcanvas) {
            bsOffcanvas.hide();
            console.log("✅ Offcanvas fechado!");
          }
        }
    
        // 🔹 Remove backdrop manualmente
        const backdrop = document.querySelector(".offcanvas-backdrop");
        if (backdrop) {
          backdrop.remove();
          console.log("🧹 Backdrop removido.");
        }
    
        // 🔹 Restaura body e limpa estados
        document.body.classList.remove("offcanvas-open");
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
    
        setMensagem({ tipo: "", texto: "" });
        setFile(null);
        setFormData({});
        if (onCadastroSucesso) onCadastroSucesso();
        if (onClose) onClose();
      }, 1000);
    
      return;
    }

    
    // 🔹 2) Validação dos campos obrigatórios (somente se não houver upload)
    for (let campo of campos) {
      if (campo.required && !formData[campo.nome]) {
        alert(`O campo "${campo.label}" é obrigatório!`);
        return;
      }
    }

    // 🔹 3) Monta payload conforme o endpoint
    let payload = {};

    if (endpoint.includes("/servico")) {
      payload = {
        cliente: { id: formData.cliente_id },
        tecnico: { id: formData.tecnico?.id },
        status: formData.status || 1,
        descricaoServico: formData.descricaoServico,
        horaChegada: formData.horaChegada,
        horaSaida: formData.horaSaida,
        data: formData.data,
        kilometragem: parseInt(formData.kilometragem) || 0,
        valorServico: parseFloat(formData.valorServico) || 0,
        valorMateriais: calcularTotalMateriais(),
      };
      console.log("👉 Payload de SERVIÇO:", payload);
    } else if (endpoint.includes("/material") && !file) {
      payload = {
        descricao: formData.descricao,
        marca: formData.marca || "",
        preco: parseFloat(formData.preco) || 0,
        incompleto: !(
          formData.marca &&
          formData.marca.trim() !== "" &&
          formData.preco &&
          formData.preco > 0
        ),
      };
      console.log("👉 Payload de MATERIAL:", payload);
    } else {
      payload = { ...formData };
      console.log("👉 Payload GENÉRICO:", payload);
    }

    // 🔹 4) Cria ou atualiza no backend
    const url = editingId ? `${endpoint}/${editingId}` : endpoint;
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Erro ao salvar: ${errText}`);
    }

    const resultadoSalvo = await res.json();
    console.log("✅ Registro salvo com sucesso:", resultadoSalvo);

    // 🔹 5) Lógica adicional — sincronização de materiais do serviço
    if (endpoint.includes("/servico") && formData.materiais?.length > 0) {
      // 🧹 Remove materiais antigos se estiver editando
      if (editingId) {
        console.log("🧹 Removendo materiais antigos do serviço:", editingId);
        const resMateriais = await fetch(
          `${API_URL}/api/materialpedido/servico/${editingId}`
        );
        if (resMateriais.ok) {
          const antigos = await resMateriais.json();
          for (let mat of antigos) {
            await fetch(`${API_URL}/api/materialpedido/${mat.id}`, {
              method: "DELETE",
            });
          }
          console.log(`✅ ${antigos.length} materiais antigos removidos`);
        }
      }

      // 🔄 Recria vínculos atualizados
      for (let m of formData.materiais) {
        let materialId = m.id;

        // Se for material pendente, cria automaticamente
        if (m._status === "pendente") {
          const resMat = await fetch(`${API_URL}/api/material`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              descricao: m.descricao,
              preco: m.preco || 0.01,
              marca: "Pendente",
              incompleto: true,
            }),
          });

          const criado = await resMat.json();
          materialId = criado.id;
        }

        await fetch(`${API_URL}/api/materialpedido`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            servico_id: editingId || resultadoSalvo.id,
            cliente_id: formData.cliente_id,
            materiais_id: materialId,
            quantidade: m.quantidade,
            precoUnitario: m.preco || 0,
          }),
        });
      }
    }

    // 🔹 6) Mensagem de sucesso + fechamento
    setMensagem({
      tipo: "sucesso",
      texto: editingId
        ? `${titulo.replace("Cadastro de ", "")} atualizado com sucesso!`
        : `${titulo.replace("Cadastro de ", "")} cadastrado com sucesso!`,
    });

    setTimeout(() => {
      const offcanvasElement = document.getElementById("cadastroOffcanvas");
      if (offcanvasElement) {
        const offcanvas = window.bootstrap.Offcanvas.getInstance(offcanvasElement);
        if (offcanvas) offcanvas.hide();
      }

      const backdrop = document.querySelector(".offcanvas-backdrop");
      if (backdrop) backdrop.remove();

      document.body.classList.remove("offcanvas-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";

      setMensagem({ tipo: "", texto: "" });
      if (onCadastroSucesso) onCadastroSucesso();
      if (onClose) onClose();
      setFormData({});
    }, 2000);
  } catch (err) {
    console.error("❌ Erro no cadastro:", err);
    alert(err.message || "Erro ao salvar. Verifique os dados.");
  }
};

  
  return (
    <div
      className="offcanvas offcanvas-end"
      tabIndex="-1"
      id="cadastroOffcanvas"
      aria-labelledby="cadastroOffcanvasLabel"
    >
      <div className="offcanvas-header">
        <h5 className="offcanvas-title" id="cadastroOffcanvasLabel">
        {editingId ? `Editar ${titulo.replace('Cadastro de ', '')}` : titulo}
        </h5>
        <button
          type="button"
          className="btn-fechar"
          data-bs-dismiss="offcanvas"
          onClick={onClose}
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
      <div className="offcanvas-body">
        <form className="cadastro-form" onSubmit={handleSubmit}>
          {campos.map((campo, index) => (
            <div key={index} className="form-field-group">
              <label htmlFor={campo.nome} className="form-label">
                {campo.label} {campo.required && "*"}
              </label>

              {campo.nome === "CPF" ? (
                <IMaskInput
                  mask="000.000.000-00"
                  value={formData[campo.nome] || ""}
                  onAccept={(valor) => handleChange(campo.nome, valor)}
                  id={campo.nome}
                  name={campo.nome}
                  className="form-control"
                  required={!file && campo.required}
                  placeholder="000.000.000-00"
                />
              ) : campo.nome === "contato" ? (
                <IMaskInput
                  mask="(00) 00000-0000"
                  value={formData[campo.nome] || ""}
                  onAccept={(valor) => handleChange(campo.nome, valor)}
                  id={campo.nome}
                  name={campo.nome}
                  className="form-control"
                  placeholder="(00) 00000-0000"
                />
              ) : campo.nome === "CNPJ" ? (
                <IMaskInput
                  mask="00.000.000/0001-00"
                  value={formData[campo.nome] || ""}
                  onAccept={(valor) => handleChange(campo.nome, valor)}
                  id={campo.nome}
                  name={campo.nome}
                  className="form-control"
                  placeholder="00.000.000/0001-00"
                />
              ) : campo.tipo === "especial" && campo.nome === "nome" ? (
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="form-control"
                    value={formData[campo.nome] || ""}
                    onChange={(e) => {
                      handleChange(campo.nome, e.target.value);
                      buscarCliente(e.target.value); // 🔹 dispara a busca
                    }}
                    placeholder="Digite o nome do cliente"
                  />
                  {carregandoClientes && <div>Carregando...</div>}
                  {clientesSugeridos.length > 0 && (
                    <ul
                      style={{
                        position: "absolute",
                        zIndex: 10,
                        background: "white",
                        border: "1px solid #ccc",
                        width: "100%",
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                      }}
                    >
                      {clientesSugeridos.map((c) => (
                        <li
                          key={c.id}
                          style={{ padding: "8px", cursor: "pointer" }}
                          onClick={() => selecionarCliente(c)}
                        >
                          {c.nome} - {c.empresa}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : campo.tipo === "especial" && campo.nome === "tecnico" ? (
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.tecnico?.nome || ""}
                    onChange={(e) => {
                      handleChange("tecnico", { nome: e.target.value }); 
                      buscarTecnico(e.target.value);
                    }}
                    placeholder="Digite o nome do técnico"
                  />
                  {carregandoTecnicos && <div>Carregando...</div>}
                  {tecnicosSugeridos.length > 0 && (
                    <ul
                      style={{
                        position: "absolute",
                        zIndex: 10,
                        background: "white",
                        border: "1px solid #ccc",
                        width: "100%",
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                      }}
                    >
                      {tecnicosSugeridos.map((t) => (
                        <li
                          key={t.id}
                          style={{ padding: "8px", cursor: "pointer" }}
                          onClick={() => selecionarTecnico(t)}
                        >
                          {t.nome}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : campo.tipo === "textarea" ? ( 
                <textarea 
                  className="form-control" 
                  rows={5} 
                  style={{ minHeight: "120px", resize: "vertical" }} 
                  value={formData[campo.nome] || ""} 
                  onChange={(e) => handleChange(campo.nome, e.target.value)} 
                  placeholder="Descreva o serviço..." />  
              ) : campo.tipo === "hora" ? ( 
                <input type="time" 
                  className="form-control" 
                  value={formData[campo.nome] || ""} 
                  onChange={(e) => handleChange(campo.nome, e.target.value)} /> 
              ) : campo.tipo === "data" ? ( 
                <input type="date" 
                  className="form-control" 
                  value={formData[campo.nome] || ""} 
                  onChange={(e) => handleChange(campo.nome, e.target.value)} /> 
              ) : campo.tipo === "status" ? ( 
                <div>
                  <select
                    id="status"
                    className="form-control"
                    value={formData.status || ""}
                    onChange={(e) => handleChange("status", parseInt(e.target.value))}
                    required
                  >
                    <option value="">Selecione o status</option>
                    {[
                      { id: 1, descricao: "Concluído" },
                      { id: 2, descricao: "Em andamento" },
                      { id: 3, descricao: "Em aberto" },
                    ].map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.descricao}
                      </option>
                    ))}
                  </select>
                </div> 
              ) : campo.tipo === "materiais" ? (
                <div className="materiais-fieldlist" style={{ position: "relative" }}>
                  <div className="d-flex gap-2 mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Busque um material"
                      value={materialBusca}
                      onChange={(e) => {
                        const v = e.target.value;
                        setMaterialBusca(v);
                        setSelectedMaterial(null);
                        fetchMateriaisSugestao(v);
                      }}
                    />
                    <input
                      type="number"
                      min={1}
                      className="form-control"
                      style={{ width: "100px" }}
                      placeholder="Qtd"
                      value={materialQuantidade || ""}
                      onChange={(e) => setMaterialQuantidade(parseInt(e.target.value || 1))}
                    />
                    
                    <button
                      type="button"
                      className="material-btn add"
                      onClick={addOrMergeMaterial}
                    >
                      <AiFillPlusCircle className="icon" />
                    </button>
                  </div>
                  
                  {/* Lista de sugestões acoplada ao input */}
                  {materiaisSugeridos.length > 0 && (
                      <ul
                        style={{
                          position: "absolute",
                          zIndex: 10,
                          background: "white",
                          border: "1px solid #ccc",
                          width: "100%",
                          maxHeight: "150px", // 🔹 limita altura
                          overflowY: "auto",  // 🔹 adiciona scroll se houver muitos itens
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                        }}
                      >
                        {materiaisSugeridos.map((m) => (
                          <li
                            key={m.id}
                            style={{ padding: "8px", cursor: "pointer" }}
                            onClick={() => handleMaterialSuggestionClick(m)}
                            role="button"
                          >
                            {m.descricao} - R$ {m.preco.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    )}    
                  {/* Lista de materiais adicionados */}
                  {formData.materiais?.length > 0 && (
                    <table className="table table-sm mt-2">
                      <thead>
                        <tr>
                          <th>Material</th>
                          <th>Qtd</th>
                          <th>Preço</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.materiais.map((m, idx) => (
                          <tr key={m._tempId || m.id} className={m._status === 'pendente' ? 'table-warning' : ''}>
                            <td>{m.descricao}
                            {m._status === 'pendente' && (
                              <span className="badge bg-warning ms-2" title="Material não cadastrado">
                                Novo
                              </span>
                            )}</td>
                            <td>
                              <input
                                type="number"
                                min={1}
                                className="form-control"
                                style={{ width: "80px" }}
                                value={m.quantidade}
                                onChange={(e) =>
                                  setFormData((prev) => {
                                    const newList = [...prev.materiais];
                                    newList[idx].quantidade = parseInt(e.target.value);
                                    return { ...prev, materiais: newList };
                                  })
                                }
                              />
                            </td>
                            <td>{m._precoPendente ? (
                              <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                style={{ width: "100px" }}
                                placeholder="Preço"
                                value={m.preco || ""}
                                onChange={(e) =>
                                  setFormData((prev) => {
                                    const newList = [...prev.materiais];
                                    newList[idx].preco = parseFloat(e.target.value) || 0;
                                    newList[idx]._precoPendente = false;
                                    return { ...prev, materiais: newList };
                                  })
                                }
                              />
                            ) : (
                              `R$ ${m.preco.toFixed(2)}`
                            )}</td>
                            <td>
                              <button
                                type="button"
                                className="material-btn remove"
                                onClick={() => removeMaterialAt(idx)}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Total dos materiais */}
                  <div className="mt-2">
                    <strong>Total Materiais:</strong>{" "}
                    R$ {calcularTotalMateriais().toFixed(2)}
                  </div>
                </div>
              ) : campo.nome === "total" ? (
                <div className="mt-2">
                  <input
                    type="text"
                    className="form-control"
                    value={`R$ ${calcularTotalGeral().toFixed(2)}`}
                    readOnly
                    style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}
                  />
                </div>
              ) : (
                <input
                  type={campo.type || "text"}
                  id={campo.nome}
                  name={campo.nome}
                  value={formData[campo.nome] || ""}
                  onChange={(e) => handleChange(campo.nome, e.target.value, e)}
                  className="form-control"
                  required={!file && campo.required}
                />
              )}
            </div>
          ))}

          {camposExtras.map((extra, idx) => (
            <div key={idx} className="form-field-group">
              <label className="form-label">{extra.label}</label>
              <input
                type={extra.tipo}
                name={extra.nome}
                accept={extra.accept}
                onChange={(e) => {
                  if (extra.tipo === "file") {
                    const arquivoSelecionado = e.target.files?.[0];
                    if (arquivoSelecionado) {
                      console.log("📄 Arquivo selecionado:", arquivoSelecionado.name);
                      setFile(arquivoSelecionado);
                      handleFileUpload(arquivoSelecionado); // 🚀 upload automático
                    }
                  } else {
                    handleChange(extra.nome, e.target.value, e);
                  }
                }}
              />
            </div>
          ))}
          
          {/* Mensagem de feedback */}
          {mensagem.texto && (
              <div className={`alert ${mensagem.tipo === 'sucesso' ? 'alert-success' : 'alert-danger'} mt-3`}>
                {mensagem.texto}
              </div>
          )}

          <button type="submit" className="btn-salvar">
            {editingId ? "Atualizar" : "Salvar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CadastroForm;
