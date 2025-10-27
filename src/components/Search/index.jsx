import React, { useState, useEffect, useRef } from "react"; 
import { useNavigate, useLocation } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

function Search() {
  const [termo, setTermo] = useState("");
  const [outrosResultados, setOutrosResultados] = useState(null);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);
  const mountedRef = useRef(false);

  // 🔥 EFFECT para controle de montagem/desmontagem
  useEffect(() => {
    mountedRef.current = true;
    
    // Restaura apenas na PRIMEIRA montagem
    const saved = localStorage.getItem("ultimaBusca");
    if (saved && mountedRef.current) {
      const data = JSON.parse(saved);
      setTermo(data.termo || "");
      setOutrosResultados(data.outros || null);
      console.log("💾 Busca restaurada:", data);
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 🔥 EFFECT para detectar mudanças de página e limpar
  useEffect(() => {
    if (!mountedRef.current) return;

    const currentPath = location.pathname;
    const isPaginaDeBusca = 
      currentPath.includes('/tecnicos') ||
      currentPath.includes('/clientes') ||
      currentPath.includes('/materiais') ||
      currentPath.includes('/servico');
    
    // Se NÃO está numa página de busca, limpa TUDO
    if (!isPaginaDeBusca) {
      console.log("🚪 Saindo da página de busca - limpando tudo");
      limparTudo();
    }
  }, [location.pathname]);

  // 🔥 LIMPAR TUDO - versão robusta
  const limparTudo = () => {
    if (!mountedRef.current) return;
    
    console.log("🧹 LIMPANDO TUDO");
    
    // 1. Limpa timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // 2. Limpa localStorage
    localStorage.removeItem("ultimaBusca");
    
    // 3. Limpa estados
    setTermo("");
    setOutrosResultados(null);
    setMostrarDropdown(false);
  };

  // 🔥 TIMEOUT DE 15 SEGUNDOS
  const iniciarTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    console.log("⏰ Iniciando timeout de 15s");
    timeoutRef.current = setTimeout(() => {
      console.log("⏰ TIMEOUT 15s - limpando");
      limparTudo();
    }, 15000);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!termo.trim()) return;

    try {
      console.log("🔍 Buscando:", termo);
      const res = await fetch(
        `http://localhost:3003/api/search?termo=${encodeURIComponent(termo)}`
      );
      const data = await res.json();

      console.log("📦 Resultados:", data);

      const categoriasComResultados = Object.keys(data).filter(
        cat => data[cat] && data[cat].length > 0
      );

      if (categoriasComResultados.length > 0) {
        const primeiraCategoria = categoriasComResultados[0];
        
        const outros = {};
        categoriasComResultados.forEach((cat) => {
          if (cat !== primeiraCategoria) {
            outros[cat] = data[cat].length;
          }
        });

        const temOutrosResultados = Object.keys(outros).length > 0;

        // 🔥 SALVA NO LOCALSTORAGE APENAS SE TEM MÚLTIPLAS CATEGORIAS
        if (temOutrosResultados) {
          const dadosParaSalvar = {
            termo,
            outros: outros
          };
          localStorage.setItem("ultimaBusca", JSON.stringify(dadosParaSalvar));
        } else {
          // 🔥 CORREÇÃO: Para uma categoria, NÃO salva no localStorage
          localStorage.removeItem("ultimaBusca");
        }

        // 🔥 ATUALIZA ESTADOS
        setOutrosResultados(temOutrosResultados ? outros : null);

        // 🔥 NAVEGA
        navigate(`/${primeiraCategoria}?termo=${encodeURIComponent(termo)}&page=1`);

        // 🔥 CONFIGURA LIMPEZA
        if (categoriasComResultados.length === 1) {
          console.log("📍 1 categoria - limpando em 5s");
          // 🔥 CORREÇÃO: Para uma categoria, limpa após navegação
          setTimeout(() => {
            console.log("🧹 Limpando busca de 1 categoria");
            setTermo("");
            setOutrosResultados(null);
          }, 5000);
        } else {
          console.log("📍 Múltiplas categorias - timeout 15s");
          console.log("📍 Categorias restantes:", Object.keys(outros));
          iniciarTimeout();
        }
        
      } else {
        console.log("❌ Nenhum resultado");
        limparTudo();
        alert("Nenhum resultado encontrado");
      }
    } catch (err) {
      console.error("Erro:", err);
      alert("Erro ao buscar.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // 🔥 FUNÇÃO SIMPLIFICADA PARA IR PARA CATEGORIA
  const irCategoria = (categoria) => {
    console.log("📍 Indo para:", categoria);
    
    // 🔥 FECHA DROPDOWN
    setMostrarDropdown(false);

    // 🔥 PEGA DADOS ATUAIS DO LOCALSTORAGE
    const saved = localStorage.getItem("ultimaBusca");
    if (!saved) {
      navigate(`/${categoria}?termo=${encodeURIComponent(termo)}&page=1`);
      return;
    }

    const data = JSON.parse(saved);
    const termoAtual = data.termo;
    const outrosAtuais = data.outros;

    console.log("📊 Categorias restantes antes:", outrosAtuais ? Object.keys(outrosAtuais) : []);

    // 🔥 VERIFICA SE ESTA É A ÚLTIMA CATEGORIA
    if (outrosAtuais && Object.keys(outrosAtuais).length === 1) {
      // 🔥 SE SÓ RESTAVA ESTA CATEGORIA, LIMPA TUDO
      console.log("🎯 ÚLTIMA CATEGORIA - limpando em 3s");
      
      // 🔥 Remove do localStorage ANTES de navegar
      localStorage.removeItem("ultimaBusca");
      
      // 🔥 Navega
      navigate(`/${categoria}?termo=${encodeURIComponent(termoAtual)}&page=1`);
      
      // 🔥 Limpa estados após navegação
      setTimeout(() => {
        console.log("🧹 Limpando última categoria");
        setTermo("");
        setOutrosResultados(null);
      }, 3000);
    } else {
      // 🔥 SE AINDA TEM MAIS CATEGORIAS, MANTÉM
      console.log("🔄 Ainda há categorias - mantendo busca");
      navigate(`/${categoria}?termo=${encodeURIComponent(termoAtual)}&page=1`);
      iniciarTimeout();
    }
  };

  const totalBadge = outrosResultados
    ? Object.values(outrosResultados).reduce((a, b) => a + b, 0)
    : 0;

  console.log("🔄 Estado VISUAL:", {
    termo: termo || "(vazio)",
    temOutrosResultados: !!outrosResultados,
    totalBadge,
    mostrarDropdown
  });

  return (
    <div className="input-group" style={{ position: "relative" }}>
      <input
        type="text"
        className="form-control"
        placeholder="Pesquisar..."
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="btn-group">
        <button
          type="button"
          className="input-group-text bg-white"
          onClick={() => setMostrarDropdown(prev => !prev)}
          style={{ cursor: "pointer" }}
          aria-haspopup="true"
          aria-expanded={mostrarDropdown}
        >
          <FaSearch />
          {totalBadge > 0 && (
            <span style={{ 
              marginLeft: 6, 
              background: "#d9534f", 
              color: "white", 
              padding: "0 6px", 
              borderRadius: 12, 
              fontSize: 12 
            }}>
              {totalBadge}
            </span>
          )}
        </button>

        {mostrarDropdown && outrosResultados && (
          <ul className="dropdown-menu show" style={{ 
            position: "absolute", 
            right: 0, 
            top: "100%", 
            zIndex: 1000, 
            minWidth: 220, 
            marginTop: 6 
          }}>
            {Object.entries(outrosResultados).map(([categoria, qtd]) => (
              <li key={categoria}>
                <button 
                  type="button" 
                  className="dropdown-item" 
                  style={{ display: "flex", justifyContent: "space-between" }} 
                  onClick={() => irCategoria(categoria)}
                >
                  <span style={{ textTransform: "capitalize" }}>{categoria}</span>
                  <span>{qtd}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Search;