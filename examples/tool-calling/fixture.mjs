export const model = 'gpt-4.1-mini';
export const question = 'Onde está meu pedido 42?';
export const instructions =
  'Para perguntas sobre status da entrega, use consultar_pedido. Use calcular_frete só para estimar preço de envio.';
export const description = 'Consulta o status da entrega de um pedido pelo número.';
export const schema = {
  type: 'object',
  properties: { numero: { type: 'integer' } },
  required: ['numero'],
  additionalProperties: false,
};
export const tools = [
  { type: 'function', name: 'consultar_pedido', description, parameters: schema, strict: true },
  {
    type: 'function',
    name: 'calcular_frete',
    description: 'Estima o preço do envio pelo CEP.',
    parameters: {
      type: 'object',
      properties: { cep: { type: 'string' } },
      required: ['cep'],
      additionalProperties: false,
    },
    strict: true,
  },
];
export const call = {
  type: 'function_call',
  id: 'fc_pedido42',
  call_id: 'call_pedido42',
  name: 'consultar_pedido',
  arguments: '{"numero":42}',
  status: 'completed',
};

export const answer = 'Seu pedido 42 está em transporte.';
export const codeAnswer = 'Seu pedido 42 está em transporte. A previsão é 21/11.';

export function responseEvents(body, isFinal, action = call) {
  const id = isFinal ? 'resp_final42' : 'resp_call42';
  const deltas =
    action === call
      ? ['Seu pedido 42', ' está em transporte.']
      : ['Seu pedido 42 está em transporte.', ' A previsão é 21/11.'];
  const finalText = deltas.join('');
  const message = {
    type: 'message',
    id: 'msg_pedido42',
    role: 'assistant',
    status: 'completed',
    content: [{ type: 'output_text', text: finalText, annotations: [], logprobs: [] }],
  };
  const item = isFinal ? message : action;
  const chunks =
    action === call
      ? ['{"numero":', '4', '2}']
      : [action.arguments.slice(0, 12), action.arguments.slice(12, 100), action.arguments.slice(100)];
  const response = {
    id,
    object: 'response',
    created_at: 1770000000,
    model,
    error: null,
    incomplete_details: null,
    instructions: body.instructions ?? null,
    metadata: {},
    parallel_tool_calls: body.parallel_tool_calls ?? true,
    previous_response_id: body.previous_response_id ?? null,
    reasoning: { effort: null, summary: null },
    text: { format: { type: 'text' } },
    tool_choice: body.tool_choice ?? 'auto',
    tools: body.tools ?? [],
    temperature: 1,
    top_p: 1,
    truncation: 'disabled',
    store: false,
    usage: null,
  };
  const partial = { ...item, status: 'in_progress', ...(isFinal ? { content: [] } : { arguments: '' }) };
  const content = message.content[0];
  const events = [
    { type: 'response.created', response: { ...response, status: 'in_progress', output: [] } },
    { type: 'response.output_item.added', output_index: 0, item: partial },
    ...(isFinal
      ? [
          {
            type: 'response.content_part.added',
            item_id: item.id,
            output_index: 0,
            content_index: 0,
            part: { ...content, text: '' },
          },
          ...deltas.map((delta) => ({
            type: 'response.output_text.delta',
            item_id: item.id,
            output_index: 0,
            content_index: 0,
            delta,
            logprobs: [],
          })),
          {
            type: 'response.output_text.done',
            item_id: item.id,
            output_index: 0,
            content_index: 0,
            text: finalText,
            logprobs: [],
          },
          {
            type: 'response.content_part.done',
            item_id: item.id,
            output_index: 0,
            content_index: 0,
            part: content,
          },
        ]
      : [
          ...chunks.map((delta) => ({
            type: 'response.function_call_arguments.delta',
            item_id: item.id,
            output_index: 0,
            delta,
          })),
          {
            type: 'response.function_call_arguments.done',
            item_id: item.id,
            output_index: 0,
            arguments: action.arguments,
          },
        ]),
    { type: 'response.output_item.done', output_index: 0, item },
    {
      type: 'response.completed',
      response: {
        ...response,
        status: 'completed',
        output: [item],
        usage: {
          input_tokens: 77,
          input_tokens_details: { cached_tokens: 0 },
          output_tokens: 19,
          output_tokens_details: { reasoning_tokens: 0 },
          total_tokens: 96,
        },
      },
    },
  ];
  return events.map((event, sequence_number) => ({ ...event, sequence_number }));
}

export function lookupOrder(args, session) {
  if (!Number.isSafeInteger(args?.numero)) return { error: 'numero precisa ser um inteiro' };
  if (!session.allowedOrders.includes(args.numero) || args.numero !== 42) return { error: 'pedido indisponível' };
  return { numero: 42, status: 'em transporte' };
}
