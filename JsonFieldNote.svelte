<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { icon } from './icons.js';
  import { formatPath } from './production/tool-json-fields.js';

  let { id, token, anchor, boundary, pinned, canDecode, onclose, onenter, onleave, ondecode } = $props();
  let note = $state();
  let side = $state('below');
  let path = $derived(formatPath(token.path.slice(0, -1)));
  const motion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;

  function position() {
    const key = anchor.getBoundingClientRect();
    const code = boundary.getBoundingClientRect();
    const margin = 12;
    const gap = 9;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const header = document.getElementById('topbar')?.getBoundingClientRect().bottom ?? 0;
    const top = Math.max(0, header) + margin;

    if (key.bottom <= Math.max(code.top, header) || key.top >= Math.min(code.bottom, height)
      || key.right <= Math.max(code.left, 0) || key.left >= Math.min(code.right, width)) {
      onclose(false);
      return;
    }

    const keyCenter = key.left + key.width / 2;
    const left = Math.min(Math.max(margin, keyCenter - 32), width - note.offsetWidth - margin);
    const below = height - key.bottom - gap - margin;
    const above = key.top - gap - top;
    const placeBelow = below >= note.offsetHeight || below >= above;
    side = placeBelow ? 'below' : 'above';
    note.style.setProperty('--tip-x', `${Math.max(12, Math.min(note.offsetWidth - 12, keyCenter - left))}px`);
    note.style.left = `${left}px`;
    note.style.top = `${Math.max(top, placeBelow ? key.bottom + gap : key.top - gap - note.offsetHeight)}px`;
  }

  onMount(() => {
    note.showPopover?.();
    position();
    const observer = new ResizeObserver(position);
    observer.observe(note);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  });

  $effect(() => {
    if (note) position();
  });
</script>

<div
  bind:this={note}
  {id}
  class="field-note"
  data-side={side}
  role={pinned ? 'region' : 'tooltip'}
  tabindex="-1"
  aria-label={pinned ? 'Campo ' + token.key : undefined}
  aria-describedby={pinned ? id + '-text' : undefined}
  popover="manual"
  onpointerenter={onenter}
  onpointerleave={onleave}
>
  <div class="note-body" in:fly={{ y: 5, duration: motion, easing: quintOut }} out:fly={{ y: 3, duration: motion / 2 }}>
    <div class="note-head">
      <div class="note-identity">
        {#if path}<span class="path">{path}</span>{/if}
        <strong>{token.key}</strong>
      </div>
      {#if pinned}
        <button class="close" type="button" aria-label="Fechar explicação" onclick={() => onclose(true)}>
          {@html icon('close', 16)}
        </button>
      {/if}
    </div>
    <p id={id + '-text'}>{token.help}</p>
    {#if canDecode}
      <div class="note-footer">
        {#if pinned}
          <button class="decode" type="button" onclick={ondecode}>
            {@html icon('code', 15)} Abrir JSON desta string {@html icon('arrow', 14)}
          </button>
        {:else}
          Clique no campo para abrir o JSON desta string.
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .field-note {
    --note-surface: color-mix(in srgb, var(--panel) 97%, var(--accent));
    position: fixed;
    inset: auto;
    width: min(22rem, calc(100vw - 24px));
    overflow: visible;
    padding: 0;
    margin: 0;
    border: 0;
    background: transparent;
    color: var(--ink);
  }
  .field-note:focus { outline: none; }
  .field-note:focus-visible .note-body { border-color: var(--accent); }
  .note-body {
    position: relative;
    border: 1px solid var(--callout-line);
    border-radius: 8px;
    background: var(--note-surface);
    box-shadow: 0 2px 4px var(--shadow), 0 14px 32px var(--shadow);
  }
  .note-body::before {
    content: '';
    position: absolute;
    left: calc(var(--tip-x, 32px) - 5px);
    width: 10px;
    height: 10px;
    background: var(--note-surface);
    transform: rotate(45deg);
  }
  .field-note[data-side='below'] .note-body::before {
    top: -5px;
    border-top: 1px solid var(--callout-line);
    border-left: 1px solid var(--callout-line);
  }
  .field-note[data-side='above'] .note-body::before {
    bottom: -5px;
    border-bottom: 1px solid var(--callout-line);
    border-right: 1px solid var(--callout-line);
  }
  .note-head {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 8px;
    padding: 10px 12px 0 14px;
  }
  .note-identity { min-width: 0; overflow-wrap: anywhere; }
  .path {
    display: block;
    margin-bottom: 2px;
    font: 11px/1.5 var(--mono);
    color: var(--subtle);
  }
  strong { font: 600 14px/1.4 var(--mono); color: var(--accent); }
  p {
    padding: 5px 14px 13px;
    font-size: 13px;
    line-height: 1.55;
    text-wrap: pretty;
  }
  .close {
    display: grid;
    place-items: center;
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    margin: -2px -4px -2px 0;
    color: var(--muted);
  }
  .close:hover { background: var(--soft); color: var(--ink); }
  .note-footer {
    padding: 8px 14px;
    border-top: 1px solid var(--line);
    color: var(--muted);
    font-size: 12px;
  }
  .decode {
    display: flex;
    gap: 7px;
    align-items: center;
    min-height: 28px;
    width: 100%;
    padding: 0;
    text-align: left;
    color: var(--accent);
    font-weight: 550;
  }
  .decode:hover { text-decoration: underline; text-underline-offset: 3px; }
  .decode :global(.icon:last-child) { margin-left: auto; }
</style>
