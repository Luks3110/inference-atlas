<script>
  import { comparisonScale } from './decision-scale.js';
  import StageSimulator from './StageSimulator.svelte';
  import HnswPlayground from './HnswPlayground.svelte';
  import { icon } from './icons.js';
  let { decision, model, illustrate, stageId, stepLabel, hnsw, children, readings: baseReadings } = $props();
  let mode = $state('initial');
  let showHnsw = $derived(hnsw && (mode === 'benchmark' || (mode === 'initial' && ['Referência','Ajustar','Filtrar'].includes(stepLabel))));
  let [action, origin, destination, metric, before, after, reason] = $derived(decision);
  let selected = $state(1);
  let scale = $derived(comparisonScale(before, after, metric));
</script>

<section class="step-decision" aria-label="Comparação da decisão">
  <div class="caption">{@html icon('lab', 15)} Simulação da etapa</div>
  <h2>{action}</h2>
  {#if hnsw}
    <nav class="sim-views" aria-label="Escolher simulador">
      <button type="button" aria-pressed={!showHnsw} onclick={() => mode = 'step'}>Decisão da etapa</button>
      <button type="button" aria-pressed={showHnsw} onclick={() => mode = 'benchmark'}>Busca HNSW · efSearch e filtro</button>
    </nav>
  {/if}
  {#if showHnsw}
    <HnswPlayground />
    {@render children()}
  {:else}
    <StageSimulator {model} {illustrate} {stageId} {origin} {destination} {stepLabel}>{@render children()}</StageSimulator>
  {/if}
  <details class="fixed-example">
    <summary>Comparar os valores do exemplo da aula</summary>
    <div class="comparison-pair">

    <figure aria-label={origin + ' → ' + destination + '. ' + metric + '. Referência: ' + before + '. Com a decisão: ' + after}>
    <figcaption>{metric}</figcaption>
    <div class="flow">
      <span class:reference={selected === 0}>{origin}{#if selected === 0}<small>{before}</small>{/if}</span>
      <svg aria-hidden="true" viewBox="0 0 52 18" preserveAspectRatio="none"><path d="M0 9 H48 M39 2 L48 9 L39 16"/></svg>
      <span class:applied={selected === 1}>{destination}{#if selected === 1}<small>{after}</small>{/if}</span>
    </div>
    <div class="readings" role="group" aria-label="Selecionar estado no diagrama">
      {#each [before, after] as value, i}
        <button type="button" class="reading" class:chosen={selected === i} aria-pressed={selected === i} onclick={() => selected = i}>
          <span>{i === 0 ? 'Referência' : 'Com a decisão'}</span>
          {#if scale}
            <span class="rail" aria-hidden="true">
              <i style:left={scale.bars[i].start + '%'} style:width={scale.bars[i].width + '%'}></i>
              {#if scale.zero > 0}<b style:left={scale.zero + '%'}></b>{/if}
            </span>
          {/if}
          <strong>{value}</strong>
        </button>
      {/each}
    </div>
    </figure>
  </div>
    <p class="original-rationale">{reason}</p>
    {@render baseReadings()}
  </details>
</section>

<style>
  .step-decision {container-type:inline-size;scroll-margin-top:calc(var(--header) + 10px);min-width:0;padding:16px clamp(12px,2vw,25px);border-bottom:1px solid var(--line);background:var(--panel)}
  .caption {display:flex;align-items:center;gap:7px;color:var(--accent);font:500 11px var(--mono)}
  h2 {font-size:clamp(17px,1.4vw,22px);line-height:1.25;letter-spacing:-.03em;margin:6px 0 12px;text-wrap:pretty}
  .sim-views {display:flex;gap:3px;flex-wrap:wrap;margin:10px 0;padding:3px;border:1px solid var(--line);border-radius:6px;width:fit-content}
  .sim-views button {padding:6px 9px;border-radius:4px;font-size:12px}
  .sim-views [aria-pressed=true]{background:var(--selection);color:var(--selection-ink);font-weight:600}
  .fixed-example {border-top:1px solid var(--line);margin-top:12px}
  .fixed-example summary {cursor:pointer;padding:10px 0;color:var(--muted);font-size:13px}
  .comparison-pair {display:grid;gap:10px}

  @container (min-width:610px) {

    figure {display:flex;flex-direction:column;justify-content:center}
    .flow {flex-direction:column}
    .flow svg {width:30px;height:12px;transform:rotate(90deg);margin:9px 0}
  }
  figure {margin:0;padding:12px 14px;background:var(--rail);border-radius:8px;border:1px solid var(--line)}
  .flow {display:flex;align-items:center;justify-content:center;gap:6px;margin:0 0 12px;line-height:1.25}
  .flow span {text-align:center;padding:6px 10px;background:var(--panel);border:1px solid var(--line);border-radius:5px;font-weight:570;overflow-wrap:anywhere}
  .flow small {display:block;margin-top:2px;font:500 12px var(--mono)}
  .flow .reference {border-color:var(--subtle)}
  .flow .applied {background:var(--selection);color:var(--selection-ink)}
  .flow svg {width:clamp(24px,7%,50px);height:15px;flex:none;color:var(--subtle)}
  .flow path {fill:none;stroke:currentColor;stroke-width:1.5;vector-effect:non-scaling-stroke}
  .readings {display:grid;gap:4px 10px;grid-template-columns:max-content minmax(0,1fr) auto}
  figcaption {font-weight:570;font-size:13px;margin-bottom:5px}
  .reading {text-align:left;padding:4px 6px;border-radius:4px;display:grid;grid-template-columns:subgrid;grid-column:1/-1;align-items:center;font:11px var(--mono);color:var(--muted)}
  .reading:hover {background:var(--soft)}
  .reading[aria-pressed="true"] {background:var(--panel);box-shadow:inset 2px 0 var(--accent)}
  strong {grid-column:3;min-width:3ch;text-align:right;margin:0 0 0 auto;color:var(--ink);font-weight:550;overflow-wrap:anywhere}
  .rail {grid-column:2;height:7px;border-radius:3px;flex:1;position:relative;background:var(--line)}
  .rail i {position:absolute;height:100%;background:var(--subtle);border-radius:3px}
  .chosen .rail i {background:var(--accent)}
  .rail b {position:absolute;height:11px;top:-2px;border-left:1px solid var(--muted)}
  p {margin:10px 0 0;color:var(--ink);font-size:14px;line-height:1.62;max-width:95ch;text-wrap:pretty}
  @media(max-width:500px){.step-decision{padding:12px}figure{padding:10px}.flow span{font-size:12px}.readings{gap:4px 6px}}
</style>
