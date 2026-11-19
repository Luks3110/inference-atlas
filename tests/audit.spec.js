import { test, expect } from '@playwright/test';
import { modules, lessons } from '../curriculum.js';
import { audit, investigations } from '../production/audit.js';

test('cada aula da auditoria liga uma lacuna a um relato de produção e a uma decisão própria', () => {
  expect(audit.map((entry) => entry.moduleTitle)).toEqual(modules.map((group) => group.title));
  const prompts = new Set();
  for (const [i, entry] of audit.entries()) {
    expect(Object.keys(entry.lessons).sort()).toEqual(modules[i].lessons.map((lesson) => lesson.id).sort());
    expect(entry.baseline.trim()).toBeTruthy();
    expect(entry.gaps.length).toBeGreaterThan(0);
    for (const [id, row] of Object.entries(entry.lessons)) {
      const source = entry.cases[row.caseIndex];
      expect(investigations.get(id).source).toBe(source);
      expect(new URL(source.url).protocol).toBe('https:');
      for (const field of [source.org, source.title, source.observed, source.mechanism, source.limits,
        row.gap, row.title, row.method, row.signal, row.exercise.prompt, row.exercise.solution]) {
        expect(field.trim(), id).toBeTruthy();
      }
      prompts.add(row.exercise.prompt);
    }
  }
  expect(prompts.size).toBe(lessons.length);
});

test('o relatório abre o caso correto em cada módulo e a resolução acompanha a aula', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 810 });
  await page.goto('/#/auditoria');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Auditoria do currículo');
  const nav = page.getByRole('navigation', { name: 'Selecionar módulo da auditoria' });
  for (const [i, group] of modules.entries()) {
    await nav.getByRole('link', {name: group.title, exact: false}).click();
    await expect(page.locator('#audit-title')).toHaveText(group.title);
    await expect(page.locator('.audit-lessons li')).toHaveCount(group.lessons.length);
    const row = investigations.get(group.lessons[0].id);
    await page.locator('.audit-lessons li a').first().click();
    await expect(page.locator('#case-title')).toHaveText(row.title);
    await expect(page.locator('#case-title')).toBeInViewport();
    await expect(page.locator('.production-case .decision details')).not.toHaveAttribute('open', '');
    await page.getByText('Conferir raciocínio', {exact: true}).click();
    await expect(page.locator('.production-case .decision details p')).toHaveText(row.exercise.solution);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('link', { name: 'Ver auditoria deste módulo' }).click();
    await expect(page.locator('#audit-title')).toHaveText(group.title);
  }
});

test('o leitor pode abrir o caso da etapa atual por link direto e pela busca', async ({ page }) => {
  await page.goto('/#/aula/tenancy-e-admissao/3/caso');
  await expect(page.locator('#case-title')).toBeInViewport();
  await page.keyboard.press('Control+k');
  await page.getByRole('searchbox').fill('sobreposição entre pools');
  await page.locator('#finder .results a').first().click();
  await expect(page).toHaveURL(/tenancy-e-admissao\/1\/caso$/);
  await page.goto('/#/aula/tenancy-e-admissao/3');
  await page.locator('.case-link').click();
  await expect(page).toHaveURL(/tenancy-e-admissao\/3\/caso$/);
  await expect(page.locator('#case-title')).toBeFocused();
});

test('o ensaio de failover distingue capacidade de GPU e leituras na origem', async ({ page }) => {
  await page.goto('/#/aula/capacidade-milhoes/1');
  await page.locator('[data-key=origin]').fill('120');
  const result = page.locator('.origin-estimate');
  await expect(result).toContainText('222,22 leituras/s');
  await expect(result).toContainText('Faltam 102,22 leituras/s');
  await page.locator('[data-key=hits]').fill('100');
  await expect(result).toContainText('0 leituras/s');
  await expect(result).toContainText('A origem comporta');
});
