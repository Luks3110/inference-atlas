<script>
  import { t } from './i18n.js';
  const paths = [
    {
      name:t('Workflow em código', 'Workflow in code'), steps:[t('Validar pedido', 'Validate order'),t('Consultar banco', 'Query database'),t('Exibir prazo', 'Show delivery estimate')],
      use:t('O banco já tem o prazo. As etapas são conhecidas e o código escolhe a rota.', 'The database already has the delivery estimate. The steps are known, and the code picks the route.'),
      cost:t('Uma consulta. Nenhuma chamada ao modelo para decidir a rota.', 'One query. The code picks the route without a model call.'),
      risk:t('Teste cada condição e o que acontece quando o banco fica fora do ar.', 'Test each condition and what happens when the database goes offline.'),
    },
    {
      name:t('Um agente', 'One agent'), steps:[t('Ler pergunta', 'Read question'),t('Escolher fonte', 'Pick source'),t('Conferir e responder', 'Verify and answer')],
      use:t('A pergunta precisa de pesquisa aberta e as mesmas ferramentas podem resolver do começo ao fim.', 'The question calls for open-ended research, and the same set of tools can handle it from start to finish.'),
      cost:t('O número de chamadas varia. Defina um teto e uma condição de parada.', 'The number of calls varies. Set a cap and a stopping condition.'),
      risk:t('Teste escolha de ferramentas, autorização e resposta quando faltar evidência.', 'Test tool selection, authorization, and how the agent answers when evidence is missing.'),
    },
    {
      name:t('Vários agentes', 'Multiple agents'), steps:[t('Triagem', 'Triage'),t('Logística e políticas', 'Logistics and policies'),t('Junção dos pareceres', 'Combine findings')],
      use:t('A devolução depende de equipes com fontes ou permissões próprias. Cada agente recebe só os dados do seu trabalho.', 'The return involves teams with their own sources or permissions. Each agent gets the data it needs for its part.'),
      cost:t('O supervisor e os especialistas adicionam chamadas. Ramos independentes podem rodar juntos.', 'The supervisor and specialists add calls. Independent branches can run in parallel.'),
      risk:t('Teste delegação errada, trabalho duplicado e o que acontece se um especialista falhar.', 'Test incorrect delegation, duplicate work, and what happens if a specialist fails.'),
    },
    {
      name:t('Workflow com agentes', 'Workflow with agents'), steps:[t('Agente propõe', 'Agent makes a proposal'),t('Workflow espera aprovação', 'Workflow waits for approval'),t('Activity registra', 'Activity records the refund')],
      use:t('O modelo lê documentos e propõe um reembolso. O valor autorizado e a gravação seguem etapas definidas pelo código.', 'The model reads documents and proposes a refund. Code defines the steps for authorizing the amount and recording it.'),
      cost:t('A espera humana pode levar dias. O fluxo guarda o pedido sem manter uma chamada ao modelo aberta.', 'Approval can take days. The workflow saves the request while it waits.'),
      risk:t('Teste aprovação fora do prazo, queda após pagamento e retomada sem pagar duas vezes.', 'Test late approvals, failures after payment, and resuming without paying twice.'),
    },
  ];
  let index = $state(0);
  let path = $derived(paths[index]);
</script>

<section class="architectures" aria-labelledby="architectures-title">
  <h2 id="architectures-title">{t('Quem escolhe o próximo passo?', 'Who picks the next step?')}</h2>
  <div class="choices" role="group" aria-label={t('Escolher arquitetura', 'Choose an architecture')}>
    {#each paths as variant, i}
      <button type="button" aria-pressed={index === i} onclick={() => index=i}>{variant.name}</button>
    {/each}
  </div>
  <div aria-live="polite">
    <ol>{#each path.steps as step}<li>{step}</li>{/each}</ol>
    <p>{path.use}</p>
    <p>{path.cost}</p>
    <p>{path.risk}</p>
  </div>
</section>

<style>
  .architectures {background:var(--panel);border:1px solid var(--line);border-radius:8px;margin-top:14px;padding:clamp(12px,3vw,22px)}
  h2 {font-size:1.13rem;margin-bottom:9px}
  .choices,ol {display:flex;gap:6px;flex-wrap:wrap;margin:8px 0;padding:0}
  button,li {border:1px solid var(--line);padding:6px 8px;border-radius:5px;font-size:13px}
  button[aria-pressed=true] {background:var(--selection);color:var(--selection-ink);font-weight:600}
  li {background:var(--rail);list-style:none}
  li:not(:last-child)::after {content:' →';color:var(--accent)}
  p {line-height:1.5;font-size:14px;margin-top:6px;color:var(--muted)}
</style>
