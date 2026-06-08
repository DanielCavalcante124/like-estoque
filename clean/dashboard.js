import { call } from './api.js?v=3';

const S = { data: null, auditoria: null };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const num = (v) => Number(v || 0).toLocaleString('pt-BR');
const dt = (v) => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return String(v || '-'); } };
const nomeItem = (x) => [x?.tipo, x?.marca, x?.modelo].filter(Boolean).join(' ') || x?.codigo || x?.mac || x?.serial || '-';

function msg(text, type=''){
  const el = $('dashCleanMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function injectCss(){
  if($('dashAuditCss')) return;
  const s = document.createElement('style');
  s.id = 'dashAuditCss';
  s.textContent = `.dash-audit-card{border:1px solid #e5e7eb}.dash-audit-card.ok{border-color:#16a34a}.dash-audit-card.warn{border-color:#eab308}.dash-audit-card.bad{border-color:#dc2626}.dash-audit-status{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.dash-audit-kpi{border:1px solid #e5e7eb;border-radius:14px;padding:10px;background:#fff}.dash-audit-kpi small{display:block;color:#64748b;font-weight:800}.dash-audit-kpi b{font-size:20px}.dash-audit-summary{margin-top:10px}.dash-audit-summary .item{margin-bottom:8px}.dash-audit-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}@media(max-width:700px){.dash-audit-status{grid-template-columns:repeat(2,1fr)}.dash-audit-actions button{width:100%}}`;
  document.head.appendChild(s);
}

function inject(){
  injectCss();
  const sec = $('page-dashboard');
  if(!sec) return;
  sec.innerHTML = `
    <div class="card">
      <div class="table-head">
        <div>
          <h2>Dashboard operacional</h2>
          <p>Visão executiva do estoque, movimentações, alertas, itens críticos e auditoria preventiva.</p>
        </div>
        <button id="dashCleanReload" class="secondary">Atualizar dashboard</button>
      </div>
      <div id="dashCleanMsg" class="msg"></div>
    </div>

    <div class="kpis">
      <div class="kpi"><small>Equipamentos ativos</small><b id="dashKAtivos">0</b></div>
      <div class="kpi"><small>Em estoque</small><b id="dashKEstoque">0</b></div>
      <div class="kpi"><small>Com técnico</small><b id="dashKTecnico">0</b></div>
      <div class="kpi"><small>Manutenção</small><b id="dashKManutencao">0</b></div>
      <div class="kpi"><small>Aguardando baixa</small><b id="dashKBaixa">0</b></div>
      <div class="kpi"><small>Baixados/inativos</small><b id="dashKInativos">0</b></div>
    </div>

    <div class="card dash-audit-card" id="dashAuditoriaCard">
      <div class="table-head">
        <div>
          <h2>Auditoria preventiva</h2>
          <p id="dashAuditoriaTexto">Verificação automática de divergências do estoque.</p>
        </div>
        <span id="dashAuditoriaBadge" class="badge">Carregando</span>
      </div>
      <div class="dash-audit-status" id="dashAuditoriaKpis"></div>
      <div class="dash-audit-summary" id="dashAuditoriaResumo"></div>
      <div class="dash-audit-actions">
        <button id="dashAbrirAuditoria" class="secondary" type="button">Abrir Auditoria</button>
        <button id="dashAtualizarAuditoria" class="secondary" type="button">Revalidar agora</button>
      </div>
    </div>

    <div class="grid two">
      <div class="card">
        <div class="table-head"><h2>Distribuição por status</h2><span id="dashGerado" class="badge">-</span></div>
        <div id="dashStatus" class="list"></div>
      </div>
      <div class="card">
        <h2>Distribuição por local</h2>
        <div id="dashLocais" class="list"></div>
      </div>
    </div>

    <div class="grid three">
      <div class="card"><h2>Estoque abaixo do mínimo</h2><div id="dashAlertaEstoque" class="list"></div></div>
      <div class="card"><h2>Com técnico há +7 dias</h2><div id="dashAlertaTecnico" class="list"></div></div>
      <div class="card"><h2>Manutenção há +7 dias</h2><div id="dashAlertaManutencao" class="list"></div></div>
    </div>

    <div class="card">
      <h2>Atalhos operacionais</h2>
      <div class="actions" id="dashAtalhos"></div>
    </div>

    <div class="grid two">
      <div class="card"><h2>Entradas recentes</h2><div class="table-wrap"><table><thead><tr><th>Data</th><th>Código</th><th>Tipo</th><th>Destino</th></tr></thead><tbody id="dashEntradas"></tbody></table></div></div>
      <div class="card"><h2>Saídas recentes</h2><div class="table-wrap"><table><thead><tr><th>Data</th><th>Código</th><th>Técnico</th><th>Destino/OS</th></tr></thead><tbody id="dashSaidas"></tbody></table></div></div>
    </div>

    <div class="grid two">
      <div class="card"><h2>Devoluções recentes</h2><div class="table-wrap"><table><thead><tr><th>Data</th><th>Código</th><th>Condição</th><th>Destino</th></tr></thead><tbody id="dashDevolucoes"></tbody></table></div></div>
      <div class="card"><h2>Manutenção / baixas recentes</h2><div class="table-wrap"><table><thead><tr><th>Data</th><th>Código</th><th>Tipo</th><th>Status</th></tr></thead><tbody id="dashManutBaixas"></tbody></table></div></div>
    </div>`;

  $('dashCleanReload').onclick = () => load().catch(e => msg(e.message, 'bad'));
  $('dashAtualizarAuditoria').onclick = () => loadAuditoria().then(renderAuditoria).catch(e => renderAuditoriaErro(e));
  $('dashAbrirAuditoria').onclick = () => document.getElementById('navAuditoriaClean')?.click();
}

async function load(){
  msg('Carregando dashboard e auditoria preventiva...', 'warn');
  const dash = await call('rpc_dashboard_operacional', {}) || {};
  S.data = dash;
  try{
    await loadAuditoria();
  }catch(e){
    S.auditoria = { erro: e.message || String(e) };
  }
  render();
  msg('Dashboard atualizado.', 'ok');
}
async function loadAuditoria(){
  S.auditoria = await call('rpc_auditoria_divergencias_5v1', { p_gravidade:null, p_categoria:null }) || {};
  return S.auditoria;
}

function render(){
  const d = S.data || {};
  const k = d.kpis || {};
  $('dashKAtivos').textContent = num(k.ativos);
  $('dashKEstoque').textContent = num(k.em_estoque);
  $('dashKTecnico').textContent = num(k.com_tecnico);
  $('dashKManutencao').textContent = num(k.manutencao + k.garantia);
  $('dashKBaixa').textContent = num(k.aguardando_baixa);
  $('dashKInativos').textContent = num(k.baixados_inativos);
  $('dashGerado').textContent = d.generated_at ? `Atualizado ${dt(d.generated_at)}` : '-';

  renderAuditoria();
  renderStatus(d.por_status || []);
  renderLocais(d.por_local || []);
  renderAlertas(d.alertas || {});
  renderAtalhos();
  renderRecentes(d.recentes || {});
}
function auditKpi(label, value, cls=''){
  return `<div class="dash-audit-kpi ${cls}"><small>${esc(label)}</small><b>${esc(num(value))}</b></div>`;
}
function renderAuditoria(){
  const card = $('dashAuditoriaCard');
  if(!card) return;
  const a = S.auditoria || {};
  if(a.erro){ return renderAuditoriaErro(new Error(a.erro)); }
  const r = a.resumo || {};
  const total = Number(r.total || 0);
  const crit = Number(r.criticas || 0);
  const altas = Number(r.altas || 0);
  const medias = Number(r.medias || 0);
  const baixas = Number(r.baixas || 0);
  const cls = crit || altas ? 'bad' : total ? 'warn' : 'ok';
  card.className = `card dash-audit-card ${cls}`;
  $('dashAuditoriaBadge').textContent = total ? `${num(total)} divergência(s)` : 'Auditoria limpa';
  $('dashAuditoriaTexto').textContent = total
    ? 'Existem divergências que exigem análise na tela Auditoria.'
    : 'Nenhuma divergência ativa encontrada no estoque.';
  $('dashAuditoriaKpis').innerHTML = [
    auditKpi('Total', total),
    auditKpi('Críticas', crit),
    auditKpi('Altas', altas),
    auditKpi('Médias', medias),
    auditKpi('Baixas', baixas)
  ].join('');
  const cats = a.por_categoria || [];
  if(total){
    $('dashAuditoriaResumo').innerHTML = cats.slice(0,5).map(c => `
      <div class="item"><div><b>${esc(c.categoria)}</b><br><small>Categoria com divergência ativa</small></div><span class="badge">${num(c.total)}</span></div>`).join('') || '<div class="msg show warn">Divergências sem categoria retornada.</div>';
  }else{
    $('dashAuditoriaResumo').innerHTML = '<div class="msg show ok">Sistema sem divergências de auditoria no momento.</div>';
  }
}
function renderAuditoriaErro(e){
  const card = $('dashAuditoriaCard');
  if(!card) return;
  card.className = 'card dash-audit-card warn';
  $('dashAuditoriaBadge').textContent = 'Falha ao validar';
  $('dashAuditoriaTexto').textContent = 'Não foi possível consultar a auditoria preventiva.';
  $('dashAuditoriaKpis').innerHTML = auditKpi('Status', 'Erro');
  $('dashAuditoriaResumo').innerHTML = `<div class="msg show bad">${esc(e.message || String(e))}</div>`;
}
function renderStatus(rows){
  $('dashStatus').innerHTML = rows.map(r => `
    <div class="item">
      <div><b>${esc(r.status || 'Sem status')}</b><br><small>${r.ativo === false ? 'Inativo' : 'Ativo'}</small></div>
      <span class="badge">${num(r.total)}</span>
    </div>`).join('') || '<div class="msg show warn">Sem dados por status.</div>';
}
function renderLocais(rows){
  $('dashLocais').innerHTML = rows.map(r => `
    <div class="item"><b>${esc(r.local || 'Sem local')}</b><span class="badge">${num(r.total)}</span></div>`).join('') || '<div class="msg show warn">Sem dados por local.</div>';
}
function alertaItem(title, subtitle, badge='Atenção'){
  return `<div class="item"><div><b>${esc(title)}</b><br><small>${esc(subtitle || '')}</small></div><span class="badge">${esc(badge)}</span></div>`;
}
function renderAlertas(a){
  const estoque = a.estoque_abaixo_minimo || [];
  const tecnico = a.com_tecnico_mais_7_dias || [];
  const manut = a.manutencao_mais_7_dias || [];

  $('dashAlertaEstoque').innerHTML = estoque.map(x => alertaItem(nomeItem(x), `Atual: ${x.estoque_atual ?? 0} • Mínimo: ${x.minimo ?? 0}`, 'Baixo')).join('') || '<div class="msg show ok">Nenhum item abaixo do mínimo.</div>';
  $('dashAlertaTecnico').innerHTML = tecnico.map(x => alertaItem(`${x.codigo || '-'} • ${nomeItem(x)}`, `${x.tecnico || '-'} • ${x.dias || 0} dia(s)`, '+7 dias')).join('') || '<div class="msg show ok">Nenhum equipamento antigo com técnico.</div>';
  $('dashAlertaManutencao').innerHTML = manut.map(x => alertaItem(`${x.codigo || '-'} • ${nomeItem(x)}`, `${x.status || '-'} • ${x.dias || 0} dia(s)`, '+7 dias')).join('') || '<div class="msg show ok">Nenhum item antigo em manutenção.</div>';
}
function renderAtalhos(){
  const links = [
    ['Entrada','navEntradaClean'],
    ['Entrada em lote','navEntradaLoteClean'],
    ['Retorno sem cadastro','navRetornoSemCadastroClean'],
    ['Saída','navSaidaClean'],
    ['Devolução','navDevolucaoClean'],
    ['Manutenção','navManutencaoClean'],
    ['Baixa','navBaixaClean'],
    ['Histórico','navHistoricoClean'],
    ['Auditoria','navAuditoriaClean']
  ];
  $('dashAtalhos').innerHTML = links.map(([label,id]) => `<button class="secondary" type="button" data-dash-nav="${id}">${label}</button>`).join('');
  document.querySelectorAll('[data-dash-nav]').forEach(btn => {
    btn.onclick = () => document.getElementById(btn.dataset.dashNav)?.click();
  });
}
function movItem(m){ return m?.codigo || m?.mac || m?.serial || '-'; }
function renderRows(id, rows, type){
  const html = rows.map(m => {
    if(type === 'entrada') return `<tr><td>${esc(dt(m.created_at || m.data))}</td><td><b>${esc(movItem(m))}</b></td><td>${esc(m.tipo || '-')}</td><td>${esc(m.destino || '-')}</td></tr>`;
    if(type === 'saida') return `<tr><td>${esc(dt(m.created_at || m.data))}</td><td><b>${esc(movItem(m))}</b></td><td>${esc(m.tecnico || '-')}</td><td>${esc([m.destino,m.os].filter(Boolean).join(' • ') || '-')}</td></tr>`;
    if(type === 'devolucao') return `<tr><td>${esc(dt(m.created_at || m.data))}</td><td><b>${esc(movItem(m))}</b></td><td>${esc(m.condicao || m.motivo || '-')}</td><td>${esc(m.destino || '-')}</td></tr>`;
    return `<tr><td>${esc(dt(m.created_at || m.data))}</td><td><b>${esc(movItem(m))}</b></td><td>${esc(m.tipo || '-')}</td><td>${esc(m.status_final || m.destino || '-')}</td></tr>`;
  }).join('');
  $(id).innerHTML = html || '<tr><td colspan="4">Sem registros recentes.</td></tr>';
}
function renderRecentes(r){
  renderRows('dashEntradas', r.entradas || [], 'entrada');
  renderRows('dashSaidas', r.saidas || [], 'saida');
  renderRows('dashDevolucoes', r.devolucoes || [], 'devolucao');
  const mb = [...(r.manutencoes || []), ...(r.baixas || [])].sort((a,b) => new Date(b.created_at || b.data || 0) - new Date(a.created_at || a.data || 0)).slice(0,10);
  renderRows('dashManutBaixas', mb, 'default');
}

function boot(){
  inject();
  setTimeout(() => load().catch(e => msg(e.message || 'Erro ao carregar dashboard.', 'bad')), 900);
  document.querySelector('[data-page="dashboard"]')?.addEventListener('click', () => setTimeout(() => load().catch(e => msg(e.message, 'bad')), 200));
}

boot();
window.dashboardCleanLoad = load;