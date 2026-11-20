<script>
  import { t } from './i18n.js';
  import { findTerms } from './production/course-terms.js';

  let { text, label = t('Termos usados aqui', 'Terms used here') } = $props();
  let terms = $derived(findTerms(text));
</script>

{#if terms.length}
  <details class="course-terms">
    <summary>{label}</summary>
    <dl>
      {#each terms as [name, meaning]}
        <div><dt>{t(name)}</dt><dd>{t(meaning)}</dd></div>
      {/each}
    </dl>
  </details>
{/if}

<style>
  details {margin:12px 0;color:var(--muted);font-size:14px}
  summary {cursor:pointer;color:var(--accent);width:fit-content}
  dl {display:grid;gap:8px;margin:8px 0;padding:10px 12px;border-radius:6px;background:var(--rail)}
  dt {color:var(--ink);font-weight:600}
  dd {margin:3px 0 0;line-height:1.55}
</style>
