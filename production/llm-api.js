const reference = (label, url) => ({ label, url });

function sequence(nodes, entries) {
  return entries.map(([active, label, title, body, idea, code]) => ({
    active, nodes, label, title, body, idea, ...(code ? { code } : {}),
  }));
}

const templates = reference('Hugging Face · Chat templates', 'https://huggingface.co/docs/transformers/en/chat_templating');
const parallelInference = reference('Google · Efficiently Scaling Transformer Inference', 'https://arxiv.org/abs/2211.05102');

export const llmApiModules = [
  {
    title: 'Como LLMs funcionam',
    lessons: [
      {
        id: 'tokenizacao-em-producao', title: 'Quanto texto cabe em um prompt?', minutes: 11, level: 'Intermediário',
        summary: 'Conte a requisição que chega ao modelo e dimensione o impacto de uma troca de tokenizador por idioma.',
        steps: sequence(['Mensagem', 'Tokenizador', 'Admissão'], [
          [0, 'Formatar', 'O histórico também entra na conta', 'O modelo lê uma sequência de pedaços de texto, os tokens. Para cada mensagem, o servidor acrescenta marcas de quem fala. A pergunta "Onde está meu pedido?" pode chegar depois de centenas de mensagens, instruções e descrições de funções. Guarde um exemplo de cada tipo de pedido e anote a versão do formato de chat. Assim você consegue repetir a contagem depois de uma mudança.', 'Um contador que recebe apenas a última frase subestima as conversas longas.'],
          [1, 'Tokenizar', 'Um tokenizador define as fronteiras', 'Um tokenizador subword representa sequências frequentes por entradas do vocabulário. A mesma frase pode ocupar uma quantidade diferente de IDs quando o vocabulário muda. Meça texto em português, código, identificadores e mensagens curtas com o tokenizador da revisão que atende a rota.', 'Comprimento em caracteres serve como diagnóstico grosseiro. A admissão precisa de contagem compatível com o modelo.'],
          [1, 'Conferir', 'Compare o cliente com o servidor', 'Aplique o template diretamente aos turnos e conte os IDs resultantes. Se a aplicação formatar texto primeiro, adicionar BOS e EOS de novo pode duplicar tokens especiais. Em homologação, compare a contagem de uma amostra com usage.prompt_tokens do endpoint usando as mesmas ferramentas e o mesmo template.', 'Uma divergência de poucos tokens por turno pode crescer a cada volta da conversa.'],
          [2, 'Admitir', 'Reserve espaço para a saída', 'Em uma janela conjunta de 32.768 tokens, reservar até 2.048 para saída deixa 30.720 para a entrada formatada. Acima desse teto, reduza os trechos recuperados ou compacte turnos antigos e conte de novo. Registre cortes por idioma, rota e revisão de modelo.', 'O p99 de comprimento mostra quem fica de fora quando o tamanho médio ainda parece saudável.'],
        ]),
        source: templates,
        fieldwork: {
          caseStudy: { text: 'A Meta relata que o vocabulário de 128 mil tokens do Llama 3 inclui 28 mil tokens adicionais para melhorar o suporte a idiomas além do inglês. A equipe mediu maior compressão em sua amostra em inglês. Um serviço em português precisa medir o efeito no próprio tráfego.', source: reference('Meta · The Llama 3 Herd of Models, seção 3.2', 'https://arxiv.org/html/2407.21783#S3.SS2') },
          exercise: { prompt: 'Cenário hipotético. Um milhão de usuários enviam três chamadas por dia. Em replay pareado, o novo template/tokenizador usa em média 36 tokens a mais por chamada. Qual a variação diária e que verificação deve preceder a migração?', solution: '3.000.000 × 36 = 108 milhões de tokens extras de entrada por dia. Para estimar a despesa, multiplique 108 pelo preço efetivo por milhão de tokens de entrada, tratando hits de cache segundo o contrato do provedor. Refaça a admissão sobre os histogramas de entrada e saída por idioma e meça TTFT sob o pico previsto.' },
        },
      },
      {
        id: 'espacos-de-embeddings', title: 'Embeddings e compatibilidade do índice', minutes: 13, level: 'Intermediário',
        summary: 'Você vai trocar o encoder de uma busca em manuais. Comece pelos tokens de um trecho e confira se o novo índice ainda encontra a página certa.',
        steps: sequence(['Tokens', 'Encoder', 'Índice'], [
          [0, 'Representar', 'O ID busca uma linha na matriz aprendida', 'O ID do token aponta para uma linha da matriz de embeddings. O encoder lê essa linha e usa os tokens ao redor para calcular seu vetor em contexto. Assim, o mesmo token pode sair com vetores diferentes em "banco de praça" e "banco de dados".\n\nPara juntar os vetores do trecho, este ensaio usa a média. Acompanhe uma coordenada em que cinco tokens válidos valem 2 cada. As seis posições de padding valem zero. Dividir a soma 10 pelas onze posições dá cerca de 0,91. A máscara exclui as seis posições extras. A média dos cinco tokens continua 2.', 'O número do ID só indica qual linha ler na matriz. Aumente o padding no ensaio. O trecho continua com as mesmas palavras, por isso a média mascarada deve ficar no mesmo lugar.'],
          [1, 'Codificar', 'O objetivo de treino define o vetor de busca', 'Na ingestão, o encoder transforma cada trecho do manual em um vetor. Na busca, ele transforma a pergunta em outro. O treino aproxima perguntas dos trechos que as respondem. Se o modelo pede um prefixo para perguntas e outro para documentos, aplique o correto em cada caminho. Guarde com o índice a revisão do encoder, o pooling, a normalização e o limite de tokens usados na ingestão.', 'Dois encoders podem produzir 768 números e ainda ordenar os mesmos documentos de formas incompatíveis.'],
          [2, 'Indexar', 'Separe perda do encoder de perda do índice', 'Calcule vizinhos exatos sobre uma amostra e compare-os aos retornados pelo índice aproximado. Meça também se os itens julgados relevantes entram no top-k. Se o trecho certo aparece na busca exata e some na aproximada, examine o índice. Se já falta na lista exata, confira o encoder, a divisão dos trechos e os rótulos usados na avaliação.', 'Defina a métrica do índice conforme o treino. Para vetores unitários, produto interno e similaridade de cosseno induzem a mesma ordem.'],
          [2, 'Migrar', 'Crie uma geração de índice por espaço vetorial', 'Preencha o novo índice a partir de um snapshot com um cursor de mudanças. Reaplique atualizações e exclusões desde o cursor. Envie uma cópia da pergunta a cada índice e use o encoder daquela versão. Só a resposta do índice ativo chega ao usuário. Só altere o par encoder–índice depois de conferir cobertura, frescor e qualidade por segmento.', 'Mantenha a geração anterior atualizada durante a janela de rollback para que documentos removidos permaneçam removidos.'],
        ]),
        source: reference('Sentence Transformers · busca semântica', 'https://sbert.net/examples/sentence_transformer/applications/semantic-search/README.html'),
        fieldwork: {
          caseStudy: { text: 'No Sentence-BERT, Reimers e Gurevych modificaram o treino de BERT para produzir vetores de sentenças comparáveis por cosseno. Documentos podem ser codificados antecipadamente, o que desloca parte do custo de inferência do caminho de consulta para a ingestão.', source: reference('Reimers e Gurevych · Sentence-BERT', 'https://arxiv.org/abs/1908.10084') },
          exercise: { prompt: 'Cenário hipotético. Um catálogo tem 10 milhões de vetores de 768 dimensões em float32. Há 64 GB decimais para manter dois índices durante a troca. Quanto sobra para metadados, estruturas de busca e cópias?', solution: 'O payload de uma geração ocupa 10.000.000 × 768 × 4 = 30,72 GB. Duas ocupam 61,44 GB, deixando 2,56 GB. Meça o overhead real do índice e as réplicas antes do rollout. Se exceder a folga, faça a migração por partição ou provisionamento temporário.' },
        },
      },
      {
        id: 'economia-da-geracao', title: 'Autoregressão e capacidade de geração', minutes: 14, level: 'Avançado',
        summary: 'Traduza usuários, prompts e respostas em dois perfis de trabalho e um orçamento de latência.',
        steps: sequence(['Prefill', 'Decodificação', 'Capacidade'], [
          [0, 'Ler', 'O prefill prepara a primeira distribuição', 'Durante o prefill, o Transformer causal processa múltiplas posições da entrada em paralelo sob a máscara causal. A última posição produz logits para o próximo token. Amostragem, restrições de formato e marcadores de parada afetam a continuação que o produto recebe.', 'Separe espera em fila, tempo de prefill e entrega do primeiro token. Um TTFT alto pode nascer em qualquer um deles.'],
          [1, 'Gerar', 'Cada novo token muda a próxima distribuição', 'O motor escolhe um token, incorpora a escolha ao contexto e calcula a próxima distribuição. O cache de chaves e valores permite aproveitar estados anteriores. Sessões com saídas longas acumulam passos e ocupam espaço de cache por mais tempo. A temperatura altera a distribuição da amostragem.', 'Em baixa concorrência, a leitura dos pesos pode limitar o decode. Com lotes e contextos maiores, o gargalo pode mudar.'],
          [1, 'Cronometrar', 'Um token visível inicia outro relógio', 'Se o primeiro token chega em 350 ms e os 99 intervalos seguintes de uma saída de 100 tokens duram 25 ms cada, a saída termina em aproximadamente 2,825 s. Meça cada requisição completa antes de extrair o p95. Agrupe por tamanho de prompt e de saída e conte também os cancelamentos.', 'Somar o p95 de cada componente pode combinar requisições diferentes e produzir um falso SLO.'],
          [2, 'Dimensionar', 'Faça replay na mistura de produção', 'Multiplique requisições por segundo por tokens médios de entrada e de saída separadamente. Em um teste aberto, reproduza chegadas, rajadas e comprimentos preservando sua correlação. Aumente a taxa até encontrar o limite que ainda cumpre os SLOs de fila, TTFT e cadência entre tokens.', 'A capacidade útil é a taxa de respostas aceitas dentro do SLO. Uma vazão agregada alta pode coexistir com respostas lentas demais.'],
        ]),
        source: parallelInference,
        fieldwork: {
          caseStudy: { text: 'Pope e colegas estudaram o PaLM 540B em TPU v4. A equipe modelou o particionamento em função do comprimento da sequência, da escala e do objetivo de latência, e avaliou o processamento de entrada e a geração em configurações distintas. O método pede repetir as medições para a combinação de modelo e hardware escolhida.', source: parallelInference },
          exercise: { prompt: 'Cenário hipotético. Um milhão de usuários fazem quatro chamadas por dia. O pico vale 5× a média, com 800 tokens de entrada e 160 de saída por chamada. Uma réplica atende 25 chamadas/s desse mix dentro do SLO. Quantas réplicas sustentam o pico com uma indisponível?', solution: '4.000.000 / 86.400 ≈ 46,3 chamadas/s em média e 231,5/s no pico. Isso demanda cerca de 185,2 mil tokens de entrada/s e 37 mil de saída/s. Arredonde 231,5 / 25 para cima: dez réplicas saudáveis. Provisione onze para tolerar uma indisponível e confirme em teste com falha, incluindo redistribuição de tráfego e aquecimento.' },
        },
      },
      {
        id: 'regressoes-de-prompt', title: 'Diagnóstico de um prompt que quebrou', minutes: 11, level: 'Avançado',
        summary: 'Isole regressões por template, posição das evidências e revisão de modelo antes de liberar tráfego.',
        steps: sequence(['Reprodução', 'Experimento', 'Canário'], [
          [0, 'Capturar', 'Reconstrua a entrada que o modelo viu', 'Vincule cada falha ao hash do prompt, revisão do modelo, template de chat, parâmetros de geração, ferramentas e ordem das evidências. Guarde fixtures autorizadas ou anonimizadas para replay. Compare IDs e contagem final em vez de comparar só o texto que a interface mostrou.', 'Mudanças no empacotamento podem alterar o comportamento mesmo com pesos idênticos.'],
          [1, 'Isolar', 'Troque uma variável por execução', 'Reproduza uma falha com as versões anterior e nova do template usando os mesmos pesos. Depois fixe o template e troque os pesos se forem compatíveis. Inclua turnos vazios, histórico longo e mensagens multilíngues. Confira término por EOS, truncamento e instruções de geração.', 'O controle deve repetir a serialização da versão servida. Uma simulação manual do prompt pode remover o defeito.'],
          [1, 'Perturbar', 'Mova apenas a evidência decisiva', 'Use uma pergunta com resposta verificável. Desloque o parágrafo que contém a resposta para início, meio e fim de contextos do mesmo tamanho, mantendo os distratores. Registre acerto e citação por posição. Repita o teste quando mudar a estratégia de recorte ou compactação.', 'Uma janela anunciada de 32 mil tokens descreve um limite de entrada. A recuperação de um fato dentro dela é uma medida empírica.'],
          [2, 'Decidir', 'Proteja os segmentos que o agregado oculta', 'Defina o limite de regressão antes do canário e acompanhe os segmentos críticos separadamente. Em uma distribuição rara, aumente a amostra dirigida antes de concluir que houve melhora. Preserve a revisão anterior do prompt junto de todas as dependências necessárias para retornar a ela.', 'Registre pares em que a nova configuração acertou e a antiga errou, e o inverso. Esses casos ajudam a explicar a diferença.'],
        ]),
        source: templates,
        fieldwork: {
          caseStudy: { text: 'No estudo Lost in the Middle, Liu e colegas variaram a posição da informação em busca de pares chave–valor e perguntas sobre múltiplos documentos. Vários modelos avaliados perderam desempenho com a informação relevante no meio de contextos longos. A magnitude dependeu do modelo e da tarefa.', source: reference('Liu e colegas · Lost in the Middle', 'https://arxiv.org/abs/2307.03172') },
          exercise: { prompt: 'Cenário hipotético. Em 200 casos pareados de contexto longo, o candidato corrigiu seis erros da base e introduziu quinze. O limite do canário admite perda observada de até dois pontos percentuais nesse segmento. Qual é a decisão?', solution: 'O saldo é de −9 acertos em 200, uma queda observada de 4,5 pontos percentuais. Interrompa a promoção conforme o critério predefinido, examine os quinze casos introduzidos e compare a posição e o recorte da evidência. Essa conta mede o conjunto observado. Para estimar incerteza, use os pares discordantes.' },
        },
      },
    ],
  },
  {
    title: 'API de IA generativa & tools',
    lessons: [
      {
        id: 'contratos-de-saida', title: 'JSON com contrato de negócio', minutes: 13, level: 'Avançado',
        summary: 'Construa uma API de triagem com um schema versionado e uma política explícita para dados insuficientes.',
        steps: sequence(['Contrato', 'Decodificador', 'Validador'], [
          [0, 'Modelar', 'Represente o caso em que falta informação', 'Uma mensagem de suporte pode chegar vaga, como "Não deu certo". O programa que recebe a saída do modelo aceita três destinos: financeiro, entrega ou revisão. Use revisão quando faltarem dados para escolher. Registre os destinos aceitos num esquema de dados. Ao acrescentar um destino, atualize primeiro o programa que lê a resposta.', 'Um enum fechado sem saída para ambiguidade pode forçar uma categoria incorreta.'],
          [1, 'Restringir', 'Aplique o schema durante a geração', 'No endpoint de chat do vLLM, envie response_format do tipo json_schema. O trecho abaixo é o campo de formato do corpo da requisição. Dê ao modelo instruções sobre os limites de cada classe. Faça um teste de compatibilidade no modelo e backend usados em produção.', 'Um decodificador restrito filtra os próximos tokens pela linguagem permitida. Isso reduz o custo de reparo de JSON.', JSON.stringify({ response_format: { type: 'json_schema', json_schema: { name: 'triagem_v1', schema: { type: 'object', properties: { destino: { type: 'string', enum: ['financeiro', 'entrega', 'revisar'] } }, required: ['destino'], additionalProperties: false } } } }, null, 2)],
          [2, 'Validar', 'Valide a mensagem final e a decisão', 'Espere o término da geração para fazer parse do conteúdo inteiro. Trate corte por limite de saída e falha de transporte como estados próprios. Aplique o schema no consumidor e valide invariantes de negócio. Se a conta está encerrada e o fluxo só atende contas ativas, encaminhe o caso para revisão.', 'Um objeto bem formado ainda pode escolher o destino errado. Monitore validade estrutural e acerto por classe separadamente.'],
          [2, 'Liberar', 'Inclua a primeira chamada no teste de carga', 'Schemas variáveis podem adicionar compilação e pressionar o cache do backend. Meça uma distribuição com schemas frios e quentes e agrupe latência por versão. Um schema estável para cada tarefa facilita aquecer réplicas e reproduzir uma regressão sem recompilar estruturas por usuário.', 'Registre a versão do contrato e o motivo da rejeição. Isso separa regressões de modelo de mudanças no consumidor.'],
        ]),
        source: reference('vLLM · Structured Outputs e response_format', 'https://docs.vllm.ai/en/stable/features/structured_outputs/'),
        fieldwork: {
          caseStudy: { text: 'Os autores do XGrammar dividiram as verificações de tokens entre casos que podem ser pré-calculados e casos que dependem do estado da gramática. No motor descrito no artigo, parte desse trabalho pode se sobrepor à execução na GPU. A técnica acelera o cumprimento do formato solicitado.', source: reference('Dong e colegas · XGrammar, MLSys 2025', 'https://arxiv.org/abs/2411.15100') },
          exercise: { prompt: 'Cenário hipotético. Em 10.000 pedidos rotulados, 9.980 outputs satisfazem o schema. Entre esses, 120 têm destino incorreto. O SLO exige 99% do total válidos e corretos. Pode promover?', solution: 'Há 9.860 sucessos em 10.000 pedidos, ou 98,6%. A validade estrutural de 99,8% esconderia a violação. Inspecione as 20 falhas de formato e as 120 decisões incorretas em grupos diferentes, depois reavalie a versão candidata.' },
        },
      },
      {
        id: 'execucao-idempotente-de-tools', title: 'Ferramentas com efeitos idempotentes', minutes: 16, level: 'Avançado',
        summary: 'Siga uma solicitação de reagendamento desde os argumentos do modelo até o recibo de uma operação repetível.',
        steps: sequence(['Tool call', 'Executor', 'Operação'], [
          [0, 'Interpretar', 'A chamada proposta precisa chegar completa', 'O modelo pode emitir nome e argumentos em vários fragmentos. Agrupe os deltas por chamada dentro da resposta e aguarde o fechamento antes de interpretar JSON. No vLLM, a seleção automática requer configuração compatível entre modelo, template e parser de tools. Teste chamadas múltiplas e respostas sem ferramenta.', 'O identificador da tool call correlaciona a mensagem de retorno ao turno. Ele pode mudar quando o turno é gerado outra vez.'],
          [1, 'Autorizar', 'Resolva o escopo do lado do servidor', 'O executor compara o nome com o catálogo permitido para aquela rota, valida o schema e aplica autorização usando a sessão autenticada. Para reagendar, confirme o dono do agendamento, o fuso e a disponibilidade. Vincule a intenção aprovada a um identificador de operação antes de chamar o sistema de agenda.', 'Dois pedidos legítimos com os mesmos argumentos podem ser operações diferentes. A aplicação define quando uma intenção é nova.'],
          [1, 'Reservar', 'Deduplicate concorrência no ponto de escrita', 'Grave a intenção sob uma chave única de tenant e operação, junto do hash dos parâmetros. Uma tentativa com a mesma chave e hash recebe o recibo existente ou acompanha a operação pendente. Uma chave reutilizada com outro conteúdo gera conflito. Se o efeito ocorrer no mesmo banco, grave efeito e recibo numa transação.', 'Fazer SELECT antes de INSERT sem restrição única deixa duas tentativas simultâneas passarem.'],
          [2, 'Conciliar', 'Um timeout deixa o resultado em aberto', 'Para um efeito remoto, registre a intenção e um evento de outbox na mesma transação local. O worker repassa a mesma chave ao parceiro se ele suportar idempotência. Após timeout, concilie pelo identificador remoto ou chave dentro da janela de deduplicação. Se o parceiro não oferecer esse contrato e o estado for ambíguo, retenha a operação para verificação.', 'A outbox garante que há trabalho a entregar. O recibo remoto ou a reconciliação fecha a lacuna entre o efeito e o reconhecimento local.'],
          [2, 'Responder', 'Use o recibo para concluir a conversa', 'Persista o resultado e devolva ao modelo uma mensagem de ferramenta correlacionada à chamada original. A interface lê a confirmação do estado persistido. Mantenha código de erro, duração e tentativas por operação. A política de retenção deve cobrir o prazo máximo em que o cliente ou o worker poderá repetir a intenção.', 'Conte operações confirmadas e duplicatas suprimidas, além do número bruto de tool calls.'],
        ]),
        source: reference('vLLM · Tool Calling', 'https://docs.vllm.ai/en/stable/features/tool_calling/'),
        fieldwork: {
          caseStudy: { text: 'Na API v1 da Stripe, a chave de idempotência permite devolver o status e corpo da primeira execução, inclusive em certos erros 500. Reutilizar a chave com parâmetros diferentes gera erro. A documentação também descreve a retenção das chaves. Um cliente precisa conhecer essas regras antes de decidir se repete uma mutação.', source: reference('Stripe · Idempotent requests, API v1', 'https://docs.stripe.com/api/idempotent_requests') },
          exercise: { prompt: 'Cenário hipotético. Dois workers recebem a mesma intenção. Um consegue aplicar o reagendamento no parceiro, mas cai antes de gravar o recibo local. Ao voltar, a fila entrega a intenção novamente. Como distinguir execução concluída de nova solicitação?', solution: 'A restrição única recupera a mesma intenção e seu hash. Consulte o parceiro ou repita com a chave original ainda válida segundo o contrato dele. Persista o recibo retornado e entregue o mesmo resultado aos workers. Gerar outra chave após o timeout abriria espaço para um segundo efeito. Um resultado incerto que ultrapassou a retenção exige reconciliação antes de nova tentativa.' },
        },
      },
      {
        id: 'workflow-ou-agente', title: 'Quando usar um agente', minutes: 13, level: 'Avançado',
        summary: 'Compare um fluxo previsível de suporte com uma pesquisa aberta e estabeleça limites para a exploração.',
        steps: sequence(['Roteamento', 'Execução', 'Avaliação'], [
          [0, 'Delimitar', 'Comece pelo caminho que resolve o pedido', 'Consultar o prazo de um pedido tem dados, autorização e função conhecidos. Uma rota em código consulta o pedido e apresenta a resposta. Se a entrada for ambígua, uma chamada de classificação com opção de esclarecimento pode bastar. Um agente acrescenta valor quando as próximas evidências necessárias dependem do que foi descoberto.', 'Escreva critérios de conclusão verificáveis e estime o custo do caminho mais simples antes de permitir decisões dinâmicas.'],
          [1, 'Orquestrar', 'Deixe as dependências visíveis', 'Um workflow pode classificar um documento, extrair os campos e conferir o resultado em uma tabela. Paralelize somente ramos independentes. Um agente de pesquisa pode escolher outra fonte após ler a primeira. Retorne fatos e recibos compactos ao planejador e preserve documentos maiores fora do contexto com referências verificáveis.', 'Um grafo conhecido permite prever o número de chamadas. No agente, o orçamento precisa ser aplicado a cada iteração.'],
          [1, 'Encerrar', 'Cancele trabalho residual ao atingir o limite', 'Defina máximo de passos, tokens, custo e tempo por tarefa. Reserve orçamento central antes de disparar ramos concorrentes e libere a parte não usada quando terminarem. Se várias iterações devolvem a mesma evidência, interrompa e mostre ao usuário a lacuna. Registre o motivo do encerramento para medir loops sem progresso.', 'Um limite local por subagente pode multiplicar o teto total pelo número de ramos.'],
          [2, 'Comparar', 'Meça o custo incremental por resolução', 'Compare os dois caminhos sobre as mesmas tarefas, com correção verificada e acompanhamento de p95, custo e intervenção humana. Faça o recorte por tipo de pedido. Promova o agente onde o ganho adicional paga o custo e cabe no prazo do produto.', 'Conte resoluções verificadas, inclusive tarefas que atingiram o limite, para evitar selecionar só execuções que terminaram bem.'],
        ]),
        source: reference('Anthropic · Building effective agents', 'https://www.anthropic.com/research/building-effective-agents'),
        fieldwork: {
          caseStudy: { text: 'No recurso Research, a Anthropic descreve um agente líder que delega investigações paralelas e reúne os achados. A equipe relaciona essa escolha a perguntas de pesquisa com várias direções independentes e relata desafios de coordenação e custo. O desenho depende da possibilidade de decompor a tarefa.', source: reference('Anthropic · How we built our multi-agent research system', 'https://www.anthropic.com/research/multi-agent-research-system') },
          exercise: { prompt: 'Cenário hipotético. Um workflow resolve 900 de 1.000 casos a R$ 0,02 por tentativa. Um agente resolve 940 a R$ 0,08. Quanto custa cada resolução adicional e qual dado falta para decidir?', solution: 'O agente consome R$ 80 contra R$ 20 e resolve 40 casos a mais. Cada resolução adicional custa R$ 1,50. Compare com o valor de evitar o encaminhamento humano, a gravidade dos erros e o prazo da jornada. Se o ganho se concentrar em pesquisas abertas, teste rotear somente esse segmento para o agente.' },
        },
      },
      {
        id: 'contrato-de-api-em-lote', title: 'Reconciliação de chamadas em lote', minutes: 10, level: 'Avançado',
        summary: 'Classifique um catálogo inteiro preservando a identidade dos registros, inclusive quando a saída chega fora de ordem.',
        steps: sequence(['Manifesto', 'Job', 'Reconciliação'], [
          [0, 'Identificar', 'A unidade de repetição é o registro', 'Atribua um ID durável a cada combinação de entidade, revisão da entrada e tarefa. Guarde no manifesto o modelo, o prompt e o hash da entrada. Se uma entidade muda durante o job, a nova versão ganha outra identidade. Uma saída antiga só deve atualizar a revisão que a originou.', 'Um número de linha isolado perde sentido ao dividir arquivos ou reenviar uma partição.'],
          [1, 'Submeter', 'Divida lotes conforme prazo e quotas', 'Escolha partições com tamanho suficiente para amortizar o overhead e pequenas o bastante para reprocessar dentro do prazo. Valide formato e limites do provedor antes do upload. Guarde o ID de submissão e o manifesto juntos. Acompanhe o tempo do registro mais antigo que ainda espera resultado.', 'O throughput médio do dia pode esconder uma partição atrasada na publicação do catálogo.'],
          [2, 'Conciliar', 'Faça a junção pela chave da entrada', 'Separe registros válidos, erros definitivos, transitórios e ausentes. Compare o conjunto de IDs esperado com o conjunto terminal do job antes de reenviar. Faça upsert por ID e versão e imponha unicidade sobre resultados terminais. Se duas saídas concorrentes discordarem, marque conflito para inspeção.', 'Retomar apenas o conjunto pendente reduz custo e evita publicar a mesma classificação duas vezes.'],
        ]),
        source: reference('Amazon Bedrock · formato da entrada em lote', 'https://docs.aws.amazon.com/bedrock/latest/userguide/batch-inference-data.html'),
        fieldwork: {
          caseStudy: { text: 'O Amazon Bedrock aceita registros JSONL em S3 e documenta que a ordem dos resultados pode diferir da ordem de entrada. O campo recordId torna possível reencontrar cada solicitação após a inferência. O provedor também especifica limites por job e por arquivo.', source: reference('AWS · Format and upload your batch inference data', 'https://docs.aws.amazon.com/bedrock/latest/userguide/batch-inference-data.html') },
          exercise: { prompt: 'Cenário hipotético. De 1.000.000 de IDs, o job terminou com 991.000 sucessos distintos, 6.000 falhas transitórias e 2.000 falhas definitivas, sem sobreposição. Quantos IDs precisam de investigação e quantos entram no primeiro reenvio?', solution: 'Há 1.000 IDs ausentes e 6.000 falhas transitórias elegíveis para o primeiro reenvio. Investigue os ausentes no manifesto e nas saídas do job antes de repeti-los. Encaminhe as 2.000 falhas definitivas à correção de entrada. Preserve a versão dos 991.000 sucessos já publicados.' },
        },
      },
    ],
  },
];
