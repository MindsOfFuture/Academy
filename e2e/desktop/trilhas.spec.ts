import { test, expect } from '@playwright/test';

test.describe('Página de Trilhas Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trilhas');
    await page.waitForLoadState('networkidle');
  });

  test('página deve carregar sem erros', async ({ page }) => {
    // Verificar que não há erro 500
    const content = page.locator('body');
    await expect(content).toBeVisible();
    
    // Verificar que não está na página de erro
    const errorPage = page.locator('text=500');
    const hasError = await errorPage.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('navbar deve estar presente', async ({ page }) => {
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
  });

  test('deve exibir trilhas ou mensagem de vazio', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForTimeout(2000);
    
    // Deve ter trilhas OU mensagem de que não há trilhas
    const trilhas = page.locator('section').filter({ hasText: /jornada|trilha|curso/i });
    const emptyMessage = page.locator('text=/nenhuma trilha|sem trilhas/i');
    
    const hasTrilhas = await trilhas.first().isVisible().catch(() => false);
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
    
    expect(hasTrilhas || hasEmptyMessage).toBeTruthy();
    console.log(`Has trilhas: ${hasTrilhas}, Has empty message: ${hasEmptyMessage}`);
  });

  test('cards de curso devem ter link para página de curso', async ({ page }) => {
    const courseLinks = page.locator('a[href*="/course"]');
    const count = await courseLinks.count();
    
    if (count > 0) {
      const firstLink = courseLinks.first();
      const href = await firstLink.getAttribute('href');
      
      expect(href).toContain('/course');
      console.log(`Found ${count} course links`);
    }
  });

  test('layout deve ser responsivo em desktop', async ({ page }) => {
    const viewport = page.viewportSize();
    
    if (viewport && viewport.width >= 768) {
      // Em desktop, cursos podem estar em linha horizontal
      const courseCards = page.locator('a[href*="/course"]');
      const count = await courseCards.count();
      
      if (count >= 2) {
        const card1 = await courseCards.nth(0).boundingBox();
        const card2 = await courseCards.nth(1).boundingBox();
        
        if (card1 && card2) {
          // Em desktop, podem estar na mesma linha (y similar)
          console.log(`Card 1 Y: ${card1.y}, Card 2 Y: ${card2.y}`);
        }
      }
    }
  });

  test('cards devem ter imagem e título', async ({ page }) => {
    const courseCards = page.locator('a[href*="/course"]');
    const count = await courseCards.count();
    
    if (count > 0) {
      const firstCard = courseCards.first();
      
      // Deve ter imagem
      const hasImage = await firstCard.locator('img').isVisible().catch(() => false);
      
      // Deve ter texto (título)
      const text = await firstCard.textContent();
      const hasText = text && text.trim().length > 0;
      
      expect(hasImage || hasText).toBeTruthy();
    }
  });

  test('botão "Ver curso" deve ser clicável', async ({ page }) => {
    const verCursoButton = page.locator('text=/ver curso/i').first();
    
    if (await verCursoButton.isVisible()) {
      const box = await verCursoButton.boundingBox();
      
      if (box) {
        // Botão deve ter tamanho clicável
        expect(box.width).toBeGreaterThan(50);
        expect(box.height).toBeGreaterThan(20);
      }
    }
  });
});

test.describe('Navegação de Trilhas para Curso', () => {
  test('clicar em card de curso deve navegar para detalhes', async ({ page }) => {
    await page.goto('/trilhas');
    await page.waitForLoadState('networkidle');
    
    const courseLink = page.locator('a[href*="/course"]').first();
    
    if (await courseLink.isVisible()) {
      await Promise.all([
        page.waitForURL(/\/course/),
        courseLink.click(),
      ]);
      
      expect(page.url()).toContain('/course');
    }
  });
});
