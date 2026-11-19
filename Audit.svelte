<script>
  import { modules, lessons } from './curriculum.js';
  import { audit } from './production/audit.js';
  import { numbered, href } from './course-ui.js';
  import CourseTerms from './CourseTerms.svelte';
  import { icon } from './icons.js';

  let { selected } = $props();
  let current = $derived(audit[selected]);
</script>

<article class="production-index audit-report">
  <header class="production-intro">
    <div class="lesson-kicker"><span></span>Currículo · {modules.length} módulos · {lessons.length} aulas</div>
    <h1>Auditoria do currículo</h1>
    <p>Esta página mostra quais problemas de produção foram adicionados às aulas. Abra um caso para ler o que a equipe observou e tentar uma decisão com os dados do exercício.</p>
  </header>
  <nav aria-label="Selecionar módulo da auditoria" class="audit-index">
    {#each modules as group, i}
      <a href={'#/auditoria/' + group.id} aria-current={selected === i ? 'true' : undefined}>
        <small>{numbered(i + 1)}</small> {group.title}
      </a>
    {/each}
  </nav>
  <section class="audit-module" aria-labelledby="audit-title">
    <h2 id="audit-title" tabindex="-1">{current.moduleTitle}</h2>
    <CourseTerms text={[current.baseline, ...current.gaps, ...Object.values(current.lessons).map(lesson => lesson.gap)].join(' ')} />
    <h3>O que as aulas já cobriam</h3>
    <p>{current.baseline}</p>
    <h3>Lacunas identificadas</h3>
    <ul>{#each current.gaps as gap}<li>{gap}</li>{/each}</ul>
    <h3>Aprofundamento por aula</h3>
    <ol class="audit-lessons">
      {#each modules[selected].lessons as lesson}
        {@const entry = current.lessons[lesson.id]}
        {@const source = current.cases[entry.caseIndex]}
        <li>
          <h4>{lesson.title}</h4>
          <p>{entry.gap}</p>
          <a class="study-source" href={href(lesson) + '/caso'}>{entry.title} {@html icon('arrow', 14)}</a>
          <small><a href={source.url} target="_blank" rel="noreferrer">{source.org} · {source.title} {@html icon('external', 12)}</a></small>
        </li>
      {/each}
    </ol>
  </section>
</article>

<style>
  .audit-report {max-width: 1050px}
  .audit-index {display:grid; grid-template-columns:repeat(auto-fit, minmax(min(210px, 100%),1fr)); gap:4px 12px; margin:20px 0}
  .audit-index a {padding:8px; border-radius:6px; display:flex; gap:8px; align-items:baseline}
  .audit-index a:hover, .audit-index a[aria-current] {background:var(--sage); color:var(--sage-ink)}
  .audit-index small, .audit-lessons small {color:var(--muted); font:11px var(--mono)}
  .audit-module {background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:clamp(16px,4vw,42px)}
  .audit-module h2 {scroll-margin-top:calc(var(--header) + 14px);font-size:clamp(24px,3vw,36px); letter-spacing:-.04em}
  .audit-module h3 {font-size:17px; margin:20px 0 6px}
  .audit-module p, .audit-module li {line-height:1.65; max-width:85ch}
  .audit-module ul {padding-left:20px}
  .audit-lessons {list-style:none; padding:0}
  .audit-lessons li {border-top:1px solid var(--line); padding:14px 0}
  .audit-lessons h4 {margin:0 0 3px; font-size:15px}
  .audit-lessons p {color:var(--muted)}
  .audit-lessons .study-source {margin:5px 0; font-weight:580}
  .audit-lessons small {display:block}
  .audit-lessons small a:hover {text-decoration:underline}
</style>
