(function(){
function E(id){return document.getElementById(id)}
function addAfter(ref,html){if(ref)ref.insertAdjacentHTML('afterend',html)}
function ensureMateriais(){
  var side=document.querySelector('.side');
  if(side&&!document.querySelector('[data-p="materiaisMain"]')){
    var ref=document.querySelector('[data-p="entrada"]')||document.querySelector('[data-p="tecnico"]')||document.querySelector('[data-p="dash"]');
    addAfter(ref,'<button class="nav" data-p="materiaisMain">Materiais</button>');
  }
  var main=document.querySelector('.main');
  if(main&&!E('p-materiaisMain')){
    var refSec=E('p-tecnico')||E('p-estoque')||E('p-entrada');
    var html='<section id="p-materiaisMain" class="page"><div class="card"><h2>Materiais</h2><p class="small">Controle separado para consumo e material fechado. Use esta tela para RJ45, conectores, Drop, cabo e itens por quantidade.</p></div><div class="kpis" id="matMainKpis"></div><div class="grid"><div class="card"><h2>Entrada de material</h2><select id="matMainProduto"></select><input id="matMainQtd" type="number" min="1" placeholder="Quantidade"><textarea id="matMainObs" placeholder="Observação"></textarea><button id="matMainEntrada" class="pri">Registrar entrada</button><div id="matMainMsg" class="msg"></div></div><div class="card"><h2>Saída para técnico</h2><select id="matMainProdutoS"></select><select id="matMainTec"></select><input id="matMainQtdS" type="number" min="1" placeholder="Quantidade"><textarea id="matMainObsS" placeholder="Observação"></textarea><button id="matMainSaida" class="ok">Enviar para técnico</button><div id="matMainMsgS" class="msg"></div></div></div><div class="card"><h2>Saldos de materiais</h2><input id="matMainBusca" placeholder="Buscar material, técnico ou local"><div class="tbl"><table><thead><tr><th>Categoria</th><th>Material</th><th>Unidade</th><th>Local</th><th>Técnico</th><th>Quantidade</th><th>Regra</th></tr></thead><tbody id="matMainSaldoT"></tbody></table></div></div><div class="card"><h2>Histórico de materiais</h2><div class="tbl"><table><thead><tr><th>Data</th><th>Material</th><th>Qtd</th><th>Origem</th><th>Destino</th><th>Técnico</th><th>Obs</th></tr></thead><tbody id="matMainMovT"></tbody></table></div></div></section>';
    if(refSec)refSec.insertAdjacentHTML('afterend',html); else main.insertAdjacentHTML('beforeend',html);
  }
}
function cleanTecnicos(){
  var keep=false;
  document.querySelectorAll('.nav').forEach(function(b){
    var txt=(b.textContent||'').trim().toLowerCase();
    if(txt==='técnicos'||txt==='tecnicos'){
      if(b.dataset.p==='tecnicosMain'&&!keep){keep=true;return}
      b.remove();
    }
  });
  var side=document.querySelector('.side');
  if(side&&!document.querySelector('[data-p="tecnicosMain"]')){
    var ref=document.querySelector('[data-p="tecnico"]')||document.querySelector('[data-p="materiaisMain"]')||document.querySelector('[data-p="estoque"]');
    addAfter(ref,'<button class="nav" data-p="tecnicosMain">Técnicos</button>');
  }
  ['p-tecnicosFull','p-tecnicos65','p-tecnicosFix'].forEach(function(id){var x=E(id);if(x)x.remove()});
}
function bindNav(){
  document.querySelectorAll('.nav').forEach(function(b){
    b.onclick=function(){ if(typeof pg==='function') pg(b.dataset.p); };
  });
}
function run(){ensureMateriais();cleanTecnicos();bindNav();}
document.addEventListener('DOMContentLoaded',function(){setTimeout(run,500);setTimeout(run,2500);setTimeout(run,6000);setTimeout(run,10000)});
setInterval(run,3000);
})();