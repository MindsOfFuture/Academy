import { test, expect, type Page } from '@playwright/test';
import { TEST_USERS, loginViaUI } from '../fixtures/auth.fixture';

/**
 * Curso e trilhas no celular. As duas páginas exigem login (sem ele o
 * middleware manda para /auth), então os testes entram como aluno. O redirect
 * de quem não está logado é conferido em navigation.spec.ts.
 */
async function entrar(page: Page, destino: string) {
  const aluno = TEST_USERS.student;
  test.skip(!aluno && !process.env.CI, 'TEST_STUDENT_EMAIL/PASSWORD não configurados');
  if (!aluno) throw new Error('CI sem TEST_STUDENT_EMAIL/PASSWORD: os testes mobile logados não podem pular em silêncio.');
  await loginViaUI(page, aluno, destino);
}

async function abrirPrimeiroCurso(page: Page) {
  await entrar(page, '/trilhas');
  const link = page.locator('a[href*="/course?id="]').first();
  await expect(link, 'nenhum curso listado em /trilhas').toBeVisible();
  await page.goto((await link.getAttribute('href'))!);
  await expect(page).toHaveURL(/\/course\?id=/);
  await expect(page.locator('h1').first()).not.toBeEmpty({ timeout: 15000 });
}

test.describe('Página de Curso Mobile', () => {
  test('texto do curso é legível (fonte de 14px ou mais)', async ({ page }) => {
    await abrirPrimeiroCurso(page);
    const modulo = page.getByText(/^Módulo \d+:/).first();
    await expect(modulo).toBeVisible();
    const tamanho = await modulo.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(tamanho).toBeGreaterThanOrEqual(14);
  });

  test('botão de matrícula tem área de toque confortável', async ({ page }) => {
    await abrirPrimeiroCurso(page);
    const botao = page.getByRole('button', { name: /Matricular-se|Já matriculado/ });
    await botao.scrollIntoViewIfNeeded();
    const caixa = await botao.boundingBox();
    expect(caixa, 'botão sem caixa visível').not.toBeNull();
    expect(caixa!.width).toBeGreaterThanOrEqual(100);
    expect(caixa!.height).toBeGreaterThanOrEqual(36);
  });

  test('curso não transborda a largura da tela', async ({ page }) => {
    await abrirPrimeiroCurso(page);
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(1);
  });
});

test.describe('Página de Trilhas Mobile', () => {
  test('cards de curso empilham, um abaixo do outro', async ({ page }) => {
    await entrar(page, '/trilhas');
    const cards = page.locator('a[href*="/course?id="]');
    await expect(cards.first()).toBeVisible();
    test.skip((await cards.count()) < 2, 'menos de dois cursos listados');
    const [a, b] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
    expect(b!.y).toBeGreaterThan(a!.y);
  });

  test('trilhas não transbordam a largura da tela', async ({ page }) => {
    await entrar(page, '/trilhas');
    await expect(page.locator('a[href*="/course?id="]').first()).toBeVisible();
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(1);
  });
});
