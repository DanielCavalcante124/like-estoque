import { table, call, first } from './api.js?v=3';

const S = { equipamentos: [], tecnicos: [], locais: [], selecionado: null };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const opId = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
const ativo = (x) => x && x.ativo !== false;
const norm = (v) => String(v || '').trim();
let bound = false;

function msg(text, type=''){
  const el = $('devolucaoMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeEq(e){ return [e.tipo,e.marca,e.modelo].filter(Boolean).join(' '); }
function identificacao(e){ return [e.codigo, e.mac, e.serial, nomeEq(e)].filter(Boolean).join(' • '); }
function statusLower(e){ return String(e.status || '').toLowerCase(); }
function isElegivelDevolucao(e){
  if(!ativo(e)) return false;
  const s = statusLower(e);
  return ['com técnico','com tecnico','instalado cliente','instalado no cliente','na rua','reservado'].includes(s);
}
function destinoPorCondicao(condicao){
  const c = String(condicao || '').toLowerCase();
  if(c === 'bom') return 'Estoque central';
  if(c === 'sucata/inutilizar') return 'Inutilizado';
  return 'Manutenção';
}

function inject(){
  if(!$('navDevolucaoClean')){
    const ref = $('navSaidaClean') || $('navRetornoSemCadastroClean') || $('navEntradaLoteClean') || $('navEntradaClean') || document.querySelector('[data-page="cadastros"]');
    const btn = document.createElement('button');
    btn.id = 'navDevolucaoClean';
    btn.className = 'nav';
    btn.textContent = 'Devolução';
    btn.onclick = showPage;
    ref ? ref.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-devolucao-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-devolucao-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Devolução de equipamento</h2>
            <p>Retorna equipamento de técnico, cliente, rua ou reserva para estoque, manutenção ou inutilizado via RPC.</p>
          </div>
          <button id="devolucaoReload" class="secondary">Recarregar dados</button>
        </div>
        <div id="devolucaoMsg" class="msg"></div>
      </div>

      <div class="grid two">
        <form id="devolucaoForm" class="card form-card">
          <h2>Dados da devolução</h2>
          <input id="devolucaoBuscaEquipamento" placeholder="Buscar equipamento por código, MAC, SN, técnico, cliente ou OS">
          <select id="devolucaoEquipamento"></select>
          <div class="form-grid two">
            <select id="devolucaoTecnico"></select>
            <select id="devolucaoCondicao">
              <option value="Bom">Bom</option>
              <option value="Testar" selected>Testar</option>
              <option value="Defeituoso">Defeituoso</option>
              <option value="Sucata/Inutilizar">Sucata/Inutilizar</option>
            </select>
          </div>
          <div class="form-grid two">
            <select id="devolucaoDestino"></select>
            <input id="devolucaoOs" placeholder="OS / Atendimento">
          </div>
          <input id="devolucaoMotivo" placeholder="Motivo">
          <input id="devolucaoObs" placeholder="Observação">
          <div class="actions">
            <button class="primary" type="submit">Revisar devolução</button>
            <button class="secondary" id="devolucaoLimpar" type="button">Limpar</button>
          </div>
        </form>

        <div class="card">
          <h2>Resumo antes de confirmar</h2>
          <div id="devolucaoPreview" class="list"></div>
          <div id="devolucaoRegra" class="msg show warn">Selecione um equipamento em uso/fora do estoque.</div>
        </div>
      </div>

      <div class="card">
        <div class="table-head">
          <h2>Equipamentos elegíveis para devolução</h2>
          <input id="devolucaoFiltroTabela" placeholder="Filtrar lista">
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Equipamento</th><th>MAC/SN</th><th>Status</th><th>Atual</th><th>OS</th><th>Ação</th></tr></thead>
            <tbody id="devolucaoTbody"></tbody>
          </table>
        </div>
      </div>

      <div id="devolucaoModal" class="modal-clean" style="display:none">
        <div class="modal-clean-box">
          <h2>Confirmar devolução</h2>
          <div id="devolucaoModalResumo" class="list"></div>
          <div class="actions">
            <button id="devolucaoConfirmar" class="primary" type="button">Confirmar devolução</button>
            <button id="devolucaoCancelar" class="secondary" type="button">Cancelar</button>
          </div>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
    ensureStyle();
  }

  if(bound) return;
  bound = true;
  $('devolucaoReload').onclick = () => loadDevolucao().catch(e=>msg(e.message,'bad'));
  $('devolucaoForm').onsubmit = abrirConfirmacao;
  $('devolucaoLimpar').onclick = limparForm;
  $('devolucaoBuscaEquipamento').oninput = renderEquipSelect;
  $('devolucaoEquipamento').onchange = selecionarEquipamento;
  $('devolucaoCondicao').onchange = () => { ajustarDestinoPorCondicao(); renderPreview(); };
  $('devolucaoTecnico').onchange = renderPreview;
  ['devolucaoDestino','devolucaoOs','devolucaoMotivo','devolucaoObs','devolucaoFiltroTabela'].forEach(id=>{
    const el=$(id); if(el) el.addEventListener('input',()=>{ if(id==='devolucaoFiltroTabela') renderTabela(); else renderPreview(); });
  });
  $('devolucaoCancelar').onclick = fecharModal;
  $('devolucaoConfirmar').onclick = confirmarDevolucao;
  document.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-devolucao-eq]');
    if(!btn) return;
    $('devolucaoEquipamento').value = btn.dataset.devolucaoEq;
    selecionarEquipamento();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function ensureStyle(){
  if($('devolucaoModalStyle')) return;
  const st = document.createElement('style');
  st.id = 'devolucaoModalStyle';
  st.textContent = `.modal-clean{position:fixed;inset:0;background:rgba(15,23,42,.62);z-index:9999;display:flex;align-items:center;justify-content:center;padding:18px}.modal-clean-box{background:#fff;border-radius:20px;max-width:720px;width:100%;padding:22px;box-shadow:0 30px 80px rgba(0,0,0,.35)}.modal-clean-box h2{margin-top:0}`;
  document.head.appendChild(st);
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navDevolucaoClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-devolucao-clean'));
  const title = $('pageTitle');
  if(title) title.textContent = 'Devolução';
  loadDevolucao().catch(e=>msg(e.message,'bad'));
}

async function loadDevolucao(){
  msg('Carregando equipamentos para devolução...', 'warn');
  S.equipamentos = await table('equipamentos','created_at',false);
  S.tecnicos = await table('tecnicos','nome',true);
  S.locais = await table('locais','nome',true);
  fillTecnicos();
  fillDestinos();
  renderEquipSelect();
  renderTabela();
  renderPreview();
  msg('Devolução pronta para uso.', 'ok');
}

function fillTecnicos(){
  const tecnicos = S.tecnicos.filter(ativo);
  $('devolucaoTecnico').innerHTML = '<option value="">Técnico que devolveu</option>' + tecnicos.map(t=>`<option value="${esc(t.nome)}">${esc(t.nome)}</option>`).join('');
}
function fillDestinos(){
  const nomes = new Set(S.locais.filter(ativo).map(l=>l.nome).filter(Boolean));
  ['Estoque central','Manutenção','Inutilizado'].forEach(x=>nomes.add(x));
  $('devolucaoDestino').innerHTML = [...nomes].map(l=>`<option value="${esc(l)}">${esc(l)}</option>`).join('');
  ajustarDestinoPorCondicao(false);
}
function equipamentosElegiveis(){ return S.equipamentos.filter(isElegivelDevolucao); }
function equipamentoSelecionado(){ return S.equipamentos.find(e=>e.id===$('devolucaoEquipamento')?.value); }
function renderEquipSelect(){
  const filtro = ($('devolucaoBuscaEquipamento')?.value || '').toLowerCase();
  const rows = equipamentosElegiveis().filter(e => !filtro || JSON.stringify(e).toLowerCase().includes(filtro)).slice(0,200);
  $('devolucaoEquipamento').innerHTML = '<option value="">Selecionar equipamento para devolução</option>' + rows.map(e=>`<option value="${e.id}">${esc(identificacao(e))}</option>`).join('');
  if(S.selecionado && rows.some(e=>e.id===S.selecionado.id)) $('devolucaoEquipamento').value = S.selecionado.id;
}
function selecionarEquipamento(){
  S.selecionado = equipamentoSelecionado();
  const eq = S.selecionado;
  if(eq){
    if(eq.tecnico_atual) $('devolucaoTecnico').value = eq.tecnico_atual;
    if(eq.os_atual) $('devolucaoOs').value = eq.os_atual;
  }
  renderPreview();
}
function ajustarDestinoPorCondicao(doRender=true){
  const destino = destinoPorCondicao($('devolucaoCondicao')?.value);
  if($('devolucaoDestino')) $('devolucaoDestino').value = destino;
  if(doRender) renderPreview();
}

function payload(){
  const eq = equipamentoSelecionado();
  const tecnico = norm($('devolucaoTecnico').value || eq?.tecnico_atual);
  const condicao = norm($('devolucaoCondicao').value) || 'Testar';
  const destino = norm($('devolucaoDestino').value) || destinoPorCondicao(condicao);
  const os = norm($('devolucaoOs').value || eq?.os_atual);
  const motivo = norm($('devolucaoMotivo').value) || 'Devolução operacional';
  const obs = norm($('devolucaoObs').value);
  if(!eq) throw new Error('Selecione um equipamento para devolução.');
  if(!isElegivelDevolucao(eq)) throw new Error('Esse equipamento não está elegível para devolução.');
  if(!condicao) throw new Error('Selecione a condição do equipamento.');
  if(!destino) throw new Error('Informe o destino da devolução.');
  return { eq, tecnico, condicao, destino, os, motivo, obs };
}

function resumoHtml(p){
  return `
    <div class="item"><div><b>${esc(p.eq.codigo || '-')} • ${esc(nomeEq(p.eq))}</b><br><small>${esc(p.eq.mac || p.eq.serial || 'Sem MAC/SN')}</small></div><span class="badge">${esc(p.eq.status || '-')}</span></div>
    <div class="item"><div><b>Atual</b><br><small>${esc([p.eq.tecnico_atual,p.eq.cliente_atual,p.eq.local].filter(Boolean).join(' • ') || 'Não informado')}</small></div></div>
    <div class="item"><div><b>Condição</b><br><small>${esc(p.condicao)}</small></div><span class="badge">${esc(p.destino)}</span></div>
    <div class="item"><div><b>Técnico / OS</b><br><small>${esc([p.tecnico,p.os].filter(Boolean).join(' • ') || 'Não informado')}</small></div></div>
    <div class="item"><div><b>Motivo / Observação</b><br><small>${esc([p.motivo,p.obs].filter(Boolean).join(' • ') || 'Sem observação')}</small></div></div>`;
}
function renderPreview(){
  let p;
  try{ p = payload(); }
  catch(e){ $('devolucaoPreview').innerHTML = `<div class="item"><b>Pendente</b><small>${esc(e.message)}</small></div>`; $('devolucaoRegra').textContent = e.message; return; }
  $('devolucaoRegra').textContent = 'Revise os dados antes de confirmar a devolução.';
  $('devolucaoPreview').innerHTML = resumoHtml(p);
}
function abrirConfirmacao(ev){
  ev.preventDefault();
  try{
    const p = payload();
    $('devolucaoModalResumo').innerHTML = resumoHtml(p);
    $('devolucaoModal').style.display = 'flex';
  }catch(e){ msg(e.message,'bad'); renderPreview(); }
}
function fecharModal(){ $('devolucaoModal').style.display = 'none'; }
async function confirmarDevolucao(){
  try{
    const p = payload();
    $('devolucaoConfirmar').disabled = true;
    msg('Registrando devolução via RPC...', 'warn');
    const result = first(await call('rpc_registrar_devolucao_equipamento', {
      p_equipamento_id: p.eq.id,
      p_tecnico: p.tecnico,
      p_condicao: p.condicao,
      p_destino: p.destino,
      p_os: p.os,
      p_motivo: p.motivo,
      p_observacao: p.obs,
      p_client_operation_id: opId()
    }));
    fecharModal();
    msg(`Devolução registrada. Status: ${result?.status || 'atualizado'}.`, 'ok');
    limparForm(false);
    await loadDevolucao();
  }catch(e){ msg(e.message || String(e),'bad'); }
  finally{ $('devolucaoConfirmar').disabled = false; }
}

function limparForm(show=true){
  ['devolucaoBuscaEquipamento','devolucaoEquipamento','devolucaoTecnico','devolucaoOs','devolucaoMotivo','devolucaoObs'].forEach(id=>{ if($(id)) $(id).value=''; });
  if($('devolucaoCondicao')) $('devolucaoCondicao').value='Testar';
  ajustarDestinoPorCondicao(false);
  S.selecionado = null;
  renderEquipSelect();
  renderPreview();
  if(show) msg('Formulário limpo.', 'ok');
}
function renderTabela(){
  const filtro = ($('devolucaoFiltroTabela')?.value || '').toLowerCase();
  const rows = equipamentosElegiveis().filter(e => !filtro || JSON.stringify(e).toLowerCase().includes(filtro)).slice(0,80);
  $('devolucaoTbody').innerHTML = rows.map(e=>`
    <tr>
      <td><b>${esc(e.codigo || '-')}</b></td>
      <td>${esc(nomeEq(e))}</td>
      <td>${esc(e.mac || e.serial || '-')}</td>
      <td><span class="badge">${esc(e.status || '-')}</span></td>
      <td>${esc([e.tecnico_atual,e.cliente_atual,e.local].filter(Boolean).join(' • ') || '-')}</td>
      <td>${esc(e.os_atual || '-')}</td>
      <td><button class="secondary" data-devolucao-eq="${e.id}">Selecionar</button></td>
    </tr>`).join('') || '<tr><td colspan="7">Nenhum equipamento elegível para devolução.</td></tr>';
}

inject();
window.devolucaoCleanLoad = loadDevolucao;
