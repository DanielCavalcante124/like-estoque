/* LIKE Estoque V30.3 - carregador do modulo prioridade estoque */
(function(){
  function loadPolicyModule(){
    if(document.getElementById('patch37loader')) return;
    var s=document.createElement('script');
    s.id='patch37loader';
    s.src='patch37.js?v=37';
    document.body.appendChild(s);
  }
  document.addEventListener('DOMContentLoaded',function(){
    setTimeout(loadPolicyModule,1200);
    setTimeout(loadPolicyModule,3000);
  });
})();