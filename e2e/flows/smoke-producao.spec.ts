import { test, expect } from '@playwright/test';
import { TEST_USERS, loginViaUI } from '../fixtures/auth.fixture';

/**
 * Smoke pós-deploy: roda contra o site publicado no fim de .github/workflows/deploy.yml.
 * Só executa com PLAYWRIGHT_BASE_URL; na suíte local contra o dev server é pulado.
 * Usuário dedicado (TEST_STUDENT_* = conta de smoke), nunca conta de aluno real.
 * O workflow confere que os 4 testes passaram e nenhum foi pulado (ADR 012).
 */
test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'smoke só roda contra site publicado');

test('home carrega', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('body')).toBeVisible();
});

test('rota protegida sem sessão redireciona para /auth', async ({ page }) => {
  await page.goto('/protected');
  await expect(page).toHaveURL(/\/auth\?next=%2Fprotected/);
});

test('login leva para /protected', async ({ page }) => {
  const user = TEST_USERS.student;
  expect(user, 'TEST_STUDENT_EMAIL/PASSWORD ausentes').toBeTruthy();
  await loginViaUI(page, user!);
});

test('página de curso renderiza', async ({ page }) => {
  const user = TEST_USERS.student;
  expect(user, 'TEST_STUDENT_EMAIL/PASSWORD ausentes').toBeTruthy();
  await loginViaUI(page, user!);

  await page.goto('/trilhas');
  const courseLink = page.locator('a[href*="/course?id="]').first();
  await expect(courseLink, 'nenhum curso listado em /trilhas').toBeVisible();
  await page.goto((await courseLink.getAttribute('href'))!);

  await expect(page.locator('h1').first()).not.toBeEmpty();
  await expect(page.getByText('Curso não encontrado.')).toHaveCount(0);
});
