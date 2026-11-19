// Os números nos exercícios são cenários didáticos. Os relatos publicados ficam em cases.
function lesson(gap, title, caseIndex, method, signal, prompt, solution) {
  return { gap, title, caseIndex, method, signal, exercise: { prompt, solution } };
}

export const applicationsAudit = [
  {
    moduleTitle: 'LangChain & LangGraph',
    baseline: 'As aulas já exercitam reducers, migração do estado salvo, projeção de eventos com cursor, outbox, aprovação vinculada à revisão e exclusão de workers que perderam o lease.',
    gaps: [
      'Compatibilidade do fluxo de comandos quando há execuções suspensas durante um deploy.',
      'Capacidade do serviço de retomada quando muitas conexões caem juntas.',
      'Reconciliação independente de efeitos que o provedor confirmou e que a aplicação considera concluídos.'
    ],
    cases: [
      {
        org: 'Uber', title: 'Cadence em workflows de longa duração', url: 'https://www.uber.com/ug/en/blog/announcing-cadence/',
        observed: 'Na publicação do Cadence 1.0, a Uber relata mais de 12 bilhões de execuções por mês em seu ambiente. A equipe inclui compatibilidade com workflows em andamento e replay de históricos de produção entre os mecanismos de proteção contra mudanças de software.',
        mechanism: 'Um histórico durável permite verificar se a nova lógica continuaria emitindo comandos compatíveis com o que já aconteceu. Uma decisão versionada permite manter a rota antiga enquanto execuções atravessam a atualização.',
        limits: 'Cadence e LangGraph têm modelos de execução distintos. O exercício aplica o princípio a checkpoints, próximas etapas e contratos públicos de um grafo.'
      },
      {
        org: 'Slack', title: 'Distribuição de eventos em conexões persistentes', url: 'https://slack.engineering/real-time-messaging/',
        observed: 'O Slack descreve clientes com WebSocket persistente e serviços distintos para canais e conexões. Um evento chega aos servidores de gateway interessados e cada gateway o distribui aos clientes locais inscritos.',
        mechanism: 'Concentrar a distribuição por canal reduz transmissões entre servidores. O trabalho de restabelecer conexões e restaurar assinaturas se concentra na camada que atende os clientes.',
        limits: 'A topologia publicada é de mensageria. A janela de reconexão e a taxa sustentável de recuperação no exercício são hipóteses para um relay de agentes.'
      },
      {
        org: 'Stripe', title: 'Ledger e a validação do movimento de dinheiro', url: 'https://stripe.dev/blog/ledger-stripe-system-for-tracking-and-validating-money-movement',
        observed: 'A Stripe reúne registros de serviços e eventos de parceiros no Ledger para verificar o movimento de dinheiro. A plataforma mede se os produtores fornecem os eventos esperados e se as contas intermediárias convergem.',
        mechanism: 'Em partidas dobradas, transferências entre contas intermediárias tornam visível o valor que entrou por uma etapa e ainda não saiu pela correspondente. Comparar com um produtor independente detecta omissões.',
        limits: 'A Stripe descreve controles financeiros. A máquina de estados de compensação da aula é uma aplicação a um workflow de reembolso.'
      }
    ],
    lessons: {
      'grafo-estado-explicito': lesson(
        'Ler o JSON antigo não garante que o nó de retomada ainda exista ou que os efeitos pendentes tenham o mesmo significado.',
        'Atualize um grafo que já tem execuções em voo', 0,
        'Grave no início da execução a versão do grafo e da política. Para ensaiar a troca, capture checkpoints em cada fronteira durável, inclusive após agendar uma ação e antes da confirmação. Com clientes de efeitos substituídos por registros, compare próxima etapa, identificador lógico da ação, argumentos e destino nos dois runners. Dê às execuções incompatíveis um worker da versão antiga ou uma migração explícita que traduza a etapa pendente e preserve a identidade da ação.',
        'Conte execuções suspensas por versão e idade, inclusive aprovações assíncronas sem prazo curto. Para retirar um worker, exija fila drenada ou migração ensaiada em cada ponto de retomada. Se o replay divergir, interrompa o roteamento novo e continue atendendo a versão antiga.',
        'A v1 salva “aguardando confirmação” depois de emitir cobrar(O7). A v2 substitui cobrar por reservar e capturar. No replay de 200 checkpoints antigos, 18 emitem reservar(O7). Liberar a v2 para todos porque o esquema foi lido?',
        'Os 18/200 representam 9% de divergência nesta amostra. A cobrança já emitida pode coexistir com uma nova reserva. Fixe esses estados no runner v1 ou converta-os para aguardar a confirmação da cobrança original. Repita o replay e verifique que nenhum desses 18 emite outra intenção financeira.'
      ),
      'streaming-grafo-interface': lesson(
        'Retomar um cursor individual não dimensiona o serviço que recebe milhares de assinantes após a perda de um gateway.',
        'Recupere assinaturas sem saturar a leitura histórica', 1,
        'Separe a admissão de conexões da capacidade de reconstruir uma tela. Antes de liberar o replay, reserve orçamento por tenant e por shard de histórico. Para clientes em atraso, ofereça snapshot com cursor e aplique os deltas seguintes. Espalhe novas tentativas com atraso aleatório e limite-as no servidor. Só descarte deltas antigos quando o snapshot que os substitui for durável e estiver acessível.',
        'Meça conexões restabelecidas por segundo e, separadamente, segundos até a tela convergir. Uma conexão aberta e ainda presa na fila de replay conta como recuperação pendente. Reduza a admissão quando o replay competir com a publicação ao vivo.',
        'Após uma interrupção, 120.000 abas precisam de um replay cada. O serviço conclui 2.000 replays/s, dos quais 500/s ficam reservados para outros tráfegos. Uma janela uniforme de 30 s comporta a retomada?',
        'A capacidade residual é 1.500 replays/s. Em média chegariam 4.000/s. O menor tempo teórico para drenar é 120.000/1.500 = 80 s. Dimensione uma janela maior que 80 s para absorver variação e imponha um limite de admissão. Verifique convergência por cursor após a última conexão voltar.'
      ),
      'checkpoints-e-efeitos': lesson(
        'Deduplicar reenvios ainda deixa sem resposta um lançamento omitido depois de uma confirmação aparentemente bem-sucedida.',
        'Reconcilie a conclusão do grafo com a liquidação externa', 2,
        'Faça uma conciliação independente entre intenções aprovadas, operações locais e arquivo de liquidação do parceiro. Normalize moeda, sinal e identificador externo. Defina uma janela para liquidação antes de marcar faltas. Uma compensação é outra operação de negócio vinculada à primeira, com sua própria autorização e idempotência. Uma referência ambígua vai para investigação antes de qualquer nova transferência.',
        'Compare registros em ambas as direções e totalize por moeda, parceiro e idade. Dois erros de sinais opostos podem zerar o saldo agregado. Preserve a trilha de origens e deixe em aberto o incidente até conferir o próximo arquivo.',
        'Passada a janela, o grafo diz ter concluído A de R$ 60, B de R$ 40 e C de R$ 20. O extrato traz A de R$ 60, B de R$ 40 e X de R$ 20. Qual controle detecta o problema?',
        'Os dois totais dão R$ 120. A junção por referência encontra C sem liquidação e X sem intenção. Confira a identidade externa de X antes de reenviar C ou estornar X. O critério de encerramento inclui duas correspondências explicadas, mesmo que o saldo já esteja zerado.'
      )
    }
  },
  {
    moduleTitle: 'Memória & contexto',
    baseline: 'O módulo já cobre escopo por identidade, disputa de revisão, orçamento de tokens, resumos com fontes, tombstones e a corrida entre um apagamento e um job antigo.',
    gaps: [
      'Verificar se as garantias de revisão sobrevivem à expulsão do dado do cache.',
      'Dimensionar a leitura de artefatos sob demanda pelo ganho de qualidade e pelo prazo da ação.',
      'Especificar propriedade e dependência quando material derivado tem múltiplas fontes.'
    ],
    cases: [
      {
        org: 'Meta', title: 'Medição de consistência em caches distribuídos', url: 'https://engineering.fb.com/2022/06/08/core-infra/cache-made-consistent/',
        observed: 'Ao operar caches como o TAO, a Meta identificou corridas entre preenchimento por leitura e invalidação por escrita. A expulsão de uma entrada também pode apagar a versão usada para rejeitar um preenchimento atrasado. A equipe descreve sondagens em vários intervalos com o Polaris.',
        mechanism: 'Uma atualização observada gera verificações do estado visível nas réplicas. Repetir a verificação em intervalos diferentes separa a propagação transitória de uma inconsistência persistente e limita consultas custosas ao banco.',
        limits: 'O caso trata de caches. A garantia definida abaixo vale para a revisão mínima de memória por usuário em uma aplicação conversacional.'
      },
      {
        org: 'Anthropic', title: 'Contexto sob demanda no Claude Code', url: 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents',
        observed: 'A Anthropic relata que o Claude Code consegue explorar grandes volumes de dados mantendo referências e consultando partes específicas com ferramentas. A equipe também descreve compactação para preservar continuidade em sessões extensas.',
        mechanism: 'A referência ocupa pouco espaço inicial e permite adiar a leitura até que a tarefa exija o conteúdo. A etapa extra adiciona latência e pode falhar por autorização, revisão antiga ou indisponibilidade.',
        limits: 'A fonte descreve o produto e o princípio de recuperação sob demanda. As latências, permissões e decisões do exercício são didáticas.'
      },
      {
        org: 'Meta', title: 'DELF e a semântica das exclusões em cascata', url: 'https://engineering.fb.com/2020/08/12/security/delf/',
        observed: 'A Meta relata que o DELF executa bilhões de exclusões por dia e permite descrever no esquema o destino de objetos relacionados. Verificações procuram tanto retenção indevida quanto exclusão de dados que a pessoa não controla.',
        mechanism: 'As regras de exclusão são associadas aos tipos e relações do modelo. Assim, o comportamento de uma relação nova pode ser revisado antes de começar a acumular dados.',
        limits: 'O relato é de objetos sociais. A invalidação e a recomposição de um resumo misto são adaptações para memória de agentes.'
      }
    ],
    lessons: {
      'memoria-por-conversa': lesson(
        'Se a versão mais recente existia apenas no cache, uma expulsão pode permitir que uma leitura atrasada restaure uma preferência antiga.',
        'Faça uma escrita reconhecida sobreviver à expulsão do cache', 0,
        'Carregue a revisão mínima confirmada junto da conversa. Ao preencher o cache, compare o resultado atrasado com uma revisão que sobreviva à expulsão ou valide-o na fonte autoritativa. Mesmo que o preenchimento antigo entre no cache, uma leitura que exige revisão 43 precisa buscar uma cópia suficientemente recente ou aguardar. Sondagens que simulam a leitura de um cliente permitem distinguir erro observável de uma cópia desatualizada que nunca foi servida.',
        'Atrase uma leitura, confirme uma escrita, expulse a entrada e depois libere a resposta atrasada. Observe em que revisão o próximo prompt foi montado. Falha persistente após o prazo de propagação pede investigação diferente de uma leitura imediatamente após a escrita que prometeu consistência de sessão.',
        'Uma leitura de rev. 42 ficou em trânsito. O usuário recebeu a confirmação da rev. 43, o cache foi esvaziado e a leitura 42 voltou. O próximo pedido exige 43. A réplica disponível informa 42. Que resposta é válida?',
        'Espere uma réplica alcançar pelo menos 43 ou consulte a fonte que pode garantir a revisão. Se o prazo acabar, devolva indisponibilidade para a ação que depende da preferência. O teste passa se nenhum prompt dessa sessão incorporar 42 depois da confirmação de 43, inclusive após expulsar o cache.'
      ),
      'orcamento-de-contexto': lesson(
        'Um prompt menor pode exigir tantas leituras seriais que a ação vence antes de recuperar a evidência.',
        'Troque conteúdo por referências sob um prazo explícito', 1,
        'Mantenha no contexto um manifesto com origem, revisão imutável, escopo autorizado, intervalo e resumo verificável. O leitor resolve apenas os trechos necessários, sob a identidade da execução. Material essencial e pequeno pode ser carregado antecipadamente. Consultas independentes podem ser paralelas, com limite de bytes, de chamadas e de tempo. Se uma referência expirar, o resumo não substitui o fato exigido para executar uma ação.',
        'Compare sucesso da tarefa, tokens efetivamente lidos, número de rodadas seriais e latência por classe de pedido. A média de tokens esconde o subconjunto que precisa de vários anexos. Suspenda a estratégia quando o prazo ou a cobertura de evidência piorar nessa classe.',
        'Há 700 ms para recuperar evidência. A tarefa precisa de três trechos independentes. Cada leitura leva 260 ms neste ensaio e o custo fixo final é 80 ms. A concorrência permitida é dois. Qual plano cabe?',
        'Em série seriam 3 × 260 + 80 = 860 ms. Em duas rodadas seriam 2 × 260 + 80 = 600 ms, com 100 ms de margem neste ensaio. Resolva permissões e revisão de cada trecho. Uma leitura vencida continua faltando mesmo que o modelo consiga formular uma resposta plausível.'
      ),
      'retencao-e-esquecimento': lesson(
        'Uma cascata que apaga todos os nós alcançáveis também pode destruir fatos de outra pessoa.',
        'Distinga propriedade da dependência de conteúdo', 2,
        'Classifique cada relação como propriedade exclusiva, referência ou derivação. A exclusão de uma fonte exige tornar ilegível qualquer resumo que ainda a incorpore. Se houver bases independentes válidas, reconstrua o resumo com outra revisão usando somente as fontes restantes. Teste o grafo de proveniência com duas pessoas e um artefato compartilhado. Apagar a aresta de origem sem refazer o texto deixa informação derivada no prompt.',
        'Teste dois sentinelas simultaneamente, um fato exclusivo da fonte excluída e um fato da fonte preservada. Só libere o derivado reconstruído quando o primeiro desaparecer e o segundo puder ser rastreado até uma origem ainda autorizada.',
        'O resumo S contém o endereço de Ana vindo de A e o horário da equipe vindo de B. A agenda B é um registro de outra pessoa. Ana apaga A. Quais objetos continuam utilizáveis durante e depois da remoção?',
        'A e o resumo S ficam imediatamente indisponíveis para leitura. B continua disponível aos seus titulares. Uma revisão S2 pode ser publicada a partir de B depois de verificar que não contém o endereço e que o horário continua sustentado pela agenda. Nenhuma exclusão em cascata deve alcançar B apenas porque S apontava para ela.'
      )
    }
  },
  {
    moduleTitle: 'RAG de ponta a ponta',
    baseline: 'As sete aulas já cobrem ingestão por revisão, ACL, BM25 e RRF, reranking de passagens, citações, HNSW com filtros, SQ/PQ/OPQ com refinamento exato e IVF distribuído. Há controles contra busca exata, perda por shard e mudança de distribuição.',
    gaps: [
      'Relacionar a revisão do conteúdo à revisão mínima de autorização que pode liberá-lo.',
      'Preservar restrições da consulta e medir decisões de ranking sob exposição parcial.',
      'Verificar independência das fontes citadas e lidar com divergência entre originais.',
      'Orçar I/O na escolha entre RAM e SSD, validar o produto interno quantizado e reduzir falhas correlacionadas na escolha de listas IVF.'
    ],
    cases: [
      {
        org: 'Google', title: 'Zanzibar e a consistência entre conteúdo e autorização', url: 'https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/',
        observed: 'O Google descreve a implantação do Zanzibar em serviços como Drive, Calendar e YouTube. O sistema relaciona a ordem causal de mudanças de permissões e de conteúdo para que uma autorização antiga não exponha um conteúdo mais recente.',
        mechanism: 'Um token opaco identifica uma fronteira de consistência. Ao associar uma fronteira à gravação de conteúdo e exigi-la na checagem posterior, o cliente estabelece o quão recente precisa ser a decisão.',
        limits: 'Essa relação exige integração entre cliente e autorizador. O curso adapta o contrato para ingestão de documentos e geração de respostas por RAG.'
      },
      {
        org: 'DoorDash', title: 'LLMs na interpretação de consultas de busca', url: 'https://careersatdoordash.com/blog/how-doordash-leverages-llms-for-better-search-retrieval/',
        observed: 'A DoorDash usa taxonomias de pratos, culinárias, marcas e atributos na interpretação de consultas. A busca alimenta funcionalidades como o carrossel de pratos e a equipe acompanha relevância da página por intenção.',
        mechanism: 'Uma ontologia restringe como a consulta pode ser decomposta. O recuperador ganha sinais estruturados e o avaliador pode identificar as intenções que pioraram após uma mudança.',
        limits: 'O catálogo publicado é de comércio. Regras sobre versões, produtos e negação no exercício são uma aplicação a documentação técnica.'
      },
      {
        org: 'Microsoft Research', title: 'Decision Service e exploração em recomendações reais', url: 'https://www.microsoft.com/en-us/research/publication/making-contextual-decisions-with-low-technical-debt/',
        observed: 'A equipe descreve implantações em produção de recomendação de conteúdo com um ciclo de exploração, registro das decisões, aprendizado e publicação. A política que escolhe uma ação registra também a probabilidade daquela escolha.',
        mechanism: 'Conhecer a distribuição de exposição permite avaliar políticas alternativas dentro do conjunto de ações que a política de coleta podia selecionar. Ações muito raras produzem estimativas de alta variância.',
        limits: 'O caso utiliza decisões contextuais. O exercício restringe o reranking ao primeiro resultado e mede cliques. Avaliar a lista inteira, a utilidade da resposta e a autorização exige controles próprios.'
      },
      {
        org: 'Slack', title: 'Citações de mensagens e arquivos na busca com IA', url: 'https://slack.com/help/articles/25076892548883-Guide-to-AI-features-in-Slack',
        observed: 'Na busca com IA do Slack, as respostas apresentam citações. O usuário pode abrir a mensagem ou o arquivo de origem e conferir o que entrou na resposta.',
        mechanism: 'A ligação entre resposta e fonte original oferece uma etapa de inspeção humana em um produto de busca sobre conteúdo de trabalho.',
        limits: 'O guia descreve o comportamento público. A reconstrução de linhagem e a contagem de fontes independentes a seguir são propostas didáticas.'
      },
      {
        org: 'Pinterest', title: 'HNSW, SSD e quantização na plataforma Manas', url: 'https://medium.com/pinterest-engineering/evolving-pinterests-embedding-retrieval-platform-aede4e831e01',
        observed: 'A equipe do Pinterest compara HNSW e IVF, relata experimentos A/B de SQ e PQ em tráfego real e a implantação de quantização nos principais usos do Manas. A redução de custo de serving relatada foi de 20% a 30% no ambiente da empresa.',
        mechanism: 'A equipe descreve SQ com escala linear e operações SIMD inteiras para evitar decodificação no cálculo de distância. Para servir além da RAM, avaliou uma organização em SSD que limita o número de leituras por consulta.',
        limits: 'A publicação distingue o rollout da quantização dos resultados preliminares de SSD com SPANN. O exercício mede o orçamento de I/O de uma alternativa ao HNSW residente em RAM. Ganhos dependem de hardware e distribuição.'
      },
      {
        org: 'Google Research', title: 'ScaNN e atribuições redundantes de partição no SOAR', url: 'https://research.google/blog/soar-new-algorithms-for-even-faster-vector-search-with-scann/',
        observed: 'O Google identifica o ScaNN como tecnologia usada no Vertex AI Vector Search e no AlloyDB e descreve uma evolução do particionamento chamada SOAR. A equipe avalia essa evolução com benchmarks públicos.',
        mechanism: 'Ao atribuir um vetor a uma segunda partição, o SOAR favorece resíduos pouco alinhados com o erro da primeira. Isso reduz a chance de as duas rotas falharem para a mesma consulta.',
        limits: 'O texto não estabelece que toda instância comercial use o SOAR. Aqui a ideia orienta um teste de atribuição redundante em listas IVF.'
      }
    ],
    lessons: {
      'rag-ingestao-permissoes': lesson(
        'Mesmo uma checagem de ACL na leitura pode usar uma réplica mais antiga do que a revisão do texto que ela deveria proteger.',
        'Vincule o novo documento a uma fronteira de autorização', 0,
        'Considere a ordem revogar, editar, consultar. Na gravação da nova revisão, obtenha do autorizador um token de consistência causal que cubra a revogação e armazene esse token com o conteúdo. Para entregar uma passagem da revisão, peça uma checagem que respeite essa fronteira e os requisitos de frescor atuais. Um token opaco deve ser interpretado pelo serviço emissor. Timestamp de máquina ou comparação lexical entre tokens não implementam essa garantia.',
        'Pause a propagação de ACL numa região enquanto o texto novo já está pesquisável. A métrica decisiva é quantas respostas receberam conteúdo que a decisão suficientemente recente teria bloqueado. Se o serviço não consegue alcançar a fronteira no prazo, omita o trecho de toda a resposta, incluindo as citações.',
        'Lia perdeu o acesso na revisão de ACL 51. O texto v8 foi gravado depois, com fronteira 51. A réplica local só aceita checagens até 50 e permitiria a leitura. Uma réplica remota já alcançou 53. O que o servidor de RAG deve fazer?',
        'Solicite na réplica remota uma decisão válida para a fronteira exigida ou aguarde a local até o deadline. Na ausência de autorização, remova v8 antes da geração. O ensaio deve observar zero bytes de v8 no contexto de Lia. Em produção, as revisões numéricas do exercício podem ser tokens opacos.'
      ),
      'rag-busca-hibrida': lesson(
        'Fusão de rankings pode colocar no topo um texto parecido que viola uma restrição explícita como versão, exclusão ou ambiente.',
        'Conserve a restrição quando a consulta for reescrita', 1,
        'Extraia entidades e operadores para um vocabulário controlado. Separe restrições obrigatórias de preferências destinadas à pontuação. Valide nomes e relações no catálogo e preserve a consulta original em uma rota lexical paralela. Quando duas interpretações incompatíveis alterarem o conjunto legal de respostas, peça esclarecimento. A fusão ocorre apenas entre resultados elegíveis em cada rota. Um texto sobre uma versão incompatível pode ter excelente similaridade sem servir à tarefa.',
        'Além da cobertura de candidatos, tabule violações por tipo de restrição, consultas ambíguas e perda de evidências corretas por filtros estritos. Execute um replay fixando o índice e alterando somente a interpretação. Em caso de regressão, desligue a reescrita afetada sem ampliar o escopo autorizado.',
        'Para “migrar o cliente v2 sem reiniciar”, o catálogo tem A sobre v2 com reinício, B sobre v3 sem reinício e C sobre v2 sem reinício. A, B e C obtêm RRF 0,029, 0,025 e 0,021. Os metadados dos três foram verificados. Quem segue ao reranker?',
        'A viola a restrição de operação e B a de versão. Apenas C segue. O exercício deve continuar passando quando uma expansão lexical elevar A novamente. Se nenhum documento satisfizer as restrições, responda que falta evidência para essa combinação.'
      ),
      'rag-reranking': lesson(
        'O log do ranking anterior contém cliques apenas nas passagens que chegaram a ser exibidas.',
        'Estime o efeito de trocar o primeiro resultado', 2,
        'Para candidatos autorizados e seguros, reserve uma fração de exploração e grave consulta, candidatos, posição escolhida, probabilidade de exposição e desfecho. Para uma política determinística de primeiro lugar, o estimador IPS soma clique × indicador de que a escolha coincide com a nova política / probabilidade registrada, dividido pelo total de impressões. Ele pressupõe recompensa comparável e probabilidade positiva para toda ação proposta. Se a presença dos demais resultados também muda a recompensa, trate a lista como ação ou restrinja o ensaio a uma posição.',
        'Verifique a cobertura de ações e a concentração dos pesos. Um pequeno conjunto de decisões quase nunca exibidas pode dominar a estimativa. Compare por consulta com intervalo de confiança agrupado por usuário antes de avançar a A/B. Clique é um sinal de abertura da fonte, que exige validação separada de suporte à resposta.',
        'Em 1.000 impressões independentes de um mesmo contexto, A apareceu no topo com probabilidade 0,2, recebeu 30 cliques ao todo, e o restante da página ficou fixo. Qual a estimativa IPS para sempre exibir A? E para um terceiro candidato C que nunca foi elegível?',
        'Para A, 30 ÷ 0,2 ÷ 1.000 = 0,15 clique por impressão. As observações de outras escolhas têm contribuição zero. A política de C não tem suporte nesses logs. Inclua C em exploração elegível antes de tentar estimar seu efeito. A estimativa pontual de A ainda requer incerteza e validação online.'
      ),
      'rag-citacoes': lesson(
        'Várias citações válidas podem ser cópias do mesmo comunicado e dar uma falsa impressão de corroboração.',
        'Reconstrua a origem antes de contar evidências', 3,
        'Conserve no índice o ID do original, revisões, relação de encaminhamento e a passagem que sustenta a alegação. Colapse cópias conhecidas pela linhagem e trate similaridade textual como indício a revisar. Depois avalie implicação, autoridade e data por raiz independente. Uma cópia da mesma mensagem em outro canal não resolve uma divergência entre o comunicado inicial e o registro oficial mais recente.',
        'Mantenha consultas sentinela com cópias, fontes independentes e correções. Conte raízes que sustentam a afirmação e quantas a contradizem. Quando a política exigir dupla confirmação e só houver uma origem, retire a conclusão ou atribua-a explicitamente a essa única fonte.',
        'A afirmação “a migração terminou” cita uma mensagem original, dois encaminhamentos dela e uma ata independente que diz “aguardando validação”. Quantas origens independentes confirmam o término? A política exige duas.',
        'Uma origem confirma e outra registra uma pendência. Os dois encaminhamentos acrescentam zero confirmações independentes. Informe a divergência com as duas fontes e evite declarar a migração concluída. Acrescentar novas cópias não pode mudar o resultado do teste.'
      ),
      'rag-indice-hnsw': lesson(
        'O orçamento de RSS não revela a cauda de latência quando visitas ao grafo ou às listas passam a depender de SSD.',
        'Decida quando o grafo deve sair da RAM', 4,
        'Num HNSW em memória, aumentar efSearch amplia a fronteira visitada. Se páginas frias passam a exigir leituras aleatórias de SSD, a mesma configuração muda de regime. Compare com um índice organizado para I/O em blocos, que seleciona regiões e lê candidatos agrupados. Meça acessos físicos após cache e amplificação em bytes por consulta. Aumentar o paralelismo das leituras pode encurtar uma consulta isolada e ao mesmo tempo piorar a fila do dispositivo sob concorrência.',
        'Reproduza a distribuição real de filtros com cache quente e após reinício de uma réplica. Observe recall contra busca exata, p99, leituras/s, profundidade da fila e interferência de compactação. Preserve uma rota em RAM enquanto um shard frio não cumprir simultaneamente prazo e recall.',
        'Um SSD sustenta 40.000 leituras aleatórias/s sob o p99 especificado. Reserve 25% para manutenção. Na carga de 2.000 consultas/s por dispositivo, o caminho frio faz 18 leituras físicas/consulta e o aquecido faz 9. Qual estado passa no orçamento?',
        'Sobram 30.000 leituras/s, ou 15 por consulta em média. Frio exige 36.000/s e excede a reserva. Quente exige 18.000/s. O estado quente cabe nessa conta de vazão, mas ainda é preciso medir p99 e recall. Pré-aqueça antes de receber tráfego pleno ou admita uma fração menor na retomada.'
      ),
      'rag-quantizacao-vetorial': lesson(
        'Um kernel inteiro pode produzir escores inválidos mesmo que a tabela de quantização reconstrua valores próximos.',
        'Valide escala, saturação e largura do acumulador', 4,
        'Em SQ simétrica, aproxime cada coordenada por escala × código inteiro. Com uma escala por vetor, o produto interno real aproximado é a soma dos produtos dos códigos multiplicada pelas escalas de consulta e candidato. Se as escalas variam entre candidatos, ordenar os inteiros brutos muda o ranking. Com zero-points diferentes de zero é necessário subtraí-los em ambos os operandos. Dimensione o acumulador para a pior soma antes de escolher as instruções SIMD.',
        'Compare o kernel do hardware alvo com uma implementação de referência que desquantiza cada coordenada e acumula em maior precisão. Inclua vetores saturados, norma alta e empates. Meça inversões no top-k e saturação por segmento, além de throughput. Desative o kernel se ele divergir da própria semântica quantizada antes de avaliar perdas do SQ.',
        'Use SQ simétrica de 768 dimensões com códigos entre −127 e 127. Qual o máximo absoluto do produto interno inteiro? A tem soma 1.100 e escala 0,01, B tem soma 900 e escala 0,02. A consulta usa escala 0,1. Qual candidato vence?',
        'O limite é 768 × 127² = 12.387.072. Um acumulador assinado de 16 bits transborda, um de 32 bits comporta esse limite. Os escores são 1.100 × 0,01 × 0,1 = 1,1 e 900 × 0,02 × 0,1 = 1,8. B vence. Confirme também que somas parciais da instrução vetorial não saturam antes do acumulador final.'
      ),
      'rag-ivf-e-shards': lesson(
        'Elevar nprobe aumenta trabalho em todas as consultas. Vetores de fronteira podem precisar de uma segunda rota de recuperação.',
        'Escolha a segunda lista pelo erro que ela corrige', 5,
        'Para um vetor x atribuído ao centro c, o resíduo x − c explica o erro ao aproximar o escore q·x por q·c. Em busca por produto interno, o erro depende da direção q. Se os resíduos de duas atribuições estiverem muito alinhados, as mesmas consultas podem subestimar os dois centros. Uma estratégia inspirada no SOAR escolhe a segunda atribuição penalizando resíduos alinhados à primeira. Deduplicate por ID global antes de cortar o top-k.',
        'Compare uma ou duas atribuições com o mesmo orçamento de candidatos lidos e mantenha rastreio de misses simultâneos em consultas de fronteira. Orce postings extras, tempo de build, remoções em ambas as listas e duplicação de leituras. Se o custo extra superar o ganho por segmento, reverta o índice por geração.',
        'Em 10.000 pares consulta/vizinho exato, a rota primária perde 500. A rota secundária X recupera 300 desses 500 e Y recupera 420, com o mesmo orçamento de leitura e sem deslocar acertos primários. Qual deve entrar no teste seguinte?',
        'Com X há 200 perdas residuais, cobertura de 98%. Com Y restam 80, cobertura de 99,2%. Y corrige mais erros da primeira rota. Essa é cobertura dos pares sentinela. Valide ainda o top-k depois de deduplicar, o custo de atualização e o p99 no corpus inteiro.'
      )
    }
  },
  {
    moduleTitle: 'Evals & observabilidade',
    baseline: 'As aulas incluem partição por conversa, comparação pareada, viés de posição do juiz, caminho crítico, head e tail sampling, orçamento de erro e canário. O aprofundamento trata de quem realmente aparece nos denominadores usados para decidir.',
    gaps: [
      'Corrigir sobre-amostragem de casos difíceis e explicitar o período em que o rótulo pode amadurecer.',
      'Escolher um limiar de julgamento pela prevalência e pela capacidade de revisão humana.',
      'Reconstruir vínculos entre requisições assíncronas e trabalho compartilhado sem multiplicar o tempo de GPU.',
      'Validar a randomização e o funil de telemetria antes de interpretar o ganho de um canário.'
    ],
    cases: [
      {
        org: 'DoorDash', title: 'AutoEval e relevância da página de busca', url: 'https://careersatdoordash.com/blog/doordash-llms-to-evaluate-search-result-pages/',
        observed: 'A DoorDash descreve o uso de avaliadores humanos e LLMs no AutoEval para acompanhar a relevância de páginas de busca. A equipe mantém um circuito de anotação e alinhamento humano para usar a métrica nas iterações do produto.',
        mechanism: 'O produto é avaliado sobre consultas e páginas observadas. Uma métrica de relevância da página alimenta decisões de busca e a revisão humana permite inspecionar erros do avaliador automático.',
        limits: 'Os pesos de população, atrasos de rótulo e matrizes de confusão dos exercícios são aplicações estatísticas à avaliação de uma assistente. O artigo não atribui esses números à DoorDash.'
      },
      {
        org: 'Slack', title: 'Traces relacionados no caminho de notificações', url: 'https://slack.engineering/tracing-notifications/',
        observed: 'Uma mensagem no Slack pode disparar muitas notificações. A equipe criou um trace independente para cada notificação, identificada por notification_id, e usou span links para conectá-la ao trace de quem enviou a mensagem. O caminho passa por fila, serviço de push e clientes.',
        mechanism: 'As execuções conservam identidades e ciclos de vida próprios. Uma relação causal explícita permite atravessar a fronteira entre os traces mesmo quando uma única relação pai-filho não expressa o fluxo completo.',
        limits: 'O Slack descreve uma origem com vários destinos. No exercício as relações convergem na direção inversa, de várias conversas para um único lote de GPU.'
      },
      {
        org: 'Microsoft', title: 'O desvio de amostragem no carrossel do MSN', url: 'https://www.microsoft.com/en-us/research/articles/diagnosing-sample-ratio-mismatch-in-a-b-testing/',
        observed: 'Em um teste do carrossel de imagens do MSN, a análise perdeu usuários muito engajados. A plataforma detectou desvio entre a proporção observada dos grupos e a planejada. A conclusão sobre o efeito se inverteu quando a equipe corrigiu a causa.',
        mechanism: 'Uma checagem de sample ratio mismatch (SRM) sinaliza que a população analisada difere da alocação esperada. Investigar desde a atribuição até a filtragem localiza onde grupos passaram a ter chances distintas de aparecer.',
        limits: 'A ausência de SRM não prova equivalência das coortes em todas as dimensões. Os volumes e o teste numérico da aula são exemplos para um canário de modelos.'
      }
    ],
    lessons: {
      'evals-golden-set': lesson(
        'Um conjunto equilibrado ajuda a investigar falhas raras, mas sua média simples pode inverter a decisão para o tráfego real.',
        'Pondere estratos e espere o rótulo amadurecer', 0,
        'Defina a unidade de inferência antes de amostrar, por exemplo uma conversa elegível encerrada. Separe a mistura fixa para detectar regressões da projeção de impacto, que pondera a taxa por estrato pela participação do estrato na população-alvo. Se a referência for reabertura em sete dias, congele a coorte com tempo completo para observação. Misturar casos recentes ainda sem rótulo com sucessos mascara falhas tardias.',
        'Publique a taxa por estrato, o tamanho efetivo da amostra e a diferença ponderada com intervalo agrupado por unidade de randomização. Exija cobertura das classes críticas antes de comparar versões. Se o mix de tráfego mudar, recalcule os pesos e mantenha também a série de referência com mix congelado.',
        'O golden set tem 100 casos simples e 100 complexos, já maduros. O candidato ganha 2 pontos percentuais nos simples e perde 8 nos complexos. No tráfego, os simples representam 90%. Qual é o impacto estimado? As conversas de ontem já servem para rotular reabertura em sete dias?',
        'A média do golden set dá (2 − 8)/2 = −3 pontos percentuais. No mix de tráfego a estimativa é 0,9 × 2 + 0,1 × (−8) = +1 ponto percentual. Mostre também a perda de 8 pontos nos complexos e a incerteza antes de decidir o rollout. As conversas de ontem ainda estão censuradas para essa janela.'
      ),
      'evals-juiz': lesson(
        'Mesmo um juiz estável na calibração pode inundar a revisão humana com falsos alarmes quando o defeito é raro em produção.',
        'Dimensione a fila humana pela prevalência do defeito', 0,
        'Defina um resultado positivo como “juiz sinaliza defeito” e mantenha sensibilidade e especificidade por classe. A precisão entre sinalizados depende da frequência do defeito no tráfego. Estime-a com revisão humana aleatória que inclua respostas aprovadas pelo juiz, além de revisar alertas. Escolha limiares por custo de perder um defeito, capacidade da fila e prazo para corrigir. Um caso sem rótulo não pode ser contado como falso alarme.',
        'Acompanhe detecções verdadeiras por hora de revisão, falsos negativos nas aprovações auditadas e idade da fila. Se houver deriva, intensifique a auditoria dos segmentos afetados e recalibre contra pessoas antes de promover a nova régua.',
        'A cada dia há 10.000 respostas, 1% contém defeito. O juiz detecta 90% dos defeitos e sinaliza 5% das respostas corretas. A equipe consegue revisar 200 alertas/dia. Qual é a precisão esperada e o crescimento da fila?',
        'São 90 defeitos detectados, 10 perdidos e 495 falsos alarmes entre 9.900 respostas corretas. A precisão é 90/585 ≈ 15,4%. Com 585 alertas/dia, a fila cresce 385/dia. Reavalie o limiar ou estratifique a triagem, mantendo uma amostra aleatória dos aprovados para enxergar os defeitos perdidos.'
      ),
      'evals-tracing': lesson(
        'Quando um worker reúne requisições independentes em um único lote, escolher uma delas como pai esconde as demais e replicar o span infla o custo físico.',
        'Reconstrua a causalidade de um lote assíncrono', 1,
        'Propague no item da fila o contexto do span produtor e um ID de tentativa. Ao fechar um lote, registre o manifesto dos itens admitidos e abra um span para a execução compartilhada. Use span links para apontar para os produtores de cada tentativa. Uma nova tentativa mantém o ID lógico do pedido e recebe outra identidade de execução. Assim é possível deduplicar pedidos ao contar requisições afetadas e ainda contabilizar cada execução física. Proximidade entre timestamps não comprova que dois eventos pertencem ao mesmo lote.',
        'Compare IDs no manifesto com vínculos exportados e com confirmações de saída. Uma ligação ausente deixa evidência incompleta, ainda que o pedido tenha terminado. Calcule espera individual a partir da entrada de cada item, duração do lote uma vez por dispositivo e TTFT no cliente. Para medir tempo efetivo de GPU, instrumente os eventos do dispositivo. Um span no host pode incluir espera pela fila de kernels.',
        'No mesmo relógio, A, B e C entram na fila em 0, 10 e 20 ms, no instante em que os clientes enviam seus pedidos. O manifesto do lote K contém os três IDs, mas o coletor mostra links só para A e B. Em uma GPU, sem outro trabalho, o kernel executa de 30 a 50 ms. O primeiro token chega a cada cliente em 55 ms. O que está faltando e quais durações vão aos painéis?',
        'O manifesto aponta um vínculo ausente para C, portanto há 2/3 dos vínculos esperados. Localize a perda entre admissão, instrumentação e exportação antes de atribuí-la ao worker. As esperas até o início do kernel foram 30, 20 e 10 ms. Os TTFTs foram 55, 45 e 35 ms. O lote consumiu 20 GPU·ms no dispositivo. Atribuir 20 GPU·ms a cada pedido e somar daria 60 GPU·ms para uma única execução de 20 ms.'
      ),
      'evals-slo': lesson(
        'Uma regressão que elimina o evento de medição pode fazer o canário parecer melhor justamente ao esconder falhas.',
        'Investigue o desbalanceamento antes de interpretar o canário', 2,
        'Registre a atribuição antes de iniciar o trabalho e use o identificador da unidade randomizada, uma vez por unidade. Compare a divisão prevista com a observada na atribuição, no início da execução e na exportação do resultado. Um teste qui-quadrado de aderência com expectativa predefinida detecta desbalanceamento de contagens independentes. Filtrar apenas conversas com resposta final pode remover seletivamente timeouts do candidato.',
        'Localize o primeiro ponto do funil em que surge o desvio e reconcilie faltantes contra o acesso original. Mantenha um indicador de indisponibilidade com denominador externo ao pipeline do modelo. Congele a promoção diante de SRM inexplicado, independentemente de o gráfico de qualidade ter melhorado.',
        'Um canário 50/50 registra 5.000 usuários atribuídos em cada braço, porém só 4.500 resultados de controle e 4.000 do candidato chegam ao painel. Qual o qui-quadrado de aderência entre os resultados visíveis e qual etapa investigar?',
        'Entre 8.500 usuários visíveis seriam esperados 4.250 por braço. χ² = 2 × 250²/4.250 ≈ 29,41 com um grau de liberdade, sinal forte de desvio. A atribuição está equilibrada. Investigue as 500 perdas do controle e as 1.000 do candidato entre execução e telemetria, com atenção a timeouts. Só recalcule o efeito com um denominador válido.'
      )
    }
  }
];
