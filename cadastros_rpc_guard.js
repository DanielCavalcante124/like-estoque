(function(){
function E(id){return document.getElementById(id)}
function H(v){try{return esc(v??'')}catch(e){return String(v??'')}}
function NN(v){try{return N(v)}catch(e){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}}
function ativo(x){return !x || x.ativo!==false}
function getNum(id){let el=E(id);return Number((el&&el.value)||0)||0}
async function callRpc(name,params){if(typeof rpcOne==='function')return await rpcOne(name,params);const r=await db().rpc(name,params);if(r.error)throw r.error;return Array.isArray(r.data)?r.data[0]:r.data}
function bindCadastros(){
  if(E('addModelo'))E('addModelo').onclick=window.addModelo;
  if(E('addTec'))E('addTec').onclick=window.addTec;
  if(E('addLocal'))E('addLocal').onclick=window.addLocal;
}
function clear(ids){ids.forEach(id=>{let el=E(id);if(el)el.value=''})}
window.addModelo=async function(){
  try{
    const tipo=E('mmTipo').value.trim(),marca=E('mmMarca').value.trim(),modelo=E('mmModelo').value.trim();
    if(!tipo||!marca||!modelo){msg('modMsg','Preencha Tipo, Marca e Modelo.','bad');return}
    if((D.modelos||[]).some(m=>ativo(m)&&NN(m.tipo)==NN(tipo)&&NN(m.marca)==NN(marca)&&NN(m.modelo)==NN(modelo))){msg('modMsg','Esse produto/modelo já existe.','bad');return}
    const saved=await callRpc('rpc_criar_modelo',{p_tipo:tipo,p_marca:marca,p_modelo:modelo,p_custo_padrao:getNum('mmCusto'),p_estoque_minimo:getNum('mmMin'),p_estoque_ideal:getNum('mmIdeal')});
    const idx=D.modelos.findIndex(m=>m.id===saved.id);if(idx>=0)D.modelos[idx]=saved;else D.modelos.push(saved);
    clear(['mmTipo','mmMarca','mmModelo','mmCusto','mmMin','mmIdeal']);render();msg('modMsg','Modelo salvo com segurança.','ok');
  }catch(e){msg('modMsg','Erro ao salvar modelo: '+e.message,'bad')}
}
window.editModelo=async function(id){
  try{
    const m=D.modelos.find(x=>x.id==id);if(!m)return;
    const tipo=prompt('Tipo:',m.tipo);if(tipo===null)return;
    const marca=prompt('Marca:',m.marca);if(marca===null)return;
    const modelo=prompt('Modelo:',m.modelo);if(modelo===null)return;
    const custo=prompt('Custo padrão:',m.custo_padrao||m.custo||0);if(custo===null)return;
    const min=prompt('Estoque mínimo:',m.estoque_minimo||m.minimo||0);if(min===null)return;
    const ideal=prompt('Estoque ideal:',m.estoque_ideal||m.ideal||0);if(ideal===null)return;
    const saved=await callRpc('rpc_editar_modelo',{p_modelo_id:id,p_tipo:tipo.trim(),p_marca:marca.trim(),p_modelo:modelo.trim(),p_custo_padrao:Number(custo||0),p_estoque_minimo:Number(min||0),p_estoque_ideal:Number(ideal||0)});
    Object.assign(m,saved);render();alert('Modelo editado com segurança.');
  }catch(e){alert('Erro ao editar modelo: '+e.message)}
}
window.delModelo=async function(id){
  try{
    const m=D.modelos.find(x=>x.id==id);if(!m)return;
    const motivo=prompt('Motivo para desativar o modelo '+m.tipo+' '+m.marca+' '+m.modelo+':','Desativado pelo administrador');
    if(motivo===null)return;if(!motivo.trim()){alert('Informe o motivo.');return}
    const saved=await callRpc('rpc_desativar_modelo',{p_modelo_id:id,p_motivo:motivo.trim()});
    Object.assign(m,saved);render();alert('Modelo desativado. Histórico preservado.');
  }catch(e){alert('Erro ao desativar modelo: '+e.message)}
}
window.addTec=async function(){
  try{
    const nome=E('tecNome').value.trim();if(!nome){msg('tecMsg','Informe o nome do técnico.','bad');return}
    if((D.tecnicos||[]).some(t=>ativo(t)&&NN(t.nome)==NN(nome))){msg('tecMsg','Técnico já existe.','bad');return}
    const saved=await callRpc('rpc_criar_tecnico',{p_nome:nome});
    const idx=D.tecnicos.findIndex(t=>t.id===saved.id);if(idx>=0)D.tecnicos[idx]=saved;else D.tecnicos.push(saved);
    E('tecNome').value='';render();msg('tecMsg','Técnico salvo com segurança.','ok');
  }catch(e){msg('tecMsg','Erro: '+e.message,'bad')}
}
window.editTec=async function(id){
  try{
    const t=D.tecnicos.find(x=>x.id==id);if(!t)return;
    const nome=prompt('Nome do técnico:',t.nome);if(nome===null||!nome.trim())return;
    const saved=await callRpc('rpc_editar_tecnico',{p_tecnico_id:id,p_nome:nome.trim()});
    Object.assign(t,saved);render();alert('Técnico editado com segurança.');
  }catch(e){alert('Erro ao editar técnico: '+e.message)}
}
window.delTec=async function(id){
  try{
    const t=D.tecnicos.find(x=>x.id==id);if(!t)return;
    const motivo=prompt('Motivo para desativar o técnico '+t.nome+':','Desativado pelo administrador');
    if(motivo===null)return;if(!motivo.trim()){alert('Informe o motivo.');return}
    const saved=await callRpc('rpc_desativar_tecnico',{p_tecnico_id:id,p_motivo:motivo.trim()});
    Object.assign(t,saved);render();alert('Técnico desativado. Histórico preservado.');
  }catch(e){alert('Erro ao desativar técnico: '+e.message)}
}
window.addLocal=async function(){
  try{
    const nome=E('locNome').value.trim(),tipo=E('locTipo').value;
    if(!nome){msg('locMsg','Informe o nome do local.','bad');return}
    if((D.locais||[]).some(l=>ativo(l)&&NN(l.nome)==NN(nome))){msg('locMsg','Local já existe.','bad');return}
    const saved=await callRpc('rpc_criar_local',{p_nome:nome,p_tipo:tipo});
    const idx=D.locais.findIndex(l=>l.id===saved.id);if(idx>=0)D.locais[idx]=saved;else D.locais.push(saved);
    E('locNome').value='';render();msg('locMsg','Local salvo com segurança.','ok');
  }catch(e){msg('locMsg','Erro: '+e.message,'bad')}
}
window.editLocal=async function(id){
  try{
    const l=D.locais.find(x=>x.id==id);if(!l)return;
    const nome=prompt('Nome do local:',l.nome);if(nome===null||!nome.trim())return;
    const tipo=prompt('Tipo do local:',l.tipo||'Outro');if(tipo===null)return;
    const saved=await callRpc('rpc_editar_local',{p_local_id:id,p_nome:nome.trim(),p_tipo:tipo.trim()||'Outro'});
    Object.assign(l,saved);render();alert('Local editado com segurança.');
  }catch(e){alert('Erro ao editar local: '+e.message)}
}
window.delLocal=async function(id){
  try{
    const l=D.locais.find(x=>x.id==id);if(!l)return;
    if(l.fixo){alert('Local fixo não pode ser desativado.');return}
    const motivo=prompt('Motivo para desativar o local '+l.nome+':','Desativado pelo administrador');
    if(motivo===null)return;if(!motivo.trim()){alert('Informe o motivo.');return}
    const saved=await callRpc('rpc_desativar_local',{p_local_id:id,p_motivo:motivo.trim()});
    Object.assign(l,saved);render();alert('Local desativado. Histórico preservado.');
  }catch(e){alert('Erro ao desativar local: '+e.message)}
}
function patchRender(){
  if(window.__cadastrosRpcRender||typeof window.render!=='function')return;
  window.__cadastrosRpcRender=true;
  const original=window.render;
  window.render=function(){
    if(!window.D)return original();
    const m=D.modelos,t=D.tecnicos,l=D.locais;
    D.modelos=(m||[]).filter(ativo);D.tecnicos=(t||[]).filter(ativo);D.locais=(l||[]).filter(ativo);
    try{return original()}finally{D.modelos=m;D.tecnicos=t;D.locais=l;bindCadastros()}
  }
}
function run(){patchRender();bindCadastros();if(typeof render==='function')render()}
document.addEventListener('DOMContentLoaded',()=>{[200,800,1600,3500,7000].forEach(t=>setTimeout(run,t))});
window.cadastrosRpcGuardRun=run;
})();