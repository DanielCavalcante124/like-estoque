import { table, call } from './api.js?v=3';

const S = { equipamentos: [], tecnicos: [], locais: [], filtro: '' };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const br = (v) => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const opId = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
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

function msg(text, type=''){
  const el = $('eqCleanMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
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
            <p>Versão limpa. Editar, baixar, saída e devolução passam por RPC no Supabase.</p>
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
      <td>${esc([e.tipo,e.marca,e.modelo].filter(Boolean).join(' '))}</td>
      <td>${esc(e.mac || e.serial || '-')}</td>
      <td><span class="badge">${esc(e.status)}</span></td>
      <td>${esc(e.local || '-')}</td>
      <td>${esc(e.tecnico_atual || '-')}</td>
      <td>${esc(e.cliente_atual || '-')}<br><small>${esc(e.os_atual || '')}</small></td>
      <td>${br(e.custo)}</td>
      <td>
        <button class="secondary" data-edit-eq="${e.id}">Editar</button>
        ${isAtivo(e) ? `<button class="warn" data-saida-eq="${e.id}">Saída</button><button class="secondary" data-dev-eq="${e.id}">Devolução</button><button class="danger" data-baixar-eq="${e.id}">Baixar</button>` : '<span class="badge">Inativo</span>'}
      </td>
    </tr>`).join('') || '<tr><td colspan="9">Nenhum equipamento encontrado.</td></tr>';
}

function getEq(id){
  const e = S.equipamentos.find(x=>x.id===id);
  if(!e) throw new Error('Equipamento não encontrado na lista carregada.');
  return e;
}

async function editarEq(id){
  const e = getEq(id);
  const status = prompt('Status:', e.status || ''); if(status === null) return;
  const local = prompt('Local:', e.local || ''); if(local === null) return;
  const tecnico = prompt('Técnico atual:', e.tecnico_atual || ''); if(tecnico === null) return;
  const cliente = prompt('Cliente/local atual:', e.cliente_atual || ''); if(cliente === null) return;
  const os = prompt('OS/Contrato:', e.os_atual || ''); if(os === null) return;
  const motivo = prompt('Motivo/observação atual:', e.motivo_atual || ''); if(motivo === null) return;
  const custo = prompt('Custo:', e.custo || 0); if(custo === null) return;
  msg('Editando equipamento via RPC...', 'warn');
  await call('rpc_editar_equipamento_admin', {
    p_equipamento_id: id,
    p_status: status.trim(),
    p_local: local.trim(),
    p_tecnico_atual: tecnico.trim(),
    p_cliente_atual: cliente.trim(),
    p_os_atual: os.trim(),
    p_motivo_atual: motivo.trim(),
    p_custo: Number(custo || 0),
    p_observacao: 'Edição pela tela limpa de equipamentos',
    p_client_operation_id: opId()
  });
  await loadEquipamentos();
  msg('Equipamento editado com movimento e auditoria.', 'ok');
}

async function baixarEq(id){
  const e = getEq(id);
  const motivo = prompt('Motivo da baixa de '+(e.codigo || id)+':', e.motivo_baixa || e.motivo_atual || '');
  if(motivo === null) return;
  if(!motivo.trim()) throw new Error('Informe o motivo da baixa.');
  msg('Baixando equipamento via RPC...', 'warn');
  await call('rpc_baixar_equipamento', { p_equipamento_id:id, p_motivo:motivo.trim(), p_client_operation_id:opId() });
  await loadEquipamentos();
  msg('Equipamento baixado com histórico preservado.', 'ok');
}

async function saidaEq(id){
  const e = getEq(id);
  const movTipo = prompt('Tipo de saída:', 'Saída para técnico'); if(movTipo === null) return;
  const tecnico = prompt('Técnico:', e.tecnico_atual || ''); if(tecnico === null) return;
  const destino = prompt('Destino/local:', e.local || 'Técnico'); if(destino === null) return;
  const cliente = prompt('Cliente/local do cliente:', e.cliente_atual || ''); if(cliente === null) return;
  const os = prompt('OS/Contrato:', e.os_atual || ''); if(os === null) return;
  const motivo = prompt('Motivo:', e.motivo_atual || ''); if(motivo === null) return;
  const obs = prompt('Observação:', 'Saída pela tela limpa de equipamentos'); if(obs === null) return;
  msg('Registrando saída via RPC...', 'warn');
  await call('rpc_registrar_saida_equipamento', {
    p_equipamento_id:id,
    p_mov_tipo:movTipo.trim(),
    p_tecnico:tecnico.trim(),
    p_destino:destino.trim(),
    p_cliente:cliente.trim(),
    p_os:os.trim(),
    p_motivo:motivo.trim(),
    p_observacao:obs.trim(),
    p_client_operation_id:opId()
  });
  await loadEquipamentos();
  msg('Saída registrada com segurança.', 'ok');
}

async function devolucaoEq(id){
  const e = getEq(id);
  const tecnico = prompt('Técnico que devolveu:', e.tecnico_atual || ''); if(tecnico === null) return;
  const condicao = prompt('Condição de retorno:', 'Usado funcionando'); if(condicao === null) return;
  const destino = prompt('Destino:', 'Estoque central'); if(destino === null) return;
  const os = prompt('OS/Contrato:', e.os_atual || ''); if(os === null) return;
  const motivo = prompt('Motivo:', 'Devolução pela tela limpa'); if(motivo === null) return;
  const obs = prompt('Observação:', 'Devolução pela tela limpa de equipamentos'); if(obs === null) return;
  msg('Registrando devolução via RPC...', 'warn');
  await call('rpc_registrar_devolucao_equipamento', {
    p_equipamento_id:id,
    p_tecnico:tecnico.trim(),
    p_condicao:condicao.trim(),
    p_destino:destino.trim(),
    p_os:os.trim(),
    p_motivo:motivo.trim(),
    p_observacao:obs.trim(),
    p_client_operation_id:opId()
  });
  await loadEquipamentos();
  msg('Devolução registrada com segurança.', 'ok');
}

document.addEventListener('click', async (ev)=>{
  const btn = ev.target.closest('button');
  if(!btn) return;
  try{
    if(btn.dataset.editEq) await editarEq(btn.dataset.editEq);
    if(btn.dataset.baixarEq) await baixarEq(btn.dataset.baixarEq);
    if(btn.dataset.saidaEq) await saidaEq(btn.dataset.saidaEq);
    if(btn.dataset.devEq) await devolucaoEq(btn.dataset.devEq);
  }catch(e){ msg(e.message || String(e), 'bad'); }
});

inject();
window.equipamentosCleanLoad = loadEquipamentos;
