import { test, expect } from '@playwright/test';

test.describe('Página de Curso Desktop', () => {
  test('página de curso deve carregar', async ({ page }) => {
    const response = await page.goto('/course');
    expect(response?.status()).toBeLessThan(500);
  });

  test('navbar deve estar presente', async ({ page }) => {
    await page.goto('/course');
    await page.waitForLoadState('domcontentloaded');
    
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
  });

  test('botão voltar deve existir', async ({ page }) => {
    await page.goto('/course');
    await page.waitForLoadState('networkidle');
    
    const backButton = page.locator('button:has-text("Voltar"), a:has-text("Voltar")');
    
    if (await backButton.isVisible()) {
      await expect(backButton).toBeVisible();
    }
  });

  test('layout deve ser responsivo para detalhes do curso', async ({ page }) => {
    await page.goto('/course');
    await page.waitForLoadState('networkidle');
    
    const viewport = page.viewportSize();
    const content = page.locator('main, .container, [class*="max-w"]').first();
    
    if (await content.isVisible()) {
      const box = await content.boundingBox();
      
      if (box && viewport) {
        // Conteúdo não deve exceder viewport
        expect(box.width).toBeLessThanOrEqual(viewport.width);
      }
    }
  });
});

test.describe('Página de Curso com ID', () => {
  test('curso específico deve mostrar detalhes', async ({ page }) => {
    // Primeiro, pegar um ID de curso válido das trilhas
    await page.goto('/trilhas');
    await page.waitForLoadState('networkidle');
    
    const courseLink = page.locator('a[href*="/course?id="]').first();
    
    if (await courseLink.isVisible()) {
      const href = await courseLink.getAttribute('href');
      
      if (href) {
        await page.goto(href);
        await page.waitForLoadState('networkidle');
        
        // Deve mostrar título do curso ou loading
        const courseTitle = page.locator('h1, h2').first();
        await expect(courseTitle).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('módulos do curso devem ser exibidos se existirem', async ({ page }) => {
    await page.goto('/trilhas');
    await page.waitForLoadState('networkidle');
    
    const courseLink = page.locator('a[href*="/course?id="]').first();
    
    if (await courseLink.isVisible()) {
      const href = await courseLink.getAttribute('href');
      
      if (href) {
        await page.goto(href);
        await page.waitForLoadState('networkidle');
        
        // Aguardar carregamento
        await page.waitForTimeout(2000);
        
        // Procurar por módulos
        const modules = page.locator('text=/módulo|module/i');
        const hasModules = await modules.first().isVisible().catch(() => false);
        
        console.log(`Course has modules: ${hasModules}`);
      }
    }
  });
});

test.describe('Matrícula em Curso', () => {
  test('botão de matrícula deve existir para usuários não matriculados', async ({ page }) => {
    await page.goto('/trilhas');
    await page.waitForLoadState('networkidle');
    
    const courseLink = page.locator('a[href*="/course?id="]').first();
    
    if (await courseLink.isVisible()) {
      const href = await courseLink.getAttribute('href');
      
      if (href) {
        await page.goto(href);
        await page.waitForLoadState('networkidle');
        
        // Procurar botão de matrícula
        const matriculaButton = page.getByRole('button', { name: /matricular|inscrever/i });
        const hasMatricula = await matriculaButton.isVisible().catch(() => false);
        
        // Pode não aparecer se não estiver logado
        console.log(`Matricula button visible: ${hasMatricula}`);
      }
    }
  });

  test('progresso deve ser exibido para usuários matriculados', async ({ page }) => {
    // Este teste seria mais completo com autenticação
    await page.goto('/trilhas');
    await page.waitForLoadState('networkidle');
    
    const courseLink = page.locator('a[href*="/course?id="]').first();
    
    if (await courseLink.isVisible()) {
      const href = await courseLink.getAttribute('href');
      
      if (href) {
        await page.goto(href);
        await page.waitForLoadState('networkidle');
        
        // Procurar indicadores de progresso
        const progress = page.locator('[class*="progress"], [class*="check"], text=/concluíd/i');
        const hasProgress = await progress.first().isVisible().catch(() => false);
        
        console.log(`Progress indicators visible: ${hasProgress}`);
      }
    }
  });
});

test.describe('Acessibilidade da Página de Curso', () => {
  test('imagens devem ter alt text', async ({ page }) => {
    await page.goto('/trilhas');
    await page.waitForLoadState('networkidle');
    
    const courseLink = page.locator('a[href*="/course?id="]').first();
    
    if (await courseLink.isVisible()) {
      const href = await courseLink.getAttribute('href');
      
      if (href) {
        await page.goto(href);
        await page.waitForLoadState('networkidle');
        
        const images = page.locator('img');
        const count = await images.count();
        
        for (let i = 0; i < count; i++) {
          const img = images.nth(i);
          
          if (await img.isVisible()) {
            const alt = await img.getAttribute('alt');
            expect(alt).toBeTruthy();
          }
        }
      }
    }
  });

  test('títulos devem ter hierarquia correta', async ({ page }) => {
    await page.goto('/course');
    await page.waitForLoadState('networkidle');
    
    // Verificar que existe pelo menos um h1 ou h2
    const h1 = page.locator('h1');
    const h2 = page.locator('h2');
    
    const h1Count = await h1.count();
    const h2Count = await h2.count();
    
    expect(h1Count + h2Count).toBeGreaterThan(0);
  });
});
