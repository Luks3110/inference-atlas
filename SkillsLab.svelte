<script>
  import { decide, evaluate, summarize } from './public/labs/skills/avaliacao.mjs';

  let usePurchaseDate = $state(true);
  let allowWrite = $state(false);
  const baseline = summarize(evaluate(input => decide(input, {usePurchaseDate:false,allowWrite:false})));
  let results = $derived(evaluate(input => decide(input, {usePurchaseDate,allowWrite})));
  let score = $derived(summarize(results));
  const decisions = {
    aceitar:'Aceitar', recusar:'Recusar', 'pedir-dado':'Pedir a data', 'outra-rota':'Encaminhar à entrega',
  };
</script>

<section class="skill-lab" aria-labelledby="skills-lab-title">
  <h2 id="skills-lab-title">A skill aplica a política certa?</h2>
  <p>Em maio, a loja aceitava devoluções em até 30 dias. Em junho, a regra caiu para 14 dias. Teste qual regra a skill consulta. A primeira versão usa sempre a regra mais recente.</p>
  <div class="settings">
    <label><input type="checkbox" bind:checked={usePurchaseDate}/> Consultar a regra válida na data da compra</label>
    <label><input type="checkbox" bind:checked={allowWrite}/> Simular acesso indevido à ferramenta de reembolso</label>
  </div>
  <p class="score" aria-live="polite">
    {score.correct} de {results.length} decisões corretas · {score.violations} erros no uso de ferramentas ·
    <strong>{score.passes ? 'Passou no teste' : 'Publicação bloqueada'}</strong>
  </p>
  <p class="baseline">Primeira versão · {baseline.correct} de {results.length} decisões corretas.</p>
  <ul>
    {#each results as result (result.label)}
      <li>
        <strong>{result.label}</strong>
        <span>{decisions[result.actual.decision]}{result.actual.policy ? ' · ' + result.actual.policy : ''}</span>
        {#if !result.correct}<span class="failed">Esperado: {decisions[result.expected.decision]} · {result.expected.policy}</span>{/if}
        {#if !result.allowed}<span class="failed">Chamou {result.actual.tool}. O teste esperava {result.expected.tool ?? 'nenhuma chamada'}.</span>{/if}
      </li>
    {/each}
  </ul>
  <p class="baseline">A simulação roda regras fixas no navegador. Os casos e o avaliador podem ser reaproveitados para testar a saída de um agente real.</p>
  <div class="downloads">
    <a href="/labs/skills/SKILL.md" download>Baixar a skill</a>
    <a href="/labs/skills/avaliacao.mjs" download>Baixar casos e avaliador</a>
    <a href="#/aula/skills-com-evals/5">Ler a aula sobre checagens</a>
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
