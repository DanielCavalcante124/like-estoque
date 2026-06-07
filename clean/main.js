import { readConfig, saveConfig, initClient, login, logout, getSession, loadTable, rpc } from './api.js';

const state = { modelos: [], tecnicos: [], locais: [], user: null };
const $ = (id) => document.getElementById(id);
const ativo = (r) => r && r.ativo !== false;
const money = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
const num = (id) => Number($(id)?.value || 0) || 0;

function showMsg(id, text, type = ''){
  const el = $(id);
  if(!el) return;
  el.textContent = text;
  el.className = `msg show ${type}`;
}

function clearMsg(id){ const el = $(id); if(el){ el.textContent = ''; el.className = 'msg'; } }

function requireLogin(){
  if(!state.user) throw new Error('Faça login antes de operar.');
}

function setSession(user){
  state.user = user || null;
  $('sessionStatus').textContent = user ? 'Online' : 'Offline';
  $('sessionUser').textContent = user ? user.email : 'Faça login';
  $('loginPanel').style.display = user ? 'none' : 'block';
}

function setPage(page){
  document.querySelectorAll('.nav').forEach((b) => b.classList.toggle('active', b.dataset.page === page));
  document.querySelectorAll('.page').forEach((p) => p.classList.toggle('active', p.id === `page-${page}`));
  $('pageTitle').textContent = page === 'cadastros' ? 'Cadastros' : 'Dashboard';
}

async function loadAll(){
  requireLogin();
  state.modelos = await loadTable('modelos', 'tipo', true);
  state.tecnicos = await loadTable('tecnicos', 'nome', true);
  state.locais = await loadTable('locais', 'nome', true);
  render();
}

function render(){
  const modelosAtivos = state.modelos.filter(ativo);
  const tecnicosAtivos = state.tecnicos.filter(ativo);
  const locaisAtivos = state.locais.filter(ativo);
  $('kModelos').textContent = modelosAtivos.length;
  $('kTecnicos').textContent = tecnicosAtivos.length;
  $('kLocais').textContent = locaisAtivos.length;
  $('kInativos').textContent = (state.modelos.length - modelosAtivos.length) + (state.tecnicos.length - tecnicosAtivos.length) + (state.locais.length - locaisAtivos.length);
  renderModelos();
  renderTecnicos();
  renderLocais();
}

function renderModelos(){
  const filtro = ($('filtroModelos').value || '').toLowerCase();
  const rows = state.modelos.filter(ativo).filter((m) => JSON.stringify(m).toLowerCase().includes(filtro));
  $('tbodyModelos').innerHTML = rows.map((m) => `
    <tr>
      <td>${esc(m.tipo)}</td>
      <td>${esc(m.marca)}</td>
      <td>${esc(m.modelo)}</td>
      <td><span class="badge">${esc(m.categoria_estoque || 'Patrimônio')}</span></td>
      <td>${money(m.custo_padrao || m.custo)}</td>
      <td>${esc(m.estoque_minimo ?? m.minimo ?? 0)}</td>
      <td>${esc(m.estoque_ideal ?? m.ideal ?? 0)}</td>
      <td>
        <button class="secondary" data-edit-modelo="${m.id}">Editar</button>
        <button class="danger" data-desativar-modelo="${m.id}">Desativar</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="8">Nenhum modelo ativo.</td></tr>';
}

function renderTecnicos(){
  const filtro = ($('filtroTecnicos').value || '').toLowerCase();
  const rows = state.tecnicos.filter(ativo).filter((t) => String(t.nome || '').toLowerCase().includes(filtro));
  $('listaTecnicos').innerHTML = rows.map((t) => `
    <div class="item">
      <div><b>${esc(t.nome)}</b><br><small>ID: ${esc(t.id)}</small></div>
      <div>
        <button class="secondary" data-edit-tecnico="${t.id}">Editar</button>
        <button class="danger" data-desativar-tecnico="${t.id}">Desativar</button>
      </div>
    </div>
  `).join('') || '<div class="item">Nenhum técnico ativo.</div>';
}

function renderLocais(){
  const filtro = ($('filtroLocais').value || '').toLowerCase();
  const rows = state.locais.filter(ativo).filter((l) => JSON.stringify(l).toLowerCase().includes(filtro));
  $('listaLocais').innerHTML = rows.map((l) => `
    <div class="item">
      <div><b>${esc(l.nome)}</b><br><small>${esc(l.tipo || 'Outro')} ${l.fixo ? '• Fixo' : ''}</small></div>
      <div>
        <button class="secondary" data-edit-local="${l.id}">Editar</button>
        ${l.fixo ? '' : `<button class="danger" data-desativar-local="${l.id}">Desativar</button>`}
      </div>
    </div>
  `).join('') || '<div class="item">Nenhum local ativo.</div>';
}

function clearModelo(){ ['modeloId','modeloTipo','modeloMarca','modeloNome','modeloCusto','modeloMin','modeloIdeal'].forEach((id) => $(id).value = ''); $('modeloCategoria').value = 'Patrimônio'; clearMsg('modeloMsg'); }
function clearTecnico(){ ['tecnicoId','tecnicoNome'].forEach((id) => $(id).value = ''); clearMsg('tecnicoMsg'); }
function clearLocal(){ ['localId','localNome'].forEach((id) => $(id).value = ''); $('localTipo').value = 'Estoque'; clearMsg('localMsg'); }

async function salvarModelo(ev){
  ev.preventDefault();
  try{
    requireLogin();
    const id = $('modeloId').value;
    const tipo = $('modeloTipo').value.trim();
    const marca = $('modeloMarca').value.trim();
    const modelo = $('modeloNome').value.trim();
    if(!tipo || !marca || !modelo) throw new Error('Preencha tipo, marca e modelo.');
    if(id){
      await rpc('rpc_editar_modelo', { p_modelo_id:id, p_tipo:tipo, p_marca:marca, p_modelo:modelo, p_custo_padrao:num('modeloCusto'), p_estoque_minimo:num('modeloMin'), p_estoque_ideal:num('modeloIdeal') });
      showMsg('modeloMsg', 'Modelo editado com segurança.', 'ok');
    }else{
      await rpc('rpc_criar_modelo', { p_tipo:tipo, p_marca:marca, p_modelo:modelo, p_custo_padrao:num('modeloCusto'), p_estoque_minimo:num('modeloMin'), p_estoque_ideal:num('modeloIdeal'), p_categoria_estoque:$('modeloCategoria').value });
      showMsg('modeloMsg', 'Modelo criado com segurança.', 'ok');
    }
    clearModelo();
    await loadAll();
  }catch(e){ showMsg('modeloMsg', e.message, 'bad'); }
}

async function salvarTecnico(ev){
  ev.preventDefault();
  try{
    requireLogin();
    const id = $('tecnicoId').value;
    const nome = $('tecnicoNome').value.trim();
    if(!nome) throw new Error('Informe o nome do técnico.');
    if(id){ await rpc('rpc_editar_tecnico', { p_tecnico_id:id, p_nome:nome }); showMsg('tecnicoMsg', 'Técnico editado com segurança.', 'ok'); }
    else { await rpc('rpc_criar_tecnico', { p_nome:nome }); showMsg('tecnicoMsg', 'Técnico criado com segurança.', 'ok'); }
    clearTecnico();
    await loadAll();
  }catch(e){ showMsg('tecnicoMsg', e.message, 'bad'); }
}

async function salvarLocal(ev){
  ev.preventDefault();
  try{
    requireLogin();
    const id = $('localId').value;
    const nome = $('localNome').value.trim();
    const tipo = $('localTipo').value;
    if(!nome) throw new Error('Informe o nome do local.');
    if(id){ await rpc('rpc_editar_local', { p_local_id:id, p_nome:nome, p_tipo:tipo }); showMsg('localMsg', 'Local editado com segurança.', 'ok'); }
    else { await rpc('rpc_criar_local', { p_nome:nome, p_tipo:tipo }); showMsg('localMsg', 'Local criado com segurança.', 'ok'); }
    clearLocal();
    await loadAll();
  }catch(e){ showMsg('localMsg', e.message, 'bad'); }
}

async function desativarModelo(id){
  const m = state.modelos.find((x) => x.id === id);
  if(!m) return;
  const motivo = prompt(`Motivo para desativar ${m.tipo} ${m.marca} ${m.modelo}:`, 'Desativado pelo administrador');
  if(motivo === null) return;
  await rpc('rpc_desativar_modelo', { p_modelo_id:id, p_motivo:motivo.trim() || 'Desativado pelo administrador' });
  await loadAll();
}

async function desativarTecnico(id){
  const t = state.tecnicos.find((x) => x.id === id);
  if(!t) return;
  const motivo = prompt(`Motivo para desativar ${t.nome}:`, 'Desativado pelo administrador');
  if(motivo === null) return;
  await rpc('rpc_desativar_tecnico', { p_tecnico_id:id, p_motivo:motivo.trim() || 'Desativado pelo administrador' });
  await loadAll();
}

async function desativarLocal(id){
  const l = state.locais.find((x) => x.id === id);
  if(!l) return;
  const motivo = prompt(`Motivo para desativar ${l.nome}:`, 'Desativado pelo administrador');
  if(motivo === null) return;
  await rpc('rpc_desativar_local', { p_local_id:id, p_motivo:motivo.trim() || 'Desativado pelo administrador' });
  await loadAll();
}

function editModelo(id){
  const m = state.modelos.find((x) => x.id === id);
  if(!m) return;
  $('modeloId').value = m.id;
  $('modeloTipo').value = m.tipo || '';
  $('modeloMarca').value = m.marca || '';
  $('modeloNome').value = m.modelo || '';
  $('modeloCusto').value = m.custo_padrao || m.custo || 0;
  $('modeloMin').value = m.estoque_minimo || m.minimo || 0;
  $('modeloIdeal').value = m.estoque_ideal || m.ideal || 0;
  $('modeloCategoria').value = m.categoria_estoque || 'Patrimônio';
  setPage('cadastros');
}

function editTecnico(id){ const t = state.tecnicos.find((x) => x.id === id); if(t){ $('tecnicoId').value = t.id; $('tecnicoNome').value = t.nome || ''; setPage('cadastros'); } }
function editLocal(id){ const l = state.locais.find((x) => x.id === id); if(l){ $('localId').value = l.id; $('localNome').value = l.nome || ''; $('localTipo').value = l.tipo || 'Outro'; setPage('cadastros'); } }

async function boot(){
  const cfg = readConfig();
  if(cfg.url) $('loginUrl').value = cfg.url;
  if(cfg.key) $('loginKey').value = cfg.key;
  if(cfg.email) $('loginEmail').value = cfg.email;
  try{
    if(cfg.url && cfg.key){
      initClient(cfg.url, cfg.key);
      const session = await getSession();
      setSession(session?.user || null);
      if(session?.user) await loadAll();
    }
  }catch(e){ showMsg('loginMsg', e.message, 'bad'); }
}

function bind(){
  document.querySelectorAll('.nav').forEach((b) => b.onclick = () => setPage(b.dataset.page));
  $('btnLogin').onclick = async () => {
    try{
      const url = $('loginUrl').value.trim();
      const key = $('loginKey').value.trim();
      const email = $('loginEmail').value.trim();
      const pass = $('loginPass').value;
      saveConfig({ url, key, email });
      initClient(url, key);
      const data = await login(email, pass);
      setSession(data.user);
      await loadAll();
      showMsg('loginMsg', 'Login realizado.', 'ok');
    }catch(e){ showMsg('loginMsg', e.message, 'bad'); }
  };
  $('btnLogout').onclick = async () => { try{ await logout(); }catch(e){} setSession(null); };
  $('btnReload').onclick = () => loadAll().catch((e) => alert(e.message));
  $('formModelo').onsubmit = salvarModelo;
  $('formTecnico').onsubmit = salvarTecnico;
  $('formLocal').onsubmit = salvarLocal;
  $('btnModeloClear').onclick = clearModelo;
  $('btnTecnicoClear').onclick = clearTecnico;
  $('btnLocalClear').onclick = clearLocal;
  ['filtroModelos','filtroTecnicos','filtroLocais'].forEach((id) => $(id).oninput = render);
  document.body.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button');
    if(!btn) return;
    try{
      if(btn.dataset.editModelo) editModelo(btn.dataset.editModelo);
      if(btn.dataset.editTecnico) editTecnico(btn.dataset.editTecnico);
      if(btn.dataset.editLocal) editLocal(btn.dataset.editLocal);
      if(btn.dataset.desativarModelo) await desativarModelo(btn.dataset.desativarModelo);
      if(btn.dataset.desativarTecnico) await desativarTecnico(btn.dataset.desativarTecnico);
      if(btn.dataset.desativarLocal) await desativarLocal(btn.dataset.desativarLocal);
    }catch(e){ alert(e.message); }
  });
}

bind();
boot();
