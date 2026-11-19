import { test, expect } from '@playwright/test';
import { modules, lessons } from '../curriculum.js';
import { stepDecisions } from '../production/decisions.js';
import { evidenceSteps } from '../production/decision-evidence.js';
import { comparisonScale } from '../decision-scale.js';

test('a sequência respeita pré-requisitos e cada decisão possui uma comparação própria', () => {
  const names = modules.map((m) => m.id);
  expect(names).not.toContain('vllm');
  expect(names.indexOf('apis')).toBeLessThan(names.indexOf('agentes'));
  expect(names.indexOf('operacao')).toBeLessThan(names.indexOf('llms'));
  expect(names.indexOf('avaliacao')).toBeLessThan(names.indexOf('operacao'));
  expect(modules.find((m) => m.id === 'otimizacao').lessons.at(-1).id).toBe('speculative-decoding');
  const rag = modules.find((m) => m.id === 'rag').lessons.map((l) => l.id);
  expect(rag.indexOf('rag-ivf-e-shards')).toBeLessThan(rag.indexOf('rag-reranking'));
  const interventions = new Set(), explanations = new Set();
  expect(Object.keys(stepDecisions).sort()).toEqual(lessons.map(l => l.id).sort());
  for (const l of lessons) {
    expect(stepDecisions[l.id], l.id).toHaveLength(l.steps.length);
    expect(l.steps.filter((s) => s.label === evidenceSteps[l.id]), l.id).toHaveLength(1);
    for (const step of l.steps) {
      expect(step.decision, l.id).toHaveLength(7);
      expect(step.decision.every((v) => typeof v === 'string' && v.trim()), l.id).toBe(true);
      const [, , , metric, before, after] = step.decision;
      const scale = comparisonScale(before, after, metric);
      expect(scale, l.id + ' / ' + step.label).toBeTruthy();
      expect(scale.bars.every(bar => Number.isFinite(bar.start) && bar.width >= 0 && bar.start + bar.width <= 100.00001)).toBe(true);
      interventions.add(step.decision[0]);
      explanations.add(step.decision[6]);
    }
  }
  const steps = lessons.reduce((n,l) => n + l.steps.length, 0);
  expect(interventions.size).toBe(steps);
  expect(explanations.size).toBe(steps);
});

test('o gráfico conserva a unidade e o denominador das alternativas', () => {
  expect(comparisonScale('3 de 12','0 de 12').bars.map((b) => b.width)).toEqual([25,0]);
  expect(comparisonScale('10 ms','5 ms').bars.map((b) => b.width)).toEqual([100,50]);
  expect(comparisonScale('80','100','Taxa (%)').bars[0].width).toBe(80);
  expect(comparisonScale('−5','+5').zero).toBe(50);
  expect(comparisonScale('2 de 12','2 de 4')).toBeNull();
  expect(comparisonScale('10 ms','1 s')).toBeNull();
});

test('o diagrama alterna estados e a auditoria preserva os antigos endereços', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#/auditoria/7');
  await expect(page.locator('#audit-title')).toHaveText('Como LLMs funcionam');
  await page.goto('/#/aula/mcp-em-producao/2');
  const step = lessons.find(l=>l.id==='mcp-em-producao').steps[1];
  const graph = page.locator('.step-decision');
  await expect(graph.locator('.flow small')).toHaveText(step.decision[5]);
  await graph.locator('.fixed-example summary').click();
  await graph.getByRole('button', {name:/Referência/}).click();
  await expect(graph.locator('.flow small')).toHaveText(step.decision[4]);
  await expect(page.locator('.reader-content .stage-source')).toContainText('Cloudflare');
  await page.locator('.reader-actions [data-action="next"]').click();
  await expect(page).toHaveURL(/mcp-em-producao\/3$/);
  await expect(graph.locator('.flow small')).toHaveText(lessons.find(l=>l.id==='mcp-em-producao').steps[2].decision[5]);
  await graph.locator('.fixed-example summary').click();
  await expect(graph.getByRole('button',{name:/Com a decisão/})).toHaveAttribute('aria-pressed','true');
});
