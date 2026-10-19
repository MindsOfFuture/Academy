import { test as setup, expect } from '@playwright/test';
import { TEST_USERS, loginViaUI, type TestUser } from './fixtures/auth.fixture';

/**
 * Setup global que roda antes dos testes
 * Pode ser usado para:
 * - Verificar se o servidor está rodando
 * - Preparar dados de teste
 * - Criar sessões de autenticação
 */

setup('verificar ambiente de teste', async ({ page }) => {
  // Verificar que o servidor está respondendo
  const response = await page.goto('/');
  
  expect(response?.status()).toBeLessThan(500);
  
  // Verificar que a página principal carrega
  await expect(page.locator('body')).toBeVisible();
  
});

setup('verificar rotas principais existem', async ({ page }) => {
  const routes = ['/', '/auth', '/trilhas', '/course', '/termos', '/privacidade'];
  
  for (const route of routes) {
    const response = await page.goto(route);
    const status = response?.status() || 0;
    
    // Rotas públicas devem retornar 200
    // Rotas protegidas podem redirecionar (302/307)
    expect(status).toBeLessThan(500);
    
  }
});

/**
 * O dev server compila cada página na primeira visita, e o primeiro teste a
 * chegar nela estourava o tempo (34 s em /course, que é protegida). Visitar sem
 * sessão não adianta: o middleware redireciona para /auth e a página não
 * compila. Aqui cada conta de teste abre as páginas que os specs usam, uma vez.
 */
const ID_QUALQUER = '00000000-0000-4000-8000-000000000000';
const AQUECER: { conta: TestUser | null; inicio: string; rotas: string[] }[] = [
  {
    conta: TEST_USERS.student,
    inicio: '/protected',
    rotas: [
      '/trilhas',
      '/course',
      '/protected/perfil',
      '/protected/activitie',
      '/protected/modulos/educacao-financeira',
      '/protected/modulos/laboratorio-de-gestao',
      '/artigos',
      '/validar',
    ],
  },
  {
    conta:
      process.env.TEST_GESTAO_COORD_EMAIL && process.env.TEST_GESTAO_COORD_PASSWORD
        ? { email: process.env.TEST_GESTAO_COORD_EMAIL, password: process.env.TEST_GESTAO_COORD_PASSWORD, role: 'admin' }
        : null,
    inicio: '/gestao',
    rotas: ['/gestao/alocacao', `/gestao/alocacao/${ID_QUALQUER}`, '/gestao/equipe'],
  },
];

for (const { conta, inicio, rotas } of AQUECER) {
  setup(`compilar páginas de ${inicio}`, async ({ page }) => {
    setup.skip(!conta || !!process.env.PLAYWRIGHT_BASE_URL, 'sem conta de teste, ou site já publicado');
    setup.setTimeout(10 * 60 * 1000);
    await loginViaUI(page, conta!, inicio);
    for (const rota of rotas) {
      const resposta = await page.goto(rota, { timeout: 2 * 60 * 1000 });
      expect(resposta?.status(), rota).toBeLessThan(500);
    }
  });
}
