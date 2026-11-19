// discoveries contains each distance evaluation once, in order, with its first parent.
export function compareVisits(reference, current) {
  const before = new Map(reference.discoveries);
  const now = new Map(current.discoveries);
  const added = [], shared = [], removed = [];
  for (const id of now.keys()) (before.has(id) ? shared : added).push(id);
  for (const id of before.keys()) if (!now.has(id)) removed.push(id);

  const edges = {added: [], shared: [], removed: []};
  for (const [id, parent] of now) {
    if (parent < 0) continue;
    edges[before.get(id) === parent ? 'shared' : 'added'].push([parent, id]);
  }
  for (const [id, parent] of before) {
    if (parent >= 0 && now.get(id) !== parent) edges.removed.push([parent, id]);
  }
  const parents = [...new Set([...edges.added, ...edges.removed, ...edges.shared].map(([p]) => p))];
  const auto = now.get(added[0]) ?? before.get(removed[0]) ?? edges.added[0]?.[0] ?? edges.removed[0]?.[0]
    ?? before.get(reference.found.find(id => id !== reference.entry)) ?? parents[0];
  return {before, now, added, shared, removed, edges, parents, auto};
}

export function branchFor(id, diff, reference, current) {
  const neighbors = current.neighborhoods[id] ?? reference.neighborhoods[id];
  const sideRows = Math.ceil(neighbors.length / 2);
  const center = { x: 195, y: 22 + 15 * (sideRows - 1) };
  const nodes = neighbors.map((node, i) => {
    const before = diff.before.has(node), now = diff.now.has(node);
    const fromBefore = diff.before.get(node) === id, fromNow = diff.now.get(node) === id;
    return {
      id: node, x: i < sideRows ? 45 : 345, y: 22 + 30 * (i % sideRows),
      state: now ? (before ? 'shared' : 'added') : (before ? 'removed' : 'absent'),
      edge: fromNow ? (fromBefore ? 'shared' : 'added') : (fromBefore ? 'removed' : 'absent'),
    };
  });
  function path(parents) {
    if (!parents.has(id)) return [];
    const route = [];
    let cursor = id;
    while (cursor >= 0) {
      route.push(cursor);
      cursor = parents.get(cursor);
    }
    return route.reverse();
  }
  return { center, nodes, height: 45 + (sideRows - 1) * 30, before: path(diff.before), now: path(diff.now) };
}
