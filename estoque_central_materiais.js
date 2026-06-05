(function(){
let saldosCentralCache=[];
function E(id){return document.getElementById(id)}
function X(v){try{return esc(v??'')}catch(e){return String(v??'')}}
function dinheiro(v){try{return br(Number(v||0))}catch(e){return 'R$ '+Number(v||0).toFixed(2)}}
function qtd(v){let n=Number(v||0);return Number.isInteger(n)?String(n):String(n).replace('.',',')}
function garantirLegacyEstT(){
 if(E('estT'))return;
 const sec=E('p-estoque')||document.body;
 sec.insertAdjacentHTML('beforeend','<div id="legacyEstTHolder" style="display:none!important"><table><tbody id="estT"></tbody></table></div>');
}
async function carregarSaldosCentral(){
 try{saldosCentralCache=await loadTable('materiais_saldos','tipo',true)}catch(e){saldosCentralCache=[]}
}
function eqPatrimonios(){return (D.equipamentos||[]).filter(e=>e.status==='Em estoque')}
function matCentral(){return (saldosCentralCache||[]).filter(m=>(m.local||'')==='Estoque central'&&!m.tecnico&&Number(m.quantidade||0)>0)}
function consumoCentral(){return matCentral().filter(m=>(m.categoria||'')==='Consumo')}
function fechadoCentral(){return matCentral().filter(m=>(m.categoria||'')==='Material fechado')}
function tabelaPatrimonios(lista){
 if(!lista.length)return '<div class="msg">Nenhum patrimônio no estoque central.</div>';
 return '<div class="tbl"><table><thead><tr><th>Código</th><th>Tipo</th><th>Marca</th><th>Modelo</th><th>MAC/SN</th><th>Patrimônio</th><th>Custo</th><th>Ações</th></tr></thead><tbody>'+lista.map(e=>'<tr><td>'+X(e.codigo)+'</td><td>'+X(e.tipo)+'</td><td>'+X(e.marca)+'</td><td>'+X(e.modelo)+'</td><td>'+X(e.mac||e.serial||'')+'</td><td>'+X(e.patrimonio||'')+'</td><td>'+dinheiro(e.custo||0)+'</td><td><button onclick="editEq(\''+e.id+'\')">Editar</button><button class="warn" onclick="inutilizarEq(\''+e.id+'\')">Inutilizar</button></td></tr>').join('')+'</tbody></table></div>'
}
function tabelaMateriais(lista,tipo){
 if(!lista.length)return '<div class="msg">Nenhum '+tipo+' no estoque central.</div>';
 return '<div class="tbl"><table><thead><tr><th>Categoria</th><th>Material</th><th>Quantidade em estoque</th><th>Unidade</th><th>Regra</th></tr></thead><tbody>'+lista.map(m=>'<tr><td>'+X(m.categoria||'')+'</td><td>'+X((m.tipo||'')+' '+(m.marca||'')+' '+(m.modelo||''))+'</td><td><b>'+X(qtd(m.quantidade))+'</b></td><td>'+X(m.unidade_saida||'')+'</td><td>'+X((m.categoria||'')==='Material fechado'?'Sai somente fechado':'Pode sair por quantidade')+'</td></tr>').join('')+'</tbody></table></div>'
}
function garantirLayoutCentral(){
 const sec=E('p-estoque');if(!sec)return;
 const card=sec.querySelector('.card');
 if(card&&!E('centralPatrimoniosBox')){
  card.innerHTML='<h2>Estoque central</h2><p class="small">Separado por patrimônio, materiais de consumo e materiais fechados.</p><div class="kpis" id="centralKpis"></div><h3>Patrimônios / equipamentos unitários</h3><div id="centralPatrimoniosBox"></div><div style="display:none!important"><table><tbody id="estT"></tbody></table></div>';
 }
 garantirLegacyEstT();
 if(!E('centralConsumoBox'))sec.insertAdjacentHTML('beforeend','<div class="card"><h2>Materiais de consumo no estoque central</h2><p class="small">Itens controlados por quantidade: conectores, RJ45, adaptadores, abraçadeiras e similares.</p><div id="centralConsumoBox"></div></div>');
 if(!E('centralFechadoBox'))sec.insertAdjacentHTML('beforeend','<div class="card"><h2>Materiais fechados no estoque central</h2><p class="small">Itens que saem fechados: bobinas, caixas e pacotes fechados.</p><div id="centralFechadoBox"></div></div>');
}
async function renderEstoqueCentralCompleto(){
 const sec=E('p-estoque');if(!sec)return;
 garantirLayoutCentral();
 await carregarSaldosCentral();
 const pats=eqPatrimonios(), cons=consumoCentral(), fech=fechadoCentral();
 const totalCons=cons.reduce((s,m)=>s+Number(m.quantidade||0),0);
 const totalFech=fech.reduce((s,m)=>s+Number(m.quantidade||0),0);
 if(E('centralKpis'))E('centralKpis').innerHTML='<div class="kpi"><small>Patrimônios</small><b>'+pats.length+'</b></div><div class="kpi"><small>Itens de consumo</small><b>'+cons.length+'</b></div><div class="kpi"><small>Qtd consumo</small><b>'+qtd(totalCons)+'</b></div><div class="kpi"><small>Qtd fechados</small><b>'+qtd(totalFech)+'</b></div>';
 if(E('centralPatrimoniosBox'))E('centralPatrimoniosBox').innerHTML=tabelaPatrimonios(pats);
 if(E('centralConsumoBox'))E('centralConsumoBox').innerHTML=tabelaMateriais(cons,'material de consumo');
 if(E('centralFechadoBox'))E('centralFechadoBox').innerHTML=tabelaMateriais(fech,'material fechado');
 garantirLegacyEstT();
}
window.renderEstoqueCentralCompleto=renderEstoqueCentralCompleto;
const pgBase=window.pg;
window.pg=function(p){garantirLegacyEstT();pgBase(p);if(p==='estoque')setTimeout(renderEstoqueCentralCompleto,150)};
const renderBase=window.render;
window.render=function(){garantirLegacyEstT();renderBase();garantirLegacyEstT();if(E('p-estoque')&&E('p-estoque').classList.contains('on'))setTimeout(renderEstoqueCentralCompleto,50)};
document.addEventListener('DOMContentLoaded',function(){setTimeout(garantirLegacyEstT,500);setTimeout(renderEstoqueCentralCompleto,2500);setTimeout(renderEstoqueCentralCompleto,7000)});
})();