import { Outlet, Link, createRootRoute, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppNav } from "../components/AppNav";
import { AuthScreen } from "../components/AuthScreen";
import { Toaster } from "../components/ui/sonner";
import { AuthProvider, useAuth } from "../lib/auth";
import { loadFinance } from "../lib/finance";
import { supabaseConfigured } from "../lib/supabase";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">La página que buscás no existe o fue movida.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Esta página no cargó</h1>
        <p className="mt-2 text-sm text-muted-foreground">Algo salió mal. Podés reintentar o volver al inicio.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { void router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Reintentar
          </button>
          <a href={import.meta.env.BASE_URL} className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function FullScreenMessage({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md space-y-3 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        {children}
      </div>
    </div>
  );
}

/** Pide login, y una vez dentro carga los datos del usuario antes de mostrar la app. */
function Gate() {
  const { session, loading } = useAuth();
  const uid = session?.user.id;
  const [dataState, setDataState] = useState<"loading" | "ready" | "error">("loading");
  const [dataError, setDataError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setDataState("loading");
    loadFinance(uid)
      .then(() => { if (!cancelled) setDataState("ready"); })
      .catch((e: unknown) => {
        if (cancelled) return;
        setDataError(e instanceof Error ? e.message : "Error desconocido");
        setDataState("error");
      });
    return () => { cancelled = true; };
  }, [uid, attempt]);

  if (!supabaseConfigured) {
    return (
      <FullScreenMessage title="Falta configurar Supabase">
        <p className="text-sm text-muted-foreground">
          Definí <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> (en un archivo <code>.env</code> en local, o como Secrets en GitHub). Mirá el README.
        </p>
      </FullScreenMessage>
    );
  }
  if (loading) return <FullScreenMessage title="Cargando…" />;
  if (!session) return <AuthScreen />;
  if (dataState === "loading") return <FullScreenMessage title="Cargando tus datos…" />;
  if (dataState === "error") {
    return (
      <FullScreenMessage title="No se pudieron cargar tus datos">
        <p className="text-sm text-muted-foreground">{dataError}</p>
        <p className="text-xs text-muted-foreground">Verificá que ejecutaste supabase/schema.sql en tu proyecto de Supabase.</p>
        <button onClick={() => setAttempt((n) => n + 1)} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Reintentar</button>
      </FullScreenMessage>
    );
  }
  return (
    <div className="min-h-screen bg-background font-sans">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Gate />
      <Toaster />
    </AuthProvider>
  );
}
