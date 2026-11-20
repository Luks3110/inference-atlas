<script module>
  import { t } from './i18n.js';
  const outcomes = {
    apis: t('Valide a resposta do modelo e dê acesso a funções com permissões claras.', 'Validate model responses and give tools clearly defined permissions.'),
    agentes: t('Coordene especialistas com Mastra. Retome trabalho com Temporal e conecte serviços por A2A.', 'Coordinate specialists with Mastra. Resume work with Temporal and connect services through A2A.'),
    grafos: t('Represente passos, dados e decisões no LangGraph. Retome execuções interrompidas.', 'Represent steps, data, and decisions in LangGraph. Resume interrupted runs.'),
    memoria: t('Decida o que guardar, resumir e esquecer entre conversas.', 'Decide what to keep, summarize, and forget between conversations.'),
    rag: t('Busque trechos autorizados, confira a qualidade dos resultados e cite as fontes.', 'Retrieve authorized passages, check the quality of the results, and cite your sources.'),
    arquiteturas: t('Combine modelos com busca, processamento em lote e dados atualizados.', 'Combine models with search, batch processing, and current data.'),
    avaliacao: t('Teste skills e agentes, investigue pedidos no Langfuse e compare versões antes de publicar.', 'Test skills and agents, investigate requests in Langfuse, and compare versions before release.'),
    producao: t('Isole empresas, controle ferramentas e meça o custo do trabalho resolvido.', 'Isolate tenants, control access to tools, and measure the cost per completed task.'),
    operacao: t('Investigue atrasos e publique versões com critérios de reversão.', 'Investigate delays and define when to roll back a release.'),
  };
</script>

<script>
  import { icon } from './icons.js';
  import './production/study.css';

  let { modules, completed, href } = $props();
  let lessons = $derived(modules.flatMap((module) => module.lessons));
  let next = $derived(lessons.find((lesson) => !completed.has(lesson.id)) ?? lessons[0]);
</script>

<article class="production-index">
  <header class="production-intro">
    <div class="lesson-kicker"><span></span>{t('Trilha de produção', 'Production track')}</div>
    <h1>{t('AI Engineering em produção', 'AI engineering in production')}</h1>
    <p>
      {t('Monte aplicações que usam modelos e ferramentas. Aprenda a retomar uma tarefa depois de uma falha, avaliar as respostas e separar os dados de cada cliente.', 'Build applications that use models and tools. Learn to resume a task after a failure, evaluate responses, and keep each customer’s data separate.')}
    </p>
    <div class="index-actions">
      {#if next}
        <a class="primary" href={href(next)}>
          {completed.has(lessons[0].id) ? t('Continuar trilha', 'Continue the track') : t('Começar a trilha', 'Start the track')}
          {@html icon('arrow', 16)}
        </a>
      {/if}
      <a class="to-lab" href="#/auditoria">{@html icon('notes', 16)} {t('Auditoria dos módulos', 'Module audit')}</a>
      <a class="to-lab" href="#/laboratorio">
        {@html icon('chart', 16)} {t('Testar uma skill', 'Test a skill')}
      </a>
    </div>
  </header>

  <section class="track-outline">
    <div class="outline-head">
      <h2>{t('Ementa', 'Syllabus')}</h2>
      <span>{t(`${modules.length} temas · ${lessons.length} aulas`, `${modules.length} topics · ${lessons.length} lessons`)}</span>
    </div>
    <div class="topic-grid">
      {#each modules as module, index (module.title)}
        {@const done = module.lessons.filter((lesson) => completed.has(lesson.id)).length}
        <section class={'topic-card group-' + (index % 6)}>
          <header>
            <span class="module-symbol">{@html icon(module.symbol, 19)}</span>
            <span>{t(`Tema ${String(index + 1).padStart(2, '0')}`, `Topic ${String(index + 1).padStart(2, '0')}`)}</span>
            <small>{t(`${done}/${module.lessons.length} concluídas`, `${done}/${module.lessons.length} completed`)}</small>
          </header>
          <h3>{t(module.title)}</h3>
          <p>{outcomes[module.id]}</p>
          <ul>
            {#each module.lessons as lesson (lesson.id)}
              <li>
                <a href={href(lesson)}>
                  {@html icon(completed.has(lesson.id) ? 'check' : 'notes', 14)}
                  <span>{t(lesson.title)}</span>
                  {@html icon('chevron', 12)}
                </a>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  </section>
</article>
