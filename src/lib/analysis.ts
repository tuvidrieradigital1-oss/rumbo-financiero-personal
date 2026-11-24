import type { Entry, Goal } from "./finance";

export interface MonthSummary { month: string; income: number; expense: number; fixed: number; variable: number; balance: number }

export function summarize(entries: Entry[]): MonthSummary[] {
  const map = new Map<string, MonthSummary>();
  for (const e of entries) {
    const s = map.get(e.month) ?? { month: e.month, income: 0, expense: 0, fixed: 0, variable: 0, balance: 0 };
    if (e.type === "ingreso") s.income += e.amount;
    else { s.expense += e.amount; if (e.kind === "fijo") s.fixed += e.amount; else s.variable += e.amount; }
    s.balance = s.income - s.expense;
    map.set(e.month, s);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function ranking(entries: Entry[], type: "ingreso" | "gasto") {
  const map = new Map<string, number>();
  for (const e of entries) if (e.type === type) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  const total = [...map.values()].reduce((a, b) => a + b, 0);
  return [...map.entries()].map(([name, value]) => ({ name, value, pct: total ? (value / total) * 100 : 0 })).sort((a, b) => b.value - a.value);
}

export type Level = "ok" | "atencion" | "riesgo";
export interface Alert { level: Level; title: string; detail: string }

/** Detecta señales de quiebre financiero. */
export function analyze(months: MonthSummary[], savingsArs: number): { score: number; level: Level; alerts: Alert[]; avgSurplus: number; runwayMonths: number } {
  const alerts: Alert[] = [];
  if (!months.length) return { score: 100, level: "ok", alerts: [{ level: "atencion", title: "Sin datos", detail: "Cargá ingresos y gastos para analizar tu situación." }], avgSurplus: 0, runwayMonths: Infinity };
  const last = months[months.length - 1]!;
  const recent = months.slice(-3);
  const avgSurplus = recent.reduce((a, m) => a + m.balance, 0) / recent.length;
  const avgExpense = recent.reduce((a, m) => a + m.expense, 0) / recent.length;
  let score = 100;

  if (last.balance < 0) { score -= 35; alerts.push({ level: "riesgo", title: "Déficit este mes", detail: `Gastás más de lo que ingresa en ${last.month}.` }); }
  const fixedRatio = last.income ? last.fixed / last.income : 1;
  if (fixedRatio > 0.7) { score -= 25; alerts.push({ level: "riesgo", title: "Gastos fijos muy altos", detail: `Los fijos consumen el ${Math.round(fixedRatio * 100)}% de tus ingresos (ideal < 50%).` }); }
  else if (fixedRatio > 0.5) { score -= 10; alerts.push({ level: "atencion", title: "Gastos fijos elevados", detail: `Los fijos son el ${Math.round(fixedRatio * 100)}% de tus ingresos.` }); }
  const savingsRate = last.income ? last.balance / last.income : 0;
  if (last.balance >= 0 && savingsRate < 0.1) { score -= 10; alerts.push({ level: "atencion", title: "Margen de ahorro bajo", detail: `Ahorrás solo el ${Math.round(savingsRate * 100)}% de lo que ingresa (ideal ≥ 20%).` }); }
  if (recent.length >= 2) {
    const first = recent[0]!;
    const expGrowth = first.expense ? last.expense / first.expense - 1 : 0;
    const incGrowth = first.income ? last.income / first.income - 1 : 0;
    if (expGrowth > incGrowth + 0.05) { score -= 15; alerts.push({ level: "atencion", title: "Gastos crecen más que ingresos", detail: `Gastos +${Math.round(expGrowth * 100)}% vs ingresos +${Math.round(incGrowth * 100)}% en los últimos meses.` }); }
    const negatives = recent.filter((m) => m.balance < 0).length;
    if (negatives >= 2) { score -= 15; alerts.push({ level: "riesgo", title: "Posible quiebre financiero", detail: `${negatives} de los últimos ${recent.length} meses cerraron en negativo.` }); }
  }
  const runwayMonths = avgExpense ? savingsArs / avgExpense : Infinity;
  if (runwayMonths < 3) { score -= 10; alerts.push({ level: runwayMonths < 1 ? "riesgo" : "atencion", title: "Fondo de emergencia corto", detail: `Tus ahorros cubren ${runwayMonths.toFixed(1)} meses de gastos (ideal: 3 a 6).` }); }
  if (avgSurplus < 0 && savingsArs > 0) alerts.push({ level: "riesgo", title: "Proyección de agotamiento", detail: `Al ritmo actual, tus ahorros se agotan en ~${Math.max(0, savingsArs / -avgSurplus).toFixed(1)} meses.` });
  score = Math.max(0, Math.min(100, score));
  const level: Level = score >= 70 ? "ok" : score >= 40 ? "atencion" : "riesgo";
  if (!alerts.length) alerts.push({ level: "ok", title: "Situación saludable", detail: "Tus números están equilibrados. ¡Seguí así!" });
  return { score, level, alerts, avgSurplus, runwayMonths };
}

/** Sugerencia de ahorro para una meta. */
export function goalPlan(goal: Pick<Goal, "target" | "saved" | "deadline">, today = new Date()) {
  const remaining = Math.max(0, goal.target - goal.saved);
  const end = new Date(goal.deadline + "T00:00:00");
  const days = Math.max(1, Math.ceil((end.getTime() - today.getTime()) / 86400000));
  const weeks = Math.max(1, Math.ceil(days / 7));
  const months = Math.max(1, Math.ceil(days / 30.44));
  return { remaining, weeks, months, weekly: remaining / weeks, monthly: remaining / months, progress: goal.target ? Math.min(100, (goal.saved / goal.target) * 100) : 0 };
}
