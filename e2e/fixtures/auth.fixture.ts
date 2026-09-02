import { test as base, expect, Page } from '@playwright/test';

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
  await page.getByPlaceholder('Email').first().fill(user.email);
  await page.getByPlaceholder('Senha').first().fill(user.password);
  
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
  await page.locator('nav button').last().click();
  await page.getByRole('menuitem', { name: /sair/i }).click();
  
  // Aguardar redirecionamento
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
}

// Extend base test com fixtures de autenticação
type AuthFixtures = {
  authenticatedPage: Page;
  studentPage: Page;
  teacherPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  // Página autenticada genérica (student por padrão)
  authenticatedPage: async ({ page }, use) => {
    const user = TEST_USERS.student;
    if (user) {
      await loginViaUI(page, user);
    }
    await use(page);
  },

  studentPage: async ({ page }, use) => {
    const user = TEST_USERS.student;
    if (user) {
      await loginViaUI(page, user);
    }
    await use(page);
  },

  teacherPage: async ({ page }, use) => {
    const user = TEST_USERS.teacher;
    if (user) {
      await loginViaUI(page, user);
    }
    await use(page);
  },

  adminPage: async ({ page }, use) => {
    const user = TEST_USERS.admin;
    if (user) {
      await loginViaUI(page, user);
    }
    await use(page);
  },
});

export { expect };
