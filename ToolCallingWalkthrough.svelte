<script>
  import { t } from './i18n.js';
  import JsonInspector from './JsonInspector.svelte';
  import { icon } from './icons.js';

  let scenario = $state('allowed');
  let cursor = $state(0);
  const request = { name: 'consultar_pedido', arguments: { numero: 42 }, call_id: 'call_42' };
  const result = { status: 'em transporte' };

  let flow = $derived([
    {
      actor: t('Pessoa', 'Person'),
      note: scenario === 'missing' ? t('Onde está meu pedido?', 'Where is my order?') : t('Onde está meu pedido 42?', 'Where is my order 42?'),
      next: t('Enviar ao modelo', 'Send to the model'),
    },
    {
      actor: 'Harness',
      note: t('Envia a pergunta e a descrição de consultar_pedido. A função precisa do número do pedido.', 'Sends the question and the description of consultar_pedido. The function needs the order number.'),
      next: t('Ver o que o modelo pede', 'See what the model requests'),
    },
    ...(scenario === 'missing' ? [
      { actor: t('Modelo', 'Model'), note: t('Qual é o número do seu pedido?', 'What\'s your order number?') },
    ] : [
      { actor: t('Modelo', 'Model'), note: t('Pede que o aplicativo consulte o pedido 42.', 'Asks the app to look up order 42.'), data: request, next: t('Conferir a chamada', 'Check the call') },
      { actor: 'Harness', note: scenario === 'denied'
        ? t('A conta conectada não tem acesso. O sistema da loja não recebe a consulta.', 'The signed-in account lacks access. The lookup stops before it reaches the store\'s system.')
        : t('O número é válido e a conta conectada tem acesso ao pedido.', 'The order number is valid, and the signed-in account can access the order.'),
        next: scenario === 'denied' ? t('Devolver a recusa ao modelo', 'Return the refusal to the model') : t('Consultar e devolver o resultado', 'Look up the order and return the result') },
      {
        actor: 'Harness',
        note: scenario === 'denied'
          ? t('Informa a recusa com o mesmo identificador da chamada.', 'Reports the refusal using the same call ID.')
          : t('Consulta o sistema da loja. Devolve o status com o identificador da chamada.', 'Checks the store\'s system and returns the status with the call ID.'),
        data: { call_id: request.call_id, output: scenario === 'denied' ? { error: 'sem acesso' } : result },
        next: t('Mostrar a resposta', 'Show the reply'),
      },
      {
        actor: t('Modelo', 'Model'),
        note: scenario === 'denied'
          ? t('Não consigo consultar esse pedido com a conta atual.', 'I can\'t look up this order with the current account.')
          : t('Seu pedido 42 está em transporte.', 'Your order 42 is in transit.'),
      },
    ]),
  ]);

  function restart(value = scenario) {
    scenario = value;
    cursor = 0;
  }
</script>

<section class="tool-walkthrough" aria-labelledby="tool-walkthrough-title">
  <h2 id="tool-walkthrough-title">{t('Siga a chamada no chat', 'Follow the call in the chat')}</h2>
  <p>{t('É um chat simulado. Avance para ver o que cada parte recebe e o que ela faz.', 'This is a simulated chat. Step through it to see what each participant receives and does.')}</p>
  <label>
    {t('Situação', 'Scenario')}
    <select value={scenario} onchange={event => restart(event.currentTarget.value)}>
      <option value="allowed">{t('Pedido 42 com acesso', 'Order 42 with access')}</option>
      <option value="missing">{t('Pergunta sem número', 'Question without an order number')}</option>
      <option value="denied">{t('Pedido 42 sem acesso', 'Order 42 without access')}</option>
    </select>
  </label>
  <ol aria-label={t('Histórico da chamada', 'Call history')} aria-live="polite">
    {#each flow.slice(0, cursor + 1) as entry, i}
      <li class:latest={i === cursor}>
        <strong>{entry.actor}</strong>
        <div>
          <p>{entry.note}</p>
          {#if entry.data}
            <details><summary>{t('Ver os dados enviados', 'View the data sent')}</summary><JsonInspector value={entry.data} /></details>
          {/if}
        </div>
      </li>
    {/each}
  </ol>
  <div class="tool-actions">
    {#if flow[cursor]?.next}
      <button type="button" class="advance" onclick={() => cursor += 1}>{flow[cursor].next} {@html icon('arrow', 14)}</button>
    {/if}
    {#if cursor > 0}<button type="button" onclick={() => restart()}>{t('Recomeçar', 'Start over')}</button>{/if}
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
