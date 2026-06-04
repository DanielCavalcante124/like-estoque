/* LIKE Estoque V35 - autenticação estrita */
(function(){
  let authenticated=false;
  function el(id){return document.getElementById(id)}

  function lock(message, cls){
    authenticated=false;
    try{ sb=null; }catch(e){}
    document.body.classList.remove('logged');
    document.body.classList.add('auth-ready');
    try{
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
      el('p-login')?.classList.add('on');
      document.querySelectorAll('.nav').forEach(n=>n.classList.remove('on'));
    }catch(e){}
    if(message && el('loginMsg')){
      el('loginMsg').textContent=message;
      el('loginMsg').className='msg '+(cls||'');
    }
  }

  function unlock(email){
    authenticated=true;
    document.body.classList.add('logged');
    document.body.classList.remove('auth-ready');
    if(el('conn')){el('conn').textContent='● Online';el('conn').style.color='#dcfce7'}
    if(el('st')) el('st').textContent='Conectado como '+email;
  }

  async function strictLogin(){
    const email=(el('email')?.value||'').trim();
    const password=el('pass')?.value||'';
    const msg=el('loginMsg');
    try{
      if(el('url')) el('url').value=DEFAULT_URL;
      if(el('key')) el('key').value=DEFAULT_KEY;
      if(!email || !password){
        lock('Informe e-mail e senha.', 'bad');
        return;
      }
      if(msg){msg.textContent='Validando usuário e senha no Supabase...';msg.className='msg'}

      const client=supabase.createClient(DEFAULT_URL,DEFAULT_KEY);
      const result=await client.auth.signInWithPassword({email:email,password:password});

      if(result.error || !result.data || !result.data.session || !result.data.user){
        try{await client.auth.signOut()}catch(_e){}
        lock('Login ou senha inválidos. Acesso bloqueado.', 'bad');
        return;
      }

      sb=client;
      unlock(email);
      localStorage.setItem('like_cfg_v26',JSON.stringify({url:DEFAULT_URL,key:DEFAULT_KEY,email:email,pass:''}));
      await loadAll();
      pg('dash');
      if(msg){msg.textContent='Login autorizado.';msg.className='msg ok'}
    }catch(e){
      lock('Login ou senha inválidos. Acesso bloqueado.', 'bad');
    }
  }

  async function strictLogout(){
    try{if(sb) await sb.auth.signOut()}catch(e){}
    if(el('conn')){el('conn').textContent='● Offline';el('conn').style.color=''}
    if(el('st')) el('st').textContent='Sessão encerrada';
    lock('Sessão encerrada. Entre novamente.', '');
  }

  function hook(){
    window.login=strictLogin;
    window.logout=strictLogout;
    const lb=el('login');
    if(lb) lb.onclick=strictLogin;
    const lo=el('logout');
    if(lo) lo.onclick=strictLogout;

    if(!window.__strictPgHooked && typeof window.pg==='function'){
      window.__strictPgHooked=true;
      const oldPg=window.pg;
      window.pg=function(p){
        if(!authenticated && p!=='login'){
          lock('Faça login para acessar o sistema.', 'bad');
          return oldPg('login');
        }
        return oldPg(p);
      };
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    lock('Acesso restrito. Entre com e-mail e senha autorizados.', '');
    setTimeout(hook,500);
    setTimeout(hook,1500);
  });
})();