<script module>
  import { t } from './i18n.js';
  const questions = {
    0: {
      question: t('Em que momento você começa a medir a espera de quem usa o chat?', 'When do you start measuring how long someone waits for a chat response?'),
      choices: [t('Quando o navegador envia o pedido.', 'When the browser sends the request.'), t('Quando a GPU começa as contas.', 'When the GPU starts computing.')],
      feedback: [
        t('Isso. A rede e a fila já fazem parte da espera, mesmo antes de a GPU começar.', 'Right. Network and queue time count toward the wait before the GPU starts.'),
        t('Se começar na GPU, você deixa de contar a viagem pela rede e o tempo na fila.', 'Starting at the GPU leaves out network travel and queue time.'),
      ],
    },
    1: {
      question: t('A pergunta tem nove tokens. Por que o modelo recebe trinta?', 'The question has nine tokens. Why does the model receive thirty?'),
      choices: [t('Porque o servidor inclui a instrução e as marcas da conversa.', 'Because the server includes the instruction and conversation markers.'), t('Porque o navegador já inclui a primeira parte da resposta.', 'Because the browser already includes the first part of the answer.')],
      feedback: [
        t('Isso. A instrução e as marcas de quem fala também viram tokens. As trinta posições descrevem a entrada.', 'Right. The instruction and speaker markers become tokens too. All thirty positions are input tokens.'),
        t('A geração da resposta ainda nem começou. Os outros tokens vêm da instrução e das marcas de quem fala.', 'The answer hasn\'t started generating yet. The other tokens come from the instruction and speaker markers.'),
      ],
    },
    6: {
      question: t('A GPU termina aos 76 ms. O navegador recebe a letra aos 90 ms. O que você registra como espera no navegador?', 'The GPU finishes at 76 ms. The browser receives the letter at 90 ms. What wait time do you record in the browser?'),
      choices: [t('76 ms, quando a GPU escolhe a letra.', '76 ms, when the GPU selects the letter.'), t('90 ms, quando a letra chega ao navegador.', '90 ms, when the letter reaches the browser.')],
      feedback: [
        t('A GPU já produziu a letra, mas quem usa o chat ainda espera mais 14 ms.', 'The GPU has produced the letter. The person using the chat waits another 14 ms.'),
        t('Isso. O relógio do navegador vai do envio até o recebimento do primeiro token.', 'Right. The browser measures from sending the request to receiving the first token.'),
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
