import { table, call, first } from './api.js?v=5';
import { openMovimentacaoModal } from './movimentacao_modal.js?v=1';

const S = { filiais: [], equipamentos: [], carrinho: [], busca: '', total: 0, ultimoComprovante: null, timer: null, carregando: false };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm = v => String(v || '').trim();
const opId = () => globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8); return v.toString(16); });
const safeFile = v => String(v || 'retorno_filial').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'retorno_filial';
const nowBR = () => new Date().toLocaleString('pt-BR');
const todayFile = () => new Date().toISOString().slice(0,10);
let bound = false;

function msg(text, type=''){
  const el = $('retornoFilialMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeEq(e){ return [e?.tipo,e?.marca,e?.modelo].filter(Boolean).join(' ') || e?.codigo || '-'; }
function isElegivel(e, origem){
  return e && e.ativo !== false
    && String(e.status || '').toLowerCase() === 'em filial'
    && String(e.local || '').toLowerCase() === String(origem || '').toLowerCase();
}
function itemExiste(id){ return S.carrinho.some(e => e.id === id); }

function inject(){
  if(!$('navRetornoFilialClean')){
    const ref = $('navTransferenciaFilialClean') || $('navLotesSaidaClean') || $('navSaidaClean') || document.querySelector('[data-page="cadastros"]');
    const btn = document.createElement('button');
    btn.id = 'navRetornoFilialClean';
    btn.className = 'nav';
    btn.textContent = 'Retorno filial';
    btn.onclick = showPage;
    ref ? ref.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-retorno-filial-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-retorno-filial-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Retorno da filial para estoque central</h2>
            <p>Retorna equipamentos com status Em filial para o Estoque central, sem baixa e sem perda de histórico.</p>
          </div>
          <button id="retornoFilialReload" class="secondary" type="button">Recarregar dados</button>
        </div>
        <div id="retornoFilialMsg" class="msg"></div>
      </div>

      <div class="grid two">
        <form id="retornoFilialForm" class="card form-card">
          <h2>Dados do retorno</h2>
          <select id="retornoFilialOrigem"></select>
          <div class="form-grid two">
            <input id="retornoFilialResponsavel" placeholder="Responsável pelo recebimento">
            <input id="retornoFilialDocumento" placeholder="Documento / remessa / OS de retorno">
          </div>
          <input id="retornoFilialObs" placeholder="Observação do retorno">
          <input id="retornoFilialBusca" placeholder="Buscar equipamento na filial por código, MAC, SN ou modelo">
          <select id="retornoFilialEquipamento"></select>
          <div class="actions">
            <button id="retornoFilialAdd" class="secondary" type="button">Adicionar equipamento</button>
            <button class="primary" type="submit">Revisar retorno</button>
            <button id="retornoFilialLimpar" class="secondary" type="button">Limpar</button>
          </div>
        </form>

        <div class="card">
          <h2>Resumo antes de confirmar</h2>
          <div id="retornoFilialResumo" class="list"></div>
          <div id="retornoFilialRegra" class="msg show warn">Somente equipamentos com status Em filial e local da filial selecionada.</div>
        </div>
      </div>

      <div class="card">
        <div class="table-head">
          <div>
            <h2>Equipamentos selecionados</h2>
            <p id="retornoFilialCarrinhoInfo">Nenhum equipamento selecionado.</p>
          </div>
          <button id="retornoFilialWhats" class="secondary" type="button">Último comprovante</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Equipamento</th><th>MAC</th><th>SN</th><th>Status</th><th>Local</th><th>Ação</th></tr></thead>
            <tbody id="retornoFilialCarrinhoTbody"></tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="table-head">
          <div>
            <h2>Equipamentos disponíveis na filial</h2>
            <p id="retornoFilialTotalInfo">Mostrando até 80 equipamentos.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Equipamento</th><th>MAC</th><th>SN</th><th>Status</th><th>Local</th><th>Ação</th></tr></thead>
            <tbody id="retornoFilialTbody"></tbody>
          </table>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  if(bound) return;
  bound = true;
  $('retornoFilialReload').onclick = () => loadRetornoFilial().catch(e=>msg(e.message,'bad'));
  $('retornoFilialForm').onsubmit = abrirConfirmacao;
  $('retornoFilialLimpar').onclick = limpar;
  $('retornoFilialAdd').onclick = adicionarSelecionado;
  $('retornoFilialWhats').onclick = copiarUltimoComprovante;
  $('retornoFilialBusca').oninput = () => {
    S.busca = $('retornoFilialBusca').value || '';
    clearTimeout(S.timer);
    S.timer = setTimeout(() => carregarEquipamentos().catch(e=>msg(e.message,'bad')), 350);
  };
  $('retornoFilialOrigem').onchange = () => {
    S.carrinho = [];
    carregarEquipamentos().catch(e=>msg(e.message,'bad'));
    renderResumo();
  };
  ['retornoFilialResponsavel','retornoFilialDocumento','retornoFilialObs'].forEach(id=>{
    const el = $(id);
    if(el) el.addEventListener('input', renderResumo);
  });
  document.addEventListener('click', ev => {
    const add = ev.target.closest('[data-retfilial-add]');
    if(add){ adicionarPorId(add.dataset.retfilialAdd); return; }
    const rem = ev.target.closest('[data-retfilial-rem]');
    if(rem){ removerPorId(rem.dataset.retfilialRem); return; }
  });
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navRetornoFilialClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-retorno-filial-clean'));
  if($('pageTitle')) $('pageTitle').textContent = 'Retorno da filial';
  loadRetornoFilial().catch(e=>msg(e.message,'bad'));
}

async function loadRetornoFilial(){
  msg('Carregando filiais e equipamentos...', 'warn');
  const locais = await table('locais','nome',true);
  S.filiais = locais.filter(l => l.ativo !== false && (String(l.tipo || '').toLowerCase() === 'filial' || String(l.nome || '').toLowerCase().startsWith('filial -')));
  renderFiliais();
  await carregarEquipamentos();
  renderResumo();
  msg('Retorno da filial pronto para uso.', 'ok');
}

function renderFiliais(){
  $('retornoFilialOrigem').innerHTML = S.filiais.map(l => `<option value="${esc(l.nome)}">${esc(l.nome)}</option>`).join('') || '<option value="">Nenhuma filial cadastrada</option>';
  if(S.filiais.some(l => l.nome === 'Filial - Posse GO')) $('retornoFilialOrigem').value = 'Filial - Posse GO';
}

async function carregarEquipamentos(){
  if(S.carregando) return;
  S.carregando = true;
  try{
    const origem = $('retornoFilialOrigem')?.value || 'Filial - Posse GO';
    const res = await call('rpc_pesquisar_equipamentos_7a5', {
      p_busca: S.busca || origem,
      p_status_filtro: 'todos',
      p_limit: 80,
      p_offset: 0
    });
    S.equipamentos = (res.items || []).filter(e => isElegivel(e, origem));
    S.total = Number(res.total || 0);
    renderEquipamentos();
    renderEquipSelect();
  } finally {
    S.carregando = false;
  }
}

function renderEquipSelect(){
  const rows = S.equipamentos.filter(e => !itemExiste(e.id));
  $('retornoFilialEquipamento').innerHTML = '<option value="">Selecionar equipamento</option>' + rows.map(e=>`<option value="${e.id}">${esc([e.codigo,e.mac,e.serial,nomeEq(e)].filter(Boolean).join(' • '))}</option>`).join('');
}
function renderEquipamentos(){
  $('retornoFilialTotalInfo').textContent = `Mostrando ${S.equipamentos.length} equipamento(s) da filial.`;
  $('retornoFilialTbody').innerHTML = S.equipamentos.map(e => `
    <tr>
      <td><b>${esc(e.codigo || '-')}</b></td>
      <td>${esc(nomeEq(e))}</td>
      <td>${esc(e.mac || '-')}</td>
      <td>${esc(e.serial || '-')}</td>
      <td><span class="badge">${esc(e.status || '-')}</span></td>
      <td>${esc(e.local || '-')}</td>
      <td>${itemExiste(e.id) ? '<span class="badge">Adicionado</span>' : `<button class="secondary" type="button" data-retfilial-add="${e.id}">Adicionar</button>`}</td>
    </tr>`).join('') || '<tr><td colspan="7">Nenhum equipamento em filial encontrado.</td></tr>';
}
function renderCarrinho(){
  $('retornoFilialCarrinhoInfo').textContent = S.carrinho.length ? `${S.carrinho.length} equipamento(s) selecionado(s).` : 'Nenhum equipamento selecionado.';
  $('retornoFilialCarrinhoTbody').innerHTML = S.carrinho.map(e => `
    <tr>
      <td><b>${esc(e.codigo || '-')}</b></td>
      <td>${esc(nomeEq(e))}</td>
      <td>${esc(e.mac || '-')}</td>
      <td>${esc(e.serial || '-')}</td>
      <td><span class="badge">${esc(e.status || '-')}</span></td>
      <td>${esc(e.local || '-')}</td>
      <td><button class="danger" type="button" data-retfilial-rem="${e.id}">Remover</button></td>
    </tr>`).join('') || '<tr><td colspan="7">Nenhum equipamento selecionado.</td></tr>';
}
function adicionarSelecionado(){
  const id = $('retornoFilialEquipamento')?.value;
  if(!id) return msg('Selecione um equipamento.', 'warn');
  adicionarPorId(id);
}
function adicionarPorId(id){
  const origem = $('retornoFilialOrigem')?.value;
  const e = S.equipamentos.find(x => x.id === id);
  if(!e) return msg('Equipamento não encontrado na filial selecionada.', 'bad');
  if(!isElegivel(e, origem)) return msg('Equipamento não elegível para retorno.', 'bad');
  if(itemExiste(id)) return msg('Equipamento já está selecionado.', 'warn');
  S.carrinho.push(e);
  renderCarrinho();
  renderEquipamentos();
  renderEquipSelect();
  renderResumo();
}
function removerPorId(id){
  S.carrinho = S.carrinho.filter(e => e.id !== id);
  renderCarrinho();
  renderEquipamentos();
  renderEquipSelect();
  renderResumo();
}

function payload(){
  const origem = norm($('retornoFilialOrigem')?.value);
  const responsavel = norm($('retornoFilialResponsavel')?.value);
  const documento = norm($('retornoFilialDocumento')?.value);
  const observacao = norm($('retornoFilialObs')?.value);
  if(!origem) throw new Error('Selecione a filial de origem.');
  if(!responsavel) throw new Error('Informe o responsável pelo recebimento.');
  if(!documento) throw new Error('Informe o documento/remessa/OS de retorno.');
  if(!S.carrinho.length) throw new Error('Adicione pelo menos um equipamento.');
  return { origem, responsavel, documento, observacao, equipamentos: S.carrinho };
}
function resumoHtml(p){
  return `
    <div class="item"><div><b>Origem</b><br><small>${esc(p.origem)}</small></div><span class="badge">Em filial</span></div>
    <div class="item"><div><b>Destino</b><br><small>Estoque central</small></div><span class="badge">Em estoque</span></div>
    <div class="item"><div><b>Responsável</b><br><small>${esc(p.responsavel)}</small></div></div>
    <div class="item"><div><b>Documento/Remessa</b><br><small>${esc(p.documento)}</small></div></div>
    <div class="item"><div><b>Quantidade</b><br><small>${p.equipamentos.length} equipamento(s)</small></div></div>
    <div class="item"><div><b>Observação</b><br><small>${esc(p.observacao || 'Sem observação')}</small></div></div>`;
}
function renderResumo(){
  renderCarrinho();
  let p;
  try{ p = payload(); }
  catch(e){
    $('retornoFilialResumo').innerHTML = `<div class="item"><b>Pendente</b><small>${esc(e.message)}</small></div>`;
    $('retornoFilialRegra').textContent = e.message;
    return;
  }
  $('retornoFilialResumo').innerHTML = resumoHtml(p);
  $('retornoFilialRegra').textContent = 'O retorno só aceita equipamentos com status Em filial na filial selecionada.';
}

async function abrirConfirmacao(ev){
  ev.preventDefault();
  try{
    const p = payload();
    const itens = p.equipamentos.map((e,i)=>`<div class="item"><div><b>${i+1}. ${esc(e.codigo || '-')} • ${esc(nomeEq(e))}</b><br><small>MAC: ${esc(e.mac || '-')} • SN: ${esc(e.serial || '-')}</small></div></div>`).join('');
    const ok = await openMovimentacaoModal({ title:'Confirmar retorno da filial', subtitle:'Os equipamentos voltarão para Estoque central com status Em estoque.', html: resumoHtml(p) + '<h3>Equipamentos</h3>' + itens, confirmText:'Confirmar retorno' });
    if(ok) await confirmarRetorno(p);
  }catch(e){ msg(e.message || String(e), 'bad'); renderResumo(); }
}

function textoComprovante(c){
  const linhas = [];
  linhas.push('✅ COMPROVANTE DE RETORNO DA FILIAL');
  linhas.push('Protocolo: ' + (c.protocolo || '-'));
  linhas.push('Data/Hora: ' + nowBR());
  linhas.push('Origem: ' + (c.origem || '-'));
  linhas.push('Destino: ' + (c.destino || 'Estoque central'));
  linhas.push('Responsável: ' + (c.responsavel || '-'));
  linhas.push('Documento/Remessa: ' + (c.documento || '-'));
  if(c.observacao) linhas.push('Obs: ' + c.observacao);
  linhas.push('');
  linhas.push('EQUIPAMENTOS:');
  (c.itens || []).forEach((e,i)=>linhas.push(`${i+1}. ${e.codigo || '-'} | ${[e.tipo,e.marca,e.modelo].filter(Boolean).join(' ') || '-'} | MAC: ${e.mac || '-'} | SN: ${e.serial || '-'}`));
  linhas.push('');
  linhas.push('Os equipamentos acima retornaram para o Estoque central.');
  return linhas.join('\n');
}
async function copiarTexto(texto, okMsg){
  try{ await navigator.clipboard.writeText(texto); if(okMsg) msg(okMsg, 'ok'); }
  catch(e){ msg('Não foi possível copiar automaticamente. O comprovante foi gerado.', 'warn'); }
}
async function copiarUltimoComprovante(){
  if(!S.ultimoComprovante) return msg('Nenhum comprovante gerado nesta sessão.', 'warn');
  await copiarTexto(textoComprovante(S.ultimoComprovante), 'Último comprovante copiado para WhatsApp.');
}
function addPdfText(doc, text, x, y, maxWidth, lineHeight=5){
  const lines = doc.splitTextToSize(String(text ?? '-'), maxWidth);
  for(const line of lines){ if(y > 282){ doc.addPage(); y = 16; } doc.text(line, x, y); y += lineHeight; }
  return y;
}
function gerarPdf(c){
  if(!window.jspdf?.jsPDF) throw new Error('Biblioteca jsPDF não carregou.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  let y = 14;
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('LIKE Estoque', 12, y); y += 8;
  doc.setFontSize(13); doc.text('Comprovante de retorno da filial', 12, y); y += 7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y = addPdfText(doc, `Protocolo: ${c.protocolo || '-'} | Gerado em: ${nowBR()}`, 12, y, 186);
  y = addPdfText(doc, `Origem: ${c.origem || '-'} | Destino: ${c.destino || 'Estoque central'} | Documento: ${c.documento || '-'}`, 12, y, 186);
  y = addPdfText(doc, `Responsável: ${c.responsavel || '-'} | Observação: ${c.observacao || '-'}`, 12, y, 186);
  y += 4; doc.setDrawColor(210); doc.line(12, y, 198, y); y += 7;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text(`Equipamentos (${(c.itens || []).length})`, 12, y); y += 7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  (c.itens || []).forEach((e,i)=>{ y = addPdfText(doc, `${i+1}. ${e.codigo || '-'} | ${[e.tipo,e.marca,e.modelo].filter(Boolean).join(' ') || '-'} | MAC: ${e.mac || '-'} | SN: ${e.serial || '-'} | Patrimônio: ${e.patrimonio || '-'}`, 12, y, 186); });
  y += 18;
  if(y > 250){ doc.addPage(); y = 30; }
  doc.setDrawColor(120); doc.line(20, y, 90, y); doc.line(120, y, 190, y); y += 5;
  doc.setFontSize(9); doc.text('Responsável pelo recebimento', 28, y); doc.text('Conferência estoque central', 132, y);
  doc.setFontSize(8); doc.setTextColor(110); doc.text('Documento gerado pelo LIKE Estoque • Retorno de filial.', 12, 290); doc.setTextColor(0);
  const filename = `retorno_filial_${safeFile(c.origem)}_${safeFile(c.protocolo).slice(0,18)}_${todayFile()}.pdf`;
  doc.save(filename);
  return filename;
}

async function confirmarRetorno(p){
  try{
    msg('Registrando retorno via RPC...', 'warn');
    const result = await call('rpc_retornar_equipamentos_filial', { p_equipamentos:p.equipamentos.map(e=>e.id), p_filial_origem:p.origem, p_responsavel:p.responsavel, p_documento:p.documento, p_observacao:p.observacao, p_client_operation_id:opId() });
    const comp = first(result) || result;
    S.ultimoComprovante = comp;
    let pdfMsg = '';
    try{ pdfMsg = ` PDF gerado: ${gerarPdf(comp)}.`; }catch(pdfErr){ pdfMsg = ` PDF não gerado: ${pdfErr.message}.`; }
    await copiarTexto(textoComprovante(comp), '');
    msg(`Retorno registrado. Protocolo: ${comp.protocolo || '-'}. Comprovante WhatsApp copiado.${pdfMsg}`, 'ok');
    limpar(false);
    await loadRetornoFilial();
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function limpar(show=true){
  ['retornoFilialResponsavel','retornoFilialDocumento','retornoFilialObs','retornoFilialBusca','retornoFilialEquipamento'].forEach(id=>{ if($(id)) $(id).value=''; });
  S.carrinho = [];
  S.busca = '';
  renderCarrinho(); renderResumo(); renderEquipamentos(); renderEquipSelect();
  if(show) msg('Formulário limpo.', 'ok');
}

inject();
window.retornoFilialCleanLoad = loadRetornoFilial;