import { operationsScene } from './production/operations-scenes.js';
import { infrastructureScene } from './production/infrastructure-scenes.js';
import { vectorScene } from './production/vector-scenes.js';
import { requestScene } from './production/request-scene.js';
import { productionScene } from './production/scenes.js';
import { teachingScene } from './production/teaching-scenes.js';
import { retrievalScene } from './production/retrieval-scenes.js';
import { modelScene } from './production/model-scenes.js';
import { graphScene } from './production/graph-scenes.js';

// Each object shares the same isometric axes so its ports, pins and traces line up.
const projection = ([x, y, z = 0]) => [x - y, (x + y) * 0.47 - z];
const position = (point) =>
  projection(point)
    .map((n) => Number(n.toFixed(2)))
    .join(',');
const escapeText = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (value) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[value],
  );

function face(points, color, width = 1.5) {
  return (
    '<polygon points="' +
    points.map(position).join(' ') +
    '" fill="' +
    color +
    '" stroke="var(--dg-outline)" stroke-width="' +
    width +
    '" stroke-linejoin="round"/>'
  );
}

function stroke(from, to, color = 'var(--dg-outline)', width = 1.2) {
  return (
    '<polyline points="' +
    position(from) +
    ' ' +
    position(to) +
    '" fill="none" stroke="' +
    color +
    '" stroke-width="' +
    width +
    '" stroke-linecap="round"/>'
  );
}

const stone = ['var(--dg-ivory)', 'var(--dg-stone)', 'var(--dg-shadow)'];
const green = ['var(--dg-mint)', 'var(--dg-sea)', 'var(--dg-deep)'];
const orange = ['var(--dg-peach)', 'var(--dg-orange)', 'var(--dg-rust)'];
const blue = ['var(--dg-blue)', 'var(--dg-blue-side)', 'var(--dg-blue-end)'];

function block(x, y, z, w, d, h, palette, lineWidth = 1.5) {
  const a = [x, y, z + h],
    b = [x + w, y, z + h],
    c = [x + w, y + d, z + h],
    e = [x, y + d, z + h];
  return (
    face([e, c, [x + w, y + d, z], [x, y + d, z]], palette[1], lineWidth) +
    face([b, c, [x + w, y + d, z], [x + w, y, z]], palette[2], lineWidth) +
    face([a, b, c, e], palette[0], lineWidth)
  );
}

function diode(x, y, z, color) {
  return (
    '<circle cx="' +
    projection([x, y, z])[0] +
    '" cy="' +
    projection([x, y, z])[1] +
    '" r="1.65" fill="' +
    color +
    '"/>'
  );
}

function laptop() {
  let keys = '';
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      const x = -7 + row * 4.5,
        y = -20 + col * 5.5;
      keys += face(
        [
          [x, y, 5],
          [x + 2.7, y, 5],
          [x + 2.7, y + 3.1, 5],
          [x, y + 3.1, 5],
        ],
        'var(--dg-stone)',
        0.5,
      );
    }
  }
  return (
    block(-16, -28, 0, 36, 56, 4, stone) +
    face(
      [
        [-15, 28, 5],
        [-15, -28, 5],
        [-19, -28, 45],
        [-19, 28, 45],
      ],
      'var(--dg-terminal)',
      2.2,
    ) +
    face(
      [
        [-16.2, 25, 9],
        [-16.2, -25, 9],
        [-18.6, -25, 41],
        [-18.6, 25, 41],
      ],
      'var(--dg-screen)',
      1,
    ) +
    stroke([-18.4, 24, 35], [-18.4, -24, 35], 'var(--dg-terminal)', 1) +
    diode(-18.5, 21, 37.5, 'var(--dg-peach)') +
    diode(-18.5, 16, 37.5, 'var(--dg-mint)') +
    stroke([-17.7, 19, 28], [-17.7, 15, 25], 'var(--dg-mint)', 1.8) +
    stroke([-17.7, 15, 25], [-17.7, 19, 22], 'var(--dg-mint)', 1.8) +
    stroke([-17.7, 9, 23], [-17.7, -9, 23], 'var(--dg-mint)', 2) +
    stroke([-17.4, 13, 17], [-17.4, -1, 17], 'var(--dg-blue)', 1.3) +
    keys +
    face(
      [
        [9, -7, 4.5],
        [17, -7, 4.5],
        [17, 8, 4.5],
        [9, 8, 4.5],
      ],
      'var(--dg-ivory)',
      0.7,
    )
  );
}

function gateway() {
  let ports = '',
    vents = '';
  for (let i = 0; i < 4; i++) {
    const x = -15 + 9 * i;
    ports += face(
      [
        [x, 24, 9],
        [x + 6, 24, 9],
        [x + 6, 24, 4],
        [x, 24, 4],
      ],
      'var(--dg-terminal)',
      0.8,
    );
  }
  for (let i = 0; i < 6; i++) {
    vents += stroke([0, -10 + i * 3, 19], [14, -10 + i * 3, 19], 'var(--dg-rust)', 1.35);
  }
  return (
    block(-26, -23, 0, 52, 47, 16, stone) +
    block(-26, -23, 16, 52, 47, 3, orange, 1.2) +
    ports +
    vents +
    diode(-19, 24, 11, 'var(--dg-deep)') +
    diode(26, -15, 9, 'var(--dg-orange)') +
    stroke([-18, 13, 19], [-8, 13, 19], 'var(--dg-rust)', 2)
  );
}

function gpu() {
  let rack = '',
    pins = '';
  for (let n = 0; n < 3; n++) {
    const z = n * 13;
    if (n)
      rack += block(
        -22,
        -19,
        z - 3,
        44,
        38,
        3,
        ['var(--dg-terminal)', 'var(--dg-terminal)', 'var(--dg-terminal)'],
        0.8,
      );
    rack += block(-29, -25, z, 58, 50, 10, n === 2 ? green : stone);
    for (let i = 0; i < 4; i++)
      rack += stroke([-17 + i * 4.2, 25, z + 6], [-17 + i * 4.2, 25, z + 3], 'var(--dg-terminal)', 1.6);
    rack += diode(18, 25, z + 5, 'var(--dg-deep)') + diode(23, 25, z + 5, 'var(--dg-peach)');
  }
  for (let i = -9; i < 12; i += 4) {
    pins +=
      stroke([i, 12, 36.8], [i, 16, 36.8], 'var(--dg-terminal)', 1.4) +
      stroke([12, i, 36.8], [16, i, 36.8], 'var(--dg-terminal)', 1.4) +
      stroke([-12, i, 36.8], [-16, i, 36.8], 'var(--dg-terminal)', 1.4) +
      stroke([i, -12, 36.8], [i, -16, 36.8], 'var(--dg-terminal)', 1.4);
  }
  return (
    rack +
    pins +
    block(-12, -12, 36.5, 24, 24, 2.6, green, 1) +
    face(
      [
        [-6, -6, 39.4],
        [6, -6, 39.4],
        [6, 6, 39.4],
        [-6, 6, 39.4],
      ],
      'var(--dg-ivory)',
      0.9,
    )
  );
}

function storage() {
  let stack = '';
  for (let i = 0; i < 3; i++) {
    stack += block(-22, -21, 12 * i, 44, 42, 9, blue);
    stack += stroke([-14, 21, 12 * i + 4], [0, 21, 12 * i + 4], 'var(--dg-terminal)', 1.4);
    stack += diode(14, 21, 12 * i + 4, 'var(--dg-mint)');
  }
  return stack;
}

function documents() {
  let pages = '';
  for (let i = 0; i < 3; i++) pages += block(-20 + i, -25 + i, 3 * i, 40, 50, 2, stone, 1);
  for (let i = 0; i < 5; i++)
    pages += stroke([-12 + i * 5, -12, 8], [-12 + i * 5, 14 - (i % 3) * 3, 8], 'var(--dg-blue-end)', 1.5);
  return pages;
}

function hardwareFor(label, index) {
  if (/GPU|engine|expert|vLLM|modelo|réplica|worker|tensor|decode|prefill/i.test(label)) return gpu();
  if (/cache|memória|disco|registro|dados|storage|vetor|índice/i.test(label)) return storage();
  if (/API|gateway|roteador|rede|balanceador|fila|router/i.test(label)) return gateway();
  if (/cliente|usuário|prompt|entrada|chat|alerta|painel/i.test(label)) return laptop();
  return [documents, gateway, storage][index]();
}

function icon(name) {
  const paths = {
    replay: '<path d="M3 7a6 6 0 1 1 1 7M3 3v4h4"/>',
    pause: '<path d="M6 4v10M12 4v10" stroke-width="2.6"/>',
    play: '<path d="m6 3 8 6-8 6z" fill="currentColor" stroke="none"/>',
    topology:
      '<rect x="6" y="1.5" width="6" height="4" rx="1"/><path d="M9 6v3M3.5 12V9h11v3"/><rect x="1" y="12" width="5" height="4" rx="1"/><rect x="12" y="12" width="5" height="4" rx="1"/>',
  };
  return (
    '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    paths[name] +
    '</svg>'
  );
}

// Points are on the floor plane. Desktop and phone views use the same models.
function layout(mobile) {
  return mobile
    ? {
        width: 350,
        height: 305,
        scale: 0.85,
        points: [
          [67, 133],
          [174, 99],
          [277, 157],
        ],
        route: ['M91 119 137 96', 'M208 96 252 118'],
        feedback:
          'M305 176 337 192 Q341 194 341 199 L341 214 Q341 220 336 222 L193 290 Q187 293 181 290 L30 218 Q25 216 25 211 L25 194 Q25 191 30 188 L54 176',
        annotations: [
          [65, 48],
          [173, 39],
          [277, 76],
        ],
        labels: [
          [67, 175],
          [174, 139],
          [276, 199],
        ],
      }
    : {
        width: 660,
        height: 296,
        scale: 1.29,
        points: [
          [113, 164],
          [324, 134],
          [539, 159],
        ],
        route: [
          'M163 154 206 132 Q212 129 218 132 L235 140 Q240 143 246 140 L264 131',
          'M383 132 406 121 Q412 118 419 121 L473 147',
        ],
        feedback:
          'M589 177 628 196 Q632 198 632 203 L632 213 Q632 217 627 219 L513 275 Q507 278 500 275 L456 253 Q450 250 444 253 L389 279 Q382 283 375 280 L280 234 Q274 231 267 234 L223 255 Q217 258 210 255 L42 174 Q37 172 42 169 L56 162',
        annotations: [
          [113, 43],
          [324, 48],
          [539, 48],
        ],
        labels: [
          [113, 215],
          [324, 184],
          [539, 212],
        ],
      };
}

function movingPacket(path, kind, delay = '0s') {
  return (
    '<circle r="3.2" class="dg-packet dg-' +
    kind +
    '"><animateMotion path="' +
    path +
    '" dur="' +
    (kind === 'reply' ? '6' : '2.9') +
    's" begin="' +
    delay +
    '" repeatCount="indefinite"/></circle>'
  );
}

function modelLabel(x, y, label, active) {
  const width = Math.max(62, label.length * 6.8 + 22);
  return (
    '<g class="dg-node-label ' +
    (active ? 'dg-selected' : '') +
    '" transform="translate(' +
    x +
    ' ' +
    y +
    ')">' +
    '<rect x="' +
    -width / 2 +
    '" y="-12" width="' +
    width +
    '" height="23" rx="7"/>' +
    '<text y="3.8" text-anchor="middle">' +
    escapeText(label) +
    '</text></g>'
  );
}

function illustrate(config, step, inference, stepIndex, mobile, id) {
  const { width, height, scale, points, route, feedback, annotations, labels } = config;
  const names = inference ? ['Navegador', 'Servidor', 'Modelo na GPU'] : step.nodes;
  const active = step.active;
  const grid = 'grid-' + id,
    fade = 'fade-' + id,
    mask = 'mask-' + id;
  const returnPath = active === 0 && stepIndex > 0;
  const traces = route
    .map(
      (path, i) =>
        '<path d="' + path + '" class="dg-trace"/>' + movingPacket(path, 'request', i ? '-1.4s' : '0s'),
    )
    .join('');
  let components = names
    .map((name, i) => {
      const [x, y] = points[i];
      const hardware = inference ? [laptop, gateway, gpu][i]() : hardwareFor(name, i);
      return (
        '<g transform="translate(' +
        x +
        ' ' +
        y +
        ') scale(' +
        scale +
        ')">' +
        '<ellipse cx="0" cy="4" rx="48" ry="19" class="dg-drop"/>' +
        (active === i
          ? '<path d="m-61 2 58-28q3-1.6 6 0l55 26q4 2 0 4L3 31q-3 1.6-6 0L-61 5q-3-1.5 0-3Z" class="dg-focus"/>'
          : '') +
        hardware +
        '</g>' +
        modelLabel(...labels[i], name, i === active)
      );
    })
    .join('');
  if (inference) {
    const [ax, ay] = annotations[active];
    const packet = ['prompt', 'IDs de tokens', 'prefill', 'próximo token', 'streaming'][stepIndex] || 'token';
    const calloutWidth = Math.max(60, packet.length * 6.4 + 14);
    const sub = 'GPU · KV cache';
    components +=
      '<g class="dg-annotation" transform="translate(' +
      ax +
      ' ' +
      ay +
      ')">' +
      '<path d="M0 9v12"/><rect x="' +
      -calloutWidth / 2 +
      '" y="-8" width="' +
      calloutWidth +
      '" height="17" rx="5"/>' +
      '<text text-anchor="middle" y="4">' +
      packet +
      '</text></g>' +
      '<text x="' +
      labels[2][0] +
      '" y="' +
      (labels[2][1] + 24) +
      '" class="dg-caption" text-anchor="middle">' +
      sub +
      '</text>';
  }
  return (
    '<svg data-illustration aria-hidden="true" class="dg-map ' +
    (mobile ? 'dg-mobile' : 'dg-wide') +
    '" viewBox="0 0 ' +
    width +
    ' ' +
    height +
    '">' +
    '<defs><pattern id="' +
    grid +
    '" width="40" height="20" patternUnits="userSpaceOnUse">' +
    '<path d="M0 0 40 20 M40 0 0 20" class="dg-gridlines"/></pattern>' +
    '<radialGradient id="' +
    fade +
    '"><stop offset="15%" stop-color="white"/><stop offset="100%" stop-color="black"/></radialGradient>' +
    '<mask id="' +
    mask +
    '"><rect width="100%" height="100%" fill="url(#' +
    fade +
    ')"/></mask></defs>' +
    '<rect width="100%" height="100%" fill="url(#' +
    grid +
    ')" mask="url(#' +
    mask +
    ')"/>' +
    (inference
      ? '<path d="' +
        feedback +
        '" class="dg-feedback ' +
        (returnPath ? 'dg-emphasized' : '') +
        '"/>' +
        movingPacket(feedback, 'reply', '-2s')
      : '') +
    traces +
    components +
    '</svg>'
  );
}

let nextDiagram = 0;

export function renderDiagram(container, lesson, stepIndex) {
  const step = lesson.steps[stepIndex],
    inference = lesson.id === 'ciclo-de-inferencia';
  const scope = 'dg' + ++nextDiagram;
  const scene =
    (inference ? requestScene(step) : null) ??
    vectorScene(lesson, stepIndex) ??
    infrastructureScene(lesson, stepIndex) ??
    teachingScene(lesson, stepIndex) ??
    retrievalScene(lesson, stepIndex) ??
    operationsScene(lesson, stepIndex) ??
    modelScene(lesson, stepIndex) ??
    graphScene(lesson, stepIndex) ??
    (stepIndex < lesson.labStart ? productionScene(lesson.id, stepIndex) : null);
  const title = scene?.title ?? (inference ? 'Topologia de inferência' : 'Fluxo da etapa');
  const description =
    scene?.description ??
    (inference
      ? 'O navegador envia a pergunta ao servidor. O modelo roda na GPU e devolve texto ao navegador.'
      : step.nodes.join(' → ') + '. Em foco: ' + step.nodes[step.active] + '.');
  const picture =
    scene?.picture ??
    ((mobile) =>
      illustrate(layout(mobile), step, inference, stepIndex, mobile, scope + (mobile ? 'm' : 'w')));
  const [flowLabel, returnLabel] = scene?.legend ?? [
    inference ? 'Requisição' : 'Fluxo',
    inference ? 'Resposta' : '',
  ];
  container.innerHTML =
    '<figure class="dg" aria-label="' +
    title +
    '">' +
    '<div class="dg-head"><span class="dg-heading">' +
    icon('topology') +
    title +
    '</span>' +
    '<div class="dg-tools"><button type="button" data-replay aria-label="Repetir animação" title="Repetir animação">' +
    icon('replay') +
    '</button>' +
    '<button type="button" data-pause></button></div></div>' +
    '<div class="dg-stage" role="img" aria-label="' +
    escapeText(description) +
    '">' +
    picture(false) +
    picture(true) +
    '</div>' +
    '<figcaption class="dg-legend"><span><i></i>' +
    flowLabel +
    '</span>' +
    (returnLabel ? '<span class="dg-legend-return"><i></i>' + returnLabel + '</span>' : '') +
    (scene ? '' : '<span class="dg-legend-focus"><i></i>Em foco</span>') +
    '</figcaption></figure>';
  const svgs = container.querySelectorAll('[data-illustration]'),
    button = container.querySelector('[data-pause]');
  let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function applyPlayback() {
    for (const svg of svgs) paused ? svg.pauseAnimations() : svg.unpauseAnimations();
    const text = paused ? 'Reproduzir' : 'Pausar';
    button.innerHTML = icon(paused ? 'play' : 'pause') + '<span>' + text + '</span>';
    button.setAttribute('aria-label', text + ' animação');
    button.title = text + ' animação';
  }
  function togglePause() {
    paused = !paused;
    applyPlayback();
  }
  function replay() {
    for (const svg of svgs) svg.setCurrentTime(0);
    paused = false;
    applyPlayback();
  }
  button.addEventListener('click', togglePause);
  container.querySelector('[data-replay]').addEventListener('click', replay);
  applyPlayback();
  return { togglePause, replay };
}
