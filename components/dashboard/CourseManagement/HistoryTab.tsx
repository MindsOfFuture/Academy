"use client";

import { useEffect, useMemo, useState } from "react";
import { History, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  buildContentHistorySentence,
  listContentHistory,
} from "@/lib/api/content-history";
import { type ContentHistoryEntry, type ModuleSummary } from "@/lib/api/types";

type HistoryTabProps = {
  courseId: string;
  modules: ModuleSummary[];
};

const FIELD_LABELS: Record<string, string> = {
  title: "Título",
  description: "Descrição",
  level: "Nível",
  status: "Status",
  audience: "Público",
  language: "Idioma",
  category: "Categoria",
  subcategories: "Subcategorias",
  content_type: "Tipo de conteúdo",
  content_url: "Endereço do conteúdo",
  duration_minutes: "Duração em minutos",
  order: "Ordem",
  is_public: "Conteúdo público",
};

const HIDDEN_SNAPSHOT_FIELDS = new Set([
  "id",
  "course_id",
  "module_id",
  "created_at",
  "updated_at",
  "owner_id",
  "thumb_id",
]);

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Não informado";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function actionIcon(entry: ContentHistoryEntry) {
  if (entry.action === "insert") return <Plus className="h-4 w-4" />;
  if (entry.action === "delete") return <Trash2 className="h-4 w-4" />;
  return <Pencil className="h-4 w-4" />;
}

function DeletedContent({ entry }: { entry: ContentHistoryEntry }) {
  const fields = Object.entries(entry.before ?? {}).filter(
    ([field]) => !HIDDEN_SNAPSHOT_FIELDS.has(field),
  );

  return (
    <details className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-red-800">
        Ver conteúdo apagado para recriação
      </summary>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {fields.map(([field, value]) => (
          <div key={field} className="min-w-0">
            <dt className="font-medium text-gray-600">{FIELD_LABELS[field] ?? field}</dt>
            <dd className="break-words whitespace-pre-wrap text-gray-900">{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function UpdatedContent({ entry }: { entry: ContentHistoryEntry }) {
  if (entry.action !== "update" || entry.changedFields.length === 0) return null;

  return (
    <details className="mt-3 rounded-lg bg-gray-50 p-3">
      <summary className="cursor-pointer text-sm font-medium text-[#684A97]">
        Ver valores alterados
      </summary>
      <dl className="mt-3 space-y-2 text-sm">
        {entry.changedFields.map((field) => (
          <div key={field}>
            <dt className="font-medium text-gray-700">{FIELD_LABELS[field] ?? field}</dt>
            <dd className="text-gray-600">
              <span className="line-through">{formatValue(entry.before?.[field])}</span>
              <span aria-hidden="true"> → </span>
              <span className="text-gray-900">{formatValue(entry.after?.[field])}</span>
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

export default function HistoryTab({ courseId, modules }: HistoryTabProps) {
  const [entries, setEntries] = useState<ContentHistoryEntry[]>([]);
  const [knownAuthors, setKnownAuthors] = useState<Map<string, string>>(new Map());
  const [knownModules, setKnownModules] = useState<Map<string, string>>(
    () => new Map(modules.map((courseModule) => [courseModule.id, courseModule.title])),
  );
  const [moduleId, setModuleId] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [periodDays, setPeriodDays] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const startDate = periodDays
      ? new Date(Date.now() - Number(periodDays) * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    listContentHistory(courseId, {
      moduleId: moduleId || undefined,
      authorId: authorId || undefined,
      startDate,
    }).then((historyEntries) => {
      if (!active) return;
      setEntries(historyEntries);
      setKnownAuthors((current) => {
        const next = new Map(current);
        for (const entry of historyEntries) {
          if (entry.authorId) next.set(entry.authorId, entry.authorName);
        }
        return next;
      });
      setKnownModules((current) => {
        const next = new Map(current);
        for (const entry of historyEntries) {
          if (entry.table !== "course_module") continue;
          const data = entry.after ?? entry.before;
          const title = typeof data?.title === "string" ? data.title : "Módulo sem título";
          if (!next.has(entry.recordId)) next.set(entry.recordId, title);
        }
        return next;
      });
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [authorId, courseId, moduleId, periodDays]);

  useEffect(() => {
    setKnownModules((current) => {
      const next = new Map(current);
      for (const courseModule of modules) next.set(courseModule.id, courseModule.title);
      return next;
    });
  }, [modules]);

  const authors = useMemo(
    () => [...knownAuthors.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR")),
    [knownAuthors],
  );
  const moduleOptions = useMemo(
    () => [...knownModules.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR")),
    [knownModules],
  );

  return (
    <section className="rounded bg-white p-4 shadow">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-5 w-5 text-[#684A97]" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Histórico do conteúdo</h2>
          <p className="text-sm text-gray-500">Alterações de cursos, módulos e aulas, da mais recente para a mais antiga.</p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 rounded-lg bg-gray-50 p-3 md:grid-cols-3">
        <label className="text-sm font-medium text-gray-700">
          Módulo
          <select
            value={moduleId}
            onChange={(event) => setModuleId(event.target.value)}
            className="mt-1 w-full rounded border bg-white px-3 py-2 font-normal"
          >
            <option value="">Todos os módulos</option>
            {moduleOptions.map(([id, title]) => (
              <option key={id} value={id}>{title}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-gray-700">
          Autor
          <select
            value={authorId}
            onChange={(event) => setAuthorId(event.target.value)}
            className="mt-1 w-full rounded border bg-white px-3 py-2 font-normal"
          >
            <option value="">Todas as pessoas</option>
            {authors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>

        <label className="text-sm font-medium text-gray-700">
          Período
          <select
            value={periodDays}
            onChange={(event) => setPeriodDays(event.target.value)}
            className="mt-1 w-full rounded border bg-white px-3 py-2 font-normal"
          >
            <option value="">Todo o período</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando histórico...
        </div>
      ) : entries.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-gray-500">
          Nenhuma alteração encontrada para estes filtros.
        </p>
      ) : (
        <ol className="relative ml-3 border-l-2 border-purple-100">
          {entries.map((entry) => (
            <li key={entry.id} className="relative mb-6 ml-6 last:mb-0">
              <span className="absolute -left-[2.05rem] flex h-7 w-7 items-center justify-center rounded-full bg-[#684A97] text-white ring-4 ring-white">
                {actionIcon(entry)}
              </span>
              <article className="rounded-lg border border-gray-100 p-4 shadow-sm">
                <p className="text-gray-900">{buildContentHistorySentence(entry)}</p>
                <time dateTime={entry.occurredAt} className="mt-1 block text-xs text-gray-500">
                  {new Date(entry.occurredAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
                {entry.action === "delete" && <DeletedContent entry={entry} />}
                <UpdatedContent entry={entry} />
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
