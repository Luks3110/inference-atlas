<script module>
  import { t } from './i18n.js';
  const modes = [
    ['openai', t('HTTP direto', 'Direct HTTP')],
    ['mastra', 'Mastra'],
    ['langchain', 'LangChain'],
    ['langchain-agent', t('LangChain · agente', 'LangChain · agent')],
    ['mcp', 'MCP'],
    ['code', 'Code Mode'],
  ];
  const steps = [
    ['request', t('Enviar ferramentas', 'Send tools')],
    ['stream', t('Ler stream', 'Read the stream')],
    ['execute', t('Executar', 'Execute')],
    ['result', t('Devolver resultado', 'Return the result')],
    ['text', t('Exibir texto', 'Display text')],
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
  import HighlightedCode from './HighlightedCode.svelte';
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

{#snippet packet(title, content, options = {})}
  <div class="packet">
    {#if typeof content === 'string'}
      <div class="plain-packet">
        <h3>{title}</h3>
        <pre><HighlightedCode source={content} language={options.language} /></pre>
      </div>
    {:else}
      <JsonInspector value={content} prefix={options.prefix} label={title} />
    {/if}
  </div>
{/snippet}

<section class="tool-trace" aria-labelledby="tool-trace-title">
  <h2 id="tool-trace-title">{t('Veja os dados da chamada do pedido 42', 'Inspect the tool call for order 42')}</h2>
  {#if error}
    <p>{t('Não foi possível abrir a captura. ', 'Couldn\'t open the trace. ')}<a href="/labs/tool-calling/trace.json">{t('Abra o JSON diretamente.', 'Open the JSON directly.')}</a></p>
  {:else if scene}
    <p>{t('O teste rodou os SDKs, o cliente MCP e o interpretador JavaScript com dados fictícios. Um servidor local simulou a API da OpenAI.', 'The test ran the SDKs, the MCP client, and the JavaScript interpreter with fictional data. A local server simulated the OpenAI API.')}</p>
    <div class="controls">
      <div class="selector">
        <span class="selector-label">{t('Implementação', 'Implementation')}</span>
        <div class="modes" role="group" aria-label={t('Escolher implementação', 'Choose an implementation')}>
          {#each modes as [value,label]}
            <button type="button" aria-pressed={mode === value} onclick={() => chooseMode(value)}>{label}</button>
          {/each}
        </div>
      </div>
      <div class="selector">
        <span class="selector-label">{t('Etapa da chamada', 'Call step')}</span>
        <div class="phases" role="group" aria-label={t('Escolher etapa da chamada', 'Choose a step in the call')}>
          {#if mode === 'mcp'}
            <button type="button" aria-pressed={step === 'catalog'} onclick={() => chooseStep('catalog')}>{t('Descobrir ferramentas', 'Discover tools')}</button>
          {/if}
          {#each steps as [value,label]}
            <button type="button" aria-pressed={step === value} onclick={() => chooseStep(value)}>{label}</button>
          {/each}
        </div>
      </div>
    </div>
    <p class="field-hint">
      {@html icon('code', 15)}
      <span class="pointer-hint">{t('Passe o mouse sobre um campo sublinhado. Clique para fixar a explicação.', 'Hover over an underlined field. Click to pin the explanation.')}</span>
      <span class="touch-hint">{t('Toque em um campo sublinhado para ler a explicação.', 'Tap an underlined field to read its explanation.')}</span>
    </p>
    <div class="trace-panel">
      {#if step === 'catalog' && catalog}
        <p>{@html t(
          'Depois de inicializar a sessão, o cliente MCP chama <code>tools/list</code>. O harness pega <code>name</code>, <code>description</code> e <code>inputSchema</code> e põe a última em <code>parameters</code> ao montar <code>tools</code> na OpenAI.',
          'After initializing the session, the MCP client calls <code>tools/list</code>. The harness takes <code>name</code>, <code>description</code>, and <code>inputSchema</code> from the catalog. It puts the schema in <code>parameters</code> when building the OpenAI <code>tools</code> list.',
        )}</p>
        <div class="pair">
          {@render packet(t('Cliente → servidor MCP', 'Client → MCP server'), catalog.request)}
          {@render packet(t('Servidor MCP → cliente', 'MCP server → client'), catalog.result)}
        </div>
        {@render packet(t('Conversão no harness', 'Conversion in the harness'), sdkCode.mcp, {language: 'javascript'})}
      {:else if step === 'request'}
        {#if mode === 'code'}
          <p>{@html t(
            'A lista tem <code>executar_codigo</code>. A descrição diz quais funções o programa pode chamar. O argumento <code>codigo</code> carrega o JavaScript como texto.',
            'The tool list contains <code>executar_codigo</code>. Its description names the functions the program can call. The <code>codigo</code> argument carries the JavaScript source as text.',
          )}</p>
        {:else}
          <p>{@html t(
            'A pergunta pede o status de um pedido. O modelo recebe <code>consultar_pedido</code>, que aceita <code>numero</code>, e <code>calcular_frete</code>, que aceita <code>cep</code>. As instruções, as descrições e a pergunta dão ao modelo os dados para propor a ferramenta certa. Com <code>tool_choice: "auto"</code>, ele também pode devolver só texto. Se o campo for omitido, esse é o padrão quando há ferramentas. O harness ainda confere a chamada.',
            'The question asks for an order status. The model gets <code>consultar_pedido</code>, which takes <code>numero</code>, and <code>calcular_frete</code>, which takes <code>cep</code>. It uses the instructions, descriptions, and question to suggest a tool. With <code>tool_choice: "auto"</code>, the model can also return only text. This is the default when tools are available and the field is omitted. The harness still checks the call.',
          )}</p>
        {/if}
        {@render packet(t('Primeiro POST /v1/responses · corpo JSON', 'First POST /v1/responses · JSON body'), scene.http[0].request)}
      {:else if (step === 'stream' || step === 'text') && current}
        {#if step === 'stream'}
          <p>{@html t(
            'O servidor envia eventos em <code>text/event-stream</code>. O primeiro evento exibido abre o item. Os seguintes trazem pedaços de <code>arguments</code>. Acumule por <code>item_id</code> e espere <code>response.completed</code> antes de executar, mesmo se o trecho já parecer JSON válido. <code>call_id</code> liga o resultado à chamada.',
            'The server sends events as <code>text/event-stream</code>. The first event shown opens the item. Later events carry pieces of <code>arguments</code>. Accumulate them by <code>item_id</code> and wait for <code>response.completed</code> before executing, even if the text already looks like valid JSON. <code>call_id</code> links the result to the call.',
          )}</p>
        {:else}
          <p>{@html t(
            'Na segunda stream, <code>response.output_text.delta</code> traz texto que o aplicativo pode acrescentar à resposta visível.',
            'In the second stream, <code>response.output_text.delta</code> carries text the app can append to the visible reply.',
          )}</p>
        {/if}
        <div class="player">
          <span aria-live="polite">{t(`Evento ${position + 1} de ${events.length}`, `Event ${position + 1} of ${events.length}`)}</span>
          <button type="button" class="restart" onclick={() => position = 0} disabled={position === 0}>{t('Recomeçar', 'Start over')}</button>
          <button type="button" class="advance" onclick={() => position += 1} disabled={position >= events.length - 1}>{t('Próximo evento ', 'Next event ')}{@html icon('arrow', 14)}</button>
        </div>
        <div class="pair">
          {@render packet(t('Evento SSE recebido', 'Received SSE event'), current, {prefix: 'event: ' + current.type + '\ndata: '})}
          {@render packet(step === 'text' ? t('Texto visível no chat', 'Visible chat text') : t('Argumentos acumulados como texto', 'Arguments accumulated as text'),
            buffer || (step === 'text' ? t('Aguardando texto', 'Waiting for text') : t('Ainda sem argumentos', 'No arguments yet')))}
        </div>
        {#if step === 'stream'}
          <p class="status" aria-live="polite">{current.type === 'response.completed'
            ? t('Resposta completa. O harness pode conferir e executar a chamada.', 'Response complete. The harness can check and execute the call.')
            : t('O harness ainda não executou a função.', 'The harness is still waiting to execute the function.')}</p>
        {/if}
      {:else if step === 'execute'}
        {#if mode === 'mastra'}
          <p>{@html t(
            'A OpenAI devolve o nome da ferramenta. O Mastra monta o evento <code>tool-call</code> com <code>args</code> já lido como objeto. Ele encontra <code>tools.consultar_pedido</code> e chama o <code>execute</code> registrado. O código da função verifica a sessão e devolve o status. <code>tool-result</code> registra a saída que o agente usará na próxima chamada.',
            'OpenAI returns the tool name. Mastra builds the <code>tool-call</code> event with <code>args</code> parsed as an object. It finds <code>tools.consultar_pedido</code> and invokes the registered <code>execute</code> handler. The function checks the session and returns the status. <code>tool-result</code> records the output the agent will use on its next call.',
          )}</p>
          {@render packet(t('Registro e stream no Mastra', 'Registration and streaming in Mastra'), sdkCode.mastra, {language: 'javascript'})}
          {#each ['tool-call-delta','tool-call','tool-result'] as type}
            {@render packet(t('Evento ', 'Event ') + type, scene.observations.find(event => event.type === type))}
          {/each}
        {:else if mode === 'langchain'}
          <p>{@html t(
            '<code>bindTools</code> anuncia o schema. Nesta versão manual, o LangChain monta <code>tool_call_chunks</code>, e o nosso código usa <code>concat</code> para juntar os fragmentos. Depois, busca a função pelo nome no registro, chama <code>invoke</code> e passa a <code>ToolMessage</code> junto do histórico na segunda chamada.',
            '<code>bindTools</code> declares the schema. In this manual version, LangChain builds <code>tool_call_chunks</code>, and our code uses <code>concat</code> to join the fragments. It then looks up the function by name, calls <code>invoke</code>, and passes the <code>ToolMessage</code> with the history in the second call.',
          )}</p>
          {@render packet(t('Código que liga o nome à função', 'Code that maps the name to the function'), sdkCode.langchain, {language: 'javascript'})}
          {@render packet(t('Um fragmento de argumento', 'An argument fragment'), scene.observations.find(event => event.tool_call_chunks?.some(chunk => chunk.args)))}
          {@render packet(t('Chamada completa', 'Complete call'), scene.observations.find(event => event.tool_calls))}
          {@render packet(t('Mensagem de retorno do LangChain', 'LangChain tool result message'), scene.observations.find(event => event.type === 'ToolMessage'))}
        {:else if mode === 'langchain-agent'}
          <p>{@html t(
            'Ao usar <code>createAgent</code>, a própria execução do agente encaminha <code>tool_calls</code> do nó do modelo ao nó de ferramentas. O nó encontra a função registrada pelo nome, gera a <code>ToolMessage</code> e devolve o controle ao modelo. Esta captura mostra a execução automática.',
            'With <code>createAgent</code>, the agent runtime routes <code>tool_calls</code> from the model node to the tools node. The node finds the registered function by name, creates the <code>ToolMessage</code>, and returns control to the model. This trace shows that automatic execution.',
          )}</p>
          {@render packet(t('Agente com as duas ferramentas registradas', 'Agent with both tools registered'), sdkCode['langchain-agent'], {language: 'javascript'})}
          {#each scene.observations as update}
            {@render packet(t('Atualização do nó ', 'Node update · ') + update.node, update)}
          {/each}
        {:else if mode === 'mcp' && mcpCall}
          <p>{@html t(
            'O modelo pediu <code>consultar_pedido</code>. O harness validou os argumentos e usou o cliente MCP para mandar <code>tools/call</code>. O ID JSON-RPC liga a resposta ao pedido MCP. O harness ainda usa <code>call_id</code> para responder à OpenAI.',
            'The model requested <code>consultar_pedido</code>. The harness validated the arguments and sent <code>tools/call</code> through the MCP client. The JSON-RPC ID links the reply to the MCP request. The harness also uses <code>call_id</code> when responding to OpenAI.',
          )}</p>
          <div class="pair">
            {@render packet(t('Cliente → servidor MCP', 'Client → MCP server'), mcpCall.request)}
            {@render packet(t('Servidor MCP → cliente', 'MCP server → client'), mcpCall.result)}
          </div>
        {:else if mode === 'code'}
          <p>{@html t(
            'A OpenAI devolveu uma chamada de <code>executar_codigo</code>. O harness leu o JSON em <code>arguments</code> e extraiu o campo <code>codigo</code> e passou para o interpretador, que tinha acesso só às duas funções expostas pelo host. Cada função conferiu o pedido e as permissões. O exemplo limita tempo, memória e chamadas.',
            'OpenAI returned an <code>executar_codigo</code> call. The harness parsed <code>arguments</code> and passed <code>codigo</code> to the interpreter, which could access only the two functions the host exposed. Each function checked the order and permissions. The example limits time, memory, and the number of calls.',
          )}</p>
          {@render packet(t('Programa entregue pelo modelo', 'Program returned by the model'), scene.executions[0].args.codigo, {language: 'javascript'})}
          {@render packet(t('Chamadas que o host executou, na ordem', 'Calls the host executed, in order'), scene.observations)}
          {@render packet(t('Objeto devolvido pelo programa', 'Object returned by the program'), scene.executions[0].result)}
        {:else}
          <p>{@html t(
            'Depois de receber a resposta completa, o harness lê <code>arguments</code> com <code>JSON.parse</code> e usa <code>name</code> para encontrar a função. A função da loja valida o número e a sessão. Os dados autorizados voltam como objeto JavaScript.',
            'After receiving the complete response, the harness reads <code>arguments</code> with <code>JSON.parse</code> and uses <code>name</code> to find the function. The store\'s function validates the order number and session. It returns the authorized data as a JavaScript object.',
          )}</p>
          {@render packet(t('Código do harness', 'Harness code'), sdkCode.openai, {language: 'javascript'})}
          {@render packet(t('Função executada e resultado registrado', 'Executed function and recorded result'), scene.executions[0])}
        {/if}
      {:else if step === 'result'}
        <p>{@html t(
          'O segundo POST envia o histórico, a chamada feita pelo modelo e <code>function_call_output</code>. O <code>call_id</code> repete o identificador que veio na chamada. Em <code>output</code> vai o resultado da função serializado como texto.',
          'The second POST sends the history, the model\'s tool call, and <code>function_call_output</code>. The <code>call_id</code> matches the ID in the original call. The <code>output</code> field carries the function result serialized as text.',
        )}</p>
        {@render packet(t('Item que liga o resultado à chamada', 'Item linking the result to the call'), result)}
        <details>
          <summary>{t('Ver corpo completo do segundo POST /v1/responses', 'View the full body of the second POST /v1/responses')}</summary>
          {@render packet(t('Segundo POST /v1/responses · corpo JSON', 'Second POST /v1/responses · JSON body'), scene.http[1].request)}
        </details>
      {/if}
    </div>
    <div class="links">
      <a href="/labs/tool-calling/trace.json" download>{t('Baixar a captura JSON completa', 'Download the full JSON trace')}</a>
      <a href="https://github.com/Luks3110/inference-atlas/tree/main/examples/tool-calling" target="_blank" rel="noreferrer">{t('Abrir o código que gravou o teste', 'Open the code that recorded the test')} {@html icon('external', 13)}</a>
    </div>
  {:else}
    <p role="status">{t('Carregando a captura…', 'Loading the trace…')}</p>
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
  p :global(code) { font-family: var(--mono); font-size: .88em; color: var(--ink); overflow-wrap: anywhere; }
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
