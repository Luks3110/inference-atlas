import { test, expect } from '@playwright/test';
import { simulations } from '../production/simulations.js';
import { lessons } from '../curriculum.js';
import { snap, responseCurves } from '../production/sim-core.js';

const numericLessons = lessons.filter(lesson => !lesson.lab);

function scenarios(model) {
  return model.knobs.reduce((cases, p) => cases.flatMap(values =>
    [...new Set([p.min, p.initial, p.max])].map(value => [...values,value])), [[]]);
}

test('todos os controles têm limites válidos e métricas finitas inclusive nas bordas', () => {
  expect(Object.keys(simulations).sort()).toEqual(numericLessons.map(l=>l.id).sort());
  for (const lesson of numericLessons) {
    expect(simulations[lesson.id],lesson.id).toHaveLength(lesson.steps.length);
    for (const [i,model] of simulations[lesson.id].entries()) {
      const where = lesson.id + '/' + (i+1);
      expect(model.metrics.length,where).toBeGreaterThanOrEqual(2);
      expect(model.explanation.trim(),where).toBeTruthy();
      const initial = model.knobs.map(p=>p.initial);
      for (const [axis,p] of model.knobs.entries()) {
        expect(p.min < p.max && p.step > 0 && p.initial >= p.min && p.initial <= p.max,where).toBeTruthy();
        expect(snap(p.initial,p),where).toBeCloseTo(p.initial,8);
        const curves=responseCurves(model,initial,axis);
        for (const chart of curves) expect(chart.points.every(v=>Number.isFinite(v.x) && Number.isFinite(v.y)),where).toBe(true);
      }
      const samples=scenarios(model);
      const outputs=samples.map(inputs=>model.calculate(...inputs));
      expect(outputs.every(row=>row.length===model.metrics.length && row.every(Number.isFinite)),where).toBe(true);
      expect(new Set(outputs.map(row=>JSON.stringify(row))).size,where).toBeGreaterThan(1);
    }
  }
});

test('as etapas com controles numéricos recalculam as medidas e o desenho ao editar os controles', async ({page})=>{
  test.setTimeout(240000);
  await page.setViewportSize({width:375,height:810});
  await page.goto('/');
  for(const lesson of numericLessons) {
    for(const [i,model] of simulations[lesson.id].entries()) {
      const initial=model.knobs.map(p=>p.initial);
      const reference=model.calculate(...initial);
      const inputs=scenarios(model).find(v=>model.calculate(...v).some((n,j)=>n!==reference[j]));
      const expected=model.calculate(...inputs).map(value=>value.toLocaleString('pt-BR',{maximumSignificantDigits:5}));
      const hash='#/aula/'+lesson.id+'/'+(i+1);
      const actual=await page.evaluate(async ({hash,stageId,inputs})=>{
        location.hash=hash;
        for(let n=0;n<100;n++){
          if(document.getElementById('range-'+stageId+'0')) break;
          if(location.hash === hash && document.querySelector('.sim-views button[aria-pressed="false"]') &&
            document.querySelector('.sim-views button:last-child')?.getAttribute('aria-pressed')==='true') {
            document.querySelector('.sim-views button').click();
          }
          await new Promise(requestAnimationFrame);
        }
        const first=document.getElementById('range-'+stageId+'0');
        if(!first) throw Error(hash);
        for(const [i,v] of inputs.entries()){
          const slider=document.getElementById('range-'+stageId+i);
          slider.value=String(v);
          slider.dispatchEvent(new Event('input',{bubbles:true}));
          await Promise.resolve();
        }
        const points=[...document.querySelectorAll('.live-graph .point')];
        return {
          results:[...document.querySelectorAll('.live-graph .value strong')].map(el=>el.textContent),
          graph:points.length>0 && points.every(p=>Number.isFinite(Number(p.getAttribute('cy')))),
          overflow:document.documentElement.scrollWidth>innerWidth,
        };
      },{hash,stageId:lesson.id+'-'+i,inputs});
      expect(actual,hash).toEqual({results:expected,graph:true,overflow:false});
    }
  }
});

test('ajuste numérico, atalho de setas, restauração e retorno à etapa',async({page})=>{
  const address='/#/aula/capacidade-milhoes/4';
  await page.goto(address);
  const number=page.getByRole('spinbutton',{name:'Valor de Acertos do cache'});
  await number.fill('90');
  await expect(page.locator('.live-graph .value strong').first()).toHaveText('1.200');
  const slider=page.getByRole('slider',{name:/Acertos do cache/});
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/capacidade-milhoes\/4$/);
  await expect(number).toHaveValue('91');
  await page.reload();
  await expect(number).toHaveValue('91');
  await page.getByRole('button',{name:'Restaurar',exact:true}).click();
  await expect(number).toHaveValue('80');
});

test('o worker busca vizinhos e recalcula a verdade elegível após alterar o filtro',async({page})=>{
  await page.goto('/#/aula/rag-indice-hnsw/6');
  const panel=page.locator('.step-decision');
  const controls=panel.locator('input[type=range]');
  await expect(panel.locator('.outcome')).toContainText('consultas');
  for(const [i,value] of [160,1].entries()){
    await controls.nth(i).fill(String(value));
  }
  await expect(panel.locator('.outcome')).toContainText('31 de 3.072');
  const readings=panel.locator('.metrics dd');
  await expect(readings.first()).toContainText('%');
  await expect(panel.getByRole('img',{name:/Percurso HNSW/})).toBeVisible();
  expect(await panel.locator('.chips').last().locator('span').count()).toBe(10);
  const previousRecall=await readings.first().innerText();
  const duringSearch = await controls.nth(1).evaluate(async el => {
    const panel = el.closest('.hnsw-play');
    const graph = panel.querySelector('svg[role="img"]');
    el.value = '100';
    el.dispatchEvent(new Event('input', {bubbles:true}));
    await Promise.resolve();
    return {
      retained: graph === panel.querySelector('svg[role="img"]'),
      busy: panel.querySelector('.outcome').getAttribute('aria-busy'),
      recall: panel.querySelector('.metrics dd').textContent,
      pinDisabled: panel.querySelector('.pin button').disabled,
    };
  });
  expect(duringSearch).toEqual({retained:true, busy:'true', recall:previousRecall, pinDisabled:true});
  await expect(panel.locator('.outcome')).toContainText('3.072 de 3.072');
  expect(await readings.first().innerText()).not.toBe(previousRecall);
  await expect(readings.nth(2)).toContainText('10 / 10');
  await panel.getByRole('button',{name:'Restaurar valores'}).click();
  await expect(controls.nth(0)).toHaveValue('32');
});

test('o cursor percorre a curva, acompanha a inversão do gesto e respeita movimento reduzido', async ({page}) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
  await page.goto('/#/aula/espacos-de-embeddings/1');
  const slider = page.getByRole('slider', { name: /Padding/ });
  const setPadding = value => slider.evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  const geometry = () => page.locator('.live-graph').evaluate(el => {
    const point = el.querySelector('.point');
    const x = point.cx.baseVal.value;
    const points = Array.from(el.querySelector('.curve').points);
    const i = Math.max(1, points.findIndex(p => p.x >= x));
    const a = points[i - 1], b = points[i];
    return {
      tip: el.querySelector('.link-state circle').cx.baseVal.value, x,
      cursor: el.querySelector('.cursor').x1.baseVal.value,
      distance: Math.abs(point.cy.baseVal.value - (a.y + (b.y-a.y)*(x-a.x)/(b.x-a.x))),
    };
  });

  await setPadding(0);
  await page.clock.runFor(180);
  const start = await geometry();
  await setPadding(8);
  await expect(page.locator('.value strong').first()).toHaveText('0,4');
  await page.clock.runFor(48);
  const mid = await geometry();
  expect(mid.tip).toBeGreaterThan(start.tip);
  expect(mid.tip).toBeLessThan(106);
  expect(mid.cursor).toBeCloseTo(mid.x);
  expect(mid.distance).toBeLessThan(0.001);
  await setPadding(0);
  expect((await geometry()).tip).toBe(mid.tip);
  await page.clock.runFor(32);
  const reversed = await geometry();
  expect(reversed.tip).toBeLessThan(mid.tip);
  expect(reversed.tip).toBeGreaterThan(start.tip);
  await page.clock.runFor(160);
  expect((await geometry()).tip).toBe(start.tip);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.runFor(32);
  await setPadding(8);
  expect((await geometry()).tip).toBe(106);
});
