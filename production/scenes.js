// The same diagram is rendered at two coordinate widths so labels remain readable on phones.
function label(x, y, value, size = 'label', anchor = 'middle') {
  const content = String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;');
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="ds-text ds-${size}">${content}</text>`;
}

function rect(x, y, width, height, state = 'idle', radius = 6) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" class="ds-box ds-${state}"/>`;
}

function tile(x, y, width, title, note, state = 'idle') {
  return rect(x, y, width, 48, state) +
    label(x + width / 2, y + 20, title) +
    label(x + width / 2, y + 37, note, 'small');
}

function link(x1, y1, x2, y2, state = 'idle') {
  const path = `M${x1} ${y1} L${x2} ${y2}`;
  const pulse = state === 'idle' ? '' :
    `<circle r="2.7" class="ds-dot ds-dot-${state}"><animateMotion path="${path}" dur="1.8s" repeatCount="indefinite"/></circle>`;
  return `<path d="${path}" class="ds-wire ds-wire-${state}"/>` + pulse;
}

function footer(width, title, explanation) {
  return tile(14, 226, width - 28, title, explanation, 'done');
}

function marker(width, y, count, selected, caption) {
  const start = width / 2 - (count - 1) * 13;
  let fragments = label(width / 2, y - 15, caption, 'caption');
  for (let index = 0; index < count; index++) {
    fragments += rect(start + 26 * index - 9, y, 18, 15, index <= selected ? 'work' : 'empty', 3);
  }
  return fragments;
}

function generation(step, width) {
  const pad = 17, cw = (width - pad * 2 - 9) / 2;
  let image = tile(pad, 17, cw, 'Prefill', 'Posições em paralelo', step === 0 ? 'work' : 'idle');
  image += tile(pad + cw + 9, 17, cw, 'Decode', 'Passos em sequência', step === 1 ? 'work' : 'idle');
  const start = pad + 7, end = width - start;
  image += marker(width, 100, 7, [0, 3, 6, 6][step], 'Tokens de saída · ordem de geração');
  image += link(start, 155, end, 155, step === 2 ? 'work' : 'done');
  const first = start + (end - start) * 0.124;
  image += rect(first - 1.5, 149, 3, 12, 'ink-work', 0);
  image += label(start, 177, 'Início', 'small', 'start') +
    label(first + 12, 199, '1º token · 350 ms', 'small', 'start') +
    label(end, 177, 'Fim · 2,825 s', 'small', 'end');
  const notes = [
    ['Processar a entrada', 'O último estado pontua o primeiro token.'],
    ['Reusar o KV cache', 'O token escolhido entra no passo seguinte.'],
    ['350 ms + 99 × 25 ms', 'Exemplo de uma saída com 100 tokens.'],
    ['Pico do exercício · 231,5 chamadas/s', '25 chamadas/s por réplica → 10 ativas + 1.'],
  ];
  return image + footer(width, ...notes[step]);
}

function operation(step, width) {
  const gutter = 18, cw = (width - 2 * gutter - 12) / 2, right = gutter + cw + 12;
  const xLeft = gutter + cw / 2, xRight = right + cw / 2;
  const top = ['Interpretar', 'Autorizar', 'Reservar', 'Conciliar', 'Responder'];
  let image = label(width / 2, 26, 'Reagendamento · operação 73', 'caption');
  image += link(xLeft, 92, xLeft, 146, step <= 2 ? 'work' : 'idle');
  image += link(xLeft + cw / 2, 168, xRight - cw / 2, 168, step === 3 ? 'work' : 'idle');
  image += link(xRight, 146, xRight, 92, step >= 3 ? 'done' : 'idle');
  image += tile(gutter, 44, cw, 'Chamada', step === 0 ? 'Deltas → JSON' : 'Intenção validada', step <= 1 ? 'work' : 'idle');
  image += tile(right, 44, cw, 'Recibo', step < 4 ? 'Pendente' : 'Confirmado', step === 4 ? 'done' : 'idle');
  image += tile(gutter, 145, cw, 'Outbox', step < 2 ? 'Aguardando' : 'Chave 73', step === 2 ? 'work' : 'idle');
  image += tile(right, 145, cw, 'Parceiro', step < 3 ? 'Agenda' : 'Chave 73', step === 3 ? 'work' : 'idle');
  const notes = [
    'Agrupe os fragmentos da mesma chamada.',
    'Confira o tenant e o dono do agendamento.',
    'Persista intenção e outbox atomicamente.',
    'Após timeout, consulte a operação 73.',
    'Reentregas recebem o recibo persistido.',
  ];
  return image + footer(width, top[step], notes[step]);
}

function stream(step, width) {
  const left = 16, total = width - 32, gap = 6, cell = (total - gap * 4) / 5;
  let image = label(width / 2, 28, 'Log durável · eventos de uma execução', 'caption');
  const ids = [40, 41, 42, 43, 44];
  ids.forEach((id, index) => {
    const x = left + index * (cell + gap);
    const state = index < 3 ? 'done' : step === 3 ? 'work' : 'idle';
    image += tile(x, 47, cell, '#' + id, ['texto', 'texto', 'estado', 'texto', 'fim'][index], state);
  });
  const x42 = left + 2 * (cell + gap) + cell / 2, x44 = width - 16 - cell / 2;
  image += link(x42, 95, x42, 126, 'done') + label(x42, 144, 'Cursor da interface · 42', 'small');
  if (step === 3) image += link(x42, 171, x44, 171, 'work');
  if (step === 2) image += rect(left + 14, 160, total - 28, 29, 'outline') + label(width / 2, 179, 'Buffer limitado por conexão', 'small');
  const notes = [
    ['Filtrar o stream', 'Exponha texto do nó público e progresso.'],
    ['Persistir antes de enviar', 'A sequência cresce dentro de cada execução.'],
    ['Aplicar contrapressão', 'O cliente lento pode se reconectar ao log.'],
    ['Retomar após 42', 'Entregue os eventos 43 e 44 em ordem.'],
  ];
  return image + footer(width, ...notes[step]);
}

function contextBudget(step, width) {
  const left = 18, bar = width - 2 * left;
  const parts = [4096, 1536, 3072, 1024, 5120, 17920];
  let x = left, image = label(width / 2, 29, 'Janela total · 32.768 tokens', 'caption');
  parts.forEach((value, i) => {
    const size = bar * value / 32768;
    const state = step === 0 && i < 4 || step === 1 && i === 4 || step === 2 && i === 5 ? 'work' : step === 3 ? 'done' : 'idle';
    image += rect(x, 49, size - 1, 25, state, 2);
    x += size;
  });
  const lines = [['Saída', '4.096'], ['Instruções', '1.536'], ['Tools', '3.072'], ['Margem', '1.024'], ['Evidências', '5.120'], ['Histórico', '17.920']];
  const cell = bar / 2;
  lines.forEach(([name, value], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const start = left + col * cell, y = 98 + row * 30;
    image += label(start + 4, y, name, 'small', 'start') + label(start + cell - 8, y, value, 'label', 'end');
  });
  image += link(left, 185, width - left, 185, step === 3 ? 'done' : 'work');
  const notes = [
    ['Reservas fixas · 9.728', 'Incluem template, tools, margem e saída.'],
    ['Evidências + histórico · 23.040', 'Após as evidências, sobram 17.920 tokens.'],
    ['Histórico bruto · 23.000', 'Condensar ou remover 5.080 tokens.'],
    ['Recontar após serializar', 'O histórico final deve caber em 17.920.'],
  ];
  return image + footer(width, ...notes[step]);
}

function retrieval(step, width) {
  const pad = 15, gap = 10, cell = (width - pad * 2 - gap) / 2, right = pad + cell + gap;
  const cx = width / 2;
  let image = label(cx, 27, 'Consulta · E42 válvula travada', 'caption');
  image += tile(pad, 48, cell, 'BM25', 'A · 1º    B · 4º', step < 2 ? 'work' : 'idle') +
    tile(right, 48, cell, 'Vetorial', 'B · 2º', step <= 2 ? 'work' : 'idle');
  image += link(pad + cell / 2, 96, cx - 14, 145, step === 3 ? 'work' : 'idle') +
    link(right + cell / 2, 96, cx + 14, 145, step >= 2 ? 'work' : 'idle');
  image += tile(pad, 146, width - pad * 2, 'Fusão · k = 60', 'B · 1/64 + 1/62     A · 1/61', step === 3 ? 'done' : 'idle');
  const notes = [
    ['Separar os sinais', 'Código raro e sintoma usam sinais diferentes.'],
    ['Pontuar por método', 'Cada recuperador ordena a sua própria lista.'],
    ['Verificar a busca vetorial', 'Compare vizinhos aproximados e exatos.'],
    ['B · 0,03175  >  A · 0,01639', 'Com uma janela lexical de 3, A vence B.'],
  ];
  return image + footer(width, ...notes[step]);
}

function trace(step, width) {
  const left = 84, bar = width - left - 20;
  const rows = [
    ['Pedido', 0, 1, 'done'],
    ['BM25', 0.03, 0.22, 'work'],
    ['Vetores', 0.03, 0.32, 'work'],
    ['Fusão', 0.35, 0.12, 'work'],
    ['Inferência', 0.47, 0.53, 'done'],
  ];
  let image = label(width / 2, 27, 'Um trace · da entrada ao primeiro token', 'caption');
  rows.forEach(([name, start, length, state], i) => {
    const y = 47 + i * 29;
    const shown = step === 0 && i > 0 ? 'idle' : state;
    image += label(left - 8, y + 11, name, 'small', 'end') +
      rect(left + start * bar, y, length * bar, 16, shown, 4);
  });
  image += link(left, 194, left + bar, 194, step > 1 ? 'work' : 'idle') +
    label(left, 210, 'Início', 'small', 'start') + label(left + bar, 210, 'TTFT', 'small', 'end');
  const notes = [
    ['Propagar a identidade', 'Cada serviço liga seu span ao mesmo trace.'],
    ['Ler o caminho crítico', 'A fusão aguarda a busca mais demorada.'],
    ['Coletor · decisão ao fim', 'Preserve erros e uma amostra dos sucessos.'],
    ['SLI no tráfego completo', 'A seleção por erro altera a amostra retida.'],
  ];
  return image + footer(width, ...notes[step]);
}

function retries(step, width) {
  const roots = [1, 2, 4, 8], names = ['Origem', 'Camada 1', 'Camada 2', 'Destino'];
  const xs = roots.map((_, i) => 19 + (width - 38) * (i + 0.5) / 4);
  const ys = count => Array.from({ length: count }, (_, i) => 56 + (i + 0.5) * 126 / count);
  let image = label(width / 2, 24, 'Tentativas por chamada · três camadas', 'caption');
  roots.forEach((count, depth) => {
    const x = xs[depth], points = ys(count);
    image += label(x, 45, names[depth], 'small');
    if (depth) {
      const parents = ys(roots[depth - 1]);
      points.forEach((y, i) => {
        const state = step < 2 ? (depth === 3 ? 'work' : 'idle') : i === 0 ? 'done' : 'idle';
        image += link(xs[depth - 1] + 4, parents[Math.floor(i / 2)], x - 4, y, state);
      });
    }
    points.forEach((y, i) => {
      image += rect(x - 4, y - 4, 8, 8, step < 2 ? 'work' : i === 0 ? 'done' : 'empty', 4);
    });
  });
  image += label(width / 2, 207, '2 tentativas por camada → até 8 no destino', 'small');
  const notes = [
    ['Prazo total · 2 s', 'Só admita trabalho que caiba no saldo.'],
    ['Falha com efeito incerto', 'Consulte o recibo antes de repetir a escrita.'],
    ['Concentrar retries', '1.000 originais/s + até 100 extras/s.'],
    ['Reabrir por etapas', 'Conte conclusões no prazo e fila vencida.'],
  ];
  return image + footer(width, ...notes[step]);
}

const scenes = new Map([
  ['economia-da-geracao', {
    title: 'Custo dos passos de geração', legend: ['Passo atual', 'Sequência'], draw: generation,
    descriptions: [
      'O prefill calcula em paralelo as posições da entrada e pontua o próximo token.',
      'O decode reutiliza o KV cache e inclui um token por vez.',
      'No exemplo, 350 ms até o primeiro token e 99 intervalos de 25 ms resultam em 2,825 segundos.',
      'No exercício, dez réplicas atendem o pico e a décima primeira dá redundância.',
    ],
  }],
  ['execucao-idempotente-de-tools', {
    title: 'Uma intenção de reagendamento', legend: ['Trabalho local', 'Confirmação'], draw: operation,
    descriptions: [
      'Fragmentos da chamada são agrupados antes da leitura do JSON.',
      'A sessão e os dados do agendamento fundamentam a autorização da operação 73.',
      'A intenção e seu evento de outbox são gravados juntos.',
      'O parceiro recebe a mesma chave e permite consultar o efeito de resultado incerto.',
      'O recibo persistido confirma a operação ao cliente após reentregas.',
    ],
  }],
  ['streaming-grafo-interface', {
    title: 'Eventos, cursor e reconexão', legend: ['Entrega', 'Aplicado'], draw: stream,
    descriptions: [
      'O contrato expõe eventos de texto, progresso e conclusão.',
      'Eventos da mesma execução recebem uma sequência persistida antes da entrega.',
      'A interface já aplicou o evento 42 e o relay limita o buffer da conexão.',
      'Depois do cursor 42, o log fornece os eventos 43 e 44 à interface.',
    ],
  }],
  ['orcamento-de-contexto', {
    title: 'Divisão de uma janela de 32k', legend: ['Reserva atual', 'Validado'], draw: contextBudget,
    descriptions: [
      'A janela tem 32.768 tokens. Instruções, tools, margem e saída reservam 9.728.',
      'As evidências ocupam 5.120 tokens e deixam 17.920 disponíveis para o histórico.',
      'Um histórico de 23.000 tokens precisa ser reduzido em 5.080.',
      'A contagem final verifica cada componente após a serialização do prompt.',
    ],
  }],
  ['rag-busca-hibrida', {
    title: 'Fusão de duas listas ordenadas', legend: ['Recuperação', 'Resultado'], draw: retrieval,
    descriptions: [
      'Uma consulta com código e sintoma segue para os índices lexical e vetorial.',
      'O candidato A é o primeiro lexical. B é o quarto lexical e segundo vetorial.',
      'O ranking vetorial aproximado pode ser comparado com o exato antes da fusão.',
      'RRF com constante 60 coloca B à frente de A. Cortar a lista lexical em três inverte o resultado.',
    ],
  }],
  ['evals-tracing', {
    title: 'Caminho crítico de um trace', legend: ['Spans internos', 'Pedido'], draw: trace,
    descriptions: [
      'O pedido compartilha o contexto de trace com os serviços filhos.',
      'Busca lexical e vetorial ocorrem em paralelo. Fusão e inferência dependem da conclusão de ambas.',
      'Um coletor com tail sampling pode escolher traces a partir do resultado final.',
      'Contadores para todos os pedidos fornecem o denominador para medir o SLI.',
    ],
  }],
  ['deadlines-e-retries', {
    title: 'Amplificação das tentativas', legend: ['Tentativa', 'Caminho original'], draw: retries,
    descriptions: [
      'Com três camadas e duas tentativas em cada uma, o teto é de oito visitas ao destino se o prazo permitir.',
      'Uma falha ambígua pode exigir consultar o resultado da operação.',
      'No redesenho, o caminho original recebe mil chamadas por segundo e a política limita as extras a cem.',
      'Durante a recuperação, uma única camada controla novas tentativas e a fila descarta pedidos vencidos.',
    ],
  }],
]);

export function productionScene(id, stepIndex) {
  const scene = scenes.get(id);
  if (!scene) return null;
  return {
    title: scene.title,
    legend: scene.legend,
    description: scene.descriptions[stepIndex],
    picture(mobile) {
      const width = mobile ? 350 : 610;
      return `<svg data-illustration aria-hidden="true" class="dg-map ds-map ${mobile ? 'dg-mobile' : 'dg-wide'}" viewBox="0 0 ${width} 294">${scene.draw(stepIndex, width)}</svg>`;
    },
  };
}
