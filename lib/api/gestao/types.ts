// Tipos do módulo de gestão interna (schema `gestao.*`, spec 002).
//
// Segue a convenção de lib/api: `*Row` (snake_case, cru do Supabase) →
// `*Summary` (camelCase, modelo de exibição). Os indicadores do convênio não
// são colunas nem linhas armazenadas — são derivados por query de agregação
// sobre as tabelas normalizadas (spec 002, "indicador como dado").

/** Papel efetivo de quem usa a gestão: quem tem os dois usa como coordenação. */
export type GestaoPapel = "coordenacao" | "bolsista";

/** Papéis que uma pessoa tem na equipe; ao menos um fica ligado (spec 012). */
export interface PapeisMembro {
    coordenacao: boolean;
    bolsista: boolean;
}

export type ReservaStatus = "planejada" | "confirmada" | "realizada" | "cancelada";
export type TermoStatus = "pendente" | "arquivado";
export type AssinaturaStatus = "pendente" | "assinado";

// ---------------------------------------------------------------------------
// Linhas cruas (snake_case)
// ---------------------------------------------------------------------------

export interface PapelMembroRow extends PapeisMembro {
    user_profile_id: string;
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

// ---------------------------------------------------------------------------
// Equipe e bolsa (spec 003)
// ---------------------------------------------------------------------------

export type ModalidadeBolsa = "graduacao" | "mestrado" | "bdcti" | "critt" | "outra";

/** Linha devolvida pela função `gestao.equipe()` (só coordenação). */
export interface EquipeRow extends PapeisMembro {
    user_profile_id: string;
    nome: string | null;
    email: string | null;
    desligado_em: string | null;
    membro_desde: string;
    bolsa_id: string | null;
    modalidade: ModalidadeBolsa | null;
    carga_semanal_horas: number | string | null;
    bolsa_inicio: string | null;
    bolsa_fim: string | null;
    tem_alocacao: boolean;
}

export interface BolsaVigente {
    id: string;
    modalidade: ModalidadeBolsa;
    cargaSemanalHoras: number;
    inicio: string;
    fim: string;
}

export interface MembroEquipe extends PapeisMembro {
    userProfileId: string;
    nome: string;
    email: string;
    desligadoEm: string | null;
    membroDesde: string;
    bolsaVigente: BolsaVigente | null;
    temAlocacao: boolean;
}

/** Linha devolvida por `gestao.buscar_usuarios()` (spec 015). */
export interface UsuarioEncontradoRow {
    id: string;
    nome: string | null;
    email_parcial: string;
    coordenacao: boolean | null;
    bolsista: boolean | null;
    desligado_em: string | null;
}

/** Pessoa achada na busca da tela de equipe; e-mail só parcial, para separar homônimos. */
export interface UsuarioEncontrado {
    id: string;
    nome: string;
    emailParcial: string;
    /** Já está na equipe e ativa: escolher soma o papel ao que ela já tem. */
    naEquipe: boolean;
}

export interface NovaBolsa {
    bolsistaId: string;
    modalidade: ModalidadeBolsa;
    cargaSemanalHoras: number;
    inicio: string;
    fim: string;
}

/** Item da tela “Hoje”: o que a pessoa tem a fazer, sempre com link. */
export interface Pendencia {
    tipo: "proxima_aula" | "aula_sem_registro" | "bolsista_sem_bolsa" | "melhoria_sem_resposta" | "melhoria_respondida";
    titulo: string;
    detalhe: string;
    href: string;
    urgente?: boolean;
}

/** Resultado de uma Server Action de formulário (`useActionState`). */
export interface EstadoAcao {
    ok: boolean;
    mensagem: string;
}

// ---------------------------------------------------------------------------
// Pedido de melhoria (spec 011)
// ---------------------------------------------------------------------------

export type AreaMelhoria = "plataforma" | "gestao" | "aulas_material" | "processo" | "outra";
export type StatusMelhoria = "nova" | "em_analise" | "aceita" | "recusada" | "duplicada" | "entregue";

/** Linha devolvida por `gestao.listar_melhorias()`. */
export interface MelhoriaRow {
    id: string;
    autor: string;
    autor_nome: string;
    titulo: string;
    area: AreaMelhoria;
    problema: string;
    proposta: string;
    quem_sofre: string | null;
    status: StatusMelhoria;
    resposta: string | null;
    duplicada_de: string | null;
    link_execucao: string | null;
    respondida_em: string | null;
    criado_em: string;
    atualizado_em: string;
    apoios: number;
    apoiei: boolean;
    atrasada: boolean;
}

export interface Melhoria {
    id: string;
    autorId: string;
    autorNome: string;
    titulo: string;
    area: AreaMelhoria;
    problema: string;
    proposta: string;
    quemSofre: string | null;
    status: StatusMelhoria;
    resposta: string | null;
    duplicadaDe: string | null;
    linkExecucao: string | null;
    respondidaEm: string | null;
    criadoEm: string;
    apoios: number;
    apoiei: boolean;
    atrasada: boolean;
}

export interface NovaMelhoria {
    titulo: string;
    area: AreaMelhoria;
    problema: string;
    proposta: string;
    quemSofre: string | null;
}

export interface RespostaMelhoria {
    status: StatusMelhoria;
    resposta: string | null;
    duplicadaDe: string | null;
    linkExecucao: string | null;
}

// ---------------------------------------------------------------------------
// Alocação de bolsistas nos encontros (spec 014)
// ---------------------------------------------------------------------------

export type StatusTurma = "prevista" | "em_andamento" | "encerrada" | "nao_abriu";
export type SituacaoAlocacao =
    | "prevista"
    | "cumprida"
    | "faltou_avisou"
    | "faltou_sem_aviso"
    | "substituida"
    | "retirada";

export interface TurmaRow {
    id: string;
    escola_id: string;
    nome: string;
    modalidade: string;
    inicio: string;
    fim: string | null;
    status: StatusTurma;
    motivo: string | null;
    escola: { nome: string } | { nome: string }[] | null;
}

export interface Turma {
    id: string;
    escolaId: string;
    escolaNome: string;
    nome: string;
    modalidade: string;
    inicio: string;
    fim: string | null;
    status: StatusTurma;
    motivo: string | null;
}

export interface AlocacaoRow {
    id: string;
    bolsista_id: string;
    situacao: SituacaoAlocacao;
    inicio: string | null;
    fim: string | null;
    coberto_por: string | null;
    motivo: string | null;
    carga: string;
}

export interface Alocacao {
    id: string;
    bolsistaId: string;
    bolsistaNome: string;
    situacao: SituacaoAlocacao;
    /** Intervalo parcial ("14:00"); nulo = o encontro inteiro. */
    inicio: string | null;
    fim: string | null;
    cobertoPor: string | null;
    cobertoPorNome: string | null;
    motivo: string | null;
    carga: string;
}

export interface EncontroRow {
    id: string;
    data: string;
    inicio: string | null;
    fim: string | null;
    horario: string;
    modalidade: string;
    aulas: string;
    escola_id: string | null;
    turma_id: string | null;
    cancelado_em: string | null;
    motivo_cancelamento: string | null;
    escola: { nome: string } | { nome: string }[] | null;
    turma: { nome: string; status: StatusTurma } | { nome: string; status: StatusTurma }[] | null;
    agenda_bolsista: AlocacaoRow[] | null;
}

export interface Encontro {
    id: string;
    data: string;
    inicio: string | null;
    fim: string | null;
    horario: string;
    modalidade: string;
    descricao: string;
    escolaId: string | null;
    /** Nulo quando o encontro é fora de escola (tarefa, reunião). */
    escolaNome: string | null;
    turmaId: string | null;
    turmaNome: string | null;
    turmaStatus: StatusTurma | null;
    canceladoEm: string | null;
    motivoCancelamento: string | null;
    alocacoes: Alocacao[];
}

export interface NovoEncontro {
    data: string;
    inicio: string;
    fim: string;
    modalidade: string;
    descricao: string;
    escolaId: string | null;
    turmaId: string | null;
    equipe: string[];
}

export interface NovaTurma {
    escolaId: string;
    nome: string;
    modalidade: string;
    inicio: string;
    fim: string | null;
}

export interface NovaEscola {
    nome: string;
    categoria: string;
    cidade: string;
}

export interface NovoAfastamento {
    bolsistaId: string;
    inicio: string;
    fim: string;
    motivo: string;
}

export interface Afastamento extends NovoAfastamento {
    id: string;
    bolsistaNome: string;
    /** Encontros do período em que a pessoa ainda está como prevista. */
    encontrosAfetados: { alocacaoId: string; encontroId: string; data: string; horario: string; modalidade: string }[];
}

/** Linha de `gestao.v_carga`: uma alocação e as horas que contam. */
export interface VCargaRow {
    bolsista_id: string;
    data: string;
    escola_id: string | null;
    turma_id: string | null;
    horas: number | string;
}

export interface CargaBolsista {
    bolsistaId: string;
    nome: string;
    total: number;
    porEscola: { escolaId: string | null; nome: string; horas: number }[];
    porTurma: { turmaId: string | null; nome: string; horas: number }[];
}

export interface RegistroHistorico {
    tabela: string;
    acao: "insert" | "update" | "delete";
    autorNome: string;
    ocorridoEm: string;
    /** Campos que mudaram, já com o valor antes e depois. */
    mudancas: { campo: string; antes: unknown; depois: unknown }[];
}
