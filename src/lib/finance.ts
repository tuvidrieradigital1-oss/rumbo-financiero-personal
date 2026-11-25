import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";

export type EntryType = "ingreso" | "gasto";
export type Kind = "fijo" | "variable";
export interface Entry { id: string; month: string; type: EntryType; kind: Kind; category: string; description: string; amount: number }
export interface Goal { id: string; name: string; target: number; saved: number; deadline: string; currency: "ARS" | "USD" }
export interface UsdBuy { id: string; date: string; usd: number; rate: number; note: string }
export interface FinanceState { entries: Entry[]; goals: Goal[]; usd: UsdBuy[]; savingsArs: number; usdRate: number; hypothetical: number }

export const INCOME_CATEGORIES = ["Sueldo fijo", "Sueldo variable", "Bonos / extras", "Freelance", "Otros ingresos"];
export const EXPENSE_CATEGORIES = ["Alquiler", "Expensas", "Servicios", "Supermercado", "Transporte", "Salud", "Educación", "Tarjeta de crédito", "Ocio", "Ropa", "Suscripciones", "Otros gastos"];

const empty: FinanceState = { entries: [], goals: [], usd: [], savingsArs: 0, usdRate: 1200, hypothetical: 0 };

// ---------------------------------------------------------------------------
// Store en memoria + sincronización con Supabase (una fila por usuario).
// La API pública (useFinance / update) es la misma que tenía la app original.
// ---------------------------------------------------------------------------
let state: FinanceState = empty;
let ready = false;
let userId: string | null = null;
let loadToken = 0;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pending = false;

export type SyncStatus = "idle" | "saving" | "saved" | "error";
export interface SyncInfo { status: SyncStatus; error: string | null }
let syncInfo: SyncInfo = { status: "idle", error: null };

const listeners = new Set<() => void>();
const syncListeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function setSync(status: SyncStatus, error: string | null = null) {
  syncInfo = { status, error };
  syncListeners.forEach((l) => l());
}

function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
function subscribeSync(l: () => void) { syncListeners.add(l); return () => { syncListeners.delete(l); }; }

export function useFinance() { return useSyncExternalStore(subscribe, () => state, () => empty); }
export function useSyncInfo() { return useSyncExternalStore(subscribeSync, () => syncInfo, () => syncInfo); }

/** Carga los datos del usuario logueado desde Supabase. */
export async function loadFinance(uid: string) {
  const token = ++loadToken;
  userId = uid;
  ready = false;
  state = empty;
  setSync("idle");
  emit();
  const { data, error } = await supabase.from("finance_state").select("data").eq("user_id", uid).maybeSingle();
  if (token !== loadToken) return; // llegó una carga más nueva (o cerró sesión)
  if (error) throw new Error(error.message);
  state = data?.data ? { ...empty, ...(data.data as Partial<FinanceState>) } : empty;
  ready = true;
  emit();
}

/** Modifica los datos y los guarda en la nube (con un pequeño retraso para agrupar cambios). */
export function update(fn: (s: FinanceState) => FinanceState) {
  if (!ready || !userId) return;
  state = fn(state);
  emit();
  pending = true;
  setSync("saving");
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { void saveNow(); }, 500);
}

async function saveNow() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  if (!userId || !pending) return;
  const uid = userId;
  const snapshot = state;
  pending = false;
  const { error } = await supabase
    .from("finance_state")
    .upsert({ user_id: uid, data: snapshot, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) { pending = true; setSync("error", error.message); return; }
  if (!pending) setSync("saved");
}

/** Fuerza el guardado de cambios pendientes (se usa antes de cerrar sesión). */
export async function flushFinance() { await saveNow(); }

/** Limpia todo al cerrar sesión. */
export function resetFinance() {
  loadToken++;
  userId = null;
  ready = false;
  pending = false;
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  state = empty;
  setSync("idle");
  emit();
}

if (typeof window !== "undefined") {
  // Avisa si el usuario intenta cerrar la pestaña con cambios sin guardar.
  window.addEventListener("beforeunload", (e) => { if (pending) e.preventDefault(); });
  // Al pasar a segundo plano (cambiar de app/pestaña) guarda lo pendiente.
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") void saveNow(); });
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const currentMonth = () => new Date().toISOString().slice(0, 7);
export const ars = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);
export const usdFmt = (n: number) => "US$ " + new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(n || 0);
export const monthLabel = (m: string) => { const [y, mo] = m.split("-"); return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }); };
