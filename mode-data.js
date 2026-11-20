export const questions = [
  {
    topic: 'Agentes',
    title: 'Prazo de entrega ou pesquisa?',
    prompt: 'O banco já tem a data prevista para o pedido. Qual caminho você começa usando?',
    options: [
      'Consultar o pedido pelo código',
      'Delegar para dois especialistas',
      'Fazer uma pesquisa aberta no navegador',
    ],
    correct: 0,
    reason: 'A data já vem de uma fonte conhecida. Uma consulta validada e autorizada basta para esse caso.',
    source: 'https://mastra.ai/docs/guides/multi-agent-systems',
  },
  {
    topic: 'Temporal',
    title: 'A confirmação do pagamento se perdeu',
    prompt: 'O trabalhador caiu depois de chamar o provedor. Como retomar sem repetir o pagamento?',
    options: [
      'Gerar outra chave para a tentativa',
      'Usar a mesma chave e conferir o recibo',
      'Escolher um novo número de pedido',
    ],
    correct: 1,
    reason:
      'Se o provedor reconhece a mesma chave, a repetição encontra o pagamento anterior. Se não, confira o estado antes de reenviar.',
    source: 'https://docs.temporal.io/develop/typescript/activities/basics',
  },
  {
    topic: 'Evals',
    title: 'A nota subiu com uma gravação indevida',
    prompt:
      'A skill ganhou em clareza, mas chamou a ferramenta de reembolso sem aprovação. O que acontece com a versão?',
    options: [
      'Publicar porque a média subiu',
      'Ignorar se houve só uma chamada',
      'Bloquear até corrigir a permissão',
    ],
    correct: 2,
    reason:
      'Uma condição obrigatória deve ser testada separadamente da nota média. Clareza nunca autoriza uma gravação.',
    source: 'https://langfuse.com/docs/evaluation/core-concepts',
  },
  {
    topic: 'A2A',
    title: 'A logística pede um dado',
    prompt: 'A tarefa remota aguarda o número de rastreio. Como a aplicação continua?',
    options: [
      'Enviar o dado associado à tarefa existente',
      'Descartar a tarefa e criar sempre outra',
      'Marcar como concluída e devolver o vazio',
    ],
    correct: 0,
    reason: 'O identificador existente liga a nova mensagem ao trabalho que já começou.',
    source: 'https://a2a-protocol.org/latest/specification/',
  },
  {
    topic: 'Tenancy',
    title: 'Duas lojas têm um pedido 42',
    prompt: 'De onde vem a empresa usada para buscar o pedido?',
    options: [
      'De um argumento que o modelo produziu',
      'Da sessão autenticada da aplicação',
      'Do texto livre da última mensagem',
    ],
    correct: 1,
    reason:
      'O serviço verifica a identidade e usa o acesso autorizado tanto na leitura do banco quanto no cache e nas ferramentas.',
    source: 'https://mastra.ai/docs/guides/mcp-authentication-authorization',
  },
];

export const guides = [
  {
    title: 'Registrar um agente no Mastra',
    category: 'Agentes',
    description:
      'Use um modelo configurado no seu projeto. Registre a ferramenta de leitura e deixe a checagem de acesso dentro da função que consulta o pedido.',
    language: 'javascript',
    code: `import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { model, consultarPedido } from "./deps.js";

const suporte = new Agent({
  id: "suporte",
  name: "Suporte",
  instructions: "Consulte o pedido antes de dar um prazo.",
  model,
  tools: { consultarPedido },
});
export const mastra = new Mastra({ agents: { suporte } });`,
    source: 'https://mastra.ai/docs/agents/overview',
  },
  {
    title: 'Testar uma skill com Node.js',
    category: 'Evals',
    description:
      'Baixe avaliacao.mjs pelo laboratório. Salve este trecho como teste.mjs na mesma pasta e rode node teste.mjs. Troque a configuração para ver o teste detectar uma política errada ou o uso indevido da ferramenta.',
    language: 'javascript',
    code: `import assert from "node:assert/strict";
import { decide, evaluate, summarize } from "./avaliacao.mjs";

const results = evaluate(input => decide(input, {
  usePurchaseDate: true,
  allowWrite: false,
}));
console.table(results.map(({label, correct, allowed}) =>
  ({label, correct, allowed})));
assert(summarize(results).passes, "Falha na política ou na ferramenta");`,
    source: 'https://agentskills.io/specification',
  },
  {
    title: 'Chamar uma Activity do Temporal',
    category: 'Workflows',
    description:
      'No arquivo de Workflows do SDK TypeScript, use proxyActivities para chamar a função registrada no Worker. O exemplo só lê o pedido e limita o tempo total da Activity, incluindo novas tentativas.',
    language: 'typescript',
    code: `import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities.js";

const { consultarPedido } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 seconds",
  scheduleToCloseTimeout: "30 seconds",
  retry: { maximumAttempts: 3 },
});

export async function consultarNoFluxo(empresa: string, pedido: string) {
  return consultarPedido({ empresa, pedido });
}`,
    source: 'https://docs.temporal.io/develop/typescript/activities/basics',
  },
  {
    title: 'Ler o cartão de um agente A2A',
    category: 'Integração',
    description:
      'Troque a origem pelo endereço conhecido do seu serviço. Leia as interfaces, as capacidades e os requisitos de autenticação antes de escolher como enviar uma mensagem.',
    language: 'bash',
    code: `curl --fail --silent --show-error \\
  https://agente.example.com/.well-known/agent-card.json`,
    source: 'https://a2a-protocol.org/latest/topics/agent-discovery/',
  },
  {
    title: 'Ligar a consulta ao trace do Langfuse',
    category: 'Observabilidade',
    description:
      'Com o SDK e o exportador já configurados no servidor, registre cada etapa dentro da observação do pedido. O exemplo envia a versão da skill e o resultado da consulta, sem o texto ou o número do pedido.',
    language: 'javascript',
    code: `import { startActiveObservation } from "@langfuse/tracing";
import { buscarPolitica } from "./politicas.js";

await startActiveObservation("parecer-de-devolucao", async (request) => {
  request.update({ metadata: { skillVersion: "2" } });
  await startActiveObservation("buscar-politica", async (step) => {
    const result = await buscarPolitica();
    step.update({ output: { found: result !== null } });
  });
});`,
    source: 'https://langfuse.com/docs/observability/sdk/instrumentation',
  },
];
