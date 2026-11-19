<script>
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
    {#each flow.slice(0, cursor + 1) as entry}
      <li>
        <strong>{entry.actor}</strong>
        <p>{entry.note}</p>
        {#if entry.data}
          <details><summary>Ver os dados enviados</summary><pre>{JSON.stringify(entry.data, null, 2)}</pre></details>
        {/if}
      </li>
    {/each}
  </ol>
  <div class="tool-actions">
    {#if flow[cursor]?.next}
      <button type="button" class="advance" onclick={() => cursor += 1}>{flow[cursor].next}</button>
    {/if}
    {#if cursor > 0}<button type="button" onclick={() => restart()}>Recomeçar</button>{/if}
  </div>
</section>

<style>
  section {background:var(--panel);border:1px solid var(--line);border-radius:8px;margin:0 0 16px;padding:clamp(14px,3vw,23px)}
  h2 {font-size:1.2rem}
  p {font-size:14px;color:var(--muted);line-height:1.55;margin:6px 0}
  label {display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin-top:12px;font-size:14px;font-weight:600}
  select,button {padding:6px 9px;border-radius:5px;border:1px solid var(--line);background:var(--panel);color:var(--ink);max-width:100%;font-size:13px}
  ol {padding:0;margin:12px 0;list-style:none}
  li {background:var(--rail);border-left:2px solid var(--line);border-radius:4px;padding:8px 10px;margin-bottom:7px}
  li:last-child {border-left-color:var(--accent)}
  strong {font-size:13px}
  summary {cursor:pointer;color:var(--accent);font-size:13px}
  pre {font-size:12px;overflow:auto;margin:6px 0 0}
  .tool-actions {display:flex;gap:8px;flex-wrap:wrap}
  .advance {background:var(--sage);color:var(--sage-ink);font-weight:650}
</style>
