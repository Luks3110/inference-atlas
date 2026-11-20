<script module>
  const question = 'Onde está meu pedido 42?';
  const toolRequest = { name: 'consultar_pedido', arguments: { numero: 42 }, call_id: 'call_42' };
  const toolOutput = { call_id: 'call_42', output: { status: 'em transporte' } };
  const toolError = { call_id: 'call_42', output: { error: 'sistema indisponível' } };
  const confirmed = 'Seu pedido 42 está em transporte.';
  const unknown = 'Não consegui confirmar o status do pedido 42.';
  const exercises = {
    0: {
      title: 'O que muda quando o aplicativo envia o status?',
      groups: ['O modelo recebe', 'O modelo responde'],
      options: [
        { label: 'Só a pergunta', rows: [question, 'Ainda não tenho o status do seu pedido 42.'] },
        { label: 'Pergunta e status confirmado', rows: [
          question + ' A loja informou que o pedido 42 está em transporte.', confirmed,
        ] },
      ],
    },
    2: {
      title: 'A ferramenta tem o dado de que precisa?',
      groups: ['A pessoa pergunta', 'O modelo envia ao aplicativo'],
      options: [
        { label: 'Com número', rows: [question, { numero: 42 }] },
        { label: 'Sem número', rows: ['Onde está meu pedido?', 'Qual é o número do seu pedido?'] },
      ],
    },
    3: {
      title: 'Veja o que o modelo devolve para cada mensagem',
      groups: ['Mensagem da pessoa', 'Resposta do modelo ao aplicativo'],
      options: [
        { label: 'Consultar uma entrega', rows: [question, toolRequest] },
        { label: 'Agradecer', rows: ['Obrigado pela ajuda!', 'De nada!'] },
      ],
    },
    4: {
      title: 'Qual chamada chega ao sistema da loja?',
      groups: ['Argumentos recebidos', 'O aplicativo faz'],
      options: [
        { label: 'Número válido e conta com acesso', rows: [{ numero: 42 }, 'Consulta o status do pedido 42.'] },
        { label: 'Número veio como texto', rows: [{ numero: 'quarenta e dois' }, 'Recusa o argumento. O campo exige um inteiro.'] },
        { label: 'Conta sem acesso', rows: [{ numero: 42 }, 'Recusa a chamada. A loja não recebe a consulta.'] },
      ],
    },
    5: {
      title: 'Devolva o resultado da mesma chamada',
      groups: ['O modelo pediu', 'O aplicativo devolve'],
      options: [
        { label: 'Loja informou o status', rows: [toolRequest, toolOutput] },
        { label: 'Sistema da loja indisponível', rows: [toolRequest, toolError] },
      ],
    },
    6: {
      title: 'A resposta acompanha o que a loja informou',
      groups: ['O modelo recebeu', 'A pessoa vê no chat'],
      options: [
        { label: 'Consulta confirmou o status', rows: [toolOutput, confirmed] },
        { label: 'Consulta falhou', rows: [toolError, unknown] },
      ],
    },
  };
</script>

<script>
  import JsonInspector from './JsonInspector.svelte';

  let { index } = $props();
  let selected = $state(0);
  let exercise = $derived(exercises[index]);
  let option = $derived(exercise.options[selected]);
</script>

<section class="tool-step" aria-labelledby="tool-step-title">
  <h2 id="tool-step-title">{exercise.title}</h2>
  <div class="choices" role="group" aria-label="Escolher exemplo">
    {#each exercise.options as {label}, i}
      <button type="button" aria-pressed={selected === i} onclick={() => selected = i}>{label}</button>
    {/each}
  </div>
  <div class="exchange" aria-live="polite">
    {#each exercise.groups as label, i}
      {@const row = option.rows[i]}
      <div class="message">
        <h3>{label}</h3>
        {#if typeof row === 'string'}
          <p>{row}</p>
        {:else}
          <JsonInspector value={row} />
        {/if}
      </div>
    {/each}
  </div>
  <p class="note">Exemplo simulado com o pedido 42.</p>
</section>

<style>
  section { background: var(--panel); border: 1px solid var(--edge); border-radius: 8px; margin-bottom: 16px; padding: clamp(14px,3vw,24px); }
  h2 { margin: 0 0 14px; font-size: clamp(19px, 2vw, 24px); font-weight: 600; letter-spacing: -.035em; }
  .choices { display: flex; gap: 4px; flex-wrap: wrap; border-block: 1px solid var(--line); padding-block: 6px; margin-bottom: 14px; }
  button { border-radius: 4px; padding: 7px 10px; font-size: 13px; color: var(--muted); }
  button:hover { background: var(--soft); color: var(--ink); }
  button[aria-pressed=true] { background: var(--selection); color: var(--selection-ink); font-weight: 600; }
  .exchange { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 10px; }
  .message { min-width: 0; padding: 12px; background: var(--rail); border-left: 2px solid var(--edge); border-radius: 0 5px 5px 0; }
  .message + .message { border-left-color: var(--accent-strong); background: var(--accent-soft); }
  h3 { color: var(--muted); font: 500 11px/1.45 var(--mono); margin: 0 0 6px; }
  p { margin: 0; font-size: 14px; line-height: 1.55; }
  .note { color: var(--muted); font-size: 12px; margin-top: 10px; }
</style>
