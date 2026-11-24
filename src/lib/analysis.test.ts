import { describe, it, expect } from "vitest";
import { analyze, goalPlan, summarize } from "./analysis";

describe("análisis financiero", () => {
  it("detecta déficit cuando los gastos superan los ingresos", () => {
    const m = summarize([
      { id: "1", month: "2026-11", type: "ingreso", kind: "fijo", category: "Sueldo fijo", description: "", amount: 100000 },
      { id: "2", month: "2026-11", type: "gasto", kind: "fijo", category: "Alquiler", description: "", amount: 120000 },
    ]);
    expect(m[0]!.balance).toBe(-20000);
    expect(analyze(m, 0).alerts.some((a) => a.title === "Déficit este mes")).toBe(true);
  });
  it("sugiere monto mensual dividiendo lo que falta por los meses restantes", () => {
    const p = goalPlan({ target: 1200000, saved: 200000, deadline: "2027-11-24" }, new Date("2026-11-24T00:00:00"));
    expect(p.remaining).toBe(1000000);
    expect(p.months).toBe(12);
  });
});
