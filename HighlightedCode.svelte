<script module>
  import hljs from 'highlight.js/lib/core';
  import bash from 'highlight.js/lib/languages/bash';
  import javascript from 'highlight.js/lib/languages/javascript';
  import json from 'highlight.js/lib/languages/json';
  import markdown from 'highlight.js/lib/languages/markdown';
  import python from 'highlight.js/lib/languages/python';
  import sql from 'highlight.js/lib/languages/sql';
  import typescript from 'highlight.js/lib/languages/typescript';

  hljs.registerLanguage('bash', bash);
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('json', json);
  hljs.registerLanguage('markdown', markdown);
  hljs.registerLanguage('python', python);
  hljs.registerLanguage('sql', sql);
  hljs.registerLanguage('typescript', typescript);
</script>

<script>
  let { source, language, element = $bindable() } = $props();
  let highlighted = $derived(language && hljs.highlight(source, { language, ignoreIllegals: true }).value);
</script>

<code class="syntax" bind:this={element}>{#if highlighted}{@html highlighted}{:else}{source}{/if}</code>

<style>
  .syntax {
    --syntax-keyword: #a82035;
    --syntax-value: #175a96;
    --syntax-string: #234574;
    --syntax-name: #6941a5;
    --syntax-comment: #65636c;
  }

  :global(:root[data-theme='dark']) .syntax {
    --syntax-keyword: #ff9c95;
    --syntax-value: #91c7ff;
    --syntax-string: #c0d9f8;
    --syntax-name: #d5b8fc;
    --syntax-comment: #aaa5b0;
  }

  .syntax :global(.hljs-keyword),
  .syntax :global(.hljs-selector-tag),
  .syntax :global(.hljs-bullet) { color: var(--syntax-keyword); }

  .syntax :global(.hljs-number),
  .syntax :global(.hljs-literal),
  .syntax :global(.hljs-variable),
  .syntax :global(.hljs-property),
  .syntax :global(.hljs-attr) { color: var(--syntax-value); }

  .syntax :global(.hljs-string),
  .syntax :global(.hljs-regexp) { color: var(--syntax-string); }

  .syntax :global(.hljs-title),
  .syntax :global(.hljs-built_in),
  .syntax :global(.hljs-type) { color: var(--syntax-name); }

  .syntax :global(.hljs-comment),
  .syntax :global(.hljs-quote) { color: var(--syntax-comment); }
</style>
