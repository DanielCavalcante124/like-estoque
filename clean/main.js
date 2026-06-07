import { cfg, save, init, signIn, signOut, session, table, call } from './api.js';

const S = { modelos: [], tecnicos: [], locais: [], user: null };
const $ = (id) => document.getElementById(id);
const ativo = (r) => r && r.ativo !== false;
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const br = (v) => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const n = (id) => Number($(id)?.value || 0) || 0;

function msg(id, text, type=''){
  const el=$(id); if(!el) return;
  el.textContent=text; el.className='msg show '+type;
}
function clearMsg(id){ const el=$(id); if(el){ el.textContent=''; el.className='msg'; } }
function setSession(user){
  S.user=user||null;
  $('sessionStatus').textContent=user?'Online':'Offline';
  $('sessionUser').textContent=user?user.email:'Faça login';
  $('loginPanel').style.display=user?'none':'block';
}
function auth(){ if(!S.user) throw new Error('Faça login antes de operar.'); }
function page(p){
  document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===p));
  document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+p));
  $('pageTitle').textContent=p==='cadastros'?'Cadastros':'Dashboard';
}
async function loadAll(){
  auth();
  S.modelos=await table('modelos','tipo',true);
  S.tecnicos=await table('tecnicos','nome',true);
  S.locais=await table('locais','nome',true);
  render();
}
function render(){
  const ma=S.modelos.filter(ativo), ta=S.tecnicos.filter(ativo), la=S.locais.filter(ativo);
  $('kModelos').textContent=ma.length; $('kTecnicos').textContent=ta.length; $('kLocais').textContent=la.length;
  $('kInativos').textContent=(S.modelos.length-ma.length)+(S.tecnicos.length-ta.length)+(S.locais.length-la.length);
  renderModelos(); renderTecnicos(); renderLocais();
}
function renderModelos(){
  const f=($('filtroModelos').value||'').toLowerCase();
  const rows=S.modelos.filter(ativo).filter(m=>JSON.stringify(m).toLowerCase().includes(f));
  $('tbodyModelos').innerHTML=rows.map(m=>`<tr><td>${esc(m.tipo)}</td><td>${esc(m.marca)}</td><td>${esc(m.modelo)}</td><td><span class="badge">${esc(m.categoria_estoque||'Patrimônio')}</span></td><td>${br(m.custo_padrao||m.custo)}</td><td>${esc(m.estoque_minimo??m.minimo??0)}</td><td>${esc(m.estoque_ideal??m.ideal??0)}</td><td><button class="secondary" data-edit-modelo="${m.id}">Editar</button><button class="danger" data-desativar-modelo="${m.id}">Desativar</button></td></tr>`).join('')||'<tr><td colspan="8">Nenhum modelo ativo.</td></tr>';
}
function renderTecnicos(){
  const f=($('filtroTecnicos').value||'').toLowerCase();
  const rows=S.tecnicos.filter(ativo).filter(t=>String(t.nome||'').toLowerCase().includes(f));
  $('listaTecnicos').innerHTML=rows.map(t=>`<div class="item"><div><b>${esc(t.nome)}</b><br><small>${esc(t.id)}</small></div><div><button class="secondary" data-edit-tecnico="${t.id}">Editar</button><button class="danger" data-desativar-tecnico="${t.id}">Desativar</button></div></div>`).join('')||'<div class="item">Nenhum técnico ativo.</div>';
}
function renderLocais(){
  const f=($('filtroLocais').value||'').toLowerCase();
  const rows=S.locais.filter(ativo).filter(l=>JSON.stringify(l).toLowerCase().includes(f));
  $('listaLocais').innerHTML=rows.map(l=>`<div class="item"><div><b>${esc(l.nome)}</b><br><small>${esc(l.tipo||'Outro')} ${l.fixo?'• Fixo':''}</small></div><div><button class="secondary" data-edit-local="${l.id}">Editar</button>${l.fixo?'':`<button class="danger" data-desativar-local="${l.id}">Desativar</button>`}</div></div>`).join('')||'<div class="item">Nenhum local ativo.</div>';
}
function clearModelo(){['modeloId','modeloTipo','modeloMarca','modeloNome','modeloCusto','modeloMin','modeloIdeal'].forEach(id=>$(id).value='');$('modeloCategoria').value='Patrimônio';clearMsg('modeloMsg')}
function clearTecnico(){['tecnicoId','tecnicoNome'].forEach(id=>$(id).value='');clearMsg('tecnicoMsg')}
function clearLocal(){['localId','localNome'].forEach(id=>$(id).value='');$('localTipo').value='Estoque';clearMsg('localMsg')}
async function salvarModelo(e){
  e.preventDefault();
  try{auth(); const id=$('modeloId').value, tipo=$('modeloTipo').value.trim(), marca=$('modeloMarca').value.trim(), modelo=$('modeloNome').value.trim(); if(!tipo||!marca||!modelo) throw new Error('Preencha tipo, marca e modelo.');
    if(id) await call('rpc_editar_modelo',{p_modelo_id:id,p_tipo:tipo,p_marca:marca,p_modelo:modelo,p_custo_padrao:n('modeloCusto'),p_estoque_minimo:n('modeloMin'),p_estoque_ideal:n('modeloIdeal')});
    else await call('rpc_criar_modelo',{p_tipo:tipo,p_marca:marca,p_modelo:modelo,p_custo_padrao:n('modeloCusto'),p_estoque_minimo:n('modeloMin'),p_estoque_ideal:n('modeloIdeal'),p_categoria_estoque:$('modeloCategoria').value});
    clearModelo(); await loadAll(); msg('modeloMsg','Modelo salvo com segurança.','ok');
  }catch(err){msg('modeloMsg',err.message,'bad')}
}
async function salvarTecnico(e){
  e.preventDefault();
  try{auth(); const id=$('tecnicoId').value, nome=$('tecnicoNome').value.trim(); if(!nome) throw new Error('Informe o nome do técnico.'); if(id) await call('rpc_editar_tecnico',{p_tecnico_id:id,p_nome:nome}); else await call('rpc_criar_tecnico',{p_nome:nome}); clearTecnico(); await loadAll(); msg('tecnicoMsg','Técnico salvo com segurança.','ok');}catch(err){msg('tecnicoMsg',err.message,'bad')}
}
async function salvarLocal(e){
  e.preventDefault();
  try{auth(); const id=$('localId').value, nome=$('localNome').value.trim(), tipo=$('localTipo').value; if(!nome) throw new Error('Informe o nome do local.'); if(id) await call('rpc_editar_local',{p_local_id:id,p_nome:nome,p_tipo:tipo}); else await call('rpc_criar_local',{p_nome:nome,p_tipo:tipo}); clearLocal(); await loadAll(); msg('localMsg','Local salvo com segurança.','ok');}catch(err){msg('localMsg',err.message,'bad')}
}
async function desativarModelo(id){const m=S.modelos.find(x=>x.id===id); if(!m) return; const motivo=prompt(`Motivo para desativar ${m.tipo} ${m.marca} ${m.modelo}:`,'Desativado pelo administrador'); if(motivo===null)return; await call('rpc_desativar_modelo',{p_modelo_id:id,p_motivo:motivo.trim()||'Desativado pelo administrador'}); await loadAll();}
async function desativarTecnico(id){const t=S.tecnicos.find(x=>x.id===id); if(!t) return; const motivo=prompt(`Motivo para desativar ${t.nome}:`,'Desativado pelo administrador'); if(motivo===null)return; await call('rpc_desativar_tecnico',{p_tecnico_id:id,p_motivo:motivo.trim()||'Desativado pelo administrador'}); await loadAll();}
async function desativarLocal(id){const l=S.locais.find(x=>x.id===id); if(!l) return; const motivo=prompt(`Motivo para desativar ${l.nome}:`,'Desativado pelo administrador'); if(motivo===null)return; await call('rpc_desativar_local',{p_local_id:id,p_motivo:motivo.trim()||'Desativado pelo administrador'}); await loadAll();}
function editModelo(id){const m=S.modelos.find(x=>x.id===id); if(!m)return; $('modeloId').value=m.id; $('modeloTipo').value=m.tipo||''; $('modeloMarca').value=m.marca||''; $('modeloNome').value=m.modelo||''; $('modeloCusto').value=m.custo_padrao||m.custo||0; $('modeloMin').value=m.estoque_minimo||m.minimo||0; $('modeloIdeal').value=m.estoque_ideal||m.ideal||0; $('modeloCategoria').value=m.categoria_estoque||'Patrimônio'; page('cadastros');}
function editTecnico(id){const t=S.tecnicos.find(x=>x.id===id); if(t){$('tecnicoId').value=t.id; $('tecnicoNome').value=t.nome||''; page('cadastros');}}
function editLocal(id){const l=S.locais.find(x=>x.id===id); if(l){$('localId').value=l.id; $('localNome').value=l.nome||''; $('localTipo').value=l.tipo||'Outro'; page('cadastros');}}
function bind(){
  document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>page(b.dataset.page));
  $('btnLogin').onclick=async()=>{try{const url=$('loginUrl').value.trim(), key=$('loginKey').value.trim(), email=$('loginEmail').value.trim(), pass=$('loginPass').value; save({url,key,email}); init(url,key); const data=await signIn(email,pass); setSession(data.user); await loadAll(); msg('loginMsg','Login realizado.','ok');}catch(e){msg('loginMsg',e.message,'bad')}};
  $('btnLogout').onclick=async()=>{try{await signOut()}catch(e){} setSession(null)};
  $('btnReload').onclick=()=>loadAll().catch(e=>alert(e.message));
  $('formModelo').onsubmit=salvarModelo; $('formTecnico').onsubmit=salvarTecnico; $('formLocal').onsubmit=salvarLocal;
  $('btnModeloClear').onclick=clearModelo; $('btnTecnicoClear').onclick=clearTecnico; $('btnLocalClear').onclick=clearLocal;
  ['filtroModelos','filtroTecnicos','filtroLocais'].forEach(id=>$(id).oninput=render);
  document.body.addEventListener('click',async ev=>{const b=ev.target.closest('button'); if(!b)return; try{if(b.dataset.editModelo)editModelo(b.dataset.editModelo); if(b.dataset.editTecnico)editTecnico(b.dataset.editTecnico); if(b.dataset.editLocal)editLocal(b.dataset.editLocal); if(b.dataset.desativarModelo)await desativarModelo(b.dataset.desativarModelo); if(b.dataset.desativarTecnico)await desativarTecnico(b.dataset.desativarTecnico); if(b.dataset.desativarLocal)await desativarLocal(b.dataset.desativarLocal);}catch(e){alert(e.message)}});
}
async function boot(){const c=cfg(); $('loginUrl').value=c.url||''; $('loginKey').value=c.key||''; $('loginEmail').value=c.email||''; try{if(c.url&&c.key){init(c.url,c.key); const s=await session(); setSession(s?.user||null); if(s?.user)await loadAll();}}catch(e){msg('loginMsg',e.message,'bad')}}
bind(); boot();
