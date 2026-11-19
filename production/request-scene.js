// A single request from the Qwen walkthrough. Indexes match the trace clocks in inference-cases.js.
function text(x, y, value, kind = 'label', anchor = 'middle') {
  return `<text x="${x}" y="${y}" class="ds-text ds-${kind}" text-anchor="${anchor}">${value}</text>`;
}
function box(x, y, w, h, kind = 'idle', r = 6) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" class="ds-box ds-${kind}"/>`;
}
function line(x1, y1, x2, y2, moving = true) {
  const path = `M${x1} ${y1}L${x2} ${y2}`;
  return (
    `<path d="${path}" class="ds-wire ds-wire-work"/>` +
    (moving
      ? `<circle r="3" class="ds-dot-work"><animateMotion dur="2.5s" repeatCount="indefinite" path="${path}"/></circle>`
      : '')
  );
}
function note(x, y, w, title, detail, kind = 'idle') {
  return box(x, y, w, 48, kind) + text(x + w / 2, y + 20, title) + text(x + w / 2, y + 37, detail, 'small');
}
function tokenization(w) {
  let content =
    note(18, 13, w - 36, 'Por que o céu é azul?', 'mensagem do usuário', 'work') +
    line(w / 2, 62, w / 2, 83) +
    text(w / 2, 104, 'Números que o modelo recebe');
  const ids = [28097, 1709, 297, 63834, 84, 3958, 12376, 360, 30],
    columns = w < 400 ? 5 : 9;
  const size = Math.min(54, (w - 26) / columns),
    startY = 119;
  for (const [i, id] of ids.entries()) {
    const row = Math.floor(i / columns),
      rowSize = Math.min(columns, ids.length - row * columns);
    const x = (w - rowSize * size) / 2 + (i % columns) * size,
      y = startY + row * 34;
    content +=
      box(x + 2, y, size - 4, 28, i === 6 || i === 7 ? 'work' : 'idle', 4) +
      text(x + size / 2, y + 18, id, 'small');
  }
  return (
    content +
    note(18, 198, w - 36, '“ azul” → 12376, 360', '9 IDs da pergunta + 21 do restante = 30 posições')
  );
}
function budget(w) {
  const x = 23,
    width = w - 46;
  const segments = [
    [30, 'done'],
    [32, 'work'],
    [66, 'empty'],
  ];
  let offset = x;
  let s =
    text(w / 2, 43, 'Janela configurada · 128 posições') +
    text(w / 2, 70, 'entrada + saída máxima + folga', 'small');
  for (const [count, color] of segments) {
    const part = (width * count) / 128;
    s += box(offset + 1, 96, part - 2, 44, color, 3) + text(offset + part / 2, 122, count);
    offset += part;
  }
  return (
    s +
    note(20, 171, w - 40, '30 + 32 = 62 posições', 'A entrada e a resposta cabem no limite.', 'done')
  );
}
function timeline(w, points, title, subtitle) {
  let s = text(w / 2, 38, title) + text(w / 2, 62, subtitle, 'small');
  const interval = (w - 90) / (points.length - 1);
  s += line(45, 132, w - 45, 132);
  for (const [i, [clock, event]] of points.entries()) {
    const x = 45 + i * interval;
    s +=
      box(x - 5, 127, 10, 10, 'work', 4) +
      text(x, i % 2 ? 170 : 108, clock) +
      text(x, i % 2 ? 190 : 88, event, 'small');
  }
  return s;
}
function kvBlocks(w, released) {
  let s = text(w / 2, 34, released ? 'Liberação após a desconexão' : 'KV cache da requisição A');
  const side = Math.min(24, (w - 90) / 16);
  for (const [i, [name, used]] of [
    ['P4', 16],
    ['P9', 14],
  ].entries()) {
    const y = 65 + i * 57;
    s += text(15, y + side * 0.7, name, 'small', 'start');
    for (let j = 0; j < 16; j++)
      s += box(47 + j * side, y, side - 2, side - 2, released ? 'empty' : j < used ? 'work' : 'empty', 3);
  }
  return (
    s +
    note(
      18,
      187,
      w - 36,
      released ? '2 blocos devolvidos ao pool' : '2 blocos físicos de 16 posições',
      released ? 'Sem referências ativas para A.' : 'L0 → P4 cheio · L1 → P9 com duas vagas',
      released ? 'done' : 'work',
    )
  );
}
function sample(w) {
  return (
    note(20, 16, w - 40, 'Última posição do prompt', 'vetor de logits do vocabulário') +
    line(w / 2, 64, w / 2, 85) +
    note(20, 86, w - 40, 'Amostrador', 'ID escolhido nesta execução ilustrativa: 32', 'work') +
    line(w / 2, 134, w / 2, 154) +
    note(20, 156, w - 40, 'Detokenização', 'ID 32 → “A”', 'done')
  );
}
function peak(w) {
  let s =
    text(w / 2, 33, 'Fila da réplica · janela de 10 s') +
    text(w / 2, 58, '24 chegadas/s − 20 conclusões/s = +4/s', 'small');
  for (let i = 0; i <= 5; i++) {
    const x = 30 + (i * (w - 62)) / 5,
      h = Math.max(2, i * 18);
    s +=
      box(x - 9, 185 - h, 18, h, i === 5 ? 'work' : 'done', 2) +
      text(x, 177 - h, String(i * 8), 'small') +
      text(x, 205, i * 2 + ' s', 'small');
  }
  return s + text(w / 2, 234, 'Em 10 s, 240 chegadas e 200 conclusões.', 'small');
}
const frames = {
  Tokenizar: ['Do texto aos IDs', tokenization],
  Admitir: ['Orçamento do contexto', budget],
  Enfileirar: [
    'Tempo de espera da chamada A',
    (w) =>
      timeline(
        w,
        [
          ['0 ms', 'Enviar'],
          ['8 ms', 'Texto convertido'],
          ['10 ms', 'Entrada na fila'],
          ['35 ms', 'Execução'],
        ],
        'Caminho do pedido A',
        'O trecho entre 10 e 35 ms corresponde à espera.',
      ),
  ],
  Prefill: ['Alocação do KV cache', (w) => kvBlocks(w, false)],
  Amostrar: ['Seleção do primeiro token', sample],
  Transmitir: [
    'Tempo até o primeiro token',
    (w) =>
      timeline(
        w,
        [
          ['0 ms', 'Envio'],
          ['75 ms', 'Fim do prefill'],
          ['76 ms', 'Token escolhido'],
          ['90 ms', 'Chega “A”'],
        ],
        'Espera no navegador',
        'A contagem inclui fila, execução e transporte.',
      ),
  ],
  Decodificar: [
    'Cadência da resposta',
    (w) =>
      timeline(
        w,
        [
          ['90 ms', '“A” · 32'],
          ['105 ms', '“ luz” · 64466'],
          ['120 ms', '“ se” · 511'],
        ],
        'Três entregas de texto',
        'Dois intervalos de 15 ms depois do primeiro token.',
      ),
  ],
  Cancelar: ['Referências do cache', (w) => kvBlocks(w, true)],
  'Absorver pico': ['Crescimento da fila', peak],
};
export function requestScene(step) {
  const frame = frames[step.label];
  if (!frame) return null;
  return {
    title: frame[0],
    description: step.change,
    legend: ['Estado do caso', ''],
    picture(mobile) {
      const w = mobile ? 350 : 610;
      return `<svg data-illustration aria-hidden="true" class="dg-map ds-map ${mobile ? 'dg-mobile' : 'dg-wide'}" viewBox="0 0 ${w} 260">${frame[1](w)}</svg>`;
    },
  };
}
