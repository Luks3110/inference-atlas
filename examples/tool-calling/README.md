# Pedido 42 no protocolo

Este laboratório usa Node.js 22.13 ou mais recente. Um servidor HTTP em loopback simula a API Responses da OpenAI e serve eventos SSE. Os SDKs da Mastra e do LangChain recebem e processam essa stream de verdade. Os textos, as decisões do modelo e os dados da loja vêm da fixture local. A chave usada no teste é um valor fictício aceito pelo servidor de teste.

A partir da raiz do repositório:

```sh
cd examples/tool-calling
npm ci
npm run capture
```

O comando valida as duas requisições HTTP, os argumentos, o identificador da chamada e a execução da função nos seis exemplos. Ele grava a captura em `public/labs/tool-calling/trace.json`, que alimenta a aula. O ID interno da execução da Mastra muda a cada gravação.

- `fixture.mjs` define ferramentas, dados da loja e eventos SSE.
- `raw.mjs` lê SSE por HTTP, acumula argumentos, espera o fim da resposta e devolve `function_call_output`.
- `capture.mjs` executa os SDKs, tanto no LangChain manual quanto com createAgent, registra o servidor MCP em memória e captura as mensagens.
- `codemode.mjs` executa o programa da fixture em QuickJS. O código chama duas funções expostas explicitamente. Cada uma verifica a sessão antes de ler os dados da loja.

O Code Mode do exemplo usa funções síncronas sobre dados fixos. Ele limita tempo, memória e quantidade de chamadas. Para oferecer código de terceiros em um produto, projete o isolamento do executor e os controles do host para as operações reais que você pretende expor.
