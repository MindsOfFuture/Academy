
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

export type ArticleProps = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
  readTime: string;
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

export async function getArticles(): Promise<ArticleProps[]> {
    const mockArticles: ArticleProps[] = [
        {
            id: "1",
            title: "Robótica Educacional: Transformando o Aprendizado",
            description: "Descubra como a robótica educacional está revolucionando o ensino nas escolas públicas de Minas Gerais e desenvolvendo competências do século XXI.",
            imageUrl: "/lego.jpg",
            author: "Equipe Academy",
            publishedAt: "2024-08-15",
            readTime: "5 min"
        },
        {
            id: "2",
            title: "Programação Para Jovens: Abrindo Portas Para o Futuro",
            description: "Como o ensino de programação está criando novas oportunidades para estudantes da rede pública e preparando-os para o mercado de trabalho.",
            imageUrl: "/minds.jpg",
            author: "Prof. Tech",
            publishedAt: "2024-08-10",
            readTime: "7 min"
        },
        {
            id: "3",
            title: "Parceria UFJF e Governo de MG: Inovação na Educação",
            description: "Conheça os resultados da parceria entre a Universidade Federal de Juiz de Fora e o Governo de Minas Gerais no desenvolvimento tecnológico educacional.",
            imageUrl: "/scratch.png",
            author: "Dr. Inovação",
            publishedAt: "2024-08-05",
            readTime: "6 min"
        },
        {
            id: "4",
            title: "Democratizando o Acesso à Tecnologia",
            description: "Como estamos levando educação tecnológica de qualidade para todas as regiões de Minas Gerais, promovendo inclusão digital.",
            imageUrl: "/lego.jpg",
            author: "Coordenação Pedagógica",
            publishedAt: "2024-07-28",
            readTime: "4 min"
        },
        {
            id: "5",
            title: "Protagonismo Juvenil e Competências Digitais",
            description: "O impacto do projeto no desenvolvimento do protagonismo dos jovens e na construção de competências essenciais para o futuro.",
            imageUrl: "/minds.jpg",
            author: "Equipe Social",
            publishedAt: "2024-07-20",
            readTime: "8 min"
        },
        {
            id: "6",
            title: "Resultados e Impactos do Projeto Academy",
            description: "Dados e estatísticas que mostram o sucesso do projeto nas escolas atendidas e o impacto na vida dos estudantes participantes.",
            imageUrl: "/scratch.png",
            author: "Análise de Dados",
            publishedAt: "2024-07-15",
            readTime: "6 min"
        }
    ];

    return mockArticles;

    // Código real para quando a tabela estiver criada:
    /*
    const supabase = createClient();
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('publishedAt', { ascending: false })
        .limit(6);

    if (error) {
        return [];
    }

    return data as ArticleProps[];
    */
}
