const retryGuide = {
  label: 'Amazon Builders’ Library · Timeouts, retries and backoff with jitter',
  url: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/',
};
const loadGuide = {
  label: 'Google SRE · Handling Overload',
  url: 'https://sre.google/sre-book/handling-overload/',
};
const fairnessGuide = {
  label: 'Amazon Builders’ Library · Fairness in multi-tenant systems',
  url: 'https://aws.amazon.com/builders-library/fairness-in-multi-tenant-systems/',
};
const routingPaper = {
  label: 'RouteLLM · Learning to Route LLMs with Preference Data',
  url: 'https://arxiv.org/abs/2406.18665',
};
const toolSpec = {
  label: 'MCP · Tools, revisão 2025-11-25',
  url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
};
const bench = {
  label: 'vLLM · Referência de vllm bench serve',
  url: 'https://docs.vllm.ai/en/stable/cli/bench/serve/',
};

function flow(nodes, rows) {
  return rows.map(([active, label, title, body, idea]) => ({nodes, active, label, title, body, idea}));
}

export const operationsModule = {
  title: 'Produção & padrões',
  lessons: [
    {
      id: 'deadlines-e-retries', title: 'Deadlines, retries e carga em cascata', minutes: 12, level: 'Avançado',
      summary: 'Uma indisponibilidade de 800 ms pode produzir minutos de fila quando gateway, SDK e workers repetem a mesma operação.',
      steps: flow(['Gateway', 'Worker', 'Dependência'], [
        [0, 'Fixar prazo', 'Divida o tempo que o cliente aceita esperar', 'O serviço que recebe o pedido tem dois segundos para devolver a resposta. Se já gastou 300 ms na fila, restam 1.700 ms para o modelo e a viagem de volta. Envie o tempo restante a cada serviço. Meça separadamente a conexão, a chegada dos primeiros dados e a resposta completa.', 'Uma atividade que inicia com o prazo quase esgotado compete com trabalho ainda útil.'],
        [1, 'Classificar', 'O efeito pode ter acontecido antes do timeout', 'Separe falhas transitórias, recusas definitivas e resultados desconhecidos. Se uma ferramenta criou um pedido e a conexão caiu, consulte o status pelo identificador da operação. Para repetir uma escrita, o destino deve deduplicar a mesma intenção pelo mesmo identificador.', 'Um novo identificador para cada tentativa derrota a deduplicação.'],
        [1, 'Limitar', 'Escolha uma camada para as tentativas', 'Desative a repetição implícita nas outras camadas. Limite tentativas com um orçamento global por dependência, respeite Retry-After e distribua a espera com jitter. Antes de dormir ou reenfileirar, compare o atraso e a duração esperada da execução com o prazo restante.', 'O número total de tentativas inclui a chamada original. Deixe essa convenção explícita nas configurações.'],
        [2, 'Recuperar', 'Recuse trabalho cedo durante a saturação', 'Imponha limite de fila e descarte trabalhos expirados antes de alocar GPU. Libere recursos ao cancelar um stream se o engine suportar cancelamento. Na recuperação, reabra gradualmente e acompanhe tráfego original, tentativas extras, fila e chamadas concluídas no prazo.', 'Teste a recuperação com dependência lenta e tráfego novo durante a drenagem.'],
      ]),
      source: retryGuide,
      fieldwork: {
        caseStudy: {text: 'A Amazon documenta a multiplicação das tentativas em serviços encadeados. Seus SDKs passaram a limitar retries com token bucket. O artigo descreve também a escolha de timeouts a partir da distribuição de latência da dependência.', source: retryGuide},
        exercise: {prompt: 'Três camadas podem fazer até duas tentativas totais cada, inclusive a original. Chegam 1.000 chamadas/s e o último serviço falha em todas. Qual o teto de carga oferecida? Redesenhe para admitir até 100 repetições/s no serviço final.', solution: 'Em regime sustentado, o limite teórico é 2³ × 1.000 = 8.000 tentativas/s, assumindo que os prazos permitam todas. Centralize a repetição em uma camada e limite os créditos extras a 100/s. Com uma visita original ao destino por chamada, o teto sustentado vira 1.100/s. Limite também o burst do bucket e compare a taxa admitida à capacidade que sobrou.'},
      },
    },
    {
      id: 'tenancy-e-admissao', title: 'Isolamento e admissão por tenant', minutes: 12, level: 'Avançado',
      summary: 'Mantenha o chat de um cliente responsivo durante a reindexação e os prompts longos de outro.',
      steps: flow(['Identidade', 'Admissão', 'Pool de GPUs'], [
        [0, 'Isolar', 'Use a identidade verificada em cada acesso', 'Identifique a empresa pela conta autenticada. A loja A e a loja B podem ter um pedido 42. Busque por empresa e número, inclusive dentro da ferramenta chamada pelo agente. Use o mesmo limite no cache, na memória da conversa, nos artefatos A2A e no histórico do workflow. Ao retomar, confira se a permissão ainda vale. Use identificadores sem dados pessoais nos traces e controle quem pode vê-los.', 'A autorização precisa acompanhar também resultados já materializados.'],
        [1, 'Reservar', 'Controle as unidades que consomem a capacidade', 'Meça tokens de entrada, saída e sequências simultâneas por classe de tráfego. Na admissão reserve um teto de saída, aplique limites por tenant e globais, e reconcilie pelo uso medido no encerramento. Faça expirar reservas de clientes desconectados.', 'Uma quota só em requisições/s permite que um lote de prompts longos monopolize o prefill.'],
        [1, 'Escalonar', 'Distribua a fila por peso e custo previsto', 'Mantenha filas de tamanho limitado por classe. Em uma política de deficit round robin, cada fila recebe créditos por rodada e despacha ao acumular crédito para o próximo item. Meça a estimativa de custo contra o consumo e corrija o saldo. Separe os lotes offline do tráfego interativo.', 'Permita empréstimo de capacidade ociosa com uma política explícita de devolução às classes prioritárias.'],
        [2, 'Conter', 'Valide a área afetada por uma sobrecarga', 'Particione clientes por células com capacidade e dependências identificáveis. Em um ensaio, multiplique a carga de um tenant e compare o p95 de TTFT e a taxa de recusa dos demais. Apoie o desligamento de uma integração em uma chave por célula ou tenant.', 'Verifique as dependências compartilhadas, como fila, banco e provedor de embeddings, durante o teste.'],
      ]),
      source: loadGuide,
      fieldwork: {
        caseStudy: {text: 'A Amazon descreve quotas por tenant ou workload para conter aumentos de tráfego localizados. O texto discute o custo da política quando ainda existe capacidade livre. O Google SRE também descreve limites por cliente e criticidade de requisições.', source: fairnessGuide},
        exercise: {prompt: 'Um pool sustenta 120 mil tokens de saída/s no mix testado. A, B e C têm reservas de 60, 36 e 24 mil. Pedem 90, 30 e 24 mil. Quanto A pode consumir com empréstimo instantâneo da capacidade livre? O que medir se B voltar ao limite?', solution: 'Sobram 6 mil de B e nada de C. A recebe até 66 mil e tem 24 mil tokens/s de demanda excedente. Ao voltar B, reduza novas admissões de A para sua reserva. Gerações já admitidas continuam por algum tempo. Meça o intervalo até recuperar a reserva e a latência dos tenants protegidos.'},
      },
    },
    {
      id: 'custo-por-resolucao', title: 'Roteamento e custo por tarefa resolvida', minutes: 11, level: 'Avançado',
      summary: 'Compare um modelo único com uma cascata de modelos usando custo, qualidade e latência por segmento.',
      steps: flow(['Amostra', 'Roteador', 'Decisão'], [
        [0, 'Contabilizar', 'Some o caminho completo de cada tarefa', 'Atribua tokens de entrada e saída, tempo de GPU ociosa alocada, retrieval, reranking, tentativas e ferramentas ao identificador da tarefa. Para APIs externas use as unidades da fatura. Para frota própria distribua a despesa pela capacidade provisionada e reconcilie com o total do período.', 'Custo por resolução = gasto total da coorte dividido pelo número de tarefas resolvidas com qualidade suficiente.'],
        [1, 'Calibrar', 'Escolha a rota a partir de uma decisão mensurável', 'Compare respostas do modelo econômico e do mais capaz em exemplos representativos. Varra o limiar do roteador e trace custo versus qualidade por idioma, domínio e criticidade. Inclua no orçamento o custo de classificar a entrada ou de avaliar uma primeira resposta.', 'Uma cascata sequencial paga a primeira chamada mesmo quando decide escalar para a segunda.'],
        [2, 'Liberar', 'Compare com o controle sob a mesma carga', 'Use um canário com tráfego comparável, guarde a versão de política e defina limite de regressão de qualidade por segmento. Observe p99 da rota que faz duas chamadas. Preserve uma rota de contingência com capacidade para a fração prevista de escalonamentos.', 'Em caso de indisponibilidade do modelo pequeno, encaminhar todo o tráfego ao grande exige capacidade de contingência.'],
      ]),
      source: routingPaper,
      fieldwork: {
        caseStudy: {text: 'Os autores do RouteLLM treinaram roteadores com dados de preferência para escolher entre um modelo forte e um mais econômico. Eles avaliam a curva entre qualidade e custo à medida que muda a proporção enviada ao primeiro. A cascata sequencial do exercício é outra política que pode ser comparada a esse roteamento direto.', source: routingPaper},
        exercise: {prompt: 'Em 100 mil tarefas, a rota A custa R$ 0,04 por tarefa e resolve 90%. A cascata custa R$ 0,01 em todas e mais R$ 0,04 em 25%, resolvendo 88%. Calcule o custo por resolução. A regra de lançamento exige pelo menos 89% de resolução.', solution: 'A gasta R$ 4.000 para 90 mil resoluções, cerca de R$ 0,0444 por resolução. A cascata gasta R$ 2.000 para 88 mil, cerca de R$ 0,0227. Ela falha no piso de qualidade observado. Ajuste o limiar e valide em outra amostra, incluindo incerteza e resultados dos segmentos menores.'},
      },
    },
    {
      id: 'mcp-em-producao', title: 'MCP como contrato de integração', minutes: 12, level: 'Avançado',
      summary: 'Conecte um catálogo de ferramentas ao host da aplicação e controle versões, acesso e execução.',
      steps: flow(['Host', 'Cliente MCP', 'Servidor MCP'], [
        [1, 'Negociar', 'Fixe a revisão e as capacidades em comum', 'No fluxo da revisão 2025-11-25, o cliente inicia com initialize, verifica a versão e as capacidades devolvidas e envia notifications/initialized. Habilite ferramentas apenas quando o servidor anunciar tools. Exerça esse handshake em testes de compatibilidade antes de trocar o SDK.', 'Registre versão de protocolo, implementação e conjunto de capacidades de cada integração.'],
        [1, 'Descobrir', 'Construa um catálogo utilizável pela sessão', 'Percorra tools/list até terminar a paginação por cursor. Separe o catálogo por servidor e escopo de autorização. Ao receber list_changed de um servidor que anuncia essa capacidade, atualize a lista e reveja schemas em uso. Diferencie ferramentas homônimas de integrações distintas no host.', 'A lista de ferramentas pode mudar entre sessões e permissões.'],
        [2, 'Executar', 'Trate uma proposta de chamada como dados', 'No host, associe a operação ao usuário e ao tenant. Valide os argumentos e apresente o efeito das escritas para confirmação conforme a política da aplicação. No servidor, aplique autorização e limite de uso a cada tools/call. Valide o resultado estruturado antes de usá-lo na próxima decisão.', 'Uma descrição ou anotação da ferramenta é metadado e precisa de uma política de confiança externa.'],
        [0, 'Recuperar', 'Separe erro de protocolo, erro de negócio e resposta perdida', 'Um método inválido pode devolver um erro JSON-RPC. Uma ferramenta executada pode retornar isError dentro de result. Se a resposta de uma escrita se perder, uma chave estável e uma consulta de status no sistema de destino permitem descobrir se o efeito ocorreu.', 'O id de uma mensagem JSON-RPC correlaciona a resposta. A deduplicação de efeitos pertence à aplicação.'],
      ]),
      source: {label:'MCP · Ciclo de vida, revisão 2025-11-25',url:'https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle'},
      fieldwork: {
        caseStudy: {text: 'A especificação do MCP define descoberta com tools/list, invocação com tools/call e erros de execução com isError. Ela atribui ao servidor a validação dos argumentos e os controles de acesso. O contrato fornece os pontos em que host e servidor aplicam suas próprias políticas.', source: toolSpec},
        exercise: {prompt: 'Um host recebe 400 mil pedidos de escrita por dia. Em 0,2% deles o cliente perde a resposta depois de enviar a chamada. Dimensione a fila de reconciliação. Como você testa a recuperação contra um servidor de pedidos?', solution: 'São 800 resultados incertos/dia em média. Persista a intenção antes do envio, use chave de operação única por tenant e consulte o destino pela mesma chave. Simule a queda depois do commit e antes da resposta. O teste passa quando existe um único pedido e o host recupera seu ID. Se o destino não suporta deduplicação nem consulta, encaminhe o caso para revisão sem repetir a escrita automaticamente.'},
      },
    },
    {
      id: 'capacidade-milhoes', title: 'Planejamento de capacidade para milhões de usuários', minutes: 15, level: 'Avançado',
      summary: 'Converta usuários ativos em carga de pico, dimensione uma frota regional e ensaie a perda de uma zona.',
      steps: flow(['Demanda', 'Benchmark', 'Frota'], [
        [0, 'Modelar', 'Comece pela unidade de trabalho do produto', 'Meça usuários ativos por dia, tarefas por usuário, chamadas ao modelo por tarefa e a razão pico/média em uma janela definida. Segmente idiomas, ferramentas e comprimento de entrada e saída. Transforme as distribuições em perfis de carga e preserve os bursts que a média esconde.', 'Uma tarefa de agente pode consumir várias gerações, ferramentas e uma conexão longa com o cliente.'],
        [1, 'Saturar', 'Encontre a taxa sustentável de uma réplica', 'Teste o mesmo modelo, quantização, GPUs, interconexão, política de lote e distribuição de tokens da produção. Gere chegadas em taxa aberta, independente da velocidade das respostas. Suba a carga até falhar a meta de TTFT, ritmo de geração, erros ou estabilidade da fila. Repita com cache frio e quente.', 'Conte as requisições concluídas dentro dos limites de serviço e verifique se a fila deixa de crescer após o aquecimento.'],
        [2, 'Distribuir', 'Reserve capacidade para a perda de uma zona', 'Calcule a capacidade útil por réplica com margem para variação. Em três zonas iguais, cada par sobrevivente precisa absorver o pico regional. Arredonde para réplicas inteiras por zona. Verifique cotas de GPUs, tempo de carregar os pesos, banda e limites de bancos e de ferramentas.', 'Uma réplica pode usar várias GPUs. Multiplique a frota de réplicas pelo tamanho do grupo de paralelismo.'],
        [2, 'Ensaiar', 'Faça o failover sob carga representativa', 'Desvie tráfego de uma zona com uma parte dos caches frios. Acompanhe fila, TTFT p95, tempo total p99, erros e tempo até estabilizar. Se a frota restante saturar, priorize o tráfego interativo e suspenda lotes adiáveis. Repita o teste de retorno, quando caches e distribuição de carga mudam de novo.', 'A capacidade calculada é uma hipótese que o ensaio de perda de zona deve conseguir refutar.'],
      ]),
      source: loadGuide,
      fieldwork: {
        caseStudy: {text: 'O vLLM oferece vllm bench serve para benchmarking online, com taxa de chegada e limites de goodput. Você pode aplicar os limites de latência do seu produto a uma distribuição representativa e usar a medição como entrada para o cálculo da frota.',source: bench},
        exercise: {prompt: 'Considere 2 milhões de usuários ativos/dia, quatro gerações por usuário/dia e pico de seis vezes a média. Cada réplica sustenta 25 gerações/s na meta de latência. Reserve 20% dessa capacidade e distribua igualmente por três zonas. Quantas réplicas permitem perder uma zona?',solution: '8 milhões de gerações/dia dão 92,59/s em média e 555,56/s no pico. A capacidade útil por réplica é 25 × 0,8 = 20/s. Precisamos de pelo menos 28 réplicas sobreviventes. Duas zonas com 14 cada atendem ao pico. Provisione 42 no total. Valide a hipótese de balanceamento e a estabilidade da fila após perder uma zona.'},
      },
    },
  ],
};
