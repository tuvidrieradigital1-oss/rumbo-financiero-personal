import { Link } from "@tanstack/react-router";
import { BarChart3, Check, CloudOff, DollarSign, Home, ListOrdered, Loader2, LogOut, Target, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSyncInfo } from "@/lib/finance";

const links = [
  { to: "/", label: "Resumen", icon: Home },
  { to: "/movimientos", label: "Movimientos", icon: Wallet },
  { to: "/metas", label: "Metas y ahorro", icon: Target },
  { to: "/dolares", label: "Dólares", icon: DollarSign },
  { to: "/graficos", label: "Gráficos", icon: BarChart3 },
  { to: "/ranking", label: "Ranking", icon: ListOrdered },
] as const;

function SyncBadge() {
  const { status, error } = useSyncInfo();
  if (status === "saving") return <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Guardando…</span>;
  if (status === "saved") return <span className="flex items-center gap-1 text-xs text-success"><Check className="h-3.5 w-3.5" />Guardado</span>;
  if (status === "error") return <span title={error ?? ""} className="flex items-center gap-1 text-xs text-destructive"><CloudOff className="h-3.5 w-3.5" />Error al guardar</span>;
  return null;
}

export function AppNav() {
  const { session, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link to="/" className="font-display text-xl font-bold text-primary">Mis Finanzas<span className="text-accent">.</span></Link>
        <nav className="flex flex-wrap gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: true }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" }}>
              <Icon className="h-4 w-4" />{label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <SyncBadge />
          <span className="hidden max-w-[12rem] truncate text-xs text-muted-foreground sm:inline">{session?.user.email}</span>
          <button onClick={() => { void signOut(); }} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
            <LogOut className="h-4 w-4" />Salir
          </button>
        </div>
      </div>
    </header>
  );
}
