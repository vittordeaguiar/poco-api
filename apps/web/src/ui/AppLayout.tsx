import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardCheck,
  Droplets,
  LayoutDashboard,
  LogOut,
  Menu,
  Home,
  RefreshCw,
  Timer,
  X
} from "lucide-react";
import { clearToken } from "../lib/auth";
import { getQueueCount, subscribeQueue } from "../lib/offlineQueue";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/houses", label: "Casas", icon: Home },
  { to: "/pending", label: "Pendências", icon: AlertTriangle },
  { to: "/audit", label: "Audit", icon: ClipboardCheck },
  { to: "/sync", label: "Sync", icon: RefreshCw },
  { to: "/late", label: "Atrasos", icon: Timer },
  { to: "/well", label: "Poço", icon: Droplets }
];

export const AppLayout = () => {
  const navigate = useNavigate();
  const [queueCount, setQueueCount] = useState(getQueueCount());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="app-shell relative flex min-h-screen flex-col overflow-x-hidden">
      <header className="glass-bar sticky top-0 z-20 flex items-center justify-between border-b border-border bg-[var(--topbar-bg)] px-4 pb-4 pt-5 sm:px-6">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-muted">
            Aguiar
          </p>
          <h1 className="mt-1 text-[1.7rem] font-title">Painel</h1>
        </div>
        <div className="inline-flex items-center gap-2.5">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-strong text-text shadow-soft transition hover:opacity-90 sm:hidden"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <ThemeToggle compact />
          <button
            className="inline-flex items-center gap-2 text-sm font-semibold text-text transition hover:opacity-80"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pb-24">
        <Outlet />
      </main>

      <nav className="glass-bar scrollbar-hide sticky bottom-0 z-20 mx-3 mb-3 hidden grid-flow-col auto-cols-fr gap-1.5 overflow-x-auto rounded-2xl bg-[var(--bottombar-bg)] px-2 py-2 sm:grid sm:mx-4 sm:mb-4 sm:px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "inline-flex min-w-[74px] flex-col items-center justify-center gap-1 whitespace-nowrap rounded-[14px] px-2 py-2 text-[0.72rem] font-medium text-muted transition sm:min-w-[96px] sm:flex-row sm:gap-1.5 sm:px-2.5 sm:text-[0.78rem]",
                isActive
                  ? "bg-[linear-gradient(135deg,var(--accent),#f2b37a)] text-accent-contrast shadow-[0_12px_26px_rgba(200,90,42,0.3)] -translate-y-0.5"
                  : "hover:text-text hover:bg-bg-soft"
              ].join(" ")
            }
            end={item.to === "/"}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
            {item.to === "/sync" && queueCount > 0 ? (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-contrast px-1.5 text-[0.7rem] font-bold text-accent">
                {queueCount}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      {isMenuOpen ? (
        <div
          className="fixed inset-0 z-30 bg-[rgba(18,16,14,0.55)] p-4 sm:hidden"
          role="dialog"
          aria-modal="true"
          onClick={closeMenu}
        >
          <div
            className="surface-panel h-full rounded-3xl p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-muted">
                  Navegação
                </p>
                <h2 className="mt-1 text-lg font-title">Menu</h2>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-strong text-text shadow-soft"
                onClick={closeMenu}
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    [
                      "flex items-center justify-between rounded-2xl border border-border bg-bg-strong px-4 py-3 text-sm font-semibold text-text shadow-soft transition",
                      isActive
                        ? "bg-[linear-gradient(135deg,var(--accent),#f2b37a)] text-accent-contrast"
                        : "hover:bg-bg-soft"
                    ].join(" ")
                  }
                  end={item.to === "/"}
                >
                  <span className="inline-flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {item.to === "/sync" && queueCount > 0 ? (
                    <span className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-accent-contrast px-1.5 text-[0.72rem] font-bold text-accent">
                      {queueCount}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>

            <div className="mt-6 grid gap-3">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-pill border border-border bg-bg-strong px-4 py-2 text-sm font-semibold text-text shadow-soft"
                onClick={() => {
                  closeMenu();
                  handleLogout();
                }}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
