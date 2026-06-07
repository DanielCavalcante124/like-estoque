import { cfg, save, init, signIn, signOut, session, table, call } from './api.js?v=2';

const S = { modelos: [], tecnicos: [], locais: [], tipos: [], marcas: [], user: null };
const $ = (id) => document.getElementById(id);
const ativo = (r) => r && r.ativo !== false;
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const br = (v) => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const n = (id) => Number($(id)?.value || 0) || 0;
const setText = (id, value) => { const el = $(id); if(el) el.textContent = value; };
const setHtml = (id, value) => { const el = $(id); if(el) el.innerHTML = value; };

function msg(id, text, type=''){ const el=$(id); if(el){ el.textContent=text; el.className='msg show '+type; } }
function clearMsg(id){ const el=$(id); if(el){ el.textContent=''; el.className='msg'; } }
function setSession(user){
  S.user=user||null;
  document.body.classList.toggle('auth-locked', !S.user);
  document.body.classList.toggle('auth-ok', !!S.user);
  setText('sessionStatus',user?'Online':'Offline');
  setText('sessionUser',user?user.email:'Faça login');
  const box = document.querySelector('.session-box');
  if(box){ box.classList.toggle('online', !!user); box.classList.toggle('offline', !user); }
  const panel = $('loginPanel'); if(panel) panel.style.display=user?'none':'block';
  document.dispatchEvent(new CustomEvent('like:session', { detail:{ user:S.user } }));
}
function auth(){ if(!S.user) throw new Error('Faça login antes de operar.'); }
function page(p){ if(!S.user && p !== 'login') return; document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===p)); document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+p)); setText('pageTitle',p==='cadastros'?'Cadastros':'Dashboard'); }

function ensureCadastroUi(){
  const form=$('formModelo'); if(!form) return;
  if($('modeloTipo')?.tagName === 'INPUT') $('modeloTipo').outerHTML='<select id="modeloTipo"></select>';
  if($('modeloMarca')?.tagName === 'INPUT') $('modeloMarca').outerHTML='<select id="modeloMarca"></select>';
  if(!$('modeloControle')) $('modeloCategoria').insertAdjacentHTML('afterend','<select id="modeloControle"><option value="Unitário">Patrimônio unitário</option><option value="Quantidade">Material / quantidade</option></select><label class="checkline"><input id="modeloExigeMacSn" type="checkbox" checked> Exigir MAC/SN na entrada</label>');
  const pageCad=$('page-cadastros');
  if(pageCad && !$('taxonomiaCard')) pageCad.insertAdjacentHTML('afterbegin',`<div id="taxonomiaCard" class="grid two"><form id="formTipoProduto" class="card form-card"><h2>Tipo de produto</h2><input id="novoTipoProduto" placeholder="Ex: ONT, Roteador, Câmera"><button class="primary" type="submit">Cadastrar tipo</button><div id="tipoProdutoMsg" class="msg"></div></form><form id="formMarcaProduto" class="card form-card"><h2>Marca</h2><input id="novaMarcaProduto" placeholder="Ex: Huawei, Intelbras"><button class="primary" type="submit">Cadastrar marca</button><div id="marcaProdutoMsg" class="msg"></div></form></div>`);
  const head=document.querySelector('#tbodyModelos')?.closest('table')?.querySelector('thead tr');
  if(head) head.innerHTML='<th>Tipo</th><th>Marca</th><th>Modelo</th><th>Categoria</th><th>Controle</th><th>MAC/SN</th><th>Custo</th><th>Mínimo</th><th>Ideal</th><th>Ações</th>';
}
function fillTipoMarca(){
  if($('modeloTipo')) $('modeloTipo').innerHTML='<option value="">Selecione o tipo</option>'+S.tipos.filter(ativo).map(t=>`<option value="${esc(t.nome)}">${esc(t.nome)}</option>`).join('');
  if($('modeloMarca')) $('modeloMarca').innerHTML='<option value="">Selecione a marca</option>'+S.marcas.filter(ativo).map(m=>`<option value="${esc(m.nome)}">${esc(m.nome)}</option>`).join('');
}
async function loadAll(){
  auth(); ensureCadastroUi();
  S.modelos=await table('modelos','tipo',true);
  S.tecnicos=await table('tecnicos','nome',true);
  S.locais=await table('locais','nome',true);
  S.tipos=await table('produto_tipos','nome',true).catch(()=>[]);
  S.marcas=await table('produto_marcas','nome',true).catch(()=>[]);
  fillTipoMarca(); render();
}
function render(){
  const ma=S.modelos.filter(ativo), ta=S.tecnicos.filter(ativo), la=S.locais.filter(ativo);
  setText('kModelos',ma.length); setText('kTecnicos',ta.length); setText('kLocais',la.length);
  setText('kInativos',(S.modelos.length-ma.length)+(S.tecnicos.length-ta.length)+(S.locais.length-la.length));
  if($('tbodyModelos')) renderModelos(); if($('listaTecnicos')) renderTecnicos(); if($('listaLocais')) renderLocais();
}
function renderModelos(){
  const f=($('filtroModelos')?.value||'').toLowerCase(); const rows=S.modelos.filter(ativo).filter(m=>JSON.stringify(m).toLowerCase().includes(f));
  setHtml('tbodyModelos',rows.map(m=>`<tr><td>${esc(m.tipo)}</td><td>${esc(m.marca)}</td><td>${esc(m.modelo)}</td><td><span class="badge">${esc(m.categoria_estoque||'Patrimônio')}</span></td><td>${esc(m.controle||'Unitário')}</td><td>${m.exige_mac_sn===false?'Não':'Sim'}</td><td>${br(m.custo_padrao||m.custo)}</td><td>${esc(m.estoque_minimo??m.minimo??0)}</td><td>${esc(m.estoque_ideal??m.ideal??0)}</td><td><button class="secondary" data-edit-modelo="${m.id}">Editar</button><button class="danger" data-desativar-modelo="${m.id}">Desativar</button></td></tr>`).join('')||'<tr><td colspan="10">Nenhum modelo ativo.</td></tr>');
}
function renderTecnicos(){ const f=($('filtroTecnicos')?.value||'').toLowerCase(); const rows=S.tecnicos.filter(ativo).filter(t=>String(t.nome||'').toLowerCase().includes(f)); setHtml('listaTecnicos',rows.map(t=>`<div class="item"><div><b>${esc(t.nome)}</b><br><small>${esc(t.id)}</small></div><div><button class="secondary" data-edit-tecnico="${t.id}">Editar</button><button class="danger" data-desativar-tecnico="${t.id}">Desativar</button></div></div>`).join('')||'<div class="item">Nenhum técnico ativo.</div>'); }
function renderLocais(){ const f=($('filtroLocais')?.value||'').toLowerCase(); const rows=S.locais.filter(ativo).filter(l=>JSON.stringify(l).toLowerCase().includes(f)); setHtml('listaLocais',rows.map(l=>`<div class="item"><div><b>${esc(l.nome)}</b><br><small>${esc(l.tipo||'Outro')} ${l.fixo?'• Fixo':''}</small></div><div><button class="secondary" data-edit-local="${l.id}">Editar</button>${l.fixo?'':`<button class="danger" data-desativar-local="${l.id}">Desativar</button>`}</div></div>`).join('')||'<div class="item">Nenhum local ativo.</div>'); }
function clearModelo(){['modeloId','modeloTipo','modeloMarca','modeloNome','modeloCusto','modeloMin','modeloIdeal'].forEach(id=>{if($(id))$(id).value=''});if($('modeloCategoria'))$('modeloCategoria').value='Patrimônio';if($('modeloControle'))$('modeloControle').value='Unitário';if($('modeloExigeMacSn'))$('modeloExigeMacSn').checked=true;clearMsg('modeloMsg')}
function clearTecnico(){['tecnicoId','tecnicoNome'].forEach(id=>{if($(id))$(id).value=''});clearMsg('tecnicoMsg')}
function clearLocal(){['localId','localNome'].forEach(id=>{if($(id))$(id).value=''});if($('localTipo'))$('localTipo').value='Estoque';clearMsg('localMsg')}
async function salvarModelo(e){
  e.preventDefault();
  try{auth(); const id=$('modeloId').value, tipo=$('modeloTipo').value.trim(), marca=$('modeloMarca').value.trim(), modelo=$('modeloNome').value.trim(); if(!tipo||!marca||!modelo) throw new Error('Selecione tipo, marca e informe modelo.'); const categoria=$('modeloCategoria').value, controle=$('modeloControle')?.value||'Unitário', exige=!!$('modeloExigeMacSn')?.checked;
    const params={p_tipo:tipo,p_marca:marca,p_modelo:modelo,p_custo_padrao:n('modeloCusto'),p_estoque_minimo:n('modeloMin'),p_estoque_ideal:n('modeloIdeal'),p_categoria_estoque:categoria,p_controle:controle,p_unidade_saida:'Unidade',p_observacao_regra:null,p_exige_mac_sn:exige};
    if(id) await call('rpc_editar_modelo',{p_modelo_id:id,...params}); else await call('rpc_criar_modelo',params);
    clearModelo(); await loadAll(); msg('modeloMsg','Modelo salvo com segurança.','ok');
  }catch(err){msg('modeloMsg',err.message,'bad')}
}
async function salvarTipo(e){ e.preventDefault(); try{auth(); const nome=$('novoTipoProduto').value.trim(); if(!nome) throw new Error('Informe o tipo.'); await call('rpc_criar_produto_tipo',{p_nome:nome}); $('novoTipoProduto').value=''; await loadAll(); msg('tipoProdutoMsg','Tipo cadastrado.','ok');}catch(err){msg('tipoProdutoMsg',err.message,'bad')} }
async function salvarMarca(e){ e.preventDefault(); try{auth(); const nome=$('novaMarcaProduto').value.trim(); if(!nome) throw new Error('Informe a marca.'); await call('rpc_criar_produto_marca',{p_nome:nome}); $('novaMarcaProduto').value=''; await loadAll(); msg('marcaProdutoMsg','Marca cadastrada.','ok');}catch(err){msg('marcaProdutoMsg',err.message,'bad')} }
async function salvarTecnico(e){ e.preventDefault(); try{auth(); const id=$('tecnicoId').value, nome=$('tecnicoNome').value.trim(); if(!nome) throw new Error('Informe o nome do técnico.'); if(id) await call('rpc_editar_tecnico',{p_tecnico_id:id,p_nome:nome}); else await call('rpc_criar_tecnico',{p_nome:nome}); clearTecnico(); await loadAll(); msg('tecnicoMsg','Técnico salvo com segurança.','ok');}catch(err){msg('tecnicoMsg',err.message,'bad')} }
async function salvarLocal(e){ e.preventDefault(); try{auth(); const id=$('localId').value, nome=$('localNome').value.trim(), tipo=$('localTipo').value; if(!nome) throw new Error('Informe o nome do local.'); if(id) await call('rpc_editar_local',{p_local_id:id,p_nome:nome,p_tipo:tipo}); else await call('rpc_criar_local',{p_nome:nome,p_tipo:tipo}); clearLocal(); await loadAll(); msg('localMsg','Local salvo com segurança.','ok');}catch(err){msg('localMsg',err.message,'bad')} }
async function desativarModelo(id){const m=S.modelos.find(x=>x.id===id); if(!m) return; const motivo=prompt(`Motivo para desativar ${m.tipo} ${m.marca} ${m.modelo}:`,'Desativado pelo administrador'); if(motivo===null)return; await call('rpc_desativar_modelo',{p_modelo_id:id,p_motivo:motivo.trim()||'Desativado pelo administrador'}); await loadAll();}
async function desativarTecnico(id){const t=S.tecnicos.find(x=>x.id===id); if(!t) return; const motivo=prompt(`Motivo para desativar ${t.nome}:`,'Desativado pelo administrador'); if(motivo===null)return; await call('rpc_desativar_tecnico',{p_tecnico_id:id,p_motivo:motivo.trim()||'Desativado pelo administrador'}); await loadAll();}
async function desativarLocal(id){const l=S.locais.find(x=>x.id===id); if(!l) return; const motivo=prompt(`Motivo para desativar ${l.nome}:`,'Desativado pelo administrador'); if(motivo===null)return; await call('rpc_desativar_local',{p_local_id:id,p_motivo:motivo.trim()||'Desativado pelo administrador'}); await loadAll();}
function editModelo(id){const m=S.modelos.find(x=>x.id===id); if(!m)return; $('modeloId').value=m.id; $('modeloTipo').value=m.tipo||''; $('modeloMarca').value=m.marca||''; $('modeloNome').value=m.modelo||''; $('modeloCusto').value=m.custo_padrao||m.custo||0; $('modeloMin').value=m.estoque_minimo||m.minimo||0; $('modeloIdeal').value=m.estoque_ideal||m.ideal||0; $('modeloCategoria').value=m.categoria_estoque||'Patrimônio'; if($('modeloControle'))$('modeloControle').value=m.controle||'Unitário'; if($('modeloExigeMacSn'))$('modeloExigeMacSn').checked=m.exige_mac_sn!==false; page('cadastros');}
function editTecnico(id){const t=S.tecnicos.find(x=>x.id===id); if(t){$('tecnicoId').value=t.id; $('tecnicoNome').value=t.nome||''; page('cadastros');}}
function editLocal(id){const l=S.locais.find(x=>x.id===id); if(l){$('localId').value=l.id; $('localNome').value=l.nome||''; $('localTipo').value=l.tipo||'Outro'; page('cadastros');}}
function bind(){
  ensureCadastroUi();
  document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>page(b.dataset.page));
  const loginBtn=$('btnLogin'); if(loginBtn) loginBtn.onclick=async()=>{try{const email=$('loginEmail').value.trim(), pass=$('loginPass').value; save({email}); init(); const data=await signIn(email,pass); setSession(data.user); await loadAll(); msg('loginMsg','Login realizado.','ok');}catch(e){msg('loginMsg',e.message,'bad')}};
  if($('btnLogout')) $('btnLogout').onclick=async()=>{try{await signOut()}catch(e){} setSession(null)}; if($('btnReload')) $('btnReload').onclick=()=>loadAll().catch(e=>alert(e.message));
  if($('formModelo')) $('formModelo').onsubmit=salvarModelo; if($('formTipoProduto')) $('formTipoProduto').onsubmit=salvarTipo; if($('formMarcaProduto')) $('formMarcaProduto').onsubmit=salvarMarca;
  if($('formTecnico')) $('formTecnico').onsubmit=salvarTecnico; if($('formLocal')) $('formLocal').onsubmit=salvarLocal; if($('btnModeloClear')) $('btnModeloClear').onclick=clearModelo; if($('btnTecnicoClear')) $('btnTecnicoClear').onclick=clearTecnico; if($('btnLocalClear')) $('btnLocalClear').onclick=clearLocal;
  ['filtroModelos','filtroTecnicos','filtroLocais'].forEach(id=>{if($(id))$(id).oninput=render});
  document.body.addEventListener('click',async ev=>{const b=ev.target.closest('button'); if(!b)return; try{if(b.dataset.editModelo)editModelo(b.dataset.editModelo); if(b.dataset.editTecnico)editTecnico(b.dataset.editTecnico); if(b.dataset.editLocal)editLocal(b.dataset.editLocal); if(b.dataset.desativarModelo)await desativarModelo(b.dataset.desativarModelo); if(b.dataset.desativarTecnico)await desativarTecnico(b.dataset.desativarTecnico); if(b.dataset.desativarLocal)await desativarLocal(b.dataset.desativarLocal);}catch(e){alert(e.message)}});
}
async function boot(){setSession(null); const c=cfg(); if($('loginEmail'))$('loginEmail').value=c.email||''; try{init(); const s=await session(); setSession(s?.user||null); if(s?.user)await loadAll();}catch(e){setSession(null); msg('loginMsg',e.message,'bad')}}
bind(); boot();