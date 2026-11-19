// Each row describes a collection, a branch or an allocation in this particular exercise.
const shape =
  (shape, defaultUnit) =>
  (label, value, unit = defaultUnit, capacity) => ({ label, shape, value, unit, capacity });
const docs = shape('document', 'itens'),
  req = shape('request', 'pedidos');
const cells = shape('cell', 'células'),
  page = shape('page', 'páginas');
const time = shape('clock', 'ms'),
  check = shape('check', 'casos'),
  tokens = shape('token', 'tokens');
const packets = shape('packet', 'eventos'),
  bucket = shape('bucket', 'lotes');
const percent = (label, value) => check(label, value, '%', 100);
const gate = (label, open, yes, no) => ({
  ...check(label, Number(open), '', 1),
  items: [{ label: open ? yes : no, state: open ? 'active' : 'warn' }],
});
function rank(label, first) {
  if (first === 'empate') return { ...docs(label, 2, 'candidatos'), items: [{ label: 'A = B', state: 'active' }] };
  const order = first === 'A' ? ['A', 'B'] : ['B', 'A'];
  return {
    ...docs(label, 2, 'candidatos'),
    items: order.map((candidate, i) => ({ label: i + 1 + 'º ' + candidate, state: i ? 'muted' : 'active' })),
  };
}
function againstA(score) {
  if (Math.abs(score - 0.8) < 1e-10) return 'empate';
  return score > 0.8 ? 'B' : 'A';
}

export const applicationsIllustrations = {
  'memoria-por-conversa': [
    ([n], [p, t]) => [docs('Na conversa', n), docs('Confirmados no perfil', p), docs('Continuam privados', t)],
    ([n, c], [leaks, keys]) => [
      docs('Perfil antigo de cada conta', c, 'campos'),
      cells('Com a chave reutilizada', leaks, 'campos expostos'),
      bucket('Com ID e geração', keys, 'chaves'),
    ],
    ([n, l], [end, denied]) => [
      req('Entram na fila', Math.min(n, l), 'turnos'),
      req('Voltam ao cliente', denied, 'turnos'),
      time('Último turno termina em', end, 's'),
    ],
    ([n], [conflicts, fields]) => [
      docs('Alteram o mesmo campo', conflicts, 'pares'),
      docs('Escrevem em campos distintos', n - conflicts, 'pares'),
      cells('Campos independentes gravados', fields, 'campos'),
    ],
    ([a, b], [old, patched]) => [
      cells('Campos removidos por A', a, 'campos'),
      cells('Snapshot de B recoloca', old, 'campos'),
      cells('Patch preserva as duas edições', patched, 'mudanças'),
    ],
    ([n], [all]) => [
      req('Gravações confirmadas', n),
      packets('Cliente repete após perder o ACK', all - n),
      docs('Com recibo, revisões criadas', n, 'revisões'),
    ],
    ([replica, min], [gap, wait]) => [
      docs('Revisões a aplicar na réplica', gap, 'revisões'),
      time('Espera até a revisão mínima', wait),
      gate('Leitura da réplica', replica >= min, 'Liberada', 'Aguarda o log'),
    ],
    ([hot, wait], [p95]) => [
      req('Fila das contas frias · 40 ms', 100 - hot),
      req('Fila das contas quentes · ' + wait + ' ms', hot),
      time('95º pedido em ordem de espera', p95),
    ],
  ],
  'orcamento-de-contexto': [
    ([missing, reserved], [excess, left]) => [
      tokens('Diferença coberta pela reserva', Math.min(missing, reserved)),
      tokens('Sem espaço no prompt', excess),
      tokens('Reserva livre', left),
    ],
    ([budget, cost], [rules, left]) => [
      tokens('Regra comum', 300),
      tokens('Exceções que cabem inteiras', (rules - 1) * cost),
      tokens('Espaço livre', left),
    ],
    ([n, f], [affected, pending]) => [
      docs('Mensagens editadas', n, 'mensagens'),
      docs('Fatos já conferidos', affected - pending, 'fatos'),
      docs('Ainda aguardam conferência', pending, 'fatos'),
    ],
    ([a, b, c]) => [
      check('Prova no início', a, 'acertos', 12),
      check('Prova no meio', b, 'acertos', 12),
      check('Prova no fim', c, 'acertos', 12),
    ],
    ([n, t], [saved, total]) => [
      tokens('Uma cópia por ferramenta', total),
      tokens('Exemplo compartilhado', t),
      tokens('Espaço devolvido ao prompt', saved),
    ],
    (_, [reachable, blocked]) => [
      req('Roteiros que chegam ao fim', reachable, 'roteiros'),
      req('Param na chamada de status', blocked, 'roteiros'),
    ],
    ([n, t], [mean, p95]) => [
      docs('Anexos reabertos por cem pedidos', n, 'anexos'),
      time('Leitura de um anexo', t),
      time('95º pedido ordenado por atraso', p95),
    ],
    (_, [accepted, blocked]) => [
      req('Enviadas ao nó com a ferramenta', accepted, 'tarefas'),
      req('Sem vaga para executar', blocked, 'tarefas'),
    ],
  ],
  'retencao-e-esquecimento': [
    ([ttl, last], [renew, source]) => [
      time('Última leitura no dia', last, 'dias'),
      time('Expira se a leitura renovar', renew, 'dias'),
      time('Expira contando da coleta', source, 'dias'),
    ],
    ([n], [old, fresh]) => [
      req('Leituras que encontram o cache antigo', old),
      req('Seguem sem a entrada antiga', fresh),
    ],
    ([n, size], [receipts, max]) => [
      docs('Itens a apagar', n),
      bucket('Recibos de exclusão', receipts),
      docs('Itens a repetir se um lote falhar', max),
    ],
    (_, [gap, covered]) => [
      time('Backup sem registros para replay', gap, 'h'),
      time('Intervalo que o log cobre', covered, 'h'),
    ],
    ([rev, publish], [late, ok]) => [
      time('Revogação após o início', rev, 's'),
      time('Tentativa de publicação', publish, 's'),
      gate('Escrita final', ok, 'Commit aceito', 'Commit recusado'),
    ],
    ([n, size], [before, after]) => [
      docs('Objetos removidos', (before - after) / size, 'objetos'),
      docs('Objetos restantes', after / size, 'objetos'),
      page('Espaço ainda ocupado', after, 'MiB'),
    ],
    ([n], [left, ok]) => [
      docs('Fontes retiradas', n - left, 'fontes'),
      docs('Fontes ainda legíveis', left, 'fontes'),
      gate('Nova revisão parcial', ok, 'Pode reconstruir', 'Sem fonte'),
    ],
    ([n], [pending, wait]) => [
      packets('Prefixo já aplicado', n - pending),
      packets('Precisam de replay', pending),
      time('Leitor aguarda', wait),
    ],
  ],
  'rag-ingestao-permissoes': [
    ([e, a], [bytes, units]) => [
      tokens('Caracteres do prefixo', e + a, 'caracteres'),
      cells('UTF-8 até a passagem', bytes, 'bytes'),
      cells('UTF-16 até a passagem', units, 'unidades'),
    ],
    ([n, u, r], [msgs, missing]) => [
      packets('Primeira entrega por posição', n - missing),
      packets('Cópias entregues a mais', r),
      cells('Posições ainda vazias', missing, 'posições'),
    ],
    (_, [late, orphans]) => [
      docs('Remoções ainda no log', late, 'IDs'),
      docs('Sobram após aplicar o log', orphans, 'IDs'),
    ],
    ([f, r], [wait, ok]) => [
      packets('Revisões que faltam à ACL', Math.max(0, f - r), 'revisões'),
      time('Espera da leitura', wait),
      gate('Consulta à ACL', ok, 'Pode avaliar', 'Espera a réplica'),
    ],
    ([allowed, denied]) => [
      docs('IDs que o filtro deve devolver', allowed, 'IDs'),
      docs('IDs que devem ficar de fora', denied, 'IDs'),
    ],
    (_, [lost, replay]) => [
      packets('Broker já recebeu ACK', lost),
      packets('Broker ainda pode reentregar', replay),
    ],
    (_, [old, newest]) => [
      docs('Revisão após escrita sem condição', old, 'revisão'),
      docs('Revisão mantida pelo commit condicional', newest, 'revisão'),
    ],
    ([r, b], [gap]) => [
      time('Replay protegido pela barreira', Math.min(r, b), 'dias'),
      time('Eventos podem reaparecer sem barreira', gap, 'dias'),
    ],
  ],
  'rag-busca-hibrida': [
    ([n, k], [ids, pairs]) => [
      docs('Campo exato mantém', ids, 'IDs'),
      bucket('Chaves após normalização', n, 'chaves'),
      docs('Pares sem distinção', pairs, 'pares'),
    ],
    ([n, c], [dot, cos]) => [
      rank('Ranking por produto interno', againstA(dot)),
      rank('Ranking por cosseno', againstA(cos)),
      cells('Produto interno de B', dot, 'score'),
    ],
    ([v, b], [covered, union]) => [
      req('Só o vetorial encontra', v, 'perguntas'),
      req('Os dois encontram', b, 'perguntas'),
      req('Só o lexical recupera', union - covered, 'perguntas'),
    ],
    ([n, k], [all, one]) => [
      docs('A mesma passagem no ranking', n, 'cópias'),
      cells('Soma contando todas as cópias', all, 'score'),
      cells('Só o melhor posto vota', one, 'score'),
    ],
    ([e, k, n]) => [
      docs('Referências acessíveis', Math.min(e, k), 'IDs'),
      docs('IDs válidos devolvidos', Math.min(e, k, n), 'IDs'),
      cells('Posições vazias da lista', k - Math.min(e, k, n), 'posições'),
    ],
    ([other, e, k], [needed, found]) => [
      docs('Documentos alheios antes da primeira evidência', other, 'IDs'),
      docs('Evidências dentro da janela', found, 'IDs'),
      docs('Evidências que o corte descartou', e - found, 'IDs'),
    ],
    ([all, allowed, material]) => [
      docs('Vetores percorridos no grafo', all, 'vetores'),
      cells('Trabalho para montar o filtro', material, 'equiv. vetores'),
      docs('Vetores na busca exata filtrada', allowed, 'vetores'),
    ],
    ([foreign], [changed, isolated]) => [
      docs('Documentos de outro tenant', foreign, 'IDs'),
      cells('Campos que esses documentos alteram', changed, 'campos'),
      cells('Campos alterados após isolar', isolated, 'campos'),
    ],
  ],
  'rag-reranking': [
    ([full, partial, rescued]) => [
      docs('Já tinham regra e exceção', full, 'tarefas'),
      docs('Ganham a exceção', Math.min(partial, rescued), 'tarefas'),
      docs('Continuam sem exceção', Math.max(0, partial - rescued), 'tarefas'),
    ],
    ([s, l, n], [padding, useful]) => [
      tokens('Conteúdo dos pares curtos', n * s),
      tokens('Conteúdo dos dois pares longos', 2 * l),
      tokens('Padding que sai ao separar lotes', padding),
    ],
    ([n, h, r]) => [
      tokens('Dados das linhas', n * r),
      tokens('Cabeçalho que permanece', h),
      tokens('Cópias de cabeçalho que saem', (n - 1) * h),
    ],
    (_, [queued, launched]) => [
      req('Pares que saem da fila', queued, 'pares/s'),
      req('Kernel já recebeu', launched, 'pares/s'),
    ],
    ([first, errors]) => [
      check('Acertos escolhendo sempre o primeiro', first, 'pares', 20),
      check('Acertos lendo o texto', 20 - errors, 'pares', 20),
    ],
    ([w, q, pos], [room, retained]) => [
      tokens('Espaço para o documento', room),
      tokens('Posição da prova', pos),
      gate('Trecho entregue ao modelo', retained, 'Contém a prova', 'Prova truncada'),
    ],
    ([n, p], [prob, fp]) => [
      docs('Janelas irrelevantes avaliadas', n, 'janelas'),
      docs('Janelas aprovadas em média', fp, 'janelas'),
      percent('Chance de o documento passar', prob),
    ],
    ([n], [evals, saved]) => [
      req('Primeiro passe', n, 'pares'),
      req('Voltam ao scorer', evals - n, 'pares'),
      req('Dispensam a segunda avaliação', saved, 'pares'),
    ],
  ],
  'rag-citacoes': [
    (_, [denied, ok]) => [
      docs('Clique bloqueado na fonte', denied, 'links'),
      docs('Clique abre a fonte', ok, 'links'),
    ],
    ([end, start, day], [span, ok]) => [
      time('Regra e exceção vigentes juntas', span, 'dias'),
      time('Dia da consulta', day, 'dias'),
      gate('Aplicar as duas fontes', ok, 'Dentro do intervalo', 'Fora do intervalo'),
    ],
    ([n, s, r], [coverage, missing]) => [
      docs('Já tinham fonte', Math.min(n, s), 'alegações'),
      docs('Ganham fonte na busca', n - missing - Math.min(n, s), 'alegações'),
      docs('Ainda sem apoio', missing, 'alegações'),
    ],
    ([errors, abstain, weight]) => [
      req('Respostas corretas', 100 - errors - abstain),
      req('Sem resposta', abstain),
      cells('Custo das respostas erradas', errors * weight, 'pontos'),
    ],
    ([boundary, t], [rev, both]) => [
      time('Troca de revisão em', boundary, 's'),
      gate('Fonte que vale na consulta', rev === 2, 'Revisão 2', 'Revisão 1'),
      gate('Fechar os dois intervalos', !both, 'Uma revisão', 'Duas revisões'),
    ],
    ([n], [stale]) => [
      docs('Mesmo trecho no cache', n - stale, 'respostas'),
      docs('URL abre, trecho mudou', stale, 'respostas'),
    ],
    (_, [affected, safe]) => [
      docs('Dependem da política antiga', affected, 'respostas'),
      docs('Continuam válidas', safe, 'respostas'),
    ],
    ([n], [supported, ok]) => [
      docs('Com fonte disponível', supported, 'alegações'),
      docs('Sem fonte disponível', n - supported, 'alegações'),
      gate('Conclusão que usa todas', ok, 'Pode publicar', 'Falta fonte'),
    ],
  ],
  'rag-indice-hnsw': [
    ([k], [, , kept]) => [
      docs('Coincidem com o top-k canônico', kept, 'IDs'),
      docs('Outros IDs à mesma distância', k - kept, 'IDs'),
    ],
    ([n, v, t], [calc, found]) => [
      bucket('Nós abertos', n, 'nós'),
      cells('Vizinhos avaliados', calc, 'distâncias'),
      docs('Alvos que ainda cabem no melhor caso', found, 'IDs'),
    ],
    ([a, b, f]) => [
      gate('Índice A · ' + a + ' acertos', a >= f, 'Passa no piso', 'Abaixo do piso'),
      gate('Índice B · ' + b + ' acertos', b >= f, 'Passa no piso', 'Abaixo do piso'),
      check('Acertos exigidos', f, 'de 100', 100),
    ],
    ([g, temp, budget], [peak, margin]) => [
      page('Duas gerações residentes', 2 * g, 'GiB'),
      page('Temporários do rebuild', temp, 'GiB'),
      page(margin < 0 ? 'Memória que falta' : 'Memória livre', Math.abs(margin), 'GiB'),
    ],
    ([r, s], [wait, limit]) => [
      req('Chegadas em um segundo', r),
      req('Atendimentos possíveis em um segundo', limit),
      time('Espera do 95º pedido', wait),
    ],
    ([p, n], [empty, mean]) => [
      docs('Vizinhos antes do filtro', n, 'IDs'),
      docs('Passam pelo filtro em média', mean, 'IDs'),
      percent('Chance de nenhum passar', empty),
    ],
    ([add, apply, initial], [net, left]) => [
      packets('Entram em um minuto', 60 * add),
      packets('Saem do delta', initial + 60 * add - left),
      docs('Aguardam indexação', left, 'itens'),
    ],
    ([k, n, rep], [available]) => [
      docs('Vizinhos que ainda chegam', available, 'IDs'),
      docs('Sem cópia acessível', k - available, 'IDs'),
      gate('Réplica do shard', rep, 'Pode atender', 'Indisponível'),
    ],
    ([n, w, p], [cold, p99]) => [
      req('Primeiras consultas com falta', cold),
      req('Atendidas com cache quente', 100 - cold),
      time('99ª consulta em ordem de latência', p99),
    ],
  ],
  'rag-quantizacao-vetorial': [
    ([n, d, b], [cos]) => [
      rank('Ranking por produto interno', d > b ? 'A' : 'B'),
      rank('Ranking após normalizar A', cos > b ? 'A' : 'B'),
      cells('Norma usada na divisão', n, 'unidades'),
    ],
    ([range, x], [error]) => {
      const code = Math.round(((Math.min(x, range) + range) * 255) / (2 * range));
      return [
        cells('Coordenada que entra', x, 'unidades'),
        {
          ...cells('Código SQ8', code, 'de 255', 255),
          items: [{ label: code.toString(2).padStart(8, '0'), state: error ? 'warn' : 'active' }],
        },
        cells('Parcela cortada no extremo', error, 'unidades'),
      ];
    },
    ([used, n]) => [
      cells('Centros com pelo menos um vetor', used, 'códigos', 256),
      cells('Centros sem atribuição', 256 - used, 'códigos', 256),
      docs('Vetores por centro ativo, em média', n / used, 'vetores'),
    ],
    ([m, b, n], [prep, reads]) => [
      cells('Linhas da tabela ADC', m, 'linhas'),
      cells('Células preparadas por linha', 2 ** b, 'células'),
      cells('Consultas à tabela para ' + n + ' IDs', reads, 'acessos'),
    ],
    ([angle, a, b], [one, both]) => [
      vectorPair('Só A gira', angle, 0, a, b, one),
      vectorPair('Os dois giram', angle, angle, a, b, both),
    ],
    ([n, m, b], [single, total]) => [
      bucket('Tabelas no worker', n, 'tabelas'),
      cells('Entradas FP32 por tabela', m * 2 ** b, 'células'),
      page('RAM de todas as tabelas', total, 'MiB'),
    ],
    ([k, n, f], [read]) => [
      docs('Vizinhos ausentes da janela R', k - Math.min(k, n), 'IDs'),
      docs('Originais que chegaram a tempo', read, 'IDs'),
      docs('Leituras que perderam o prazo', Math.min(n, k) - read, 'IDs'),
    ],
    ([oracle], [old, fresh]) => [
      percent('Busca com os originais', oracle),
      percent('Códigos do PQ antigo', old),
      percent('Códigos do PQ retreinado', fresh),
    ],
    ([rate, duration, speed], [backlog, wait]) => [
      packets('Escritas que faltam na versão anterior', backlog),
      packets('Replay líquido', speed, 'eventos/s'),
      time('Até alcançar as escritas atuais', wait, 's'),
    ],
  ],
  'rag-ivf-e-shards': [
    ([n, p]) => [
      page('Páginas lidas em Flat', n),
      page('Páginas lidas em IVF', Math.ceil((n * p) / 100)),
      page('Páginas que o IVF pula', n - Math.ceil((n * p) / 100)),
    ],
    ([n, c, d]) => [
      docs('Vetores originais', n, 'vetores'),
      docs('Linhas duplicadas no treino', n * (c - 1), 'linhas'),
      docs('Outras origens coletadas', d, 'vetores'),
    ],
    ([active], [reserved, free]) => [
      page('Postings ocupados', active, 'MiB'),
      page('Memória reservada sem posting', free, 'MiB'),
    ],
    ([l, n, h], [extra]) => [
      bucket('Listas adicionais abertas', l, 'listas'),
      cells('Distâncias calculadas nessas listas', extra, 'distâncias'),
      docs('Vizinhos resgatados', h, 'IDs'),
    ],
    ([n, s, k], [read]) => [
      bucket('Sublistas que o roteador abre', Math.min(k, s), 'listas', s),
      docs('Itens lidos no pior conjunto', read),
      docs('Itens que deixou de ler', n - read),
    ],
    ([d, k], [cut, unite]) => [
      docs('Cópias do primeiro ID', 1 + d, 'cópias'),
      docs('IDs distintos cortando antes da união', cut, 'IDs'),
      docs('IDs distintos unindo antes do corte', unite, 'IDs'),
    ],
    ([a, r, n], [orphans, expected]) => [
      packets('Exclusões confirmadas', expected - orphans),
      docs('Postings ainda legíveis', orphans, 'postings'),
    ],
    ([water, n]) => [
      packets('Eventos contíguos aplicados', water),
      { ...packets('Buraco no log', 1), items: [{ label: '#' + (water + 1), state: 'warn' }] },
      packets('Recebidos depois da lacuna', n),
    ],
    ([shards, p], [ind, correlated]) => [
      bucket('Shards que precisam responder', shards, 'shards'),
      percent('Pedido atrasado se os atrasos forem independentes', ind),
      percent('Pedido atrasado se os shards atrasarem juntos', correlated),
    ],
  ],
  'evals-golden-set': [
    ([p, n], [chance, mean]) => [
      req('Conversas sorteadas', n, 'conversas'),
      check('Falhas esperadas na amostra', mean, 'falhas'),
      percent('Chance de observar ao menos uma', chance),
    ],
    ([ambiguous], [pending]) => [
      check('Referência já era suficiente', 80 - ambiguous),
      check('Resolvidos ao conferir a data', ambiguous - pending),
      check('Ainda precisam de outra referência', pending),
    ],
    ([families, n], [mixed, , unseen]) => [
      docs('Exemplos sorteados', families * n, 'exemplos'),
      docs('Famílias nos dois conjuntos, em média', mixed, 'famílias'),
      docs('Famílias só no teste, em média', unseen, 'famílias'),
    ],
    ([wins, losses]) => [
      check('Passaram a acertar', wins),
      check('Passaram a errar', losses),
      check('Mantiveram o resultado', 100 - wins - losses),
    ],
    ([n, k], [correct]) => [
      docs('Rótulos deslocados', k % n, 'posições'),
      check('Tarefas com o prazo correto', correct, 'tarefas'),
      check('Tipo correto mesmo com prazo errado', n - correct, 'tarefas'),
    ],
    ([n], [hint]) => [docs('IDs que revelam a sequência', hint, 'IDs'), docs('IDs sem a pista', n - hint, 'IDs')],
    ([blocks, groups]) => [
      bucket('Bloco reservado por rodada', 1, 'bloco'),
      docs('Grupos no teste por rodada', groups, 'grupos'),
      docs('Grupos no treino por rodada', (blocks - 1) * groups, 'grupos'),
    ],
    (_, [answers, abstentions]) => [
      docs('Esperam um prazo da API', answers, 'respostas'),
      docs('Esperam aviso de indisponibilidade', abstentions, 'respostas'),
    ],
  ],
  'evals-juiz': [
    ([n, missing]) => [
      docs('Fontes que informam prazo', n - missing, 'casos'),
      docs('Voltam para revisão da referência', missing, 'casos'),
    ],
    ([n, r], [order, all]) => [
      docs('Pares de respostas', n, 'pares'),
      check('Votos invertendo a ordem', order, 'votos'),
      check('Votos cruzando ordem e tamanho', all, 'votos'),
    ],
    (_, [pass, block]) => [
      check('Defeitos que o juiz aprova', pass, 'casos esperados'),
      check('Defeitos barrados', block, 'casos esperados'),
    ],
    ([more, less]) => [
      check('Só o novo juiz aprova', more),
      check('Só o juiz anterior aprova', less),
      check('Juízes concordam', 200 - more - less),
    ],
    ([signed], [visible]) => [
      docs('Pares sem assinatura desde o início', 24 - signed, 'pares'),
      docs('Assinaturas removidas', signed - visible, 'pares'),
      docs('Ainda revelam o modelo', visible, 'pares'),
    ],
    ([biased, good]) => [
      docs('Acertam só uma ordem', biased, 'pares'),
      docs('Acertam ambas', Math.min(24 - biased, good), 'pares'),
      docs('Erram ambas', 24 - biased - Math.min(24 - biased, good), 'pares'),
    ],
    ([slots, disagree], [left]) => [
      docs('Divergências na fila de revisão', Math.min(slots, disagree), 'pares'),
      docs('Pares estáveis sorteados', left, 'pares'),
      docs('Divergências que aguardam vaga', Math.max(0, disagree - slots), 'pares'),
    ],
    ([bad, s], [prob]) => [
      docs('Pares defeituosos entre 24', bad, 'pares', 24),
      docs('Retiradas sem reposição', s, 'pares', 24),
      percent('Chance de achar um desses erros', prob),
    ],
  ],
  'evals-tracing': [
    ([n], [unlinked]) => [
      req('Pedidos ligados ao span da GPU', n - unlinked),
      req('Pedidos sem ligação', unlinked),
    ],
    ([lex, vec, wait]) => [
      time('Busca lexical em paralelo', lex),
      time('Busca vetorial em paralelo', vec),
      time('Após as buscas, fila e primeiro token', wait + 40),
    ],
    ([n], [moved, split]) => [
      packets('Ficam no coletor original', n - moved, 'traces'),
      packets('Mudam com histórico', moved - split, 'traces'),
      packets('Histórico dividido', split, 'traces'),
    ],
    ([first, second], [received, stored]) => [
      packets('Perdidos antes da coleta', first, 'spans'),
      packets('Perdidos após coleta', second, 'spans'),
      packets('Chegam ao backend', stored, 'spans'),
    ],
    ([exec, exportDelay]) => [time('Execução no worker', exec), time('Transporte após o término', exportDelay)],
    ([n, c]) => [
      packets('Spans distintos com erro', n, 'spans'),
      packets('Cópias retransmitidas', n * (c - 1), 'spans'),
    ],
    ([rate, window, kib], [count, total]) => [
      packets('Traces retidos na janela', count, 'traces'),
      page('Payload de um trace', kib, 'KiB'),
      page('Payload retido', total, 'MiB'),
    ],
    ([n], [complete]) => [
      packets('Falhas com span terminal', complete, 'traces'),
      packets('Falta o fim da execução', n - complete, 'traces'),
    ],
  ],
  'evals-slo': [
    ([n, d, t], [late, excess]) => [
      req('Cancelaram antes ou no prazo', n - late),
      req('Prazo vencido antes do cancelamento', late),
      time('Tempo além do prazo', excess),
    ],
    ([a, b]) => [
      req('Mensagens das cem conversas em A', 100 * a, 'mensagens'),
      req('Mensagens das cem conversas em B', 100 * b, 'mensagens'),
    ],
    (_, [nominal, real]) => [
      time('Saldo consumindo na taxa prevista', nominal, 'dias'),
      time('Saldo no ritmo atual', real, 'dias'),
    ],
    ([n], [stuck]) => [
      req('Exigem leitor da versão nova', stuck, 'conversas'),
      req('Já convertidas para a versão estável', n - stuck, 'conversas'),
      req('Nunca mudaram de formato', 100 - n, 'conversas'),
    ],
    ([n, failed, healthy]) => [
      req('Falhas no minuto ruim', failed),
      req('Sucessos no minuto ruim', n - failed),
      req('Sucessos no minuto saudável', healthy),
    ],
    ([n, p]) => [
      req('Falharam neste tenant', Math.round((n * p) / 100)),
      req('Passaram neste tenant', n - Math.round((n * p) / 100)),
      req('Passaram nos outros tenants', 1000 - n),
    ],
    ([n, c, s]) => [
      req('Erros do canário após a troca', Math.min(n, c)),
      req('Erros da versão estável', s),
      req('Canário terminou sem erro', n - Math.min(n, c)),
    ],
    ([a, w, n], [pending, wait]) => [
      req('Rótulos já definitivos', 100 - pending, 'conversas'),
      req('Podem reabrir', pending, 'conversas'),
      time('Falta para fechar a janela', wait, 'dias'),
    ],
  ],
};

function vectorPair(label, angleA, angleB, a, b, squaredDistance) {
  return {
    ...cells(label, squaredDistance, 'L2²'),
    arrows: [
      { label: 'A', angle: angleA, length: a },
      { label: 'B', angle: angleB, length: b },
    ],
  };
}
