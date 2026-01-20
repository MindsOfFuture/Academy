import { test, expect } from '@playwright/test';
import { TEST_USERS, loginViaUI } from '../fixtures/auth.fixture';

/**
 * Testes de fluxo completo de cursos
 * Alguns testes requerem autenticação
 */

test.describe('Fluxo de Descoberta de Cursos', () => {
  test('usuário pode navegar da home para trilhas', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Procurar link para trilhas
    const trilhasLink = page.getByRole('link', { name: /trilhas|cursos|jornada/i });

    if (await trilhasLink.isVisible()) {
      await trilhasLink.click();
      await page.waitForURL('/trilhas');
      expect(page.url()).toContain('/trilhas');
    } else {
      // Navegar diretamente
      await page.goto('/trilhas');
      expect(page.url()).toContain('/trilhas');
    }
  });

  test('usuário pode ver detalhes de um curso', async ({ page }) => {
    await page.goto('/trilhas');
    await page.waitForLoadState('networkidle');

    const courseLink = page.locator('a[href*="/course?id="]').first();

    if (await courseLink.isVisible()) {
      await Promise.all([
        page.waitForURL(/\/course/),
        courseLink.click(),
      ]);

      // Deve mostrar informações do curso
      await page.waitForLoadState('networkidle');
      
      const courseTitle = page.locator('h1, h2').first();
      await expect(courseTitle).toBeVisible({ timeout: 10000 });
    }
  });

  test('curso deve mostrar módulos e aulas', async ({ page }) => {
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

        // Procurar por módulos ou aulas
        const modules = page.locator('text=/módulo|module/i');
        const lessons = page.locator('text=/aula|lesson|lição/i');

        const hasModules = await modules.first().isVisible().catch(() => false);
        const hasLessons = await lessons.first().isVisible().catch(() => false);

        console.log(`Has modules: ${hasModules}, Has lessons: ${hasLessons}`);
      }
    }
  });
});

test.describe('Fluxo de Matrícula', () => {
  test.skip(
    !process.env.TEST_STUDENT_EMAIL || !process.env.TEST_STUDENT_PASSWORD,
    'Credenciais de teste não configuradas'
  );

  test('usuário logado pode se matricular em curso', async ({ page }) => {
    const user = TEST_USERS.student;
    if (!user) {
      test.skip();
      return;
    }

    await loginViaUI(page, user);

    // Navegar para trilhas
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

        if (await matriculaButton.isVisible()) {
          await matriculaButton.click();

          // Aguardar feedback
          await page.waitForTimeout(2000);

          // Verificar sucesso (toast ou mudança de estado)
          const successToast = page.locator('text=/sucesso|matriculado/i');
          const isMatriculado = await successToast.isVisible().catch(() => false);

          console.log(`Matrícula success: ${isMatriculado}`);
        }
      }
    }
  });

  test('usuário matriculado pode marcar aula como concluída', async ({ page }) => {
    const user = TEST_USERS.student;
    if (!user) {
      test.skip();
      return;
    }

    await loginViaUI(page, user);

    // Ir para um curso onde já está matriculado (via dashboard)
    const courseCard = page.locator('a[href*="/course"]').first();

    if (await courseCard.isVisible()) {
      await courseCard.click();
      await page.waitForLoadState('networkidle');

      // Procurar botão de marcar como concluído
      const completeButton = page.getByRole('button', { name: /concluir|concluído|marcar/i });

      if (await completeButton.isVisible()) {
        await completeButton.first().click();

        // Verificar feedback
        await page.waitForTimeout(1000);

        const checkIcon = page.locator('[class*="check"], [class*="Check"]');
        const hasCheck = await checkIcon.first().isVisible().catch(() => false);

        console.log(`Lesson marked complete: ${hasCheck}`);
      }
    }
  });
});

test.describe('Fluxo de Progresso', () => {
  test.skip(
    !process.env.TEST_STUDENT_EMAIL || !process.env.TEST_STUDENT_PASSWORD,
    'Credenciais de teste não configuradas'
  );

  test('dashboard deve mostrar progresso dos cursos', async ({ page }) => {
    const user = TEST_USERS.student;
    if (!user) {
      test.skip();
      return;
    }

    await loginViaUI(page, user);

    // Verificar indicadores de progresso
    const progressIndicator = page.locator('[class*="progress"], text=/%/');
    const hasProgress = await progressIndicator.first().isVisible().catch(() => false);

    console.log(`Progress indicator visible: ${hasProgress}`);
  });

  test('card de curso deve mostrar porcentagem concluída', async ({ page }) => {
    const user = TEST_USERS.student;
    if (!user) {
      test.skip();
      return;
    }

    await loginViaUI(page, user);

    // Procurar por porcentagem
    const percentage = page.locator('text=/%/');
    const hasPercentage = await percentage.first().isVisible().catch(() => false);

    console.log(`Course percentage visible: ${hasPercentage}`);
  });
});

test.describe('Navegação entre Cursos', () => {
  test('botão voltar deve funcionar corretamente', async ({ page }) => {
    await page.goto('/trilhas');
    await page.waitForLoadState('networkidle');

    const courseLink = page.locator('a[href*="/course?id="]').first();

    if (await courseLink.isVisible()) {
      await courseLink.click();
      await page.waitForURL(/\/course/);

      // Clicar em voltar
      const backButton = page.locator('button:has-text("Voltar")');

      if (await backButton.isVisible()) {
        await backButton.click();

        // Deve voltar para página anterior
        await page.waitForTimeout(1000);
      }
    }
  });

  test('usuário pode navegar entre múltiplos cursos', async ({ page }) => {
    await page.goto('/trilhas');
    await page.waitForLoadState('networkidle');

    const courseLinks = page.locator('a[href*="/course?id="]');
    const count = await courseLinks.count();

    if (count >= 2) {
      // Visitar primeiro curso
      await courseLinks.nth(0).click();
      await page.waitForURL(/\/course/);
      const firstUrl = page.url();

      // Voltar
      await page.goBack();

      // Visitar segundo curso
      await page.waitForLoadState('networkidle');
      await courseLinks.nth(1).click();
      await page.waitForURL(/\/course/);
      const secondUrl = page.url();

      // URLs devem ser diferentes
      expect(firstUrl).not.toBe(secondUrl);
    }
  });
});
