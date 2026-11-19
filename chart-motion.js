// SVG coordinates only. The model continues to receive exact, discrete inputs.
export function heightAt(points, x) {
  if (x <= points[0].x) return points[0].y;
  if (x >= points.at(-1).x) return points.at(-1).y;
  let left = 0;
  let right = points.length - 1;
  while (right - left > 1) {
    const mid = (left + right) >> 1;
    if (points[mid].x <= x) left = mid;
    else right = mid;
  }
  const a = points[left], b = points[right];
  const t = Math.max(0, Math.min(1, (x - a.x) / (b.x - a.x)));
  return a.y + (b.y - a.y) * t;
}

export function interpolatePlot(from, to) {
  // Both sets of bends are needed when the active axis or its sample count changes.
  const lines = to.lines.map((next, index) => {
    const prev = from.lines[index];
    const xs = [...new Set([...prev, ...next].map(p => p.x))].sort((a,b) => a-b);
    const knots = xs.map(x => ({ x, start: heightAt(prev, x), end: heightAt(next, x) }));
    return t => knots.map(({x, start, end}) => ({x, y: start + t * (end - start)}));
  });
  return t => ({
    fraction: from.fraction + t * (to.fraction - from.fraction),
    lines: lines.map(line => line(t)),
  });
}
