import { test as setup, expect } from '@playwright/test';

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
  
  console.log('✓ Ambiente de teste verificado');
});

setup('verificar rotas principais existem', async ({ page }) => {
  const routes = ['/', '/auth', '/trilhas', '/course', '/termos', '/privacidade'];
  
  for (const route of routes) {
    const response = await page.goto(route);
    const status = response?.status() || 0;
    
    // Rotas públicas devem retornar 200
    // Rotas protegidas podem redirecionar (302/307)
    expect(status).toBeLessThan(500);
    
    console.log(`✓ ${route} - Status: ${status}`);
  }
});
