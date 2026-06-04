/* LIKE Estoque V32 - autenticação obrigatória */
(function(){
  const SUPABASE_URL='https://yuyeyawigbbjtzghkbbr.supabase.co';
  const SUPABASE_KEY='sb_publishable_9DyOYVHN6035kbUjypbDkA_4zYHk_pI';

  function $(id){return document.getElementById(id)}

  function addAuthStyles(){
    if($('authGateStyle')) return;
    const s=document.createElement('style');
    s.id='authGateStyle';
    s.textContent=`
      body:not(.logged) .side,
      body:not(.logged) .top,
      body:not(.logged) .quickTop{display:none!important}
      body:not(.logged) .wrap{display:block;min-height:100vh}
      body:not(.logged) .main{padding:0;min-height:100vh;width:100%}
      body:not(.logged) .page{display:none!important}
      body:not(.logged) #p-login{display:flex!important;min-height:100vh;align-items:center;justify-content:center;padding:28px;background:radial-gradient(circle at 68% 70%,#91adff 0,#5f62b7 18%,transparent 38%),radial-gradient(circle at 48% 20%,#7b1731 0,#4b163b 25%,transparent 48%),linear-gradient(135deg,#1b1236 0%,#35132e 48%,#0b1638 100%);overflow:hidden;position:relative}
      body:not(.logged) #p-login:before{content:'';position:absolute;inset:0;background:linear-gradient(120deg,#ffffff12,#00000022);backdrop-filter:blur(1px)}
      body:not(.logged) #p-login .card{position:relative;width:min(520px,94vw);border:1px solid #ffffff35;border-radius:34px;padding:38px 44px;background:linear-gradient(145deg,#ffffff20,#ffffff0d);box-shadow:0 35px 120px #0008;color:white;backdrop-filter:blur(18px)}
      body:not(.logged) #p-login .card h2{text-align:center;font-size:31px;margin:0 0 6px;color:white;letter-spacing:.4px}
      body:not(.logged) #p-login .card p{text-align:center;color:#f1f5f9;margin-bottom:22px}
      body:not(.logged) #p-login .card:before{content:'👤';display:flex;align-items:center;justify-content:center;width:106px;height:106px;border-radius:999px;margin:0 auto 22px;background:#ffffff25;font-size:58px;box-shadow:inset 0 0 40px #ffffff10}
      body:not(.logged) #p-login .grid{display:block!important}
      body:not(.logged) #p-login input:not([type='hidden']){background:transparent;border:0;border-bottom:2px solid #ffffffbb;border-radius:0;color:white;font-size:19px;padding:14px 4px 14px 42px;margin:13px 0;outline:0}
      body:not(.logged) #p-login input::placeholder{color:#ffffffdd}
      body:not(.logged) #email{background-image:linear-gradient(transparent,transparent)!important}
      body:not(.logged) #pass{background-image:linear-gradient(transparent,transparent)!important}
      body:not(.logged) #login{display:block;width:100%;margin-top:28px;padding:18px;border-radius:18px;background:linear-gradient(90deg,#670026,#5878ff);color:white;letter-spacing:3px;text-transform:uppercase;font-size:16px;box-shadow:0 15px 40px #0005}
      body:not(.logged) #loginMsg{background:#ffffff18;border-color:#ffffff25;color:#fff;text-align:center}
      body:not(.logged) #save{display:none!important}
      body:not(.logged) #simpleLoginInfo{display:none!important}
      body.logged #p-login .card{max-width:900px}
    `;
    document.head.appendChild(s);
  }

  function prepareAuthScreen(){
    addAuthStyles();
    const url=$('url'), key=$('key'), email=$('email'), pass=$('pass'), save=$('save'), login=$('login'), msg=$('loginMsg');
    if(url){url.value=SUPABASE_URL;url.type='hidden';url.style.display='none'}
    if(key){key.value=SUPABASE_KEY;key.type='hidden';key.style.display='none'}
    if(email){email.placeholder='Email ID';email.autocomplete='username'}
    if(pass){pass.placeholder='Password';pass.autocomplete='current-password'}
    if(save) save.style.display='none';
    if(login) login.textContent='LOGIN';
    if(msg && /Aguardando|Informe|Digite/i.test(msg.textContent||'')) msg.textContent='Acesso restrito. Entre com e-mail e senha autorizados.';
    document.body.classList.remove('logged');
    document.body.classList.add('auth-ready');
  }

  function unlock(){
    document.body.classList.add('logged');
    document.body.classList.remove('auth-ready');
  }
  function lock(){
    document.body.classList.remove('logged');
    document.body.classList.add('auth-ready');
    try{document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));$('p-login')?.classList.add('on')}catch(e){}
  }

  function hookAuth(){
    if(window.__likeAuthHooked) return;
    window.__likeAuthHooked=true;

    const oldLogin=window.login || login;
    window.login=async function(){
      const msg=$('loginMsg');
      try{
        if($('url')) $('url').value=SUPABASE_URL;
        if($('key')) $('key').value=SUPABASE_KEY;
        if(msg){msg.textContent='Validando acesso...';msg.className='msg'}
        await oldLogin();
        if(sb){
          unlock();
          if(msg){msg.textContent='Login autorizado.';msg.className='msg ok'}
        }else{
          lock();
        }
      }catch(e){
        lock();
        if(msg){msg.textContent='Login ou senha inválidos.';msg.className='msg bad'}
      }
    };

    const oldLogout=window.logout || logout;
    window.logout=async function(){
      try{await oldLogout()}catch(e){}
      lock();
    };

    const oldPg=window.pg || pg;
    window.pg=function(p){
      if(!sb && p!=='login') return oldPg('login');
      return oldPg(p);
    };

    const loginBtn=$('login');
    if(loginBtn) loginBtn.onclick=window.login;
    const logoutBtn=$('logout');
    if(logoutBtn) logoutBtn.onclick=window.logout;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    prepareAuthScreen();
    setTimeout(()=>{prepareAuthScreen();hookAuth();},300);
    setTimeout(()=>{prepareAuthScreen();hookAuth();},1200);
  });
})();