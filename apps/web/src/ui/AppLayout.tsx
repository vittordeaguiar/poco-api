import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken } from "../lib/auth";
import { getQueueCount, subscribeQueue } from "../lib/offlineQueue";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/houses", label: "Casas" },
  { to: "/pending", label: "Pendências" },
  { to: "/audit", label: "Audit" },
  { to: "/sync", label: "Sync" },
  { to: "/late", label: "Atrasos" },
  { to: "/well", label: "Poço" }
];

export const AppLayout = () => {
  const navigate = useNavigate();
  const [queueCount, setQueueCount] = useState(getQueueCount());

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const handleChange = () => setQueueCount(getQueueCount());
    const unsubscribe = subscribeQueue(handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">poco</p>
          <h1>Painel</h1>
        </div>
        <div className="topbar-actions">
          <ThemeToggle compact />
          <button className="link button-link" onClick={handleLogout}>
            Sair
          </button>
        </div>
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
            <span>{item.label}</span>
            {item.to === "/sync" && queueCount > 0 ? (
              <span className="badge">{queueCount}</span>
            ) : null}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
