(function(){
function E(id){return document.getElementById(id)}
function boot(){var sec=E('p-saida');if(!sec||E('saidaCarrinhoBox'))return;sec.insertAdjacentHTML('afterbegin','<div class="card" id="saidaCarrinhoBox"><h2>Saída em carrinho</h2><p class="small">Carrinho de saída carregado.</p><div id="saidaCartMsg" class="msg">Pronto.</div></div>')}
document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,1000);setTimeout(boot,3000)});window.saidaCarrinhoBoot=boot;
})();