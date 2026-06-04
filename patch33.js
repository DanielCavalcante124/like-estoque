/* LIKE Estoque V33.2 - login com cores do sistema e validação real */
(function(){
  let authenticated=false;
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
      body:not(.logged) #p-login{display:flex!important;min-height:100vh;align-items:center;justify-content:center;padding:28px;background:radial-gradient(circle at 18% 18%, #173051 0, #0d1b2e 28%, transparent 48%),radial-gradient(circle at 82% 82%, #0f4c81 0, #e8eef7 0%, transparent 42%),linear-gradient(135deg,#0d1b2e 0%,#0d1b2e 46%,#f4f7fb 46%,#e8eef7 100%);overflow:hidden;position:relative}
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

    if($('url')){$('url').value=DEFAULT_URL;$('url').type='hidden';$('url').style.display='none'}
    if($('key')){$('key').value=DEFAULT_KEY;$('key').type='hidden';$('key').style.display='none'}
    if($('email')){$('email').placeholder='E-mail do usuário'}
    if($('pass')){$('pass').placeholder='Senha'}
    if($('login')){$('login').textContent='ENTRAR'}
    if($('save')){$('save').style.display='none'}
  }

  function lock(message,cls=''){
    authenticated=false;
    try{sb=null}catch(e){}
    document.body.classList.remove('logged');
    document.body.classList.add('auth-ready');
    try{
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
      $('p-login')?.classList.add('on');
      document.querySelectorAll('.nav').forEach(n=>n.classList.remove('on'));
    }catch(e){}
    if(message && $('loginMsg')){$('loginMsg').textContent=message;$('loginMsg').className='msg '+cls}
  }

  function unlock(email){
    authenticated=true;
    document.body.classList.add('logged');
    document.body.classList.remove('auth-ready');
    if($('conn')){$('conn').textContent='● Online';$('conn').style.color='#dcfce7'}
    if($('st')) $('st').textContent='Conectado como '+email;
  }

  async function strictLogin(){
    const email=($('email')?.value||'').trim();
    const password=$('pass')?.value||'';
    const m=$('loginMsg');
    try{
      applySystemLoginColors();
      if(!email || !password){lock('Informe e-mail e senha.','bad');return}
      if(m){m.textContent='Validando usuário e senha no Supabase...';m.className='msg'}
      const client=supabase.createClient(DEFAULT_URL,DEFAULT_KEY);
      const result=await client.auth.signInWithPassword({email:email,password:password});
      if(result.error || !result.data || !result.data.session || !result.data.user){
        try{await client.auth.signOut()}catch(e){}
        lock('Login ou senha inválidos. Acesso bloqueado.','bad');
        return;
      }
      sb=client;
      unlock(email);
      localStorage.setItem('like_cfg_v26',JSON.stringify({url:DEFAULT_URL,key:DEFAULT_KEY,email:email,pass:''}));
      await loadAll();
      pg('dash');
      if(m){m.textContent='Login autorizado.';m.className='msg ok'}
    }catch(e){
      lock('Login ou senha inválidos. Acesso bloqueado.','bad');
    }
  }

  async function strictLogout(){
    try{if(sb) await sb.auth.signOut()}catch(e){}
    if($('conn')){$('conn').textContent='● Offline';$('conn').style.color=''}
    if($('st')) $('st').textContent='Sessão encerrada';
    lock('Sessão encerrada. Entre novamente.','');
  }

  function hookStrict(){
    window.login=strictLogin;
    window.logout=strictLogout;
    const b=$('login'); if(b) b.onclick=strictLogin;
    const s=$('logout'); if(s) s.onclick=strictLogout;
    if(!window.__strictPgHooked && typeof window.pg==='function'){
      window.__strictPgHooked=true;
      const oldPg=window.pg;
      window.pg=function(p){
        if(!authenticated && p!=='login'){
          lock('Faça login para acessar o sistema.','bad');
          return oldPg('login');
        }
        return oldPg(p);
      };
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    applySystemLoginColors();
    lock('Acesso restrito. Entre com e-mail e senha autorizados.','');
    setTimeout(()=>{applySystemLoginColors();hookStrict();},400);
    setTimeout(()=>{applySystemLoginColors();hookStrict();},1400);
  });
})();