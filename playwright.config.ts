import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const testPort = process.env.PLAYWRIGHT_TEST_PORT || '3000';
// PLAYWRIGHT_BASE_URL aponta para um site já publicado (smoke pós-deploy): sem dev server.
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const testBaseUrl = externalBaseUrl || `http://localhost:${testPort}`;

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
  // O retry continua para diagnosticar, mas teste que só passa na segunda é defeito: reprova o CI.
  failOnFlakyTests: !!process.env.CI,
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
    baseURL: testBaseUrl,
    // No CI nada que grave o que foi digitado: o trace guarda o valor de cada
    // fill() (senha das contas de teste) e as respostas de login com o token,
    // e o vídeo mostra a tela. O repositório é público (spec 017).
    trace: process.env.CI ? 'off' : 'on-first-retry',
    screenshot: process.env.CI ? 'off' : 'only-on-failure',
    video: process.env.CI ? 'off' : 'retain-on-failure',
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
      testMatch: ['**/mobile/**/*.spec.ts'],
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
  ],

  /* Servidor automático. No CI, o build de produção: o dev compila cada página
     na primeira visita, e o primeiro teste a chegar nela estourava o tempo
     (34 s em trilhas.spec.ts) e reprovava o CI como instável. Sobe como no VPS
     (docs/deploy-vps.md): `output: "standalone"` não funciona com `next start`. */
  webServer: externalBaseUrl ? undefined : {
    command: process.env.CI
      ? 'npm run build && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public' +
        ` && PORT=${testPort} HOSTNAME=:: node .next/standalone/server.js`
      : `npm run dev -- --port ${testPort}`,
    url: testBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: (process.env.CI ? 10 : 2) * 60 * 1000,
  },
});
