<script>
  import CourseTerms from './CourseTerms.svelte';
  import { icon } from './icons.js';
  let { investigation, group } = $props();
  let caseStudy = $derived(investigation.source);
</script>

<section class="production-case" aria-labelledby="case-title">
  <header>
    <div class="lesson-kicker"><span></span>{caseStudy.kind === 'guide' ? 'Exercício guiado' : 'Caso em produção'} · {caseStudy.org}</div>
    <h2 id="case-title" tabindex="-1">{investigation.title}</h2>
  </header>
  <CourseTerms text={[caseStudy.observed, caseStudy.mechanism, investigation.method, investigation.signal, investigation.exercise.prompt].join(' ')} />
  <div class="analysis">
    <section>
      <h3>{caseStudy.title}</h3>
      <p>{caseStudy.observed}</p>
      <p>{caseStudy.mechanism}</p>
      <a class="study-source" href={caseStudy.url} target="_blank" rel="noreferrer">
        Fonte primária · {caseStudy.org} {@html icon('external', 13)}
      </a>
      <h3>O que o teste cobre</h3>
      <p>{caseStudy.limits}</p>
    </section>
    <section>
      <h3>Como aplicar na aula</h3>
      <p>{investigation.method}</p>
      <h3>O que medir para decidir</h3>
      <p>{investigation.signal}</p>
    </section>
  </div>
  <section class="decision">
    <h3>O que você faria?</h3>
    <p>{investigation.exercise.prompt}</p>
    <details>
      <summary>Conferir raciocínio</summary>
      <p>{investigation.exercise.solution}</p>
    </details>
  </section>
  <a class="study-source" href={'#/auditoria/' + group}>Ver auditoria deste módulo {@html icon('arrow', 14)}</a>
</section>

<style>
  .production-case {position:relative;grid-column:1/-1; min-width:0; background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:clamp(18px,2.4vw,32px); scroll-margin-top:calc(var(--header) + 14px)}
  header {margin-bottom:16px}
  h2 {font-size:clamp(22px,2.3vw,30px); line-height:1.15; letter-spacing:-.04em; margin:8px 0}
  h2:focus {outline:none}
  .analysis {display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:clamp(16px,3vw,42px)}
  h3 {font-size:16px; margin:0 0 5px}
  p {line-height:1.7; color:var(--muted); white-space:pre-line; overflow-wrap:anywhere}
  p + p {margin-top:8px}
  p + h3, a + h3 {margin-top:18px}
  .study-source {margin-top:9px}
  .decision {margin:18px 0 6px; padding:16px; background:var(--selection); border-radius:7px}
  .decision p {color:var(--ink)}
  summary {color:var(--selection-ink); cursor:pointer; font-weight:600; padding:8px 0 0}
  details[open] p {padding-top:5px}
  @media(max-width:760px){.analysis {grid-template-columns:1fr}}
  @media(max-width:740px){.production-case {order:3}}
</style>
