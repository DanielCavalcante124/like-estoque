import { table, call, first } from './api.js?v=5';
import { openMovimentacaoModal } from './movimentacao_modal.js?v=1';

const S = {
  filiais: [],
  equipamentos: [],
  carrinho: [],
  ultimoComprovante: null,
  total: 0,
  busca: '',
  timer: null,
  carregando: false
};

const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm = v => String(v || '').trim();
const opId = () => globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8); return v.toString(16); });
const safeFile = v => String(v || 'transferencia').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'transferencia';
const nowBR = () => new Date().toLocaleString('pt-BR');
const todayFile = () => new Date().toISOString().slice(0,10);
let bound = false;

function msg(text, type=''){
  const el = $('transfFilialMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeEq(e){ return [e?.tipo,e?.marca,e?.modelo].filter(Boolean).join(' ') || e?.codigo || '-'; }
function isElegivel(e){
  return e && e.ativo !== false
    && ['em estoque','reservado'].includes(String(e.status || '').toLowerCase())
    && String(e.local || '').toLowerCase() === 'estoque central';
}
function itemExiste(id){ return S.carrinho.some(e => e.id === id); }

function inject(){
  if(!$('navTransferenciaFilialClean')){
    const ref = $('navLotesSaidaClean') || $('navSaidaClean') || document.querySelector('[data-page="cadastros"]');
    const btn = document.createElement('button');
    btn.id = 'navTransferenciaFilialClean';
    btn.className = 'nav';
    btn.textContent = 'Transferência filial';
    btn.onclick = showPage;
    ref ? ref.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-transferencia-filial-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-transferencia-filial-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Transferência para filial</h2>
            <p>Transfere patrimônio do Estoque central para uma filial sem dar baixa. O equipamento permanece ativo e rastreável.</p>
          </div>
          <button id="transfFilialReload" class="secondary" type="button">Recarregar dados</button>
        </div>
        <div id="transfFilialMsg" class="msg"></div>
      </div>

      <div class="grid two">
        <form id="transfFilialForm" class="card form-card">
          <h2>Dados da remessa</h2>
          <select id="transfFilialDestino"></select>
          <div class="form-grid two">
            <input id="transfFilialResponsavel" placeholder="Responsável pela retirada/envio">
            <input id="transfFilialDocumento" placeholder="Documento / remessa / OS">
          </div>
          <input id="transfFilialObs" placeholder="Observação da transferência">
          <input id="transfFilialBusca" placeholder="Buscar equipamento em Estoque central por código, MAC, SN ou modelo">
          <select id="transfFilialEquipamento"></select>
          <div class="actions">
            <button id="transfFilialAdd" class="secondary" type="button">Adicionar equipamento</button>
            <button class="primary" type="submit">Revisar transferência</button>
            <button id="transfFilialLimpar" class="secondary" type="button">Limpar</button>
          </div>
        </form>

        <div class="card">
          <h2>Resumo antes de confirmar</h2>
          <div id="transfFilialResumo" class="list"></div>
          <div id="transfFilialRegra" class="msg show warn">Somente equipamentos em Estoque central com status Em estoque ou Reservado.</div>
        </div>
      </div>

      <div class="card">
        <div class="table-head">
          <div>
            <h2>Equipamentos selecionados</h2>
            <p id="transfFilialCarrinhoInfo">Nenhum equipamento selecionado.</p>
          </div>
          <button id="transfFilialWhats" class="secondary" type="button">Último comprovante</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Equipamento</th><th>MAC</th><th>SN</th><th>Status</th><th>Local</th><th>Ação</th></tr></thead>
            <tbody id="transfFilialCarrinhoTbody"></tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="table-head">
          <div>
            <h2>Equipamentos disponíveis no Estoque central</h2>
            <p id="transfFilialTotalInfo">Mostrando até 80 equipamentos.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Equipamento</th><th>MAC</th><th>SN</th><th>Status</th><th>Local</th><th>Ação</th></tr></thead>
            <tbody id="transfFilialTbody"></tbody>
          </table>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  if(bound) return;
  bound = true;
  $('transfFilialReload').onclick = () => loadTransferenciaFilial().catch(e=>msg(e.message,'bad'));
  $('transfFilialForm').onsubmit = abrirConfirmacao;
  $('transfFilialLimpar').onclick = limpar;
  $('transfFilialAdd').onclick = adicionarSelecionado;
  $('transfFilialWhats').onclick = copiarUltimoComprovante;
  $('transfFilialBusca').oninput = () => {
    S.busca = $('transfFilialBusca').value || '';
    clearTimeout(S.timer);
    S.timer = setTimeout(() => carregarEquipamentos().catch(e=>msg(e.message,'bad')), 350);
  };
  ['transfFilialDestino','transfFilialResponsavel','transfFilialDocumento','transfFilialObs'].forEach(id=>{
    const el = $(id);
    if(el) el.addEventListener('input', renderResumo);
  });
  document.addEventListener('click', ev => {
    const add = ev.target.closest('[data-transf-add]');
    if(add){ adicionarPorId(add.dataset.transfAdd); return; }
    const rem = ev.target.closest('[data-transf-rem]');
    if(rem){ removerPorId(rem.dataset.transfRem); return; }
  });
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navTransferenciaFilialClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-transferencia-filial-clean'));
  if($('pageTitle')) $('pageTitle').textContent = 'Transferência para filial';
  loadTransferenciaFilial().catch(e=>msg(e.message,'bad'));
}

async function loadTransferenciaFilial(){
  msg('Carregando filiais e equipamentos...', 'warn');
  const locais = await table('locais','nome',true);
  S.filiais = locais.filter(l => l.ativo !== false && (String(l.tipo || '').toLowerCase() === 'filial' || String(l.nome || '').toLowerCase().startsWith('filial -')));
  renderFiliais();
  await carregarEquipamentos();
  renderResumo();
  msg('Transferência para filial pronta para uso.', 'ok');
}

function renderFiliais(){
  const options = S.filiais.map(l => `<option value="${esc(l.nome)}">${esc(l.nome)}</option>`).join('');
  $('transfFilialDestino').innerHTML = options || '<option value="">Nenhuma filial cadastrada</option>';
  if(S.filiais.some(l => l.nome === 'Filial - Posse GO')) $('transfFilialDestino').value = 'Filial - Posse GO';
}

async function carregarEquipamentos(){
  if(S.carregando) return;
  S.carregando = true;
  try{
    const res = await call('rpc_pesquisar_equipamentos_7a5', {
      p_busca: S.busca || '',
      p_status_filtro: 'estoque',
      p_limit: 80,
      p_offset: 0
    });
    S.equipamentos = (res.items || []).filter(isElegivel);
    S.total = Number(res.total || 0);
    renderEquipamentos();
    renderEquipSelect();
  } finally {
    S.carregando = false;
  }
}

function renderEquipSelect(){
  const rows = S.equipamentos.filter(e => !itemExiste(e.id));
  $('transfFilialEquipamento').innerHTML = '<option value="">Selecionar equipamento</option>' + rows.map(e=>`<option value="${e.id}">${esc([e.codigo,e.mac,e.serial,nomeEq(e)].filter(Boolean).join(' • '))}</option>`).join('');
}

function renderEquipamentos(){
  if($('transfFilialTotalInfo')) $('transfFilialTotalInfo').textContent = `Mostrando ${S.equipamentos.length} de ${S.total} equipamento(s).`;
  $('transfFilialTbody').innerHTML = S.equipamentos.map(e => `
    <tr>
      <td><b>${esc(e.codigo || '-')}</b></td>
      <td>${esc(nomeEq(e))}</td>
      <td>${esc(e.mac || '-')}</td>
      <td>${esc(e.serial || '-')}</td>
      <td><span class="badge">${esc(e.status || '-')}</span></td>
      <td>${esc(e.local || '-')}</td>
      <td>${itemExiste(e.id) ? '<span class="badge">Adicionado</span>' : `<button class="secondary" type="button" data-transf-add="${e.id}">Adicionar</button>`}</td>
    </tr>`).join('') || '<tr><td colspan="7">Nenhum equipamento elegível encontrado.</td></tr>';
}

function renderCarrinho(){
  $('transfFilialCarrinhoInfo').textContent = S.carrinho.length ? `${S.carrinho.length} equipamento(s) selecionado(s).` : 'Nenhum equipamento selecionado.';
  $('transfFilialCarrinhoTbody').innerHTML = S.carrinho.map(e => `
    <tr>
      <td><b>${esc(e.codigo || '-')}</b></td>
      <td>${esc(nomeEq(e))}</td>
      <td>${esc(e.mac || '-')}</td>
      <td>${esc(e.serial || '-')}</td>
      <td><span class="badge">${esc(e.status || '-')}</span></td>
      <td>${esc(e.local || '-')}</td>
      <td><button class="danger" type="button" data-transf-rem="${e.id}">Remover</button></td>
    </tr>`).join('') || '<tr><td colspan="7">Nenhum equipamento selecionado.</td></tr>';
}

function adicionarSelecionado(){
  const id = $('transfFilialEquipamento')?.value;
  if(!id) return msg('Selecione um equipamento.', 'warn');
  adicionarPorId(id);
}
function adicionarPorId(id){
  const e = S.equipamentos.find(x => x.id === id);
  if(!e) return msg('Equipamento não encontrado na lista atual.', 'bad');
  if(!isElegivel(e)) return msg('Equipamento não elegível para transferência.', 'bad');
  if(itemExiste(id)) return msg('Equipamento já está selecionado.', 'warn');
  S.carrinho.push(e);
  renderCarrinho();
  renderEquipamentos();
  renderEquipSelect();
  renderResumo();
  msg('Equipamento adicionado à transferência.', 'ok');
}
function removerPorId(id){
  S.carrinho = S.carrinho.filter(e => e.id !== id);
  renderCarrinho();
  renderEquipamentos();
  renderEquipSelect();
  renderResumo();
}

function payload(){
  const destino = norm($('transfFilialDestino')?.value);
  const responsavel = norm($('transfFilialResponsavel')?.value);
  const documento = norm($('transfFilialDocumento')?.value);
  const observacao = norm($('transfFilialObs')?.value);
  if(!destino) throw new Error('Selecione a filial de destino.');
  if(!responsavel) throw new Error('Informe o responsável pela retirada/envio.');
  if(!documento) throw new Error('Informe o documento/remessa/OS.');
  if(!S.carrinho.length) throw new Error('Adicione pelo menos um equipamento.');
  return { destino, responsavel, documento, observacao, equipamentos: S.carrinho };
}

function resumoHtml(p){
  return `
    <div class="item"><div><b>Origem</b><br><small>Estoque central</small></div><span class="badge">Saída patrimonial</span></div>
    <div class="item"><div><b>Destino</b><br><small>${esc(p.destino)}</small></div><span class="badge">Em filial</span></div>
    <div class="item"><div><b>Responsável</b><br><small>${esc(p.responsavel)}</small></div></div>
    <div class="item"><div><b>Documento/Remessa</b><br><small>${esc(p.documento)}</small></div></div>
    <div class="item"><div><b>Quantidade</b><br><small>${p.equipamentos.length} equipamento(s)</small></div></div>
    <div class="item"><div><b>Observação</b><br><small>${esc(p.observacao || 'Sem observação')}</small></div></div>`;
}
function renderResumo(){
  renderCarrinho();
  let p;
  try { p = payload(); }
  catch(e){
    $('transfFilialResumo').innerHTML = `<div class="item"><b>Pendente</b><small>${esc(e.message)}</small></div>`;
    $('transfFilialRegra').textContent = e.message;
    return;
  }
  $('transfFilialResumo').innerHTML = resumoHtml(p);
  $('transfFilialRegra').textContent = 'A transferência não baixa o equipamento. Ele continuará ativo com status Em filial.';
}

async function abrirConfirmacao(ev){
  ev.preventDefault();
  try{
    const p = payload();
    const itens = p.equipamentos.map((e,i)=>`<div class="item"><div><b>${i+1}. ${esc(e.codigo || '-')} • ${esc(nomeEq(e))}</b><br><small>MAC: ${esc(e.mac || '-')} • SN: ${esc(e.serial || '-')}</small></div></div>`).join('');
    const ok = await openMovimentacaoModal({
      title: 'Confirmar transferência para filial',
      subtitle: 'Os equipamentos sairão do Estoque central e ficarão ativos no local da filial.',
      html: resumoHtml(p) + '<h3>Equipamentos</h3>' + itens,
      confirmText: 'Confirmar transferência'
    });
    if(ok) await confirmarTransferencia(p);
  }catch(e){ msg(e.message || String(e), 'bad'); renderResumo(); }
}

function textoComprovante(c){
  const linhas = [];
  linhas.push('✅ COMPROVANTE DE TRANSFERÊNCIA PARA FILIAL');
  linhas.push('Protocolo: ' + (c.protocolo || '-'));
  linhas.push('Data/Hora: ' + nowBR());
  linhas.push('Origem: ' + (c.origem || 'Estoque central'));
  linhas.push('Destino: ' + (c.destino || '-'));
  linhas.push('Responsável: ' + (c.responsavel || '-'));
  linhas.push('Documento/Remessa: ' + (c.documento || '-'));
  if(c.observacao) linhas.push('Obs: ' + c.observacao);
  linhas.push('');
  linhas.push('EQUIPAMENTOS:');
  (c.itens || []).forEach((e,i)=>linhas.push(`${i+1}. ${e.codigo || '-'} | ${[e.tipo,e.marca,e.modelo].filter(Boolean).join(' ') || '-'} | MAC: ${e.mac || '-'} | SN: ${e.serial || '-'}`));
  linhas.push('');
  linhas.push('Os equipamentos acima foram transferidos para a filial informada e não constam mais no Estoque central.');
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
  doc.setFontSize(13); doc.text('Comprovante de transferência para filial', 12, y); y += 7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y = addPdfText(doc, `Protocolo: ${c.protocolo || '-'} | Gerado em: ${nowBR()}`, 12, y, 186);
  y = addPdfText(doc, `Origem: ${c.origem || 'Estoque central'} | Destino: ${c.destino || '-'} | Documento: ${c.documento || '-'}`, 12, y, 186);
  y = addPdfText(doc, `Responsável: ${c.responsavel || '-'} | Observação: ${c.observacao || '-'}`, 12, y, 186);
  y += 4; doc.setDrawColor(210); doc.line(12, y, 198, y); y += 7;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text(`Equipamentos (${(c.itens || []).length})`, 12, y); y += 7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  (c.itens || []).forEach((e,i)=>{
    y = addPdfText(doc, `${i+1}. ${e.codigo || '-'} | ${[e.tipo,e.marca,e.modelo].filter(Boolean).join(' ') || '-'} | MAC: ${e.mac || '-'} | SN: ${e.serial || '-'} | Patrimônio: ${e.patrimonio || '-'}`, 12, y, 186);
  });
  y += 18;
  if(y > 250){ doc.addPage(); y = 30; }
  doc.setDrawColor(120); doc.line(20, y, 90, y); doc.line(120, y, 190, y); y += 5;
  doc.setFontSize(9); doc.text('Responsável pela entrega', 33, y); doc.text('Recebedor / Filial', 142, y);
  doc.setFontSize(8); doc.setTextColor(110); doc.text('Documento gerado pelo LIKE Estoque • Transferência patrimonial para filial.', 12, 290); doc.setTextColor(0);
  const filename = `transferencia_filial_${safeFile(c.destino)}_${safeFile(c.protocolo).slice(0,18)}_${todayFile()}.pdf`;
  doc.save(filename);
  return filename;
}

async function confirmarTransferencia(p){
  try{
    msg('Registrando transferência via RPC...', 'warn');
    const result = await call('rpc_transferir_equipamentos_filial', {
      p_equipamentos: p.equipamentos.map(e => e.id),
      p_filial_destino: p.destino,
      p_responsavel: p.responsavel,
      p_documento: p.documento,
      p_observacao: p.observacao,
      p_client_operation_id: opId()
    });
    const comp = first(result) || result;
    S.ultimoComprovante = comp;
    let pdfMsg = '';
    try{ pdfMsg = ` PDF gerado: ${gerarPdf(comp)}.`; }catch(pdfErr){ pdfMsg = ` PDF não gerado: ${pdfErr.message}.`; }
    await copiarTexto(textoComprovante(comp), '');
    msg(`Transferência registrada. Protocolo: ${comp.protocolo || '-'}. Comprovante WhatsApp copiado.${pdfMsg}`, 'ok');
    limpar(false);
    await loadTransferenciaFilial();
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

function limpar(show=true){
  ['transfFilialResponsavel','transfFilialDocumento','transfFilialObs','transfFilialBusca','transfFilialEquipamento'].forEach(id=>{ if($(id)) $(id).value=''; });
  S.carrinho = [];
  S.busca = '';
  renderCarrinho();
  renderResumo();
  renderEquipamentos();
  renderEquipSelect();
  if(show) msg('Formulário limpo.', 'ok');
}

inject();
window.transferenciaFilialCleanLoad = loadTransferenciaFilial;