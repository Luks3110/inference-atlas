<script>
  import { t } from './i18n.js';
  import { icon } from './icons.js';
  import { modules, lessons, coreLessons } from './curriculum.js';
  import { href, numbered, symbols } from './course-ui.js';
  let { selected, completed, openGroups, onToggle, onSelect, onAudit, onProgress } = $props();
  let coreCompleted = $derived(coreLessons.filter(lesson => completed.has(lesson.id)).length);
  let percent = $derived(Math.round(100 * coreCompleted / coreLessons.length));
</script>

<aside id="sidebar" aria-label={t('Conteúdo do curso', 'Course content')}>
  <div class="sidebar-top">
    <h2>{t('Currículo', 'Curriculum')}</h2>
    <span class="count">{t(`${lessons.length} aulas`, `${lessons.length} lessons`)}</span>
  </div>
  <nav class="module-list" aria-label={t('Módulos do curso', 'Course modules')}>
    {#each modules as group, i (group.title)}
      {#if modules[i - 1]?.phase !== group.phase}
        <h3 class="phase">{t(group.phase)}</h3>
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
          <span class="group-text"><small>{t(`Módulo ${numbered(i + 1)}`, `Module ${numbered(i + 1)}`)}</small><strong>{t(group.title)}</strong></span
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
                >{t(item.title)}
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </nav>
  <a class="sidebar-audit" href="#/auditoria" onclick={onAudit}>{@html icon('notes', 15)} {t('Auditoria do currículo', 'Curriculum audit')}</a>
  <button class="progress-card" data-action="progress" onclick={onProgress}>
    <span class="progress-label">{@html icon('chart', 15)} {t('Seu progresso', 'Your progress')} <b>{percent}%</b></span>
    <span class="track"><i style:width={percent + '%'}></i></span>
    <span class="progress-detail"
      >{t(`${coreCompleted} de ${coreLessons.length} aulas da trilha`, `${coreCompleted} of ${coreLessons.length} track lessons`)} {@html icon('chevron', 12)}</span
    >
  </button>
</aside>

<style>
  .phase {margin:16px 7px 5px;color:var(--muted);font:500 11px var(--mono)}
  .phase:first-child {margin-top:0}
  .sidebar-audit {display:flex;align-items:center;gap:8px;padding:8px 16px;color:var(--accent);font-size:13px}
  .sidebar-audit:hover {text-decoration:underline}
</style>
