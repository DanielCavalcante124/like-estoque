(function(){
function E(id){return document.getElementById(id)}
function bind(){document.querySelectorAll('.nav').forEach(function(b){b.onclick=function(){if(typeof pg==='function')pg(b.dataset.p)}})}
function css(){
 if(E('relFixCss'))return;
 var s=document.createElement('style');s.id='relFixCss';
 s.textContent='.relBlocks{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.relBlock{border:1px solid #e5e7eb;border-radius:18px;padding:16px;background:#fff;box-shadow:0 10px 28px #0f172a12}.relBlock h3{margin-top:0}.relBtns{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.relBtns button{text-align:left;min-height:44px}.relTop{display:grid;grid-template-columns:1.2fr .8fr .8fr;gap:10px}.relPrintHead{display:none}@media(max-width:950px){.relBlocks,.relBtns,.relTop{grid-template-columns:1fr}}@media print{body *{visibility:hidden!important}#relResultado,#relResultado *{visibility:visible!important}#relResultado{position:absolute;left:0;top:0;width:100%;padding:20px;background:#fff}.relActions,.pgTblCtl{display:none!important}.relPrintHead{display:block!important}.tbl table tbody tr{display:table-row!important}}';
 document.head.appendChild(s);
}
function safeCall(fn){return "if(typeof "+fn+"==='function'){"+fn+"()}else{alert('Relatório ainda carregando. Aguarde alguns segundos e tente novamente.')}"}
function renderBlocks(){
 var box=E('relBlocks');if(!box)return;
 var blocks=[
  ['1. Operação diária','Operacional','Resumo do dia, movimentações, histórico do item e fechamento diário.',[['Resumo do dia','relResumoDia'],['Movimentações','relMovimentacoes'],['Histórico do item','relHistoricoItem'],['Fechamento WhatsApp','relFechamentoZap']]],
  ['2. Técnicos','Operacional + Gerencial','Estoque por técnico, pendências, ranking e cobrança.',[['Estoque por técnico','relEstoqueTecnico'],['Pendências','relPendenciasTecnico'],['Ranking de posse','relRankingTecnico'],['Cobrança WhatsApp','relCobrancaTecnico']]],
  ['3. Materiais','Operacional + Gerencial','Saldo, consumo, materiais por técnico e sugestão de compra.',[['Saldo de materiais','relSaldoMateriais'],['Materiais consumidos','relMateriaisConsumidos'],['Por técnico','relMateriaisTecnico'],['Estoque mínimo','relEstoqueMinimo']]],
  ['4. Clientes / campo','Operacional + Gerencial','Equipamentos instalados, retornos e patrimônio em campo.',[['Instalados','relInstalados'],['Por cliente','relPorCliente'],['Retornos','relRetornosCliente'],['Patrimônio em campo','relPatrimonioCampo']]],
  ['5. Auditoria, compras e inteligência','Auditoria + Gerencial + Inteligência','Baixas, manutenção, compras, perdas e riscos.',[['Baixas/descarte','relBaixas'],['Manutenção/parados','relManutParados'],['Entrada por NF','relEntradaNF'],['Inteligência','relInteligencia']]]
 ];
 box.innerHTML=blocks.map(function(b){return '<div class="relBlock"><h3>'+b[0]+'</h3><p><span class="status ok">'+b[1]+'</span></p><p class="small">'+b[2]+'</p><div class="relBtns">'+b[3].map(function(x){return '<button onclick="'+safeCall(x[1])+'">'+x[0]+'</button>'}).join('')+'</div></div>'}).join('');
}
function fixRelatorios(){
 css();
 var side=document.querySelector('.side');
 var main=document.querySelector('.main');
 if(!side||!main)return;
 var relBtn=document.querySelector('[data-p="relatorios"]');
 var gerBtn=null;
 document.querySelectorAll('.nav').forEach(function(b){
  var t=(b.textContent||'').trim().toLowerCase();
  if(t.includes('relatório')||t.includes('relatorio')){if(!relBtn)gerBtn=b;}
 });
 if(gerBtn){gerBtn.textContent='Relatórios';gerBtn.dataset.p='relatorios';relBtn=gerBtn;}
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
  var html='<section id="p-relatorios" class="page"><div class="card"><h2>Relatórios</h2><p class="small">Central de relatórios operacionais, gerenciais e de inteligência.</p><div class="relTop"><input id="relBusca" placeholder="Buscar em relatórios: MAC, SN, técnico, cliente, material"><select id="relPeriodo"><option value="hoje">Hoje</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="todos">Todos</option></select><button id="relLimpar" class="warn">Limpar resultado</button></div></div><div id="relBlocks" class="relBlocks"></div><div class="card" id="relResultado"><div class="relPrintHead"><h2>LIKE internet - Relatório de Estoque</h2><p id="relPrintInfo"></p></div><h2>Resultado</h2><div id="relOut" class="msg">Selecione um relatório acima.</div></div></section>';
  refSec.insertAdjacentHTML('beforebegin',html);
 }else{
  if(!E('relBusca')){
   var first=E('p-relatorios').querySelector('.card');
   if(first)first.insertAdjacentHTML('beforeend','<div class="relTop"><input id="relBusca" placeholder="Buscar em relatórios: MAC, SN, técnico, cliente, material"><select id="relPeriodo"><option value="hoje">Hoje</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="todos">Todos</option></select><button id="relLimpar" class="warn">Limpar resultado</button></div>');
  }
 }
 renderBlocks();
 bind();
 if(E('relLimpar')&&!E('relLimpar').dataset.b){E('relLimpar').dataset.b=1;E('relLimpar').onclick=function(){if(E('relOut')){E('relOut').innerHTML='Selecione um relatório acima.';E('relOut').className='msg'}}}
 if(typeof window.relCopyMsg!=='function')window.relCopyMsg=function(){alert('Relatórios ainda carregando. Aguarde alguns segundos e tente novamente.')};
 if(E('relOut')&&E('relOut').textContent.includes('Carregando'))E('relOut').innerHTML='Selecione um relatório acima.';
 try{if(typeof window.paginarTabelas==='function')window.paginarTabelas()}catch(e){}
}
document.addEventListener('DOMContentLoaded',function(){setTimeout(fixRelatorios,300);setTimeout(fixRelatorios,1500);setTimeout(fixRelatorios,5000);setTimeout(fixRelatorios,10000);setTimeout(fixRelatorios,15000)});
window.fixRelatorios=fixRelatorios;
})();