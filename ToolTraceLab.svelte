<script module>
  const modes = [
    ['openai', 'HTTP direto'],
    ['mastra', 'Mastra'],
    ['langchain', 'LangChain'],
    ['langchain-agent', 'LangChain · agente'],
    ['mcp', 'MCP'],
    ['code', 'Code Mode'],
  ];
  const steps = [
    ['request', 'Enviar ferramentas'],
    ['stream', 'Ler stream'],
    ['execute', 'Executar'],
    ['result', 'Devolver resultado'],
    ['text', 'Exibir texto'],
  ];
  const sdkCode = {
    openai: [
      'const calls = first.output.filter(item => item.type === "function_call");',
      'const [call] = calls;',
      'const args = JSON.parse(call.arguments);',
      'const output = await execute(call.name, args);',
    ].join('\n'),
    mastra: [
      'const agent = new Agent({',
      '  id: "loja", name: "Loja", instructions,',
      '  model: provider.responses(model),',
      '  tools: {',
      '    consultar_pedido: createTool({',
      '      id: "consultar_pedido", description, inputSchema: argsSchema,',
      '      execute: args => execute("consultar_pedido", args),',
      '    }),',
      '    calcular_frete: ferramentaDeFrete,',
      '  },',
      '});',
      'const output = await agent.stream(question, { maxSteps: 2 });',
    ].join('\n'),
    langchain: [
      'const llm = new ChatOpenAI({ model, useResponsesApi: true })',
      '  .bindTools([...registry.values()]);',
      'let full;',
      'for await (const chunk of await llm.stream(messages)) {',
      '  full = full ? full.concat(chunk) : chunk;',
      '}',
      'const action = full.tool_calls[0];',
      'const fn = registry.get(action.name);',
      'if (!fn) throw new Error("Ferramenta desconhecida");',
      'const result = await fn.invoke(action); // ToolMessage',
      'const final = await llm.stream([...messages, full, result]);',
    ].join('\n'),
    'langchain-agent': [
      'const agent = createAgent({',
      '  model: openAI, tools: [...registry.values()], systemPrompt: instructions,',
      '});',
      'const stream = await agent.stream({ messages: [new HumanMessage(question)] }, {',
      '  streamMode: ["updates", "messages"], recursionLimit: 8,',
      '});',
    ].join('\n'),
    mcp: [
      'const { tools: catalog } = await client.listTools();',
      'const declarations = catalog.map(({ name, description, inputSchema }) => ({',
      '  type: "function", name, description, parameters: inputSchema, strict: true,',
      '}));',
      '// Depois de validar a chamada que veio do modelo:',
      'const result = await client.callTool({ name, arguments: args });',
    ].join('\n'),
  };
  const argTypes = new Set([
    'response.output_item.added', 'response.function_call_arguments.delta',
    'response.function_call_arguments.done', 'response.output_item.done', 'response.completed',
  ]);
  const mcpMessages = (trace, method) => {
    const request = trace.observations.find(({message}) => message.method === method)?.message;
    const result = trace.observations.find(({message}) => message.result && message.id === request?.id)?.message;
    return {request,result};
  };
</script>

<script>
  import { onMount } from 'svelte';
  import { icon } from './icons.js';
  import JsonInspector from './JsonInspector.svelte';
  let { initialMode = 'openai', initialStep = 'request' } = $props();
  let mode = $state('openai');
  let step = $state('request');
  let position = $state(0);
  let data = $state.raw(null);
  let error = $state(false);

  $effect(() => {
    mode = initialMode;
    step = initialStep;
    position = 0;
  });

  onMount(() => {
    const abort = new AbortController();
    fetch('/labs/tool-calling/trace.json', {signal:abort.signal})
      .then(response => {
        if (!response.ok) throw new Error('Captura indisponível');
        return response.json();
      })
      .then(trace => { data = trace; })
      .catch(() => { if (!abort.signal.aborted) error = true; });
    return () => abort.abort();
  });

  let scene = $derived(data?.[mode]);
  let events = $derived(step === 'text'
    ? scene?.http[1].events.filter(event => event.type === 'response.output_text.delta') ?? []
    : scene?.http[0].events.filter(event => argTypes.has(event.type)) ?? []);
  let current = $derived(events[position]);
  let buffer = $derived(events.slice(0,position+1).map(event => event.delta ?? '').join(''));
  let catalog = $derived(mode === 'mcp' && scene ? mcpMessages(scene, 'tools/list') : null);
  let mcpCall = $derived(mode === 'mcp' && scene ? mcpMessages(scene, 'tools/call') : null);
  let result = $derived(scene?.http[1].request.input.find(item => item.type === 'function_call_output'));

  function chooseMode(value) {
    mode = value;
    if (value === 'mcp') step = 'catalog';
    else if (value === 'code') step = 'execute';
    else if (step === 'catalog') step = 'request';
    position = 0;
  }
  function chooseStep(value) {
    step = value;
    position = 0;
  }
</script>

{#snippet packet(title, content, prefix = '')}
  <div class="packet">
    {#if typeof content === 'string'}
      <div class="plain-packet">
        <h3>{title}</h3>
        <pre><code>{content}</code></pre>
      </div>
    {:else}
      <JsonInspector value={content} {prefix} compact={prefix !== ''} label={title} />
    {/if}
  </div>
{/snippet}

<section class="tool-trace" aria-labelledby="tool-trace-title">
  <h2 id="tool-trace-title">Veja os dados da chamada do pedido 42</h2>
  {#if error}
    <p>Não foi possível abrir a captura. <a href="/labs/tool-calling/trace.json">Abra o JSON diretamente.</a></p>
  {:else if scene}
    <p>O teste rodou os SDKs, o cliente MCP e o interpretador JavaScript com dados fictícios. Um servidor local simulou a API da OpenAI.</p>
    <div class="controls">
      <div class="selector">
        <span class="selector-label">Implementação</span>
        <div class="modes" role="group" aria-label="Escolher implementação">
          {#each modes as [value,label]}
            <button type="button" aria-pressed={mode === value} onclick={() => chooseMode(value)}>{label}</button>
          {/each}
        </div>
      </div>
      <div class="selector">
        <span class="selector-label">Etapa da chamada</span>
        <div class="phases" role="group" aria-label="Escolher etapa da chamada">
          {#if mode === 'mcp'}
            <button type="button" aria-pressed={step === 'catalog'} onclick={() => chooseStep('catalog')}>Descobrir ferramentas</button>
          {/if}
          {#each steps as [value,label]}
            <button type="button" aria-pressed={step === value} onclick={() => chooseStep(value)}>{label}</button>
          {/each}
        </div>
      </div>
    </div>
    <p class="field-hint">
      {@html icon('code', 15)}
      <span class="pointer-hint">Passe o mouse sobre um campo sublinhado. Clique para fixar a explicação.</span>
      <span class="touch-hint">Toque em um campo sublinhado para ler a explicação.</span>
    </p>
    <div class="trace-panel">
      {#if step === 'catalog' && catalog}
        <p>Depois de inicializar a sessão, o cliente MCP chama <code>tools/list</code>. O harness pega <code>name</code>, <code>description</code> e <code>inputSchema</code> e põe a última em <code>parameters</code> ao montar <code>tools</code> na OpenAI.</p>
        <div class="pair">
          {@render packet('Cliente → servidor MCP', catalog.request)}
          {@render packet('Servidor MCP → cliente', catalog.result)}
        </div>
        {@render packet('Conversão no harness', sdkCode.mcp)}
      {:else if step === 'request'}
        {#if mode === 'code'}
          <p>A lista tem <code>executar_codigo</code>. A descrição diz quais funções o programa pode chamar. O argumento <code>codigo</code> carrega o JavaScript como texto.</p>
        {:else}
          <p>A pergunta pede o status de um pedido. O modelo recebe <code>consultar_pedido</code>, que aceita <code>numero</code>, e <code>calcular_frete</code>, que aceita <code>cep</code>. As instruções, as descrições e a pergunta dão ao modelo os dados para propor a ferramenta certa. Com <code>tool_choice: "auto"</code>, ele também pode devolver só texto. Se o campo for omitido, esse é o padrão quando há ferramentas. O harness ainda confere a chamada.</p>
        {/if}
        {@render packet('Primeiro POST /v1/responses · corpo JSON', scene.http[0].request)}
      {:else if (step === 'stream' || step === 'text') && current}
        {#if step === 'stream'}
          <p>O servidor envia eventos em <code>text/event-stream</code>. O primeiro evento exibido abre o item. Os seguintes trazem pedaços de <code>arguments</code>. Acumule por <code>item_id</code> e espere <code>response.completed</code> antes de executar, mesmo se o trecho já parecer JSON válido. <code>call_id</code> liga o resultado à chamada.</p>
        {:else}
          <p>Na segunda stream, <code>response.output_text.delta</code> traz texto que o aplicativo pode acrescentar à resposta visível.</p>
        {/if}
        <div class="player">
          <span aria-live="polite">Evento {position + 1} de {events.length}</span>
          <button type="button" class="restart" onclick={() => position = 0} disabled={position === 0}>Recomeçar</button>
          <button type="button" class="advance" onclick={() => position += 1} disabled={position >= events.length - 1}>Próximo evento {@html icon('arrow', 14)}</button>
        </div>
        <div class="pair">
          {@render packet('Evento SSE recebido', current, 'event: ' + current.type + '\ndata: ')}
          {@render packet(step === 'text' ? 'Texto visível no chat' : 'Argumentos acumulados como texto',
            buffer || (step === 'text' ? 'Aguardando texto' : 'Ainda sem argumentos'))}
        </div>
        {#if step === 'stream'}
          <p class="status" aria-live="polite">{current.type === 'response.completed'
            ? 'Resposta completa. O harness pode conferir e executar a chamada.'
            : 'O harness ainda não executou a função.'}</p>
        {/if}
      {:else if step === 'execute'}
        {#if mode === 'mastra'}
          <p>A OpenAI devolve o nome da ferramenta. O Mastra monta o evento <code>tool-call</code> com <code>args</code> já lido como objeto. Ele encontra <code>tools.consultar_pedido</code> e chama o <code>execute</code> registrado. O código da função verifica a sessão e devolve o status. <code>tool-result</code> registra a saída que o agente usará na próxima chamada.</p>
          {@render packet('Registro e stream no Mastra', sdkCode.mastra)}
          {#each ['tool-call-delta','tool-call','tool-result'] as type}
            {@render packet('Evento ' + type, scene.observations.find(event => event.type === type))}
          {/each}
        {:else if mode === 'langchain'}
          <p><code>bindTools</code> anuncia o schema. Nesta versão manual, o LangChain monta <code>tool_call_chunks</code>, e o nosso código usa <code>concat</code> para juntar os fragmentos. Depois, busca a função pelo nome no registro, chama <code>invoke</code> e passa a <code>ToolMessage</code> junto do histórico na segunda chamada.</p>
          {@render packet('Código que liga o nome à função', sdkCode.langchain)}
          {@render packet('Um fragmento de argumento', scene.observations.find(event => event.tool_call_chunks?.some(chunk => chunk.args)))}
          {@render packet('Chamada completa', scene.observations.find(event => event.tool_calls))}
          {@render packet('Mensagem de retorno do LangChain', scene.observations.find(event => event.type === 'ToolMessage'))}
        {:else if mode === 'langchain-agent'}
          <p>Ao usar <code>createAgent</code>, a própria execução do agente encaminha <code>tool_calls</code> do nó do modelo ao nó de ferramentas. O nó encontra a função registrada pelo nome, gera a <code>ToolMessage</code> e devolve o controle ao modelo. Esta captura mostra a execução automática.</p>
          {@render packet('Agente com as duas ferramentas registradas', sdkCode['langchain-agent'])}
          {#each scene.observations as update}
            {@render packet('Atualização do nó ' + update.node, update)}
          {/each}
        {:else if mode === 'mcp' && mcpCall}
          <p>O modelo pediu <code>consultar_pedido</code>. O harness validou os argumentos e usou o cliente MCP para mandar <code>tools/call</code>. O ID JSON-RPC liga a resposta ao pedido MCP. O harness ainda usa <code>call_id</code> para responder à OpenAI.</p>
          <div class="pair">
            {@render packet('Cliente → servidor MCP', mcpCall.request)}
            {@render packet('Servidor MCP → cliente', mcpCall.result)}
          </div>
        {:else if mode === 'code'}
          <p>A OpenAI devolveu uma chamada de <code>executar_codigo</code>. O harness leu o JSON em <code>arguments</code> e extraiu o campo <code>codigo</code> e passou para o interpretador, que tinha acesso só às duas funções expostas pelo host. Cada função conferiu o pedido e as permissões. O exemplo limita tempo, memória e chamadas.</p>
          {@render packet('Programa entregue pelo modelo', scene.executions[0].args.codigo)}
          {@render packet('Chamadas que o host executou, na ordem', scene.observations)}
          {@render packet('Objeto devolvido pelo programa', scene.executions[0].result)}
        {:else}
          <p>Depois de receber a resposta completa, o harness lê <code>arguments</code> com <code>JSON.parse</code> e usa <code>name</code> para encontrar a função. A função da loja valida o número e a sessão. Os dados autorizados voltam como objeto JavaScript.</p>
          {@render packet('Código do harness', sdkCode.openai)}
          {@render packet('Função executada e resultado registrado', scene.executions[0])}
        {/if}
      {:else if step === 'result'}
        <p>O segundo POST envia o histórico, a chamada feita pelo modelo e <code>function_call_output</code>. O <code>call_id</code> repete o identificador que veio na chamada. Em <code>output</code> vai o resultado da função serializado como texto.</p>
        {@render packet('Item que liga o resultado à chamada', result)}
        <details>
          <summary>Ver corpo completo do segundo POST /v1/responses</summary>
          {@render packet('Segundo POST /v1/responses · corpo JSON', scene.http[1].request)}
        </details>
      {/if}
    </div>
    <div class="links">
      <a href="/labs/tool-calling/trace.json" download>Baixar a captura JSON completa</a>
      <a href="https://github.com/Luks3110/inference-atlas/tree/main/examples/tool-calling" target="_blank" rel="noreferrer">Abrir o código que gravou o teste {@html icon('external', 13)}</a>
    </div>
  {:else}
    <p role="status">Carregando a captura…</p>
  {/if}
</section>

<style>
  section {
    min-width: 0;
    background: var(--panel);
    border: 1px solid var(--edge);
    border-radius: 8px;
    margin: 0 0 16px;
    padding: clamp(12px, 2.4vw, 24px);
  }
  h2 { font-size: clamp(20px, 2.4vw, 26px); font-weight: 600; letter-spacing: -.038em; }
  p { font-size: 14px; line-height: 1.6; color: var(--muted); margin: 7px 0 12px; }
  p code { font-size: .88em; color: var(--ink); overflow-wrap: anywhere; }
  code { font-family: var(--mono); }
  .controls {
    display: grid;
    gap: 0;
    margin: 18px 0 9px;
    border-block: 1px solid var(--line);
  }
  .selector {
    display: grid;
    grid-template-columns: 8.4rem minmax(0, 1fr);
    gap: 4px 10px;
    align-items: baseline;
    padding: 6px 0;
  }
  .selector + .selector { border-top: 1px solid var(--line); }
  .selector-label { color: var(--subtle); font: 500 11px/1.4 var(--mono); }
  .modes,.phases,.player,.links { display: flex; flex-wrap: wrap; gap: 3px 6px; align-items: center; }
  button {
    padding: 5px 8px;
    color: var(--muted);
    border-radius: 4px;
    font-size: 12px;
    min-height: 32px;
    transition: background-color 150ms, color 150ms;
  }
  button:hover:not(:disabled) { background: var(--soft); color: var(--ink); }
  .modes button[aria-pressed=true] { background: var(--action); color: var(--action-ink); }
  .phases button[aria-pressed=true] { background: var(--selection); color: var(--selection-ink); font-weight: 600; }
  button:disabled { opacity: .55; }
  .field-hint {
    display: flex;
    align-items: baseline;
    gap: 7px;
    color: var(--accent);
    font-size: 12px;
    margin: 0 0 14px;
  }
  .field-hint :global(.icon) { align-self: center; }
  .touch-hint { display: none; }
  @media (hover: none) {
    .pointer-hint { display: none; }
    .touch-hint { display: inline; }
  }
  .packet { min-width: 0; margin: 8px 0; }
  .plain-packet { background: var(--bg); border: 1px solid var(--edge); border-radius: 6px; }
  .plain-packet h3 {
    font-size: 12px;
    font-weight: 560;
    padding: 8px 12px;
    border-bottom: 1px solid var(--line);
    border-radius: 5px 5px 0 0;
    background: var(--rail);
  }
  .plain-packet pre {
    padding: 12px;
    margin: 0;
    max-height: 31rem;
    overflow: auto;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font: 12px/1.75 var(--mono);
  }
  .pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(245px,100%),1fr)); gap: 10px; }
  .player { gap: 6px 8px; margin-top: 12px; }
  .player span { margin-right: auto; color: var(--muted); font: 500 11px/1.4 var(--mono); }
  .player .advance { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--edge); color: var(--ink); }
  .status { color: var(--muted); font-size: 12px; }
  a,summary { color: var(--accent); font-size: 13px; }
  summary { cursor: pointer; }
  .links { margin-top: 16px; padding-top: 10px; border-top: 1px solid var(--line); gap: 6px 16px; }
  .links a { display: inline-flex; align-items: center; gap: 5px; }
  .links a:hover { text-decoration: underline; text-underline-offset: 3px; }
  @media (max-width: 560px) {
    .selector { grid-template-columns: 1fr; padding-block: 8px; }
    .pair { gap: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    button { transition: none; }
  }
</style>
