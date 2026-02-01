import { Link } from "react-router-dom";

export const NotFoundPage = () => {
  return (
    <section className="stack">
      <h2>Página não encontrada</h2>
      <p className="muted">A página que você procura não existe.</p>
      <Link className="link" to="/">
        Voltar para o dashboard
      </Link>
    </section>
  );
};
