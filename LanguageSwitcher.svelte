<script>
  import { getLocale, switchLocale } from './i18n.js';
  import { m } from './paraglide/messages.js';
</script>

<select aria-label={m.language()} value={getLocale()} onchange={event => switchLocale(event.currentTarget.value)}>
  <option value="pt-BR" lang="pt-BR">Português</option>
  <option value="en" lang="en">English</option>
</select>

<style>
  select {
    max-width: 100%;
    height: 34px;
    padding: 0 5px 0 8px;
    border: 1px solid var(--edge);
    border-radius: 4px;
    background: var(--panel);
    color: var(--ink);
    font-size: 12px;
  }
  @media (max-width: 460px) {
    select { width: 78px; padding-left: 5px; font-size: 11px; }
  }
  @media (max-width: 380px) {
    select { width: 73px; }
  }
</style>
