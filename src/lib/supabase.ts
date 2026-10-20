import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when both env vars are present and the client is usable. */
export const supabaseAvailable = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseAvailable
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: false },
    })
  : null;
