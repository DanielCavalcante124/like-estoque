import { table, call, first } from './api.js?v=3';

const S = { equipamentos: [], tecnicos: [], locais: [], selecionado: null };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const opId = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
const ativo = (x) => x && x.ativo !== false;
const norm = (v) => String(v || '').trim();

function msg(text, type=''){
  const el = $('saidaMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeEq(e){ return [e.tipo,e.marca,e.modelo].filter(Boolean).join(' '); }
function identificacao(e){ return [e.codigo, e.mac, e.serial, nomeEq(e)].filter(Boolean).join(' • '); }
function isDisponivel(e){
  const status = String(e.status || '').toLowerCase();
  const blocked = ['inutilizado','perdido','baixado','manutenção','em manutenção','em manutencao','com técnico','instalado cliente','instalado no cliente','na rua'];
  if(!ativo(e)) return false;
  if(blocked.includes(status)) return false;
  return status === 'em estoque' || status === 'reservado' || !status;
}
function destinoPadrao(tipo){
  if(tipo === 'Enviar para técnico') return $('saidaTecnico')?.value || '';
  if(tipo === 'Instalação cliente') return $('saidaCliente')?.value || 'Cliente';
  if(tipo === 'Enviar para rua') return 'Rua';
  if(tipo === 'Reservar para OS') return 'Reservado';
  if(tipo === 'Enviar para manutenção') return 'Manutenção';
  return '';
}

function inject(){
  if(!$('navSaidaClean')){
    const ref = $('navRetornoSemCadastroClean') || $('navEntradaLoteClean') || $('navEntradaClean') || document.querySelector('[data-page="cadastros"]');
    const btn = document.createElement('button');
    btn.id = 'navSaidaClean';
    btn.className = 'nav';
    btn.textContent = 'Saída';
    btn.onclick = showPage;
    ref ? ref.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-saida-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-saida-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Saída de equipamento</h2>
            <p>Movimenta equipamento disponível para técnico, cliente, rua, reserva ou manutenção via RPC.</p>
          </div>
          <button id="saidaReload" class="secondary">Recarregar dados</button>
        </div>
        <div id="saidaMsg" class="msg"></div>
      </div>

      <div class="grid two">
        <form id="saidaForm" class="card form-card">
          <h2>Dados da saída</h2>
          <input id="saidaBuscaEquipamento" placeholder="Buscar equipamento por código, MAC, SN, modelo ou local">
          <select id="saidaEquipamento"></select>
          <div class="form-grid two">
            <select id="saidaTipo">
              <option value="Enviar para técnico">Enviar para técnico</option>
              <option value="Instalação cliente">Instalação cliente</option>
              <option value="Enviar para rua">Enviar para rua</option>
              <option value="Reservar para OS">Reservar para OS</option>
              <option value="Enviar para manutenção">Enviar para manutenção</option>
            </select>
            <select id="saidaTecnico"></select>
          </div>
          <div class="form-grid two">
            <input id="saidaCliente" placeholder="Cliente / endereço / identificação">
            <input id="saidaOs" placeholder="OS / Atendimento">
          </div>
          <div class="form-grid two">
            <input id="saidaDestino" placeholder="Destino">
            <input id="saidaMotivo" placeholder="Motivo">
          </div>
          <input id="saidaObs" placeholder="Observação">
          <div class="actions">
            <button class="primary" type="submit">Revisar saída</button>
            <button class="secondary" id="saidaLimpar" type="button">Limpar</button>
          </div>
        </form>

        <div class="card">
          <h2>Resumo antes de confirmar</h2>
          <div id="saidaPreview" class="list"></div>
          <div id="saidaRegra" class="msg show warn">Selecione um equipamento disponível.</div>
        </div>
      </div>

      <div class="card">
        <div class="table-head">
          <h2>Equipamentos disponíveis para saída</h2>
          <input id="saidaFiltroTabela" placeholder="Filtrar lista">
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Equipamento</th><th>MAC/SN</th><th>Status</th><th>Local</th><th>Ação</th></tr></thead>
            <tbody id="saidaTbody"></tbody>
          </table>
        </div>
      </div>

      <div id="saidaModal" class="modal-clean" style="display:none">
        <div class="modal-clean-box">
          <h2>Confirmar saída</h2>
          <div id="saidaModalResumo" class="list"></div>
          <div class="actions">
            <button id="saidaConfirmar" class="primary" type="button">Confirmar saída</button>
            <button id="saidaCancelar" class="secondary" type="button">Cancelar</button>
          </div>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
    ensureStyle();
  }

  $('saidaReload').onclick = () => loadSaida().catch(e=>msg(e.message,'bad'));
  $('saidaForm').onsubmit = abrirConfirmacao;
  $('saidaLimpar').onclick = limparForm;
  $('saidaBuscaEquipamento').oninput = renderEquipSelect;
  $('saidaEquipamento').onchange = () => { S.selecionado = equipamentoSelecionado(); renderPreview(); };
  $('saidaTipo').onchange = () => { ajustarCamposPorTipo(); renderPreview(); };
  $('saidaTecnico').onchange = () => { ajustarDestino(); renderPreview(); };
  ['saidaCliente','saidaOs','saidaDestino','saidaMotivo','saidaObs','saidaFiltroTabela'].forEach(id=>{
    const el=$(id); if(el) el.addEventListener('input',()=>{ if(id==='saidaFiltroTabela') renderTabela(); else { ajustarDestino(false); renderPreview(); } });
  });
  $('saidaCancelar').onclick = fecharModal;
  $('saidaConfirmar').onclick = confirmarSaida;
  document.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-saida-eq]');
    if(!btn) return;
    $('saidaEquipamento').value = btn.dataset.saidaEq;
    S.selecionado = equipamentoSelecionado();
    renderPreview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function ensureStyle(){
  if($('saidaModalStyle')) return;
  const st = document.createElement('style');
  st.id = 'saidaModalStyle';
  st.textContent = `.modal-clean{position:fixed;inset:0;background:rgba(15,23,42,.62);z-index:9999;display:flex;align-items:center;justify-content:center;padding:18px}.modal-clean-box{background:#fff;border-radius:20px;max-width:720px;width:100%;padding:22px;box-shadow:0 30px 80px rgba(0,0,0,.35)}.modal-clean-box h2{margin-top:0}`;
  document.head.appendChild(st);
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navSaidaClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-saida-clean'));
  const title = $('pageTitle');
  if(title) title.textContent = 'Saída';
  loadSaida().catch(e=>msg(e.message,'bad'));
}

async function loadSaida(){
  msg('Carregando equipamentos disponíveis...', 'warn');
  S.equipamentos = await table('equipamentos','created_at',false);
  S.tecnicos = await table('tecnicos','nome',true);
  S.locais = await table('locais','nome',true);
  fillTecnicos();
  renderEquipSelect();
  renderTabela();
  renderPreview();
  msg('Saída pronta para uso.', 'ok');
}

function fillTecnicos(){
  const tecnicos = S.tecnicos.filter(ativo);
  $('saidaTecnico').innerHTML = '<option value="">Selecionar técnico</option>' + tecnicos.map(t=>`<option value="${esc(t.nome)}">${esc(t.nome)}</option>`).join('');
}
function equipamentosDisponiveis(){ return S.equipamentos.filter(isDisponivel); }
function equipamentoSelecionado(){ return S.equipamentos.find(e=>e.id===$('saidaEquipamento')?.value); }
function renderEquipSelect(){
  const filtro = ($('saidaBuscaEquipamento')?.value || '').toLowerCase();
  const rows = equipamentosDisponiveis().filter(e => !filtro || JSON.stringify(e).toLowerCase().includes(filtro)).slice(0,200);
  $('saidaEquipamento').innerHTML = '<option value="">Selecionar equipamento disponível</option>' + rows.map(e=>`<option value="${e.id}">${esc(identificacao(e))}</option>`).join('');
  if(S.selecionado && rows.some(e=>e.id===S.selecionado.id)) $('saidaEquipamento').value = S.selecionado.id;
}

function ajustarCamposPorTipo(){
  const tipo = $('saidaTipo').value;
  if(tipo === 'Enviar para manutenção'){
    $('saidaTecnico').value = '';
    $('saidaCliente').value = '';
    $('saidaOs').value = '';
    $('saidaDestino').value = 'Manutenção';
    $('saidaMotivo').value = $('saidaMotivo').value || 'Teste/manutenção';
  } else if(tipo === 'Enviar para rua'){
    $('saidaDestino').value = 'Rua';
    $('saidaMotivo').value = $('saidaMotivo').value || 'Equipamento enviado para campo';
  } else if(tipo === 'Reservar para OS'){
    $('saidaDestino').value = 'Reservado';
    $('saidaMotivo').value = $('saidaMotivo').value || 'Reserva operacional';
  } else {
    ajustarDestino();
  }
}
function ajustarDestino(overwrite=true){
  const tipo = $('saidaTipo').value;
  const atual = norm($('saidaDestino').value);
  const dest = destinoPadrao(tipo);
  if(overwrite || !atual) $('saidaDestino').value = dest;
}

function payload(){
  const eq = equipamentoSelecionado();
  const tipo = $('saidaTipo').value;
  const tecnico = norm($('saidaTecnico').value);
  const cliente = norm($('saidaCliente').value);
  const os = norm($('saidaOs').value);
  const destino = norm($('saidaDestino').value) || destinoPadrao(tipo);
  const motivo = norm($('saidaMotivo').value);
  const obs = norm($('saidaObs').value);
  if(!eq) throw new Error('Selecione um equipamento disponível.');
  if(!isDisponivel(eq)) throw new Error('Esse equipamento não está disponível para saída.');
  if(tipo === 'Enviar para técnico' && !tecnico) throw new Error('Selecione o técnico.');
  if(tipo === 'Instalação cliente'){
    if(!tecnico) throw new Error('Selecione o técnico responsável pela instalação.');
    if(!cliente) throw new Error('Informe o cliente/endereço.');
    if(!os) throw new Error('Informe a OS/atendimento.');
  }
  if(tipo === 'Enviar para rua' && !tecnico) throw new Error('Selecione o técnico responsável pelo equipamento na rua.');
  if(tipo === 'Reservar para OS' && !os) throw new Error('Informe a OS da reserva.');
  if(!destino) throw new Error('Informe o destino.');
  return { eq, tipo, tecnico, cliente, os, destino, motivo, obs };
}

function resumoHtml(p){
  return `
    <div class="item"><div><b>${esc(p.eq.codigo || '-')} • ${esc(nomeEq(p.eq))}</b><br><small>${esc(p.eq.mac || p.eq.serial || 'Sem MAC/SN')}</small></div><span class="badge">${esc(p.eq.status || '-')}</span></div>
    <div class="item"><div><b>Movimento</b><br><small>${esc(p.tipo)}</small></div><span class="badge">${esc(p.destino)}</span></div>
    <div class="item"><div><b>Técnico</b><br><small>${esc(p.tecnico || 'Não informado')}</small></div></div>
    <div class="item"><div><b>Cliente / OS</b><br><small>${esc([p.cliente,p.os].filter(Boolean).join(' • ') || 'Não informado')}</small></div></div>
    <div class="item"><div><b>Motivo / Observação</b><br><small>${esc([p.motivo,p.obs].filter(Boolean).join(' • ') || 'Sem observação')}</small></div></div>`;
}
function renderPreview(){
  let p;
  try{ p = payload(); }
  catch(e){ $('saidaPreview').innerHTML = `<div class="item"><b>Pendente</b><small>${esc(e.message)}</small></div>`; $('saidaRegra').textContent = e.message; return; }
  $('saidaRegra').textContent = 'Revise os dados antes de confirmar a saída.';
  $('saidaPreview').innerHTML = resumoHtml(p);
}
function abrirConfirmacao(ev){
  ev.preventDefault();
  try{
    const p = payload();
    $('saidaModalResumo').innerHTML = resumoHtml(p);
    $('saidaModal').style.display = 'flex';
  }catch(e){ msg(e.message,'bad'); renderPreview(); }
}
function fecharModal(){ $('saidaModal').style.display = 'none'; }
async function confirmarSaida(){
  try{
    const p = payload();
    $('saidaConfirmar').disabled = true;
    msg('Registrando saída via RPC...', 'warn');
    const result = first(await call('rpc_registrar_saida_equipamento', {
      p_equipamento_id: p.eq.id,
      p_mov_tipo: p.tipo,
      p_tecnico: p.tecnico,
      p_destino: p.destino,
      p_cliente: p.cliente,
      p_os: p.os,
      p_motivo: p.motivo,
      p_observacao: p.obs,
      p_client_operation_id: opId()
    }));
    fecharModal();
    msg(`Saída registrada. Status: ${result?.status || 'atualizado'}.`, 'ok');
    limparForm(false);
    await loadSaida();
  }catch(e){ msg(e.message || String(e),'bad'); }
  finally{ $('saidaConfirmar').disabled = false; }
}

function limparForm(show=true){
  ['saidaBuscaEquipamento','saidaEquipamento','saidaTecnico','saidaCliente','saidaOs','saidaDestino','saidaMotivo','saidaObs'].forEach(id=>{ if($(id)) $(id).value=''; });
  if($('saidaTipo')) $('saidaTipo').value='Enviar para técnico';
  S.selecionado = null;
  renderEquipSelect();
  renderPreview();
  if(show) msg('Formulário limpo.', 'ok');
}
function renderTabela(){
  const filtro = ($('saidaFiltroTabela')?.value || '').toLowerCase();
  const rows = equipamentosDisponiveis().filter(e => !filtro || JSON.stringify(e).toLowerCase().includes(filtro)).slice(0,80);
  $('saidaTbody').innerHTML = rows.map(e=>`
    <tr>
      <td><b>${esc(e.codigo || '-')}</b></td>
      <td>${esc(nomeEq(e))}</td>
      <td>${esc(e.mac || e.serial || '-')}</td>
      <td><span class="badge">${esc(e.status || '-')}</span></td>
      <td>${esc(e.local || '-')}</td>
      <td><button class="secondary" data-saida-eq="${e.id}">Selecionar</button></td>
    </tr>`).join('') || '<tr><td colspan="6">Nenhum equipamento disponível para saída.</td></tr>';
}

inject();
window.saidaCleanLoad = loadSaida;
