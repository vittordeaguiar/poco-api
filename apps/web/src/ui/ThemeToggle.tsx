import { useTheme } from "../lib/theme";

type ThemeToggleProps = {
  compact?: boolean;
};

export const ThemeToggle = ({ compact }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "dark" ? "Escuro" : "Claro";

  return (
    <button
      type="button"
      className={compact ? "theme-toggle compact" : "theme-toggle"}
      onClick={toggleTheme}
      aria-label={`Alternar tema. Atual: ${label}`}
    >
      <span className="theme-toggle__icon" aria-hidden="true" />
      <span className="theme-toggle__text">{label}</span>
    </button>
  );
};
