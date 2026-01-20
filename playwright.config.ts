import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/**
 * Playwright E2E Test Configuration
 * Complementa os testes unitários do Vitest com testes de fluxo completo
 * 
 * Estrutura de testes:
 * - e2e/mobile/    - Testes específicos para viewports mobile
 * - e2e/desktop/   - Testes específicos para viewports desktop
 * - e2e/flows/     - Testes de fluxo completo (auth, cursos, etc)
 * - e2e/visual/    - Testes de responsividade e visual regression
 * - e2e/fixtures/  - Helpers e fixtures reutilizáveis
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    // JSON reporter para CI/CD
    ...(process.env.CI ? [['json', { outputFile: 'test-results/results.json' }] as const] : []),
  ],
  
  /* Configuração global de timeout */
  timeout: 60 * 1000, // 60s por teste
  expect: {
    timeout: 10 * 1000, // 10s para expects
  },
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Configurações de acessibilidade
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },

  /* Projetos: Desktop + Mobile + Fluxos */
  projects: [
    // Setup de autenticação (roda primeiro)
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    // Desktop browsers - testes em e2e/desktop/ e e2e/flows/
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/desktop/**/*.spec.ts', '**/flows/**/*.spec.ts', '**/visual/**/*.spec.ts'],
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['**/desktop/**/*.spec.ts'],
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/desktop/**/*.spec.ts'],
      dependencies: ['setup'],
    },

    // Mobile viewports - testes em e2e/mobile/
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/mobile/**/*.spec.ts', '**/visual/**/*.spec.ts'],
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      testMatch: ['**/mobile/**/*.spec.ts'],
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari-mini',
      use: { ...devices['iPhone SE'] },
      testMatch: ['**/mobile/**/*.spec.ts'],
      dependencies: ['setup'],
    },
    
    // Tablet viewport
    {
      name: 'tablet',
      use: { ...devices['iPad (gen 7)'] },
      testMatch: ['**/visual/**/*.spec.ts'],
      dependencies: ['setup'],
    },
  ],

  /* Dev server automático */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
