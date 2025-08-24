
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

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
    const supabase = createClient();
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
    const supabase = createClient();
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
    const supabase = createClient();
    const { data, error } = await supabase
        .from('nossos_cursos')
        .select('*');

    if (error) {
        return [];
    }
    console.log(data);
    return data as CourseProps[];
}
export async function getUserTypes(user: User | null | undefined): Promise<string> {
    const supabase = createClient();
    console.log(user);
    const { data, error } = await supabase
        .from('users')
        .select('tipo')
        .eq('id', user?.id);
    if (error) {
        return error.message || "Erro ao buscar tipo de usuário";
    }
    return data[0]?.tipo || "errooooo";
}
export async function getFooter(): Promise<FooterProps[] | []> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('footer')
        .select('href, iconSrc, alt, nome');

    if (error) {
        return [];
    }

    return data as FooterProps[];
}
