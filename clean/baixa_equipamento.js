import { table, call, first } from './api.js?v=3';
import { openMovimentacaoModal } from './movimentacao_modal.js?v=1';

const S = { equipamentos: [], tecnicos: [], selecionado: null };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const opId = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
const ativo = (x) => x && x.ativo !== false;
const norm = (v) => String(v || '').trim();
let bound = false;

const STATUS_ELEGIVEIS = ['aguardando baixa','inutilizado','defeituoso','manutenção','em manutenção','em manutencao','garantia'];

function msg(text, type=''){
  const el = $('baixaMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeEq(e){ return [e.tipo,e.marca,e.modelo].filter(Boolean).join(' '); }
function identificacao(e){ return [e.codigo, e.mac, e.serial, nomeEq(e)].filter(Boolean).join(' • '); }
function statusLower(e){ return String(e.status || '').toLowerCase(); }
function localLower(e){ return String(e.local || '').toLowerCase(); }
function isElegivelBaixa(e){
  if(!ativo(e)) return false;
  const s = statusLower(e);
  const l = localLower(e);
  return STATUS_ELEGIVEIS.includes(s) || l.includes('manutenção') || l.includes('garantia');
}

function inject(){
  if(!$('navBaixaClean')){
    const ref = $('navManutencaoClean') || $('navDevolucaoClean') || $('navSaidaClean') || document.querySelector('[data-page="cadastros"]');
    const btn = document.createElement('button');
    btn.id = 'navBaixaClean';
    btn.className = 'nav';
    btn.textContent = 'Baixa';
    btn.onclick = showPage;
    ref ? ref.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-baixa-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-baixa-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Baixa controlada</h2>
            <p>Finalize a baixa lógica de equipamentos já avaliados tecnicamente. Não exclui fisicamente o registro.</p>
          </div>
          <button id="baixaReload" class="secondary">Recarregar dados</button>
        </div>
        <div id="baixaMsg" class="msg"></div>
      </div>

      <div class="grid two">
        <form id="baixaForm" class="card form-card">
          <h2>Dados da baixa</h2>
          <input id="baixaBuscaEquipamento" placeholder="Buscar por código, MAC, SN, modelo, status ou motivo">
          <select id="baixaEquipamento"></select>
          <select id="baixaResponsavel"></select>
          <textarea id="baixaMotivo" rows="5" placeholder="Motivo da baixa obrigatório, mínimo 10 caracteres"></textarea>
          <input id="baixaObs" placeholder="Observação complementar">
          <div class="actions">
            <button class="danger" type="submit">Revisar baixa</button>
            <button class="secondary" id="baixaLimpar" type="button">Limpar</button>
          </div>
        </form>

        <div class="card">
          <h2>Resumo antes de confirmar</h2>
          <div id="baixaPreview" class="list"></div>
          <div id="baixaRegra" class="msg show warn">Selecione um equipamento elegível para baixa.</div>
        </div>
      </div>

      <div class="card">
        <div class="table-head">
          <h2>Fila elegível para baixa</h2>
          <input id="baixaFiltroTabela" placeholder="Filtrar lista">
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Equipamento</th><th>MAC/SN</th><th>Status</th><th>Local</th><th>Motivo atual</th><th>Ação</th></tr></thead>
            <tbody id="baixaTbody"></tbody>
          </table>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  if(bound) return;
  bound = true;
  $('baixaReload').onclick = () => loadBaixa().catch(e=>msg(e.message,'bad'));
  $('baixaForm').onsubmit = abrirConfirmacao;
  $('baixaLimpar').onclick = limparForm;
  $('baixaBuscaEquipamento').oninput = renderEquipSelect;
  $('baixaEquipamento').onchange = selecionarEquipamento;
  ['baixaResponsavel','baixaMotivo','baixaObs','baixaFiltroTabela'].forEach(id=>{
    const el = $(id);
    if(el) el.addEventListener('input', () => { if(id === 'baixaFiltroTabela') renderTabela(); else renderPreview(); });
  });
  document.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-baixa-eq]');
    if(!btn) return;
    $('baixaEquipamento').value = btn.dataset.baixaEq;
    selecionarEquipamento();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navBaixaClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-baixa-clean'));
  const title = $('pageTitle');
  if(title) title.textContent = 'Baixa controlada';
  loadBaixa().catch(e=>msg(e.message,'bad'));
}

async function loadBaixa(){
  msg('Carregando fila de baixa...', 'warn');
  S.equipamentos = await table('equipamentos','created_at',false);
  S.tecnicos = await table('tecnicos','nome',true);
  fillResponsaveis();
  renderEquipSelect();
  renderTabela();
  renderPreview();
  msg('Baixa controlada pronta para uso.', 'ok');
}

function fillResponsaveis(){
  const tecnicos = S.tecnicos.filter(ativo);
  $('baixaResponsavel').innerHTML = '<option value="">Responsável pela baixa</option>' + tecnicos.map(t=>`<option value="${esc(t.nome)}">${esc(t.nome)}</option>`).join('');
}
function equipamentosElegiveis(){ return S.equipamentos.filter(isElegivelBaixa); }
function equipamentoSelecionado(){ return S.equipamentos.find(e=>e.id === $('baixaEquipamento')?.value); }
function renderEquipSelect(){
  const filtro = ($('baixaBuscaEquipamento')?.value || '').toLowerCase();
  const rows = equipamentosElegiveis().filter(e => !filtro || JSON.stringify(e).toLowerCase().includes(filtro)).slice(0,200);
  $('baixaEquipamento').innerHTML = '<option value="">Selecionar equipamento para baixa</option>' + rows.map(e=>`<option value="${e.id}">${esc(identificacao(e))}</option>`).join('');
  if(S.selecionado && rows.some(e=>e.id === S.selecionado.id)) $('baixaEquipamento').value = S.selecionado.id;
}
function selecionarEquipamento(){
  S.selecionado = equipamentoSelecionado();
  renderPreview();
}

function payload(){
  const eq = equipamentoSelecionado();
  const responsavel = norm($('baixaResponsavel').value);
  const motivo = norm($('baixaMotivo').value);
  const obs = norm($('baixaObs').value);
  if(!eq) throw new Error('Selecione um equipamento elegível para baixa.');
  if(!isElegivelBaixa(eq)) throw new Error('Esse equipamento não está elegível para baixa controlada.');
  if(!responsavel) throw new Error('Selecione o responsável pela baixa.');
  if(!motivo || motivo.length < 10) throw new Error('Informe motivo da baixa com pelo menos 10 caracteres.');
  return { eq, responsavel, motivo, obs };
}

function resumoHtml(p){
  return `
    <div class="item"><div><b>${esc(p.eq.codigo || '-')} • ${esc(nomeEq(p.eq))}</b><br><small>${esc(p.eq.mac || p.eq.serial || 'Sem MAC/SN')}</small></div><span class="badge">${esc(p.eq.status || '-')}</span></div>
    <div class="item"><div><b>Local atual</b><br><small>${esc(p.eq.local || '-')}</small></div><span class="badge">Baixado</span></div>
    <div class="item"><div><b>Responsável</b><br><small>${esc(p.responsavel)}</small></div></div>
    <div class="item"><div><b>Motivo</b><br><small>${esc(p.motivo)}</small></div></div>
    <div class="item"><div><b>Observação</b><br><small>${esc(p.obs || 'Sem observação')}</small></div></div>
    <div class="msg show bad">Esta ação remove o equipamento da operação ativa e não deve ser usada para devolução comum.</div>`;
}
function renderPreview(){
  let p;
  try{ p = payload(); }
  catch(e){
    $('baixaPreview').innerHTML = `<div class="item"><b>Pendente</b><small>${esc(e.message)}</small></div>`;
    $('baixaRegra').textContent = e.message;
    return;
  }
  $('baixaRegra').textContent = 'Revise com atenção. A baixa é lógica e remove o equipamento da operação ativa.';
  $('baixaPreview').innerHTML = resumoHtml(p);
}
async function abrirConfirmacao(ev){
  ev.preventDefault();
  try{
    const p = payload();
    const ok = await openMovimentacaoModal({
      title: 'Confirmar baixa controlada',
      subtitle: 'A baixa deixa o equipamento inativo e registra histórico definitivo.',
      html: resumoHtml(p),
      confirmText: 'Confirmar baixa',
      danger: true
    });
    if(ok) await confirmarBaixa(p);
  }catch(e){ msg(e.message || String(e), 'bad'); renderPreview(); }
}
async function confirmarBaixa(p){
  try{
    msg('Registrando baixa controlada via RPC...', 'warn');
    const result = first(await call('rpc_baixar_equipamento_controlado', {
      p_equipamento_id: p.eq.id,
      p_motivo: p.motivo,
      p_responsavel: p.responsavel,
      p_observacao: p.obs,
      p_client_operation_id: opId()
    }));
    msg(`Baixa registrada. Status: ${result?.status || 'Baixado'}.`, 'ok');
    limparForm(false);
    await loadBaixa();
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

function limparForm(show=true){
  ['baixaBuscaEquipamento','baixaEquipamento','baixaResponsavel','baixaMotivo','baixaObs'].forEach(id=>{ if($(id)) $(id).value=''; });
  S.selecionado = null;
  renderEquipSelect();
  renderPreview();
  if(show) msg('Formulário limpo.', 'ok');
}
function renderTabela(){
  const filtro = ($('baixaFiltroTabela')?.value || '').toLowerCase();
  const rows = equipamentosElegiveis().filter(e => !filtro || JSON.stringify(e).toLowerCase().includes(filtro)).slice(0,100);
  $('baixaTbody').innerHTML = rows.map(e=>`
    <tr>
      <td><b>${esc(e.codigo || '-')}</b></td>
      <td>${esc(nomeEq(e))}</td>
      <td>${esc(e.mac || e.serial || '-')}</td>
      <td><span class="badge">${esc(e.status || '-')}</span></td>
      <td>${esc(e.local || '-')}</td>
      <td>${esc(e.motivo_atual || e.motivo_baixa || '-')}</td>
      <td><button class="danger" data-baixa-eq="${e.id}">Selecionar</button></td>
    </tr>`).join('') || '<tr><td colspan="7">Nenhum equipamento elegível para baixa.</td></tr>';
}

inject();
window.baixaCleanLoad = loadBaixa;
