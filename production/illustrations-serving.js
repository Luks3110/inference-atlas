// Each group is a part of the system in this specific experiment.
// Counts describe actual objects; costs and rates keep their own units.
const group = (shape, label, value, unit, options = {}) => ({ shape, label, value, unit, ...options });
const tokens = (label, n, options) => group('token', label, n, 'tokens', options);
const pages = (label, n, options) => group('page', label, n, 'páginas', options);
const requests = (label, n, options) => group('request', label, n, 'pedidos', options);
const cases = (label, n, options) => group('document', label, n, 'casos', options);
const time = (label, n, options) => group('clock', label, n, 'ms', options);
const rows = (label, n, options) => group('cell', label, n, 'linhas', options);
const gib = (label, n, options) => group('page', label, n, 'GiB', options);
const item = (label, state = 'active') => ({ label, state });
const range = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));
const number = n => n.toLocaleString('pt-BR', {maximumFractionDigits: 3});

export const servingIllustrations = {
  'ciclo-de-inferencia': [
    ([failed, recovery]) => {
      const retried = Math.floor(failed * recovery / 100);
      return [requests('Chegam na primeira tentativa', 90 - failed), requests('Chegam no retry', retried), requests('Continuam sem resposta', failed - retried)];
    },
    ([length, changed]) => [
      group('token', 'Marcadores trocados', changed, 'IDs'),
      group('token', 'Posições que mantêm o mesmo ID', length - changed, 'IDs'),
    ],
    ([length, page], [allocated, slack]) => [
      pages('Páginas do KV', allocated, {note: number(page) + ' posições por página.'}),
      tokens('Ocupam a última página', page - slack, {capacity: page, note: number(slack) + ' posições ficam livres na cauda.'}),
    ],
    ([deadline, elapsed, service], [wait, late]) => [
      time('Gasto antes da fila', elapsed), time('Cabe na fila', wait),
      time('GPU até concluir', service, {note: late ? number(late) + ' ms além do prazo.' : 'Cabe no prazo de ' + deadline + ' ms.'}),
    ],
    ([size, bandwidth], [remote]) => [
      group('packet', 'Prefixo no enlace', size, 'MiB', {note: number(bandwidth) + ' GiB/s.'}),
      time('Buscar pela rede', remote, {note: remote <= 40 ? 'A busca termina antes ou junto da GPU.' : 'A GPU local termina primeiro.'}),
      time('Recalcular na GPU', 40),
    ],
    ([score], [ties, winner]) => [
      group('token', 'Candidatos ao próximo token', 3, 'IDs', {items: [2, score, 0].map((v, i) => item('ID ' + i + ' · ' + number(v), i === winner ? 'active' : 'muted'))}),
      group('token', 'Escolha gulosa', 1, 'token', {items: [item('ID ' + winner)], note: ties > 1 ? 'Empate. O menor ID sai primeiro.' : 'Este ID tem o maior logit.'}),
    ],
    ([letters, chunk], [broken, valid]) => {
      const bytes = Array.from(new TextEncoder().encode('á'.repeat(letters)));
      const parts = range(Math.ceil(bytes.length / chunk), i => {
        const slice = bytes.slice(i * chunk, (i + 1) * chunk);
        const text = new TextDecoder().decode(Uint8Array.from(slice));
        return item(slice.map(n => n.toString(16)).join(' '), text.includes('�') ? 'warn' : 'active');
      });
      return [group('packet', 'Bytes em cada leitura', parts.length, 'leituras', {items: parts}), group('cell', 'Letras ao juntar as leituras', valid, 'letras', {note: 'Decodificar as leituras separadamente gera ' + broken + ' substituições.'})];
    },
    ([size, bandwidth, decode], [transfer]) => [
      group('page', 'KV sai do prefill', size, 'MiB'), time('Travessia até a GPU de decode', transfer, {note: number(bandwidth) + ' GiB/s no enlace.'}), time('GPU calcula o próximo token', decode),
    ],
    ([rate, delay], [orphan, period]) => [
      time('Cancelamento a caminho da GPU', delay),
      tokens('Calculados após desconectar', orphan, {note: 'A GPU conclui um passo a cada ' + number(period) + ' ms.'}),
    ],
    ([rate], [useful, stale]) => [
      group('request', 'Pedidos válidos na GPU', useful, 'req/s'),
      group('request', 'Pedidos vencidos que ocupam a GPU', stale, 'req/s', {note: 'Descartar na entrada libera essas vagas dentro de ' + rate + ' req/s.'}),
    ],
  ],
  'treino-e-inferencia': [
    ([rate, days], [ready, waiting]) => [
      cases('Já têm rótulo para treino', ready), cases('Ainda esperam o desfecho', waiting, {note: days + ' dias de chegadas a ' + rate + ' casos/dia.'}),
    ],
    ([ingest, predict], [leak, delay]) => [
      group('document', 'Atributo no instante da previsão', 1, 'campo', {items: [item(leak ? 'Indisponível' : 'Disponível', leak ? 'warn' : 'active')], note: 'Previsão no minuto ' + predict + '.'}),
      group('clock', 'Atributo chega ao sistema', ingest, 'min', {note: delay ? 'Chegou ' + delay + ' min depois da previsão.' : 'O campo já pode entrar no exemplo.'}),
    ],
    ([size, swaps], [changed]) => [
      group('cell', 'IDs movidos para outra categoria', changed, 'IDs', {note: Math.min(swaps, Math.floor(size / 2)) + ' pares trocam de lugar.'}), group('cell', 'IDs que continuam na categoria anterior', size - changed, 'IDs'),
    ],
    ([reviews, urgent], [spent]) => [
      cases('Alertas extras enviados à revisão', reviews, {note: spent + ' min de revisão.'}), cases('Urgências extras detectadas', urgent, {note: 20 * urgent + ' min de trabalho evitado.'}),
    ],
    ([gain, loss]) => [
      cases('Apenas o modelo novo detectou', gain), cases('Apenas o modelo anterior detectou', loss), cases('Os dois modelos concordaram', 1000 - gain - loss),
    ],
    ([missing, zeros]) => [
      cases('Zero preenchido pelo pipeline', missing, {note: 'Indicador de ausência = 1.'}), cases('Zero que veio da origem', zeros, {note: 'Indicador de ausência = 0.'}),
    ],
    ([all, pct], [sample, weight]) => [
      cases('Casos fora da revisão', all), cases('Entram na auditoria, em média', sample, {note: 'Cada caso tem ' + pct + '% de chance de entrar e recebe peso ' + number(weight) + '.'}),
    ],
    ([n, pct], [,lower]) => {
      const hits = Math.round(n * pct / 100);
      return [cases('Urgências detectadas', hits), cases('Urgências que passaram', n - hits, {note: 'Com ' + n + ' casos, o limite inferior de Wilson fica em ' + number(lower) + '%.'})];
    },
  ],
  'latencia-e-vazao': [
    ([receive, paint]) => [time('Pedido até chegar o primeiro delta', receive), time('Delta aguarda pintura na tela', paint)],
    ([pause, threshold], [rest]) => [
      time('Intervalo isolado', pause, {note: 'Limiar de ' + threshold + ' ms. ' + (pause > threshold ? 'Conta como pausa.' : 'Dentro do limiar.')}),
      group('clock', 'Outros intervalos', 49, 'intervalos', {note: number(rest) + ' ms cada. ' + (rest > threshold ? 'Todos contam como pausa.' : 'Todos dentro do limiar.')}),
    ],
    ([rate, pending], [done]) => [requests('Entram no histograma aos 60 s', done), requests('Ainda aguardam no corte', pending, {note: rate * 60 + ' pedidos oferecidos no minuto.'})],
    ([rate, service], [queue]) => [
      requests('Chegam nos 20 s', 20 * rate), requests('Concluídos até o corte', 5 + 20 * rate - queue), requests('Ainda na fila', queue, {note: 'Havia cinco no início. Capacidade de ' + service + ' req/s.'}),
    ],
    (inputs, [generated, useful]) => [
      group('token', 'Chegam ao cliente', useful, 'tokens/s'), group('token', 'Pertencem a respostas descartadas', generated - useful, 'tokens/s'),
    ],
    ([rate], [long, short]) => [
      group('token', 'Prefill da fila longa', long, 'tokens/s'), group('token', 'Prefill da fila curta', short, 'tokens/s', {note: 'As duas filas dividem ' + rate + ' tokens/s.'}),
    ],
    ([base], [slow, slack]) => [time('Passo de decode original', base), time('Passo sob contenção', slow, {note: slack < 0 ? 'Ultrapassa a meta por ' + number(-slack) + ' ms.' : 'Restam ' + number(slack) + ' ms até a meta.'})],
    ([count, pct], [ok]) => [
      group('worker', 'Shards que precisam responder', count, 'shards', {note: number(pct) + '% de chance de chegar a tempo em cada shard.'}),
      group('request', 'Pedido completo no prazo', ok, '% de probabilidade', {note: 'Basta faltar uma leitura para o pedido perder o prazo.'}),
    ],
  ],
  'servidor-vllm': [
    ([sm, copies], [,ok, blocked]) => [
      group('gpu', 'GPUs testadas pelo kernel', 3, 'perfis', {items: [75,80,90].map(v => item('SM ' + v, v >= sm ? 'active' : 'warn'))}),
      group('worker', 'Réplicas liberadas', ok, 'réplicas'), group('worker', 'Réplicas bloqueadas', blocked, 'réplicas', {note: copies + ' cópias de cada perfil.'}),
    ],
    ([copies, size], [all]) => [
      group('worker', 'Processos pedindo o mesmo shard', copies, 'réplicas'), gib('Origem envia cópias separadas', all), gib('Origem envia uma cópia ao cache', size),
    ],
    ([cold, timeout], [ready,,restarts]) => [
      group('clock', 'Carregamento da réplica', cold, 's'), group('clock', 'Prazo da sonda', timeout, 's'),
      group('worker', 'Réplica após a sonda', 1, 'réplica', {items:[item(ready ? 'Pronta' : 'Reinicia', ready ? 'active' : 'warn')], note: restarts + ' reinícios em cinco minutos.'}),
    ],
    ([total], [changed]) => [requests('Alias aponta para a revisão antiga', total - changed), requests('Alias aponta para a revisão nova', changed), requests('Digest aponta para a revisão fixada', total)],
    ([prefix, suffix]) => [tokens('Cliente recebe', prefix), tokens('Marcador de parada', 1, {items: [item('STOP', 'warn')]}), tokens('Sufixo que o adaptador suprime', suffix)],
    ([total, partial]) => [group('packet', 'Streams com evento terminal', total - partial, 'streams'), group('packet', 'Conexões fechadas sem término', partial, 'streams')],
    ([rate], [all, limited]) => [
      group('request', 'Pedidos originais', rate, 'req/s'), group('request', 'Retries admitidos', limited - rate, 'req/s'), group('request', 'Retries cortados pelo teto', all - limited, 'req/s'),
    ],
    ([rate, warm, seconds], [cold, residual]) => [
      requests('Fila enquanto a réplica inicia', cold), requests('Fila atendida pela reserva', cold - residual), requests('Ainda aguardam ao fim da partida', residual, {note: seconds + ' s de rajada a ' + rate + ' req/s, com reserva de ' + warm + ' req/s.'}),
    ],
  ],
  'memoria-da-gpu': [
    ([gb, weights], [,free]) => [gib('Capacidade física da GPU', gb * 1e9 / 2 ** 30), gib('Pesos residentes', weights), gib(free < 0 ? 'Pesos que excedem a placa' : 'Livre após os pesos', Math.abs(free))],
    ([n, size], [adapters]) => [gib('Pesos base compartilhados', 14), group('page', 'Adaptadores carregados', n, 'adaptadores', {note: size + ' MiB por adaptador.'}), gib('Memória dos adaptadores', adapters)],
    ([old, next], [peak]) => [gib('Primeiro pool', old), gib('Pool da nova captura', next), gib('Dois pools vivos ao mesmo tempo', peak)],
    ([margin, spike], [free, excess]) => [gib('Pico que coube na reserva', Math.min(margin, spike)), gib('Reserva ainda livre', free), gib('Memória que faltou', excess)],
    ([heads, power], [dense, grouped, kv]) => [
      group('cell', 'Cabeças de consulta', heads, 'cabeças', {note: dense + ' KiB/token com KV denso.'}),
      group('cell', 'Cabeças que guardam K e V', kv, 'cabeças', {note: 2 ** power + ' consultas por cabeça KV. O cache ocupa ' + grouped + ' KiB/token.'}),
    ],
    ([sessions, length], [used, allocated, empty]) => [
      pages('Páginas privadas na GPU', allocated / 128, {note: sessions + ' sessões de ' + number(length) + ' tokens.'}),
      tokens('Posições preenchidas', used), tokens('Posições livres nas últimas páginas', empty),
    ],
    ([used, full], [,excess]) => [pages('Já ocupadas', used), pages('Pedidas no próximo passo', full), pages('Excedem o pool de 16', excess)],
    ([pool], [tenant, protectedPages]) => [pages('Cliente A pode ocupar', tenant), pages('Reservadas aos demais', protectedPages, {note: pool + ' páginas físicas no total.'})],
  ],
  quantizacao: [
    ([all, critical], [globalDelta, localDelta]) => [
      cases('Respostas no teste completo', all, {note: 'Mudar um julgamento move o acerto em ' + number(globalDelta) + ' pp.'}),
      cases('Respostas do segmento crítico', critical, {note: 'O mesmo erro move o acerto do segmento em ' + number(localDelta) + ' pp.'}),
    ],
    ([weights, bits]) => [group('cell', 'Pesos INT4 do grupo', weights * 4, 'bits', {note: weights + ' pesos de quatro bits.'}), group('cell', 'Escala compartilhada pelo grupo', bits, 'bits')],
    ([globalLimit, localLimit]) => {
      const clipped = (label, limit, counts) => group('cell', label, counts.reduce((sum,[m,n]) => sum + (m > limit ? n : 0), 0), 'pesos recortados', {
        items: counts.map(([m,n]) => item(n + ' × ' + number(m), m > limit ? 'warn' : 'active')), note: 'A faixa termina em ' + number(limit) + '.',
      });
      return [clipped('Grupo de pesos pequenos', globalLimit, [[0.4,1940]]), clipped('Extremos com a escala global', globalLimit, [[1.5,50],[2.5,10]]), clipped('Extremos com escala própria', localLimit, [[1.5,50],[2.5,10]])];
    },
    ([size, tiles], [single, live]) => [group('page', 'Tiles BF16 vivos', tiles, 'tiles', {note: number(single) + ' GiB por tile de ' + size + ' Mi elementos.'}), gib('Espaço de descompactação', live)],
    ([loss,gain]) => [cases('Acertava em BF16, errou quantizado', loss), cases('Errava em BF16, acertou quantizado', gain)],
    ([families, variants], [affected]) => [group('bucket', 'Famílias presentes em treino e teste', families, 'famílias'), cases('Paráfrases afetadas no teste', affected, {note: variants + ' paráfrases por família.'})],
    ([batch, setup]) => [time('Preparar o kernel uma vez', setup), time('Calcular os tokens do lote', 6 * batch), tokens('Dividem o custo da preparação', batch)],
    ([vectors, width], [bf16, compressed]) => [group('packet', 'Vetores enviados ao expert', vectors, 'vetores', {note: number(width) + ' elementos por vetor.'}), group('packet', 'Ida em FP8', compressed - bf16 / 2, 'MiB'), group('packet', 'Volta em BF16', bf16 / 2, 'MiB')],
  ],
  'kv-cache': [
    ([length, sessions], [,read]) => [tokens('Histórico lido por sessão', length), group('request', 'Sessões lendo KV neste passo', sessions, 'sessões'), group('page', 'KV lido no passo inteiro', read, 'MiB')],
    ([position, second], [linear, mapped]) => [
      group('page', 'Tabela da sequência', 2, 'páginas lógicas', {items: [item('L0 → P4', position < 4 ? 'active' : 'muted'), item('L1 → P' + second, position >= 4 ? 'active' : 'muted')]}),
      group('cell', 'Posição física consultada', 1, 'posição', {items: [item('P' + Math.floor(mapped / 4) + ' · slot ' + position % 4)], note: 'O endereço físico é ' + mapped + '. Somar à base apontaria para ' + linear + '.'}),
    ],
    ([adapters, blocks], [wrong, scoped]) => [group('bucket', 'Chaves separadas por adaptador', adapters, 'adaptadores', {note: blocks + ' blocos de prefixo por adaptador.'}), pages('Com o adaptador na chave', scoped), pages('Reusadas por engano sem o adaptador', wrong)],
    ([branches, kb], [copies, bytes]) => [pages('Ramo conserva a página original', 1), pages('Outros ramos recebem cópias privadas', copies, {note: branches + ' ramos vão escrever. Copiar ' + kb + ' KiB por página movimenta ' + bytes + ' KiB.'})],
    ([sessions, free], [run, wait]) => [pages('Páginas disponíveis antes do passo', free), group('request', 'Sessões recebem página', run, 'sessões'), group('request', 'Sessões esperam página', wait, 'sessões', {note: sessions + ' sessões chegaram à fronteira.'})],
    ([done, next], [unsafe, wait]) => [
      time('Kernel termina de ler a página', done), time('Alocador pede a página', next),
      group('page', 'Reuso da página', 1, 'página', {items: [item(unsafe ? 'Aguarda evento' : 'Livre', unsafe ? 'warn' : 'active')], note: wait + ' ms de espera pelo evento da GPU.'}),
    ],
    ([wait, slack, rebuild], [over, saved]) => [time('B ainda usa a página', wait), time('C pode esperar', slack), time(over ? 'Recomputação ao interromper B' : 'Recomputação evitada ao aguardar B', over ? rebuild : saved, {note: over ? 'Aguardar deixaria C ' + over + ' ms além do prazo.' : 'B libera a página a tempo para C.'})],
    ([old, swaps], [current, valid]) => [
      group('document', 'Geração no handle', 1, 'handle', {items:[item('g' + old)]}),
      group('page', 'Geração na página física', 1, 'página', {items:[item('g' + current, valid ? 'active' : 'warn')], note: valid ? 'Gerações iguais. A leitura pode seguir.' : swaps + ' reciclagens. Refazer a busca antes de ler.'}),
    ],
  ],
  'batching-continuo': [
    ([a,b]) => {
      const max = Math.max(a,b);
      const line = (name, n) => tokens('Linha ' + name + ' do lote denso', n, {capacity:max, items:range(max, i => item(i < n ? name + (i + 1) : 'PAD', i < n ? 'active' : 'muted')), note: (max - n) + ' posições de padding.'});
      return [line('A',a),line('B',b)];
    },
    ([steps, duration, deadline], [wait, slack]) => [group('clock', 'Passos até abrir uma vaga', steps, 'passos', {note: duration + ' ms cada.'}), group('request', 'Pedido de Caio', 1, 'pedido', {items: [item(slack < 0 ? 'Expirou' : 'Admitido', slack < 0 ? 'warn' : 'active')], note: 'Vaga em ' + wait + ' ms. Prazo de ' + deadline + ' ms.'})],
    ([responses, per], [,visible]) => [tokens('Conteúdo exibido', visible, {note: per + ' tokens por resposta.'}), tokens('EOS que o cliente remove', responses)],
    ([fixed, next, duration]) => [group('cell', 'Slot vazio no lote fixo', fixed, 'passos vazios'), group('cell', 'Slot vazio com readmissão', Math.min(next, fixed), 'passos vazios'), group('request', 'Slot ocupado pelo próximo pedido', fixed - Math.min(next, fixed), 'passos recuperados', {note: duration + ' ms por passo.'})],
    ([n, prefix], [internal, total]) => [tokens('Prefixo já no KV', prefix), group('cell', 'Pares entre tokens da nova fatia', internal, 'pares'), group('cell', 'Pares entre fatia e prefixo', total - internal, 'pares', {note: n + ' tokens novos consultam o prefixo.'})],
    ([pause, interval, space], [events, blocked]) => [group('packet', 'Eventos que cabem no buffer', Math.min(space, events), 'eventos'), group('packet', 'Emissões que encontram o buffer cheio', Math.max(0, events - space), 'eventos previstos', {note: 'A conexão pausa por ' + pause + ' ms. Há uma emissão prevista a cada ' + interval + ' ms.'}), time('Scheduler bloqueado', blocked)],
    ([fixed, mixed], [a,b]) => [group('clock', 'Lote fixo', 6, 'passos', {items:range(6, () => item(number(fixed) + ' ms')), note: a + ' ms no total.'}), group('clock', 'Lote misto', 4, 'passos', {items:range(4, () => item(number(mixed) + ' ms')), note: b + ' ms no total.'})],
    ([verify, emitted], [cost, threshold]) => [time('Propor e verificar uma rodada', verify), group('token', 'Tokens finais da rodada', emitted, 'tokens em média', {note: number(cost) + ' ms por token. Para empatar com o decode comum, a rodada precisa render ' + number(threshold) + ' tokens em média.'})],
  ],
  'cache-de-prefixo': [
    ([all, hot], [,p]) => [group('document', 'Revisões pré-carregadas', Math.min(all, hot), 'revisões'), pages('Já na GPU', p), pages('Carregar no primeiro uso', (all - Math.min(all, hot)) * 64)],
    ([position, size], [reuse, redo]) => [pages('Páginas inteiras ainda válidas', reuse / size, {note: size + ' tokens por página.'}), tokens('Recalcular a partir da página alterada', redo, {note: 'Primeiro ID diferente na posição ' + position + '.'})],
    ([n,interval]) => [time('Primeiro token com cache frio',480), time('Primeiro token com prefixo quente',170), time('Decode após o primeiro token', (n - 1) * interval, {note: (n - 1) + ' intervalos de ' + interval + ' ms em ambas as respostas.'})],
    ([first], [keep,invalid]) => [pages('Continuam com o mesmo hash', keep, {note: keep ? 'Blocos 1 a ' + keep + '.' : 'A edição atinge o primeiro bloco.'}), pages('Precisam de novo hash', invalid, {note: 'Blocos ' + first + ' a 64.'})],
    ([down, up]) => [cases('Perderam o acerto após o rearranjo', down), cases('Ganharam um acerto', up), cases('Conservaram o resultado', 100 - down - up)],
    ([local, other, copy], [a,b]) => [time('Aguardar a réplica com cache',local), time('Aguardar a réplica vizinha',other), time('Vizinha importa o prefixo',copy,{note: 'Ambas gastam mais 10 ms no sufixo. ' + (a === b ? 'As rotas empatam.' : a < b ? 'A réplica com cache termina primeiro.' : 'A vizinha termina primeiro.')})],
    ([pool, scan], [keep,,evicted]) => [pages('Quentes que sobrevivem à LRU',keep), pages('Quentes que a varredura despeja',evicted), pages('Quentes intactas com bypass',pool,{note: scan + ' blocos de uso único passam fora do pool quente.'})],
    ([total, wave], [peak, waves]) => [group('worker','Réplicas frias na primeira onda',peak,'réplicas'), group('worker','Réplicas nas ondas seguintes',total - peak,'réplicas',{note: waves + ' ondas para trocar a frota, até ' + wave + ' réplicas por vez.'})],
  ],
  'mistura-de-especialistas': [
    ([logical, extra], [,resident]) => [group('expert', 'Experts distintos no modelo', logical, 'experts'), group('expert', 'Cópias extras nas GPUs', extra, 'cópias', {note: 'Cada cópia ocupa 2 GB. As GPUs guardam ' + resident + ' GB de pesos de experts.'})],
    ([second, third, delta], [,swap]) => [
      group('expert', 'Top-2 antes de ajustar o score', 2, 'experts', {items:[item('E1'), item('E2')]}),
      group('expert', 'Top-2 que recebe o token', 2, 'experts', {items:[item('E1'),item(swap ? 'E3' : 'E2')], note: 'E2 marca ' + number(second) + '. E3 chega a ' + number(third + delta) + '. No empate, E2 fica.'}),
    ],
    ([a,b,tile]) => {
      const expert = (id, n) => {
        const capacity = tile * Math.ceil(n / tile);
        return rows('Tiles do expert ' + id, n, {capacity, note: (capacity - n) + ' linhas de padding em ' + capacity / tile + ' tiles.'});
      };
      return [expert('A',a),expert('B',b)];
    },
    ([pct,b], [sum,first,second]) => [
      group('expert', 'Ramos no combine', 2, 'ramos', {items:[item('A × ' + pct + '%'),item('B × ' + (100 - pct) + '%')], note: 'A devolve 6. B devolve ' + number(b) + '.'}),
      group('cell', 'Soma se B chega', 1, 'saída', {items:[item(number(sum))],note: 'A contribui com ' + number(first) + ' e B com ' + number(second) + '.'}),
      group('cell', 'Soma se B falta', 1, 'saída', {items:[item(number(first), 'warn')]}),
    ],
    ([n,slow], [,,idle]) => [group('worker', 'Ranks que chegam em 2 ms', n, 'ranks', {note: number(slow - 2) + ' ms de espera por rank.'}), time('Último rank libera o combine', slow), group('clock','Espera somada nos ranks rápidos',idle,'ms-rank')],
    ([n,saved,cost], [balance,equilibrium]) => [time('Copiar para o novo mapa', cost), time('Tempo poupado nos passos restantes', n * saved, {note: n + ' passos poupam ' + number(saved) + ' ms cada.'}), group('clock', 'Quando a cópia se paga', equilibrium, 'passos', {note: balance >= 0 ? 'Os passos restantes cobrem a migração.' : 'O cálculo acaba antes de recuperar o custo.'})],
    ([a,b,extra], [,,toA]) => [rows('Rank A após rotear', a + toA, {note: a + ' locais e ' + toA + ' extras.'}), rows('Rank B após rotear', b + extra - toA, {note: b + ' locais e ' + (extra - toA) + ' extras.'})],
    ([n,gap], [,drain]) => [group('packet','Microlotes que ainda usam o mapa antigo',n,'microlotes',{items:range(n, i => item('L' + (i+1) + ' · ' + (i+1)*gap + ' ms'))}), time('Última confirmação libera os slots',drain)],
  ],
  'paralelismo-de-especialistas': [
    ([k, perNode], [,nodes]) => [group('expert','Experts que recebem o token',k,'experts'), group('worker','Nós que recebem uma cópia pela rede',nodes,'nós',{items:range(nodes,i => item('N' + (i+1) + ' · ' + Math.min(perNode,k - perNode*i) + ' exp.')),note:'Cada nó distribui o token aos seus experts locais.'})],
    ([width,groupSize], [,packed]) => [group('cell','Valores INT8 no pacote',width,'B'), group('packet','Escalas FP16 no pacote',packed - width,'B',{note:Math.ceil(width / groupSize) + ' escalas de dois bytes.'})],
    ([total], [average,hot,excess]) => [rows('Reserva de um rank pela média',average),rows('Linhas enviadas ao destino quente',hot,{note:'Os três outros destinos recebem ' + (total - hot) + ' linhas no total.'}),rows('Linhas além da reserva',excess)],
    ([net,gemm], [serial,pipeline]) => [
      group('packet','Enlace envia dois microlotes',2,'envios',{items:[item('L1 · 0 a ' + net + ' ms'),item('L2 · ' + net + ' a ' + 2*net + ' ms')]}),
      group('gpu', 'GPU executa os dois GEMMs',2,'GEMMs',{items:[item('L1 · ' + net + ' a ' + (net+gemm) + ' ms'),item('L2 · ' + (pipeline-gemm) + ' a ' + pipeline + ' ms')],note:'Rede e GPU sobrepõem ' + number(serial - pipeline) + ' ms de trabalho.'}),
    ],
    ([replay,control], [before,after]) => [time('Mesmo rank no replay',replay,{note: before + ' ms após os pares.'}),time('Rank com carga igual por expert',control,{note: after + ' ms após os pares.'}),time('Ranks de referência',5)],
    ([cap,pct,weights], [free,duration]) => [group('packet','Banda protegida para enviar tokens',cap*pct/100,'GiB/s'),group('packet','Banda para copiar pesos',free,'GiB/s'),gib('Pesos atravessando o enlace',weights,{note:'A cópia leva pelo menos ' + number(duration) + ' s.'})],
    ([size,bw], [old,next]) => [group('packet','Dados entre os nós',size,'MB'),time('Rota de 100 GB/s',old),time('Rota de ' + bw + ' GB/s',next)],
    ([n,lost], [together,spread]) => {
      const groups = (label, live) => group('gpu', label, live, 'grupos completos', {capacity:n, items:range(n, i => item('G' + (i+1), i < n - live ? 'warn' : 'active')), note: lost + ' GPUs falharam. Cada grupo precisa das quatro GPUs.'});
      return [groups('Falhas no mesmo grupo',together),groups('Falhas em grupos diferentes',spread)];
    },
  ],
  'paralelismo-de-modelo': [
    ([total, replicated, ranks], [,perRank]) => [gib('Fatia privada em cada rank',(total-replicated)/ranks),gib('Cópia inteira em cada rank',replicated),group('gpu','Ranks que guardam essas duas partes',ranks,'ranks',{note:number(perRank) + ' GiB por rank.'})],
    ([layers,ops,us], [local,remote]) => [group('packet','Coletivos em um passo de decode',layers*ops,'coletivos',{note:ops + ' por camada em ' + layers + ' camadas.'}),time('Arranques no nó',local),time('Arranques na nova rota',remote,{note:us + ' µs por coletivo.'})],
    ([a,b,shift]) => {
      const moved = Math.min(a,shift);
      return [time('Trabalho que fica no estágio A',a-moved),time('Trabalho no estágio B após a troca',b+moved,{note: moved + ' ms de cálculo saíram do estágio A.'})];
    },
    ([size,n], [total]) => [group('page','Buffers vivos nos estágios',n,'buffers',{items:range(n, i => item('L' + (i+1))), note:size + ' MiB por microlote.'}),group('page','Ativações que ainda ocupam a GPU',total,'MiB')],
    ([a,b,input]) => [
      tokens('Fila A se receber o prefill',a+input,{note:'Fila B continua com ' + number(b) + ' tokens.'}),
      tokens('Fila B se receber o prefill',b+input,{note:'Fila A continua com ' + number(a) + ' tokens.'}),
    ],
    ([n], [,local]) => [
      group('gpu','TP2 entre nós após a falha',0,'grupos completos',{capacity:n,items:range(n,i=>item('G' + (i+1),'warn')), note:'Todo grupo perdeu um rank.'}),
      group('gpu','TP2 local após a falha',local,'grupos completos',{capacity:n,items:range(n,i=>item('G' + (i+1), i < local ? 'active' : 'warn')), note:'As duas GPUs dos grupos ativos ficaram no nó saudável.'}),
    ],
    ([size,rate,remap], [transport]) => [gib('KV exportado',size),time('Enlace entre as GPUs',transport,{note:rate + ' GiB/s de banda efetiva.'}),time('Remapear as páginas no destino',remap)],
    ([total,lost,rate], [,capacity,short]) => [
      group('worker','Grupos disponíveis fora da zona',total-lost,'grupos',{capacity:total,items:range(total,i=>item('G' + (i+1), i < lost ? 'warn' : 'active')), note:lost + ' grupos perdidos com a zona.'}),
      group('request','Capacidade dos grupos vivos',capacity,'req/s',{note:rate + ' req/s por grupo.'}),group('request','Pedidos sem capacidade no pico',short,'req/s'),
    ],
  ],
};
