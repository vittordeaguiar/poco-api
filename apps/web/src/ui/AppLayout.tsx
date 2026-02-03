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
  X,
  Users
} from "lucide-react";
import { clearToken } from "../lib/auth";
import { getQueueCount, subscribeQueue } from "../lib/offlineQueue";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/houses", label: "Casas", icon: Home },
  { to: "/people", label: "Responsáveis", icon: Users },
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
    <div className="app-shell flex min-h-screen flex-col overflow-x-hidden">
      <header className="app-bar sticky top-0 z-20 border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-muted">
              Aguiar
            </p>
            <h1 className="mt-1 text-[1.45rem] font-title">Painel</h1>
          </div>
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              className="btn btn-sm sm:hidden"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <ThemeToggle compact />
            <button className="btn btn-ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pb-32">
        <div className="mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </main>

      <div className="fixed bottom-4 left-0 right-0 z-20 hidden sm:flex justify-center px-4">
        <nav className="app-bar scrollbar-hide grid w-full max-w-6xl grid-flow-col auto-cols-fr gap-1.5 overflow-x-auto rounded-card px-2 py-2 sm:px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "inline-flex min-w-[76px] flex-col items-center justify-center gap-1 whitespace-nowrap rounded-xl px-2 py-2 text-[0.72rem] font-medium text-muted transition sm:min-w-[96px] sm:flex-row sm:gap-1.5 sm:px-2.5 sm:text-[0.78rem]",
                  isActive
                    ? "bg-accent-soft text-accent"
                    : "hover:text-text hover:bg-bg-soft"
                ].join(" ")
              }
              end={item.to === "/"}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.to === "/sync" && queueCount > 0 ? (
                <span className="badge bg-bg-strong text-text">
                  {queueCount}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>
      </div>

      {isMenuOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/40 p-4 sm:hidden"
          role="dialog"
          aria-modal="true"
          onClick={closeMenu}
        >
          <div
            className="card h-full rounded-modal p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-muted">
                  Navegação
                </p>
                <h2 className="mt-1 text-lg font-title">Menu</h2>
              </div>
              <button
                type="button"
                className="btn btn-sm"
                onClick={closeMenu}
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
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
                      "flex items-center justify-between rounded-xl border border-border bg-bg-strong px-4 py-3 text-sm font-semibold text-text transition",
                      isActive
                        ? "border-transparent bg-accent-soft text-accent"
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
                    <span className="badge bg-bg-strong text-text">
                      {queueCount}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>

            <div className="mt-6 grid gap-3">
              <button
                className="btn"
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
