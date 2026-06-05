(function(){
function fixIds(){
 var oldList=document.querySelector('#p-cadastros #tecList');
 if(oldList)oldList.id='tecListCadastrosAntigo';
 var oldMsg=document.querySelector('#p-cadastros #tecMsg');
 if(oldMsg)oldMsg.id='tecMsgCadastrosAntigo';
 var oldInput=document.querySelector('#p-cadastros #tecNome');
 if(oldInput)oldInput.id='tecNomeCadastrosAntigo';
 var oldBtn=document.querySelector('#p-cadastros #addTec');
 if(oldBtn)oldBtn.id='addTecCadastrosAntigo';
}
function force(){fixIds();try{if(typeof window.tecForceReload==='function')window.tecForceReload()}catch(e){}}
document.addEventListener('DOMContentLoaded',function(){setTimeout(fixIds,300);setTimeout(force,2500);});
setInterval(function(){fixIds();var p=document.getElementById('p-tecnicosFull');if(p&&p.classList.contains('on'))force();},1200);
})();