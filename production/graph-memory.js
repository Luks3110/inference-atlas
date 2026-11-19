// Os números dos exercícios são hipóteses de dimensionamento de cada cenário.
function steps(nodes, items) {
  return items.map(([active, label, title, body, idea, code]) => ({
    active, nodes, label, title, body, idea, ...(code ? { code } : {}),
  }));
}

const routingExample = `from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class Caso(TypedDict):
    entrega_confirmada: bool
    destino: str

def encaminhar(caso: Caso):
    return "responder" if caso["entrega_confirmada"] else "revisar"

grafo = StateGraph(Caso)
grafo.add_node("responder", lambda caso: {"destino": "resposta"})
grafo.add_node("revisar", lambda caso: {"destino": "fila humana"})
grafo.add_conditional_edges(START, encaminhar, ["responder", "revisar"])
grafo.add_edge("responder", END)
grafo.add_edge("revisar", END)
app = grafo.compile()
print(app.invoke({"entrega_confirmada": False, "destino": ""})["destino"])`;

const publicStreamExample = `async def texto_publico(grafo, entrada, config):
    async for parte in grafo.astream(
        entrada, config=config, stream_mode="messages", version="v2"
    ):
        if parte["type"] != "messages":
            continue
        mensagem, metadados = parte["data"]
        if metadados.get("langgraph_node") != "resposta_publica":
            continue
        for bloco in mensagem.content_blocks:
            if bloco.get("type") == "text" and bloco.get("text"):
                yield bloco["text"]`;

export const graphMemoryModules = [
  {
    title: 'LangChain & LangGraph',
    lessons: [
      {
        id: 'grafo-estado-explicito',
        title: 'Desenhar um grafo com estado explícito',
        level: 'Avançado', minutes: 12,
        summary: 'Modele um assistente de atendimento com caminhos verificáveis, trabalho em paralelo e limites para novas tentativas.',
        steps: steps(['Estado', 'Nós', 'Decisão'], [
          [0, 'Modelar', 'Qual informação atravessa cada etapa?', 'Um cliente diz que a entrega não chegou. Para consultar o pedido e a transportadora, cada passo precisa receber os dados certos. Guarde numa ficha do caso o número do pedido, a versão consultada, as provas, a decisão e quantas vezes a consulta já rodou. Use a conta conectada para determinar o que pode ser consultado. O LangGraph organiza os passos e o que cada um pode ler ou atualizar. O LangChain pode conectar esses passos ao modelo e às ferramentas.', 'IDs estáveis permitem reconstruir uma decisão mesmo quando o texto da conversa mudou.'],
          [1, 'Distribuir', 'Consulte pedido e transportadora em paralelo', 'Duas leituras independentes recebem o mesmo estado inicial. Cada nó devolve suas atualizações. Para campos compartilhados, defina como o reducer combina os resultados. Num mapa por fonte, use identificadores estáveis e resolva revisões conflitantes explicitamente. Uma lista concatenada pode duplicar a mesma evidência após reenvio.', 'Para resultados paralelos, teste a mesma combinação em ordens diferentes.'],
          [2, 'Encaminhar', 'Torne as transições auditáveis', 'Uma função de roteamento envia o caso à resposta se a evidência exigida estiver presente. Uma fonte indisponível admite uma segunda consulta dentro do prazo. Esgotado o prazo ou a cota de tentativas, envie à revisão humana com o motivo. A regra de autorização de reembolso continua no serviço de pedidos.', 'Um limite de etapas e um prazo total protegem recursos diferentes. Teste ambos.', routingExample],
          [2, 'Reproduzir', 'Reexecute o grafo com respostas gravadas', 'Registre a versão do grafo, os IDs das chamadas e o caminho percorrido. Em teste, substitua as dependências por respostas gravadas. Simule uma fonte lenta, campos ausentes e resultados conflitantes. Antes de publicar uma nova versão, retome também um estado antigo e confira sua migração.', 'Uma execução pode terminar com sucesso técnico e ainda assim ter seguido a rota errada.'],
        ]),
        source: { label: 'LangGraph · Graph API', url: 'https://docs.langchain.com/oss/python/langgraph/graph-api' },
        fieldwork: {
          caseStudy: { text: 'A equipe LangChain descreve o uso de LangGraph na plataforma de desenvolvedores da Uber para organizar agentes especializados em etapas de migração de código e geração de testes. O exemplo mostra uma aplicação concreta para decompor um trabalho verificável.', source: { label: 'LangChain · usos de LangGraph em produção', url: 'https://www.langchain.com/blog/is-langgraph-used-in-production' } },
          exercise: { prompt: 'Cenário: 2 milhões de usuários ativos por dia, 3 consultas por pessoa, pico de 6 vezes a média diária. Cada consulta dispara duas leituras. Em 5% das consultas, somente uma leitura é repetida uma vez. Qual carga sustentar nas dependências?', solution: '6 milhões de consultas/dia dão 69,4 consultas/s em média e cerca de 417/s no pico. Cada consulta gera 2,05 leituras em média. São cerca de 854 leituras/s agregadas no pico. Para dimensionar cada fonte, meça a distribuição das repetições e sua latência. Simule a falha correlacionada de uma fonte, que pode invalidar a hipótese de 5%.' },
        },
      },
      {
        id: 'streaming-grafo-interface',
        title: 'Streaming do grafo até a interface',
        level: 'Avançado', minutes: 14,
        summary: 'Converta eventos internos em um stream público que suporte clientes lentos e reconexões sem executar a geração duas vezes.',
        steps: steps(['Grafo', 'Relay SSE', 'Interface'], [
          [0, 'Selecionar', 'Publique apenas a resposta visível', 'No LangGraph Python 1.1 ou superior, o formato v2 entrega partes com tipo e dados. Em messages, cada parte traz um fragmento e metadados. Selecione o nó público da resposta e extraia seus blocos de texto. Converta os estados de ferramentas em eventos de progresso com campos permitidos pela aplicação.', 'Mensagens internas e dados de ferramentas podem circular no mesmo grafo. O adaptador controla a projeção pública.', publicStreamExample],
          [1, 'Registrar', 'Dê identidade a cada evento público', 'O worker grava eventos em ordem por execução antes de transmiti-los. O contrato da aplicação tem versão, run_id, sequência e tipo. Diferencie texto incremental, progresso substituível e estados terminais. Ao repetir uma escrita do produtor, reutilize a identidade do evento para conter duplicações na origem.', 'Um checkpoint descreve o estado do grafo. A retomada da tela também exige conservar os deltas entregues ou uma fotografia da resposta.', 'id: 42\nevent: text.delta\ndata: {"v":1,"run_id":"r7","seq":42,"text":"Entregue"}\n\n'],
          [1, 'Limitar', 'Isole o navegador lento do worker', 'Separe a geração da conexão HTTP. O relay lê o log por cursor e aguarda a drenagem da escrita. Agrupe fragmentos de texto contíguos preservando sua ordem. Limite bytes por conexão e tempo de atraso. Se o consumidor ficar muito atrás, encerre essa conexão e permita retomar do log. Cancelar a geração requer uma ação explícita do cliente.', 'Meça tempo até o primeiro texto pintado, atraso do consumidor e bytes pendentes por conexão. Um flush do servidor pode ficar retido no proxy.'],
          [2, 'Retomar', 'Reconstrua a tela pelo último evento aplicado', 'Com EventSource, o campo id permite ao navegador enviar Last-Event-ID na reconexão automática. Depois de recarregar a página, a aplicação recupera seu cursor persistido e o envia ao serviço. Autorize o acesso ao run e leia após a sequência. A UI descarta duplicatas e solicita sincronização ao detectar lacuna. Se o cursor expirou, carregue uma fotografia com a sequência correspondente antes de continuar.', 'Ao receber o evento terminal, feche o EventSource. Teste desconexão antes e depois de persistir o último texto exibido.'],
        ]),
        source: { label: 'LangGraph · modos de streaming e formato v2', url: 'https://docs.langchain.com/oss/python/langgraph/streaming' },
        fieldwork: {
          caseStudy: { text: 'No exemplo de retomada do AI SDK da Vercel, o chat conserva o ID do stream ativo e usa Redis para disponibilizar o fluxo após uma recarga. Há uma rota para iniciar e outra para retomar. O guia também descreve a incompatibilidade entre o mecanismo de retomada do exemplo e um abort associado ao fechamento da página.', source: { label: 'Vercel AI SDK · retomada de streams', url: 'https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams' } },
          exercise: { prompt: 'Com 1 milhão de usuários ativos por dia, um teste reproduz 12 mil conexões simultâneas. Cada uma produz 20 deltas/s de 120 bytes. Qual a vazão bruta e quanto espaço usar para 90 s de replay em carga constante? Como validar a reconexão?', solution: '12.000 × 20 × 120 = 28,8 MB/s e 2,592 GB em 90 s, em unidades decimais. Some cabeçalhos, índices, replicação e picos ao medir o backend. Desconecte um cliente após o evento 42, retome e compare o texto final com o resultado persistido. Repita com evento duplicado e cursor vencido. Verifique que houve uma única geração.' },
        },
      },
      {
        id: 'checkpoints-e-efeitos',
        title: 'Retomar workflows sem repetir efeitos',
        level: 'Avançado', minutes: 13,
        summary: 'Investigue a queda de um worker entre a confirmação de um reembolso e a gravação do checkpoint.',
        steps: steps(['Checkpoint', 'Outbox', 'Provedor'], [
          [0, 'Persistir', 'Identifique a fronteira de recuperação', 'Compile o grafo com checkpointer persistente e associe cada execução à thread autorizada. O LangGraph grava checkpoints nas fronteiras de superetapas e pode recuperar escritas já concluídas de nós irmãos. Uma chamada externa pode ter terminado antes de o nó registrar o retorno. Essa diferença é onde nasce um efeito duplicado.', 'Derrube o worker depois de o serviço externo responder e antes da persistência local. Essa janela é o teste decisivo.'],
          [0, 'Aprovar', 'Capture a decisão antes de executar', 'Um nó prepara a proposta com ID, valor e versão. Outro chama interrupt para colher aprovação. Na retomada com Command(resume=...) e o mesmo thread_id, o código do nó interrompido roda desde o começo. Valide a identidade de quem aprovou e confira se a proposta ainda tem a mesma versão e valor.', 'Mantenha o trecho anterior à interrupção livre de efeitos que seriam repetidos ao retomar.'],
          [1, 'Registrar', 'Use uma intenção durável por ação de negócio', 'No banco da aplicação, grave a aprovação e uma linha de outbox na mesma transação. Uma restrição única sobre tenant e ID da operação torna o reenvio reconhecível. Guarde o hash do payload para rejeitar a reutilização da chave com parâmetros diferentes. Um worker entrega a intenção com a mesma chave em todas as tentativas.', 'Gerar uma chave nova a cada execução do nó torna duas tentativas indistinguíveis de duas compras.'],
          [2, 'Conciliar', 'Consulte o efeito quando a confirmação se perde', 'Um timeout deixa o resultado desconhecido. Se o provedor registra a chave e ela segue válida, repita conforme seu contrato. Caso contrário, consulte o recibo ou a referência de negócio. Registre o resultado confirmado antes de avançar o fluxo. Se o provedor não permite confirmar, retenha a operação para conciliação.', 'Outbox garante que a intenção sobreviva à queda. O destino precisa deduplicar a entrega ou permitir verificar o efeito.'],
        ]),
        source: { label: 'LangGraph · interrupção e retomada de nós', url: 'https://docs.langchain.com/oss/python/langgraph/interrupts' },
        fieldwork: {
          caseStudy: { text: 'Na API v1 da Stripe, uma chave identifica tentativas da mesma operação. Após o início da execução, a resposta é registrada inclusive quando o status é 500. As chaves podem ser removidas depois de pelo menos 24 horas. Isso limita quanto tempo o cliente pode usar a chave como proteção durante um replay.', source: { label: 'Stripe · idempotência nas versões da API', url: 'https://docs.stripe.com/api/idempotent_requests' } },
          exercise: { prompt: 'Num cenário de 4 milhões de ações diárias, 0,02% perdem a confirmação após a escrita externa. O job de recuperação pode rodar 48 h depois e o fornecedor só garante deduplicação por 24 h. Como dimensionar e aceitar a recuperação?', solution: 'Até 800 confirmações por dia entram na fila sob essa hipótese. Preserve a intenção, a chave, o valor e a referência externa por todo o horizonte de recuperação. Após as 24 h, consulte o destino antes de qualquer repetição. Injete a falha nas duas janelas e aceite somente se cada aprovação terminar com um único recibo conciliado ou uma pendência explícita.' },
        },
      },
    ],
  },
  {
    title: 'Memória & contexto',
    lessons: [
      {
        id: 'memoria-por-conversa',
        title: 'Memória por thread e por usuário',
        level: 'Avançado', minutes: 12,
        summary: 'Separe a conversa em curso das preferências reutilizáveis e resolva duas mensagens simultâneas na mesma thread.',
        steps: steps(['Thread', 'Fila por chave', 'Store'], [
          [0, 'Separar', 'Defina quem pode lembrar de quê', 'Você pede que o chat responda em português. A preferência pode valer quando abrir outra conversa, se você confirmar que quer guardá-la. O histórico desta conversa continua num registro separado. Anote de quem é cada dado, de onde veio e quem pode mudá-lo. Dê números distintos à pessoa, à conversa e a cada execução.', 'Uma solicitação válida na conversa atual pode estar obsoleta ou ter outro significado na próxima.'],
          [0, 'Isolar', 'Derive o namespace da identidade autenticada', 'No backend, resolva o tenant e o usuário a partir da sessão e valide a associação à thread. Para preferências privadas, derive o namespace do tenant, do usuário e do tipo de memória. Aplique essa autorização em leitura, busca vetorial, escrita e exportação. Inclua o escopo também nas chaves de cache.', 'Teste dois tenants com o mesmo nome de usuário e registros parecidos. Ambas as buscas devem devolver somente os registros autorizados.'],
          [1, 'Ordenar', 'Escolha uma política de concorrência por conversa', 'Uma pessoa envia uma correção enquanto a primeira resposta ainda é gerada. Uma fila particionada pela thread permite finalizar o turno anterior e aplicar a correção em ordem. Para comandos mutuamente exclusivos, recuse a segunda escrita com uma revisão esperada. Registre o ID da mensagem de entrada para deduplicar reentregas.', 'Limite a fila por thread e acompanhe a idade da mensagem mais antiga. Uma conversa muito ativa pode atrasar todas as outras se compartilhar a mesma fila de execução.'],
          [2, 'Consolidar', 'Resolva atualizações concorrentes da memória longa', 'Promova uma preferência confirmada com sua origem, revisão e data. Duas threads podem tentar alterá-la ao mesmo tempo. Use uma escrita condicionada à revisão lida e trate o conflito conforme a regra do produto. Releia o valor persistido para a próxima conversa e projete apenas as preferências aplicáveis ao pedido.', 'Ao testar uma disputa, registre qual atualização venceu e por quê. Uma fila por thread sozinha deixa esse conflito entre threads em aberto.'],
        ]),
        source: { label: 'LangGraph · persistência por thread e store', url: 'https://docs.langchain.com/oss/python/langgraph/persistence' },
        fieldwork: {
          caseStudy: { text: 'O LangSmith Agent Server documenta quatro estratégias para uma segunda mensagem na mesma thread, entre elas fila e rejeição. A fila é o padrão desse servidor. Ao usar somente o framework LangGraph de código aberto, a política de admissão e ordenação precisa ser implementada na aplicação.', source: { label: 'LangSmith Agent Server · double texting', url: 'https://docs.langchain.com/langsmith/double-texting' } },
          exercise: { prompt: 'Uma aplicação tem 2 milhões de usuários ativos por dia. No pico entram 300 mensagens/s e a execução ocupa em média 3 s. Uma thread de teste recebe 2 mensagens/s continuamente. Quantos runs ficam em serviço e o que acontece com essa thread se os turnos forem seriais?', solution: 'Em equilíbrio e considerando somente tempo em serviço, 300 × 3 = 900 runs ativos em média naquele pico. A thread suporta cerca de 0,33 turno/s e acumula 1,67 mensagem/s. Mais workers ajudam as demais threads, mas não removem a dependência de ordem desta. Aplique um limite de pendências e uma resposta explícita ao excedê-lo. Valide a ordem e a deduplicação com dois dispositivos do mesmo usuário.' },
        },
      },
      {
        id: 'orcamento-de-contexto',
        title: 'Montar um orçamento de contexto',
        level: 'Avançado', minutes: 12,
        summary: 'Monte um prompt com limites por fonte e comprima conversas preservando decisões, correções e pendências verificáveis.',
        steps: steps(['Orçamento', 'Síntese', 'Prompt'], [
          [0, 'Reservar', 'Conte o envelope que o modelo realmente recebe', 'Fixe a revisão do modelo, do tokenizador e do template de chat. Conte instruções, schemas de tools, formatação das mensagens e evidências. Reserve a saída máxima e uma margem para diferenças de serialização. Defina também um limite operacional de entrada a partir do TTFT e do custo aceitos pelo produto.', 'Um contexto pode caber na janela técnica e ainda exceder o tempo disponível para a primeira resposta.'],
          [1, 'Selecionar', 'Dê prioridade aos fatos necessários para esta ação', 'Mantenha a última pergunta e as correções recentes. Inclua o par chamada/resultado de ferramenta quando o formato do modelo o exige. Para anexos extensos, escolha trechos relevantes com identificadores de origem. Se uma evidência obrigatória não couber, peça uma pergunta mais específica ou divida a tarefa.', 'Remover uma mensagem de uma chamada de ferramenta pode tornar o restante do histórico inválido para o provedor.'],
          [1, 'Condensar', 'Faça o resumo sobreviver a uma retificação', 'Defina campos para decisões vigentes, restrições, perguntas abertas e IDs de origem. Marque explicitamente fatos substituídos. Grave até qual mensagem foi sintetizada e a revisão do resumo. Anexe os turnos posteriores sem duplicação. Antes de publicar uma síntese assíncrona, confira se a versão de origem continua válida.', 'Compare o resumo com casos em que o usuário muda uma data, revoga uma permissão ou cancela um pedido.'],
          [2, 'Avaliar', 'Escolha o orçamento pelo efeito na tarefa', 'Reconte o prompt final com o template real. Compare janelas de histórico e estratégias de síntese em conversas rotuladas, estratificadas por duração e idioma. Meça fatos preservados, decisões apoiadas pela fonte, uso de tokens e TTFT p95. Registre a versão do montador de contexto junto do resultado.', 'Promova uma redução de contexto quando a economia e a latência compensarem e as correções críticas continuarem sendo respeitadas.'],
        ]),
        source: { label: 'LangChain · memória de curto prazo e mensagens', url: 'https://docs.langchain.com/oss/python/langchain/short-term-memory' },
        fieldwork: {
          caseStudy: { text: 'A Anthropic descreve a compactação no Claude Code. O modelo resume decisões de arquitetura, pendências e detalhes de implementação e elimina saídas redundantes de ferramentas. A equipe recomenda usar traces de tarefas complexas para verificar se fatos importantes sobreviveram à compressão.', source: { label: 'Anthropic Engineering · context engineering', url: 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents' } },
          exercise: { prompt: 'Uma janela comporta 32.768 tokens. Reserve 4.096 para saída, 1.536 para instruções e template, 3.072 para tools e 1.024 de margem. As evidências usam 5.120 e o histórico usa 23.000. Quanto reduzir? Num milhão de turnos diários com esse perfil, quantos tokens de entrada deixa de processar?', solution: 'Sobram 23.040 para evidências e histórico, ou 17.920 para o histórico após as evidências. O excesso é 5.080 tokens por turno. Removê-lo de 1 milhão de prompts poupa 5,08 bilhões de tokens de entrada frente à tentativa original. O custo líquido depende também das chamadas que geraram os resumos, da reutilização de prefixo e da qualidade preservada.' },
        },
      },
      {
        id: 'retencao-e-esquecimento',
        title: 'Expiração e remoção de memórias',
        level: 'Avançado', minutes: 11,
        summary: 'Retire uma informação de circulação em checkpoints, índices, caches e resumos e confira se ela permanece removida após uma restauração.',
        steps: steps(['Registro', 'Derivados', 'Verificação'], [
          [0, 'Classificar', 'Atribua prazo e origem a cada classe', 'Separe o histórico necessário para retomar uma conversa, a preferência que persiste entre conversas e o log técnico. Associe dono, origem, prazo de retenção e IDs derivados. Defina se o prazo conta desde a escrita ou o último acesso. Atualizar a expiração a cada leitura pode prolongar indefinidamente a retenção de uma conta ativa.', 'A transcrição, o resumo e o vetor de busca exigem rastreamento quando contêm a mesma informação.'],
          [0, 'Revogar', 'Bloqueie a leitura antes da coleta física', 'No pedido de remoção, grave a revogação e sua versão em armazenamento durável. O caminho de leitura verifica validade e autorização mesmo se uma limpeza em lote estiver atrasada. Invalide caches e barre a criação de novos derivados de uma revisão revogada.', 'Defina dois objetivos mensuráveis, um para a informação deixar de ser retornada e outro para a remoção física terminar.'],
          [1, 'Propagar', 'Dê uma tarefa rastreável a cada destino', 'Use a origem para encontrar documentos, vetores, resumos e checkpoints afetados. Exclua ou reconstrua os derivados segundo a política. Filas de reprocessamento devem verificar a versão de revogação antes da escrita. Se o checkpoint ainda for necessário para retomar um fluxo, migre o estado ou encerre a thread seguindo a regra do produto.', 'Um índice pode devolver um candidato desatualizado durante a limpeza. Confira sua validade na fonte ao montar o contexto.'],
          [2, 'Verificar', 'Teste o esquecimento depois de restaurar um backup', 'Insira um marcador sintético e gere conversa, resumo e índice. Após a remoção, busque o marcador por ID e texto nos caminhos de leitura. Restaure uma cópia em ambiente de teste e reaplique as revogações antes de abri-la para consultas. Meça a idade do item vencido mais antigo e as tarefas de remoção que falharam.', 'A conclusão precisa de evidência por destino. Mantenha no recibo o estado da operação sem copiar o conteúdo removido.'],
        ]),
        source: { label: 'LangSmith · políticas de TTL para threads e store', url: 'https://docs.langchain.com/langsmith/configure-ttl' },
        fieldwork: {
          caseStudy: { text: 'O DynamoDB documenta que a exclusão automática por TTL é assíncrona e pode levar dias. Um item com prazo vencido pode continuar presente durante a coleta. A separação entre validade para leitura e remoção física evita que uma memória vencida reapareça enquanto o armazenamento é limpo.', source: { label: 'AWS DynamoDB · ciclo de vida de itens com TTL', url: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html' } },
          exercise: { prompt: 'Cenário de 2 milhões de usuários ativos por dia. Cada um gera 4 checkpoints de 8 KiB por dia, retidos por 7 dias. Depois de uma pausa na limpeza, 1,2 milhão de itens vencidos precisam ser apagados em 2 h enquanto novos itens continuam vencendo à taxa média. Qual a capacidade mínima?', solution: 'São 56 milhões de checkpoints e aproximadamente 427,25 GiB lógicos antes de índices e réplicas. A fila acumulada exige 1.200.000 / 7.200 ≈ 167 exclusões/s adicionais. A expiração normal acrescenta 8.000.000 / 86.400 ≈ 93/s. Planeje pelo menos 260 itens/s sustentados sob essas hipóteses e valide a interferência da limpeza na latência de leitura.' },
        },
      },
    ],
  },
];
