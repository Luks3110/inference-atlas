import { test, expect } from '@playwright/test';
import { lessons, coreLessons, productionModules } from '../curriculum.js';

test('selecionar aula mantém a mesma lista lateral, o foco e a posição de leitura', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 780 });
  await page.goto('/');
  const lowerGroup = page.getByRole('button', { name: /Produção & padrões/ });
  await lowerGroup.click();
  const link = page.locator('#sidebar a[href="#/aula/mcp-em-producao/1"]');
  await link.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => {
    window.scrollTo(0, 120);
    window.oldNav = document.querySelector('.module-list');
    return { list: window.oldNav.scrollTop, doc: scrollY };
  });
  expect(before.list).toBeGreaterThan(0);
  await link.click();
  await expect(page.getByRole('heading', { name: 'MCP como contrato de integração' })).toBeVisible();
  expect(await page.evaluate(() => window.oldNav === document.querySelector('.module-list'))).toBe(true);
  expect(await page.locator('.module-list').evaluate((el) => el.scrollTop)).toBeCloseTo(before.list, 0);
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(before.doc, 0);
  await expect(link).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/mcp-em-producao\/2$/);
  expect(await page.locator('.module-list').evaluate((el) => el.scrollTop)).toBeCloseTo(before.list, 0);
});

test('estado anterior, progresso, busca, teclado, temas e modos sobrevivem à migração', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    if (!localStorage.getItem('seeded')) {
      localStorage.setItem('atlas:completed', '["treino-e-inferencia"]');
      localStorage.setItem('atlas:position', '"#/aula/ciclo-de-inferencia/2"');
      localStorage.setItem('seeded', '1');
    }
  });
  await page.goto('/');
  await expect(page.locator('#step-title')).toHaveText('Como o modelo transforma a pergunta em números');
  await page.locator('.objective-checks input').first().check();
  await page.keyboard.press('Control+k');
  await page.getByRole('searchbox').fill('efConstruction');
  await page.locator('#finder .results a').filter({ hasText: 'HNSW em produção' }).first().click();
  await expect(page.locator('h1')).toHaveText('HNSW em produção');
  await page.goBack();
  await expect(page.locator('.objective-checks input').first()).toBeChecked();
  await page.locator('.theme-button').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/#/aula/ciclo-de-inferencia/10');
  await page.locator('[data-action=next]').click();
  await expect(page.getByRole('dialog').locator('.finish-total')).toContainText('2 de ' + coreLessons.length);
  await page.keyboard.press('Escape');
  await page.locator('.topnav a[href="#/pratica"]').click();
  for (let i = 0; i < 5; i++) {
    await page.locator('[data-choice]').first().click();
    await page.locator('[data-next]').click();
  }
  await expect(page.locator('.am-result h2')).toHaveText('Resultado da prática');
  await page.locator('.topnav a[href="#/laboratorio"]').click();
  await expect(page.locator('.skill-lab .score')).toContainText('Passou no teste');
  await page.getByLabel('Simular acesso indevido à ferramenta de reembolso').check();
  await expect(page.locator('.skill-lab .score')).toContainText('2 erros no uso de ferramentas');
  await expect(page.locator('.skill-lab .score')).toContainText('Publicação bloqueada');
  await page.locator('.topnav a[href="#/guias"]').click();
  await page.locator('[data-guide="1"]').click();
  await page.locator('[data-copy]').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('summarize(results).passes');
  await page.locator('.topnav a[href="#/producao"]').click();
  await expect(page.locator('.topic-card')).toHaveCount(productionModules.length);
});

test('toda etapa tem explicação e exercício visual no celular', async ({ page }) => {
  test.setTimeout(240000);
  await page.setViewportSize({ width: 375, height: 810 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  // Hash navigation is also how the real timeline, menu, and browser history select a frame.
  for (const l of lessons) {
    expect(l.steps.length, l.id).toBeGreaterThanOrEqual(8);
    for (const [i, s] of l.steps.entries()) {
      const hash = '#/aula/' + l.id + '/' + (i + 1);
      await page.evaluate(
        async ({ hash, title, id }) => {
          location.hash = hash;
          for (let t = 0; t < 80; t++) {
            if (
              document.querySelector('.reader-content h2')?.textContent === title &&
              document.querySelector('h1')?.textContent === id
            )
              return;
            await new Promise(requestAnimationFrame);
          }
          throw Error('Rota não atualizou: ' + hash);
        },
        { hash, title: s.title, id: l.title },
      );
      if (l.lab === 'tool-calling') {
        await expect(page.locator('.tool-step:visible, .tool-walkthrough:visible, .tool-trace:visible')).toBeVisible();
        await expect(page.getByRole('slider')).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), hash).toBe(false);
        continue;
      }
      const referenceReading = await page.locator('.step-decision').evaluate(async (section) => {
        section.querySelector('.reading').click();
        await Promise.resolve();
        return section.querySelector('.flow small')?.textContent;
      });
      expect(referenceReading, hash).toBe(s.decision[4]);
      const snapshot = await page.evaluate(() => ({
        values: document.querySelectorAll('.instruments dd').length,
        drawings: document.querySelectorAll('.dg-stage [data-illustration]').length,
        change: document.querySelector('.step-change p')?.textContent,
        decision: document.querySelector('.step-decision h2')?.textContent,
        actors: [...document.querySelectorAll('.step-decision .flow > span')].map((el) => el.firstChild.textContent),
        metric: document.querySelector('.comparison-pair > figure > figcaption')?.textContent,
        readings: [...document.querySelectorAll('.step-decision .reading strong')].map((el) => el.textContent),
        rationale: document.querySelector('.original-rationale')?.textContent,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      expect(snapshot, hash).toMatchObject({
        values: s.metrics.length,
        drawings: 2,
        change: s.change,
        decision: s.decision[0],
        actors: s.decision.slice(1, 3),
        metric: s.decision[3],
        readings: s.decision.slice(4, 6),
        rationale: s.decision[6],
        overflow: false,
      });
    }
  }
  expect(errors).toEqual([]);
});

test('laboratórios reproduzíveis de frota e de índices', async ({ page, request }) => {
  await page.goto('/#/aula/capacidade-milhoes/1');
  await expect(page.locator('.fleet-result dl')).toContainText('42');
  await page.goto('/#/aula/rag-quantizacao-vetorial/1');
  await page.locator('.vector-lab select').selectOption('IVFPQ');
  await expect(page.locator('.bench-scroll tbody tr')).toHaveCount(6);
  await expect(page.locator('.bench-scroll')).toContainText('82,25%');
  const response = await request.get('/labs/bench-indexes.py');
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain('IndexHNSWFlat');
});

test('a leitura vem antes da simulação e o iniciante pode conferir o que entendeu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 810 });
  await page.goto('/#/aula/ciclo-de-inferencia/1');
  const title = page.locator('.lesson-main #step-title');
  await expect(title).toHaveText('Você envia a pergunta. O relógio começa.');
  await expect(page.locator('.lesson-explanation .start-here')).toContainText('100 milissegundos');
  await expect(page.locator('.lesson-explanation .start-here')).not.toContainText(/template|TTFT|989aa798/);
  expect(await page.locator('.lesson-main').evaluate(main => {
    const explanation = main.querySelector('.lesson-explanation');
    const simulation = main.querySelector('.instrument-board');
    return Boolean(explanation.compareDocumentPosition(simulation) & Node.DOCUMENT_POSITION_FOLLOWING);
  })).toBe(true);
  await page.getByRole('button', { name: 'Quando o navegador envia o pedido.' }).click();
  await expect(page.locator('fieldset [role=status]')).toContainText('A rede e a fila');
  await page.locator('.reader-actions [data-action=next]').click();
  await expect(title).toBeFocused();
  await expect(title).toBeInViewport();
  await expect(title).toHaveText('Como o modelo transforma a pergunta em números');
  await page.getByText('Termos usados nesta etapa', { exact: true }).click();
  await expect(page.locator('.lesson-explanation .course-terms')).toContainText('Cada peça tem um número próprio');
  await expect(page.locator('.technical-example')).not.toHaveAttribute('open', '');
});

test('a nova trilha abre arquitetura, anotação humana e o portal fictício', async ({page}) => {
  await page.goto('/#/aula/servidor-vllm/1');
  await expect(page).toHaveURL(/mastra-e-orquestracao\/1$/);
  const choices = page.getByRole('region', { name:'Quem escolhe o próximo passo?' });
  await choices.getByRole('button', {name:'Workflow com agentes'}).click();
  await expect(choices).toContainText('Workflow espera aprovação');
  await page.goto('/#/aula/avaliacao-humana/5');
  await expect(page.locator('#step-title')).toContainText('acordo');
  await page.getByRole('spinbutton', {name:'Valor de Casos de acordo'}).fill('12');
  await expect(page.locator('.live-readings')).toContainText('60');
  await page.goto('/#/aula/computer-use/2');
  await page.getByRole('button', {name:'Trocar layout do portal'}).click();
  await page.getByRole('button', {name:'Consultar entrega'}).click();
  await expect(page.locator('.portal-practice [role=status]')).toHaveText('Pedido 42 entregue.');
  await page.getByRole('button', {name:'Tentar encerrar pedido'}).click();
  await expect(page.locator('.portal-practice [role=status]')).toContainText('Ação recusada');
});

test('a primeira aula de aplicações ensina a chamada antes do contrato de negócio', async ({page}) => {
  await page.goto('/#/aula/tool-calling/1');
  const moduleLinks = page.locator('#sidebar a[href="#/aula/tool-calling/1"]').locator('xpath=../..');
  await expect(moduleLinks.getByRole('link').first()).toHaveText('Tool calling do zero');
  await expect(moduleLinks.getByRole('link').nth(1)).toHaveText('JSON com contrato de negócio');
  const example = page.locator('.tool-step');
  const answer = example.locator('.message').last();
  await expect(answer).toContainText('Ainda não tenho o status');
  await example.getByRole('button', {name:'Pergunta e status confirmado'}).click();
  await expect(answer).toContainText('Seu pedido 42 está em transporte.');
  await example.getByRole('button', {name:'Só a pergunta'}).click();
  await expect(answer).toContainText('Ainda não tenho o status');
  await page.goto('/#/aula/tool-calling/2');
  const chat = page.getByRole('region', { name:'Siga a chamada no chat' });
  await chat.getByRole('button', {name:'Enviar ao modelo'}).click();
  await chat.getByRole('button', {name:'Ver o que o modelo pede'}).click();
  await expect(chat).toContainText('Pede que o aplicativo consulte o pedido 42.');
  await expect(chat).not.toContainText('em transporte');
  await chat.getByRole('button', {name:'Conferir a chamada'}).click();
  await chat.getByRole('button', {name:'Consultar e devolver o resultado'}).click();
  await chat.getByRole('button', {name:'Mostrar a resposta'}).click();
  await expect(chat).toContainText('Seu pedido 42 está em transporte.');
  await chat.getByLabel('Situação').selectOption('missing');
  await chat.getByRole('button', {name:'Enviar ao modelo'}).click();
  await chat.getByRole('button', {name:'Ver o que o modelo pede'}).click();
  await expect(chat).toContainText('Qual é o número do seu pedido?');
  await expect(chat.getByRole('button', {name:'Conferir a chamada'})).toHaveCount(0);
  await chat.getByLabel('Situação').selectOption('denied');
  for (const name of ['Enviar ao modelo', 'Ver o que o modelo pede', 'Conferir a chamada', 'Devolver a recusa ao modelo', 'Mostrar a resposta']) {
    await chat.getByRole('button', {name}).click();
  }
  await expect(chat).toContainText('Não consigo consultar esse pedido com a conta atual.');
  await expect(chat).not.toContainText('em transporte');

  await page.goto('/#/aula/tool-calling/5');
  await page.getByText('Testar uma variação', {exact:true}).click();
  await example.getByRole('button', {name:'Número veio como texto'}).click();
  await expect(answer).toContainText('O campo exige um inteiro.');
  await example.getByRole('button', {name:'Conta sem acesso'}).click();
  await expect(answer).toContainText('A loja não recebe a consulta.');

  await page.goto('/#/aula/tool-calling/7');
  await page.getByText('Testar uma variação', {exact:true}).click();
  await example.getByRole('button', {name:'Consulta falhou'}).click();
  await expect(answer).toContainText('Não consegui confirmar o status');
});

test('a captura mostra schema, argumentos em SSE, execução e retorno em cada implementação', async ({page}) => {
  await page.setViewportSize({width:390,height:820});
  await page.goto('/#/aula/tool-calling/3');
  const lab = page.getByRole('region',{name:'Veja os dados da chamada do pedido 42'});
  const select = name => lab.getByRole('button',{name,exact:true}).click();
  const packets = lab.locator('pre');
  await expect(packets.first()).toContainText('"tool_choice": "auto"');
  for (const field of ['consultar_pedido','calcular_frete','"required"','"additionalProperties": false']) {
    await expect(packets.first()).toContainText(field);
  }

  await select('Ler stream');
  await expect(packets.first()).toContainText('response.output_item.added');
  await select('Próximo evento');
  await expect(packets.last()).toHaveText('{"numero":');
  await select('Próximo evento');
  await expect(packets.last()).toHaveText('{"numero":4');
  await select('Próximo evento');
  await expect(packets.last()).toHaveText('{"numero":42}');
  await expect(lab.locator('.status')).toHaveText('O harness ainda não executou a função.');
  for (let i=0;i<3;i++) await select('Próximo evento');
  await expect(packets.first()).toContainText('response.completed');
  await expect(lab.locator('.status')).toContainText('pode conferir e executar');
  await select('Devolver resultado');
  await expect(packets.first()).toContainText('"call_id": "call_pedido42"');
  await expect(packets.first()).toContainText('function_call_output');
  await select('Exibir texto');
  await expect(packets.last()).toHaveText('Seu pedido 42');
  await select('Próximo evento');
  await expect(packets.last()).toHaveText('Seu pedido 42 está em transporte.');

  await page.goto('/#/aula/tool-calling/9');
  await expect(packets.nth(2)).toContainText('"type": "tool-call"');
  await expect(packets.nth(3)).toContainText('"type": "tool-result"');
  await select('LangChain');
  await expect(lab).toContainText('registry.get(action.name)');
  await expect(packets.nth(1)).toContainText('tool_call_chunks');
  await expect(packets.nth(3)).toContainText('"tool_call_id": "call_pedido42"');
  await select('LangChain · agente');
  await expect(packets.first()).toContainText('createAgent');
  await expect(packets.last()).toContainText('ToolMessage');
  await expect(packets.last()).toContainText('"tool_call_id": "call_pedido42"');
  await select('MCP');
  await expect(packets.first()).toContainText('"method": "tools/list"');
  await expect(packets.nth(1)).toContainText('inputSchema');
  await select('Executar');
  await expect(packets.first()).toContainText('"method": "tools/call"');
  await expect(packets.nth(1)).toContainText('em transporte');

  await select('Code Mode');
  await expect(packets.first()).toContainText('tools.consultar_pedido({ numero: 42 })');
  await expect(packets.nth(1)).toContainText('"name": "consultar_rastreio"');
  await expect(packets.last()).toContainText('"previsao": "21/11"');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
});

test('os campos do JSON e do SSE explicam seu papel sem alterar a captura', async ({ page, context, request }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 390, height: 820 });
  const trace = await (await request.get('/labs/tool-calling/trace.json')).json();
  await page.goto('/#/aula/tool-calling/3');
  const lab = page.getByRole('region', { name: 'Veja os dados da chamada do pedido 42' });
  const packet = lab.locator('.packet').first();
  const packetText = packet.locator('pre').first();
  const field = path => packet.getByRole('button', { name: 'Explicar ' + path, exact: true });
  const note = packet.locator('.field-note').first();
  const rawRequest = JSON.stringify(trace.openai.http[0].request, null, 2);

  const schemaType = field('tools[0].parameters.properties.numero.type');
  await schemaType.focus();
  await schemaType.press('Enter');
  await expect(schemaType).toHaveAttribute('aria-pressed', 'true');
  await expect(note).toContainText('número inteiro');
  await expect(note).toBeInViewport();
  await expect(note).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(note).toHaveCount(0);
  await expect(schemaType).toBeFocused();
  expect(await packetText.textContent()).toBe(rawRequest);
  await packet.getByRole('button', { name: 'Copiar JSON', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(rawRequest);

  await lab.getByRole('button', { name: 'Ler stream', exact: true }).click();
  await field('item.id').click();
  await expect(note).toContainText('item_id');
  await expect(note).toContainText('call_id');
  await lab.getByRole('button', { name: 'Próximo evento', exact: true }).click();
  await expect(note).toHaveCount(0);
  await field('delta').click();
  await expect(note).toContainText('Fragmento literal dos argumentos');
  const delta = trace.openai.http[0].events.find(event => event.type === 'response.function_call_arguments.delta');
  const rawEvent = 'event: ' + delta.type + '\ndata: ' + JSON.stringify(delta);
  expect(await packetText.textContent()).toBe(rawEvent);
  await packet.getByRole('button', { name: 'Copiar SSE', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(rawEvent);

  await lab.getByRole('button', { name: 'Devolver resultado', exact: true }).click();
  await field('output').click();
  await expect(note).toContainText('call_id');
  await packet.getByRole('button', { name: 'Abrir JSON desta string', exact: true }).click();
  await field('status').click();
  await expect(packet.locator('.decoded .field-note')).toContainText('Situação da entrega');

  await lab.getByRole('button', { name: 'MCP', exact: true }).click();
  await field('id').click();
  await expect(note).toContainText('parear a resposta com o pedido MCP');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('a explicação acompanha o campo sem deslocar a leitura', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#/aula/tool-calling/4');
  const field = page.getByRole('button', { name: 'Explicar item.call_id', exact: true });
  const tooltip = page.getByRole('tooltip');
  await field.scrollIntoViewIfNeeded();
  const before = await field.boundingBox();
  await field.hover();
  await expect(tooltip).toContainText('function_call_output');
  await expect(tooltip).toBeInViewport();
  await tooltip.hover();
  await expect(tooltip).toBeVisible();
  expect(await field.boundingBox()).toEqual(before);

  await field.click();
  const pinned = page.getByRole('region', { name: 'Campo call_id' });
  await expect(pinned).toBeVisible();
  await page.mouse.move(10, 10);
  await expect(pinned).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(pinned).toHaveCount(0);
  await expect(field).toHaveAttribute('aria-pressed', 'false');
  expect(await field.boundingBox()).toEqual(before);
});
