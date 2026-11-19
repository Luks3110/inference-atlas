// Each frame visualizes the fixed replay in inference-cases.js or platform-cases.js.
// Coordinates are recomputed on phones, so group labels remain readable at both widths.
const xml = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function text(x, y, value, style = 'label', anchor = 'middle') {
  return `<text x="${x}" y="${y}" class="ds-text ds-${style}" text-anchor="${anchor}">${xml(value)}</text>`;
}
function rect(x, y, w, h, state = 'idle', radius = 5) {
  return `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${h}" rx="${radius}" class="ds-box ds-${state}"/>`;
}
function wire(x1, y1, x2, y2, moving = true) {
  const d = `M${x1} ${y1}L${x2} ${y2}`;
  return `<path d="${d}" class="ds-wire ds-wire-${moving ? 'work' : 'idle'}"/>` +
    (moving ? `<circle r="2.4" class="ds-dot ds-dot-work"><animateMotion path="${d}" dur="2.1s" repeatCount="indefinite"/></circle>` : '');
}
function wrap(width, y, sentence) {
  const max = Math.floor((width - 36) / 6.3);
  const lines = [''];
  for(const word of sentence.split(' ')){
    const i = lines.length - 1;
    if(lines[i] && lines[i].length + 1 + word.length > max) lines.push(word);
    else lines[i] += (lines[i] ? ' ' : '') + word;
  }
  return lines.map((line,i)=>text(width/2,y+i*14,line,'small')).join('');
}
const barY = (i,n) => 73 + i * Math.min(37, 115 / Math.max(1, n-1));

// All bars in a frame have a single, explicit unit. The note supplies the denominator.
function bars(w, title, unit, maximum, entries) {
  const offset=w<400?100:135, span=w-offset-67;
  let content=text(w/2,38,title,'caption');
  entries.forEach(([label,value,formatted,state='done'],i)=>{
    const y=barY(i,entries.length);
    content+=text(offset-9,y+13,label,'small','end')+rect(offset,y,span,18,'track',3)+
      (value>0?rect(offset,y,span*value/maximum,18,state,3):'')+
      text(w-13,y+13,formatted,'small','end');
  });
  return content+text(w/2,215,unit,'small');
}
function table(w, title, headers, entries, highlight = -1) {
  const x=13, gap=3, width=w-2*x;
  const columns=headers.length, fractions=columns===2?[.43,.57]:[.37,.30,.33];
  const xs=fractions.map((_,i)=>x+width*fractions.slice(0,i).reduce((n,f)=>n+f,0));
  let content=text(w/2,38,title,'caption');
  headers.forEach((name,i)=>{content+=text(xs[i]+5,68,name,'small','start')});
  const rh=Math.min(36,134/entries.length);
  entries.forEach((entry,i)=>{
    const y=78+i*rh;
    content+=rect(x,y,width,rh-gap,i===highlight?'work':'idle',3);
    entry.forEach((v,k)=>{content+=text(xs[k]+5,y+rh*.59,v,'small','start')});
  });
  return content;
}
function events(w, title, items, selected, note) {
  const x=35, right=w-35, dy=30, d=(right-x)/(items.length-1);
  let content=text(w/2,38,title,'caption')+wire(x,126,right,126);
  for(const [i,[label,value]] of items.entries()) {
    const cx=x+i*d, up=i%2===0;
    content+=rect(cx-5,120,10,12,i===selected?'work':'done',3)+
      text(cx,up?126-dy:126+dy,label,'small')+text(cx,up?126-dy-18:126+dy+18,value,'small');
  }
  return content+text(w/2,215,note,'small');
}
function strip(w,title,unit,caption,segments) {
  const left=19, span=w-2*left, sum=segments.reduce((t,s)=>t+s[1],0);
  let content=text(w/2,38,title,'caption'), x=left;
  for(const [label,value,state] of segments) {
    const width=span*value/sum;
    content+=rect(x,83,width-1,34,state,3);
    if (width>44) content+=text(x+width/2,105,label,'small');
    x+=width;
  }
  const rows=segments.length>3?2:1, cols=Math.ceil(segments.length/rows);
  segments.forEach(([label,value,state],i)=>{
    const col=i%cols, row=Math.floor(i/cols), cx=left+col*span/cols;
    content+=rect(cx,145+row*23,8,8,state,2)+text(cx+12,153+row*23,label+' · '+value,'small','start');
  });
  return content+text(w/2,207,unit+' · '+caption,'small');
}

function training(w,i) {
  switch(i) {
    case 0: return strip(w,'Divisão cronológica · 150 mil chamados','Unidade','mil chamados em ordem temporal',[['Treino',120,'done'],['Validação',20,'work'],['Teste',10,'idle']]);
    case 1: return table(w,'Auditoria no instante da previsão',['Atributo','Disponível na abertura?'],[['Texto do chamado','Sim'],['Canal de origem','Sim'],['Equipe final','Somente após resolução'],['Conjunto válido','23 de 24 campos']],2);
    case 2: return table(w,'Um pacote reproduzível da v8',['Componente','Artefato registrado'],[['Entrada','23 campos validados'],['Pré-processamento','Vocabulário e normalização'],['Classes','Ordem das saídas'],['Modelo','Pesos treinados com 120 mil']],3);
    case 3: return table(w,'Corte da validação · 20 mil chamados',['Classe real','Gerou alerta','Sem alerta'],[['Urgente','1.860','140'],['Outros','540','17.460'],['Total','2.400','17.600']],0);
    case 4: return bars(w,'Urgências encontradas no teste final','1.000 urgências reais · +40 na v8',1000,[['Modelo v7',880,'880'],['Modelo v8',920,'920','work']]);
    case 5: return strip(w,'Campo canal de origem no shadow','Unidade','chamadas observadas',[['Presente',4800,'done'],['Ausente',200,'work']]);
    case 6: return strip(w,'Roteamento de 20 mil entradas','Unidade','chamados no canário',[['v7 controle',19000,'done'],['v8 canário',1000,'work']]);
    case 7: return strip(w,'Após a chegada dos rótulos','Unidade','casos urgentes atendidos pela v8',[['Recuperados',92,'done'],['Perdidos',8,'work']]);
  }
}

function serving(w,i) {
  const frames=[
    ['Inventário do host',[['GPU visível','1 dispositivo'],['Memória total','24 GiB'],['vLLM','0 servidores ativos']],0],
    ['Configuração do processo',[['Checkpoint','Qwen2.5-1.5B-Instruct'],['Contexto máximo','4.096 tokens'],['Socket local','127.0.0.1:8000']],1],
    ['/health e admissão',[['Carga em andamento','0 prontas'],['Saúde confirmada','1 pronta'],['Antes de pronto','0 req/s']],1],
    ['Contrato de descoberta do modelo',[['Método','GET /v1/models'],['Campo consumido','data[].id'],['ID servido','Qwen/Qwen2.5-1.5B-Instruct']],2],
    ['Primeira resposta de chat',[['Endpoint','/v1/chat/completions'],['Teto pedido','64 tokens'],['Conferir resposta','choice, finish_reason, usage']],2],
    ['Segunda chamada com stream',[['Cliente','stream=true, curl -N'],['Durante geração','deltas textuais'],['Ao encerrar','juntar deltas e conferir fim']],1],
    ['Solicitação negativa de contrato',[['Terceira chamada','modelo fora do catálogo'],['API','resposta esperada 4xx'],['Engine','2 inferências válidas até aqui']],1],
    ['Ensaio de carga local',[['Chegadas','720 pedidos válidos em 60 s'],['Fila','máximo 7 → 0 no fim'],['TTFT no cliente','p95 340 ms · teto 400 ms']],2],
  ];
  const [title,entries,selected]=frames[i];
  return table(w,title,['Ponto observado','Valor do ensaio'],entries,selected);
}

function quant(w,i) {
  switch(i) {
    case 0:return strip(w,'Baseline na avaliação congelada','Unidade','casos do modelo BF16',[['Corretos',468,'done'],['Outros',32,'work']]);
    case 1:return bars(w,'Payload ideal para 8 bilhões de pesos','GB decimais · somente a representação dos pesos',16,[['BF16',16,'16 GB'],['INT4 ideal',4,'4 GB','work']]);
    case 2:return table(w,'Calibração separada da avaliação',['Conjunto','Cobertura observada'],[['Calibração','800 prompts · 2 idiomas'],['Minoritário','Poucos exemplos'],['Avaliação fixa','500 casos, mantidos à parte']],1);
    case 3:return strip(w,'Memória dos pesos em comparação aos 16 GB de BF16','Unidade','GB decimais · KV permanece BF16',[['INT4 ideal',4,'done'],['Sobrecarga',1,'work'],['Poupado',11,'empty']]);
    case 4:return table(w,'O total esconde a regressão por idioma',['Avaliação','BF16','INT4 A'],[['Global / 500','468','464'],['Crítico / 100','90','84'],['Demais / 400','378','380']],1);
    case 5:return table(w,'Segundo candidato, mesma avaliação',['Avaliação','BF16','INT4 B'],[['Global / 500','468','466'],['Crítico / 100','90','89'],['Demais / 400','378','377']],1);
    case 6:return bars(w,'Tempo até o primeiro token sob o mesmo mix','TTFT p95 · milissegundos',400,[['BF16',330,'330 ms'],['INT4 B',350,'350 ms','work'],['Teto',400,'400 ms','empty']]);
    case 7:return bars(w,'Capacidade útil medida antes da violação','Requisições por segundo atendidas no SLO',16,[['BF16',12,'12 req/s'],['INT4 B',16,'16 req/s','work']]);
  }
}

// Each row is one sequence; a column is a scheduler iteration, never a wall-clock unit.
function batching(w,i) {
  const empty='·';
  const regular=[
    [['P1'],['P1'],[]],
    [['P1'],['P1'],['fila']],
    [['P1','D2'],['P1','fim'],['fila','fila']],
    [['P1','D2','D3'],['P1','fim','—'],['fila','fila','fila']],
    [['P1','D2','D3'],['P1','fim','—'],['fila','fila','P1']],
    [['P1','D2','D3','fim'],['P1','fim','—','—'],['fila','fila','P1','fim']],
  ];
  if(i<6){
    const data=regular[i], names=['Ana','Bia','Caio'], left=51, span=w-left-15, cols=4, cell=span/cols;
    let content=text(w/2,30,i===3?'Contrafactual · o lote fica fixo':'Dois slots de sequência · lote contínuo','caption');
    for(let j=0;j<cols;j++) content+=text(left+(j+.5)*cell,62,'iter. '+(j+1),'small');
    data.forEach((row,r)=>{
      const y=77+r*36;
      content+=text(left-6,y+18,names[r],'small','end');
      for(let c=0;c<cols;c++){
        const v=row[c]??empty;
        const state=v==='fila'?'work':v==='fim'?'done':v===empty||v==='—'?'empty':'idle';
        content+=rect(left+c*cell,y,cell-3,28,state,3)+text(left+(c+.5)*cell-1,y+18,v,'small');
      }
    });
    const notes=['P1 = prefill com primeira saída.','Caio chega depois de terminar a iteração 1.','Bia libera o slot ao produzir seu EOS.','A vaga fica ociosa e Caio segue na fila.','Caio usa prefill e Ana usa decode na mesma iteração.','Ana e Caio terminam na quarta iteração.'];
    return content+text(w/2,211,notes[i],'small');
  }
  if(i===6) return bars(w,'Oito tokens de saída nos dois planos','Iterações necessárias para concluir as três sequências',6,[['Lote fixo',6,'6 iter.'],['Contínuo',4,'4 iter.','work']]);
  return strip(w,'Primeira fatia de um prompt de 20 tokens','Unidade','posições processadas nesta iteração',[['Decode Ana',1,'done'],['Prefill Caio',11,'work']]);
}

function prefix(w,i) {
  if(i===2) return bars(w,'TTFT do mesmo caminho com e sem prefixo local','Decode permanece a 25 ms/token',480,[['Frio',480,'480 ms'],['Quente',170,'170 ms','work']]);
  if(i===7) return bars(w,'Prefill feito em cem chamadas','80 hits completos + 20 chamadas frias',108800,[['Sem cache',108800,'108.800'],['Com cache',26880,'26.880','work']]);
  const mobile=w<400, perRow=mobile?16:32, size=Math.min(16,(w-42)/perRow), start=(w-size*perRow)/2;
  const valid=[0,64,0,0,64,0,48][i];
  const descriptions=['Primeira chamada · 64 blocos novos','Pergunta nova · 64 blocos reutilizados','','Identificação muda desde o primeiro token','Manual antes da parte variável','Réplica B · seu pool começa vazio','48 blocos iniciais permanecem'];
  let content=text(w/2,35,descriptions[i],'caption');
  for(let k=0;k<64;k++) {
    const state=k<valid?'done':i===0?'work':'empty';
    content+=rect(start+(k%perRow)*size,70+Math.floor(k/perRow)*size,size-2,size-2,state,2);
  }
  const footer= i===5?'Réplica A conserva 64 blocos. B precisa recalcular.':'Cada célula representa 16 tokens do manual.';
  content+=text(w/2,159,'Manual · 1.024 tokens / 64 blocos','small')+text(w/2,182,'Sufixo exclusivo · 64 tokens','small')+wrap(w,211,footer);
  return content;
}

function devices(w, title, sets, legend) {
  let out=text(w/2,35,title,'caption');
  const cols=Math.min(sets.length,2), cw=(w-38-(cols-1)*8)/cols;
  sets.forEach(([name,chips,role,state],i)=>{
    const x=19+(i%cols)*(cw+8), y=54+Math.floor(i/cols)*63;
    out+=rect(x,y,cw,57,state)+text(x+7,y+15,name,'small','start');
    const chipw=(cw-20)/chips.length;
    chips.forEach((c,k)=>{const gx=x+7+k*chipw;out+=rect(gx,y+23,chipw-4,22,c==='×'?'empty':'idle',2)+text(gx+(chipw-4)/2,y+37,c,'small')});
    if(role)out+=text(x+cw-7,y+15,role,'small','end');
  });
  return out+wrap(w,203,legend);
}

function parallel(w,i) {
  if(i===0) return bars(w,'Os pesos ultrapassam uma GPU','GiB antes de runtime e KV cache',59.6,[['Pesos BF16',59.6,'59,6 GiB','work'],['VRAM/GPU',48,'48 GiB']]);
  if(i===1) return devices(w,'TP=2 dentro de um nó',[['Nó A',['W/2','W/2'],'TP=2','work']],'Duas GPUs com aproximadamente 29,8 GiB de pesos cada trocam resultados parciais nas camadas.');
  if(i===2||i===3){
    const batches=i===2?1:7, slots=batches+1, left=52, dx=(w-left-12)/slots;
    let out=text(w/2,35,'Dois estágios de pipeline com duração igual','caption');
    for(let r=0;r<2;r++) {
      const y=79+49*r;
      out+=text(left-5,y+21,'PP '+(r+1),'small','end');
      for(let k=0;k<slots;k++) {
        const b=k-r+1, busy=b>=1&&b<=batches;
        out+=rect(left+k*dx,y,dx-3,33,busy?(r===0?'work':'done'):'empty',3)+text(left+(k+.5)*dx-1,y+20,busy?'m'+b:'·','small');
      }
    }
    return out+wrap(w,190,i===2?'Um micro-lote: dois slots ativos entre quatro. Os estágios trabalham em momentos distintos.':'Sete micro-lotes: quatorze slots ativos entre dezesseis. As duas bolhas delimitam o preenchimento e o esvaziamento.');
  }
  if(i===6) return bars(w,'Enquanto o quarto grupo aquece','12 req/s de déficit durante 90 s',1080,[['Início',0,'0 req'],['Após 45 s',540,'540 req'],['Após 90 s',1080,'1.080 req','work']]);
  const count=i===4?3:i===5?2:4;
  const sets=Array.from({length:4},(_,j)=>{
    const lost=(i===5&&j===2)||(i===7&&j===3), online=j<count&&!lost;
    return ['Nó '+['A','B','C','D'][j],online?['rank 0','rank 1']:['×','×'],lost?'falha':online?'TP=2':'reserva',online?'done':'empty'];
  });
  return devices(w,i===7?'N−1 com quatro grupos quentes':'Réplicas independentes · duas GPUs por grupo',sets,
    i===4?'Três grupos fornecem 72 req/s no perfil testado. O quarto nó ainda não está aquecido.':
    i===5?'Perder uma GPU retira todo o grupo afetado. Sobram 48 req/s para o pico de 60 req/s.':
    'Após perder um dos quatro grupos, três permanecem disponíveis para atender o pico de 60 req/s.');
}

function probes(w,i) {
  switch(i){
    case 0:return events(w,'Socket e serviço em relógios diferentes',[['Processo','início'],['TCP abre','8 s'],['Pesos','≈110 s']],1,'Marcos de inicialização em ordem de ocorrência');
    case 1:return table(w,'Ciclo de reinicialização durante a carga',['Sinal','Condição no ensaio'],[['Período','Amostra a cada 10 s'],['Liveness','3 falhas consecutivas'],['Peso ainda carregando','Kubelet reinicia o pod'],['Reincidência','4 reinícios']],2);
    case 2:return bars(w,'Janela da startup probe','Segundos · 24 tentativas espaçadas de 10 s',240,[['Carga do teste',190,'190 s'],['Orçamento',240,'≈240 s','work']]);
    case 3:return bars(w,'O primeiro prefill aquece a réplica','Tempo de prefill em milissegundos',1400,[['Primeiro',1400,'1.400 ms','work'],['Depois',160,'160 ms']]);
    case 4:return bars(w,'Dependência lenta, processos ainda vivos','3/3 pods respondem à liveness local',900,[['Antes',45,'45 ms'],['Timeout',400,'400 ms','empty'],['Incidente',900,'900 ms','work']]);
    case 5:return bars(w,'Doze streams ativos na drenagem','Tempo em segundos',48,[['Graça atual',30,'30 s','work'],['Restante p95',48,'48 s']]);
    case 6:return strip(w,'Prazo de terminação escolhido','Unidade','segundos no pior orçamento previsto',[['Propagação',5,'idle'],['Stream',60,'work'],['Encerrar',10,'done']]);
    case 7:return devices(w,'Rollout de três réplicas',[['Pod A',['pronto'],'tráfego','done'],['Pod B',['pronto'],'tráfego','done'],['Pod C',['pesos → teste'],'startup','work']],'No pior instante permanecem duas réplicas úteis. No ensaio, nenhum dos 120 streams foi truncado.');
  }
}

function observe(w,i){
  switch(i){
    case 0:return bars(w,'TTFT por ponto de medição','Percentis de distribuições distintas · ms',800,[['Cliente',590,'590 ms','work'],['Servidor',480,'480 ms'],['Meta cliente',800,'800 ms','empty']]);
    case 1:return table(w,'Histograma da frota em cinco minutos',['Etapa','Operação em Prometheus'],[['Por réplica','Taxa dos contadores por le'],['Três réplicas','Somar buckets do mesmo le'],['Frota agregada','Calcular quantil 0,95'],['Janela do ensaio','30.000 requisições']],1);
    case 2:return bars(w,'Passagem da linha de base ao alerta','TTFT p95 observado no cliente · ms',1220,[['Linha de base',590,'590 ms'],['Meta',800,'800 ms','empty'],['Incidente',1220,'1.220 ms','work']]);
    case 3:return strip(w,'Um único trace lento · 1.180 ms até o primeiro token','Unidade','ms em intervalos que não se sobrepõem',[['Fila',620,'work'],['Prefill',410,'done'],['Outros',150,'idle']]);
    case 4:return bars(w,'Distribuição muda sem mais requisições','Tokens de entrada no p95',4800,[['Anterior',1200,'1.200'],['Template novo',4800,'4.800','work']]);
    case 5:return bars(w,'Cota para a fila de prompts longos','TTFT p95 · 1,4% de recusas na classe longa',1390,[['Curto',680,'680 ms'],['Longo',1390,'1.390 ms','work']]);
    case 6:return strip(w,'Verificação semântica das citações da correção','Unidade','citações avaliadas no canário',[['Válidas',298,'done'],['Inválidas',2,'work']]);
    case 7:return bars(w,'Meta aferida para cada classe','TTFT p95 do cliente · ms',800,[['Curto',575,'575 ms'],['Longo',742,'742 ms','work'],['Meta',800,'800 ms','empty']]);
  }
}

function rollout(w,i) {
  switch(i){
    case 0:return table(w,'Manifesto de liberação imutável',['Artefato','Revisão do candidato'],[['Pesos','v8'],['Tokenizador','Fixado no manifesto'],['Template','v3'],['Runtime','rev. 42']],2);
    case 1:return strip(w,'Suíte antes do primeiro usuário','Unidade','casos da suíte fixa',[['Obrigatórios',24,'work'],['Demais',776,'done']]);
    case 2:return bars(w,'Shadow sem efeito externo','O controle continua respondendo aos 200 req/s',200,[['Controle',200,'200 req/s'],['Shadow',4,'4 req/s','work']]);
    case 3:return strip(w,'Roteamento para uma coorte estável','Unidade','requisições/s no pico',[['Controle',198,'done'],['Canário',2,'work']]);
    case 4:return table(w,'O denominador muda o sinal do rollout',['População','Falhas','Taxa'],[['Todo canário','3 / 1.200','0,25%'],['Fluxo raro','3 / 24','12,5%'],['Demais fluxos','0 / 1.176','0%']],1);
    case 5:return events(w,'Retirada do candidato',[['Reverter','1%'],['Propagar','45 s'],['Fechar','0%']],1,'Até ≈90 chamadas adicionais no ritmo de 2 req/s');
    case 6:return bars(w,'Suíte dirigida à ferramenta rara','Casos específicos exercitados no ensaio',300,[['Antes',24,'24'],['Após ajuste',300,'300','work']]);
    case 7:return bars(w,'Três patamares antes da promoção','Percentual das chamadas encaminhadas ao canário',100,[['1º patamar',5,'5%'],['2º patamar',25,'25%'],['3º patamar',50,'50%','work']]);
  }
}

function rag(w,i){
  switch(i){
    case 0:return table(w,'Endereço de uma evidência autorizada',['Camada da chave','Identifica'],[['Tenant + ACL','Quem pode ler a política'],['Documento/revisão','Qual edição vale para a data'],['Trecho + origem','Seção que sustenta a citação']],1);
    case 1:return strip(w,'Cobertura do índice B no snapshot','Unidade','documentos do catálogo',[['Indexados',192000,'done'],['Faltantes',8000,'work']]);
    case 2:return bars(w,'Recuperação nas cem perguntas históricas','Perguntas com referência autorizada no top 20',100,[['Lexical',71,'71'],['Híbrido',88,'88','work']]);
    case 3:return bars(w,'Perdas no corte de vinte para quatro','Perguntas históricas que conservam a referência',100,[['Top 20',88,'88'],['Top 4',79,'79','work']]);
    case 4:return bars(w,'Funil antes e depois da geração','Responder com uma citação autorizada e aplicável',100,[['Perguntas',100,'100'],['Top 20',88,'88'],['Top 4',79,'79'],['Apoiadas',73,'73','work']]);
    case 5:return table(w,'Revogação no intervalo entre índice e contexto',['Origem da leitura','Resultado da consulta'],[['Fonte de ACL','Acesso revogado'],['Índice atrasado','5 trechos antigos'],['Checagem final','0 trechos permitidos'],['Janela de atraso','34 s na ingestão']],2);
    case 6:return table(w,'Índices paralelos no shadow',['Observação','Condição para comparar'],[['Índice B','Cobertura do snapshot 100%'],['Watermarks','Lag observado de 2 s'],['Shadow autorizado','Amostra de 5%'],['Recorte','Mesmo tenant e vigência']],1);
    case 7:return bars(w,'Perguntas históricas fundamentadas','100 questões com versão temporal conhecida',100,[['Antes',73,'73'],['Após correção',87,'87','work']]);
  }
}

function batch(w,i){
  switch(i){
    case 0:return table(w,'Manifesto da execução offline',['Campo','Valor ou função'],[['Snapshot','12 milhões de itens únicos'],['Revisão','Modelo, template, transformação'],['Prazo','4 h'],['Vazão útil mínima','≈834 itens/s']],0);
    case 1:return bars(w,'Workers e capacidade agregada','60 itens/s por worker · itens/s totais',960,[['Mínimo (14)',840,'840'],['Escolha (16)',960,'960','work']]);
    case 2:return table(w,'Identidade estável de cada partição',['Escala','Unidade de replay'],[['Entrada','12 milhões de itens'],['Manifesto','12.000 blocos'],['Bloco típico','1.000 IDs únicos'],['Tempo ideal/bloco','≈16,7 s']],2);
    case 3:return events(w,'Publicação atômica por bloco',[['Staging','escrever'],['Validar','1.000 IDs'],['Commit','1 versão']],2,'Leitores seguem o manifesto confirmado.');
    case 4:return devices(w,'Quatro interrupções em blocos sem commit',Array.from({length:4},(_,k)=>['Worker '+(k+1),['1.000 itens'],'queda','empty']),'Até 4.000 itens voltam à verificação; blocos já confirmados ficam fora do replay.');
    case 5:return strip(w,'Reconciliação de um bloco com entradas inválidas','Unidade','itens dentro da partição',[['Classificados',997,'done'],['Quarentena',3,'work']]);
    case 6:return bars(w,'Prazo restante exige 1.000 itens/s','Capacidade ideal dos workers a 60 itens/s',1140,[['Restantes (12)',720,'720'],['Mínimo (17)',1020,'1.020','work'],['Teste (19)',1140,'1.140']]);
    case 7:return table(w,'Reconciliar IDs antes de trocar o ponteiro',['Conjunto da versão','Itens únicos'],[['Classificados','11.999.997'],['Quarentena','3'],['Soma reconciliada','12.000.000'],['Ausentes','0']],2);
  }
}

function features(w,i){
  switch(i){
    case 0:return table(w,'Contrato da feature de compras',['Elemento','Definição da previsão'],[['Entidade','Usuário × marketplace'],['Janela','Últimos 7 dias'],['Relógios','Evento e disponibilidade'],['Serving','12 atributos por previsão']],2);
    case 1:return events(w,'Evento econômico e chegada ao pipeline',[['Compra','09h58'],['Prever','10h00'],['Ingestão','10h07']],1,'Às 10h00 a compra ainda não era conhecida.');
    case 2:return table(w,'Escrita condicional por revisão publicada',['Ordem de chegada','Decisão do store'],[['Materializar 10h08','Aceitar nova revisão'],['Reexecutar 10h03','Preservar 10h08'],['Resultado','Uma atualização aceita']],1);
    case 3:return bars(w,'Agrupar chamadas sem reduzir os valores lidos','Chamadas ao backend por segundo',24000,[['Antes',24000,'24 mil'],['Em lote',2000,'2 mil','work']]);
    case 4:return strip(w,'Frescor das leituras online','Unidade','% de vetores · limite de 15 min',[['No prazo',82,'done'],['Vencidos',18,'work']]);
    case 5:return strip(w,'Roteamento conforme validade da feature','Unidade','% dos pedidos no teste',[['Modelo 12',82,'done'],['Fallback 11',18,'work']]);
    case 6:return strip(w,'Replay das mesmas entidades no mesmo instante','Unidade','pares após backfill de 90 minutos',[['Iguais',996,'done'],['Divergentes',4,'work']]);
    case 7:return table(w,'Recuperação da versão completa',['Critério','Medição no ensaio'],[['Paridade','1.000 / 1.000 pares'],['Perfil','2 mil previsões/s'],['Frescor fora da meta','0,1%'],['Lookup p95','14 ms de 20 ms permitidos']],3);
  }
}

const drawings={
  'treino-e-inferencia':['Do conjunto ao classificador','Separar',training],
  'servidor-vllm':['Inicialização e contrato da API','Inventariar',serving],
  'quantizacao':['Calibração e precisão em INT4','Fixar base',quant],
  'batching-continuo':['Iterações de Ana, Bia e Caio','Admitir dupla',batching],
  'cache-de-prefixo':['Blocos do prefixo compartilhado','Aquecer',prefix],
  'paralelismo-de-modelo':['Particionamento do modelo','Estimar',parallel],
  'saude-e-prontidao':['Ciclo de vida da réplica','Observar',probes],
  'observabilidade':['Medições no caminho da resposta','Definir',observe],
  'rollout-canario':['Coortes e decisão do rollout','Fixar',rollout],
  'rag-em-producao':['Da política vigente à citação','Identificar',rag],
  'inferencia-em-lote':['Partições e publicação da execução','Congelar',batch],
  'features-online':['Tempo e revisão dos atributos','Definir',features],
};

export function infrastructureScene(lesson,index){
  const chart=drawings[lesson.id], step=lesson.steps[index];
  if(!chart||!step||lesson.steps[0].label!==chart[1]||index>7) return null;
  return {
    title:chart[0],
    description:[step.change,...step.metrics.map(([label,value])=>label+' '+value)].join('. '),
    legend:['Em foco','Referência'],
    picture(mobile){
      const width=mobile?350:610;
      return `<svg data-illustration aria-hidden="true" class="dg-map ds-map ${mobile?'dg-mobile':'dg-wide'}" viewBox="0 0 ${width} 286">${chart[2](width,index)}${wrap(width,242,step.change)}</svg>`;
    },
  };
}
