import { call } from './api.js?v=3';

const S = { admin:false, matriz:null, historico:[], selecionado:null };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const dt = v => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return String(v || '-'); } };
const num = v => Number(v || 0).toLocaleString('pt-BR');
const PERM_LABELS = {
  gerenciar_usuarios:'Usuários', painel_producao:'Produção', backup:'Backup', relatorios:'Relatórios', auditoria:'Auditoria', fechamento:'Fechamento', operacao_estoque:'Operação', cadastros:'Cadastros', materiais:'Materiais', equipamentos:'Equipamentos', baixa:'Baixa', manutencao:'Manutenção', consulta:'Consulta'
};
function msg(text,type=''){
  const el = $('tpfMsg');
  if(el){ el.textContent = text; el.className = 'msg show ' + type; }
}
function css(){
  if($('tpfCss')) return;
  const s = document.createElement('style');
  s.id = 'tpfCss';
  s.textContent = `.tpf-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.tpf-kpi{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:12px}.tpf-kpi small{display:block;color:#64748b;font-weight:800}.tpf-kpi b{font-size:21px}.tpf-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.tpf-actions{display:flex;gap:8px;flex-wrap:wrap}.tpf-box{border:1px solid #e5e7eb;border-radius:14px;background:#fff;padding:10px;margin-bottom:8px}.tpf-box b{display:block}.tpf-box small{color:#64748b}.tpf-ok{border-color:#16a34a;background:#f0fdf4}.tpf-bad{border-color:#dc2626;background:#fff7f7}.tpf-warn{border-color:#eab308;background:#fffbeb}.tpf-pill{display:inline-flex;margin:2px;padding:3px 7px;border-radius:999px;font-size:12px;border:1px solid #e5e7eb}.tpf-allow{background:#dcfce7;color:#166534}.tpf-deny{background:#fee2e2;color:#991b1b}.tpf-user{cursor:pointer}.tpf-user:hover{outline:2px solid #dbeafe}@media(max-width:1000px){.tpf-grid{grid-template-columns:1fr}.tpf-kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.tpf-actions button{width:100%}.tpf-kpis{grid-template-columns:1fr}}`;
  document.head.appendChild(s);
}
function removeAdminUi(){
  const nav = $('navTestePerfisClean');
  const page = $('page-teste-perfis-clean');
  const active = nav?.classList.contains('active') || page?.classList.contains('active');
  if(nav) nav.remove();
  if(page) page.remove();
  if(active) document.querySelector('[data-page="dashboard"]')?.click();
}
async function ensureAdmin(){
  try{
    const ctx = await call('rpc_usuario_contexto_6c', {});
    S.admin = !!ctx?.is_admin;
    if(S.admin) inject(); else removeAdminUi();
    return S.admin;
  }catch(e){ S.admin=false; removeAdminUi(); return false; }
}
function inject(){
  css();
  if(!$('navTestePerfisClean')){
    const ref = $('navUsuariosClean') || $('navBackupClean') || $('navProducaoClean') || document.querySelector('[data-page="cadastros"]');
    const b = document.createElement('button');
    b.id = 'navTestePerfisClean';
    b.className = 'nav';
    b.textContent = 'Teste perfis';
    b.onclick = show;
    ref ? ref.insertAdjacentElement('afterend', b) : document.querySelector('.sidebar')?.appendChild(b);
  }
  if(!$('page-teste-perfis-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-teste-perfis-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head"><div><h2>Testes reais por perfil</h2><p>Validação formal dos logins, menus e bloqueios operacionais por perfil.</p></div><button id="tpfReload" class="secondary">Revalidar matriz</button></div>
        <div class="tpf-actions"><button id="tpfRegistrar" class="primary">Registrar teste selecionado</button><button id="tpfWhats" class="secondary">Copiar resumo WhatsApp</button><button id="tpfPdf" class="secondary">Baixar PDF</button></div>
        <div id="tpfMsg" class="msg show">Carregue a matriz e selecione um usuário para registrar o teste real.</div>
      </div>
      <div id="tpfKpis" class="tpf-kpis"></div>
      <div class="tpf-grid">
        <div class="card"><h2>Usuários e matriz automática</h2><div id="tpfUsuarios"></div></div>
        <div class="card"><h2>Checklist do teste real</h2><div id="tpfChecklist"></div></div>
      </div>
      <div class="card"><h2>Histórico de testes registrados</h2><div class="table-wrap"><table><thead><tr><th>Data</th><th>Perfil</th><th>E-mail</th><th>Resultado</th><th>Observação</th></tr></thead><tbody id="tpfHistorico"></tbody></table></div></div>`;
    document.querySelector('.main')?.appendChild(sec);
  }
  $('tpfReload').onclick = loadAll;
  $('tpfRegistrar').onclick = registrar;
  $('tpfWhats').onclick = copiarWhats;
  $('tpfPdf').onclick = gerarPdf;
}
async function show(){
  const ok = S.admin || await ensureAdmin();
  if(!ok){ alert('Acesso restrito ao administrador.'); return; }
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navTestePerfisClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-teste-perfis-clean'));
  if($('pageTitle')) $('pageTitle').textContent = 'Teste perfis';
  loadAll().catch(e => msg(e.message || String(e), 'bad'));
}
async function loadAll(){
  const ok = S.admin || await ensureAdmin();
  if(!ok) return;
  msg('Validando matriz de permissões...', 'warn');
  S.matriz = await call('rpc_validar_matriz_perfis_6e', {});
  const h = await call('rpc_listar_testes_perfis_6e', { p_limite:50 });
  S.historico = h.testes || [];
  render();
  msg(S.matriz?.ok ? 'Matriz automática aprovada. Faça o teste visual real por login.' : 'Matriz com divergência. Corrija antes de testar manualmente.', S.matriz?.ok ? 'ok' : 'bad');
}
function kpi(label,value){ return `<div class="tpf-kpi"><small>${esc(label)}</small><b>${esc(value)}</b></div>`; }
function box(title,body,small='',cls=''){
  return `<div class="tpf-box ${cls}"><b>${esc(title)}</b><small>${esc(body || '')}${small ? '<br>'+esc(small) : ''}</small></div>`;
}
function render(){
  const r = S.matriz?.resumo || {};
  const usuarios = S.matriz?.usuarios || [];
  $('tpfKpis').innerHTML = [
    kpi('Usuários ativos', num(r.usuarios_ativos)),
    kpi('Divergências', num(r.com_divergencia)),
    kpi('Status matriz', S.matriz?.ok ? 'OK' : 'Falha'),
    kpi('Testes salvos', num(S.historico.length))
  ].join('');
  $('tpfUsuarios').innerHTML = usuarios.map(u => renderUsuario(u)).join('') || '<div class="msg show warn">Nenhum usuário ativo encontrado.</div>';
  document.querySelectorAll('[data-tpf-user]').forEach(btn => btn.onclick = () => selecionar(btn.dataset.tpfUser));
  renderChecklist();
  renderHistorico();
}
function renderUsuario(u){
  const allow = Object.entries(u.atual || {}).filter(([k,v]) => v).map(([k]) => `<span class="tpf-pill tpf-allow">${esc(PERM_LABELS[k] || k)}</span>`).join('');
  const deny = Object.entries(u.atual || {}).filter(([k,v]) => !v).map(([k]) => `<span class="tpf-pill tpf-deny">${esc(PERM_LABELS[k] || k)}</span>`).join('');
  return `<div class="tpf-box tpf-user ${u.ok ? 'tpf-ok' : 'tpf-bad'}" data-tpf-user="${esc(u.user_id)}"><b>${esc(u.email)} • ${esc(u.perfil)}</b><small>${u.ok ? 'Matriz automática OK' : 'Divergência na matriz'}${u.tecnico_nome ? '<br>Técnico: '+esc(u.tecnico_nome) : ''}</small><div>${allow}</div><div>${deny}</div></div>`;
}
function selecionar(userId){
  S.selecionado = (S.matriz?.usuarios || []).find(u => u.user_id === userId);
  renderChecklist();
  msg(`Selecionado: ${S.selecionado?.email || '-'}`, 'ok');
}
function renderChecklist(){
  const u = S.selecionado;
  if(!u){
    $('tpfChecklist').innerHTML = '<div class="msg show warn">Selecione um usuário na lista para registrar o teste real.</div>';
    return;
  }
  const allowed = Object.entries(u.atual || {}).filter(([k,v]) => v).map(([k]) => PERM_LABELS[k] || k).join(', ');
  const denied = Object.entries(u.atual || {}).filter(([k,v]) => !v).map(([k]) => PERM_LABELS[k] || k).join(', ');
  $('tpfChecklist').innerHTML = `
    ${box('Usuário selecionado', `${u.email} • ${u.perfil}`, u.tecnico_nome ? `Técnico: ${u.tecnico_nome}` : '')}
    ${box('Deve aparecer', allowed || '-', 'Confirme no navegador com este login.', 'tpf-ok')}
    ${box('Não deve aparecer', denied || '-', 'Confirme que os menus/ações ficam ocultos ou bloqueados.', 'tpf-warn')}
    <label>Resultado do teste real</label><select id="tpfResultado"><option>Aprovado</option><option>Reprovado</option><option>Pendente</option></select>
    <label>Observação</label><input id="tpfObs" placeholder="Ex: login OK, menus corretos, baixa bloqueada">
    <div class="msg show">Teste mínimo: login, menus visíveis, menus proibidos, tentativa de ação bloqueada.</div>`;
}
function renderHistorico(){
  $('tpfHistorico').innerHTML = S.historico.map(t => `<tr><td>${esc(dt(t.testado_em))}</td><td>${esc(t.perfil)}</td><td>${esc(t.email || '-')}</td><td>${esc(t.resultado)}</td><td>${esc(t.observacao || '-')}</td></tr>`).join('') || '<tr><td colspan="5">Nenhum teste registrado.</td></tr>';
}
async function registrar(){
  try{
    if(!S.selecionado) throw new Error('Selecione um usuário/perfil para registrar o teste.');
    const resultado = $('tpfResultado')?.value || 'Pendente';
    const obs = ($('tpfObs')?.value || '').trim();
    if(obs.length < 8) throw new Error('Informe uma observação objetiva do teste real.');
    const checklist = {
      matriz_automatica_ok: !!S.selecionado.ok,
      login_real_testado: true,
      menus_permitidos_conferidos: true,
      menus_bloqueados_conferidos: true,
      bloqueio_operacional_conferido: resultado === 'Aprovado'
    };
    await call('rpc_registrar_teste_perfil_6e', {
      p_perfil:S.selecionado.perfil,
      p_user_id:S.selecionado.user_id,
      p_email:S.selecionado.email,
      p_resultado:resultado,
      p_observacao:obs,
      p_checklist:checklist
    });
    await loadAll();
    msg('Teste real registrado.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function resumoWhats(){
  const r = S.matriz?.resumo || {};
  return [`🧪 TESTE DE PERFIS - LIKE ESTOQUE`, `Status matriz: ${S.matriz?.ok ? 'OK' : 'Divergência'}`, `Usuários ativos: ${r.usuarios_ativos || 0}`, `Divergências: ${r.com_divergencia || 0}`, `Testes registrados: ${S.historico.length}`, '', ...(S.matriz?.usuarios || []).map(u => `${u.perfil}: ${u.email} - ${u.ok ? 'OK' : 'DIVERGÊNCIA'}`)].join('\n');
}
async function copiarWhats(){
  try{ await navigator.clipboard.writeText(resumoWhats()); msg('Resumo copiado.', 'ok'); }
  catch(e){ window.prompt('Copie o resumo:', resumoWhats()); }
}
function pdfText(doc,text,x,y,w=180,lh=5){ const lines = doc.splitTextToSize(String(text ?? '-'),w); lines.forEach(line=>{ if(y>280){ doc.addPage(); y=16; } doc.text(line,x,y); y+=lh; }); return y; }
function gerarPdf(){
  if(!window.jspdf?.jsPDF) return msg('jsPDF não carregou.', 'bad');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:'portrait', unit:'mm', format:'a4'});
  let y=18;
  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text('LIKE Estoque',14,y); y+=9;
  doc.setFontSize(14); doc.text('6E - Testes reais por perfil',14,y); y+=8;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y = pdfText(doc, `Status matriz: ${S.matriz?.ok ? 'OK' : 'Divergência'} | Gerado em: ${dt(S.matriz?.gerado_em)}`,14,y);
  y+=4;
  (S.matriz?.usuarios || []).forEach(u => {
    y = pdfText(doc, `${u.perfil} • ${u.email} • matriz: ${u.ok ? 'OK' : 'DIVERGÊNCIA'}`,14,y);
  });
  y+=5;
  y = pdfText(doc, `Testes registrados: ${S.historico.length}`,14,y);
  S.historico.slice(0,20).forEach(t => { y = pdfText(doc, `${dt(t.testado_em)} • ${t.perfil} • ${t.email || '-'} • ${t.resultado} • ${t.observacao || '-'}`,14,y,180); });
  y+=10; doc.setDrawColor(120); doc.line(24,y,92,y); doc.line(118,y,186,y); y+=5;
  doc.text('Responsável pelo teste',36,y); doc.text('Gestor / Conferência',137,y);
  doc.save('teste_perfis_6e.pdf');
}
function boot(){
  document.addEventListener('like:session', ev => { if(ev.detail?.user) ensureAdmin(); else removeAdminUi(); });
  setTimeout(ensureAdmin, 1800);
  setTimeout(ensureAdmin, 4300);
}

boot();
window.testePerfisLoad = loadAll;
