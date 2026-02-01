import { Link, useParams } from "react-router-dom";

export const HouseDetailPage = () => {
  const { id } = useParams();

  return (
    <section className="stack">
      <header className="section-header">
        <div>
          <h2>Casa</h2>
          <p className="muted">Detalhes da casa {id}</p>
        </div>
        <Link className="link" to="/houses">
          Voltar
        </Link>
      </header>

      <div className="card">
        <p className="muted">Informações principais</p>
        <div className="grid">
          <div>
            <span className="metric-label">Endereço</span>
            <strong className="metric-value">Rua Exemplo, 123</strong>
          </div>
          <div>
            <span className="metric-label">Status</span>
            <strong className="metric-value">Ativa</strong>
          </div>
        </div>
      </div>
    </section>
  );
};
