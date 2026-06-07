import { table, call } from './api.js?v=3';

const DRAFT_KEY = 'like_entrada_lote_pre_cadastro_v1';
const S = { modelos: [], locais: [], equipamentos: [], itens: [], ultimoComprovante: null };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
const br = (v) => Number(v || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const opId = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
const ativo = (x) => x && x.ativo !== false;
const norm = (v) => String(v || '').trim();
const upper = (v) => norm(v).toUpperCase();
const safeFile = (v) => String(v || 'lote').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'lote';
const todayFile = () => new Date().toISOString().slice(0,10);
const nowBR = () => new Date().toLocaleString('pt-BR');

function msg(t, c=''){
  const el = $('loteMsg');
  if(el){ el.textContent = t; el.className = 'msg show ' + c; }
}
function nomeModelo(m){ return [m.tipo, m.marca, m.modelo].filter(Boolean).join(' '); }
function isPatrimonioUnitario(m){ return String(m.categoria_estoque || '').toLowerCase() === 'patrimônio' && String(m.controle || '').toLowerCase() === 'unitário'; }
function num(id){ return Number($(id)?.value || 0) || 0; }
function isMac(v){ return /^([0-9A-F]{2}[:-]){5}[0-9A-F]{2}$/.test(upper(v)); }
function cleanMac(v){ return upper(v).replace(/-/g, ':'); }
function saveDraft(){ localStorage.setItem(DRAFT_KEY, JSON.stringify(S.itens)); }
function loadDraft(){ try { S.itens = JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]'); } catch(e){ S.itens = []; } }
function modeloSelecionado(){ return S.modelos.find(x => x.id === $('loteModeloSelect')?.value); }
function exigeMacSn(){ const m = modeloSelecionado(); return m ? m.exige_mac_sn !== false : true; }
function travarIdentidade(){ ['loteTipo','loteMarca','loteModelo'].forEach(id => { if($(id)) $(id).disabled = true; }); }
function atualizarMacSnUi(){
  const m = modeloSelecionado();
  const exige = exigeMacSn();
  const box = $('loteMacSnBox');
  const limpar = $('loteLimparScan');
  const add = $('loteAdicionarItem');
  if(box) box.style.display = (!m || exige) ? 'grid' : 'none';
  if(limpar) limpar.style.display = (!m || exige) ? 'inline-flex' : 'none';
  if(add) add.textContent = (!m || exige) ? 'Adicionar ao pré-cadastro' : 'Adicionar item sem MAC/SN';
  if(m && !exige){
    if($('loteScanMac')) $('loteScanMac').value = '';
    if($('loteScanSerial')) $('loteScanSerial').value = '';
  }
}

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
            <p>Bipe MAC e SN quando o modelo exigir. Para patrimônio sem MAC/SN, adicione direto ao pré-cadastro.</p>
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
            <input id="loteTipo" placeholder="Tipo" disabled>
            <input id="loteMarca" placeholder="Marca" disabled>
            <input id="loteModelo" placeholder="Modelo" disabled>
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
            <h2 id="loteBipTitulo">Identificação do equipamento</h2>
            <p id="loteRegraBip">Selecione um patrimônio unitário para iniciar.</p>
            <div id="loteMacSnBox" class="form-grid two">
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
            <button class="secondary" id="loteUltimoComprovante" type="button">Último comprovante</button>
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
          <div class="msg show warn">O pré-cadastro fica salvo neste navegador até finalizar ou limpar.</div>
        </div>
      </div>

      <div class="card">
        <div class="table-head">
          <h2>Pré-cadastro antes de entrar no sistema</h2>
          <button id="loteFocoMac" class="secondary">Focar campo MAC</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>#</th><th>MAC</th><th>Serial/SN</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody id="lotePreviewTbody"></tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <h2>Resultado do último lote</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Linha</th><th>Código</th><th>MAC</th><th>Serial/SN</th></tr></thead>
            <tbody id="loteResultadoTbody"></tbody>
          </table>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  $('loteReload').onclick = () => loadLote().catch(e => msg(e.message, 'bad'));
  $('loteModeloSelect').onchange = selecionarModelo;
  $('loteForm').onsubmit = salvarLote;
  $('loteAdicionarItem').onclick = adicionarAtual;
  $('loteLimparScan').onclick = limparScan;
  $('loteLimparTudo').onclick = limparTudo;
  $('loteUltimoComprovante').onclick = copiarUltimoComprovante;
  $('loteFocoMac').onclick = () => { if(exigeMacSn()) $('loteScanMac').focus(); };
  $('loteScanMac').addEventListener('keydown', ev => { if(ev.key === 'Enter'){ ev.preventDefault(); $('loteScanSerial').focus(); } });
  $('loteScanSerial').addEventListener('keydown', ev => { if(ev.key === 'Enter'){ ev.preventDefault(); adicionarAtual(); } });
  ['loteLocal','loteCusto','loteFornecedor','loteNf','loteResponsavel','loteObs'].forEach(id => {
    const el = $(id);
    if(el) el.addEventListener('input', renderPreview);
  });
  document.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-remove-lote]');
    if(btn) removerItem(Number(btn.dataset.removeLote));
  });
  travarIdentidade();
  atualizarMacSnUi();
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navEntradaLoteClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-entrada-lote-clean'));
  if($('pageTitle')) $('pageTitle').textContent = 'Entrada em lote';
  loadLote().catch(e => msg(e.message, 'bad'));
}
async function loadLote(){
  msg('Carregando dados do lote...', 'warn');
  loadDraft();
  S.modelos = await table('modelos', 'tipo', true);
  S.locais = await table('locais', 'nome', true);
  S.equipamentos = await table('equipamentos', 'created_at', false);
  fillSelects();
  atualizarMacSnUi();
  renderPreview();
  setTimeout(() => { if(exigeMacSn()) $('loteScanMac')?.focus(); }, 100);
  msg('Entrada em lote pronta.', 'ok');
}
function fillSelects(){
  const modelos = S.modelos.filter(ativo).filter(isPatrimonioUnitario);
  $('loteModeloSelect').innerHTML = '<option value="">Selecionar patrimônio unitário</option>' + modelos.map(m => `<option value="${m.id}">${esc(nomeModelo(m))}${m.exige_mac_sn === false ? ' • sem MAC/SN obrigatório' : ''}</option>`).join('');
  const locais = S.locais.filter(ativo);
  $('loteLocal').innerHTML = locais.map(l => `<option value="${esc(l.nome)}">${esc(l.nome)}</option>`).join('') || '<option value="Estoque central">Estoque central</option>';
  const central = locais.find(l => String(l.nome || '').toLowerCase().includes('estoque'));
  if(central) $('loteLocal').value = central.nome;
}
function selecionarModelo(){
  const m = modeloSelecionado();
  if(!m){ atualizarMacSnUi(); return renderPreview(); }
  $('loteTipo').value = m.tipo || '';
  $('loteMarca').value = m.marca || '';
  $('loteModelo').value = m.modelo || '';
  $('loteCusto').value = m.custo_padrao || m.custo || 0;
  travarIdentidade();
  atualizarMacSnUi();
  renderPreview();
  if(exigeMacSn()) $('loteScanMac').focus();
}
function common(){
  const m = modeloSelecionado();
  const tipo = norm($('loteTipo').value), marca = norm($('loteMarca').value), modelo = norm($('loteModelo').value);
  if(!m || !tipo || !marca || !modelo) throw new Error('Selecione um patrimônio unitário antes de adicionar.');
  return {
    tipo, marca, modelo,
    local: norm($('loteLocal').value) || 'Estoque central',
    custo: num('loteCusto'),
    fornecedor: norm($('loteFornecedor').value),
    nf: norm($('loteNf').value),
    responsavel: norm($('loteResponsavel').value),
    observacao: norm($('loteObs').value),
    exige_mac_sn: exigeMacSn()
  };
}
function adicionarAtual(){
  try{
    const c = common();
    let mac = c.exige_mac_sn ? norm($('loteScanMac').value) : '';
    let serial = c.exige_mac_sn ? norm($('loteScanSerial').value) : '';
    if(mac && !isMac(mac) && !serial){ serial = upper(mac); mac = ''; }
    mac = mac ? cleanMac(mac) : '';
    serial = upper(serial);
    if(c.exige_mac_sn && !mac && !serial) throw new Error('Este modelo exige MAC ou Serial/SN.');
    if(mac && S.itens.some(i => i.mac === mac)) throw new Error('MAC já está no pré-cadastro.');
    if(serial && S.itens.some(i => i.serial === serial)) throw new Error('Serial/SN já está no pré-cadastro.');
    const existingMac = new Set(S.equipamentos.map(e => upper(e.mac)).filter(Boolean));
    const existingSerial = new Set(S.equipamentos.map(e => upper(e.serial)).filter(Boolean));
    if(mac && existingMac.has(mac)) throw new Error('MAC já cadastrado no sistema.');
    if(serial && existingSerial.has(serial)) throw new Error('Serial/SN já cadastrado no sistema.');
    S.itens.push({ mac, serial, criado_em: new Date().toISOString() });
    saveDraft();
    limparScan(false);
    renderPreview();
    msg(`Item adicionado ao pré-cadastro. Total: ${S.itens.length}.`, 'ok');
    if(c.exige_mac_sn) $('loteScanMac').focus();
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function limparScan(show=true){
  if($('loteScanMac')) $('loteScanMac').value = '';
  if($('loteScanSerial')) $('loteScanSerial').value = '';
  if(show) msg('Campos MAC/SN limpos.', 'ok');
  if(exigeMacSn()) $('loteScanMac').focus();
}
function itemIssues(item){
  const issues = [];
  const exige = exigeMacSn();
  if(exige && !item.mac && !item.serial) issues.push('sem MAC/SN');
  const existingMac = new Set(S.equipamentos.map(e => upper(e.mac)).filter(Boolean));
  const existingSerial = new Set(S.equipamentos.map(e => upper(e.serial)).filter(Boolean));
  if(item.mac && existingMac.has(item.mac)) issues.push('MAC já cadastrado');
  if(item.serial && existingSerial.has(item.serial)) issues.push('Serial já cadastrado');
  if(item.mac && S.itens.filter(i => i.mac === item.mac).length > 1) issues.push('MAC duplicado');
  if(item.serial && S.itens.filter(i => i.serial === item.serial).length > 1) issues.push('Serial duplicado');
  return issues;
}
function renderPreview(){
  atualizarMacSnUi();
  let c = null;
  try{ c = common(); }catch(e){}
  if($('loteRegraBip')) $('loteRegraBip').textContent = c ? (c.exige_mac_sn ? 'Este patrimônio exige MAC ou Serial/SN. Os campos ficam visíveis para bip.' : 'Este patrimônio não exige MAC/SN. Os campos foram ocultados; clique em adicionar para pré-cadastrar.') : 'Selecione um patrimônio unitário para iniciar.';
  if($('loteBipTitulo')) $('loteBipTitulo').textContent = c && c.exige_mac_sn ? 'Bip do equipamento' : 'Entrada sem MAC/SN';
  const rows = S.itens.map((item, idx) => ({ ...item, linha: idx + 1, issues: itemIssues(item) }));
  setKpis(rows);
  $('lotePreviewTbody').innerHTML = rows.map(r => `<tr><td>${r.linha}</td><td>${esc(r.mac || '-')}</td><td>${esc(r.serial || '-')}</td><td><span class="badge">${esc(r.issues.length ? r.issues.join(' • ') : 'OK')}</span></td><td><button class="danger" data-remove-lote="${r.linha - 1}">Remover</button></td></tr>`).join('') || '<tr><td colspan="5">Nenhum item no pré-cadastro.</td></tr>';
}
function setKpis(rows){
  const validas = rows.filter(r => !r.issues.length).length;
  $('loteKTotal').textContent = rows.length;
  $('loteKValidas').textContent = validas;
  $('loteKProblema').textContent = rows.length - validas;
  $('loteKCusto').textContent = br(validas * num('loteCusto'));
}
function removerItem(idx){
  S.itens.splice(idx, 1);
  saveDraft();
  renderPreview();
  msg('Item removido do pré-cadastro.', 'ok');
  if(exigeMacSn()) $('loteScanMac').focus();
}

function normalizarResultado(result, rows){
  const arr = Array.isArray(result) ? result : Array.isArray(result?.equipamentos) ? result.equipamentos : Array.isArray(result?.itens) ? result.itens : [result].filter(Boolean);
  if(arr.length) return arr.map((r, idx) => ({
    linha: r.linha || rows[idx]?.linha || idx + 1,
    codigo: r.codigo || r.patrimonio || r.id || '-',
    mac: r.mac || rows[idx]?.mac || '',
    serial: r.serial || rows[idx]?.serial || '',
    tipo: r.tipo || rows[idx]?.tipo || '',
    marca: r.marca || rows[idx]?.marca || '',
    modelo: r.modelo || rows[idx]?.modelo || '',
    local: r.local || rows[idx]?.local || '',
    custo: r.custo ?? rows[idx]?.custo ?? 0
  }));
  return rows.map(r => ({ ...r, codigo:'gerado' }));
}
function snapshotLote(c, protocolo, itensCriados){
  return {
    protocolo,
    gerado_em: nowBR(),
    tipo: c.tipo,
    marca: c.marca,
    modelo: c.modelo,
    local: c.local,
    custo: c.custo,
    fornecedor: c.fornecedor,
    nf: c.nf,
    responsavel: c.responsavel,
    observacao: c.observacao,
    total: itensCriados.length,
    itens: itensCriados
  };
}
function textoComprovante(s){
  const linhas = [];
  linhas.push('✅ COMPROVANTE DE ENTRADA EM LOTE');
  linhas.push('Protocolo: ' + (s.protocolo || '-'));
  linhas.push('Data/Hora: ' + (s.gerado_em || nowBR()));
  linhas.push('Modelo: ' + [s.tipo, s.marca, s.modelo].filter(Boolean).join(' '));
  linhas.push('Local: ' + (s.local || '-'));
  linhas.push('Total: ' + (s.total || 0) + ' equipamento(s)');
  linhas.push('Custo unitário: ' + br(s.custo));
  linhas.push('Custo total: ' + br(Number(s.custo || 0) * Number(s.total || 0)));
  if(s.fornecedor) linhas.push('Fornecedor: ' + s.fornecedor);
  if(s.nf) linhas.push('NF/Documento: ' + s.nf);
  linhas.push('Responsável: ' + (s.responsavel || 'Não informado'));
  if(s.observacao) linhas.push('Obs: ' + s.observacao);
  linhas.push('');
  linhas.push('ITENS:');
  linhas.push((s.itens || []).map(i => `${i.linha || '-'} - ${i.codigo || '-'} | MAC/SN: ${i.mac || i.serial || '-'}`).join('\n') || 'Sem itens.');
  linhas.push('');
  linhas.push('Entrada em lote registrada e conferida no estoque.');
  return linhas.join('\n');
}
async function copiarTexto(texto, okMsg){
  try{
    await navigator.clipboard.writeText(texto);
    if(okMsg) msg(okMsg, 'ok');
  }catch(e){
    window.prompt('Copie o comprovante:', texto);
  }
}
async function copiarUltimoComprovante(){
  if(!S.ultimoComprovante) return msg('Nenhum comprovante gerado nesta sessão.', 'warn');
  await copiarTexto(textoComprovante(S.ultimoComprovante), 'Último comprovante copiado para WhatsApp.');
}
function addPdfText(doc, text, x, y, maxWidth, lineHeight=5){
  const lines = doc.splitTextToSize(String(text ?? '-'), maxWidth);
  for(const line of lines){
    if(y > 282){ doc.addPage(); y = 16; }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}
function gerarPdf(s){
  if(!window.jspdf?.jsPDF) throw new Error('Biblioteca jsPDF não carregou.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  let y = 14;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text('LIKE Estoque', 12, y); y += 8;
  doc.setFontSize(13); doc.text('Comprovante de entrada em lote', 12, y); y += 7;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  y = addPdfText(doc, `Protocolo: ${s.protocolo || '-'} | Gerado em: ${s.gerado_em || nowBR()}`, 12, y, 186);
  y = addPdfText(doc, `Modelo: ${[s.tipo, s.marca, s.modelo].filter(Boolean).join(' ')} | Local: ${s.local || '-'}`, 12, y, 186);
  y = addPdfText(doc, `Total: ${s.total || 0} equipamento(s) | Custo unitário: ${br(s.custo)} | Custo total: ${br(Number(s.custo || 0) * Number(s.total || 0))}`, 12, y, 186);
  y = addPdfText(doc, `Fornecedor: ${s.fornecedor || '-'} | NF/Documento: ${s.nf || '-'} | Responsável: ${s.responsavel || '-'}`, 12, y, 186);
  y = addPdfText(doc, `Observação: ${s.observacao || '-'}`, 12, y, 186);
  y += 4; doc.setDrawColor(210); doc.line(12, y, 198, y); y += 7;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Itens recebidos', 12, y); y += 7;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  (s.itens || []).forEach(i => {
    y = addPdfText(doc, `${i.linha || '-'} - ${i.codigo || '-'} | MAC/SN: ${i.mac || i.serial || '-'} | ${[i.tipo || s.tipo, i.marca || s.marca, i.modelo || s.modelo].filter(Boolean).join(' ')}`, 12, y, 186, 4.5);
  });
  y += 14;
  if(y > 250){ doc.addPage(); y = 30; }
  doc.setDrawColor(120); doc.line(20, y, 90, y); doc.line(120, y, 190, y); y += 5;
  doc.setFontSize(9); doc.text('Responsável pela entrada', 31, y); doc.text('Conferência / Estoque', 139, y);
  doc.setFontSize(8); doc.setTextColor(110); doc.text('Documento gerado pelo LIKE Estoque • Entrada em lote.', 12, 290); doc.setTextColor(0);
  const filename = `comprovante_entrada_lote_${safeFile(s.modelo)}_${todayFile()}.pdf`;
  doc.save(filename);
  return filename;
}

async function salvarLote(ev){
  ev.preventDefault();
  try{
    const c = common();
    const rows = S.itens.map((item, idx) => ({ ...c, ...item, linha: idx + 1, issues: itemIssues(item) }));
    if(!rows.length) throw new Error('Adicione pelo menos um equipamento ao pré-cadastro.');
    const invalidas = rows.filter(r => r.issues.length);
    if(invalidas.length) throw new Error(`Corrija ${invalidas.length} item(ns) antes de registrar.`);
    if(!confirm(`Confirmar entrada no sistema de ${rows.length} equipamento(s)?`)) return;

    msg('Registrando lote via RPC...', 'warn');
    const itens = rows.map(r => ({
      tipo: r.tipo,
      marca: r.marca,
      modelo: r.modelo,
      mac: r.mac,
      serial: r.serial,
      local: r.local,
      custo: r.custo,
      observacao: r.observacao,
      fornecedor: r.fornecedor,
      nf: r.nf,
      responsavel: r.responsavel,
      exige_mac_sn: r.exige_mac_sn
    }));
    const protocolo = opId();
    const result = await call('rpc_registrar_entrada_equipamento_lote', { p_itens: itens, p_client_operation_id: protocolo });
    const arr = normalizarResultado(result, rows);

    $('loteResultadoTbody').innerHTML = arr.map((r, idx) => `<tr><td>${esc(r.linha || idx + 1)}</td><td><b>${esc(r.codigo || '-')}</b></td><td>${esc(r.mac || '-')}</td><td>${esc(r.serial || '-')}</td></tr>`).join('') || '<tr><td colspan="4">Sem retorno detalhado.</td></tr>';

    const comp = snapshotLote(c, protocolo, arr);
    S.ultimoComprovante = comp;
    let pdfMsg = '';
    try{
      const file = gerarPdf(comp);
      pdfMsg = ` PDF gerado: ${file}.`;
    }catch(pdfErr){
      pdfMsg = ` PDF não gerado: ${pdfErr.message}.`;
    }
    await copiarTexto(textoComprovante(comp), '');

    S.itens = [];
    saveDraft();
    renderPreview();
    await loadLote();
    msg(`Entrada em lote registrada: ${arr.length} equipamento(s). Comprovante WhatsApp copiado.${pdfMsg}`, 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function limparTudo(){
  if(!confirm('Limpar todo o pré-cadastro deste navegador?')) return;
  S.itens = [];
  saveDraft();
  renderPreview();
  msg('Pré-cadastro limpo.', 'ok');
}

inject();
window.entradaLoteCleanLoad = loadLote;
