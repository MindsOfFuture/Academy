import { expect, test, type Page } from '@playwright/test';
import { TEST_USERS, loginViaUI, type TestUser } from '../fixtures/auth.fixture';

/**
 * Alocação pela interface, como a coordenação usa (spec 014).
 *
 * Dado dedicado, nunca bolsista real — preparação em e2e/README.md ("Gestão"):
 * conta da coordenação de teste, dois bolsistas de teste e duas escolas de teste.
 * Os encontros caem em 2001, longe do calendário de verdade, e cada execução
 * marca a atividade com um código próprio para achar o próprio encontro.
 *
 * No CI, credencial ausente FALHA em vez de pular: pular deixaria o CI verde sem
 * ter executado nada (ADR 012). Precisa de GESTAO_ENABLED=true no servidor.
 */

const COORD: TestUser | null =
  process.env.TEST_GESTAO_COORD_EMAIL && process.env.TEST_GESTAO_COORD_PASSWORD
    ? { email: process.env.TEST_GESTAO_COORD_EMAIL, password: process.env.TEST_GESTAO_COORD_PASSWORD, role: 'admin' }
    : null;
// Conta comum do Academy, sem linha em gestao.papel_membro.
const SEM_PAPEL = TEST_USERS.student;

const BOLSISTA_A = 'Bolsista E2E A';
const BOLSISTA_B = 'Bolsista E2E B';
const ESCOLA_1 = 'Escola E2E 1';
const ESCOLA_2 = 'Escola E2E 2';

const RODADA = Date.now().toString(36);
// Dia fixo por execução dentro de 2001: no passado, então o encontro já pode ser concluído.
const MES = `2001-${String((Date.now() % 12) + 1).padStart(2, '0')}`;
const DIA = `${MES}-${String((Math.floor(Date.now() / 12) % 28) + 1).padStart(2, '0')}`;

function exigir(user: TestUser | null, nome: string): TestUser {
  test.skip(!user && !process.env.CI, `${nome} não configurado`);
  if (!user) throw new Error(`CI sem ${nome}: o E2E da alocação não pode pular em silêncio.`);
  return user;
}

async function lancarEncontro(
  page: Page,
  e: { inicio: string; fim: string; escola: string; atividade: string; equipe: string[] },
) {
  await page.getByLabel('Data').fill(DIA);
  await page.getByLabel('Início').fill(e.inicio);
  await page.getByLabel('Fim').fill(e.fim);
  await page.getByLabel('Escola (opcional)').selectOption({ label: e.escola });
  await page.getByLabel('Atividade').fill(e.atividade);
  for (const nome of e.equipe) await page.getByRole('checkbox', { name: nome }).check();
  await page.getByRole('button', { name: 'Lançar encontro' }).click();
}

const lancado = (page: Page) => page.getByRole('status').filter({ hasText: /Encontro lançado com/ });
const sobreposicao = (page: Page) => page.getByRole('dialog', { name: 'Horário sobreposto' });

/** Execução anterior no mesmo dia pode gerar aviso de horário: aqui ele não é o assunto. */
async function lancarIgnorandoSobreposicao(page: Page) {
  await expect(lancado(page).or(sobreposicao(page))).toBeVisible();
  if (await sobreposicao(page).isVisible()) {
    await page.getByRole('button', { name: 'Lançar mesmo assim' }).click();
  }
  await expect(lancado(page)).toBeVisible();
}

test.describe.configure({ mode: 'serial' });

test('coordenação: cria, edita, conclui e confere no histórico', async ({ page }) => {
  const coord = exigir(COORD, 'TEST_GESTAO_COORD_EMAIL/PASSWORD');
  const atividade = `Lego E2E ${RODADA}`;

  await loginViaUI(page, coord, `/gestao/alocacao?mes=${MES}`);
  await expect(page.getByText('Área da coordenação')).toBeVisible();

  // Criar
  await lancarEncontro(page, { inicio: '14:00', fim: '16:00', escola: ESCOLA_1, atividade, equipe: [BOLSISTA_A] });
  await lancarIgnorandoSobreposicao(page);
  await page.getByRole('link', { name: new RegExp(atividade) }).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText(atividade);

  // Editar: A faltou avisando, B entra no encontro. A linha de A é a única antes de B entrar;
  // depois, o nome de cada um aparece também no "Quem cobriu" do outro.
  const equipe = page.getByRole('region', { name: 'Equipe' });
  const linhaA = equipe.getByRole('listitem');
  await linhaA.getByLabel('Situação').selectOption({ label: 'Faltou avisando' });
  await linhaA.getByLabel('Motivo ou observação').fill('Prova na faculdade');
  await linhaA.getByRole('button', { name: 'Salvar' }).click();
  await expect(equipe).toContainText(new RegExp(`${BOLSISTA_A}\\s*· Faltou avisando`));

  await equipe.getByLabel('Acrescentar pessoa').selectOption({ label: BOLSISTA_B });
  await equipe.getByRole('button', { name: 'Alocar' }).click();
  await expect(equipe.getByRole('status')).toHaveText('Pessoa alocada.');
  await expect(equipe).toContainText(new RegExp(`${BOLSISTA_B}\\s*· Prevista`));

  // Encerrar
  await page.getByRole('button', { name: 'Concluir encontro' }).click();
  const janela = page.getByRole('dialog', { name: 'Concluir encontro' });
  await janela.getByLabel('Relatório do encontro').fill('Encontro de teste automatizado, sem turma real.');
  await janela.getByRole('button', { name: 'Concluir', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reabrir encontro' })).toBeVisible();
  await expect(equipe).toContainText(new RegExp(`${BOLSISTA_B}\\s*· Cumprida`));
  await expect(equipe).toContainText(new RegExp(`${BOLSISTA_A}\\s*· Faltou avisando`));

  // Histórico
  const historico = page.getByRole('region', { name: 'Histórico' });
  await expect(historico).toContainText('lançou o encontro');
  await expect(historico).toContainText('alocou');
  await expect(historico).toContainText('situação: Prevista → Faltou avisando');
  await expect(historico).toContainText('situação: Prevista → Cumprida'); // B, ao concluir
});

test('exceção: bolsista em duas escolas no mesmo horário é avisado antes de lançar', async ({ page }) => {
  const coord = exigir(COORD, 'TEST_GESTAO_COORD_EMAIL/PASSWORD');
  const manha = `IA E2E ${RODADA}`;
  const tarde = `Robótica E2E ${RODADA}`;

  await loginViaUI(page, coord, `/gestao/alocacao?mes=${MES}`);
  await lancarEncontro(page, { inicio: '08:00', fim: '10:00', escola: ESCOLA_1, atividade: manha, equipe: [BOLSISTA_A] });
  await lancarIgnorandoSobreposicao(page);

  await page.reload();
  await lancarEncontro(page, { inicio: '09:00', fim: '11:00', escola: ESCOLA_2, atividade: tarde, equipe: [BOLSISTA_A] });
  const aviso = sobreposicao(page);
  await expect(aviso).toBeVisible();
  await expect(aviso.getByRole('listitem').filter({ hasText: manha })).toContainText(BOLSISTA_A);

  // Revisar não lança nada
  await aviso.getByRole('button', { name: 'Revisar' }).click();
  await expect(aviso).toBeHidden();
  await expect(lancado(page)).toHaveCount(0);

  // A coordenação decide lançar mesmo assim: A fica nas duas escolas
  await page.getByRole('button', { name: 'Lançar encontro' }).click();
  await aviso.getByRole('button', { name: 'Lançar mesmo assim' }).click();
  await expect(lancado(page)).toBeVisible();
  for (const [atividade, escola] of [[manha, ESCOLA_1], [tarde, ESCOLA_2]]) {
    await expect(page.getByRole('link', { name: new RegExp(atividade) })).toContainText(escola);
  }
});

test('sem papel na gestão não alcança a alocação', async ({ page }) => {
  // Anônimo vai para o login, guardando o destino
  await page.goto('/gestao/alocacao');
  expect(new URL(page.url()).pathname).toBe('/auth');
  expect(new URL(page.url()).searchParams.get('next')).toBe('/gestao/alocacao');

  const semPapel = exigir(SEM_PAPEL, 'TEST_STUDENT_EMAIL/PASSWORD');
  await loginViaUI(page, semPapel);
  for (const rota of ['/gestao', '/gestao/alocacao', `/gestao/alocacao?mes=${MES}`]) {
    const resposta = await page.goto(rota);
    expect(resposta?.status(), rota).toBe(404);
    await expect(page.getByText('Gestão do projeto'), rota).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Lançar encontro' }), rota).toHaveCount(0);
  }
});
