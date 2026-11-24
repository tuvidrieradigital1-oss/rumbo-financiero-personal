import { useSyncExternalStore } from "react";

export type EntryType = "ingreso" | "gasto";
export type Kind = "fijo" | "variable";
export interface Entry { id: string; month: string; type: EntryType; kind: Kind; category: string; description: string; amount: number }
export interface Goal { id: string; name: string; target: number; saved: number; deadline: string; currency: "ARS" | "USD" }
export interface UsdBuy { id: string; date: string; usd: number; rate: number; note: string }
export interface FinanceState { entries: Entry[]; goals: Goal[]; usd: UsdBuy[]; savingsArs: number; usdRate: number; hypothetical: number }

export const INCOME_CATEGORIES = ["Sueldo fijo", "Sueldo variable", "Bonos / extras", "Freelance", "Otros ingresos"];
export const EXPENSE_CATEGORIES = ["Alquiler", "Expensas", "Servicios", "Supermercado", "Transporte", "Salud", "Educación", "Tarjeta de crédito", "Ocio", "Ropa", "Suscripciones", "Otros gastos"];

const KEY = "planificador-finanzas-v1";
const empty: FinanceState = { entries: [], goals: [], usd: [], savingsArs: 0, usdRate: 1200, hypothetical: 0 };
let state: FinanceState = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) state = { ...empty, ...JSON.parse(raw) }; } catch { /* ignore */ }
}
function subscribe(l: () => void) { load(); listeners.add(l); l(); return () => listeners.delete(l); }
export function update(fn: (s: FinanceState) => FinanceState) {
  load(); state = fn(state); localStorage.setItem(KEY, JSON.stringify(state)); listeners.forEach((l) => l());
}
export function useFinance() { return useSyncExternalStore(subscribe, () => state, () => empty); }
export const uid = () => Math.random().toString(36).slice(2, 10);
export const currentMonth = () => new Date().toISOString().slice(0, 7);
export const ars = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);
export const usdFmt = (n: number) => "US$ " + new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(n || 0);
export const monthLabel = (m: string) => { const [y, mo] = m.split("-"); return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }); };
