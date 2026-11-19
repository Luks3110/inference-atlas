// The three checkpoints correspond to the mechanism, its failure mode and an operational decision.
export const outcomes = {
  'atencao-gqa-rope': [
    'Calcular atenção causal com softmax estável',
    'Relacionar grupos de cabeças a KV por token',
    'Distinguir tráfego de HBM de volume de cálculo',
  ],
  'speculative-decoding': [
    'Verificar propostas do modelo auxiliar',
    'Calcular a correção após uma rejeição',
    'Medir o ganho sob a carga real',
  ],
  'rag-indice-hnsw': [
    'Percorrer camadas e a lista de candidatos',
    'Separar o efeito de M, efConstruction e efSearch',
    'Calibrar recall e latência com filtros ativos',
  ],
  'rag-quantizacao-vetorial': [
    'Estimar o armazenamento de SQ e PQ',
    'Calcular distância aproximada via codebooks',
    'Avaliar o teto de recall após reranking',
  ],
  'rag-ivf-e-shards': [
    'Escolher nlist e nprobe pela carga real',
    'Distribuir listas e fundir candidatos por shard',
    'Planejar uma troca de geração do índice',
  ],
  'ciclo-de-inferencia': [
    'Contar as peças da pergunta e das instruções',
    'Medir quanto demora para aparecer o primeiro texto',
    'Prever o que muda ao fechar o chat ou lotar a fila',
  ],
  'treino-e-inferencia': [
    'Separar treino e validação no tempo',
    'Reproduzir o pré-processamento online',
    'Decidir quando reverter o artefato',
  ],
  'latencia-e-vazao': [
    'Delimitar o relógio de TTFT e TPOT',
    'Localizar saturação na curva de carga',
    'Selecionar vazão útil dentro do SLO',
  ],
  'servidor-vllm': [
    'Identificar o modelo que a API serve',
    'Distinguir falha de contrato de fila cheia',
    'Aceitar uma réplica sob carga',
  ],
  'memoria-da-gpu': [
    'Converter parâmetros em GiB',
    'Estimar a parcela disponível para KV',
    'Validar concorrência com o contexto real',
  ],
  quantizacao: [
    'Contabilizar dados e metadados',
    'Localizar regressão nos exemplos difíceis',
    'Escolher precisão no hardware de destino',
  ],
  'kv-cache': [
    'Mapear blocos lógicos para físicos',
    'Rastrear referências compartilhadas',
    'Explicar quando a alocação falha',
  ],
  'batching-continuo': [
    'Reconstruir um lote por iteração',
    'Identificar disputa entre prefill e decode',
    'Regular o lote dentro da meta de latência',
  ],
  'cache-de-prefixo': [
    'Identificar o prefixo comum em IDs',
    'Explicar misses e pressão de memória',
    'Medir economia de prefill sob carga',
  ],
  'mistura-de-especialistas': [
    'Rastrear a escolha top-k por token',
    'Combinar saídas com os pesos corretos',
    'Diagnosticar concentração de carga',
  ],
  'paralelismo-de-especialistas': [
    'Localizar experts por rank',
    'Estimar o volume no all-to-all',
    'Distinguir skew de um enlace lento',
  ],
  'paralelismo-de-modelo': [
    'Particionar pesos e camadas',
    'Calcular o custo de comunicação e bolhas',
    'Escolher o grupo de réplicas',
  ],
  'replicas-e-autoscaling': [
    'Converter pico em capacidade útil',
    'Modelar atraso de aquecimento',
    'Prever a drenagem de backlog',
  ],
  'saude-e-prontidao': [
    'Separar startup, readiness e liveness',
    'Reconhecer um reinício em cascata',
    'Drenar chamadas antes de retirar a réplica',
  ],
  observabilidade: [
    'Correlacionar o trace com fila e GPU',
    'Separar cauda de média por coorte',
    'Validar o sinal após a correção',
  ],
  'rollout-canario': [
    'Definir controle e coorte canário',
    'Medir regressões por segmento',
    'Fixar um critério verificável de rollback',
  ],
  'rag-em-producao': [
    'Versionar corpus, índice e resposta',
    'Localizar a origem da evidência perdida',
    'Verificar frescor e autorização',
  ],
  'inferencia-em-lote': [
    'Dimensionar partições e workers',
    'Retomar sem duplicar a saída',
    'Reconciliar os IDs do manifesto',
  ],
  'features-online': [
    'Garantir correção point-in-time',
    'Diagnosticar skew entre treino e serving',
    'Medir o efeito de dados vencidos',
  ],
  'tokenizacao-em-producao': [
    'Reproduzir o template do servidor',
    'Detectar dupla inserção de marcadores',
    'Avaliar admissão por idioma',
  ],
  'espacos-de-embeddings': [
    'Definir métrica e normalização',
    'Separar erro de encoder e de ANN',
    'Migrar índice e encoder juntos',
  ],
  'economia-da-geracao': [
    'Decompor prefill e decode',
    'Relacionar TPOT a tempo total',
    'Dimensionar uma réplica dentro do SLO',
  ],
  'regressoes-de-prompt': [
    'Congelar as entradas de comparação',
    'Isolar template e posição da evidência',
    'Decidir sobre uma regressão por coorte',
  ],
  'contratos-de-saida': [
    'Especificar o schema da resposta',
    'Distinguir sintaxe e validade de domínio',
    'Medir falhas antes de liberar',
  ],
  'execucao-idempotente-de-tools': [
    'Autorizar a intenção da ferramenta',
    'Deduplicar tentativas concorrentes',
    'Reconciliar efeitos com resposta perdida',
  ],
  'workflow-ou-agente': [
    'Escolher quem decide a próxima ação',
    'Limitar fan-out, prazo e custo',
    'Comparar resolução com um workflow fixo',
  ],
  'contrato-de-api-em-lote': [
    'Definir identidade de cada item',
    'Conciliar resultados fora de ordem',
    'Repetir somente o trabalho pendente',
  ],
  'grafo-estado-explicito': [
    'Definir estado e reducers',
    'Testar o roteamento de uma execução',
    'Reproduzir uma decisão do grafo',
  ],
  'streaming-grafo-interface': [
    'Selecionar eventos públicos',
    'Tratar consumidor lento',
    'Retomar a interface pelo cursor',
  ],
  'checkpoints-e-efeitos': [
    'Identificar a fronteira de persistência',
    'Separar retomada de repetição de efeitos',
    'Recuperar uma escrita de resultado incerto',
  ],
  'memoria-por-conversa': [
    'Isolar memória por thread e tenant',
    'Resolver atualizações simultâneas',
    'Distinguir histórico e memória durável',
  ],
  'orcamento-de-contexto': [
    'Reservar a resposta e as ferramentas',
    'Selecionar e condensar evidências',
    'Avaliar perdas após compactação',
  ],
  'retencao-e-esquecimento': [
    'Distinguir expiração lógica e física',
    'Propagar remoção para dados derivados',
    'Dimensionar a fila de limpeza',
  ],
  'rag-ingestao-permissoes': [
    'Reprocessar mudanças por versão',
    'Propagar exclusões e revogações',
    'Validar o escopo antes da geração',
  ],
  'rag-busca-hibrida': [
    'Interpretar score e distância',
    'Medir a perda na busca aproximada',
    'Fundir rankings sem somar escalas incompatíveis',
  ],
  'rag-reranking': [
    'Definir o pool de candidatos',
    'Medir ganho e custo do segundo estágio',
    'Degradar com prazo explícito',
  ],
  'rag-citacoes': [
    'Ancorar cada afirmação em evidência',
    'Auditar cobertura e suporte',
    'Abster-se em evidência insuficiente',
  ],
  'evals-golden-set': [
    'Amostrar situações reais por segmento',
    'Fixar critérios e separar conjuntos',
    'Medir regressões pareadas',
  ],
  'evals-juiz': [
    'Especificar a rubrica',
    'Medir viés de posição e concordância',
    'Calibrar o juiz com humanos',
  ],
  'evals-tracing': [
    'Propagar contexto de trace',
    'Calcular o caminho crítico',
    'Estimar o viés da amostragem',
  ],
  'evals-slo': [
    'Definir denominador e janela do SLI',
    'Calcular o consumo do orçamento',
    'Escolher o momento do rollback',
  ],
  'deadlines-e-retries': [
    'Calcular o prazo restante',
    'Conter a amplificação de tentativas',
    'Prever a drenagem durante a recuperação',
  ],
  'tenancy-e-admissao': [
    'Derivar o escopo da identidade',
    'Contabilizar reserva e empréstimo',
    'Verificar a recuperação de um tenant',
  ],
  'custo-por-resolucao': [
    'Calcular custo por tarefa resolvida',
    'Medir qualidade por segmento',
    'Dimensionar a rota de contingência',
  ],
  'mcp-em-producao': [
    'Negociar capacidades e catálogo',
    'Distinguir autorização e descoberta',
    'Reconciliar uma chamada de resultado incerto',
  ],
  'capacidade-milhoes': [
    'Converter DAU em chegadas no pico',
    'Medir capacidade com um SLO',
    'Dimensionar e testar a perda de zona',
  ],
};

function problem(prompt, solution) {
  return { prompt, solution };
}
export const infrastructureChallenges = {
  'ciclo-de-inferencia': problem(
    'O primeiro pedaço da resposta deve chegar em até 100 ms. A viagem de ida e volta leva 20 ms. O pedido espera 45 ms na fila, e o modelo leva mais 40 ms para produzir a primeira peça. Se ele escrever as próximas peças duas vezes mais rápido, cumpre o prazo?',
    'O primeiro token chega em 105 ms nas condições dadas. A aceleração dos tokens seguintes melhora a cadência e o tempo total. Para alcançar 100 ms é preciso retirar pelo menos 5 ms do caminho anterior ao primeiro token, por exemplo da fila. Em tráfego real, compare as etapas do mesmo trace.',
  ),
  'treino-e-inferencia': problem(
    'O modelo tem 96% de acerto no treino e 82% no replay online. Reexecutar o mesmo binário com os atributos offline recupera 94%. Que hipótese ganhou força e que comparação falta?',
    'A troca de atributos explica grande parte da diferença no replay. Compare as características para o mesmo exemplo, versão e instante de previsão, incluindo valores ausentes e normalização. Uma diferença remanescente exige avaliar distribuição e rótulos na mesma coorte.',
  ),
  'latencia-e-vazao': problem(
    'Com 120 chamadas/s, 8% extrapolam o prazo. A 115/s, 1% extrapola. Qual configuração entrega mais respostas úteis por segundo?',
    '120 × 0,92 = 110,4 úteis/s. A segunda entrega 115 × 0,99 = 113,85 úteis/s. Ela também reduz violações. Confirme com o mesmo mix de entrada e saída, duração de teste e fila estável.',
  ),
  'servidor-vllm': problem(
    'O endpoint lista o modelo correto e devolve 200 para dez chamadas curtas. Uma rota de chat do produto ainda devolve erro antes de gerar tokens. O que reproduzir primeiro?',
    'Reproduza a chamada completa com o mesmo ID servido, papéis, template, ferramentas, limites de contexto e parâmetros. Preserve o status e o corpo do erro. Depois de passar a validação funcional, compare fila e TTFT em uma carga concorrente representativa.',
  ),
  'memoria-da-gpu': problem(
    'Restam 6 GiB para KV. Seu modelo usa 128 KiB de KV por token e você quer 16 conversas de 4.096 tokens. Essa frota cabe em uma réplica?',
    '6 GiB / 128 KiB = 49.152 posições, antes de arredondamentos. As conversas pedem 65.536 posições simultâneas. Cabem no máximo 12 conversas completas nessa conta. Meça a capacidade de blocos e a ocupação ao longo da carga.',
  ),
  quantizacao: problem(
    'Um checkpoint INT4 cabe em uma GPU, mas o canário tem pior p99 com lote pequeno. Quais resultados da comparação sustentariam uma decisão de liberar?',
    'Reproduza mesmos prompts, hardware, batch e revisão de software. Verifique o kernel escolhido e compare qualidade por segmento, pico de memória, goodput e custo por resposta aceita. Um ganho de memória só justifica a troca se o produto ainda atender à sua meta de qualidade e latência.',
  ),
  'kv-cache': problem(
    'Três sequências compartilham dois blocos de prefixo. Cada uma mantém ainda um bloco privado. Quantos blocos físicos existem e quantos ficam sem referência ativa ao encerrar duas sequências?',
    'Existem cinco blocos físicos, dois compartilhados e três privados. Ao encerrar duas sequências, seus dois blocos privados ficam sem referência ativa. O prefixo mantém uma referência pela terceira sequência. A política de cache decide se os blocos sem referência são conservados para reuso.',
  ),
  'batching-continuo': problem(
    'A iteração admite até 512 tokens de trabalho. Há 32 sequências em decode com um token por sequência e um prompt novo de 900. Num escalonador com prefill em partes e decode prioritário, quanto cabe agora?',
    'Sobram 480 tokens para o prefill. O próximo pedaço precisa de mais 420 posições de processamento, sujeito ao orçamento da próxima iteração e ao espaço de KV. Meça a cadência das 32 sequências e o TTFT da nova chamada para avaliar a política.',
  ),
  'cache-de-prefixo': problem(
    'De 100 chamadas, 80 repetem exatamente um prefixo de 1.024 tokens. A primeira dessas 80 o aquece. Qual a economia máxima de prefill desse grupo?',
    'Até 79 × 1.024 = 80.896 posições de prefill evitadas com alinhamento e cache residentes. Evicção, roteamento para outra réplica e diferenças de template reduzem a economia. Conte tokens reaproveitados, além da taxa de chamadas com hit.',
  ),
  'mistura-de-especialistas': problem(
    'Um lote de 64 tokens usa top-2 entre oito experts. Um expert recebe 48 atribuições. Por que a média por expert pode enganar?',
    'Há 128 atribuições e média 16. O expert quente recebeu três vezes a média. Localize o dispositivo que o executa, meça o tempo máximo por rank e verifique a distribuição por camada antes de alterar o posicionamento.',
  ),
  'paralelismo-de-especialistas': problem(
    'Um dispatch faz 1.024 atribuições de vetores de 8 KiB. Apenas 25% são locais. Qual o payload remoto de ida e volta se o retorno tem o mesmo tamanho?',
    '768 × 8 KiB = 6 MiB na ida e 6 MiB na volta. São 12 MiB de payload agregado por execução da camada. Sobrecarga do transporte, agregação e skew por enlace podem alterar tempo e volume observado.',
  ),
  'paralelismo-de-modelo': problem(
    'O checkpoint requer duas GPUs por réplica. A região tem oito GPUs e cada réplica sustenta 18 pedidos/s no SLO. Após perder um par, um pico de 60/s cabe?',
    'Com quatro réplicas são 72/s. Após perder um par restam três, totalizando 54/s. Há déficit de 6/s antes de margem e aquecimento. Provisione outro par ou limite o tráfego que pode esperar.',
  ),
  'replicas-e-autoscaling': problem(
    'Entram 100 pedidos/s numa frota que atende 80/s. A nova réplica leva 90 s para aquecer e eleva a capacidade total para 120/s. Quando a fila zera?',
    'Acumulam-se 20 × 90 = 1.800 pedidos. Depois sobram 20/s para drenagem, exigindo mais 90 s. Desde o início do pico são 180 s sob essas hipóteses. Pedidos que perderam a utilidade antes disso devem expirar.',
  ),
  'saude-e-prontidao': problem(
    'Carregar os pesos leva 240 s no p99. A sonda de início tem 30 tentativas a cada 5 s. Por que a réplica pode nunca ficar pronta?',
    'O orçamento de cerca de 150 s é inferior ao tempo de carregamento de cauda. Aumente a janela sob uma meta de boot medida. Só admita tráfego útil depois de o modelo responder à verificação de prontidão e preserve um prazo para detectar boots realmente travados.',
  ),
  observabilidade: problem(
    'O p95 do total subiu para 900 ms. Os p95 de fila e inferência são 500 e 450 ms. Você pode concluir que o transporte tem latência negativa?',
    'Percentis de populações diferentes não são aditivos. Localize chamadas lentas e calcule cada parcela nos mesmos traces. Em execução paralela, use o caminho crítico. Compare os traces selecionados com um SLI calculado sobre todas as chamadas.',
  ),
  'rollout-canario': problem(
    'O canário teve 10 erros em 500 chamadas. O controle teve 90 em 9.000. A amostra contém mais prompts longos no canário. O próximo passo é avançar o rollout?',
    'As taxas brutas são 2% e 1%, mas a comparação mistura carga e versão. Congele a expansão, estratifique por comprimento, compare com controle simultâneo e aplique o limite de erro previamente acordado. Se o orçamento estiver queimando rápido, reverta antes de esperar significância.',
  ),
  'rag-em-producao': problem(
    'O documento correto aparece no top-20, mas o gerador responde com uma política vencida. Que evidências distinguem falha de ranking de falha de contexto?',
    'Registre IDs e revisões do top-20, dos trechos após rerank e dos bytes realmente enviados ao modelo. Se a revisão atual caiu na seleção, revise o ranking ou o orçamento. Se ambas chegaram, teste o filtro de validade e a atribuição de citações.',
  ),
  'inferencia-em-lote': problem(
    'O manifesto tem 100 mil IDs. O arquivo parcial tem 98 mil linhas e apenas 97 mil IDs únicos, todos do manifesto. Quantos IDs precisam de reconciliação antes de reprocessar?',
    'Faltam 3 mil IDs únicos. Há mil ocorrências duplicadas além das primeiras. Confirme a validade do conteúdo de cada resultado e recupere saídas já confirmadas no destino usando ID e versão. Emita trabalho para o conjunto ausente ou inválido.',
  ),
  'features-online': problem(
    'Uma compra ocorreu às 12h00, chegou ao pipeline às 12h08 e gerou uma feature. Uma previsão histórica foi feita às 12h03. A compra pode entrar no replay dessa previsão?',
    'Embora tenha ocorrido antes, a compra ainda não estava disponível ao serviço. Um replay fiel precisa considerar event time e instante de disponibilidade da feature. Use a versão publicada até 12h03 e meça o impacto da defasagem.',
  ),
};
