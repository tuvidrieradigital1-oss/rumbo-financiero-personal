import { Link } from "@tanstack/react-router";
import { BarChart3, DollarSign, Home, ListOrdered, Target, Wallet } from "lucide-react";

const links = [
  { to: "/", label: "Resumen", icon: Home },
  { to: "/movimientos", label: "Movimientos", icon: Wallet },
  { to: "/metas", label: "Metas y ahorro", icon: Target },
  { to: "/dolares", label: "Dólares", icon: DollarSign },
  { to: "/graficos", label: "Gráficos", icon: BarChart3 },
  { to: "/ranking", label: "Ranking", icon: ListOrdered },
] as const;

export function AppNav() {
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
      </div>
    </header>
  );
}
