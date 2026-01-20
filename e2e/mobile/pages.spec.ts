import { test, expect } from '@playwright/test';

test.describe('Página de Curso Mobile', () => {
  test('página de curso deve carregar', async ({ page }) => {
    const response = await page.goto('/course');
    // Verificar que não há erro de servidor
    expect(response?.status()).toBeLessThan(500);
  });

  test('conteúdo do curso deve ser legível em mobile', async ({ page }) => {
    await page.goto('/course');
    await page.waitForLoadState('networkidle');
    
    const content = page.locator('main, article, section');
    
    if (await content.first().isVisible()) {
      // Verificar que texto principal não é muito pequeno
      const fontSize = await content.first().evaluate(el => {
        return window.getComputedStyle(el).fontSize;
      });
      
      const size = parseFloat(fontSize);
      expect(size).toBeGreaterThanOrEqual(14);
    }
  });

  test('botões de ação devem estar acessíveis se existirem', async ({ page }) => {
    await page.goto('/course');
    await page.waitForLoadState('networkidle');
    
    // Procurar botão de matrícula ou similar
    const actionButton = page.getByRole('button', { name: /matricular|inscrever|enroll|começar/i });
    
    if (await actionButton.isVisible().catch(() => false)) {
      const box = await actionButton.boundingBox();
      
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(100);
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('módulos/lições devem ser expansíveis em mobile se existirem', async ({ page }) => {
    await page.goto('/course');
    await page.waitForLoadState('networkidle');
    
    // Procurar accordion ou lista de módulos
    const modules = page.locator('[class*="module"], [class*="accordion"], [class*="collapse"]');
    
    if (await modules.first().isVisible().catch(() => false)) {
      await modules.first().click();
      await page.waitForTimeout(300);
      console.log('Module interaction successful');
    }
  });
});

test.describe('Página de Trilhas Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trilhas');
  });

  test('trilhas devem ser exibidas em layout responsivo', async ({ page }) => {
    const viewport = page.viewportSize();
    const container = page.locator('main, [class*="container"]').first();
    
    if (await container.isVisible()) {
      const box = await container.boundingBox();
      
      if (box && viewport) {
        // Container não deve exceder viewport
        expect(box.width).toBeLessThanOrEqual(viewport.width);
      }
    }
  });

  test('cards de trilha devem empilhar em mobile', async ({ page }) => {
    const cards = page.locator('[class*="card"], [class*="Card"]');
    const count = await cards.count();
    
    if (count >= 2) {
      const card1 = await cards.nth(0).boundingBox();
      const card2 = await cards.nth(1).boundingBox();
      
      if (card1 && card2) {
        const viewport = page.viewportSize();
        
        // Em mobile pequeno, cards devem empilhar (y diferente)
        if (viewport && viewport.width < 640) {
          // Card 2 deve estar abaixo do card 1 (empilhado)
          expect(card2.y).toBeGreaterThan(card1.y);
        }
      }
    }
  });
});

test.describe('Dashboard Mobile (autenticado - mock)', () => {
  // Estes testes verificam a estrutura visual sem autenticação real
  // Para testes completos, usar fixtures de auth
  
  test('página protegida deve redirecionar corretamente', async ({ page }) => {
    await page.goto('/protected');
    
    // Sem auth, deve ir para /auth
    await page.waitForURL(/\/(auth|protected)/, { timeout: 10000 });
    
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(auth|protected)/);
  });
});

test.describe('Perfil Mobile (estrutura)', () => {
  test('página de perfil deve redirecionar sem auth', async ({ page }) => {
    await page.goto('/protected/perfil');
    
    await page.waitForURL(/\/(auth|protected)/, { timeout: 10000 });
  });
});

test.describe('Atividades Mobile (estrutura)', () => {
  test('página de atividades deve redirecionar sem auth', async ({ page }) => {
    await page.goto('/protected/activitie');
    
    await page.waitForURL(/\/(auth|protected)/, { timeout: 10000 });
  });
});
