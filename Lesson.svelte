<script>
  import { t } from './i18n.js';
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
  import HighlightedCode from './HighlightedCode.svelte';
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
      copyMessage = t("Trecho copiado.", "Snippet copied.");
    } catch {
      copyMessage = t("Selecione o trecho para copiá-lo.", "Select the snippet to copy it.");
    }
  }
</script>

<div class="lesson-layout">
  <div class="lesson-main">
    <div class="breadcrumb">
      {@html icon('book', 14)}<a href={lesson.fieldwork ? '#/producao' : '#/'}
        >{lesson.fieldwork ? t("Trilha de produção", "Production track") : t("Curso", "Course")}</a
      ><span>/</span>{t(group.title)}
    </div>
    <header class="lesson-intro">
      <div class="lesson-kicker">
        <span></span>{t("Aula", "Lesson")} {numbered(lesson.index + 1)} <i>/</i>
        {numbered(group.lessons.length)}
      </div>
      <h1>{t(lesson.title)}</h1>
      <p>{t(lessonAims[lesson.id] ?? lesson.summary)}</p>
      <div class="meta">
        <span class="level">{@html icon('levels', 14)}{t(lesson.level)}</span><span
          >{@html icon('clock', 14)}{lesson.minutes} min</span
        ><span>{@html icon('steps', 16)}{lesson.steps.length} {t("etapas", "steps")}</span>
      </div>

    </header>
    {#key step}
    <article class="lesson-explanation" aria-labelledby="step-title">
      <div class="reader-content">
        <div class="step-counter">
          {t("ETAPA", "STEP")} {numbered(index + 1)} <span>/ {numbered(lesson.steps.length)}</span>
        </div>
        <h2 id="step-title" tabindex="-1">{t(step.title)}</h2>
        {#if index === 0}
          <p class="start-here">{t(lesson.scenario)}</p>
        {/if}
        <CourseTerms text={termsText} label={t("Termos usados nesta etapa", "Terms used in this step")}/>
        {#each step.body.split(/\n\s*\n/) as p}<p class="body-text">{t(p)}</p>{/each}
        {#if step.code}<details class="technical-example">
          <summary>{t("Ver o trecho técnico", "View technical snippet")}</summary>
          <div class="code-block">
            <button data-action="copy" aria-label={t("Copiar trecho", "Copy snippet")} onclick={copy}
              >{@html icon(copyId === href(lesson, index) ? 'check' : 'copy', 14)}</button
            >
            <pre><HighlightedCode source={step.code} language={step.codeLanguage} /></pre>
          </div>
          <span role="status" class="sr-only">{copyMessage}</span>
        </details>{/if}
        {#if step.source}<a class="study-source" href={step.source.url} target="_blank" rel="noreferrer"
            >{t(step.source.label)}{@html icon('external', 13)}</a
          >{/if}
        {#if step.label === evidenceSteps[lesson.id]}
          <section class="stage-source">
            <h3>{investigation.source.kind === 'guide' ? t("Documentação", "Documentation") : t("Caso em produção", "Production case")} · {t(investigation.source.org)}</h3>
            <p>{t(investigation.source.observed)}</p>
            <p>{t(investigation.source.mechanism)}</p>
            <p class="evidence-limits">{t(investigation.source.limits)}</p>
            <a class="study-source" href={investigation.source.url} target="_blank" rel="noreferrer">
              {t(investigation.source.title)} {@html icon('external', 13)}
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
              <summary>{t("Testar uma variação", "Try a variation")}</summary>
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
      <dl class="instruments" aria-label={t("Medições da etapa", "Step measurements")}>
        {#each step.metrics as [label, value]}<div>
            <dt>{t(label)}</dt>
            <dd>{t(value)}</dd>
            {#if previous.has(label) && previous.get(label) !== value}<small
                >{t("Antes:", "Before:")} {t(previous.get(label))}</small
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
            <h3>{t("O que mudou", "What changed")}</h3>
            <p>{t(step.change)}</p>
          </section>
        {/if}
        <div class="insight">
          <h3>{@html icon('idea', 17)} {t("Ideia-chave", "Key idea")}</h3>
          <p>{t(step.idea)}</p>
        </div>
    </div>
    {#if lesson.id === 'ciclo-de-inferencia'}
      {#key index}<QuickCheck {index} />{/key}
    {/if}
    <div class="trace-evidence">
      {#if step.artifact}<section class="artifact-readout">
          <h3>{@html icon('notes', 15)} {t(step.artifact.label)}</h3>
          <pre>{step.artifact.lines.join('\n')}</pre>
        </section>{/if}
      {#if step.metrics}<details class="trace-history">
        <summary>{@html icon('chart', 15)} {t("Comparar medições das etapas", "Compare measurements across steps")}</summary>
        <ol>
          {#each lesson.steps.slice(0, index + 1) as s, i}<li>
              <a href={href(lesson, i)}>{numbered(i + 1)} · {t(s.label)}</a><span
                >{#each s.metrics as [label, value]}<span>{t(label)} <b>{t(value)}</b></span>{/each}</span
              >
            </li>{/each}
        </ol>
      </details>{/if}
    </div>
      <div class="reader-actions">
        <button
          class="previous"
          data-action="back"
          aria-label={t("Etapa anterior", "Previous step")}
          disabled={index === 0}
          onclick={onBack}>{@html icon('back', 17)}</button
        >
        <button class="primary" data-action="next" onclick={onNext}
          >{index === lesson.steps.length - 1
            ? t("Concluir aula", "Finish lesson")
            : t("Próximo · ", "Next · ") + t(lesson.steps[index + 1].label)}{@html icon(
            index === lesson.steps.length - 1 ? 'check' : 'arrow',
            17,
          )}</button
        >
      </div>
    <section class="timeline">
      <div class="timeline-heading">
        <h2>{t("Nesta aula", "In this lesson")}</h2>
        <span>{numbered(index + 1)} / {numbered(lesson.steps.length)}</span>
      </div>
      <ol class:many-steps={lesson.steps.length > 6} style={'--step-count:' + lesson.steps.length}>
        {#each lesson.steps as s, i}
          <li class:current={i === index} class:past={i < index}>
            <a href={href(lesson, i)} aria-current={i === index ? 'step' : undefined}
              ><span
                >{#if i < index}{@html icon('check', 13)}{:else}{numbered(i + 1)}{/if}</span
              ><b>{t(s.label)}</b></a
            >
          </li>
        {/each}
      </ol>
    </section>
    <div class="shortcuts">
      {@html icon('keyboard', 15)}<span><kbd>←</kbd><kbd>→</kbd> {t("navegar", "navigate")}</span><span
        ><kbd>R</kbd> {t("restaurar / repetir", "reset / replay")}</span
      ><span><kbd>{t("Espaço", "Space")}</kbd> {t("pausar exemplo", "pause example")}</span>
    </div>
  </div>
  <div class="reader-track">
  <aside class="reader" aria-label={t("Objetivos e referências", "Objectives and references")}>
    <section class="reference-card">
      <h2>{t("Objetivos da aula", "Lesson objectives")}</h2>
      <ul class="objective-checks">
        {#each lesson.objectives as text, i}
          <li>
            <label
              ><input
                type="checkbox"
                checked={checks.has(lesson.id + '/' + i)}
                onchange={(e) => toggle(lesson.id + '/' + i, e.currentTarget.checked)}
              />{t(text)}</label
            >
          </li>
        {/each}
      </ul>
      <a href={lesson.source.url} target="_blank" rel="noreferrer"
        >{@html icon('book', 15)}<span>{t(lesson.source.label)}</span>{@html icon('external', 13)}</a
      >
      {#each lesson.references || [] as ref}<a
          class="extra-ref"
          href={ref.url}
          target="_blank"
          rel="noreferrer">{@html icon('book', 15)}<span>{t(ref.label)}</span>{@html icon('external', 13)}</a
        >{/each}
      <a class="study-source case-link" href={href(lesson, index) + '/caso'} onclick={() => { if (showCase) focusCase() }}>
        {@html icon('notes', 15)} {investigation.source.kind === 'guide' ? t("Exercício guiado", "Guided exercise") : t("Caso em produção", "Production case")} · {t(investigation.title)} {@html icon('arrow', 14)}
      </a>
    </section>
  </aside>
  </div>
  {#key lesson.id}<ProductionCase {investigation} group={group.id} />{/key}
  <section class="fieldwork" aria-label={t("Aplicação em produção", "Application in production")}>
    {#if lesson.fieldwork}<article>
        <h2>{@html icon('book')} {t("Caso documentado", "Documented case")}</h2>
        <p>{t(lesson.fieldwork.caseStudy.text)}</p>
        <a class="study-source" href={lesson.fieldwork.caseStudy.source.url} target="_blank" rel="noreferrer"
          >{t(lesson.fieldwork.caseStudy.source.label)} {@html icon('external', 13)}</a
        >
      </article>{/if}
    <article>
      <h2>{@html icon('practice')} {t("Exercício de produção", "Production exercise")}</h2>
      <p>{t(exercise.prompt)}</p>
      {#key lesson.id}<details>
          <summary>{t("Conferir resolução", "Check the solution")}</summary>
          <p>{t(exercise.solution)}</p>
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
  .lesson-explanation {
    margin: 20px 0 28px;
    padding: 20px 0 4px;
    border-top: 1px solid var(--edge);
  }
  .lesson-explanation h2 {
    font-size: clamp(23px, 3vw, 35px);
    font-weight: 590;
    letter-spacing: -.04em;
    margin: 6px 0 10px;
    scroll-margin-top: calc(var(--header) + 20px);
  }
  .start-here {border-left:2px solid var(--accent-strong);padding-left:12px;margin-bottom:10px}
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
