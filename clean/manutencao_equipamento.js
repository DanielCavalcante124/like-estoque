import { table, call, first } from './api.js?v=5';
import { openMovimentacaoModal } from './movimentacao_modal.js?v=1';

const S = { equipamentos: [], tecnicos: [], locais: [], selecionado: null, total: 0, busca: '', timer: null, carregando: false };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const opId = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
const ativo = (x) => x && x.ativo !== false;
const norm = (v) => String(v || '').trim();
const normalizar = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
let bound = false;

const ACOES = [
  { value:'Aprovar para estoque', label:'Aprovar para estoque', destino:'Estoque central', badge:'Em estoque' },
  { value:'Manter em manutenção', label:'Manter em manutenção', destino:'Manutenção', badge:'Manutenção' },
  { value:'Marcar defeituoso', label:'Marcar defeituoso', destino:'Manutenção', badge:'Defeituoso' },
  { value:'Enviar para garantia', label:'Enviar para garantia', destino:'Garantia', badge:'Garantia' },
  { value:'Preparar para inutiliza\u00e7\u00e3o', label:'Preparar para baixa', destino:'Manutenção', badge:'Aguardando baixa', danger:true }
];

function msg(text, type=''){
  const el = $('manutencaoMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeEq(e){ return [e.tipo,e.marca,e.modelo].filter(Boolean).join(' '); }
function identificacao(e){ return [e.codigo, e.mac, e.serial, nomeEq(e)].filter(Boolean).join(' • '); }
function statusLower(e){ return normalizar(e.status); }
function localLower(e){ return normalizar(e.local); }
function isElegivelManutencao(e){
  if(!ativo(e)) return false;
  const s = statusLower(e);
  const l = localLower(e);
  return ['manutencao','em manutencao','defeituoso','testar','garantia','aguardando baixa'].includes(s) || l.includes('manutencao') || l.includes('garantia');
}
function acaoSelecionada(){ return ACOES.find(a => a.value === $('manutencaoAcao')?.value) || ACOES[1]; }

function inject(){
  if(!$('navManutencaoClean')){
    const ref = $('navDevolucaoClean') || $('navSaidaClean') || $('navRetornoSemCadastroClean') || document.querySelector('[data-page="cadastros"]');
    const btn = document.createElement('button');
    btn.id = 'navManutencaoClean';
    btn.className = 'nav';
    btn.textContent = 'Manutenção';
    btn.onclick = showPage;
    ref ? ref.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-manutencao-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-manutencao-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Manutenção e teste</h2>
            <p>Registre diagnóstico e decisão técnica de equipamentos em teste, manutenção, defeito ou garantia. A busca da fila é feita no banco.</p>
          </div>
          <button id="manutencaoReload" class="secondary">Recarregar dados</button>
        </div>
        <div id="manutencaoMsg" class="msg"></div>
      </div>

      <div class="grid two">
        <form id="manutencaoForm" class="card form-card">
          <h2>Resultado técnico</h2>
          <input id="manutencaoBuscaEquipamento" placeholder="Buscar por código, MAC, SN, modelo, status ou local">
          <select id="manutencaoEquipamento"></select>
          <div class="form-grid two">
            <select id="manutencaoAcao"></select>
            <select id="manutencaoResponsavel"></select>
          </div>
          <div class="form-grid two">
            <select id="manutencaoDestino"></select>
            <input id="manutencaoOs" placeholder="OS / referência">
          </div>
          <textarea id="manutencaoDiagnostico" rows="5" placeholder="Diagnóstico técnico obrigatório"></textarea>
          <input id="manutencaoObs" placeholder="Observação complementar">
          <div class="actions">
            <button class="primary" type="submit">Revisar decisão</button>
            <button class="secondary" id="manutencaoLimpar" type="button">Limpar</button>
          </div>
        </form>

        <div class="card">
          <h2>Resumo antes de confirmar</h2>
          <div id="manutencaoPreview" class="list"></div>
          <div id="manutencaoRegra" class="msg show warn">Selecione um equipamento em manutenção/teste.</div>
        </div>
      </div>

      <div class="card">
        <div class="table-head">
          <div>
            <h2>Fila de manutenção/teste</h2>
            <p id="manutencaoTotalInfo">Mostrando até 80 equipamentos.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Equipamento</th><th>MAC/SN</th><th>Status</th><th>Local</th><th>Motivo</th><th>Ação</th></tr></thead>
            <tbody id="manutencaoTbody"></tbody>
          </table>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  if(bound) return;
  bound = true;
  $('manutencaoReload').onclick = () => loadManutencao().catch(e=>msg(e.message,'bad'));
  $('manutencaoForm').onsubmit = abrirConfirmacao;
  $('manutencaoLimpar').onclick = limparForm;
  $('manutencaoBuscaEquipamento').oninput = () => {
    S.busca = $('manutencaoBuscaEquipamento')?.value || '';
    clearTimeout(S.timer);
    S.timer = setTimeout(() => carregarEquipamentosManutencao().catch(e=>msg(e.message,'bad')), 350);
  };
  $('manutencaoEquipamento').onchange = selecionarEquipamento;
  $('manutencaoAcao').onchange = () => { ajustarDestinoPorAcao(); renderPreview(); };
  ['manutencaoResponsavel','manutencaoDestino','manutencaoOs','manutencaoDiagnostico','manutencaoObs'].forEach(id=>{
    const el = $(id);
    if(el) el.addEventListener('input', renderPreview);
  });
  document.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-manutencao-eq]');
    if(!btn) return;
    selecionarEquipamentoId(btn.dataset.manutencaoEq);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navManutencaoClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-manutencao-clean'));
  const title = $('pageTitle');
  if(title) title.textContent = 'Manutenção';
  loadManutencao().catch(e=>msg(e.message,'bad'));
}

async function loadManutencao(){
  msg('Carregando fila de manutenção...', 'warn');
  S.tecnicos = await table('tecnicos','nome',true);
  S.locais = await table('locais','nome',true);
  fillAcoes();
  fillResponsaveis();
  fillDestinos();
  await carregarEquipamentosManutencao();
  renderPreview();
  msg('Tela de manutenção pronta para uso.', 'ok');
}

async function carregarEquipamentosManutencao(){
  if(S.carregando) return;
  S.carregando = true;
  try{
    const res = await call('rpc_pesquisar_equipamentos_7a5', {
      p_busca: S.busca || '',
      p_status_filtro: 'manutencao',
      p_limit: 80,
      p_offset: 0
    });
    const atuais = res.items || [];
    if(S.selecionado && !atuais.some(e=>e.id===S.selecionado.id)) atuais.unshift(S.selecionado);
    S.equipamentos = atuais.filter(isElegivelManutencao);
    S.total = Number(res.total || 0);
    renderEquipSelect();
    renderTabela();
  }finally{
    S.carregando = false;
  }
}

function fillAcoes(){
  $('manutencaoAcao').innerHTML = ACOES.map(a=>`<option value="${esc(a.value)}">${esc(a.label)}</option>`).join('');
  $('manutencaoAcao').value = 'Manter em manutenção';
}
function fillResponsaveis(){
  const tecnicos = S.tecnicos.filter(ativo);
  $('manutencaoResponsavel').innerHTML = '<option value="">Responsável pelo teste</option>' + tecnicos.map(t=>`<option value="${esc(t.nome)}">${esc(t.nome)}</option>`).join('');
}
function fillDestinos(){
  const nomes = new Set(S.locais.filter(ativo).map(l=>l.nome).filter(Boolean));
  ['Estoque central','Manutenção','Garantia'].forEach(l=>nomes.add(l));
  $('manutencaoDestino').innerHTML = [...nomes].map(l=>`<option value="${esc(l)}">${esc(l)}</option>`).join('');
  ajustarDestinoPorAcao(false);
}
function equipamentosElegiveis(){ return S.equipamentos.filter(isElegivelManutencao); }
function equipamentoSelecionado(){ return S.equipamentos.find(e=>e.id === $('manutencaoEquipamento')?.value) || S.selecionado; }
function selecionarEquipamentoId(id){
  const eq = S.equipamentos.find(e=>e.id === id);
  if(!eq) return;
  S.selecionado = eq;
  renderEquipSelect();
  $('manutencaoEquipamento').value = id;
  selecionarEquipamento();
}
function renderEquipSelect(){
  const rows = equipamentosElegiveis().slice(0,80);
  $('manutencaoEquipamento').innerHTML = '<option value="">Selecionar equipamento em manutenção/teste</option>' + rows.map(e=>`<option value="${e.id}">${esc(identificacao(e))}</option>`).join('');
  if(S.selecionado && rows.some(e=>e.id === S.selecionado.id)) $('manutencaoEquipamento').value = S.selecionado.id;
}
function selecionarEquipamento(){
  S.selecionado = equipamentoSelecionado();
  const eq = S.selecionado;
  if(eq?.os_atual && !$('manutencaoOs').value) $('manutencaoOs').value = eq.os_atual;
  renderPreview();
}
function ajustarDestinoPorAcao(doRender=true){
  const acao = acaoSelecionada();
  if($('manutencaoDestino')) $('manutencaoDestino').value = acao.destino;
  if(doRender) renderPreview();
}

function payload(){
  const eq = equipamentoSelecionado();
  const acao = acaoSelecionada();
  const responsavel = norm($('manutencaoResponsavel').value);
  const destino = norm($('manutencaoDestino').value) || acao.destino;
  const os = norm($('manutencaoOs').value || eq?.os_atual);
  const diagnostico = norm($('manutencaoDiagnostico').value);
  const obs = norm($('manutencaoObs').value);
  if(!eq) throw new Error('Selecione um equipamento em manutenção/teste.');
  if(!isElegivelManutencao(eq)) throw new Error('Esse equipamento não está elegível para manutenção/teste.');
  if(!acao?.value) throw new Error('Selecione a ação técnica.');
  if(!responsavel) throw new Error('Selecione o responsável pelo teste.');
  if(!diagnostico || diagnostico.length < 5) throw new Error('Informe um diagnóstico técnico com pelo menos 5 caracteres.');
  if(!destino) throw new Error('Informe o destino final.');
  return { eq, acao, responsavel, destino, os, diagnostico, obs };
}

function resumoHtml(p){
  return `
    <div class="item"><div><b>${esc(p.eq.codigo || '-')} • ${esc(nomeEq(p.eq))}</b><br><small>${esc(p.eq.mac || p.eq.serial || 'Sem MAC/SN')}</small></div><span class="badge">${esc(p.eq.status || '-')}</span></div>
    <div class="item"><div><b>Ação técnica</b><br><small>${esc(p.acao.label)}</small></div><span class="badge">${esc(p.acao.badge)}</span></div>
    <div class="item"><div><b>Destino</b><br><small>${esc(p.destino)}</small></div><span class="badge">${esc(p.responsavel)}</span></div>
    <div class="item"><div><b>OS / Referência</b><br><small>${esc(p.os || 'Não informado')}</small></div></div>
    <div class="item"><div><b>Diagnóstico</b><br><small>${esc(p.diagnostico)}</small></div></div>
    <div class="item"><div><b>Observação</b><br><small>${esc(p.obs || 'Sem observação')}</small></div></div>`;
}
function renderPreview(){
  let p;
  try{ p = payload(); }
  catch(e){
    $('manutencaoPreview').innerHTML = `<div class="item"><b>Pendente</b><small>${esc(e.message)}</small></div>`;
    $('manutencaoRegra').textContent = e.message;
    return;
  }
  $('manutencaoRegra').textContent = 'Revise o diagnóstico antes de confirmar.';
  $('manutencaoPreview').innerHTML = resumoHtml(p);
}
async function abrirConfirmacao(ev){
  ev.preventDefault();
  try{
    const p = payload();
    const ok = await openMovimentacaoModal({
      title: 'Confirmar manutenção/teste',
      subtitle: 'Esta decisão altera status, local e histórico do equipamento.',
      html: resumoHtml(p),
      confirmText: 'Confirmar decisão',
      danger: !!p.acao.danger
    });
    if(ok) await confirmarManutencao(p);
  }catch(e){ msg(e.message || String(e), 'bad'); renderPreview(); }
}
async function confirmarManutencao(p){
  try{
    msg('Registrando manutenção/teste via RPC...', 'warn');
    const result = first(await call('rpc_registrar_manutencao_equipamento', {
      p_equipamento_id: p.eq.id,
      p_acao: p.acao.value,
      p_diagnostico: p.diagnostico,
      p_responsavel: p.responsavel,
      p_destino: p.destino,
      p_os: p.os,
      p_observacao: p.obs,
      p_client_operation_id: opId()
    }));
    msg(`Manutenção registrada. Status: ${result?.status || 'atualizado'}.`, 'ok');
    limparForm(false);
    await loadManutencao();
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

function limparForm(show=true){
  ['manutencaoBuscaEquipamento','manutencaoEquipamento','manutencaoResponsavel','manutencaoOs','manutencaoDiagnostico','manutencaoObs'].forEach(id=>{ if($(id)) $(id).value=''; });
  if($('manutencaoAcao')) $('manutencaoAcao').value = 'Manter em manutenção';
  ajustarDestinoPorAcao(false);
  S.selecionado = null;
  S.busca = '';
  renderEquipSelect();
  renderPreview();
  if(show) msg('Formulário limpo.', 'ok');
}
function renderTabela(){
  if($('manutencaoTotalInfo')) $('manutencaoTotalInfo').textContent = `Mostrando ${S.equipamentos.length} de ${S.total} em manutenção/teste. Use a busca para localizar outros.`;
  $('manutencaoTbody').innerHTML = equipamentosElegiveis().map(e=>`
    <tr>
      <td><b>${esc(e.codigo || '-')}</b></td>
      <td>${esc(nomeEq(e))}</td>
      <td>${esc(e.mac || e.serial || '-')}</td>
      <td><span class="badge">${esc(e.status || '-')}</span></td>
      <td>${esc(e.local || '-')}</td>
      <td>${esc(e.motivo_atual || '-')}</td>
      <td><button class="secondary" data-manutencao-eq="${e.id}">Selecionar</button></td>
    </tr>`).join('') || '<tr><td colspan="7">Nenhum equipamento em manutenção/teste.</td></tr>';
}

inject();
window.manutencaoCleanLoad = loadManutencao;
window.manutencaoCleanSelectById = async function(id){
  if(!id) return false;
  if(S.equipamentos.some(e=>e.id===id)){ selecionarEquipamentoId(id); return true; }
  const res = await call('rpc_pesquisar_equipamentos_7a5', { p_busca:id, p_status_filtro:'todos', p_limit:10, p_offset:0 });
  const eq = (res.items || []).find(e=>e.id===id);
  if(!eq) return false;
  S.selecionado = eq;
  if(!S.equipamentos.some(e=>e.id===id)) S.equipamentos.unshift(eq);
  renderEquipSelect();
  $('manutencaoEquipamento').value = id;
  selecionarEquipamento();
  return true;
};
