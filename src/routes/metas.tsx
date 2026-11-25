import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFinance, update, uid, ars, usdFmt, type Goal } from "@/lib/finance";
import { goalPlan, summarize, analyze } from "@/lib/analysis";
import { PageHeader, Panel, Field, fieldCls } from "@/components/ui-bits";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/metas")({
  component: Metas,
});

function Metas() {
  const s = useFinance();
  const a = analyze(summarize(s.entries), s.savingsArs);
  const [form, setForm] = useState({ name: "", target: "", saved: "", deadline: "", currency: "ARS" as Goal["currency"] });
  const fmt = (g: Goal, n: number) => (g.currency === "USD" ? usdFmt(n) : ars(n));

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !Number(form.target) || !form.deadline) return toast.error("Completá nombre, monto y fecha");
    update((st) => ({ ...st, goals: [...st.goals, { id: uid(), name: form.name, target: Number(form.target), saved: Number(form.saved) || 0, deadline: form.deadline, currency: form.currency }] }));
    setForm({ name: "", target: "", saved: "", deadline: "", currency: "ARS" });
  }
  const hypo = s.hypothetical;
  const projections = [6, 12, 24, 36, 60];

  return (
    <div className="space-y-6">
      <PageHeader title="Metas y ahorro" subtitle="Definí tus metas y la app calcula cuánto apartar." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Nueva meta">
          <form onSubmit={add} className="space-y-3">
            <Field label="Nombre"><input className={fieldCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Vacaciones, auto" /></Field>
            <Field label="Moneda"><select className={fieldCls} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as Goal["currency"] })}><option value="ARS">Pesos</option><option value="USD">Dólares</option></select></Field>
            <Field label="Monto objetivo"><input type="number" className={fieldCls} value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /></Field>
            <Field label="Ya ahorrado (real)"><input type="number" className={fieldCls} value={form.saved} onChange={(e) => setForm({ ...form, saved: e.target.value })} /></Field>
            <Field label="Fecha límite"><input type="date" className={fieldCls} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
            <button className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground">Crear meta</button>
          </form>
        </Panel>
        <div className="space-y-4 lg:col-span-2">
          {!s.goals.length && <Panel><p className="text-sm text-muted-foreground">Creá tu primera meta para ver sugerencias de ahorro.</p></Panel>}
          {s.goals.map((g) => {
            const p = goalPlan(g);
            const monthlyArs = p.monthly * (g.currency === "USD" ? s.usdRate : 1);
            const feasible = monthlyArs <= Math.max(0, a.avgSurplus);
            return (
              <Panel key={g.id}>
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-display text-xl font-semibold">{g.name}</h3><p className="text-sm text-muted-foreground">Meta {fmt(g, g.target)} · hasta {new Date(g.deadline + "T00:00:00").toLocaleDateString("es-AR")}</p></div>
                  <button aria-label="Eliminar meta" onClick={() => update((st) => ({ ...st, goals: st.goals.filter((x) => x.id !== g.id) }))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
                <Progress value={p.progress} className="mt-4" />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{fmt(g, g.saved)} ahorrado</span><span>{p.progress.toFixed(0)}%</span></div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Por semana</p><p className="num font-bold">{fmt(g, p.weekly)}</p></div>
                  <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Por mes</p><p className="num font-bold">{fmt(g, p.monthly)}</p></div>
                  <div className={cn("rounded-xl p-3", feasible ? "bg-secondary" : "bg-destructive/10")}><p className="text-xs text-muted-foreground">Viabilidad</p><p className={cn("text-sm font-semibold", feasible ? "text-success" : "text-destructive")}>{feasible ? "Alcanzable con tu excedente" : "Supera tu excedente actual"}</p></div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input type="number" placeholder="Sumar aporte real" className={cn(fieldCls, "max-w-48")} onKeyDown={(e) => {
                    if (e.key !== "Enter") return; const v = Number((e.target as HTMLInputElement).value); if (!v) return;
                    update((st) => ({ ...st, goals: st.goals.map((x) => (x.id === g.id ? { ...x, saved: x.saved + v } : x)) })); (e.target as HTMLInputElement).value = ""; toast.success("Aporte registrado");
                  }} />
                  <span className="text-xs text-muted-foreground">Enter para registrar</span>
                </div>
              </Panel>
            );
          })}
        </div>
      </div>
      <Panel title="Simulador hipotético de ahorro">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-3">
            <Field label="Si ahorrara por mes (ARS)"><input type="number" className={fieldCls} value={hypo || ""} onChange={(e) => update((st) => ({ ...st, hypothetical: Number(e.target.value) }))} /></Field>
            <p className="text-sm text-muted-foreground">Tu excedente real promedio es <span className="num font-semibold text-foreground">{ars(a.avgSurplus)}</span>. {hypo > a.avgSurplus ? `Te faltan ${ars(hypo - a.avgSurplus)}/mes para lograrlo.` : hypo ? "Es alcanzable hoy." : ""}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 md:col-span-2">
            {projections.map((n) => (
              <div key={n} className="rounded-xl border border-border bg-background p-3 text-center">
                <p className="text-xs text-muted-foreground">{n} meses</p>
                <p className="num text-sm font-bold">{ars(s.savingsArs + hypo * n)}</p>
                <p className="num text-xs text-dollar">{usdFmt((s.savingsArs + hypo * n) / (s.usdRate || 1))}</p>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}
