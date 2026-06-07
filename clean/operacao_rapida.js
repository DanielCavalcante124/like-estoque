import { table, call } from './api.js?v=3';

const S = { equipamentos: [], saldos: [], tecnicos: [], cartEq: [], cartMat: [], filtro: '', confirmando: false };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const qtd = (v) => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const opId = () => globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8); return v.toString(16); });
const norm = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const key = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');

const FLUXOS = {
  saida: { nav:'navSaidaClean', load:'saidaCleanLoad', select:'saidaEquipamento', label:'Saída' },
  devolucao: { nav:'navDevolucaoClean', load:'devolucaoCleanLoad', select:'devolucaoEquipamento', label:'Devolução' },
  manutencao: { nav:'navManutencaoClean', load:'manutencaoCleanLoad', select:'manutencaoEquipamento', label:'Manutenção' },
  baixa: { nav:'navBaixaClean', load:'baixaCleanLoad', select:'baixaEquipamento', label:'Baixa' },
  historico: { nav:'navHistoricoClean', load:'historicoCleanLoad', select:'historicoEquipamento', form:'historicoForm', label:'Histórico' }
};

function msg(id, text, type=''){
  const el = $(id);
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeEq(e){ return [e.tipo,e.marca,e.modelo].filter(Boolean).join(' ') || e.codigo || '-'; }
function nomeMat(m){ return [m.tipo,m.marca,m.modelo].filter(Boolean).join(' ') || 'Material'; }
function eqStatus(e){ return norm(e?.status); }
function isEqAtivo(e){ return e && e.ativo !== false && !['baixado','inutilizado','perdido'].includes(eqStatus(e)); }
function isEqDisponivel(e){ return isEqAtivo(e) && ['em estoque','reservado'].includes(eqStatus(e)); }
function isEqComTecnico(e){ return isEqAtivo(e) && (eqStatus(e) === 'com tecnico' || !!e.tecnico_atual); }
function isEqCliente(e){ return isEqAtivo(e) && ['instalado cliente','instalado no cliente','na rua'].includes(eqStatus(e)); }
function isMatCentral(m){ return !m.tecnico && norm(m.local).includes('estoque') && Number(m.quantidade || 0) > 0; }
function matRegraFechado(m){ return norm(m.categoria).includes('material fechado'); }
function textEq(e){ return [e.codigo,e.patrimonio,e.tipo,e.marca,e.modelo,e.mac,e.serial,e.status,e.local,e.tecnico_atual,e.cliente_atual,e.os_atual,e.motivo_atual].join(' '); }
function textMat(m){ return [m.tipo,m.marca,m.modelo,m.categoria,m.unidade_saida,m.local,m.tecnico,m.quantidade].join(' '); }
function exactEq(q){ const k = key(q); return S.equipamentos.find(e => [e.mac,e.serial,e.codigo,e.patrimonio].some(v => key(v) === k)); }
function saldoById(id){ return S.saldos.find(m => m.id === id); }
function eqById(id){ return S.equipamentos.find(e => e.id === id); }

function injectCss(){
  if($('opRapidaCss')) return;
  const s = document.createElement('style');
  s.id = 'opRapidaCss';
  s.textContent = `
    .op-hero{background:linear-gradient(135deg,#0d1b2e,#0f4c81);color:#fff;border-radius:22px;padding:20px;margin-bottom:14px}
    .op-hero h2{margin:0 0 6px}.op-hero p{margin:0;color:#dbeafe}
    .op-search{font-size:18px;padding:15px;border:2px solid #0f4c81}
    .op-result{border:1px solid #e5e7eb;border-radius:16px;padding:14px;margin:10px 0;background:#fff}
    .op-result.blocked{border-left:6px solid #dc2626}.op-result.warn{border-left:6px solid #f59e0b}.op-result.ok{border-left:6px solid #16a34a}
    .op-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}.op-actions button{width:100%;margin:0}
    .op-mini{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:8px}.op-mini div{background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:8px;min-width:0}.op-mini b,.op-mini small{overflow-wrap:anywhere}
    .op-cart-item{border:1px solid #e5e7eb;border-radius:12px;padding:10px;margin:8px 0;background:#f8fafc}
    .op-cart-item .row{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    .op-qty{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-top:8px}.op-qty input{margin:0}.op-qty button{margin:0}
    @media(max-width:900px){.op-actions,.op-mini{grid-template-columns:1fr 1fr}.op-qty{grid-template-columns:1fr}}
    @media(max-width:520px){.op-actions,.op-mini{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}

function inject(){
  injectCss();
  if(!$('navOperacaoRapidaClean')){
    const dash = document.querySelector('[data-page="dashboard"]');
    const btn = document.createElement('button');
    btn.id = 'navOperacaoRapidaClean';
    btn.className = 'nav';
    btn.textContent = 'Operação rápida';
    btn.onclick = showPage;
    dash ? dash.insertAdjacentElement('beforebegin', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-operacao-rapida-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-operacao-rapida-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="op-hero">
        <h2>Operação rápida</h2>
        <p>Bipe ou pesquise equipamentos e materiais, monte o carrinho e confirme a saída para técnico em lote.</p>
      </div>

      <div class="grid two">
        <div class="card">
          <div class="table-head">
            <h2>Busca universal</h2>
            <button id="opRapidaReload" class="secondary">Atualizar dados</button>
          </div>
          <input id="opRapidaBusca" class="op-search" placeholder="Bipe ou digite MAC, SN, código, patrimônio, técnico, cliente, OS, modelo ou material">
          <div id="opRapidaMsg" class="msg show">Digite ou bipe para pesquisar.</div>
          <div id="opRapidaResultados"></div>
        </div>

        <div class="card">
          <h2>Carrinho de saída</h2>
          <select id="opRapidaTecnico"></select>
          <input id="opRapidaOs" placeholder="OS/Referência opcional">
          <input id="opRapidaObs" placeholder="Observação opcional">
          <div class="actions">
            <button id="opRapidaConfirmar" class="primary">Confirmar saída</button>
            <button id="opRapidaCopiar" class="secondary">Copiar WhatsApp</button>
            <button id="opRapidaLimpar" class="danger">Limpar</button>
          </div>
          <div id="opRapidaCartMsg" class="msg show">Carrinho vazio.</div>
          <div id="opRapidaCarrinho"></div>
        </div>
      </div>

      <div class="kpis">
        <div class="kpi"><small>Equipamentos no carrinho</small><b id="opKEq">0</b></div>
        <div class="kpi"><small>Materiais no carrinho</small><b id="opKMat">0</b></div>
        <div class="kpi"><small>Disponíveis em estoque</small><b id="opKEstoque">0</b></div>
        <div class="kpi"><small>Com técnicos</small><b id="opKTec">0</b></div>
        <div class="kpi"><small>Materiais centrais</small><b id="opKMatCentral">0</b></div>
        <div class="kpi"><small>Alertas</small><b id="opKAlertas">0</b></div>
      </div>

      <div class="grid two">
        <div class="card">
          <h2>Alertas rápidos</h2>
          <div id="opRapidaAlertas" class="list"></div>
        </div>
        <div class="card">
          <h2>Atalhos</h2>
          <div class="actions">
            <button class="secondary" data-op-nav="navEntradaClean">Entrada</button>
            <button class="secondary" data-op-nav="navEntradaLoteClean">Entrada em lote</button>
            <button class="secondary" data-op-nav="navMateriaisClean">Materiais</button>
            <button class="secondary" data-op-nav="navDevolucaoClean">Devolução</button>
            <button class="secondary" data-op-nav="navHistoricoClean">Histórico</button>
            <button class="secondary" data-op-nav="navRelatoriosClean">Relatórios</button>
          </div>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  $('opRapidaReload').onclick = () => load().catch(e => msg('opRapidaMsg', e.message, 'bad'));
  $('opRapidaBusca').oninput = pesquisar;
  $('opRapidaBusca').onkeyup = (ev) => { if(ev.key === 'Enter') autoAddScan(); };
  $('opRapidaConfirmar').onclick = confirmar;
  $('opRapidaCopiar').onclick = () => copiarWhatsApp(true);
  $('opRapidaLimpar').onclick = limparCarrinho;
  document.querySelectorAll('[data-op-nav]').forEach(b => b.onclick = () => $(b.dataset.opNav)?.click());
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navOperacaoRapidaClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-operacao-rapida-clean'));
  if($('pageTitle')) $('pageTitle').textContent = 'Operação rápida';
  load().catch(e => msg('opRapidaMsg', e.message, 'bad'));
}

async function load(){
  msg('opRapidaMsg','Carregando dados da operação...', 'warn');
  S.equipamentos = await table('equipamentos','created_at',false);
  S.saldos = await table('materiais_saldos','tipo',true);
  S.tecnicos = await table('tecnicos','nome',true);
  fillTecnicos();
  renderCart();
  renderResumo();
  pesquisar();
  msg('opRapidaMsg','Dados atualizados. Pode bipar ou pesquisar.', 'ok');
}

function fillTecnicos(){
  const el = $('opRapidaTecnico');
  if(!el) return;
  const old = el.value;
  const nomes = [...new Set([
    ...S.tecnicos.filter(t => t.ativo !== false).map(t => t.nome),
    ...S.equipamentos.map(e => e.tecnico_atual)
  ].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  el.innerHTML = '<option value="">Selecione o técnico</option>' + nomes.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
  if(nomes.includes(old)) el.value = old;
}

function pesquisar(){
  const out = $('opRapidaResultados');
  if(!out) return;
  const q = ($('opRapidaBusca')?.value || '').trim();
  if(!q){
    out.innerHTML = '';
    msg('opRapidaMsg','Digite ou bipe para pesquisar.', '');
    return;
  }
  const k = key(q);
  const eqs = S.equipamentos.filter(e => key(textEq(e)).includes(k)).slice(0,15);
  const mats = S.saldos.filter(m => key(textMat(m)).includes(k)).slice(0,15);
  msg('opRapidaMsg', `Encontrado(s): ${eqs.length} equipamento(s) e ${mats.length} material(is).`, (eqs.length || mats.length) ? 'ok' : 'bad');
  out.innerHTML = eqs.map(cardEq).join('') + mats.map(cardMat).join('') || '<div class="msg show bad">Nenhum item encontrado.</div>';
}

function statusInfo(e){
  if(isEqDisponivel(e)) return ['Disponível para saída','ok'];
  if(isEqCliente(e)) return ['Instalado/rua/cliente','warn'];
  if(isEqComTecnico(e)) return ['Em posse de técnico','warn'];
  if(!isEqAtivo(e)) return ['Baixado/inativo','blocked'];
  return ['Bloqueado para saída','blocked'];
}
function cardEq(e){
  const [info, cls] = statusInfo(e);
  const disabled = !isEqDisponivel(e);
  return `<div class="op-result ${cls}">
    <h3>${esc(e.codigo || '-')} • ${esc(nomeEq(e))}</h3>
    <p><span class="badge">${esc(e.status || '-')}</span> <span class="badge">${esc(info)}</span></p>
    <div class="op-mini">
      <div><small>MAC</small><br><b>${esc(e.mac || '-')}</b></div>
      <div><small>SN</small><br><b>${esc(e.serial || '-')}</b></div>
      <div><small>Patrimônio</small><br><b>${esc(e.patrimonio || '-')}</b></div>
      <div><small>Técnico</small><br><b>${esc(e.tecnico_atual || '-')}</b></div>
    </div>
    <div class="op-actions">
      <button class="primary" data-op-add-eq="${esc(e.id)}" ${disabled?'disabled':''}>Adicionar</button>
      <button class="secondary" data-op-open-historico="${esc(e.id)}">Histórico</button>
      <button class="secondary" data-op-open-devolucao="${esc(e.id)}">Devolução</button>
      <button class="secondary" data-op-open-manutencao="${esc(e.id)}">Manutenção</button>
    </div>
  </div>`;
}
function cardMat(m){
  const central = isMatCentral(m);
  const id = esc(m.id);
  return `<div class="op-result ${central?'ok':'warn'}">
    <h3>${esc(nomeMat(m))}</h3>
    <p><span class="badge">${esc(m.categoria || 'Material')}</span> <span class="badge">${esc(m.local || '-')}</span></p>
    <div class="op-mini">
      <div><small>Saldo</small><br><b>${qtd(m.quantidade)}</b></div>
      <div><small>Unidade</small><br><b>${esc(m.unidade_saida || '-')}</b></div>
      <div><small>Técnico</small><br><b>${esc(m.tecnico || '-')}</b></div>
      <div><small>Regra</small><br><b>${matRegraFechado(m) ? 'Inteiro' : 'Quantidade'}</b></div>
    </div>
    <div class="op-qty">
      <input id="opQtdMat_${id}" type="number" min="0.001" step="0.001" placeholder="Quantidade" ${central?'':'disabled'}>
      <button class="primary" data-op-add-mat="${id}" ${central?'':'disabled'}>Adicionar material</button>
    </div>
  </div>`;
}

function addEq(id){
  const e = eqById(id);
  if(!e) return msg('opRapidaCartMsg','Equipamento não encontrado.', 'bad');
  if(!isEqDisponivel(e)) return msg('opRapidaCartMsg', `Bloqueado: ${e.codigo || '-'} está com status ${e.status || '-'}.`, 'bad');
  if(S.cartEq.includes(id)) return msg('opRapidaCartMsg','Equipamento já está no carrinho.', 'warn');
  S.cartEq.push(id);
  renderCart();
  msg('opRapidaCartMsg','Equipamento adicionado ao carrinho.', 'ok');
}
function addMat(id){
  const m = saldoById(id);
  if(!m) return msg('opRapidaCartMsg','Material não encontrado.', 'bad');
  if(!isMatCentral(m)) return msg('opRapidaCartMsg','Use apenas saldo do estoque central para enviar material.', 'bad');
  if(!m.modelo_id) return msg('opRapidaCartMsg','Material sem vínculo de modelo_id. Corrija o cadastro antes.', 'bad');
  const input = $(`opQtdMat_${id}`);
  const q = Number(input?.value || 0);
  if(!Number.isFinite(q) || q <= 0) return msg('opRapidaCartMsg','Informe uma quantidade válida.', 'bad');
  if(matRegraFechado(m) && q !== Math.trunc(q)) return msg('opRapidaCartMsg','Material fechado deve sair em quantidade inteira.', 'bad');
  const atual = S.cartMat.find(x => x.id === id);
  const total = (atual?.quantidade || 0) + q;
  if(total > Number(m.quantidade || 0)) return msg('opRapidaCartMsg', `Saldo insuficiente. Disponível: ${qtd(m.quantidade)} ${m.unidade_saida || ''}.`, 'bad');
  if(atual) atual.quantidade = total;
  else S.cartMat.push({ id, quantidade:q });
  if(input) input.value = '';
  renderCart();
  msg('opRapidaCartMsg','Material adicionado ao carrinho.', 'ok');
}
function removeEq(id){ S.cartEq = S.cartEq.filter(x => x !== id); renderCart(); }
function removeMat(id){ S.cartMat = S.cartMat.filter(x => x.id !== id); renderCart(); }

function renderCart(){
  const box = $('opRapidaCarrinho');
  if(!box) return;
  const eqHtml = S.cartEq.map(id => {
    const e = eqById(id);
    if(!e) return '';
    return `<div class="op-cart-item"><div class="row"><div><b>${esc(e.codigo || '-')}</b> • ${esc(nomeEq(e))}<br><small>${esc(e.mac || e.serial || '-')}</small></div><button class="danger" data-op-remove-eq="${esc(id)}">Remover</button></div></div>`;
  }).join('');
  const matHtml = S.cartMat.map(x => {
    const m = saldoById(x.id);
    if(!m) return '';
    return `<div class="op-cart-item"><div class="row"><div><b>${esc(nomeMat(m))}</b><br><small>${qtd(x.quantidade)} ${esc(m.unidade_saida || '')}</small></div><button class="danger" data-op-remove-mat="${esc(x.id)}">Remover</button></div></div>`;
  }).join('');
  box.innerHTML = eqHtml + matHtml || '<div class="msg show">Nenhum item no carrinho.</div>';
  $('opKEq') && ($('opKEq').textContent = S.cartEq.length);
  $('opKMat') && ($('opKMat').textContent = S.cartMat.length);
}

function renderResumo(){
  if(!$('opKEstoque')) return;
  const alertas = S.equipamentos.filter(e => !isEqAtivo(e) || ['manutencao','em manutencao','aguardando baixa','garantia'].includes(eqStatus(e))).length;
  $('opKEstoque').textContent = S.equipamentos.filter(isEqDisponivel).length;
  $('opKTec').textContent = S.equipamentos.filter(e => isEqComTecnico(e) && !isEqCliente(e)).length;
  $('opKMatCentral').textContent = S.saldos.filter(isMatCentral).length;
  $('opKAlertas').textContent = alertas;
  $('opRapidaAlertas').innerHTML = [
    ...S.equipamentos.filter(e => ['manutencao','em manutencao','aguardando baixa','garantia'].includes(eqStatus(e))).slice(0,5).map(e => `<div class="item"><div><b>${esc(e.codigo || '-')}</b><br><small>${esc(nomeEq(e))} • ${esc(e.status || '-')}</small></div><span class="badge">Conferir</span></div>`),
    ...S.saldos.filter(m => isMatCentral(m) && Number(m.quantidade || 0) <= 0).slice(0,5).map(m => `<div class="item"><div><b>${esc(nomeMat(m))}</b><br><small>Sem saldo central</small></div><span class="badge">Material</span></div>`)
  ].join('') || '<div class="msg show ok">Sem alerta crítico na visão rápida.</div>';
}

function buildWhatsApp(tecnico){
  const os = $('opRapidaOs')?.value.trim();
  const obs = $('opRapidaObs')?.value.trim();
  const linhas = [];
  linhas.push('📦 SAÍDA DE ESTOQUE');
  linhas.push('Técnico: ' + (tecnico || $('opRapidaTecnico')?.value || '-'));
  linhas.push('Data: ' + new Date().toLocaleDateString('pt-BR'));
  if(os) linhas.push('OS/Ref: ' + os);
  if(obs) linhas.push('Obs: ' + obs);
  linhas.push('');
  linhas.push('EQUIPAMENTOS:');
  const eqs = S.cartEq.map((id,i) => {
    const e = eqById(id);
    return e ? `${i+1}. ${e.codigo || '-'} | ${nomeEq(e)} | MAC/SN: ${e.mac || e.serial || '-'}` : '';
  }).filter(Boolean);
  linhas.push(eqs.join('\n') || 'Sem equipamentos.');
  linhas.push('');
  linhas.push('MATERIAIS:');
  const mats = S.cartMat.map(x => {
    const m = saldoById(x.id);
    return m ? `- ${nomeMat(m)}: ${qtd(x.quantidade)} ${m.unidade_saida || ''}` : '';
  }).filter(Boolean);
  linhas.push(mats.join('\n') || 'Sem materiais.');
  linhas.push('');
  linhas.push('Favor conferir e confirmar o recebimento.');
  return linhas.join('\n');
}
async function copiarWhatsApp(show=false){
  const texto = buildWhatsApp($('opRapidaTecnico')?.value || '');
  try{
    await navigator.clipboard.writeText(texto);
    if(show) msg('opRapidaCartMsg','Mensagem copiada para WhatsApp.', 'ok');
  }catch(e){
    window.prompt('Copie a mensagem:', texto);
  }
}

async function confirmar(){
  const btn = $('opRapidaConfirmar');
  if(S.confirmando) return;
  S.confirmando = true;
  if(btn){ btn.disabled = true; btn.textContent = 'Confirmando...'; }
  try{
    const tecnico = $('opRapidaTecnico')?.value || '';
    const os = $('opRapidaOs')?.value.trim() || '';
    const obs = $('opRapidaObs')?.value.trim() || '';
    if(!tecnico) throw new Error('Selecione o técnico.');
    if(!S.cartEq.length && !S.cartMat.length) throw new Error('Carrinho vazio.');

    for(const id of S.cartEq){
      const e = eqById(id);
      if(!isEqDisponivel(e)) throw new Error(`Item indisponível: ${e?.codigo || id} - ${e?.status || '-'}.`);
    }
    const materiais = S.cartMat.map(x => {
      const m = saldoById(x.id);
      if(!m) throw new Error('Material do carrinho não encontrado.');
      if(!m.modelo_id) throw new Error(`Material sem modelo_id: ${nomeMat(m)}.`);
      return { modelo_id: m.modelo_id, quantidade: x.quantidade };
    });

    msg('opRapidaCartMsg','Confirmando saída em lote via RPC...', 'warn');
    const result = await call('rpc_operacao_rapida_saida_lote', {
      p_equipamentos: S.cartEq,
      p_materiais: materiais,
      p_tecnico: tecnico,
      p_observacao: obs,
      p_os: os,
      p_client_operation_id: opId()
    });

    await copiarWhatsApp(false);
    S.cartEq = [];
    S.cartMat = [];
    $('opRapidaOs').value = '';
    $('opRapidaObs').value = '';
    await load();
    msg('opRapidaCartMsg', `Saída confirmada: ${result?.equipamentos_count || 0} equipamento(s) e ${result?.materiais_count || 0} material(is). Mensagem copiada.`, 'ok');
  }catch(e){
    msg('opRapidaCartMsg', e.message || String(e), 'bad');
  }finally{
    S.confirmando = false;
    if(btn){ btn.disabled = false; btn.textContent = 'Confirmar saída'; }
  }
}
function limparCarrinho(){ S.cartEq = []; S.cartMat = []; renderCart(); msg('opRapidaCartMsg','Carrinho limpo.', 'warn'); }
function autoAddScan(){
  const q = $('opRapidaBusca')?.value || '';
  const e = exactEq(q);
  if(e){ addEq(e.id); $('opRapidaBusca').value = ''; pesquisar(); return; }
  msg('opRapidaMsg','Nenhum equipamento exato encontrado para adicionar automaticamente.', 'warn');
}

async function abrirFluxo(tipo, id){
  const f = FLUXOS[tipo];
  if(!f) return;
  const nav = $(f.nav);
  if(!nav) return msg('opRapidaMsg', `Tela ${f.label} não encontrada.`, 'bad');
  nav.click();
  await sleep(250);
  if(typeof window[f.load] === 'function') await window[f.load]();
  await sleep(100);
  const select = $(f.select);
  if(!select) return msg('opRapidaMsg', `Campo de seleção da tela ${f.label} não encontrado.`, 'bad');
  select.value = id;
  if(select.value !== id){
    return msg('opRapidaMsg', `O equipamento não apareceu na lista de ${f.label}. Verifique o status atual.`, 'bad');
  }
  select.dispatchEvent(new Event('change', { bubbles:true }));
  if(f.form) $(f.form)?.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
}

document.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('button');
  if(!btn) return;
  try{
    if(btn.dataset.opAddEq) addEq(btn.dataset.opAddEq);
    if(btn.dataset.opAddMat) addMat(btn.dataset.opAddMat);
    if(btn.dataset.opRemoveEq) removeEq(btn.dataset.opRemoveEq);
    if(btn.dataset.opRemoveMat) removeMat(btn.dataset.opRemoveMat);
    if(btn.dataset.opOpenHistorico) await abrirFluxo('historico', btn.dataset.opOpenHistorico);
    if(btn.dataset.opOpenDevolucao) await abrirFluxo('devolucao', btn.dataset.opOpenDevolucao);
    if(btn.dataset.opOpenManutencao) await abrirFluxo('manutencao', btn.dataset.opOpenManutencao);
  }catch(e){ msg('opRapidaMsg', e.message || String(e), 'bad'); }
});

inject();
window.operacaoRapidaCleanLoad = load;
