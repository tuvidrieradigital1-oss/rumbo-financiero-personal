import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
export function Panel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5 shadow-soft", className)}>
      {title && <h2 className="mb-4 font-display text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}
export function Stat({ label, value, tone = "default", hint }: { label: string; value: string; tone?: "default" | "good" | "bad" | "dollar"; hint?: string }) {
  const toneCls = { default: "text-foreground", good: "text-success", bad: "text-destructive", dollar: "text-dollar" }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("num mt-1 text-2xl font-bold", toneCls)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
export const fieldCls = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1 text-sm"><span className="font-medium text-muted-foreground">{label}</span>{children}</label>;
}
