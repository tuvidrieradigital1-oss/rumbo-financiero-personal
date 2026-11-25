import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFinance, update, uid, ars, currentMonth, INCOME_CATEGORIES, EXPENSE_CATEGORIES, type EntryType, type Kind } from "@/lib/finance";
import { PageHeader, Panel, Stat, Field, fieldCls } from "@/components/ui-bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/movimientos")({
  component: Movimientos,
});

function prevMonth(m: string) { const [y, mo] = m.split("-").map(Number); const d = new Date(y!, mo! - 2, 1); return d.toISOString().slice(0, 7); }

function Movimientos() {
  const s = useFinance();
  const [month, setMonth] = useState(currentMonth());
  const [type, setType] = useState<EntryType>("gasto");
  const [kind, setKind] = useState<Kind>("fijo");
  const cats = type === "ingreso" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]!);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const list = s.entries.filter((e) => e.month === month);
  const inc = list.filter((e) => e.type === "ingreso").reduce((t, e) => t + e.amount, 0);
  const exp = list.filter((e) => e.type === "gasto").reduce((t, e) => t + e.amount, 0);

  function add(ev: React.FormEvent) {
    ev.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return toast.error("Ingresá un monto válido");
    update((st) => ({ ...st, entries: [...st.entries, { id: uid(), month, type, kind, category, description, amount: n }] }));
    setAmount(""); setDescription("");
  }
  function copyFixed() {
    const prev = s.entries.filter((e) => e.month === prevMonth(month) && e.kind === "fijo");
    if (!prev.length) return toast.info("No hay movimientos fijos el mes anterior");
    update((st) => ({ ...st, entries: [...st.entries, ...prev.map((e) => ({ ...e, id: uid(), month }))] }));
    toast.success(`${prev.length} movimientos fijos copiados`);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ingresos y gastos" subtitle="Todo en pesos argentinos, mes a mes.">
        <div className="flex gap-2">
          <input type="month" className={cn(fieldCls, "w-44")} value={month} onChange={(e) => setMonth(e.target.value)} />
          <button onClick={copyFixed} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted"><Copy className="h-4 w-4" />Copiar fijos del mes anterior</button>
        </div>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Ingresos" value={ars(inc)} tone="good" />
        <Stat label="Gastos" value={ars(exp)} tone="bad" />
        <Stat label="Balance" value={ars(inc - exp)} tone={inc - exp >= 0 ? "good" : "bad"} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Nuevo movimiento">
          <form onSubmit={add} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(["ingreso", "gasto"] as const).map((t) => (
                <button type="button" key={t} onClick={() => { setType(t); setCategory((t === "ingreso" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0]!); }}
                  className={cn("rounded-lg border py-2 text-sm font-semibold capitalize", type === t ? (t === "ingreso" ? "border-success bg-success text-primary-foreground" : "border-destructive bg-destructive text-destructive-foreground") : "border-border")}>{t}</button>
              ))}
            </div>
            <Field label="Tipo">
              <select className={fieldCls} value={kind} onChange={(e) => setKind(e.target.value as Kind)}><option value="fijo">Fijo</option><option value="variable">Variable</option></select>
            </Field>
            <Field label="Categoría">
              <select className={fieldCls} value={category} onChange={(e) => setCategory(e.target.value)}>{cats.map((c) => <option key={c}>{c}</option>)}</select>
            </Field>
            <Field label="Detalle (opcional)"><input className={fieldCls} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: luz, gas, internet" /></Field>
            <Field label="Monto (ARS)"><input type="number" className={fieldCls} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
            <button className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground">Agregar</button>
          </form>
        </Panel>
        <Panel title={`Movimientos (${list.length})`} className="lg:col-span-2">
          {!list.length ? <p className="text-sm text-muted-foreground">Todavía no hay movimientos este mes.</p> : (
            <ul className="divide-y divide-border">
              {list.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", e.kind === "fijo" ? "bg-secondary text-secondary-foreground" : "bg-accent text-accent-foreground")}>{e.kind}</span>
                  <div className="min-w-0 flex-1"><p className="font-medium">{e.category}</p>{e.description && <p className="truncate text-xs text-muted-foreground">{e.description}</p>}</div>
                  <span className={cn("num font-bold", e.type === "ingreso" ? "text-success" : "text-destructive")}>{e.type === "ingreso" ? "+" : "−"}{ars(e.amount)}</span>
                  <button aria-label="Eliminar" onClick={() => update((st) => ({ ...st, entries: st.entries.filter((x) => x.id !== e.id) }))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
