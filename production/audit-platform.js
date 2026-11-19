export const platformAudit = [
  {
    moduleTitle: 'Operação em escala',
    baseline: 'As quatro aulas já calculavam o backlog durante o cold start, separavam startup, readiness e liveness, investigavam TTFT com histogramas e comparavam coortes num rollout. Faltava decidir quando a própria medição de saúde, demanda ou qualidade induz o operador ao erro.',
    gaps: [
      'Medir a capacidade que sobrevive à perda de uma zona quando as GPUs têm vazões diferentes.',
      'Conter ejeções simultâneas e distinguir uma máquina defeituosa de uma dependência compartilhada.',
      'Estimar incidência com traces amostrados e detectar regressões que contaminam o grupo de controle.',
    ],
    cases: [
      {
        org: 'Meta', title: 'Quanto tráfego a frota do Facebook suporta após uma falha regional?',
        url: 'https://engineering.fb.com/2020/09/14/networking-traffic/throughput-autoscaling/',
        observed: 'Na camada web do Facebook, a equipe mede a capacidade máxima segura dos hosts e a confronta com a demanda prevista em cenário de desastre.',
        mechanism: 'O teste desloca tráfego real em incrementos para poucos hosts e recua quando o serviço degrada. O controlador usa as medições separadas por hardware e região para somar a oferta disponível.',
        limits: 'O estudo descreve servidores web. Aplicar a técnica a GPUs exige medir a mistura de prompts e saídas, o escalonador e os limites de latência de cada modelo.',
      },
      {
        org: 'Amazon', title: 'Quando uma sonda profunda retira a frota inteira',
        url: 'https://aws.amazon.com/builders-library/implementing-health-checks/',
        observed: 'Equipes da Amazon descrevem o risco de servidores saudáveis entrarem e saírem da rotação quando uma dependência fica intermitente.',
        mechanism: 'A prática descrita mantém verificações rápidas do balanceador locais ao servidor e delega decisões sobre dependências a uma automação central com ritmo limitado de remoção.',
        limits: 'A reação depende da configuração do balanceador e do perfil da falha. O relato não estabelece um percentual universal de servidores que podem ser retirados.',
      },
      {
        org: 'Google', title: 'Como estimar frequências a partir dos traces do Dapper',
        url: 'https://research.google/pubs/uncertainty-in-aggregate-estimates-from-sampled-distributed-traces/',
        observed: 'O Dapper coleta frações do tráfego RPC de produção. Os pesquisadores mostram como incorporar as camadas de amostragem ao estimar agregados e sua incerteza.',
        mechanism: 'Uma observação selecionada com probabilidade conhecida representa mais de uma chamada. Ignorar a seleção muda a estimativa quando grupos têm probabilidades distintas.',
        limits: 'As garantias são para estatísticas e desenhos de amostragem específicos. Perda de telemetria com probabilidade desconhecida exige outra fonte para reconstruir a incidência.',
      },
      {
        org: 'Cloudflare', title: 'Uma regra distribuída globalmente derrubou o tráfego em julho de 2019',
        url: 'https://blog.cloudflare.com/details-of-the-cloudflare-outage-on-july-2-2019/',
        observed: 'Uma alteração de regra do WAF saturou CPUs e gerou erros 502 em escala global. O procedimento da época permitia que regras de rotina chegassem a todas as localidades de uma vez.',
        mechanism: 'A regra introduziu trabalho excessivo no caminho das requisições. Entre as medidas corretivas, a equipe passou a prever distribuição por estágios também para mudanças de regras.',
        limits: 'Foi uma falha de configuração do WAF. A aplicação à revisão de um gateway de IA é um exercício de isolamento de dependências.',
      },
    ],
    lessons: {
      'replicas-e-autoscaling': {
        gap: 'O cálculo tratava as réplicas prontas como equivalentes, inclusive no ensaio de falha.',
        title: 'Calcule a capacidade sobrevivente por domínio de falha', caseIndex: 0,
        method: 'Meça a maior taxa que satisfaz TTFT e intervalo entre tokens para cada par de modelo e GPU, sob o mesmo perfil de requisições. Some as taxas por zona. Para prometer tolerância à perda de qualquer zona, retire a maior contribuição da soma e verifique se as outras zonas conseguem receber essa carga. Um número adequado de pods pode esconder concentração de aceleradores rápidos numa única zona.',
        signal: 'Registre capacidade medida, demanda oferecida incluindo recusas, margem por zona perdida e utilização dos enlaces de failover. Valide com retirada gradual de uma zona e recomposição do tráfego. Se o destino ultrapassar o SLO, interrompa a retirada e redistribua capacidade antes de reduzir o mínimo do autoscaler.',
        exercise: {
          prompt: 'Num replay de mistura fixa, A suporta 3 × 14 req/s, B suporta 4 × 8 e C suporta 3 × 8. O pico é 64 req/s e o roteamento entre as zonas é livre. Quantas réplicas de 8 req/s precisam ser adicionadas fora de A para tolerar a perda de qualquer zona?',
          solution: 'A soma é 98 req/s. Sem A restam 56, um déficit de 8. Uma réplica em B leva as capacidades a 42, 40 e 24. A menor soma sobrevivente passa a 64 req/s. É o mínimo sem folga, válido para o perfil e os SLOs testados.',
        },
      },
      'saude-e-prontidao': {
        gap: 'A aula distinguia sondas e drenagem, mas faltava limitar o raio de uma decisão de ejeção sob falha parcial.',
        title: 'Imponha um orçamento de ejeções simultâneas', caseIndex: 1,
        method: 'Classifique como local um erro confirmado em testes que exercitam a própria réplica, como falhar uma geração sintética com pesos residentes. Uma sonda que chama o mesmo serviço de metadados de todas as réplicas mede também esse serviço. Agregue esses resultados antes de alterar a rotação e limite as remoções por zona ao que a capacidade sobrevivente comporta. Um modo de emergência ativado apenas quando todas falham chega tarde numa falha parcial.',
        signal: 'Cruze fração de sondas profundas falhando, sucesso do teste local, tráfego concluído e capacidade restante por zona. Teste resposta lenta e intermitente da dependência. Pause ejeções por esse sinal quando o orçamento acabar e investigue centralmente. Continue isolando falhas locais confirmadas com uma política de capacidade explícita.',
        exercise: {
          prompt: 'Dez réplicas prontas sustentam 12 req/s cada dentro do SLO. A demanda está estável em 90 req/s e quatro sondas dependentes do catálogo falham juntas. Quantas remoções a capacidade tolera e qual decisão evita ampliar o incidente?',
          solution: 'São necessárias pelo menos oito réplicas, pois 90 / 12 = 7,5. A capacidade tolera duas remoções. Quatro deixariam só 72 req/s. Suspenda a ejeção em grupo, examine as sondas locais e restrinja a degradação às rotas que dependem do catálogo.',
        },
      },
      'observabilidade': {
        gap: 'Faltava distinguir a proporção que aparece no coletor da proporção que o usuário experimenta.',
        title: 'Reconstrua o denominador de um trace amostrado', caseIndex: 2,
        method: 'Na amostragem decidida ao fim da requisição, o coletor pode reter todos os erros e apenas uma fração dos sucessos. Registre a probabilidade efetiva de inclusão por classe e conte cada trace com peso inverso a essa probabilidade. Uma segunda amostragem antes do coletor também entra no peso. Se os erros e os sucessos tiverem probabilidades desconhecidas de serem descartados por sobrecarga, recorra aos contadores independentes da borda.',
        signal: 'Compare totais estimados por rota com contadores de chegada e eventos de fim de stream. Acompanhe spans descartados pelo exportador e a fração sem decisão final. Suspenda estimativas de incidência baseadas nos traces enquanto o erro relativo exceder a tolerância operacional.',
        exercise: {
          prompt: 'O coletor reteve 120 erros com probabilidade 1 e 990 sucessos com probabilidade 0,01. Todos os streams terminaram e não houve perda no transporte. Qual a estimativa da taxa de erro?',
          solution: 'Os 990 sucessos observados representam aproximadamente 99.000 sucessos. A estimativa é 120 / 99.120 ≈ 0,121%. Dividir 120 pelos 1.110 traces guardados daria 10,81%. A contagem de sucessos é estimada e varia com a amostra.',
        },
      },
      'rollout-canario': {
        gap: 'O canário separava revisões de modelo, mas uma configuração global ainda podia afetar candidato e controle ao mesmo tempo.',
        title: 'Isole o plano de configuração que serve o canário', caseIndex: 3,
        method: 'Versione também as regras do gateway e permita que uma célula receba sua configuração de forma independente. Preserve uma célula com a revisão anterior e com a mesma mistura de tráfego. Calcule a diferença candidato–controle e verifique também o SLO absoluto. Se os dois usam o mesmo componente alterado, uma diferença pequena pode esconder uma queda grande nos dois grupos.',
        signal: 'Anote a revisão efetiva em cada salto da requisição. Um erro absoluto alto em ambos os grupos deve congelar o avanço mesmo com diferença pequena. Reverta a configuração compartilhada pela via independente de recuperação e confirme melhora nos dois grupos antes de retomar.',
        exercise: {
          prompt: 'Antes da mudança, duas células tinham 0,1% de erros. Após distribuir uma regra comum a ambas, o controle registra 230 erros em 10.000 chamadas e o candidato 240 em 10.000. O limite absoluto é 0,5% e o de diferença entre grupos é 0,2 ponto percentual. Promova?',
          solution: 'Não. A diferença de 0,1 ponto passa no teste relativo. As taxas absolutas de 2,3% e 2,4% excedem 0,5%. Congele e volte a regra comum, depois confirme a hipótese na telemetria. Esse desenho não isola o efeito da regra.',
        },
      },
    },
  },
  {
    moduleTitle: 'Arquiteturas aplicadas',
    baseline: 'As aulas já cobriam publicação de índices com watermark, commit do resultado de lote e reconstrução temporal de features. A auditoria encontrou decisões em aberto para dados que só podem ser consultados na origem, workers retardatários e divergências online invisíveis em histogramas.',
    gaps: [
      'Definir como uma fonte federada indisponível afeta a validade da resposta de RAG.',
      'Quando duplicar apenas a cauda de um lote reduz o prazo sem comprometer o resultado.',
      'Comparar features pela mesma decisão e entidade quando as distribuições agregadas são iguais.',
    ],
    cases: [
      {
        org: 'Slack', title: 'Busca empresarial federada com a autorização do usuário',
        url: 'https://slack.engineering/how-we-built-enterprise-search-to-be-secure-and-private/',
        observed: 'Para integrar conteúdo de aplicações externas à busca empresarial, o Slack descreve consultas em tempo real às APIs dos parceiros, incluindo Google Drive e GitHub.',
        mechanism: 'Cada busca externa usa a autorização OAuth do usuário. A origem aplica suas permissões no momento da consulta, sem exigir uma segunda cópia dos documentos na base do Slack.',
        limits: 'O artigo descreve o desenho de acesso. O prazo por fonte e o comportamento diante de evidência parcial precisam ser definidos por cada produto.',
      },
      {
        org: 'Google', title: 'Tarefas de reserva no MapReduce',
        url: 'https://www.usenix.org/legacy/publications/library/proceedings/osdi04/tech/full_papers/dean/dean_html/index.html',
        observed: 'Ao operar MapReduce nos clusters do Google, os autores encontraram tarefas que atrasavam a conclusão de jobs inteiros. O artigo documenta o uso de cópias de reserva perto do fim de uma execução.',
        mechanism: 'O coordenador agenda outra tentativa das tarefas ainda em execução e aceita a primeira conclusão. O objetivo é encurtar a cauda causada por máquinas excepcionalmente lentas ou contenção local.',
        limits: 'A experiência é de processamento distribuído. Na inferência, trabalhos longos podem ser intrinsecamente caros e duas tentativas com amostragem podem produzir textos diferentes.',
      },
      {
        org: 'Uber', title: 'Paridade e monitoramento de features no Michelangelo',
        url: 'https://www.uber.com/ae/en/blog/scaling-michelangelo/',
        observed: 'A plataforma Michelangelo oferece pipelines offline e online para as features usadas no treino e na previsão. O monitoramento compara previsões a resultados observados e acompanha distribuições quando esse vínculo é difícil.',
        mechanism: 'Compartilhar a definição de feature e acompanhar os valores entregues após o deploy ajuda a identificar mudanças nos dados e falhas nos pipelines.',
        limits: 'O relato não garante igualdade por entidade a partir de distribuições iguais. O teste pareado desta aula acrescenta essa verificação.',
      },
    ],
    lessons: {
      'rag-em-producao': {
        gap: 'O fluxo com índice local não especificava como interpretar a ausência de um conector externo obrigatório.',
        title: 'Declare de quais fontes a resposta depende', caseIndex: 0,
        method: 'Para responder se um contrato tem exceções, uma política geral recuperada localmente pode ser insuficiente. Faça a consulta à fonte contratual com a credencial delegada e um prazo dentro do orçamento total. Modele três resultados distintos por origem: evidência válida, busca autorizada sem resultado e indisponibilidade. Só responda de forma conclusiva se todas as origens obrigatórias finalizaram e o conjunto de evidências sustenta a conclusão. Um índice local atualizado do manual não cobre uma exceção que vive exclusivamente no conector.',
        signal: 'Registre latência, motivo de término e cobertura das origens obrigatórias por tipo de pergunta. Em shadow, atrase seletivamente um conector e confira se a taxa de afirmações definitivas sem evidência continua zero no teste. Reverta o caminho de resposta que confundir timeout com ausência.',
        exercise: {
          prompt: 'Cem consultas precisam do manual e do contrato individual. O manual responde a todas. A origem contratual devolve 70 cláusulas, confirma ausência em 20 buscas e expira em dez. Suponha que a política autorize aplicar o manual após busca completa sem exceção. Quantas decisões conclusivas são elegíveis?',
          solution: 'Até 90, desde que as evidências de cada uma autorizem a conclusão. Nas dez expiradas, informe cobertura incompleta ou encaminhe para revisão. Contar 30 ausências afirmaria algo que somente 20 buscas terminaram de verificar.',
        },
      },
      'inferencia-em-lote': {
        gap: 'A política de retomada após morte de workers não decidia o que fazer com um worker vivo que domina a cauda.',
        title: 'Duplique apenas um retardatário que possa ser vencido', caseIndex: 1,
        method: 'Compare o progresso com tarefas de perfil semelhante, incluindo comprimento do prompt e tokens já gerados. Projete o tempo restante da tentativa atual e o de iniciar e executar uma cópia em outro domínio de contenção. Duplique somente se houver capacidade ociosa, diferença favorável e commit único. Se o gargalo for o mesmo armazenamento saturado, duplicar pode piorar as duas tentativas. Para saídas estocásticas, confirme que o contrato permite aceitar a primeira saída válida e avalie viés por comprimento.',
        signal: 'Registre motivos para duplicação, conclusão vencedora, GPU-segundos desperdiçados e diferença de duração do job em replays com a mesma carga. Desative cópias quando o prazo do lote não melhorar ou quando prejudicarem a fila interativa ou a distribuição de qualidade.',
        exercise: {
          prompt: 'Só falta um shard. A tentativa atual precisa de mais 11 min. Em GPU ociosa, uma cópia precisa de 2 min para iniciar e 5 min para executar. O sink aceita um commit atômico e o trabalho é determinístico. Qual é o ganho previsto e o consumo adicional se a original for cancelada assim que a cópia terminar?',
          solution: 'O job termina em 7 min em vez de 11, ganho de 4 min. Se ambas ocupam uma GPU durante os 7 min, inclusive no startup, o consumo futuro é 14 GPU-min em vez de 11, acréscimo de 3 GPU-min. O custo cresce se o cancelamento atrasar.',
        },
      },
      'features-online': {
        gap: 'O replay checava disponibilidade temporal, mas faltava um teste que detectasse troca de valores entre entidades com as mesmas marginais.',
        title: 'Faça a comparação por previsão e entidade', caseIndex: 2,
        method: 'Amostre decisões com chave estável e registre revisão da feature, instante de corte e valores autorizados para diagnóstico. Reconstrua a leitura offline para a mesma entidade e o mesmo instante de disponibilidade. Compare a tupla completa e enumere diferenças por versão da transformação. Um erro de junção pode permutar valores entre usuários sem alterar média, quantis ou taxa de nulos. Use chaves protegidas e retenção limitada para essa auditoria.',
        signal: 'Meça a fração de pares divergentes por versão e erro absoluto por faixa. Separe previsões sem correspondente offline para não esconder falhas de junção. Se o conjunto de controle reproduzir a paridade e o candidato perder correspondência, suspenda a mudança e identifique o primeiro estágio que troca as entidades.',
        exercise: {
          prompt: 'Quatro leituras offline para A, B, C e D são 0, 1, 2 e 3. No mesmo instante a revisão nova entrega 3, 2, 1 e 0. Calcule o erro médio dos valores por entidade em módulo e explique por que a média global e o histograma passam.',
          solution: 'As diferenças absolutas são 3, 1, 1 e 3. O erro absoluto médio é 2 e quatro de quatro pares divergem. As duas séries contêm os mesmos quatro valores e média 1,5. Atribuí-los à entidade errada preserva a distribuição global.',
        },
      },
    },
  },
  {
    moduleTitle: 'Como LLMs funcionam',
    baseline: 'As aulas explicavam o template, a comparação entre busca exata e aproximada, o custo do decode e a posição da evidência. Já havia cálculos de GQA, RoPE e FlashAttention. Restava aplicar esses mecanismos a revisões de vocabulário, execução distribuída em diferentes backends.',
    gaps: [
      'Aferir cotas multilíngues e medir separadamente o erro de encurtar vetores e o erro do índice.',
      'Contabilizar cache de prefixo pelo volume de tokens poupados e localizar regressões introduzidas no backend de inferência.',
      'Combinar a atenção calculada em múltiplos ranks preservando a normalização global.',
    ],
    cases: [
      {
        org: 'OpenAI', title: 'O vocabulário do GPT-4o mudou a compressão por idioma',
        url: 'https://openai.com/index/hello-gpt-4o/',
        observed: 'No lançamento do GPT-4o, a equipe publicou exemplos do novo tokenizador em vinte idiomas. Na frase exemplificada em gujaráti, a contagem caiu de 145 para 33 tokens. Na versão inglesa do exemplo, passou de 27 para 24.',
        mechanism: 'Sequências de caracteres podem ocupar quantidades diferentes de unidades no vocabulário de cada modelo. A troca altera a pressão sobre contexto e cotas mesmo quando o texto continua igual.',
        limits: 'Os números correspondem a frases escolhidas para a demonstração. Não estimam a compressão média para todo o idioma, domínio ou histórico de chat.',
      },
      {
        org: 'OpenAI', title: 'Embeddings com dimensão configurável na API',
        url: 'https://openai.com/index/new-embedding-models-and-api-updates/',
        observed: 'A API lançou modelos de embedding treinados para permitir encurtamento pela dimensão de saída. A equipe mediu a qualidade desses vetores em benchmarks como MTEB.',
        mechanism: 'O treinamento faz com que prefixos do vetor conservem informação útil. A opção dimensions permite trocar qualidade de recuperação por menor custo de armazenamento e cálculo.',
        limits: 'A propriedade depende de como o encoder foi treinado. O ganho medido no benchmark não assegura cobertura das entidades raras do seu catálogo.',
      },
      {
        org: 'Anthropic', title: 'Um defeito de gerenciamento de contexto aumentou cache misses no Claude Code',
        url: 'https://www.anthropic.com/research/april-23-postmortem',
        observed: 'Uma mudança no tratamento de sessões antigas do Claude Code descartava blocos de raciocínio em chamadas subsequentes. A equipe relacionou a repetição de misses aos relatos de consumo mais rápido de cotas.',
        mechanism: 'Ao modificar o histórico no caminho de retomada, o sistema alterava tanto a informação disponível ao modelo quanto a possibilidade de reutilizar o prefixo anterior.',
        limits: 'O relato descreve um defeito específico e trata a relação com consumo de cota como hipótese da equipe. Custo de GPU e política comercial devem ser medidos separadamente.',
      },
      {
        org: 'Anthropic', title: 'Regressões que dependiam da plataforma, do lote e do roteamento',
        url: 'https://www.anthropic.com/research/a-postmortem-of-three-recent-issues',
        observed: 'Na investigação publicada em 2025, a Anthropic distinguiu problemas de roteamento de contexto, corrupção de saída e erro de compilação de uma operação de top-k em TPU. O último foi confirmado para Haiku 3.5.',
        mechanism: 'O top-k aproximado podia omitir tokens importantes para certas configurações e tamanhos de lote. A equipe passou a usar top-k exato e aumentou a precisão de parte das operações.',
        limits: 'O postmortem separa impactos confirmados dos suspeitos. Uma divergência entre amostras de texto, isoladamente, não identifica um erro numérico.',
      },
      {
        org: 'Meta', title: 'Paralelismo de contexto na inferência de LLMs',
        url: 'https://engineering.fb.com/2025/10/17/ai-research/scaling-llm-inference-innovations-tensor-parallelism-context-parallelism-expert-parallelism/',
        observed: 'Ao descrever a infraestrutura de inferência que desenvolve para aplicações como Meta AI, a Meta relata resultados de prefill longo com o contexto dividido entre hosts.',
        mechanism: 'A equipe apresenta variantes que transferem K/V ou as consultas entre ranks para que a atenção incorpore o contexto distribuído. O texto publica medições de configuração e tamanho de entrada específicos.',
        limits: 'Os resultados de desempenho são ensaios identificados, não um percentil de tráfego do aplicativo. O exemplo numérico da aula ilustra a normalização global necessária na combinação de resultados parciais.',
      },

    ],
    lessons: {
      'tokenizacao-em-producao': {
        gap: 'O corte por idioma detectava recusas, mas faltava traduzir mudança de vocabulário em impacto de cotas antes do rollout.',
        title: 'Recalibre admissão em tokens por idioma e domínio', caseIndex: 0,
        method: 'Congele textos reais autorizados ou exemplos representativos e renderize a conversa completa nas duas revisões. Compare tokens por requisição e por byte UTF-8 nos mesmos pares. Preserve código, texto misto, nomes e caracteres combinados no corpus. A média de tokens por caractere em inglês pode esconder uma fila saturada por uma única língua. Atribua um orçamento a partir da distribuição empírica da rota e conte com o tokenizador exato no ponto de admissão.',
        signal: 'Meça a variação pareada de tokens, a fração acima da janela após reservar a saída e o throughput oferecido por faixa de comprimento. Antes de promover, repita o pico observado com as novas contagens e verifique a cota de entrada e o TTFT de cada grupo.',
        exercise: {
          prompt: 'O ingress recebe por minuto 100 mensagens do grupo A e 20 de B, sem histórico. No corpus fixo, cada A passa de 50 para 48 tokens e cada B de 150 para 60. Um limite de 6.500 tokens/min é suficiente antes e depois, ignorando overhead e saídas?',
          solution: 'Antes chegam 100 × 50 + 20 × 150 = 8.000 tokens/min. Depois, 100 × 48 + 20 × 60 = 6.000. O novo vocabulário cabe nesse cenário e economiza 25% no agregado. A estimativa dependerá da proporção de B e precisa incluir o template no tráfego real.',
        },
      },
      'espacos-de-embeddings': {
        gap: 'A aula isolava encoder e índice aproximado, mas faltava dimensionar uma representação treinada para funcionar com prefixos do vetor.',
        title: 'Separe a perda por dimensão da perda pela busca aproximada', caseIndex: 1,
        method: 'Com embeddings treinados para encurtamento, produza versões longa e curta para consultas e documentos. Renormalize o vetor curto se a comparação usar produto interno como equivalente a cosseno. Meça a recuperação exata das duas versões sobre os mesmos rótulos, depois avalie a busca aproximada na dimensão curta. A primeira queda inclui perda de representação; a segunda revela o efeito adicional do algoritmo de busca naquele espaço. O reranker só pode recuperar relevância entre os candidatos que chegaram a ele.',
        signal: 'Registre cobertura por entidade rara, uso de RAM incluindo grafo e metadados e p95 por consulta. Só migre quando a RAM residente e o SLO de qualidade passarem na mesma coorte. Se a versão curta já falhar na busca exata, aumentar esforço de busca no índice não recupera esse teto.',
        exercise: {
          prompt: 'Dez milhões de vetores FP32 passam de 1.536 para 384 dimensões. Em 1.000 consultas com um alvo relevante, a busca exata longa acerta 950, a exata curta 925 e a aproximada curta 900. Qual a economia bruta em GB decimais e como atribuir a perda agregada?',
          solution: 'Os vetores passam de 61,44 GB a 15,36 GB, economia bruta de 46,08 GB. Os acertos caem de 95% a 92,5% na busca exata e de 92,5% a 90% com a aproximação. A diferença líquida é 2,5 pontos percentuais por mudança. Compare os IDs pareados para saber quais consultas foram perdidas ou resgatadas.',
        },
      },
      'economia-da-geracao': {
        gap: 'O dimensionamento por comprimento não modelava como a invalidação de prefixos muda a quantidade de prefill novo.',
        title: 'Pondere os acertos do cache pelos tokens reaproveitados', caseIndex: 2,
        method: 'Num cache de prefixos exatos, uma alteração precoce de template ou histórico reduz o maior prefixo reutilizável. Para uma janela de pedidos, some tokens de entrada e subtraia os tokens realmente atendidos do cache. Use perfis do backend para converter o restante em custo de prefill. Dois produtos com igual porcentagem de requisições com hit podem ter demanda radicalmente diferente se apenas um reaproveita os prefixos longos. Preserve a semântica das mensagens ao estabilizar o prefixo.',
        signal: 'Registre tokens de cache lidos, escritos e de entrada, TTFT com contexto frio e acurácia após retomadas. Compare mistura, cobrança e GPU-tempo em séries separadas. Reverta uma otimização que aumente hits removendo contexto necessário ou que concentre misses no caminho mais caro.',
        exercise: {
          prompt: 'Chegam 80 requisições com 500 tokens e 20 com 8.000. No cenário A, cada curta reaproveita todos os 500, e as longas nada. No B, só as longas reaproveitam 6.000 cada. Quantos tokens exigem prefill novo em cada cenário?',
          solution: 'Chegam 200.000 tokens. Em A sobram 160.000 para prefill novo, apesar de 80% das requisições terem hit. Em B sobram 80.000, com hits em apenas 20% das requisições. Essa contagem não pressupõe custo linear de atenção.',
        },
      },
      'regressoes-de-prompt': {
        gap: 'O replay fixava prompt e modelo, mas faltava cruzar a regressão com hardware e forma do lote.',
        title: 'Separe defeito de prompt de erro de kernel com um teste cruzado', caseIndex: 3,
        method: 'Fixe snapshot dos pesos, IDs do prompt, parâmetros e uma continuação de referência. Execute o mesmo caso nos dois backends e em lotes de formas diferentes. Com teacher forcing, cada passo vê o mesmo prefixo mesmo quando o token escolhido diverge. Compare as distribuições ou top-k disponíveis e a margem entre candidatos. Uma troca entre tokens quase empatados pede análise diferente de excluir sistematicamente o token dominante em um único backend.',
        signal: 'Agrupe regressões por versão do compilador, hardware e bucket de batch. Verifique se o erro reaparece ao alternar apenas a variante suspeita. Quarentene o caminho afetado e reavalie o caso no backend de referência antes de alterar o prompt em toda a frota.',
        exercise: {
          prompt: 'Em 100 casos determinísticos, os mesmos prompts têm 99 acertos no backend A com lotes de 1 e 16. No B há 99 com lote 1 e 81 com lote 16. Qual reprodução priorizar e o que seria insuficiente para concluir que o prompt regrediu?',
          solution: 'Compare B/16 com B/1 e A/16 nos mesmos IDs, com o mesmo prefixo imposto passo a passo, e localize o primeiro desvio de logits. A interação backend × lote justifica isolar B/16. A taxa agregada por revisão de prompt não controla o roteamento e não sustenta atribuição causal.',
        },
      },
      'atencao-gqa-rope': {
        gap: 'Faltava combinar os scores quando as posições de K/V da mesma cabeça estão distribuídas entre ranks.',
        title: 'Recombine a atenção com a massa de cada partição', caseIndex: 4,
        method: 'Em paralelismo de contexto, cada rank recebe a mesma consulta e calcula scores sobre posições distintas de K/V. A máscara causal e o RoPE usam posições globais. Para a cabeça em questão, cada rank calcula seu máximo local, sua soma de exponenciais deslocadas e a soma ponderada dos valores. Com o maior máximo global, reescale as duas somas locais pelo exponencial da diferença entre os máximos, some entre ranks e divida uma única vez. Fazer a média dos vetores locais normalizados atribui a mesma massa a partições com evidências muito diferentes.',
        signal: 'Compare o resultado distribuído ao cálculo em uma GPU nas mesmas entradas, incluindo uma partição totalmente mascarada, que deve contribuir massa zero. Meça o erro numérico e o tempo dos coletivos por comprimento. Desative a variante se exceder a tolerância do dtype ou piorar o TTFT no comprimento servido.',
        exercise: {
          prompt: 'Dois ranks têm um token válido cada. Para a mesma consulta, os scores são 0 e ln(3), e os valores escalares 10 e 2. Qual a saída correta e qual erro resulta da média de duas atenções locais?',
          solution: 'As massas globais são 1 e 3, portanto a saída é (1 × 10 + 3 × 2) / 4 = 4. Normalizar localmente daria 10 e 2. A média 6 apaga a diferença de massa e erra em 2. O mesmo cálculo funciona subtraindo ln(3) de ambos os scores antes de exponenciar.',
        },
      },

    },
  },
  {
    moduleTitle: 'API de IA generativa & tools',
    baseline: 'O curso já validava saída estruturada, efeitos idempotentes, roteamento de tarefas e reconciliação de resultados por ID. Restavam limites de estruturas recursivas, notificações externas fora de ordem e duplicação de pesquisa quando a tarefa é delegada.',
    gaps: [
      'Limitar trabalho do consumidor quando o schema aceita árvores recursivas.',
      'Reconstruir o estado de um efeito externo com notificações duplicadas ou fora de ordem.',
      'Medir quanto cada subagente acrescenta à cobertura da pesquisa e absorver a rajada de resultados de um lote.',
    ],
    cases: [
      {
        org: 'OpenAI', title: 'Geração restrita com esquemas recursivos',
        url: 'https://openai.com/index/introducing-structured-outputs-in-the-api/',
        observed: 'Ao lançar Structured Outputs na API, a equipe mostrou que uma árvore com filhos do mesmo tipo pode ser representada por um schema recursivo e gerada com restrições.',
        mechanism: 'A gramática derivada do schema determina os tokens válidos em função do prefixo. Uma referência recursiva permite encadear o mesmo tipo em profundidades variáveis.',
        limits: 'A garantia estrutural para respostas completas não define o custo máximo de renderizar a árvore. O consumidor ainda precisa de limites e precisa tratar interrupções e recusas.',
      },
      {
        org: 'Stripe', title: 'Entrega de eventos de pagamento por webhook',
        url: 'https://docs.stripe.com/webhooks',
        observed: 'Na API de pagamentos, a Stripe descreve retentativas, eventos duplicados e ausência de garantia de ordem entre entregas de webhook.',
        mechanism: 'O consumidor pode consultar objetos pela API para recuperar o estado de que precisa. Persistir identificadores já processados evita repetir uma entrega conhecida.',
        limits: 'O contrato documentado é de entrega de eventos. A chave de negócio e as transições válidas de uma operação de ferramenta pertencem à aplicação que a executa.',
      },
      {
        org: 'Anthropic', title: 'Como o agente principal divide a pesquisa entre especialistas',
        url: 'https://www.anthropic.com/research/multi-agent-research-system',
        observed: 'Ao desenvolver o produto Research, a equipe observou que instruções vagas levavam subagentes a repetir buscas. No exemplo publicado sobre escassez de semicondutores, dois agentes investigaram a mesma cadeia de suprimentos enquanto outro pesquisou uma crise de um período diferente.',
        mechanism: 'O agente principal passou a especificar o objetivo de cada investigação, as fontes e ferramentas adequadas, seus limites e o formato de entrega. A divisão explícita procura reduzir lacunas e trabalho repetido.',
        limits: 'O relato documenta o problema observado e o desenho da delegação. Os conjuntos de fatos e os cálculos de cobertura usados a seguir pertencem ao exercício.',
      },
      {
        org: 'Quora e Anthropic', title: 'Sumarização e extração de destaques por lotes',
        url: 'https://claude.com/resources/articles/message-batches-api',
        observed: 'A Quora relata usar a Message Batches API para resumir conteúdo e extrair destaques destinados a recursos do produto.',
        mechanism: 'A equipe submete um grupo de consultas que toleram processamento assíncrono e busca os resultados posteriormente. Assim, a execução do modelo fica desacoplada do momento de consumo.',
        limits: 'O relato não publica o throughput do consumidor da Quora, seu banco de dados ou seus SLOs. A capacidade de ingestão do exercício é ilustrativa.',
      },
    ],
    lessons: {
      'contratos-de-saida': {
        gap: 'Schema válido e aprovação das regras de negócio não esgotavam os limites de custo da estrutura devolvida.',
        title: 'Orce profundidade, largura e tamanho da resposta', caseIndex: 0,
        method: 'Uma árvore recursiva pode ser válida e ainda consumir demais no parser, no renderizador ou em passos posteriores. Aplique limite de bytes durante a leitura e conte profundidade e nós enquanto analisa a estrutura, antes de materializar ou executar os filhos. Um máximo de filhos por nó, sozinho, permite crescimento exponencial com a profundidade. Aceite apenas uma saída completa e dentro do orçamento. Dê estado terminal próprio à truncada, à recusa e à estrutura que excedeu o limite.',
        signal: 'Meça taxas por motivo de término, maior profundidade, nós por resposta e tempo de validação do consumidor. Exercite a borda de cada limite com schema válido e streaming interrompido. Reduza a expressividade da rota ou volte a versão se saídas aceitáveis pelo produtor causarem fila no consumidor.',
        exercise: {
          prompt: 'Um schema permite três filhos por nó e profundidade de quatro arestas a partir da raiz. O consumidor suporta até 100 nós por resposta. Esses limites garantem que toda árvore válida seja processável?',
          solution: 'Não. A maior árvore tem 1 + 3 + 9 + 27 + 81 = 121 nós. Além das restrições locais, conte os nós da mensagem e interrompa o processamento ao tentar ler o 101º. Não publique uma árvore cortada como decisão válida.',
        },
      },
      'execucao-idempotente-de-tools': {
        gap: 'O recibo local impedia repetir uma chamada, mas faltava reconciliar confirmações tardias e fora de ordem emitidas pelo provedor.',
        title: 'Proteja a transição de estado e o efeito de negócio', caseIndex: 1,
        method: 'Associe a intenção autorizada ao ID da operação externa. Na chegada de uma notificação, autentique a origem e grave o evento numa caixa de entrada durável com chave única. Para emitir um efeito como liberar um pedido, consulte o estado vigente quando a ordem for incerta e registre a transição junto da mensagem de saída na mesma transação. Dois eventos diferentes podem se referir ao mesmo pagamento. A deduplicação do evento poupa trabalho, enquanto a chave do efeito impede duas liberações. Modele estorno posterior como outra transição válida.',
        signal: 'Conte eventos repetidos, tentativas de voltar a um estado anterior e operações sem confirmação acima do prazo. Reproduza entrega invertida, evento duplicado e queda entre commit e envio. Aceite o executor quando convergir ao estado oficial e houver um único efeito de negócio, inclusive se o publicador reenviar a mensagem.',
        exercise: {
          prompt: 'Uma cobrança já consta como paga na API. Chegam os eventos B (paga), A (criada) e B outra vez. A entrega ao sistema de expedição pode se repetir. Quantos eventos distintos armazenar e quantas liberações de pedido devem sobreviver?',
          solution: 'Armazene A e B uma vez cada. Emita uma liberação com chave estável derivada do pedido e da cobrança. O evento A tardio não regride o pagamento. A segunda entrega de B e qualquer reenvio da saída encontram as chaves já confirmadas. O consumidor de expedição também precisa deduplicar pela chave de liberação.',
        },
      },
      'workflow-ou-agente': {
        gap: 'A aula escolhia quando acionar o agente. Uma vez tomada essa decisão, faltava saber se delegar a mais pesquisadores ampliaria a cobertura ou apenas reproduziria a busca inicial.',
        title: 'Verifique que evidência a próxima delegação acrescenta', caseIndex: 2,
        method: 'Decomponha a pergunta em fatos verificáveis, cada qual com período, população e critério de evidência. Peça a cada subagente que devolva o fato, a fonte original e o trecho que o sustenta. Na síntese, una os fatos já comprovados e encaminhe ao próximo pesquisador uma lacuna específica. Dois portais que citam o mesmo comunicado sustentam um único fato com uma única origem. Se a tarefa exige confirmação independente, procure outra origem primária para o mesmo fato e registre essa confirmação separadamente da cobertura.',
        signal: 'Em consultas com gabarito revisado, meça a fração de fatos requeridos sustentados por evidência e a contribuição exclusiva de cada ramo ao removê-lo da síntese. Compare delegação aberta e dirigida com as mesmas ferramentas e orçamentos. Rejeite o candidato se elevar o número de citações e reduzir a cobertura ou deixar uma afirmação crítica sem a confirmação independente exigida.',
        exercise: {
          prompt: 'O gabarito pede seis fatos A–F. O primeiro pesquisador sustenta A, B e C. Num replay, um segundo generalista retorna A, B e D. Com o mesmo orçamento, um especialista em registros oficiais retorna D, E e F. Todos os retornos têm evidência válida. Qual segundo ramo escolher para maximizar cobertura? Se F também exigir duas origens independentes, já é possível encerrar a pesquisa com uma única fonte para F?',
          solution: 'O generalista acrescenta D. A união cobre 4/6 fatos, embora haja seis entradas somando os dois relatórios. O especialista acrescenta três fatos e eleva a cobertura a 6/6. Escolha esse ramo. Para a exigência adicional sobre F, falta uma segunda origem independente. Direcione a busca a essa confirmação e conserve a pendência explícita se houver apenas republicações da primeira fonte.',
        },
      },
      'contrato-de-api-em-lote': {
        gap: 'O cálculo do prazo terminava na reconciliação lógica dos IDs e não dimensionava a rajada de leitura e escrita após o job remoto.',
        title: 'Dimensione a ingestão depois que o provedor termina', caseIndex: 3,
        method: 'Modele dois relógios: o fim do processamento remoto e o instante em que o último registro fica disponível no produto. Leia o arquivo em streaming, grave blocos idempotentes e só avance o cursor durável depois da confirmação no sink. Se o transporte não oferecer retomada estável por byte, releia a partir do início e deduplique pelos IDs. Limite o número de escritores pela capacidade sustentável do destino. Abrir muitos downloads em paralelo pode aumentar a fila no banco sem adiantar a publicação.',
        signal: 'Registre itens confirmados por segundo, bytes pendentes, idade do resultado mais antigo e tempo do fim remoto até a publicação. Teste a chegada simultânea dos arquivos e um crash antes de confirmar o cursor. Se o prazo de negócio falhar após o job remoto, escalone o sink ou escalone no tempo os envios ao provedor.',
        exercise: {
          prompt: 'Três lotes terminam juntos às 10h00 e entregam 120.000 resultados cada. A gravação sustentável é 500 resultados/s no total, o download é mais rápido e não há backlog anterior. O compromisso de publicar tudo às 10h10 é viável?',
          solution: 'São 360.000 / 500 = 720 s, ou 12 min. O término mínimo é 10h12. Para dez minutos são necessários ao menos 600 resultados/s confirmados, sem folga para falhas. Distribuir os horários de chegada também pode reduzir a rajada se o processamento remoto permitir.',
        },
      },
    },
  },
]
