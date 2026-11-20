import assert from 'node:assert/strict';
import { getQuickJS, shouldInterruptAfterDeadline } from 'quickjs-emscripten';
import { lookupOrder } from './fixture.mjs';

export const program = [
  '(() => {',
  '  const pedido = tools.consultar_pedido({ numero: 42 });',
  '  if (pedido.error) return pedido;',
  '  const rastreio = tools.consultar_rastreio({ numero: pedido.numero });',
  '  return { numero: pedido.numero, status: pedido.status, previsao: rastreio.previsao };',
  '})()',
].join('\n');

export const codeTool = {
  type: 'function',
  name: 'executar_codigo',
  description:
    'Executa JavaScript síncrono com tools.consultar_pedido e tools.consultar_rastreio. Ambas recebem { numero: inteiro }. Retorne um objeto JSON.',
  parameters: {
    type: 'object',
    properties: { codigo: { type: 'string' } },
    required: ['codigo'],
    additionalProperties: false,
  },
  strict: true,
};
export const codeCall = {
  type: 'function_call',
  id: 'fc_codigo42',
  call_id: 'call_codigo42',
  name: codeTool.name,
  arguments: JSON.stringify({ codigo: program }),
  status: 'completed',
};

export async function executeCode(code, session, record) {
  assert(typeof code === 'string' && code.length <= 4096, 'Código inválido ou grande demais.');
  const engine = await getQuickJS();
  const vm = engine.newContext();
  vm.runtime.setMemoryLimit(16 * 1024 * 1024);
  vm.runtime.setMaxStackSize(512 * 1024);
  vm.runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + 100));
  let remaining = 2;
  const allowed = {
    consultar_pedido: (args) => lookupOrder(args, session),
    consultar_rastreio: (args) => {
      const pedido = lookupOrder(args, session);
      return pedido.error ? pedido : { previsao: '21/11' };
    },
  };
  try {
    vm.newObject().consume((handle) => {
      for (const [name, run] of Object.entries(allowed)) {
        vm.newFunction(name, (arg) => {
          if (--remaining < 0) return vm.newString('{"error":"limite de chamadas"}');
          assert.equal(vm.typeof(arg), 'number', 'A ponte recebe somente o número.');
          const args = { numero: vm.getNumber(arg) };
          const result = run(args);
          record({ name, args, result });
          return vm.newString(JSON.stringify(result));
        }).consume((fn) => vm.setProp(handle, name, fn));
      }
      vm.setProp(vm.global, 'bridge', handle);
    });
    vm.unwrapResult(
      vm.evalCode(`
      const tools = Object.freeze(Object.fromEntries(
        Object.entries(bridge).map(([name, invoke]) =>
          [name, ({ numero }) => JSON.parse(invoke(numero))])
      ));
      delete globalThis.bridge;
    `),
    ).dispose();
    const result = vm.unwrapResult(vm.evalCode(code, 'codigo-do-modelo.js'));
    try {
      return vm.dump(result);
    } finally {
      result.dispose();
    }
  } finally {
    vm.dispose();
  }
}
