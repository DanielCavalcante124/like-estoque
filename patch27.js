let likeDirty=false;
let likeAutoReloadTimer=null;
let likeAutoReloadRunning=false;

function setSyncStatus(text,cls){
  const a=document.getElementById('syncWarn');
  const b=document.getElementById('syncWarnTop');
  [a,b].forEach(e=>{if(e){e.textContent=text;e.className='status '+cls}});
}
function markLikeDirty(){
  likeDirty=true;
  setSyncStatus('Sincronizando automaticamente...', 'bad');
  scheduleAutoReload();
}
function clearLikeDirty(){
  likeDirty=false;
  setSyncStatus('Atualizado', 'ok');
}
function scheduleAutoReload(){
  clearTimeout(likeAutoReloadTimer);
  likeAutoReloadTimer=setTimeout(async()=>{
    if(likeAutoReloadRunning || !sb) return;
    try{
      likeAutoReloadRunning=true;
      setSyncStatus('Atualizando dados...', 'bad');
      await loadAll();
      clearLikeDirty();
    }catch(e){
      console.error(e);
      likeDirty=true;
      setSyncStatus('Falha ao atualizar. Clique em Recarregar dados.', 'bad');
    }finally{
      likeAutoReloadRunning=false;
    }
  },1200);
}
window.addEventListener('beforeunload',function(ev){
  if(likeDirty){
    ev.preventDefault();
    ev.returnValue='Ainda existe uma sincronização automática pendente.';
    return ev.returnValue;
  }
});

const likeOriginalIns=ins;
ins=async function(t,r){const out=await likeOriginalIns(t,r);markLikeDirty();return out};
const likeOriginalUpd=upd;
upd=async function(t,id,r){const out=await likeOriginalUpd(t,id,r);markLikeDirty();return out};
const likeOriginalDel=del;
del=async function(t,id){const out=await likeOriginalDel(t,id);markLikeDirty();return out};
const likeOriginalLoadAll=loadAll;
loadAll=async function(){const out=await likeOriginalLoadAll();clearLikeDirty();return out};

function fillRetornoSelects(){
  if(!document.getElementById('retTipo')) return;
  const old={tipo:retTipo.value,marca:retMarca.value,modelo:retModelo.value,tec:retTec.value};
  const tipos=[...new Set(D.modelos.map(x=>x.tipo).filter(Boolean))].sort();
  const marcas=[...new Set(D.modelos.map(x=>x.marca).filter(Boolean))].sort();
  retTipo.innerHTML='<option value="">Tipo</option>'+tipos.map(x=>`<option>${esc(x)}</option>`).join('');
  retMarca.innerHTML='<option value="">Marca</option>'+marcas.map(x=>`<option>${esc(x)}</option>`).join('');
  if(tipos.includes(old.tipo))retTipo.value=old.tipo;
  if(marcas.includes(old.marca))retMarca.value=old.marca;
  const mods=D.modelos.filter(m=>(!retTipo.value||m.tipo===retTipo.value)&&(!retMarca.value||m.marca===retMarca.value));
  retModelo.innerHTML='<option value="">Modelo</option>'+mods.map(m=>`<option>${esc(m.modelo)}</option>`).join('');
  if(mods.some(m=>m.modelo===old.modelo))retModelo.value=old.modelo;
  retTec.innerHTML='<option value="">Técnico que devolveu</option>'+D.tecnicos.map(t=>`<option>${esc(t.nome)}</option>`).join('');
  if(D.tecnicos.some(t=>t.nome===old.tec))retTec.value=old.tec;
}
const likeOriginalRender=render;
render=function(){likeOriginalRender();fillRetornoSelects()};

async function retornoSemCadastro(){
  try{
    const t=retTipo.value, m=retMarca.value, mo=retModelo.value, mac=retMac.value.trim(), sn=retSerial.value.trim(), tec=retTec.value, cond=retCond.value, dest=retDest.value, os=retOS.value.trim(), obs=retObs.value.trim(), custo=Number(retCusto.value||0);
    if(!t||!m||!mo){msg('retMsg','Selecione tipo, marca e modelo.','bad');return}
    if(!mac&&!sn){msg('retMsg','Informe MAC ou Serial/SN.','bad');return}
    if(!tec){msg('retMsg','Informe o técnico que devolveu.','bad');return}
    if(D.equipamentos.some(e=>(mac&&N(e.mac)===N(mac))||(sn&&N(e.serial)===N(sn)))){msg('retMsg','Esse MAC/SN já existe. Use Devolução normal.','bad');return}
    let status='Em estoque', local='Estoque central';
    if(dest==='Manutenção/Teste'){status='Em manutenção';local='Bancada técnica'}
    if(dest==='Inutilizado'){status='Inutilizado';local='Inutilizado'}
    if(dest==='Perdido'){status='Perdido';local='Perdido'}
    const novo={codigo:next('EQP','codigo'),patrimonio:next('PAT','patrimonio'),tipo:t,marca:m,modelo:mo,mac:mac||null,serial:sn||null,status,local,tecnico_atual:status==='Em estoque'?null:tec,cliente_atual:null,os_atual:os||null,motivo_atual:cond,custo,origem:'Retorno sem cadastro anterior',tecnico_devolucao:tec,condicao_retorno:cond,retorno_sem_cadastro:true,retorno_data:today(),inutilizado_obs:obs||null};
    const savedRaw=await ins('equipamentos',novo);
    const saved=fromEq(savedRaw);
    D.equipamentos.unshift(saved);
    try{await ins('inventario',{equipamento_id:saved.id,conferido:false,data:null,obs:null})}catch(_e){}
    await ins('movimentos',{equipamento_id:saved.id,data:today(),tipo:'Retorno sem cadastro',codigo:saved.codigo,mac:saved.mac,serial:saved.serial,tecnico:tec,destino:dest,cliente:'',os,condicao:cond,motivo:cond,status_final:saved.status,obs,origem:'Retorno sem cadastro anterior'});
    ['retMac','retSerial','retOS','retObs','retCusto'].forEach(id=>document.getElementById(id).value='');
    render();msg('retMsg','Retorno sem cadastro registrado: '+saved.codigo,'ok');
  }catch(e){msg('retMsg','Erro: '+e.message,'bad')}
}

document.addEventListener('DOMContentLoaded',function(){
  if(document.getElementById('retorno')) retorno.onclick=retornoSemCadastro;
  ['retTipo','retMarca'].forEach(id=>{const el=document.getElementById(id);if(el)el.onchange=render});
  clearLikeDirty();
});
