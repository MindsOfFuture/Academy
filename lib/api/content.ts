import "server-only";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export interface HeroData {
    n_alunos: number;
    n_escolas: number;
    subtitulo: string;
}

export interface AboutUsSlide { src: string; alt: string; }
export interface FooterLink { href: string; iconSrc: string; alt: string; nome: string; }

export async function getHero(): Promise<HeroData | null> {
    const supabase = await createServerSupabase();
    const keys = ["hero_n_alunos", "hero_n_escolas", "hero_subtitulo"];
    const { data } = await supabase
        .from("system_config")
        .select("key, value")
        .in("key", keys);

    if (!data || data.length === 0) {
        return {
            n_alunos: 0,
            n_escolas: 0,
            subtitulo: "",
        };
    }

    const lookup = Object.fromEntries(data.map((row: any) => [row.key, row.value]));
    return {
        n_alunos: Number(lookup.hero_n_alunos || 0),
        n_escolas: Number(lookup.hero_n_escolas || 0),
        subtitulo: lookup.hero_subtitulo || "",
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
