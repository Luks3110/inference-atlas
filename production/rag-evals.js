const sources = {
  deletion: {
    label: 'Microsoft Learn · Atualizações e exclusões no índice',
    url: 'https://learn.microsoft.com/en-us/azure/search/search-how-to-index-azure-blob-changed-deleted',
  },
  permissions: {
    label: 'Microsoft Learn · Sincronização de permissões',
    url: 'https://learn.microsoft.com/en-us/azure/search/search-indexer-access-control-lists-and-role-based-access',
  },
  faiss: {
    label: 'Faiss · Métricas e distâncias entre vetores',
    url: 'https://github.com/facebookresearch/faiss/wiki/MetricType-and-distances',
  },
  fusion: {
    label: 'Elastic · Reciprocal rank fusion',
    url: 'https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion',
  },
  contextual: {
    label: 'Anthropic · Experimentos de recuperação contextual',
    url: 'https://www.anthropic.com/research/contextual-retrieval',
  },
  citations: {
    label: 'Gao et al. · Avaliação de citações com ALCE',
    url: 'https://aclanthology.org/2023.emnlp-main.398/',
  },
  evals: {
    label: 'Anthropic · Avaliações de agentes',
    url: 'https://www.anthropic.com/research/demystifying-evals-for-ai-agents',
  },
  judge: {
    label: 'Zheng et al. · MT-Bench e Chatbot Arena',
    url: 'https://arxiv.org/abs/2306.05685',
  },
  sampling: {
    label: 'OpenTelemetry · Amostragem de traces',
    url: 'https://opentelemetry.io/docs/concepts/sampling/',
  },
  dapper: {
    label: 'Google Research · Dapper em produção',
    url: 'https://research.google/pubs/dapper-a-large-scale-distributed-systems-tracing-infrastructure/',
  },
  burn: {
    label: 'Google SRE · Alertas de consumo de orçamento',
    url: 'https://sre.google/workbook/alerting-on-slos/',
  },
  canary: {
    label: 'Google SRE · Testes canário e grupo de controle',
    url: 'https://sre.google/workbook/canarying-releases/',
  },
};

function flow(nodes, steps) {
  return steps.map(([active, label, title, body, idea]) => ({ nodes, active, label, title, body, idea }));
}

export const ragEvalModules = [
  {
    title: 'RAG de ponta a ponta',
    lessons: [
      {
        id: 'rag-ingestao-permissoes',
        title: 'Um índice que acompanha a fonte',
        minutes: 12,
        level: 'Avançado',
        summary: 'Siga uma publicação, uma edição e uma revogação de acesso até os trechos usados na resposta.',
        steps: flow(['Fonte', 'Indexador', 'Consulta'], [
          [0, 'Identificar', 'Associe cada trecho a uma revisão',
            'Uma política de reembolso ganha uma tabela. Quando preparar o texto para a busca, guarde de qual versão, seção e posição veio cada pedaço. Registre também a empresa que pode abrir o documento. Se separar uma linha da tabela, leve o cabeçalho junto para explicar o que seus números significam. Guarde o texto como estava para poder citá-lo.',
            'Registre as versões do parser, da divisão em trechos e do embedding. Uma alteração em qualquer uma pode exigir reindexação.'],
          [1, 'Reprocessar', 'Aceite reentregas sem ressuscitar versões antigas',
            'Consuma o log de alterações em lotes. Grave trechos por documento e revisão, valide a quantidade esperada e só então publique o manifesto dessa revisão. Uma escrita condicional impede um evento atrasado de substituir a versão mais recente. Avance o cursor após a publicação persistida.',
            'Em uma falha parcial, a repetição deve produzir o mesmo índice visível. A limpeza de versões antigas pode rodar depois.'],
          [1, 'Excluir', 'Propague remoções por todo o caminho de leitura',
            'Registre um marcador de exclusão com a revisão, interrompa a leitura do documento e remova trechos, vetores e entradas de cache. Compare periodicamente o inventário da fonte com o do índice. Meça a idade da exclusão pendente mais antiga.',
            'Retenha o marcador por mais tempo do que a maior interrupção e o atraso de reprocessamento previstos.'],
          [2, 'Autorizar', 'Uma permissão revogada alcança a consulta seguinte',
            'Restrinja a busca pelo tenant e pelas permissões do principal autenticado. Antes de montar o prompt, confira os candidatos contra a política vigente. Se a política estiver indisponível, exclua o conteúdo protegido. Vincule o cache de resultados ao escopo e à versão da autorização.',
            'O texto enviado ao reranker ou ao gerador já precisa estar autorizado para esse uso. Teste a revogação com caches quentes e índice atrasado.'],
        ]),
        source: sources.deletion,
        fieldwork: {
          caseStudy: {
            text: 'A Microsoft documenta que alterar uma ACL na fonte ADLS Gen2 exige atualizar os metadados no índice de busca. Sem essa atualização, o índice pode continuar usando as permissões antigas. Isso torna a defasagem de ACL um indicador operacional próprio.',
            source: sources.permissions,
          },
          exercise: {
            prompt: 'Uma base para 2 milhões de usuários recebe 600 revisões/minuto, com 8 trechos por revisão. Após 15 minutos de parada, o indexador volta a processar 120 trechos/s. Quanto tempo leva para zerar o atraso com a entrada mantida? Onde aplicar uma revogação com prazo de 10 s?',
            solution: 'Chegam 80 trechos/s. A parada acumula 72.000 e a capacidade líquida é de 40/s, portanto a recuperação leva 1.800 s, ou 30 min. Uma consulta à política vigente antes da leitura e do envio do texto cobre a revogação enquanto o índice converge. A cópia em cache também precisa passar por essa verificação. Verifique o prazo com leitura contínua durante uma revogação.',
          },
        },
      },
      {
        id: 'rag-busca-hibrida',
        title: 'Embeddings, BM25 e fusão de rankings',
        minutes: 12,
        level: 'Avançado',
        summary: 'Recupere tanto o código exato de uma peça quanto uma descrição escrita com outras palavras.',
        steps: flow(['Pergunta', 'Índices', 'Fusão RRF'], [
          [0, 'Interpretar', 'Um identificador e um sintoma pedem sinais diferentes',
            'Quem digita “E42 válvula travada” oferece um código raro e uma descrição. Preserve o código na análise lexical. Gere um embedding da pergunta com o encoder de consulta compatível com o que indexou os documentos. Dispare as duas buscas com o mesmo escopo de acesso.',
            'Mantenha conjuntos de avaliação separados para códigos, nomes próprios, sinônimos e perguntas multilíngues.'],
          [1, 'Pontuar', 'Entenda o que mede cada score',
            'O BM25 valoriza termos discriminantes, satura a contribuição de repetições e considera o comprimento do texto. No índice vetorial, o produto interno entre vetores de norma 1 equivale ao cosseno. Guarde a métrica e a versão do encoder. Uma migração pede reindexação compatível e comparação em paralelo.',
            'Conte quantas consultas recuperam evidência com cada método. Um score lexical de 12 e um cosseno de 0,8 têm escalas diferentes.'],
          [1, 'Medir perda', 'Localize a perda da busca aproximada',
            'Em uma amostra de consultas autorizadas, compare os vizinhos aproximados com os vizinhos exatos no mesmo corpus. Depois avalie a relevância usando rótulos humanos. Se a busca exata também perde a passagem, investigue representação, divisão do texto ou cobertura da fonte.',
            'Aumentar o esforço de busca pode recuperar vizinhos do encoder e elevar o p95. Meça os dois efeitos em consultas com filtros seletivos.'],
          [2, 'Fundir', 'Some contribuições pela posição em cada lista',
            'A fusão RRF atribui 1/(k + posição) a cada ocorrência de um trecho, com posições iniciando em 1. Candidatos ausentes em uma lista recebem zero nessa lista. Una por identificador estável e ordene pela soma. A janela de cada lista limita os candidatos disponíveis.',
            'Varie a janela e a constante de fusão com um corpus congelado. Compare a recuperação de passagens relevantes e o tempo de consulta.'],
        ]),
        source: sources.faiss,
        fieldwork: {
          caseStudy: {
            text: 'O Elasticsearch oferece RRF para combinar as listas ordenadas de recuperadores como BM25 e kNN. A documentação explicita o tamanho da janela de candidatos e a constante que determina o peso da posição na fusão.',
            source: sources.fusion,
          },
          exercise: {
            prompt: 'Use k = 60. O trecho A ocupa o 1º lugar no BM25 e está ausente na busca vetorial. B ocupa o 4º e o 2º lugares. Quem vence? O que muda se a janela lexical cair para três candidatos?',
            solution: 'A soma 1/61 ≈ 0,01639. B soma 1/64 + 1/62 ≈ 0,03175 e vence. Na janela lexical de três, B perde a primeira parcela e fica com 1/62 ≈ 0,01613. A passa à frente. Ao reduzir a janela por custo, verifique esse efeito nas consultas com códigos raros e paráfrases.',
          },
        },
      },
      {
        id: 'rag-reranking',
        title: 'Reranking sob prazo e carga de pico',
        minutes: 11,
        level: 'Avançado',
        summary: 'Dimensione os pares pergunta–trecho que o reranker consegue avaliar antes do primeiro token.',
        steps: flow(['Candidatos', 'Reranker', 'Contexto'], [
          [0, 'Cobrir', 'Encontre a etapa em que a evidência desaparece',
            'Marque os IDs de todas as passagens aceitas para cada pergunta. Em perguntas respondíveis, recall@K é a fração das passagens relevantes presentes entre as K primeiras. Calcule por consulta e tire a média. Registre também o percentual de perguntas com ao menos uma passagem relevante.',
            'Em uma pergunta com quatro trechos relevantes e um recuperado, há um acerto de busca e recall de 25%. Mantenha os dois indicadores separados.'],
          [1, 'Reordenar', 'Orce o trabalho em pares por segundo',
            'Um cross-encoder recebe a pergunta junto de cada trecho candidato e pontua o par. Um lote de 40 candidatos por consulta gera 40 pares. Agrupe pares compatíveis até o limite de espera e meça vazão com a distribuição real de comprimentos. Trechos longos alteram o custo de cada lote.',
            'Acompanhe fila, tempo de inferência, tamanho dos lotes e nDCG@K com relevância graduada. Um reranker só consegue reordenar o que recebeu.'],
          [2, 'Selecionar', 'Entregue evidência diversa dentro do orçamento',
            'Deduplicate sobreposições pela posição na fonte. Inclua seções adjacentes apenas quando necessárias para interpretar uma regra ou tabela. Teste o ganho marginal de mais um trecho contra tokens de prefill e tempo até o primeiro token.',
            'Top-K de recuperação, número de pares reordenados e tamanho do contexto são três parâmetros independentes.'],
          [2, 'Degradar', 'Prepare um caminho para a fila saturada',
            'Reserve tempo para geração e para a rede. Quando a espera prevista do reranker exceder o saldo, use um top-K híbrido previamente avaliado ou peça esclarecimento. Registre qual caminho atendeu cada solicitação e acompanhe a qualidade de ambos.',
            'Valide a escolha em teste de carga com rajadas e compare cobertura e p95 dos pedidos que entraram na degradação.'],
        ]),
        source: sources.contextual,
        fieldwork: {
          caseStudy: {
            text: 'A Anthropic publicou um experimento que reordenava 150 trechos e selecionava 20. Em seu conjunto, embeddings contextuais, BM25 contextual e reranking reduziram a taxa de falha de recuperação top-20 de 5,7% para 1,9% frente à configuração de referência. O resultado corresponde à combinação testada e à métrica de recuperação.',
            source: sources.contextual,
          },
          exercise: {
            prompt: 'No pico chegam 250 consultas/s com 40 pares cada. Um worker mede 2.000 pares/s na mistura de comprimentos esperada. Planeje até 70% da vazão medida por worker e tolere a perda de um worker. Quantos manter? O que falta validar?',
            solution: 'São 10.000 pares/s. Cada worker oferece 1.400 pares/s de capacidade planejada. Com um fora, são necessários teto(10.000/1.400) = 8 ativos, portanto 9 no total. Confirme p95 em rajadas, tempo máximo de espera do lote e qualidade do caminho de contingência. A conta fornece capacidade média para esta carga.',
          },
        },
      },
      {
        id: 'rag-citacoes',
        title: 'Respostas citáveis e abstenção',
        minutes: 10,
        level: 'Avançado',
        summary: 'Verifique se cada afirmação importante se apoia em um trecho autorizado, atual e acessível.',
        steps: flow(['Passagens', 'Resposta', 'Verificação'], [
          [0, 'Ancorar', 'Mantenha uma referência verificável',
            'Numere os trechos escolhidos e associe cada ID à revisão, à página ou seção e ao intervalo no texto. Entregue apenas esse mapa à etapa de geração. Resolva a URL final no servidor e revalide o acesso quando o leitor abrir a fonte.',
            'Uma URL válida só identifica o documento. O leitor precisa encontrar a passagem que sustenta a afirmação.'],
          [1, 'Responder', 'Vincule cada conclusão às suas premissas',
            'Peça uma resposta curta com os IDs que sustentam cada afirmação verificável. Uma pergunta sobre elegibilidade pode depender de região e data. Quando os trechos cobrem apenas a região, faça uma pergunta sobre a data ou explique o limite da resposta.',
            'Inclua casos sem resposta e documentos contraditórios no conjunto de referência. Uma abstenção correta também é um resultado avaliável.'],
          [2, 'Auditar', 'Separe cobertura de validade',
            'Confira se cada ID existe e pertence ao conjunto recuperado. Depois avalie se o trecho realmente implica a afirmação, inclusive valores, unidades e qualificadores. Acompanhe a proporção de afirmações factuais sustentadas e a proporção de referências emitidas que oferecem suporte.',
            'Atribua cada falha à busca, à seleção de contexto ou à geração. A correção depende de onde a evidência se perdeu.'],
          [2, 'Calibrar', 'Escolha quando responder no tráfego real',
            'Varie o limiar de evidência em um conjunto de validação e trace cobertura de atendimento contra taxa de erro entre respostas emitidas. Faça cortes por idioma e assunto. Em fontes conflitantes, cite ambas quando o conflito for a própria resposta.',
            'Um limiar agressivo pode aumentar a precisão entre respostas e ao mesmo tempo deixar mais usuários sem atendimento.'],
        ]),
        source: sources.citations,
        fieldwork: {
          caseStudy: {
            text: 'No benchmark ALCE, pesquisadores de Princeton mediram fluência, correção e qualidade das citações. No ELI5, cerca de metade das respostas dos melhores sistemas avaliados ainda carecia de suporte completo nas fontes. Isso motivou medir suporte por afirmação.',
            source: sources.citations,
          },
          exercise: {
            prompt: 'Em 500 perguntas, o sistema responde a 400. Entre as 400, há 900 afirmações verificáveis e 810 com suporte completo. Os revisores identificam 20 respostas com erro material. Calcule cobertura de atendimento, suporte por afirmação e risco entre respostas.',
            solution: 'Cobertura = 400/500 = 80%. Suporte por afirmação = 810/900 = 90%. Risco entre respostas emitidas = 20/400 = 5%. Para julgar as 100 abstenções, rotule quantas perguntas tinham evidência suficiente. As três medidas usam denominadores diferentes.',
          },
        },
      },
    ],
  },
  {
    title: 'Evals & observabilidade',
    lessons: [
      {
        id: 'evals-golden-set',
        title: 'Golden set que revela regressões',
        minutes: 12,
        level: 'Avançado',
        summary: 'Construa um conjunto versionado de tarefas que represente o tráfego e preserve casos críticos raros.',
        steps: flow(['Amostra', 'Revisores', 'Comparação'], [
          [0, 'Amostrar', 'Capture as perguntas que a média esconde',
            'Comece pelas perguntas que as pessoas realmente fazem. Use exemplos com autorização e retire dados pessoais. Registre o idioma, o que a pessoa queria fazer, o tamanho da pergunta e se o sistema precisava consultar uma fonte ou chamar uma função. Separe um grupo que represente o uso comum e outro com falhas raras que a média pode esconder.',
            'O conjunto enriquecido mede cobertura de riscos. Para estimar o resultado do produto, pondere cada segmento pela sua participação real.'],
          [1, 'Rotular', 'Descreva um resultado verificável',
            'Para uma solicitação de troca, defina a decisão esperada, evidências aceitáveis, efeitos permitidos e quando pedir mais informações. Dois revisores anotam uma amostra de forma independente. Resolva desacordos e ajuste a rubrica antes de ampliar a anotação.',
            'Permita respostas equivalentes. Datas, valores e mudanças de estado verificáveis admitem avaliadores determinísticos.'],
          [1, 'Congelar', 'Separe desenvolvimento e decisão de publicação',
            'Agrupe exemplos por conversa e por documento antes de separar desenvolvimento e teste. Retenha um período posterior para estimar mudança de tráfego. Fixe IDs e versões dos rótulos, da base documental, do modelo e do prompt. Reponha exemplos periodicamente.',
            'Usar a mesma conversa nos dois lados ou ajustar o prompt olhando o teste final produz uma estimativa otimista.'],
          [2, 'Comparar', 'Avalie as duas versões nas mesmas tarefas',
            'Registre ganhos e perdas por tarefa. Faça reamostragem pareada por conversa ou usuário para obter um intervalo da diferença, preservando a correlação entre turnos. Repita tarefas estocásticas com várias execuções e reporte variabilidade separadamente.',
            'Defina previamente tolerâncias por segmento e para falhas graves. Um segmento com poucos exemplos exige mais amostra antes da decisão.'],
        ]),
        source: sources.evals,
        fieldwork: {
          caseStudy: {
            text: 'A equipe da Anthropic distingue avaliações de capacidade das verificações de regressão. Descreve incorporar tarefas já dominadas à suíte de regressão e combinar avaliadores em código, modelos e revisão humana conforme o tipo de resultado observado.',
            source: sources.evals,
          },
          exercise: {
            prompt: 'Em uma suíte com 100 casos comuns e 100 críticos, o candidato acerta 98 e 70, respectivamente. Esses segmentos representam 95% e 5% do tráfego. A regra de promoção exige 90% nos casos críticos. Qual é a decisão e quantas falhas por milhão o ponto estimado sugere?',
            solution: 'A média simples da suíte é 84%. A projeção ponderada é 0,95 × 0,98 + 0,05 × 0,70 = 96,6%, ou 34.000 falhas previstas por milhão de pedidos com a mesma composição. A promoção fica bloqueada pelos 70% no segmento crítico. Essa extrapolação depende da representatividade e tem incerteza amostral.',
          },
        },
      },
      {
        id: 'evals-juiz',
        title: 'Calibração de LLM-as-a-judge',
        minutes: 11,
        level: 'Avançado',
        summary: 'Calibre o avaliador com julgamentos humanos e determine quando uma preferência automática merece revisão.',
        steps: flow(['Rubrica', 'Juiz', 'Auditoria'], [
          [0, 'Especificar', 'Dê ao juiz um critério que um humano possa repetir',
            'Para suporte ao cliente, pontue separadamente correção da decisão, evidência e completude. Mostre um exemplo aprovado, um reprovado e um limítrofe. Exija referências aos trechos usados e ofereça o resultado “evidência insuficiente”. Versione o contrato de saída.',
            'Uma resposta eloquente pode ganhar em estilo e errar o prazo de reembolso. Preserve cada dimensão para diagnosticar esse caso.'],
          [1, 'Cegar', 'Teste o efeito da ordem e do tamanho',
            'Oculte a identidade das versões. Julgue A e B nas duas ordens e alinhe o resultado ao candidato original. Registre inversões, empates e falhas de parsing como categorias próprias. Faça um corte por diferença de comprimento para detectar preferência por verbosidade.',
            'Encaminhe pares inconsistentes a revisores. Escolher o voto mais conveniente altera a estimativa de vitória.'],
          [2, 'Calibrar', 'Meça as aprovações indevidas',
            'Monte uma amostra de calibração anotada e adjudicada por pessoas, com casos difíceis e variação de idioma. Separe outra amostra intocada para validar o limiar. Na matriz de confusão, compare aprovação indevida entre ruins e rejeição indevida entre boas.',
            'Acordo agregado pode ser alto quando a maioria dos exemplos é boa. Examine erros graves e o desacordo entre os próprios revisores.'],
          [2, 'Vigiar', 'Descubra quando a régua mudou',
            'Congele versão e prompt do juiz durante a comparação. Ao trocá-los, execute as duas réguas no mesmo conjunto de referência e reavalie a concordância com humanos. Audite regularmente uma amostra aleatória e outra de casos incertos, mantendo suas estatísticas separadas.',
            'Uma mudança de nota pode nascer do avaliador, do sistema avaliado ou da mistura de tráfego. Versione as três origens.'],
        ]),
        source: sources.judge,
        fieldwork: {
          caseStudy: {
            text: 'Os autores de MT-Bench inverteram a ordem de respostas semelhantes e observaram mudanças de preferência. Também investigaram verbosidade e preferência do juiz por respostas do próprio modelo. O experimento demonstra por que a ordem merece um teste dedicado.',
            source: sources.judge,
          },
          exercise: {
            prompt: 'De 100 respostas ruins segundo humanos, o juiz aprova 20. De 900 boas, aprova 855. Calcule concordância global e taxa de aprovação indevida entre ruins. Uma política que admite no máximo 5% de aprovação entre ruins aceita esse juiz?',
            solution: 'Ele rejeita corretamente 80 ruins. A concordância é (855 + 80)/1.000 = 93,5%. A taxa de aprovação indevida entre ruins é 20/100 = 20%, acima dos 5% permitidos. Se o painel mostrar apenas a concordância global, essa falha passa despercebida. Recalibre e teste em outra amostra anotada.',
          },
        },
      },
      {
        id: 'evals-tracing',
        title: 'Tracing do pedido ao primeiro token',
        minutes: 12,
        level: 'Avançado',
        summary: 'Reconstrua o caminho crítico de um pedido e retenha traces úteis sob limites de memória e armazenamento.',
        steps: flow(['Cliente', 'Serviços', 'Coletor'], [
          [0, 'Propagar', 'O mesmo pedido recebe uma identidade ao longo do caminho',
            'Crie um span para o pedido e propague o contexto para busca, reranking, fila de inferência e geração. Registre cada tentativa como filha da operação lógica. No streaming, marque a chegada do primeiro token ao cliente e a conclusão ou cancelamento da resposta.',
            'O tempo percebido no cliente inclui espera e rede. A duração isolada da execução do modelo conta apenas uma parte.'],
          [1, 'Explicar', 'Leia o caminho crítico antes de somar tempos',
            'Se busca lexical e vetorial correm em paralelo, a fusão espera a mais lenta. Inspecione o intervalo de cada span, a espera na fila e a duração efetiva. Registre versões do modelo, prompt e índice, contagens de tokens e desfecho da consulta.',
            'Use classes de modelo e de rota como dimensões de métricas. IDs de usuário e texto de prompt geram alta cardinalidade e podem revelar dados pessoais.'],
          [2, 'Amostrar', 'Escolha os traces que cabem no orçamento',
            'Uma decisão no início por hash do trace ID oferece uma amostra de base. Uma decisão no fim pode priorizar erros ou alta latência observados. Para amostrar no fim, encaminhe spans do mesmo trace ao mesmo coletor e dimensione a retenção até o momento da decisão.',
            'O coletor só consegue priorizar os traces que recebeu. Um descarte anterior na origem reduz a cobertura de erros raros.'],
          [2, 'Verificar', 'Meça a qualidade da própria telemetria',
            'Mantenha contadores de pedidos e histogramas para todo o tráfego elegível. Use traces para investigar exemplos e separe os escolhidos por erro dos escolhidos aleatoriamente. Monitore filas do exportador, descartes, spans atrasados e traces incompletos.',
            'Amostras enriquecidas com erros distorcem a taxa bruta de falhas. Calcule o SLI nos contadores ou use estimativas com probabilidades de inclusão conhecidas.'],
        ]),
        source: sources.sampling,
        fieldwork: {
          caseStudy: {
            text: 'No Dapper, o Google usou amostragem e instrumentação de bibliotecas compartilhadas para coletar traces distribuídos com baixo custo nas aplicações. A descrição da equipe documenta a implantação em produção e a utilidade do caminho entre serviços para operadores.',
            source: sources.dapper,
          },
          exercise: {
            prompt: 'Chegam 1.000 pedidos/s. Cada trace completo ocupa 20 kB decimais. Um coletor recebe todos e espera 30 s para decidir. Há 1% de erros. Ele guarda todos os erros e 1% dos sucessos. Estime memória de payload em espera e volume exportado por segundo.',
            solution: 'Em regime estável há cerca de 30.000 traces em espera. Com 20 kB cada, reserve 600 MB de payload no cenário em que o conteúdo já chegou. Some overhead de objetos, rajadas e spans tardios no teste real. A exportação média é 10 + 0,01 × 990 = 19,9 traces/s, ou 398 kB/s. No destino, cerca de metade dos traces tem erro, embora a taxa real seja 1%.',
          },
        },
      },
      {
        id: 'evals-slo',
        title: 'SLO, canário e rollback de qualidade',
        minutes: 12,
        level: 'Avançado',
        summary: 'Ligue rótulos offline, sinais online e consumo de orçamento a uma decisão explícita de lançamento.',
        steps: flow(['Controle', 'Canário', 'Decisão'], [
          [0, 'Definir', 'Transforme o compromisso com o usuário em uma razão',
            'Defina população, janela e condição de sucesso. Para um chat, uma solicitação elegível pode exigir resposta tecnicamente válida e primeiro token em até 2 s. Conte pedidos e falhas na borda. Acompanhe separadamente correção e suporte de citação em amostras revisadas.',
            'Uma resposta rápida com política desatualizada pode passar no SLO técnico. O critério de qualidade cobre esse segundo tipo de falha.'],
          [1, 'Expor', 'Atribua tráfego comparável por conversa',
            'Fixe a coorte por conversa para preservar o histórico e distribua versões simultaneamente. Compare idiomas, tenants e tamanhos de contexto entre coortes. Registre o pacote de modelo, prompt, índice e ferramentas para conseguir reproduzir e reverter a variante.',
            'Defina tamanho mínimo por segmento, tempo para chegada dos rótulos e limite de exposição antes de iniciar o canário.'],
          [2, 'Alertar', 'Use o ritmo de consumo do orçamento',
            'Divida a fração observada de pedidos ruins pela fração permitida pelo SLO. Com SLO de 99,9%, 1,5% de falhas consome orçamento a 15 vezes o ritmo sustentável. Uma janela longa estima o impacto e outra curta verifica se a degradação continua.',
            'Calcule o consumo também por variante. Uma coorte pequena pode sofrer uma regressão severa enquanto a métrica global parece saudável.'],
          [2, 'Reverter', 'Ensaie a volta ao pacote compatível',
            'Ao violar uma condição crítica, interrompa a expansão e redirecione novas conversas para a versão estável. Use a política de compatibilidade planejada para conversas já iniciadas. Preserve os traces da coorte e confirme a recuperação técnica e de qualidade.',
            'Se o índice novo mudou o formato dos documentos, manter a versão anterior do modelo sozinha pode ser insuficiente. Versione e ensaie o retorno do conjunto.'],
        ]),
        source: sources.burn,
        fieldwork: {
          caseStudy: {
            text: 'O Google SRE descreve a comparação temporária entre uma coorte canário e uma de controle. A equipe discute a escolha de métricas que discriminem defeitos da nova versão e explica como sinais compartilhados entre coortes podem esconder a causa.',
            source: sources.canary,
          },
          exercise: {
            prompt: 'Um SLO mensal de 99,9% usa 10 milhões de pedidos elegíveis como denominador. O canário serve 20.000 pedidos e falha em 300. O controle comparável falha em 0,1%. Calcule o ritmo de consumo no canário, as falhas incrementais estimadas e a fração do orçamento mensal usada pelas 300 falhas.',
            solution: 'O canário falha em 1,5%, burn rate de 15. No mesmo volume, o controle projetaria 20 falhas, então o excesso estimado é 280. O orçamento mensal é de 10.000 falhas. As 300 consomem 3% desse orçamento. Pause a expansão e examine janelas, composição e definição de falha antes de atribuir o excesso ao lançamento.',
          },
        },
      },
    ],
  },
];
