<script>
  import { tick } from 'svelte';
  import { icon } from './icons.js';
  import JsonInspector from './JsonInspector.svelte';
  import JsonFieldNote from './JsonFieldNote.svelte';
  import { decodeField, formatPath, jsonTokens } from './production/tool-json-fields.js';

  let { value, prefix = '', compact = false, depth = 0, label = '' } = $props();
  const detailId = $props.id();
  let code = $state();
  let inner = $state();
  let active = $state.raw(null);
  let opened = $state.raw(null);
  let pinned = $state(false);
  let copyStatus = $state('');
  let openTimer;
  let closeTimer;
  let restoringFocus = false;
  let tokens = $derived(jsonTokens(value, compact));
  let decoded = $derived(depth === 0 ? decodeField(active?.token.value) : null);
  let format = $derived(prefix ? 'SSE' : 'JSON');

  $effect(() => {
    if (tokens) {
      active = null;
      pinned = false;
      opened = null;
      copyStatus = '';
    }
    return cancelTimers;
  });

  function cancelTimers() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
  }

  function restoreFocus(anchor) {
    restoringFocus = true;
    anchor.focus({ preventScroll: true });
    restoringFocus = false;
  }

  function close(restore = false) {
    cancelTimers();
    if (restore && active) restoreFocus(active.anchor);
    active = null;
    pinned = false;
  }

  function preview(event, token) {
    if (pinned || (event.type === 'pointerenter' && event.pointerType !== 'mouse')
        || (event.type === 'focus' && (restoringFocus || !event.currentTarget.matches(':focus-visible')))) return;
    cancelTimers();
    const anchor = event.currentTarget;
    openTimer = setTimeout(() => {
      active = { token, anchor };
    }, event.type === 'focus' ? 0 : 145);
  }

  function leave(event) {
    clearTimeout(openTimer);
    if (!pinned && active && (event?.type !== 'blur' || event.currentTarget === active.anchor)) {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(close, 180);
    }
  }

  async function toggle(event, token) {
    cancelTimers();
    const anchor = event.currentTarget;
    if (pinned && active?.token === token) {
      close();
      return;
    }
    active = { token, anchor };
    pinned = true;
    if (event.detail === 0) {
      await tick();
      document.getElementById(detailId)?.focus({ preventScroll: true });
    }
  }

  function dismissOutside(event) {
    if (!active || active.anchor.contains(event.target)) return;
    if (!document.getElementById(detailId)?.contains(event.target)) close();
  }

  function dismissWithEscape(event) {
    if (event.key !== 'Escape' || !active || event.defaultPrevented) return;
    if (pinned) {
      const focusInNote = document.getElementById(detailId)?.contains(document.activeElement);
      if (focusInNote || document.activeElement === active.anchor) {
        event.preventDefault();
        close(true);
        return;
      }
    }
    close();
  }

  async function openDecoded() {
    opened = { ...active, value: decoded };
    close();
    await tick();
    inner?.focus({ preventScroll: true });
    inner?.scrollIntoView({ block: 'nearest' });
  }

  function closeDecoded() {
    restoreFocus(opened.anchor);
    opened = null;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(prefix + JSON.stringify(value, null, compact ? 0 : 2));
      copyStatus = 'Copiado';
    } catch {
      copyStatus = 'Selecione o texto para copiar.';
    }
  }
</script>

<svelte:window onpointerdown={dismissOutside} onkeydown={dismissWithEscape} />

<div class="json-inspector">
  <div class="json-code">
    <div class="code-tools">
      <div class="caption">
        <span class="format">{format}</span>
        {#if label}<h3>{label}</h3>{/if}
      </div>
      <button type="button" aria-label={'Copiar ' + format} class="copy" onclick={copy}>
        {@html icon(copyStatus === 'Copiado' ? 'check' : 'copy', 14)}
        <span>{copyStatus === 'Copiado' ? copyStatus : 'Copiar'}</span>
      </button>
      <span role="status" class="sr-only">{copyStatus}</span>
    </div>
    {#if copyStatus && copyStatus !== 'Copiado'}<p class="copy-error">{copyStatus}</p>{/if}
    <pre bind:this={code}><code>{#if prefix}<span class="prefix">{prefix}</span>{/if}{#each tokens as token}{#if token.help}<button
      type="button"
      class="field"
      aria-label={'Explicar ' + formatPath(token.path)}
      aria-pressed={pinned && active?.token === token}
      aria-controls={active?.token === token ? detailId : undefined}
      aria-describedby={active?.token === token ? detailId + '-text' : undefined}
      class:highlighted={active?.token === token}
      onpointerenter={(event) => preview(event, token)}
      onpointerleave={leave}
      onfocus={(event) => preview(event, token)}
      onblur={leave}
      onclick={(event) => toggle(event, token)}
    >{token.text}</button>{:else if token.kind}<span class={token.kind}>{token.text}</span>{:else}{token.text}{/if}{/each}</code></pre>
  </div>

  {#if active && code}
    <JsonFieldNote id={detailId} token={active.token} anchor={active.anchor} boundary={code}
      {pinned} canDecode={decoded !== null} onclose={close} onenter={cancelTimers} onleave={leave}
      ondecode={openDecoded} />
  {/if}

  {#if opened}
    <div class="decoded">
      <div class="decoded-head">
        <h4 tabindex="-1" bind:this={inner}>Dentro de <code>{formatPath(opened.token.path)}</code></h4>
        <button type="button" class="copy" onclick={closeDecoded}>
          {@html icon('close', 14)} Fechar
        </button>
      </div>
      <JsonInspector value={opened.value} depth={depth + 1} />
    </div>
  {/if}
</div>

<style>
  .json-inspector,.json-code,.caption { min-width: 0; }
  .json-code { background: var(--bg); border: 1px solid var(--edge); border-radius: 6px; }
  .code-tools,.decoded-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    min-height: 36px;
    padding: 4px 8px 4px 12px;
    border-bottom: 1px solid var(--line);
    background: var(--rail);
    border-radius: 5px 5px 0 0;
  }
  .caption { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .format {
    color: var(--accent);
    font: 500 10px/1.4 var(--mono);
    letter-spacing: .06em;
  }
  h3 { font-size: 12px; font-weight: 560; overflow-wrap: anywhere; }
  pre {
    padding: 12px;
    margin: 0;
    max-height: min(31rem, 48svh);
    overflow: auto;
    scrollbar-width: thin;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font: 12px/1.75 var(--mono);
  }
  pre code { font: inherit; }
  .prefix,.json-string { color: var(--muted); }
  .json-literal { color: var(--accent); font-weight: 500; }
  .field {
    display: inline;
    border: 0;
    border-radius: 3px;
    padding: 0;
    font: inherit;
    color: var(--accent);
    text-decoration: underline dotted color-mix(in srgb, var(--accent) 55%, transparent);
    text-underline-offset: .24em;
    text-align: inherit;
    transition: color 150ms, background-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out);
  }
  .field:hover,.field.highlighted {
    background: var(--selection);
    color: var(--selection-ink);
    box-shadow: 0 0 0 2px var(--selection);
    text-decoration-color: currentColor;
  }
  .field[aria-pressed='true'] { text-decoration-style: solid; }
  .field:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .copy {
    display: flex;
    align-items: center;
    flex: none;
    gap: 5px;
    padding: 4px 6px;
    border-radius: 4px;
    color: var(--muted);
    font: 500 11px/1.45 var(--mono);
  }
  .copy:hover { background: var(--soft); color: var(--ink); }
  .copy-error { padding: 7px 12px 0; color: var(--muted); font-size: 12px; }
  .decoded {
    margin-top: 10px;
    padding: 0 10px 10px;
    border: 1px solid var(--callout-line);
    border-radius: 6px;
    background: var(--accent-soft);
  }
  .decoded-head { background: transparent; border-bottom: 0; padding-inline: 0; }
  h4 { margin: 0; font-size: 12px; font-weight: 560; overflow-wrap: anywhere; }
  h4 code { color: var(--accent); font: 500 11px var(--mono); }
  @media (prefers-reduced-motion: reduce) {
    .field { transition: none; }
  }
</style>
