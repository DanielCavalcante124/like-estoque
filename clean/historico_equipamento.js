import { table, call } from './api.js?v=3';

const S = { equipamentos: [], historico: [], selecionado: null };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm = (v) => String(v || '').trim();
let bound = false;

function msg(text, type=''){
  const el = $('historicoMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeEq(e){ return [e.tipo,e.marca,e.modelo].filter(Boolean).join(' '); }
function identificacao(e){ return [e.codigo, e.patrimonio, e.mac, e.serial, nomeEq(e)].filter(Boolean).join(' • '); }
function dt(v){
  if(!v) return '-';
  try{ return new Date(v).toLocaleString('pt-BR'); }catch(e){ return String(v); }
}
function dataCurta(v){
  if(!v) return '-';
  try{ return new Date(v + 'T00:00:00').toLocaleDateString('pt-BR'); }catch(e){ return String(v); }
}

function inject(){
  if(!$('navHistoricoClean')){
    const ref = $('navBaixaClean') || $('navManutencaoClean') || $('navDevolucaoClean') || $('navSaidaClean') || document.querySelector('[data-page="cadastros"]');
    const btn = document.createElement('button');
    btn.id = 'navHistoricoClean';
    btn.className = 'nav';
    btn.textContent = 'Histórico';
    btn.onclick = showPage;
    ref ? ref.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-historico-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-historico-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Histórico completo por equipamento</h2>
            <p>Consulte a linha do tempo completa: entrada, saída, devolução, manutenção, garantia e baixa.</p>
          </div>
          <button id="historicoReload" class="secondary">Recarregar dados</button>
        </div>
        <div id="historicoMsg" class="msg"></div>
      </div>

      <div class="grid two">
        <form id="historicoForm" class="card form-card">
          <h2>Selecionar equipamento</h2>
          <input id="historicoBuscaEquipamento" placeholder="Buscar por código, patrimônio, MAC, SN, modelo, status ou local">
          <select id="historicoEquipamento"></select>
          <div class="actions">
            <button class="primary" type="submit">Carregar histórico</button>
            <button class="secondary" id="historicoLimpar" type="button">Limpar</button>
            <button class="secondary" id="historicoCsv" type="button">Copiar CSV</button>
          </div>
        </form>

        <div class="card">
          <h2>Resumo atual</h2>
          <div id="historicoResumo" class="list"></div>
          <div id="historicoRegra" class="msg show warn">Selecione um equipamento para ver a linha do tempo.</div>
        </div>
      </div>

      <div class="card">
        <div class="table-head">
          <h2>Linha do tempo</h2>
          <input id="historicoFiltro" placeholder="Filtrar movimentos por tipo, técnico, OS, motivo, destino ou status">
        </div>
        <div id="historicoTimeline" class="list"></div>
      </div>

      <div class="card">
        <h2>Tabela detalhada</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Data</th><th>Tipo</th><th>Status</th><th>Destino</th><th>Técnico</th><th>Cliente/OS</th><th>Motivo</th><th>Obs</th></tr>
            </thead>
            <tbody id="historicoTbody"></tbody>
          </table>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  if(bound) return;
  bound = true;
  $('historicoReload').onclick = () => loadHistoricoPage().catch(e=>msg(e.message,'bad'));
  $('historicoForm').onsubmit = carregarHistorico;
  $('historicoLimpar').onclick = limpar;
  $('historicoCsv').onclick = copiarCsv;
  $('historicoBuscaEquipamento').oninput = renderEquipSelect;
  $('historicoEquipamento').onchange = () => { S.selecionado = equipamentoSelecionado(); renderResumo(); };
  $('historicoFiltro').oninput = renderHistorico;
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navHistoricoClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-historico-clean'));
  const title = $('pageTitle');
  if(title) title.textContent = 'Histórico';
  loadHistoricoPage().catch(e=>msg(e.message,'bad'));
}

async function loadHistoricoPage(){
  msg('Carregando equipamentos...', 'warn');
  S.equipamentos = await table('equipamentos','created_at',false);
  renderEquipSelect();
  renderResumo();
  renderHistorico();
  msg('Histórico pronto para consulta.', 'ok');
}

function equipamentoSelecionado(){ return S.equipamentos.find(e => e.id === $('historicoEquipamento')?.value); }
function renderEquipSelect(){
  const filtro = ($('historicoBuscaEquipamento')?.value || '').toLowerCase();
  const rows = S.equipamentos.filter(e => !filtro || JSON.stringify(e).toLowerCase().includes(filtro)).slice(0,300);
  $('historicoEquipamento').innerHTML = '<option value="">Selecionar equipamento</option>' + rows.map(e=>`<option value="${e.id}">${esc(identificacao(e))}</option>`).join('');
  if(S.selecionado && rows.some(e=>e.id === S.selecionado.id)) $('historicoEquipamento').value = S.selecionado.id;
}

function renderResumo(){
  const e = equipamentoSelecionado() || S.selecionado;
  if(!e){
    $('historicoResumo').innerHTML = '<div class="item"><b>Nenhum equipamento selecionado</b><small>Busque e selecione um equipamento.</small></div>';
    $('historicoRegra').textContent = 'Selecione um equipamento para ver a linha do tempo.';
    return;
  }
  const ativo = e.ativo === false ? 'Inativo/Baixado' : 'Ativo';
  $('historicoResumo').innerHTML = `
    <div class="item"><div><b>${esc(e.codigo || '-')} • ${esc(nomeEq(e))}</b><br><small>${esc(e.mac || e.serial || e.patrimonio || 'Sem identificação')}</small></div><span class="badge">${esc(ativo)}</span></div>
    <div class="item"><div><b>Status atual</b><br><small>${esc(e.status || '-')}</small></div><span class="badge">${esc(e.local || '-')}</span></div>
    <div class="item"><div><b>Atual vinculado</b><br><small>${esc([e.tecnico_atual,e.cliente_atual,e.os_atual].filter(Boolean).join(' • ') || 'Sem vínculo atual')}</small></div></div>
    <div class="item"><div><b>Motivo atual</b><br><small>${esc(e.motivo_atual || e.motivo_baixa || '-')}</small></div></div>`;
  $('historicoRegra').textContent = 'Clique em Carregar histórico para consultar os movimentos.';
}

async function carregarHistorico(ev){
  ev.preventDefault();
  try{
    const eq = equipamentoSelecionado();
    if(!eq) throw new Error('Selecione um equipamento.');
    S.selecionado = eq;
    msg('Carregando linha do tempo via RPC...', 'warn');
    S.historico = await call('rpc_historico_equipamento', { p_equipamento_id: eq.id }) || [];
    renderResumo();
    renderHistorico();
    msg(`Histórico carregado: ${S.historico.length} movimento(s).`, 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

function movimentosFiltrados(){
  const filtro = ($('historicoFiltro')?.value || '').toLowerCase();
  return S.historico.filter(m => !filtro || JSON.stringify(m).toLowerCase().includes(filtro));
}
function renderHistorico(){
  const rows = movimentosFiltrados();
  $('historicoTimeline').innerHTML = rows.map(m=>`
    <div class="item">
      <div>
        <b>#${esc(m.seq)} • ${esc(m.tipo || '-')}</b><br>
        <small>${esc(dataCurta(m.data))} ${m.created_at ? '• ' + esc(dt(m.created_at)) : ''}</small><br>
        <small>Status: ${esc(m.status_final || '-')} • Destino: ${esc(m.destino || '-')}</small><br>
        <small>${esc([m.tecnico,m.cliente,m.os].filter(Boolean).join(' • ') || 'Sem técnico/cliente/OS')}</small><br>
        <small>${esc([m.motivo,m.condicao,m.obs].filter(Boolean).join(' • ') || 'Sem detalhe')}</small>
      </div>
      <span class="badge">${esc(m.origem || m.responsavel || '-')}</span>
    </div>`).join('') || '<div class="item"><b>Nenhum movimento encontrado</b><small>Carregue um equipamento ou ajuste o filtro.</small></div>';

  $('historicoTbody').innerHTML = rows.map(m=>`
    <tr>
      <td>${esc(m.seq)}</td>
      <td>${esc(dataCurta(m.data))}</td>
      <td><b>${esc(m.tipo || '-')}</b></td>
      <td><span class="badge">${esc(m.status_final || '-')}</span></td>
      <td>${esc(m.destino || '-')}</td>
      <td>${esc(m.tecnico || '-')}</td>
      <td>${esc([m.cliente,m.os].filter(Boolean).join(' • ') || '-')}</td>
      <td>${esc([m.motivo,m.condicao].filter(Boolean).join(' • ') || '-')}</td>
      <td>${esc(m.obs || '-')}</td>
    </tr>`).join('') || '<tr><td colspan="9">Nenhum movimento encontrado.</td></tr>';
}

async function copiarCsv(){
  try{
    if(!S.historico.length) throw new Error('Carregue um histórico antes de copiar CSV.');
    const cols = ['seq','data','created_at','tipo','codigo','mac','serial','status_final','destino','tecnico','cliente','os','motivo','condicao','obs','responsavel','fornecedor','nf','origem'];
    const csv = [cols.join(';')].concat(S.historico.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g,'""')}"`).join(';'))).join('\n');
    await navigator.clipboard.writeText(csv);
    msg('CSV copiado para a área de transferência.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function limpar(){
  ['historicoBuscaEquipamento','historicoEquipamento','historicoFiltro'].forEach(id=>{ if($(id)) $(id).value=''; });
  S.selecionado = null;
  S.historico = [];
  renderEquipSelect();
  renderResumo();
  renderHistorico();
  msg('Consulta limpa.', 'ok');
}

inject();
window.historicoCleanLoad = loadHistoricoPage;
