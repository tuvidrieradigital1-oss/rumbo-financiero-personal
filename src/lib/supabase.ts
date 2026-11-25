import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);

// La anon/publishable key es pública por diseño: la seguridad real la dan las
// políticas RLS de supabase/schema.sql (cada usuario solo ve sus propios datos).
export const supabase = createClient(url || "http://localhost:54321", key || "sin-configurar", {
  auth: {
    persistSession: true, // guarda la sesión en el navegador
    autoRefreshToken: true, // renueva el token solo
    detectSessionInUrl: true, // necesario para el link de confirmación por mail
  },
});
