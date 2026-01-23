import { test as base, expect, Page } from '@playwright/test';

// Breakpoints comuns (alinhados com Tailwind)
export const BREAKPOINTS = {
  mobile: { width: 375, height: 667 },  // iPhone SE
  mobileLarge: { width: 414, height: 896 }, // iPhone 11
  tablet: { width: 768, height: 1024 }, // iPad
  desktop: { width: 1280, height: 720 },
} as const;

// Helper para verificar se está em viewport mobile
export function isMobileViewport(page: Page): boolean {
  const viewportSize = page.viewportSize();
  return viewportSize ? viewportSize.width < 768 : false;
}

// Helper para verificar se está em viewport tablet
export function isTabletViewport(page: Page): boolean {
  const viewportSize = page.viewportSize();
  if (!viewportSize) return false;
  return viewportSize.width >= 768 && viewportSize.width < 1024;
}

// Helpers para interações mobile-specific
export async function tapAndHold(page: Page, selector: string, duration = 500) {
  const element = page.locator(selector);
  const box = await element.boundingBox();
  if (!box) throw new Error(`Element not found: ${selector}`);
  
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(duration);
  await page.mouse.up();
}

// Helper para simular swipe
export async function swipe(
  page: Page, 
  direction: 'left' | 'right' | 'up' | 'down',
  distance = 200
) {
  const viewport = page.viewportSize();
  if (!viewport) return;
  
  const startX = viewport.width / 2;
  const startY = viewport.height / 2;
  
  const moves: Record<string, { x: number; y: number }> = {
    left: { x: startX - distance, y: startY },
    right: { x: startX + distance, y: startY },
    up: { x: startX, y: startY - distance },
    down: { x: startX, y: startY + distance },
  };
  
  const end = moves[direction];
  
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 10 });
  await page.mouse.up();
}

// Helper para scroll suave em mobile
export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  // Aguardar animação de scroll
  await page.waitForTimeout(300);
}

// Helper para verificar se elemento está visível no viewport atual
export async function isVisibleInViewport(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  
  if (!await element.isVisible()) return false;
  
  const box = await element.boundingBox();
  const viewport = page.viewportSize();
  
  if (!box || !viewport) return false;
  
  return (
    box.y >= 0 &&
    box.y + box.height <= viewport.height &&
    box.x >= 0 &&
    box.x + box.width <= viewport.width
  );
}

// Extend base test com helpers mobile
type MobileFixtures = {
  isMobile: boolean;
  isTablet: boolean;
  viewportName: string;
};

export const test = base.extend<MobileFixtures>({
  isMobile: async ({ page }, use) => {
    await use(isMobileViewport(page));
  },
  
  isTablet: async ({ page }, use) => {
    await use(isTabletViewport(page));
  },
  
  viewportName: async ({ page }, use) => {
    const viewport = page.viewportSize();
    if (!viewport) {
      await use('unknown');
      return;
    }
    
    if (viewport.width < 768) await use('mobile');
    else if (viewport.width < 1024) await use('tablet');
    else await use('desktop');
  },
});

export { expect };
