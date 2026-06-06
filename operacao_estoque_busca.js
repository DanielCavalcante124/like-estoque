(function(){
let matsOperacao=[];
function E(id){return document.getElementById(id)}
function X(v){try{return esc(v??'')}catch(e){return String(v??'')}}
function norm(v){try{return N(v)}catch(e){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}}
function money(v){try{return br(Number(v||0))}catch(e){return 'R$ '+Number(v||0).toFixed(2)}}
async function loadMats(){try{matsOperacao=await loadTable('materiais_saldos','tipo',true)}catch(e){matsOperacao=[]}}
function ensureNav(){
 const side=document.querySelector('.side');if(!side)return;
 if(!document.querySelector('[data-p="operacaoEstoque"]')){
  const ref=document.querySelector('[data-p="entrada"]')||document.querySelector('[data-p="materiaisMain"]')||document.querySelector('[data-p="dash"]');
  (ref||side.lastElementChild).insertAdjacentHTML('afterend','<button class="nav" data-p="operacaoEstoque">Operação estoque</button>');
 }
 const b=document.querySelector('[data-p="operacaoEstoque"]');if(b)b.onclick=function(){pg('operacaoEstoque')};
}
function ensurePage(){
 const main=document.querySelector('.main');if(!main)return;
 let sec=E('p-operacaoEstoque');
 if(!sec){
  const ref=E('p-materiaisMain')||E('p-entrada')||E('p-dash');
  const html='<section id="p-operacaoEstoque" class="page"><div class="card"><h2>Operação estoque</h2><p class="small">Busca rápida por MAC, SN, código, patrimônio, modelo, técnico, cliente ou material.</p><input id="opBusca" placeholder="Digite ou bipe MAC/SN/código/modelo/material"><div id="opResumo" class="msg">Digite para pesquisar.</div><div id="opResultados"></div></div></section>';
  if(ref)ref.insertAdjacentHTML('afterend',html);else main.insertAdjacentHTML('beforeend',html);
 }else if(!E('opBusca')){
  sec.innerHTML='<div class="card"><h2>Operação estoque</h2><p class="small">Busca rápida por MAC, SN, código, patrimônio, modelo, técnico, cliente ou material.</p><input id="opBusca" placeholder="Digite ou bipe MAC/SN/código/modelo/material"><div id="opResumo" class="msg">Digite para pesquisar.</div><div id="opResultados"></div></div>';
 }
 bindBusca();
}
function textoEq(e){return [e.codigo,e.patrimonio,e.tipo,e.marca,e.modelo,e.mac,e.serial,e.status,e.local,e.tecnicoAtual,e.tecnico_atual,e.clienteAtual,e.cliente_atual,e.osAtual,e.os_atual,e.motivoAtual,e.motivo_atual].join(' ')}
function textoMat(m){return [m.tipo,m.marca,m.modelo,m.categoria,m.unidade_saida,m.local,m.tecnico,m.quantidade].join(' ')}
function match(q,text){const a=norm(q),b=norm(text);return b.includes(a)}
function cardEq(e){
 const tec=e.tecnicoAtual||e.tecnico_atual||'';
 const cli=e.clienteAtual||e.cliente_atual||'';
 const os=e.osAtual||e.os_atual||'';
 return '<div class="card"><h3>'+X(e.codigo)+' • '+X(e.tipo+' '+e.marca+' '+e.modelo)+'</h3><p><span class="status">'+X(e.status||'')+'</span> <span class="status ok">'+X(e.local||'')+'</span></p><div class="grid4"><div><b>MAC</b><br>'+X(e.mac||'-')+'</div><div><b>SN</b><br>'+X(e.serial||'-')+'</div><div><b>Patrimônio</b><br>'+X(e.patrimonio||'-')+'</div><div><b>Custo</b><br>'+money(e.custo||0)+'</div></div><p><b>Técnico:</b> '+X(tec||'-')+'<br><b>Cliente:</b> '+X(cli||'-')+'<br><b>OS:</b> '+X(os||'-')+'</p><button class="pri" onclick="opUsarSaida(\''+e.id+'\')">Usar na saída</button><button class="ok" onclick="opUsarDevolucao(\''+e.id+'\')">Usar na devolução</button><button onclick="editEq(\''+e.id+'\')">Editar</button></div>';
}
function tabelaMats(lista){
 if(!lista.length)return '';
 return '<div class="card"><h3>Materiais encontrados</h3><div class="tbl"><table><thead><tr><th>Categoria</th><th>Material</th><th>Qtd</th><th>Unidade</th><th>Local</th><th>Técnico</th></tr></thead><tbody>'+lista.map(m=>'<tr><td>'+X(m.categoria||'')+'</td><td>'+X((m.tipo||'')+' '+(m.marca||'')+' '+(m.modelo||''))+'</td><td><b>'+X(m.quantidade||0)+'</b></td><td>'+X(m.unidade_saida||'')+'</td><td>'+X(m.local||'')+'</td><td>'+X(m.tecnico||'-')+'</td></tr>').join('')+'</tbody></table></div></div>';
}
function pesquisar(){
 const q=(E('opBusca')&&E('opBusca').value||'').trim();
 const out=E('opResultados'),res=E('opResumo');if(!out||!res)return;
 if(!q){out.innerHTML='';res.textContent='Digite para pesquisar.';res.className='msg';return}
 const eqs=(D.equipamentos||[]).filter(e=>match(q,textoEq(e))).slice(0,30);
 const mats=(matsOperacao||[]).filter(m=>match(q,textoMat(m))).slice(0,30);
 res.textContent='Encontrado(s): '+eqs.length+' equipamento(s) e '+mats.length+' material(is).';res.className='msg '+((eqs.length||mats.length)?'ok':'bad');
 out.innerHTML=(eqs.map(cardEq).join('')||'')+tabelaMats(mats)||'<div class="msg bad">Nenhum item encontrado. Confira MAC/SN sem espaço ou tente parte do modelo.</div>';
 try{if(window.paginarTabelas)window.paginarTabelas()}catch(e){}
}
function bindBusca(){const b=E('opBusca');if(b&&!b.dataset.boundOp){b.dataset.boundOp=1;b.oninput=pesquisar;b.onkeyup=pesquisar}}
window.opUsarSaida=function(id){
 const e=(D.equipamentos||[]).find(x=>x.id===id);if(!e)return;
 try{pg('saida');setTimeout(function(){if(E('q')){E('q').value=e.mac||e.serial||e.codigo;if(typeof choose==='function')choose(id);else if(typeof search==='function')search('q','sugs','choose')}},150)}catch(err){}
};
window.opUsarDevolucao=function(id){
 const e=(D.equipamentos||[]).find(x=>x.id===id);if(!e)return;
 try{pg('devolucao');setTimeout(function(){if(E('dq')){E('dq').value=e.mac||e.serial||e.codigo;if(typeof chooseD==='function')chooseD(id);else if(typeof search==='function')search('dq','dsugs','chooseD')}},150)}catch(err){}
};
function boot(){ensureNav();ensurePage();loadMats().then(pesquisar)}
const pgBase=window.pg;
window.pg=function(p){ensureNav();ensurePage();pgBase(p);if(p==='operacaoEstoque')setTimeout(function(){loadMats().then(pesquisar);if(E('opBusca'))E('opBusca').focus()},150)};
const renderBase=window.render;
window.render=function(){renderBase();ensureNav();ensurePage();if(E('p-operacaoEstoque')&&E('p-operacaoEstoque').classList.contains('on'))loadMats().then(pesquisar)};
document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,1000);setTimeout(boot,4000);setTimeout(boot,9000)});
})();