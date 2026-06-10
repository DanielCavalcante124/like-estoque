(function(){
  function moveConfirmarInstalacao(){
    const nav = document.getElementById('navConfirmarInstalacao');
    const target = document.getElementById('sideGroupItems-operacao');
    const outros = document.getElementById('sideGroupItems-outros');

    if(!nav || !target) return false;

    nav.dataset.perm = 'operacao_estoque';
    nav.dataset.menuGroup = 'operacao';

    if(nav.parentElement !== target){
      target.appendChild(nav);
    }

    const operacaoGroup = document.getElementById('sideGroup-operacao');
    if(operacaoGroup){
      operacaoGroup.classList.remove('collapsed');
      operacaoGroup.classList.remove('side-group-empty');
      localStorage.setItem('like.sidebar.group.operacao', 'open');
    }

    if(outros){
      const visibleOutros = Array.from(outros.querySelectorAll('.nav')).filter(el => !el.classList.contains('perm-hidden'));
      const outrosGroup = document.getElementById('sideGroup-outros');
      if(outrosGroup) outrosGroup.classList.toggle('side-group-empty', visibleOutros.length === 0);
    }

    return true;
  }

  function run(){
    moveConfirmarInstalacao();
    setTimeout(moveConfirmarInstalacao, 300);
    setTimeout(moveConfirmarInstalacao, 900);
    setTimeout(moveConfirmarInstalacao, 1800);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run);
  }else{
    run();
  }

  document.addEventListener('like:session', run);
  window.LIKE_ESTOQUE_FIX_MENU_OPERACAO = run;
})();
