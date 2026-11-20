const fields = {
  $schema: ['Indica qual versão do padrão JSON Schema descreve este objeto. Ajuda o leitor ou validador a interpretar as regras do esquema.', 'Specifies the JSON Schema version that describes this object so readers and validators interpret its rules correctly.'],
  additionalProperties: ['Com false, um objeto com campos além dos declarados em properties fica inválido pelo esquema.', 'With false, objects with fields beyond those declared in properties fail validation.'],
  annotations: ['Referências ou marcas ligadas ao texto, como citações. Uma lista vazia indica que este trecho veio sem marcas.', 'References or markers attached to text, such as citations. An empty list means this piece has no markers.'],
  args: ['Argumentos da função. No fragmento do LangChain, chegam como texto parcial. Na chamada completa, já são um objeto pronto para validar.', 'Function arguments. A LangChain chunk can hold partial text. The complete call holds an object ready to validate.'],
  argsTextDelta: ['Novo trecho do texto dos argumentos no Mastra. Acrescente na ordem, usando toolCallId para separar chamadas.', 'New argument text in Mastra. Append chunks in order and use toolCallId to keep calls separate.'],
  arguments: ['Dados que a função vai receber. O formato muda entre o JSON da OpenAI e a chamada feita pelo aplicativo.', 'Data the function will receive. The representation differs between the OpenAI JSON and the app\'s function call.'],
  code: ['Captura em que o modelo entrega código ao executor, que chama os serviços permitidos.', 'Trace where the model hands code to the executor, which calls the permitted services.'],
  cached_tokens: ['Quantos tokens da entrada foram tratados como reaproveitados no cache. O valor ajuda a interpretar uso e custo.', 'The number of reused input tokens counted as cached. It helps explain usage and cost.'],
  call_id: ['Identificador da chamada de ferramenta. Copie o mesmo valor para function_call_output para ligar a saída à proposta certa.', 'Tool call identifier. Copy it to function_call_output to link the output to the right call.'],
  capabilities: ['Recursos que o cliente ou servidor MCP anuncia na abertura da sessão, como a disponibilidade de ferramentas.', 'Features the MCP client or server advertises when opening the session, such as tool availability.'],
  cep: ['Código postal usado pela ferramenta de frete. É texto para manter zeros à esquerda.', 'Postal code used by the shipping tool. Text preserves leading zeros.'],
  clientInfo: ['Nome e versão do cliente MCP que abriu a sessão.', 'Name and version of the MCP client that opened the session.'],
  codigo: ['Trecho de JavaScript que o modelo passa a executar_codigo. O harness envia a string ao interpretador com as funções permitidas.', 'JavaScript the model passes to executar_codigo. The harness sends the string to an interpreter with the permitted functions.'],
  content: ['Conteúdo da mensagem. Pode trazer texto ou uma lista de partes, dependendo do protocolo.', 'Message content. It can contain text or a list of parts, depending on the protocol.'],
  content_index: ['Posição da parte de conteúdo dentro do item. Permite anexar o fragmento à parte de texto correspondente.', 'Position of the content part within its item. Use it to attach the chunk to the right piece of text.'],
  created_at: ['Hora de criação da resposta em segundos no formato Unix. Use para ordenar respostas pelo horário em que foram geradas.', 'When the response was created, in Unix seconds. Use it to sort responses by creation time.'],
  delta: ['Pedaço novo entregue pelo evento. O consumidor o acrescenta ao conteúdo que já recebeu.', 'New piece of data carried by the event. The consumer appends it to the data already received.'],
  description: ['Explica o que a ferramenta faz e quando é adequada. O modelo usa esse texto junto da pergunta para escolher uma função.', 'Explains what the tool does and when to use it. The model uses this together with the question to choose a function.'],
  direction: ['Sentido da mensagem registrada, como harness para servidor MCP.', 'Direction of the recorded message, such as harness to MCP server.'],
  effort: ['Nível de esforço de raciocínio pedido ao modelo, quando disponível. null indica que este registro veio sem um nível definido.', 'Requested reasoning effort, when supported. null means the record specifies no level.'],
  error: ['Informação de falha para decidir como tratar o resultado. null indica que a resposta veio sem erro registrado.', 'Failure details for deciding how to handle the result. null means the response has no recorded error.'],
  events: ['Eventos registrados na stream, na ordem em que chegaram.', 'Recorded stream events in the order they arrived.'],
  execution: ['Opções de execução anunciadas por esta ferramenta MCP. Nesta captura, informa se ela oferece execução como tarefa acompanhável.', 'Execution options the MCP tool advertises. In this trace, it says whether the tool can run as a trackable task.'],
  executions: ['Chamadas que o aplicativo efetivamente executou, com argumentos e resultado.', 'Calls the app executed, with their arguments and results.'],
  format: ['Formato esperado para a saída textual ou estruturada, como texto livre ou JSON com esquema.', 'Expected format for text or structured output, such as plain text or JSON with a schema.'],
  from: ['Parte do Mastra que emitiu o evento. AGENT identifica a execução do agente.', 'Part of Mastra that emitted the event. AGENT identifies the agent run.'],
  http: ['Requisições HTTP e eventos da API registrados pelo laboratório.', 'HTTP requests and API events recorded by the lab.'],
  id: ['Identificador usado para localizar este registro.', 'Identifier for looking up this record.'],
  incomplete_details: ['Motivo de uma resposta incompleta, como atingir o limite de saída. null indica que nenhum motivo foi registrado.', 'Reason a response is incomplete, such as reaching the output limit. null means the API recorded no reason.'],
  index: ['Posição da chamada na lista. O LangChain usa esse índice para juntar fragmentos da mesma chamada.', 'Call position in the list. LangChain uses this index to assemble chunks from the same call.'],
  input: ['Lista de itens enviados ao modelo. Na primeira requisição, inclui a pergunta. Na segunda, inclui também a chamada e o resultado da função.', 'Items sent to the model. The first request includes the question. The second also includes the function call and its result.'],
  inputSchema: ['Esquema dos argumentos anunciado pelo servidor MCP. O harness o coloca em parameters ao declarar a ferramenta para a OpenAI.', 'Argument schema advertised by the MCP server. The harness puts it in parameters when declaring the tool to OpenAI.'],
  input_tokens: ['Total de tokens de entrada contabilizados pela API, incluindo o conteúdo fornecido ao modelo.', 'Total input tokens counted by the API, including the content supplied to the model.'],
  input_tokens_details: ['Detalhamento dos tokens de entrada, como a parte reaproveitada em cache.', 'Breakdown of input tokens, such as the portion reused from the cache.'],
  instructions: ['Orientações ao modelo para esta requisição, como quando usar a ferramenta do pedido e quando consultar o frete.', 'Instructions to the model for this request, such as when to use the order tool or check shipping.'],
  item: ['Item completo ou parcial ligado a este evento. Pode ser uma chamada de função ou uma mensagem.', 'Complete or partial item associated with this event, such as a function call or a message.'],
  itemId: ['ID do item da OpenAI preservado pelo adaptador. Corresponde ao item_id nos eventos da stream do provedor.', 'OpenAI item ID retained by the adapter. It matches item_id in the provider\'s stream events.'],
  item_id: ['Identifica o item de saída ao qual o evento pertence. Use para acrescentar cada fragmento à chamada ou mensagem certa.', 'Identifies the output item this event belongs to. Use it to append each chunk to the right call or message.'],
  jsonrpc: ['Versão do formato de mensagens JSON-RPC. O MCP usa este campo para distinguir a estrutura de requisições e respostas.', 'Version of the JSON-RPC message format. MCP uses this field to identify the structure of requests and responses.'],
  langchain: ['Captura do LangChain com montagem e execução da chamada pelo código do harness.', 'LangChain trace where the harness assembles and executes the call.'],
  'langchain-agent': ['Captura do LangChain usando createAgent para executar o ciclo de ferramentas.', 'LangChain trace using createAgent to run the tool loop.'],
  listChanged: ['Informa se o servidor anuncia mudanças no catálogo de ferramentas para o cliente atualizar a lista.', 'Indicates whether the server announces catalog changes so the client can refresh its tool list.'],
  logprobs: ['Probabilidades em escala logarítmica associadas aos tokens, quando fornecidas. A lista vazia mostra que esta captura veio sem esses valores.', 'Token probabilities on a logarithmic scale, when supplied. The empty list means this trace contains no such values.'],
  mastra: ['Captura do agente Mastra, das chamadas HTTP e dos eventos internos.', 'Trace of the Mastra agent, HTTP calls, and internal events.'],
  mcp: ['Captura em que o harness usa um cliente MCP para descobrir e executar a ferramenta.', 'Trace where the harness uses an MCP client to discover and execute the tool.'],
  maximum: ['Maior valor numérico aceito pelo esquema, incluindo o próprio limite.', 'Largest number the schema accepts, including the limit itself.'],
  message: ['Mensagem que foi transmitida e registrada sem a descrição do sentido da troca.', 'The recorded message payload without the direction of the exchange.'],
  metadata: ['Dados auxiliares associados ao pedido ou resposta, úteis para identificar e organizar registros.', 'Auxiliary data for identifying and organizing request or response records.'],
  method: ['Operação JSON-RPC que o cliente está pedindo ao servidor. tools/list descobre ferramentas e tools/call pede que uma seja executada.', 'JSON-RPC operation the client asks the server to perform. tools/list discovers tools and tools/call runs one.'],
  minimum: ['Menor valor numérico aceito pelo esquema, incluindo o próprio limite.', 'Smallest number the schema accepts, including the limit itself.'],
  model: ['Nome do modelo ao qual a API envia a requisição ou do qual recebeu a resposta.', 'Name of the model that receives the API request or returned the response.'],
  name: ['Nome usado para anunciar ou identificar uma função. Ao receber a chamada, o harness procura esse nome no registro.', 'Name used to advertise or identify a function. The harness looks it up in the registry when a call arrives.'],
  node: ['Etapa do agente LangChain que emitiu esta atualização. model_request indica o modelo. tools indica o executor de ferramentas.', 'LangChain agent step that emitted this update. model_request identifies the model and tools identifies the tool executor.'],
  numero: ['Número do pedido que a função deve consultar. O aplicativo usa este valor junto da sessão para localizar o pedido autorizado.', 'Order number the function should look up. The app uses it with the session to find the authorized order.'],
  object: ['Categoria do objeto completo da API. response identifica o registro de uma resposta.', 'Category of this API object. response identifies a response record.'],
  observations: ['Eventos internos do SDK ou mensagens de protocolo coletadas durante a execução.', 'Internal SDK events or protocol messages collected during execution.'],
  openai: ['Metadados específicos da OpenAI que o adaptador preserva para rastrear a chamada até o provedor.', 'OpenAI metadata the adapter retains so you can trace the call back to the provider.'],
  output: ['O que saiu da execução ou da geração.', 'Data produced by execution or generation.'],
  output_index: ['Posição do item na saída da API Responses. Ajuda a separar chamadas e mensagens que chegam na mesma stream.', 'Item position in the Responses API output. Use it to distinguish calls and messages arriving in the same stream.'],
  output_tokens: ['Total de tokens de saída contabilizados pela API.', 'Total output tokens counted by the API.'],
  output_tokens_details: ['Detalhamento dos tokens de saída, como a quantidade usada no raciocínio do modelo.', 'Breakdown of output tokens, such as the portion used for reasoning.'],
  parallel_tool_calls: ['Controla se a API permite várias chamadas de ferramenta na mesma resposta. false mantém o exemplo em uma chamada por vez.', 'Controls whether the API allows multiple calls in one response. false limits this example to one call at a time.'],
  parameters: ['JSON Schema dos argumentos que o aplicativo anuncia na API. Descreve campos, valores aceitos e quais são obrigatórios.', 'JSON Schema for the arguments the app declares to the API. It describes fields, accepted values, and which fields are required.'],
  params: ['Dados enviados junto ao método JSON-RPC. Em tools/call, incluem o nome da ferramenta e os argumentos.', 'Data sent with the JSON-RPC method. For tools/call, it includes the tool name and arguments.'],
  part: ['Parte de conteúdo que está começando ou terminando. O content_index indica sua posição.', 'Content part that is starting or ending. content_index gives its position.'],
  payload: ['Campos específicos do evento emitido pelo Mastra, como nome, argumentos e resultado da ferramenta.', 'Fields specific to the Mastra event, such as the tool name, arguments, and result.'],
  previous_response_id: ['Liga a nova requisição a uma resposta anterior guardada pela API. Neste exemplo, o histórico é enviado no próprio input.', 'Links the new request to an earlier response stored by the API. This example sends the history directly in input.'],
  previsao: ['Data de entrega que a ferramenta de rastreio devolveu no exercício.', 'Delivery date returned by the tracking tool in the exercise.'],
  properties: ['Lista os campos que o objeto de argumentos pode conter e define o tipo ou as regras de cada um.', 'Defines the fields the argument object can contain and each field\'s type or rules.'],
  protocolVersion: ['Versão do protocolo MCP usada na comunicação após a inicialização.', 'MCP protocol version used after initialization.'],
  providerMetadata: ['Informações do provedor que o SDK conserva, como o ID original do item da OpenAI.', 'Provider information the SDK retains, such as the original OpenAI item ID.'],
  reasoning: ['Configurações ou metadados de raciocínio do modelo, quando disponíveis.', 'Model reasoning settings or metadata, when available.'],
  reasoning_tokens: ['Quantidade de tokens de saída contabilizados como raciocínio.', 'Number of output tokens counted as reasoning.'],
  request: ['Corpo do pedido registrado pelo servidor de teste.', 'Request body recorded by the test server.'],
  required: ['Nomes dos campos que precisam aparecer para o objeto de argumentos passar pela validação.', 'Names of fields the argument object must contain to pass validation.'],
  response: ['Estado da resposta da API neste evento. Em response.completed, contém a lista final de itens.', 'State of the API response at this event. In response.completed, it contains the final list of items.'],
  result: ['Resultado devolvido ao chamador. Em JSON-RPC, ocupa este campo quando o método tem resposta de sucesso no protocolo.', 'Data returned to the caller. For a successful JSON-RPC method response, the data goes in this field.'],
  role: ['Diz de quem é a mensagem. user é a mensagem da pessoa, system traz instruções e assistant identifica a resposta do modelo.', 'Identifies the speaker. user is the person\'s message, system provides instructions, and assistant is the model\'s reply.'],
  runId: ['ID da execução do Mastra. Agrupa seus eventos e ajuda a localizar a mesma rodada nos registros.', 'Mastra run ID. It groups events from the same run so you can find them in the logs.'],
  sequence_number: ['Número de ordem deste evento na stream. Ajuda a conferir a sequência ao investigar a captura.', 'Position of this event in the stream. Use it to check event order in the trace.'],
  serverInfo: ['Identidade e versão do servidor que o cliente MCP encontrou.', 'Identity and version of the server the MCP client connected to.'],
  status: ['Estado atual do registro ou do pedido.', 'Current state of the record or order.'],
  store: ['Controla se a OpenAI guarda a resposta para recuperação pela API. Com false, o harness deste exemplo reenvia o histórico necessário.', 'Controls whether OpenAI stores the response for API retrieval. With false, this harness resends the required history.'],
  stream: ['Com true, pede que a API envie a resposta aos poucos por eventos SSE.', 'With true, asks the API to stream the response as SSE events.'],
  strict: ['Com true, pede à API que os argumentos produzidos sigam rigorosamente o esquema compatível. A autorização acontece na execução.', 'With true, asks the API to produce arguments that follow the supported schema exactly. The app still checks authorization at execution time.'],
  summary: ['Configuração para pedir um resumo do raciocínio, quando o modelo oferece esse recurso. null indica que o registro veio sem pedido de resumo.', 'Requests a reasoning summary when the model supports it. null means the request asks for no summary.'],
  taskSupport: ['Indica se esta ferramenta MCP pode ser chamada como tarefa acompanhável. forbidden indica que usa a chamada direta.', 'Indicates whether this MCP tool supports running as a trackable task. forbidden means it uses a direct call.'],
  temperature: ['Ajusta quanto a amostragem do modelo varia entre alternativas. Interprete como configuração de geração.', 'Controls how much sampling varies among alternatives during generation.'],
  text: ['Texto de uma parte da mensagem ou configuração de formato de texto, conforme o objeto pai.', 'Text in a message part or text format settings, depending on the enclosing object.'],
  toolCallId: ['ID da chamada no Mastra. Liga os fragmentos, a chamada completa e o resultado da mesma execução de ferramenta.', 'Mastra call ID. It links the chunks, complete call, and result of the same tool execution.'],
  toolName: ['Nome da função escolhida pelo modelo. É a chave que o Mastra usa para procurar a função registrada.', 'Name of the function the model chose. Mastra uses it to look up the registered function.'],
  tool_call_chunks: ['Fragmentos da chamada recebidos pelo LangChain. O harness pode concatená-los pelo índice e aguardar a chamada completa.', 'Tool call fragments received by LangChain. The harness can join them by index and wait for the complete call.'],
  tool_call_id: ['ID que liga a ToolMessage do LangChain ao pedido de ferramenta que a originou.', 'ID linking the LangChain ToolMessage to the tool request that produced it.'],
  tool_calls: ['Chamadas completas já reconstruídas pelo LangChain. Cada item indica nome, argumentos e ID.', 'Complete calls LangChain assembled. Each item gives a name, arguments, and ID.'],
  tool_choice: ['Controla como o modelo pode usar ferramentas. auto deixa o modelo decidir quando usar uma. none pede texto sem nova chamada.', 'Controls how the model can use tools. auto lets the model decide when to use one. none requests text without another tool call.'],
  tools: ['Catálogo de ferramentas disponíveis nesta troca.', 'Catalog of tools available in this exchange.'],
  top_p: ['Limita a amostragem ao conjunto de alternativas que cobre a fração indicada de probabilidade.', 'Restricts sampling to the alternatives that cover this fraction of total probability.'],
  total_tokens: ['Soma dos tokens de entrada e saída contabilizados pela API.', 'Sum of input and output tokens counted by the API.'],
  truncation: ['Como a API deve tratar a entrada quando excede o limite. disabled deixa o recorte automático desativado.', 'How the API handles inputs over its limit. disabled turns off automatic truncation.'],
  type: ['Diz como interpretar este objeto. O protocolo ou o esquema define o significado do valor.', 'Tells you how to interpret this object. The protocol or schema defines what each value means.'],
  usage: ['Contagem de tokens reportada para a geração. Serve para medir uso e estimar custo.', 'Token counts reported for the generation. Use them to measure usage and estimate cost.'],
  version: ['Versão informada pela implementação que participa da mensagem.', 'Version reported by the implementation that sent the message.'],
};

const types = {
  function: ['Declara uma função que o modelo pode solicitar. name identifica a função e parameters descreve os argumentos.', 'Declares a function the model can request. name identifies the function and parameters describes its arguments.'],
  function_call: ['Pedido do modelo para o aplicativo executar uma função. Leia name e arguments e mantenha call_id para devolver o resultado.', 'Model\'s request for the app to execute a function. Read name and arguments, and keep call_id for returning the result.'],
  function_call_output: ['Saída da função que o harness envia de volta ao modelo. call_id aponta para a chamada que recebeu esse resultado.', 'Tool output the harness sends back to the model. call_id points to the call that received this result.'],
  tool_call_chunk: ['Fragmento de uma chamada no LangChain. Pode trazer só uma parte dos argumentos e o índice da chamada.', 'Part of a LangChain call. It may hold only part of the arguments and the call index.'],
  tool_call: ['Chamada completa no LangChain, com nome, ID e argumentos lidos.', 'Complete LangChain call with name, ID, and parsed arguments.'],
  ToolMessage: ['Mensagem com a saída da ferramenta no LangChain. tool_call_id aponta para a chamada original.', 'LangChain\'s tool output message. tool_call_id points to the original call.'],
  object: ['Regra do schema. O valor deve ser um objeto JSON com os campos descritos em properties.', 'Schema rule requiring a JSON object with the fields described by properties.'],
  integer: ['Regra do schema. O valor deve ser um número inteiro, como 42.', 'Schema rule requiring an integer, such as 42.'],
  string: ['Regra do schema. O valor deve ser texto, entre aspas no JSON.', 'Schema rule requiring text in JSON quotes.'],
  text: ['Bloco de texto simples. O campo text carrega os dados deste bloco.', 'Plain-text block. The text field contains the data for this block.'],
  message: ['Item de conversa. role informa quem fala e content carrega o conteúdo.', 'Conversation item. role identifies the speaker and content contains the message.'],
  input_text: ['Parte textual enviada na entrada do modelo.', 'Text supplied as model input.'],
  output_text: ['Parte textual produzida na resposta do modelo.', 'Text the model produced in its reply.'],
  'response.created': ['Primeiro estado registrado da resposta. O corpo response informa o ID usado para acompanhar a geração.', 'First recorded response state. The response object provides the ID for tracking the generation.'],
  'response.output_item.added': ['Abre um item de saída. O harness guarda o tipo e o ID para acompanhar os fragmentos seguintes.', 'Opens an output item. The harness keeps its type and ID to track subsequent chunks.'],
  'response.function_call_arguments.delta': ['Traz um fragmento de arguments. Use item_id para acrescentá-lo à chamada certa.', 'Carries a chunk of arguments. Use item_id to append it to the right call.'],
  'response.function_call_arguments.done': ['Entrega a string final dos argumentos. No exemplo, o harness ainda aguarda a conclusão da resposta antes de executar.', 'Carries the final arguments string. The harness in this example waits for the response to complete before executing.'],
  'response.output_item.done': ['Fecha este item de saída, agora com o conteúdo completo.', 'Closes this output item with its complete content.'],
  'response.output_text.delta': ['Traz mais texto para acrescentar à resposta exibida no chat.', 'Carries more text to append to the displayed chat reply.'],
  'response.completed': ['Informa que a resposta terminou e traz sua saída completa. O harness pode validar a chamada e decidir se a executa.', 'Signals that the response finished and contains the full output. The harness can now validate the call and decide whether to execute it.'],
  'tool-call-delta': ['Fragmento dos argumentos da função na stream do Mastra.', 'Function argument fragment in the Mastra stream.'],
  'tool-call': ['O Mastra já montou a chamada, com a ferramenta proposta e os argumentos lidos.', 'Mastra has assembled the call with the proposed tool and parsed arguments.'],
  'tool-result': ['O Mastra registrou o resultado que a função devolveu depois da execução.', 'Mastra recorded the result the function returned after execution.'],
  'text-delta': ['Fragmento de texto da resposta que o Mastra repassa à aplicação.', 'Part of the response text Mastra forwards to the app.'],
};

function fieldDescription(key, value, parent) {
  if (key === 'type') return Object.hasOwn(types, value) ? types[value] : fields.type;
  if (key === 'id') {
    if (parent.jsonrpc) return ['ID da troca JSON-RPC. O servidor devolve esse ID para o cliente parear a resposta com o pedido MCP.', 'ID of the JSON-RPC exchange. The server echoes it so the client can match the reply to the MCP request.'];
    if (parent.type === 'function_call') return ['ID do item de saída da OpenAI. Os eventos de argumentos apontam para ele em item_id. O retorno da ferramenta usa o call_id.', 'OpenAI output item ID. Argument events refer to it in item_id. The tool result uses call_id.'];
    if (parent.type === 'tool_call' || parent.type === 'tool_call_chunk') return ['ID da chamada no LangChain. A ToolMessage leva o mesmo valor em tool_call_id.', 'LangChain call ID. The ToolMessage includes the same value in tool_call_id.'];
    if (parent.object === 'response') return ['ID desta resposta completa da OpenAI, como resp_call42.', 'ID of this complete OpenAI response, such as resp_call42.'];
  }
  if (key === 'arguments' && typeof value === 'string') {
    return ['Os argumentos chegam como uma string JSON escapada. Junte os fragmentos e use JSON.parse depois de completar a chamada. Depois valide o objeto antes de executar.', 'Arguments arrive as an escaped JSON string. Join the chunks and use JSON.parse once you have the complete call. Validate the object before executing.'];
  }
  if (key === 'arguments' && parent.name) return ['Objeto com os argumentos a passar à função indicada por name, como numero para consultar um pedido.', 'Object containing the arguments to pass to the function identified by name, such as numero for an order lookup.'];
  if (key === 'description' && parent.type !== 'function' && parent.type) return ['Explica o que preencher neste campo. A descrição ajuda o modelo a produzir o argumento, e as regras do esquema definem os valores aceitos.', 'Explains what to enter in this field. The description helps the model produce the argument, and the schema rules define allowed values.'];
  if (key === 'numero' && value?.type === 'integer') return ['Declara o argumento que identifica o pedido. type indica como escrevê-lo e minimum define o menor número aceito.', 'Declares the argument that identifies the order. type describes its representation and minimum sets the smallest accepted number.'];
  if (key === 'output' && parent.type === 'function_call_output') {
    return ['Resultado da ferramenta serializado como texto para este item da API. O call_id ao lado aponta para a chamada que pediu o dado.', 'Tool result serialized as text for this API item. The adjacent call_id points to the call that requested it.'];
  }
  if (key === 'output' && parent.object === 'response') return ['Lista de itens que a OpenAI produziu, como mensagens de texto e chamadas de função.', 'Items OpenAI produced, such as text messages and function calls.'];
  if (key === 'output' && parent.call_id) return ['Dados que a ferramenta devolveu, como o status do pedido ou uma falha. O aplicativo usa call_id para entregar o resultado à chamada certa.', 'Data the tool returned, such as an order status or a failure. The app uses call_id to deliver it to the correct call.'];
  if (key === 'error' && typeof value === 'string') return ['Motivo pelo qual a consulta falhou. O modelo pode explicar a falha à pessoa ou pedir que tente de novo.', 'Reason the lookup failed. The model can explain the failure or ask the person to try again.'];
  if (key === 'content' && parent.type === 'ToolMessage') return ['Conteúdo retornado pela ferramenta. O adaptador do LangChain envia esse texto à OpenAI usando tool_call_id para ligar à chamada original.', 'Content returned by the tool. The LangChain adapter sends it to OpenAI and uses tool_call_id to link it to the original call.'];
  if (key === 'tools' && parent.model) return ['Lista que o harness envia à API. Cada entrada dá ao modelo o nome, a descrição e o schema de uma ferramenta disponível.', 'List the harness sends to the API. Each entry gives the model an available tool\'s name, description, and schema.'];
  if (key === 'tools' && Array.isArray(value)) return ['Catálogo que o servidor MCP devolve. Cada ferramenta traz o nome, a descrição e o esquema que o cliente pode converter para a API do modelo.', 'Catalog returned by the MCP server. Each tool supplies a name, description, and schema the client can convert for the model API.'];
  if (key === 'delta') {
    if (parent.type === 'response.function_call_arguments.delta') return ['Fragmento literal dos argumentos. Acrescente a delta ao texto da chamada identificado por item_id.', 'Literal argument fragment. Append delta to the call text identified by item_id.'];
    if (parent.type === 'response.output_text.delta') return ['Fragmento de texto que o aplicativo acrescenta à resposta exibida.', 'Text fragment the app appends to the visible reply.'];
  }
  if (key === 'status') {
    if (parent.type === 'function_call' || parent.type === 'message') return ['Estado do item na stream. in_progress indica que ele ainda está sendo produzido. completed indica que o item chegou ao fim.', 'State of the item in the stream. in_progress means the API is still producing it, and completed means it has finished.'];
    if (parent.object === 'response') return ['Estado da resposta inteira. completed aparece após a API terminar a lista de itens.', 'State of the whole response. completed appears once the API finishes the item list.'];
    if (typeof parent.numero === 'number' || value === 'em transporte') return ['Situação da entrega encontrada pela ferramenta da loja. O modelo usa esse valor na frase que devolve à pessoa.', 'Delivery status found by the store\'s tool. The model uses this value in its reply.'];
  }
  if (key === 'strict' && value === null) return ['O adaptador deixou a opção sem valor explícito nesta captura. Use true para pedir a restrição de schema quando a API e o esquema a suportam.', 'The adapter supplied no explicit value in this trace. Use true to request schema enforcement when the API and schema support it.'];
  return Object.hasOwn(fields, key) ? fields[key] : null;
}

export function describeField(key, value, parent, translate = (portuguese) => portuguese) {
  const description = fieldDescription(key, value, parent);
  return description ? translate(...description) : '';
}

// Build the indented JSON text. Only keys become interactive tokens.
export function jsonTokens(value, translate) {
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
        tokens.push({text, key, path:next, help:describeField(key, value, node, translate), value});
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
