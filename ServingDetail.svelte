<script module>
  const addressStage = 'kv-cache-1';
  const gateStage = 'mistura-de-especialistas-1';
  const combineStage = 'mistura-de-especialistas-3';
  const fanoutStage = 'paralelismo-de-especialistas-0';

  export function hasServingDetail(stageId) {
    return [addressStage, gateStage, combineStage, fanoutStage].includes(stageId);
  }

  const fmt = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
  const physicalY = page => 52 + page * 29;
  const expertY = index => 55 + 50 * index;
  const fanoutY = index => 49 + index * 23;
  const connection = (x1, y1, x2, y2) => {
    const mid = (x1 + x2) / 2;
    return 'M' + x1 + ' ' + y1 + ' C' + mid + ' ' + y1 + ' ' + mid + ' ' + y2 + ' ' + x2 + ' ' + y2;
  };
</script>

<script>
  let { stageId, inputs, readings } = $props();
</script>

{#if stageId === addressStage}
  {@const [position, secondPage] = inputs}
  {@const logicalPage = Math.floor(position / 4)}
  {@const physicalPage = logicalPage === 0 ? 4 : secondPage}
  {@const offset = position % 4}
  <figure>
    <figcaption>Onde a GPU lê a posição {position}?</figcaption>
    <svg viewBox="0 0 396 197" role="img" aria-label={'A página lógica L' + logicalPage + ' aponta para P' + physicalPage + '. A GPU lê o slot ' + offset + ', endereço ' + readings[1] + '.'}>
      <text class="heading" x="13" y="23">Página lógica</text>
      <text class="heading" x="184" y="23">Página física</text>
      <text class="heading" x="279" y="23">Endereços</text>
      {#each [0,1] as logical}
        {@const sourceY = logical ? 139 : 79}
        {#each (logical ? [0,1,2,3] : [4]) as dest}
          {@const mapped = dest === (logical ? secondPage : 4)}
          <path class="wire" class:unmapped={!mapped} class:live={mapped && logical === logicalPage} d={connection(115,sourceY,182,physicalY(dest))}/>
        {/each}
        <rect class="box" class:chosen={logical === logicalPage} x="12" y={sourceY-17} width="103" height="34" rx="6"/>
        <text class="mono" x="63" y={sourceY+4} text-anchor="middle">{logical ? 'L1 · 4 a 7' : 'L0 · 0 a 3'}</text>
      {/each}
      {#each [0,1,2,3,4] as page}
        {@const y = physicalY(page)}
        <rect class="box" class:chosen={page === physicalPage} x="183" y={y-11} width="39" height="22" rx="4"/>
        <text class="mono" x="202" y={y+4} text-anchor="middle">P{page}</text>
        {#each [0,1,2,3] as slot}
          {@const selected = page === physicalPage && slot === offset}
          <rect class="slot" class:chosen={selected} x={235+38*slot} y={y-11} width="35" height="22" rx="3"/>
          <text class="mono" x={252+38*slot} y={y+4} text-anchor="middle">{4 * page + slot}</text>
        {/each}
      {/each}
    </svg>
    <p>L{logicalPage} aponta para P{physicalPage}. O slot {offset} fica no endereço <strong>{readings[1]}</strong>.
      {#if logicalPage === 1}Somar a posição à base de P4 daria {readings[0]}.{/if}</p>
  </figure>
{:else if stageId === gateStage}
  {@const [second, third, delta] = inputs}
  {@const chosen = readings[1] ? 3 : 2}
  <figure>
    <figcaption>Quais experts recebem este token?</figcaption>
    <svg viewBox="0 0 396 187" role="img" aria-label={'O roteador envia o token para E1 e E' + chosen + '. E2 tem score ' + fmt(second) + ' e E3 tem ' + fmt(third + delta) + '.'}>
      <text class="heading" x="17" y="25">Entrada</text>
      <text class="heading" x="117" y="25">Roteador</text>
      <text class="heading" x="271" y="25">Destinos</text>
      <path class="wire live" d="M81 105 H116"/>
      {#each [1,2,3] as id}
        {@const y = expertY(id-1)}
        {@const selected = id === 1 || id === chosen}
        <path class="wire" class:live={selected} class:unused={!selected} d={connection(190,105,269,y)}/>
        <rect class="box" class:chosen={selected} x="269" y={y-15} width="114" height="30" rx="6"/>
        <text class="mono" x="326" y={y+4} text-anchor="middle">E{id} · {id === 1 ? 'fixo' : fmt(id === 2 ? second : third + delta)}</text>
      {/each}
      <path class="token" d="M22 91H72L82 105L72 119H22Q16 119 16 113V97Q16 91 22 91Z"/>
      <text class="mono" x="48" y="109" text-anchor="middle">token</text>
      <path class="gate" d="M116 105L153 78L190 105L153 132Z"/>
      <text class="mono" x="153" y="109" text-anchor="middle">top-2</text>
    </svg>
    <p>E1 tem a primeira vaga. A segunda vai para <strong>E{chosen}</strong>.
      {#if Math.round((third + delta) * 100) === Math.round(second * 100)}No empate, o roteador mantém E2.{:else}O score de E3 vai de {fmt(third)} para {fmt(third + delta)}.{/if}</p>
  </figure>
{:else if stageId === combineStage}
  {@const [weight,b] = inputs}
  {@const [total,first,second] = readings}
  <figure>
    <figcaption>Quanto cada ramo devolve ao token?</figcaption>
    <svg viewBox="0 0 396 150" role="img" aria-label={'A envia ' + fmt(first) + ' e B envia ' + fmt(second) + '. A soma é ' + fmt(total) + '.'}>
      <text class="heading" x="12" y="22">Saída do expert</text>
      <text class="heading" x="157" y="22">Peso no combine</text>
      <path class="combine-wire" style:stroke-width={1 + 6 * weight / 100} class:unused={weight === 0} d={connection(102,58,273,84)}/>
      <path class="combine-wire" style:stroke-width={1 + 6 * (100-weight) / 100} class:unused={weight === 100} d={connection(102,117,273,84)}/>
      <rect class="box" x="13" y="43" width="89" height="30" rx="5"/>
      <text class="mono" x="57" y="62" text-anchor="middle">A · 6</text>
      <rect class="box" x="13" y="102" width="89" height="30" rx="5"/>
      <text class="mono" x="57" y="121" text-anchor="middle">B · {fmt(b)}</text>
      <text class="annotation" x="175" y="55">{weight}%</text>
      <text class="annotation" x="175" y="128">{100-weight}%</text>
      <rect class="box chosen" x="273" y="67" width="107" height="34" rx="6"/>
      <text class="mono" x="326" y="88" text-anchor="middle">Σ {fmt(total)}</text>
    </svg>
    <p>A contribui com {fmt(first)} e B com {fmt(second)}. Se o retorno de B faltar, a soma fica em <strong>{fmt(first)}</strong>.</p>
  </figure>
{:else if stageId === fanoutStage}
  {@const [k, perNode] = inputs}
  {@const nodes = readings[1]}
  <figure>
    <figcaption>Por onde o token chega a cada expert?</figcaption>
    <svg viewBox="0 0 396 242" role="img" aria-label={'Um token cruza a rede ' + nodes + ' vezes e chega a ' + k + ' experts. Cada nó recebe até ' + perNode + ' destinos.'}>
      <text class="heading" x="12" y="22">Origem</text>
      <text class="heading" x="146" y="22">Nós remotos</text>
      <text class="heading" x="304" y="22">Experts</text>
      {#each [0,1,2,3,4,5,6,7] as i}
        {@const y = fanoutY(i)}
        <g class="station" class:absent={i >= nodes}>
          <path class="wire live" d={connection(77,107,152,y)}/>
          <rect class="box" x="152" y={y-10} width="62" height="20" rx="4"/>
          <text class="mono" x="183" y={y+4} text-anchor="middle">N{i+1}</text>
        </g>
        {#each [0,1,2,3,4,5,6,7] as expert}
          <path class="wire local" class:unmapped={expert >= k || Math.floor(expert / perNode) !== i} d={connection(214,y,300,fanoutY(expert))}/>
        {/each}
        <g class="station" class:absent={i >= k}>
          <rect class="box chosen" x="300" y={y-10} width="60" height="20" rx="4"/>
          <text class="mono" x="330" y={y+4} text-anchor="middle">E{i+1}</text>
        </g>
      {/each}
      <path class="token" d="M19 93H65L78 107L65 121H19Q13 121 13 115V99Q13 93 19 93Z"/>
      <text class="mono" x="43" y="111" text-anchor="middle">token</text>
    </svg>
    <p>{nodes === 1 ? 'Uma cópia cruza' : nodes + ' cópias cruzam'} a rede. Cada nó repassa o token aos seus experts locais. Separar todos os destinos exigiria {k === 1 ? 'uma travessia' : k + ' travessias'}.</p>
  </figure>
{/if}

<style>
  figure {margin:0;min-width:0;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:7px;padding:10px}
  figcaption {font-size:14px;font-weight:630}
  svg {display:block;width:100%;max-width:550px;height:auto;margin:2px auto}
  text {fill:var(--ink);pointer-events:none}
  .heading {font-size:13px;font-weight:600}
  .mono,.annotation {font:12px var(--mono)}
  .wire,.combine-wire {fill:none;stroke:var(--subtle);stroke-width:1.5;stroke-linecap:round}
  .wire.live,.combine-wire {stroke:var(--accent);stroke-width:2.8}
  .wire.local {stroke:var(--sage-ink);stroke-width:2}
  .unused {stroke:var(--subtle);stroke-dasharray:3 4;opacity:.62}
  .unmapped,.absent {opacity:0;pointer-events:none}
  .box,.slot,.token,.gate {stroke:var(--subtle);stroke-width:1;fill:var(--rail)}
  .chosen,.gate {fill:var(--sage);stroke:var(--sage-ink);stroke-width:1.6}
  .token {fill:var(--peach);stroke:var(--accent)}
  .annotation {fill:var(--muted)}
  p {margin:0;line-height:1.5;font-size:13px;color:var(--muted)}
  strong {color:var(--ink)}
  @media(prefers-reduced-motion:no-preference) {
    .station,.wire,.combine-wire,.box,.slot {transition:opacity 140ms ease-out,stroke 140ms ease-out,fill 140ms ease-out,stroke-width 140ms ease-out}
  }
</style>
