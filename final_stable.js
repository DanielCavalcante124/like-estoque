(function(){
function E(id){return document.getElementById(id)}
function addAfter(ref,html){if(ref)ref.insertAdjacentHTML('afterend',html)}
function loadOnce(id,src){if(document.getElementById(id))return;var s=document.createElement('script');s.id=id;s.src=src;document.body.appendChild(s)}
function ensureMateriais(){
 var side=document.querySelector('.side');
 if(side&&!document.querySelector('[data-p="materiaisMain"]')){var ref=document.querySelector('[data-p="entrada"]')||document.querySelector('[data-p="tecnico"]')||document.querySelector('[data-p="dash"]');addAfter(ref,'<button class="nav" data-p="materiaisMain">Materiais</button>')}
}
function relCss(){if(E('relHardCss'))return;var s=document.createElement('style');s.id='relHardCss';s.textContent='.relBlocks{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.relBlock{border:1px solid #e5e7eb;border-radius:18px;padding:16px;background:#fff;box-shadow:0 10px 28px #0f172a12}.relBlock h3{margin-top:0}.relBtns{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.relBtns button{text-align:left;min-height:44px}.relTop{display:grid;grid-template-columns:1.2fr .8fr .8fr;gap:10px}.relActions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.relPrintHead{display:none}@media(max-width:950px){.relBlocks,.relBtns,.relTop{grid-template-columns:1fr}}@media print{body *{visibility:hidden!important}#relResultado,#relResultado *{visibility:visible!important}#relResultado{position:absolute;left:0;top:0;width:100%;padding:20px;background:#fff}.relActions,.pgTblCtl{display:none!important}.relPrintHead{display:block!important}.tbl table tbody tr{display:table-row!important}}';document.head.appendChild(s)}
function safeCall(fn){return "if(typeof "+fn+"==='function'){"+fn+"()}else if(typeof relHardMsg==='function'){relHardMsg('"+fn+"')}else{alert('Relatório carregando. Recarregue a página.')}"}
function renderRelBlocks(){
 var box=E('relBlocks');if(!box)return;relCss();
 var blocks=[
  ['1. Operação diária','Operacional','Resumo do dia, movimentações, histórico do item e fechamento diário.',[['Resumo do dia','relResumoDia'],['Movimentações','relMovimentacoes'],['Histórico do item','relHistoricoItem'],['Fechamento WhatsApp','relFechamentoZap']]],
  ['2. Técnicos','Operacional + Gerencial','Estoque por técnico, pendências, ranking e cobrança.',[['Estoque por técnico','relEstoqueTecnico'],['Pendências','relPendenciasTecnico'],['Ranking de posse','relRankingTecnico'],['Cobrança WhatsApp','relCobrancaTecnico']]],
  ['3. Materiais','Operacional + Gerencial','Saldo, consumo, materiais por técnico e sugestão de compra.',[['Saldo de materiais','relSaldoMateriais'],['Materiais consumidos','relMateriaisConsumidos'],['Por técnico','relMateriaisTecnico'],['Estoque mínimo','relEstoqueMinimo']]],
  ['4. Clientes / campo','Operacional + Gerencial','Equipamentos instalados, retornos e patrimônio em campo.',[['Instalados','relInstalados'],['Por cliente','relPorCliente'],['Retornos','relRetornosCliente'],['Patrimônio em campo','relPatrimonioCampo']]],
  ['5. Auditoria, compras e inteligência','Auditoria + Gerencial + Inteligência','Baixas, manutenção, compras, perdas e riscos.',[['Baixas/descarte','relBaixas'],['Manutenção/parados','relManutParados'],['Entrada por NF','relEntradaNF'],['Inteligência','relInteligencia']]]
 ];
 box.innerHTML=blocks.map(function(b){return '<div class="relBlock"><h3>'+b[0]+'</h3><p><span class="status ok">'+b[1]+'</span></p><p class="small">'+b[2]+'</p><div class="relBtns">'+b[3].map(function(x){return '<button onclick="'+safeCall(x[1])+'">'+x[0]+'</button>'}).join('')+'</div></div>'}).join('')
}
function ensureRelatorios(){
 relCss();var side=document.querySelector('.side'),main=document.querySelector('.main');if(!side||!main)return;
 var btn=null;document.querySelectorAll('.nav').forEach(function(b){var t=(b.textContent||'').trim().toLowerCase();if(t.includes('relatório')||t.includes('relatorio'))btn=b});
 if(btn){btn.textContent='Relatórios';btn.dataset.p='relatorios'}else{var ref=document.querySelector('[data-p="historico"]')||document.querySelector('[data-p="cadastros"]')||side.lastElementChild;ref.insertAdjacentHTML('beforebegin','<button class="nav" data-p="relatorios">Relatórios</button>')}
 document.querySelectorAll('.nav').forEach(function(b){var t=(b.textContent||'').trim().toLowerCase();if((t.includes('relatório')||t.includes('relatorio'))&&b.dataset.p!=='relatorios')b.remove()});
 var sec=E('p-relatorios');if(!sec){var refSec=E('p-historico')||E('p-cadastros')||main.lastElementChild;refSec.insertAdjacentHTML('beforebegin','<section id="p-relatorios" class="page"></section>');sec=E('p-relatorios')}
 var txt=(sec.innerText||'').toLowerCase();if(txt.includes('relatórios gerenciais')||!E('relBlocks')){
  sec.innerHTML='<div class="card"><h2>Relatórios</h2><p class="small">Central de relatórios operacionais, gerenciais e de inteligência.</p><div class="relTop"><input id="relBusca" placeholder="Buscar em relatórios: MAC, SN, técnico, cliente, material"><select id="relPeriodo"><option value="hoje">Hoje</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="todos">Todos</option></select><button id="relLimpar" class="warn">Limpar resultado</button></div></div><div id="relBlocks" class="relBlocks"></div><div class="card" id="relResultado"><div class="relPrintHead"><h2>LIKE internet - Relatório de Estoque</h2><p id="relPrintInfo"></p></div><h2>Resultado</h2><div id="relOut" class="msg">Selecione um relatório acima.</div></div>';
 }
 renderRelBlocks();
 if(E('relLimpar')&&!E('relLimpar').dataset.b){E('relLimpar').dataset.b=1;E('relLimpar').onclick=function(){if(E('relOut')){E('relOut').innerHTML='Selecione um relatório acima.';E('relOut').className='msg'}}}
 loadOnce('relatoriosBlocosDirect','relatorios_blocos.js?v=5');
}
function ensureEntradaPatrimonial(){
 loadOnce('entradaPatrimonialGuardFinal','entrada_patrimonial_guard.js?v=2');
 setTimeout(function(){if(window.entradaPatrimonialGuardRun)window.entradaPatrimonialGuardRun()},700);
}
function ensureTecnicosActions(){
 loadOnce('tecnicosActionsFixFinal','tecnicos_actions_fix.js?v=1');
 setTimeout(function(){if(window.tecnicosActionsFixBind)window.tecnicosActionsFixBind()},700);
}
window.relHardMsg=function(fn){var out=E('relOut');if(out){out.className='msg warn';out.innerHTML='O bloco visual carregou, mas a função '+fn+' ainda não terminou de carregar. Aguarde 5 segundos e clique novamente.'}}
function cleanTecnicos(){var keep=false;document.querySelectorAll('.nav').forEach(function(b){var txt=(b.textContent||'').trim().toLowerCase();if(txt==='técnicos'||txt==='tecnicos'){if(b.dataset.p==='tecnicosMain'&&!keep){keep=true;return}b.remove()}});var side=document.querySelector('.side');if(side&&!document.querySelector('[data-p="tecnicosMain"]')){var ref=document.querySelector('[data-p="tecnico"]')||document.querySelector('[data-p="materiaisMain"]')||document.querySelector('[data-p="estoque"]');addAfter(ref,'<button class="nav" data-p="tecnicosMain">Técnicos</button>')}['p-tecnicosFull','p-tecnicos65','p-tecnicosFix'].forEach(function(id){var x=E(id);if(x)x.remove()})}
function bindNav(){document.querySelectorAll('.nav').forEach(function(b){b.onclick=function(){if(typeof pg==='function')pg(b.dataset.p)}})}
function run(){ensureMateriais();ensureRelatorios();cleanTecnicos();ensureEntradaPatrimonial();ensureTecnicosActions();bindNav()}
window.finalStableRun=run;
document.addEventListener('DOMContentLoaded',function(){[300,1000,2500,5000,9000,13000,18000].forEach(function(t){setTimeout(run,t)})});
})();