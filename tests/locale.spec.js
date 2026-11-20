import { expect, test } from '@playwright/test';

test('English links and the language selector share the current lesson and progress', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('atlas:completed')) {
      localStorage.setItem('atlas:completed', JSON.stringify(['treino-e-inferencia']));
    }
  });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/?lang=en#/aula/tool-calling/4');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText('Tool calling from scratch');
  await expect(page.locator('#step-title')).toHaveText('The model requests a tool call');
  await expect(page.getByRole('button', { name: 'Copy SSE', exact: true })).toBeVisible();
  const layout = await page.evaluate(() => ({
    viewportWidth: innerWidth,
    pageWidth: document.documentElement.scrollWidth,
    headerBottom: document.querySelector('#topbar').getBoundingClientRect().bottom,
    navBottom: document.querySelector('.topnav').getBoundingClientRect().bottom,
  }));
  expect(layout.pageWidth).toBe(layout.viewportWidth);
  expect(layout.navBottom).toBeLessThanOrEqual(layout.headerBottom);

  await page.getByRole('combobox', { name: 'Language' }).selectOption('pt-BR');
  await expect(page).toHaveURL(/\?lang=pt-BR#\/aula\/tool-calling\/4$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.locator('h1')).toHaveText('Tool calling do zero');
  expect(await page.evaluate(() => localStorage.getItem('atlas:completed')))
    .toBe(JSON.stringify(['treino-e-inferencia']));

  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Tool calling from scratch');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.goForward();
  await expect(page.locator('h1')).toHaveText('Tool calling do zero');

  await page.goto('/#/guias');
  await expect(page.locator('h1')).toHaveText('Guias de referência');
  await page.getByRole('combobox', { name: 'Idioma' }).selectOption('en');
  await expect(page.locator('h1')).toHaveText('Reference guides');
  await page.goto('/#/auditoria');
  await expect(page.locator('h1')).toHaveText('Curriculum audit');
});

test('English course content includes translated search, lab controls, and explanations', async ({ page }) => {
  await page.goto('/?lang=en#/aula/rag-indice-hnsw/3');
  await expect(page.locator('h1')).toHaveText('HNSW in production');
  await expect(page.locator('#step-title')).not.toContainText('Defina');
  await page.getByRole('button', { name: 'Search the course', exact: true }).click();
  await page.getByRole('searchbox').fill('tool calling from scratch');
  const result = page.locator('#finder').getByRole('link', { name: /Tool calling from scratch/ });
  await expect(result).toBeVisible();

  await page.goto('/?lang=en#/aula/tool-calling/4');
  await page.getByRole('button', { name: /Explain.*item\.call_id/ }).click();
  await expect(page.locator('.field-note')).toContainText('function_call_output');
  await expect(page.locator('.field-note')).toContainText('identifier');
});
