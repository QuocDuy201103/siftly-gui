import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type PublicConfig = {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
};

let cachedClient: SupabaseClient | null = null;
let cachedConfigChecked = false;

function getBuildTimeConfig(): PublicConfig {
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || null;
  const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || null;
  return { supabaseUrl, supabaseAnonKey };
}

async function getRuntimeConfig(): Promise<PublicConfig> {
  try {
    const res = await fetch("/api/public-config", { method: "GET" });
    if (!res.ok) return { supabaseUrl: null, supabaseAnonKey: null };
    const data = (await res.json()) as Partial<PublicConfig>;
    return {
      supabaseUrl: typeof data.supabaseUrl === "string" ? data.supabaseUrl : null,
      supabaseAnonKey: typeof data.supabaseAnonKey === "string" ? data.supabaseAnonKey : null,
    };
  } catch {
    return { supabaseUrl: null, supabaseAnonKey: null };
  }
}

export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (cachedClient) return cachedClient;
  if (cachedConfigChecked) return null;

  // Prefer build-time config for local dev, fall back to runtime config on Cloud Run.
  const buildCfg = getBuildTimeConfig();
  const cfg =
    buildCfg.supabaseUrl && buildCfg.supabaseAnonKey ? buildCfg : await getRuntimeConfig();

  cachedConfigChecked = true;

  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
  cachedClient = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  return cachedClient;
}

export async function isSupabaseConfigured(): Promise<boolean> {
  return Boolean(await getSupabaseClient());
}


