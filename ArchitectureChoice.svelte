<script>
  const paths = [
    {
      name:'Workflow em código', steps:['Validar pedido','Consultar banco','Exibir prazo'],
      use:'O banco já tem o prazo. As etapas são conhecidas e o código escolhe a rota.',
      cost:'Uma consulta. Nenhuma chamada ao modelo para decidir a rota.',
      risk:'Teste cada condição e o que acontece quando o banco fica fora do ar.',
    },
    {
      name:'Um agente', steps:['Ler pergunta','Escolher fonte','Conferir e responder'],
      use:'A pergunta precisa de pesquisa aberta e as mesmas ferramentas podem resolver do começo ao fim.',
      cost:'O número de chamadas varia. Defina um teto e uma condição de parada.',
      risk:'Teste escolha de ferramentas, autorização e resposta quando faltar evidência.',
    },
    {
      name:'Vários agentes', steps:['Triagem','Logística e políticas','Junção dos pareceres'],
      use:'A devolução depende de equipes com fontes ou permissões próprias. Cada agente recebe só os dados do seu trabalho.',
      cost:'O supervisor e os especialistas adicionam chamadas. Ramos independentes podem rodar juntos.',
      risk:'Teste delegação errada, trabalho duplicado e o que acontece se um especialista falhar.',
    },
    {
      name:'Workflow com agentes', steps:['Agente propõe','Workflow espera aprovação','Activity registra'],
      use:'O modelo lê documentos e propõe um reembolso. O valor autorizado e a gravação seguem etapas definidas pelo código.',
      cost:'A espera humana pode levar dias. O fluxo guarda o pedido sem manter uma chamada ao modelo aberta.',
      risk:'Teste aprovação fora do prazo, queda após pagamento e retomada sem pagar duas vezes.',
    },
  ];
  let index = $state(0);
  let path = $derived(paths[index]);
</script>

<section class="architectures" aria-labelledby="architectures-title">
  <h2 id="architectures-title">Quem escolhe o próximo passo?</h2>
  <div class="choices" role="group" aria-label="Escolher arquitetura">
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
