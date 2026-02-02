import { Home, Map } from "lucide-react";
import { Link } from "react-router-dom";

export const NotFoundPage = () => {
  return (
    <section className="grid gap-3">
      <h2 className="inline-flex items-center gap-2 text-[1.4rem] font-title">
        <Map className="h-5 w-5 text-accent" />
        Página não encontrada
      </h2>
      <p className="text-sm text-muted">A página que você procura não existe.</p>
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-text" to="/">
        <Home className="h-4 w-4" />
        Voltar para o dashboard
      </Link>
    </section>
  );
};
