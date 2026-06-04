(function(){
function el(i){return document.getElementById(i)}
function norm(v){try{return N(v||'')}catch(e){return String(v||'').toLowerCase().trim()}}
function findEq(t){var k=norm(t);return (D.equipamentos||[]).find(function(e){return norm(e.codigo)===k||norm(e.patrimonio)===k||norm(e.mac)===k||norm(e.serial)===k})}
function lastResp(e){var m=(D.movimentos||[]).find(function(x){return x.equipamento_id===e.id||x.codigo===e.codigo});return (m&&(m.tecnico||m.tec))||e.tecnicoAtual||e.tecnico_atual||''}
function model(e){return ((e.tipo||'')+' '+(e.marca||'')+' '+(e.modelo||'')).trim()}
function msg(t,c){var m=el('baixa42Msg')||el('discMsg');if(m){m.textContent=t;m.className='msg '+(c||'')}}
async function cleanupDescartes(){
 try{
  if(!db)return;
  await db().from('equipamentos').update({tecnico_atual:null,cliente_atual:null,os_atual:null,local:'Descarte autorizado'}).eq('status','Descarte autorizado');
  (D.equipamentos||[]).forEach(function(e){if(e.status==='Descarte autorizado'){e.tecnicoAtual='';e.tecnico_atual='';e.clienteAtual='';e.cliente_atual='';e.osAtual='';e.os_atual='';e.local='Descarte autorizado'}});
 }catch(e){}
}
async function baixaFinalForcada(){
 try{
  var inp=el('discSearch');
  var eq=findEq(inp&&inp.value);
  if(!eq){msg('Pesquise um equipamento válido antes de aprovar a baixa.','bad');return}
  var aprovado=(el('baixa42Aprov')&&el('baixa42Aprov').value||el('discAprov')&&el('discAprov').value||'').trim();
  if(!aprovado){msg('Informe quem aprovou a baixa final.','bad');return}
  var motivo=(el('baixa42Motivo')&&el('baixa42Motivo').value||el('discMotivo')&&el('discMotivo').value||'Descarte autorizado');
  var obs=(el('baixa42Obs')&&el('baixa42Obs').value||el('discObs')&&el('discObs').value||'');
  var solicit=(el('baixa42Solic')&&el('baixa42Solic').value||el('discSolic')&&el('discSolic').value||'');
  var tecnicoOrigem=lastResp(eq);
  var rec={equipamento_id:eq.id,codigo:eq.codigo,mac:eq.mac,serial:eq.serial,modelo:model(eq),tecnico:tecnicoOrigem,solicitado_por:solicit,aprovado_por:aprovado,motivo:motivo,status:'Descartado',observacao:obs,aprovado_em:new Date().toISOString(),descartado_em:new Date().toISOString()};
  var ins=await db().from('descartes_autorizados').insert(rec);
  if(ins.error)throw ins.error;
  var updRes=await db().from('equipamentos').update({status:'Descarte autorizado',local:'Descarte autorizado',tecnico_atual:null,cliente_atual:null,os_atual:null,motivo_atual:motivo}).eq('id',eq.id).select().single();
  if(updRes.error)throw updRes.error;
  eq.status='Descarte autorizado';eq.local='Descarte autorizado';eq.tecnicoAtual='';eq.tecnico_atual='';eq.clienteAtual='';eq.cliente_atual='';eq.osAtual='';eq.os_atual='';eq.motivoAtual=motivo;eq.motivo_atual=motivo;
  try{await mov(eq,'Baixa autorizada',{tec:tecnicoOrigem,dest:'Descarte autorizado',mot:motivo,obs:'Aprovado por '+aprovado+' | REMOVIDO DO ESTOQUE DO TÉCNICO | '+obs})}catch(e){}
  await cleanupDescartes();
  try{await loadAll()}catch(e){}
  try{render()}catch(e){}
  msg('Baixa final aprovada. Equipamento removido do estoque do técnico e bloqueado como descarte autorizado.','ok');
 }catch(e){msg('Erro ao aprovar baixa: '+e.message,'bad')}
}
function bind(){
 var b=el('baixa42Aprovar')||el('discAprovar');
 if(b){b.onclick=baixaFinalForcada;b.dataset.forceTechClear='1'}
}
document.addEventListener('DOMContentLoaded',function(){setTimeout(cleanupDescartes,2500);setInterval(bind,800);setTimeout(bind,1500)});
})();