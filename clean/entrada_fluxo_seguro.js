(function(){
  if(window.likeEntradaLoteFluxoRapidoAtivo)return;
  window.likeEntradaLoteFluxoRapidoAtivo=true;
  function $(id){return document.getElementById(id)}
  function foco(id){setTimeout(function(){var el=$(id);if(el){el.focus();if(el.select)el.select()}},30)}
  document.addEventListener('keydown',function(e){
    var t=e.target;
    if(!t)return;
    if(t.id==='loteScanMac'&&e.key==='Enter'){
      setTimeout(function(){foco('loteScanSerial')},20);
    }
    if(t.id==='loteScanSerial'&&e.key==='Enter'){
      setTimeout(function(){foco('loteScanMac')},120);
    }
  },false);
  document.addEventListener('click',function(e){
    if(e.target&&e.target.closest&&e.target.closest('#loteAdicionarItem')){
      setTimeout(function(){foco('loteScanMac')},120);
    }
  },false);
  setInterval(function(){
    var b2=document.querySelector('#loteForm button.primary[type=submit]');
    if(b2)b2.textContent='Conferir e finalizar entrada no sistema';
    var add=$('loteAdicionarItem');
    if(add)add.textContent='Pré-entrada do item';
    var focoBtn=$('loteFocoMac');
    if(focoBtn)focoBtn.textContent='Voltar para MAC';
  },800);
})();
