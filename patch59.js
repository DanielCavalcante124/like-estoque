(function(){
function addMissing(id,tag){if(document.getElementById(id))return;var el=document.createElement(tag||'div');el.id=id;el.style.display='none';document.body.appendChild(el)}
function ensureRenderTargets(){
 addMissing('modelTable','tbody');
 addMissing('tecList','div');
 addMissing('locList','div');
}
document.addEventListener('DOMContentLoaded',function(){setTimeout(ensureRenderTargets,500);setTimeout(ensureRenderTargets,2500);setTimeout(ensureRenderTargets,6000)});
setInterval(ensureRenderTargets,800);
})();