<script>
  let { stageId, inputs, readings } = $props();
  const fmt = n => n.toLocaleString('pt-BR', {maximumSignificantDigits:4});
  let valid = $derived(inputs[0]);
  let length = $derived(inputs[0] + inputs[1]);
  let step = $derived(2 * inputs[0] / 255);
  let code = $derived(Math.round((Math.min(inputs[0],inputs[1]) + inputs[0]) / step));
  const x = v => 146 + v * 19;
</script>
{#if stageId === 'espacos-de-embeddings-0'}
  <figure aria-label="As duas médias do mesmo lote">
    <figcaption>Quais posições entram na média?</figcaption>
    <div class="sequence">
      {#each Array(length) as _,i}
        <div class:padding={i>=valid}><small>{i<valid?'Token':'PAD'}</small><b>{i<valid?inputs[2]:0}</b></div>
      {/each}
    </div>
    <div class="bus"><span>Soma · {valid*inputs[2]}</span></div>
    <div class="outputs">
      <div><b>Todas as posições</b><span>{valid*inputs[2]} ÷ {length} = <strong>{fmt(readings[0])}</strong></span></div>
      <div><b>Só os tokens válidos</b><span>{valid*inputs[2]} ÷ {valid} = <strong>{fmt(readings[1])}</strong></span></div>
    </div>
  </figure>
{:else if stageId === 'rag-ivf-e-shards-4'}
  {@const [total,lists,allowed] = inputs}
  {@const opened = Math.min(lists,allowed)}
  <figure aria-label="Listas que o roteador lê">
    <figcaption>Para onde vai a consulta?</figcaption>
    <div class="bus"><span>Roteador · abre as {opened} maiores</span></div>
    <div class="shards">
      {#each Array(lists) as _,i}
        <div class:skip={i>=opened}><b>Lista {i+1}</b>
          <svg viewBox="0 0 44 38" aria-hidden="true"><path d="M5 8C5 1 39 1 39 8v21c0 8-34 8-34 0Z"/><ellipse cx="22" cy="8" rx="17" ry="5"/><path d="M5 18c0 7 34 7 34 0"/></svg>
          <span>{fmt(Math.floor(total/lists)+(i<total%lists?1:0))} itens</span><small>{i<opened?'Lida':'Pulada'}</small></div>
      {/each}
    </div>
  </figure>
{:else if stageId === 'evals-tracing-1' || stageId === 'grafo-estado-explicito-1'}
  {@const trace = stageId === 'evals-tracing-1'}
  {@const longest = Math.max(inputs[0],inputs[1])}
  {@const total = trace ? readings[0] : longest}
  {@const scale = 176 / Math.max(1,total)}
  {@const end = 48 + longest*scale}
  <figure aria-label="Dois ramos executados em paralelo">
    <figcaption>Quando o próximo nó pode começar?</figcaption>
    <svg viewBox="0 0 300 106" role="img" aria-label={'Os ramos se encontram aos '+longest+' ms'}>
      <g class="paths">
        <path d="M8 51H20L44 28H48M20 51l24 24h4"/>
        {#each [inputs[0],inputs[1]] as duration,j}
          {@const y=j?75:28}
          {@const finish=48+scale*duration}
          <rect x="48" y={y-6} width={scale*duration} height="12" rx="4"/>
          <path class="wait" d={'M'+finish+' '+y+'H'+end}/>
          <text x="48" y={y-11}>{trace ? (j?'Vetorial':'Lexical') : (j?'Transportadora':'Pedido')} · {fmt(duration)} ms</text>
        {/each}
        <path d={'M'+end+' 28l10 23-10 24M'+(end+10)+' 51H258'}/>
        <circle cx={end+10} cy="51" r="3"/>
      </g>
      <text x="293" y="44" text-anchor="end">{trace?'Token':'Junção'}</text>
      <text x="293" y="66" text-anchor="end">{fmt(total)} ms</text>
    </svg>
    <small>{trace ? 'Depois da junção, somam-se '+inputs[2]+' ms de fila e 40 ms para gerar o primeiro token.' : 'A junção espera as duas respostas. O tracejado mostra quanto o ramo mais curto espera.'}</small>
  </figure>
{:else if stageId === 'rag-quantizacao-vetorial-1'}
  <figure aria-label="Coordenada original e reconstrução SQ8">
    <figcaption>Onde a coordenada cai nos 256 níveis</figcaption>
    <svg viewBox="0 0 292 95" role="img" aria-label={'Coordenada '+fmt(inputs[1])+', código '+code}>
      <line x1="14" x2="277" y1="45" y2="45" stroke="var(--line)" />
      <rect class="rail" x={x(-inputs[0])} y="40" width={38*inputs[0]} height="10" rx="3"/>
      <g class="shift" style:transform={'translateX('+x(inputs[1])+'px)'}>
        <path d="M0 39l-4-8h8Z" fill="var(--accent)"/><text y="23" text-anchor="middle">{fmt(inputs[1])}</text>
      </g>
      <g class="shift" style:transform={'translateX('+x(code*step-inputs[0])+'px)'}>
        <path d="M0 51l-4 8h8Z" fill="var(--selection-ink)"/>
      </g>
      <text x={x(-inputs[0])} y="76" text-anchor="end">−{fmt(inputs[0])}</text>
      <text x={x(inputs[0])} y="76">{fmt(inputs[0])}</text>
    </svg>
    <div class="outputs"><div><b>Código SQ8</b><span>{code.toString(2).padStart(8,'0')}</span></div><div><b>Valor reconstruído</b><span>{fmt(code*step-inputs[0])}</span></div></div>
    <small>O triângulo acima marca a entrada. O de baixo marca o valor que o código consegue representar.</small>
  </figure>
{/if}
<style>
  figure {margin:9px 0;padding:11px;background:var(--rail);border-radius:7px}
  figcaption {font-weight:600;font-size:13px;margin-bottom:10px}
  .sequence {display:flex;gap:4px;flex-wrap:wrap}
  .sequence>div {min-width:31px;display:grid;justify-items:center;border:1px solid var(--subtle);border-radius:3px;background:var(--selection);box-shadow:0 2px var(--subtle);padding:3px}
  .sequence>div.padding {border-style:dashed;background:var(--panel);color:var(--muted);box-shadow:none}
  .sequence small {font:9px var(--mono)} .sequence b {font:500 15px var(--mono)}
  .bus {margin:6px auto 0;text-align:center;font:11px var(--mono);display:grid;justify-items:center}
  .bus::before,.bus::after {content:'';height:9px;border-left:1px solid var(--subtle)}
  .bus span {padding:2px 8px;border:1px solid var(--line);border-radius:10px;background:var(--panel)}
  .outputs {display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .outputs>div {border:1px solid var(--line);border-radius:4px;background:var(--panel);padding:6px;text-align:center;min-width:0}
  .outputs span,.outputs b {display:block}.outputs b {font-size:11px}.outputs span {margin-top:4px;font:12px var(--mono)}.outputs strong {color:var(--accent)}
  svg {display:block;width:100%;max-height:130px} svg text {fill:var(--ink);font:11px var(--mono)}
  .shards {display:flex;flex-wrap:wrap;justify-content:center;gap:7px;border-top:1px solid var(--subtle)}
  .shards div {display:grid;justify-items:center;position:relative;padding-top:9px;font:10px var(--mono);color:var(--selection-ink)}
  .shards div::before {content:'';height:8px;border-left:1px solid currentColor;position:absolute;top:0}
  .shards .skip {color:var(--muted)} .shards .skip::before {border-left-style:dashed}
  .shards svg {width:40px;height:35px;fill:var(--selection);stroke:currentColor}.shards .skip svg {fill:var(--panel)}
  .paths path {fill:none;stroke:var(--subtle)}.paths rect {fill:var(--selection);stroke:var(--selection-ink)}
  .paths .wait {stroke-dasharray:3 3}.paths circle {fill:var(--accent)}
  .rail {fill:var(--selection);stroke:var(--selection-ink)}
  figure>small {font-size:11px;display:block;margin-top:6px;color:var(--muted)}
  @media(prefers-reduced-motion:no-preference){.shift {transition:transform 140ms ease-out}.paths rect {transition:width 140ms ease-out}.rail{transition:x 140ms,width 140ms}}
</style>
