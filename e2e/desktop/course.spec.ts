import { test, expect, type Page } from '@playwright/test';
import { contaDeTeste, loginViaUI } from '../fixtures/auth.fixture';

/**
 * /course exige login: sem ele o middleware manda para /auth, e um teste
 * anônimo acaba conferindo a tela de login. Por isso todos entram como aluno.
 */
async function abrirPrimeiroCurso(page: Page) {
  const aluno = contaDeTeste('student');

  await loginViaUI(page, aluno, '/trilhas');
  const link = page.locator('a[href*="/course?id="]').first();
  await expect(link, 'nenhum curso listado em /trilhas').toBeVisible();
  await page.goto((await link.getAttribute('href'))!);
  await expect(page).toHaveURL(/\/course\?id=/);
  await expect(page.locator('h1').first()).not.toBeEmpty({ timeout: 15000 });
}

test.describe('Página de Curso Desktop', () => {
  test('mostra título, módulos e o quadro de matrícula', async ({ page }) => {
    await abrirPrimeiroCurso(page);
    await expect(page.getByText('Curso não encontrado.')).toHaveCount(0);
    await expect(page.getByText(/^Módulo \d+:/).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Matrícula' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Matricular-se|Já matriculado/ })).toBeVisible();
  });

  test('conteúdo cabe na largura da janela', async ({ page }) => {
    await abrirPrimeiroCurso(page);
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(1);
  });

  test('toda imagem tem texto alternativo', async ({ page }) => {
    await abrirPrimeiroCurso(page);
    await expect(page.locator('img').first()).toBeVisible(); // a capa do curso: garante que há imagem a conferir
    await expect(page.locator('img:not([alt])')).toHaveCount(0);
  });
});
