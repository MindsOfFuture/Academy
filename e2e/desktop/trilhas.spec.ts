import { test, expect } from '@playwright/test';
import { contaDeTeste, loginViaUI } from '../fixtures/auth.fixture';

// /trilhas exige login: sem ele os testes abaixo rodavam sobre a tela de /auth.
// O redirect de quem não está logado é coberto em e2e/flows/auth-hardening.spec.ts.
test.beforeEach(async ({ page }) => {
  const student = contaDeTeste('student');
  await loginViaUI(page, student, '/trilhas');
  // Cada teste parte de uma lista com cursos: sem isso os demais não teriam o que conferir.
  await expect(page.locator('a[href*="/course?id="]').first(), 'nenhum curso listado em /trilhas').toBeVisible();
});

test.describe('Página de Trilhas Desktop', () => {
  test('mostra a navbar e nenhuma página de erro', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText(/Application error|Internal Server Error/i)).toHaveCount(0);
  });

  test('cards levam a um curso com id', async ({ page }) => {
    const href = await page.locator('a[href*="/course?id="]').first().getAttribute('href');
    expect(href).toMatch(/\/course\?id=[\w-]+/);
  });

  test('cursos de uma trilha ficam lado a lado em desktop', async ({ page }) => {
    const cards = page.locator('a[href*="/course?id="]');
    test.skip((await cards.count()) < 2, 'menos de dois cursos listados');
    // Cada trilha põe seus cursos em linha (md:flex-row); trilhas ficam uma abaixo da outra.
    const topos = await cards.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    expect(new Set(topos).size, 'nenhum par de cursos na mesma linha').toBeLessThan(topos.length);
  });

  test('cards têm título', async ({ page }) => {
    await expect(page.locator('a[href*="/course?id="]').first()).not.toBeEmpty();
  });

  test('botão "Ver curso" tem tamanho clicável', async ({ page }) => {
    const botao = page.getByText(/ver curso/i).first();
    await expect(botao).toBeVisible();
    const caixa = await botao.boundingBox();
    expect(caixa!.width).toBeGreaterThan(50);
    expect(caixa!.height).toBeGreaterThan(20);
  });
});

test.describe('Navegação de Trilhas para Curso', () => {
  test('clicar em card de curso navega para os detalhes', async ({ page }) => {
    await page.locator('a[href*="/course?id="]').first().click();
    await expect(page).toHaveURL(/\/course\?id=/);
    await expect(page.locator('h1').first()).not.toBeEmpty({ timeout: 15000 });
  });
});
