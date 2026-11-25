import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Field, fieldCls, Panel } from "@/components/ui-bits";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setInfo(null);
    if (mode === "registro" && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
      } else {
        const { needsConfirmation } = await signUp(email.trim(), password);
        if (needsConfirmation) {
          setInfo("Te enviamos un mail para confirmar la cuenta. Abrí el link y después iniciá sesión.");
          setMode("login");
          setPassword("");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-primary">Mis Finanzas<span className="text-accent">.</span></h1>
          <p className="mt-2 text-muted-foreground">Tu planificador de economía personal en pesos argentinos.</p>
        </div>
        <Panel title={mode === "login" ? "Iniciar sesión" : "Crear cuenta"}>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Email">
              <input type="email" required autoComplete="email" className={fieldCls} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Contraseña">
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={fieldCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            {info && <p className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground">{info}</p>}
            <button disabled={busy} className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {busy ? "Un momento…" : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "registro" : "login"); setError(null); setInfo(null); }}
            className="mt-4 w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {mode === "login" ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Iniciá sesión"}
          </button>
        </Panel>
      </div>
    </div>
  );
}
