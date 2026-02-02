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
      className={[
        "inline-flex items-center gap-2 rounded-pill border border-border bg-bg-strong text-xs font-semibold text-text shadow-soft transition active:translate-y-px active:shadow-none",
        compact ? "px-2.5 py-1" : "px-3 py-1.5"
      ].join(" ")}
      onClick={toggleTheme}
      aria-label={`Alternar tema. Atual: ${label}`}
    >
      <span
        className="relative h-[18px] w-[18px] rounded-full bg-[linear-gradient(135deg,var(--accent),#f6c36b)]"
        aria-hidden="true"
      >
        <span className="absolute inset-1 rounded-full bg-bg-strong opacity-80" />
      </span>
      <span className="tracking-[0.02em]">{label}</span>
    </button>
  );
};
