import { test, expect } from '@playwright/test';
import { TEST_USERS, loginViaUI, logout } from '../fixtures/auth.fixture';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => console.error('[pageerror]', error.stack));
});

/**
 * Testes de fluxo completo de autenticação
 * Requer credenciais de teste configuradas em .env.local:
 * - TEST_STUDENT_EMAIL
 * - TEST_STUDENT_PASSWORD
 * - TEST_TEACHER_EMAIL
 * - TEST_TEACHER_PASSWORD
 */

test.describe('Fluxo de Login Real', () => {
  test.skip(
    !process.env.TEST_STUDENT_EMAIL || !process.env.TEST_STUDENT_PASSWORD,
    'Credenciais de teste não configuradas'
  );

  test('login com credenciais válidas deve redirecionar para protected', async ({ page }) => {
    const user = TEST_USERS.student;
    if (!user) {
      test.skip();
      return;
    }

    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');

    // Preencher formulário
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.getByRole('button', { name: /entrar/i });

    await emailInput.waitFor({ timeout: 15000 });
    await emailInput.fill(user.email);
    await passwordInput.fill(user.password);
    await loginButton.click();

    // Aguardar redirecionamento
    await page.waitForURL('/protected**', { timeout: 30000 });

    expect(page.url()).toContain('/protected');
  });

  test('página protegida deve mostrar nome do usuário', async ({ page }) => {
    const user = TEST_USERS.student;
    if (!user) {
      test.skip();
      return;
    }

    await loginViaUI(page, user);

    // Verificar que nome é exibido
    const greeting = page.locator('text=/olá|bem-vindo/i');
    await expect(greeting).toBeVisible({ timeout: 10000 });
  });

  test('usuário logado deve ver seus cursos', async ({ page }) => {
    const user = TEST_USERS.student;
    if (!user) {
      test.skip();
      return;
    }

    await loginViaUI(page, user);

    // Verificar seção de cursos
    const coursesSection = page.getByRole('heading', { name: 'Cursos Matriculados' });
    await expect(coursesSection).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Fluxo de Logout', () => {
  test.skip(
    !process.env.TEST_STUDENT_EMAIL || !process.env.TEST_STUDENT_PASSWORD,
    'Credenciais de teste não configuradas'
  );

  test('logout deve redirecionar para home ou auth', async ({ page }) => {
    const user = TEST_USERS.student;
    if (!user) {
      test.skip();
      return;
    }

    await loginViaUI(page, user);
    await logout(page);
  });
});

test.describe('Área Protegida - Dashboard', () => {
  test.skip(
    !process.env.TEST_STUDENT_EMAIL || !process.env.TEST_STUDENT_PASSWORD,
    'Credenciais de teste não configuradas'
  );

  test('dashboard deve ter navbar', async ({ page }) => {
    const user = TEST_USERS.student;
    if (!user) {
      test.skip();
      return;
    }

    await loginViaUI(page, user);

    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
  });

  test('dashboard deve ter layout responsivo', async ({ page }) => {
    const user = TEST_USERS.student;
    if (!user) {
      test.skip();
      return;
    }

    await loginViaUI(page, user);

    const viewport = page.viewportSize();
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);

    if (viewport) {
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 5);
    }
  });

  test('cards de curso devem ser clicáveis', async ({ page }) => {
    const user = TEST_USERS.student;
    if (!user) {
      test.skip();
      return;
    }

    await loginViaUI(page, user);

    const courseCard = page.locator('a[href*="/course"]').first();

    if (await courseCard.isVisible()) {
      await Promise.all([
        page.waitForURL(/\/course/),
        courseCard.click(),
      ]);

      expect(page.url()).toContain('/course');
    }
  });
});

test.describe('Funcionalidades Admin', () => {
  test.skip(
    !process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD,
    'Credenciais de admin não configuradas'
  );

  test('admin deve ver seção de gerenciamento de cursos', async ({ page }) => {
    const admin = TEST_USERS.admin;
    if (!admin) {
      test.skip();
      return;
    }

    await loginViaUI(page, admin);

    // Verificar seção de admin
    const adminSection = page.getByRole('heading', { name: 'Usuários', exact: true });
    await expect(adminSection).toBeVisible({ timeout: 10000 });
  });

  test('admin deve ver tabela de usuários', async ({ page }) => {
    const admin = TEST_USERS.admin;
    if (!admin) {
      test.skip();
      return;
    }

    await loginViaUI(page, admin);

    // Verificar tabela de usuários
    const usersTable = page.locator('table, [class*="table"]');
    await expect(usersTable.first()).toBeVisible();

  });
});

test.describe('Proteção de Rotas', () => {
  test('acessar /protected sem auth deve redirecionar para /auth', async ({ page }) => {
    await page.goto('/protected');

    expect(new URL(page.url()).pathname).toBe('/auth');
    expect(new URL(page.url()).searchParams.get('next')).toBe('/protected');
  });

  test('acessar /protected/perfil sem auth deve redirecionar para /auth', async ({ page }) => {
    await page.goto('/protected/perfil');

    expect(new URL(page.url()).pathname).toBe('/auth');
    expect(new URL(page.url()).searchParams.get('next')).toBe('/protected/perfil');
  });

  test('acessar /protected/activitie sem auth deve redirecionar para /auth', async ({ page }) => {
    await page.goto('/protected/activitie');

    expect(new URL(page.url()).pathname).toBe('/auth');
    expect(new URL(page.url()).searchParams.get('next')).toBe('/protected/activitie');
  });
});
