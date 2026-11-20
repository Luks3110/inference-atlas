<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';
  import { compareVisits, branchFor } from './hnsw-comparison.js';
  import benchmark from './production/hnsw-filter.json';

  const fmt = (n, digits = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: digits });
  const defaultEf = 32;
  const defaultSelectivity = 10;
  let ef = $state(defaultEf);
  let selectivity = $state(defaultSelectivity);
  let pinned = $state.raw(null);
  let first = $state.raw(null);
  let selectedBranch = $state(null);
  let minBaselineVersion = 0;
  let base = $derived(pinned ?? first);
  let measured = $state.raw(null);
  let fault = $state('');
  let refSelectivity = $state(defaultSelectivity);
  let referenceRows = $derived(benchmark.rows.filter((row) => row.selectivity === refSelectivity));

  let worker;
  let scheduledFrame;
  let version = $state(0);
  let updating = $derived(!fault && measured?.id !== version);
  let active = null;
  let pending = null;
  let mounted = false;

  function breakWorker(message) {
    cancelAnimationFrame(scheduledFrame);
    worker?.terminate();
    worker = null;
    active = null;
    pending = null;
    measured = null;
    fault = message || 'O navegador não conseguiu executar a busca.';
  }

  function dispatch() {
    if (!mounted || active !== null || !pending) return;
    const request = pending;
    pending = null;
    try {
      if (!worker) {
        const instance = new Worker('/labs/hnsw-worker.js', { type: 'module' });
        worker = instance;
        instance.onerror = () => {
          if (worker === instance) breakWorker('Falha ao carregar ou executar o worker HNSW.');
        };
        instance.onmessageerror = () => {
          if (worker === instance) breakWorker('O resultado da busca chegou ilegível.');
        };
        instance.onmessage = ({ data }) => {
          if (!mounted || worker !== instance || data?.id !== active) return;
          active = null;
          if (data.error && data.id === version) {
            breakWorker(String(data.error));
            return;
          }
          if (!data.error && data.id >= minBaselineVersion) {
            measured = data;
            if (!first || first.id < minBaselineVersion) first = data;
          }
          dispatch();
        };
      }
      active = request.id;
      worker.postMessage(request);
    } catch {
      breakWorker('Não foi possível iniciar a busca HNSW neste navegador.');
    }
  }

  function schedule() {
    const request = { id: ++version, ef, selectivity };
    try { sessionStorage.setItem('atlas:hnsw-search', JSON.stringify([ef, selectivity])); } catch {}
    cancelAnimationFrame(scheduledFrame);
    // One search in flight and one replaceable request throughout a drag.
    pending = request;
    fault = '';
    scheduledFrame = requestAnimationFrame(dispatch);
  }

  function reset() {
    ef = defaultEf;
    selectivity = defaultSelectivity;
    pinned = null;
    selectedBranch = null;
    minBaselineVersion = version + 1;
    schedule();
  }

  onMount(() => {
    try {
      const [savedEf, savedSelectivity] = JSON.parse(sessionStorage.getItem('atlas:hnsw-search'));
      if (Number.isInteger(savedEf) && savedEf >= 10 && savedEf <= 160 && Number.isInteger(savedSelectivity) && savedSelectivity >= 1 && savedSelectivity <= 100) {
        ef = savedEf; selectivity = savedSelectivity;
      }
    } catch {}
    mounted = true;
    schedule();
    return () => {
      mounted = false;
      cancelAnimationFrame(scheduledFrame);
      worker?.terminate();
      worker = null;
      pending = null;
      active = null;
    };
  });

  const states = {
    added: { label: 'Só nesta busca', mark: '+' },
    removed: { label: 'Só na referência', mark: '−' },
    shared: { label: 'Nas duas buscas', mark: '=' },
    absent: { label: 'Sem visita', mark: '·' },
  };
  const comparedStates = ['added', 'removed', 'shared'];
  let diff = $derived(base && measured ? compareVisits(base.example, measured.example) : null);
  let branchId = $derived(diff?.parents.includes(selectedBranch) ? selectedBranch : diff?.auto);
  let branch = $derived(diff && branchId != null ? branchFor(branchId, diff, base.example, measured.example) : null);

  function tiles(ids) {
    return ids.map(id => 'M' + (id % 96 * 6 + 1) + ' ' + (Math.floor(id / 96) * 5 + 1) + 'h4v3h-4Z').join('');
  }
  function route(ids) { return ids.map(id => '#' + id).join(' → '); }
</script>

<section class="hnsw-play" aria-label="Laboratório HNSW">
  <header>
    <h3>Explore a busca HNSW</h3>
    <p>Arraste <code>efSearch</code> para mudar quantos candidatos a busca guarda. O índice percorre o grafo primeiro, aplica o filtro e devolve até dez vizinhos. Mexa só no filtro para ver quais resultados passam pelo corte.</p>
  </header>

  <div class="controls">
    <label>
      <span>Largura de busca <strong>efSearch = {ef}</strong></span>
      <input type="range" min="10" max="160" step="1" value={ef} aria-label="efSearch"
        oninput={(event) => { ef = Number(event.currentTarget.value); schedule(); }} />
      <small><span>10 candidatos</span><span>160</span></small>
    </label>
    <label>
      <span>Seletividade <strong>{selectivity}%</strong></span>
      <input type="range" min="1" max="100" step="1" value={selectivity} aria-label="Seletividade do filtro"
        aria-valuetext={selectivity + '% dos vetores elegíveis'}
        oninput={(event) => { selectivity = Number(event.currentTarget.value); schedule(); }} />
      <small><span>1% dos vetores</span><span>100%</span></small>
    </label>
    <button data-sim-reset type="button" onclick={reset}>Restaurar valores</button>
  </div>

  <div class="outcome" aria-live="polite" aria-busy={updating}>
    {#if fault}
      <span>{fault}</span> <button type="button" onclick={() => schedule()}>Tentar novamente</button>
    {:else if !measured}
      <span>Executando as buscas no navegador…</span>
    {:else}
      <span>{updating ? 'Atualizando' : 'Concluído'} · efSearch {measured.ef} · filtro {measured.selectivity}% · {fmt(measured.queries)} consultas · {fmt(measured.eligible)} de {fmt(measured.vectors)} vetores elegíveis</span>
    {/if}
  </div>

  <div class="pin">
    <button type="button" disabled={!measured || updating} onclick={() => { pinned = measured; selectedBranch = null; }}>Fixar medição para comparar</button>
    {#if base}
      <span>{pinned ? 'Referência fixada' : 'Referência inicial'} · efSearch {base.ef}, filtro {base.selectivity}%</span>
      {#if measured}<span>Variação de recall {fmt(measured.recall - base.recall, 2)} p.p. · p95 {fmt(measured.p95 - base.p95, 3)} ms · visitados {fmt(measured.visited - base.visited, 1)} IDs/consulta</span>{/if}
    {/if}
  </div>


  {#if measured && diff && branch}
    {@const ex = measured.example}
    <figure class="visit-diff" aria-label="Comparação de visitas da consulta 1">
      <figcaption><strong>Quais vetores a consulta 1 visitou?</strong>
        <span>A busca calculou a distância até {fmt(diff.now.size)} vetores. Com efSearch {base.ef} e filtro de {base.selectivity}%, visitou {fmt(diff.before.size)}.</span>
      </figcaption>
      <div class="legend">
        {#each comparedStates as state}
          <span class={state} data-diff={state}>{states[state].mark} {fmt(diff[state].length)} · {states[state].label}</span>
        {/each}
      </div>
      <label class="branch-picker">Vizinhos do nó
        <select value={diff.parents.includes(selectedBranch) ? selectedBranch : ''} onchange={e => selectedBranch = e.currentTarget.value === '' ? null : Number(e.currentTarget.value)}>
          <option value="">Automático · #{diff.auto}</option>
          {#each diff.parents as id}<option value={id}>#{id}</option>{/each}
        </select>
      </label>
      <div class="graph-scroll">
        <svg viewBox={'0 0 390 ' + branch.height} role="img" class="branch-map" aria-label={'Percurso HNSW pelos vizinhos do vetor ' + branchId}>
          {#key branchId}
            <g transition:fade={{ duration: prefersReducedMotion.current ? 0 : 120 }}>
              {#each branch.nodes as node (node.id)}
                <line class={node.edge} x1={branch.center.x} y1={branch.center.y} x2={node.x} y2={node.y}>
                  <title>#{branchId} → #{node.id} · {node.edge === 'absent' ? 'Sem primeira visita por esta ligação' : states[node.edge].label}</title>
                </line>
              {/each}
              {#each branch.nodes as node (node.id)}
                <g class={node.state} data-node={node.id} transform={'translate(' + node.x + ' ' + node.y + ')'}>
                  <title>Vetor {node.id} · {states[node.state].label}</title>
                  <rect x="-36" y="-10" width="72" height="20" rx="7"/>
                  <text text-anchor="middle" dominant-baseline="central">{states[node.state].mark} #{node.id}</text>
                </g>
              {/each}
              <g class="pivot" transform={'translate(' + branch.center.x + ' ' + branch.center.y + ')'}>
                <rect x="-32" y="-12" width="64" height="24" rx="5"/>
                <text text-anchor="middle" dominant-baseline="central">#{branchId}</text>
              </g>
            </g>
          {/key}
        </svg>
      </div>
      <p class="fine">Cada linha liga dois vizinhos do índice. A linha contínua marca a primeira visita pelo nó central. Verde indica uma ligação usada só nesta busca, laranja só na referência e cinza nas duas. A pontilhada marca os outros vizinhos.</p>
      {#if branch.now.length}<p class="route"><b>Da entrada até #{branchId}</b> {route(branch.now)}</p>{/if}
      {#if branch.before.length && route(branch.before) !== route(branch.now)}<p class="route"><b>Caminho na referência</b> {route(branch.before)}</p>{/if}
      <svg class="visit-map" viewBox={'0 0 576 ' + Math.ceil(measured.vectors / 96) * 5} role="img" aria-label="Mapa de visitas da consulta 1 por ID">
        <defs><pattern id="hnsw-slots" width="6" height="5" patternUnits="userSpaceOnUse"><rect x="1" y="1" width="4" height="3"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#hnsw-slots)"/>
        {#each ['shared', 'removed', 'added'] as state}
          <path class={state} d={tiles(diff[state])}/>
        {/each}
      </svg>
      <p class="fine">Cada quadrado ocupa o lugar de um ID. A primeira linha vai do 0 ao 95. Um quadrado claro indica que as duas buscas pularam aquele vetor.</p>

      <details class="all-visits">
        <summary>Ver todos os IDs e as ligações de primeira visita</summary>
        {#each comparedStates as state}
          <div><h4>{states[state].label}</h4><p><b>{fmt(diff[state].length)} IDs</b> · {diff[state].join(', ') || 'Nenhum'}</p>
          <p><b>{fmt(diff.edges[state].length)} ligações</b> · {diff.edges[state].map(([from,to]) => '#' + from + ' → #' + to).join(', ') || 'Nenhuma'}</p></div>
        {/each}
      </details>
      <div class="id-line"><b>Retornados</b>
        <div class="chips">{#each ex.found as id}<span class:matched={ex.truth.includes(id)} class:other={!ex.truth.includes(id)}>{id}</span>{:else}<em>Nenhum ID passou pelo pós-filtro.</em>{/each}</div>
      </div>
      <div class="id-line"><b>Gabarito exato</b>
        <div class="chips">{#each ex.truth as id}<span class:matched={ex.found.includes(id)}>{id}</span>{/each}</div>
      </div>
    </figure>
  {:else if !fault}
    <div class="graph-placeholder" aria-hidden="true"></div>
  {/if}

  <dl class="metrics" aria-label="Resultados medidos">
    <div><dt>Recall@10</dt><dd>{measured ? fmt(measured.recall, 1) + '%' : '—'}</dd></div>
    <div><dt>Latência p95</dt><dd>{measured ? fmt(measured.p95, 3) + ' ms' : '—'}</dd></div>
    <div><dt>Preenchimento médio</dt><dd>{measured ? fmt(measured.filled, 1) + ' / 10' : '—'}</dd></div>
    <div><dt>IDs visitados por consulta</dt><dd>{measured ? fmt(measured.visited, 1) + ' IDs' : '—'}</dd></div>
  </dl>
  <p class="fine">O navegador executa 48 consultas três vezes após o aquecimento. O p95 inclui a busca, a ordenação e o filtro. Cada ID conta uma vez por consulta, mesmo quando o índice encontra o mesmo vetor em duas camadas.</p>

  <details>
    <summary>Referência em CPU · filtro durante a busca com Faiss</summary>
    <p>O Faiss {benchmark.faiss} filtra os IDs durante a busca. Este ensaio usou outro conjunto de {fmt(benchmark.vectors)} vetores de {benchmark.dims} dimensões e {benchmark.queries} consultas em CPU {benchmark.cpu}, com {benchmark.threads} thread.</p>
    <label class="ref-select">Seletividade no Faiss
      <select bind:value={refSelectivity}>{#each benchmark.selectivity as pct}<option value={pct}>{fmt(pct)}%</option>{/each}</select>
    </label>
    <div class="ref-table">
      <table>
        <caption>{benchmark.rows.length} configurações medidas · {fmt(refSelectivity)}% elegíveis nesta seleção</caption>
        <thead><tr><th scope="col">efSearch</th><th scope="col">Recall@10</th><th scope="col">p95</th><th scope="col">IDs/consulta</th></tr></thead>
        <tbody>
          {#each referenceRows as row}
            <tr><th scope="row">{row.ef}</th><td>{fmt(row.recall)}%</td><td>{fmt(row.p95, 4)} ms</td><td>{fmt(row.filled, 2)}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
    <a href="/labs/bench-hnsw-filter.py" download>Baixar benchmark Faiss (.py)</a>
  </details>
  <a href="/labs/build-hnsw-fixture.py" download>Baixar gerador do grafo do navegador (.py)</a>
</section>

<style>
  .pin {display:flex;align-items:center;flex-wrap:wrap;gap:6px 12px;font-size:12px;color:var(--muted)}
  .pin button {border:1px solid var(--line);border-radius:4px;padding:5px 8px;color:var(--ink);background:var(--rail)}
  .hnsw-play { display: grid; gap: 14px; min-width: 0; padding: clamp(12px, 2vw, 22px); color: var(--ink); background: var(--panel); border: 1px solid var(--line); border-radius: 12px; }
  h3, p, figure, dl, dd { margin: 0; }
  h3 { font-size: 1.2rem; letter-spacing: -.025em; }
  p, figcaption span { color: var(--muted); line-height: 1.55; }
  header p { margin-top: 5px; }
  .controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)) auto; align-items: center; gap: 14px; }
  label { min-width: 0; color: var(--ink); }
  label > span, label small { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  label strong, dd, code, .legend, .chips span { font-family: var(--mono); }
  label strong { color: var(--accent); font-size: .8rem; }
  label small, .fine, .outcome, figcaption span, caption { color: var(--muted); font-size: .78rem; }
  input[type=range] { display: block; width: 100%; accent-color: var(--accent); margin: 8px 0 4px; cursor: pointer; }
  button, select { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; color: var(--ink); padding: 6px 9px; }
  button { font-size: .8rem; }
  button:focus-visible, select:focus-visible, input:focus-visible, a:focus-visible, summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .outcome { min-height: 1.5em; }
  .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 115px), 1fr)); gap: 7px; }
  .metrics div { padding: 9px 10px; background: var(--rail); border-radius: 8px; }
  dt { color: var(--muted); font-size: .75rem; }
  dd { font-size: 1rem; font-weight: 600; white-space: nowrap; }
  .graph-placeholder { min-height: 290px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); }
  figure { display: grid; gap: 9px; }
  figcaption { display: grid; gap: 2px; }
  .graph-scroll { overflow-x: auto; border: 1px solid var(--line); background: var(--bg); border-radius: 8px; }
  .branch-map { width: 100%; display: block; max-height: 450px; }
  .branch-map text { fill: var(--ink); font: 13px var(--mono); }
  .branch-map rect { fill: var(--panel); stroke: var(--subtle); }
  .branch-map line { stroke: var(--subtle); stroke-width: 1.4; }
  .branch-map line.absent { stroke-dasharray: 2 4; opacity: .65; }
  .branch-map line.added { stroke: var(--selection-ink); stroke-width: 2.7; }
  .branch-map line.removed { stroke: var(--accent); stroke-width: 2.7; }
  .branch-map .added rect { fill: var(--selection); stroke: var(--selection-ink); }
  .branch-map .removed rect { fill: var(--accent-soft); stroke: var(--accent); }
  .branch-map .absent text { fill: var(--muted); }
  .branch-map .pivot rect { fill: var(--ink); }
  .branch-map .pivot text { fill: var(--panel); }
  .branch-picker { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-weight: 620; margin-top: 5px; }
  .visit-map { width: 100%; max-height: 150px; background: var(--panel); }
  .visit-map pattern rect { fill: var(--line); }
  .visit-map .shared { fill: var(--subtle); }
  .visit-map .added { fill: var(--selection-ink); }
  .visit-map .removed { fill: var(--accent); }
  .legend .added, .chips .matched { color: var(--selection-ink); background: var(--selection); }
  .legend .removed, .chips .other { color: var(--accent); background: var(--accent-soft); }
  .route, .all-visits p { font: 12px/1.65 var(--mono); overflow-wrap: anywhere; }
  .all-visits > div { max-height: 10em; overflow: auto; padding: 4px 8px; margin: 8px 0; border-inline-start: 2px solid var(--line); }
  .all-visits h4 { margin: 0; }
  .legend, .chips { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
  .legend span, .chips span { padding: 2px 6px; border: 1px solid var(--line); border-radius: 5px; font-size: .7rem; }
  .id-line { display: flex; align-items: baseline; flex-wrap: wrap; gap: 7px; }
  .id-line b { font-size: .79rem; }
  .chips em { color: var(--muted); font-size: .8rem; }
  details { border-top: 1px solid var(--line); padding-top: 12px; }
  summary { cursor: pointer; font-weight: 650; }
  details p { margin: 8px 0; }
  .ref-select { display: flex; align-items: center; gap: 8px; }
  .ref-table { overflow-x: auto; margin: 8px 0; }
  table { border-collapse: collapse; width: 100%; font: .78rem var(--mono); }
  caption { padding: 6px 0; text-align: left; }
  th, td { padding: 6px; text-align: right; border-bottom: 1px solid var(--line); white-space: nowrap; }
  th:first-child { text-align: left; }
  a { width: fit-content; color: var(--accent); text-decoration: underline; text-underline-offset: 2px; font-size: .82rem; }
  @media (max-width: 680px) { .controls { grid-template-columns: 1fr; } button { justify-self: start; } }
</style>
