// Initial frames annotate the reading. The four lab frames use controlled fixtures with known answers.
function observation(change, metrics) {
  return { change, metrics };
}

function lab(nodes, frames) {
  return frames.map(({ active, label, title, body, idea, change, metrics, code, codeLanguage }) => ({
    nodes, active, label, title, body, idea, change, metrics, ...(code ? { code, codeLanguage } : {}),
  }));
}

export const ragEvalDrills = {
  'rag-ingestao-permissoes': {
    scenario: 'Uma política de viagem perde um parágrafo. O sistema que prepara os documentos para busca cai antes de publicar a alteração. Ao voltar, recebe as atualizações fora da ordem.',
    initial: [
      observation('As três passagens da política de viagem guardam o ID do documento e o número da revisão 7.', [['Documento', 'viagem'], ['Revisão', '7'], ['Passagens', '3']]),
      observation('O indexador só avança o cursor depois de publicar as duas passagens da revisão 8.', [['Revisão recebida', '8'], ['Passagens previstas', '2']]),
      observation('O indexador guarda a revisão da exclusão e retira da busca todas as passagens daquele documento.', [['Evento', 'exclusão'], ['Alvo', 'documento inteiro']]),
      observation('Antes de enviar um trecho ao modelo, a busca confere o cliente e a permissão de leitura. Sem uma regra que autorize o acesso, o trecho fica de fora.', [['Escopo', 'tenant + ACL'], ['Política ausente', 'negar']]),
    ],
    steps: lab(['Eventos', 'Manifesto', 'Leitura'], [
      {
        active: 0, label: 'Preparar', title: 'Fixe revisões e consultas sentinela',
        body: 'Use um tenant de teste. Publique viagem@7 com três trechos contendo HOTEL_7, TREM_7 e TAXI_7. A revisão 8 terá apenas HOTEL_8 e TREM_8. Liste os IDs visíveis por documento sem ranking e confira os três marcadores. Guarde a revisão publicada separadamente do cursor de ingestão.',
        idea: 'Uma consulta por inventário isola consistência de publicação dos erros de relevância da busca.',
        change: 'A revisão 7 fica completa e a revisão 8 fica preparada para ingestão.',
        metrics: [['Publicado', '7'], ['Visíveis', '3/3'], ['Cursor', '7']],
      },
      {
        active: 1, label: 'Interromper', title: 'Derrube o worker entre gravação e publicação',
        body: 'Grave apenas HOTEL_8 e interrompa o worker antes de gravar TREM_8. Consulte o inventário durante a interrupção. O manifesto deve continuar apontando para 7. Uma implementação que consulta todas as revisões retornaria quatro passagens e exporia uma edição parcial.',
        idea: 'Instale o ponto de falha depois de uma gravação persistida. Uma falha antes da primeira escrita deixa de exercitar o caso parcial.',
        change: 'Há um trecho novo na área de preparação e nenhum trecho novo pode aparecer na leitura.',
        metrics: [['Preparados v8', '1/2'], ['Visíveis v8', '0'], ['Visíveis v7', '3']],
      },
      {
        active: 1, label: 'Reentregar', title: 'Publique uma vez e descarte a revisão atrasada',
        body: 'Reentregue a revisão 8 duas vezes. Use a chave tenant/documento/revisão/posição no upsert. Valide os dois IDs e o hash do manifesto antes de trocar a revisão publicada por uma operação condicional. Em seguida entregue uma cópia atrasada do evento 7. O consumidor deve reconhecer o evento antigo sem retroceder o documento.',
        idea: 'Uma contagem correta não detecta dois trechos com conteúdo incorreto. Compare o conjunto de IDs e hashes esperados.',
        change: 'O ponteiro visível avança para 8 uma vez apesar das reentregas.',
        metrics: [['Publicado', '8'], ['IDs visíveis', '2'], ['Duplicados', '0']],
      },
      {
        active: 2, label: 'Reconciliar', title: 'Confirme a remoção mesmo após repetir uma escrita antiga',
        body: 'Envie uma exclusão na revisão 9 e depois reapresente o evento 8. Execute cem leituras com escopo autorizado, incluindo a consulta TAXI_7 e o acesso por ID. Exija zero passagens retornadas após a confirmação da exclusão. Confira o marcador de revisão 9 e acompanhe separadamente o prazo para eliminar as cópias físicas.',
        idea: 'O critério de leitura e a limpeza física precisam de evidências próprias. Uma contagem vazia na API comprova apenas o primeiro.',
        change: 'A revisão 9 impede que o replay de 8 republique conteúdo excluído.',
        metrics: [['Marcador', '9'], ['Leituras de teste', '100'], ['Retornos esperados', '0']],
      },
    ]),
  },
  'rag-busca-hibrida': {
    scenario: 'Uma busca pede trechos que só uma empresa pode ler. Se o filtro rodar depois de cortar a lista, os primeiros lugares podem estar todos ocupados por documentos de outras empresas. Vamos repetir a busca com as mesmas distâncias para isolar o efeito da ordem.',
    initial: [
      observation('O código E42 e o sintoma seguem para dois recuperadores.', [['Entradas', '1 pergunta'], ['Listas', '2']]),
      observation('BM25 classifica A em primeiro e B em quarto. O índice vetorial classifica B em segundo.', [['A lexical', '1º'], ['B lexical', '4º'], ['B vetorial', '2º']]),
      observation('A comparação com a busca exata usa o mesmo escopo de autorização.', [['Referência', 'top-K exato'], ['População', 'autorizada']]),
      observation('RRF com k = 60 combina as posições presentes nas listas.', [['A', '0,01639'], ['B', '0,03175'], ['Vencedor', 'B']]),
    ],
    steps: lab(['Corpus', 'Busca', 'Avaliação'], [
      {
        active: 0, label: 'Montar', title: 'Crie vizinhos que pertencem a tenants distintos',
        body: 'Crie um corpus SQLite em memória com cinco documentos e suas distâncias já calculadas para uma pergunta. Menor distância indica maior proximidade. Os documentos 4 e 5 são as duas evidências relevantes para o tenant B. O oráculo ordena somente os documentos autorizados e devolve os dois.',
        codeLanguage: 'sql', code: "CREATE TABLE corpus(id INTEGER PRIMARY KEY, tenant TEXT, distancia REAL);\nINSERT INTO corpus VALUES\n  (1,'A',0.01),(2,'A',0.02),(3,'A',0.03),\n  (4,'B',0.04),(5,'B',0.05);",
        idea: 'Distâncias predefinidas tornam o teste independente do modelo e de bibliotecas de ANN.',
        change: 'A relação de relevância e o escopo da pergunta ficam fixos.',
        metrics: [['Documentos totais', '5'], ['Autorizados', '2'], ['Relevantes em B', '2']],
      },
      {
        active: 1, label: 'Reproduzir', title: 'O corte global remove as duas passagens autorizadas',
        body: 'Rode a consulta a seguir. As três menores distâncias globais pertencem a A. Ao descartar os itens de A após o limite, a lista de B fica vazia. Um reranker perfeito ainda receberia zero candidatos. Observe a diferença entre isolamento de saída e recuperação dentro do tenant.',
        codeLanguage: 'sql', code: "WITH candidatos AS (\n  SELECT * FROM corpus ORDER BY distancia, id LIMIT 3\n)\nSELECT id FROM candidatos WHERE tenant='B';",
        idea: 'Uma resposta vazia causada pela ordem das operações pode parecer ausência de evidência no documento.',
        change: 'A busca global usa todas as vagas para documentos de outro tenant.',
        metrics: [['Janela global', '3'], ['Retidos para B', '0'], ['Recall@2', '0%']],
      },
      {
        active: 1, label: 'Filtrar', title: 'Aplique o escopo na formação dos candidatos',
        body: 'Rode o filtro dentro da consulta que ordena os vizinhos. No serviço, aplique a mesma identidade autorizada nos ramos vetorial e lexical antes da fusão e mantenha a checagem final de permissão. Se a engine usar um índice aproximado, meça o resultado com a implementação real e com filtros seletivos.',
        codeLanguage: 'sql', code: "SELECT id FROM corpus\nWHERE tenant='B'\nORDER BY distancia, id LIMIT 2;",
        idea: 'Um filtro SQL sobre distâncias fixas é um oráculo de correção. A configuração, o custo e o recall do ANN precisam ser avaliados separadamente.',
        change: 'Os documentos 4 e 5 reaparecem entre os candidatos autorizados.',
        metrics: [['IDs esperados', '4 e 5'], ['Recall@2', '100%'], ['De outro tenant', '0']],
      },
      {
        active: 2, label: 'Contrastar', title: 'Faça a regressão depender de autorização e recall',
        body: 'Acrescente dez documentos de A com distância 0,001 e repita os testes. O oráculo de B deve devolver os mesmos dois IDs. Faça também uma consulta com tenant C, sem documentos. Exija zero hits nesse caso, sem ampliar o escopo automaticamente. Guarde IDs ordenados e tenant de cada hit como evidência do teste.',
        idea: 'Para consultas sem evidência relevante, acompanhe falsa recuperação e abstenção. O denominador de recall é zero nesse grupo.',
        change: 'O aumento da densidade de A deixa o resultado autorizado de B invariável.',
        metrics: [['Corpus final', '15 docs'], ['Recall@2 de B', '100%'], ['Hits de C', '0']],
      },
    ]),
  },
  'rag-reranking': {
    scenario: 'A regra que resolve a dúvida está no final de um trecho longo. Mude quanto desse trecho cabe na entrada do modelo que ordena os resultados e veja quando ele deixa de receber a prova.',
    initial: [
      observation('A avaliação guarda o conjunto de passagens relevantes de cada pergunta.', [['Métrica', 'recall@K'], ['Unidade', 'por pergunta']]),
      observation('O trabalho de reranking cresce com o número de pares pergunta–trecho.', [['Candidatos/exemplo', '40'], ['Pares/consulta', '40']]),
      observation('A seleção final remove sobreposição e preserva a passagem de origem.', [['Seleção', 'por trecho'], ['Limite final', 'tokens']]),
      observation('O caminho de contingência recebe identificação de rota própria.', [['Rota primária', 'reranking'], ['Contingência', 'híbrida']]),
    ],
    steps: lab(['Candidatos', 'Janelas', 'Ranking'], [
      {
        active: 0, label: 'Controlar', title: 'Defina um scorer com resultado conhecido',
        body: 'Prepare 20 perguntas com dois textos candidatos de 120 palavras cada. Em cada par, o primeiro é um distrator. O segundo contém a palavra exata elegivel na posição 10 para 16 perguntas e na posição 110 para as outras quatro. Use palavras neutras nas demais posições. O scorer de teste vale 1 quando encontra essa palavra e 0 caso contrário. Empates mantêm a ordem de entrada.',
        idea: 'A sondagem determinística testa qual texto chega ao scorer. O comportamento semântico de um cross-encoder real é uma segunda avaliação.',
        change: 'Com os textos completos, a evidência fica em primeiro lugar nas vinte consultas.',
        metrics: [['Consultas', '20'], ['Pares', '40'], ['Acertos top-1', '20/20']],
      },
      {
        active: 1, label: 'Truncar', title: 'Limite a entrada a oitenta palavras',
        body: 'Passe ao scorer apenas as primeiras 80 palavras de cada trecho, contando a posição inicial como 1. As quatro evidências tardias desaparecem e os quatro empates favorecem o distrator. Registre separadamente os IDs recuperados e os intervalos efetivamente apresentados ao scorer.',
        idea: 'O documento continua no top-2 de recuperação mesmo quando a passagem discriminante desaparece no reranking.',
        change: 'A falha só aparece no segmento de evidências tardias.',
        metrics: [['Hit top-2 inicial', '20/20'], ['Top-1 após corte', '16/20'], ['Top-1 tardio', '0/4']],
      },
      {
        active: 1, label: 'Fatiar', title: 'Reordene janelas e agregue pelo documento',
        body: 'Divida cada texto em duas janelas sobrepostas, posições 1–80 e 41–120. Calcule a pontuação de ambas, retenha o máximo por documento e a posição da janela vencedora. Selecione o melhor documento e entregue o trecho correspondente ao gerador. Compare esse custo ao do corte único.',
        idea: 'Guardar o offset vencedor permite citar a evidência que realmente decidiu o ranking.',
        change: 'As posições 10 e 110 ficam acessíveis em janelas diferentes.',
        metrics: [['Pares de janelas', '80'], ['Top-1 esperado', '20/20'], ['Top-1 tardio', '4/4']],
      },
      {
        active: 2, label: 'Dimensionar', title: 'Meça o preço de recuperar a passagem perdida',
        body: 'Repita os 20 casos com lote e limite de entrada reais. Registre tokens por par, tempo de fila, duração de inferência, p95 e posição do trecho vencedor. No teste sintético, exija 4/4 no segmento tardio e 16/16 no inicial. No modelo real, declare o orçamento de latência antes de medir e faça revisão humana dos empates.',
        idea: 'Dobrar o número de pares aqui é uma conta exata. O fator de latência depende do hardware, batching e comprimento tokenizado.',
        change: 'A aceitação exige cobertura dos dois segmentos e custo medido na carga-alvo.',
        metrics: [['Ampliação de pares', '2×'], ['Iniciais exigidos', '16/16'], ['Tardios exigidos', '4/4']],
      },
    ]),
  },
  'rag-citacoes': {
    scenario: 'Uma loja muda o prazo de troca de 30 para 14 dias. O endereço da página continua igual. O chat precisa verificar a versão do trecho a cada consulta.',
    initial: [
      observation('A passagem conserva documento, revisão e intervalo.', [['Documento', 'trocas'], ['Identidade', 'revisão + trecho']]),
      observation('O gerador associa uma conclusão a evidência acessível.', [['Objeto auditado', 'afirmação'], ['Suporte', 'passagem']]),
      observation('O verificador confere ID, escopo e suporte textual.', [['Verificações', '3'], ['Unidade', 'afirmação']]),
      observation('A decisão de abstenção é calibrada com perguntas respondíveis e sem evidência.', [['Indicador 1', 'cobertura'], ['Indicador 2', 'risco']]),
    ],
    steps: lab(['Política', 'Citações', 'Decisão'], [
      {
        active: 0, label: 'Publicar', title: 'Construa o oráculo da política vigente',
        body: 'Em uma coleção local de teste, publique trocas@1 com a frase “O prazo é de 30 dias.”. Fixe um relógio e uma data de consulta posterior à publicação. Faça a pergunta “Qual prazo vale hoje?” cinco vezes com chaves de cache distintas. Capture texto, revisão, trecho e número de dias de cada resposta.',
        idea: 'Para este fato numérico controlado, comparação exata de revisão e valor fornece uma verificação independente de outro LLM.',
        change: 'Cinco consultas de referência apontam para a revisão 1.',
        metrics: [['Revisão', '1'], ['Prazo esperado', '30 dias'], ['Pares corretos', '5/5']],
      },
      {
        active: 1, label: 'Desalinhar', title: 'Altere o conteúdo mantendo a mesma URL',
        body: 'Publique trocas@2 com “O prazo é de 14 dias.” e atualize o ponteiro de versão vigente. Force o replay das cinco respostas da revisão 1 por uma cache de resposta do teste. Confira que abrir o mesmo endereço ainda funciona e que o par valor/revisão deixa de satisfazer a pergunta sobre hoje.',
        idea: 'A disponibilidade da página mede acesso à referência. O teste de vigência verifica a alegação feita sobre aquela data.',
        change: 'A URL permanece acessível enquanto cinco respostas reproduzem um prazo vencido.',
        metrics: [['URLs válidas', '5/5'], ['Pares vigentes', '0/5'], ['Valor incorreto', '30 dias']],
      },
      {
        active: 1, label: 'Versionar', title: 'Vincule a leitura ao conjunto de evidências',
        body: 'Associe a entrada de cache ao hash das revisões usadas e ao escopo de autorização. Antes de reutilizar o texto, valide a vigência das revisões citadas. Se mudou, recupere a passagem atual e regenere. Valide que a referência da resposta pertence à revisão usada no prompt e que o prazo extraído dela é 14.',
        idea: 'Mesmo uma fonte acessível por URL imutável exige identificar a revisão consultada. Mantenha o histórico quando o produto aceita perguntas sobre datas passadas.',
        change: 'As consultas atuais agora recebem evidência e citação de trocas@2.',
        metrics: [['Cache antiga aceita', '0/5'], ['Prazo vigente', '14 dias'], ['Revisão citada', '2']],
      },
      {
        active: 2, label: 'Verificar', title: 'Teste a atualização e a ausência temporária de fonte',
        body: 'Execute as cinco consultas em condições normais e depois impeça a leitura da revisão vigente, mantendo apenas o ponteiro que indica versão 2. Desative outras fontes no teste. Exija 5/5 respostas sustentadas no primeiro lote e 5/5 abstenções justificadas no segundo. Reprove qualquer retorno de 30 dias como regra atual.',
        idea: 'Sem uma cópia verificável da revisão vigente, devolver uma resposta antiga para encobrir a falha de leitura mistura disponibilidade e correção.',
        change: 'A decisão acompanha a evidência disponível para a pergunta sobre hoje.',
        metrics: [['Respostas com suporte', '5/5'], ['Abstenções esperadas', '5/5'], ['Prazo antigo aceito', '0']],
      },
    ]),
  },
  'evals-golden-set': {
    scenario: 'Uma suíte de suporte dá nota máxima a um sistema que apenas memoriza atendimentos conhecidos. O laboratório redistribui conversas inteiras e mede a generalização.',
    initial: [
      observation('A amostra mantém grupos comuns e críticos identificáveis.', [['Estratos do exemplo', '2'], ['Peso', 'tráfego real']]),
      observation('O rótulo inclui o resultado esperado e as evidências aceitas.', [['Objeto', 'tarefa'], ['Revisão', 'adjudicada']]),
      observation('A separação por documento e conversa precede o ajuste de prompts.', [['Unidade de divisão', 'grupo'], ['Teste final', 'reservado']]),
      observation('As duas versões respondem às mesmas tarefas com rótulos congelados.', [['Comparação', 'pareada'], ['Agregação', 'por segmento']]),
    ],
    steps: lab(['Conversas', 'Divisão', 'Teste'], [
      {
        active: 0, label: 'Gerar', title: 'Crie quarenta grupos com resposta estável',
        body: 'Monte quarenta conversas sintéticas de C01 a C40. Cada uma tem duas paráfrases da mesma pergunta sobre seu pedido e um prazo inteiro distinto. Atribua como rótulo a posição do grupo somada a 100, de 101 a 140 horas. O baseline memoriza o prazo de cada conversa presente no treino e responde “desconhecido” aos outros grupos.',
        idea: 'Uma relação intencionalmente simples entre exemplos torna o vazamento visível sem treinar um modelo.',
        change: 'O conjunto tem 80 linhas, mas a unidade independente desta simulação é a conversa.',
        metrics: [['Conversas', '40'], ['Linhas', '80'], ['Paráfrases/grupo', '2']],
      },
      {
        active: 1, label: 'Contaminar', title: 'Separe paráfrases que pertencem à mesma conversa',
        body: 'Coloque a primeira pergunta de todas as conversas no treino e a segunda no teste. Construa o dicionário com a primeira pergunta e avalie a segunda usando o ID da conversa. Calcule o tamanho da interseção entre IDs de treino e de teste. Todos os acertos podem vir da memorização.',
        idea: 'Alterar a redação preserva informação sobre o pedido. Deduplicar apenas por texto idêntico deixa esse vazamento passar.',
        change: 'A nota chega ao máximo em um conjunto completamente sobreposto por ID.',
        metrics: [['IDs em comum', '40'], ['Acertos', '40/40'], ['Precisão aparente', '100%']],
      },
      {
        active: 1, label: 'Isolar', title: 'Divida conversas completas antes de treinar',
        body: 'Separe C01–C30 para treino e C31–C40 para teste, com os dois turnos de cada conversa no mesmo conjunto. Recrie o dicionário do zero, sem réplicas da execução anterior, e rode as vinte perguntas de teste. O baseline agora responde “desconhecido” em todas.',
        idea: 'A queda nessa sonda demonstra a contaminação do teste anterior. Um sistema real pode generalizar por mecanismos que este baseline não tem.',
        change: 'A divisão correta usa grupos disjuntos e mede o limite desse memorizador.',
        metrics: [['Linhas treino/teste', '60/20'], ['IDs em comum', '0'], ['Acertos', '0/20']],
      },
      {
        active: 2, label: 'Contraprova', title: 'Prove que o conjunto ainda é respondível',
        body: 'Disponibilize ao candidato uma API de teste que devolve o prazo vigente pelo ID do pedido, representando uma fonte legítima do produto. Congele os rótulos e corrija o valor numérico. O adaptador que consulta essa fonte deve acertar 20/20. Se falhar, confira o contrato da fonte, o avaliador e o isolamento de estado antes de comparar modelos.',
        idea: 'Guarde o manifesto da divisão por grupo e os snapshots usados. Dez conversas de teste não sustentam estimativas estreitas para tráfego real.',
        change: 'A suíte diferencia acesso legítimo à fonte de memorização dos rótulos.',
        metrics: [['Grupos de teste', '10'], ['Controle esperado', '20/20'], ['Sobreposição', '0']],
      },
    ]),
  },
  'evals-juiz': {
    scenario: 'Um lote de pares com vencedor conhecido testa se o avaliador troca de preferência quando as respostas mudam de posição.',
    initial: [
      observation('Cada dimensão da rubrica define um critério verificável.', [['Critério do ensaio', 'prazo correto'], ['Referência', 'humana']]),
      observation('As ordens AB e BA são avaliadas sem o nome do candidato.', [['Ordens por par', '2'], ['Identidade', 'oculta']]),
      observation('A aprovação indevida é medida entre exemplos realmente ruins.', [['Denominador', 'ruins rotuladas'], ['Resultado', 'taxa']]),
      observation('O painel acompanha versão do juiz e da rubrica junto ao resultado.', [['Versão do juiz', 'fixa'], ['Rubrica', 'versionada']]),
    ],
    steps: lab(['Pares', 'Juiz', 'Revisão'], [
      {
        active: 0, label: 'Preparar', title: 'Construa pares com um mesmo critério',
        body: 'Crie 24 pares de respostas para perguntas com prazo documentado. Em cada par só uma resposta informa o prazo da referência. Nas duas posições iniciais, distribua o vencedor igualmente entre A e B. Execute um verificador determinístico que extrai o prazo em ambas as ordens e depois converta cada voto para o ID real do candidato.',
        idea: 'O alinhamento final precisa usar o ID do candidato. Comparar diretamente as letras A e B inverte artificialmente o resultado de uma execução.',
        change: 'O verificador de controle produz a mesma escolha nas duas ordens.',
        metrics: [['Pares', '24'], ['Comparações', '48'], ['Pares consistentes', '24/24']],
      },
      {
        active: 1, label: 'Injetar', title: 'Introduza preferência sistemática pela primeira posição',
        body: 'Para os primeiros oito pares, substitua o veredito pelo candidato da primeira posição, tanto em AB quanto em BA. Nos outros dezesseis, preserve o verificador correto. Execute novamente e conte quantos pares dão o mesmo vencedor após remapear os IDs.',
        idea: 'Oito vitórias erradas em 48 votos escondem oito pares cuja decisão depende apenas da ordem da apresentação.',
        change: 'A injeção reduz a consistência para dois terços dos pares.',
        metrics: [['Pares com inversão', '8/24'], ['Pares consistentes', '16/24'], ['Votos corretos', '40/48']],
      },
      {
        active: 2, label: 'Adjudicar', title: 'Separe o voto instável da decisão final',
        body: 'Envie os oito pares inconsistentes a revisores com a rubrica e a referência, sem os votos do juiz. Preserve os 16 pares consistentes como outro estrato e audite também uma amostra deles. Neste teste com defeito conhecido, os 16 consistentes são corretos. Um erro estável do juiz real poderia permanecer ali.',
        idea: 'Consistência e correção são métricas distintas. Uma resposta invariavelmente errada permanece estável sob inversão.',
        change: 'A rota automática cobre 16 pares e a humana recebe os oito restantes.',
        metrics: [['Cobertura automática', '66,7%'], ['Pares para revisão', '8'], ['Ordens por par', '2']],
      },
      {
        active: 2, label: 'Validar', title: 'Verifique o detector com uma segunda injeção',
        body: 'Desative o defeito de ordem. Em quatro pares, force nas duas ordens a escolha do prazo incorreto. A regra de inversão deverá detectar zero casos e a comparação com o oráculo deverá detectar quatro. Guarde os dois contadores, rubrica, ID do juiz e ordem de apresentação no relatório.',
        idea: 'O exercício só passa se o painel distinguir a falha por posição da falha estável. A validação humana continua necessária quando o oráculo numérico deixa de existir.',
        change: 'Um avaliador pode apresentar consistência perfeita com erros semânticos.',
        metrics: [['Pares consistentes', '24/24'], ['Erros estáveis', '4/24'], ['Pares corretos', '20/24']],
      },
    ]),
  },
  'evals-tracing': {
    scenario: 'O pedido terminou, mas um dos registros do caminho chegou tarde ao serviço que junta os dados. Veja o que a equipe perde quando decide quais registros guardar antes de receber o último.',
    initial: [
      observation('O identificador do pedido percorre o cliente e os serviços.', [['Contexto', 'propagado'], ['Unidade de análise', 'trace']]),
      observation('A fusão aguarda os dois ramos paralelos da busca.', [['Ramos', 'BM25 e vetores'], ['Caminho', 'mais demorado']]),
      observation('O coletor pode aguardar o desfecho antes de aplicar a amostragem.', [['Decisão', 'ao fim'], ['Prioridade', 'erros']]),
      observation('Contadores da borda preservam o denominador durante a amostragem.', [['Origem do SLI', 'borda'], ['Origem do detalhe', 'trace']]),
    ],
    steps: lab(['Emissor', 'Coletor', 'Auditoria'], [
      {
        active: 0, label: 'Simular', title: 'Monte um replay com tempo de chegada controlado',
        body: 'Use um coletor simulado que inicia o relógio no primeiro span recebido, decide uma única vez após 3 s e guarda somente traces em que já viu erro. Injete cem traces distintos com três spans cada. Entregue os três em até 2 s. Em vinte traces, apenas o terceiro span tem status de erro. Registre também os vinte erros em um contador de borda independente.',
        idea: 'O replay mede a política do simulador. Em um Collector real, versões, limites de memória e tratamento de spans atrasados também alteram o resultado.',
        change: 'A política retém todos os erros quando os spans chegam antes da decisão.',
        metrics: [['Traces emitidos', '100'], ['Spans', '300'], ['Erros retidos', '20/20']],
      },
      {
        active: 1, label: 'Atrasar', title: 'Mude a chegada ao coletor mantendo a execução idêntica',
        body: 'Nos mesmos vinte erros, mova a chegada do terceiro span para 4 s após o primeiro. Preserve seus timestamps de execução. Repita a decisão aos 3 s. O simulador descarta os vinte traces porque ainda não viu os erros. O contador da aplicação continua marcando vinte.',
        idea: 'O tempo de chegada ao exportador e a duração medida pelo span são variáveis diferentes. Buffer de exportação pode atrasar um span curto.',
        change: 'Os vinte spans decisivos agora cruzam o limite de decisão.',
        metrics: [['Espera configurada', '3 s'], ['Chegada tardia', '4 s'], ['Erros retidos', '0/20']],
      },
      {
        active: 1, label: 'Ajustar', title: 'Avalie uma janela de decisão que cobre o atraso',
        body: 'Configure 5 s e reproduza os mesmos eventos. Os vinte erros devem voltar à saída. Sob uma entrada constante de 200 novos traces/s, estime o total de traces aguardando decisão com as duas janelas. Repita com distribuição real de tamanho de trace e meça RSS, pressão de fila e descartes.',
        idea: 'Com chegada constante, o número médio de estados pendentes cresce com a janela. Converter esse número em bytes exige o tamanho medido de cada estado.',
        change: 'A janela maior recupera os erros simulados e aumenta o estado mantido.',
        metrics: [['Pendentes a 3 s', '≈600'], ['Pendentes a 5 s', '≈1.000'], ['Erros retidos', '20/20']],
      },
      {
        active: 2, label: 'Auditar', title: 'Detecte perda de evidência sem confundi-la com recuperação',
        body: 'Compare os IDs dos traces exportados com os vinte IDs de erro do replay. Exija 20 IDs distintos com span de erro, zero duplicados e cem pedidos no contador da borda. Depois atrase novamente o span de um único erro para 6 s. O painel de cobertura deve cair para 19/20 enquanto o SLI de falha permanece em 20/100.',
        idea: 'Esse controle negativo verifica se a perda do coletor é visível mesmo quando a disponibilidade do produto não mudou.',
        change: 'O painel passa a distinguir falha do serviço de perda de dados de diagnóstico.',
        metrics: [['Erros visíveis', '19/20'], ['Cobertura dos erros', '95%'], ['Falhas na borda', '20%']],
      },
    ]),
  },
  'evals-slo': {
    scenario: 'O teste mantém constante o número de pedidos por minuto. Compare um pico curto de falhas com uma piora que demora a passar. Observe os dois períodos usados pelo alerta.',
    initial: [
      observation('O denominador contém pedidos elegíveis segundo o contrato do serviço.', [['SLO do ensaio', '99,9%'], ['Orçamento', '0,1%']]),
      observation('Canário e controle recebem tráfego comparável durante o mesmo intervalo.', [['Atribuição', 'por conversa'], ['Comparação', 'simultânea']]),
      observation('Uma taxa ruim de 1,5% equivale a quinze vezes a tolerância de 0,1%.', [['Fração ruim', '1,5%'], ['Burn rate', '15×']]),
      observation('O pacote anterior permanece disponível para o retorno da coorte.', [['Componentes', 'modelo + índice'], ['Verificação', 'por versão']]),
    ],
    steps: lab(['Pedidos', 'Janelas', 'Operação'], [
      {
        active: 0, label: 'Fixar', title: 'Defina o contrato antes de reproduzir os eventos',
        body: 'Gere uma hora com 1.000 pedidos elegíveis por minuto, um ruim por minuto e contadores separados por versão. O critério didático aciona um alerta quando o burn rate supera 14,4 nas últimas janelas completas de 60 e 5 minutos simultaneamente. Divida a taxa de pedidos ruins de cada janela por 0,001.',
        idea: 'Com tráfego desigual, some numeradores e denominadores por janela antes de dividir. Uma média simples de percentuais por minuto distorce o SLI.',
        change: 'A série de referência consome orçamento ao ritmo planejado nas duas janelas.',
        metrics: [['Ruins em 60 min', '60/60.000'], ['Burn 60 min', '1×'], ['Burn 5 min', '1×']],
      },
      {
        active: 1, label: 'Provocar', title: 'Injete primeiro um pico curto e depois sustente a falha',
        body: 'No fim da série, troque cinco minutos do padrão por 20 pedidos ruins por minuto mantendo o total de pedidos. Há 155 ruins na hora e 100 nos cinco minutos. Estenda agora a sequência degradada aos últimos 45 minutos. A regra deve permanecer inativa no primeiro caso e ativar no segundo.',
        idea: 'Um limiar rápido sozinho acionaria nos dois casos. A janela longa exige impacto acumulado antes de paginar.',
        change: 'Com 45 minutos degradados, a hora soma 915 ruins e o curto prazo segue crítico.',
        metrics: [['Burn longo · pico curto', '≈2,58×'], ['Burn longo · sustentado', '15,25×'], ['Burn curto · ambos', '20×']],
      },
      {
        active: 2, label: 'Reverter', title: 'Marque a mudança e reproduza a recuperação',
        body: 'Após os 45 minutos degradados, simule rollback e acrescente cinco minutos com um pedido ruim por minuto. Rotule a versão atendida em cada minuto. Na hora móvel ainda há 45 minutos ruins e 15 saudáveis. Os últimos cinco já voltaram ao padrão. A condição conjunta deve deixar de disparar.',
        idea: 'Uma janela longa sozinha permanece acima do limiar após a recuperação. Mantenha o registro do incidente mesmo após o fim do alerta.',
        change: 'O burn recente volta a 1×, mas a hora ainda contém o impacto passado.',
        metrics: [['Burn 60 min', '15,25×'], ['Burn 5 min', '1×'], ['Alerta conjunto', 'inativo']],
      },
      {
        active: 2, label: 'Confirmar', title: 'Verifique contagem, efeito da versão e qualidade',
        body: 'Compare a série com as contagens esperadas minuto a minuto. Os 45 minutos concentraram 900 ruins onde o baseline teria 45. Nos cinco minutos após a reversão, exija cinco ruins em 5.000 elegíveis e a fração esperada de tráfego na versão estável. Em uma liberação real, aguarde também os rótulos de qualidade que chegam depois dos indicadores técnicos.',
        idea: 'Capturar a recuperação no SLI não demonstra, por si só, que a resposta voltou a ter evidência correta e citações válidas.',
        change: 'O relatório preserva o impacto adicional do incidente e confirma a recuperação imediata.',
        metrics: [['Excesso nos 45 min', '855 ruins'], ['Após rollback', '5/5.000'], ['Taxa final', '0,1%']],
      },
    ]),
  },
};
