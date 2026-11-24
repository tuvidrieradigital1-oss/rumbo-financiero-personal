import { createFileRoute } from "@tanstack/react-router";
import { useFinance, ars, monthLabel } from "@/lib/finance";
import { ranking, summarize } from "@/lib/analysis";
import { PageHeader, Panel } from "@/components/ui-bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ranking")({
  head: () => ({ meta: [
    { title: "Ranking de gastos e ingresos | Mis Finanzas" },
    { name: "description", content: "Dónde se va tu dinero y en qué meses ingresás más." },
    { property: "og:title", content: "Ranking de gastos e ingresos | Mis Finanzas" },
    { property: "og:description", content: "Dónde se va tu dinero y en qué meses ingresás más." },
  ] }),
  component: Ranking,
});

function Bars({ items, tone }: { items: { name: string; value: number; pct: number }[]; tone: "bad" | "good" }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">Sin datos todavía.</p>;
  return (
    <ol className="space-y-3">
      {items.map((it, i) => (
        <li key={it.name}>
          <div className="flex items-baseline justify-between text-sm"><span className="font-medium"><span className="num mr-2 text-muted-foreground">#{i + 1}</span>{it.name}</span><span className="num font-bold">{ars(it.value)} <span className="text-xs font-normal text-muted-foreground">{it.pct.toFixed(0)}%</span></span></div>
          <div className="mt-1 h-2 rounded-full bg-muted"><div className={cn("h-2 rounded-full", tone === "bad" ? "bg-destructive" : "bg-success")} style={{ width: `${it.pct}%` }} /></div>
        </li>
      ))}
    </ol>
  );
}

function Ranking() {
  const s = useFinance();
  const months = summarize(s.entries);
  const top = (key: "income" | "expense") => {
    const total = months.reduce((t, m) => t + m[key], 0);
    return [...months].sort((a, b) => b[key] - a[key]).map((m) => ({ name: monthLabel(m.month), value: m[key], pct: total ? (m[key] / total) * 100 : 0 }));
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Ranking" subtitle="A dónde va tu dinero y cuándo entra más." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Dónde se va el dinero"><Bars items={ranking(s.entries, "gasto")} tone="bad" /></Panel>
        <Panel title="De dónde entra el dinero"><Bars items={ranking(s.entries, "ingreso")} tone="good" /></Panel>
        <Panel title="Meses con más ingresos"><Bars items={top("income")} tone="good" /></Panel>
        <Panel title="Meses con más gastos"><Bars items={top("expense")} tone="bad" /></Panel>
      </div>
    </div>
  );
}
