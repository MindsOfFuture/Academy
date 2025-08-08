
import { createClient } from "@/lib/supabase/client";

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

export async function getHero(): Promise<HeroProps | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('hero1')
        .select('conteudo')
        .single();

    if (error) {
        return null;
    }

    return data.conteudo as HeroProps;
}

export async function getNossosCursos(): Promise<CourseProps[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('nossos-cursos')
        .select('*');

    if (error) {
        return [];
    }

    return data as CourseProps[];
}
export async function getUserTypes(user: any): Promise<string> {
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