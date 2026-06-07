import { table, call, first } from './api.js?v=3';
import { openMovimentacaoModal } from './movimentacao_modal.js?v=1';

const S = { equipamentos: [], tecnicos: [], locais: [], selecionado: null };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const opId = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
const ativo = (x) => x && x.ativo !== false;
const norm = (v) => String(v || '').trim();
let bound = false;

const ACOES = [
  { value:'Aprovar para estoque', label:'Aprovar para estoque', destino:'Estoque central', badge:'Em estoque' },
  { value:'Manter em manutenção', label:'Manter em manutenção', destino:'Manutenção', badge:'Manutenção' },
  { value:'Marcar defeituoso', label:'Marcar defeituoso', destino:'Manutenção', badge:'Defeituoso' },
  { value:'Enviar para garantia', label:'Enviar para garantia', destino:'Garantia', badge:'Garantia' },
  { value:'Preparar para inutilização', label:'Preparar para baixa', destino:'Manutenção', badge:'Aguardando baixa', danger:true }
];

function msg(text, type=''){
  const el = $('manutencaoMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeEq(e){ return [e.tipo,e.marca,e.modelo].filter(Boolean).join(' '); }
function identificacao(e){ return [e.codigo, e.mac, e.serial, nomeEq(e)].filter(Boolean).join(' • '); }
function statusLower(e){ return String(e.status || '').toLowerCase(); }
function localLower(e){ return String(e.local || '').toLowerCase(); }
function isElegivelManutencao(e){
  if(!ativo(e)) return false;
  const s = statusLower(e);
  const l = localLower(e);
  return ['manutenção','em manutenção','em manutencao','defeituoso','testar','garantia','aguardando baixa'].includes(s) || l.includes('manutenção') || l.includes('garantia');
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
            <p>Registre diagnóstico e decisão técnica de equipamentos em teste, manutenção, defeito ou garantia.</p>
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
          <h2>Fila de manutenção/teste</h2>
          <input id="manutencaoFiltroTabela" placeholder="Filtrar lista">
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
  $('manutencaoBuscaEquipamento').oninput = renderEquipSelect;
  $('manutencaoEquipamento').onchange = selecionarEquipamento;
  $('manutencaoAcao').onchange = () => { ajustarDestinoPorAcao(); renderPreview(); };
  ['manutencaoResponsavel','manutencaoDestino','manutencaoOs','manutencaoDiagnostico','manutencaoObs','manutencaoFiltroTabela'].forEach(id=>{
    const el = $(id);
    if(el) el.addEventListener('input', () => { if(id === 'manutencaoFiltroTabela') renderTabela(); else renderPreview(); });
  });
  document.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-manutencao-eq]');
    if(!btn) return;
    $('manutencaoEquipamento').value = btn.dataset.manutencaoEq;
    selecionarEquipamento();
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
  S.equipamentos = await table('equipamentos','created_at',false);
  S.tecnicos = await table('tecnicos','nome',true);
  S.locais = await table('locais','nome',true);
  fillAcoes();
  fillResponsaveis();
  fillDestinos();
  renderEquipSelect();
  renderTabela();
  renderPreview();
  msg('Tela de manutenção pronta para uso.', 'ok');
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
function equipamentoSelecionado(){ return S.equipamentos.find(e=>e.id === $('manutencaoEquipamento')?.value); }
function renderEquipSelect(){
  const filtro = ($('manutencaoBuscaEquipamento')?.value || '').toLowerCase();
  const rows = equipamentosElegiveis().filter(e => !filtro || JSON.stringify(e).toLowerCase().includes(filtro)).slice(0,200);
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
  renderEquipSelect();
  renderPreview();
  if(show) msg('Formulário limpo.', 'ok');
}
function renderTabela(){
  const filtro = ($('manutencaoFiltroTabela')?.value || '').toLowerCase();
  const rows = equipamentosElegiveis().filter(e => !filtro || JSON.stringify(e).toLowerCase().includes(filtro)).slice(0,100);
  $('manutencaoTbody').innerHTML = rows.map(e=>`
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
