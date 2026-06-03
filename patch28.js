/* LIKE Estoque V28 - produtividade do estoquista */
(function(){
  function byId(id){return document.getElementById(id)}
  function E(v){return esc(v??'')}
  function key(v){return N(v||'')}
  function eqLabel(e){return `${E(e.codigo)} • ${E(e.tipo)} ${E(e.marca)} ${E(e.modelo)} • ${E(e.mac||e.serial||'sem MAC/SN')}`}
  function findEq(term){const k=key(term);if(!k)return null;return D.equipamentos.find(e=>key([e.codigo,e.patrimonio,e.mac,e.serial,e.modelo,e.marca,e.tipo,e.tecnicoAtual,e.clienteAtual,e.osAtual].join(' ')).includes(k))||null}
  function findExactEq(term){const k=key(term);if(!k)return null;return D.equipamentos.find(e=>key(e.mac)===k||key(e.serial)===k||key(e.codigo)===k||key(e.patrimonio)===k)||findEq(term)}
  function lastMov(e){return D.movimentos.find(m=>m.equipamento_id===e.id||m.codigo===e.codigo)||null}
  function safeStatus(e){return `<span class="status ${e.status==='Em estoque'?'ok':(['Inutilizado','Perdido'].includes(e.status)?'bad':'')}">${E(e.status)}</span>`}
  function addStyles(){
    const s=document.createElement('style');
    s.textContent=`.quickTop{background:#fff;border:1px solid #dbe4ef;border-radius:18px;padding:14px;margin:0 0 16px;box-shadow:0 10px 28px #0f172a10}.quickRow{display:grid;grid-template-columns:1.4fr auto auto auto;gap:10px;align-items:center}.quickResult{margin-top:10px}.bigScan{font-size:22px;padding:18px;border:2px solid #0f4c81}.pillGrid{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.miniBtn{padding:8px 10px;border-radius:10px}.batchArea{min-height:150px;font-family:Consolas,monospace}.okLine{background:#dcfce7}.badLine{background:#fee2e2}.warnLine{background:#fef3c7}.modalShade{position:fixed;inset:0;background:#02061799;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}.modalBox{background:#fff;border-radius:22px;max-width:1100px;width:100%;max-height:90vh;overflow:auto;padding:22px;box-shadow:0 30px 90px #0006}.modalHead{display:flex;justify-content:space-between;gap:10px;align-items:center}.checkGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.soft{background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:12px}.hiddenPrint{display:inline-block}@media print{body *{visibility:hidden}.printArea,.printArea *{visibility:visible}.printArea{position:absolute;inset:0}.hiddenPrint{display:none}}@media(max-width:950px){.quickRow,.checkGrid{grid-template-columns:1fr}}`;
    document.head.appendChild(s);
  }
  function injectTopSearch(){
    const main=document.querySelector('.main'); if(!main||byId('globalSearchBox'))return;
    const top=document.querySelector('.top');
    const div=document.createElement('div');div.className='quickTop';div.id='globalSearchBox';
    div.innerHTML=`<div class="quickRow"><input id="globalSearch" placeholder="Busca rápida: bipe/digite MAC, SN, código, patrimônio, técnico ou cliente"><button id="globalBtn" class="pri">Pesquisar</button><button id="goScan" class="ok">Modo bipagem</button><button id="goBatchOut" class="warn">Saída lote</button></div><div id="globalResult" class="quickResult"></div>`;
    top.after(div);
    globalSearch.oninput=()=>renderGlobal(globalSearch.value);
    globalBtn.onclick=()=>renderGlobal(globalSearch.value,true);
    goScan.onclick=()=>pg('bipagem');
    goBatchOut.onclick=()=>pg('saidaLote');
  }
  function renderGlobal(q,force=false){
    const box=byId('globalResult'); if(!box)return;
    const e=findEq(q); if(!e){box.innerHTML=force?'<div class="msg bad">Nada encontrado.</div>':'';return}
    const m=lastMov(e);
    box.innerHTML=`<div class="soft"><b>${eqLabel(e)}</b> ${safeStatus(e)}<br><small>Local: ${E(e.local||'-')} • Técnico: ${E(e.tecnicoAtual||'-')} • Cliente/OS: ${E(e.clienteAtual||'-')} ${E(e.osAtual||'')}</small><br><small>Última movimentação: ${m?E(m.data)+' • '+E(m.tipo):'sem histórico'}</small><div class="pillGrid"><button class="miniBtn pri" onclick="quickOut('${e.id}')">Dar saída</button><button class="miniBtn ok" onclick="quickReturn('${e.id}')">Devolver</button><button class="miniBtn warn" onclick="quickMaintenance('${e.id}')">Manutenção</button><button class="miniBtn" onclick="showEqHistory('${e.id}')">Histórico</button><button class="miniBtn bad" onclick="inutilizarEq('${e.id}')">Inutilizar</button></div></div>`;
  }
  window.quickOut=function(id){sel=id;const e=D.equipamentos.find(x=>x.id===id);pg('saida');if(e){q.value=e.mac||e.serial||e.codigo;choose(id)}};
  window.quickReturn=function(id){dsel=id;const e=D.equipamentos.find(x=>x.id===id);pg('devolucao');if(e){dq.value=e.mac||e.serial||e.codigo;chooseD(id)}};
  window.quickMaintenance=async function(id){try{const e=D.equipamentos.find(x=>x.id===id);if(!e)return;e.status='Em manutenção';e.local='Bancada técnica';e.motivoAtual='Enviado pela busca rápida';Object.assign(e,fromEq(await upd('equipamentos',id,toEq(e))));await mov(e,'Enviar para manutenção',{dest:'Bancada técnica',mot:'Busca rápida',obs:'Enviado para manutenção pela busca global'});render();renderGlobal(globalSearch.value,true)}catch(err){alert(err.message)}};
  window.showEqHistory=function(id){
    const e=D.equipamentos.find(x=>x.id===id);if(!e)return;
    const movs=D.movimentos.filter(m=>m.equipamento_id===e.id||m.codigo===e.codigo);
    const html=`<div class="modalShade" id="eqModal"><div class="modalBox"><div class="modalHead"><h2>Histórico do equipamento</h2><button class="bad" onclick="eqModal.remove()">Fechar</button></div><div class="grid"><div class="soft"><b>${eqLabel(e)}</b><br>Status: ${safeStatus(e)}<br>Patrimônio: ${E(e.patrimonio)}<br>Origem: ${E(e.origem||'')}</div><div class="soft">Local: <b>${E(e.local||'-')}</b><br>Técnico: <b>${E(e.tecnicoAtual||'-')}</b><br>Cliente/backup: <b>${E(e.clienteAtual||'-')}</b><br>OS: <b>${E(e.osAtual||'-')}</b></div></div><div class="tbl" style="margin-top:12px"><table><thead><tr><th>Data</th><th>Movimento</th><th>Técnico</th><th>Destino</th><th>Cliente</th><th>OS</th><th>Condição</th><th>Obs</th></tr></thead><tbody>${movs.map(m=>`<tr><td>${E(m.data||'')}</td><td>${E(m.tipo||'')}</td><td>${E(m.tecnico||'')}</td><td>${E(m.destino||'')}</td><td>${E(m.cliente||'')}</td><td>${E(m.os||'')}</td><td>${E(m.condicao||'')}</td><td>${E(m.obs||'')}</td></tr>`).join('')||'<tr><td colspan="8">Sem histórico.</td></tr>'}</tbody></table></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend',html);
  };
  function addPages(){
    const side=document.querySelector('.side');const main=document.querySelector('.main'); if(!side||!main||byId('p-bipagem'))return;
    const histBtn=document.querySelector('[data-p="historico"]');
    histBtn.insertAdjacentHTML('beforebegin',`<button class="nav" data-p="bipagem">Modo bipagem</button><button class="nav" data-p="saidaLote">Saída em lote</button><button class="nav" data-p="devolucaoLote">Devolução em lote</button><button class="nav" data-p="cobranca">Cobrar técnico</button>`);
    main.insertAdjacentHTML('beforeend',`
<section id="p-bipagem" class="page"><div class="card"><h2>Modo bipagem com ação automática</h2><div class="grid4"><select id="scanAction"><option value="buscar">Só buscar</option><option value="saida">Saída para técnico</option><option value="devolucao">Devolução para estoque</option><option value="manut">Enviar para manutenção</option></select><select id="scanTec"></select><select id="scanDestino"></select><select id="scanCond"><option>Usado funcionando</option><option>Defeito</option><option>Quebrado</option><option>Com tinta</option><option>Sem lacre</option></select></div><input id="scanInput" class="bigScan" placeholder="Bipe aqui o MAC/SN/código e pressione Enter"><div id="scanResult" class="msg">Aguardando bipagem.</div></div></section>
<section id="p-saidaLote" class="page"><div class="card"><h2>Saída em lote para técnico</h2><div class="grid4"><select id="batchOutTec"></select><select id="batchOutDest"></select><input id="batchOutOS" placeholder="OS/observação padrão"><input id="batchOutCliente" placeholder="Cliente/backup opcional"></div><textarea id="batchOutList" class="batchArea" placeholder="Bipe ou cole vários MAC/SN, um por linha"></textarea><button id="batchOutBtn" class="pri">Processar saída em lote</button><div id="batchOutResult"></div></div></section>
<section id="p-devolucaoLote" class="page"><div class="card"><h2>Devolução em lote com checklist</h2><div class="grid4"><select id="batchDevTec"></select><select id="batchDevDest"><option>Estoque central</option><option>Manutenção/Teste</option><option>Inutilizado</option></select><select id="batchDevCond"><option>Usado funcionando</option><option>Defeito</option><option>Quebrado</option><option>Com tinta</option><option>Sem lacre</option></select><input id="batchDevOS" placeholder="OS/observação padrão"></div><div class="checkGrid"><label class="soft">Fonte voltou?<select id="ckFonte"><option>Sim</option><option>Não</option><option>Não se aplica</option></select></label><label class="soft">Cabo voltou?<select id="ckCabo"><option>Sim</option><option>Não</option><option>Não se aplica</option></select></label><label class="soft">Caixa voltou?<select id="ckCaixa"><option>Sim</option><option>Não</option><option>Não se aplica</option></select></label><label class="soft">Com tinta?<select id="ckTinta"><option>Não</option><option>Sim</option></select></label><label class="soft">Lacre rompido?<select id="ckLacre"><option>Não</option><option>Sim</option></select></label><label class="soft">Funciona?<select id="ckFunciona"><option>Sim</option><option>Não</option><option>Testar</option></select></label></div><textarea id="batchDevList" class="batchArea" placeholder="Bipe ou cole vários MAC/SN, um por linha"></textarea><button id="batchDevBtn" class="pri">Processar devolução em lote</button><div id="batchDevResult"></div></div></section>
<section id="p-cobranca" class="page"><div class="card"><h2>Relatório por técnico / cobrar responsabilidade</h2><div class="grid4"><select id="reportTec"></select><button id="reportBtn" class="pri">Gerar relatório</button><button id="printReport" class="ok">Imprimir / PDF</button><button id="copyReport" class="warn">Copiar texto</button></div><div id="reportArea" class="printArea"></div></div></section>`);
    document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>pg(b.dataset.p));
  }
  function fillExtraSelects(){
    const tec='<option value="">Técnico</option>'+D.tecnicos.map(t=>`<option>${E(t.nome)}</option>`).join('');
    ['scanTec','batchOutTec','batchDevTec','reportTec'].forEach(id=>{const e=byId(id);if(e&&!e.dataset.filled){e.innerHTML=tec;e.dataset.filled='1'}});
    const loc=D.locais.map(l=>`<option>${E(l.nome)}</option>`).join('');
    ['scanDestino','batchOutDest'].forEach(id=>{const e=byId(id);if(e&&!e.dataset.filled){e.innerHTML=loc;e.dataset.filled='1'}});
  }
  const oldRender28=render;
  render=function(){oldRender28();fillExtraSelects()};
  async function applyOut(e,tec,dest,os,cli,obs){
    e.status='Com técnico';e.local=dest;e.tecnicoAtual=tec;e.clienteAtual=cli||'';e.osAtual=os||'';e.motivoAtual='Saída em lote';
    await upd('equipamentos',e.id,toEq(e));
    await mov(e,'Saída em lote',{tec,dest,cli,os,mot:'Saída em lote',obs});
  }
  async function applyDev(e,tec,dest,cond,os,obs){
    e.status=dest==='Manutenção/Teste'?'Em manutenção':dest==='Inutilizado'?'Inutilizado':'Em estoque';
    e.local=dest==='Manutenção/Teste'?'Bancada técnica':dest;
    e.tecnicoAtual=e.status==='Em estoque'?'':tec;e.clienteAtual='';e.osAtual=os||'';e.motivoAtual=cond;e.inutilizadoObs=obs;
    await upd('equipamentos',e.id,toEq(e));
    await mov(e,'Devolução em lote',{tec,dest,os,cond,mot:cond,obs});
  }
  function lines(text){return [...new Set(String(text||'').split(/\n|,|;/).map(x=>x.trim()).filter(Boolean))]}
  function rowResult(term,ok,msg,eq){return `<tr class="${ok?'okLine':'badLine'}"><td>${E(term)}</td><td>${ok?'OK':'ERRO'}</td><td>${E(msg)}</td><td>${eq?eqLabel(eq):''}</td></tr>`}
  async function processBatchOut(){
    const tec=batchOutTec.value,dest=batchOutDest.value,os=batchOutOS.value,cli=batchOutCliente.value;
    if(!tec||!dest){batchOutResult.innerHTML='<div class="msg bad">Informe técnico e destino.</div>';return}
    let html='<div class="tbl"><table><thead><tr><th>Bipado</th><th>Status</th><th>Resultado</th><th>Equipamento</th></tr></thead><tbody>';
    for(const term of lines(batchOutList.value)){const e=findExactEq(term);if(!e){html+=rowResult(term,false,'Não encontrado');continue}if(['Inutilizado','Perdido','Em manutenção'].includes(e.status)){html+=rowResult(term,false,'Status bloqueado: '+e.status,e);continue}await applyOut(e,tec,dest,os,cli,'Saída em lote via bipagem');html+=rowResult(term,true,'Saída feita para '+tec,e)}
    html+='</tbody></table></div>';batchOutResult.innerHTML=html;batchOutList.value='';render();
  }
  async function processBatchDev(){
    const tec=batchDevTec.value,dest=batchDevDest.value,cond=batchDevCond.value,os=batchDevOS.value;
    const checklist=`Checklist | Fonte: ${ckFonte.value}; Cabo: ${ckCabo.value}; Caixa: ${ckCaixa.value}; Tinta: ${ckTinta.value}; Lacre rompido: ${ckLacre.value}; Funciona: ${ckFunciona.value}`;
    if(!tec){batchDevResult.innerHTML='<div class="msg bad">Informe o técnico.</div>';return}
    let html='<div class="tbl"><table><thead><tr><th>Bipado</th><th>Status</th><th>Resultado</th><th>Equipamento</th></tr></thead><tbody>';
    for(const term of lines(batchDevList.value)){const e=findExactEq(term);if(!e){html+=rowResult(term,false,'Não encontrado');continue}await applyDev(e,tec,dest,cond,os,checklist);html+=rowResult(term,true,'Devolução registrada',e)}
    html+='</tbody></table></div>';batchDevResult.innerHTML=html;batchDevList.value='';render();
  }
  async function scanEnter(){
    const term=scanInput.value.trim(); if(!term)return; const e=findExactEq(term); const action=scanAction.value;
    if(!e){scanResult.innerHTML='<span class="bad">Não encontrado:</span> '+E(term);scanInput.value='';return}
    try{
      if(action==='buscar'){scanResult.innerHTML=`Encontrado: <b>${eqLabel(e)}</b> ${safeStatus(e)} <button onclick="showEqHistory('${e.id}')">Histórico</button>`}
      if(action==='saida'){if(!scanTec.value||!scanDestino.value)throw Error('Escolha técnico e destino.');await applyOut(e,scanTec.value,scanDestino.value,'','', 'Saída por modo bipagem');scanResult.innerHTML=`Saída feita: <b>${eqLabel(e)}</b>`}
      if(action==='devolucao'){if(!scanTec.value)throw Error('Escolha o técnico.');await applyDev(e,scanTec.value,'Estoque central',scanCond.value,'','Devolução por modo bipagem');scanResult.innerHTML=`Devolução feita: <b>${eqLabel(e)}</b>`}
      if(action==='manut'){e.status='Em manutenção';e.local='Bancada técnica';e.motivoAtual='Modo bipagem';await upd('equipamentos',e.id,toEq(e));await mov(e,'Enviar para manutenção',{dest:'Bancada técnica',mot:'Modo bipagem'});scanResult.innerHTML=`Enviado para manutenção: <b>${eqLabel(e)}</b>`}
      scanInput.value='';render();scanInput.focus();
    }catch(err){scanResult.innerHTML='<span class="bad">Erro:</span> '+E(err.message)}
  }
  function generateReport(){
    const tec=reportTec.value;if(!tec){reportArea.innerHTML='<div class="msg bad">Escolha um técnico.</div>';return}
    const itens=D.equipamentos.filter(e=>e.tecnicoAtual===tec&&!['Em estoque','Inutilizado','Perdido'].includes(e.status));
    const valor=itens.reduce((s,e)=>s+Number(e.custo||0),0);
    reportArea.innerHTML=`<div class="card"><h2>Termo de responsabilidade - ${E(tec)}</h2><p>Data: ${new Date().toLocaleDateString('pt-BR')} • Itens em posse: <b>${itens.length}</b> • Valor estimado: <b>${br(valor)}</b></p><div class="tbl"><table><thead><tr><th>Código</th><th>Modelo</th><th>MAC/SN</th><th>Status</th><th>Local</th><th>Cliente/OS</th></tr></thead><tbody>${itens.map(e=>`<tr><td>${E(e.codigo)}</td><td>${E(e.tipo)} ${E(e.marca)} ${E(e.modelo)}</td><td>${E(e.mac||e.serial||'')}</td><td>${E(e.status)}</td><td>${E(e.local||'')}</td><td>${E(e.clienteAtual||'')} ${E(e.osAtual||'')}</td></tr>`).join('')||'<tr><td colspan="6">Sem itens em posse.</td></tr>'}</tbody></table></div><br><br><p>Assinatura do técnico: ____________________________________________</p></div>`;
  }
  function boot28(){
    addStyles();injectTopSearch();addPages();fillExtraSelects();
    if(byId('batchOutBtn'))batchOutBtn.onclick=processBatchOut;
    if(byId('batchDevBtn'))batchDevBtn.onclick=processBatchDev;
    if(byId('scanInput'))scanInput.addEventListener('keydown',e=>{if(e.key==='Enter')scanEnter()});
    if(byId('reportBtn'))reportBtn.onclick=generateReport;
    if(byId('printReport'))printReport.onclick=()=>window.print();
    if(byId('copyReport'))copyReport.onclick=()=>navigator.clipboard.writeText(reportArea.innerText||'');
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(boot28,200));
})();