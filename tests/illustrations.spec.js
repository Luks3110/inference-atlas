import {test, expect} from '@playwright/test';
import {simulations} from '../production/simulations.js';
import {illustrations} from '../production/illustrations.js';

test('cada etapa desenha os objetos do modelo em ambas as pontas de cada controle', () => {
  expect(Object.keys(illustrations).sort()).toEqual(Object.keys(simulations).sort());
  const shapes = new Set(['token','page','gpu','expert','request','packet','document','clock','cell','worker','bucket','check']);
  for (const [id,stages] of Object.entries(simulations)) {
    expect(illustrations[id],id).toHaveLength(stages.length);
    for (const [i,m] of stages.entries()) {
      const base = m.knobs.map(k=>k.initial);
      const reference = m.calculate(...base);
      const describe = illustrations[id][i];
      const original = describe(base,reference);
      for (const [axis,knob] of m.knobs.entries()) {
        for (const v of [knob.min,knob.max]) {
          const inputs = [...base]; inputs[axis] = v;
          const readings = m.calculate(...inputs);
          const groups = describe(inputs,readings);
          const stage = id+'/'+(i+1)+' · '+knob.label;
          expect(groups.length,stage).toBeGreaterThan(0);
          expect(groups.every(g=>shapes.has(g.shape) && g.label && Number.isFinite(g.value)),stage).toBe(true);
          if (readings.some((v,j)=>v!==reference[j])) expect(groups,stage).not.toEqual(original);
        }
      }
    }
  }
});

test('os tokens e a máscara mudam no desenho enquanto a topologia continua visível', async ({page})=>{
  await page.goto('/#/aula/espacos-de-embeddings/1');
  const scene=page.locator('.objects');
  await page.getByRole('spinbutton',{name:'Valor de Padding'}).fill('6');
  await expect(scene.locator('.sequence .padding')).toHaveCount(6);
  await expect(scene.locator('.outputs')).toContainText('4 ÷ 8 = 0,5');
  await expect(scene.locator('.outputs')).toContainText('4 ÷ 2 = 2');
  await expect(page.locator('.dg-stage')).toBeVisible();
  await expect(page.locator('.live-readings')).toContainText('0,5');
  await expect(page.locator('.curve-panel')).not.toHaveAttribute('open','');
  await page.locator('.curve-panel summary').click();
  await expect(page.locator('.live-graph')).toBeVisible();
});

test('o guia termina antes do caso e do exercício ao rolar', async ({page})=>{
  await page.goto('/#/aula/latencia-e-vazao/1');
  await page.locator('.reference-card').waitFor();
  for (const width of [1599,1230,1024,768,390]) {
    await page.setViewportSize({width,height:835});
    const overlap=await page.evaluate(async()=>{
      window.scrollTo(0,document.body.scrollHeight);
      await new Promise(requestAnimationFrame);
      const guide=document.querySelector('.reference-card').getBoundingClientRect();
      return ['.production-case','.fieldwork'].some(sel=>{
        const box=document.querySelector(sel).getBoundingClientRect();
        return guide.left<box.right && guide.right>box.left && guide.top<box.bottom && guide.bottom>box.top;
      });
    });
    expect(overlap,'viewport '+width).toBe(false);
  }
});

test('seguir a página física, abrir sublistas e juntar dois ramos instantâneos', async ({page})=>{
  await page.goto('/#/aula/kv-cache/2');
  const inputs = page.locator('.knobs input[type=number]');
  await inputs.nth(0).fill('6');
  await inputs.nth(1).fill('3');
  await expect(page.getByRole('img',{name:/página lógica L1 aponta para P3.*endereço 14/})).toBeVisible();

  await page.goto('/#/aula/rag-ivf-e-shards/5');
  await inputs.nth(1).fill('4');
  await inputs.nth(2).fill('2');
  await expect(page.locator('.shards > div')).toHaveCount(4);
  await expect(page.locator('.shards .skip')).toHaveCount(2);

  await page.goto('/#/aula/grafo-estado-explicito/2');
  await inputs.nth(0).fill('0');
  await inputs.nth(1).fill('0');
  const join=page.getByRole('img',{name:'Os ramos se encontram aos 0 ms'});
  await expect(join).toBeVisible();
  expect(await join.innerHTML()).not.toMatch(/Infinity|NaN/);
});
