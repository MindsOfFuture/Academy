import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireModuleUser(canonicalPath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect(`/auth?next=${encodeURIComponent(canonicalPath)}`);
  }

  return data.user;
}
