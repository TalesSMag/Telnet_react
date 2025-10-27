import Nav from "../../components/Nav";

function Home({ usuario, onLogout }) {
  return (
    <Nav usuario={usuario} onLogout={onLogout}>
      <h1>Bem-vindo, {usuario?.nome}</h1>
      <p>Esta é a página inicial do sistema.</p>
    </Nav>
  );
}

export default Home;
