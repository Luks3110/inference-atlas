import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { writeFile } from 'node:fs/promises';
import { createOpenAI } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';
import { tool } from '@langchain/core/tools';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { codeCall, codeTool, executeCode } from './codemode.mjs';
import { z } from 'zod';
import {
  answer,
  codeAnswer,
  call,
  description,
  instructions,
  lookupOrder,
  model,
  question,
  responseEvents,
} from './fixture.mjs';
import { callOpenAI } from './raw.mjs';

const trace = {};
let current;
const server = createServer(async (req, res) => {
  try {
    assert.equal(req.url, '/v1/responses');
    let input = '';
    for await (const bytes of req) input += bytes.toString();
    const body = JSON.parse(input);
    const action = current === 'code' ? codeCall : call;
    const continued = body.input.find?.((item) => item.type === 'function_call_output');
    if (continued) {
      assert.equal(continued.call_id, action.call_id);
      assert.equal(JSON.parse(continued.output).status, 'em transporte');
    } else {
      if (current === 'code') {
        assert.deepEqual(body.tools, [codeTool]);
      } else {
        assert(body.tools.some((entry) => entry.name === 'consultar_pedido'));
        assert(body.tools.some((entry) => entry.name === 'calcular_frete'));
      }
    }
    const events = responseEvents(body, !!continued, action);
    trace[current].http.push({ request: body, events });
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    for (const event of events) {
      res.write('event: ' + event.type + '\n');
      res.write('data: ' + JSON.stringify(event) + '\n\n');
    }
    res.end();
  } catch (error) {
    console.error(error.message);
    res.writeHead(422, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: error.message } }));
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const baseURL = 'http://127.0.0.1:' + server.address().port + '/v1';
const session = { allowedOrders: [42] };
const argsSchema = z.object({ numero: z.number().int() }).strict();
const sdkArgs = { cep: z.string() };
function begin(name) {
  current = name;
  trace[name] = { http: [], observations: [], executions: [] };
}
function execute(name, args) {
  assert.equal(name, 'consultar_pedido');
  const result = lookupOrder(args, session);
  trace[current].executions.push({ name, args, result });
  return result;
}
try {
  begin('openai');
  assert.equal(await callOpenAI(baseURL, execute), answer);

  begin('mastra');
  const provider = createOpenAI({ baseURL, apiKey: 'local-demo' });
  const agent = new Agent({
    id: 'loja',
    name: 'Loja',
    instructions,
    model: provider.responses(model),
    tools: {
      consultar_pedido: createTool({
        id: 'consultar_pedido',
        description,
        inputSchema: argsSchema,
        execute: (args) => execute('consultar_pedido', args),
      }),
      calcular_frete: createTool({
        id: 'calcular_frete',
        description: 'Estima o preço do envio pelo CEP.',
        inputSchema: z.object(sdkArgs).strict(),
        execute: () => ({ preco: 12 }),
      }),
    },
  });
  const output = await agent.stream(question, { maxSteps: 2 });
  for await (const event of output.fullStream) {
    if (event.type.startsWith('tool') || event.type === 'text-delta') trace.mastra.observations.push(event);
  }
  assert.equal(await output.text, answer);

  begin('langchain');
  const consultarPedido = tool((args) => execute('consultar_pedido', args), {
    name: 'consultar_pedido',
    description,
    schema: argsSchema,
  });
  const calcularFrete = tool(() => ({ preco: 12 }), {
    name: 'calcular_frete',
    description: 'Estima o preço do envio pelo CEP.',
    schema: z.object(sdkArgs).strict(),
  });
  const registry = new Map([consultarPedido, calcularFrete].map((fn) => [fn.name, fn]));
  const openAI = new ChatOpenAI({
    model,
    useResponsesApi: true,
    apiKey: 'local-demo',
    configuration: { baseURL },
    maxRetries: 0,
  });
  const llm = openAI.bindTools([...registry.values()]);
  const messages = [new SystemMessage(instructions), new HumanMessage(question)];
  let full;
  for await (const chunk of await llm.stream(messages)) {
    if (chunk.tool_call_chunks?.length)
      trace.langchain.observations.push({ tool_call_chunks: chunk.tool_call_chunks });
    full = full ? full.concat(chunk) : chunk;
  }
  assert.equal(full.tool_calls.length, 1);
  const action = full.tool_calls[0];
  trace.langchain.observations.push({ tool_calls: full.tool_calls });
  const fn = registry.get(action.name);
  assert(fn, 'Função ausente no registro');
  const result = await fn.invoke(action);
  trace.langchain.observations.push({
    type: 'ToolMessage',
    tool_call_id: result.tool_call_id,
    content: result.content,
  });
  let text = '';
  for await (const chunk of await llm.stream([...messages, full, result])) text += chunk.text;
  assert.equal(text, answer);

  begin('langchain-agent');
  const routedAgent = createAgent({ model: openAI, tools: [...registry.values()], systemPrompt: instructions });
  const agentStream = await routedAgent.stream(
    { messages: [new HumanMessage(question)] },
    {
      streamMode: ['updates', 'messages'],
      recursionLimit: 8,
    },
  );
  let automaticText = '';
  for await (const [kind, event] of agentStream) {
    if (kind === 'messages') {
      const [msg] = event;
      if (msg.type === 'ai') automaticText += msg.text;
    } else {
      for (const [node, update] of Object.entries(event)) {
        for (const msg of update.messages ?? []) {
          if (msg.type === 'tool') {
            trace['langchain-agent'].observations.push({
              node,
              type: 'ToolMessage',
              tool_call_id: msg.tool_call_id,
              content: msg.content,
            });
          } else if (msg.tool_calls?.length) {
            trace['langchain-agent'].observations.push({ node, tool_calls: msg.tool_calls });
          }
        }
      }
    }
  }
  assert.equal(automaticText, answer);
  assert(trace['langchain-agent'].observations.some((event) => event.type === 'ToolMessage'));

  begin('mcp');
  const service = new McpServer({ name: 'loja-de-teste', version: '1.0.0' });
  service.registerTool('consultar_pedido', { description, inputSchema: argsSchema }, async (args) => ({
    content: [{ type: 'text', text: JSON.stringify(execute('consultar_pedido', args)) }],
  }));
  service.registerTool(
    'calcular_frete',
    {
      description: 'Estima o preço do envio pelo CEP.',
      inputSchema: z.object(sdkArgs).strict(),
    },
    async () => ({ content: [{ type: 'text', text: '12.00' }] }),
  );
  const client = new Client({ name: 'harness-de-teste', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  for (const [direction, transport] of [
    ['harness → servidor MCP', clientTransport],
    ['servidor MCP → harness', serverTransport],
  ]) {
    const send = transport.send.bind(transport);
    transport.send = (message, ...rest) => {
      trace.mcp.observations.push({ direction, message: structuredClone(message) });
      return send(message, ...rest);
    };
  }
  try {
    await service.connect(serverTransport);
    await client.connect(clientTransport);
    const { tools: catalog } = await client.listTools();
    const declarations = catalog.map(({ name, description, inputSchema }) => ({
      type: 'function',
      name,
      description,
      parameters: inputSchema,
      strict: true,
    }));
    const toolsByName = new Map(catalog.map((entry) => [entry.name, entry]));
    assert.equal(
      await callOpenAI(
        baseURL,
        async (name, args) => {
          assert(toolsByName.has(name));
          if (!argsSchema.safeParse(args).success) return { error: 'argumentos inválidos' };
          const result = await client.callTool({ name, arguments: args });
          assert.equal(result.isError ?? false, false);
          const content = result.content[0];
          assert.equal(content.type, 'text');
          return JSON.parse(content.text);
        },
        declarations,
      ),
      answer,
    );
  } finally {
    await client.close();
    await service.close();
  }

  begin('code');
  assert.equal(
    await callOpenAI(
      baseURL,
      async (name, args) => {
        assert.equal(name, codeTool.name);
        const result = await executeCode(args.codigo, session, (event) => trace.code.observations.push(event));
        trace.code.executions.push({ name, args, result });
        return result;
      },
      [codeTool],
      'Consulte status e previsão do pedido usando executar_codigo.',
    ),
    codeAnswer,
  );
  assert.equal(trace.code.observations.length, 2);
  assert.equal(trace.code.executions[0].result.previsao, '21/11');
  assert.deepEqual(await executeCode('typeof fetch', session, () => {}), 'undefined');
  assert.equal(
    (await executeCode('tools.consultar_pedido({ numero: 43 })', session, () => {})).error,
    'pedido indisponível',
  );

  for (const scene of Object.values(trace)) {
    assert.equal(scene.http.length, 2);
    assert.equal(scene.executions.length, 1);
  }
  await writeFile(process.argv[2] || 'trace.json', JSON.stringify(trace, null, 2) + '\n');
  console.log('HTTP, SSE, Mastra, LangChain, MCP e Code Mode conferidos.');
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
