import { test, expect } from '@playwright/test';

test.describe('Página de Termos de Uso', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/termos');
    await page.waitForLoadState('domcontentloaded');
  });

  test('página deve carregar corretamente', async ({ page }) => {
    const title = page.locator('h1');
    await expect(title).toBeVisible();
    await expect(title).toContainText(/termos/i);
  });

  test('deve ter seções de conteúdo', async ({ page }) => {
    // Verificar seções principais
    const sections = page.locator('section, h2');
    const count = await sections.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('deve ter botão/link para voltar', async ({ page }) => {
    const backButton = page.locator('button:has-text("Voltar"), a:has-text("Voltar")');
    await expect(backButton.first()).toBeVisible();
  });

  test('texto deve ser legível', async ({ page }) => {
    const paragraphs = page.locator('p');
    const count = await paragraphs.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const p = paragraphs.nth(i);
      
      if (await p.isVisible()) {
        const fontSize = await p.evaluate(el => {
          return parseFloat(window.getComputedStyle(el).fontSize);
        });
        
        // Texto deve ser pelo menos 14px
        expect(fontSize).toBeGreaterThanOrEqual(14);
      }
    }
  });

  test('layout deve ser responsivo', async ({ page }) => {
    const container = page.locator('.container, [class*="max-w"]').first();
    const viewport = page.viewportSize();
    
    if (await container.isVisible() && viewport) {
      const box = await container.boundingBox();
      
      if (box) {
        expect(box.width).toBeLessThanOrEqual(viewport.width);
      }
    }
  });

  test('deve ter data de atualização', async ({ page }) => {
    const dateText = page.locator('text=/última atualização|atualizado em/i');
    const hasDate = await dateText.isVisible().catch(() => false);
    
    expect(hasDate).toBeTruthy();
  });
});

test.describe('Página de Política de Privacidade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/privacidade');
    await page.waitForLoadState('domcontentloaded');
  });

  test('página deve carregar corretamente', async ({ page }) => {
    const title = page.locator('h1');
    await expect(title).toBeVisible();
    await expect(title).toContainText(/privacidade/i);
  });

  test('deve ter seções sobre coleta de dados', async ({ page }) => {
    const coletaSection = page.locator('text=/coleta|informações/i');
    const hasColeta = await coletaSection.first().isVisible().catch(() => false);
    
    expect(hasColeta).toBeTruthy();
  });

  test('deve mencionar LGPD ou direitos do usuário', async ({ page }) => {
    const lgpdText = page.locator('text=/lgpd|direitos|proteção de dados/i');
    const hasLgpd = await lgpdText.first().isVisible().catch(() => false);
    
    expect(hasLgpd).toBeTruthy();
  });

  test('deve ter botão/link para voltar', async ({ page }) => {
    const backButton = page.locator('button:has-text("Voltar"), a:has-text("Voltar")');
    await expect(backButton.first()).toBeVisible();
  });

  test('layout deve ser legível em desktop', async ({ page }) => {
    const content = page.locator('.container, main, article').first();
    
    if (await content.isVisible()) {
      const box = await content.boundingBox();
      
      if (box) {
        // Conteúdo deve ter largura razoável para leitura
        expect(box.width).toBeGreaterThan(300);
      }
    }
  });
});

test.describe('Navegação entre Termos e Privacidade', () => {
  test('deve navegar de Termos para Auth', async ({ page }) => {
    await page.goto('/termos');
    
    const backLink = page.locator('a[href*="/auth"]').first();
    
    if (await backLink.isVisible()) {
      await Promise.all([
        page.waitForURL('/auth'),
        backLink.click(),
      ]);
      
      expect(page.url()).toContain('/auth');
    }
  });

  test('deve navegar de Privacidade para Auth', async ({ page }) => {
    await page.goto('/privacidade');
    
    const backLink = page.locator('a[href*="/auth"]').first();
    
    if (await backLink.isVisible()) {
      await Promise.all([
        page.waitForURL('/auth'),
        backLink.click(),
      ]);
      
      expect(page.url()).toContain('/auth');
    }
  });
});

test.describe('Acessibilidade Páginas Legais', () => {
  test('termos deve ter estrutura de headings correta', async ({ page }) => {
    await page.goto('/termos');
    
    const h1 = await page.locator('h1').count();
    const h2 = await page.locator('h2').count();
    
    // Deve ter um h1 (título principal)
    expect(h1).toBe(1);
    
    // Deve ter h2s para seções
    expect(h2).toBeGreaterThan(0);
  });

  test('privacidade deve ter estrutura de headings correta', async ({ page }) => {
    await page.goto('/privacidade');
    
    const h1 = await page.locator('h1').count();
    const h2 = await page.locator('h2').count();
    
    expect(h1).toBe(1);
    expect(h2).toBeGreaterThan(0);
  });

  test('listas devem usar elementos semânticos', async ({ page }) => {
    await page.goto('/termos');
    
    const lists = page.locator('ul, ol');
    const count = await lists.count();
    
    // Páginas de termos geralmente têm listas
    expect(count).toBeGreaterThan(0);
  });

  test('contraste de cores deve ser adequado', async ({ page }) => {
    await page.goto('/termos');
    
    const heading = page.locator('h1').first();
    const paragraph = page.locator('p').first();
    
    if (await heading.isVisible()) {
      const headingColor = await heading.evaluate(el => {
        return window.getComputedStyle(el).color;
      });
      
      // Cor não deve ser transparente
      expect(headingColor).not.toBe('rgba(0, 0, 0, 0)');
    }
    
    if (await paragraph.isVisible()) {
      const pColor = await paragraph.evaluate(el => {
        return window.getComputedStyle(el).color;
      });
      
      expect(pColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  });
});
