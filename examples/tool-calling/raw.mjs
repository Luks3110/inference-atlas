import { instructions, model, question, tools } from './fixture.mjs';

export async function* readSse(body) {
  let buffer = '';
  for await (const chunk of body.pipeThrough(new TextDecoderStream())) {
    buffer += chunk;
    let eventEnd;
    while ((eventEnd = /\r?\n\r?\n/.exec(buffer))) {
      const packet = buffer.slice(0, eventEnd.index);
      buffer = buffer.slice(eventEnd.index + eventEnd[0].length);
      const data = packet
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).replace(/^ /, ''))
        .join('\n');
      if (data && data !== '[DONE]') yield JSON.parse(data);
    }
  }
}

export async function callOpenAI(baseURL, execute, availableTools = tools, prompt = instructions) {
  const initial = {
    model,
    instructions: prompt,
    input: [{ role: 'user', content: question }],
    tools: availableTools,
    tool_choice: 'auto',
    parallel_tool_calls: false,
    stream: true,
    store: false,
  };
  async function readResponse(payload) {
    const res = await fetch(baseURL + '/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Resposta HTTP ' + res.status);
    const args = new Map();
    let completed;
    let text = '';
    for await (const event of readSse(res.body)) {
      if (event.type === 'response.output_item.added' && event.item.type === 'function_call') {
        args.set(event.item.id, event.item.arguments);
      } else if (event.type === 'response.function_call_arguments.delta' && args.has(event.item_id)) {
        args.set(event.item_id, args.get(event.item_id) + event.delta);
      } else if (event.type === 'response.output_text.delta') {
        text += event.delta;
      } else if (event.type === 'response.completed') {
        completed = event.response;
      }
    }
    if (!completed) throw new Error('A stream terminou sem response.completed.');
    return { completed, args, text };
  }

  const { completed: first, args } = await readResponse(initial);
  const calls = first.output.filter((item) => item.type === 'function_call');
  if (calls.length !== 1) throw new Error('A gravação do exercício espera uma chamada.');
  const [call] = calls;
  if (call.status !== 'completed' || args.get(call.id) !== call.arguments) {
    throw new Error('Argumentos incompletos.');
  }
  const output = await execute(call.name, JSON.parse(call.arguments));
  const { completed: second, text } = await readResponse({
    ...initial,
    input: [
      ...initial.input,
      ...first.output,
      { type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(output) },
    ],
    tool_choice: 'none',
  });
  if (second.output.some((item) => item.type === 'function_call')) throw new Error('Limite de chamadas atingido.');
  return text;
}
