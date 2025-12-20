import { createClient as createBrowserClient } from "@/lib/supabase/client";

export function getSupabaseClient() {
  return createBrowserClient();
}
