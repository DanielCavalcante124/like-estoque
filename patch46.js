(function(){
function el(i){return document.getElementById(i)}
function unlock(email){
 document.body.classList.add('logged');
 document.body.classList.remove('auth-ready');
 if(el('conn')){el('conn').textContent='● Online';el('conn').style.color='#dcfce7'}
 if(el('st'))el('st').textContent='Conectado como '+(email||'usuário');
}
async function keepLogged(){
 try{
  if(!sb||!sb.auth||!sb.auth.getSession)return;
  var r=await sb.auth.getSession();
  var session=r&&r.data&&r.data.session;
  if(session&&session.user){
   unlock(session.user.email||'usuário');
   var loginPage=el('p-login');
   if(loginPage&&loginPage.classList.contains('on')){
    try{pg('operacao')}catch(e){try{pg('dash')}catch(_e){}}
   }
  }
 }catch(e){}
}
function stopOldLoginBounce(){
 var old=window.login;
 if(typeof old==='function'&&!window.__p46login){
  window.__p46login=true;
  window.login=async function(){
   var r=await old.apply(this,arguments);
   setTimeout(keepLogged,300);
   setTimeout(keepLogged,900);
   setTimeout(keepLogged,1600);
   return r;
  };
  if(el('login'))el('login').onclick=window.login;
 }
}
document.addEventListener('DOMContentLoaded',function(){
 setInterval(keepLogged,700);
 setTimeout(stopOldLoginBounce,500);
 setTimeout(stopOldLoginBounce,1600);
});
})();