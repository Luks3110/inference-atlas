function text(x, y, value, kind = 'label', anchor = 'middle') {
  const safe = String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;');
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="ds-text ds-${kind}">${safe}</text>`;
}
function box(x, y, w, h, state = 'idle') {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" class="ds-box ds-${state}"/>`;
}
function line(x1, y1, x2, y2, active = true) {
  const d = `M${x1} ${y1} L${x2} ${y2}`;
  return (
    `<path d="${d}" class="ds-wire ds-wire-${active ? 'work' : 'idle'}"/>` +
    (active
      ? `<circle r="2.5" class="ds-dot-work"><animateMotion path="${d}" dur="2s" repeatCount="indefinite"/></circle>`
      : '')
  );
}
function caption(w, title, detail) {
  return text(w / 2, 23, title, 'caption') + text(w / 2, 44, detail, 'small');
}
function bar(w, y, name, val, max, unit, state = 'work') {
  const left = 20,
    len = w - 40;
  return (
    text(left, y, name, 'small', 'start') +
    text(w - left, y, val + ' ' + unit, 'small', 'end') +
    box(left, y + 7, len, 11, 'empty') +
    box(left, y + 7, Math.max(1, (len * val) / max), 11, state)
  );
}
function queue(w, i) {
  const frames = [
      [1000, 1200, 'Linha de base · gerador em taxa aberta'],
      [1000, 900, 'Falha · a fila ganha 100 pedidos/s sem retries'],
      [1000, 900, 'Contenção · limite de 180 itens na fila'],
      [1000, 1200, 'Retomada · até 200 pedidos/s para drenar'],
    ],
    [incoming, service, note] = frames[i - 4];
  return (
    caption(w, 'Capacidade e chegada na dependência', 'Cenário didático com limite de tentativas') +
    bar(w, 80, 'Tráfego original', incoming, 1200, '/s', 'done') +
    bar(w, 130, 'Capacidade de conclusão', service, 1200, '/s') +
    text(w / 2, 192, note, 'small')
  );
}
function tenancy(w, i) {
  if (i === 0 || i === 7)
    return (
      caption(w, 'Acesso a documentos homônimos', 'A permissão é avaliada dentro de cada tenant') +
      box(15, 75, w / 2 - 23, 68, 'work') +
      box(w / 2 + 8, 75, w / 2 - 23, 68, 'done') +
      text(w * 0.25, 99, 'Tenant A') +
      text(w * 0.75, 99, 'Tenant B') +
      text(w * 0.25, 127, i ? 'Acesso revogado' : 'Cache A', 'small') +
      text(w * 0.75, 127, i ? 'Acesso mantido' : 'Cache B', 'small') +
      text(w / 2, 189, 'ID do documento + tenant + revisão da permissão', 'small')
    );
  if (i < 4)
    return (
      caption(w, 'Admissão com reserva e empréstimo', 'Pedidos de tamanhos distintos competem pelo prefill') +
      bar(w, 86, 'Tokens no prompt curto', 256, 4096, 'tokens', 'done') +
      bar(w, 142, 'Tokens no prompt longo', 4096, 4096, 'tokens')
    );
  const a = [40960, 35840, 19200][i - 4],
    b = [2560, 2560, 19200][i - 4];
  return (
    caption(
      w,
      'Consumo de prefill por tenant',
      i === 4 ? 'Demanda oferecida antes da contenção' : 'Taxa que a política admite',
    ) +
    bar(w, 85, 'Tenant A', a, 40960, 'tok/s') +
    bar(w, 142, 'Tenant B', b, 40960, 'tok/s', 'done')
  );
}
function cost(w, i) {
  const items = [
    ['Modelo A', 90, 'Piso de lançamento', 89],
    ['Cascata', 88, 'Piso de lançamento', 89],
    ['Cascata', 88, 'Piso de lançamento', 89],
    ['Simples', 95, 'Cobrança', 60],
    ['Simples', 95, 'Cobrança na rota forte', 90],
    ['Cobrança observada', 90, 'Piso da coorte', 85],
  ];
  if (i < 6) {
    const [a, x, b, y] = items[i];
    return (
      caption(w, 'Resolução por coorte', 'Fração de tarefas aprovadas na avaliação') +
      bar(w, 84, a, x, 100, '%', 'done') +
      bar(w, 140, b, y, 100, '%')
    );
  }
  if (i === 6)
    return (
      caption(w, 'Contingência da rota forte', 'A carga oferecida pode superar a capacidade contratada') +
      bar(w, 78, 'Demanda após falha', 500, 500, '/s') +
      bar(w, 133, 'Capacidade contratada', 100, 500, '/s', 'done') +
      text(w / 2, 195, 'Até 400 tarefas/s precisam de outra política.', 'small')
    );
  return (
    caption(w, 'Custo da coorte · 9.450 resoluções', 'Reconciliação com as tentativas adicionais') +
    bar(w, 83, 'Gasto inicial', 130, 140, 'R$', 'done') +
    bar(w, 143, 'Gasto após reconciliação', 140, 140, 'R$')
  );
}
function mcp(w, i) {
  const rows = [
    ['initialize →', 'versão + capacidades', '← initialize result'],
    ['tools/list →', 'página + nextCursor', '← 10 ferramentas'],
    ['tools/call →', 'autorizar + executar', '← recibo'],
    ['resposta perdida', 'consultar operação', '← status durável'],
    ['list_changed', 'relistar catálogo', '← 9 ferramentas'],
    ['sessão sem escopo', 'recusar escrita', '← zero commits'],
    ['novo ID JSON-RPC', 'mesma chave P7', '← pedido original'],
    ['fila de pendências', 'consulta de status', '← recibo confirmado'],
  ][i];
  let s = caption(w, 'Host MCP ↔ servidor de pedidos', 'Fluxo de integração do exemplo');
  const left = w * 0.2,
    right = w * 0.8;
  s +=
    text(left, 73, 'Host') +
    text(right, 73, 'Servidor') +
    line(left, 87, left, 201, false) +
    line(right, 87, right, 201, false);
  s +=
    line(left, 98, right, 98) +
    text(w / 2, 91, rows[0], 'small') +
    text(w / 2, 136, rows[1], 'small') +
    line(right, 166, left, 166) +
    text(w / 2, 158, rows[2], 'small');
  return s;
}
function fleet(w, i) {
  const after = i >= 6,
    units = after ? 20 : 14,
    failing = i === 3 || i === 5 || i === 7;
  let s = caption(
    w,
    after ? 'Frota redimensionada' : 'Frota do cenário de partida',
    'Um grupo de réplicas por zona de disponibilidade',
  );
  const width = (w - 40) / 3;
  for (let z = 0; z < 3; z++) {
    const x = 12 + z * (width + 8),
      down = failing && z === 2;
    s += box(x, 72, width, 104, down ? 'empty' : 'done') + text(x + width / 2, 94, 'Zona ' + (z + 1));
    s +=
      text(x + width / 2, 128, down ? '0' : units) +
      text(x + width / 2, 153, down ? 'indisponível' : 'réplicas', 'small');
  }
  s += text(
    w / 2,
    204,
    i === 4
      ? '555,56/s × 3,6 s ≈ 2.000 conexões'
      : failing
        ? 'Duas zonas absorvem o tráfego regional.'
        : 'Reserva calculada para perder uma zona.',
    'small',
  );
  return s;
}
const drawings = {
  'deadlines-e-retries': ['Saturação e recuperação', queue],
  'tenancy-e-admissao': ['Partilha e isolamento', tenancy],
  'custo-por-resolucao': ['Qualidade e custo', cost],
  'mcp-em-producao': ['Troca de mensagens MCP', mcp],
  'capacidade-milhoes': ['Distribuição por zona', fleet],
};
export function operationsScene(lesson, i) {
  const spec = drawings[lesson.id];
  if (!spec || (lesson.id === 'deadlines-e-retries' && i < 4)) return null;
  return {
    title: spec[0],
    description: lesson.steps[i].change,
    legend: ['Em foco', 'Referência'],
    picture(mobile) {
      const w = mobile ? 350 : 610;
      return `<svg data-illustration aria-hidden="true" class="dg-map ds-map ${mobile ? 'dg-mobile' : 'dg-wide'}" viewBox="0 0 ${w} 226">${spec[1](w, i)}</svg>`;
    },
  };
}
