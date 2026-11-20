<script>
  import { formatLocale, t } from './i18n.js';
  import data from './production/vector-benchmark.json';
  import HighlightedCode from './HighlightedCode.svelte';
  const families = [...new Set(data.rows.map((r) => r.family))];
  let family = $state('HNSW M=24');
  let rows = $derived(data.rows.filter((r) => r.family === family));
  const fmt = (n, place = 2) => n.toLocaleString(formatLocale(), { maximumFractionDigits: place });
</script>

<section class="vector-lab">
  <h2>{t("Banco de ensaio de índices vetoriais", "Vector index benchmark")}</h2>
  <p>
    {t(`Compare medições de uma execução de Faiss ${data.faiss} em CPU ${data.cpu}. O gabarito são os dez vizinhos da busca L2 exata sobre ${fmt(data.vectors)} vetores sintéticos de ${data.dim} dimensões. Foram usadas ${data.queries} consultas independentes, uma thread e o mesmo conjunto de dados em todas as linhas.`, `Compare measurements from Faiss ${data.faiss} on a ${data.cpu} CPU. The reference is the ten neighbors from exact L2 search over ${fmt(data.vectors)} synthetic vectors with ${data.dim} dimensions. Every row uses the same dataset, ${data.queries} independent queries, and one thread.`)}
  </p>
  <label
    >{t("Família de índice", "Index family")} <select bind:value={family}
      >{#each families as name}<option value={name}>{name}</option>{/each}</select
    ></label
  >
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (keyboard users can scroll the table on small screens) -->
  <div class="bench-scroll" tabindex="0" role="region" aria-label={t("Comparação de índices", "Index comparison")}>
    <table>
      <thead
        ><tr
          ><th>{t("Configuração", "Configuration")}</th><th>Recall@10</th><th>{t("p95 por consulta", "p95 per query")}</th><th>{t("Índice em disco", "Index on disk")}</th><th
            >{t("Vetores p/ rerank", "Vectors for reranking")}</th
          ></tr
        ></thead
      >
      <tbody
        >{#each rows as r}<tr
            ><th
              >{r.knob ? r.knob + ' = ' + r.value : t("Busca completa", "Full search")}{#if r.candidates > data.k}<small
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
    <summary>{t("Método e reprodução", "Method and reproduction")}</summary>
    <p>
      {t(`A semente ${data.seed} gera vetores agrupados, com ruído, e conjuntos separados para treino e consulta. O recall é a fração dos dez IDs exatos recuperados, média entre as consultas; ele mede fidelidade ao índice exato, não a relevância para o usuário. HNSW usa efConstruction 100. IVF usa 64 células; IVFPQ usa 8 subquantizadores de 8 bits. O p95 inclui a busca e, quando presente, o reranking L2 no top-40. O tamanho é o arquivo serializado e não inclui memória temporária. Repita no seu corpus com filtros e concorrência reais.`, `Seed ${data.seed} generates noisy clusters of vectors and separate training and query sets. Recall measures the fraction of the ten exact IDs recovered, averaged across queries. It measures agreement with exact search. User relevance requires a separate evaluation. HNSW uses efConstruction 100. IVF uses 64 cells, and IVFPQ uses eight 8-bit subquantizers. The p95 includes search and, when used, L2 reranking of the top 40. The size is the serialized file size and excludes temporary memory. Repeat the benchmark on your corpus with realistic filters and concurrency.`)}
    </p>
    <pre><HighlightedCode source="uv run bench-indexes.py > resultado.json" language="bash" /></pre>
  </details>
  <a class="study-source" href="/labs/bench-indexes.py" download>{t("Baixar o benchmark Python", "Download the Python benchmark")}</a>
</section>
