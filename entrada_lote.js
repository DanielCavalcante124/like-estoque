(function(){
let loteItens=[];
function E(id){return document.getElementById(id)}
function X(v){try{return esc(v??'')}catch(e){return String(v??'')}}
function norm(v){try{return N(v)}catch(e){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}}
function n(v){return Number(String(v||'').replace(',','.'))||0}
function alerta(t,c){let el=E('loteMsg');if(el){el.textContent=t;el.className='msg '+(c||'')}} 
function codSeq(pre,campo,extra){let max=0;(D.equipamentos||[]).forEach(e=>{let m=String(e[campo]||'').match(new RegExp('^'+pre+'-(\\d+)$','i'));if(m)max=Math.max(max,+m[1])});(extra||[]).forEach(e=>{let m=String(e[campo]||'').match(new RegExp('^'+pre+'-(\\d+)$','i'));if(m)max=Math.max(max,+m[1])});return pre+'-'+String(max+1).padStart(4,'0')}
function modelosPatrimonio(){return (D.modelos||[]).filter(m=>{let txt=((m.tipo||'')+' '+(m.modelo||'')).toLowerCase();let c=String(m.categoria_estoque||m.categoria||m.controle||'').toLowerCase();if(/rj45|conector|drop|bobina|cabo de rede|cat5|cat6|adaptador|abraçadeira|abracadeira|bucha|parafuso|fita/.test(txt))return false;return true})}
function preencherSelectsLote(){
 let old={tipo:E('loteTipo')&&E('loteTipo').value,marca:E('loteMarca')&&E('loteMarca').value,modelo:E('loteModelo')&&E('loteModelo').value,local:E('loteLocal')&&E('loteLocal').value};
 let mods=modelosPatrimonio();
 let tipos=[...new Set(mods.map(m=>m.tipo).filter(Boolean))].sort();
 let marcas=[...new Set(mods.map(m=>m.marca).filter(Boolean))].sort();
 if(E('loteTipo'))E('loteTipo').innerHTML='<option value="">Tipo</option>'+tipos.map(x=>'<option>'+X(x)+'</option>').join('');
 if(E('loteMarca'))E('loteMarca').innerHTML='<option value="">Marca</option>'+marcas.map(x=>'<option>'+X(x)+'</option>').join('');
 if(E('loteTipo')&&tipos.includes(old.tipo))E('loteTipo').value=old.tipo;
 if(E('loteMarca')&&marcas.includes(old.marca))E('loteMarca').value=old.marca;
 let filtrados=mods.filter(m=>(!E('loteTipo').value||m.tipo===E('loteTipo').value)&&(!E('loteMarca').value||m.marca===E('loteMarca').value));
 if(E('loteModelo'))E('loteModelo').innerHTML='<option value="">Modelo</option>'+filtrados.map(m=>'<option>'+X(m.modelo)+'</option>').join('');
 if(E('loteModelo')&&filtrados.some(m=>m.modelo===old.modelo))E('loteModelo').value=old.modelo;
 if(E('loteLocal')){E('loteLocal').innerHTML=(D.locais||[]).map(l=>'<option>'+X(l.nome)+'</option>').join(''); if((D.locais||[]).some(l=>l.nome===old.local))E('loteLocal').value=old.local; else if((D.locais||[]).some(l=>l.nome==='Estoque central'))E('loteLocal').value='Estoque central'}
}
function loteAtual(){return {tipo:E('loteTipo').value,marca:E('loteMarca').value,modelo:E('loteModelo').value,local:E('loteLocal').value||'Estoque central',qtd:n(E('loteQtd').value),fornecedor:E('loteForn').value.trim(),nf:E('loteNf').value.trim(),resp:E('loteResp').value.trim(),custo:n(E('loteCusto').value)}}
function duplicadoSistema(mac,sn){return (D.equipamentos||[]).some(e=>(mac&&norm(e.mac)===norm(mac))||(sn&&norm(e.serial)===norm(sn)))}
function duplicadoLote(mac,sn){return loteItens.some(e=>(mac&&norm(e.mac)===norm(mac))||(sn&&norm(e.serial)===norm(sn)))}
function addItemLote(){
 let l=loteAtual(),mac=(E('loteMac').value||'').trim(),sn=(E('loteSn').value||'').trim();
 if(!l.tipo||!l.marca||!l.modelo){alerta('Selecione tipo, marca e modelo do lote.','bad');return}
 if(!l.qtd||l.qtd<=0){alerta('Informe a quantidade esperada do lote.','bad');return}
 if(loteItens.length>=l.qtd){alerta('Quantidade esperada já atingida. Feche o lote ou aumente a quantidade.','bad');return}
 if(!mac||!sn){alerta('Bipe MAC e SN da mesma ONT antes de adicionar.','bad');return}
 if(duplicadoSistema(mac,sn)){alerta('MAC ou SN já existe no sistema. Item bloqueado.','bad');return}
 if(duplicadoLote(mac,sn)){alerta('MAC ou SN repetido neste lote. Item bloqueado.','bad');return}
 loteItens.push({mac,serial:sn});
 E('loteMac').value='';E('loteSn').value='';E('loteMac').focus();
 renderLote();alerta('Item adicionado ao lote: '+loteItens.length+'/'+l.qtd,'ok')
}
function removeItemLote(i){loteItens.splice(i,1);renderLote();alerta('Item removido do lote.','warn')}
function renderLote(){
 let l=loteAtual(),rest=Math.max((l.qtd||0)-loteItens.length,0);
 if(E('loteProg'))E('loteProg').innerHTML='<div class="kpis"><div class="kpi"><small>Esperado</small><b>'+X(l.qtd||0)+'</b></div><div class="kpi"><small>Lido</small><b>'+loteItens.length+'</b></div><div class="kpi"><small>Faltam</small><b>'+rest+'</b></div><div class="kpi"><small>Status</small><b>'+(l.qtd&&loteItens.length===l.qtd?'OK':'Aberto')+'</b></div></div>';
 if(E('loteT'))E('loteT').innerHTML=loteItens.map((it,i)=>'<tr><td>'+(i+1)+'</td><td>'+X(it.mac)+'</td><td>'+X(it.serial)+'</td><td><button class="bad" onclick="removeItemLote('+i+')">Remover</button></td></tr>').join('')||'<tr><td colspan="4">Nenhum item bipado.</td></tr>';
}
async function fecharLote(){
 try{
  let l=loteAtual();
  if(!l.tipo||!l.marca||!l.modelo){alerta('Selecione tipo, marca e modelo.','bad');return}
  if(!loteItens.length){alerta('Nenhum item bipado.','bad');return}
  if(l.qtd&&loteItens.length!==l.qtd&&!confirm('Quantidade lida diferente da esperada. Fechar com divergência?'))return;
  let loteCod='LOTE-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+String(Date.now()).slice(-4);
  let criados=[];
  for(let i=0;i<loteItens.length;i++){
   let it=loteItens[i];
   let base={codigo:codSeq('EQP','codigo',criados),patrimonio:codSeq('PAT','patrimonio',criados),tipo:l.tipo,marca:l.marca,modelo:l.modelo,mac:it.mac,serial:it.serial,status:'Em estoque',local:l.local,tecnico_atual:null,cliente_atual:null,os_atual:null,motivo_atual:null,custo:l.custo,inutilizado_obs:null};
   let saved=await ins('equipamentos',base);
   let eq=typeof fromEq==='function'?fromEq(saved):saved;
   criados.push(eq);D.equipamentos.unshift(eq);
   try{await ins('inventario',{equipamento_id:eq.id,conferido:false,data:null,obs:null})}catch(_e){}
   await ins('movimentos',{equipamento_id:eq.id,data:today(),tipo:'Entrada em lote',codigo:eq.codigo,mac:eq.mac||null,serial:eq.serial||null,tecnico:'',destino:l.local,cliente:'',os:'',motivo:'Entrada em lote '+loteCod,condicao:'',status_final:'Em estoque',obs:'Lote '+loteCod+' | NF '+l.nf+' | Fornecedor '+l.fornecedor+' | Responsável '+l.resp});
  }
  try{await loadAll()}catch(_e){try{render()}catch(__e){}}
  loteItens=[];renderLote();alerta('Lote fechado: '+criados.length+' equipamentos criados em estoque central. Código: '+loteCod,'ok');
 }catch(e){alerta('Erro ao fechar lote: '+e.message,'bad')}
}
function criarTela(){
 let sec=E('p-entrada');if(!sec||E('entradaLoteBox'))return;
 sec.insertAdjacentHTML('beforeend','<div class="card" id="entradaLoteBox"><h2>Entrada em lote com MAC/SN</h2><p class="small">Use para ONT, roteador ou equipamento unitário. Bipe MAC e SN do mesmo equipamento antes de adicionar o item.</p><div class="grid4"><select id="loteTipo"></select><select id="loteMarca"></select><select id="loteModelo"></select><input id="loteQtd" type="number" min="1" placeholder="Quantidade esperada"><select id="loteLocal"></select><input id="loteCusto" type="number" placeholder="Custo unitário"><input id="loteForn" placeholder="Fornecedor"><input id="loteNf" placeholder="Nota fiscal"><input id="loteResp" placeholder="Responsável"></div><div class="grid"><div><h3>Bipagem do item atual</h3><input id="loteMac" placeholder="Bipe o MAC"><input id="loteSn" placeholder="Bipe o SN da mesma ONT"><button id="loteAdd" class="pri">Adicionar item ao lote</button><button id="loteFechar" class="ok">Fechar lote e registrar entrada</button><div id="loteMsg" class="msg"></div></div><div><h3>Progresso</h3><div id="loteProg"></div></div></div><div class="tbl"><table><thead><tr><th>#</th><th>MAC</th><th>SN</th><th>Ação</th></tr></thead><tbody id="loteT"></tbody></table></div></div>');
 preencherSelectsLote();renderLote();bind();
}
function bind(){
 ['loteTipo','loteMarca'].forEach(id=>{if(E(id))E(id).onchange=function(){preencherSelectsLote();renderLote()}});
 ['loteQtd','loteForn','loteNf','loteResp','loteCusto'].forEach(id=>{if(E(id))E(id).oninput=renderLote});
 if(E('loteMac'))E('loteMac').onkeydown=function(ev){if(ev.key==='Enter'){ev.preventDefault();E('loteSn').focus()}};
 if(E('loteSn'))E('loteSn').onkeydown=function(ev){if(ev.key==='Enter'){ev.preventDefault();addItemLote()}};
 if(E('loteAdd'))E('loteAdd').onclick=addItemLote;
 if(E('loteFechar'))E('loteFechar').onclick=fecharLote;
}
window.removeItemLote=removeItemLote;
const pgBase=window.pg;window.pg=function(p){pgBase(p);if(p==='entrada')setTimeout(()=>{criarTela();preencherSelectsLote();renderLote()},150)};
const renderBase=window.render;window.render=function(){renderBase();criarTela();preencherSelectsLote();renderLote()};
document.addEventListener('DOMContentLoaded',function(){setTimeout(criarTela,1800);setTimeout(()=>{preencherSelectsLote();renderLote()},3500)});
})();