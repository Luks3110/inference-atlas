// Frames 0–3 illustrate the mechanism. Frames 4–7 follow the lesson's deterministic lab.
function text(x, y, value, kind = 'label', align = 'middle') {
  const escaped = String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<text x="${x}" y="${y}" text-anchor="${align}" class="ds-text ds-${kind}">${escaped}</text>`;
}

function rect(x, y, width, height, state = 'idle', radius = 5) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" class="ds-box ds-${state}"/>`;
}

function link(x1, y1, x2, y2, selected = false, color = 'work') {
  const d = `M${x1} ${y1} L${x2} ${y2}`;
  return (
    `<path d="${d}" class="ds-wire ds-wire-${selected ? color : 'idle'}"/>` +
    (selected
      ? `<circle r="2.5" class="ds-dot ds-dot-${color}"><animateMotion path="${d}" dur="1.6s" repeatCount="indefinite"/></circle>`
      : '')
  );
}

function card(x, y, width, title, hint, state = 'idle') {
  return (
    rect(x, y, width, 46, state) +
    text(x + width / 2, y + 19, title) +
    text(x + width / 2, y + 35, hint, 'small')
  );
}

function wrap(w, y, sentence) {
  const max = Math.floor((w - 38) / 6.2),
    lines = [''];
  for (const word of sentence.split(/\s+/)) {
    const last = lines.length - 1;
    if (lines[last] && (lines[last] + ' ' + word).length > max) lines.push(word);
    else lines[last] += (lines[last] ? ' ' : '') + word;
  }
  return lines.map((line, i) => text(w / 2, y + 15 * i, line, 'small')).join('');
}

function published(w, i, step) {
  const pad = 16,
    gap = 10,
    cw = (w - pad * 2 - gap) / 2,
    rx = pad + cw + gap;
  const left = pad + cw / 2,
    right = rx + cw / 2,
    cx = w / 2;
  const states = [
    ['Revisão 7', 'Fonte', '3 passagens', 'Leitura', 'viagem@7'],
    ['Revisão 8', 'Em preparação', 'Revisão publicada', 'Leitura', 'Manifesto'],
    ['Exclusão', 'Marcador', 'Inventário', 'Revogado', 'Ocultar documento'],
    ['Fonte de ACL', 'Política vigente', 'Consulta', 'Principal', 'Conferir permissão'],
    ['Revisão 7', '3 passagens', 'Revisão 8', 'Preparada', 'Leitura da v7'],
    ['Revisão 7', '3 visíveis', 'Revisão 8', '1/2 preparado', 'Leitura da v7'],
    ['Evento 7', 'Atrasado', 'Revisão 8', '2 IDs visíveis', 'Leitura da v8'],
    ['Evento 8', 'Repetido', 'Revisão 9', 'Exclusão', 'Leitura vazia'],
  ];
  const [a, b, c, d, title] = states[i],
    routeRight = [1, 3, 6, 7].includes(i);
  return (
    text(cx, 55, i === 3 ? 'Autorização por consulta' : 'Publicação por documento', 'caption') +
    card(pad, 70, cw, a, b, routeRight ? 'idle' : 'work') +
    card(rx, 70, cw, c, d, routeRight ? 'work' : 'idle') +
    link(left, 116, cx - 14, 147, !routeRight) +
    link(right, 116, cx + 14, 147, routeRight) +
    card(pad, 148, w - pad * 2, title, step.metrics.at(-1).join(' · '), 'done')
  );
}

function rerank(w, i, step) {
  const pad = 18,
    cx = w / 2;
  if (i < 4) {
    const lanes = [
        ['Rótulos', 'IDs relevantes', 'Candidatos', 'IDs recuperados', 'Interseção / relevantes'],
        ['Pergunta', 'Representação', 'Trecho', 'Representação', 'Pontuar o par'],
        [
          'Trecho A',
          'Intervalo original',
          'Trecho vizinho',
          'Intervalo sobreposto',
          'Preservar trechos distintos',
        ],
        ['Fila curta', 'Reranking', 'Fila saturada', 'Rota híbrida', 'Prazo restante da consulta'],
      ][i],
      cw = (w - pad * 2 - 10) / 2;
    return (
      card(pad, 69, cw, lanes[0], lanes[1], i % 2 ? 'work' : 'done') +
      card(pad + cw + 10, 69, cw, lanes[2], lanes[3], i % 2 ? 'done' : 'work') +
      link(pad + cw / 2, 115, cx - 12, 149, true) +
      link(w - pad - cw / 2, 115, cx + 12, 149, true, 'done') +
      card(pad, 150, w - 2 * pad, lanes[4], step.metrics[0].join(' · '))
    );
  }
  const range = w - 2 * pad,
    pos = (n) => pad + ((n - 1) * range) / 119;
  const rows = [
    [78, 1, 120, 'Texto do candidato', 'idle'],
    [116, 1, i === 4 ? 120 : 80, i === 4 ? 'Entrada completa' : 'Primeira janela', 'work'],
    ...(i >= 6 ? [[153, 41, 120, 'Segunda janela', 'done']] : []),
  ];
  let svg = text(cx, 45, 'Posição da palavra no trecho de 120', 'caption');
  for (const [y, a, b, label, color] of rows) {
    svg +=
      rect(pos(a), y, Math.max(1, pos(b) - pos(a)), 15, color, 3) + text(pad, y - 5, label, 'small', 'start');
    for (const n of [10, 110]) if (n >= a && n <= b) svg += rect(pos(n) - 2, y + 2, 4, 11, 'ink', 1);
  }
  svg +=
    link(pos(10), 96, pos(110), 96, true) +
    text(cx, 190, 'Marcadores de evidência nas posições 10 e 110', 'small');
  return svg;
}

function citation(w, i, step) {
  const pad = 16,
    cw = (w - 46) / 2,
    rx = w - 16 - cw,
    cx = w / 2;
  const triples = [
    ['Documento', 'Revisão e seção', 'Passagem', 'Intervalo no texto', 'Resolver o ID na fonte'],
    ['Afirmação', 'Regra e prazo', 'Passagem', 'Texto autorizado', 'Anexar evidência'],
    ['Afirmação', 'Prazo declarado', 'Passagem', 'Prazo na fonte', 'Conferir suporte'],
    ['Há evidência', 'Responder', 'Falta evidência', 'Abster-se', 'Decisão calibrada'],
    ['Resposta', '30 dias', 'Fonte v1', '30 dias', 'Suporte confirmado'],
    ['Cache v1', '30 dias', 'Fonte v2', '14 dias', 'Incompatível'],
    ['Resposta v2', '14 dias', 'Fonte v2', '14 dias', 'Suporte confirmado'],
    ['Fonte presente', '14 dias · v2', 'Fonte ausente', 'Abstenção', 'Validar os dois lotes'],
  ][i];
  const [a, b, c, d, result] = triples;
  return (
    text(cx, 52, i < 4 ? 'Da afirmação à passagem' : 'Qual prazo vale hoje?', 'caption') +
    card(pad, 72, cw, a, b, 'work') +
    card(rx, 72, cw, c, d, i === 5 ? 'work' : 'done') +
    link(pad + cw / 2, 118, cx - 12, 149, true) +
    link(rx + cw / 2, 118, cx + 12, 149, true, 'done') +
    card(pad, 150, w - 2 * pad, result, step.metrics.at(-1).join(' · '), i === 5 ? 'work' : 'done')
  );
}

function golden(w, i, step) {
  const pad = 16,
    cw = (w - 46) / 2,
    rx = w - pad - cw,
    cx = w / 2;
  const data = [
    ['Comuns', 'Amostra proporcional', 'Críticos', 'Amostra enriquecida', 'Ponderar pelo tráfego'],
    ['Revisor A', 'Rubrica', 'Revisor B', 'Rubrica', 'Resolver divergências'],
    ['Desenvolvimento', 'Grupos próprios', 'Teste final', 'Grupos reservados', 'Congelar o manifesto'],
    ['Controle', 'Mesmas tarefas', 'Candidato', 'Mesmas tarefas', 'Comparar por conversa'],
    ['Paráfrase 1', 'Pedido e prazo', 'Paráfrase 2', 'Mesmo pedido', '40 conversas · 80 linhas'],
    ['Treino', 'C01–C40 · turno 1', 'Teste', 'C01–C40 · turno 2', '40 IDs em comum'],
    ['Treino', 'C01–C30 · 60 linhas', 'Teste', 'C31–C40 · 20 linhas', '0 IDs em comum'],
    ['Fonte legítima', 'Prazo por pedido', 'Teste', 'C31–C40', '20 respostas verificáveis'],
  ][i];
  const [a, b, c, d, title] = data;
  let svg = card(pad, 64, cw, a, b, 'work') + card(rx, 64, cw, c, d, 'done');
  if (i === 5) svg += link(pad + cw / 2, 123, rx + cw / 2, 123, true);
  else
    svg += link(pad + cw / 2, 112, cx - 13, 151, true) + link(rx + cw / 2, 112, cx + 13, 151, true, 'done');
  return svg + card(pad, 152, w - 2 * pad, title, step.metrics.at(-1).join(' · '), i === 5 ? 'work' : 'idle');
}

function judge(w, i, step) {
  const pad = 16,
    cw = (w - 46) / 2,
    rx = w - pad - cw,
    cx = w / 2;
  const subtitles = [
    'Rubrica por dimensão',
    'Mesmos IDs, ordens invertidas',
    'Comparar com humanos',
    'Verificar a mesma régua',
    '24 pares com referência',
    '8 pares preferem a primeira posição',
    'Revisão dos pares instáveis',
    'Erro estável em quatro pares',
  ];
  const values = [
    ['Correção', 'Evidência'],
    ['A → B', 'B → A'],
    ['Aceita', 'Rejeita'],
    ['Modelo fixo', 'Rubrica fixa'],
    ['24 pares', '24 pares'],
    ['1º preferido', '1º preferido'],
    ['16 estáveis', '8 instáveis'],
    ['24 estáveis', '4 errados'],
  ][i];
  const labels = [
    ['Dimensão 1', 'Dimensão 2'],
    ['Ordem 1', 'Ordem 2'],
    ['Voto do juiz', 'Voto do juiz'],
    ['Execução 1', 'Execução 2'],
    ['Ordem AB', 'Ordem BA'],
    ['Ordem AB', 'Ordem BA'],
    ['Automática', 'Humana'],
    ['Consistência', 'Oráculo'],
  ][i];
  return (
    text(cx, 54, subtitles[i], 'caption') +
    card(pad, 73, cw, labels[0], values[0], 'work') +
    card(rx, 73, cw, labels[1], values[1], 'done') +
    link(pad + cw / 2, 119, cx - 12, 151, true) +
    link(rx + cw / 2, 119, cx + 12, 151, true, 'done') +
    card(
      pad,
      151,
      w - 2 * pad,
      i < 4
        ? 'Auditoria'
        : i === 5
          ? '8 pares com inversão'
          : i === 7
            ? '20 pares corretos'
            : 'Conferir com a referência',
      step.metrics.at(-1).join(' · '),
      'idle',
    )
  );
}

function objectives(w, i, step) {
  const pad = 18,
    bar = w - pad * 2,
    cx = w / 2;
  if (i < 4) {
    const cw = (bar - 12) / 2,
      rx = w - pad - cw;
    const columns = [
      ['Numerador', 'Pedidos bons', 'Denominador', 'Elegíveis', 'Calcular o SLI'],
      ['Controle', 'Versão estável', 'Canário', 'Versão candidata', 'Comparar as coortes'],
      ['Taxa ruim', '1,5%', 'Permitida', '0,1%', 'Burn rate · 15×'],
      ['Novas conversas', 'Versão estável', 'Em andamento', 'Plano compatível', 'Validar a recuperação'],
    ][i];
    return (
      card(pad, 66, cw, columns[0], columns[1], 'work') +
      card(rx, 66, cw, columns[2], columns[3], 'done') +
      link(pad + cw / 2, 112, cx - 14, 146, true) +
      link(rx + cw / 2, 112, cx + 14, 146, true, 'done') +
      card(pad, 148, bar, columns[4], step.metrics.at(-1).join(' · '))
    );
  }
  // The chart covers the last complete hour of the replay; a mark represents a five-minute bin.
  const high = i === 4 ? 0 : 9,
    tail = i >= 6 ? 1 : 0,
    slots = 12;
  const isHigh = (bin) => bin >= slots - high - tail && bin < slots - tail;
  let svg = text(cx, 52, 'Última hora · intervalos de 5 minutos', 'caption');
  for (let j = 0; j < slots; j++) {
    const x = pad + (j * bar) / slots;
    svg += rect(x, 75, bar / slots - 3, 39, isHigh(j) ? 'work' : 'done', 3);
  }
  svg +=
    text(pad, 137, '−60 min', 'small', 'start') +
    text(w - pad, 137, 'agora', 'small', 'end') +
    link(w - pad - bar / slots, 120, w - pad - 3, 120, true);
  const statement = [
    '1× nas duas janelas',
    '45 min críticos · curto 20×',
    '5 min estáveis · curto 1×',
    'Excesso durante o incidente · 855',
  ][i - 4];
  return svg + text(cx, 171, statement);
}

const definitions = new Map([
  ['rag-ingestao-permissoes', ['Publicação e leitura por revisão', published]],
  ['rag-reranking', ['Janela de evidência do reranker', rerank]],
  ['rag-citacoes', ['Afirmação, fonte e vigência', citation]],
  ['evals-golden-set', ['Separação dos grupos de avaliação', golden]],
  ['evals-juiz', ['Ordem dos pares e auditoria', judge]],
  ['evals-slo', ['Janela do orçamento de erro', objectives]],
]);

export function retrievalScene(lesson, stepIndex) {
  const def = definitions.get(lesson.id),
    step = lesson.steps[stepIndex];
  if (!def || !step?.metrics?.length || !step.change || lesson.steps.length !== 8) return null;
  const [title, draw] = def;
  return {
    title,
    description: step.title + '. ' + step.change,
    legend: ['Em foco', 'Referência'],
    picture(mobile) {
      const width = mobile ? 350 : 610;
      return `<svg data-illustration aria-hidden="true" class="dg-map ds-map ${mobile ? 'dg-mobile' : 'dg-wide'}" viewBox="0 0 ${width} 278">${text(width / 2, 24, step.nodes[step.active], 'caption')}${draw(width, stepIndex, step)}${wrap(width, 220, step.change)}</svg>`;
    },
  };
}
