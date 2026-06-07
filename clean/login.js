function $(id){return document.getElementById(id)}
function cfg(){try{return JSON.parse(localStorage.getItem('like_cfg_v26')||'{}')}catch(e){return {}}}
function updateConfigStatus(){const el=$('loginConfigStatus');if(!el)return;el.textContent='Conexão automática';el.className='login-pill ok'}
function updateSessionStatus(user){const el=$('loginSessionStatus');if(!el)return;if(user){el.textContent='Sessão ativa';el.className='login-pill ok'}else{el.textContent='Aguardando login';el.className='login-pill'}}
function bindLoginUi(){
 const c=cfg();
 if($('loginEmail'))$('loginEmail').value=c.email||$('loginEmail').value||'';
 updateConfigStatus();
 updateSessionStatus(null);
 document.addEventListener('like:session',ev=>{updateSessionStatus(ev.detail&&ev.detail.user);updateConfigStatus()});
 const email=$('loginEmail');if(email)email.addEventListener('input',updateConfigStatus);
 const pass=$('loginPass');if(pass)pass.addEventListener('keydown',ev=>{if(ev.key==='Enter')$('btnLogin')?.click()});
}
document.addEventListener('DOMContentLoaded',bindLoginUi);
