<script>
  import data from './production/vector-benchmark.json';
  import HighlightedCode from './HighlightedCode.svelte';
  const families = [...new Set(data.rows.map((r) => r.family))];
  let family = $state('HNSW M=24');
  let rows = $derived(data.rows.filter((r) => r.family === family));
  const fmt = (n, place = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: place });
</script>

<section class="vector-lab">
  <h2>Banco de ensaio de índices vetoriais</h2>
  <p>
    Compare medições de uma execução de Faiss {data.faiss} em CPU {data.cpu}. O gabarito são os dez vizinhos
    da busca L2 exata sobre {fmt(data.vectors)} vetores sintéticos de {data.dim} dimensões. Foram usadas {data.queries}
    consultas independentes, uma thread e o mesmo conjunto de dados em todas as linhas.
  </p>
  <label
    >Família de índice <select bind:value={family}
      >{#each families as name}<option value={name}>{name}</option>{/each}</select
    ></label
  >
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (keyboard users can scroll the table on small screens) -->
  <div class="bench-scroll" tabindex="0" role="region" aria-label="Comparação de índices">
    <table>
      <thead
        ><tr
          ><th>Configuração</th><th>Recall@10</th><th>p95 por consulta</th><th>Índice em disco</th><th
            >Vetores p/ rerank</th
          ></tr
        ></thead
      >
      <tbody
        >{#each rows as r}<tr
            ><th
              >{r.knob ? r.knob + ' = ' + r.value : 'Busca completa'}{#if r.candidates > data.k}<small
                  >rerank top-{r.candidates} → {data.k}</small
                >{/if}</th
            ><td>{fmt(100 * r.recall)}%</td><td>{fmt(r.p95_ms, 4)} ms</td><td
              >{fmt(r.index_bytes / 2 ** 20)} MiB</td
            ><td>{fmt(r.rerank_store_bytes / 2 ** 20)} MiB</td></tr
          >{/each}</tbody
      >
    </table>
  </div>
  <details>
    <summary>Método e reprodução</summary>
    <p>
      A semente {data.seed} gera vetores agrupados, com ruído, e conjuntos separados para treino e consulta. O recall
      é a fração dos dez IDs exatos recuperados, média entre as consultas; ele mede fidelidade ao índice exato,
      não a relevância para o usuário. HNSW usa efConstruction 100. IVF usa 64 células; IVFPQ usa 8 subquantizadores
      de 8 bits. O p95 inclui a busca e, quando presente, o reranking L2 no top-40. O tamanho é o arquivo serializado
      e não inclui memória temporária. Repita no seu corpus com filtros e concorrência reais.
    </p>
    <pre><HighlightedCode source="uv run bench-indexes.py > resultado.json" language="bash" /></pre>
  </details>
  <a class="study-source" href="/labs/bench-indexes.py" download>Baixar o benchmark Python</a>
</section>
