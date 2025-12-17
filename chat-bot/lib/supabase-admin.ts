import { createClient } from "@supabase/supabase-js";

function getSupabaseAdminConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, serviceRoleKey };
}

export function getSupabaseAdmin() {
  const { url, serviceRoleKey } = getSupabaseAdminConfig();
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase realtime is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}


