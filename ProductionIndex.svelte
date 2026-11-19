<script module>
  const outcomes = {
    apis: 'Valide a resposta do modelo e dê acesso a funções com permissões claras.',
    agentes: 'Coordene especialistas com Mastra. Retome trabalho com Temporal e conecte serviços por A2A.',
    grafos: 'Represente passos, dados e decisões no LangGraph. Retome execuções interrompidas.',
    memoria: 'Decida o que guardar, resumir e esquecer entre conversas.',
    rag: 'Busque trechos autorizados, confira a qualidade dos resultados e cite as fontes.',
    arquiteturas: 'Combine modelos com busca, processamento em lote e dados atualizados.',
    avaliacao: 'Teste skills e agentes, investigue pedidos no Langfuse e compare versões antes de publicar.',
    producao: 'Isole empresas, controle ferramentas e meça o custo do trabalho resolvido.',
    operacao: 'Investigue atrasos e publique versões com critérios de reversão.',
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
    <div class="lesson-kicker"><span></span>Trilha de produção</div>
    <h1>AI Engineering em produção</h1>
    <p>
      Monte aplicações que usam modelos e ferramentas. Aprenda a retomar uma tarefa depois de uma falha, avaliar as respostas e separar os dados de cada cliente.
    </p>
    <div class="index-actions">
      {#if next}
        <a class="primary" href={href(next)}>
          {completed.has(lessons[0].id) ? 'Continuar trilha' : 'Começar a trilha'}
          {@html icon('arrow', 16)}
        </a>
      {/if}
      <a class="to-lab" href="#/auditoria">{@html icon('notes', 16)} Auditoria dos módulos</a>
      <a class="to-lab" href="#/laboratorio">
        {@html icon('chart', 16)} Testar uma skill
      </a>
    </div>
  </header>

  <section class="track-outline">
    <div class="outline-head">
      <h2>Ementa</h2>
      <span>{modules.length} temas · {lessons.length} aulas</span>
    </div>
    <div class="topic-grid">
      {#each modules as module, index (module.title)}
        {@const done = module.lessons.filter((lesson) => completed.has(lesson.id)).length}
        <section class={'topic-card group-' + (index % 6)}>
          <header>
            <span class="module-symbol">{@html icon(module.symbol, 19)}</span>
            <span>Tema {String(index + 1).padStart(2, '0')}</span>
            <small>{done}/{module.lessons.length} concluídas</small>
          </header>
          <h3>{module.title}</h3>
          <p>{outcomes[module.id]}</p>
          <ul>
            {#each module.lessons as lesson (lesson.id)}
              <li>
                <a href={href(lesson)}>
                  {@html icon(completed.has(lesson.id) ? 'check' : 'notes', 14)}
                  <span>{lesson.title}</span>
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
