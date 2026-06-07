import { table } from './api.js?v=3';

const S = { equipamentos: [], tecnicos: [], locais: [], filtro: '' };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const br = (v) => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const norm = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const st = (e) => norm(e?.status);
const isOne = (e, arr) => arr.includes(st(e));
const isBaixado = (e) => e?.ativo === false || isOne(e, ['baixado','inutilizado','perdido']);
const isAtivo = (e) => e && !isBaixado(e);
const isEstoque = (e) => isAtivo(e) && isOne(e, ['em estoque']);
const isTecnico = (e) => isAtivo(e) && isOne(e, ['com tecnico']);
const isCliente = (e) => isAtivo(e) && isOne(e, ['instalado cliente','instalado no cliente','na rua','reservado']);
const isManutencao = (e) => isAtivo(e) && (isOne(e, ['manutencao','em manutencao','defeituoso','testar']) || norm(e.local).includes('manutencao'));
const isGarantia = (e) => isAtivo(e) && (isOne(e, ['garantia']) || norm(e.local).includes('garantia'));
const isAguardandoBaixa = (e) => isAtivo(e) && isOne(e, ['aguardando baixa','descarte autorizado']);

const FLUXOS = {
  saida: { nav:'navSaidaClean', load:'saidaCleanLoad', select:'saidaEquipamento', label:'Saída' },
  devolucao: { nav:'navDevolucaoClean', load:'devolucaoCleanLoad', select:'devolucaoEquipamento', label:'Devolução' },
  manutencao: { nav:'navManutencaoClean', load:'manutencaoCleanLoad', select:'manutencaoEquipamento', label:'Manutenção' },
  baixa: { nav:'navBaixaClean', load:'baixaCleanLoad', select:'baixaEquipamento', label:'Baixa' },
  historico: { nav:'navHistoricoClean', load:'historicoCleanLoad', select:'historicoEquipamento', form:'historicoForm', label:'Histórico' }
};

function msg(text, type=''){
  const el = $('eqCleanMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeEq(e){ return [e.tipo,e.marca,e.modelo].filter(Boolean).join(' '); }
function getEq(id){
  const e = S.equipamentos.find(x=>x.id===id);
  if(!e) throw new Error('Equipamento não encontrado na lista carregada.');
  return e;
}

function inject(){
  if(!$('navEquipamentosClean')){
    const cad = document.querySelector('[data-page="cadastros"]');
    const btn = document.createElement('button');
    btn.id = 'navEquipamentosClean';
    btn.className = 'nav';
    btn.dataset.page = 'equipamentos-clean';
    btn.textContent = 'Equipamentos';
    btn.onclick = showPage;
    cad ? cad.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-equipamentos-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-equipamentos-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Equipamentos</h2>
            <p>Consulta central. Movimentações devem ser feitas nas telas padronizadas de Saída, Devolução, Manutenção, Baixa e Histórico.</p>
          </div>
          <button id="eqCleanReload" class="secondary">Recarregar equipamentos</button>
        </div>
        <div class="form-grid two">
          <input id="eqCleanBusca" placeholder="Buscar por código, MAC, SN, modelo, técnico, cliente ou status">
          <select id="eqCleanStatus">
            <option value="ativos">Somente ativos</option>
            <option value="todos">Todos</option>
            <option value="estoque">Em estoque</option>
            <option value="tecnico">Com técnico</option>
            <option value="cliente">Cliente/rua/reservado</option>
            <option value="manutencao">Manutenção/teste</option>
            <option value="garantia">Garantia</option>
            <option value="aguardando_baixa">Aguardando baixa</option>
            <option value="baixados">Baixados/inativos</option>
          </select>
        </div>
        <div id="eqCleanMsg" class="msg"></div>
      </div>
      <div class="kpis">
        <div class="kpi"><small>Total carregado</small><b id="eqKTotal">0</b></div>
        <div class="kpi"><small>Ativos</small><b id="eqKAtivos">0</b></div>
        <div class="kpi"><small>Em estoque</small><b id="eqKEstoque">0</b></div>
        <div class="kpi"><small>Com técnico</small><b id="eqKTecnico">0</b></div>
        <div class="kpi"><small>Manutenção/Garantia</small><b id="eqKManutencao">0</b></div>
        <div class="kpi"><small>Aguardando baixa</small><b id="eqKAguardandoBaixa">0</b></div>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Equipamento</th><th>MAC/SN</th><th>Status</th><th>Local</th><th>Técnico</th><th>Cliente/OS</th><th>Custo</th><th>Ações</th></tr></thead>
            <tbody id="eqCleanTbody"></tbody>
          </table>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  $('eqCleanReload').onclick = () => loadEquipamentos().catch((e)=>msg(e.message,'bad'));
  $('eqCleanBusca').oninput = () => { S.filtro = $('eqCleanBusca').value || ''; renderEquipamentos(); };
  $('eqCleanStatus').onchange = renderEquipamentos;
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach((b)=>b.classList.toggle('active', b.id === 'navEquipamentosClean'));
  document.querySelectorAll('.page').forEach((p)=>p.classList.toggle('active', p.id === 'page-equipamentos-clean'));
  const title = $('pageTitle');
  if(title) title.textContent = 'Equipamentos';
  loadEquipamentos().catch((e)=>msg(e.message,'bad'));
}

async function loadEquipamentos(){
  msg('Carregando equipamentos...', 'warn');
  S.equipamentos = await table('equipamentos','created_at',false);
  S.tecnicos = await table('tecnicos','nome',true);
  S.locais = await table('locais','nome',true);
  renderEquipamentos();
  msg('Equipamentos carregados.', 'ok');
}

function passaStatus(e){
  const f = $('eqCleanStatus') ? $('eqCleanStatus').value : 'ativos';
  if(f === 'todos') return true;
  if(f === 'ativos') return isAtivo(e);
  if(f === 'estoque') return isEstoque(e);
  if(f === 'tecnico') return isTecnico(e);
  if(f === 'cliente') return isCliente(e);
  if(f === 'manutencao') return isManutencao(e);
  if(f === 'garantia') return isGarantia(e);
  if(f === 'aguardando_baixa') return isAguardandoBaixa(e);
  if(f === 'baixados') return isBaixado(e);
  return true;
}

function listaFiltrada(){
  const f = (S.filtro || '').toLowerCase();
  return S.equipamentos
    .filter(passaStatus)
    .filter((e)=>!f || JSON.stringify(e).toLowerCase().includes(f));
}

function renderAcoes(e){
  const id = esc(e.id);
  const historico = `<button class="secondary" data-open-historico-eq="${id}">Histórico</button>`;
  if(!isAtivo(e)) return `${historico}<span class="badge">Inativo</span>`;
  return `
    ${historico}
    <button class="warn" data-open-saida-eq="${id}">Saída</button>
    <button class="secondary" data-open-devolucao-eq="${id}">Devolução</button>
    <button class="secondary" data-open-manutencao-eq="${id}">Manutenção</button>
    <button class="danger" data-open-baixa-eq="${id}">Baixa</button>`;
}

function renderEquipamentos(){
  const rows = listaFiltrada();
  const ativos = S.equipamentos.filter(isAtivo);
  $('eqKTotal').textContent = S.equipamentos.length;
  $('eqKAtivos').textContent = ativos.length;
  $('eqKEstoque').textContent = ativos.filter(isEstoque).length;
  $('eqKTecnico').textContent = ativos.filter(isTecnico).length;
  $('eqKManutencao').textContent = ativos.filter(e=>isManutencao(e) || isGarantia(e)).length;
  $('eqKAguardandoBaixa').textContent = ativos.filter(isAguardandoBaixa).length;
  $('eqCleanTbody').innerHTML = rows.map((e)=>`
    <tr>
      <td><b>${esc(e.codigo)}</b><br><small>${esc(e.patrimonio || '')}</small></td>
      <td>${esc(nomeEq(e))}</td>
      <td>${esc(e.mac || e.serial || '-')}</td>
      <td><span class="badge">${esc(e.status)}</span></td>
      <td>${esc(e.local || '-')}</td>
      <td>${esc(e.tecnico_atual || '-')}</td>
      <td>${esc(e.cliente_atual || '-')}<br><small>${esc(e.os_atual || '')}</small></td>
      <td>${br(e.custo)}</td>
      <td><div class="actions">${renderAcoes(e)}</div></td>
    </tr>`).join('') || '<tr><td colspan="9">Nenhum equipamento encontrado.</td></tr>';
}

async function abrirFluxo(tipo, id){
  const eq = getEq(id);
  const f = FLUXOS[tipo];
  if(!f) throw new Error('Fluxo inválido.');
  const nav = $(f.nav);
  if(!nav) throw new Error(`Tela ${f.label} não encontrada. Recarregue a página.`);

  msg(`Abrindo ${f.label} para ${eq.codigo || eq.mac || eq.serial || 'equipamento'}...`, 'warn');
  nav.click();
  await sleep(250);
  if(typeof window[f.load] === 'function') await window[f.load]();
  await sleep(50);

  const select = $(f.select);
  if(!select) throw new Error(`Campo de seleção da tela ${f.label} não encontrado.`);
  select.value = id;
  select.dispatchEvent(new Event('change', { bubbles:true }));

  if(f.form){
    await sleep(50);
    $(f.form)?.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
  }
}

document.addEventListener('click', async (ev)=>{
  const btn = ev.target.closest('button');
  if(!btn) return;
  try{
    if(btn.dataset.openSaidaEq) await abrirFluxo('saida', btn.dataset.openSaidaEq);
    if(btn.dataset.openDevolucaoEq) await abrirFluxo('devolucao', btn.dataset.openDevolucaoEq);
    if(btn.dataset.openManutencaoEq) await abrirFluxo('manutencao', btn.dataset.openManutencaoEq);
    if(btn.dataset.openBaixaEq) await abrirFluxo('baixa', btn.dataset.openBaixaEq);
    if(btn.dataset.openHistoricoEq) await abrirFluxo('historico', btn.dataset.openHistoricoEq);
  }catch(e){ msg(e.message || String(e), 'bad'); }
});

inject();
window.equipamentosCleanLoad = loadEquipamentos;
