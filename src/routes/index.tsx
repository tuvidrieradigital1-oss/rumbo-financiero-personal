import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useFinance, update, ars, usdFmt, currentMonth } from "@/lib/finance";
import { analyze, summarize, goalPlan } from "@/lib/analysis";
import { Panel, Stat, fieldCls, Field } from "@/components/ui-bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Resumen y diagnóstico | Mis Finanzas" },
    { name: "description", content: "Tu situación financiera del mes, salud y alertas de quiebre." },
    { property: "og:title", content: "Resumen y diagnóstico | Mis Finanzas" },
    { property: "og:description", content: "Tu situación financiera del mes, salud y alertas de quiebre." },
  ] }),
  component: Index,
});

function Index() {
  const s = useFinance();
  const months = summarize(s.entries);
  const m = currentMonth();
  const cur = months.find((x) => x.month === m) ?? { income: 0, expense: 0, fixed: 0, variable: 0, balance: 0, month: m };
  const a = analyze(months, s.savingsArs);
  const usdTotal = s.usd.reduce((t, u) => t + u.usd, 0);
  const goalsMonthly = s.goals.reduce((t, g) => t + goalPlan(g).monthly * (g.currency === "USD" ? s.usdRate : 1), 0);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-hero p-6 text-primary-foreground shadow-soft md:p-8">
        <p className="text-sm uppercase tracking-widest opacity-80">Salud financiera</p>
        <div className="mt-2 flex flex-wrap items-end gap-6">
          <p className="num text-6xl font-bold">{a.score}<span className="text-2xl opacity-70">/100</span></p>
          <div className="pb-2">
            <p className="font-display text-2xl">{a.level === "ok" ? "Estable" : a.level === "atencion" ? "Requiere atención" : "Riesgo de quiebre"}</p>
            <p className="opacity-80">Excedente promedio: <span className="num">{ars(a.avgSurplus)}</span>/mes · Colchón: {Number.isFinite(a.runwayMonths) ? a.runwayMonths.toFixed(1) + " meses" : "—"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Ingresos del mes" value={ars(cur.income)} tone="good" />
        <Stat label="Gastos del mes" value={ars(cur.expense)} tone="bad" hint={`Fijos ${ars(cur.fixed)} · Variables ${ars(cur.variable)}`} />
        <Stat label="Balance" value={ars(cur.balance)} tone={cur.balance >= 0 ? "good" : "bad"} />
        <Stat label="Ahorro en dólares" value={usdFmt(usdTotal)} tone="dollar" hint={`≈ ${ars(usdTotal * s.usdRate)}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Diagnóstico automático" className="lg:col-span-2">
          <ul className="space-y-3">
            {a.alerts.map((al, i) => {
              const Icon = al.level === "ok" ? CheckCircle2 : al.level === "atencion" ? AlertTriangle : ShieldAlert;
              return (
                <li key={i} className="flex gap-3 rounded-xl border border-border bg-background p-3">
                  <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", al.level === "ok" ? "text-success" : al.level === "atencion" ? "text-warning" : "text-destructive")} />
                  <div><p className="font-semibold">{al.title}</p><p className="text-sm text-muted-foreground">{al.detail}</p></div>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="Tu colchón">
          <div className="space-y-4">
            <Field label="Ahorros actuales en pesos">
              <input type="number" className={fieldCls} value={s.savingsArs || ""} onChange={(e) => update((st) => ({ ...st, savingsArs: Number(e.target.value) }))} />
            </Field>
            <div className="rounded-xl bg-muted p-3 text-sm">
              <p className="text-muted-foreground">Para cumplir tus metas necesitás apartar</p>
              <p className={cn("num text-xl font-bold", goalsMonthly > Math.max(0, a.avgSurplus) ? "text-destructive" : "text-success")}>{ars(goalsMonthly)}/mes</p>
              <p className="mt-1 text-muted-foreground">{goalsMonthly > Math.max(0, a.avgSurplus) ? "Supera tu excedente actual: ajustá gastos o plazos." : "Tu excedente alcanza para tus metas."}</p>
            </div>
            <Link to="/movimientos" className="block rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground">Cargar movimientos</Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
