import { Link } from "react-router-dom";

export const NotFoundPage = () => {
  return (
    <section className="grid gap-3">
      <h2 className="text-[1.4rem] font-title">Página não encontrada</h2>
      <p className="text-sm text-muted">A página que você procura não existe.</p>
      <Link className="text-sm font-semibold text-text" to="/">
        Voltar para o dashboard
      </Link>
    </section>
  );
};
