"use client";

/**
 * Estado do topo do site (login, nome, foto, acesso à gestão, avisos não lidos)
 * guardado UMA vez para a aba inteira.
 *
 * Antes cada página montava o topo do zero: mostrava "Entrar", depois buscava a
 * sessão, o perfil e a gestão, e só então trocava pela foto — a cada clique. Aqui
 * a leitura acontece uma vez, fica em memória enquanto a pessoa navega e numa
 * cópia em sessionStorage para recarregamentos; o topo novo já nasce pronto.
 */
import { createClient } from "@/lib/supabase/client";
import { temAcessoGestaoAction } from "@/app/gestao/actions";

export type HeaderSession = {
    /** "unknown" só existe até a primeira leitura: o topo não mostra nem Entrar nem foto. */
    status: "unknown" | "out" | "in";
    userId: string | null;
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
    gestao: boolean;
    unread: number;
    /** Falta telefone ou endereço: o topo mostra um aviso para completar o perfil. */
    perfilIncompleto: boolean;
};

const STORAGE_KEY = "minds.topo.v1";
const UNKNOWN: HeaderSession = {
    status: "unknown",
    userId: null,
    email: null,
    name: null,
    avatarUrl: null,
    gestao: false,
    unread: 0,
    perfilIncompleto: false,
};
const OUT: HeaderSession = { ...UNKNOWN, status: "out" };

let state: HeaderSession | null = null;
let started = false;
const listeners = new Set<() => void>();

function readStored(): HeaderSession {
    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return UNKNOWN;
        const parsed = JSON.parse(raw) as Partial<HeaderSession>;
        if (parsed.status !== "in" && parsed.status !== "out") return UNKNOWN;
        return { ...UNKNOWN, ...parsed };
    } catch {
        return UNKNOWN;
    }
}

function set(next: HeaderSession) {
    state = next;
    try {
        if (next.status === "unknown") window.sessionStorage.removeItem(STORAGE_KEY);
        else window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // aba anônima sem storage: segue só em memória
    }
    listeners.forEach((l) => l());
}

export function patchHeaderSession(patch: Partial<HeaderSession>) {
    set({ ...getHeaderSession(), ...patch });
}

export function getHeaderSession(): HeaderSession {
    if (state === null) state = typeof window === "undefined" ? UNKNOWN : readStored();
    return state;
}

export function getServerHeaderSession(): HeaderSession {
    return UNKNOWN;
}

async function carregarUsuario(userId: string, email: string | null, nomeMeta: string | null) {
    const supabase = createClient();
    const [perfil, gestao, incompleto] = await Promise.all([
        supabase.from("user_profile").select("full_name, avatar_url").eq("id", userId).maybeSingle(),
        temAcessoGestaoAction().catch(() => false),
        perfilEstaIncompleto(supabase),
    ]);
    // Se a pessoa saiu ou trocou de conta enquanto isto chegava, descarta.
    if (getHeaderSession().userId !== userId) return;
    patchHeaderSession({
        name: perfil.data?.full_name || nomeMeta || email,
        avatarUrl: perfil.data?.avatar_url ?? null,
        gestao: gestao === true,
        perfilIncompleto: incompleto,
    });
}

/**
 * Telefone e endereço ficam fora do cadastro (que é o mínimo) e se completam no
 * perfil depois. Telefone/endereço não são legíveis direto por `authenticated`:
 * a função devolve só os da própria pessoa. Na dúvida (erro), não acusa nada.
 */
export function faltaDadoPessoal(dados: { phone?: string | null; address?: string | null } | null | undefined): boolean {
    if (!dados) return false;
    return !dados.phone?.trim() || !dados.address?.trim();
}

async function perfilEstaIncompleto(supabase: ReturnType<typeof createClient>): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc("meus_dados_pessoais");
        if (error) return false;
        return faltaDadoPessoal((data as { phone: string | null; address: string | null }[] | null)?.[0]);
    } catch {
        return false;
    }
}

function start() {
    if (started || typeof window === "undefined") return;
    started = true;
    const supabase = createClient();
    supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user ?? null;
        const atual = getHeaderSession();
        if (!user) {
            if (atual.status !== "out") set(OUT);
            return;
        }
        if (atual.status === "in" && atual.userId === user.id) {
            // Mesma conta já conhecida: mostra o que tem e só atualiza nome/foto/gestão por baixo.
            if (_event === "INITIAL_SESSION" || _event === "SIGNED_IN" || _event === "USER_UPDATED") {
                void carregarUsuario(user.id, user.email ?? null, user.user_metadata?.full_name ?? null);
            }
            return;
        }
        set({
            ...UNKNOWN,
            status: "in",
            userId: user.id,
            email: user.email ?? null,
            name: user.user_metadata?.full_name ?? user.email ?? null,
        });
        void carregarUsuario(user.id, user.email ?? null, user.user_metadata?.full_name ?? null);
    });
}

export function subscribeHeaderSession(listener: () => void) {
    start();
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Só para testes: volta ao estado de uma aba nova. */
export function __resetHeaderSessionForTests() {
    state = null;
    started = false;
    listeners.clear();
}
