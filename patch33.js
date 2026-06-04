/* LIKE Estoque V33.1 - login com cores do sistema e sem aba Conexão após login */
(function(){
  const SUPABASE_URL='https://yuyeyawigbbjtzghkbbr.supabase.co';
  const SUPABASE_KEY='sb_publishable_9DyOYVHN6035kbUjypbDkA_4zYHk_pI';
  function $(id){return document.getElementById(id)}

  function applySystemLoginColors(){
    const old=document.getElementById('authGateStyleSystemColors');
    if(old) old.remove();
    const s=document.createElement('style');
    s.id='authGateStyleSystemColors';
    s.textContent=`
      body:not(.logged) .side,
      body:not(.logged) .top,
      body:not(.logged) .quickTop{display:none!important}
      body:not(.logged) .wrap{display:block;min-height:100vh}
      body:not(.logged) .main{padding:0;min-height:100vh;width:100%}
      body:not(.logged) .page{display:none!important}
      body:not(.logged) #p-login{
        display:flex!important;
        min-height:100vh;
        align-items:center;
        justify-content:center;
        padding:28px;
        background:
          radial-gradient(circle at 18% 18%, #173051 0, #0d1b2e 28%, transparent 48%),
          radial-gradient(circle at 82% 82%, #0f4c81 0, #e8eef7 0%, transparent 42%),
          linear-gradient(135deg,#0d1b2e 0%,#0d1b2e 46%,#f4f7fb 46%,#e8eef7 100%);
        overflow:hidden;
        position:relative;
      }
      body:not(.logged) #p-login:before{content:'';position:absolute;inset:0;background:linear-gradient(120deg,#ffffff08,#0f172a12)}
      body:not(.logged) #p-login .card{position:relative;width:min(520px,94vw);border:1px solid #dbe4ef;border-radius:28px;padding:38px 44px;background:#ffffff;box-shadow:0 30px 90px #0f172a3d;color:#172033;backdrop-filter:none}
      body:not(.logged) #p-login .card h2{text-align:center;font-size:31px;margin:0 0 6px;color:#0d1b2e;letter-spacing:.4px;font-weight:900}
      body:not(.logged) #p-login .card p{text-align:center;color:#64748b;margin-bottom:22px}
      body:not(.logged) #p-login .card:before{content:'👤';display:flex;align-items:center;justify-content:center;width:106px;height:106px;border-radius:999px;margin:0 auto 22px;background:linear-gradient(145deg,#0d1b2e,#0f4c81);color:white;font-size:58px;box-shadow:0 18px 45px #0f172a35}
      body:not(.logged) #p-login .grid{display:block!important}
      body:not(.logged) #p-login input:not([type='hidden']){background:#f8fafc;border:1px solid #d8dee9;border-radius:14px;color:#172033;font-size:17px;padding:15px 16px;margin:11px 0;outline:0;box-shadow:inset 0 1px 0 #fff}
      body:not(.logged) #p-login input:not([type='hidden']):focus{border-color:#0f4c81;box-shadow:0 0 0 4px #0f4c8120}
      body:not(.logged) #p-login input::placeholder{color:#64748b}
      body:not(.logged) #login{display:block;width:100%;margin-top:22px;padding:17px;border-radius:15px;background:#0f4c81;color:white;letter-spacing:2px;text-transform:uppercase;font-size:16px;box-shadow:0 14px 34px #0f4c8138}
      body:not(.logged) #login:hover{background:#173051}
      body:not(.logged) #loginMsg{background:#f8fafc;border-color:#e5e7eb;color:#172033;text-align:center}
      body:not(.logged) #loginMsg.bad{background:#fee2e2;color:#991b1b;border-color:#fecaca}
      body:not(.logged) #loginMsg.ok{background:#dcfce7;color:#166534;border-color:#bbf7d0}
      body:not(.logged) #save{display:none!important}
      body:not(.logged) #simpleLoginInfo{display:none!important}
      body.logged .nav[data-p="login"]{display:none!important}
      body.logged #p-login{display:none!important}
    `;
    document.head.appendChild(s);

    if($('url')){$('url').value=SUPABASE_URL;$('url').type='hidden';$('url').style.display='none'}
    if($('key')){$('key').value=SUPABASE_KEY;$('key').type='hidden';$('key').style.display='none'}
    if($('email')){$('email').placeholder='E-mail do usuário'}
    if($('pass')){$('pass').placeholder='Senha'}
    if($('login')){$('login').textContent='ENTRAR'}
    if($('loginMsg') && /Email|Password|Acesso restrito|Informe|Digite/i.test($('loginMsg').textContent||'')){
      $('loginMsg').textContent='Acesso restrito. Entre com e-mail e senha autorizados.';
    }
  }

  function redirectAfterLogin(){
    if(document.body.classList.contains('logged')){
      const lp=$('p-login');
      if(lp && lp.classList.contains('on')){
        try{ pg('dash'); }catch(e){}
      }
    }
  }

  function hookLoginRedirect(){
    if(window.__loginNoConnectionHooked) return;
    window.__loginNoConnectionHooked=true;
    const oldLogin=window.login;
    if(typeof oldLogin==='function'){
      window.login=async function(){
        const result=await oldLogin.apply(this,arguments);
        setTimeout(redirectAfterLogin,250);
        setTimeout(redirectAfterLogin,900);
        return result;
      };
      const btn=$('login');
      if(btn) btn.onclick=window.login;
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    applySystemLoginColors();
    setTimeout(()=>{applySystemLoginColors();hookLoginRedirect();redirectAfterLogin();},400);
    setTimeout(()=>{applySystemLoginColors();hookLoginRedirect();redirectAfterLogin();},1400);
  });
})();