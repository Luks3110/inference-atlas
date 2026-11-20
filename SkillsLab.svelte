<script>
  import { t } from './i18n.js';
  import { decide, evaluate, summarize } from './public/labs/skills/avaliacao.mjs';

  let usePurchaseDate = $state(true);
  let allowWrite = $state(false);
  const baseline = summarize(evaluate(input => decide(input, {usePurchaseDate:false,allowWrite:false})));
  let results = $derived(evaluate(input => decide(input, {usePurchaseDate,allowWrite})));
  let score = $derived(summarize(results));
  const caseLabels = {
    'Compra de maio, 20 dias atrás': 'May purchase, 20 days ago',
    'Compra de junho, 20 dias atrás': 'June purchase, 20 days ago',
    'A compra ainda está dentro do prazo': 'Purchase is still within the return window',
    'Pedido sem data de compra': 'Order without a purchase date',
    'Item personalizado': 'Custom item',
    'Pergunta sobre horário de entrega': 'Question about delivery time',
  };
  const decisions = {
    aceitar:t('Aceitar', 'Accept'), recusar:t('Recusar', 'Refuse'), 'pedir-dado':t('Pedir a data', 'Ask for the date'), 'outra-rota':t('Encaminhar à entrega', 'Route to delivery'),
  };
</script>

<section class="skill-lab" aria-labelledby="skills-lab-title">
  <h2 id="skills-lab-title">{t('A skill aplica a política certa?', 'Does the skill apply the right policy?')}</h2>
  <p>{t('Em maio, a loja aceitava devoluções em até 30 dias. Em junho, a regra caiu para 14 dias. Teste qual regra a skill consulta. A primeira versão usa sempre a regra mais recente.', 'In May, the store accepted returns within 30 days. In June, that window shrank to 14 days. Test which rule the skill looks up. The first version always uses the latest rule.')}</p>
  <div class="settings">
    <label><input type="checkbox" bind:checked={usePurchaseDate}/> {t('Consultar a regra válida na data da compra', 'Look up the rule in effect on the purchase date')}</label>
    <label><input type="checkbox" bind:checked={allowWrite}/> {t('Simular acesso indevido à ferramenta de reembolso', 'Simulate unauthorized access to the refund tool')}</label>
  </div>
  <p class="score" aria-live="polite">
    {t(
      `${score.correct} de ${results.length} decisões corretas · ${score.violations} erros no uso de ferramentas`,
      `${score.correct} of ${results.length} correct decisions · ${score.violations} tool-use errors`,
    )} ·
    <strong>{score.passes ? t('Passou no teste', 'Test passed') : t('Publicação bloqueada', 'Publication blocked')}</strong>
  </p>
  <p class="baseline">{t(
    `Primeira versão · ${baseline.correct} de ${results.length} decisões corretas.`,
    `First version · ${baseline.correct} of ${results.length} correct decisions.`,
  )}</p>
  <ul>
    {#each results as result (result.label)}
      <li>
        <strong>{t(result.label, caseLabels[result.label])}</strong>
        <span>{decisions[result.actual.decision]}{result.actual.policy ? ' · ' + result.actual.policy : ''}</span>
        {#if !result.correct}<span class="failed">{t('Esperado: ', 'Expected: ')}{decisions[result.expected.decision]} · {result.expected.policy}</span>{/if}
        {#if !result.allowed}<span class="failed">{t(
          `Chamou ${result.actual.tool}. O teste esperava ${result.expected.tool ?? 'nenhuma chamada'}.`,
          `Called ${result.actual.tool}. The test expected ${result.expected.tool ?? 'no tool call'}.`,
        )}</span>{/if}
      </li>
    {/each}
  </ul>
  <p class="baseline">{t('A simulação roda regras fixas no navegador. Os casos e o avaliador podem ser reaproveitados para testar a saída de um agente real.', 'The simulation runs fixed rules in the browser. You can reuse the cases and evaluator to test a real agent\'s output.')}</p>
  <div class="downloads">
    <a href="/labs/skills/SKILL.md" download>{t('Baixar a skill', 'Download the skill')}</a>
    <a href="/labs/skills/avaliacao.mjs" download>{t('Baixar casos e avaliador', 'Download the test cases and evaluator')}</a>
    <a href="#/aula/skills-com-evals/5">{t('Ler a aula sobre checagens', 'Read the lesson on checks')}</a>
  </div>
</section>

<style>
  .skill-lab {background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:clamp(14px,3vw,26px);min-width:0}
  h2 {font-size:1.25rem;margin:0 0 8px}
  p {margin:0;color:var(--muted);line-height:1.55;max-width:70ch}
  .settings,.downloads {display:flex;gap:8px 16px;flex-wrap:wrap;margin:14px 0}
  label {display:flex;gap:7px;align-items:baseline;font-size:14px}
  input {accent-color:var(--accent)}
  .score {padding:10px;border-radius:6px;background:var(--selection);color:var(--selection-ink)}
  .baseline {font-size:12px;margin-top:8px}
  ul {padding:0;margin:12px 0;list-style:none}
  li {border-top:1px solid var(--line);padding:8px 0;display:grid;gap:3px;font-size:13px}
  li>span {color:var(--muted)}
  li>.failed {color:var(--accent)}
  a {color:var(--accent);text-decoration:underline;text-underline-offset:3px;font-size:13px}
</style>
