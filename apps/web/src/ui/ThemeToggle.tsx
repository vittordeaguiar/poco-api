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
      className={[
        "inline-flex items-center gap-2 rounded-pill border border-border bg-bg-strong text-xs font-semibold text-text shadow-soft transition active:translate-y-px active:shadow-none",
        compact ? "px-2.5 py-1" : "px-3 py-1.5"
      ].join(" ")}
      onClick={toggleTheme}
      aria-label={`Alternar tema. Atual: ${label}`}
    >
      <span
        className="relative flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),#f2b37a)] text-accent-contrast shadow-[0_6px_16px_rgba(216,90,42,0.35)]"
        aria-hidden="true"
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="tracking-[0.02em]">{label}</span>
    </button>
  );
};
