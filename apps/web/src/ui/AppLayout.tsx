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
    <div className="app-shell relative flex min-h-screen flex-col overflow-x-hidden">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-[var(--topbar-bg)] px-6 pb-3 pt-5 backdrop-blur-lg">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-muted">
            poco
          </p>
          <h1 className="mt-1 text-[1.7rem] font-title">Painel</h1>
        </div>
        <div className="inline-flex items-center gap-2.5">
          <ThemeToggle compact />
          <button
            className="text-sm font-semibold text-text transition hover:opacity-80"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-6 pb-24 pt-4">
        <Outlet />
      </main>

      <nav className="scrollbar-hide sticky bottom-0 z-20 mx-4 mb-4 grid grid-flow-col auto-cols-fr gap-1.5 overflow-x-auto rounded-2xl border border-border bg-[var(--bottombar-bg)] px-3 py-2 shadow-soft backdrop-blur-lg">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[14px] px-2.5 py-2 text-[0.78rem] font-medium text-muted transition",
                isActive
                  ? "bg-accent text-accent-contrast shadow-[0_10px_24px_rgba(15,118,110,0.25)] -translate-y-0.5"
                  : "hover:text-text"
              ].join(" ")
            }
            end={item.to === "/"}
          >
            <span>{item.label}</span>
            {item.to === "/sync" && queueCount > 0 ? (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-contrast px-1.5 text-[0.7rem] font-bold text-accent">
                {queueCount}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
