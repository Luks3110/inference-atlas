const fields = {
  $schema: 'Indica qual versão do padrão JSON Schema descreve este objeto. Ajuda o leitor ou validador a interpretar as regras do esquema.',
  additionalProperties: 'Com false, um objeto com campos além dos declarados em properties fica inválido pelo esquema.',
  annotations: 'Referências ou marcas ligadas ao texto, como citações. Uma lista vazia indica que este trecho veio sem marcas.',
  args: 'Argumentos da função. No fragmento do LangChain, chegam como texto parcial. Na chamada completa, já são um objeto pronto para validar.',
  argsTextDelta: 'Novo trecho do texto dos argumentos no Mastra. Acrescente na ordem, usando toolCallId para separar chamadas.',
  arguments: 'Dados que a função vai receber. O formato muda entre o JSON da OpenAI e a chamada feita pelo aplicativo.',
  code: 'Captura em que o modelo entrega código ao executor, que chama os serviços permitidos.',
  cached_tokens: 'Quantos tokens da entrada foram tratados como reaproveitados no cache. O valor ajuda a interpretar uso e custo.',
  call_id: 'Identificador da chamada de ferramenta. Copie o mesmo valor para function_call_output para ligar a saída à proposta certa.',
  capabilities: 'Recursos que o cliente ou servidor MCP anuncia na abertura da sessão, como a disponibilidade de ferramentas.',
  cep: 'Código postal usado pela ferramenta de frete. É texto para manter zeros à esquerda.',
  clientInfo: 'Nome e versão do cliente MCP que abriu a sessão.',
  codigo: 'Trecho de JavaScript que o modelo passa a executar_codigo. O harness envia a string ao interpretador com as funções permitidas.',
  content: 'Conteúdo da mensagem. Pode trazer texto ou uma lista de partes, dependendo do protocolo.',
  content_index: 'Posição da parte de conteúdo dentro do item. Permite anexar o fragmento à parte de texto correspondente.',
  created_at: 'Hora de criação da resposta em segundos no formato Unix. Use para ordenar respostas pelo horário em que foram geradas.',
  delta: 'Pedaço novo entregue pelo evento. O consumidor o acrescenta ao conteúdo que já recebeu.',
  description: 'Explica o que a ferramenta faz e quando é adequada. O modelo usa esse texto junto da pergunta para escolher uma função.',
  direction: 'Sentido da mensagem registrada, como harness para servidor MCP.',
  effort: 'Nível de esforço de raciocínio pedido ao modelo, quando disponível. null indica que este registro veio sem um nível definido.',
  error: 'Informação de falha para decidir como tratar o resultado. null indica que a resposta veio sem erro registrado.',
  events: 'Eventos registrados na stream, na ordem em que chegaram.',
  execution: 'Opções de execução anunciadas por esta ferramenta MCP. Nesta captura, informa se ela oferece execução como tarefa acompanhável.',
  executions: 'Chamadas que o aplicativo efetivamente executou, com argumentos e resultado.',
  format: 'Formato esperado para a saída textual ou estruturada, como texto livre ou JSON com esquema.',
  from: 'Parte do Mastra que emitiu o evento. AGENT identifica a execução do agente.',
  http: 'Requisições HTTP e eventos da API registrados pelo laboratório.',
  id: 'Identificador usado para localizar este registro.',
  incomplete_details: 'Motivo de uma resposta incompleta, como atingir o limite de saída. null indica que nenhum motivo foi registrado.',
  index: 'Posição da chamada na lista. O LangChain usa esse índice para juntar fragmentos da mesma chamada.',
  input: 'Lista de itens enviados ao modelo. Na primeira requisição, inclui a pergunta. Na segunda, inclui também a chamada e o resultado da função.',
  inputSchema: 'Esquema dos argumentos anunciado pelo servidor MCP. O harness o coloca em parameters ao declarar a ferramenta para a OpenAI.',
  input_tokens: 'Total de tokens de entrada contabilizados pela API, incluindo o conteúdo fornecido ao modelo.',
  input_tokens_details: 'Detalhamento dos tokens de entrada, como a parte reaproveitada em cache.',
  instructions: 'Orientações ao modelo para esta requisição, como quando usar a ferramenta do pedido e quando consultar o frete.',
  item: 'Item completo ou parcial ligado a este evento. Pode ser uma chamada de função ou uma mensagem.',
  itemId: 'ID do item da OpenAI preservado pelo adaptador. Corresponde ao item_id nos eventos da stream do provedor.',
  item_id: 'Identifica o item de saída ao qual o evento pertence. Use para acrescentar cada fragmento à chamada ou mensagem certa.',
  jsonrpc: 'Versão do formato de mensagens JSON-RPC. O MCP usa este campo para distinguir a estrutura de requisições e respostas.',
  langchain: 'Captura do LangChain com montagem e execução da chamada pelo código do harness.',
  'langchain-agent': 'Captura do LangChain usando createAgent para executar o ciclo de ferramentas.',
  listChanged: 'Informa se o servidor anuncia mudanças no catálogo de ferramentas para o cliente atualizar a lista.',
  logprobs: 'Probabilidades em escala logarítmica associadas aos tokens, quando fornecidas. A lista vazia mostra que esta captura veio sem esses valores.',
  mastra: 'Captura do agente Mastra, das chamadas HTTP e dos eventos internos.',
  mcp: 'Captura em que o harness usa um cliente MCP para descobrir e executar a ferramenta.',
  maximum: 'Maior valor numérico aceito pelo esquema, incluindo o próprio limite.',
  message: 'Mensagem que foi transmitida e registrada sem a descrição do sentido da troca.',
  metadata: 'Dados auxiliares associados ao pedido ou resposta, úteis para identificar e organizar registros.',
  method: 'Operação JSON-RPC que o cliente está pedindo ao servidor. tools/list descobre ferramentas e tools/call pede que uma seja executada.',
  minimum: 'Menor valor numérico aceito pelo esquema, incluindo o próprio limite.',
  model: 'Nome do modelo ao qual a API envia a requisição ou do qual recebeu a resposta.',
  name: 'Nome usado para anunciar ou identificar uma função. Ao receber a chamada, o harness procura esse nome no registro.',
  node: 'Etapa do agente LangChain que emitiu esta atualização. model_request indica o modelo. tools indica o executor de ferramentas.',
  numero: 'Número do pedido que a função deve consultar. O aplicativo usa este valor junto da sessão para localizar o pedido autorizado.',
  object: 'Categoria do objeto completo da API. response identifica o registro de uma resposta.',
  observations: 'Eventos internos do SDK ou mensagens de protocolo coletadas durante a execução.',
  openai: 'Metadados específicos da OpenAI que o adaptador preserva para rastrear a chamada até o provedor.',
  output: 'O que saiu da execução ou da geração.',
  output_index: 'Posição do item na saída da API Responses. Ajuda a separar chamadas e mensagens que chegam na mesma stream.',
  output_tokens: 'Total de tokens de saída contabilizados pela API.',
  output_tokens_details: 'Detalhamento dos tokens de saída, como a quantidade usada no raciocínio do modelo.',
  parallel_tool_calls: 'Controla se a API permite várias chamadas de ferramenta na mesma resposta. false mantém o exemplo em uma chamada por vez.',
  parameters: 'JSON Schema dos argumentos que o aplicativo anuncia na API. Descreve campos, valores aceitos e quais são obrigatórios.',
  params: 'Dados enviados junto ao método JSON-RPC. Em tools/call, incluem o nome da ferramenta e os argumentos.',
  part: 'Parte de conteúdo que está começando ou terminando. O content_index indica sua posição.',
  payload: 'Campos específicos do evento emitido pelo Mastra, como nome, argumentos e resultado da ferramenta.',
  previous_response_id: 'Liga a nova requisição a uma resposta anterior guardada pela API. Neste exemplo, o histórico é enviado no próprio input.',
  previsao: 'Data de entrega que a ferramenta de rastreio devolveu no exercício.',
  properties: 'Lista os campos que o objeto de argumentos pode conter e define o tipo ou as regras de cada um.',
  protocolVersion: 'Versão do protocolo MCP usada na comunicação após a inicialização.',
  providerMetadata: 'Informações do provedor que o SDK conserva, como o ID original do item da OpenAI.',
  reasoning: 'Configurações ou metadados de raciocínio do modelo, quando disponíveis.',
  reasoning_tokens: 'Quantidade de tokens de saída contabilizados como raciocínio.',
  request: 'Corpo do pedido registrado pelo servidor de teste.',
  required: 'Nomes dos campos que precisam aparecer para o objeto de argumentos passar pela validação.',
  response: 'Estado da resposta da API neste evento. Em response.completed, contém a lista final de itens.',
  result: 'Resultado devolvido ao chamador. Em JSON-RPC, ocupa este campo quando o método tem resposta de sucesso no protocolo.',
  role: 'Diz de quem é a mensagem. user é a mensagem da pessoa, system traz instruções e assistant identifica a resposta do modelo.',
  runId: 'ID da execução do Mastra. Agrupa seus eventos e ajuda a localizar a mesma rodada nos registros.',
  sequence_number: 'Número de ordem deste evento na stream. Ajuda a conferir a sequência ao investigar a captura.',
  serverInfo: 'Identidade e versão do servidor que o cliente MCP encontrou.',
  status: 'Estado atual do registro ou do pedido.',
  store: 'Controla se a OpenAI guarda a resposta para recuperação pela API. Com false, o harness deste exemplo reenvia o histórico necessário.',
  stream: 'Com true, pede que a API envie a resposta aos poucos por eventos SSE.',
  strict: 'Com true, pede à API que os argumentos produzidos sigam rigorosamente o esquema compatível. A autorização acontece na execução.',
  summary: 'Configuração para pedir um resumo do raciocínio, quando o modelo oferece esse recurso. null indica que o registro veio sem pedido de resumo.',
  taskSupport: 'Indica se esta ferramenta MCP pode ser chamada como tarefa acompanhável. forbidden indica que usa a chamada direta.',
  temperature: 'Ajusta quanto a amostragem do modelo varia entre alternativas. Interprete como configuração de geração.',
  text: 'Texto de uma parte da mensagem ou configuração de formato de texto, conforme o objeto pai.',
  toolCallId: 'ID da chamada no Mastra. Liga os fragmentos, a chamada completa e o resultado da mesma execução de ferramenta.',
  toolName: 'Nome da função escolhida pelo modelo. É a chave que o Mastra usa para procurar a função registrada.',
  tool_call_chunks: 'Fragmentos da chamada recebidos pelo LangChain. O harness pode concatená-los pelo índice e aguardar a chamada completa.',
  tool_call_id: 'ID que liga a ToolMessage do LangChain ao pedido de ferramenta que a originou.',
  tool_calls: 'Chamadas completas já reconstruídas pelo LangChain. Cada item indica nome, argumentos e ID.',
  tool_choice: 'Controla como o modelo pode usar ferramentas. auto deixa o modelo decidir quando usar uma. none pede texto sem nova chamada.',
  tools: 'Catálogo de ferramentas disponíveis nesta troca.',
  top_p: 'Limita a amostragem ao conjunto de alternativas que cobre a fração indicada de probabilidade.',
  total_tokens: 'Soma dos tokens de entrada e saída contabilizados pela API.',
  truncation: 'Como a API deve tratar a entrada quando excede o limite. disabled deixa o recorte automático desativado.',
  type: 'Diz como interpretar este objeto. O protocolo ou o esquema define o significado do valor.',
  usage: 'Contagem de tokens reportada para a geração. Serve para medir uso e estimar custo.',
  version: 'Versão informada pela implementação que participa da mensagem.',
};

const types = {
  function: 'Declara uma função que o modelo pode solicitar. name identifica a função e parameters descreve os argumentos.',
  function_call: 'Pedido do modelo para o aplicativo executar uma função. Leia name e arguments e mantenha call_id para devolver o resultado.',
  function_call_output: 'Saída da função que o harness envia de volta ao modelo. call_id aponta para a chamada que recebeu esse resultado.',
  tool_call_chunk: 'Fragmento de uma chamada no LangChain. Pode trazer só uma parte dos argumentos e o índice da chamada.',
  tool_call: 'Chamada completa no LangChain, com nome, ID e argumentos lidos.',
  ToolMessage: 'Mensagem com a saída da ferramenta no LangChain. tool_call_id aponta para a chamada original.',
  object: 'Regra do schema. O valor deve ser um objeto JSON com os campos descritos em properties.',
  integer: 'Regra do schema. O valor deve ser um número inteiro, como 42.',
  string: 'Regra do schema. O valor deve ser texto, entre aspas no JSON.',
  text: 'Bloco de texto simples. O campo text carrega os dados deste bloco.',
  message: 'Item de conversa. role informa quem fala e content carrega o conteúdo.',
  input_text: 'Parte textual enviada na entrada do modelo.',
  output_text: 'Parte textual produzida na resposta do modelo.',
  'response.created': 'Primeiro estado registrado da resposta. O corpo response informa o ID usado para acompanhar a geração.',
  'response.output_item.added': 'Abre um item de saída. O harness guarda o tipo e o ID para acompanhar os fragmentos seguintes.',
  'response.function_call_arguments.delta': 'Traz um fragmento de arguments. Use item_id para acrescentá-lo à chamada certa.',
  'response.function_call_arguments.done': 'Entrega a string final dos argumentos. No exemplo, o harness ainda aguarda a conclusão da resposta antes de executar.',
  'response.output_item.done': 'Fecha este item de saída, agora com o conteúdo completo.',
  'response.output_text.delta': 'Traz mais texto para acrescentar à resposta exibida no chat.',
  'response.completed': 'Informa que a resposta terminou e traz sua saída completa. O harness pode validar a chamada e decidir se a executa.',
  'tool-call-delta': 'Fragmento dos argumentos da função na stream do Mastra.',
  'tool-call': 'O Mastra já montou a chamada, com a ferramenta proposta e os argumentos lidos.',
  'tool-result': 'O Mastra registrou o resultado que a função devolveu depois da execução.',
  'text-delta': 'Fragmento de texto da resposta que o Mastra repassa à aplicação.',
};

export function describeField(key, value, parent) {
  if (key === 'type') return Object.hasOwn(types, value) ? types[value] : fields.type;
  if (key === 'id') {
    if (parent.jsonrpc) return 'ID da troca JSON-RPC. O servidor devolve esse ID para o cliente parear a resposta com o pedido MCP.';
    if (parent.type === 'function_call') return 'ID do item de saída da OpenAI. Os eventos de argumentos apontam para ele em item_id. O retorno da ferramenta usa o call_id.';
    if (parent.type === 'tool_call' || parent.type === 'tool_call_chunk') return 'ID da chamada no LangChain. A ToolMessage leva o mesmo valor em tool_call_id.';
    if (parent.object === 'response') return 'ID desta resposta completa da OpenAI, como resp_call42.';
  }
  if (key === 'arguments' && typeof value === 'string') {
    return 'Os argumentos chegam como uma string JSON escapada. Junte os fragmentos e use JSON.parse depois de completar a chamada. Depois valide o objeto antes de executar.';
  }
  if (key === 'arguments' && parent.name) return 'Objeto com os argumentos a passar à função indicada por name, como numero para consultar um pedido.';
  if (key === 'description' && parent.type !== 'function' && parent.type) return 'Explica o que preencher neste campo. A descrição ajuda o modelo a produzir o argumento, e as regras do esquema definem os valores aceitos.';
  if (key === 'numero' && value?.type === 'integer') return 'Declara o argumento que identifica o pedido. type indica como escrevê-lo e minimum define o menor número aceito.';
  if (key === 'output' && parent.type === 'function_call_output') {
    return 'Resultado da ferramenta serializado como texto para este item da API. O call_id ao lado aponta para a chamada que pediu o dado.';
  }
  if (key === 'output' && parent.object === 'response') return 'Lista de itens que a OpenAI produziu, como mensagens de texto e chamadas de função.';
  if (key === 'output' && parent.call_id) return 'Dados que a ferramenta devolveu, como o status do pedido ou uma falha. O aplicativo usa call_id para entregar o resultado à chamada certa.';
  if (key === 'error' && typeof value === 'string') return 'Motivo pelo qual a consulta falhou. O modelo pode explicar a falha à pessoa ou pedir que tente de novo.';
  if (key === 'content' && parent.type === 'ToolMessage') return 'Conteúdo retornado pela ferramenta. O adaptador do LangChain envia esse texto à OpenAI usando tool_call_id para ligar à chamada original.';
  if (key === 'tools' && parent.model) return 'Lista que o harness envia à API. Cada entrada dá ao modelo o nome, a descrição e o schema de uma ferramenta disponível.';
  if (key === 'tools' && Array.isArray(value)) return 'Catálogo que o servidor MCP devolve. Cada ferramenta traz o nome, a descrição e o esquema que o cliente pode converter para a API do modelo.';
  if (key === 'delta') {
    if (parent.type === 'response.function_call_arguments.delta') return 'Fragmento literal dos argumentos. Acrescente a delta ao texto da chamada identificado por item_id.';
    if (parent.type === 'response.output_text.delta') return 'Fragmento de texto que o aplicativo acrescenta à resposta exibida.';
  }
  if (key === 'status') {
    if (parent.type === 'function_call' || parent.type === 'message') return 'Estado do item na stream. in_progress indica que ele ainda está sendo produzido. completed indica que o item chegou ao fim.';
    if (parent.object === 'response') return 'Estado da resposta inteira. completed aparece após a API terminar a lista de itens.';
    if (typeof parent.numero === 'number' || value === 'em transporte') return 'Situação da entrega encontrada pela ferramenta da loja. O modelo usa esse valor na frase que devolve à pessoa.';
  }
  if (key === 'strict' && value === null) return 'O adaptador deixou a opção sem valor explícito nesta captura. Use true para pedir a restrição de schema quando a API e o esquema a suportam.';
  return Object.hasOwn(fields, key) ? fields[key] : '';
}

// Build the indented JSON text. Only keys become interactive tokens.
export function jsonTokens(value) {
  const tokens = [];
  const put = (text, kind) => tokens.push({text, kind});
  const indent = level => '\n' + '  '.repeat(level);
  function walk(node, path) {
    if (node === null || typeof node !== 'object') {
      put(JSON.stringify(node), typeof node === 'string' ? 'json-string' : 'json-literal');
      return;
    }
    const array = Array.isArray(node);
    const entries = Object.entries(node);
    put(array ? '[' : '{');
    entries.forEach(([key, value], index) => {
      const next = path.concat(array ? index : key);
      if (index) put(',');
      put(indent(next.length));
      if (!array) {
        const text = JSON.stringify(key);
        tokens.push({text, key, path:next, help:describeField(key,value,node), value});
        put(': ');
      }
      walk(value, next);
    });
    if (entries.length) put(indent(path.length));
    put(array ? ']' : '}');
  }
  walk(value, []);
  return tokens;
}

export function formatPath(path) {
  return path.reduce((label,key) => typeof key === 'number' ? label + '[' + key + ']'
    : label ? label + '.' + key : key, '');
}

export function decodeField(value) {
  if (typeof value !== 'string' || !/^\s*[\[{]/.test(value)) return null;
  try {
    const decoded = JSON.parse(value);
    return decoded && typeof decoded === 'object' ? decoded : null;
  } catch {
    return null;
  }
}
