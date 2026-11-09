import { expect, test } from '@playwright/test';
import { contaDeTeste, loginViaUI, logout } from '../fixtures/auth.fixture';

const PUBLIC_PAGES = [
  '/',
  '/auth',
  '/auth/error',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/termos',
  '/privacidade',
  '/artigos',
  '/validar',
  '/creditos',
];

const PROTECTED_PAGES = [
  '/protected',
  '/protected/perfil?tab=seguranca',
  '/protected/activitie',
  '/course',
  '/trilhas',
];

test.describe.configure({ mode: 'serial' });

test('matriz pública abre anonimamente sem redirect nem 5xx', async ({ page }) => {
  const serverErrors: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
  });

  for (const route of PUBLIC_PAGES) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBeLessThan(500);
    expect(new URL(page.url()).pathname, route).toBe(new URL(route, 'http://local').pathname);
    await expect(page.getByText(/Application error:/i), route).toHaveCount(0);
  }

  expect(serverErrors).toEqual([]);
});

test('matriz protegida preserva o destino completo para usuário anônimo', async ({ page }) => {
  for (const route of PROTECTED_PAGES) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBeLessThan(500);
    const redirected = new URL(page.url());
    expect(redirected.pathname, route).toBe('/auth');
    expect(redirected.searchParams.get('next'), route).toBe(route);
  }
});

test('student: destino original, navegação, reload e logout permanecem íntegros', async ({ page }) => {
  const student = contaDeTeste('student');

  const pageErrors: string[] = [];
  const serverErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
  });

  const destination = '/protected/perfil?tab=seguranca';
  await loginViaUI(page, student, destination);
  expect(`${new URL(page.url()).pathname}${new URL(page.url()).search}`).toBe(destination);

  for (const route of ['/course', '/trilhas', '/protected']) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBeLessThan(500);
    expect(new URL(page.url()).pathname, route).toBe(route);
  }

  const reloadResponse = await page.reload();
  expect(reloadResponse?.status()).toBeLessThan(500);
  expect(new URL(page.url()).pathname).toBe('/protected');

  await logout(page);
  await page.goto('/protected');
  expect(new URL(page.url()).pathname).toBe('/auth');
  expect(new URL(page.url()).searchParams.get('next')).toBe('/protected');
  expect(pageErrors).toEqual([]);
  expect(serverErrors).toEqual([]);
});

test('teacher aprovado mantém capacidade de gestão sem aviso pending/rejected', async ({ page }) => {
  const teacher = contaDeTeste('teacher');

  await loginViaUI(page, teacher);
  await expect(page.getByRole('button', { name: 'Criar novo curso' })).toBeVisible();
  await expect(page.getByText(/perfil de professor está (pendente|reprovado)/i)).toHaveCount(0);
});

test('admin mantém controles exclusivos sem elevação de outros papéis', async ({ page }) => {
  const admin = contaDeTeste('admin');

  await loginViaUI(page, admin);
  await expect(page.getByRole('button', { name: 'Analytics' })).toBeVisible();
  await expect(page.locator('table').first()).toBeVisible();
});

for (const [name, payload] of [
  ['barra invertida', '/%5Cevil.example'],
  ['barra dupla', '//evil.example'],
  ['TAB', '/%09/evil.example'],
  ['LF', '/%0A/evil.example'],
  ['CR', '/%0D/evil.example'],
] as const) {
  test(`next malicioso com ${name} cai no destino seguro`, async ({ page }) => {
    const student = contaDeTeste('student');

    await page.goto(`/auth?next=${payload}`);
    await page.getByPlaceholder('Email').first().fill(student.email);
    await page.getByPlaceholder('Senha').first().fill(student.password);
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/protected$/, { timeout: 30000 });
  });
}

test('recuperação de senha pede o link ao Supabase com o e-mail e o destino certos', async ({ page }) => {
  const student = contaDeTeste('student');
  // Sem enviar e-mail de verdade: o Supabase limita recuperações por hora e duas
  // execuções seguidas do CI cairiam no limite. Confere o pedido e a resposta da tela.
  const pedidos: { email?: string; url: string }[] = [];
  await page.route('**/auth/v1/recover**', async (route) => {
    pedidos.push({ email: route.request().postDataJSON()?.email, url: route.request().url() });
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/auth/forgot-password');
  await page.getByPlaceholder('Seu e-mail de cadastro').fill(student.email);
  await page.getByRole('button', { name: 'Enviar Link' }).click();
  await expect(page.getByText('Link de redefinição enviado! Verifique sua caixa de entrada.'))
    .toBeVisible({ timeout: 30000 });
  expect(pedidos).toHaveLength(1);
  expect(pedidos[0].email).toBe(student.email);
  expect(decodeURIComponent(pedidos[0].url)).toContain('/auth/reset-password');
});
