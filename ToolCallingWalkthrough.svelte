<script>
  import JsonInspector from './JsonInspector.svelte';
  import { icon } from './icons.js';

  let scenario = $state('allowed');
  let cursor = $state(0);
  const request = { name: 'consultar_pedido', arguments: { numero: 42 }, call_id: 'call_42' };
  const result = { status: 'em transporte' };

  let flow = $derived([
    {
      actor: 'Pessoa',
      note: scenario === 'missing' ? 'Onde está meu pedido?' : 'Onde está meu pedido 42?',
      next: 'Enviar ao modelo',
    },
    {
      actor: 'Harness',
      note: 'Envia a pergunta e a descrição de consultar_pedido. A função precisa do número do pedido.',
      next: 'Ver o que o modelo pede',
    },
    ...(scenario === 'missing' ? [
      { actor: 'Modelo', note: 'Qual é o número do seu pedido?' },
    ] : [
      { actor: 'Modelo', note: 'Pede que o aplicativo consulte o pedido 42.', data: request, next: 'Conferir a chamada' },
      { actor: 'Harness', note: scenario === 'denied'
        ? 'A conta conectada não tem acesso. O sistema da loja não recebe a consulta.'
        : 'O número é válido e a conta conectada tem acesso ao pedido.',
        next: scenario === 'denied' ? 'Devolver a recusa ao modelo' : 'Consultar e devolver o resultado' },
      {
        actor: 'Harness',
        note: scenario === 'denied'
          ? 'Informa a recusa com o mesmo identificador da chamada.'
          : 'Consulta o sistema da loja. Devolve o status com o identificador da chamada.',
        data: { call_id: request.call_id, output: scenario === 'denied' ? { error: 'sem acesso' } : result },
        next: 'Mostrar a resposta',
      },
      {
        actor: 'Modelo',
        note: scenario === 'denied'
          ? 'Não consigo consultar esse pedido com a conta atual.'
          : 'Seu pedido 42 está em transporte.',
      },
    ]),
  ]);

  function restart(value = scenario) {
    scenario = value;
    cursor = 0;
  }
</script>

<section class="tool-walkthrough" aria-labelledby="tool-walkthrough-title">
  <h2 id="tool-walkthrough-title">Siga a chamada no chat</h2>
  <p>É um chat simulado. Avance para ver o que cada parte recebe e o que ela faz.</p>
  <label>
    Situação
    <select value={scenario} onchange={event => restart(event.currentTarget.value)}>
      <option value="allowed">Pedido 42 com acesso</option>
      <option value="missing">Pergunta sem número</option>
      <option value="denied">Pedido 42 sem acesso</option>
    </select>
  </label>
  <ol aria-label="Histórico da chamada" aria-live="polite">
    {#each flow.slice(0, cursor + 1) as entry, i}
      <li class:latest={i === cursor}>
        <strong>{entry.actor}</strong>
        <div>
          <p>{entry.note}</p>
          {#if entry.data}
            <details><summary>Ver os dados enviados</summary><JsonInspector value={entry.data} /></details>
          {/if}
        </div>
      </li>
    {/each}
  </ol>
  <div class="tool-actions">
    {#if flow[cursor]?.next}
      <button type="button" class="advance" onclick={() => cursor += 1}>{flow[cursor].next} {@html icon('arrow', 14)}</button>
    {/if}
    {#if cursor > 0}<button type="button" onclick={() => restart()}>Recomeçar</button>{/if}
  </div>
</section>

<style>
  section { background: var(--panel); border: 1px solid var(--edge); border-radius: 8px; margin: 0 0 16px; padding: clamp(14px, 3vw, 24px); }
  h2 { font-size: clamp(20px, 2.4vw, 26px); font-weight: 600; letter-spacing: -.038em; }
  p { font-size: 14px; color: var(--muted); line-height: 1.6; margin: 6px 0; }
  label { display: flex; align-items: center; flex-wrap: wrap; gap: 7px 12px; margin-top: 14px; color: var(--muted); font: 500 11px var(--mono); }
  select,button { padding: 7px 10px; border-radius: 4px; border: 1px solid var(--edge); background: var(--panel); color: var(--ink); max-width: 100%; font: 13px var(--sans); }
  ol { padding: 0; margin: 16px 0; list-style: none; border-block: 1px solid var(--line); }
  li { display: grid; grid-template-columns: 5.5rem minmax(0, 1fr); gap: 3px 10px; padding: 12px; }
  li + li { border-top: 1px solid var(--line); }
  li.latest { background: var(--accent-soft); box-shadow: inset 2px 0 var(--accent-strong); }
  li p { color: var(--ink); margin: 0; }
  strong { padding-top: 3px; color: var(--accent); font: 500 11px/1.5 var(--mono); }
  details { margin-top: 6px; }
  summary { cursor: pointer; color: var(--accent); font-size: 12px; margin-bottom: 6px; }
  .tool-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  button:hover { background: var(--soft); }
  .advance { display: inline-flex; align-items: center; gap: 8px; background: var(--action); color: var(--action-ink); font-weight: 550; }
  .advance:hover { background: color-mix(in srgb, var(--action) 88%, var(--action-ink)); }
  @media (max-width: 450px) { li { grid-template-columns: 1fr; } }
</style>
