import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken } from "../lib/auth";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/houses", label: "Casas" },
  { to: "/late", label: "Atrasos" },
  { to: "/well", label: "Poço" }
];

export const AppLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">poco</p>
          <h1>Painel</h1>
        </div>
        <button className="link button-link" onClick={handleLogout}>
          Sair
        </button>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <nav className="bottombar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
            end={item.to === "/"}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
