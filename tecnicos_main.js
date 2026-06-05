(function(){
let tecSel='';
let matSaldosMain=[];
function T(id){return document.getElementById(id)}
function V(v){try{return esc(v??'')}catch(e){return String(v??'')}}
function real(v){try{return br(Number(v||0))}catch(e){return 'R$ '+Number(v||0).toFixed(2)}}
async function carregarMateriaisTecnico(){try{matSaldosMain=await loadTable('materiais_saldos','tipo',true)}catch(e){matSaldosMain=[]}}
function tecEqNome(e){return e.tecnicoAtual||e.tecnico_atual||e.tecnico||''}
function nomeEq(e){return ((e.tipo||'')+' '+(e.marca||'')+' '+(e.modelo||'')).trim()}
function nomesTecnicos(){return [...new Set([...(D.tecnicos||[]).map(t=>t.nome),...(D.equipamentos||[]).map(tecEqNome),...matSaldosMain.map(m=>m.tecnico)].filter(Boolean))].sort()}
function eqsTec(nome){return (D.equipamentos||[]).filter(e=>tecEqNome(e)===nome&&!['Em estoque','Inutilizado','Perdido','Descarte autorizado','Instalado no cliente','Instalado cliente'].includes(e.status||''))}
function matsTec(nome){return matSaldosMain.filter(m=>(m.tecnico||'')===nome&&Number(m.quantidade||0)!==0)}
function tabelaTec(){let eqs=eqsTec(tecSel),mats=matsTec(tecSel);return '<h3>Equipamentos patrimoniais</h3><div class="tbl"><table><thead><tr><th>Código</th><th>Equipamento</th><th>MAC/SN</th><th>Status</th><th>Local</th><th>Valor</th></tr></thead><tbody>'+(eqs.map(e=>'<tr><td>'+V(e.codigo)+'</td><td>'+V(nomeEq(e))+'</td><td>'+V(e.mac||e.serial||'-')+'</td><td>'+V(e.status||'-')+'</td><td>'+V(e.local||'-')+'</td><td>'+real(e.custo||0)+'</td></tr>').join('')||'<tr><td colspan="6">Sem equipamento patrimonial em posse.</td></tr>')+'</tbody></table></div><h3>Materiais em posse</h3><div class="tbl"><table><thead><tr><th>Categoria</th><th>Material</th><th>Quantidade</th><th>Unidade</th><th>Local</th></tr></thead><tbody>'+(mats.map(m=>'<tr><td>'+V(m.categoria)+'</td><td>'+V(m.tipo+' '+(m.marca||'')+' '+m.modelo)+'</td><td><b>'+V(m.quantidade)+'</b></td><td>'+V(m.unidade_saida)+'</td><td>'+V(m.local||'Técnico')+'</td></tr>').join('')||'<tr><td colspan="5">Sem material em posse.</td></tr>')+'</tbody></table></div>'}
function renderListaTecnicosMain(){let box=T('tecMainLista');if(!box)return;let f=(T('tecMainBusca')&&T('tecMainBusca').value||'').toLowerCase();let arr=nomesTecnicos().filter(n=>!f||n.toLowerCase().includes(f));box.innerHTML=arr.map(n=>{let rec=(D.tecnicos||[]).find(t=>t.nome===n);return '<div class="item"><div data-tec-main="'+V(n)+'" style="flex:1;cursor:pointer"><b>'+V(n)+'</b><br><small>'+eqsTec(n).length+' equipamento(s) • '+matsTec(n).length+' material(is)</small></div><button class="bad" data-del-tec-main="'+V(n)+'" data-id="'+V(rec?rec.id:'')+'">Excluir</button></div>'}).join('')||'<div class="msg">Nenhum técnico cadastrado.</div>';box.querySelectorAll('[data-tec-main]').forEach(x=>x.onclick=function(){tecSel=this.dataset.tecMain;renderTecnicoSelecionado(true)});box.querySelectorAll('[data-del-tec-main]').forEach(x=>x.onclick=function(ev){ev.stopPropagation();excluirTecMain(this.dataset.id,this.dataset.delTecMain)})}
function renderTecnicoSelecionado(show){if(!T('tecMainTitulo'))return;if(!tecSel){T('tecMainTitulo').textContent='Selecione um técnico';T('tecMainKpis').innerHTML='';T('tecMainArea').innerHTML='';return}let eqs=eqsTec(tecSel),mats=matsTec(tecSel),valor=eqs.reduce((s,e)=>s+Number(e.custo||0),0);T('tecMainTitulo').textContent='Técnico: '+tecSel;T('tecMainKpis').innerHTML='<div><small>Equipamentos</small><b>'+eqs.length+'</b></div><div><small>Materiais</small><b>'+mats.length+'</b></div><div><small>Valor patrimônio</small><b>'+real(valor)+'</b></div><div><small>Total técnicos</small><b>'+nomesTecnicos().length+'</b></div>';if(show)T('tecMainArea').innerHTML=tabelaTec()}
async function atualizarTecnicosMain(show=true){await carregarMateriaisTecnico();renderListaTecnicosMain();renderTecnicoSelecionado(show)}
async function addTecMain(){try{let nome=(T('tecMainNome').value||'').trim();if(!nome){msg('tecMainMsg','Informe o nome do técnico.','bad');return}if((D.tecnicos||[]).some(t=>String(t.nome).toLowerCase()===nome.toLowerCase())){msg('tecMainMsg','Técnico já existe.','bad');return}let salvo=await ins('tecnicos',{nome,ativo:true});D.tecnicos.push(salvo);T('tecMainNome').value='';tecSel=nome;await atualizarTecnicosMain(true);msg('tecMainMsg','Técnico adicionado.','ok')}catch(e){msg('tecMainMsg','Erro: '+e.message,'bad')}}
async function excluirTecMain(id,nome){try{if(eqsTec(nome).length||matsTec(nome).length){alert('Não exclua técnico com equipamento/material em posse. Devolva ou transfira antes.');return}if(!id){alert('Este técnico aparece por movimentação antiga, mas não tem cadastro direto para excluir.');return}if(!confirm('Excluir técnico '+nome+'?'))return;await del('tecnicos',id);D.tecnicos=D.tecnicos.filter(t=>t.id!==id);if(tecSel===nome)tecSel='';await atualizarTecnicosMain(false);msg('tecMainMsg','Técnico excluído.','ok')}catch(e){msg('tecMainMsg','Erro ao excluir: '+e.message,'bad')}}
function copiarTecMain(){if(!tecSel){msg('tecMainMsg','Selecione um técnico.','bad');return}let txt='RELATÓRIO DO TÉCNICO\nTécnico: '+tecSel+'\nEquipamentos: '+eqsTec(tecSel).length+'\nMateriais: '+matsTec(tecSel).length+'\n\nEQUIPAMENTOS:\n'+(eqsTec(tecSel).map(e=>'- '+(e.codigo||'')+' | '+nomeEq(e)+' | '+(e.mac||e.serial||'-')+' | '+(e.status||'')).join('\n')||'Sem equipamentos.')+'\n\nMATERIAIS:\n'+(matsTec(tecSel).map(m=>'- '+m.tipo+' '+(m.marca||'')+' '+m.modelo+' | '+m.quantidade+' '+m.unidade_saida).join('\n')||'Sem materiais.');navigator.clipboard.writeText(txt).then(()=>msg('tecMainMsg','Copiado.','ok'))}
function bindTecMain(){if(T('tecMainBusca'))T('tecMainBusca').oninput=renderListaTecnicosMain;if(T('tecMainAdd'))T('tecMainAdd').onclick=addTecMain;if(T('tecMainReload'))T('tecMainReload').onclick=()=>atualizarTecnicosMain(true).then(()=>msg('tecMainMsg','Lista atualizada.','ok'));if(T('tecMainVer'))T('tecMainVer').onclick=()=>{if(!tecSel){msg('tecMainMsg','Selecione um técnico.','bad');return}T('tecMainArea').innerHTML=tabelaTec()};if(T('tecMainCopiar'))T('tecMainCopiar').onclick=copiarTecMain;if(T('tecMainPrint'))T('tecMainPrint').onclick=()=>window.print()}
const pgOriginal=window.pg;window.pg=function(p){pgOriginal(p);if(p==='tecnicosMain')setTimeout(()=>atualizarTecnicosMain(true),100)};
const renderOriginal=window.render;window.render=function(){renderOriginal();bindTecMain();if(T('p-tecnicosMain')&&T('p-tecnicosMain').classList.contains('on'))atualizarTecnicosMain(false)};
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{bindTecMain();atualizarTecnicosMain(false)},1500));
})();

/* Entrada em lote de equipamentos com SN/MAC - V37 */
(function(){
function L(id){return document.getElementById(id)}
function H(v){try{return esc(v??'')}catch(e){return String(v??'')}}
function K(v){try{return N(v||'')}catch(e){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}}
function normalMac(v){let x=K(v);if(!x)return '';if(x.length!==12)return String(v||'').trim().toUpperCase();return x.match(/.{1,2}/g).join(':')}
function seq(pre,field,offset){let m=0;(D.equipamentos||[]).forEach(e=>{let r=String(e[field]||'').match(new RegExp('^'+pre+'-(\\d+)$','i'));if(r)m=Math.max(m,+r[1])});return pre+'-'+String(m+offset).padStart(4,'0')}
function rowClass(r){return r.erros.length?'rowBad':'rowOk'}
let lotePreview=[];
function addEntradaLoteUI(){
  let sec=L('p-entrada'); if(!sec||L('loteBox'))return;
  sec.insertAdjacentHTML('beforeend',`<div class="card" id="loteBox"><h2>Entrada em lote por SN/MAC</h2><p class="small">Cole um equipamento por linha. Aceita: <b>SN, MAC</b>, <b>SN; MAC</b>, tabulação ou espaço. O sistema valida duplicidade antes de gravar.</p><textarea id="loteTexto" rows="8" placeholder="SN001, 84:16:F9:AA:10:01\nSN002, 84:16:F9:AA:10:02"></textarea><p><button id="loteValidar" class="warn">Validar lote</button><button id="loteConfirmar" class="pri" disabled>Confirmar entrada em lote</button><button id="loteLimpar" class="bad">Limpar lote</button></p><div id="loteMsg" class="msg">Aguardando colagem dos SN/MAC.</div><div class="tbl" style="margin-top:10px"><table><thead><tr><th>Linha</th><th>Serial/SN</th><th>MAC normalizado</th><th>Status</th></tr></thead><tbody id="loteTabela"><tr><td colspan="4">Sem prévia.</td></tr></tbody></table></div></div>`);
  L('loteValidar').onclick=validarLote;
  L('loteConfirmar').onclick=confirmarLote;
  L('loteLimpar').onclick=()=>{lotePreview=[];L('loteTexto').value='';renderLote([],'Aguardando colagem dos SN/MAC.','')};
}
function parseLinha(txt,i){
  let raw=String(txt||'').trim();
  if(!raw)return null;
  let p=raw.split(/[;,\t]+/).map(x=>x.trim()).filter(Boolean);
  if(p.length<2)p=raw.split(/\s+/).map(x=>x.trim()).filter(Boolean);
  let sn=p[0]||'', mac=p[1]||'';
  return {linha:i+1,serial:sn.trim(),mac:normalMac(mac),raw,erros:[]};
}
function validarLote(){
  let tipo=L('tipo')?.value||'', marca=L('marca')?.value||'', modelo=L('modelo')?.value||'';
  if(!tipo||!marca||!modelo){renderLote([],'Selecione tipo, marca e modelo antes de validar.','bad');return}
  let linhas=(L('loteTexto')?.value||'').split(/\r?\n/).map(parseLinha).filter(Boolean);
  if(!linhas.length){renderLote([],'Cole pelo menos uma linha com SN e MAC.','bad');return}
  let snSet=new Set(), macSet=new Set();
  for(let r of linhas){
    if(!r.serial)r.erros.push('SN vazio');
    if(!r.mac)r.erros.push('MAC vazio');
    if(r.mac&&K(r.mac).length!==12)r.erros.push('MAC inválido');
    let snK=K(r.serial), macK=K(r.mac);
    if(snK&&snSet.has(snK))r.erros.push('SN duplicado no lote'); else if(snK)snSet.add(snK);
    if(macK&&macSet.has(macK))r.erros.push('MAC duplicado no lote'); else if(macK)macSet.add(macK);
    if((D.equipamentos||[]).some(e=>snK&&K(e.serial)===snK))r.erros.push('SN já cadastrado');
    if((D.equipamentos||[]).some(e=>macK&&K(e.mac)===macK))r.erros.push('MAC já cadastrado');
  }
  lotePreview=linhas;
  let erros=linhas.filter(r=>r.erros.length).length;
  renderLote(linhas,`Total: ${linhas.length} | Válidos: ${linhas.length-erros} | Com erro: ${erros}`,erros?'bad':'ok');
}
function renderLote(arr,text,cls){
  if(L('loteMsg')){L('loteMsg').textContent=text;L('loteMsg').className='msg '+(cls||'')}
  if(L('loteConfirmar'))L('loteConfirmar').disabled=!(arr&&arr.length&&!arr.some(r=>r.erros.length));
  if(L('loteTabela'))L('loteTabela').innerHTML=(arr&&arr.length?arr.map(r=>`<tr class="${rowClass(r)}"><td>${r.linha}</td><td>${H(r.serial)}</td><td>${H(r.mac)}</td><td>${r.erros.length?H(r.erros.join(' | ')):'OK'}</td></tr>`).join(''):'<tr><td colspan="4">Sem prévia.</td></tr>');
}
async function confirmarLote(){
  try{
    validarLote();
    if(!lotePreview.length||lotePreview.some(r=>r.erros.length)){renderLote(lotePreview,'Corrija os erros antes de confirmar.','bad');return}
    let tipo=L('tipo').value,marca=L('marca').value,modelo=L('modelo').value,local=L('local').value||'Estoque central',custo=Number(L('custo').value||0),fornecedor=L('forn').value||'',nf=L('nf').value||'',responsavel=L('resp').value||'',obs=L('obs').value||'';
    let lote=await ins('lotes_entrada',{data:today(),fornecedor,nf,responsavel,tipo,marca,modelo,local_destino:local,total_itens:lotePreview.length,observacao:obs});
    let offset=1;
    for(let r of lotePreview){
      let e={codigo:seq('EQP','codigo',offset),patrimonio:seq('PAT','patrimonio',offset),tipo,marca,modelo,mac:r.mac,serial:r.serial,status:'Em estoque',local,custo,lote_id:lote.id};
      let saved=await db().from('equipamentos').insert(e).select().single(); if(saved.error)throw saved.error;
      let eq=fromEq(saved.data); D.equipamentos.unshift(eq);
      try{await ins('inventario',{equipamento_id:eq.id,conferido:false,data:null,obs:null})}catch(_e){}
      let mov={equipamento_id:eq.id,data:today(),tipo:'Entrada em lote',codigo:eq.codigo,mac:eq.mac||null,serial:eq.serial||null,destino:local,motivo:'Entrada',status_final:eq.status,obs,fornecedor,nf,responsavel,lote_id:lote.id};
      let mv=await db().from('movimentos').insert(mov).select().single(); if(mv.error)throw mv.error; D.movimentos.unshift(mv.data);
      offset++;
    }
    ['loteTexto','mac','serial','custo','forn','nf','resp','obs'].forEach(id=>{if(L(id))L(id).value=''});
    lotePreview=[];render();renderLote([],`Entrada em lote registrada: ${lote.total_itens} equipamento(s). Lote vinculado à NF ${nf||'-'}.`,'ok');
  }catch(e){if(L('loteMsg')){L('loteMsg').textContent='Erro ao gravar lote: '+e.message;L('loteMsg').className='msg bad'}}
}
const oldRender=window.render;window.render=function(){oldRender();addEntradaLoteUI()};
document.addEventListener('DOMContentLoaded',()=>setTimeout(addEntradaLoteUI,1200));
})();
