const mooncake = {
  org: 'Moonshot AI e Tsinghua',
  title: 'Mooncake no serviço de chat Kimi',
  url: 'https://www.usenix.org/conference/fast25/presentation/qin',
  observed: 'Na publicação da FAST 2025, a equipe relata que o Kimi processava mais de 100 bilhões de tokens por dia com o Mooncake, distribuído por milhares de nós.',
  mechanism: 'Prefill e decode usam grupos separados. O escalonador localiza blocos KV por prefixo, pondera fila e transferência, replica blocos disputados e pode recusar pedidos sob sobrecarga.',
  limits: 'O caso envolve prompts longos, reaproveitamento de contexto e uma malha de alta largura de banda. Tempos de cópia e folga de memória precisam ser medidos no cluster de destino.',
};

const deepseek = {
  org: 'DeepSeek',
  title: 'Como V3 e R1 serviram tráfego em H800',
  url: 'https://raw.githubusercontent.com/deepseek-ai/open-infra-index/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md',
  observed: 'A DeepSeek descreve os serviços de web, aplicativo e API de V3/R1 em uma janela de 24 horas de fevereiro de 2025. O pico conjunto chegou a 278 nós de oito H800.',
  mechanism: 'O serviço empregou formatos diferentes em cada operação, EP32 no prefill, EP144 no decode e sobreposição de comunicação e cálculo entre dois microlotes.',
  limits: 'Os grupos publicados refletem a esparsidade dos modelos, os kernels e a rede da empresa. O relato de um dia descreve aquela frota e aquele tráfego.',
};

const alibaba = {
  org: 'Alibaba',
  title: 'RTP-LLM no agente de dados para lojistas',
  url: 'https://arxiv.org/html/2605.29639v1#S8.SS3',
  observed: 'Os autores analisaram mil consultas reais do agente com Qwen3-235B-A22B e previsão de múltiplos tokens (MTP). O contexto médio era de 19,5 mil tokens, e a geração avançou cerca de 1,9 token por passo.',
  mechanism: 'O motor verifica continuações propostas em uma passagem do modelo principal. A equipe comparou quatro configurações de paralelismo usadas pelo serviço com o mesmo orçamento de GPUs.',
  limits: 'A medição descreve consultas longas de lojistas. O TPOT da tabela 6 é uma média. Esses números são insuficientes para prometer o p99 de outra aplicação.',
};

export const servingAudit = [
  {
    moduleTitle: 'Fundamentos de IA',
    baseline: 'A sequência existente acompanha os tokens de uma chamada, testa uma versão de classificador em sombra e calcula latência e vazão por classe de tráfego.',
    gaps: [
      'O custo de transportar o estado quando prefill e decode ocupam máquinas diferentes.',
      'O viés introduzido quando a política em produção determina quais exemplos terão rótulo.',
      'A probabilidade de uma leitura lenta atrasar uma requisição que depende de muitos serviços.',
    ],
    cases: [
      mooncake,
      {
        org: 'Google / YouTube',
        title: 'Correção de viés em um recomendador top-K em produção',
        url: 'https://research.google/pubs/top-k-off-policy-correction-for-a-reinforce-recommender-system/',
        observed: 'A equipe do YouTube avaliou em experimentos online um recomendador que aprendia com interações geradas por múltiplas versões anteriores da política de exibição.',
        mechanism: 'Os pesquisadores corrigiram o viés de exposição durante o treinamento por reforço e adaptaram a correção ao caso em que a interface recomenda vários itens de uma vez.',
        limits: 'O resultado pertence a recomendações top-K. O exercício usa uma única ação e sua probabilidade conhecida para expor a conta mais simples.',
      },
      {
        org: 'Google',
        title: 'A cauda de latência em serviços distribuídos',
        url: 'https://research.google/pubs/the-tail-at-scale/',
        observed: 'Dean e Barroso registraram 10 ms no p99 de uma folha individual de um serviço do Google e 140 ms no p99 ao esperar por todas as folhas. O artigo também descreve leituras redundantes atrasadas no Bigtable.',
        mechanism: 'O coordenador precisa aguardar a última dependência obrigatória. Para leituras replicadas, uma cópia enviada após um atraso pode devolver o resultado antes da réplica original.',
        limits: 'Essas observações são de serviços distribuídos de leitura. Duplicar gerações longas consome GPU, e uma operação com efeito externo exige outra semântica.',
      },
    ],
    lessons: {
      'ciclo-de-inferencia': {
        gap: 'O caminho original termina na mesma engine e omite a transferência do KV entre fases.',
        title: 'Quem segura o estado entre o primeiro e o segundo token?',
        caseIndex: 0,
        method: 'Em um desenho desagregado, o prefill pode emitir o primeiro token antes de o segundo grupo ter o estado completo. Para continuar, o destino precisa de páginas KV utilizáveis, posições corretas e uma revisão compatível dos pesos e do formato. Reservar páginas no destino antes da cópia evita descobrir, depois de gastar rede, que a conversa precisa voltar para a fila. Se a transferência falhar, marque o estado incompleto e refaça o prefill ou interrompa a sessão conforme o prazo restante.',
        signal: 'Marque fim do prefill, início e fim da cópia, admissão no decode e entrega do segundo token. Compare o intervalo entre os dois primeiros tokens com os demais por faixa de contexto. O primeiro token rápido pode esconder uma fila inteira.',
        exercise: {
          prompt: 'Neste cenário hipotético, um prompt de 8.192 tokens produz 128 KiB de KV por token. O cliente já recebeu o primeiro token. A cópia sem sobreposição alcança 8 GiB/s e o primeiro passo de decode leva 20 ms. A meta até o segundo token é 120 ms. Qual é o gargalo?',
          solution: 'O estado ocupa 1 GiB. A cópia leva 125 ms e o passo seguinte acrescenta 20 ms, totalizando pelo menos 145 ms. Para caber em 120 ms, restam 100 ms para a cópia, exigindo no mínimo 10 GiB/s efetivos, antes de contar filas. Manter as fases juntas ou sobrepor parte da cópia ao prefill são hipóteses para testar.',
        },
      },
      'treino-e-inferencia': {
        gap: 'Separar treino e teste por data ainda deixa invisíveis os casos que a política anterior nunca encaminhou.',
        title: 'Quem foi observado pela política anterior?',
        caseIndex: 1,
        method: 'Suponha que só os chamados encaminhados para revisão recebam um rótulo humano. Para estimar o valor de uma nova regra a partir desse histórico, registre contexto, ação, política e probabilidade da ação efetivamente tomada. Para uma ação por decisão, a razão entre a probabilidade da política candidata e a da política de coleta dá o peso da observação. Se a regra antiga nunca escolhia uma ação em determinado segmento, faltam observações desse resultado. É preciso coletá-las com revisão amostral ou exploração controlada.',
        signal: 'Inspecione cobertura por segmento, maior peso e tamanho efetivo da amostra, calculado por (soma dos pesos)² / soma dos quadrados. Pesos altos concentram a estimativa em poucos chamados. Limitar os pesos reduz variância e introduz viés que merece análise de sensibilidade.',
        exercise: {
          prompt: 'Exercício hipotético de uma ação por decisão. A coleta encaminhava um segmento com probabilidade 0,10 e a candidata o encaminha com 0,40. Encontre o peso de um encaminhamento observado e o tamanho efetivo de quatro registros já ponderados em 4, 1, 1 e 1. O que muda se a coleta tiver probabilidade zero?',
          solution: 'O encaminhamento recebe peso 0,40 / 0,10 = 4. A amostra efetiva é 7² / (16 + 1 + 1 + 1) = 49/19, cerca de 2,58 registros. Com probabilidade de coleta zero e probabilidade candidata positiva, a razão é indefinida. Colete evidência da ação nesse segmento antes de inferir seu valor.',
        },
      },
      'latencia-e-vazao': {
        gap: 'Faltava modelar a amplificação do p99 quando o pedido aguarda vários shards ou serviços.',
        title: 'O último shard define o prazo da resposta',
        caseIndex: 2,
        method: 'Um assistente que consulta muitos shards e só então monta o prompt acumula o máximo dessas latências. Com n tempos independentes e probabilidade p de cada folha terminar até o prazo, a chance de todas terminarem é pⁿ. Uma leitura redundante atrasada pode ajudar se outra réplica tiver latência parcialmente independente. Use a primeira resposta válida, propague o cancelamento e imponha orçamento de cópias. Se as duas réplicas disputarem a mesma fila saturada, a duplicação amplia a sobrecarga.',
        signal: 'Correlacione spans das folhas por requisição, meça fração de cópias vencedoras e trabalho residual após cancelamento. Compare p99 ponta a ponta e leituras extras com a mesma taxa de chegada. Se o produto aceita respostas parciais, avalie a perda de cobertura ao impor prazo.',
        exercise: {
          prompt: 'Hipótese didática: 40 shards independentes têm 99% de chance individual de terminar em 30 ms. Qual fração dos pedidos que esperam por todos ultrapassa 30 ms? Se uma duplicata for emitida em 3% das 40 leituras, quantas leituras adicionais são esperadas por pedido?',
          solution: 'A fração que ultrapassa o prazo é 1 − 0,99⁴⁰ ≈ 33,1%. As cópias acrescentam em média 40 × 0,03 = 1,2 leituras. A primeira conta exige independência. Só o histograma conjunto das réplicas e a demora do cancelamento permitem estimar o ganho do mecanismo.',
        },
      },
    },
  },
  {
    moduleTitle: 'Servindo com vLLM',
    baseline: 'O roteiro já abre um endpoint, valida streaming, decompõe os bytes de uma GPU e compara pesos INT4 com BF16 em qualidade e desempenho.',
    gaps: [
      'Distribuição simultânea do checkpoint para réplicas novas, integridade da revisão e prontidão efetiva.',
      'Sobre-reserva de KV quando sessões já admitidas continuam crescendo ao mesmo tempo.',
      'Escolha da precisão de cada operação, incluindo tráfego de ativações e acumulação.',
    ],
    cases: [
      {
        org: 'Baseten',
        title: 'Distribuição de pesos na frota da Baseten',
        url: 'https://www.baseten.co/blog/baseten-delivery-network-fast-cold-starts-big-models/',
        observed: 'A Baseten integrou sua rede de distribuição de pesos à plataforma de inferência. A equipe descreve como passou a servir inicializações simultâneas sem repetir a busca de cada arquivo na origem.',
        mechanism: 'O deployment espelha a revisão antes de iniciar as réplicas. O nó procura arquivos no NVMe local e nos pares. Um responsável por arquivo, escolhido por hash consistente, agrega os pedidos que chegam durante a mesma transferência.',
        limits: 'A arquitetura reduz leituras na origem. Continuam existindo cópias na rede interna, carregamento na GPU, inicialização dos kernels e validação de prontidão.',
      },
      mooncake,
      deepseek,
    ],
    lessons: {
      'servidor-vllm': {
        gap: 'O smoke test parte de uma réplica. Em uma expansão com dezenas delas, a origem dos pesos pode atrasar toda a frota.',
        title: 'Quem baixa o mesmo checkpoint quarenta vezes?',
        caseIndex: 0,
        method: 'Fixe um manifesto imutável de shards, tamanhos e hashes na revisão do deployment. Em um miss, um único processo baixa cada shard enquanto os outros aguardam a publicação atômica do arquivo verificado. Se o responsável cair, expire sua posse e deixe outro retomar o trabalho. O endpoint só deve receber tráfego depois de carregar também tokenizer, template e kernels da revisão e completar uma pequena geração. Um arquivo parcialmente gravado com nome definitivo contamina todas as réplicas que confiam no cache.',
        signal: 'Durante uma expansão a partir de nós frios, registre bytes buscados na origem por revisão, duração até readiness por nó, taxa de cópia entre pares e tempo até a primeira resposta. Separe espera por GPU de espera por pesos para dimensionar a reserva aquecida.',
        exercise: {
          prompt: 'Hipótese: 40 nós frios precisam de uma revisão de 60 GiB. A origem entrega 12 GiB/s agregados. Calcule o limite inferior do tempo ocupado na origem com download por nó e com uma única busca por shard.',
          solution: 'Quarenta downloads somam 2.400 GiB, ou pelo menos 200 s na origem. Com uma busca por shard são 60 GiB, ou 5 s na origem. Os outros 39 nós ainda precisam receber os arquivos pela malha interna. Cinco segundos são um piso para a origem, não uma previsão de prontidão.',
        },
      },
      'memoria-da-gpu': {
        gap: 'O teto estático de sessões deixa em aberto como reservar páginas para saídas de tamanho desconhecido.',
        title: 'Quanto crescimento o pool já prometeu?',
        caseIndex: 1,
        method: 'Conte páginas físicas livres após descontar blocos compartilhados uma única vez, sessões ativas e margem dos kernels. Para cada sessão, projete o crescimento adicional dentro do horizonte de admissão e arredonde para páginas inteiras. Reservar o máximo declarado é seguro e caro. Uma previsão por classe libera capacidade, mas saídas longas correlacionadas podem esgotar a folga simultaneamente. Ao cruzar uma marca de pressão, suspenda novas admissões e libere páginas por conclusão, cancelamento ou preempção controlada antes de sofrer OOM.',
        signal: 'Meça páginas efetivamente livres, tokens recomputados depois de preempções, fila e rejeições sobre todos os pedidos oferecidos. Teste mudanças no mix e vários cancelamentos simultâneos. Um p99 medido só entre os aceitos esconde a perda de capacidade percebida.',
        exercise: {
          prompt: 'Pool hipotético com 1.000 páginas utilizáveis. Já há 600 ocupadas e seis sessões precisam de até 40 páginas adicionais cada no horizonte. A margem é 60 páginas. Cada novo pedido precisa de 25 páginas agora e de uma reserva de 15. Quantos pedidos cabem nessa política?',
          solution: 'Restam 1.000 − 600 − 6 × 40 − 60 = 100 páginas para admissões. Duas consomem 80. A terceira exigiria 120. Se o valor 40 vier de uma previsão estatística, registre os excedentes e use a margem para reagir antes do próximo bloco de alocações.',
        },
      },
      quantizacao: {
        gap: 'A comparação anterior mantinha o KV em BF16 e tratava a precisão do modelo como escolha única.',
        title: 'Quantize o caminho que realmente movimenta bytes',
        caseIndex: 2,
        method: 'Desenhe uma tabela de formatos para pesos, ativações, acumulador, KV e mensagens entre GPUs. O operador que envia uma ativação pode compactá-la com uma escala e o receptor pode convertê-la para uma precisão maior antes da redução. No serviço relatado, a DeepSeek utilizou FP8 em multiplicações e no envio aos experts, BF16 no retorno e no núcleo da atenção MLA. Para testar uma mudança no KV, calibre K e V, observe saturação e erro por camada e compare com uma referência usando recuperação de informação distante e continuações longas.',
        signal: 'Colete bytes reais por direção da rede, tempo de conversão e duração do kernel de atenção. Compare precisão da tarefa por comprimento, divergência dos logits em posições fixas e goodput. Pesos menores podem coexistir com KV intacto e com um retorno de rede ainda caro.',
        exercise: {
          prompt: 'Uma camada hipotética envia 1.024 vetores de 4.096 elementos e recebe os mesmos formatos de vetor de volta. Antes tudo era BF16 (2 B). Agora o envio usa FP8 (1 B) e o retorno permanece BF16. Ignore metadados. Quanto tráfego foi poupado? Isso altera o KV?',
          solution: 'Cada direção BF16 custa 8 MiB, total de 16 MiB. Agora são 4 MiB de envio e 8 MiB de retorno, total de 12 MiB e economia de 25%. O formato das mensagens não muda o armazenamento KV. Uma mudança no KV requer kernel compatível e sua própria avaliação de qualidade.',
        },
      },
    },
  },
  {
    moduleTitle: 'Otimização da inferência',
    baseline: 'As aulas existentes rastreiam blocos locais, encaixam novas sequências no lote e mostram como IDs de prefixo mudam a taxa de acerto.',
    gaps: [
      'Escolha entre trazer KV remoto e recomputar, com falhas parciais de transferência.',
      'Decodificação especulativa dentro do lote e custo de verificar propostas que serão descartadas.',
      'Disputa entre afinidade de cache e tempo de fila quando um prefixo vira ponto quente.',
    ],
    cases: [mooncake, alibaba, {
        org: 'GitHub', title: 'Um endpoint especializado aplica as mudanças do Copilot Edits',
        url: 'https://github.blog/news-insights/product-news/github-copilot-the-agent-awakens/',
        observed: 'No lançamento geral do Copilot Edits em VS Code, o GitHub descreve dois estágios. Um modelo elabora a mudança a partir da sessão e um endpoint de speculative decoding a aplica no arquivo.',
        mechanism: 'A aplicação de uma edição tem estrutura diferente da criação do plano. Separar as etapas permite otimizar o caminho que materializa as alterações no editor.',
        limits: 'O anúncio não expõe o algoritmo exato de proposta, a taxa de aceitação ou a vazão do endpoint. O exercício explora uma estratégia possível para trechos que permanecem iguais.',
      }],
    lessons: {
      'speculative-decoding': {
        gap: 'A aula verificava um draft neural. Faltava explorar um proponente barato quando a saída já existe parcialmente na entrada.',
        title: 'Use o próprio arquivo como proposta para uma edição localizada', caseIndex: 2,
        method: 'Em edição de arquivos, encontre um trecho anterior que acompanha o prefixo aceito e proponha os IDs seguintes como rascunho determinístico. No modo greedy, o target verifica a primeira posição divergente, confirma o prefixo coincidente e emite sua escolha nessa posição. Depois, volte a procurar alinhamento. Repetições podem apontar para o trecho errado e reduzir o ganho; a aceitação continua subordinada ao target. Use um orçamento curto de tentativa em regiões novas e contraste com o custo de rodar um draft aprendido.',
        signal: 'Meça tokens confirmados por milissegundo da rodada, por tipo de edição e tamanho de trecho copiado. Compare saída greedy com o target isolado e registre desistências do alinhador. Desative propostas por cópia na classe em que a verificação e a busca de alinhamento custarem mais que a geração direta.',
        exercise: {
          prompt: 'No replay greedy, uma rodada de cópia e verificação custa 24 ms ao todo. Em substituições locais entrega em média 4 tokens definitivos e em arquivos reescritos, 1,2. O target direto leva 10 ms por token, sem fila. Em qual classe habilitar?',
          solution: 'Nas substituições, 24 / 4 = 6 ms por token. Na reescrita, 24 / 1,2 = 20 ms por token. Habilite apenas nas substituições se as saídas forem equivalentes. O ponto de equilíbrio exige mais de 2,4 tokens definitivos por rodada sob esses custos.',
        },
      },
      'kv-cache': {
        gap: 'A simulação de blocos termina na HBM local. Um acerto remoto pode custar mais que o prefill evitado.',
        title: 'Carregar o KV remoto ou refazer o prefixo?',
        caseIndex: 0,
        method: 'Compare dois caminhos a partir do mesmo instante: localizar e transferir o estado até a GPU ou recalcular o mesmo prefixo. Use bytes por bloco e a banda efetiva entre origem e HBM, incluindo contenção na NIC e cópias intermediárias. Verifique identidade do modelo, adaptador, posição e formato do cache. Mantenha o destino indisponível até todos os blocos necessários chegarem. Se um objeto sumir entre consulta e leitura, os IDs originais permitem recomputar o trecho sem consumir estado parcial.',
        signal: 'Registre tier de origem, bytes transferidos, tempo de espera pelo transporte e milissegundos de prefill evitados. Compare as duas rotas em uma amostra de tráfego por tamanho do prefixo. Uma boa taxa de acerto pode esconder um link congestionado.',
        exercise: {
          prompt: 'Hipótese: buscar 0,5 GiB de KV exige 8 ms fixos mais a transferência. Recalcular esse prefixo na GPU disponível custa 85 ms. Sem sobreposição, o que escolher a 10 GiB/s e a 4 GiB/s? Encontre a banda de equilíbrio.',
          solution: 'A 10 GiB/s, a busca custa 8 + 50 = 58 ms e economiza 27 ms. A 4 GiB/s custa 8 + 125 = 133 ms e vale recomputar. A fronteira é 0,5 GiB / 0,077 s ≈ 6,49 GiB/s efetivos. Se a fila da GPU mudar, refaça a comparação.',
        },
      },
      'batching-continuo': {
        gap: 'Cada sequência emitia um token por passo. Faltava verificar várias propostas no mesmo passo e calcular o ganho líquido.',
        title: 'Quando verificar mais de um token por sequência?',
        caseIndex: 1,
        method: 'O rascunho pode vir de um modelo menor, de uma cabeça de previsão ou de uma repetição no próprio prompt. O alvo verifica várias posições de uma vez. Na variante gulosa, confirme até a primeira divergência e emita a escolha do alvo nesse ponto. Descarte as posições KV especulativas posteriores. Na amostragem estocástica, preservar a distribuição exige aceitar com probabilidade min(1, p/q) e, na rejeição, sortear da parte positiva de p − q normalizada, onde p e q são as distribuições do alvo e do rascunho. Comparar apenas o token mais provável altera o resultado.',
        signal: 'Meça tokens finais emitidos por verificação, tempo total de proposta e verificação, páginas temporárias e latência das outras sequências no mesmo lote. A repetição de código pode favorecer o rascunho. Use o mesmo mix e a mesma concorrência para decidir a profundidade das propostas.',
        exercise: {
          prompt: 'Em dois replays hipotéticos, o decode comum emite um token em 10 ms. Com proposta e verificação, cada rodada custa 16 ms por sequência e rende em média 2,2 tokens finais no primeiro replay e 1,2 no segundo. Desconsidere filas. Ative o mecanismo em ambos?',
          solution: 'O custo efetivo é cerca de 7,27 ms/token no primeiro e 13,33 ms/token no segundo. A fronteira é 16/10 = 1,6 token confirmado por rodada, contando também o token emitido pelo alvo. Ative no primeiro perfil e verifique o p99 das sequências vizinhas sob carga antes de ampliar.',
        },
      },
      'cache-de-prefixo': {
        gap: 'A aula explicava o miss por roteamento aleatório. Faltava decidir quando sair deliberadamente da réplica quente.',
        title: 'Um hit vale a espera na réplica quente?',
        caseIndex: 0,
        method: 'Para cada destino, some a espera estimada, a busca do KV que falta e o prefill do sufixo. Uma réplica com cópia local pode perder para outra com busca remota se concentrar toda a fila de um manual popular. Replicar os blocos pode reduzir a pressão no enlace de origem, mas consome espaço que serviria a outros prefixos. Use janela de observação e histerese para evitar mover o mesmo bloco a cada pequena oscilação. Respeite o escopo de compartilhamento autorizado e vincule a chave à revisão do modelo.',
        signal: 'Acompanhe espera e bytes servidos por réplica, acertos ponderados por tokens e economia líquida em milissegundos por prefixo. Compare antes e depois de remover um nó quente, incluindo pedidos que precisaram recalcular após a remoção.',
        exercise: {
          prompt: 'Para um mesmo pedido, A tem o prefixo local, 95 ms de fila e 10 ms de sufixo. B espera 15 ms, importa o prefixo em 45 ms e calcula o sufixo em 10 ms. A alternativa fria em C leva 85 ms no total. Todos os valores são hipotéticos. Qual rota vence agora e quando B deixa de vencer C?',
          solution: 'A leva 105 ms, B leva 70 ms e C leva 85 ms. B vence agora. Com os demais custos fixos, B empata com C quando a importação leva 85 − 15 − 10 = 60 ms. Acima disso, C termina primeiro. O roteador precisa de medidas de fila e rede suficientemente recentes.',
        },
      },
    },
  },
  {
    moduleTitle: 'MoE e paralelismo',
    baseline: 'O aluno já calcula top-k, volume de all-to-all e efeito de um rank lento, além de comparar os arranjos TP, PP e DP após falhas.',
    gaps: [
      'Como posicionar cópias de experts sob limites de slots e tráfego entre nós, preservando a escolha lógica.',
      'Como sobrepor comunicação e GEMM sem reutilizar buffers que outro microlote ainda está lendo.',
      'Como escolher diferentes graus de paralelismo por fase e por regime de concorrência.',
    ],
    cases: [
      {
        org: 'DeepSeek',
        title: 'EPLB e o posicionamento físico de experts',
        url: 'https://github.com/deepseek-ai/EPLB',
        observed: 'A DeepSeek publicou o algoritmo de balanceamento de expert parallelism que implantou. O código calcula quantas cópias manter e em quais GPUs colocá-las a partir da carga estimada por expert.',
        mechanism: 'Na política hierárquica, primeiro se distribuem grupos entre nós, depois se replicam experts dentro de cada nó e se repartem as cópias entre GPUs. A política global dispensa o agrupamento.',
        limits: 'O repositório recebe estimativas de carga como entrada. A previsão de mudanças de demanda e a cadência de migração ficam a cargo da operação.',
      },
      deepseek,
      alibaba,
    ],
    lessons: {
      'mistura-de-especialistas': {
        gap: 'Copiar um expert quente resolve um caso isolado. Vários experts disputando poucos slots exigem uma política de posicionamento.',
        title: 'Distribua cópias sem mudar o modelo aprendido',
        caseIndex: 0,
        method: 'Mantenha um identificador lógico por expert e um mapa separado de cópias físicas. O gate escolhe experts e pesos como no modelo treinado. O dispatcher escolhe entre cópias idênticas para executar cada atribuição uma vez. Estime tokens por expert por camada. A próxima cópia ajuda se reduzir o máximo de trabalho em algum rank após o empacotamento. Duas cópias na mesma GPU podem deixar esse máximo intacto. Ao trocar o mapa, publique uma versão comum aos ranks e drene atribuições em trânsito antes de liberar os pesos antigos.',
        signal: 'Registre máximo e média de tokens recebidos por rank, bytes entre nós, custo da cópia de pesos e estabilidade das estimativas. Faça replay de uma mudança de domínio antes de aprovar a distribuição nova. Um mapa adequado ao pico de ontem pode empilhar os experts mais ativos de hoje.',
        exercise: {
          prompt: 'Uma camada hipotética recebe 600, 300 e 100 atribuições para A, B e C. Há duas GPUs com dois slots cada e espaço para uma cópia extra. Divida o tráfego de A igualmente entre suas cópias. Qual é o menor pico possível por GPU com esse mapa? Compare com A sozinho em uma GPU e B+C na outra.',
          solution: 'A vira dois grupos de 300. Os quatro slots passam a receber 300, 300, 300 e 100 atribuições. Qualquer pareamento deixa uma GPU com 600 e a outra com 400. O mapa anterior também atingia 600. Um slot extra reduziu a carga máxima por cópia, mas empacotamento e número de GPUs impediram reduzir o gargalo do rank. Uma divisão desigual de A entre cópias permitiria testar outra política.',
        },
      },
      'paralelismo-de-especialistas': {
        gap: 'Medir o coletivo isoladamente omite a parte que pode ficar escondida atrás do cálculo de outro microlote.',
        title: 'Sobreponha dispatch e GEMM no caminho crítico',
        caseIndex: 1,
        method: 'Separe o lote em A e B. Enquanto a GPU executa a multiplicação dos experts de A, a rede pode receber as ativações de B em buffers distintos. Um evento libera a GEMM somente quando os dados correspondentes chegaram. O combine precisa aguardar a GEMM e preservar o índice original de cada token. Com etapas equilibradas, o intervalo em regime tende à duração da etapa mais lenta. Os custos de encher e esvaziar o pipeline permanecem, e o uso simultâneo de rede e cálculo pode criar disputa por memória ou unidades de execução.',
        signal: 'Inspecione uma linha do tempo de vários ranks e identifique as lacunas entre comunicação, eventos e GEMM. Compare tempo de camada e tempo entre tokens com os mesmos tokens por expert. A porcentagem de sobreposição perde valor se as GEMMs menores ficarem menos eficientes.',
        exercise: {
          prompt: 'Exemplo hipotético com apenas dispatch e GEMM em recursos independentes. Cada um de dois microlotes exige 3 ms de rede e 5 ms de GEMM. Sem combine, sem contenção e com buffers duplos, quando termina o segundo microlote com e sem sobreposição?',
          solution: 'Em série, 2 × (3 + 5) = 16 ms. Com sobreposição, a rede atende A entre 0 e 3 ms e B entre 3 e 6 ms. A GEMM executa A entre 3 e 8 ms e B entre 8 e 13 ms. A conclusão cai a 13 ms. Para muitos microlotes, a etapa de 5 ms limita a cadência. O retorno dos resultados acrescentaria uma dependência no caso real.',
        },
      },
      'paralelismo-de-modelo': {
        gap: 'O plano anterior escolhia uma topologia para todo o serviço. Prefill e decode podem ter pontos de equilíbrio distintos, que mudam com a concorrência.',
        title: 'Escolha a topologia usando a carga de cada fase',
        caseIndex: 2,
        method: 'Fixe frota total, revisão, precisão e distribuição conjunta de entradas e saídas. Durante o prefill, examine custo de atenção e tamanho das matrizes. No decode, compare bytes de pesos e KV lidos por token com o tempo gasto em coletivos de TP. Mais DP cria filas independentes e pode reduzir espera, desde que os pesos caibam em cada grupo. Mais TP reduz trabalho local, mas introduz sincronizações por camada. Em uma troca de grau entre fases, inclua a conversão do layout de KV e o tráfego entre os grupos na medição ponta a ponta.',
        signal: 'Para cada faixa de concorrência, publique TPS por GPU, TPOT por requisição, TTFT e falhas de admissão. Use a tabela 6 da Alibaba para identificar a inversão entre 4TP×4 e 1TP8DP entre 64 e 128 clientes usando a média publicada. Para validar um SLO p99, colete a distribuição completa.',
        exercise: {
          prompt: 'Use dados publicados na tabela 6 para 512 clientes, com uma meta didática de TPOT médio ≤ 27 ms. 1TP8DP entregou 529,8 tokens/s por GPU a 25,64 ms e 2TP4DP entregou 599,8 a 28,45 ms. Qual atende e quanto throughput se deixa de obter em relação à alternativa?',
          solution: '1TP8DP atende ao limite médio. A diferença é 70 tokens/s por GPU, ou 70 / 599,8 ≈ 11,7% em relação a 2TP4DP. A segunda configuração ultrapassa o limite em 1,45 ms. Para propor uma configuração a milhões de contas, ainda é preciso medir chegadas simultâneas e a distribuição de comprimentos no próprio serviço.',
        },
      },
    },
  },
];
