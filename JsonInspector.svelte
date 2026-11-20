<script>
  import { tick } from 'svelte';
  import JsonInspector from './JsonInspector.svelte';
  import { decodeField, formatPath, jsonTokens } from './production/tool-json-fields.js';

  let { value, prefix = '', compact = false, depth = 0 } = $props();
  const detailId = $props.id();
  let note;
  let selected = $state.raw(null);
  let copyStatus = $state('');
  let tokens = $derived(jsonTokens(value, compact));
  let decoded = $derived(decodeField(selected?.value));

  $effect(() => {
    if (tokens) {
      selected = null;
      copyStatus = '';
    }
  });

  async function explain(token) {
    selected = selected === token ? null : token;
    if (!selected) return;
    await tick();
    if (selected === token) note.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(prefix + JSON.stringify(value, null, compact ? 0 : 2));
      copyStatus = prefix ? 'Evento copiado.' : 'JSON copiado.';
    } catch {
      copyStatus = 'Selecione o texto do bloco para copiar.';
    }
  }
</script>

<div class="json-inspector">
  <div class="json-code">
    <pre><code>{prefix}{#each tokens as token}{#if token.help}<button
      type="button"
      class="field"
      aria-label={'Explicar ' + formatPath(token.path)}
      aria-pressed={selected === token}
      aria-controls={detailId}
      title={token.help}
      onclick={() => explain(token)}
    >{token.text}</button>{:else}{token.text}{/if}{/each}</code></pre>
    <div class="code-tools">
      <button type="button" onclick={copy}>{prefix ? 'Copiar SSE' : 'Copiar JSON'}</button>
      {#if copyStatus}<span role="status">{copyStatus}</span>{/if}
    </div>
  </div>
  <div id={detailId} bind:this={note} class:field-note={selected !== null} aria-live="polite">
    {#if selected}
      <strong>{formatPath(selected.path)}</strong>
      <p>{selected.help}</p>
    {/if}
  </div>
  {#if selected && decoded && depth === 0}
    {#key selected}
      <details class="decoded">
        <summary>Ver o JSON dentro desta string</summary>
        <JsonInspector value={decoded} depth={depth + 1} />
      </details>
    {/key}
  {/if}
</div>

<style>
  .json-inspector,.json-code { min-width:0 }
  .json-code { background:var(--rail);border:1px solid var(--line);border-radius:6px }
  pre { padding:10px;margin:0;max-height:min(31rem, 48svh);overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere }
  pre code { font:12px/1.65 var(--mono);color:var(--ink) }
  .field { display:inline;border:0;border-radius:2px;padding:0;font:inherit;color:var(--accent);background:none;text-decoration:underline dotted;text-underline-offset:.22em;text-align:inherit }
  .field:hover,.field[aria-pressed=true] { background:var(--sage);color:var(--sage-ink) }
  .field:focus-visible,.code-tools button:focus-visible { outline:2px solid var(--accent);outline-offset:2px }
  .code-tools { display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;border-top:1px solid var(--line);padding:4px 9px;font-size:11px;color:var(--muted) }
  .code-tools button { padding:3px;color:var(--ink);font:inherit }
  .field-note { margin-top:6px;padding:8px 10px;border-left:2px solid var(--accent);background:var(--rail);border-radius:4px }
  strong { font:500 12px/1.4 var(--mono);overflow-wrap:anywhere }
  .field-note p { margin:3px 0 0;font-size:13px;line-height:1.55;color:var(--ink) }
  .decoded { margin-top:8px }
  .decoded summary { font-size:13px;cursor:pointer;color:var(--accent);margin-bottom:5px }
</style>
