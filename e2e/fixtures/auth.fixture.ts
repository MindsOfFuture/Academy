import { test as base, expect, Page } from '@playwright/test';

// Tipos de usuário para testes
export type UserRole = 'student' | 'teacher' | 'admin' | 'anonymous';

export interface TestUser {
  email: string;
  password: string;
  role: UserRole;
}

// Credenciais de teste (definir em .env.local ou usar valores de teste)
export const TEST_USERS: Record<UserRole, TestUser | null> = {
  student: {
    email: process.env.TEST_STUDENT_EMAIL || 'student@test.com',
    password: process.env.TEST_STUDENT_PASSWORD || 'testpassword123',
    role: 'student',
  },
  teacher: {
    email: process.env.TEST_TEACHER_EMAIL || 'teacher@test.com',
    password: process.env.TEST_TEACHER_PASSWORD || 'testpassword123',
    role: 'teacher',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'testpassword123',
    role: 'admin',
  },
  anonymous: null,
};

// Helper para fazer login via UI
export async function loginViaUI(page: Page, user: TestUser) {
  await page.goto('/auth');
  
  // Preencher formulário de login
  await page.getByLabel(/e-?mail/i).fill(user.email);
  await page.getByLabel(/senha/i).fill(user.password);
  
  // Submeter
  await page.getByRole('button', { name: /entrar|login/i }).click();
  
  // Aguardar redirecionamento para área protegida
  await page.waitForURL('/protected**', { timeout: 10000 });
}

// Helper para logout
export async function logout(page: Page) {
  // Abrir menu (pode variar em mobile vs desktop)
  const menuButton = page.getByRole('button', { name: /menu/i });
  
  if (await menuButton.isVisible()) {
    await menuButton.click();
    await page.getByRole('menuitem', { name: /sair/i }).click();
  }
  
  // Aguardar redirecionamento
  await page.waitForURL('/');
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
