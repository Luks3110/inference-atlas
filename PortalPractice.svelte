<script>
  let alternate = $state(false);
  let query = $state('42');
  let viewed = $state('');
  let status = $state('');

  function observe(event) {
    event.preventDefault();
    viewed = query.trim();
    status = viewed === '42' ? 'Pedido 42 entregue.' : 'O portal não encontrou esse pedido.';
  }

  function resetLayout() {
    alternate = !alternate;
    viewed = '';
    status = '';
  }
</script>

<section class="portal-practice" aria-labelledby="portal-practice-title">
  <h2 id="portal-practice-title">Encontre o pedido 42 pela tela</h2>
  <p>Faça o papel do executor no portal fictício. Encontre o campo, consulte e confira o número no resultado. Depois mude a posição do botão e tente a mesma tarefa.</p>
  <button type="button" class="layout" onclick={resetLayout}>Trocar layout do portal</button>
  <div class="screen">
    <header>Portal de entregas · versão {alternate ? 'B' : 'A'}</header>
    <form class:alternate onsubmit={observe}>
      <label>Número do pedido <input type="text" inputmode="numeric" bind:value={query}/></label>
      <button type="submit">Consultar entrega</button>
    </form>
    <p role="status">{status || 'Aguardando consulta.'}</p>
    {#if viewed}<button type="button" class="stop" onclick={() => status = 'Ação recusada. A sessão só pode consultar entregas.'}>Tentar encerrar pedido</button>{/if}
  </div>
</section>

<style>
  .portal-practice {padding:clamp(12px,3vw,22px);background:var(--panel);border:1px solid var(--line);border-radius:8px;margin-top:14px}
  h2 {font-size:1.12rem}
  p {margin:8px 0;color:var(--muted);font-size:14px;line-height:1.55}
  .screen {border:1px solid var(--line);border-radius:7px;background:var(--rail);padding:12px;max-width:540px}
  header {font:12px var(--mono);border-bottom:1px solid var(--line);padding-bottom:8px}
  form {display:flex;flex-wrap:wrap;gap:8px;align-items:end;margin:10px 0}
  form.alternate {flex-direction:row-reverse;justify-content:flex-end}
  label {display:grid;font-size:12px;gap:4px}
  input {width:10ch;background:var(--panel);color:var(--ink)}
  input,button {border:1px solid var(--line);border-radius:4px;padding:5px 9px}
  button {background:var(--panel);font-size:13px}
  .layout {margin:4px 0 9px}
  .stop {color:var(--accent)}
</style>
