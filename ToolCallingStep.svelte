<script module>
  import { t } from './i18n.js';
  const question = t('Onde está meu pedido 42?', 'Where is my order 42?');
  const toolRequest = { name: 'consultar_pedido', arguments: { numero: 42 }, call_id: 'call_42' };
  const toolOutput = { call_id: 'call_42', output: { status: 'em transporte' } };
  const toolError = { call_id: 'call_42', output: { error: 'sistema indisponível' } };
  const confirmed = t('Seu pedido 42 está em transporte.', 'Your order 42 is in transit.');
  const unknown = t('Não consegui confirmar o status do pedido 42.', 'I couldn\'t confirm the status of order 42.');
  const exercises = {
    0: {
      title: t('O que muda quando o aplicativo envia o status?', 'What changes when the app sends the status?'),
      groups: [t('O modelo recebe', 'The model receives'), t('O modelo responde', 'The model replies')],
      options: [
        { label: t('Só a pergunta', 'Question only'), rows: [question, t('Ainda não tenho o status do seu pedido 42.', 'I don\'t have the status of order 42 yet.')] },
        { label: t('Pergunta e status confirmado', 'Question and confirmed status'), rows: [
          question + t(' A loja informou que o pedido 42 está em transporte.', ' The store reported that order 42 is in transit.'), confirmed,
        ] },
      ],
    },
    2: {
      title: t('A ferramenta tem o dado de que precisa?', 'Does the tool have the information it needs?'),
      groups: [t('A pessoa pergunta', 'The person asks'), t('O modelo envia ao aplicativo', 'The model sends to the app')],
      options: [
        { label: t('Com número', 'With an order number'), rows: [question, { numero: 42 }] },
        { label: t('Sem número', 'Without an order number'), rows: [t('Onde está meu pedido?', 'Where is my order?'), t('Qual é o número do seu pedido?', 'What\'s your order number?')] },
      ],
    },
    3: {
      title: t('Veja o que o modelo devolve para cada mensagem', 'See what the model returns for each message'),
      groups: [t('Mensagem da pessoa', 'Message from the person'), t('Resposta do modelo ao aplicativo', 'Model response to the app')],
      options: [
        { label: t('Consultar uma entrega', 'Check a delivery'), rows: [question, toolRequest] },
        { label: t('Agradecer', 'Say thanks'), rows: [t('Obrigado pela ajuda!', 'Thanks for your help!'), t('De nada!', 'You\'re welcome!')] },
      ],
    },
    4: {
      title: t('Qual chamada chega ao sistema da loja?', 'Which call reaches the store\'s system?'),
      groups: [t('Argumentos recebidos', 'Arguments received'), t('O aplicativo faz', 'What the app does')],
      options: [
        { label: t('Número válido e conta com acesso', 'Valid order number and authorized account'), rows: [{ numero: 42 }, t('Consulta o status do pedido 42.', 'Checks the status of order 42.')] },
        { label: t('Número veio como texto', 'Order number came in as text'), rows: [{ numero: 'quarenta e dois' }, t('Recusa o argumento. O campo exige um inteiro.', 'Rejects the argument. The field requires an integer.')] },
        { label: t('Conta sem acesso', 'Account without access'), rows: [{ numero: 42 }, t('Recusa a chamada. A loja não recebe a consulta.', 'Rejects the call before it reaches the store.')] },
      ],
    },
    5: {
      title: t('Devolva o resultado da mesma chamada', 'Return the result of the same call'),
      groups: [t('O modelo pediu', 'The model requested'), t('O aplicativo devolve', 'The app returns')],
      options: [
        { label: t('Loja informou o status', 'Store reported the status'), rows: [toolRequest, toolOutput] },
        { label: t('Sistema da loja indisponível', 'Store\'s system is unavailable'), rows: [toolRequest, toolError] },
      ],
    },
    6: {
      title: t('A resposta acompanha o que a loja informou', 'The reply reflects what the store reported'),
      groups: [t('O modelo recebeu', 'The model received'), t('A pessoa vê no chat', 'The person sees in chat')],
      options: [
        { label: t('Consulta confirmou o status', 'Lookup confirmed the status'), rows: [toolOutput, confirmed] },
        { label: t('Consulta falhou', 'Lookup failed'), rows: [toolError, unknown] },
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
  <div class="choices" role="group" aria-label={t('Escolher exemplo', 'Choose an example')}>
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
  <p class="note">{t('Exemplo simulado com o pedido 42.', 'Simulated example using order 42.')}</p>
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
