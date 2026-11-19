import {
  token,
  document as doc,
  gpu,
  page,
  worker,
  request,
  cell,
  clock,
  check,
  packet,
  bucket,
  items,
  item,
} from './illustration-groups.js';

const fmt = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });

export const practiceIllustrations = {
  'contratos-de-saida': [
    ([n], [review, unsafe, auto]) => [
      doc('Tickets completos despachados', auto - unsafe, 'tickets'),
      doc('Sem fatura, enviados para revisão', review, 'tickets'),
      doc('Despachados mesmo sem fatura', unsafe, 'tickets', { note: 'Chegaram ' + n + ' tickets.' }),
    ],
    ([valid, invalid]) => [
      token('Prefixos que o decodificador pode continuar', valid, 'tokens'),
      token('A gramática mascara antes do sorteio', invalid, 'tokens'),
      cell('Vocabulário local após a máscara', valid, 'opções', {
        items: items(valid + invalid, (i) => item('ID ' + (i + 1), i < valid ? 'active' : 'muted')),
        note: 'IDs ilustrativos. As opções apagadas recebem probabilidade zero.',
      }),
    ],
    ([ids, incomplete, validate], [sent, unsafe]) => [
      doc('Tickets que o despachante envia', sent, 'tickets'),
      doc('Referências inexistentes', ids, 'tickets', {
        note: validate ? 'O validador segura esses tickets.' : 'Esses tickets passam com um ID inválido.',
      }),
      packet('Streams sem evento final', incomplete, 'streams', {
        note: unsafe + ' despachos contêm erro de referência ou de conclusão.',
      }),
    ],
    ([replicas, schemas, time], [compiles]) => [
      worker('Réplicas que começam frias', replicas, 'réplicas'),
      doc('Schemas que cada réplica compila', schemas, 'schemas'),
      packet('Compilações espalhadas pelas réplicas', compiles, 'compilações', { note: time + ' ms por compilação.' }),
    ],
    ([errors, minutes], [time, staff]) => [
      doc('Tickets que precisam trocar de fila', errors, 'tickets'),
      clock('Tempo de correção somado', time, 'min', { note: minutes + ' min para transferir cada ticket.' }),
      worker('Postos para terminar em uma hora', staff, 'postos'),
    ],
    ([admitted, cap, rounds], [, queue]) => [
      doc('Tickets que entram por rodada', admitted, 'tickets'),
      doc('Tickets que os revisores retiram por rodada', Math.min(admitted, cap), 'tickets'),
      doc('Tickets na fila após ' + rounds + ' rodadas', queue, 'tickets'),
    ],
    ([reply], [solved]) => [
      request('Usuários que não respondem em cem', 100 - reply, 'usuários'),
      request('Respondem, mas a dúvida continua', reply - solved, 'usuários esperados'),
      check('Resposta esclarece o destino do ticket', solved, 'usuários esperados'),
    ],
    ([n, p], [errors]) => [
      doc('Tickets auditados', n, 'tickets'),
      doc('Despachos incorretos esperados', errors, 'tickets esperados', {
        note: 'Chance de erro assumida: ' + p + '% por ticket.',
      }),
      doc('Despachos corretos esperados', n - errors, 'tickets esperados'),
    ],
  ],
  'execucao-idempotente-de-tools': [
    ([calls, fragments, bytes], [, total]) => [
      request('Buffers separados pelo ID da chamada', calls, 'buffers', {
        items: items(calls, (i) => item('#' + (i + 1))),
      }),
      packet('Fragmentos reunidos até o evento final', calls * fragments, 'fragmentos'),
      page('Argumentos que esperam o despacho', total, 'bytes', { note: bytes + ' bytes em cada fragmento.' }),
    ],
    ([n, on], [eligible, foreign]) => [
      doc('Registros com o mesmo número de pedido', n, 'registros'),
      doc('Registros que a consulta deixa passar', eligible, 'registros', {
        items: items(n, (i) => item('T' + (i + 1), i === 0 ? 'active' : on ? 'muted' : 'warn')),
        note: 'T1 é o tenant da sessão. ' + foreign + ' registro(s) pertencem a outros tenants e passaram.',
      }),
    ],
    ([crashes], [orphan, undone]) => [
      packet('Quedas entre as duas gravações', crashes, 'quedas'),
      doc('Mutações gravadas sem evento na outbox', orphan, 'mutações'),
      doc('Transações que desfazem a mutação', undone, 'transações'),
    ],
    ([lost], [recovered, pending]) => [
      packet('Confirmações perdidas no retorno', lost, 'ACKs'),
      doc('Recibos localizados pela chave original', recovered, 'recibos'),
      request('Intenções que vão para conciliação', pending, 'intenções'),
    ],
    ([proposed, confirmed], [diff]) => [
      doc('Valor na proposta de escrita', proposed, 'R$'),
      doc('Valor no recibo do destino', confirmed, 'R$'),
      doc('Diferença se a mensagem copiar a proposta', diff, 'R$'),
    ],
    ([copies], [remote, reused]) => [
      packet('Entregas da mesma intenção', copies, 'entregas'),
      request('Consultas que chegam ao provedor', remote, 'consultas'),
      doc('Respostas lidas do recibo local', reused, 'respostas'),
    ],
    ([serial, changes], [conflicts, falseAlarms]) => [
      doc('Replays com o mesmo conteúdo', serial, 'replays'),
      doc('Alterações reais de valor', changes, 'replays'),
      doc('Conflitos que o registro abre', conflicts, 'conflitos', {
        note: falseAlarms + ' resultam apenas da serialização.',
      }),
    ],
    ([age, ttl], [remaining, reconcile]) => [
      clock('Idade da cópia na fila de erros', age, 'h'),
      clock('Retenção do recibo', ttl, 'h'),
      request(reconcile ? 'Encaminhar para conciliação' : 'Pode conferir a chave antes do reenvio', 1, 'intenção', {
        note: 'O recibo tem ' + remaining + ' h de retenção restante.',
      }),
    ],
  ],
  'workflow-ou-agente': [
    ([n, , branches], [children, rules]) => [
      request('A regra encerra na triagem', rules),
      request('Precisam de pesquisa', n - rules),
      worker('Ramos abertos para as pesquisas', children, 'subtarefas', { note: branches + ' ramos por pesquisa.' }),
    ],
    ([order, shipping, coord], [, parallel]) => [
      clock('Leitura do pedido', order),
      clock('Leitura do transporte', shipping),
      clock('Junção entrega os dois resultados em', parallel, 'ms', {
        note: 'As leituras começam juntas. A coordenação soma ' + coord + ' ms.',
      }),
    ],
    ([branches, per, budget], [allowed, blocked]) => [
      worker('Ramos que solicitam créditos', branches, 'ramos', { note: per + ' chamadas por ramo.' }),
      request('Chamadas que recebem crédito', allowed, 'chamadas', { capacity: budget }),
      request('Chamadas que o coordenador bloqueia', blocked, 'chamadas'),
    ],
    ([gain, loss]) => [
      check('Só o agente resolve', gain, 'tarefas'),
      check('Só a regra resolve', loss, 'tarefas'),
      doc('Pares com resultados diferentes', gain + loss, 'pares'),
    ],
    ([n, per, time], [calls, work]) => [
      request('Pedidos que chegam', n),
      request('Chamadas que disputam os slots', calls, 'chamadas', { note: per + ' por pedido.' }),
      clock('Ocupação somada no pool', work, 'slot·s', { note: fmt(time) + ' s por chamada.' }),
    ],
    ([n], [, shared]) => [
      doc('Só o ramo A encontrou', n - shared, 'fatos'),
      doc('Os dois ramos encontraram', shared, 'fatos'),
      doc('Só o ramo B encontrou', n - shared, 'fatos'),
    ],
    ([n], [routed]) => [
      request('Precisam de pesquisa segundo o gabarito', n),
      request('O roteador envia à pesquisa', routed),
      request('Caem por engano na regra', n - routed),
    ],
    ([handoffs, per], [newReads, reuse]) => [
      packet('Transferências de tarefa', handoffs, 'transferências', { note: per + ' buscas por tarefa.' }),
      doc('Consultas lidas do estado anterior', reuse, 'consultas'),
      request('Consultas que ainda chegam à fonte', newReads, 'consultas'),
    ],
  ],
  'contrato-de-api-em-lote': [
    ([articles, revs, configs], [keys, collisions]) => [
      doc('Artigos enviados ao lote', articles, 'artigos'),
      doc('Entradas com artigo, revisão e configuração', keys, 'chaves', {
        note: revs + ' revisões por artigo, ' + configs + ' configurações por revisão.',
      }),
      doc('Entradas que perdem a identidade com a chave curta', collisions, 'entradas'),
    ],
    ([n, bytes, cap], [, files]) => [
      doc('Entradas a enviar', n, 'linhas'),
      doc('Linhas que cabem em um arquivo', Math.floor((cap * 1e6) / bytes), 'linhas', {
        note: bytes + ' bytes por linha.',
      }),
      doc('Arquivos completos ou parciais', files, 'arquivos'),
    ],
    ([missing, dups], [received, unique]) => [
      doc('Linhas no arquivo recebido', received, 'linhas', { note: dups + ' linhas extras repetem um ID.' }),
      doc('IDs esperados que aparecem no arquivo', unique, 'IDs'),
      doc('IDs que a reconciliação precisa localizar', missing, 'IDs'),
    ],
    ([n], [conflict, exact]) => [
      packet('Reentregas de IDs conhecidos', n, 'linhas'),
      doc('Cópias de conteúdo idêntico', exact, 'linhas'),
      doc('Mesmo ID, conteúdo diferente', conflict, 'linhas'),
    ],
    ([n], [transit, investigate]) => [
      doc('IDs que ainda faltam', n, 'IDs'),
      packet('Arquivo a caminho, aguardar entrega', transit, 'IDs'),
      doc('Entrega encerrada, investigar a falta', investigate, 'IDs'),
    ],
    ([transient, permanent, tokens], [retry, saved]) => [
      request('IDs transitórios a reenviar', transient, 'IDs', { note: fmt(retry) + ' tokens no novo lote.' }),
      doc('IDs com erro definitivo, fora do reenvio', permanent, 'IDs', {
        note: 'Economiza ' + fmt(saved) + ' tokens. Cada entrada tem ' + tokens + '.',
      }),
    ],
    ([n], [published, refused]) => [
      packet('Respostas que chegaram depois', n, 'respostas'),
      doc('Revisão ainda coincide, publicar', published, 'artigos'),
      doc('Artigo já mudou, recusar a gravação', refused, 'artigos'),
    ],
    ([lost, dup], [, covered]) => [
      doc('IDs com uma categoria', covered - dup, 'IDs'),
      doc('IDs com duas categorias', dup, 'IDs'),
      doc('IDs sem categoria', lost, 'IDs'),
    ],
  ],
  'grafo-estado-explicito': [
    ([n, s], [states, bit]) => [
      doc('Fontes que a guarda precisa distinguir', n, 'fontes'),
      cell('Combinações com ' + s + ' estados por fonte', states, 'estados'),
      cell('Combinações com um bit por fonte', bit, 'estados'),
    ],
    ([order, carrier], [wall, saved]) => [
      clock('Consulta ao pedido', order),
      clock('Consulta à transportadora', carrier),
      clock('Junção espera pelo ramo mais longo', wall, 'ms', {
        note: 'Os dois ramos se sobrepõem por ' + saved + ' ms.',
      }),
    ],
    ([n], [replay, missing]) => [
      packet('Desvios registrados', n, 'decisões'),
      doc('Têm entrada e versão para repetir a guarda', replay, 'decisões'),
      doc('Falta a causa da rota escolhida', missing, 'decisões'),
    ],
    ([age, ttl], [left, , diverged]) => [
      clock('Validade no evento gravado', ttl, 'min'),
      clock('Tempo decorrido até o replay', age, 'min'),
      doc(
        diverged ? 'Relógio atual manda para a rota de expiração' : 'Relógio atual ainda permite seguir',
        1,
        'decisão',
        { note: 'Pelo relógio atual, sobram ' + left + ' min.' },
      ),
    ],
    ([n], [orders]) => [
      worker('Ramos que podem terminar em paralelo', n, 'ramos'),
      cell('Ordens de término possíveis', orders, 'ordens'),
      cell('Ordens que um único replay deixa de fora', orders - 1, 'ordens'),
    ],
    ([unique, extra], [total, , dups]) => [
      packet('Mensagens recebidas no merge', total, 'mensagens', { note: extra + ' entrega(s) extra(s) por revisão.' }),
      doc('Evidências armazenadas após comparar revisões', unique, 'revisões'),
      packet('Reentregas descartadas', dups, 'mensagens'),
    ],
    ([n], [old, ok]) => [
      doc('Checkpoints no ensaio de replay', n, 'checkpoints'),
      doc('Emitem os mesmos comandos com o novo runner', ok, 'checkpoints'),
      doc('Precisam de migração ou do runner anterior', old, 'checkpoints'),
    ],
    ([n], [extra]) => [
      check('Replays com os mesmos comandos', n - extra, 'casos'),
      request('Chegam à mesma rota e emitem outro efeito', extra, 'casos'),
    ],
  ],
  'streaming-grafo-interface': [
    ([pub, priv]) => [
      packet('Campos que atravessam o stream', pub, 'campos'),
      doc('Campos privados que ficam no servidor', priv, 'campos'),
    ],
    ([n], [lost, unacked]) => [
      packet('Eventos recebidos antes do commit', n),
      packet('Já tinham ACK, a queda os perde', lost),
      packet('Seguem sem ACK, o produtor pode repetir', unacked),
    ],
    ([cap, rate], [full, offered]) => [
      bucket('Buffer disponível', cap, 'deltas'),
      packet('Deltas além do consumo em dez segundos', offered, 'deltas', {
        note: fmt(rate) + ' deltas extras por segundo.',
      }),
      clock('Tempo até o buffer encher', full, 's'),
    ],
    ([n], [deliveries, applied]) => [
      packet('Eventos buscados no replay', n),
      packet('Chegam outra vez pela conexão ao vivo', deliveries - n),
      packet('Cursor aplica uma vez', applied),
    ],
    ([arrival, wait, paint]) => [
      clock('Primeiro delta chega ao navegador', arrival),
      clock('Buffer espera para liberar os bytes', wait),
      clock('Interface desenha a atualização', paint),
    ],
    ([ttl, pause], [, gap]) => [
      clock('Eventos continuam disponíveis no log por', ttl, 's'),
      clock('Aba fica suspensa por', pause, 's'),
      clock('Trecho que já saiu do log ao retomar', gap, 's'),
    ],
    ([between], [lost, safe]) => [
      packet('Eventos entre ler o texto e ler o cursor', between),
      packet('Cursor passa por cima destes eventos', lost),
      packet('Podem ser reaplicados após o snapshot', safe),
    ],
    ([tabs, jitter, cap], [, queue, done]) => [
      request('Abas que abrem o replay', tabs, 'abas'),
      request('Retomadas atendidas na janela', tabs - queue, 'replays', {
        note: cap + ' por segundo durante ' + jitter + ' s.',
      }),
      request('Continuam na fila ao fim da janela', queue, 'replays', {
        note: 'A última termina em ' + fmt(done) + ' s.',
      }),
    ],
  ],
  'checkpoints-e-efeitos': [
    ([threads], [unknown, known]) => [
      request('Execuções interrompidas', threads, 'threads'),
      doc('Checkpoint aponta o próximo nó', known, 'threads'),
      doc('Precisam reconstruir a intenção', unknown, 'threads'),
    ],
    ([edits], [old, fresh]) => [
      doc('Revisões, incluindo a aprovada originalmente', edits + 1, 'revisões'),
      check('Caberiam no aceite anterior', old, 'revisões'),
      doc('Exigem nova aprovação', fresh, 'revisões'),
    ],
    ([n], [inserted, conflict]) => [
      worker('Workers que viram ausência', n),
      doc('Intenções que o banco deixa inserir', inserted, 'intenções'),
      request('Escritas recusadas no commit', conflict, 'escritas'),
    ],
    ([local, external, price], [, , gross]) => [
      doc('Referências só no livro local', local, 'referências'),
      doc('Referências só no extrato', external, 'referências'),
      doc('Montante sem referência correspondente', gross, 'R$', {
        note: 'Cada referência vale R$ ' + fmt(price) + '.',
      }),
    ],
    ([approved, current], [, diff, needs]) => [
      doc('Valor na aprovação', approved, 'R$'),
      doc('Valor vigente no destino', current, 'R$'),
      check(needs ? 'Pedir nova aprovação' : 'Pode usar a aprovação atual', 1, 'operação', {
        note: 'Diferença de R$ ' + fmt(diff) + '.',
      }),
    ],
    ([copies], [used, refused]) => [
      packet('Cópias do mesmo aceite', copies, 'cópias'),
      packet('Transições que consomem o aceite', used, 'transições'),
      packet('Cópias sem transição adicional', refused, 'cópias'),
    ],
    ([w, r], [, allowed]) => [
      worker('Geração que o worker apresenta', w, 'geração'),
      doc('Geração guardada no recurso', r, 'geração'),
      request(allowed ? 'O recurso aceita a gravação' : 'O recurso recusa a gravação atrasada', 1, 'escrita'),
    ],
    ([local, external], [, gross]) => [
      doc('Livro local sem liquidação no destino', local, 'R$'),
      doc('Extrato externo sem intenção correspondente', external, 'R$'),
      doc('Montante a investigar nos dois lados', gross, 'R$'),
    ],
  ],
  'deadlines-e-retries': [
    ([d, waiting, reply], [left, late]) => [
      clock('Tempo já gasto na fila', waiting),
      clock('Tempo reservado para devolver a resposta', reply),
      clock('Tempo que a GPU ainda pode usar', left, 'ms', {
        note: late ? 'Fila e retorno já passam ' + late + ' ms do prazo.' : 'A chamada tem ' + d + ' ms de prazo.',
      }),
    ],
    ([n], [total, dups]) => [
      doc('Operações que já tinham commit', n, 'operações'),
      doc('Efeitos criados outra vez no retry', dups, 'efeitos'),
      doc('Efeitos gravados no destino', total, 'efeitos'),
    ],
    ([n, b], [local, share, total]) => [
      worker('Workers que recebem créditos', n),
      bucket('Cada worker com o orçamento inteiro', local, 'retries/s no total', {
        note: 'Cada um pode gastar ' + fmt(b) + ' retries/s.',
      }),
      bucket('Cada worker com sua cota', total, 'retries/s no total', { note: fmt(share) + ' retries/s por worker.' }),
    ],
    ([expired, service], [avoided]) => [
      request('Pedidos vencidos ao sair da fila', expired),
      gpu('Tempo de GPU poupado', avoided, 'GPU·s', { note: service + ' GPU·s por pedido vencido.' }),
    ],
    ([rate, t], [waiting, avg]) => [
      request('Continuam chegando durante a pausa', rate, 'pedidos/s'),
      request('Fila quando o serviço reabre', waiting, 'pedidos', { note: 'A pausa dura ' + fmt(t) + ' s.' }),
      clock('Espera média até a reabertura', avg, 's'),
    ],
    ([cap, retries, duration], [growth, queue]) => [
      request('Chegadas originais mais retries', 1000 + retries, 'pedidos/s'),
      request('Atendidos durante a falha', Math.min(cap, 1000 + retries), 'pedidos/s'),
      request('Fila depois de ' + duration + ' s', queue, 'pedidos', {
        note: 'Acrescenta ' + fmt(growth) + ' pedidos/s à fila.',
      }),
    ],
    ([waiting, per, rate], [work, delay]) => [
      request('Pedidos à frente', waiting),
      token('Tokens que a fase precisa consumir', work, 'tokens', { note: per + ' tokens por pedido.' }),
      clock('Espera até o fim da fila', delay, 's', { note: 'A fase processa ' + rate + ' tokens/s.' }),
    ],
    ([n, slack, retries], [net, end]) => [
      request('Retries ocupam parte da folga', retries, 'pedidos/s'),
      request('Capacidade que sobra para a fila antiga', net, 'pedidos/s', {
        note: 'A folga antes de retries era ' + slack + ' pedidos/s.',
      }),
      clock('Tempo para servir os ' + n + ' pedidos acumulados', end, 's'),
    ],
  ],
  'tenancy-e-admissao': [
    ([n], [cross, isolated]) => [
      request('Buscas feitas com outro escopo', n, 'sondas'),
      doc('Chaves devolvem dados de outro tenant', cross, 'sondas'),
      doc('Escopo impede o hit cruzado', isolated, 'sondas'),
    ],
    ([reserve, , streams], [held, spent]) => [
      request('Streams que já desconectaram', streams, 'streams', { note: reserve + ' tokens reservados por stream.' }),
      token('Créditos ainda presos', held),
      token('Créditos já consumidos', spent),
    ],
    ([prompt, quantum], [rounds, rest]) => [
      token('Prompt à espera de crédito', prompt),
      packet('Rodadas necessárias para admitir o prompt', rounds, 'rodadas', {
        note: quantum + ' tokens de crédito por rodada.',
      }),
      token('Crédito que sobra após a admissão', rest),
    ],
    ([n, k], [all, any]) => [
      worker('Workers que podem receber pedidos', n),
      worker('Destinos escolhidos para um tenant', k, 'workers', {
        note: 'O conjunto que falha também tem ' + k + ' workers.',
      }),
      request('Chance de perder ao menos um destino', any, '%', {
        note: 'A chance de perder todos é ' + fmt(all) + '%.',
      }),
    ],
    ([a, b]) => [
      token('Trabalho de prefill do tenant A', a),
      token('Trabalho de prefill do tenant B', b),
      token('Entrada somada dos dois pedidos', a + b),
    ],
    ([reserve, p], [lend, max]) => [
      token('Reserva que B está usando', reserve - lend, 'tokens/s'),
      token('Sobra que B pode emprestar a A', lend, 'tokens/s'),
      token('A pode consumir até', max, 'tokens/s', { note: 'B usa ' + p + '% da própria reserva.' }),
    ],
    ([debt, rate], [time, left]) => [
      token('Trabalho que já está em execução', debt),
      token('Dívida ainda por quitar após 100 ms', left),
      clock('Tempo mínimo até liberar tudo', time, 'ms', { note: rate + ' tokens/s para quitar a dívida.' }),
    ],
    ([lag, rps], [served, blocked]) => [
      request('Leituras durante a propagação', lag * rps),
      doc('Leituras que usam uma permissão antiga', served, 'leituras'),
      request('Leituras que exigem nova autorização', blocked, 'leituras'),
    ],
  ],
  'custo-por-resolucao': [
    ([spend, reopened], [final, unit]) => [
      doc('Tickets reabertos entre os 90 mil fechados', reopened, 'tickets'),
      check('Continuam resolvidos após a janela', final, 'tickets'),
      doc('Valor gasto por resolução que se manteve', unit, 'R$', { note: 'A fatura soma R$ ' + fmt(spend) + '.' }),
    ],
    ([escalation, price], [, cost]) => [
      request('Chamadas adicionais por mil tarefas', 10 * escalation, 'chamadas esperadas'),
      doc('Custo dessas chamadas extras', 10 * escalation * price, 'R$'),
      doc('Fatura por mil com as primeiras chamadas', cost, 'R$'),
    ],
    ([simple, p], [, failures]) => [
      check('Tarefas simples resolvidas a cada cem', simple, 'tarefas'),
      check('Difíceis resolvidas a cada cem', ((100 - simple) * p) / 100, 'tarefas esperadas'),
      doc('Difíceis ainda sem solução', failures, 'tarefas esperadas'),
    ],
    ([approval, mix], [fail]) => [
      request('Tarefas de cobrança em mil do tráfego', 10 * mix, 'tarefas esperadas'),
      doc('Falhas em mil tarefas só de cobrança', fail, 'falhas esperadas'),
      check('Aprovações por cem tarefas de cobrança', approval, 'tarefas esperadas'),
    ],
    ([cost, gains], [net, unit]) => [
      doc('Resoluções adicionais no primeiro fechamento', gains, 'tarefas'),
      doc('Voltam a abrir depois', gains - net, 'tarefas'),
      check('Ganho após conferir as reaberturas', net, 'tarefas', {
        note: 'R$ ' + fmt(cost) + ' de gasto extra, ou R$ ' + fmt(unit) + ' por ganho.',
      }),
    ],
    ([n, m, rho], [total, effective]) => [
      request('Clientes que receberam o sorteio', n, 'clientes'),
      packet('Interações observadas', total, 'interações', { note: m + ' interações por cliente.' }),
      check('Amostra independente de precisão equivalente', effective, 'observações aproximadas', {
        note: 'O cálculo supõe correlação ' + fmt(rho) + ' entre interações do mesmo cliente.',
      }),
    ],
    ([offered, capacity], [ok, overflow]) => [
      request('Tráfego desviado para a rota forte', offered, 'pedidos/s'),
      request('Conseguem entrar junto da carga normal', ok, 'pedidos/s', {
        note: 'Dos ' + capacity + ' pedidos/s de capacidade, 50 já estavam em uso.',
      }),
      request('Excedem a capacidade', overflow, 'pedidos/s'),
    ],
    ([bill, tracked], [balance]) => [
      doc('Valor na fatura', bill, 'R$'),
      doc('Gastos ligados às tentativas', tracked, 'R$'),
      doc(
        balance < 0 ? 'Valor registrado além da fatura' : 'Valor ainda sem tentativa correspondente',
        Math.abs(balance),
        'R$',
      ),
    ],
  ],
  'mcp-em-producao': [
    ([both, server, host]) => [
      cell('Servidor oferece e host consegue usar', both, 'capacidades'),
      cell('Somente o servidor anuncia', server, 'capacidades'),
      cell('Somente o host conhece', host, 'capacidades'),
    ],
    ([n, needed, per], [full, lean]) => [
      doc('Schemas presentes no catálogo inteiro', n, 'schemas', { note: fmt(full) + ' tokens se todos entrarem.' }),
      doc('Schemas que esta chamada precisa', Math.min(n, needed), 'schemas'),
      token('Entrada ao carregar só os schemas necessários', lean, 'tokens', {
        note: '200 tokens de descoberta mais ' + per + ' por schema carregado.',
      }),
    ],
    ([proposed], [allowed, blocked]) => [
      request('Operações de escrita propostas', proposed, 'escritas'),
      request('Estão no escopo do token', allowed, 'escritas'),
      request('Token impede o despacho', blocked, 'escritas'),
    ],
    ([bad, r], [calls, skipped]) => [
      request('Entradas inválidas', bad),
      request('Chamadas que chegam ao servidor', calls, 'chamadas'),
      request('Repetições que o cliente elimina', skipped, 'retries', {
        note: 'A política original permite ' + r + ' retries por entrada.',
      }),
    ],
    ([proposals], [stale, reload]) => [
      packet('Propostas geradas com o catálogo antigo', proposals, 'propostas'),
      request('Ainda enviam uma operação já removida', stale, 'chamadas'),
      request('Param para atualizar o catálogo', reload, 'propostas'),
    ],
    ([sessions, writes], [leak, blocked]) => [
      request('Tentativas de escrita em sessões de leitura', sessions * writes, 'tentativas'),
      doc('Escritas indevidas que chegam ao destino', leak, 'escritas'),
      request('Tentativas barradas pela credencial', blocked, 'tentativas'),
    ],
    ([envelopes], [created, duplicates]) => [
      packet('Envelopes da mesma criação', envelopes, 'envelopes'),
      doc('Recursos criados no destino', created, 'recursos'),
      packet('Reentregas reconhecidas pela chave', duplicates, 'envelopes'),
    ],
    ([n, rate, incoming], [net, end]) => [
      request('Novas pendências que chegam', incoming, 'op/s'),
      request('Conciliações por segundo para a fila antiga', net, 'op/s', {
        note: 'O conciliador conclui ' + rate + ' op/s ao todo.',
      }),
      clock('Tempo para quitar ' + n + ' pendências', end, 's'),
    ],
  ],
  'capacidade-milhoes': [
    ([n, t], [rate]) => [
      request('Pedidos que chegam no evento', n),
      clock('Intervalo observado', t, 's'),
      request('Pedidos que chegam em um segundo médio', rate, 'pedidos/s'),
    ],
    ([n], [ok, bad]) => [
      request('Respostas concluídas em dez segundos', n, 'respostas'),
      check('Cumpriram todos os SLOs', Math.round(ok * 10), 'respostas'),
      request('Perderam pelo menos um SLO', Math.round(bad * 10), 'respostas'),
    ],
    ([lost, r], [left]) => [
      worker('Réplicas da zona perdida', lost, 'réplicas'),
      worker('Réplicas ainda disponíveis', 42 - lost, 'réplicas'),
      request('Oferta após a falha', left, 'pedidos/s', { note: r + ' pedidos/s por réplica pronta.' }),
    ],
    ([rate, p, k], [reads, over]) => [
      request('Leituras atendidas no cache', rate * k - reads, 'leituras/s'),
      request('Consultas que chegam à origem', reads, 'leituras/s', {
        note: fmt(p) + '% de hits, ' + k + ' consultas por pedido.',
      }),
      request('Leituras acima do teto de 900/s', over, 'leituras/s'),
    ],
    ([n, k], [total, extra]) => [
      request('Sockets abertos', n, 'sockets', { note: k + ' KiB de buffer por conexão.' }),
      page('Memória só para os buffers', total, 'MiB'),
      request('Sockets além do orçamento de 128 MiB', extra, 'sockets'),
    ],
    ([inRate, capacity, limit], [excess, fill]) => [
      request('Chegam ao serviço', inRate, 'pedidos/s'),
      request('A frota sobrevivente atende', capacity, 'pedidos/s'),
      bucket('Pedidos na fila quando enche', limit, 'pedidos', {
        note: 'A fila recebe ' + excess + ' pedidos extras por segundo e enche em ' + fmt(fill) + ' s.',
      }),
    ],
    ([gpus, n, k], [fit, left, nominal]) => [
      gpu('Placas livres em cada uma das ' + n + ' máquinas', gpus, 'GPUs por máquina'),
      worker('Réplicas que cabem sem cruzar máquinas', fit, 'réplicas', {
        note: k + ' GPUs vizinhas por réplica. Somar todas sugeriria ' + nominal + '.',
      }),
      gpu('Placas sem grupo local completo', left),
    ],
    ([backlog, t, r], [capacity, replicas]) => [
      request('Serviço dedicado à fila de recuperação', backlog / t, 'pedidos/s'),
      request('Capacidade para fila e tráfego novo', capacity, 'pedidos/s'),
      worker('Réplicas prontas necessárias no failover', replicas, 'réplicas', {
        note: fmt(r) + ' pedidos/s por réplica.',
      }),
    ],
  ],
};
