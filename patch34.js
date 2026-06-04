/* LIKE Estoque V34 - ocultar aba Conexão após autenticação */
(function(){
  function $(id){return document.getElementById(id)}
  function addStyle(){
    if($('hideConnectionStyle')) return;
    const s=document.createElement('style');
    s.id='hideConnectionStyle';
    s.textContent=`
      body.logged .nav[data-p="login"]{display:none!important}
      body.logged #p-login{display:none!important}
    `;
    document.head.appendChild(s);
  }
  function goDashboardIfLogged(){
    if(document.body.classList.contains('logged')){
      const loginPage=$('p-login');
      if(loginPage && loginPage.classList.contains('on')){
        try{ pg('dash'); }catch(e){}
      }
    }
  }
  function hookLoginRedirect(){
    if(window.__hideConnectionHooked) return;
    window.__hideConnectionHooked=true;
    const oldLogin=window.login;
    if(typeof oldLogin==='function'){
      window.login=async function(){
        const out=await oldLogin.apply(this,arguments);
        setTimeout(goDashboardIfLogged,300);
        setTimeout(goDashboardIfLogged,900);
        return out;
      };
      const btn=$('login');
      if(btn) btn.onclick=window.login;
    }
  }
  document.addEventListener('DOMContentLoaded',()=>{
    addStyle();
    setTimeout(()=>{addStyle();hookLoginRedirect();goDashboardIfLogged();},400);
    setTimeout(()=>{addStyle();hookLoginRedirect();goDashboardIfLogged();},1400);
  });
})();