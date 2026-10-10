import type { EncontroSummary, LinhaImportacao, MatriculaSummary, TurmaDetail, TurmaStatus } from "./turmas-types";

export function texto(form: FormData, campo: string, limite = 200, obrigatorio = true): string {
  const raw = form.get(campo);
  const valor = typeof raw === "string" ? raw.trim() : "";
  if ((obrigatorio && !valor) || valor.length > limite) throw new Error(`Preencha ${campo} corretamente.`);
  return valor;
}
export function validarId(valor: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor)) throw new Error("Identificador inválido.");
  return valor;
}
export function validarData(valor: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(Date.parse(`${valor}T00:00:00Z`)) || new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) !== valor) throw new Error("Informe uma data válida.");
  return valor;
}
export function validarHorario(inicio: string, fim: string) {
  const padrao = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!padrao.test(inicio) || !padrao.test(fim) || fim <= inicio) throw new Error("O horário final precisa ser posterior ao inicial.");
  return { inicio, fim };
}
export function validarStatus(valor: string): TurmaStatus {
  if (!["planejada", "em_andamento", "encerrada", "cancelada"].includes(valor)) throw new Error("Escolha uma situação válida.");
  return valor as TurmaStatus;
}
export function validarSemestre(valor: string) {
  if (!/^20\d{2}\/[12]$/.test(valor)) throw new Error("Informe o semestre como 2026/2.");
  return valor;
}
export function alunosDoEncontro(matriculas: MatriculaSummary[], encontro: EncontroSummary) {
  return matriculas.filter((m) => m.inicio <= encontro.data && (!m.fim || m.fim >= encontro.data));
}
export function pendenciasDaTurma(turma: TurmaDetail): string[] {
  const itens: string[] = [];
  for (const encontro of turma.encontros) {
    const alunos = alunosDoEncontro(turma.matriculas, encontro);
    if (!encontro.realizadaEm) itens.push(`${encontro.data} — encontro sem comprovação de realização.`);
    const marcas = turma.presencas.filter((p) => p.aulaId === encontro.aulaId && alunos.some((a) => a.alunoId === p.alunoId));
    if (alunos.length > marcas.length) itens.push(`${encontro.data} — ${alunos.length - marcas.length} chamada(s) não informada(s).`);
    if (encontro.realizadaEm && (!encontro.inicio || !encontro.fim)) itens.push(`${encontro.data} — duração não informada.`);
  }
  for (const m of turma.matriculas) {
    if (m.termoStatus !== "arquivado") itens.push(`${m.nome} — ${m.termoStatus === "legado_arquivado" ? "termo legado sem arquivo e conferência" : "termo pendente"}.`);
  }
  return itens;
}
/** Formato intermediário explícito, não um leitor automático das planilhas reais. */
export function revisarImportacao(json: string): { linhas: LinhaImportacao[]; problemas: string[] } {
  if (json.length > 100000) throw new Error("Lote muito grande; divida em até 500 linhas.");
  const valor: unknown = JSON.parse(json);
  if (!Array.isArray(valor) || valor.length < 1 || valor.length > 500) throw new Error("Informe de 1 a 500 vínculos para revisão.");
  const problemas: string[] = [];
  const origens = new Set<string>(), alunos = new Set<string>();
  const linhas = valor.map((v, i) => {
    if (!v || typeof v !== "object") throw new Error(`Linha ${i + 1} inválida.`);
    const r = v as Record<string, unknown>;
    // Contatos e outros campos não mapeados não são copiados silenciosamente.
    if (Object.keys(r).some((k) => !["origemLinha", "alunoId"].includes(k))) problemas.push(`Linha ${i + 1}: campos não mapeados; remova-os antes de confirmar.`);
    if (typeof r.origemLinha !== "string" || !r.origemLinha.trim() || r.origemLinha.length > 200 || typeof r.alunoId !== "string") throw new Error(`Linha ${i + 1}: escolha explicitamente um aluno cadastrado e identifique a origem.`);
    validarId(r.alunoId);
    if (origens.has(r.origemLinha)) problemas.push(`Linha ${i + 1}: origem repetida.`);
    if (alunos.has(r.alunoId)) problemas.push(`Linha ${i + 1}: vínculo repetido; revise a duplicata.`);
    origens.add(r.origemLinha); alunos.add(r.alunoId);
    return { origemLinha: r.origemLinha, alunoId: r.alunoId };
  });
  return { linhas, problemas };
}
