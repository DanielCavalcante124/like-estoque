import { table, call } from './api.js?v=2';

const S = { modelos: [], locais: [], equipamentos: [], preview: [] };
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
            <h2>Entrada em lote</h2>
            <p>Cole vários MACs/SNs e registre todos por RPC em uma operação controlada.</p>
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
          <textarea id="loteTexto" rows="12" placeholder="Cole aqui um item por linha. Exemplos:\nAA:BB:CC:DD:EE:01, SN001\nAA:BB:CC:DD:EE:02\nSN003"></textarea>
          <div class="actions">
            <button class="secondary" id="lotePreviewBtn" type="button">Pré-validar lote</button>
            <button class="primary" type="submit">Registrar lote</button>
            <button class="secondary" id="loteLimpar" type="button">Limpar</button>
          </div>
        </form>

        <div class="card">
          <h2>Resumo do lote</h2>
          <div class="kpis">
            <div class="kpi"><small>Linhas válidas</small><b id="loteKValidas">0</b></div>
            <div class="kpi"><small>Duplicadas</small><b id="loteKDup">0</b></div>
            <div class="kpi"><small>Já cadastradas</small><b id="loteKExist">0</b></div>
            <div class="kpi"><small>Custo total</small><b id="loteKCusto">R$ 0,00</b></div>
          </div>
          <div class="msg show warn">Formato aceito: MAC, SERIAL. Se houver apenas um valor, o sistema tenta identificar se é MAC; caso contrário, usa como Serial/SN.</div>
        </div>
      </div>

      <div class="card">
        <h2>Prévia antes de registrar</h2>
        <div class="table-wrap"><table><thead><tr><th>Linha</th><th>MAC</th><th>Serial/SN</th><th>Status</th></tr></thead><tbody id="lotePreviewTbody"></tbody></table></div>
      </div>

      <div class="card">
        <h2>Resultado do último lote</h2>
        <div class="table-wrap"><table><thead><tr><th>Linha</th><th>Código</th><th>MAC</th><th>Serial/SN</th></tr></thead><tbody id="loteResultadoTbody"></tbody></table></div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  $('loteReload').onclick = () => loadLote().catch(e=>msg(e.message,'bad'));
  $('loteModeloSelect').onchange = selecionarModelo;
  $('lotePreviewBtn').onclick = () => renderPreview();
  $('loteForm').onsubmit = salvarLote;
  $('loteLimpar').onclick = limpar;
  ['loteTipo','loteMarca','loteModelo','loteLocal','loteCusto','loteFornecedor','loteNf','loteResponsavel','loteObs','loteTexto'].forEach(id=>{
    const el=$(id); if(el) el.addEventListener('input', renderPreview);
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
  S.modelos = await table('modelos','tipo',true);
  S.locais = await table('locais','nome',true);
  S.equipamentos = await table('equipamentos','created_at',false);
  fillSelects();
  renderPreview();
  msg('Entrada em lote pronta.', 'ok');
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
}

function isMac(v){ return /^([0-9A-F]{2}[:-]){5}[0-9A-F]{2}$/.test(upper(v)); }
function cleanMac(v){ return upper(v).replace(/-/g, ':'); }
function parseLinhas(){
  const text = $('loteTexto').value || '';
  return text.split(/\r?\n/).map((raw, idx)=>({raw, idx:idx+1})).filter(x=>norm(x.raw)).map(x=>{
    const parts = x.raw.split(/[;,\t|]/).map(norm).filter(Boolean);
    let mac='', serial='';
    if(parts.length >= 2){ mac = isMac(parts[0]) ? cleanMac(parts[0]) : upper(parts[0]); serial = upper(parts[1]); }
    else if(parts.length === 1){ if(isMac(parts[0])) mac = cleanMac(parts[0]); else serial = upper(parts[0]); }
    return { linha:x.idx, mac, serial, raw:x.raw };
  });
}

function common(){
  const tipo=norm($('loteTipo').value), marca=norm($('loteMarca').value), modelo=norm($('loteModelo').value);
  if(!tipo || !marca || !modelo) throw new Error('Selecione ou preencha tipo, marca e modelo.');
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

function validate(){
  const c = common();
  const linhas = parseLinhas();
  const macs = new Map(), seriais = new Map();
  const existingMac = new Set(S.equipamentos.map(e=>upper(e.mac)).filter(Boolean));
  const existingSerial = new Set(S.equipamentos.map(e=>upper(e.serial)).filter(Boolean));
  S.preview = linhas.map(item=>{
    const issues=[];
    if(!item.mac && !item.serial) issues.push('sem MAC/SN');
    if(item.mac){ macs.set(item.mac, (macs.get(item.mac)||0)+1); if(existingMac.has(item.mac)) issues.push('MAC já cadastrado'); }
    if(item.serial){ seriais.set(item.serial, (seriais.get(item.serial)||0)+1); if(existingSerial.has(item.serial)) issues.push('Serial já cadastrado'); }
    return {...c, ...item, issues};
  });
  S.preview.forEach(item=>{
    if(item.mac && macs.get(item.mac)>1) item.issues.push('MAC duplicado no lote');
    if(item.serial && seriais.get(item.serial)>1) item.issues.push('Serial duplicado no lote');
  });
  return S.preview;
}

function renderPreview(){
  let rows=[];
  try{ rows = validate(); }
  catch(e){
    $('lotePreviewTbody').innerHTML = `<tr><td colspan="4">${esc(e.message)}</td></tr>`;
    setKpis([]);
    return;
  }
  setKpis(rows);
  $('lotePreviewTbody').innerHTML = rows.map(r=>`<tr><td>${r.linha}</td><td>${esc(r.mac || '-')}</td><td>${esc(r.serial || '-')}</td><td><span class="badge">${esc(r.issues.length ? r.issues.join(' • ') : 'OK')}</span></td></tr>`).join('') || '<tr><td colspan="4">Cole os itens do lote.</td></tr>';
}

function setKpis(rows){
  const validas = rows.filter(r=>!r.issues.length).length;
  const dup = rows.filter(r=>r.issues.some(x=>x.includes('duplicado'))).length;
  const exist = rows.filter(r=>r.issues.some(x=>x.includes('cadastrado'))).length;
  $('loteKValidas').textContent = validas;
  $('loteKDup').textContent = dup;
  $('loteKExist').textContent = exist;
  $('loteKCusto').textContent = br(validas * num('loteCusto'));
}

async function salvarLote(ev){
  ev.preventDefault();
  try{
    const rows = validate();
    if(!rows.length) throw new Error('Cole pelo menos uma linha no lote.');
    const invalidas = rows.filter(r=>r.issues.length);
    if(invalidas.length) throw new Error(`Corrija ${invalidas.length} linha(s) antes de registrar.`);
    if(!confirm(`Confirmar entrada em lote de ${rows.length} equipamento(s)?`)) return;
    msg('Registrando lote via RPC...', 'warn');
    const itens = rows.map(r=>({tipo:r.tipo,marca:r.marca,modelo:r.modelo,mac:r.mac,serial:r.serial,local:r.local,custo:r.custo,observacao:r.observacao,fornecedor:r.fornecedor,nf:r.nf,responsavel:r.responsavel}));
    const result = await call('rpc_registrar_entrada_equipamento_lote', { p_itens: itens, p_client_operation_id: opId() });
    const arr = Array.isArray(result) ? result : [result].filter(Boolean);
    $('loteResultadoTbody').innerHTML = arr.map(r=>`<tr><td>${esc(r.linha)}</td><td><b>${esc(r.codigo)}</b></td><td>${esc(r.mac || '-')}</td><td>${esc(r.serial || '-')}</td></tr>`).join('') || '<tr><td colspan="4">Lote registrado.</td></tr>';
    msg(`Lote registrado com sucesso: ${arr.length || rows.length} equipamento(s).`, 'ok');
    $('loteTexto').value = '';
    await loadLote();
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

function limpar(){
  ['loteModeloSelect','loteTipo','loteMarca','loteModelo','loteCusto','loteFornecedor','loteNf','loteResponsavel','loteObs','loteTexto'].forEach(id=>{ if($(id)) $(id).value=''; });
  $('loteResultadoTbody').innerHTML = '';
  renderPreview();
  msg('Formulário limpo.', 'ok');
}

inject();
window.entradaLoteCleanLoad = loadLote;
