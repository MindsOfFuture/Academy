import { test, expect, type Page } from '@playwright/test';

// Tipos de usuário para testes
export type UserRole = 'student' | 'teacher' | 'admin' | 'anonymous';

export interface TestUser {
  email: string;
  password: string;
  role: UserRole;
}

// Credenciais de teste: nunca usa fallback que possa mascarar env ausente.
export const TEST_USERS: Record<UserRole, TestUser | null> = {
  student: process.env.TEST_STUDENT_EMAIL && process.env.TEST_STUDENT_PASSWORD ? {
    email: process.env.TEST_STUDENT_EMAIL,
    password: process.env.TEST_STUDENT_PASSWORD,
    role: 'student',
  } : null,
  teacher: process.env.TEST_TEACHER_EMAIL && process.env.TEST_TEACHER_PASSWORD ? {
    email: process.env.TEST_TEACHER_EMAIL,
    password: process.env.TEST_TEACHER_PASSWORD,
    role: 'teacher',
  } : null,
  admin: process.env.TEST_ADMIN_EMAIL && process.env.TEST_ADMIN_PASSWORD ? {
    email: process.env.TEST_ADMIN_EMAIL,
    password: process.env.TEST_ADMIN_PASSWORD,
    role: 'admin',
  } : null,
  anonymous: null,
};

// Helper para fazer login via UI
export async function loginViaUI(page: Page, user: TestUser, nextPath = '/protected') {
  await page.goto(`/auth?next=${encodeURIComponent(nextPath)}`);
  
  // Preencher formulário de login
  // Só os campos visíveis: no celular o formulário de desktop existe escondido e vem primeiro.
  await page.getByPlaceholder('Email').filter({ visible: true }).first().fill(user.email);
  await page.getByPlaceholder('Senha').filter({ visible: true }).first().fill(user.password);
  
  // Submeter
  await page.getByRole('button', { name: /entrar|login/i }).click();
  
  // Aguardar redirecionamento para área protegida
  await page.waitForURL(
    (url) => `${url.pathname}${url.search}` === nextPath,
    { timeout: 30000 },
  );
}

// Helper para logout
export async function logout(page: Page) {
  // Logo após o login o menu pode não abrir, ou a navbar se refaz e fecha o menu
  // com o "Sair" na mão (o item some do DOM no meio do clique): repete abrir e
  // clicar juntos. Só abre se não estiver aberto, senão o clique fecharia o menu.
  const sair = page.getByRole('menuitem', { name: /sair/i });
  await expect(async () => {
    if (!(await sair.isVisible())) await page.locator('nav button').last().click();
    await sair.click({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
  
  // Aguardar redirecionamento
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
}

/**
 * Conta de teste do papel. Fora do CI, sem a credencial, o teste pula; no CI
 * falha — pular deixaria o CI verde sem ter testado nada (ADR 012).
 */
export function contaDeTeste(papel: Exclude<UserRole, 'anonymous'>): TestUser {
  const user = TEST_USERS[papel];
  const nome = `TEST_${papel.toUpperCase()}_EMAIL/PASSWORD`;
  test.skip(!user && !process.env.CI, `${nome} não configurados`);
  if (!user) throw new Error(`CI sem ${nome}: o teste não pode pular em silêncio.`);
  return user;
}
