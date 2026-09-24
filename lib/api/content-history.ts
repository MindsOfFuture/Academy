import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import {
  type ContentHistoryData,
  type ContentHistoryEntry,
  type ContentHistoryRow,
  type ContentHistoryTable,
} from "./types";

export interface ContentHistoryFilters {
  moduleId?: string;
  authorId?: string;
  startDate?: string;
  endDate?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TABLE_LABELS: Record<ContentHistoryTable, { name: string; article: string; contraction: string }> = {
  course: { name: "curso", article: "o", contraction: "do" },
  course_module: { name: "módulo", article: "o", contraction: "do" },
  lesson: { name: "aula", article: "a", contraction: "da" },
};

const FIELD_LABELS: Record<string, string> = {
  title: "título",
  description: "descrição",
  level: "nível",
  status: "status",
  audience: "público",
  language: "idioma",
  category: "categoria",
  subcategories: "subcategorias",
  module_id: "módulo",
  course_id: "curso",
  content_type: "tipo de conteúdo",
  content_url: "endereço do conteúdo",
  duration_minutes: "duração",
  order: "ordem",
  is_public: "visibilidade",
  thumb_id: "imagem",
  owner_id: "responsável",
};

function valueAsText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "sem valor";
  if (typeof value === "boolean") return value ? "sim" : "não";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function titleFrom(data: ContentHistoryData | null): string {
  return valueAsText(data?.title);
}

function joinLabels(fields: string[]): string {
  const labels = fields.map((field) => FIELD_LABELS[field] ?? field);
  if (labels.length < 2) return labels[0] ?? "conteúdo";
  return `${labels.slice(0, -1).join(", ")} e ${labels.at(-1)}`;
}

export function mapContentHistoryRow(
  row: ContentHistoryRow,
  authorName?: string,
): ContentHistoryEntry {
  return {
    id: row.id,
    table: row.tabela,
    recordId: row.registro_id,
    courseId: row.curso_id,
    action: row.acao,
    authorId: row.autor,
    authorName: row.autor ? authorName ?? "Outra pessoa da equipe" : "Sistema",
    occurredAt: row.ocorrido_em,
    before: row.antes,
    after: row.depois,
    changedFields: row.campos_alterados ?? [],
  };
}

export function buildContentHistorySentence(entry: ContentHistoryEntry): string {
  const entity = TABLE_LABELS[entry.table];
  const currentData = entry.after ?? entry.before;
  const title = titleFrom(currentData);

  if (entry.action === "insert") {
    return `${entry.authorName} criou ${entity.article} ${entity.name} "${title}".`;
  }

  if (entry.action === "delete") {
    return `${entry.authorName} excluiu ${entity.article} ${entity.name} "${title}".`;
  }

  if (entry.changedFields.length === 1 && entry.changedFields[0] === "title") {
    return `${entry.authorName} alterou o título ${entity.contraction} ${entity.name} "${title}" de "${valueAsText(entry.before?.title)}" para "${valueAsText(entry.after?.title)}".`;
  }

  return `${entry.authorName} alterou ${joinLabels(entry.changedFields)} ${entity.contraction} ${entity.name} "${title}".`;
}

export async function listContentHistory(
  courseId: string,
  filters: ContentHistoryFilters = {},
): Promise<ContentHistoryEntry[]> {
  const supabase = createBrowserSupabase();
  let query = supabase
    .from("historico_conteudo")
    .select("id, tabela, registro_id, curso_id, acao, autor, ocorrido_em, antes, depois, campos_alterados")
    .eq("curso_id", courseId);

  if (filters.moduleId && UUID_PATTERN.test(filters.moduleId)) {
    query = query.or(
      `registro_id.eq.${filters.moduleId},antes->>module_id.eq.${filters.moduleId},depois->>module_id.eq.${filters.moduleId}`,
    );
  }
  if (filters.authorId && UUID_PATTERN.test(filters.authorId)) {
    query = query.eq("autor", filters.authorId);
  }
  if (filters.startDate) query = query.gte("ocorrido_em", filters.startDate);
  if (filters.endDate) query = query.lte("ocorrido_em", filters.endDate);

  const { data, error } = await query.order("ocorrido_em", { ascending: false });
  if (error || !data) return [];

  const rows = data as ContentHistoryRow[];
  const authorIds = [...new Set(rows.flatMap((row) => row.autor ? [row.autor] : []))];
  const authorNames = new Map<string, string>();

  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profile")
      .select("id, full_name")
      .in("id", authorIds);

    for (const profile of profiles ?? []) {
      if (profile.full_name) authorNames.set(profile.id, profile.full_name);
    }
  }

  return rows.map((row) => mapContentHistoryRow(
    row,
    row.autor ? authorNames.get(row.autor) : undefined,
  ));
}
