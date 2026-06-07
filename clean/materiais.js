import { table, call } from './api.js';

const S = { modelos: [], tecnicos: [], saldos: [], movimentos: [], filtro: '' };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const qtd = (v) => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
const opId = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
const ativo = (r) => r && r.ativo !== false;

function msg(text, type=''){
  const el = $('matCleanMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}

function materialNome(m){ return [m.tipo, m.marca, m.modelo].filter(Boolean).join(' '); }
function isMaterial(m){
  const c = String(m.categoria_estoque || m.categoria || m.controle || '').toLowerCase();
  const t = materialNome(m).toLowerCase();
  if(c.includes('consumo') || c.includes('material') || c.includes('fechado') || c.includes('quant')) return true;
  return /(rj45|rj 45|conector|cabo|drop|bobina|fibra|cordao|cordão|patch|pigtail|fita|parafuso|bucha|abraçadeira|abracadeira)/.test(t);
}
function materiaisAtivos(){ return S.modelos.filter(ativo).filter(isMaterial); }

function inject(){
  if(!$('navMateriaisClean')){
    const eq = document.getElementById('navEquipamentosClean') || document.querySelector('[data-page="cadastros"]');
    const btn = document.createElement('button');
    btn.id = 'navMateriaisClean';
    btn.className = 'nav';
    btn.dataset.page = 'materiais-clean';
    btn.textContent = 'Materiais';
    btn.onclick = showPage;
    eq ? eq.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-materiais-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-materiais-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Materiais</h2>
            <p>Versão limpa. Entrada, saída para técnico e baixa por uso passam por RPC.</p>
          </div>
          <button id="matCleanReload" class="secondary">Recarregar materiais</button>
        </div>
        <div id="matCleanMsg" class="msg"></div>
      </div>

      <div class="kpis">
        <div class="kpi"><small>Materiais cadastrados</small><b id="matKProdutos">0</b></div>
        <div class="kpi"><small>Linhas de saldo</small><b id="matKSaldos">0</b></div>
        <div class="kpi"><small>Quantidade total</small><b id="matKQtd">0</b></div>
        <div class="kpi"><small>Com técnicos</small><b id="matKTecnicos">0</b></div>
      </div>

      <div class="grid three">
        <form id="matFormEntrada" class="card form-card">
          <h2>Entrada de material</h2>
          <select id="matEntradaProduto"></select>
          <input id="matEntradaQtd" type="number" min="0.001" step="0.001" placeholder="Quantidade">
          <input id="matEntradaObs" placeholder="Observação">
          <button class="primary" type="submit">Registrar entrada</button>
        </form>

        <form id="matFormSaida" class="card form-card">
          <h2>Saída para técnico</h2>
          <select id="matSaidaProduto"></select>
          <select id="matSaidaTecnico"></select>
          <input id="matSaidaQtd" type="number" min="0.001" step="0.001" placeholder="Quantidade">
          <input id="matSaidaObs" placeholder="Observação">
          <button class="primary" type="submit">Enviar para técnico</button>
        </form>

        <form id="matFormConsumo" class="card form-card">
          <h2>Baixa por uso</h2>
          <select id="matConsumoProduto"></select>
          <select id="matConsumoTecnico"></select>
          <input id="matConsumoQtd" type="number" min="0.001" step="0.001" placeholder="Quantidade usada">
          <input id="matConsumoObs" placeholder="Observação / OS">
          <button class="danger" type="submit">Baixar uso</button>
        </form>
      </div>

      <div class="card">
        <div class="table-head">
          <h2>Saldos de materiais</h2>
          <input id="matCleanBusca" placeholder="Buscar material, técnico ou local">
        </div>
        <div class="table-wrap"><table><thead><tr><th>Categoria</th><th>Material</th><th>Unidade</th><th>Local</th><th>Técnico</th><th>Quantidade</th></tr></thead><tbody id="matSaldoTbody"></tbody></table></div>
      </div>

      <div class="card">
        <h2>Histórico recente</h2>
        <div class="table-wrap"><table><thead><tr><th>Data</th><th>Material</th><th>Qtd</th><th>Origem</th><th>Destino</th><th>Técnico</th><th>Motivo/Obs</th></tr></thead><tbody id="matMovTbody"></tbody></table></div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  $('matCleanReload').onclick = () => loadMateriais().catch((e)=>msg(e.message,'bad'));
  $('matCleanBusca').oninput = () => { S.filtro = $('matCleanBusca').value || ''; renderMateriais(); };
  $('matFormEntrada').onsubmit = entradaMaterial;
  $('matFormSaida').onsubmit = saidaMaterial;
  $('matFormConsumo').onsubmit = consumoMaterial;
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach((b)=>b.classList.toggle('active', b.id === 'navMateriaisClean'));
  document.querySelectorAll('.page').forEach((p)=>p.classList.toggle('active', p.id === 'page-materiais-clean'));
  const title = $('pageTitle');
  if(title) title.textContent = 'Materiais';
  loadMateriais().catch((e)=>msg(e.message,'bad'));
}

async function loadMateriais(){
  msg('Carregando materiais...', 'warn');
  S.modelos = await table('modelos','tipo',true);
  S.tecnicos = await table('tecnicos','nome',true);
  S.saldos = await table('materiais_saldos','tipo',true);
  S.movimentos = await table('materiais_movimentos','created_at',false);
  renderMateriais();
  msg('Materiais carregados.', 'ok');
}

function fillSelects(){
  const mats = materiaisAtivos();
  const opts = '<option value="">Selecione material</option>' + mats.map((m)=>`<option value="${m.id}">${esc(materialNome(m))} • ${esc(m.categoria_estoque || m.categoria || '')}</option>`).join('');
  ['matEntradaProduto','matSaidaProduto','matConsumoProduto'].forEach((id)=>{ const el=$(id); if(el) el.innerHTML = opts; });
  const tecs = S.tecnicos.filter(ativo);
  const tOpts = '<option value="">Selecione técnico</option>' + tecs.map((t)=>`<option value="${esc(t.nome)}">${esc(t.nome)}</option>`).join('');
  ['matSaidaTecnico','matConsumoTecnico'].forEach((id)=>{ const el=$(id); if(el) el.innerHTML = tOpts; });
}

function renderMateriais(){
  fillSelects();
  const saldos = S.saldos || [];
  const filtro = (S.filtro || '').toLowerCase();
  const filtrados = saldos.filter((s)=>!filtro || JSON.stringify(s).toLowerCase().includes(filtro));
  $('matKProdutos').textContent = materiaisAtivos().length;
  $('matKSaldos').textContent = saldos.length;
  $('matKQtd').textContent = qtd(saldos.reduce((a,s)=>a + Number(s.quantidade || 0), 0));
  $('matKTecnicos').textContent = saldos.filter((s)=>s.tecnico && Number(s.quantidade || 0) > 0).length;
  $('matSaldoTbody').innerHTML = filtrados.map((s)=>`
    <tr>
      <td>${esc(s.categoria || '')}</td>
      <td>${esc(materialNome(s))}</td>
      <td>${esc(s.unidade_saida || '')}</td>
      <td>${esc(s.local || '-')}</td>
      <td>${esc(s.tecnico || '-')}</td>
      <td><b>${qtd(s.quantidade)}</b></td>
    </tr>`).join('') || '<tr><td colspan="6">Nenhum saldo encontrado.</td></tr>';
  $('matMovTbody').innerHTML = (S.movimentos || []).slice(0,80).map((m)=>`
    <tr>
      <td>${esc(new Date(m.created_at || m.data || '').toLocaleString('pt-BR'))}</td>
      <td>${esc(materialNome(m))}</td>
      <td>${qtd(m.quantidade)}</td>
      <td>${esc(m.origem || '-')}</td>
      <td>${esc(m.destino || '-')}</td>
      <td>${esc(m.tecnico || '-')}</td>
      <td>${esc([m.motivo,m.obs].filter(Boolean).join(' • '))}</td>
    </tr>`).join('') || '<tr><td colspan="7">Sem histórico de materiais.</td></tr>';
}

function getQtd(id){
  const n = Number($(id).value || 0);
  if(!Number.isFinite(n) || n <= 0) throw new Error('Informe uma quantidade maior que zero.');
  return n;
}
function requireSelect(id, label){
  const v = $(id).value;
  if(!v) throw new Error('Selecione ' + label + '.');
  return v;
}
function clearEntrada(){ $('matEntradaQtd').value=''; $('matEntradaObs').value=''; }
function clearSaida(){ $('matSaidaQtd').value=''; $('matSaidaObs').value=''; }
function clearConsumo(){ $('matConsumoQtd').value=''; $('matConsumoObs').value=''; }

async function entradaMaterial(ev){
  ev.preventDefault();
  const modeloId = requireSelect('matEntradaProduto','o material');
  const quantidade = getQtd('matEntradaQtd');
  const obs = $('matEntradaObs').value.trim();
  msg('Registrando entrada via RPC...', 'warn');
  await call('rpc_entrada_material', { p_modelo_id:modeloId, p_quantidade:quantidade, p_observacao:obs, p_client_operation_id:opId() });
  clearEntrada();
  await loadMateriais();
  msg('Entrada de material registrada.', 'ok');
}

async function saidaMaterial(ev){
  ev.preventDefault();
  const modeloId = requireSelect('matSaidaProduto','o material');
  const tecnico = requireSelect('matSaidaTecnico','o técnico');
  const quantidade = getQtd('matSaidaQtd');
  const obs = $('matSaidaObs').value.trim();
  msg('Registrando saída para técnico via RPC...', 'warn');
  await call('rpc_saida_material_tecnico', { p_modelo_id:modeloId, p_quantidade:quantidade, p_tecnico:tecnico, p_observacao:obs, p_client_operation_id:opId() });
  clearSaida();
  await loadMateriais();
  msg('Saída para técnico registrada.', 'ok');
}

async function consumoMaterial(ev){
  ev.preventDefault();
  const modeloId = requireSelect('matConsumoProduto','o material');
  const tecnico = requireSelect('matConsumoTecnico','o técnico');
  const quantidade = getQtd('matConsumoQtd');
  const obs = $('matConsumoObs').value.trim();
  msg('Registrando baixa por uso via RPC...', 'warn');
  await call('rpc_consumo_material_tecnico', { p_modelo_id:modeloId, p_quantidade:quantidade, p_tecnico:tecnico, p_observacao:obs, p_client_operation_id:opId() });
  clearConsumo();
  await loadMateriais();
  msg('Baixa por uso registrada.', 'ok');
}

inject();
window.materiaisCleanLoad = loadMateriais;
