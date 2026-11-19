// Each drawing is a schematic of the lesson replay. The separate Faiss benchmark uses its own corpus.
function label(x, y, value, small = false, anchor = 'middle') {
  const safe = String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return '<text x="' + x + '" y="' + y + '" text-anchor="' + anchor + '" class="ds-text ds-' +
    (small ? 'small' : 'label') + '">' + safe + '</text>';
}

function rect(x, y, w, h, state = 'idle', r = 5) {
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r +
    '" class="ds-box ds-' + state + '"/>';
}

function line(x1,y1,x2,y2,state = 'idle', animate = false) {
  const d='M'+x1+' '+y1+' L'+x2+' '+y2;
  return '<path class="ds-wire ds-wire-'+state+'" d="'+d+'"/>' +
    (animate ? '<circle class="ds-dot ds-dot-'+state+'" r="2.5"><animateMotion path="'+d+'" dur="1.8s" repeatCount="indefinite"/></circle>' : '');
}

function chip(x,y,w,title,note,state) {
  return rect(x,y,w,43,state)+label(x+w/2,y+17,title)+label(x+w/2,y+33,note,true);
}

function footer(width,title,note) {
  return chip(15,235,width-30,title,note,'done');
}

function heading(width,title) {
  return label(width/2,23,title);
}

function rows(width, columns, data, active) {
  const start=16, cell=(width-start*2)/columns.length;
  let out=columns.map((s,i)=>label(start+cell*(i+.5),57,s,true)).join('');
  data.forEach((row,i)=>{
    const y=66+34*i;
    out+=rect(start,y,width-start*2,28,i===active?'work':'idle',3);
    row.forEach((s,j)=>{out+=label(start+cell*(j+.5),y+19,s,true);});
  });
  return out;
}

function bar(width,y,description,value,p,state='work') {
  const span=width-40;
  return label(20,y,description,true,'start')+label(width-20,y,value,true,'end')+
    rect(20,y+7,span,11,'empty',2)+rect(20,y+7,span*p,11,state,2);
}

function shardFan(width,local,global,other='4/4 leituras',partial=false) {
  const pad=12,gap=5,cell=(width-pad*2-gap*3)/4,cx=width/2;
  let out='';
  for(let k=0;k<4;k++) {
    const x=pad+k*(cell+gap), active=!(partial&&k===3);
    out+=chip(x,48,cell,'Shard '+(k+1),active?local:'atrasado',active?'done':'empty')+
      line(x+cell/2,91,cx,144,active?'done':'idle',active&&k===1);
  }
  return out+chip(cx-76,145,152,global,other,'work');
}

function layers(width,insert=false) {
  // Each repeated letter denotes the same vector at two heights.
  const levels=[
    { tag:'L2', ids:['A','D'], xs:[.22,.68], y:49 },
    { tag:'L1', ids:['A','B','D'], xs:[.22,.44,.68], y:107 },
    { tag:'L0', ids:['A','B','C','D','E','F','G'], xs:[.12,.25,.38,.53,.65,.78,.91], y:172 },
  ];
  const stateOf=(n,id)=>{
    if(insert) return n===2 && ['D','E','F'].includes(id)?'done':'idle';
    if(n===0) return 'work';
    if(n===1) return id==='D'?'work':'idle';
    if(n===2&&id==='E') return 'work';
    return n===2&&['C','D','F'].includes(id)?'done':'empty';
  };
  let out='';
  levels.forEach(({tag,ids,xs,y},n)=>{
    out+=label(9,y+3,tag,true,'start');
    for(let k=0;k<xs.length-1;k++){
      const visit=!insert && (n===0 || n===2&&k===3);
      out+=line(width*xs[k],y,width*xs[k+1],y,visit?'work':'idle',visit);
    }
    if(n===2)out+=line(width*xs[2],y-5,width*xs[4],y-5,'idle');
    if(n<2){
      const x=width*xs.at(-1),nextX=width*(n===0?.68:.53);
      out+=line(x,y+6,nextX,levels[n+1].y-8,insert?'idle':'work',!insert);
    }
    ids.forEach((id,k)=>{out+=rect(width*xs[k]-8,y-8,16,16,stateOf(n,id),8)+label(width*xs[k],y+4,id,true);});
  });
  if(insert){
    const x=width*.66,y=205;out+=line(x,y,width*.53,178,'work',true)+line(x,y,width*.78,178,'done',false)+rect(x-9,y-9,18,18,'work',9)+label(x,y+4,'N',true);
  } else out+=label(width/2,208,'A/B/G na base ficaram fora da expansão',true);
  return out;
}

function hnsw(i,width) {
  switch(i) {
    case 0: return heading(width,'Oráculo exato sob o filtro')+
      rows(width,['Escopo','Comparação','Saída'],[['Consulta','somente elegíveis','Flat L2'],['Por pergunta','distância + ID','10 IDs'],['1.000 consultas','mesmo snapshot','10.000 IDs']],1)+
      footer(width,'Denominador do recall@10','Oráculo e ANN usam a mesma autorização.');
    case 1: return heading(width,'HNSW · recorte de uma busca')+layers(width)+footer(width,'Topo → base → fronteira de candidatos','Esquema reduzido, sem escala do corpus.');
    case 2: return heading(width,'Inserção · vizinhos do novo vetor N')+layers(width,true)+footer(width,'M = 32 · efConstruction 100 ou 200','Esquema reduzido, sem escala do corpus.');
    case 3: return heading(width,'Memória antes das estruturas auxiliares')+
      bar(width,67,'Coordenadas FP32','30,72 GB',30.72/33.28,'done')+
      bar(width,123,'Links da camada base','2,56 GB',2.56/33.28)+
      label(width/2,194,'3.072 B + 256 B por vetor',false)+footer(width,'Subtotal para uma geração · 33,28 GB','Duas cópias chegam a 66,56 GB no subtotal.');
    case 4: return heading(width,'Variar exploração com o grafo fixo')+
      rows(width,['efSearch','Recall@10','p95'],[['32','0,91','19 ms'],['128','0,97','34 ms'],['Meta','≥ 0,95','≤ 40 ms']],1)+
      footer(width,'O replay escolhe a fronteira maior','Valores ilustrativos desta aula.');
    case 5: return heading(width,'Um filtro pode mudar o método por segmento')+
      rows(width,['Escopo','Ação','Risco / ganho'],[['Top global','filtrar após ANN','lista curta'],['Segmento denso','kNN filtrado','mais conexões'],['Poucos elegíveis','scan exato','todos permitidos']],2)+
      footer(width,'128 × 0,5% = 0,64 ID esperado','Estimativa sob amostragem uniforme.');
    case 6: return heading(width,'ID estável, revisão substituída')+
      rows(width,['Fonte','Revisão','Estado'],[['Base','ID 42 · v7','anterior'],['Delta','ID 42 · v8','atual'],['Leitura','v7 bloqueada','v8 elegível']],2)+
      footer(width,'O ponteiro vivo protege a leitura','IDs do desenho são ilustrativos.');
    case 7: return heading(width,'Reunir a fronteira de quatro partições')+shardFan(width,'até 40 IDs','Top-10 global','até 160 candidatos')+
      footer(width,'Refino FP32 dentro da união','Um candidato ausente localmente não retorna.');
    case 8: return heading(width,'Promoção após ensaio de falha')+
      rows(width,['Gate','Condição','Verificação'],[['Segmentos','recall ≥ 0,95','pior tenant'],['Cliente','p95 ≤ 40 ms','carga no pico'],['Infra','−1 réplica','revogações vivas']],2)+
      footer(width,'O leitor anterior continua recuperável','Propagar exclusões também no rollback.');
  }
}

function subspaces(width) {
  const span=width-36,gap=6,col=(span-gap*3)/4,start=18;
  let out=label(width/2,54,'Exemplo de quatro dos 96 subespaços',true);
  for(let k=0;k<4;k++){
    const x=start+(col+gap)*k, mid=x+col/2;
    out+=rect(x,67,col,27,'idle',3)+label(mid,85,'8 dim.',true)+
      line(mid,95,mid,117,k===1?'work':'idle',k===1)+rect(x,118,col,34,k===1?'work':'done',3)+
      label(mid,139,['c₁₂','c₃₁','c₀₇','c₂₅'][k],true);
  }
  return out+label(width/2,179,'1 ID de 8 bits por subespaço',true)+label(width/2,202,'768 / 96 = 8 dimensões por bloco');
}

function shortlist(width) {
  let out=label(width/2,49,'Os dez vizinhos exatos do oráculo',true);
  const start=16,gap=3,col=(width-start*2-9*gap)/10;
  for(let k=0;k<10;k++){
    const x=start+k*(col+gap);out+=rect(x,64,col,29,k<8?'done':'empty',3)+label(x+col/2,83,k+1,true);
  }
  out+=line(width/2,97,width/2,119,'work',true);
  return out+chip(width/2-87,122,174,'Shortlist de 40','8 alvos + 32 outros','work')+
    label(width/2,199,'Refino exato só reordena os 40 presentes.',true);
}
function quant(i,width) {
  switch(i) {
    case 0:return heading(width,'Um vetor original, antes de comprimir')+
      rows(width,['Componente','Bytes','Armazenado'],[['x₁ … x₇₆₈','4 por número','3.072 B'],['10 milhões','originais','30,72 GB'],['Oráculo','L2 exata','IDs top-k']],0)+
      footer(width,'Fixar métrica e snapshot','Mesmo filtro, mesmos IDs, mesma consulta.');
    case 1:return heading(width,'SQ8 · transformar cada coordenada em nível')+
      rows(width,['Escala','Níveis','Payload'],[['Faixa de xⱼ','0 … 255','1 B'],['768 eixos','768 códigos','768 B'],['Lista IVF','+ ID de 8 B','776 B']],1)+
      footer(width,'10 milhões × 776 B = 7,76 GB','Adicionar escalas e estruturas do índice.');
    case 2:return heading(width,'PQ · um codebook por bloco de coordenadas')+subspaces(width)+footer(width,'Cada codebook tem 256 centroides','Recorte ilustrativo, sem escala do corpus.');
    case 3:return heading(width,'ADC · selecionar e somar distâncias')+
      rows(width,['Subespaço','Byte do código','Termo da LUT'],[['1','12','D₁[12]'],['2','31','D₂[31]'],['… 96','j₉₆','D₉₆[j₉₆]']],1)+
      footer(width,'Distância aproximada = Σ Dᵢ[jᵢ]','96 × 256 valores FP32 = 96 KiB na tabela.');
    case 4:return heading(width,'OPQ · rotação antes da divisão')+
      rows(width,['Versão','Consulta','Coleção'],[['Referência','x em FP32','y em FP32'],['Controle','R × x','R × y'],['OPQ + PQ','R × x','96 B de código']],2)+
      footer(width,'A rotação plena preserva L2 exata','Meça a aproximação após a codificação.');
    case 5:return heading(width,'Contabilidade por representação')+
      rows(width,['Componente','Cálculo','Tamanho'],[['Códigos + IDs','104 B × N','1,04 GB'],['Codebooks','96 × 256 × 8 × 4','768 KiB'],['Originais','3.072 B × N','30,72 GB']],0)+
      footer(width,'N = 10 milhões de vetores','Originais podem residir em outra camada.');
    case 6:return heading(width,'Recall máximo após o reranking')+shortlist(width)+footer(width,'Teto desta shortlist · 8/10 = 0,80','Dois alvos ficaram fora da lista inicial.');
    case 7:return heading(width,'Drift · a média não explica cada segmento')+
      bar(width,73,'Geral','0,96',.96,'done')+bar(width,131,'Segmento novo','0,84',.84)+
      label(width/2,195,'Critério por segmento: recall@10 ≥ 0,93',true)+footer(width,'Recorte novo abaixo do piso','Verificar uso dos códigos e erro por domínio.');
    case 8:return heading(width,'O leitor aponta para uma geração indivisível')+
      rows(width,['Artefato','Ativo A','Canário B'],[['Transformação','Rₐ','Rᵦ'],['Codebooks','PQₐ','PQᵦ'],['Vetores','códigos A','códigos B'],['Oráculo','FP32','FP32']],2)+
      footer(width,'Mesmo watermark antes da troca','Reverter leitor, matriz e codebooks juntos.');
  }
}

function invertedLists(width,stage) {
  const left=53,range=width-78;
  const lengths=stage===4?[.96,.19,.19,.19]:[.72,.71,.72,.72];
  let out=label(width/2,45,stage===4?'Uma lista concentra vinte mil entradas.':'Recorte das 4.096 listas por shard',true);
  const active=stage===2?[2]:stage===4?[0,1]:[0,2];
  if(stage===2)out+=label(width-16,64,'vetor → centro C → lista C',true,'end');
  for(let j=0;j<4;j++){
    const y=75+j*31,isProbed=active.includes(j);
    out+=label(17,y+14,['A','B','C','D'][j],true,'start')+rect(left,y,range,18,'empty',3)+
      rect(left,y,range*lengths[j],18,isProbed?'work':'idle',3);
    // Internal separators denote posting records, not exact list lengths.
    for(let k=1;k<6;k++) out+=line(left+range*lengths[j]*k/6,y+3,left+range*lengths[j]*k/6,y+15,'idle');
    if(stage===2&&j===2)out+=line(width-20,y+9,left+range*lengths[j],y+9,'work',true);
  }
  return out;
}

function ivf(i,width) {
  switch(i) {
    case 0:return heading(width,'Onde o índice pode perder o vizinho')+
      rows(width,['Índice','Visita','Representação'],[['Flat','todos elegíveis','FP32'],['HNSW','grafo','FP32 aqui'],['IVFFlat','listas sondadas','FP32'],['IVFPQ','listas sondadas','códigos PQ']],2)+
      footer(width,'8.388.608 vetores de 256 dimensões','Replay comum entre as quatro alternativas.');
    case 1:return heading(width,'Treino grosso compartilhado')+
      rows(width,['Entrada','Quantizador','Destino'],[['524.288','k-means','4.096 centros'],['Shard 1 e 2','mesmo hash','dados locais'],['Shard 3 e 4','mesmo hash','dados locais']],0)+
      footer(width,'Amostra média/centro = 128','Centros e shards têm papéis diferentes.');
    case 2:return heading(width,'Inserção por centro mais próximo')+invertedLists(width,2)+
      footer(width,'2.097.152 / 4.096 = 512 por lista','Média sob equilíbrio; desenho fora de escala.');
    case 3:return heading(width,'nprobe escolhe quais listas ler')+invertedLists(width,3)+
      footer(width,'8 → 32 sondas por shard','Estimativa global: 16.384 → 65.536 entradas.');
    case 4:return heading(width,'Uma lista quente distorce o custo da consulta')+invertedLists(width,4)+
      footer(width,'20.000 + 7 × 512 = 23.584 no shard','8 sondas; 5,76× a hipótese uniforme.');
    case 5:return heading(width,'Fusão por distância e ID global')+shardFan(width,'10 IDs locais','Top-10 global','união de até 40 IDs')+
      footer(width,'Top local exato e shards disjuntos','Uma ordenação total comum preserva o top-10.');
    case 6:return heading(width,'Remover um ID durante o backfill')+
      rows(width,['Evento','Estado','Retorno'],[['r12 · inserir','presente','elegível'],['r13 · remover','tombstone','bloqueado'],['r12 · replay','versão antiga','bloqueado']],2)+
      footer(width,'Teste de leitura após revogação','Exemplo reduzido de revisões monotônicas.');
    case 7:return heading(width,'Manifesto de troca e watermark')+
      rows(width,['Shard','Geração B','Consistência'],[['1 e 2','hash de treino','watermark W'],['3','hash de treino','watermark W'],['4','hash de treino','aguarda W']],2)+
      footer(width,'Troca somente após 4/4 validados','A consulta fixa a geração até a fusão.');
    case 8:return heading(width,'Latência do fan-out e cobertura parcial')+
      shardFan(width,'respondeu','Coordenador','3/4 · cobertura parcial',true)+
      footer(width,'Gate: recall ≥ 0,95 e p95 ≤ 55 ms','Falha ilustrativa; tratar resposta parcial.');
  }
}

const topics = {
  'rag-indice-hnsw': ['HNSW · grafo multicamada', hnsw],
  'rag-quantizacao-vetorial': ['Códigos e ranking vetorial', quant],
  'rag-ivf-e-shards': ['Listas invertidas e shards', ivf],
};

export function vectorScene(lesson,index) {
  const topic=topics[lesson.id];
  if(!topic || !Number.isInteger(index) || index<0 || index>=9 || !lesson.steps[index]) return null;
  const step=lesson.steps[index];
  return {
    title:topic[0], legend:['Em análise','Retido'],
    description:step.title+'. '+step.change+' '+step.metrics.map(([k,v])=>k+' '+v).join('. ')+'. Ilustração do cenário da aula.',
    picture(mobile) {
      const w=mobile?350:610;
      return '<svg data-illustration aria-hidden="true" class="dg-map ds-map '+(mobile?'dg-mobile':'dg-wide')+
        '" viewBox="0 0 '+w+' 294">'+topic[1](index,w)+'</svg>';
    },
  };
}
