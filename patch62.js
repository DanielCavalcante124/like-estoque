(function(){
function E(i){return document.getElementById(i)}
function txt(id){return ((E(id)&&E(id).value)||'').toLowerCase()}
function isQtd(){var s=txt('tipo')+' '+txt('marca')+' '+txt('modelo');return /rj45|rj 45|conector|conectores|cabo|bobina|drop|cordao|cordão|patch cord|pig tail|pigtail|adaptador|roldana|abracadeira|abraçadeira|fita|parafuso|bucha/.test(s)}
function hide(id,on){var el=E(id);if(!el)return;el.style.display=on?'none':'';el.required=false;if(on)el.value=''}
function ensureQty(){var q=E('entQtdItem');if(!q){q=document.createElement('input');q.id='entQtdItem';q.type='number';q.min='1';q.placeholder='Quantidade';q.value='1';var ref=E('pat')||E('serial')||E('mac');if(ref&&ref.parentNode)ref.parentNode.insertBefore(q,ref.nextSibling)}return q}
function toggle(){var on=isQtd();hide('mac',on);hide('serial',on);hide('pat',on);var q=E('entQtdItem');if(on){ensureQty().style.display=''}else if(q){q.style.display='none'}}
async function entradaQtd(){var on=isQtd();if(!on){if(window.entradaOriginal62)return window.entradaOriginal62();return}
 try{
  var tipo=E('tipo').value,marca=E('marca').value,modelo=E('modelo').value;
  if(!tipo||!marca||!modelo){msg('entMsg','Selecione tipo, marca e modelo.','bad');return}
  var qtd=Number((E('entQtdItem')&&E('entQtdItem').value)||1);if(!qtd||qtd<1){msg('entMsg','Informe a quantidade.','bad');return}
  var e={codigo:next('LOT','codigo'),patrimonio:null,tipo:tipo,marca:marca,modelo:modelo,mac:null,serial:null,status:'Em estoque',local:E('local').value,custo:Number(E('custo').value||0),motivoAtual:'Quantidade: '+qtd};
  e=fromEq(await ins('equipamentos',toEq(e)));e.quantidade=qtd;D.equipamentos.unshift(e);
  try{await mov(e,'Entrada por quantidade',{dest:e.local,mot:'Entrada por quantidade',obs:'Quantidade: '+qtd+' | '+(E('obs')?E('obs').value:'')})}catch(x){}
  ['custo','forn','nf','resp','obs'].forEach(function(i){if(E(i))E(i).value=''});if(E('entQtdItem'))E('entQtdItem').value='1';
  try{render()}catch(x){}toggle();msg('entMsg','Entrada por quantidade registrada: '+qtd+' un. de '+modelo,'ok');
 }catch(e){msg('entMsg','Erro ao registrar entrada: '+e.message,'bad')}
}
function bind(){if(!window.entradaOriginal62&&typeof window.entrada==='function')window.entradaOriginal62=window.entrada;window.entrada=entradaQtd;if(E('entrada'))E('entrada').onclick=entradaQtd;['tipo','marca','modelo'].forEach(function(id){if(E(id)&&!E(id).dataset.qtd62){E(id).dataset.qtd62=1;E(id).addEventListener('change',toggle);E(id).addEventListener('input',toggle)}});toggle()}
setInterval(bind,700);document.addEventListener('DOMContentLoaded',function(){setTimeout(bind,1000);setTimeout(bind,4000);setTimeout(bind,8000)});
})();