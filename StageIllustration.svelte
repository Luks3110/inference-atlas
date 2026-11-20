<script module>
  // Each glyph has an outline and interior detail so it also reads in monochrome.
  const symbols = {
    token: ['M2 8 8 3h12l2 3v10l-6 5H4l-2-3Z','m3 9 3 2h11l4-4M6 11v7m4-3h5'],
    page: ['m2 7 11-5 9 4v11l-11 5-9-4Z','m2 7 9 4 11-5m-11 5v11M3 12l8 3 10-4M3 15l8 3 10-4'],
    gpu: ['m2 7 12-5 8 4v10l-12 6-8-4Z','m2 7 8 4 12-5m-12 5v11m2-6 7-3m-7 6 7-3M6 7l6-3 4 2-6 3Z'],
    expert: ['m12 2 9 5v10l-9 5-9-5V7Z','m3 7 9 5 9-5m-9 5v10m-6-13v6m9 1 3-2'],
    request: ['M2 5h16l4 4v11H2Z','m2 6 10 8 10-6M5 17h4'],
    packet: ['m2 7 10-5 10 5v10l-10 5-10-5Z','m2 7 10 5 10-5m-10 5v10M7 5l10 5v4'],
    document: ['M4 2h11l5 5v15H4Z','M15 2v6h5M7 12h10M7 15h10m-10 3h6'],
    clock: ['M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Z','M12 5v7l5 3'],
    cell: ['m2 8 10-5 10 5v8l-10 5-10-5Z','m2 8 10 5 10-5m-10 5v8'],
    worker: ['M3 3h18v18H3Z','M3 12h18M6 7h2m3 0h7M6 16h2m3 0h7'],
    bucket: ['M2 5q10-6 20 0v13q-10 7-20 0Z','M2 5q10 7 20 0M2 11q10 7 20 0'],
    check: ['M3 3h18v18H3Z','m6 12 4 5 8-10'],
  };
  const clamp = v => Math.max(0,Math.min(1,v));
  function batches(group, initial) {
    const extent = Math.max(Math.abs(initial), Math.abs(group.value), group.capacity || 0);
    const rough = extent / 12;
    const base = 10 ** Math.floor(Math.log10(rough || 1));
    const size = extent <= 12 && Number.isInteger(group.value) && Number.isInteger(initial) ? 1 :
      ([1,2,5,10].find(n => n * base >= rough) || 10) * base;
    return { size, count:Math.max(1,Math.ceil(extent / size)) };
  }
</script>
<script>
  import { formatLocale, t } from './i18n.js';
  import ServingDetail, {hasServingDetail} from './ServingDetail.svelte';
  import ApplicationDetail from './ApplicationDetail.svelte';
  let { groups, original, inputs, readings, stageId } = $props();
  let format = $derived(new Intl.NumberFormat(formatLocale(), { maximumSignificantDigits: 5 }));
  const id = $props.id();
</script>

<section class="objects" aria-label={t("Desenho com os parâmetros atuais", "Diagram with the current parameters")}>
  <h3>{t("Com seus parâmetros", "With your parameters")}</h3>
  {#if hasServingDetail(stageId)}
    <ServingDetail {stageId} {inputs} {readings}/>
  {:else}
    <ApplicationDetail {inputs} {readings} {stageId}/>
  {/if}
  <svg width="0" height="0" aria-hidden="true" class="defs"><defs>
    {#each Object.entries(symbols) as [shape, paths]}
      <symbol id={id+shape} viewBox="0 0 24 24">
        <path d={paths[0]} fill="currentColor" fill-opacity=".24" stroke="currentColor"/>
        <path d={paths[1]} fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
      </symbol>
    {/each}
  </defs></svg>
  {#each groups as group, i}
    {@const showLane = hasServingDetail(stageId) ? false : stageId === 'espacos-de-embeddings-0' ? i === 1 : stageId === 'rag-quantizacao-vetorial-1' ? i === 2 : true}
    {@const initial = original[i]?.value ?? group.value}
    {#if showLane}<div class="lane" data-shape={group.shape}>
      <header><strong>{t(group.label)}</strong><span>{format.format(group.value)} {t(group.unit)}</span></header>
      {#if group.arrows}
        <svg class="vectors" viewBox="0 0 150 66" role="img" aria-label={t(group.label)}>
          <path d="M5 54H145M75 5V61" stroke="var(--line)" fill="none"/>
          {#each group.arrows as arrow,j}
            <g class="arrow" style:transform={'translate(75px,54px) rotate('+(-arrow.angle)+'deg)'} style:color={j?'var(--accent)':'var(--selection-ink)'}>
              <path d={'M0 0H'+(arrow.length*9)} stroke="currentColor" stroke-width={j?2:4} />
              <path d={'M'+(arrow.length*9-4)+' -3l4 3-4 3'} fill="none" stroke="currentColor"/>
            </g>
          {/each}
        </svg>
        <small>{group.arrows.map(a=>t(a.label)+' · '+a.angle+'°').join(' / ')}</small>
      {:else if group.matrix}
        <div class="matrix" style={'--columns:'+group.matrix.columns}>
          {#each group.matrix.cells as cell}
            <span title={t(cell.label)} aria-label={t(cell.label)} class:muted={cell.state==='muted'} class:warn={cell.state==='warn'}>{t(cell.label).replace('Gravação ', 'G').replace('leitura ', 'L').replace('Write ', 'W').replace('read ', 'R').replace(' / ', '·')}</span>
          {/each}
        </div>
        {#if group.matrix.note}<small>{t(group.matrix.note)}</small>{/if}
      {:else if group.items}
        <div class="items">
          {#each group.items as item}
            <span class="chip" class:muted={item.state==='muted'} class:warn={item.state==='warn'}>
              <svg aria-hidden="true"><use href={'#'+id+group.shape}/></svg>{t(item.label)}
            </span>
          {/each}
        </div>
      {:else}
        {@const {size,count} = batches(group,initial)}
        <div class="pile" aria-hidden="true">
          {#each Array(count) as _,j}
            {@const fill = clamp(Math.abs(group.value)/size-j)}
            {@const before = clamp(Math.abs(initial)/size-j)}
            <span class="unit">
              <svg class="empty"><use href={'#'+id+group.shape}/></svg>
              <svg class="ink" class:added={fill>before} style:clip-path={'inset(0 '+(100-100*fill)+'% 0 0)'}><use href={'#'+id+group.shape}/></svg>
            </span>
          {/each}
        </div>
        {#if size !== 1}<small>{t(`Cada símbolo inteiro vale ${format.format(size)} ${t(group.unit)}.`, `Each whole symbol represents ${format.format(size)} ${t(group.unit)}.`)}</small>{/if}
      {/if}
      {#if group.note}<p>{t(group.note)}</p>{/if}
      {#if initial !== group.value}<small class="change">{t("Inicial", "Initial")} · {format.format(initial)} {t(group.unit)}</small>{/if}
    </div>{/if}
  {/each}
</section>

<style>
  .objects {min-width:0;background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:12px 14px}
  h3,header,p {margin:0}
  h3 {font-size:13px}
  .defs {position:absolute}
  .lane {border-top:1px solid var(--line);margin-top:9px;padding-top:9px;min-width:0}
  header {display:flex;align-items:baseline;justify-content:space-between;gap:4px 12px;flex-wrap:wrap}
  header strong {font-size:12px} header span,.change,small {font:11px var(--mono);color:var(--muted)}
  header span {color:var(--ink)}
  .matrix {display:grid;grid-template-columns:repeat(var(--columns),minmax(0,1fr));gap:2px;margin-top:7px;max-width:330px}
  .matrix span {background:var(--selection);color:var(--selection-ink);padding:3px 1px;text-align:center;border-radius:2px;font:10px var(--mono)}
  .matrix span.muted {background:var(--rail);color:var(--muted)} .matrix span.warn {background:var(--accent-soft);color:var(--accent)}
  .items,.pile {display:flex;flex-wrap:wrap;align-items:center;gap:3px;margin:5px 0 0}
  .unit {position:relative;width:22px;height:23px}
  .unit svg {position:absolute;inset:0;width:100%;height:100%}
  .empty {color:var(--line)} .ink,.chip {color:var(--selection-ink)} .ink.added,.chip.warn {color:var(--accent)}
  .chip {display:inline-flex;align-items:center;gap:3px;font:11px var(--mono);background:var(--selection);border-radius:4px;padding:2px 5px;max-width:100%;overflow-wrap:anywhere}
  .chip.warn {background:var(--accent-soft)} .chip.muted {color:var(--muted);background:var(--rail)}
  .chip svg {width:17px;height:17px;flex:none}
  small {display:block;line-height:1.4;margin-top:3px} p {font-size:12px;line-height:1.4;margin:4px 0;color:var(--muted)}
  .vectors {display:block;width:150px;max-width:100%;height:66px}
  @media (prefers-reduced-motion:no-preference) {
    .ink {transition:clip-path 140ms ease-out,color 140ms}
    .chip {transition:color 140ms,background 140ms}
    .arrow {transition:transform 140ms ease-out}
  }
</style>
