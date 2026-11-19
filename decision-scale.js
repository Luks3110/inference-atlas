// Unit labels come from the authored comparison, including singular and plural Portuguese names.
const plurals = { pares: 'par', edições: 'edição', versões: 'versão', condições: 'condição',
  posições: 'posição', revisões: 'revisão', marcadores: 'marcador' };

function reading(label) {
  const value = label.trim().replace(/^≈\s*/, '').replaceAll('−', '-');
  const match = /^(R\$\s*)?([+-]?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?)(?:\s*([\p{L}%×º][\p{L} ./×º%-]*)?)$/u.exec(value);
  if (!match) return null;
  let unit = match[1] ? 'R$' : (match[3] || '');
  let magnitude = Number(match[2].replaceAll('.', '').replace(',', '.'));
  if (unit === 'KiB' || unit === 'MiB' || unit === 'GiB') {
    magnitude *= { KiB: 1024, MiB: 1024 ** 2, GiB: 1024 ** 3 }[unit];
    unit = 'bytes';
  } else {
    unit = Object.hasOwn(plurals, unit) ? plurals[unit] : unit.replace(/^(IDs|blocos|tokens|réplicas|pedidos|chamadas|eventos|leituras|campos|slots|formas|regras|unidades|etapas|chaves|casos|votos)$/u,
      (plural) => plural.slice(0, -1));
  }
  return { value: magnitude, unit };
}

export function comparisonScale(before, after, metric = '') {
  const fraction = (label) => /^(\d+)\s*(?:de|em|\/)\s*(\d+)(\s+\p{L}+)?$/u.exec(label.trim());
  const left = fraction(before);
  const right = fraction(after);
  if (left && right && left[2] === right[2] && left[3] === right[3]) {
    const total = Number(left[2]);
    if (total > 0 && Number(left[1]) <= total && Number(right[1]) <= total) {
      return { zero: 0, bars: [left, right].map((item) => ({ start: 0, width: 100 * Number(item[1]) / total })) };
    }
  }
  const a = reading(before);
  const b = reading(after);
  if (!a || !b || a.unit !== b.unit) return null;
  const low = Math.min(0, a.value, b.value);
  const percent = a.unit === '%' || (a.unit === '' && metric.includes('(%)'));
  const high = Math.max(percent && low === 0 ? 100 : 0, a.value, b.value);
  const point = (value) => high === low ? 0 : 100 * (value - low) / (high - low);
  const zero = point(0);
  return {
    zero,
    bars: [a, b].map(({ value }) => ({ start: Math.min(zero, point(value)), width: Math.abs(point(value) - zero) })),
  };
}
