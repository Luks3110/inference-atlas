<script>
  import { investigations } from './production/audit.js';
  import ProductionCase from './ProductionCase.svelte';
  import { simulations } from './production/simulations.js';
  import { illustrations } from './production/illustrations.js';
  import StepDecision from './StepDecision.svelte';
  import { evidenceSteps } from './production/decision-evidence.js';
  import { icon } from './icons.js';
  import { renderDiagram } from './diagram.js';
  import { href, numbered, read, save } from './course-ui.js';
  import FleetLab from './FleetLab.svelte';
  import { lessonAims } from './production/lesson-aims.js';
  import CourseTerms from './CourseTerms.svelte';
  import ArchitectureChoice from './ArchitectureChoice.svelte';
  import ToolTraceLab from './ToolTraceLab.svelte';
  import ToolCallingStep from './ToolCallingStep.svelte';
  import ToolCallingWalkthrough from './ToolCallingWalkthrough.svelte';
  import PortalPractice from './PortalPractice.svelte';
  import QuickCheck from './QuickCheck.svelte';
  import VectorLab from './VectorLab.svelte';

  let { lesson, index, group, showCase, onBack, onNext } = $props();
  let step = $derived(lesson.steps[index]);
  let previous = $derived(new Map(lesson.steps[index - 1]?.metrics || []));
  let exercise = $derived(lesson.fieldwork?.exercise || lesson.challenge);
  let checks = $state.raw(new Set(Array.isArray(read('self-checks', [])) ? read('self-checks', []) : []));
  let diagram = $state();
  let model = $derived(simulations[lesson.id]?.[index]);
  const traceViews = {
    2: ['openai','request'], 3: ['openai','stream'], 4: ['openai','execute'],
    5: ['openai','result'], 6: ['openai','text'], 8: ['mastra','execute'],
    9: ['mcp','catalog'], 10: ['code','execute'],
  };
  let traceView = $derived(lesson.lab === 'tool-calling' ? traceViews[index] : null);
  let termsText = $derived([
    step.title, step.body, step.idea, step.change, ...(step.decision ?? []),
    ...(model?.knobs.map(knob => knob.label) ?? []),
    ...(step.metrics?.flat() ?? []), model?.explanation,
  ].join(' '));
  let investigation = $derived(investigations.get(lesson.id));
  function focusCase() {
    const target = document.getElementById('case-title');
    target?.focus({ preventScroll: true });
    target?.closest('section.production-case')?.scrollIntoView({ block: 'start' });
  }
  $effect(() => {
    if (investigation && showCase) focusCase();
  });
  let copyId = $state(''),
    copyMessage = $state('');
  function toggle(key, checked) {
    const next = new Set(checks);
    if (checked) next.add(key);
    else next.delete(key);
    checks = next;
    save('self-checks', [...next]);
  }
  $effect(() => {
    if (diagram) renderDiagram(diagram, lesson, index);
  });
  async function copy() {
    try {
      await navigator.clipboard.writeText(step.code);
      copyId = href(lesson, index);
      copyMessage = 'Trecho copiado.';
    } catch {
      copyMessage = 'Selecione o trecho para copiá-lo.';
    }
  }
</script>

<div class="lesson-layout">
  <div class="lesson-main">
    <div class="breadcrumb">
      {@html icon('book', 14)}<a href={lesson.fieldwork ? '#/producao' : '#/'}
        >{lesson.fieldwork ? 'Trilha de produção' : 'Curso'}</a
      ><span>/</span>{group.title}
    </div>
    <header class="lesson-intro">
      <div class="lesson-kicker">
        <span></span>Aula {numbered(lesson.index + 1)} <i>/</i>
        {numbered(group.lessons.length)}
      </div>
      <h1>{lesson.title}</h1>
      <p>{lessonAims[lesson.id] ?? lesson.summary}</p>
      <div class="meta">
        <span class="level">{@html icon('levels', 14)}{lesson.level}</span><span
          >{@html icon('clock', 14)}{lesson.minutes} min</span
        ><span>{@html icon('steps', 16)}{lesson.steps.length} etapas</span>
      </div>

    </header>
    {#key step}
    <article class="lesson-explanation" aria-labelledby="step-title">
      <div class="reader-content">
        <div class="step-counter">
          ETAPA {numbered(index + 1)} <span>/ {numbered(lesson.steps.length)}</span>
        </div>
        <h2 id="step-title" tabindex="-1">{step.title}</h2>
        {#if index === 0}
          <p class="start-here">{lesson.scenario}</p>
        {/if}
        <CourseTerms text={termsText} label="Termos usados nesta etapa"/>
        {#each step.body.split(/\n\s*\n/) as p}<p class="body-text">{p}</p>{/each}
        {#if step.code}<details class="technical-example">
          <summary>Ver o trecho técnico</summary>
          <div class="code-block">
            <button data-action="copy" aria-label="Copiar trecho" onclick={copy}
              >{@html icon(copyId === href(lesson, index) ? 'check' : 'copy', 14)}</button
            >
            <pre><code>{step.code}</code></pre>
          </div>
          <span role="status" class="sr-only">{copyMessage}</span>
        </details>{/if}
        {#if step.source}<a class="study-source" href={step.source.url} target="_blank" rel="noreferrer"
            >{step.source.label}{@html icon('external', 13)}</a
          >{/if}
        {#if step.label === evidenceSteps[lesson.id]}
          <section class="stage-source">
            <h3>{investigation.source.kind === 'guide' ? 'Documentação' : 'Caso em produção'} · {investigation.source.org}</h3>
            <p>{investigation.source.observed}</p>
            <p>{investigation.source.mechanism}</p>
            <p class="evidence-limits">{investigation.source.limits}</p>
            <a class="study-source" href={investigation.source.url} target="_blank" rel="noreferrer">
              {investigation.source.title} {@html icon('external', 13)}
            </a>
          </section>
        {/if}

      </div>
    </article>
    {/key}
    {#if lesson.lab === 'tool-calling'}
      {#key index}
        {#if index === 1 || index === 7}
          <ToolCallingWalkthrough />
        {:else if traceView}
          <ToolTraceLab initialMode={traceView[0]} initialStep={traceView[1]} />
          {#if index >= 2 && index <= 6}
            <details class="tool-alternative">
              <summary>Testar uma variação</summary>
              <ToolCallingStep {index} />
            </details>
          {/if}
        {:else}
          <ToolCallingStep {index} />
        {/if}
      {/key}
    {:else}
    <div class="instrument-board">
      {#key step}
        <StepDecision decision={step.decision} {model}
          illustrate={illustrations[lesson.id][index]} stageId={lesson.id + '-' + index} stepLabel={step.label} hnsw={lesson.id === 'rag-indice-hnsw'}>
          {#snippet readings()}
      <dl class="instruments" aria-label="Medições da etapa">
        {#each step.metrics as [label, value]}<div>
            <dt>{label}</dt>
            <dd>{value}</dd>
            {#if previous.has(label) && previous.get(label) !== value}<small
                >Antes: {previous.get(label)}</small
              >{/if}
          </div>{/each}
      </dl>
          {/snippet}
          <div id="diagram" bind:this={diagram}></div>
        </StepDecision>
      {/key}

    </div>
    {/if}
    {#if lesson.id === 'mastra-e-orquestracao' && index === 0}<ArchitectureChoice />{/if}
    {#if lesson.id === 'computer-use' && index === 1}<PortalPractice />{/if}
    <div class="step-takeaway">
        {#if step.change}
          <section class="step-change">
            <h3>O que mudou</h3>
            <p>{step.change}</p>
          </section>
        {/if}
        <div class="insight">
          <h3>{@html icon('idea', 17)} Ideia-chave</h3>
          <p>{step.idea}</p>
        </div>
    </div>
    {#if lesson.id === 'ciclo-de-inferencia'}
      {#key index}<QuickCheck {index} />{/key}
    {/if}
    <div class="trace-evidence">
      {#if step.artifact}<section class="artifact-readout">
          <h3>{@html icon('notes', 15)} {step.artifact.label}</h3>
          <pre>{step.artifact.lines.join('\n')}</pre>
        </section>{/if}
      {#if step.metrics}<details class="trace-history">
        <summary>{@html icon('chart', 15)} Comparar medições das etapas</summary>
        <ol>
          {#each lesson.steps.slice(0, index + 1) as s, i}<li>
              <a href={href(lesson, i)}>{numbered(i + 1)} · {s.label}</a><span
                >{#each s.metrics as [label, value]}<span>{label} <b>{value}</b></span>{/each}</span
              >
            </li>{/each}
        </ol>
      </details>{/if}
    </div>
      <div class="reader-actions">
        <button
          class="previous"
          data-action="back"
          aria-label="Etapa anterior"
          disabled={index === 0}
          onclick={onBack}>{@html icon('back', 17)}</button
        >
        <button class="primary" data-action="next" onclick={onNext}
          >{index === lesson.steps.length - 1
            ? 'Concluir aula'
            : 'Próximo · ' + lesson.steps[index + 1].label}{@html icon(
            index === lesson.steps.length - 1 ? 'check' : 'arrow',
            17,
          )}</button
        >
      </div>
    <section class="timeline">
      <div class="timeline-heading">
        <h2>Nesta aula</h2>
        <span>{numbered(index + 1)} / {numbered(lesson.steps.length)}</span>
      </div>
      <ol class:many-steps={lesson.steps.length > 6} style={'--step-count:' + lesson.steps.length}>
        {#each lesson.steps as s, i}
          <li class:current={i === index} class:past={i < index}>
            <a href={href(lesson, i)} aria-current={i === index ? 'step' : undefined}
              ><span
                >{#if i < index}{@html icon('check', 13)}{:else}{numbered(i + 1)}{/if}</span
              ><b>{s.label}</b></a
            >
          </li>
        {/each}
      </ol>
    </section>
    <div class="shortcuts">
      {@html icon('keyboard', 15)}<span><kbd>←</kbd><kbd>→</kbd> navegar</span><span
        ><kbd>R</kbd> restaurar / repetir</span
      ><span><kbd>Espaço</kbd> pausar exemplo</span>
    </div>
  </div>
  <div class="reader-track">
  <aside class="reader" aria-label="Objetivos e referências">
    <section class="reference-card">
      <h2>Objetivos da aula</h2>
      <ul class="objective-checks">
        {#each lesson.objectives as text, i}
          <li>
            <label
              ><input
                type="checkbox"
                checked={checks.has(lesson.id + '/' + i)}
                onchange={(e) => toggle(lesson.id + '/' + i, e.currentTarget.checked)}
              />{text}</label
            >
          </li>
        {/each}
      </ul>
      <a href={lesson.source.url} target="_blank" rel="noreferrer"
        >{@html icon('book', 15)}<span>{lesson.source.label}</span>{@html icon('external', 13)}</a
      >
      {#each lesson.references || [] as ref}<a
          class="extra-ref"
          href={ref.url}
          target="_blank"
          rel="noreferrer">{@html icon('book', 15)}<span>{ref.label}</span>{@html icon('external', 13)}</a
        >{/each}
      <a class="study-source case-link" href={href(lesson, index) + '/caso'} onclick={() => { if (showCase) focusCase() }}>
        {@html icon('notes', 15)} {investigation.source.kind === 'guide' ? 'Exercício guiado' : 'Caso em produção'} · {investigation.title} {@html icon('arrow', 14)}
      </a>
    </section>
  </aside>
  </div>
  {#key lesson.id}<ProductionCase {investigation} group={group.id} />{/key}
  <section class="fieldwork" aria-label="Aplicação em produção">
    {#if lesson.fieldwork}<article>
        <h2>{@html icon('book')} Caso documentado</h2>
        <p>{lesson.fieldwork.caseStudy.text}</p>
        <a class="study-source" href={lesson.fieldwork.caseStudy.source.url} target="_blank" rel="noreferrer"
          >{lesson.fieldwork.caseStudy.source.label} {@html icon('external', 13)}</a
        >
      </article>{/if}
    <article>
      <h2>{@html icon('practice')} Exercício de produção</h2>
      <p>{exercise.prompt}</p>
      {#key lesson.id}<details>
          <summary>Conferir resolução</summary>
          <p>{exercise.solution}</p>
        </details>{/key}
    </article>
    {#if lesson.id === 'capacidade-milhoes'}<FleetLab />{/if}
    {#if ['rag-indice-hnsw', 'rag-quantizacao-vetorial', 'rag-ivf-e-shards'].includes(lesson.id)}<VectorLab
      />{/if}
  </section>
</div>

<style>
  .tool-alternative {margin:0 0 16px}
  .tool-alternative > summary {color:var(--accent);font-size:14px;cursor:pointer;margin-bottom:8px}
  .lesson-main .reader-content {padding:0;max-width:72ch}
  .lesson-main .body-text,.start-here {font-size:clamp(15px,1.2vw,17px);line-height:1.65;color:var(--ink)}
  .lesson-explanation {margin:16px 0 22px;padding:clamp(16px,2.5vw,30px);border:1px solid var(--line);border-radius:10px;background:var(--panel)}
  .lesson-explanation h2 {font-size:clamp(23px,3vw,35px);margin:6px 0 10px;scroll-margin-top:calc(var(--header) + 20px)}
  .start-here {border-left:2px solid var(--accent);padding-left:12px;margin-bottom:10px}
  .technical-example {margin:12px 0}
  .technical-example summary {cursor:pointer;color:var(--accent);font-size:14px}
  .step-takeaway {max-width:72ch}
  .reader-actions {padding:0;margin:18px 0 0}
  .reader-actions :global(.primary) {flex:0 1 auto;margin-left:auto}
  .reader-track {display:contents}
  @media (min-width:1121px) {
    .reader-track {display:block;align-self:stretch;min-width:0}
  }
  .stage-source {margin:14px 0;padding-left:10px;border-left:2px solid var(--accent)}
  .stage-source h3 {font-size:14px}
  .stage-source p {color:var(--muted);font-size:13px;line-height:1.6;margin-top:5px}
  .stage-source .evidence-limits {font-size:12px}
  .stage-source a {margin-top:6px}
  .instrument-board .instruments {margin-bottom:12px}
  .case-link {margin-top:12px; line-height:1.5}
</style>
