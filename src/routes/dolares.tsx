import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFinance, update, uid, ars, usdFmt } from "@/lib/finance";
import { PageHeader, Panel, Stat, Field, fieldCls } from "@/components/ui-bits";

export const Route = createFileRoute("/dolares")({
  head: () => ({ meta: [
    { title: "Ahorro en dólares | Mis Finanzas" },
    { name: "description", content: "Registrá tus compras de dólares, cotización promedio y valor en pesos." },
    { property: "og:title", content: "Ahorro en dólares | Mis Finanzas" },
    { property: "og:description", content: "Compras de dólares, cotización promedio y valor en pesos." },
  ] }),
  component: Dolares,
});

function Dolares() {
  const s = useFinance();
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), usd: "", rate: "", note: "" });
  const total = s.usd.reduce((t, u) => t + u.usd, 0);
  const paid = s.usd.reduce((t, u) => t + u.usd * u.rate, 0);
  const avg = total ? paid / total : 0;
  const now = total * s.usdRate;

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!Number(f.usd) || !Number(f.rate)) return toast.error("Completá dólares y cotización");
    update((st) => ({ ...st, usd: [...st.usd, { id: uid(), date: f.date, usd: Number(f.usd), rate: Number(f.rate), note: f.note }] }));
    setF({ ...f, usd: "", note: "" });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ahorro en dólares" subtitle="Tu reserva en moneda fuerte.">
        <Field label="Cotización actual (ARS por US$)"><input type="number" className={fieldCls} value={s.usdRate || ""} onChange={(e) => update((st) => ({ ...st, usdRate: Number(e.target.value) }))} /></Field>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total ahorrado" value={usdFmt(total)} tone="dollar" />
        <Stat label="Cotización promedio" value={ars(avg)} />
        <Stat label="Valor hoy en pesos" value={ars(now)} />
        <Stat label="Ganancia por cotización" value={ars(now - paid)} tone={now - paid >= 0 ? "good" : "bad"} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Registrar compra">
          <form onSubmit={add} className="space-y-3">
            <Field label="Fecha"><input type="date" className={fieldCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
            <Field label="Dólares comprados"><input type="number" className={fieldCls} value={f.usd} onChange={(e) => setF({ ...f, usd: e.target.value })} /></Field>
            <Field label="Cotización pagada"><input type="number" className={fieldCls} value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} placeholder={String(s.usdRate)} /></Field>
            <Field label="Nota"><input className={fieldCls} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="MEP, blue, oficial…" /></Field>
            <button className="w-full rounded-full bg-dollar py-2.5 text-sm font-semibold text-primary-foreground">Agregar compra</button>
          </form>
        </Panel>
        <Panel title="Historial" className="lg:col-span-2">
          {!s.usd.length ? <p className="text-sm text-muted-foreground">Sin compras registradas.</p> : (
            <ul className="divide-y divide-border">
              {[...s.usd].sort((a, b) => b.date.localeCompare(a.date)).map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-sm text-muted-foreground">{new Date(u.date + "T00:00:00").toLocaleDateString("es-AR")}</span>
                  <span className="flex-1 text-sm">{u.note}</span>
                  <span className="num text-sm text-muted-foreground">@ {ars(u.rate)}</span>
                  <span className="num font-bold text-dollar">{usdFmt(u.usd)}</span>
                  <button aria-label="Eliminar" onClick={() => update((st) => ({ ...st, usd: st.usd.filter((x) => x.id !== u.id) }))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
