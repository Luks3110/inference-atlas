// Render both responsive widths using the course diagram palette and its SMIL playback controls.
function escapeText(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function text(x, y, value, style = 'label', anchor = 'middle') {
  return '<text class="ds-text ds-' + style + '" x="' + x + '" y="' + y + '" text-anchor="' + anchor + '">' + escapeText(value) + '</text>';
}

function box(x, y, w, h, state = 'idle', radius = 5) {
  return '<rect class="ds-box ds-' + state + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + radius + '"/>';
}

function edge(x1, y1, x2, y2, state) {
  const path = 'M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2;
  const mark = state === 'idle' ? '' : '<circle class="ds-dot ds-dot-' + state + '" r="2.7"><animateMotion path="' + path + '" dur="1.7s" repeatCount="indefinite"/></circle>';
  return '<path class="ds-wire ds-wire-' + state + '" d="' + path + '"/>' + mark;
}

function tile(x, y, w, title, value, state) {
  return box(x, y, w, 46, state) + text(x + w/2, y + 18, title) + text(x + w/2, y + 35, value, 'small');
}

function band(width, y, title, value, fraction, state = 'work') {
  const span = width - 44;
  let picture = text(22, y, title, 'small', 'start') + text(width - 22, y, value, 'small', 'end') + box(22, y + 7, span, 10, 'empty', 3);
  if (fraction > 0) picture += box(22, y + 7, span * Math.min(fraction, 1), 10, state, 3);
  return picture;
}

function triptych(width, y, labels, states) {
  const left = 18, gap = 7, cell = (width - 2*left - 2*gap)/3;
  return labels.map(([title, value], i) => tile(left + i*(cell + gap), y, cell, title, value, states[i])).join('');
}

function foot(width, heading, subheading) {
  return tile(17, 230, width - 34, heading, subheading, 'done');
}

function tokenization(i, width) {
  const data = [
    ['Histórico em turnos','Sistema + tools + conversa','1.000 conversas no manifesto',1,'Entrada formatada','4 componentes',1],
    ['O vocabulário segmenta','Duas revisões, mesmas entradas','Comparar pares por idioma',3,'Entradas pareadas','1.000 / 1.000',1],
    ['Conferência cliente / servidor','IDs locais contra IDs servidos','80 divergências de 1.000',0,'Contagens divergentes','8%',.08],
    ['Limite composto','32.768 − 2.048 = 30.720','Reservar a saída antes da admissão',1,'Entrada permitida','30.720 de 32.768',.9375],
    ['Mudou a faixa do corte','Novas recusas próximas da janela','20 antigas → 50 novas',1,'Recusas no candidato','5% dos pedidos',.05],
    ['Localizar o envelope repetido','80 conversas na rota legada','30 delas cruzaram o limite',0,'Afetadas no teto','30 / 80',.375],
    ['Serializar uma única vez','Rota preserva os papéis','20 recusas legítimas no replay',0,'Pares com a mesma contagem','1.000 / 1.000',1],
    ['Auditar tráfego posterior','148 / 8.000 acima da janela','1,85% ≤ teto de 2,5%',3,'Taxa observada / teto','1,85% / 2,5%',.74],
  ][i];
  const [heading, title, note, selected, metric, value, frac] = data;
  let svg = text(width/2, 26, heading, 'caption');
  const pieces = ['sistema','histórico','tools','usuário'];
  const gap = 5, unit = (width - 36 - 3*gap)/4;
  pieces.forEach((p, k) => {const x = 18 + k*(unit + gap);svg += box(x, 55, unit, 35, k === selected ? 'work':'idle') + text(x+unit/2, 77, p, 'small');});
  if (i === 5) svg += box(13, 47, width-26, 51, 'outline', 7) + text(width/2, 120, 'envelope do adaptador + envelope do servidor', 'small');
  else svg += edge(width/2, 92, width/2, 125, 'work') + text(width/2, 147, i === 3 ? 'entrada + resposta ≤ janela' : 'sequência final de IDs', 'small');
  return svg + band(width,185,metric,value,frac) + foot(width,title,note);
}

const points = [[.15,.63],[.26,.31],[.29,.64],[.42,.2],[.44,.73],[.47,.47],[.55,.55],[.59,.21],[.62,.49],[.72,.36],[.78,.75],[.88,.46]];
function embeddings(i, width) {
  const frames = [
    ['Vetor por contexto','Tokens ganham contexto no encoder.','Catálogo','1 milhão de trechos',1],
    ['Espaços A e B','Cada versão transforma consulta e texto.','Dimensões por vetor','768',1],
    ['Controle exato','Encontrar o alvo dentro dos 10 vizinhos.','Alvos encontrados','180 / 200',.9],
    ['Consulta em sombra','A geração nova recebe o mesmo replay.','Cobertura do catálogo','100%',1],
    ['Índice aproximado','O índice perde alvos encontrados no exato.','ANN contra busca exata','150 / 180',150/180],
    ['Busca mais profunda','A exploração maior chega a 42 ms no p95.','Alvos encontrados','170 / 200',.85],
    ['Filtro seletivo','Mais esforço apenas nos filtros raros.','Alvos encontrados','172 / 200',.86],
    ['Canário do par B','Encoder e índice mudam juntos.','Alvos em tráfego novo','432 / 500',.864],
  ];
  const [heading,note,metric,value,fraction] = frames[i];
  const left=22, w=width-44, top=47, h=98;
  let svg=text(width/2,24,heading,'caption')+box(left,top,w,h,'empty');
  const query=[left+w*.5,top+h*.48];
  const radius=[11,14,26,26,16,34,30,30][i];
  svg+='<circle class="ds-wire ds-wire-done" cx="'+query[0]+'" cy="'+query[1]+'" r="'+radius+'" stroke-dasharray="3 3"/>';
  for(const [x,y] of points) {
    const cx=left+x*w,cy=top+y*h,state=Math.hypot(cx-query[0],cy-query[1])<=radius?'done':'idle';
    svg+=box(cx-2.8,cy-2.8,5.6,5.6,state,3);
  }
  svg+=box(query[0]-4,query[1]-4,8,8,'work',2)+text(left+7,top+h-6,'Projeção ilustrativa em 2D','small','start');
  return svg+band(width,181,metric,value,fraction,'done')+foot(width,'Consulta e documentos na mesma geração',note);
}

function promptRegression(i,width) {
  const rows=['Início','Meio','Fim'];
  const counts=[
    ['—','—','—'],['A / B','A / B','A / B'],['100 casos','100 casos','100 casos'],['≥ 80%','≥ 80%','≥ 80%'],
    ['91%','63%','89%'],['—','26 ausentes','—'],['—','86%','—'],['45 / 50','42 / 50','44 / 50'],
  ][i];
  let svg=text(width/2,26,'Posição da evidência no prompt','caption');
  const first=72, end=width-92, segments=6, segmentWidth=(end-first)/segments;
  rows.forEach((name,ix)=>{
    const y=49+47*ix, marked=[0,2,5][ix];
    svg+=text(17,y+18,name,'small','start');
    for(let k=0;k<segments;k++) svg+=box(first+k*segmentWidth,y,segmentWidth-3,26,k===marked?(ix===1 && i===5?'empty':'work'):'idle',3);
    svg+=text(width-15,y+18,counts[ix],'small','end');
  });
  const notes=[
    ['Congelar artefatos','Modelo, prompt, template e ordem.'],['Variar uma revisão','A e B recebem a mesma pergunta.'],
    ['Mover uma única evidência','Preservar distratores e comprimento.'],['Piso por posição','A pior posição decide o gate.'],
    ['Regressão no meio','63% fica abaixo do piso de 80%.'],['26 de 37 erros perderam o trecho','Comparar fonte, resumo e entrada final.'],
    ['Preservar o extrato relevante','86 acertos em 100 no replay do meio.'],['Nova coorte · 150 cenários','Pior posição em 42/50 = 84%.'],
  ];
  return svg+foot(width,...notes[i]);
}

function schema(i,width) {
  const labels=['financeiro','entrega','revisar'];
  const states=[
    ['work','work','work'],['work','work','work'],['idle','idle','work'],['done','done','done'],
    ['work','work','idle'],['idle','idle','work'],['done','done','work'],['done','done','done'],
  ][i];
  const values=[
    ['2 destinos automáticos','1 fila humana'],['3 valores válidos','schema v1'],['850 automáticos','150 revisões'],['1 schema estável','frio → quente'],
    ['799 corretos / 850','94% automáticos'],['220 revisões','limite = 200'],['190 revisões','792 / 810 corretos'],['188 revisões','789 / 812 corretos'],
  ][i];
  const gap=6, unit=(width-36-gap*2)/3, origin=width/2;
  let svg=text(origin,25,'Campo obrigatório · destino','caption')+tile(origin-68,45,136,'objeto JSON','triagem_v1',i<4?'work':'idle');
  labels.forEach((name,k)=>{
    const x=18+k*(unit+gap);
    svg+=edge(origin,91,x+unit/2,130,states[k])+box(x,130,unit,36,states[k])+text(x+unit/2,153,name,'small');
  });
  return svg+foot(width,...values);
}

function routeWorkflow(i,width) {
  const notes=[
    ['Prazo conhecido → consulta fixa','1.600 previsíveis + 400 abertos'],['Dependências explícitas','1 chamada e uma leitura no caminho fixo.'],
    ['Orçamento compartilhado','Máximo de 8 chamadas por investigação.'],['Critério de promoção','≥ 90% resolvidos e média ≤ 3 chamadas.'],
    ['Todos pela pesquisa','91% resolvidos com 5 chamadas por pedido.'],['Rótulo ideal','1.840 resolvidos com média de 2 chamadas.'],
    ['Erro de rota','80 pesquisas entram no caminho fixo.'],['Transferir uma vez','1.834 / 2.000 resolvidos após recuperação.'],
  ];
  const left=17, gap=14, col=(width-2*left-gap)/2, right=left+col+gap, cx=width/2;
  let svg=text(cx,25,'Caminhos disponíveis por tipo de pedido','caption')+tile(cx-72,41,144,'Decisão de rota','escopo da tarefa','work');
  const a=i===4?'idle':'done', b=i<2?'idle':'work';
  svg+=edge(cx,87,left+col/2,121,a)+edge(cx,87,right+col/2,121,b);
  svg+=tile(left,121,col,'Workflow fixo',i===6?'80 pesquisas erradas':'consultar pedido',a);
  svg+=tile(right,121,col,'Pesquisa aberta',i===4?'todos os pedidos':'buscar evidências',b);
  if(i===7)svg+=edge(left+col/2,173,right+col/2,195,'work')+text(cx,215,'uma transferência','small');
  return svg+foot(width,...notes[i]);
}

function ledger(i,width) {
  const frames=[
    ['Manifesto · revisão do artigo',['Artigo','Revisão','Tarefa'],[['A17','r3','classe_v2'],['A18','r5','classe_v2'],['A19','r1','classe_v2']],2,'120 mil registros com identidade'],
    ['Partições · IDs independentes',['Partição','Entradas','Estado'],[['P1','20 mil','enviada'],['P2','20 mil','enviada'],['P3–P6','80 mil','enviadas']],0,'Seis jobs para a rodada de 4 h'],
    ['Primeira reconciliação',['Classe','IDs','Próximo passo'],[['Sucesso','118.800','publicar'],['Transitório','800','repetir'],['Restante','400','investigar']],0,'Conciliar por ID e revisão'],
    ['Duplicatas de leitura',['Fonte','Contagem','Unidade'],[['Arquivo','119.100','linhas'],['Manifesto','118.800','IDs distintos'],['Releitura','300','repetidas']],2,'A ordem dos arquivos pode mudar'],
    ['Falhas e pendências',['Classe','Contagem','Ação'],[['Transitória','800','reenviar'],['Definitiva','250','corrigir'],['Ausente','150','verificar job']],2,'Uma saída atrasada exige reconciliação'],
    ['Tentativa adicional',['Reenvio','Quantidade','Situação'],[['Entrada','800','mesmos IDs'],['Sucesso','760','concluídos'],['Persistente','40','diagnosticar']],1,'Cada tentativa preserva a identidade'],
    ['Condição de versão',['Antes','Resultado','Escrita'],[['119.710','disponíveis','conferir'],['20','antigos','bloquear'],['119.690','atuais','publicar']],1,'Comparar revisão antes da publicação'],
    ['Fechamento do manifesto',['Destino','Quantidade','Situação'],[['Publicáveis','119.690','entrega'],['Falhas','290','tratamento'],['Nova versão','20','nova fila']],0,'119.690 + 290 + 20 = 120.000'],
  ];
  const [heading,cols,rows,active,note]=frames[i], margin=18, col=(width-margin*2)/3;
  let svg=text(width/2,25,heading,'caption');
  cols.forEach((name,k)=>{svg+=text(margin+col*(k+.5),60,name,'small');});
  rows.forEach((row,j)=>{
    let y=72+41*j; svg+=box(margin,y,width-2*margin,32,j===active?'work':'idle',3);
    row.forEach((value,k)=>{svg+=text(margin+col*(k+.5),y+21,value,'small');});
  });
  return svg+foot(width,note,'Junção por chave do registro');
}

function generationLab(i,width) {
  const frames=[
    ['Saída típica / nova média','160 → 240 tokens','75% curtas + 25% longas',160,240,480,'tokens/pedido'],
    ['Capacidade com uma falha','190 < 231,5 req/s','Depois da mudança · dez réplicas úteis',190,231.5,250,'req/s'],
    ['N+1 no novo mix','247 ≥ 231,5 req/s','Treze saudáveis, quatorze provisionadas',247,231.5,250,'req/s'],
    ['TTFT p95 após drenagem','385 ≤ 400 ms','Observar fila durante a retirada',385,400,420,'ms'],
  ];
  const [heading,summary,note,x,y,scale,unit]=frames[i-4];
  const labels=[['Média antiga','Novo mix'],['Disponível','Pico'],['Disponível N−1','Pico'],['Mensurado','Teto de TTFT']][i-4];
  return text(width/2,27,heading,'caption')+band(width,73,labels[0],String(x).replace('.',',')+' '+unit,x/scale,'done')+
    band(width,138,labels[1],String(y).replace('.',',')+' '+unit,y/scale,'work')+foot(width,summary,note);
}

function idempotencyLab(i,width) {
  const rows=[
    ['Vinte entregas simultâneas','20 workers','1 intenção','1 recibo','Buscar por tenant e intenção','Mesma chave 73, mesmo conteúdo.'],
    ['Conflito de parâmetros','chave 73','outro horário','conflito','Interromper antes de escrever','Zero efeitos adicionais.'],
    ['Operação irmã · chave expirada','30 h depois','limite 24 h','reconciliar','Verificar o efeito remoto','A fila pode reentregar por até 48 h.'],
  ];
  const [heading,one,two,three,note,detail]=rows[i-5], gap=13, left=17, w=(width-2*left-2*gap)/3;
  let svg=text(width/2,28,heading,'caption');
  for(let k=0;k<2;k++){const x=left+w+k*(w+gap);svg+=edge(x,102,x+gap,102,k===0?'work':'done');}
  svg+=triptych(width,78,[['Tentativa',one],['Registro',two],['Decisão',three]],['work','idle','done']);
  return svg+foot(width,note,detail);
}


function attention(i,width) {
  const cx=width/2;
  if(i<=4) {
    const qList = [
      [['K₁','(1, 0)'],['K₂','(0, 1)'],['K₃','(10, 0)']],
      [['posição 1','1'],['posição 2','0'],['posição 3','10']],
      [['passado','1'],['atual','0'],['futuro','−∞']],
      [['α₁','0,7311'],['α₂','0,2689'],['α₃','0']],
      [['V₁ × α₁','(1,462; 0)'],['V₂ × α₂','(0; 1,076)'],['V₃ × α₃','(0; 0)']],
    ];
    const detail=[
      ['Q₂ = (√2, 0)','Três endereços e três posições.'],
      ['logits = Q₂Kᵀ / √2','O terceiro logit ainda lê o futuro.'],
      ['máscara da posição 2','Somente posições 1 e 2 podem contribuir.'],
      ['exp(0) + exp(−1)','Subtrair o máximo preserva as razões.'],
      ['saída da cabeça','(1,462; 1,076) ≈ α₁V₁ + α₂V₂'],
    ];
    let svg=text(cx,23,'Uma linha de atenção causal','caption')+
      triptych(width,48,qList[i],['done','work',i>=2?'empty':'idle']);
    if(i>=3) svg+=band(width,135,'Primeira posição','73,11%',.7311,'done')+band(width,180,'Segunda posição','26,89%',.2689,'work');
    else {
      const w=(width-76)/3;for(let k=0;k<3;k++){const x=38+w*k+w/2;svg+=edge(x,100,cx,177,k===2&&i===2?'idle':'work');}
      svg+=text(cx,199,i===0?'consulta sobre as chaves':i===1?'[1, 0, 10]':'[1, 0, −∞]','label');
    }
    return svg+foot(width,...detail[i]);
  }
  if(i===5) {
    const cy=120,r=48;
    let svg=text(cx,25,'RoPE · um par de canais','caption')+
     '<circle class="ds-wire ds-wire-idle" cx="'+cx+'" cy="'+cy+'" r="'+r+'"/>'+
     edge(cx,cy,cx+r,cy,'done')+edge(cx,cy,cx,cy-r,'work')+
     text(cx+r+8,cy+4,'K (1,0)','small','start')+text(cx,cy-r-12,'Q (0,1)','small')+
     text(cx,196,'Diferença angular de 90° → produto 0','small');
    return svg+foot(width,'Mesma rotação → produto preservado','O deslocamento aparece em R(mθ)ᵀR(nθ).');
  }
  if(i===6) {
    let svg=text(cx,25,'Quatro consultas por grupo KV','caption');
    const unit=(width-42)/8;
    for(let g=0;g<8;g++){
      const x=21+g*unit;svg+=box(x,119,unit-3,28,g===0?'work':'idle',3)+text(x+(unit-3)/2,137,'KV'+g,'small');
      for(let j=0;j<4;j++){const px=x+j*(unit-2)/4;svg+=box(px,65,(unit-2)/4-1,13,g===0?'done':'idle',2)+edge(px+2,78,x+(unit-3)/2,117,g===0?'work':'idle');}
    }
    return svg+text(cx,177,'32 Q → 8 grupos de K/V','label')+foot(width,'KV por token · 128 KiB','2 × 32 × 8 × 128 × 2 bytes.');
  }
  if(i===7) {
    const a=18,cell=15,base=49;
    let svg=text(cx,24,'Tiling de atenção plena','caption');
    for(let y=0;y<6;y++)for(let x=0;x<6;x++)svg+=box(a+x*cell,base+y*cell,cell-2,cell-2,x>y?'empty':y>=2&&y<=3&&x<2?'work':'idle',1);
    svg+=edge(a+98,base+44,width*.53,base+44,'work')+tile(width*.55,base+20,width*.40,'SRAM','máx., soma, saída','done')+
      text(cx,179,'HBM → blocos → acumulador da linha','small');
    return svg+foot(width,'8.192² × 2 B = 128 MiB','Uma matriz densa de scores por cabeça.');
  }
  return text(cx,25,'Recomposição do histórico KV','caption')+band(width,82,'Ocupação prévia','8.192 tokens · 1 GiB',1,'done')+
    triptych(width,135,[['Histórico','8.192'],['Entrada nova','+1'],['Próximo caso','8.193']],['done','work','idle'])+foot(width,'Mais 128 KiB para a próxima posição','Compare logits com a recomputação do prompt.');
}

function speculative(i,width) {
  const cx=width/2;
  if(i===3||i===4){
    const tokens=i===3?['B']:['A','B','C'];
    let svg=text(cx,26,i===3?'Aceitação da proposta B':'Massa residual após rejeitar A','caption');
    if(i===3) {
      svg+=band(width,76,'Draft · q(B)','0,20',.2,'idle')+band(width,138,'Target · p(B)','0,30',.3,'done');
      return svg+foot(width,'min(1, 0,30 / 0,20) = 1','A proposta B é aceita nesse prefixo.');
    }
    const p=[.5,.3,.2],q=[.6,.2,.2],unit=(width-42)/3;
    tokens.forEach((tok,j)=>{const x=21+j*unit;svg+=box(x,52,unit-5,100,j===1?'work':'idle')+
      text(x+unit/2,76,tok)+text(x+unit/2,100,'p = '+p[j].toFixed(1).replace('.',','),'small')+
      text(x+unit/2,122,'q = '+q[j].toFixed(1).replace('.',','),'small')+
      text(x+unit/2,183,j===1?'+0,1':'0','label');});
    return svg+foot(width,'(p − q) positivo = (0; 0,1; 0)','Após normalizar, o reparo seleciona B.');
  }
  if(i===6){
    const counts=[10,15,20,55],unit=(width-46)/4;
    let svg=text(cx,26,'Distribuição de tokens por rodada','caption');
    counts.forEach((n,k)=>{const x=23+k*unit,h=n*1.8;svg+=box(x+7,170-h,unit-14,h,k===3?'work':'done',3)+text(x+unit/2,158-h,n+'','small')+text(x+unit/2,192,(k+1)+' token'+(k===0?'':'s'),'small');});
    return svg+foot(width,'100 rodadas → 320 tokens','5 s medidos → 64 tokens/s.');
  }
  if(i===7) return text(cx,26,'Mesma janela de saturação · 60 s','caption')+
    band(width,74,'Target puro','27 pedidos/s úteis',27/30,'done')+band(width,136,'Com especulação','24 pedidos/s úteis',24/30,'work')+
    foot(width,'30 pedidos/s oferecidos','Somente respostas dentro do prazo contam.');
  const labels = {
    0:[['Prefixo','conhecido'],['Target','30 ms'],['Confirmado','1 token']],
    1:[['Proposta 1','B'],['Proposta 2','A | B'],['Proposta 3','C | B,A']],
    2:[['p₁','após prefixo'],['p₂','após B'],['p₃','após B,A']],
    5:[['Token 1','aceito'],['Token 2','aceito'],['Token 3','aceito']],
    8:[['Greedy','argmax'],['Amostral','frequências'],['Término','EOS / limite']],
  }[i];
  const notes={
    0:['Um token por avanço','A linha de base usa baixa concorrência.'],
    1:['Draft → três hipóteses privadas','Compartilhar vocabulário e IDs especiais.'],
    2:['A quarta distribuição é condicional','p₄ usa todo o caminho B,A,C.'],
    5:['p₄ → token bônus','Sem EOS ou limite, três aceitos entregam quatro.'],
    8:['Gate de implantação','Verificar KV e distribuição na retomada.'],
  }[i];
  let svg=text(cx,25,'Prefixo causal e decisões da rodada','caption')+triptych(width,69,labels,['done','work','idle']);
  svg+=edge(22,165,width-22,165,'work')+text(cx,194,i===5?'Bônus somente se todo o bloco for aceito':'Ordem de comprometimento dos tokens','small');
  return svg+foot(width,...notes);
}

const topics = {
  'atencao-gqa-rope': ['Matriz de atenção e memória', attention, 0],
  'speculative-decoding': ['Proposta e verificação causal', speculative, 0],
  'tokenizacao-em-producao': ['Fronteiras do prompt', tokenization, 0],
  'espacos-de-embeddings': ['Vizinhos de uma consulta', embeddings, 0],
  'regressoes-de-prompt': ['Evidência por posição', promptRegression, 0],
  'contratos-de-saida': ['Contrato de triagem', schema, 0],
  'workflow-ou-agente': ['Roteamento e recuperação', routeWorkflow, 0],
  'contrato-de-api-em-lote': ['Reconciliação do manifesto', ledger, 0],
  'economia-da-geracao': ['Capacidade sob mudança de mix', generationLab, 4],
  'execucao-idempotente-de-tools': ['Reentregas e efeitos remotos', idempotencyLab, 5],
};

export function modelScene(lesson, index) {
  const topic = topics[lesson.id];
  if (!topic || index < topic[2] || index >= lesson.steps.length) return null;
  const step = lesson.steps[index];
  return {
    title: topic[0], legend: ['Em análise', 'Confirmado'], description: step.title + '. ' + step.change,
    picture(mobile) {
      const width = mobile ? 350 : 610;
      const css = mobile ? 'dg-mobile' : 'dg-wide';
      return '<svg data-illustration aria-hidden="true" class="dg-map ds-map ' + css + '" viewBox="0 0 ' + width + ' 294">' + topic[1](index,width) + '</svg>';
    },
  };
}
