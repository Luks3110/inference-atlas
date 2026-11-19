<script module>
  const format = new Intl.NumberFormat('pt-BR', { maximumSignificantDigits: 5 });
  const formatValue = (value) => format.format(value);
  const storagePrefix = 'atlas:ensaio:';
  const visual = {
    fluxo: ['network', 'Fluxo'], fila: ['steps', 'Fila'], memoria: ['stack', 'Memória'],
    tempo: ['clock', 'Tempo'], qualidade: ['chart', 'Qualidade'], distribuicao: ['chart', 'Distribuição'],
  };
  function restore(key, parameters) {
    const initial = parameters.map(p => p.initial);
    try {
      const saved = JSON.parse(sessionStorage.getItem(storagePrefix + key));
      if (!Array.isArray(saved) || saved.length !== initial.length) return initial;
      return saved.map((v, i) => Number.isFinite(v) ? snap(v, parameters[i]) : initial[i]);
    } catch {
      return initial;
    }
  }
</script>
<script>
  import StageIllustration from './StageIllustration.svelte';
  import { untrack } from 'svelte';
  import { prefersReducedMotion } from 'svelte/motion';
  import { heightAt, interpolatePlot } from './chart-motion.js';
  import { snap, responseCurves } from './production/sim-core.js';
  import { icon } from './icons.js';

  let { model, illustrate, children, stageId, origin, destination, stepLabel } = $props();
  let values = $state.raw([]);
  let axis = $state(0);
  // The parent keys each simulator by its lesson and step.
  let inputs = $derived(values.length ? values : restore(stageId, model.knobs));
  let readings = $derived(model.calculate(...inputs));
  let curves = $derived(responseCurves(model, inputs, axis));
  let parameter = $derived(model.knobs[axis]);
  let fraction = $derived((inputs[axis] - parameter.min) / (parameter.max - parameter.min));
  let baseline = $derived(model.calculate(...model.knobs.map(p => p.initial)));
  let groups = $derived(illustrate(inputs, readings));
  let original = $derived(illustrate(model.knobs.map(k => k.initial), baseline));
  let modified = $derived(inputs.some((value, i) => value !== model.knobs[i].initial));
  let target = $derived({ fraction, lines: curves.map(chart => chart.points) });
  let frame = $state.raw(null);
  let plot = $derived(frame ?? target);
  let cursorX = $derived(5 + 190 * plot.fraction);

  $effect(() => {
    const next = target;
    const previous = untrack(() => frame);
    if (prefersReducedMotion.current || !previous) {
      frame = next;
      return;
    }

    const interpolate = interpolatePlot(previous, next);
    const start = performance.now();
    let handle = requestAnimationFrame(paint);
    function paint(now) {
      const t = Math.max(0, (now - start) / 140);
      if (t >= 1) {
        frame = next;
        return;
      }
      frame = interpolate(1 - (1 - t) ** 3);
      handle = requestAnimationFrame(paint);
    }
    return () => cancelAnimationFrame(handle);
  });

  function change(i, value) {
    if (!Number.isFinite(value)) return;
    const next = [...inputs];
    next[i] = snap(value, model.knobs[i]);
    values = next;
    axis = i;
    try { sessionStorage.setItem(storagePrefix + stageId, JSON.stringify(next)); } catch {}
  }
  function reset() {
    values = model.knobs.map(p => p.initial);
    axis = 0;
    try { sessionStorage.removeItem(storagePrefix + stageId); } catch {}
  }
</script>

<section class="simulator" aria-label="Simulador da etapa">
  <div class="controls-heading">
    <h3>Parâmetros</h3>
    <button data-sim-reset type="button" onclick={reset} disabled={!modified}>{@html icon('replay',13)} Restaurar</button>
  </div>
  <div class="knobs">
    {#each model.knobs as p, i}
      <div class="knob">
        <label for={'range-' + stageId + i}>{p.label} {#if p.unit}<small>({p.unit})</small>{/if}</label>
        <div class="input-row">
          <input type="range" id={'range-' + stageId + i} min={p.min} max={p.max} step={p.step} value={inputs[i]}
            onfocus={() => axis = i} oninput={e => change(i, e.currentTarget.valueAsNumber)} />
          <input aria-label={'Valor de ' + p.label} type="number" min={p.min} max={p.max} step={p.step} value={inputs[i]}
            onfocus={() => axis = i}
            oninput={e => { if (e.currentTarget.validity.valid) change(i, e.currentTarget.valueAsNumber); }}
            onchange={e => { const el = e.currentTarget; change(i, el.valueAsNumber); el.value = String(inputs[i]); }}
            onblur={e => { e.currentTarget.value = String(inputs[i]); }} />
        </div>
      </div>
    {/each}
  </div>
  <dl class="live-readings" aria-label="Métricas com os parâmetros atuais">
    {#each model.metrics as [name, unit], i}
      <div><dt>{name}</dt><dd>{formatValue(readings[i])} <small>{unit}</small></dd></div>
    {/each}
  </dl>
  <div class="drawing-board">
    <div class="reference-scene"><div class="reference-label">Exemplo da aula</div>{@render children()}</div>
    <StageIllustration {groups} {original} {stageId} {inputs} {readings}/>
  </div>
  <p class="premise">{model.explanation}</p>
  <details class="curve-panel">
    <summary>Ver curvas e valores das métricas</summary>
  <figure class="live-graph" aria-label={'Curvas de ' + stepLabel}>
    <figcaption><span>{@html icon(visual[model.kind][0],15)} {visual[model.kind][1]} · {stepLabel}</span></figcaption>
    <div class="topology-line">
      <span class="node">{origin}</span>
      <div class="link-state">
        <b>{formatValue(inputs[axis])} {parameter.unit}</b>
        <svg viewBox="0 0 120 16" preserveAspectRatio="none" aria-hidden="true">
          <path d="M1 8H116 M109 2L117 8L109 14" fill="none" stroke="var(--subtle)"/>
          <line x1="1" x2={3 + 103*plot.fraction} y1="8" y2="8" stroke="var(--accent)" stroke-width="2"/>
          <circle cx={3 + 103*plot.fraction} cy="8" r="3" fill="var(--accent)"/>
        </svg>
        <span>{parameter.label}</span>
      </div>
      <span class="node target">{destination}</span>
    </div>
    <div class="branches" style={'--n:' + model.metrics.length}>
      {#each model.metrics as [name, unit], i}
        {@const chart = curves[i]}
        <div class="branch">
          <h4>{name}</h4>
          <div class="value"><strong>{formatValue(readings[i])}</strong> <span>{unit}</span></div>
          <div class="chart">
          <div class="vertical-scale" aria-hidden="true"><span>{formatValue(chart.max)}</span>{#if chart.max !== chart.min}<span>{formatValue(chart.min)}</span>{/if}</div>
          <svg viewBox="0 0 200 52" preserveAspectRatio="none" role="img" aria-label={name + ' em função de ' + parameter.label + '. Mínimo ' + formatValue(chart.min) + ', máximo ' + formatValue(chart.max)}>
            <path class="grid" d="M5 6H195 M5 26H195 M5 46H195"/>
            <polyline class="curve" points={plot.lines[i].map(p => p.x + ',' + p.y).join(' ')}/>
            <line class="cursor" x1={cursorX} x2={cursorX} y1="4" y2="49"/>
            <circle class="point" cx={cursorX} cy={heightAt(plot.lines[i], cursorX)} r="3.4"/>
          </svg>
          </div>
          <div class="ticks"><span>{formatValue(parameter.min)}</span><span>{formatValue(parameter.max)}</span></div>
          <small class="base" class:concealed={!modified}>Inicial · {formatValue(baseline[i])} {unit}</small>
        </div>
      {/each}
    </div>
    <div class="axis-note">Cada curva varia {parameter.label.toLowerCase()} e mantém os outros valores que você escolheu.</div>
  </figure>
  </details>
</section>

<style>
  .live-readings {display:flex;flex-wrap:wrap;gap:8px 20px;margin:12px 0 0;padding:9px 0;border-block:1px solid var(--line)}
  .live-readings dt,.reference-label {color:var(--muted);font-size:11px}
  .live-readings dd {margin:2px 0 0;font:500 16px var(--mono)} .live-readings small {font-size:11px}
  .drawing-board {display:grid;grid-template-columns:minmax(0,1fr);gap:8px;margin-top:10px}
  .reference-scene {min-width:0}
  .reference-label {font-size:11px;color:var(--muted);margin:0 0 4px}
  .drawing-board :global(.objects) {grid-row:1}
  @container (min-width:740px) {
    .drawing-board {grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);align-items:start}
    .drawing-board :global(.objects) {grid-row:1;grid-column:2}
  }
  .curve-panel summary {cursor:pointer;color:var(--muted);padding:8px 0;font-size:13px}
  .simulator {min-width:0}
  h3,h4,p,figure {margin:0}
  .controls-heading,figcaption,.input-row {display:flex;align-items:center;gap:10px}
  .controls-heading {justify-content:space-between;margin:14px 0 7px}
  h3 {font-size:14px}
  .controls-heading button {display:flex;align-items:center;gap:6px;color:var(--accent);padding:5px}
  .controls-heading button:disabled {color:var(--subtle);opacity:.65}
  .knobs {display:grid;grid-template-columns:repeat(auto-fit,minmax(min(190px,100%),1fr));gap:7px}
  .knob {background:var(--rail);border:1px solid var(--line);border-radius:6px;padding:9px 11px;min-width:0}
  label {font-size:13px;font-weight:570;display:block;line-height:1.4}
  label small,.value span {font-size:11px;color:var(--muted)}
  .input-row {margin-top:6px;gap:7px}
  input[type=range]{flex:1;width:0;min-width:28px;accent-color:var(--accent);cursor:pointer}
  input[type=number]{width:7ch;box-sizing:content-box;max-width:48%;background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:4px;font:12px var(--mono);padding:4px 5px}
  .live-graph{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px;margin-top:10px;overflow:hidden}
  figcaption {justify-content:space-between;flex-wrap:wrap;color:var(--muted);font:11px var(--mono)}
  figcaption span:first-child {display:flex;align-items:center;gap:6px;color:var(--ink)}
  .topology-line{display:grid;grid-template-columns:minmax(0,1fr) minmax(70px,1.15fr) minmax(0,1fr);align-items:center;gap:7px;max-width:620px;margin:14px auto 3px;text-align:center}
  .node{border:1px solid var(--line);border-radius:5px;background:var(--rail);padding:8px 5px;font-size:13px;font-weight:570;overflow-wrap:anywhere}
  .node.target{background:var(--sage);color:var(--sage-ink)}
  .link-state{display:grid;justify-items:center;font:10px var(--mono);color:var(--muted);overflow-wrap:anywhere}
  .link-state b{font-size:12px;color:var(--accent)}
  .link-state svg{width:100%;height:15px}
  .chart{display:flex;align-items:stretch;gap:3px}
  .vertical-scale{flex:0 0 9ch;display:flex;flex-direction:column;justify-content:space-between;color:var(--muted);font:9px var(--mono)}
  .branches{position:relative;padding-top:18px;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:7px}
  .branches::before{content:'';position:absolute;left:50%;top:0;height:10px;border-left:1px solid var(--subtle)}
  .branch{position:relative;min-width:0;background:var(--rail);padding:8px 10px;border:1px solid var(--line);border-radius:5px}
  .branch::before {content:'';position:absolute;top:-10px;height:9px;left:50%;border-left:1px solid var(--subtle)}
  .branch::after {content:'';position:absolute;top:-10px;left:0;width:calc(100% + 9px);border-top:1px solid var(--subtle)}
  .branch:first-child::after {left:50%;width:calc(50% + 9px)}
  .branch:last-child::after {width:50%}
  h4{font-size:12px;font-weight:570;line-height:1.4;overflow-wrap:anywhere}
  .value{font-family:var(--mono);margin:3px 0}.value strong{font-size:clamp(14px,2vw,21px);overflow-wrap:anywhere}
  .branch svg {display:block;flex:1;width:0;height:44px;overflow:visible}
  .grid,.curve,.cursor {fill:none;vector-effect:non-scaling-stroke}
  .grid {stroke:var(--line)}.curve {stroke:var(--accent);stroke-width:1.7}.point{fill:var(--accent)}.cursor{stroke:var(--subtle);stroke-dasharray:2 3}
  .concealed{visibility:hidden}
  .ticks,.base,.axis-note {font:10px var(--mono);color:var(--muted)}
  .ticks{display:flex;justify-content:space-between}.base{display:block;margin-top:4px}.axis-note{margin-top:10px;line-height:1.5}
  .premise {margin:9px 0;font-size:14px;line-height:1.6}
  @container (max-width:480px){.branches{gap:4px}.branch{padding:6px 4px}.knobs{grid-template-columns:1fr}.controls-heading{margin-top:9px}}
</style>
