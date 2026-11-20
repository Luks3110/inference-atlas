<script>
  import { icon } from './icons.js';
  import { modules, lessons, coreLessons } from './curriculum.js';
  import { href, numbered, symbols } from './course-ui.js';
  let { selected, completed, openGroups, onToggle, onSelect, onAudit, onProgress } = $props();
  let coreCompleted = $derived(coreLessons.filter(lesson => completed.has(lesson.id)).length);
  let percent = $derived(Math.round(100 * coreCompleted / coreLessons.length));
</script>

<aside id="sidebar" aria-label="Conteúdo do curso">
  <div class="sidebar-top">
    <h2>Currículo</h2>
    <span class="count">{lessons.length} aulas</span>
  </div>
  <nav class="module-list" aria-label="Módulos do curso">
    {#each modules as group, i (group.title)}
      {#if modules[i - 1]?.phase !== group.phase}
        <h3 class="phase">{group.phase}</h3>
      {/if}
      <section class="group">
        <button
          class="group-toggle"
          data-group={i}
          aria-expanded={openGroups.has(i)}
          aria-controls={'group-' + i}
          onclick={() => onToggle(i)}
        >
          <span class="module-symbol">{@html icon(symbols[i], 17)}</span>
          <span class="group-text"><small>Módulo {numbered(i + 1)}</small><strong>{group.title}</strong></span
          >
          <span class="fold">{@html icon('chevron', 13)}</span>
        </button>
        <ul id={'group-' + i} hidden={!openGroups.has(i)}>
          {#each group.lessons as item (item.id)}
            <li>
              <a
                href={href(item)}
                aria-current={selected === item.id ? 'page' : undefined}
                onclick={onSelect}
              >
                <span class="lesson-dot" class:done={completed.has(item.id)}
                  >{#if completed.has(item.id)}{@html icon('check', 10)}{/if}</span
                >{item.title}
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </nav>
  <a class="sidebar-audit" href="#/auditoria" onclick={onAudit}>{@html icon('notes', 15)} Auditoria do currículo</a>
  <button class="progress-card" data-action="progress" onclick={onProgress}>
    <span class="progress-label">{@html icon('chart', 15)} Seu progresso <b>{percent}%</b></span>
    <span class="track"><i style:width={percent + '%'}></i></span>
    <span class="progress-detail"
      >{coreCompleted} de {coreLessons.length} aulas da trilha {@html icon('chevron', 12)}</span
    >
  </button>
</aside>

<style>
  .phase {margin:16px 7px 5px;color:var(--muted);font:500 11px var(--mono)}
  .phase:first-child {margin-top:0}
  .sidebar-audit {display:flex;align-items:center;gap:8px;padding:8px 16px;color:var(--accent);font-size:13px}
  .sidebar-audit:hover {text-decoration:underline}
</style>
