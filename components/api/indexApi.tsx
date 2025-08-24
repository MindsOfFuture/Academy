
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";

export type HeroProps = {
    n_alunos: number;
    n_escolas: number;
    subtitulo: string;
};

export type CourseProps = {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
};

export type AboutUsProps = {
    src: string;
    alt: string;
}
export type FooterProps = {
    href: string;
    iconSrc: string;
    alt: string;
    nome: string;
};

export async function getHero(): Promise<HeroProps | null> {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
        .from('hero')
        .select('*')
        .single();

    if (error) {
        return null;
    }
    return data as HeroProps;
}

export async function getAboutUs(): Promise<{ aboutUsSlides: AboutUsProps[] } | null> {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
        .from('about_us')
        .select('src, alt');

    if (error || !data) {
        return null;
    }

    return {
        aboutUsSlides: data as AboutUsProps[]
    };
}


export async function getNossosCursos(): Promise<CourseProps[]> {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
        .from('nossos_cursos')
        .select('*');

    if (error) {
        return [];
    }
    return data as CourseProps[];
}
export async function getUserTypeServer(): Promise<string> {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Usuário não autenticado.");
    }

    const { data, error } = await supabase
        .from('users')
        .select('type')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error("Erro do Supabase ao buscar tipo de usuário:", error);
        throw new Error("Não foi possível encontrar o perfil do usuário.");
    }

    return data.type;
}


export async function getFooter(): Promise<FooterProps[] | []> {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
        .from('footer')
        .select('href, iconSrc, alt, nome');

    if (error) {
        return [];
    }

    return data as FooterProps[];
}
