import { KeyRound, LogIn } from "lucide-react";
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
        className="card grid w-full max-w-[360px] gap-3 rounded-modal p-8"
        onSubmit={handleSubmit}
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-muted">
          Aguiar
        </p>
        <h2 className="inline-flex items-center gap-2 text-[1.3rem] font-title">
          <LogIn className="h-5 w-5 text-accent" />
          Entrar
        </h2>
        <p className="text-sm text-muted">Use sua API key para continuar.</p>
        <label className="mt-4 grid gap-2 text-sm">
          <span className="inline-flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-accent" />
            API Key
          </span>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="form-input"
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          className="btn btn-primary btn-lg mt-2 w-full"
          type="submit"
          disabled={isLoading}
        >
          <LogIn className="h-4 w-4" />
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
};
