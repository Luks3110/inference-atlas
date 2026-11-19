const K = 10;
let fixturePromise;

async function loadFixture() {
  const response = await fetch(new URL('./hnsw-fixture.bin', import.meta.url));
  if (!response.ok) throw new Error('Não foi possível carregar a fixture HNSW.');
  const buffer = await response.arrayBuffer();
  const header = new DataView(buffer);
  if (buffer.byteLength < 40 || header.getUint32(0) !== 0x484e5357 || header.getUint32(4, true) !== 1) {
    throw new Error('Formato da fixture HNSW incompatível.');
  }
  const count = header.getUint32(8, true);
  const dims = header.getUint32(12, true);
  const queryCount = header.getUint32(16, true);
  const m = header.getUint32(20, true);
  const topLevel = header.getUint32(24, true);
  const entry = header.getUint32(28, true);
  const slots = header.getUint32(32, true);
  const expected = 40 + 4 * dims * (count + queryCount) + 4 * (count + 1) + 2 * (slots + count);
  if (!count || !dims || !queryCount || !m || entry >= count || expected !== buffer.byteLength) {
    throw new Error('Dimensões inválidas na fixture HNSW.');
  }

  let offset = 40;
  function take(Type, length) {
    const view = new Type(buffer, offset, length);
    offset += view.byteLength;
    return view;
  }
  const vectors = take(Float32Array, count * dims);
  const queries = take(Float32Array, queryCount * dims);
  const offsets = take(Uint32Array, count + 1);
  const neighbors = take(Int16Array, slots);
  const ranks = take(Uint16Array, count);
  return { count, dims, queryCount, m, topLevel, entry, vectors, queries, offsets, neighbors, ranks };
}

function squaredL2(f, query, node) {
  const base = node * f.dims;
  let total = 0;
  for (let i = 0; i < f.dims; i++) {
    const delta = f.vectors[base + i] - query[i];
    total += delta * delta;
  }
  return total;
}

// The frontier is a min-heap, while the retained candidates form a max-heap.
class Heap {
  constructor(precedes) {
    this.items = [];
    this.precedes = precedes;
  }
  push(id) {
    let pos = this.items.length;
    while (pos > 0) {
      const parent = (pos - 1) >>> 1;
      if (!this.precedes(id, this.items[parent])) break;
      this.items[pos] = this.items[parent];
      pos = parent;
    }
    this.items[pos] = id;
  }
  pop() {
    const first = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
      let pos = 0;
      while (2 * pos + 1 < this.items.length) {
        let child = 2 * pos + 1;
        if (child + 1 < this.items.length && this.precedes(this.items[child + 1], this.items[child])) child++;
        if (!this.precedes(this.items[child], last)) break;
        this.items[pos] = this.items[child];
        pos = child;
      }
      this.items[pos] = last;
    }
    return first;
  }
}

function search(f, query, ef, eligible, parents) {
  const distances = new Float64Array(f.count);
  distances.fill(-1);
  let visited = 0;
  function evaluate(node, from) {
    if (distances[node] >= 0) return;
    distances[node] = squaredL2(f, query, node);
    visited++;
    if (parents) parents.set(node, from);
  }
  function closer(a, b) {
    return distances[a] < distances[b] || (distances[a] === distances[b] && a < b);
  }
  let current = f.entry;
  evaluate(current, -1);
  for (let level = f.topLevel; level > 0; level--) {
    // Faiss reserves 2M slots at level zero and M for each additional level.
    while (true) {
      const base = f.offsets[current] + (level + 1) * f.m;
      let next = current;
      for (let i = base; i < base + f.m; i++) {
        const id = f.neighbors[i];
        if (id < 0) break;
        evaluate(id, current);
        if (closer(id, next)) next = id;
      }
      if (next === current) break;
      current = next;
    }
  }

  const baseVisited = new Uint8Array(f.count);
  const frontier = new Heap(closer);
  const retained = new Heap((a, b) => closer(b, a));
  frontier.push(current);
  retained.push(current);
  baseVisited[current] = 1;
  while (frontier.items.length > 0) {
    const next = frontier.pop();
    if (retained.items.length === ef && closer(retained.items[0], next)) break;
    const base = f.offsets[next];
    for (let i = base; i < base + 2 * f.m; i++) {
      const id = f.neighbors[i];
      if (id < 0) break;
      if (baseVisited[id]) continue;
      baseVisited[id] = 1;
      evaluate(id, next);
      if (retained.items.length < ef || closer(id, retained.items[0])) {
        frontier.push(id);
        retained.push(id);
        if (retained.items.length > ef) retained.pop();
      }
    }
  }
  // Filtering after the global ef cutoff is intentional. Nonmatching nodes took part in traversal.
  const candidates = retained.items.sort((a, b) => distances[a] - distances[b] || a - b);
  const found = candidates.filter(id => f.ranks[id] < eligible).slice(0, K);
  return { found, visited };
}

function exactRankings(f) {
  if (f.exact) return f.exact;
  const rows = [];
  for (let q = 0; q < f.queryCount; q++) {
    const query = f.queries.subarray(q * f.dims, (q + 1) * f.dims);
    const d = Float64Array.from({ length: f.count }, (_, id) => squaredL2(f, query, id));
    const ids = Uint16Array.from({ length: f.count }, (_, id) => id);
    ids.sort((a, b) => d[a] - d[b] || a - b);
    rows.push(ids);
  }
  f.exact = rows;
  return rows;
}

function benchmark(f, ef, selectivity) {
  const eligible = Math.round(f.count * selectivity / 100);
  const reference = exactRankings(f);
  const timings = [];
  let totalReturned = 0;
  let totalVisited = 0;
  let hits = 0;
  let example;
  const queryAt = q => f.queries.subarray(q * f.dims, (q + 1) * f.dims);
  // Warm up with the current search width before collecting per-query wall times.
  for (let i = 0; i < f.queryCount; i++) search(f, queryAt(i), ef, eligible);
  for (let i = 0; i < f.queryCount * 3; i++) {
    const pass = Math.floor(i / f.queryCount);
    const q = (i + pass * 17) % f.queryCount;
    const query = f.queries.subarray(q * f.dims, (q + 1) * f.dims);
    // Run visualization separately so constructing the trace does not skew the latency sample.
    const start = performance.now();
    const { found, visited } = search(f, query, ef, eligible);
    timings.push(performance.now() - start);
    if (pass !== 0) continue;
    const truth = [];
    for (const id of reference[q]) {
      if (f.ranks[id] < eligible) truth.push(id);
      if (truth.length === K) break;
    }
    for (const id of found) if (truth.includes(id)) hits++;
    totalReturned += found.length;
    totalVisited += visited;
    if (q === 0) {
      const parents = new Map();
      search(f, query, ef, eligible, parents);
      const neighborhoods = {};
      for (const node of new Set(parents.values())) {
        if (node < 0) continue;
        // Keep the fixture's slot order. A neighbor keeps its place as ef changes.
        const slots = f.neighbors.subarray(f.offsets[node], f.offsets[node + 1]);
        neighborhoods[node] = [...new Set(slots)].filter(id => id >= 0);
      }
      example = { found, truth, discoveries: [...parents], neighborhoods, entry: f.entry };
    }
  }
  timings.sort((a, b) => a - b);
  return {
    ef, selectivity, recall: 100 * hits / (f.queryCount * Math.min(K, eligible)),
    p95: timings[Math.ceil(0.95 * timings.length) - 1], filled: totalReturned / f.queryCount,
    eligible, vectors: f.count, queries: f.queryCount, visited: totalVisited / f.queryCount, example,
  };
}

self.onmessage = async ({ data }) => {
  const { id, ef, selectivity } = data || {};
  try {
    if (!Number.isInteger(ef) || ef < 10 || ef > 160 ||
        !Number.isFinite(selectivity) || selectivity < 1 || selectivity > 100) {
      throw new Error('Use efSearch inteiro entre 10 e 160 e seletividade entre 1% e 100%.');
    }
    fixturePromise ??= loadFixture().catch(error => { fixturePromise = undefined; throw error; });
    const result = benchmark(await fixturePromise, ef, selectivity);
    self.postMessage({ id, ...result });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
