import { call } from './api.js?v=3';

const S = { data: null };
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

function inject(){
  const sec = $('page-dashboard');
  if(!sec) return;
  sec.innerHTML = `
    <div class="card">
      <div class="table-head">
        <div>
          <h2>Dashboard operacional</h2>
          <p>Visão executiva do estoque, movimentações, alertas e itens críticos.</p>
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
}

async function load(){
  msg('Carregando dashboard via RPC...', 'warn');
  S.data = await call('rpc_dashboard_operacional', {}) || {};
  render();
  msg('Dashboard atualizado.', 'ok');
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

  renderStatus(d.por_status || []);
  renderLocais(d.por_local || []);
  renderAlertas(d.alertas || {});
  renderAtalhos();
  renderRecentes(d.recentes || {});
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
    ['Histórico','navHistoricoClean']
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
