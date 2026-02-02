import { Droplets, Sparkles } from "lucide-react";

export const WellPage = () => {
  return (
    <section className="grid gap-5">
      <h2 className="inline-flex items-center gap-2 text-[1.4rem] font-title">
        <Droplets className="h-5 w-5 text-accent" />
        Eventos do poço
      </h2>
      <div className="rounded-card border border-border bg-bg-strong p-5 shadow-card">
        <p className="inline-flex items-center gap-2 text-sm text-muted">
          <Sparkles className="h-4 w-4 text-accent" />
          Sem eventos recentes.
        </p>
      </div>
    </section>
  );
};
