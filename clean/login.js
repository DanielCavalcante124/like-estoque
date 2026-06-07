function $(id){return document.getElementById(id)}
function cfg(){try{return JSON.parse(localStorage.getItem('like_cfg_v26')||'{}')}catch(e){return {}}}
function setMsg(text,type){const el=$('loginMsg');if(!el)return;el.textContent=text;el.className='msg show '+(type||'')}
function setAdvanced(open){const box=$('loginAdvanced');const btn=$('loginAdvancedBtn');if(!box)return;box.classList.toggle('open',!!open);if(btn)btn.textContent=open?'Ocultar configuração avançada':'Configuração avançada'}
function updateConfigStatus(){const c=cfg();const el=$('loginConfigStatus');if(!el)return;if(c.url&&c.key){el.textContent='Configuração salva';el.className='login-pill ok'}else{el.textContent='Configuração pendente';el.className='login-pill bad'}}
function updateSessionStatus(user){const el=$('loginSessionStatus');if(!el)return;if(user){el.textContent='Sessão ativa';el.className='login-pill ok'}else{el.textContent='Aguardando login';el.className='login-pill'}}
function bindLoginUi(){
 const c=cfg();
 if($('loginUrl'))$('loginUrl').value=c.url||$('loginUrl').value||'';
 if($('loginKey'))$('loginKey').value=c.key||$('loginKey').value||'';
 if($('loginEmail'))$('loginEmail').value=c.email||$('loginEmail').value||'';
 setAdvanced(!(c.url&&c.key));
 updateConfigStatus();
 updateSessionStatus(null);
 if($('loginAdvancedBtn'))$('loginAdvancedBtn').onclick=()=>setAdvanced(!$('loginAdvanced').classList.contains('open'));
 if($('btnClearConfig'))$('btnClearConfig').onclick=()=>{if(!confirm('Limpar URL/chave salvas neste navegador?'))return;localStorage.removeItem('like_cfg_v26');if($('loginUrl'))$('loginUrl').value='';if($('loginKey'))$('loginKey').value='';updateConfigStatus();setAdvanced(true);setMsg('Configuração local apagada.','warn')};
 document.addEventListener('like:session',ev=>{updateSessionStatus(ev.detail&&ev.detail.user);updateConfigStatus()});
 ['loginUrl','loginKey','loginEmail'].forEach(id=>{const el=$(id);if(el)el.addEventListener('input',updateConfigStatus)});
 const pass=$('loginPass');if(pass)pass.addEventListener('keydown',ev=>{if(ev.key==='Enter')$('btnLogin')?.click()});
}
document.addEventListener('DOMContentLoaded',bindLoginUi);
