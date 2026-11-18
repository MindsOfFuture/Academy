import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/server";
import { type CourseRow, type CourseSummary, mapCourse } from "./types";

export type ChaveDestaque = "escolas" | "alunos" | "aulas";

/** Um número da faixa logo abaixo do logo da home (spec 019, 021 e 028). */
export interface Destaque {
    chave: ChaveDestaque;
    /** Texto embaixo do número, definido pela coordenação. */
    rotulo: string;
    /** Se aparece na home. */
    mostrar: boolean;
    /** O que o site mostra: base + cadastros da gestão. */
    total: number;
    /** O que a coordenação digitou, sem os cadastros da gestão. */
    base: number;
}

export interface HeroData {
    subtitulo: string;
    /** Sempre os três, na ordem da home; quem desenha filtra `mostrar`. */
    destaques: Destaque[];
}

/** Texto e visibilidade quando a coordenação ainda não mexeu (spec 028: aulas começa escondido). */
export const DESTAQUES_PADRAO: Record<ChaveDestaque, { rotulo: string; mostrar: boolean }> = {
    escolas: { rotulo: "Escolas atendidas", mostrar: true },
    alunos: { rotulo: "Alunos impactados", mostrar: true },
    aulas: { rotulo: "Aulas realizadas", mostrar: false },
};

const CHAVES_DESTAQUE: readonly ChaveDestaque[] = ["escolas", "alunos", "aulas"];
const CHAVE_BASE: Record<ChaveDestaque, string> = {
    escolas: "escolas_atendidas",
    alunos: "alunos_atendidos",
    aulas: "public_aulas_realizadas",
};

export interface AboutUsSlide { src: string; alt: string; }
export interface FooterLink { href: string; iconSrc: string; alt: string; nome: string; }

/** Números e chamada da home: dados públicos, lidos sem login (a home é guardada pronta). */
export async function getHero(): Promise<HeroData | null> {
    const supabase = createPublicClient();
    const keys = [
        ...Object.values(CHAVE_BASE),
        ...CHAVES_DESTAQUE.flatMap((c) => [`public_home_rotulo_${c}`, `public_home_mostrar_${c}`]),
        "hero1",
    ];
    const [{ data }, { data: numeros }] = await Promise.all([
        supabase.from("system_config").select("key, value").in("key", keys),
        // Base do system_config + escolas, alunos e encontros concluídos da gestão (migrations 20261108 e 20261114).
        supabase.rpc("numeros_da_home").maybeSingle<{ escolas: number; alunos: number; aulas?: number }>(),
    ]);

    // Sem a função (erro), cai só na base.
    const lookup: Record<string, string | undefined> = Object.fromEntries(
        (data ?? []).map((row) => [(row as { key: string; value: string }).key, (row as { key: string; value: string }).value]),
    );
    return {
        subtitulo: lookup.hero1 || "",
        destaques: CHAVES_DESTAQUE.map((chave) => {
            const base = Number(lookup[CHAVE_BASE[chave]]) || 0;
            const mostrar = lookup[`public_home_mostrar_${chave}`];
            return {
                chave,
                rotulo: lookup[`public_home_rotulo_${chave}`]?.trim() || DESTAQUES_PADRAO[chave].rotulo,
                mostrar: mostrar === undefined ? DESTAQUES_PADRAO[chave].mostrar : mostrar === "true",
                total: Number(numeros?.[chave] ?? base) || 0,
                base,
            };
        }),
    };
}

export async function getAboutUs(): Promise<{ aboutUsSlides: AboutUsSlide[] } | null> {
    // Não há tabela dedicada na nova estrutura; usamos fallback vazio.
    return { aboutUsSlides: [] };
}

export async function getFooter(): Promise<FooterLink[]> {
    // Sem tabela específica; devolve lista vazia para manter compatibilidade.
    return [];
}

/**
 * Cursos ativos, do mais procurado ao menos. O cliente decide o que se vê: com
 * login (Trilhas), o professor vê também os cursos de professor; na home, sem login.
 */
export async function consultarCursosAtivos(supabase: SupabaseClient): Promise<CourseSummary[]> {
    const { data, error } = await supabase
        .from("course")
        .select(`
            id,
            title,
            description,
            level,
            status,
            audience,
            thumb:media_file!course_thumb_id_fkey(url),
            enrollments:enrollment(count)
        `)
        .eq("status", "active");

    if (error || !data) return [];

    const mapped = data.map((row) => ({
        ...mapCourse(row as unknown as CourseRow),
        enrollmentCount: (row as { enrollments?: { count: number }[] }).enrollments?.[0]?.count ?? 0,
    }));

    return mapped.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
}

/** Cursos da home: só o que o visitante anônimo vê, porque a página é a mesma para todos. */
export async function listarCursosDaHome(): Promise<CourseSummary[]> {
    return consultarCursosAtivos(createPublicClient());
}
