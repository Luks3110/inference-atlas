// These drawings use the fixed replay of each named lesson. Guard the first frame so a
// different revision of the lesson can fall back to its own illustration.
function escapeText(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function text(x, y, value, kind = 'label', anchor = 'middle') {
  return `<text class="ds-text ds-${kind}" x="${x}" y="${y}" text-anchor="${anchor}">${escapeText(value)}</text>`;
}

function box(x, y, w, h, state = 'idle', radius = 5) {
  return `<rect class="ds-box ds-${state}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}"/>`;
}

function path(x1, y1, x2, y2, selected = false) {
  const d = `M${x1} ${y1} L${x2} ${y2}`;
  return (
    `<path d="${d}" class="ds-wire ds-wire-${selected ? 'work' : 'idle'}"/>` +
    (selected
      ? `<circle r="2.3" class="ds-dot ds-dot-work"><animateMotion path="${d}" dur="1.6s" repeatCount="indefinite"/></circle>`
      : '')
  );
}

function card(x, y, w, title, note, state = 'idle') {
  return box(x, y, w, 43, state) + text(x + w / 2, y + 17, title) + text(x + w / 2, y + 33, note, 'small');
}

function note(width, y, sentence) {
  const limit = Math.floor((width - 38) / 6.3);
  const lines = [''];
  for (const word of sentence.split(/\s+/)) {
    const last = lines.length - 1;
    if (lines[last] && lines[last].length + word.length + 1 > limit) lines.push(word);
    else lines[last] += (lines[last] ? ' ' : '') + word;
  }
  return lines.map((line, i) => text(width / 2, y + 15 * i, line, 'small')).join('');
}

function metricNumbers(metrics) {
  return Object.fromEntries(
    metrics.map(([label, raw]) => {
      const part = String(raw).match(/\d+(?:\.\d{3})*(?:,\d+)?/);
      return [label, part ? Number(part[0].replaceAll('.', '').replace(',', '.')) : undefined];
    }),
  );
}

function rows(w, data, maxValue = Math.max(...data.map((r) => r[1]), 1)) {
  const left = w < 400 ? 115 : 132,
    bar = w - left - 80;
  const dy = Math.min(29, 91 / data.length);
  return data
    .map(([label, magnitude, value, selected], i) => {
      const y = 84 + i * dy;
      return (
        text(left - 8, y + 10, label, 'small', 'end') +
        box(left, y, bar, 13, 'track', 2) +
        (magnitude > 0 ? box(left, y, (bar * magnitude) / maxValue, 13, selected ? 'work' : 'done', 2) : '') +
        text(w - 16, y + 10, value, 'small', 'end')
      );
    })
    .join('');
}

function stamp(w, step) {
  const cx = w / 2;
  return (
    text(cx, 31, step.nodes[step.active], 'caption') +
    path(cx - 40, 190, cx + 40, 190, true) +
    note(w, 220, step.change)
  );
}

function gpuMemory(w, lesson, i, step) {
  const state = metricNumbers(step.metrics);
  if (i === 0) {
    const width = (w - 48) / 2;
    return (
      card(17, 86, width, 'Pesos', step.metrics[0][1]) +
      card(w - 17 - width, 86, width, 'Payload', step.metrics[2][1], 'work') +
      text(w / 2, 158, 'Parâmetros × bytes por peso ÷ 2³⁰', 'small')
    );
  }
  const total = metricNumbers(lesson.steps[1].metrics).Total;
  const quantities = Object.assign({}, ...lesson.steps.slice(1, i + 1).map((s) => metricNumbers(s.metrics)));
  const weights = quantities.Pesos;
  const runtime = quantities['Pico de runtime'] || 0;
  const margin = quantities.Margem || 0;
  const cache = quantities['Pool KV'] || 0;
  const parts = [
    ['Pesos', weights, 'done'],
    ['Runtime', runtime, 'idle'],
    ['Margem', margin, 'outline'],
    ['Pool KV', cache, 'work'],
  ];
  if (total > weights + runtime + margin + cache)
    parts.push(['Restante', total - weights - runtime - margin - cache, 'empty']);
  let x = 16;
  let diagram = text(w / 2, 66, 'Distribuição dos ' + total + ' GiB da placa', 'caption');
  for (const [, size, color] of parts)
    if (size) {
      const span = (size / total) * (w - 32);
      diagram += box(x, 81, Math.max(1, span - 2), 25, color, 2);
      x += span;
    }
  diagram += note(
    w,
    127,
    parts
      .filter((p) => p[1])
      .map(([key, num]) => key + ' ' + num + ' GiB')
      .join(' · '),
  );
  const focus = i === 6 ? ['Demanda / pool', state.Demanda + ' / ' + cache + ' GiB'] : step.metrics[2];
  return diagram + text(w / 2, 171, focus[0] + ' · ' + focus[1]);
}

function kvBlocks(w, lesson, i) {
  if (i === 0) {
    let d = text(w / 2, 68, 'A · seis posições em dois blocos lógicos', 'caption');
    const cw = (w - 80) / 8;
    for (let j = 0; j < 8; j++)
      d += box(32 + j * cw + (j >= 4 ? 14 : 0), 97, cw - 3, 30, j < 6 ? 'work' : 'empty');
    return d + text(w / 2, 152, '4 posições cheias + 2 na cauda', 'small');
  }
  // The final lesson step gives C a count of pages but no physical addresses.
  if (i === 7) {
    let image = text(w / 2, 75, 'Pool reutilizável depois do fim de B', 'caption');
    const cw = (w - 32) / 6;
    for (let j = 0; j < 6; j++) image += box(17 + j * cw, 95, cw - 4, 32, j < 5 ? 'work' : 'empty');
    return image + text(w / 2, 158, 'C usa 5 blocos · 1 continua livre');
  }
  const a = i < 5,
    b = i >= 2;
  const groups = [
    ['', 0],
    [a ? 'A' : '', a ? (i >= 3 ? 4 : 2) : 0],
    ['', 0],
    [b ? 'B' : '', b ? 2 : 0],
    [a && b ? 'A+B' : a ? 'A' : 'B', 4],
    [i === 4 ? 'A' : '', i === 4 ? 1 : 0],
  ];
  let d = text(w / 2, 64, 'Pool físico · quatro posições por página', 'caption');
  const cw = (w - 30) / 6;
  groups.forEach(([owner, filled], idx) => {
    const x = 15 + idx * cw;
    d += text(x + cw / 2, 86, 'P' + idx, 'small') + box(x + 1, 94, cw - 3, 40, filled ? 'idle' : 'empty');
    for (let j = 0; j < 4; j++)
      d += box(
        x + 5 + (j * (cw - 11)) / 4,
        101,
        (cw - 11) / 4 - 1,
        9,
        j < filled ? (idx === 4 ? 'done' : 'work') : 'empty',
        1,
      );
    d += text(x + cw / 2, 126, owner || 'livre', 'small');
  });
  return (
    d +
    text(
      w / 2,
      162,
      i === 6
        ? 'C aguarda · 5 necessários, 4 livres'
        : 'Lógico → físico · ' +
            (a ? 'A: P4, P1' + (i === 4 ? ', P5' : '') : '') +
            (b ? (a ? '  |  ' : '') + 'B: P4, P3' : ''),
      'small',
    )
  );
}

function sparse(w, lesson, i, step) {
  const raw = Object.fromEntries(step.metrics),
    val = metricNumbers(step.metrics);
  if (i === 0)
    return (
      rows(w, [
        ['Residentes', val['Pesos totais'], raw['Pesos totais'], false],
        ['Por token', val['Ativos/token'], raw['Ativos/token'], true],
      ]) + text(w / 2, 160, 'BF16 · ' + raw['Pesos BF16'], 'small')
    );
  if ([1, 2, 3].includes(i)) {
    const cw = (w - 30) / 8,
      cx = w / 2;
    let d = text(cx, 61, i === 2 ? 'Distribuição por expert' : 'Token de exemplo · top-2', 'caption');
    for (let e = 0; e < 8; e++) {
      const x = 15 + e * cw,
        selected = i !== 2 && (e === 1 || e === 6);
      d +=
        path(cx, 73, x + cw / 2, 104, selected) +
        box(x + 1, 104, cw - 3, 28, selected ? 'work' : 'idle') +
        text(x + cw / 2, 123, 'E' + e, 'small');
    }
    const annotation =
      i === 1
        ? 'E1 · 0,70  +  E6 · 0,30'
        : i === 2
          ? raw.Tokens + ' tokens × 2 = ' + raw.Atribuições + ' atribuições'
          : '0,70 × ' + raw['Saída E1'] + ' + 0,30 × ' + raw['Saída E6'] + ' = ' + raw.Combinada;
    return d + text(cx, 165, annotation, 'small');
  }
  if (i === 4 || i === 5) {
    const mean = metricNumbers(lesson.steps[2].metrics)['Média/expert'];
    return (
      rows(w, [
        ['Média', mean, mean + ' linhas', false],
        ['Maior grupo', val['Maior grupo'], raw['Maior grupo'] + ' linhas', true],
      ]) + text(w / 2, 162, 'Latência p95 da camada · ' + raw['Camada p95'], 'small')
    );
  }
  if (i === 6) {
    const cw = (w - 52) / 2,
      peak = Object.fromEntries(lesson.steps[5].metrics)['Maior grupo'];
    return (
      text(w / 2, 64, 'E6 lógico · ' + peak + ' atribuições', 'caption') +
      path(w / 2, 74, 16 + cw / 2, 108, true) +
      path(w / 2, 74, w - 16 - cw / 2, 108, true) +
      card(16, 108, cw, 'Cópia 1', raw['Linhas/cópia'] + ' linhas', 'work') +
      card(w - 16 - cw, 108, cw, 'Cópia 2', raw['Linhas/cópia'] + ' linhas', 'work')
    );
  }
  return (
    rows(w, [
      ['Camada p95', val['Camada p95'], raw['Camada p95'], true],
      ['Meta', val['Meta p95'], raw['Meta p95'], false],
    ]) + text(w / 2, 162, raw.Misturas + ' misturas no replay', 'small')
  );
}

function expertTraffic(w, lesson, i, step) {
  const val = metricNumbers(step.metrics),
    raw = Object.fromEntries(step.metrics);
  if (i === 0) {
    const cw = (w - 32) / 4;
    let out = text(w / 2, 67, 'Alocação inicial · ' + raw.Ranks + ' ranks', 'caption');
    for (let r = 0; r < val.Ranks; r++)
      out += card(16 + r * cw, 96, cw - 4, 'Rank ' + r, raw['Experts/rank'] + ' experts', 'done');
    return out + text(w / 2, 165, 'O roteador escolhe ' + raw['Top-k'] + ' experts por token', 'small');
  }
  if (i === 1 || i === 2) {
    const cx = w / 2,
      cw = (w - 49) / 2;
    let out =
      card(16, 90, cw, 'Origem', i === 1 ? raw.Atribuições + ' destinos' : raw.Remotas + ' remotas', 'work') +
      card(
        w - 16 - cw,
        90,
        cw,
        'Destino',
        i === 1 ? raw['Vetor'] + ' por vetor' : 'Ida · ' + raw['Ida remota'],
        'done',
      );
    out += path(16 + cw, 104, w - 16 - cw, 104, true) + path(w - 16 - cw, 123, 16 + cw, 123, true);
    return (
      out +
      text(
        cx,
        160,
        i === 1
          ? 'Payload lógico de ida · ' + raw['Payload ida']
          : 'Retorno pela malha · ' + raw['Volta remota'],
        'small',
      )
    );
  }
  if (i === 3) {
    const total = Object.values(val).reduce((a, b) => a + b, 0);
    let x = 16;
    let out = text(w / 2, 66, 'Caminho da camada · tempos sem sobreposição', 'caption');
    step.metrics.forEach(([key, measurement], j) => {
      const span = ((w - 32) * val[key]) / total;
      out +=
        box(x, 88, span - 2, 28, j === 1 ? 'work' : 'done') + text(x + span / 2, 106, measurement, 'small');
      x += span;
    });
    return out + text(w / 2, 151, 'Despacho → cálculo crítico → retorno', 'small');
  }
  const before = metricNumbers(lesson.steps[4].metrics);
  if (i === 4 || i === 5)
    return rows(w, [
      ['Média inicial', before['Média/rank'], before['Média/rank'] + ' linhas', false],
      ['Rank 3 inicial', before['Linhas/rank 3'], before['Linhas/rank 3'] + ' linhas', i === 4],
      ...(i === 5 ? [['Pico remapeado', val['Pico/rank'], raw['Pico/rank'] + ' linhas', true]] : []),
    ]);
  const p95 = ['Local após mapa', 'Entre hosts', 'Grupo restaurado'];
  const timing = [5, 6, 7]
    .filter((j) => j <= i)
    .map((j, k) => {
      const m = Object.fromEntries(lesson.steps[j].metrics);
      return [p95[k], metricNumbers(lesson.steps[j].metrics)['Camada p95'], m['Camada p95'], i === j];
    });
  return rows(w, timing);
}

function replicas(w, lesson, i, step) {
  const ready = [4, 4, 4, 4, 6, 6, 5, 5][i];
  const warming = i === 1 || i === 2 || i === 3 ? 2 : 0;
  const requested = i === 5 ? 3 : ready + warming;
  const count = Math.max(ready + warming, i === 7 ? 6 : 0),
    cw = Math.min(68, (w - 30) / count);
  const left = (w - cw * count) / 2;
  let d = text(w / 2, 66, i === 5 ? 'Réplicas antes do scale-down' : 'Réplicas que podem atender', 'caption');
  for (let j = 0; j < count; j++) {
    const x = left + j * cw;
    d += box(x + 1, 88, cw - 3, 40, j < ready ? 'done' : 'empty');
    d += text(x + cw / 2, 112, j < ready ? 'Ativa' : i === 7 ? 'Fora' : i === 1 ? 'Alvo' : 'Fria', 'small');
  }
  const facts = Object.fromEntries(step.metrics);
  const status =
    i === 5
      ? 'Recomendação bruta · ' + requested + ' réplicas'
      : i === 7
        ? 'N−1 · ' + facts['N−1']
        : i === 6
          ? 'Reserva antecipada · ' + facts.Capacidade
          : i === 2
            ? 'Quentes · ' + facts.Capacidade + '  |  déficit · ' + facts.Déficit
            : step.metrics[0].join(' · ');
  return d + text(w / 2, 154, status, 'small');
}

function latency(w, lesson, i, step) {
  if (i < 2) {
    const m = metricNumbers(lesson.steps[0].metrics),
      length = m['Último texto'];
    const left = 22,
      right = w - 22,
      first = left + ((right - left) * m['1º texto']) / length;
    return (
      text(w / 2, 71, 'Uma resposta · relógio do cliente', 'caption') +
      path(left, 103, first, 103, i === 0) +
      path(first, 103, right, 103, true) +
      text(left, 133, '0 ms', 'small', 'start') +
      text(first + 4, 147, '1º · 250 ms', 'small', 'start') +
      text(right, 133, '1.250 ms', 'small', 'end') +
      text(
        w / 2,
        168,
        i === 0 ? 'Marque envio e primeiro e último textos.' : '1.000 ms ÷ 50 intervalos = 20 ms/token',
        'small',
      )
    );
  }
  if ([2, 3, 6].includes(i)) {
    const data = [2, 3, 6]
      .filter((j) => j <= i)
      .map((j) => {
        const m = Object.fromEntries(lesson.steps[j].metrics);
        return [
          j === 6 ? 'Após ajuste' : m.Chegada,
          metricNumbers(lesson.steps[j].metrics)['TTFT p95'],
          m['TTFT p95'],
          j === i,
        ];
      });
    return rows(w, data) + text(w / 2, 166, 'TTFT p95 por replay · somente tempos comparáveis', 'small');
  }
  if (i === 4) {
    const m = Object.fromEntries(step.metrics);
    return (
      text(w / 2, 78, m.Incremento + ' ÷ ' + m.Janela, 'caption') +
      card(31, 101, w - 62, 'Vazão agregada', m.Vazão, 'work')
    );
  }
  if (i === 5) {
    const m = Object.fromEntries(step.metrics);
    return (
      rows(
        w,
        [
          ['Pedidos longos', 10, m['Entradas longas'], false],
          ['Seus tokens', 65, m['Tokens de entrada'], true],
        ],
        100,
      ) + text(w / 2, 165, 'Participações em populações diferentes', 'small')
    );
  }
  const m = metricNumbers(step.metrics);
  return rows(w, [
    ['Concluídas', m.Concluídas, String(m.Concluídas), false],
    ['Nos dois SLOs', m['Dentro das duas'], String(m['Dentro das duas']), true],
  ]);
}

function searchScope(w, lesson, i) {
  const frame = i - 4;
  const current = [1, 2, 3, 4, 5];
  const cw = (w - 44) / 5;
  let out = text(
    w / 2,
    61,
    frame === 3 ? 'Amostra original · mais 10 itens de A no corpus' : 'Corpus da prova · ordem de distância',
    'caption',
  );
  current.forEach((id, j) => {
    const belongs = id > 3;
    const selected = frame === 1 ? !belongs : belongs;
    out += card(
      18 + j * cw,
      85,
      cw - 3,
      'ID ' + id,
      'Tenant ' + (belongs ? 'B' : 'A'),
      selected ? (frame === 1 ? 'work' : 'done') : 'idle',
    );
  });
  const explain = [
    'Oráculo de B · IDs 4 e 5',
    'Top-3 global = {1, 2, 3} → filtro B = ∅',
    'Filtro B = {4, 5} → top-2 = {4, 5}',
    'Com o filtro, B mantém os mesmos dois IDs.',
  ];
  return out + note(w, 162, explain[frame]);
}

function tail(w, lesson, i) {
  const frame = i - 4;
  const wait = [3, 3, 5, 5][frame],
    delay = [2, 4, 4, 6][frame];
  const left = 22,
    right = w - 22,
    scale = (right - left) / 6.5;
  let out = text(
    w / 2,
    57,
    frame === 3 ? 'Controle negativo · um dos erros' : 'Trace com erro · tempo de chegada',
    'caption',
  );
  out += path(left, 105, right, 105, true);
  out +=
    box(left + wait * scale - 1, 81, 2, 44, 'ink-work', 0) +
    text(left + wait * scale, 76, 'Decisão · ' + wait + ' s', 'small');
  out +=
    box(left + delay * scale - 3, 100, 6, 10, 'done', 2) +
    text(left + delay * scale, 143, 'Erro · ' + delay + ' s', 'small', delay > 5 ? 'end' : 'middle');
  return (
    out +
    text(
      w / 2,
      170,
      delay <= wait ? 'O erro chega antes da decisão.' : 'O span de erro chega tarde.',
      'small',
    )
  );
}

const lessons = {
  'memoria-da-gpu': ['Mapa da VRAM', 'Converter', gpuMemory],
  'kv-cache': ['Páginas e referências', 'Fazer prefill', kvBlocks],
  'mistura-de-especialistas': ['Roteamento e carga por expert', 'Dimensionar', sparse],
  'paralelismo-de-especialistas': ['Tráfego no grupo EP', 'Posicionar', expertTraffic],
  'replicas-e-autoscaling': ['Capacidade quente da frota', 'Medir', replicas],
  'latencia-e-vazao': ['Tempo percebido e vazão', 'Instrumentar', latency],
  'rag-busca-hibrida': ['Escopo e ordenação', 'Interpretar', searchScope],
  'evals-tracing': ['Janela do tail sampling', 'Propagar', tail],
};

export function teachingScene(lesson, stepIndex) {
  const config = lessons[lesson.id],
    step = lesson.steps[stepIndex];
  if (!config || !step?.change || !step.metrics?.length || !step.nodes?.[step.active]) return null;
  const [title, first, draw] = config;
  if (first && lesson.steps[0].label !== first) return null;
  if (lesson.steps.length !== 8) return null;
  if ((draw === tail || draw === searchScope) && stepIndex < 4) return null;
  return {
    title,
    description: step.title + '. ' + step.change,
    legend: ['Em foco', 'Referência'],
    picture(mobile) {
      const w = mobile ? 350 : 610;
      return `<svg data-illustration aria-hidden="true" class="dg-map ds-map ${mobile ? 'dg-mobile' : 'dg-wide'}" viewBox="0 0 ${w} 284">${draw(w, lesson, stepIndex, step)}${stamp(w, step)}</svg>`;
    },
  };
}
