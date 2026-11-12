import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/server";
import { type CourseRow, type CourseSummary, mapCourse } from "./types";

export interface HeroData {
    n_alunos: number;
    n_escolas: number;
    n_aulas: number;
    subtitulo: string;
    /** O que a coordenação digitou em "Números da página inicial", sem os cadastros da gestão. */
    base: { escolas: number; alunos: number; aulas: number };
}

export interface AboutUsSlide { src: string; alt: string; }
export interface FooterLink { href: string; iconSrc: string; alt: string; nome: string; }

/** Números e chamada da home: dados públicos, lidos sem login (a home é guardada pronta). */
export async function getHero(): Promise<HeroData | null> {
    const supabase = createPublicClient();
    const keys = ["alunos_atendidos", "escolas_atendidas", "public_aulas_realizadas", "hero1"];
    const [{ data }, { data: numeros }] = await Promise.all([
        supabase.from("system_config").select("key, value").in("key", keys),
        // Base do system_config + escolas, alunos e encontros concluídos da gestão (migrations 20261108 e 20261114).
        supabase.rpc("numeros_da_home").maybeSingle<{ escolas: number; alunos: number; aulas?: number }>(),
    ]);

    // Sem a função (erro), cai só na base.
    const lookup = Object.fromEntries((data ?? []).map((row) => [(row as { key: string; value: string }).key, (row as { key: string; value: string }).value]));
    return {
        n_alunos: Number(numeros?.alunos ?? lookup.alunos_atendidos ?? 0) || 0,
        n_escolas: Number(numeros?.escolas ?? lookup.escolas_atendidas ?? 0) || 0,
        n_aulas: Number(numeros?.aulas ?? lookup.public_aulas_realizadas ?? 0) || 0,
        subtitulo: lookup.hero1 || "",
        base: {
            escolas: Number(lookup.escolas_atendidas) || 0,
            alunos: Number(lookup.alunos_atendidos) || 0,
            aulas: Number(lookup.public_aulas_realizadas) || 0,
        },
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
