import "server-only";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export interface HeroData {
    n_alunos: number;
    n_escolas: number;
    subtitulo: string;
    /** O que a coordenação digitou em "Números da página inicial", sem os cadastros da gestão. */
    base: { escolas: number; alunos: number };
}

export interface AboutUsSlide { src: string; alt: string; }
export interface FooterLink { href: string; iconSrc: string; alt: string; nome: string; }

export async function getHero(): Promise<HeroData | null> {
    const supabase = await createServerSupabase();
    const keys = ["alunos_atendidos", "escolas_atendidas", "hero1"];
    const [{ data }, { data: numeros }] = await Promise.all([
        supabase.from("system_config").select("key, value").in("key", keys),
        // Base do system_config + escolas e alunos da gestão (migration 20261108).
        supabase.rpc("numeros_da_home").maybeSingle<{ escolas: number; alunos: number }>(),
    ]);

    // Sem a função (erro), cai só na base.
    const lookup = Object.fromEntries((data ?? []).map((row) => [(row as { key: string; value: string }).key, (row as { key: string; value: string }).value]));
    return {
        n_alunos: Number(numeros?.alunos ?? lookup.alunos_atendidos ?? 0) || 0,
        n_escolas: Number(numeros?.escolas ?? lookup.escolas_atendidas ?? 0) || 0,
        subtitulo: lookup.hero1 || "",
        base: { escolas: Number(lookup.escolas_atendidas) || 0, alunos: Number(lookup.alunos_atendidos) || 0 },
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
