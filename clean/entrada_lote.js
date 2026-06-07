import { table, call } from './api.js?v=2';

const DRAFT_KEY = 'like_entrada_lote_pre_cadastro_v1';
const S = { modelos: [], locais: [], equipamentos: [], itens: [] };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const br = (v) => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const opId = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
const ativo = (x) => x && x.ativo !== false;
const norm = (v) => String(v || '').trim();
const upper = (v) => norm(v).toUpperCase();

function msg(text, type=''){
  const el = $('loteMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeModelo(m){ return [m.tipo,m.marca,m.modelo].filter(Boolean).join(' '); }
function isPatrimonio(m){
  const c = String(m.categoria_estoque || m.categoria || m.controle || '').toLowerCase();
  return !(c.includes('consumo') || c.includes('material'));
}
function num(id){ return Number($(id)?.value || 0) || 0; }
function isMac(v){ return /^([0-9A-F]{2}[:-]){5}[0-9A-F]{2}$/.test(upper(v)); }
function cleanMac(v){ return upper(v).replace(/-/g, ':'); }
function saveDraft(){ localStorage.setItem(DRAFT_KEY, JSON.stringify(S.itens)); }
function loadDraft(){ try{ S.itens = JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]'); }catch(e){ S.itens = []; } }

function inject(){
  if(!$('navEntradaLoteClean')){
    const ref = $('navEntradaClean') || document.querySelector('[data-page="cadastros"]');
    const btn = document.createElement('button');
    btn.id = 'navEntradaLoteClean';
    btn.className = 'nav';
    btn.textContent = 'Entrada em lote';
    btn.onclick = showPage;
    ref ? ref.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-entrada-lote-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-entrada-lote-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Entrada em lote por bip</h2>
            <p>Bipe MAC e SN, gere um pré-cadastro local e só depois grave o lote no sistema.</p>
          </div>
          <button id="loteReload" class="secondary">Recarregar dados</button>
        </div>
        <div id="loteMsg" class="msg"></div>
      </div>

      <div class="grid two">
        <form id="loteForm" class="card form-card">
          <h2>Dados comuns do lote</h2>
          <select id="loteModeloSelect"></select>
          <div class="form-grid three-mini">
            <input id="loteTipo" placeholder="Tipo">
            <input id="loteMarca" placeholder="Marca">
            <input id="loteModelo" placeholder="Modelo">
          </div>
          <div class="form-grid two">
            <select id="loteLocal"></select>
            <input id="loteCusto" type="number" min="0" step="0.01" placeholder="Custo unitário">
          </div>
          <div class="form-grid two">
            <input id="loteFornecedor" placeholder="Fornecedor">
            <input id="loteNf" placeholder="NF / Documento">
          </div>
          <input id="loteResponsavel" placeholder="Responsável pela entrada">
          <input id="loteObs" placeholder="Observação do lote">

          <div class="card" style="margin-top:12px">
            <h2>Bip do equipamento</h2>
            <p>Fluxo recomendado: bipe o MAC, depois bipe o SN. Ao bipar o SN e pressionar Enter, o item entra automaticamente no pré-cadastro.</p>
            <div class="form-grid two">
              <input id="loteScanMac" placeholder="Bipe ou digite o MAC">
              <input id="loteScanSerial" placeholder="Bipe ou digite o Serial/SN">
            </div>
            <div class="actions">
              <button class="primary" id="loteAdicionarItem" type="button">Adicionar ao pré-cadastro</button>
              <button class="secondary" id="loteLimparScan" type="button">Limpar campos MAC/SN</button>
            </div>
          </div>

          <div class="actions">
            <button class="primary" type="submit">Finalizar entrada no sistema</button>
            <button class="danger" id="loteLimparTudo" type="button">Limpar pré-cadastro</button>
          </div>
        </form>

        <div class="card">
          <h2>Resumo do pré-cadastro</h2>
          <div class="kpis">
            <div class="kpi"><small>Pré-cadastrados</small><b id="loteKTotal">0</b></div>
            <div class="kpi"><small>Válidos</small><b id="loteKValidas">0</b></div>
            <div class="kpi"><small>Com problema</small><b id="loteKProblema">0</b></div>
            <div class="kpi"><small>Custo total</small><b id="loteKCusto">R$ 0,00</b></div>
          </div>
          <div class="msg show warn">O pré-cadastro fica salvo neste navegador até você finalizar a entrada ou limpar o lote.</div>
        </div>
      </div>

      <div class="card">
        <div class="table-head">
          <h2>Pré-cadastro antes de entrar no sistema</h2>
          <button id="loteFocoMac" class="secondary">Focar campo MAC</button>
        </div>
        <div class="table-wrap"><table><thead><tr><th>#</th><th>MAC</th><th>Serial/SN</th><th>Status</th><th>Ações</th></tr></thead><tbody id="lotePreviewTbody"></tbody></table></div>
      </div>

      <div class="card">
        <h2>Resultado do último lote</h2>
        <div class="table-wrap"><table><thead><tr><th>Linha</th><th>Código</th><th>MAC</th><th>Serial/SN</th></tr></thead><tbody id="loteResultadoTbody"></tbody></table></div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  $('loteReload').onclick = () => loadLote().catch(e=>msg(e.message,'bad'));
  $('loteModeloSelect').onchange = selecionarModelo;
  $('loteForm').onsubmit = salvarLote;
  $('loteAdicionarItem').onclick = adicionarAtual;
  $('loteLimparScan').onclick = limparScan;
  $('loteLimparTudo').onclick = limparTudo;
  $('loteFocoMac').onclick = () => $('loteScanMac').focus();
  $('loteScanMac').addEventListener('keydown', ev => { if(ev.key === 'Enter'){ ev.preventDefault(); $('loteScanSerial').focus(); } });
  $('loteScanSerial').addEventListener('keydown', ev => { if(ev.key === 'Enter'){ ev.preventDefault(); adicionarAtual(); } });
  ['loteTipo','loteMarca','loteModelo','loteLocal','loteCusto','loteFornecedor','loteNf','loteResponsavel','loteObs'].forEach(id=>{
    const el=$(id); if(el) el.addEventListener('input', renderPreview);
  });
  document.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-remove-lote]');
    if(!btn) return;
    removerItem(Number(btn.dataset.removeLote));
  });
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navEntradaLoteClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-entrada-lote-clean'));
  const title = $('pageTitle'); if(title) title.textContent = 'Entrada em lote';
  loadLote().catch(e=>msg(e.message,'bad'));
}

async function loadLote(){
  msg('Carregando dados do lote...', 'warn');
  loadDraft();
  S.modelos = await table('modelos','tipo',true);
  S.locais = await table('locais','nome',true);
  S.equipamentos = await table('equipamentos','created_at',false);
  fillSelects();
  renderPreview();
  setTimeout(() => $('loteScanMac')?.focus(), 100);
  msg('Entrada em lote por bip pronta.', 'ok');
}

function fillSelects(){
  const modelos = S.modelos.filter(ativo).filter(isPatrimonio);
  $('loteModeloSelect').innerHTML = '<option value="">Selecionar produto/modelo</option>' + modelos.map(m=>`<option value="${m.id}">${esc(nomeModelo(m))}</option>`).join('');
  const locais = S.locais.filter(ativo);
  $('loteLocal').innerHTML = locais.map(l=>`<option value="${esc(l.nome)}">${esc(l.nome)}</option>`).join('') || '<option value="Estoque central">Estoque central</option>';
  const central = locais.find(l => String(l.nome || '').toLowerCase().includes('estoque'));
  if(central) $('loteLocal').value = central.nome;
}

function selecionarModelo(){
  const m = S.modelos.find(x=>x.id===$('loteModeloSelect').value);
  if(!m) return renderPreview();
  $('loteTipo').value = m.tipo || '';
  $('loteMarca').value = m.marca || '';
  $('loteModelo').value = m.modelo || '';
  $('loteCusto').value = m.custo_padrao || m.custo || 0;
  renderPreview();
  $('loteScanMac').focus();
}

function common(){
  const tipo=norm($('loteTipo').value), marca=norm($('loteMarca').value), modelo=norm($('loteModelo').value);
  if(!tipo || !marca || !modelo) throw new Error('Selecione ou preencha tipo, marca e modelo antes de bipar.');
  return {
    tipo, marca, modelo,
    local: norm($('loteLocal').value) || 'Estoque central',
    custo: num('loteCusto'),
    fornecedor: norm($('loteFornecedor').value),
    nf: norm($('loteNf').value),
    responsavel: norm($('loteResponsavel').value),
    observacao: norm($('loteObs').value)
  };
}

function adicionarAtual(){
  try{
    common();
    let mac = norm($('loteScanMac').value);
    let serial = norm($('loteScanSerial').value);
    if(mac && !isMac(mac) && !serial){ serial = upper(mac); mac = ''; }
    mac = mac ? cleanMac(mac) : '';
    serial = upper(serial);
    if(!mac && !serial) throw new Error('Bipe ou digite MAC e/ou SN antes de adicionar.');
    if(mac && S.itens.some(i=>i.mac===mac)) throw new Error('MAC já está no pré-cadastro.');
    if(serial && S.itens.some(i=>i.serial===serial)) throw new Error('Serial/SN já está no pré-cadastro.');
    const existingMac = new Set(S.equipamentos.map(e=>upper(e.mac)).filter(Boolean));
    const existingSerial = new Set(S.equipamentos.map(e=>upper(e.serial)).filter(Boolean));
    if(mac && existingMac.has(mac)) throw new Error('MAC já cadastrado no sistema.');
    if(serial && existingSerial.has(serial)) throw new Error('Serial/SN já cadastrado no sistema.');
    S.itens.push({ mac, serial, criado_em: new Date().toISOString() });
    saveDraft();
    limparScan(false);
    renderPreview();
    msg(`Item adicionado ao pré-cadastro. Total: ${S.itens.length}.`, 'ok');
    $('loteScanMac').focus();
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

function limparScan(show=true){
  $('loteScanMac').value = '';
  $('loteScanSerial').value = '';
  if(show) msg('Campos MAC/SN limpos.', 'ok');
  $('loteScanMac').focus();
}

function itemIssues(item){
  const issues=[];
  if(!item.mac && !item.serial) issues.push('sem MAC/SN');
  const existingMac = new Set(S.equipamentos.map(e=>upper(e.mac)).filter(Boolean));
  const existingSerial = new Set(S.equipamentos.map(e=>upper(e.serial)).filter(Boolean));
  if(item.mac && existingMac.has(item.mac)) issues.push('MAC já cadastrado');
  if(item.serial && existingSerial.has(item.serial)) issues.push('Serial já cadastrado');
  const macCount = item.mac ? S.itens.filter(i=>i.mac===item.mac).length : 0;
  const serialCount = item.serial ? S.itens.filter(i=>i.serial===item.serial).length : 0;
  if(item.mac && macCount > 1) issues.push('MAC duplicado');
  if(item.serial && serialCount > 1) issues.push('Serial duplicado');
  return issues;
}

function renderPreview(){
  let c = null;
  try{ c = common(); }catch(e){}
  const rows = S.itens.map((item, idx)=>({ ...item, linha:idx+1, issues:itemIssues(item) }));
  setKpis(rows);
  $('lotePreviewTbody').innerHTML = rows.map(r=>`<tr><td>${r.linha}</td><td>${esc(r.mac || '-')}</td><td>${esc(r.serial || '-')}</td><td><span class="badge">${esc(r.issues.length ? r.issues.join(' • ') : 'OK')}</span></td><td><button class="danger" data-remove-lote="${r.linha-1}">Remover</button></td></tr>`).join('') || '<tr><td colspan="5">Nenhum item no pré-cadastro. Bipe MAC e SN para adicionar.</td></tr>';
  if(!c && S.itens.length) msg('Selecione o produto/modelo antes de finalizar o lote.', 'warn');
}

function setKpis(rows){
  const validas = rows.filter(r=>!r.issues.length).length;
  const problema = rows.length - validas;
  $('loteKTotal').textContent = rows.length;
  $('loteKValidas').textContent = validas;
  $('loteKProblema').textContent = problema;
  $('loteKCusto').textContent = br(validas * num('loteCusto'));
}

function removerItem(idx){
  S.itens.splice(idx,1);
  saveDraft();
  renderPreview();
  msg('Item removido do pré-cadastro.', 'ok');
  $('loteScanMac').focus();
}

async function salvarLote(ev){
  ev.preventDefault();
  try{
    const c = common();
    const rows = S.itens.map((item, idx)=>({ ...c, ...item, linha:idx+1, issues:itemIssues(item) }));
    if(!rows.length) throw new Error('Bipe pelo menos um equipamento antes de finalizar.');
    const invalidas = rows.filter(r=>r.issues.length);
    if(invalidas.length) throw new Error(`Corrija ${invalidas.length} item(ns) no pré-cadastro antes de registrar.`);
    if(!confirm(`Confirmar entrada no sistema de ${rows.length} equipamento(s)?`)) return;
    msg('Registrando lote via RPC...', 'warn');
    const itens = rows.map(r=>({tipo:r.tipo,marca:r.marca,modelo:r.modelo,mac:r.mac,serial:r.serial,local:r.local,custo:r.custo,observacao:r.observacao,fornecedor:r.fornecedor,nf:r.nf,responsavel:r.responsavel}));
    const result = await call('rpc_registrar_entrada_equipamento_lote', { p_itens: itens, p_client_operation_id: opId() });
    const arr = Array.isArray(result) ? result : [result].filter(Boolean);
    $('loteResultadoTbody').innerHTML = arr.map(r=>`<tr><td>${esc(r.linha)}</td><td><b>${esc(r.codigo)}</b></td><td>${esc(r.mac || '-')}</td><td>${esc(r.serial || '-')}</td></tr>`).join('') || '<tr><td colspan="4">Lote registrado.</td></tr>';
    S.itens = [];
    saveDraft();
    renderPreview();
    msg(`Lote registrado com sucesso: ${arr.length || rows.length} equipamento(s).`, 'ok');
    await loadLote();
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

function limparTudo(){
  if(S.itens.length && !confirm('Limpar todo o pré-cadastro deste lote?')) return;
  S.itens = [];
  saveDraft();
  renderPreview();
  $('loteResultadoTbody').innerHTML = '';
  msg('Pré-cadastro limpo.', 'ok');
  $('loteScanMac').focus();
}

inject();
window.entradaLoteCleanLoad = loadLote;
