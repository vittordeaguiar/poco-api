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
    <div className="auth">
      <div className="auth-header">
        <ThemeToggle />
      </div>
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">poco</p>
        <h2>Entrar</h2>
        <p className="muted">Use sua API key para continuar.</p>
        <label className="field">
          <span>API Key</span>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="primary full" type="submit" disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
};
