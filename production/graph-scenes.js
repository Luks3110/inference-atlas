// Domain diagrams share the course palette and native SVG playback controls.
function text(x, y, value, kind = 'label', anchor = 'middle') {
  const escaped = String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;');
  return `<text x="${x}" y="${y}" class="ds-text ds-${kind}" text-anchor="${anchor}">${escaped}</text>`;
}

function box(x, y, width, height, state = 'idle') {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" class="ds-box ds-${state}"/>`;
}

function card(x, y, width, title, value, state = 'idle') {
  return box(x, y, width, 46, state) + text(x + width / 2, y + 19, title) +
    text(x + width / 2, y + 35, value, 'small');
}

function path(points, state = 'work') {
  const route = points.map(([x, y], index) => (index ? 'L' : 'M') + x + ' ' + y).join(' ');
  return `<path d="${route}" class="ds-wire ds-wire-${state}"/>` +
    (state === 'idle' ? '' : `<circle r="2.8" class="ds-dot ds-dot-${state}"><animateMotion path="${route}" dur="2.3s" repeatCount="indefinite"/></circle>`);
}

function row(width, y, cells) {
  const gap = 8, unit = (width - 32 - (cells.length - 1) * gap) / cells.length;
  return cells.map(([name, value, state], i) => card(16 + i * (unit + gap), y, unit, name, value, state)).join('');
}

function fork(width, y, direction, states) {
  const edge = width / 4 + 6, mid = width / 2, far = width - edge;
  const trace = x => [[mid, y], [mid, y + 10], [x, y + 10], [x, y + 22]];
  return [edge, far].map((x, i) => {
    const points = trace(x);
    return path(direction === 'out' ? points : points.map(([px, py])=>[px, 2*y+22-py]).reverse(), states[i]);
  }).join('');
}

function graph(index, width) {
  const frames = [
    ['Caso de entrega', 'Estado com revisão', 'Pedido', 'Dados internos', 'Transportadora', 'Prova externa', 'Conjunto do caso', 'Origem e revisão', 'Resolver', 'Ainda sem decisão'],
    ['Estado do caso', 'Leituras independentes', 'Pedido', 'Revisão do pedido', 'Transportadora', 'Comprovante', 'Junção de evidências', 'Uma entrada por fonte', '500 casos', '1.000 leituras simuladas'],
    ['Dados reunidos', 'Roteamento explícito', 'Pedido', 'Versão conferida', 'Transportadora', 'Status disponível?', 'Regra de decisão', 'Prazo e tentativas', '3 destinos', 'Responder · tentar · revisar'],
    ['Replay fixo', '500 casos gravados', 'Pedido', 'Resposta gravada', 'Transportadora', 'Resposta gravada', 'Mesma sequência', 'Ordem original', '0 rotas diferentes', '80 conflitos na amostra'],
    ['Replay invertido', 'Mesmos 500 casos', 'Transportadora', 'Termina primeiro', 'Pedido', 'Termina depois', 'Campo único', 'Último status sobrescreve', '27 rotas alteradas', '27 dos 80 conflitos'],
    ['Replay invertido', 'Conservar as duas fontes', 'Pedido', 'Revisão por chave', 'Transportadora', 'Revisão por chave', 'Mapa por origem', 'Conflitos preservados', '80 conflitos', '0 origens perdidas'],
    ['60 threads antigas', 'Esquema v1', 'Com procedência', '52 reconstruíveis', 'Sem procedência', '8 para revisão', 'Estado convertido', 'Preservar origem', 'Migração', 'Repetir sem duplicar'],
    ['1.000 replays', 'Duas ordens', 'Pedido primeiro', '500 casos', 'Transportadora antes', '500 casos', 'Comparar decisões', 'Mesmos fatos e revisões', '0 divergências', '8 pendências explícitas'],
  ];
  const f = frames[index];
  const a = index === 1 || index === 4 || index === 6 ? 'work' : 'done';
  return row(width, 8, [[f[0], f[1], index === 0 ? 'work' : 'idle']]) +
    fork(width, 54, 'out', [a, a]) + row(width,76,[[f[2],f[3],a],[f[4],f[5],a]]) +
    fork(width,122,'in',[a, a]) + row(width,144,[[f[6],f[7],index===4||index===5?'work':'idle']]) +
    path([[width/2,190],[width/2,210]],index===4?'work':'done') +
    row(width,210,[[f[8],f[9],index===4?'work':'done']]);
}

function stream(index, width) {
  const mid = width / 2;
  if (index === 4) {
    const x=34, span=width-68, pos=t=>x+t/2100*span;
    return text(mid,37,'Primeiro conteúdo ao longo do tempo') +
      path([[x,118],[x+span,118]],'work') +
      box(pos(180)-4,111,8,14,'work') + text(pos(180),87,'180 ms') +
      text(pos(180),65,'Worker', 'small') + box(pos(2100)-4,111,8,14,'done') +
      text(pos(2100),153,'2,1 s') + text(pos(2100),175,'Tela','small') +
      row(width,201,[['16 deltas do produtor','O proxy liberou o grupo de uma vez.','work']]);
  }
  if (index === 5 || index === 6) {
    const expired = index===5;
    return text(mid,36, expired?'Reconexão após 95 s de suspensão':'Retomada com fotografia e watermark') +
      row(width,59,expired?[['Interface','Cursor 44','work'],['Log retido','A partir de 51','done']]:
        [['Snapshot','Inclui até 58','done'],['Log ordenado','Evento 59','work']]) +
      text(mid,142,expired?'45   46   47   48   49   50':'…   57   58   |   59   →', 'caption') +
      text(mid,163,expired?'Seis eventos já expiraram':'Fronteira entre snapshot e sufixo','small') +
      path([[mid,173],[mid,195]],'work') +
      row(width,195,[[expired?'Carregar fotografia':'Aplicar depois de 58',
        expired?'O sufixo sozinho não recompõe a mensagem.':'O evento 59 continua disponível no log.','work']]);
  }
  return text(mid,31,'Duas leituras do mesmo run') +
    row(width,54,[['Cliente A','Reentrega','work'],['Cliente B','Recarga','work']]) +
    fork(width,100,'in',['done','done']) +
    row(width,122,[['Documento final','Texto e estado das tools','done']]) +
    path([[mid,168],[mid,190]],'done') +
    row(width,190,[['120 reconexões','0 hashes divergentes · pintura p95 310 ms','done']]);
}

function checkpoints(index, width) {
  // The second half traces another proposal whose amount was corrected.
  const states = [
    ['120 propostas','Revisão 1','Checkpoint','120 estados','Próximo nó','Preparar aprovação','Identidade preservada','Retomar a thread autorizada'],
    ['Proposta 73','R$ 120 · revisão 1','Aprovação','Termos congelados','Interrupt','Esperar decisão','Retomada do nó','Revalidar os termos mostrados'],
    ['Decisão aprovada','Mesma revisão','Transação','1 intenção','Outbox','1 linha','Chave do provedor','Uma identidade para as tentativas'],
    ['Retorno perdido','Status desconhecido','Provedor','1 recibo','Ledger local','1 confirmação','Conciliado','0 pendências deste caso'],
    ['Outro pedido','Revisão atual 2','Tela anterior','R$ 120 · v1','Termos atuais','R$ 80 · v2','Revisão obsoleta','Não criar intenção externa'],
    ['Aprovação da v2','Duas confirmações','Conexão A','Primeira transição','Conexão B','Encontra o recibo','Uma transação','1 aprovação · 1 outbox nova'],
    ['Lease expirado','Mesma intenção','Worker A','Geração 7','Worker B','Geração 8','Uma chave externa','Só a geração 8 pode confirmar localmente'],
    ['Entrega repetida','4 notificações','Callback','Mesmo recibo','Reconciliação','Mesmo recibo','Uma baixa','1 recibo lógico · 1 lançamento'],
  ];
  const [top,sub,l,ls,r,rs,end,es]=states[index];
  const mid=width/2;
  return row(width,16,[[top,sub,index===0?'work':'idle']]) +
    fork(width,62,'out',[index===4||index===6?'idle':'work','work']) +
    row(width,84,[[l,ls,index===4||index===6?'empty':'work'],[r,rs,'work']]) +
    fork(width,130,'in',[index===4||index===6?'idle':'done','done']) +
    row(width,152,[[end,es,index===4?'work':'done']]) +
    text(mid,232,index<4?'Rastreamento da intenção inicial':'Revisão, posse e confirmação','caption');
}

function memory(index, width) {
  const frames = [
    ['A', 'Histórico A','B','Histórico B','Perfil do usuário','Preferências entre threads','Dois escopos','Histórico e perfil'],
    ['Tenant A','ID local igual','Tenant B','ID local igual','Autoridade da sessão','Namespaces separados','Teste de leitura','0 resultados cruzados'],
    ['Mensagem nova','Um run ativo','Segunda mensagem','Uma pendência','Fila da thread','Processar pela ordem de admissão','Deduplicar','Por identidade da mensagem'],
    ['Thread A','Leitura da rev. 7','Thread B','Leitura da rev. 7','Store compartilhado','Dois campos no perfil','Revisão base','7'],
    ['Thread A','Alterar idioma','Thread B','Alterar fuso','Snapshot compartilhado','Ambas leram a revisão 7','Risco','Sobrescrever o outro campo'],
    ['Thread A','Grava revisão 8','Thread B','CAS falha · reler 8','Patch de fuso','Conservar idioma de A','Revisão publicada','9'],
    ['Store','Revisão 9','Cache do worker','Revisão 7','Leitura do fluxo','Exigir a revisão confirmada','Fallback','Consultar o store'],
    ['Tenant A','Perfil do teste','Tenant B','ID local igual','500 pares concorrentes','Revisão e escopo verificados','0 perdas','0 leituras cruzadas no ensaio'],
  ];
  const [a,av,b,bv,common,detail,last,sub]=frames[index], mid=width/2, isolated=index===1||index===7;
  return text(mid,31,isolated?'Fronteira entre tenants':'Conversas e memória compartilhada') +
    row(width,51,[[a,av,index===6?'done':'work'],[b,bv,index===6?'empty':'work']]) +
    (isolated?text(mid,119,'Escopo conferido para cada leitura','small'):fork(width,97,'in',['done',index===5?'work':'done'])) +
    row(width,129,[[common,detail,index===4||index===6?'work':'idle']]) +
    path([[mid,175],[mid,195]],'done') + row(width,195,[[last,sub,'done']]);
}

function budget(index, width) {
  const toolCounts=[7168,4096,4096,4096];
  const historyCounts=[17920,17920,16896,16896];
  const n=index-4, tools=toolCounts[n], history=historyCounts[n], total=1536+tools+history+5120+1024+4096;
  const values=[['Instruções',1536],['Tools',tools],['Evidências',5120],['Histórico',history],['Saída + margem',5120]];
  const formatter=new Intl.NumberFormat('pt-BR');
  const x=width<400?100:130, valueX=width-18, barWidth=valueX-x-53;
  let svg=text(width/2,28,'Componentes da janela de 32.768 tokens');
  values.forEach(([name,value],i)=>{
    const y=55+i*30;
    svg+=text(16,y+13,name,'small','start')+box(x,y,barWidth,16,'empty')+
      box(x,y,barWidth*value/17920,16,(i===1&&index<=5)||(i===3&&index>=6)?'work':'done')+
      text(valueX,y+13,formatter.format(value),'small','end');
  });
  const excess=total-32768;
  return svg+row(width,209,[[excess?'Excesso de '+formatter.format(excess)+' tokens':'Envelope final · 32.768 tokens',
    index===7?'240 roteiros · 2 erros de seleção de tool':formatter.format(total)+' tokens com saída e margem',excess?'work':'done']]);
}

function ttl(index, width) {
  const frames = [
    ['Origem','Marcador sintético','Índice','Cache','Resumo','Checkpoint','Quatro destinos','Rastrear a origem de cada derivado'],
    ['Revogação','12 → 13','Índice','Cache','Resumo','Checkpoint','Leitura bloqueada','0 resultados públicos do marcador'],
    ['Fila de remoção','4 tarefas','Confirmado','Confirmado','Confirmado','Pendente','Progresso','3 concluídas · 1 pendente'],
    ['Restauro isolado','1 backup de teste','Índice','Cache','Resumo','Checkpoint','Reaplicar revogações','0 reexposições no ensaio'],
    ['Indexador em voo','Leu a rev. 12','Receber','Calcular','Pausar','Gravar?','Revogação já publicada','Job atrasado em 45 s'],
    ['Commit condicional','12 obsoleta · 13 exigida','Ler 12','Revogar','Comparar','Recusar','Barreira de publicação','0 commits antigos aceitos'],
    ['Inventário legado','Namespace de staging','Índice','Órfão A','Órfão B','Órfão C','3 objetos a remover','0 expostos pela busca pública'],
    ['Restauro sob carga','2 backups · 3 workers','Índice','Cache','Resumo','Checkpoint','Visibilidade reaberta','0 reexposições no teste'],
  ];
  const [head,headValue,...rest]=frames[index], mid=width/2, labels=rest.slice(0,4);
  let svg=row(width,16,[[head,headValue,'work']])+path([[mid,62],[mid,85]],'work');
  const cw=(width-44)/4;
  labels.forEach((name,i)=>{
    const x=16+i*(cw+4);
    const state=(index===2&&i===3)||(index===6&&i>0)||(index===4&&i===3)?'work':index===0?'idle':'done';
    svg+=box(x,96,cw,40,state)+text(x+cw/2,120,name,'small');
  });
  svg+=path([[mid,140],[mid,168]],'done');
  return svg+row(width,168,[[rest[4],rest[5],index===4||index===6?'work':'done']]);
}

const charts={
  'grafo-estado-explicito':['Estado e ordem dos ramos',graph],
  'streaming-grafo-interface':['Retomada e entrega ao navegador',stream],
  'checkpoints-e-efeitos':['Intenção, revisão e recibo',checkpoints],
  'memoria-por-conversa':['Histórico, perfil e concorrência',memory],
  'orcamento-de-contexto':['Orçamento após mudar as tools',budget],
  'retencao-e-esquecimento':['Versões e remoção dos derivados',ttl],
};

export function graphScene(lesson,index) {
  const chart=charts[lesson.id], step=lesson.steps[index];
  if(!chart || !step || index>7) return null;
  if(index<4 && ['streaming-grafo-interface','orcamento-de-contexto'].includes(lesson.id)) return null;
  return {
    title:chart[0], description:[step.change||step.title, ...(step.metrics||[]).map(([name,value])=>name+' '+value)].join('. '),
    legend:['Em análise','Estado observado'],
    picture(mobile) {
      const width=mobile?350:610;
      return `<svg data-illustration aria-hidden="true" class="dg-map ds-map ${mobile?'dg-mobile':'dg-wide'}" viewBox="0 0 ${width} 270">${chart[1](index,width)}</svg>`;
    },
  };
}
