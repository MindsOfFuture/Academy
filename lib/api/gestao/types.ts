// Tipos do módulo de gestão interna (schema `gestao.*`, spec 002).
//
// Segue a convenção de lib/api: `*Row` (snake_case, cru do Supabase) →
// `*Summary` (camelCase, modelo de exibição). Os indicadores do convênio não
// são colunas nem linhas armazenadas — são derivados por query de agregação
// sobre as tabelas normalizadas (spec 002, "indicador como dado").

export type GestaoPapel = "coordenacao" | "bolsista";

export type ReservaStatus = "planejada" | "confirmada" | "realizada" | "cancelada";
export type TermoStatus = "pendente" | "arquivado";
export type AssinaturaStatus = "pendente" | "assinado";

// ---------------------------------------------------------------------------
// Linhas cruas (snake_case)
// ---------------------------------------------------------------------------

export interface PapelMembroRow {
    user_profile_id: string;
    papel: GestaoPapel;
    concedido_por: string | null;
    criado_em: string;
    atualizado_em: string;
}

export interface EscolaRow {
    id: string;
    nome: string;
    categoria: string;
    cidade: string;
    criado_em: string;
    atualizado_em: string;
    criado_por: string | null;
}

export interface AlunoRow {
    id: string;
    nome: string;
    idade: number;
    escola_id: string;
    categoria_escola: string;
    ano_escolar: string;
    modalidade: string;
    execucao: string;
    cidade: string;
    criado_em: string;
    atualizado_em: string;
    criado_por: string | null;
}

export interface ReservaRow {
    id: string;
    escola_id: string;
    onibus: boolean;
    dias: string;
    horarios: string;
    modalidade: string;
    numero_alunos: number;
    serie: string;
    status: ReservaStatus;
    criado_em: string;
    atualizado_em: string;
    criado_por: string | null;
}

export interface ReservaTermoRow {
    id: string;
    reserva_id: string;
    aluno_id: string;
    status: TermoStatus;
    criado_em: string;
    atualizado_em: string;
}

export interface AgendaRow {
    id: string;
    data: string;
    escola_id: string;
    aulas: string;
    modalidade: string;
    horario: string;
    criado_em: string;
    atualizado_em: string;
    criado_por: string | null;
}

export interface AgendaBolsistaRow {
    id: string;
    agenda_id: string;
    bolsista_id: string;
    carga: string;
    criado_em: string;
}

export interface AulaRow {
    id: string;
    agenda_id: string;
    titulo: string;
    realizada_em: string | null;
    criado_em: string;
    atualizado_em: string;
}

export interface PresencaRow {
    id: string;
    aula_id: string;
    aluno_id: string;
    presente: boolean;
    assinatura_status: AssinaturaStatus;
    bolsista_id: string | null;
    professor_id: string | null;
    criado_em: string;
}

export interface ListaEnviadaRow {
    id: string;
    escola_id: string;
    reserva_id: string | null;
    nomes: string[];
    criado_em: string;
    criado_por: string | null;
}

// ---------------------------------------------------------------------------
// Modelos de exibição (camelCase)
// ---------------------------------------------------------------------------

export interface EscolaSummary {
    id: string;
    nome: string;
    categoria: string;
    cidade: string;
}

export interface AlunoSummary {
    id: string;
    nome: string;
    idade: number;
    escolaId: string;
    categoriaEscola: string;
    anoEscolar: string;
    modalidade: string;
    execucao: string;
    cidade: string;
}

export interface ReservaSummary {
    id: string;
    escolaId: string;
    onibus: boolean;
    dias: string;
    horarios: string;
    modalidade: string;
    numeroAlunos: number;
    serie: string;
    status: ReservaStatus;
}

export interface AgendaSummary {
    id: string;
    data: string;
    escolaId: string;
    aulas: string;
    modalidade: string;
    horario: string;
}

export interface AulaSummary {
    id: string;
    agendaId: string;
    titulo: string;
    realizadaEm: string | null;
}

export interface PresencaSummary {
    id: string;
    aulaId: string;
    alunoId: string;
    presente: boolean;
    assinaturaStatus: AssinaturaStatus;
    bolsistaId: string | null;
    professorId: string | null;
}

export interface ListaEnviadaSummary {
    id: string;
    escolaId: string;
    reservaId: string | null;
    nomes: string[];
}

// ---------------------------------------------------------------------------
// Indicadores do convênio (derivados por query — nunca linha armazenada)
// ---------------------------------------------------------------------------

/** Indicador 1: total de alunos participantes. */
export interface IndicadorAlunos {
    total: number;
}

/** Indicador 2: reservas de ônibus. */
export interface IndicadorReservasOnibus {
    total: number;
}

/** Indicador 3: termos arquivados vs. pendentes. */
export interface IndicadorTermos {
    pendentes: number;
    arquivados: number;
}

/** Indicador 4: presença por aula. */
export interface IndicadorPresenca {
    presentes: number;
    ausentes: number;
}

/** Indicador 5: aulas/módulos realizados. */
export interface IndicadorAulas {
    total: number;
}

/** Indicador 6: alocação/carga dos bolsistas. */
export interface IndicadorCargaBolsistas {
    items: { bolsistaId: string; carga: string }[];
    totalAlocacoes: number;
}

/**
 * Agregado dos seis indicadores do convênio, num único objeto consumido pela
 * rota/UI do módulo de gestão.
 */
export interface IndicadoresGestao {
    alunos: IndicadorAlunos;
    reservasOnibus: IndicadorReservasOnibus;
    termos: IndicadorTermos;
    presenca: IndicadorPresenca;
    aulas: IndicadorAulas;
    cargaBolsistas: IndicadorCargaBolsistas;
}