import { Link } from "react-router-dom";

export const HousesPage = () => {
  return (
    <section className="stack">
      <header className="section-header">
        <div>
          <h2>Casas</h2>
          <p className="muted">Busca rápida e status das casas</p>
        </div>
        <button className="primary">Nova casa</button>
      </header>

      <div className="card">
        <div className="list-item">
          <div>
            <strong>Rua Exemplo, 123</strong>
            <p className="muted">Responsável: Maria</p>
          </div>
          <Link className="link" to="/houses/123">
            Ver
          </Link>
        </div>
      </div>
    </section>
  );
};
