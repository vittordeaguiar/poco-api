import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/theme";

type ThemeToggleProps = {
  compact?: boolean;
};

export const ThemeToggle = ({ compact }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "dark" ? "Escuro" : "Claro";
  const Icon = theme === "dark" ? Moon : Sun;

  return (
    <button
      type="button"
      className={["btn", compact ? "btn-sm" : ""].join(" ")}
      onClick={toggleTheme}
      aria-label={`Alternar tema. Atual: ${label}`}
    >
      <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
      <span className="tracking-[0.02em]">{label}</span>
    </button>
  );
};
