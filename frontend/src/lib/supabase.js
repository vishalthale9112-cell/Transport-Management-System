import { createClient } from "@supabase/supabase-js";


function normalizeSupabaseUrl(value) {
  const rawUrl = String(value || "").trim();

  if (!rawUrl) return "";

  try {
    // Supabase JS needs the project origin, not /rest/v1 or /auth/v1.
    return new URL(rawUrl).origin;
  } catch {
    return rawUrl.replace(/\/+$/, "");
  }
}


const supabaseUrl = normalizeSupabaseUrl(
  import.meta.env.VITE_SUPABASE_URL
);

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey
);

export const supabase = isSupabaseConfigured
  ? createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    )
  : null;
