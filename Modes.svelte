<script module>
  // Preserve progress while the reader moves between the modes and the lesson.
  const quiz = $state({ index: 0, answers: [] });
  let guideIndex = $state(0);
</script>

<script>
  import { t } from './i18n.js';
  import SkillsLab from './SkillsLab.svelte';
  import CourseTerms from './CourseTerms.svelte';
  import HighlightedCode from './HighlightedCode.svelte';
  import { tick } from 'svelte';
  import { questions, guides } from './mode-data.js';
  import './modes.css';

  let { mode } = $props();

  let question = $derived(questions[quiz.index]);
  let picked = $derived(quiz.answers[quiz.index]);
  let answered = $derived(picked !== undefined);
  let score = $derived(quiz.answers.filter((value, index) => value === questions[index].correct).length);
  let guide = $derived(guides[guideIndex]);

  let headingElement = $state(),
    feedbackElement = $state(),
    codeElement = $state();
  let copyStatus = $state('');
  let copied = $state(false);

  async function answer(value) {
    if (answered || !question) return;
    quiz.answers[quiz.index] = value;
    await tick();
    feedbackElement?.focus();
  }

  async function advance() {
    if (!answered) return;
    quiz.index += 1;
    await tick();
    headingElement?.focus();
  }

  async function restart() {
    quiz.index = 0;
    quiz.answers = [];
    await tick();
    headingElement?.focus();
  }

  async function showGuide(index) {
    guideIndex = index;
    copied = false;
    copyStatus = '';
    await tick();
    headingElement?.focus();
  }

  async function copyCommand() {
    const currentCode = codeElement;
    const currentGuide = guide;
    try {
      await navigator.clipboard.writeText(currentGuide.code);
      if (currentCode !== codeElement || currentGuide !== guide) return;
      copied = true;
      copyStatus = t('Comando copiado.', 'Command copied.');
    } catch {
      if (currentCode !== codeElement || currentGuide !== guide || !currentCode?.isConnected) return;
      const range = document.createRange();
      range.selectNodeContents(currentCode);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      copyStatus = t('Comando selecionado. Use a opção Copiar do navegador.', 'Command selected. Use your browser’s Copy option.');
    }
  }
</script>

{#snippet heading(title, description)}
  <header class="am-heading">
    <h1>{title}</h1>
    <p>{description}</p>
  </header>
{/snippet}

{#snippet source(url, label = t('Documentação', 'Documentation'))}
  <a class="am-source" href={url} target="_blank" rel="noopener noreferrer"
    >{label} <span aria-hidden="true">↗</span></a
  >
{/snippet}

<div class="am-mode">
  {#if mode === 'pratica'}
    {@render heading(t('Prática', 'Practice'), t('Tome decisões para agentes, avaliações e operação de aplicações de IA.', 'Practice making decisions about agents, evaluations, and operating AI applications.'))}
    {#if question}
      <section class="am-card">
        <div class="am-cardbar">
          <span>{question.topic}</span><span>{t(`Questão ${quiz.index + 1} de ${questions.length}`, `Question ${quiz.index + 1} of ${questions.length}`)}</span>
        </div>
        <div class="am-pad">
          <h2 bind:this={headingElement} tabindex="-1">{question.title}</h2>
          <p>{question.prompt}</p>
          <div class="am-options">
            {#each question.options as option, index}
              {@const correct = answered && index === question.correct}
              {@const wrong = answered && index === picked && !correct}
              <button
                type="button"
                data-choice={index}
                class="am-option"
                class:is-correct={correct}
                class:is-wrong={wrong}
                disabled={answered}
                onclick={() => answer(index)}
              >
                <span class="am-letter">{String.fromCharCode(65 + index)}</span>
                <span>{option}</span>
                {#if correct || wrong}<b class="am-mark">{correct ? t('Correta', 'Correct') : t('Sua escolha', 'Your choice')}</b>{/if}
              </button>
            {/each}
          </div>
          {#if answered}
            <div class="am-feedback" tabindex="-1" bind:this={feedbackElement}>
              <strong>{picked === question.correct ? t('Resposta correta', 'Correct answer') : t('Reveja o raciocínio', 'Review the reasoning')}</strong>
              <p>{question.reason}</p>
              {@render source(question.source)}
            </div>
            <button class="am-primary" type="button" data-next onclick={advance}>
              {quiz.index === questions.length - 1 ? t('Ver resultado', 'View results') : t('Próxima questão', 'Next question')}
              <span aria-hidden="true">→</span>
            </button>
          {/if}
        </div>
      </section>
    {:else}
      <section class="am-card am-result">
        <h2 tabindex="-1" bind:this={headingElement}>{t('Resultado da prática', 'Practice results')}</h2>
        <p class="am-score">{score} <small>/ {questions.length}</small></p>
        <ul class="am-review">
          {#each questions as item, index}
            <li>
              <span>{item.title}</span><b>{quiz.answers[index] === item.correct ? t('Acerto', 'Correct') : t('Revisar', 'Review')}</b>
            </li>
          {/each}
        </ul>
        <button class="am-primary" type="button" onclick={restart}>{t('Refazer prática', 'Try again')}</button>
      </section>
    {/if}
  {:else if mode === 'laboratorio'}
    {@render heading(t('Laboratório de evals', 'Evals lab'), t('Compare versões da mesma skill e veja o que impede uma publicação.', 'Compare versions of the same skill and see what can block a release.'))}
    <SkillsLab />
  {:else if mode === 'guias'}
    {@render heading(t('Guias de referência', 'Reference guides'), t('Use os exemplos de ferramentas, workflows, avaliações e registros nas suas aplicações.', 'Use these examples of tools, workflows, evaluations, and logging in your applications.'))}
    <div class="am-guidegrid">
      <nav class="am-guidenav" aria-label={t('Escolher guia', 'Choose a guide')}>
        {#each guides as item, index}
          <button
            type="button"
            data-guide={index}
            aria-current={index === guideIndex ? 'true' : 'false'}
            onclick={() => showGuide(index)}
          >
            <small>{item.category}</small>{item.title}
          </button>
        {/each}
      </nav>
      <article class="am-card am-pad">
        <h2 tabindex="-1" bind:this={headingElement}>{guide.title}</h2>
        <p>{guide.description}</p>
        <CourseTerms text={guide.title + ' ' + guide.description} />
        <div class="am-terminal">
          <div>
            <span>Terminal</span><button type="button" data-copy onclick={copyCommand}
              >{copied ? t('Copiado ✓', 'Copied ✓') : t('Copiar', 'Copy')}</button
            >
          </div>
          <pre><HighlightedCode source={guide.code} language={guide.language} bind:element={codeElement} /></pre>
        </div>
        <span role="status" class="am-copy-status">{copyStatus}</span>
        {@render source(guide.source)}
      </article>
    </div>
  {/if}
</div>
