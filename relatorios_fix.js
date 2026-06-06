(function(){
function E(id){return document.getElementById(id)}
function bind(){document.querySelectorAll('.nav').forEach(function(b){b.onclick=function(){if(typeof pg==='function')pg(b.dataset.p)}})}
function fixRelatorios(){
 var side=document.querySelector('.side');
 var main=document.querySelector('.main');
 if(!side||!main)return;
 var relBtn=document.querySelector('[data-p="relatorios"]');
 var gerBtn=null;
 document.querySelectorAll('.nav').forEach(function(b){
  var t=(b.textContent||'').trim().toLowerCase();
  if(t.includes('relatório')||t.includes('relatorio')){
   if(!relBtn)gerBtn=b;
  }
 });
 if(gerBtn){
  gerBtn.textContent='Relatórios';
  gerBtn.dataset.p='relatorios';
  relBtn=gerBtn;
 }
 if(!relBtn){
  var ref=document.querySelector('[data-p="historico"]')||document.querySelector('[data-p="cadastros"]')||side.lastElementChild;
  ref.insertAdjacentHTML('beforebegin','<button class="nav" data-p="relatorios">Relatórios</button>');
 }
 document.querySelectorAll('.nav').forEach(function(b){
  var t=(b.textContent||'').trim().toLowerCase();
  if((t.includes('relatório')||t.includes('relatorio'))&&b.dataset.p!=='relatorios')b.remove();
 });
 if(!E('p-relatorios')){
  var refSec=E('p-historico')||E('p-cadastros')||main.lastElementChild;
  var html='<section id="p-relatorios" class="page"><div class="card"><h2>Relatórios</h2><p class="small">Central de relatórios operacionais, gerenciais e de inteligência.</p><div id="relBlocks" class="relBlocks"></div></div><div class="card" id="relResultado"><div class="relPrintHead"><h2>LIKE internet - Relatório de Estoque</h2><p id="relPrintInfo"></p></div><h2>Resultado</h2><div id="relOut" class="msg">Carregando relatórios...</div></div></section>';
  refSec.insertAdjacentHTML('beforebegin',html);
 }
 bind();
 if(typeof window.relCopyMsg!=='function')window.relCopyMsg=function(){alert('Relatórios ainda carregando. Aguarde alguns segundos e tente novamente.')};
 if(E('relOut')&&E('relOut').textContent.includes('Carregando')){
  E('relOut').innerHTML='A estrutura da aba foi carregada. Aguarde alguns segundos para os botões internos aparecerem.';
 }
 try{if(typeof window.paginarTabelas==='function')window.paginarTabelas()}catch(e){}
}
document.addEventListener('DOMContentLoaded',function(){setTimeout(fixRelatorios,300);setTimeout(fixRelatorios,1500);setTimeout(fixRelatorios,5000);setTimeout(fixRelatorios,10000);setTimeout(fixRelatorios,15000)});
window.fixRelatorios=fixRelatorios;
})();