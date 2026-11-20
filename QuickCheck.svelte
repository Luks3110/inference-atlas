<script module>
  const questions = {
    0: {
      question: 'Em que momento você começa a medir a espera de quem usa o chat?',
      choices: ['Quando o navegador envia o pedido.', 'Quando a GPU começa as contas.'],
      feedback: [
        'Isso. A rede e a fila já fazem parte da espera, mesmo antes de a GPU começar.',
        'Se começar na GPU, você deixa de contar a viagem pela rede e o tempo na fila.',
      ],
    },
    1: {
      question: 'A pergunta tem nove tokens. Por que o modelo recebe trinta?',
      choices: ['Porque o servidor inclui a instrução e as marcas da conversa.', 'Porque o navegador já inclui a primeira parte da resposta.'],
      feedback: [
        'Isso. A instrução e as marcas de quem fala também viram tokens. As trinta posições descrevem a entrada.',
        'A geração da resposta ainda nem começou. Os outros tokens vêm da instrução e das marcas de quem fala.',
      ],
    },
    6: {
      question: 'A GPU termina aos 76 ms. O navegador recebe a letra aos 90 ms. O que você registra como espera no navegador?',
      choices: ['76 ms, quando a GPU escolhe a letra.', '90 ms, quando a letra chega ao navegador.'],
      feedback: [
        'A GPU já produziu a letra, mas quem usa o chat ainda espera mais 14 ms.',
        'Isso. O relógio do navegador vai do envio até o recebimento do primeiro token.',
      ],
    },
  };
</script>

<script>
  let { index } = $props();
  let selected = $state(null);
  let exercise = $derived(questions[index]);
</script>

{#if exercise}
  <fieldset>
    <legend>{exercise.question}</legend>
    {#each exercise.choices as choice, i}
      <button type="button" aria-pressed={selected === i} onclick={() => selected = i}>{choice}</button>
    {/each}
    <p role="status">{selected === null ? '' : exercise.feedback[selected]}</p>
  </fieldset>
{/if}

<style>
  fieldset {border:1px solid var(--line);background:var(--rail);border-radius:8px;margin:18px 0 0;padding:10px 14px;min-width:0}
  legend {font-weight:600;font-size:14px;max-width:64ch}
  button {display:block;text-align:left;padding:7px 9px;margin:5px 0;border:1px solid var(--line);background:var(--panel);border-radius:5px;font-size:13px}
  button[aria-pressed=true] {background:var(--selection);color:var(--selection-ink);border-color:var(--subtle)}
  p {color:var(--muted);font-size:13px;margin-top:6px;line-height:1.5}
</style>
