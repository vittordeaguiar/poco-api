export const DashboardPage = () => {
  return (
    <section className="stack">
      <h2>Dashboard</h2>
      <div className="card">
        <p className="muted">Resumo mensal</p>
        <div className="metrics">
          <div>
            <span className="metric-label">Recebido</span>
            <strong className="metric-value">R$ 0,00</strong>
          </div>
          <div>
            <span className="metric-label">Em aberto</span>
            <strong className="metric-value">R$ 0,00</strong>
          </div>
          <div>
            <span className="metric-label">Casas em atraso</span>
            <strong className="metric-value">0</strong>
          </div>
        </div>
      </div>
    </section>
  );
};
