import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { IMaskInput } from "react-imask"; // máscara segura
import { AiFillPlusCircle } from 'react-icons/ai';
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
  }, [initialData]);

  const handleChange = (nome, valor, e) => {
    if (e?.target?.type === "file") {
      // arquivo
      setFile(e.target.files[0]);
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
      const res = await fetch(`http://localhost:3003/api/cliente/search?termo=${nome}`);
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
      const res = await fetch(`http://localhost:3003/api/tecnico/search?termo=${nome}`);
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
        `http://localhost:3003/api/material/search?termo=${encodeURIComponent(
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
    
    try {
      // 🔹 1) Validação dos campos obrigatórios
      for (let campo of campos) {
        if (campo.required && !formData[campo.nome]) {
          alert(`O campo "${campo.label}" é obrigatório!`);
          return;
        }
      }
  
      // 🔹 2) MONTA PAYLOAD DINÂMICO baseado no endpoint
      let payload = {};
      
      if (endpoint.includes('/servico')) {
        // 🔹 PAYLOAD PARA SERVIÇO
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
        
        console.log("👉 Enviando payload de SERVIÇO:", payload);
        
      } else if (endpoint.includes('/material')) {
        // 🔹 PAYLOAD PARA MATERIAL
        payload = {
          descricao: formData.descricao,
          marca: formData.marca || "",
          preco: parseFloat(formData.preco) || 0,
          // 🔹 Se estiver editando um material incompleto e agora tem dados, marca como completo
          incompleto: !(formData.marca && formData.marca.trim() !== "" && formData.preco && formData.preco > 0)
        };
        
        console.log("👉 Enviando payload de MATERIAL:", payload);
        
      } else {
        // 🔹 PAYLOAD GENÉRICO para outros endpoints (cliente, tecnico, etc)
        payload = { ...formData };
        console.log("👉 Enviando payload GENÉRICO:", payload);
      }
  
      // 🔹 3) Envia para o backend (cria ou atualiza)
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
      console.log("✅ Salvo com sucesso:", resultadoSalvo);
  
      // 🔹 4) LÓGICA ESPECÍFICA PARA SERVIÇOS (materiais)
      if (endpoint.includes('/servico') && formData.materiais?.length > 0) {
        // 🧹 Remove materiais antigos (se editando)
        if (editingId) {
          console.log("🧹 Removendo materiais antigos do serviço:", editingId);
          const resMateriais = await fetch(`http://localhost:3003/api/materialpedido/servico/${editingId}`);
          if (resMateriais.ok) {
            const materiaisAntigos = await resMateriais.json();
            for (let material of materiaisAntigos) {
              await fetch(`http://localhost:3003/api/materialpedido/${material.id}`, {
                method: "DELETE",
              });
            }
            console.log(`✅ ${materiaisAntigos.length} materiais antigos removidos`);
          }
        }
  
        // 🔄 SINCRONIZA MATERIAIS PENDENTES
        const materiaisParaSalvar = [];
        const materiaisCriados = [];
        
        for (let m of formData.materiais) {
          let materialId = m.id;
          let materialCriadoComSucesso = true;
          
          // Se é material pendente, cria no banco (mesmo incompleto)
          if (m._status === 'pendente') {
            console.log("🔄 Criando material pendente:", m.descricao);
            
            try {
              const resMaterial = await fetch("http://localhost:3003/api/material", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  descricao: m.descricao,
                  preco: m.preco || 0.01,
                  marca: "Pendente",
                  incompleto: true
                })
              });
              
              if (!resMaterial.ok) {
                const errorText = await resMaterial.text();
                console.error("❌ Erro ao criar material:", errorText);
                materialCriadoComSucesso = false;
              } else {
                const materialCriado = await resMaterial.json();
                materialId = materialCriado.id;
                materiaisCriados.push(m.descricao);
                console.log("✅ Material criado (incompleto):", materialCriado);
              }
            } catch (error) {
              console.error("❌ Erro na criação do material:", error);
              materialCriadoComSucesso = false;
            }
          }
          
          // 🔹 SÓ adiciona à lista se o material foi criado com sucesso
          if (materialCriadoComSucesso && !materialId.toString().includes('pendente_')) {
            materiaisParaSalvar.push({
              servico_id: editingId || resultadoSalvo.id,
              cliente_id: formData.cliente_id,
              materiais_id: materialId,
              quantidade: m.quantidade
            });
          }
        }
  
        // 🧩 Insere os materiais no MaterialPedido
        for (let material of materiaisParaSalvar) {
          await fetch("http://localhost:3003/api/materialpedido", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(material)
          });
        }
  
        // Mensagem sobre materiais criados
        if (materiaisCriados.length > 0) {
          setMensagem(prev => ({
            ...prev,
            texto: `${prev.texto}\n• ${materiaisCriados.length} material(ais) criado(s) e marcado(s) como pendente.`
          }));
        }
      }
  
      // 🔹 5) Callbacks de sucesso
      setMensagem({ 
        tipo: 'sucesso', 
        texto: editingId ? `${titulo.replace('Cadastro de ', '')} atualizado com sucesso!` : `${titulo.replace('Cadastro de ', '')} cadastrado com sucesso!` 
      });
  
      // 🔹 MOSTRA a mensagem por 2 segundos ANTES de fechar
      setTimeout(() => {
        // Fecha o offcanvas programaticamente
        const offcanvasElement = document.getElementById('cadastroOffcanvas');
        if (offcanvasElement) {
          const offcanvas = window.bootstrap.Offcanvas.getInstance(offcanvasElement);
          if (offcanvas) {
            offcanvas.hide();
          }
        }
  
        // 🔹 REMOVE MANUALMENTE O BACKDROP ESCURO
        const backdrop = document.querySelector('.offcanvas-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        
        // 🔹 REMOVE A CLASSE DO BODY QUE CAUSA O OVERFLOW HIDDEN
        document.body.classList.remove('offcanvas-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
  
        // Limpa a mensagem
        setMensagem({ tipo: '', texto: '' });
        
        // Callbacks
        if (onCadastroSucesso) onCadastroSucesso();
        if (onClose) onClose();
  
        setFormData({});
      }, 2000);
  
    } catch (err) {
      console.error("Erro no cadastro:", err);
      alert(err.message || "Erro ao salvar. Verifique os dados.");
    }
  };
  
  return (
    <div
      className="offcanvas offcanvas-end"
      tabIndex="-1"
      id="cadastroOffcanvas"
    >
      <div className="offcanvas-header">
        <h5 className="offcanvas-title">
        {editingId ? `Editar ${titulo.replace('Cadastro de ', '')}` : titulo}
        </h5>
        <button
          type="button"
          className="btn-fechar"
          data-bs-dismiss="offcanvas"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div className="offcanvas-body">
        <form className="cadastro-form" onSubmit={handleSubmit}>
          {campos.map((campo, index) => (
            <div key={index}>
              <label htmlFor={campo.nome}>
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
            <div key={idx}>
              <label>{extra.label}</label>
              <input
                type={extra.tipo}
                name={extra.nome || `extra-${idx}`}
                accept={extra.accept}
                onChange={(e) => handleChange(extra.nome || `extra-${idx}`, e.target.files[0], e)}
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
