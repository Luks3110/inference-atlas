<script>
  import { t } from './i18n.js';
  import LanguageSwitcher from './LanguageSwitcher.svelte';
  import { onMount, tick } from 'svelte';
  import Sidebar from './Sidebar.svelte';
  import Lesson from './Lesson.svelte';
  import { retiredLessons } from './course-order.js';
  import Audit from './Audit.svelte';
  import ProductionIndex from './ProductionIndex.svelte';
  import Modes from './Modes.svelte';
  import { modules, lessons, coreLessons, productionModules } from './curriculum.js';
  import { href, modes, symbols, read, save, matchLessons } from './course-ui.js';
  import { icon } from './icons.js';

  const byId = new Map(lessons.map((item) => [item.id, item]));
  function parse(hash) {
    const last = read('position', '');
    const path = (!hash || hash === '#/' || hash === '#conteudo') && typeof last === 'string' ? last : hash;
    const [, page, id, position, section] = path.split('/');
    const retired = page === 'aula' && retiredLessons.includes(id);
    const item = byId.get(retired ? 'mastra-e-orquestracao' : id) || lessons[0];
    const index = Math.max(0, Math.min(item.steps.length - 1, (retired ? 1 : parseInt(position, 10) || 1) - 1));
    return {
      page: page === 'auditoria' || Object.hasOwn(modes, page) ? page : 'aprender',
      item, index, retired,
      showCase: page === 'aula' && section === 'caso',
      auditModule: page === 'auditoria' ? Math.max(0, modules.findIndex((group) => group.id === (id === 'vllm' ? 'agentes' : id) || String(group.legacy) === id)) : 0,
    };
  }
  const initialRoute = parse(location.hash);
  let route = $state.raw(initialRoute);
  let groups = $state.raw(new Set([initialRoute.item.group]));
  let completed = $state.raw(
    new Set((Array.isArray(read('completed', [])) ? read('completed', []) : []).filter((id) => byId.has(id))),
  );
  let theme = $state(document.documentElement.dataset.theme || 'light'),
    drawer = $state(false);
  let finder, progress, menuButton, termInput, main;
  let query = $state(''),
    dialogKind = $state('progress'),
    notice = $state('');
  let coreCompleted = $derived(coreLessons.filter(lesson => completed.has(lesson.id)).length);
  let nextLesson = $state.raw(null),
    preserveDocumentAt = null;
  let matches = $derived.by(() =>
    finder?.open || query
      ? matchLessons(query, lessons, modules)
      : lessons.map((item) => ({ item, index: 0 })),
  );

  $effect(() => {
    document.body.classList.toggle('show-menu', drawer);
    document.documentElement.dataset.theme = theme;
  });
  function pageTitle(current) {
    if (current.page === 'aprender') return t(current.item.title);
    if (current.page === 'auditoria') return t('Auditoria do currículo', 'Curriculum audit');
    return modes[current.page][1];
  }
  $effect(() => {
    document.title =
      pageTitle(route) + ' · Inference Atlas';
    if (route.page === 'aprender') {
      const position = href(route.item, route.index);
      save('position', position);
      if (route.retired || !location.hash || location.hash === '#/' || location.hash === '#conteudo') {
        history.replaceState(history.state, '', position);
      }
    }
  });

  function toggleGroup(i) {
    const next = new Set(groups);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    groups = next;
  }
  function closeDrawer() {
    drawer = false;
  }
  function sidebarLink(event) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (event.currentTarget.hash !== location.hash) preserveDocumentAt = event.currentTarget.hash;
    closeDrawer();
  }
  async function toggleDrawer() {
    drawer = !drawer;
    if (drawer) {
      await tick();
      document.querySelector('.group-toggle')?.focus({ preventScroll: true });
    }
  }
  function changeTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem('atlas:theme', theme);
    } catch {}
  }
  function go(delta) {
    const index = route.index + delta;
    if (route.page === 'aprender' && index >= 0 && index < route.item.steps.length)
      location.hash = href(route.item, index);
  }
  function advance() {
    if (route.index < route.item.steps.length - 1) {
      go(1);
      return;
    }
    completed = new Set([...completed, route.item.id]);
    save('completed', [...completed]);
    const track = coreLessons.includes(route.item) ? coreLessons : lessons;
    const pos = track.indexOf(route.item);
    nextLesson =
      track.slice(pos + 1).find((l) => !completed.has(l.id)) || coreLessons.find((l) => !completed.has(l.id));
    dialogKind = 'finish';
    progress.showModal();
  }
  function showProgress() {
    dialogKind = 'progress';
    progress.showModal();
  }
  async function search() {
    query = '';
    finder.showModal();
    await tick();
    termInput.focus();
  }
  function searchKey(event) {
    const first = finder.querySelector('.results a');
    if (event.key === 'Enter') {
      event.preventDefault();
      first?.click();
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      first?.focus();
    }
  }
  function closeBackdrop(event) {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      event.currentTarget.close();
  }
  function keys(event) {
    if (event.defaultPrevented || event.isComposing) return;
    if (event.key === 'Escape') {
      if (finder.open || progress.open) {
        event.preventDefault();
        (finder.open ? finder : progress).close();
        return;
      }
      if (drawer) {
        closeDrawer();
        menuButton.focus({ preventScroll: true });
        return;
      }
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (!finder.open && !progress.open) search();
      return;
    }
    if (
      finder.open ||
      progress.open ||
      drawer ||
      route.page !== 'aprender' ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      event.target.closest('input,textarea,select,dialog,[contenteditable=true]')
    )
      return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      go(event.key === 'ArrowLeft' ? -1 : 1);
    }
    const example = main.querySelector('#diagram');
    if (event.key.toLowerCase() === 'r') {
      main.querySelector('[data-sim-reset]')?.click();
      example?.querySelector('[data-replay]')?.click();
    }
    if (example && event.key === ' ' && !event.target.closest('button,a,summary')) {
      event.preventDefault();
      example.querySelector('[data-pause]')?.click();
    }
  }
  onMount(() => {
    const layout = matchMedia('(max-width:950px)');
    async function change() {
      const old = route;
      const next = parse(location.hash);
      const keepScroll = preserveDocumentAt === location.hash;
      preserveDocumentAt = null;
      finder?.close();
      progress?.close();
      closeDrawer();
      if (next.page === 'aprender' && (old.item.group !== next.item.group || old.page !== 'aprender'))
        groups = new Set([...groups, next.item.group]);
      route = next;
      await tick();
      if (!next.showCase && !keepScroll && (old.item.id !== next.item.id || old.page !== next.page)) window.scrollTo(0, 0);
      if (old.page === 'aprender' && next.page === 'aprender' && old.item.id === next.item.id
        && old.index !== next.index && !next.showCase && !keepScroll && !document.activeElement?.closest('#sidebar')
      ) {
        const heading = main.querySelector('#step-title');
        heading?.focus({ preventScroll: true });
        heading?.scrollIntoView({ block: 'start' });
      }
      if (next.page === 'auditoria' && old.page === 'auditoria' && old.auditModule !== next.auditModule) {
        const heading = main.querySelector('#audit-title');
        heading?.focus({ preventScroll: true });
        heading?.scrollIntoView({ block: 'start' });
      }
      notice =
        next.page === 'aprender'
          ? `${t(next.item.title)}, ${t('etapa', 'step')} ${next.index + 1}. ${t(next.item.steps[next.index].title)}`
          : pageTitle(next);
    }
    window.addEventListener('hashchange', change);
    layout.addEventListener('change', closeDrawer);
    return () => {
      window.removeEventListener('hashchange', change);
      layout.removeEventListener('change', closeDrawer);
      document.body.classList.remove('show-menu');
    };
  });
</script>

<svelte:window onkeydown={keys} />
<a
  class="skip"
  href="#conteudo"
  onclick={(e) => {
    e.preventDefault();
    main.focus();
  }}>{t('Pular para o conteúdo', 'Skip to content')}</a
>
<header id="topbar">
  <button
    bind:this={menuButton}
    class="icon-button menu-button"
    aria-label={t('Abrir currículo', 'Open curriculum')}
    aria-controls="sidebar"
    aria-expanded={drawer}
    onclick={toggleDrawer}>{@html icon('menu')}</button
  >
  <a class="brand" href="#/" aria-label={t('Inference Atlas — continuar curso', 'Inference Atlas — continue course')}
    ><img src="/mark.svg" alt="" width="32" height="32" /><span>Inference <b>Atlas</b></span></a
  >
  <nav class="topnav" aria-label={t('Navegação principal', 'Main navigation')}>
    {#each Object.entries(modes) as [id, [symbol, title]]}
      <a href={id === 'aprender' ? '#/' : '#/' + id} aria-current={route.page === id ? 'page' : undefined}
        >{@html icon(symbol, 16)}<span>{title}</span></a
      >
    {/each}
  </nav>
  <div class="header-tools">
    <LanguageSwitcher />
    <button class="search-trigger" aria-label={t('Buscar no curso', 'Search the course')} onclick={search}
      >{@html icon('search', 17)}<span>{t('Buscar no curso', 'Search the course')}</span><kbd>Ctrl K</kbd></button
    >
    <button
      class="icon-button theme-button"
      aria-label={theme === 'dark' ? t('Ativar tema claro', 'Switch to light theme') : t('Ativar tema escuro', 'Switch to dark theme')}
      onclick={changeTheme}>{@html icon(theme === 'dark' ? 'sun' : 'moon', 17)}</button
    >
  </div>
</header>
<div class="workspace">
  <Sidebar
    selected={route.page === 'aprender' ? route.item.id : null}
    {completed}
    openGroups={groups}
    onToggle={toggleGroup}
    onSelect={sidebarLink}
    onAudit={closeDrawer}
    onProgress={showProgress}
  />
  <main id="conteudo" tabindex="-1" bind:this={main}>
    {#if route.page === 'aprender'}
      <Lesson
        lesson={route.item}
        index={route.index}
        showCase={route.showCase}
        group={modules[route.item.group]}
        onBack={() => go(-1)}
        onNext={advance}
      />
    {:else if route.page === 'auditoria'}
      <Audit selected={route.auditModule} />
    {:else if route.page === 'producao'}
      <ProductionIndex modules={productionModules} {completed} {href} />
    {:else}
      <Modes mode={route.page} />
    {/if}
  </main>
</div>
<button type="button" class="scrim" aria-label={t('Fechar índice', 'Close course index')} onclick={closeDrawer}></button>
<dialog id="finder" bind:this={finder} aria-labelledby="find-title" onclick={closeBackdrop}>
  <div class="dialog-head">
    <h2 id="find-title">{t('Buscar no curso', 'Search the course')}</h2>
    <button class="icon-button" aria-label={t('Fechar busca', 'Close search')} onclick={() => finder.close()}
      >{@html icon('close', 16)}</button
    >
  </div>
  <label class="find-input"
    >{@html icon('search', 19)}<input
      type="search"
      placeholder={t('Aula, conceito ou tecnologia…', 'Lesson, concept, or technology…')}
      aria-label={t('Termo de busca', 'Search term')}
      autocomplete="off"
      bind:this={termInput}
      bind:value={query}
      onkeydown={searchKey}
    /></label
  >
  <div class="results" aria-live="polite">
    {#each matches as result (result.item.id)}
      <a href={href(result.item, result.index) + (result.showCase ? '/caso' : '')} onclick={() => finder.close()}
        >{@html icon(symbols[result.item.group], 17)}<span
          ><strong>{t(result.item.title)}</strong><small
            >{t(modules[result.item.group].title)}{result.showCase ? t(' · Caso em produção', ' · Production case') : result.index
              ? ' · ' + t(result.item.steps[result.index].label)
              : ''}</small
          ></span
        >{@html icon('chevron', 14)}</a
      >
    {:else}<p>{t('Nenhuma aula encontrada. Tente outra palavra.', 'No lessons found. Try another search term.')}</p>{/each}
  </div>
</dialog>
<dialog id="progress-dialog" bind:this={progress} aria-labelledby="progress-title" onclick={closeBackdrop}>
  {#if dialogKind === 'finish'}
    <div class="dialog-head">
      <span class="completion-icon">{@html icon('check', 22)}</span><button
        class="icon-button"
        aria-label={t('Fechar', 'Close')}
        onclick={() => progress.close()}>{@html icon('close', 17)}</button
      >
    </div>
    <h2 id="progress-title">{nextLesson ? t('Aula concluída', 'Lesson completed') : t('Curso concluído', 'Course completed')}</h2>
    <p>{nextLesson ? t(route.item.title) : t('Você completou a trilha principal do Inference Atlas.', 'You completed the Inference Atlas core track.')}</p>
    <p class="finish-total">{t(`${coreCompleted} de ${coreLessons.length} aulas da trilha concluídas`, `${coreCompleted} of ${coreLessons.length} track lessons completed`)}</p>
    <a
      class="primary finish-link"
      href={nextLesson ? href(nextLesson) : '#/pratica'}
      onclick={() => progress.close()}
      >{nextLesson ? t(`Continuar com ${nextLesson.title}`, `Continue with ${t(nextLesson.title)}`) : t('Praticar agora', 'Practice now')}{@html icon('arrow', 16)}</a
    >
  {:else}
    <div class="dialog-head">
      <h2 id="progress-title">{t('Seu progresso', 'Your progress')}</h2>
      <button class="icon-button" aria-label={t('Fechar', 'Close')} onclick={() => progress.close()}
        >{@html icon('close', 16)}</button
      >
    </div>
    <p>{t(`${coreCompleted} de ${coreLessons.length} aulas da trilha concluídas neste navegador`, `${coreCompleted} of ${coreLessons.length} track lessons completed in this browser`)}</p>
    <ul class="progress-list">
      {#each modules as group, i}<li>
          <span class={'module-symbol group-' + (i % 6)}>{@html icon(symbols[i], 16)}</span><strong
            >{t(group.title)}</strong
          ><span>{group.lessons.filter((l) => completed.has(l.id)).length} / {group.lessons.length}</span>
        </li>{/each}
    </ul>
  {/if}
</dialog>
<div class="sr-only" id="notice" role="status">{notice}</div>
