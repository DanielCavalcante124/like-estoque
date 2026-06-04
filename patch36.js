/* LIKE Estoque V36 - Fase 1 e 2: operação rápida, aguardando teste, pendências, conferência e inventário */
(function(){
  const WAIT='Aguardando teste';
  const stopStatus=['Em estoque','Inutilizado','Perdido'];
  function $(id){return document.getElementById(id)}
  function E(v){return esc(v??'')}
  function K(v){return N(v||'')}
  function money(v){return br(Number(v||0))}
  function model(e){return `${E(e.tipo)} ${E(e.marca)} ${E(e.modelo)}`.trim()}
  function eqKey(e){return E(e.mac||e.serial||e.codigo||'')}
  function isActiveTech(e){return e.tecnicoAtual&&!stopStatus.includes(e.status)}
  function findExact(term){const k=K(term); if(!k)return null; return D.equipamentos.find(e=>K(e.mac)===k||K(e.serial)===k||K(e.codigo)===k||K(e.patrimonio)===k)||null}
  function days(date){if(!date)return null;const d=new Date(date+'T00:00:00');if(isNaN(d))return null;return Math.floor((Date.now()-d.getTime())/86400000)}
  function lastMov(e){return D.movimentos.find(m=>m.equipamento_id===e.id||m.codigo===e.codigo)||null}
  function msgBox(id,text,cls=''){const x=$(id);if(x){x.textContent=text;x.className='msg '+cls}}
  function statusPill(s){let c=s==='Em estoque'?'ok':(['Inutilizado','Perdido'].includes(s)?'bad':(s===WAIT?'warn':''));return `<span class="status ${c}">${E(s)}</span>`}
  async function safeIns(t,r){const x=await db().from(t).insert(r).select().single();if(x.error)throw x.error;return x.data}
  async function safeUpd(t,id,r){const x=await db().from(t).update(r).eq('id',id).select().single();if(x.error)throw x.error;return x.data}

  function addStyles(){if($('phase36style'))return;const s=document.createElement('style');s.id='phase36style';s.textContent=`
    .opHero{background:linear-gradient(135deg,#0d1b2e,#0f4c81);color:white;border-radius:22px;padding:22px;box-shadow:0 20px 50px #0f172a24;margin-bottom:16px}.opHero h2{margin:0 0 6px;font-size:28px}.opHero p{margin:0;color:#dbeafe}
    .opGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.opBtn{background:white;border:1px solid #dbe4ef;border-radius:18px;padding:18px;text-align:left;box-shadow:0 10px 28px #0f172a12;cursor:pointer}.opBtn:hover{outline:3px solid #0f4c8120}.opBtn b{font-size:18px;color:#0d1b2e}.opBtn span{display:block;color:#64748b;margin-top:6px}.opIcon{font-size:34px;margin-bottom:10px}.stepBox{display:grid;grid-template-columns:38px 1fr;gap:10px;align-items:start;background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:12px;margin:8px 0}.stepNum{width:32px;height:32px;border-radius:999px;background:#0f4c81;color:white;display:flex;align-items:center;justify-content:center;font-weight:900}.scanLine{font-size:19px;padding:16px;border:2px solid #0f4c81}.confGrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}.confCard{border:1px solid #dbe4ef;border-radius:16px;padding:12px;background:white}.confCard h3{margin:0 0 8px}.listMini{max-height:280px;overflow:auto}.pendOpen{background:#fff7ed}.pendDone{background:#dcfce7}.rowWarn{background:#fef3c7}.rowBad{background:#fee2e2}.rowOk{background:#dcfce7}.fixedTopOps{position:sticky;top:0;background:#f4f7fb;z-index:5;padding-bottom:8px}@media(max-width:950px){.opGrid,.confGrid{grid-template-columns:1fr}}
  `;document.head.appendChild(s)}

  async function loadPendencias(){try{D.pendencias=await loadTable('pendencias_tecnico','created_at',false)}catch(e){D.pendencias=[]}}
  function ensureStatusSelects(){
    const st=[...new Set(['Em estoque','Com técnico','Instalado cliente','Na rua','Reservado',WAIT,'Em manutenção','Inutilizado','Perdido'])];
    document.querySelectorAll('select').forEach(sel=>{
      const vals=[...sel.options].map(o=>o.value||o.textContent);
      if(vals.includes('Em manutenção')&&!vals.includes(WAIT)&&vals.some(v=>['Em estoque','Com técnico','Inutilizado'].includes(v))){
        const o=document.createElement('option');o.value=WAIT;o.textContent=WAIT;sel.insertBefore(o,sel.querySelector('option[value="Em manutenção"],option'));
      }
    });
  }

  function addPages(){
    const main=document.querySelector('.main');const side=document.querySelector('.side');if(!main||$('p-operacao'))return;
    const dash=document.querySelector('[data-p="dash"]');
    if(dash)dash.insertAdjacentHTML('beforebegin','<button class="nav" data-p="operacao">Operação rápida</button>');
    const hist=document.querySelector('[data-p="historico"]');
    if(hist)hist.insertAdjacentHTML('beforebegin','<button class="nav" data-p="conferenciaTec">Conferir técnico</button><button class="nav" data-p="inventarioLocal">Inventário físico</button><button class="nav" data-p="pendencias">Pendências</button>');
    main.insertAdjacentHTML('beforeend',`
<section id="p-operacao" class="page"><div class="opHero"><h2>Operação rápida do estoque</h2><p>Escolha a ação. A ideia é o estoquista trabalhar com poucos cliques e muita bipagem.</p></div><div class="opGrid"><div class="opBtn" onclick="pg('bipagem')"><div class="opIcon">🔎</div><b>Bipar / consultar</b><span>Digite ou bipe MAC, SN ou código.</span></div><div class="opBtn" onclick="pg('saidaLote')"><div class="opIcon">📤</div><b>Saída em lote</b><span>Escolha técnico e bipe vários equipamentos.</span></div><div class="opBtn" onclick="pg('devolucaoLote')"><div class="opIcon">📥</div><b>Devolução em lote</b><span>Devolva com checklist e triagem.</span></div><div class="opBtn" onclick="pg('conferenciaTec')"><div class="opIcon">🧰</div><b>Conferir técnico</b><span>Veja o que falta, sobra ou está correto.</span></div><div class="opBtn" onclick="pg('inventarioLocal')"><div class="opIcon">📦</div><b>Inventário físico</b><span>Compare prateleira/local físico com o sistema.</span></div><div class="opBtn" onclick="pg('pendencias')"><div class="opIcon">⚠️</div><b>Pendências</b><span>Cobranças abertas por técnico.</span></div></div><div class="grid" style="margin-top:16px"><div class="card"><h2>Passo a passo simples</h2><div class="stepBox"><div class="stepNum">1</div><div><b>Pesquise ou bipe</b><br><small>Use MAC, SN, código ou patrimônio.</small></div></div><div class="stepBox"><div class="stepNum">2</div><div><b>Escolha a ação</b><br><small>Saída, devolução, conferência, inventário ou pendência.</small></div></div><div class="stepBox"><div class="stepNum">3</div><div><b>Confirme na tela</b><br><small>O sistema mostra OK, erro, faltando ou sobrando.</small></div></div></div><div class="card"><h2>Alertas rápidos</h2><div id="opAlerts"></div></div></div></section>
<section id="p-conferenciaTec" class="page"><div class="card"><h2>Conferência de técnico por bipagem</h2><p class="small">Use quando o técnico chegar com mochila/carro. Escolha o técnico e bipe tudo que ele trouxe.</p><div class="grid4"><select id="confTec"></select><button id="confStart" class="pri">Iniciar conferência</button><button id="confFinish" class="ok">Gerar pendências dos faltantes</button><button id="confClear" class="bad">Limpar bipagem</button></div><input id="confScan" class="scanLine" placeholder="Bipe MAC/SN/código aqui e pressione Enter"><div id="confMsg" class="msg">Escolha o técnico e clique em iniciar.</div></div><div class="confGrid"><div class="confCard"><h3>✅ Conferidos</h3><div id="confOk" class="listMini"></div></div><div class="confCard"><h3>❌ Faltando</h3><div id="confMissing" class="listMini"></div></div><div class="confCard"><h3>⚠️ Sobrando / divergente</h3><div id="confExtra" class="listMini"></div></div></div></section>
<section id="p-inventarioLocal" class="page"><div class="card"><h2>Inventário físico por local</h2><p class="small">Escolha o local físico e bipe tudo que está ali. O sistema compara com o banco.</p><div class="grid4"><select id="invLocal"></select><button id="invStart" class="pri">Iniciar inventário</button><button id="invFinish" class="ok">Salvar conferência</button><button id="invClear" class="bad">Limpar bipagem</button></div><input id="invScan" class="scanLine" placeholder="Bipe MAC/SN/código aqui e pressione Enter"><div id="invMsg" class="msg">Escolha o local e clique em iniciar.</div></div><div class="confGrid"><div class="confCard"><h3>✅ Encontrados no local</h3><div id="invOk" class="listMini"></div></div><div class="confCard"><h3>❌ Faltando no local</h3><div id="invMissing" class="listMini"></div></div><div class="confCard"><h3>⚠️ Sobrando / local divergente</h3><div id="invExtra" class="listMini"></div></div></div></section>
<section id="p-pendencias" class="page"><div class="card"><h2>Pendências por técnico</h2><p class="small">Aqui ficam cobranças abertas. Resolva com botões simples.</p><div class="grid4"><select id="pendTec"></select><select id="pendStatus"><option>Aberta</option><option>Resolvida</option><option>Divergente</option><option>Cobrar valor</option><option>Cancelada</option></select><button id="pendReload" class="pri">Atualizar</button><button id="pendWhatsapp" class="warn">Copiar cobrança WhatsApp</button></div><div id="pendMsg" class="msg">Pendências carregadas após login.</div><div class="tbl"><table><thead><tr><th>Técnico</th><th>Equipamento</th><th>Motivo</th><th>Status</th><th>Prazo</th><th>Ações rápidas</th></tr></thead><tbody id="pendTable"></tbody></table></div></div></section>`);
    document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>pg(b.dataset.p));
  }

  function fillSelects(){
    const tec='<option value="">Escolha o técnico</option>'+D.tecnicos.map(t=>`<option>${E(t.nome)}</option>`).join('');
    ['confTec','pendTec'].forEach(id=>{const e=$(id);if(e){const old=e.value;e.innerHTML=tec;if([...e.options].some(o=>o.value===old))e.value=old}});
    const loc='<option value="">Escolha o local físico</option>'+D.locais.map(l=>`<option>${E(l.nome)}</option>`).join('');
    const inv=$('invLocal');if(inv){const old=inv.value;inv.innerHTML=loc;if([...inv.options].some(o=>o.value===old))inv.value=old}
    const devDest=$('batchDevDest'); if(devDest && ![...devDest.options].some(o=>o.value===WAIT||o.textContent===WAIT)){devDest.insertAdjacentHTML('afterbegin',`<option>${WAIT}</option>`)}
    const devSingle=$('devDest'); if(devSingle && ![...devSingle.options].some(o=>o.value===WAIT||o.textContent===WAIT)){devSingle.insertAdjacentHTML('afterbegin',`<option>${WAIT}</option>`)}
  }

  let conf={tec:'',expected:[],scanned:new Set(),extra:[]};
  function eqMini(e){return `<div class="item" style="display:block"><b>${E(e.codigo)}</b> • ${model(e)}<br><small>${eqKey(e)} • ${statusPill(e.status)} • ${E(e.local||'')}</small></div>`}
  function startConf(){const tec=$('confTec').value;if(!tec){msgBox('confMsg','Escolha o técnico primeiro.','bad');return}conf={tec,expected:D.equipamentos.filter(e=>e.tecnicoAtual===tec&&!stopStatus.includes(e.status)),scanned:new Set(),extra:[]};renderConf();msgBox('confMsg',`Conferência iniciada: ${tec}. Agora bipe tudo que ele trouxe.`, 'ok');$('confScan').focus()}
  function scanConf(){const term=$('confScan').value.trim();$('confScan').value='';if(!term)return;const e=findExact(term);if(!e){conf.extra.push({term,msg:'Não cadastrado'});renderConf();return}if(e.tecnicoAtual===conf.tec&&!stopStatus.includes(e.status)){conf.scanned.add(e.id)}else{conf.extra.push({term,msg:`Está com ${e.tecnicoAtual||'ninguém'} / ${e.status}`,e})}renderConf()}
  function renderConf(){const ok=conf.expected.filter(e=>conf.scanned.has(e.id));const miss=conf.expected.filter(e=>!conf.scanned.has(e.id));$('confOk').innerHTML=ok.map(eqMini).join('')||'<div class="msg">Nada conferido ainda.</div>';$('confMissing').innerHTML=miss.map(eqMini).join('')||'<div class="msg ok">Nenhum faltando.</div>';$('confExtra').innerHTML=conf.extra.map(x=>`<div class="item rowWarn" style="display:block"><b>${E(x.term)}</b><br><small>${E(x.msg)}</small>${x.e?'<br>'+eqMini(x.e):''}</div>`).join('')||'<div class="msg ok">Nenhum sobrando.</div>';msgBox('confMsg',`Conferidos: ${ok.length} | Faltando: ${miss.length} | Sobrando/divergente: ${conf.extra.length}`, miss.length?'bad':'ok')}
  async function finishConf(){if(!conf.tec){msgBox('confMsg','Inicie a conferência primeiro.','bad');return}const miss=conf.expected.filter(e=>!conf.scanned.has(e.id));for(const e of miss){await createPend(conf.tec,e,'Não apresentado na conferência de técnico','Aberta','Gerado automaticamente pela conferência por bipagem.')}await loadPendencias();renderPendencias();msgBox('confMsg',`Conferência finalizada. Pendências abertas para ${miss.length} item(ns) faltantes.`, miss.length?'bad':'ok')}

  let inv={local:'',expected:[],scanned:new Set(),extra:[]};
  function startInv(){const local=$('invLocal').value;if(!local){msgBox('invMsg','Escolha o local físico primeiro.','bad');return}inv={local,expected:D.equipamentos.filter(e=>e.local===local&&e.status!=='Perdido'),scanned:new Set(),extra:[]};renderInv();msgBox('invMsg',`Inventário iniciado: ${local}. Agora bipe tudo que está fisicamente nesse local.`,'ok');$('invScan').focus()}
  function scanInv(){const term=$('invScan').value.trim();$('invScan').value='';if(!term)return;const e=findExact(term);if(!e){inv.extra.push({term,msg:'Não cadastrado'});renderInv();return}if(e.local===inv.local&&e.status!=='Perdido'){inv.scanned.add(e.id)}else{inv.extra.push({term,msg:`Sistema diz local: ${e.local||'-'} / status: ${e.status}`,e})}renderInv()}
  function renderInv(){const ok=inv.expected.filter(e=>inv.scanned.has(e.id));const miss=inv.expected.filter(e=>!inv.scanned.has(e.id));$('invOk').innerHTML=ok.map(eqMini).join('')||'<div class="msg">Nada conferido ainda.</div>';$('invMissing').innerHTML=miss.map(eqMini).join('')||'<div class="msg ok">Nenhum faltando.</div>';$('invExtra').innerHTML=inv.extra.map(x=>`<div class="item rowWarn" style="display:block"><b>${E(x.term)}</b><br><small>${E(x.msg)}</small>${x.e?'<br>'+eqMini(x.e):''}</div>`).join('')||'<div class="msg ok">Nenhum sobrando.</div>';msgBox('invMsg',`Encontrados: ${ok.length} | Faltando: ${miss.length} | Sobrando/divergente: ${inv.extra.length}`, miss.length?'bad':'ok')}
  async function finishInv(){if(!inv.local){msgBox('invMsg','Inicie o inventário primeiro.','bad');return}const ok=inv.expected.filter(e=>inv.scanned.has(e.id));for(const e of ok){try{await safeIns('inventario',{equipamento_id:e.id,conferido:true,data:today(),obs:'Inventário físico confirmado no local '+inv.local})}catch(_e){}}msgBox('invMsg',`Inventário salvo. ${ok.length} item(ns) confirmados no local ${inv.local}.`, 'ok')}

  async function createPend(tec,e,motivo,status='Aberta',obs=''){
    return await safeIns('pendencias_tecnico',{tecnico:tec,equipamento_id:e?.id||null,codigo:e?.codigo||'',mac:e?.mac||'',serial:e?.serial||'',modelo:e?`${e.tipo} ${e.marca} ${e.modelo}`:'',motivo,status,observacao:obs});
  }
  async function resolvePend(id,action){
    const p=(D.pendencias||[]).find(x=>x.id===id);if(!p)return;
    const e=p.equipamento_id?D.equipamentos.find(x=>x.id===p.equipamento_id):null;
    try{
      if(action==='estoque'&&e){e.status='Em estoque';e.local='Estoque central';e.tecnicoAtual='';e.clienteAtual='';Object.assign(e,fromEq(await upd('equipamentos',e.id,toEq(e))));await mov(e,'Resolver pendência',{dest:'Estoque central',mot:'Devolvido ao estoque',obs:'Pendência resolvida por botão rápido'})}
      if(action==='instalado'&&e){e.status='Instalado cliente';e.local='Cliente/Rua';Object.assign(e,fromEq(await upd('equipamentos',e.id,toEq(e))));await mov(e,'Resolver pendência',{tec:e.tecnicoAtual,dest:e.local,mot:'Instalado em cliente',obs:'Pendência resolvida por botão rápido'})}
      if(action==='perdido'&&e){e.status='Perdido';e.local='Perdido';Object.assign(e,fromEq(await upd('equipamentos',e.id,toEq(e))));await mov(e,'Resolver pendência',{tec:p.tecnico,dest:'Perdido',mot:'Perdido',obs:'Pendência marcada como perda'})}
      let st=action==='cobrar'?'Cobrar valor':(action==='cancelar'?'Cancelada':'Resolvida');
      await safeUpd('pendencias_tecnico',id,{status:st,resolvido_em:new Date().toISOString(),resolucao:action,updated_at:new Date().toISOString()});
      await loadPendencias();renderPendencias();render();
    }catch(err){alert('Erro ao resolver pendência: '+err.message)}
  }
  window.resolvePend=resolvePend;

  function renderPendencias(){const tbody=$('pendTable');if(!tbody)return;const tec=$('pendTec')?.value||'';const st=$('pendStatus')?.value||'Aberta';const list=(D.pendencias||[]).filter(p=>(!tec||p.tecnico===tec)&&(!st||p.status===st));tbody.innerHTML=list.map(p=>`<tr class="${p.status==='Aberta'?'pendOpen':'pendDone'}"><td>${E(p.tecnico)}</td><td><b>${E(p.codigo)}</b><br><small>${E(p.modelo)}<br>${E(p.mac||p.serial)}</small></td><td>${E(p.motivo)}<br><small>${E(p.observacao||'')}</small></td><td>${statusPill(p.status)}</td><td>${E(p.prazo||'')}</td><td><button class="ok" onclick="resolvePend('${p.id}','estoque')">Devolvido</button><button class="pri" onclick="resolvePend('${p.id}','instalado')">Instalado</button><button class="bad" onclick="resolvePend('${p.id}','perdido')">Perdido</button><button class="warn" onclick="resolvePend('${p.id}','cobrar')">Cobrar</button><button onclick="resolvePend('${p.id}','cancelar')">Cancelar</button></td></tr>`).join('')||'<tr><td colspan="6">Nenhuma pendência nesse filtro.</td></tr>';msgBox('pendMsg',`${list.length} pendência(s) no filtro.`,list.length?'bad':'ok')}
  function copyWhats(){const tec=$('pendTec')?.value||'';const list=(D.pendencias||[]).filter(p=>p.status==='Aberta'&&(!tec||p.tecnico===tec));const txt=`Pendências de equipamentos ${tec?'- '+tec:''}\n\n`+list.map((p,i)=>`${i+1}. ${p.codigo} - ${p.modelo} - ${p.mac||p.serial} - ${p.motivo}`).join('\n')+'\n\nFavor regularizar/devolver ou justificar.';navigator.clipboard.writeText(txt);msgBox('pendMsg','Mensagem copiada para WhatsApp.','ok')}

  function renderOpAlerts(){const box=$('opAlerts');if(!box)return;const pend=(D.pendencias||[]).filter(p=>p.status==='Aberta').length;const wait=D.equipamentos.filter(e=>e.status===WAIT).length;const manut=D.equipamentos.filter(e=>e.status==='Em manutenção').length;const parado=D.equipamentos.filter(e=>{const m=lastMov(e);const d=days(m?.data);return d!==null&&d>=15&&!stopStatus.includes(e.status)}).length;box.innerHTML=`<div class="stepBox"><div class="stepNum">${pend}</div><div><b>Pendências abertas</b><br><small>Cobranças de técnicos.</small></div></div><div class="stepBox"><div class="stepNum">${wait}</div><div><b>Aguardando teste</b><br><small>Equipamentos devolvidos que precisam ser testados.</small></div></div><div class="stepBox"><div class="stepNum">${manut}</div><div><b>Em manutenção</b><br><small>Itens parados para análise.</small></div></div><div class="stepBox"><div class="stepNum">${parado}</div><div><b>Parados 15+ dias</b><br><small>Priorizar cobrança/conferência.</small></div></div>`}

  async function sendToWait(e,tec,obs){e.status=WAIT;e.local='Aguardando teste';e.tecnicoAtual='';e.clienteAtual='';Object.assign(e,fromEq(await upd('equipamentos',e.id,toEq(e))));await mov(e,'Aguardando teste',{tec,dest:'Aguardando teste',mot:'Triagem',obs:obs||'Equipamento aguardando teste antes de voltar ao estoque'})}

  function hookButtons(){
    if($('confStart'))$('confStart').onclick=startConf;if($('confScan')&&!$('confScan').dataset.h){$('confScan').dataset.h='1';$('confScan').addEventListener('keydown',e=>{if(e.key==='Enter')scanConf()})}if($('confFinish'))$('confFinish').onclick=finishConf;if($('confClear'))$('confClear').onclick=()=>{conf={tec:'',expected:[],scanned:new Set(),extra:[]};renderConf();msgBox('confMsg','Bipagem limpa.','')};
    if($('invStart'))$('invStart').onclick=startInv;if($('invScan')&&!$('invScan').dataset.h){$('invScan').dataset.h='1';$('invScan').addEventListener('keydown',e=>{if(e.key==='Enter')scanInv()})}if($('invFinish'))$('invFinish').onclick=finishInv;if($('invClear'))$('invClear').onclick=()=>{inv={local:'',expected:[],scanned:new Set(),extra:[]};renderInv();msgBox('invMsg','Bipagem limpa.','')};
    if($('pendReload'))$('pendReload').onclick=async()=>{await loadPendencias();renderPendencias()};if($('pendStatus'))$('pendStatus').onchange=renderPendencias;if($('pendTec'))$('pendTec').onchange=renderPendencias;if($('pendWhatsapp'))$('pendWhatsapp').onclick=copyWhats;
  }

  async function boot(){addStyles();addPages();fillSelects();hookButtons();try{await loadPendencias()}catch(e){D.pendencias=[]}renderPendencias();renderOpAlerts();ensureStatusSelects()}
  const oldRender=render;render=function(){oldRender();addStyles();addPages();fillSelects();hookButtons();renderPendencias();renderOpAlerts();ensureStatusSelects()};
  const oldLoadAll=loadAll;loadAll=async function(){await oldLoadAll();await loadPendencias();renderPendencias();renderOpAlerts();};
  const oldLogin=window.login;window.login=async function(){const r=await oldLogin.apply(this,arguments);setTimeout(()=>{try{pg('operacao')}catch(e){}},700);return r};

  document.addEventListener('DOMContentLoaded',()=>{setTimeout(boot,900);setTimeout(boot,2000)});
})();