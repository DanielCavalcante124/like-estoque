/* LIKE Estoque V31 - conexão simples para usuário */
(function(){
  const SUPABASE_URL='https://yuyeyawigbbjtzghkbbr.supabase.co';
  const SUPABASE_KEY='sb_publishable_9DyOYVHN6035kbUjypbDkA_4zYHk_pI';
  function $(id){return document.getElementById(id)}
  function loadExtra(id,src){if(document.getElementById(id))return;var s=document.createElement('script');s.id=id;s.src=src;document.body.appendChild(s)}
  function simplifyLogin(){
    const url=$('url'), key=$('key'), email=$('email'), pass=$('pass'), save=$('save'), login=$('login'), msg=$('loginMsg');
    if(!url || !key || !email || !pass) return;
    url.value=SUPABASE_URL;
    key.value=SUPABASE_KEY;
    url.type='hidden';
    key.type='hidden';
    url.style.display='none';
    key.style.display='none';
    url.tabIndex=-1;
    key.tabIndex=-1;
    email.placeholder='E-mail do usuário';
    pass.placeholder='Senha';
    email.autocomplete='username';
    pass.autocomplete='current-password';
    if(save) save.style.display='none';
    if(login) login.textContent='Entrar no sistema';
    const card=document.querySelector('#p-login .card');
    if(card && !document.getElementById('simpleLoginInfo')){
      const info=document.createElement('div');
      info.id='simpleLoginInfo';
      info.className='msg ok';
      info.textContent='Digite apenas o e-mail e a senha do usuário cadastrado. A conexão com o banco já está configurada.';
      const grid=card.querySelector('.grid');
      if(grid){
        grid.style.gridTemplateColumns='1fr 1fr';
        grid.before(info);
      }
    }
    if(msg && msg.textContent.includes('Aguardando')) msg.textContent='Informe e-mail e senha para entrar.';
  }
  function bootExtras(){loadExtra('saidaCarrinhoLoader31','saida_carrinho.js?v=2');loadExtra('relTecFixLoader31','relatorios_tecnico_fix.js?v=1')}
  document.addEventListener('DOMContentLoaded',()=>{
    simplifyLogin();
    bootExtras();
    setTimeout(simplifyLogin,500);
    setTimeout(simplifyLogin,1500);
    setTimeout(bootExtras,2500);
    setTimeout(bootExtras,6000);
    setTimeout(bootExtras,10000);
  });
})();