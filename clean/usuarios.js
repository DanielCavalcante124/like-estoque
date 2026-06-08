import { call } from './api.js?v=3';

const S = { admin:false, contexto:null, perfis:[], usuarios:[], resumo:null, edit:null };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const dt = v => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return String(v || '-'); } };
const num = v => Number(v || 0).toLocaleString('pt-BR');

function msg(text,type=''){
  const el = $('usrMsg');
  if(el){ el.textContent = text; el.className = 'msg show ' + type; }
}
function css(){
  if($('usrCss')) return;
  const s = document.createElement('style');
  s.id = 'usrCss';
  s.textContent = `.usr-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.usr-kpi{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:12px}.usr-kpi small{display:block;color:#64748b;font-weight:800}.usr-kpi b{font-size:21px}.usr-grid{display:grid;grid-template-columns:420px 1fr;gap:12px}.usr-actions{display:flex;gap:8px;flex-wrap:wrap}.usr-box{border:1px solid #e5e7eb;border-radius:14px;padding:10px;margin-bottom:8px;background:#fff}.usr-box b{display:block}.usr-box small{color:#64748b}.usr-ok{background:#dcfce7;color:#166534}.usr-bad{background:#fee2e2;color:#991b1b}.usr-warn{border-color:#eab308;background:#fffbeb}.usr-id{font-family:ui-monospace,monospace;font-size:11px;word-break:break-all;color:#64748b}@media(max-width:1100px){.usr-grid{grid-template-columns:1fr}.usr-kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.usr-actions button{width:100%}.usr-kpis{grid-template-columns:1fr}}`;
  document.head.appendChild(s);
}
function removeAdminUi(){
  const nav = $('navUsuariosClean');
  const page = $('page-usuarios-clean');
  const active = nav?.classList.contains('active') || page?.classList.contains('active');
  if(nav) nav.remove();
  if(page) page.remove();
  if(active) document.querySelector('[data-page="dashboard"]')?.click();
}
async function ensureAdmin(){
  try{
    const ctx = await call('rpc_usuario_contexto_6c', {});
    S.contexto = ctx;
    S.admin = !!ctx?.is_admin;
    if(S.admin) inject(); else removeAdminUi();
    return S.admin;
  }catch(e){ S.admin=false; removeAdminUi(); return false; }
}
function inject(){
  css();
  if(!$('navUsuariosClean')){
    const ref = $('navBackupClean') || $('navProducaoClean') || $('navAnaliseOperacionalClean') || document.querySelector('[data-page="cadastros"]');
    const b = document.createElement('button');
    b.id = 'navUsuariosClean';
    b.className = 'nav';
    b.textContent = 'Usuários';
    b.onclick = show;
    ref ? ref.insertAdjacentElement('afterend', b) : document.querySelector('.sidebar')?.appendChild(b);
  }
  if(!$('page-usuarios-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-usuarios-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head"><div><h2>Usuários, perfis e permissões</h2><p>Painel interno admin. Crie o login no Supabase Auth e gerencie aqui o perfil operacional.</p></div><button id="usrReload" class="secondary">Recarregar</button></div>
        <div id="usrMsg" class="msg show warn">Esta tela não cria senha. Ela vincula e controla permissões de usuários Auth existentes.</div>
      </div>
      <div id="usrKpis" class="usr-kpis"></div>
      <div class="usr-grid">
        <form id="usrForm" class="card form-card">
          <h2>Perfil operacional</h2>
          <input id="usrProfileId" type="hidden">
          <label>User ID do Supabase Auth</label>
          <input id="usrUserId" placeholder="UUID do usuário no Supabase Auth">
          <label>Nome / e-mail operacional</label>
          <input id="usrNome" placeholder="Nome ou e-mail">
          <div class="form-grid two"><div><label>Perfil</label><select id="usrPerfil"></select></div><div><label>Status</label><select id="usrAtivo"><option value="true">Ativo</option><option value="false">Inativo</option></select></div></div>
          <label>Técnico vinculado opcional</label>
          <input id="usrTecnico" placeholder="Nome do técnico, se aplicável">
          <label>Motivo da alteração</label>
          <input id="usrMotivo" placeholder="Ex: criação, troca de função, desligamento">
          <div class="usr-actions"><button class="primary" type="submit">Salvar perfil</button><button class="secondary" type="button" id="usrLimpar">Limpar</button></div>
        </form>
        <div class="card">
          <div class="table-head"><h2>Perfis cadastrados</h2><div class="usr-actions"><input id="usrBusca" placeholder="Buscar nome, técnico ou UUID"><select id="usrFiltroPerfil"><option value="">Todos</option></select><select id="usrFiltroAtivo"><option value="">Todos</option><option value="true">Ativos</option><option value="false">Inativos</option></select></div></div>
          <div class="table-wrap"><table><thead><tr><th>Usuário</th><th>Perfil</th><th>Status</th><th>Técnico</th><th>Ações</th></tr></thead><tbody id="usrTbody"></tbody></table></div>
        </div>
      </div>
      <div class="card"><h2>Perfis e permissões</h2><div id="usrPermissoes"></div></div>`;
    document.querySelector('.main')?.appendChild(sec);
  }
  $('usrReload').onclick = loadAll;
  $('usrForm').onsubmit = salvar;
  $('usrLimpar').onclick = limparForm;
  ['usrBusca','usrFiltroPerfil','usrFiltroAtivo'].forEach(id => $(id).oninput = loadUsuarios);
}
async function show(){
  const ok = S.admin || await ensureAdmin();
  if(!ok){ alert('Acesso restrito ao administrador.'); return; }
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navUsuariosClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-usuarios-clean'));
  if($('pageTitle')) $('pageTitle').textContent = 'Usuários';
  loadAll().catch(e=>msg(e.message || String(e),'bad'));
}
function kpi(label,value){ return `<div class="usr-kpi"><small>${esc(label)}</small><b>${esc(value)}</b></div>`; }
function box(title,body,small='',cls=''){
  return `<div class="usr-box ${cls}"><b>${esc(title)}</b><small>${esc(body || '')}${small ? '<br>'+esc(small) : ''}</small></div>`;
}
async function loadAll(){
  const ok = S.admin || await ensureAdmin();
  if(!ok) return;
  msg('Carregando usuários e permissões...', 'warn');
  const perfis = await call('rpc_perfis_disponiveis_6c', {});
  S.perfis = perfis.perfis || [];
  renderSelects();
  await loadUsuarios();
  renderPermissoes(perfis);
  msg('Usuários carregados.', 'ok');
}
function renderSelects(){
  const opts = S.perfis.map(p => `<option value="${esc(p.perfil)}">${esc(p.nome)}</option>`).join('');
  $('usrPerfil').innerHTML = opts;
  $('usrFiltroPerfil').innerHTML = '<option value="">Todos</option>' + opts;
}
async function loadUsuarios(){
  const ativoVal = $('usrFiltroAtivo')?.value || '';
  const ativo = ativoVal === '' ? null : ativoVal === 'true';
  const res = await call('rpc_listar_usuarios_perfis_6c', {
    p_busca: $('usrBusca')?.value || null,
    p_perfil: $('usrFiltroPerfil')?.value || null,
    p_ativo: ativo,
    p_limite: 100
  });
  S.usuarios = res.usuarios || [];
  S.resumo = res.resumo || {};
  renderUsuarios();
}
function renderUsuarios(){
  const r = S.resumo || {};
  $('usrKpis').innerHTML = [kpi('Total', num(r.total)), kpi('Ativos', num(r.ativos)), kpi('Inativos', num(r.inativos)), kpi('Admins ativos', num(r.admins_ativos))].join('');
  $('usrTbody').innerHTML = S.usuarios.map(u => `<tr><td><b>${esc(u.nome)}</b><br><span class="usr-id">${esc(u.user_id)}</span><br><small>Criado: ${esc(dt(u.created_at))}</small></td><td>${esc(u.perfil_nome || u.perfil)}</td><td><span class="badge ${u.ativo ? 'usr-ok' : 'usr-bad'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td><td>${esc(u.tecnico_nome || '-')}</td><td><div class="usr-actions"><button class="secondary" data-usr-edit="${esc(u.id)}">Editar</button><button class="${u.ativo ? 'danger' : 'primary'}" data-usr-status="${esc(u.id)}" data-usr-ativo="${u.ativo ? 'false' : 'true'}">${u.ativo ? 'Inativar' : 'Ativar'}</button></div></td></tr>`).join('') || '<tr><td colspan="5">Nenhum perfil encontrado.</td></tr>';
  document.querySelectorAll('[data-usr-edit]').forEach(btn => btn.onclick = () => editar(btn.dataset.usrEdit));
  document.querySelectorAll('[data-usr-status]').forEach(btn => btn.onclick = () => alterarStatus(btn.dataset.usrStatus, btn.dataset.usrAtivo === 'true'));
}
function renderPermissoes(perfis){
  $('usrPermissoes').innerHTML = (perfis.perfis || []).map(p => box(p.nome, p.perfil, p.descricao)).join('') + box('Regra de criação de login', 'O login/senha deve ser criado no Supabase Auth.', 'Depois copie o UUID do Auth para esta tela e salve o perfil operacional.', 'usr-warn');
}
function limparForm(){
  S.edit = null;
  $('usrProfileId').value = '';
  $('usrUserId').value = '';
  $('usrNome').value = '';
  $('usrPerfil').value = 'consulta';
  $('usrAtivo').value = 'true';
  $('usrTecnico').value = '';
  $('usrMotivo').value = '';
}
function editar(id){
  const u = S.usuarios.find(x => x.id === id);
  if(!u) return;
  S.edit = u;
  $('usrProfileId').value = u.id;
  $('usrUserId').value = u.user_id;
  $('usrNome').value = u.nome;
  $('usrPerfil').value = u.perfil;
  $('usrAtivo').value = String(!!u.ativo);
  $('usrTecnico').value = u.tecnico_nome || '';
  $('usrMotivo').value = 'Atualização de perfil operacional';
  msg('Perfil carregado para edição.', 'ok');
}
function validarUuid(v){
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || '').trim());
}
async function salvar(ev){
  ev.preventDefault();
  try{
    const ok = S.admin || await ensureAdmin();
    if(!ok) throw new Error('Acesso restrito ao administrador.');
    const userId = $('usrUserId').value.trim();
    const nome = $('usrNome').value.trim();
    const motivo = $('usrMotivo').value.trim();
    if(!validarUuid(userId)) throw new Error('Informe um User ID válido do Supabase Auth.');
    if(nome.length < 2) throw new Error('Informe nome/e-mail operacional.');
    if(motivo.length < 5) throw new Error('Informe motivo da alteração.');
    const payload = {
      p_profile_id: $('usrProfileId').value || null,
      p_user_id: userId,
      p_nome: nome,
      p_perfil: $('usrPerfil').value,
      p_tecnico_nome: $('usrTecnico').value.trim() || null,
      p_ativo: $('usrAtivo').value === 'true',
      p_motivo: motivo
    };
    if(!confirm('Confirmar alteração de perfil/permissão?')) return;
    await call('rpc_salvar_usuario_perfil_6c', payload);
    limparForm();
    await loadUsuarios();
    msg('Perfil salvo com sucesso.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
async function alterarStatus(id, ativo){
  try{
    const motivo = prompt(ativo ? 'Motivo para ativar este perfil:' : 'Motivo para inativar este perfil:')?.trim();
    if(!motivo || motivo.length < 5) return msg('Motivo obrigatório com pelo menos 5 caracteres.', 'warn');
    if(!confirm(`${ativo ? 'Ativar' : 'Inativar'} este perfil?`)) return;
    await call('rpc_alterar_status_usuario_perfil_6c', { p_profile_id:id, p_ativo:ativo, p_motivo:motivo });
    await loadUsuarios();
    msg('Status atualizado.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function boot(){
  document.addEventListener('like:session', ev => { if(ev.detail?.user) ensureAdmin(); else removeAdminUi(); });
  setTimeout(ensureAdmin, 1600);
  setTimeout(ensureAdmin, 4200);
}

boot();
window.usuariosLoad = loadAll;
window.usuariosAdminRefresh = ensureAdmin;
