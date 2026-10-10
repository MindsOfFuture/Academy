export type TurmaStatus = "planejada" | "em_andamento" | "encerrada" | "cancelada";
export interface TurmaRow {
  id: string; escola_id: string; reserva_id: string | null; nome: string; modalidade: string;
  semestre: string; status: TurmaStatus; encerrada_em: string | null; encerrada_por: string | null;
}
export interface TurmaSummary {
  id: string; escolaId: string; reservaId: string | null; nome: string; modalidade: string;
  semestre: string; status: TurmaStatus; encerradaEm: string | null; encerradaPor: string | null;
}
export interface MatriculaSummary {
  id: string; alunoId: string; nome: string; inicio: string; fim: string | null;
  termoStatus: "pendente" | "legado_arquivado" | "arquivado"; certificadoEntregueEm: string | null;
}
export interface EncontroSummary {
  id: string; data: string; titulo: string; inicio: string | null; fim: string | null; professor: string | null;
  aulaId: string | null; realizadaEm: string | null;
}
export interface MarcaPresenca { aulaId: string; alunoId: string; presente: boolean; atualizadoPor: string | null; atualizadoEm: string; autorNome?: string }
export interface IndicadoresTurma {
  matriculas: number; encontrosPrevistos: number; encontrosRealizados: number; horasAula: number;
  presentes: number; ausentes: number; naoInformados: number; frequencia: number | null; cobertura: number | null;
  termosPendentes: number; termosArquivados: number; termosLegadosSemArquivo: number; certificadosEntregues: number;
}
export interface TurmaDetail extends TurmaSummary {
  matriculas: MatriculaSummary[]; encontros: EncontroSummary[]; presencas: MarcaPresenca[];
  equipe: { id: string; nome: string }[]; indicadores: IndicadoresTurma;
}
export interface EstadoTurmas { ok: boolean; mensagem: string; href?: string }
export interface LinhaImportacao { origemLinha: string; alunoId: string }
