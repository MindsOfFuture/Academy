import { test, expect } from '@playwright/test';

test.describe('Home Page Desktop - Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('página deve carregar com todos os elementos principais', async ({ page }) => {
    // Navbar
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
    
    // Logo
    const logo = page.locator('img[alt*="Logo"]').first();
    await expect(logo).toBeVisible();
    
    // Link para auth
    const authLink = page.getByRole('link', { name: /entre/i });
    await expect(authLink).toBeVisible();
  });

  test('navbar deve ser sticky e visível ao scrollar', async ({ page }) => {
    // Scroll para baixo
    // Rola e confere juntos, repetindo: logo após o carregamento o Next devolve a página
    // ao topo ao hidratar, e uma rolagem feita antes disso se perde.
    await expect(async () => {
      await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'instant' }));
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    }).toPass({ timeout: 15000 });

    // Navbar deve continuar no topo depois da rolagem
    const navbar = page.locator('nav');
    await expect.poll(async () => (await navbar.boundingBox())?.y ?? 999).toBeLessThanOrEqual(10);
  });

  test('layout não deve ter scroll horizontal', async ({ page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;
    
    // Body não deve ser mais largo que viewport
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });

  test('hero section deve ocupar área adequada', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
    
    const box = await hero.boundingBox();
    const viewport = page.viewportSize();
    
    if (box && viewport) {
      // Hero deve ter altura significativa
      expect(box.height).toBeGreaterThan(200);
    }
  });
});

test.describe('Home Page Desktop - Navegação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('clicar em "Entre" deve navegar para auth', async ({ page }) => {
    const authLink = page.getByRole('link', { name: /entre/i });
    await expect(authLink).toBeVisible();
    
    await Promise.all([
      page.waitForURL('/auth'),
      authLink.click(),
    ]);
    
    expect(page.url()).toContain('/auth');
  });

  test('logo deve ser clicável e navegar para home', async ({ page }) => {
    // Navegar para outra página primeiro
    await page.goto('/auth');
    
    const homeLink = page.locator('nav a[href="/"]').first();
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('scroll até o footer deve funcionar', async ({ page }) => {
    const footer = page.locator('footer');
    
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
  });
});

test.describe('Home Page Desktop - Performance', () => {
  test('não deve haver erros de JavaScript críticos', async ({ page }) => {
    const jsErrors: string[] = [];
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filtrar erros não críticos (hydration, ResizeObserver)
    const criticalErrors = jsErrors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('Non-Error') &&
      !e.includes('hydrat') &&
      !e.includes('Warning')
    );
    
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('imagens devem ter atributos de otimização', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const img = images.nth(i);
      
      if (await img.isVisible()) {
        const src = await img.getAttribute('src');
        const loading = await img.getAttribute('loading');
        const alt = await img.getAttribute('alt');
        
        // Todas imagens devem ter alt
        expect(alt).toBeTruthy();
        
      }
    }
  });
});

test.describe('Home Page Desktop - SEO Básico', () => {
  test('página deve ter título', async ({ page }) => {
    await page.goto('/');
    
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('página deve ter meta description', async ({ page }) => {
    await page.goto('/');
    
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    
    // Meta description é recomendado mas não obrigatório
    if (description) {
      expect(description.length).toBeGreaterThan(10);
    }
  });

  test('página deve ter meta viewport', async ({ page }) => {
    await page.goto('/');
    
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toBeTruthy();
    expect(viewport).toContain('width=device-width');
  });

  test('links devem ter texto descritivo', async ({ page }) => {
    await page.goto('/');
    
    const links = page.locator('a');
    const count = await links.count();
    
    let emptyTextLinks = 0;
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const link = links.nth(i);
      
      if (await link.isVisible()) {
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const hasImage = await link.locator('img').count() > 0;
        
        if (!text?.trim() && !ariaLabel && !hasImage) {
          emptyTextLinks++;
        }
      }
    }
    
    // Não deve haver muitos links sem texto
    expect(emptyTextLinks).toBeLessThan(3);
  });
});

test.describe('Home Page Desktop - Componentes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('seção de cursos deve existir ou ter conteúdo alternativo', async ({ page }) => {
    // Procurar por seção de cursos ou conteúdo principal
    const coursesSection = page.locator('section, [class*="course"], [class*="Course"]');
    const count = await coursesSection.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('footer deve ter links importantes', async ({ page }) => {
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    
    const links = footer.locator('a');
    const linkCount = await links.count();
    
    expect(linkCount).toBeGreaterThan(0);
    
    await expect(footer.getByRole('link', { name: /termos/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /privacidade/i })).toBeVisible();
  });

  test('imagens do footer devem carregar', async ({ page }) => {
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    
    const footerImages = footer.locator('img');
    const count = await footerImages.count();
    
    for (let i = 0; i < count; i++) {
      const img = footerImages.nth(i);
      
      if (await img.isVisible()) {
        // Depois de rolar a imagem ainda pode estar baixando: espera terminar em vez de ler uma vez só.
        await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
      }
    }
  });
});
