import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { setToken } from "../lib/auth";
import { ThemeToggle } from "../ui/ThemeToggle";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const value = password.trim();
    if (!value) {
      setError("Informe sua senha para continuar.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        auth: false,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password: value })
      });

      const token =
        typeof response?.data?.token === "string"
          ? response.data.token
          : typeof response?.token === "string"
            ? response.token
            : "";

      if (!token) {
        throw new Error("Resposta inválida do servidor.");
      }

      setToken(token);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao autenticar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center px-6 py-10">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <form
        className="grid w-full max-w-[360px] gap-2 rounded-modal border border-border bg-bg-strong p-8 shadow-card"
        onSubmit={handleSubmit}
      >
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-muted">
          poco
        </p>
        <h2 className="text-[1.4rem] font-title">Entrar</h2>
        <p className="text-sm text-muted">Use sua API key para continuar.</p>
        <label className="mt-4 grid gap-2 text-sm">
          <span>API Key</span>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="rounded-2xl border border-border bg-bg-strong px-3.5 py-2.5 text-base text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          className="mt-2 w-full rounded-pill bg-accent px-5 py-2.5 font-bold text-accent-contrast shadow-soft transition active:translate-y-px active:shadow-none"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
};
