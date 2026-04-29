import "server-only";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export type CreditCategory =
  | "bolsistas"
  | "bolsistas_projetistas"
  | "coordenacao"
  | "instituicoes"
  | "agradecimentos_especiais";

export interface CreditEntry {
  id: string;
  category: CreditCategory;
  name: string;
  area: string | null;
  description: string | null;
  link: string | null;
  sort_order: number | null;
}

export const CREDIT_CATEGORY_ORDER: CreditCategory[] = [
  "bolsistas",
  "bolsistas_projetistas",
  "coordenacao",
  "instituicoes",
  "agradecimentos_especiais",
];

export async function getCredits(): Promise<CreditEntry[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("credits_entries")
    .select("id, category, name, area, description, link, sort_order");

  if (error || !data) {
    return [];
  }

  return data as CreditEntry[];
}
