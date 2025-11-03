import { useState } from "react";
import axios from "axios";
import API_URL from "@/config/api";

export default function Login({ onLoginSuccess }) {
  console.log("NEXT_PUBLIC_API_URL =", process.env.NEXT_PUBLIC_API_URL); // ✅ debug
  console.log("API_URL importado =", API_URL); // ✅ debug do arquivo de config
  
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    try {
      const res = await axios.post(
      `${API_URL}/auth/login`,
        { usuario, senha },
        { withCredentials: true }
      );

      if (res.status === 200) {
        onLoginSuccess(res.data); // Atualiza o estado no Main.jsx
      }
    } catch (error) {
      setErro("Usuário ou senha inválidos!");
    }
  };

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
      <div className="card p-4 shadow" style={{ width: "400px" }}>
        <h3 className="text-center mb-3">Telnet Login</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Usuário (nome técnico)</label>
            <input
              type="text"
              className="form-control"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Senha (CPF)</label>
            <input
              type="password"
              className="form-control"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          {erro && <div className="alert alert-danger">{erro}</div>}

          <button type="submit" className="btn btn-dark w-100">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

