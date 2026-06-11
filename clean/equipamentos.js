import { call } from './api.js?v=5';

const S = { equipamentos: [], total: 0, pagina: 0, limite: 50, filtro: '', status: 'ativos', carregando: false, timer: null };
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
const isCliente = (e) => isAtivo(e) && isOne(e, ['instalado cliente','instalado no cliente','na rua','reservado','na rua sem cadastro','pendente regularizacao','pendente regularização']);
const isManutencao = (e) => isAtivo(e) && (isOne(e, ['manutencao','em manutencao','defeituoso','testar']) || norm(e.local).includes('manutencao'));
const isGarantia = (e) => isAtivo(e) && (isOne(e, ['garantia']) || norm(e.local).includes('garantia'));
const isAguardandoBaixa = (e) => isAtivo(e) && isOne(e, ['aguardando baixa','descarte autorizado']);
const isElegivelBaixa = (e) => isManutencao(e) || isGarantia(e) || isAguardandoBaixa(e) || isOne(e, ['inutilizado','defeituoso']);

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
  if(!e) throw new Error('Equipamento não encontrado na página carregada. Pesquise novamente ou avance/volte a página.');
  return e;
}
function totalPaginas(){ return Math.max(1, Math.ceil(Number(S.total || 0) / S.limite)); }
function paginaAtualHumana(){ return Math.min(S.pagina + 1, totalPaginas()); }

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
            <p>Consulta central paginada. A busca é feita no banco para suportar milhares de equipamentos sem travar a tela.</p>
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
        <div class="actions" style="margin-top:10px">
          <button id="eqPrev" class="secondary" type="button">Página anterior</button>
          <button id="eqNext" class="secondary" type="button">Próxima página</button>
          <span id="eqPageInfo" class="badge">Página 1</span>
        </div>
        <div id="eqCleanMsg" class="msg"></div>
      </div>
      <div class="kpis">
        <div class="kpi"><small>Total encontrado</small><b id="eqKTotal">0</b></div>
        <div class="kpi"><small>Nesta página</small><b id="eqKPage">0</b></div>
        <div class="kpi"><small>Ativos na página</small><b id="eqKAtivos">0</b></div>
        <div class="kpi"><small>Em estoque</small><b id="eqKEstoque">0</b></div>
        <div class="kpi"><small>Com técnico</small><b id="eqKTecnico">0</b></div>
        <div class="kpi"><small>Manut./Garantia</small><b id="eqKManutencao">0</b></div>
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
  $('eqCleanBusca').oninput = () => {
    S.filtro = $('eqCleanBusca').value || '';
    S.pagina = 0;
    clearTimeout(S.timer);
    S.timer = setTimeout(() => loadEquipamentos().catch((e)=>msg(e.message,'bad')), 350);
  };
  $('eqCleanStatus').onchange = () => {
    S.status = $('eqCleanStatus').value || 'ativos';
    S.pagina = 0;
    loadEquipamentos().catch((e)=>msg(e.message,'bad'));
  };
  $('eqPrev').onclick = () => mudarPagina(-1);
  $('eqNext').onclick = () => mudarPagina(1);
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
  if(S.carregando) return;
  S.carregando = true;
  try{
    msg('Pesquisando equipamentos no banco...', 'warn');
    const res = await call('rpc_pesquisar_equipamentos_7a5', {
      p_busca: S.filtro || '',
      p_status_filtro: S.status || 'ativos',
      p_limit: S.limite,
      p_offset: S.pagina * S.limite
    });
    S.equipamentos = res.items || [];
    S.total = Number(res.total || 0);
    renderEquipamentos();
    msg(`Equipamentos carregados: ${S.equipamentos.length} de ${S.total}.`, 'ok');
  }finally{
    S.carregando = false;
  }
}

function mudarPagina(delta){
  const nova = S.pagina + delta;
  if(nova < 0 || nova >= totalPaginas()) return;
  S.pagina = nova;
  loadEquipamentos().catch((e)=>msg(e.message,'bad'));
}

function renderAcoes(e){
  const id = esc(e.id);
  const historico = `<button class="secondary" data-open-historico-eq="${id}">Histórico</button>`;
  if(!isAtivo(e)) return `${historico}<span class="badge">Inativo</span>`;
  const baixa = isElegivelBaixa(e)
    ? `<button class="danger" data-open-baixa-eq="${id}">Baixa</button>`
    : `<button class="secondary" data-block-baixa-eq="${id}">Baixa indisponível</button>`;
  return `
    ${historico}
    <button class="warn" data-open-saida-eq="${id}">Saída</button>
    <button class="secondary" data-open-devolucao-eq="${id}">Devolução</button>
    <button class="secondary" data-open-manutencao-eq="${id}">Manutenção</button>
    ${baixa}`;
}

function renderEquipamentos(){
  const rows = S.equipamentos || [];
  const ativos = rows.filter(isAtivo);
  $('eqKTotal').textContent = Number(S.total || 0).toLocaleString('pt-BR');
  $('eqKPage').textContent = rows.length.toLocaleString('pt-BR');
  $('eqKAtivos').textContent = ativos.length.toLocaleString('pt-BR');
  $('eqKEstoque').textContent = rows.filter(isEstoque).length.toLocaleString('pt-BR');
  $('eqKTecnico').textContent = rows.filter(isTecnico).length.toLocaleString('pt-BR');
  $('eqKManutencao').textContent = rows.filter(e=>isManutencao(e) || isGarantia(e)).length.toLocaleString('pt-BR');
  $('eqPageInfo').textContent = `Página ${paginaAtualHumana()} de ${totalPaginas()} • ${S.limite} por página`;
  $('eqPrev').disabled = S.pagina <= 0;
  $('eqNext').disabled = S.pagina >= totalPaginas() - 1;
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
  if(tipo === 'baixa' && !isElegivelBaixa(eq)){
    throw new Error('Este equipamento ainda não está elegível para baixa. Primeiro envie para Manutenção e use “Preparar para baixa”.');
  }
  const nav = $(f.nav);
  if(!nav) throw new Error(`Tela ${f.label} não encontrada. Recarregue a página.`);

  msg(`Abrindo ${f.label} para ${eq.codigo || eq.mac || eq.serial || 'equipamento'}...`, 'warn');
  nav.click();
  await sleep(300);
  if(typeof window[f.load] === 'function') await window[f.load]();
  await sleep(100);

  const select = $(f.select);
  if(!select) throw new Error(`Campo de seleção da tela ${f.label} não encontrado.`);
  select.value = id;
  if(select.value !== id){
    throw new Error(`O equipamento não apareceu na lista de ${f.label}. Status atual: ${eq.status || '-'}.`);
  }
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
    if(btn.dataset.blockBaixaEq) throw new Error('Baixa indisponível: primeiro coloque o equipamento em Manutenção e marque “Preparar para baixa”.');
  }catch(e){ msg(e.message || String(e), 'bad'); }
});

inject();
window.equipamentosCleanLoad = loadEquipamentos;
