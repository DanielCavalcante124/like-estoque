import { table, call, first } from './api.js?v=5';
import { openMovimentacaoModal } from './movimentacao_modal.js?v=1';

const S = { equipamentos: [], selecionado: null, confirmando: false };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm = v => String(v || '').trim();
const opId = () => globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
const ativo = x => x && x.ativo !== false;

function msg(text, type=''){
  const el = $('instalacaoMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}

function nomeEq(e){ return [e?.tipo, e?.marca, e?.modelo].filter(Boolean).join(' ') || e?.codigo || '-'; }
function idEq(e){ return [e.codigo, e.mac, e.serial, nomeEq(e)].filter(Boolean).join(' • '); }
function statusAberto(e){
  const status = String(e.status || '').toLowerCase();
  return ['com técnico','com tecnico','na rua','reservado'].includes(status);
}
function equipamentosEmAberto(){ return S.equipamentos.filter(e => ativo(e) && statusAberto(e)); }
function equipamentoSelecionado(){ return S.equipamentos.find(e => e.id === $('instalacaoEquipamento')?.value); }

function pontoOperacao(){
  return $('navOperacaoRapidaClean') || $('navSaidaClean') || $('navEntradaLoteClean') || $('navEntradaClean') || document.querySelector('[data-page="dashboard"]');
}

function inject(){
  if(!$('navConfirmarInstalacao')){
    const ref = pontoOperacao();
    const btn = document.createElement('button');
    btn.id = 'navConfirmarInstalacao';
    btn.className = 'nav';
    btn.textContent = 'Confirmar instalação';
    btn.onclick = showPage;
    ref ? ref.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-confirmar-instalacao')){
    const sec = document.createElement('section');
    sec.id = 'page-confirmar-instalacao';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Confirmar instalação no cliente</h2>
            <p>Encerra a pendência do técnico e muda o equipamento para Instalado cliente.</p>
          </div>
          <button id="instalacaoReload" class="secondary">Recarregar dados</button>
        </div>
        <div id="instalacaoMsg" class="msg"></div>
      </div>

      <div class="grid two">
        <form id="instalacaoForm" class="card form-card">
          <h2>Dados da instalação</h2>
          <input id="instalacaoBuscaEquipamento" placeholder="Buscar por técnico, código, MAC, serial ou modelo">
          <select id="instalacaoEquipamento"></select>
          <div class="form-grid two">
            <input id="instalacaoCliente" placeholder="Cliente / endereço da instalação">
            <input id="instalacaoOs" placeholder="OS / Atendimento">
          </div>
          <div class="form-grid two">
            <input id="instalacaoResponsavel" placeholder="Responsável pelo registro">
            <input id="instalacaoObs" placeholder="Observação opcional">
          </div>
          <div class="actions">
            <button class="primary" type="submit">Revisar e confirmar instalação</button>
            <button class="secondary" id="instalacaoLimpar" type="button">Limpar</button>
          </div>
        </form>

        <div class="card">
          <h2>Resumo antes de confirmar</h2>
          <div id="instalacaoPreview" class="list"></div>
          <div id="instalacaoRegra" class="msg show warn">Selecione um equipamento em aberto com técnico.</div>
        </div>
      </div>

      <div class="card">
        <div class="table-head">
          <h2>Equipamentos com técnico / rua / reservado</h2>
          <input id="instalacaoFiltroTabela" placeholder="Filtrar lista">
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Equipamento</th><th>MAC/SN</th><th>Status</th><th>Técnico</th><th>Local</th><th>Ação</th></tr></thead>
            <tbody id="instalacaoTbody"></tbody>
          </table>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  $('instalacaoReload').onclick = () => loadInstalacao().catch(e => msg(e.message, 'bad'));
  $('instalacaoForm').onsubmit = abrirConfirmacao;
  $('instalacaoLimpar').onclick = limparForm;
  $('instalacaoBuscaEquipamento').oninput = renderSelect;
  $('instalacaoEquipamento').onchange = () => { S.selecionado = equipamentoSelecionado(); renderPreview(); };
  ['instalacaoCliente','instalacaoOs','instalacaoResponsavel','instalacaoObs','instalacaoFiltroTabela'].forEach(id => {
    const el = $(id);
    if(el) el.addEventListener('input', () => id === 'instalacaoFiltroTabela' ? renderTabela() : renderPreview());
  });
  document.addEventListener('click', ev => {
    const btn = ev.target.closest?.('[data-instalar-eq]');
    if(!btn) return;
    $('instalacaoEquipamento').value = btn.dataset.instalarEq;
    S.selecionado = equipamentoSelecionado();
    renderPreview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navConfirmarInstalacao'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-confirmar-instalacao'));
  if($('pageTitle')) $('pageTitle').textContent = 'Confirmar instalação';
  loadInstalacao().catch(e => msg(e.message, 'bad'));
}

async function loadInstalacao(){
  msg('Carregando equipamentos em aberto com técnicos...', 'warn');
  S.equipamentos = await table('equipamentos', 'created_at', false);
  renderSelect();
  renderTabela();
  renderPreview();
  msg('Tela pronta para confirmar instalações.', 'ok');
}

function filtroTexto(){ return String($('instalacaoBuscaEquipamento')?.value || '').toLowerCase(); }
function passaFiltro(e, filtro){ return !filtro || JSON.stringify(e).toLowerCase().includes(filtro); }

function renderSelect(){
  const filtro = filtroTexto();
  const rows = equipamentosEmAberto().filter(e => passaFiltro(e, filtro)).slice(0, 300);
  $('instalacaoEquipamento').innerHTML = '<option value="">Selecionar equipamento com técnico</option>' + rows.map(e => `<option value="${e.id}">${esc(idEq(e))} • Técnico: ${esc(e.tecnico_atual || '-')}</option>`).join('');
  if(S.selecionado && rows.some(e => e.id === S.selecionado.id)) $('instalacaoEquipamento').value = S.selecionado.id;
}

function payload(){
  const eq = equipamentoSelecionado();
  const cliente = norm($('instalacaoCliente').value);
  const os = norm($('instalacaoOs').value);
  const responsavel = norm($('instalacaoResponsavel').value);
  const obs = norm($('instalacaoObs').value);
  if(!eq) throw new Error('Selecione um equipamento em aberto com técnico.');
  if(!statusAberto(eq)) throw new Error('Este equipamento não está com técnico, na rua ou reservado.');
  if(!cliente) throw new Error('Informe o cliente/endereço da instalação.');
  if(!os) throw new Error('Informe a OS/atendimento.');
  return { eq, cliente, os, responsavel, obs };
}

function resumoHtml(p){
  return `
    <div class="item"><div><b>${esc(p.eq.codigo || '-')} • ${esc(nomeEq(p.eq))}</b><br><small>MAC/SN: ${esc(p.eq.mac || p.eq.serial || '-')}</small></div><span class="badge">${esc(p.eq.status || '-')}</span></div>
    <div class="item"><div><b>Técnico atual</b><br><small>${esc(p.eq.tecnico_atual || 'Não informado')}</small></div><span class="badge">Será encerrado</span></div>
    <div class="item"><div><b>Cliente / endereço</b><br><small>${esc(p.cliente)}</small></div><span class="badge">Instalado cliente</span></div>
    <div class="item"><div><b>OS / Atendimento</b><br><small>${esc(p.os)}</small></div></div>
    <div class="item"><div><b>Observação</b><br><small>${esc(p.obs || 'Sem observação')}</small></div></div>`;
}

function renderPreview(){
  let p;
  try{ p = payload(); }
  catch(e){
    if($('instalacaoPreview')) $('instalacaoPreview').innerHTML = `<div class="item"><b>Pendente</b><small>${esc(e.message)}</small></div>`;
    if($('instalacaoRegra')) $('instalacaoRegra').textContent = e.message;
    return;
  }
  $('instalacaoRegra').textContent = 'Ao confirmar, o equipamento sai da responsabilidade do técnico e fica vinculado ao cliente/OS.';
  $('instalacaoPreview').innerHTML = resumoHtml(p);
}

async function abrirConfirmacao(ev){
  ev.preventDefault();
  if(S.confirmando) return;
  try{
    const p = payload();
    const ok = await openMovimentacaoModal({
      title: 'Confirmar instalação',
      subtitle: 'Esta ação encerra a pendência do técnico e altera o status para Instalado cliente.',
      html: resumoHtml(p),
      confirmText: 'Confirmar instalação'
    });
    if(ok) await confirmarInstalacao(p);
  }catch(e){ msg(e.message || String(e), 'bad'); renderPreview(); }
}

async function confirmarInstalacao(p){
  S.confirmando = true;
  try{
    msg('Confirmando instalação...', 'warn');
    const protocolo = opId();
    const result = first(await call('rpc_confirmar_instalacao_cliente', {
      p_equipamento_id: p.eq.id,
      p_cliente: p.cliente,
      p_os: p.os,
      p_responsavel: p.responsavel,
      p_observacao: p.obs,
      p_client_operation_id: protocolo
    }));
    msg(`Instalação confirmada. ${result?.codigo || p.eq.codigo || 'Equipamento'} saiu da pendência do técnico.`, 'ok');
    limparForm(false);
    await loadInstalacao();
  } finally {
    S.confirmando = false;
  }
}

function renderTabela(){
  const filtro = String($('instalacaoFiltroTabela')?.value || '').toLowerCase();
  const rows = equipamentosEmAberto().filter(e => passaFiltro(e, filtro)).slice(0, 300);
  $('instalacaoTbody').innerHTML = rows.map(e => `
    <tr>
      <td><b>${esc(e.codigo || '-')}</b></td>
      <td>${esc(nomeEq(e))}</td>
      <td>${esc(e.mac || e.serial || '-')}</td>
      <td><span class="badge">${esc(e.status || '-')}</span></td>
      <td>${esc(e.tecnico_atual || '-')}</td>
      <td>${esc(e.local || '-')}</td>
      <td><button class="primary" type="button" data-instalar-eq="${e.id}">Confirmar</button></td>
    </tr>`).join('') || '<tr><td colspan="7">Nenhum equipamento em aberto com técnico.</td></tr>';
}

function limparForm(showMsg=true){
  ['instalacaoBuscaEquipamento','instalacaoEquipamento','instalacaoCliente','instalacaoOs','instalacaoResponsavel','instalacaoObs','instalacaoFiltroTabela'].forEach(id => { if($(id)) $(id).value = ''; });
  S.selecionado = null;
  renderSelect();
  renderTabela();
  renderPreview();
  if(showMsg) msg('Formulário limpo.', 'ok');
}

inject();
window.confirmarInstalacaoLoad = loadInstalacao;
