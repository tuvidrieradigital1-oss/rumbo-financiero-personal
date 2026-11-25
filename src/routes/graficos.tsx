import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFinance, ars, monthLabel } from "@/lib/finance";
import { summarize, ranking } from "@/lib/analysis";
import { PageHeader, Panel } from "@/components/ui-bits";

export const Route = createFileRoute("/graficos")({
  component: Graficos,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const short = (n: number) => new Intl.NumberFormat("es-AR", { notation: "compact" }).format(n);
const tip = { formatter: (v: number) => ars(v), contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 } };

function Graficos() {
  const s = useFinance();
  const months = summarize(s.entries).map((m) => ({ ...m, label: monthLabel(m.month) }));
  const cats = ranking(s.entries, "gasto");
  let acc = 0;
  const usd = [...s.usd].sort((a, b) => a.date.localeCompare(b.date)).map((u) => ({ date: u.date.slice(5), total: (acc += u.usd) }));
  const fv = months.length ? [{ name: "Fijos", value: months.reduce((t, m) => t + m.fixed, 0) }, { name: "Variables", value: months.reduce((t, m) => t + m.variable, 0) }] : [];
  const empty = <p className="py-16 text-center text-sm text-muted-foreground">Cargá datos para ver este gráfico.</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Gráficos" subtitle="Todas tus variables de un vistazo." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Ingresos vs gastos">
          {!months.length ? empty : <ResponsiveContainer width="100%" height={260}><BarChart data={months}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="label" /><YAxis tickFormatter={short} /><Tooltip {...tip} /><Legend /><Bar dataKey="income" name="Ingresos" fill="var(--success)" radius={6} /><Bar dataKey="expense" name="Gastos" fill="var(--destructive)" radius={6} /></BarChart></ResponsiveContainer>}
        </Panel>
        <Panel title="Balance mensual">
          {!months.length ? empty : <ResponsiveContainer width="100%" height={260}><LineChart data={months}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="label" /><YAxis tickFormatter={short} /><Tooltip {...tip} /><Line dataKey="balance" name="Balance" stroke="var(--primary)" strokeWidth={3} /></LineChart></ResponsiveContainer>}
        </Panel>
        <Panel title="Gastos fijos vs variables por mes">
          {!months.length ? empty : <ResponsiveContainer width="100%" height={260}><BarChart data={months}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="label" /><YAxis tickFormatter={short} /><Tooltip {...tip} /><Legend /><Bar dataKey="fixed" stackId="a" name="Fijos" fill="var(--chart-1)" /><Bar dataKey="variable" stackId="a" name="Variables" fill="var(--chart-2)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>}
        </Panel>
        <Panel title="Gastos por categoría">
          {!cats.length ? empty : <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={cats} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>{cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip {...tip} /><Legend /></PieChart></ResponsiveContainer>}
        </Panel>
        <Panel title="Proporción fijo / variable">
          {!fv.length ? empty : <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={fv} dataKey="value" nameKey="name" outerRadius={95} label={(d) => d.name}>{fv.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip {...tip} /></PieChart></ResponsiveContainer>}
        </Panel>
        <Panel title="Dólares acumulados">
          {!usd.length ? empty : <ResponsiveContainer width="100%" height={260}><AreaChart data={usd}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" /><YAxis /><Tooltip contentStyle={tip.contentStyle} /><Area dataKey="total" name="US$" stroke="var(--dollar)" fill="var(--dollar)" fillOpacity={0.25} /></AreaChart></ResponsiveContainer>}
        </Panel>
      </div>
    </div>
  );
}
