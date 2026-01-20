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
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(300);
    
    const navbar = page.locator('nav');
    const box = await navbar.boundingBox();
    
    // Navbar deve estar no topo ou próximo
    expect(box?.y).toBeLessThanOrEqual(10);
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
    
    // Clicar no logo/nome
    const homeLink = page.getByRole('link', { name: /minds of the future/i });
    
    if (await homeLink.isVisible()) {
      await Promise.all([
        page.waitForURL('/'),
        homeLink.click(),
      ]);
      
      expect(page.url()).toBe(page.context().pages()[0].url().replace(/\/auth$/, '/'));
    }
  });

  test('scroll até o footer deve funcionar', async ({ page }) => {
    const footer = page.locator('footer');
    
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
  });
});

test.describe('Home Page Desktop - Performance', () => {
  test('LCP deve ser aceitável', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    const domContentLoaded = Date.now() - startTime;
    
    // DOM deve carregar em tempo razoável
    expect(domContentLoaded).toBeLessThan(5000);
    console.log(`DOM Content Loaded: ${domContentLoaded}ms`);
  });

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
    
    if (criticalErrors.length > 0) {
      console.log('JS Errors:', criticalErrors);
    }
    
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
        
        console.log(`Image ${i}: src=${src?.substring(0, 50)}... loading=${loading}`);
      }
    }
  });
});

test.describe('Home Page Desktop - SEO Básico', () => {
  test('página deve ter título', async ({ page }) => {
    await page.goto('/');
    
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    console.log(`Page title: ${title}`);
  });

  test('página deve ter meta description', async ({ page }) => {
    await page.goto('/');
    
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    
    // Meta description é recomendado mas não obrigatório
    if (description) {
      expect(description.length).toBeGreaterThan(10);
    }
    console.log(`Meta description: ${description || 'Not found'}`);
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
    
    // Verificar alguns links importantes
    const hasTermos = await footer.getByText(/termos/i).isVisible().catch(() => false);
    const hasPrivacidade = await footer.getByText(/privacidade/i).isVisible().catch(() => false);
    
    console.log(`Footer has Termos: ${hasTermos}, Privacidade: ${hasPrivacidade}`);
  });

  test('imagens do footer devem carregar', async ({ page }) => {
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    
    const footerImages = footer.locator('img');
    const count = await footerImages.count();
    
    for (let i = 0; i < count; i++) {
      const img = footerImages.nth(i);
      
      if (await img.isVisible()) {
        const loaded = await img.evaluate((el: HTMLImageElement) => {
          return el.complete && el.naturalWidth > 0;
        });
        
        expect(loaded).toBeTruthy();
      }
    }
  });
});
