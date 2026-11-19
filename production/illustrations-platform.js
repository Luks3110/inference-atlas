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

function causalWindow(length) {
  const side = Math.min(8, length);
  return {
    rows: side,
    columns: side,
    cells: items(side * side, (i) => {
      const q = Math.floor(i / side),
        k = i % side;
      return item('Q' + (q + 1) + ' / K' + (k + 1), k <= q ? 'active' : 'muted');
    }),
  };
}

export const platformIllustrations = {
  'replicas-e-autoscaling': [
    ([fast, slow], [rate]) => [
      gpu('Servem 16 pedidos/s cada', fast),
      gpu('Servem 8 pedidos/s cada', slow),
      request('Pedidos que a frota atende', rate, 'pedidos/s'),
    ],
    ([ok, refused], [accepted, offered]) => [
      request('Passam pelo gateway', ok, 'pedidos/s'),
      request('Ficam do lado de fora', refused, 'pedidos/s'),
      worker('Réplicas para servir todas as chegadas', offered, 'réplicas', {
        note: 'Contar só os admitidos acionaria ' + accepted + '.',
      }),
    ],
    ([replicas, bandwidth], [remote, local]) => [
      worker('Réplicas que precisam dos pesos', replicas, 'réplicas'),
      page('Dados que cruzam o enlace com uma cópia local', 40 * (replicas - 1), 'GB'),
      clock('Cópia pela rede a ' + fmt(bandwidth) + ' GB/s', local, 's', {
        note: 'Sem pesos locais, a transferência leva ' + fmt(remote) + ' s.',
      }),
    ],
    ([deadline, service], [wait, jobs]) => [
      clock('Prazo até a resposta', deadline),
      clock('Tempo reservado para servir', service),
      request('Pedidos que podem ficar à frente', jobs, 'pedidos', {
        note: fmt(wait) + ' ms disponíveis para esperar.',
      }),
    ],
    ([hot, neighbors], [local, pooled]) => [
      request('Entra na rota de 40/s', hot, 'pedidos/s'),
      request('Entra nas rotas de 56/s', neighbors, 'pedidos/s'),
      request('Pedidos antigos que saem por segundo com migração', pooled, 'pedidos/s', {
        note: 'Presos à primeira rota, sairiam ' + fmt(local) + ' por segundo.',
      }),
    ],
    ([deficit, seconds, reserve], [raw, queued]) => [
      request('Chegadas além da capacidade', deficit, 'pedidos/s'),
      request('Atendidos pela reserva durante a partida', raw - queued),
      request('Ainda na fila após ' + seconds + ' s', queued),
    ],
    ([n, rate]) => [
      worker('Distribuição concentrada', n, 'réplicas', {
        items: items(n, (i) => item(i < n - 2 ? 'A' : i === n - 2 ? 'B' : 'C', i < n - 2 ? 'warn' : 'active')),
        note: 'A zona A cai. Cada réplica sobrevivente serve ' + rate + ' pedidos/s.',
      }),
      worker('Distribuição equilibrada', n, 'réplicas', {
        items: items(n, (i) => item(['A', 'B', 'C'][i % 3], i % 3 === 0 ? 'warn' : 'active')),
        note: 'A mesma perda derruba só as réplicas marcadas com A.',
      }),
    ],
    ([backlog, defer], [normal, faster]) => [
      request('Esperam no começo', backlog),
      request('Ficam para depois na origem', defer, 'pedidos/s'),
      clock('Até sair o último pedido da fila', faster, 's', {
        note: 'Sem adiamento, a fila leva ' + fmt(normal) + ' s para esvaziar.',
      }),
    ],
  ],
  'saude-e-prontidao': [
    ([ready, rate], [gap, exposed]) => [
      clock('Porta aceita conexões', 8, 's'),
      clock('Modelo responde ao primeiro teste', ready, 's'),
      request('Encaminhados antes da primeira inferência', exposed, 'pedidos', {
        note: fmt(rate) + ' por segundo durante ' + gap + ' s.',
      }),
    ],
    ([resets, bytes], [copied]) => [
      worker('Tentativas interrompidas', resets, 'reinícios'),
      page('Pesos perdidos por tentativa', bytes, 'GB'),
      page('Pesos lidos de novo', copied, 'GB'),
    ],
    ([load, compile], [total, margin]) => [
      clock('Carga dos pesos', load, 's'),
      clock('Compilação depois da carga', compile, 's'),
      clock(margin < 0 ? 'Faltam para o primeiro teste' : 'Sobram até o reinício', Math.abs(margin), 's', {
        note: 'A inicialização completa leva ' + total + ' s.',
      }),
    ],
    ([forms, warm], [cold]) => [
      cell('Lotes que o pod já executou', Math.min(forms, warm), 'formas'),
      cell('Primeiro lote ainda precisa aquecer', cold, 'formas'),
      clock('Atraso somado desses primeiros lotes', cold * 180),
    ],
    ([slow, cap], [alone, limited]) => [
      request('Chamadas à dependência lenta', slow),
      bucket('Slots presos antes do limite', 20 - alone, 'slots', { capacity: 20 }),
      bucket('Slots presos com teto de ' + cap, 20 - limited, 'slots', { capacity: 20 }),
    ],
    ([lag, rate], [streams, work]) => [
      clock('Até o balanceador remover o pod', lag, 's'),
      request('Streams desviados para outro pod', streams, 'streams', {
        note: fmt(rate) + ' novos streams por segundo.',
      }),
      clock('Ocupação que sai deste pod', work, 'slot·s'),
    ],
    ([hook, flush], [, remaining]) => [
      clock('Pod executa preStop', hook, 's'),
      clock('Tempo para terminar streams', remaining, 's'),
      clock('Tempo para enviar os últimos bytes', flush, 's'),
    ],
    ([n, peak], [rate]) => [
      worker('Continuam servindo após perder uma réplica', n - 1, 'réplicas'),
      request('Pedidos atendidos no pico', Math.min(rate, peak), 'pedidos/s'),
      request('Excedem a capacidade restante', Math.max(0, peak - rate), 'pedidos/s'),
    ],
  ],
  observabilidade: [
    ([arrival, ui], [visible]) => [
      clock('Primeiro conteúdo chega ao cliente', arrival),
      clock('Interface espera antes de pintar', ui),
      clock('Primeiro texto na tela', visible),
    ],
    ([events], [, bad]) => [
      bucket('Caem no intervalo de 500 a 1.000 ms', events, 'respostas'),
      check('Até 800 ms no novo intervalo', events - bad, 'respostas'),
      request('Acima de 800 ms', bad, 'respostas'),
    ],
    ([rate, mean], [work]) => [
      request('Chegam ao motor', rate, 'pedidos/s'),
      token('Entrada média de cada pedido', mean),
      token('Motor precisa ler a cada segundo', work, 'tokens/s'),
    ],
    ([a, b], [, wall]) => [
      clock('Busca A, começa junto de B', a),
      clock('Busca B, começa junto de A', b),
      clock('Síntese termina', wall, 'ms', { note: 'Começa em ' + Math.max(a, b) + ' ms e dura 100 ms.' }),
    ],
    ([dup, cached], [, extra]) => [
      token('Prefixo útil por pedido', 1200),
      token('Duplicata já no cache por pedido', (dup * cached) / 100),
      token('Duplicata processada outra vez', extra, 'tokens/s'),
    ],
    ([refused], [good]) => [
      request('Gateway recusa', refused),
      request('Terminariam dentro do SLO', good, 'pedidos esperados'),
      request('Admitidos que perderiam o prazo', 1000 - refused - good, 'pedidos esperados'),
    ],
    ([lost, gained]) => [
      check('Acertava antes e passou a errar', lost),
      check('Errava antes e passou a acertar', gained),
    ],
    ([bad, minutes], [burn, used]) => [
      request('Respostas ruins a cada mil', 10 * bad, 'respostas esperadas'),
      clock('Tempo com essa taxa de erro', minutes, 'min'),
      bucket('Orçamento mensal consumido', used, '%', { note: fmt(burn) + ' vezes a taxa de erro admitida.' }),
    ],
  ],
  'rollout-canario': [
    ([writers, readers], [pairs, unchecked]) => [
      doc('Versões que gravam o registro', writers, 'revisões'),
      doc('Versões que leem o registro', readers, 'revisões'),
      check('Matriz de gravação e leitura', pairs, 'pares', {
        matrix: {
          rows: writers,
          columns: readers,
          cells: items(pairs, (i) =>
            item(
              'Gravação ' + (1 + Math.floor(i / readers)) + ' / leitura ' + (1 + (i % readers)),
              i === pairs - 1 ? 'active' : 'muted',
            ),
          ),
        },
        note:
          'Cada linha representa quem grava, cada coluna quem lê. Testar apenas a versão nova nas duas pontas deixa ' +
          unchecked +
          ' pares sem teste.',
      }),
    ],
    ([hold, risk], [tune, detect]) => [
      doc('Casos usados no ajuste', tune, 'casos'),
      doc('Casos que só entram no teste final', hold, 'casos'),
      check('Chance de detectar pelo menos uma falha', detect, '%', {
        note: 'Cada caso tem ' + risk + '% de chance de falhar, independentemente dos demais.',
      }),
    ],
    ([shadow, cap], [, accepted]) => [
      request('Pedidos espelhados que entram', accepted, 'pedidos/s'),
      request('Pedidos espelhados que ficam de fora', shadow - accepted, 'pedidos/s'),
      bucket('Buscas por segundo depois do limite', 200 + 2 * accepted, 'consultas/s', { capacity: cap }),
    ],
    ([chats, turns], [responses]) => [
      doc('Conversas sorteadas', chats, 'conversas'),
      packet('Mensagens em cada conversa', turns, 'mensagens'),
      packet('Mensagens observadas ao todo', responses, 'mensagens'),
    ],
    ([n], [natural, enriched]) => [
      doc('Casos raros esperados no tráfego normal', natural, 'casos'),
      doc('Casos raros na amostra dirigida', enriched, 'casos'),
      doc('Outros casos no replay', n - enriched, 'casos'),
    ],
    ([delay, stream], [admit, end]) => [
      request('Ainda chegam à revisão antiga', admit, 'pedidos'),
      clock('Última admissão', delay, 's'),
      clock('Último stream pode terminar em', end, 's', { note: 'Esse stream segue por até ' + stream + ' s.' }),
    ],
    ([n, target], [bound, remaining]) => [
      check('Passaram sem erro', n),
      check('Testes adicionais sem erro para atingir a meta', remaining, 'casos', {
        note: 'A meta é limitar o risco a ' + fmt(target) + '%.',
      }),
      check('Maior taxa de erro compatível com o teste', bound, '%', { note: 'Limite unilateral de 95%.' }),
    ],
    ([rate, cap], [, queue]) => [
      request('Voltam para a revisão estável', rate, 'pedidos/s'),
      request('A revisão estável consegue servir', Math.min(rate, cap), 'pedidos/s'),
      request('Acumulados em 30 s', queue),
    ],
  ],
  'rag-em-producao': [
    ([docs, revs], [all, old]) => [
      doc('Manuais com URL própria', docs),
      doc('Revisões que uma URL com versão distingue', all, 'edições'),
      doc('Revisões antigas escondidas pela URL corrente', old, 'edições', { note: revs + ' edições de cada manual.' }),
    ],
    ([missing, chunks], [dups]) => [
      doc('Presentes no índice', 10 - missing),
      doc('Ausentes do índice', missing),
      page('Trechos repetidos para manter o total de linhas', dups, 'trechos', {
        note: chunks + ' trechos por documento.',
      }),
    ],
    ([rank, k], [score, margin]) => [
      doc('Documento C em cada uma das duas listas', rank, 'posto', {
        items: [item('C @' + rank), item('C @' + rank)],
        note: 'Cada lista dá 1/(' + k + ' + ' + rank + ') ponto a C.',
      }),
      doc(margin < 0 ? 'Rival fica à frente' : 'C empata ou fica à frente', score, 'pontos de C', {
        note: 'O rival soma ' + fmt(1 / (k + 1)) + ' ponto pelo primeiro posto em uma lista.',
      }),
    ],
    ([copies, slots, limit], [, exception]) => {
      const general = Math.min(copies, slots, limit);
      return [
        doc('Contexto antes do teto', Math.min(copies + 1, slots), 'trechos', {
          items: items(slots, (i) =>
            i < copies ? item('regra') : i === copies ? item('exceção') : item('livre', 'muted'),
          ),
        }),
        doc('Contexto com teto de ' + limit, general + exception, 'trechos', {
          items: items(slots, (i) =>
            i < general ? item('regra') : i === general && exception ? item('exceção') : item('livre', 'muted'),
          ),
        }),
      ];
    },
    ([n], [bad, ok]) => [
      doc('Respostas com link para a fonte', n, 'respostas'),
      request('Prazo em dias com a unidade errada', bad, 'respostas'),
      check('Passam pela conferência de unidade', ok, 'respostas'),
    ],
    ([cached], [blocked, allowed]) => [
      doc('Resultado salvo em cache', cached, 'trechos'),
      doc('A permissão atual bloqueia', blocked, 'trechos'),
      doc('Podem entrar no prompt', allowed, 'trechos'),
    ],
    ([a, b], [common, lag]) => [
      packet('Índice A aplicou até', a, 'offset'),
      packet('Índice B aplicou até', b, 'offset'),
      packet('Ainda não chegaram aos dois índices', lag, 'eventos', {
        note: 'Compare as respostas usando o offset ' + common + '.',
      }),
    ],
    ([queries], [ok]) => [
      request('Consultas que precisam das duas fontes', queries),
      doc('Fonte contratual respondeu a tempo', ok, 'consultas'),
      request('Precisam sinalizar evidência incompleta', queries - ok),
    ],
  ],
  'inferencia-em-lote': [
    ([files, rev], [unique]) => [
      doc('Arquivos de entrada', files, 'arquivos'),
      doc('Normalizações de cada arquivo', rev, 'revisões'),
      doc('Prompts distintos no manifesto', unique, 'prompts'),
    ],
    ([offline, minutes], [ok, lost]) => [
      worker('Continuam produzindo durante a parada', 16 - offline),
      packet('Itens que chegam ao destino em quatro horas', ok, 'itens'),
      packet('Itens que a parada impede de produzir', lost, 'itens', {
        note: offline + ' workers ficam parados por ' + minutes + ' min.',
      }),
    ],
    ([size, ms], [blocks, total]) => [
      doc('Registros por bloco cheio', size, 'registros'),
      packet('Confirmações para um milhão de registros', blocks, 'commits'),
      clock('Tempo somado de confirmação', total, 's', { note: ms + ' ms por commit.' }),
    ],
    ([expected], [received]) => [
      doc('Linhas no manifesto', expected, 'linhas'),
      doc('Linhas lidas até o truncamento', received, 'linhas'),
      doc('Faltam antes de publicar', expected - received, 'linhas'),
    ],
    ([original, copy], [finish]) => [
      clock('Worker que já estava executando', original, 'min'),
      clock('Cópia com dois minutos de inicialização', copy + 2, 'min'),
      packet('Primeiro resultado que o destino aceita', 1, 'commit', { note: 'Chega no minuto ' + finish + '.' }),
    ],
    ([total, invalid], [valid]) => [
      doc('Bloco que falhou', total, 'itens'),
      doc('Itens inválidos em quarentena', invalid, 'itens'),
      doc('Resultados válidos preservados', valid, 'itens'),
    ],
    ([gpuRate, sink], [motor, end]) => [
      packet('Itens gerados', gpuRate, 'itens/s'),
      packet('Itens confirmados', Math.min(gpuRate, sink), 'itens/s'),
      clock('Último item confirmado', end, 'min', { note: 'O motor termina em ' + fmt(motor) + ' min.' }),
    ],
    ([expected], [missing, covered]) => [
      doc('IDs distintos encontrados', covered, 'IDs'),
      doc('IDs que só aparecem no manifesto', missing, 'IDs'),
      doc('Linhas duplicadas no lugar dos faltantes', expected - covered, 'linhas'),
    ],
  ],
  'features-online': [
    ([earlier, atCut], [inclusive]) => [
      packet('Eventos anteriores ao corte', earlier),
      packet('Eventos com timestamp igual ao corte', atCut),
      packet('Eventos se a janela inclui o limite direito', inclusive),
    ],
    ([original, delta, hour], [corrected, known]) => [
      doc('Valor gravado às 9h', original, 'R$'),
      doc('Valor corrigido às 11h', corrected, 'R$'),
      doc('Valor visível na previsão das ' + hour + 'h', known, 'R$', {
        note: hour < 11 ? 'Naquela hora, a correção ainda não tinha chegado.' : 'A correção já constava do histórico.',
      }),
    ],
    ([latest, lag], [stale]) => [
      packet('Registro presente antes do replay', latest, 'revisão'),
      packet('Evento atrasado que acaba de chegar', stale, 'revisão'),
      packet('Versão mantida ao comparar sequências', latest, 'revisão', {
        note: 'O replay está ' + lag + ' revisões atrás.',
      }),
    ],
    ([rate, partitions], [reads]) => [
      request('Leituras de vetores', rate, 'vetores/s'),
      bucket('Partições consultadas por vetor', partitions, 'partições'),
      request('Leituras que chegam ao armazenamento', reads, 'consultas/s'),
    ],
    ([active, last], [, worst]) => [
      bucket('Onze partições com o mesmo atraso', 11, 'partições', { note: 'Último sinal há ' + active + ' min.' }),
      bucket('Décima segunda partição', 1, 'partição', { note: 'Último sinal há ' + last + ' min.' }),
      clock('Desde o sinal mais antigo', worst, 'min'),
    ],
    ([affected, other]) => [
      request('Erros entre os 100 do segmento', affected, 'pedidos', { capacity: 100 }),
      request('Erros entre os outros 900', other, 'pedidos', { capacity: 900 }),
      request('Erros que o painel geral soma', affected + other, 'pedidos', { capacity: 1000 }),
    ],
    ([dist, swaps]) => {
      const old = items(4, (i) => i * dist),
        live = [...old];
      for (let i = 0; i < swaps; i++) [live[i], live[3 - i]] = [live[3 - i], live[i]];
      return [
        cell('Offline, entidades A a D', 4, 'entidades', { items: old.map((v, i) => item('ABCD'[i] + '=' + v)) }),
        cell('Online, nas mesmas chaves', 4, 'entidades', {
          items: live.map((v, i) => item('ABCD'[i] + '=' + v, old[i] === v ? 'active' : 'warn')),
        }),
      ];
    },
    ([missing, divergent]) => [
      doc('Previsões sem registro offline', missing, 'previsões'),
      doc('Pares com valores diferentes', divergent, 'pares'),
      doc('Pares com os mesmos valores', 1000 - missing - divergent, 'pares'),
    ],
  ],
  'tokenizacao-em-producao': [
    ([history, reply], [total]) => [
      token('Histórico que volta à entrada', history),
      token('Resposta anterior anexada', reply),
      token('Prefill da próxima chamada', total, 'tokens', {
        note: 'O template e a nova mensagem acrescentam 54 tokens.',
      }),
    ],
    ([pairs, fixed], [, joined]) => [
      token('Pares que viram um token ab', Math.max(0, pairs - fixed), 'pares'),
      token('Pares mantidos como a e b', Math.min(pairs, fixed), 'pares'),
      token('IDs no texto combinado', joined),
    ],
    ([n], [changed]) => [
      token('IDs iguais nas duas sequências', n - changed),
      token('IDs substituídos na mesma posição', changed),
      cell('Comprimento que o teste vê em ambas', n, 'posições'),
    ],
    ([room, schema], [left, cut]) => [
      token('Esquema acrescentado à entrada', schema),
      token('Posições que sobram para gerar', left),
      token('Entrada a cortar para reservar a saída', cut, 'tokens', {
        note: 'A resposta precisa de 2.048 posições. Havia ' + room + ' livres antes do esquema.',
      }),
    ],
    ([segment, extra]) => [
      request('Históricos do grupo sensível', segment),
      request('Novas recusas nesse grupo', extra),
      request('Pedidos dos outros grupos', 1000 - segment),
    ],
    ([passes, turns], [starts, extra]) => [
      token('Marcadores de início após renderizar', starts, 'marcadores'),
      token('Delimitadores necessários por conversa', turns, 'delimitadores'),
      token('Tokens acrescentados pelas passagens repetidas', extra),
    ],
    ([versions], [total, invalid]) => [
      doc('Versões de cada componente', versions, 'revisões'),
      check('Trios homologados', total - invalid, 'combinações'),
      check('Trios incompatíveis que o manifesto bloqueia', invalid, 'combinações'),
    ],
    ([before, after], [oldRate, newRate]) => [
      request('Idioma B a cada 100 pedidos antes', before, 'pedidos', {
        note: fmt(oldRate) + '% de recusa ao reunir A e B.',
      }),
      request('Idioma B a cada 100 pedidos depois', after, 'pedidos', {
        note: fmt(newRate) + '% de recusa ao reunir A e B.',
      }),
    ],
  ],
  'espacos-de-embeddings': [
    ([valid, pad, v], [raw, masked]) => {
      const all = items(valid + pad, (i) => item(i < valid ? v : 0, i < valid ? 'active' : 'muted'));
      const mask = items(valid + pad, (i) => item(i < valid ? '1' : '0', i < valid ? 'active' : 'muted'));
      return [
        token('Coordenada que chega em cada posição', valid + pad, 'posições', {
          items: all,
          note: 'A soma é ' + valid * v + '. Dividir por todas as ' + (valid + pad) + ' posições dá ' + fmt(raw) + '.',
        }),
        cell('Máscara usada no pooling', valid, 'posições incluídas', {
          items: mask,
          note: 'Cada 1 entra no divisor. ' + valid * v + ' ÷ ' + valid + ' = ' + fmt(masked) + '.',
        }),
      ];
    },
    ([right, wrong], [a, b]) => [
      cell('Consulta com o encoder correto', right, 'graus', {
        arrows: [
          { angle: 0, length: 5, label: 'documento' },
          { angle: right, length: 5, label: 'consulta' },
        ],
        note: 'O documento aponta para (1, 0). Seu produto interno com a consulta vale ' + fmt(a) + '.',
      }),
      cell('Consulta com o encoder trocado', wrong, 'graus', {
        arrows: [
          { angle: 0, length: 5, label: 'documento' },
          { angle: wrong, length: 5, label: 'consulta' },
        ],
        note: 'Com o outro encoder, o produto interno vale ' + fmt(b) + '.',
      }),
    ],
    ([tied, slots], [orders]) => [
      doc('Documentos com o mesmo score', tied, 'IDs', { items: items(tied, (i) => item('#' + (i + 1))) }),
      doc('Topo após desempatar por ID', Math.min(tied, slots), 'IDs', {
        items: items(Math.min(tied, slots), (i) => item('#' + (i + 1))),
        note: 'Sem critério de desempate, há ' + fmt(orders) + ' ordenações possíveis.',
      }),
    ],
    ([millions, dims], [one, two]) => [
      cell('Coordenadas de cada documento', dims, 'valores FP32'),
      page('Vetores do índice antigo', one, 'GB'),
      page('Memória com o índice novo ao lado', two, 'GB', { note: fmt(millions * 1e6) + ' documentos por índice.' }),
    ],
    ([k], [, lost]) => [
      doc('Vizinhos do top-k exato', k, 'vizinhos'),
      doc('Também aparecem no resultado do índice', k - lost, 'vizinhos'),
      doc('Ficaram fora do resultado aproximado', lost, 'vizinhos'),
    ],
    ([examined], [allowed, empty]) => [
      doc('Examinados, mas sem permissão', examined - allowed, 'candidatos'),
      doc('Permitidos pelo filtro', allowed, 'candidatos'),
      bucket('Vagas vazias no top-5', empty, 'vagas', { capacity: 5 }),
    ],
    ([remaining, high], [balance]) => [
      clock('Prazo restante ao iniciar', remaining),
      clock('Tempo gasto pela busca intensa', high),
      clock(
        balance < 0 ? 'Busca intensa passa do prazo por' : 'Tempo que resta após busca intensa',
        Math.abs(balance),
        'ms',
        { note: 'A busca curta consome 25 ms.' },
      ),
    ],
    ([dims, millions], [bytes, saved]) => [
      cell('Coordenadas que permanecem no vetor', dims, 'dimensões'),
      cell('Coordenadas retiradas de cada vetor', 768 - dims, 'dimensões'),
      page('Bytes por vetor curto', bytes, 'B', {
        note: 'O catálogo poupa ' + fmt(saved) + ' GB em ' + fmt(millions * 1e6) + ' vetores FP32.',
      }),
    ],
  ],
  'economia-da-geracao': [
    ([n], [newTokens]) => [
      token('Prompt que chega ao motor', n),
      token('Prefixo reaproveitado', n - newTokens),
      token('Tokens que ainda passam por prefill', newTokens),
    ],
    ([ctx, seq], [all, kv]) => [
      token('Posições anteriores por sequência', ctx, 'posições'),
      request('Sequências que dão o próximo passo', seq, 'sequências'),
      page('KV lógico consultado neste passo', kv, 'MiB', { note: fmt(all) + ' posições ao todo.' }),
    ],
    ([last, validation], [done]) => [
      clock('Último token chega', last),
      clock('Validador confere a saída', validation),
      clock('Resposta pronta para uso', done),
    ],
    ([burst, slots], [queue, delay]) => [
      bucket('Pedidos que já ocupam um slot', Math.min(burst, slots), 'slots', { capacity: slots }),
      request('Pedidos à espera da próxima onda', queue),
      clock('Espera da última onda', delay),
    ],
    ([tokens, rate], [duration, busy]) => [
      token('Tokens gerados por resposta longa', tokens),
      clock('Por quanto tempo ela prende um slot', duration, 's'),
      bucket('Slots ocupados em média', busy, 'slots', { note: fmt(rate) + ' respostas longas chegam por segundo.' }),
    ],
    ([delay, capacity], [deficit, backlog]) => [
      request('Oferta da frota sobrevivente', capacity, 'pedidos/s'),
      clock('Tempo até detectar a falha', delay, 's'),
      request('Fila acumulada até a detecção', backlog, 'pedidos esperados', {
        note: 'Entram ' + fmt(deficit) + ' por segundo além da oferta.',
      }),
    ],
    ([a, b, c]) =>
      [a, b, c].map((n, i) =>
        gpu('Host ' + 'ABC'[i], n, 'GPUs', {
          items: items(n, (j) =>
            item(j < n - (n % 2) ? 'P' + (1 + Math.floor(j / 2)) : 'livre', j < n - (n % 2) ? 'active' : 'muted'),
          ),
          note: 'Cada par local comporta uma réplica.',
        }),
      ),
    ([expired, pct], [, good]) => [
      request('Sessões expiradas', expired, 'sessões'),
      request('Concluem no prazo', good * 10, 'sessões esperadas'),
      request('Concluem depois do prazo', (1000 - expired) * (1 - pct / 100), 'sessões esperadas'),
    ],
  ],
  'regressoes-de-prompt': [
    ([stages, interval], [checkpoints, suspect]) => [
      cell('Etapas do pipeline', stages, 'etapas', {
        items: items(stages, (i) => item(i + 1, (i + 1) % interval === 0 || i === stages - 1 ? 'active' : 'muted')),
        note: 'As etapas marcadas guardam o digest da saída.',
      }),
      doc('Digests a comparar no replay', checkpoints, 'digests', {
        note: 'Entre dois marcos restam até ' + suspect + ' etapas para investigar.',
      }),
    ],
    ([prompts, backends], [all, missing]) => [
      doc('Revisões de prompt', prompts, 'revisões'),
      worker('Backends sob teste', backends, 'backends'),
      check('Pares que o teste diagonal deixa de fora', missing, 'pares', {
        note: all + ' pares no cruzamento completo.',
      }),
    ],
    ([evidence, neutral]) => [
      token('Prova que entra no prompt', evidence),
      token('Bloco neutro que sai ao permutar', neutral),
      token('Tokens mantidos do bloco inserido', evidence, 'tokens', {
        note: 'A mudança no comprimento depois da troca é ' + (evidence - neutral) + ' tokens.',
      }),
    ],
    ([wins, losses]) => [
      check('Perguntas que só a revisão nova acerta', wins, 'perguntas'),
      check('Perguntas que só a antiga acerta', losses, 'perguntas'),
    ],
    ([cut], [old, now]) => [
      doc('Prova já presente no prompt original', old, 'casos'),
      doc('Prova recuperada no replay', now - old, 'casos'),
      doc('Prova que continua fora do prompt', 100 - now, 'casos'),
    ],
    ([correct], [best, other]) => [
      check('Respostas já corretas', correct),
      doc('Erros que incluir a prova pode corrigir', best - correct, 'casos'),
      request('Erros que ainda pedem outra correção', other, 'casos'),
    ],
    ([clauses, present], [kept, lost]) => [
      doc('Cláusulas, cada uma com três condições', clauses, 'cláusulas'),
      check('Condições com trecho de apoio', kept, 'condições'),
      doc('Condições que perderam o apoio', lost, 'condições', {
        note: present + ' condições preservadas por cláusula.',
      }),
    ],
    ([n], [fresh]) => [
      doc('Famílias no lote de validação', n, 'famílias'),
      doc('Já apareceram no ajuste', n - fresh, 'famílias'),
      doc('Aparecem só na validação', fresh, 'famílias'),
    ],
  ],
  'atencao-gqa-rope': [
    ([logit, v], [weight, out]) => [
      cell('K1 recebe parte da atenção', weight, '% da massa', {
        note: 'Logit de K1: ' + fmt(logit) + '. Valor associado: ' + v + '.',
      }),
      cell('K2 recebe o restante', 100 - weight, '% da massa', { note: 'O valor de K2 é zero.' }),
      cell('Valor lido pela consulta', out, 'unidades'),
    ],
    ([logit, d], [once, twice]) => [
      cell('Logit entregue ao kernel', logit, 'pontos'),
      cell('Cabeça divide pela raiz de ' + d + ' outra vez', logit / Math.sqrt(d), 'pontos'),
      cell('Peso de K1 após repetir a escala', twice, '%', {
        note: 'Com uma só escala, K1 recebe ' + fmt(once) + '%.',
      }),
    ],
    ([a, b]) => [
      token('Acessíveis com a máscara triangular', a + b, 'chaves', {
        items: items(a + b, (i) => item(i < a ? 'A' + (i + 1) : 'B' + (i - a + 1), i < a ? 'warn' : 'active')),
      }),
      token('Acessíveis ao isolar a sequência B', b, 'chaves', {
        items: items(a + b, (i) => item(i < a ? 'A' + (i + 1) : 'B' + (i - a + 1), i < a ? 'muted' : 'active')),
      }),
    ],
    ([v, m], [, out]) => [
      cell('Contribuição do primeiro bloco', v, 'unidades', { note: 'Massa 1 multiplicada pelo valor ' + v + '.' }),
      cell('Contribuição do segundo bloco', 2 * m, 'unidades', { note: 'Massa ' + m + ' multiplicada pelo valor 2.' }),
      cell('Saída após dividir pela soma das massas', out, 'unidades'),
    ],
    ([gap, delta], [before, after]) => [
      cell('Valor de V2 antes', 4, 'unidades'),
      cell('Valor de V2 após a mudança', 4 + delta, 'unidades'),
      cell('Coordenada lida pela consulta', after, 'unidades', {
        note: 'Antes valia ' + fmt(before) + '. A diferença de logits permanece ' + fmt(gap) + '.',
      }),
    ],
    ([q, k], [logical, offset]) => [
      page('Página de Q', Math.floor(q / 16), 'índice da página', {
        items: [item('Q' + q), item('offset ' + (q % 16))],
      }),
      page('Página de K', Math.floor(k / 16), 'índice da página', {
        items: [item('K' + k), item('offset ' + (k % 16))],
      }),
      cell('Distância usada por RoPE', logical, 'posições', { note: 'Subtrair só os offsets daria ' + offset + '.' }),
    ],
    ([ranks, kib], [total, perRank]) => [
      cell('Cabeças KV diferentes', 8, 'cabeças'),
      gpu('Ranks que guardam uma cabeça cada', ranks, 'ranks', { note: fmt(ranks / 8) + ' cópia(s) de cada cabeça.' }),
      page('KV físico de um token entre todos os ranks', total, 'KiB', {
        note: fmt(perRank) + ' KiB por rank. O KV lógico ocupa ' + kib + ' KiB.',
      }),
    ],
    ([n], [all, kept]) => [
      cell('Pares entre consulta e chave', all, 'pares'),
      cell('A diagonal e o passado ficam visíveis', kept, 'pares', {
        matrix: causalWindow(n),
        note:
          'Cada linha é uma consulta e cada coluna é uma chave. A parte apagada pertence ao futuro.' +
          (n > 8 ? ' Recorte das oito primeiras posições.' : ''),
      }),
      cell('A máscara esconde chaves futuras', all - kept, 'pares', {
        note: 'A consulta final pode ler as ' + n + ' chaves.',
      }),
    ],
    ([n, size], [reserved, waste]) => [
      page('Páginas KV alocadas', Math.ceil(n / size)),
      cell('Posições preenchidas por tokens', n, 'posições'),
      cell('Posições livres na última página', Math.ceil(n / size) * size - n, 'posições', {
        note: fmt(reserved) + ' MiB reservados, dos quais ' + fmt(waste) + ' KiB estão vazios.',
      }),
    ],
  ],
  'speculative-decoding': [
    ([cost, commits], [per]) => [
      clock('Tempo da rodada completa', cost),
      token('Tokens definitivos por rodada', commits, 'tokens em média'),
      clock('Tempo por token entregue', per, 'ms/token'),
    ],
    ([lookup, copied, drafted], [copyCost, draftCost]) => [
      token('Tokens confirmados usando cópia', copied, 'tokens em média', {
        note: lookup + ' ms de busca + 18 ms para verificar. Cada token custa ' + fmt(copyCost) + ' ms.',
      }),
      token('Tokens confirmados usando o draft', drafted, 'tokens em média', {
        note: '9 ms de proposta + 18 ms para verificar. Cada token custa ' + fmt(draftCost) + ' ms.',
      }),
    ],
    ([n, mismatch], [ok, dropped]) => [
      token('IDs esperados pelo target', n, 'tokens', { items: items(n, (i) => item(i + 1)) }),
      token('IDs que o draft propôs', n, 'tokens', {
        items: items(n, (i) => item(i + 1 === mismatch ? 0 : i + 1, i < ok ? 'active' : i === ok ? 'warn' : 'muted')),
        note: ok + ' entram no prefixo aceito. ' + dropped + ' propostas ficam fora.',
      }),
    ],
    ([p, q], [accepted, rejected]) => [
      token('Propostas A aceitas a cada cem', Math.min(p, q), 'tokens esperados'),
      token('Propostas B aceitas a cada cem', accepted - Math.min(p, q), 'tokens esperados'),
      token('Precisam de outro sorteio', rejected, 'tokens esperados'),
    ],
    ([p, extra], [naive, fixed]) => [
      token('Propostas A do draft a cada cem', p + extra, 'tokens esperados'),
      token('A sai a mais ao repetir o sorteio original', naive - fixed, 'tokens esperados'),
      token('A sai com o reparo residual', fixed, 'tokens esperados'),
    ],
    ([n, remaining], [ok]) => [
      token('Propostas e token bônus', n + 1, 'tokens', {
        items: items(n + 1, (i) => item(i < n ? i + 1 : 'bônus', i < ok ? 'active' : 'muted')),
        note: 'O cliente ainda aceita ' + remaining + ' tokens.',
      }),
      token('Tokens entregues nesta rodada', ok),
    ],
    ([cost, commits], [per, needed]) => [
      token('Janela curta confirma em 40 ms', 2),
      token('Janela longa confirma em ' + cost + ' ms', commits, 'tokens em média'),
      token('Empate com a janela curta', needed, 'tokens por rodada', {
        note: 'O ajuste atual custa ' + fmt(per) + ' ms por token entregue.',
      }),
    ],
    ([draft, kv], [before, after]) => [
      page('Memória que o draft ocupa', draft, 'GiB'),
      page('Memória que sobra para KV', 24 - draft, 'GiB'),
      request('Sequências que ainda cabem', after, 'sequências', {
        note: 'Cada uma requer ' + fmt(kv) + ' GiB. Antes cabiam ' + before + '.',
      }),
    ],
    ([n, p], [se, margin]) => [
      packet('Repetições com o mesmo prefixo', n, 'sorteios'),
      token('Ocorrências esperadas do token', (n * p) / 100, 'ocorrências'),
      check('Margem aproximada da proporção', margin, 'p.p.', {
        note: 'Um erro padrão equivale a ' + fmt(se) + ' p.p.',
      }),
    ],
  ],
};
