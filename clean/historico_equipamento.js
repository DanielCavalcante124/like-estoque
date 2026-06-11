import { call } from './api.js?v=5';

const S = { equipamentos: [], historico: [], selecionado: null, total: 0, busca: '', timer: null, carregando: false };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm = (v) => String(v || '').trim();
let bound = false;

function msg(text, type=''){
  const el = $('historicoMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeEq(e){ return [e.tipo,e.marca,e.modelo].filter(Boolean).join(' '); }
function identificacao(e){ return [e.codigo, e.patrimonio, e.mac, e.serial, nomeEq(e)].filter(Boolean).join(' • '); }
function dt(v){
  if(!v) return '-';
  try{ return new Date(v).toLocaleString('pt-BR'); }catch(e){ return String(v); }
}
function dataCurta(v){
  if(!v) return '-';
  try{ return new Date(v + 'T00:00:00').toLocaleDateString('pt-BR'); }catch(e){ return String(v); }
}
function pdfText(v){ return String(v ?? '-').replace(/\s+/g,' ').trim() || '-'; }
function fileSafe(v){ return String(v || 'equipamento').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'equipamento'; }
function normalizar(v){ return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }

function inject(){
  if(!$('navHistoricoClean')){
    const ref = $('navBaixaClean') || $('navManutencaoClean') || $('navDevolucaoClean') || $('navSaidaClean') || document.querySelector('[data-page="cadastros"]');
    const btn = document.createElement('button');
    btn.id = 'navHistoricoClean';
    btn.className = 'nav';
    btn.textContent = 'Histórico';
    btn.onclick = showPage;
    ref ? ref.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-historico-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-historico-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Histórico completo por equipamento</h2>
            <p>Consulte a linha do tempo completa: entrada, saída, devolução, manutenção, garantia e baixa. A busca de equipamento é paginada no banco.</p>
          </div>
          <button id="historicoReload" class="secondary">Recarregar dados</button>
        </div>
        <div id="historicoMsg" class="msg"></div>
      </div>

      <div class="grid two">
        <form id="historicoForm" class="card form-card">
          <h2>Selecionar equipamento</h2>
          <input id="historicoBuscaEquipamento" placeholder="Buscar por código, patrimônio, MAC, SN, modelo, status ou local">
          <select id="historicoEquipamento"></select>
          <small id="historicoTotalInfo">Mostrando até 80 equipamentos por busca.</small>
          <div class="actions">
            <button class="primary" type="submit">Carregar histórico</button>
            <button class="secondary" id="historicoLimpar" type="button">Limpar</button>
            <button class="secondary" id="historicoCsv" type="button">Copiar CSV</button>
            <button class="secondary" id="historicoPdf" type="button">Gerar PDF</button>
          </div>
        </form>

        <div class="card">
          <h2>Resumo atual</h2>
          <div id="historicoResumo" class="list"></div>
          <div id="historicoRegra" class="msg show warn">Selecione um equipamento para ver a linha do tempo.</div>
        </div>
      </div>

      <div class="card">
        <div class="table-head">
          <h2>Linha do tempo</h2>
          <input id="historicoFiltro" placeholder="Filtrar movimentos por tipo, técnico, OS, motivo, destino ou status">
        </div>
        <div id="historicoTimeline" class="list"></div>
      </div>

      <div class="card">
        <h2>Tabela detalhada</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Data</th><th>Tipo</th><th>Status</th><th>Destino</th><th>Técnico</th><th>Cliente/OS</th><th>Motivo</th><th>Obs</th></tr>
            </thead>
            <tbody id="historicoTbody"></tbody>
          </table>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  if(bound) return;
  bound = true;
  $('historicoReload').onclick = () => loadHistoricoPage().catch(e=>msg(e.message,'bad'));
  $('historicoForm').onsubmit = carregarHistorico;
  $('historicoLimpar').onclick = limpar;
  $('historicoCsv').onclick = copiarCsv;
  $('historicoPdf').onclick = gerarPdf;
  $('historicoBuscaEquipamento').oninput = () => {
    S.busca = $('historicoBuscaEquipamento')?.value || '';
    clearTimeout(S.timer);
    S.timer = setTimeout(() => carregarEquipamentosHistorico().catch(e=>msg(e.message,'bad')), 350);
  };
  $('historicoEquipamento').onchange = () => { S.selecionado = equipamentoSelecionado(); renderResumo(); };
  $('historicoFiltro').oninput = renderHistorico;
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navHistoricoClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-historico-clean'));
  const title = $('pageTitle');
  if(title) title.textContent = 'Histórico';
  loadHistoricoPage().catch(e=>msg(e.message,'bad'));
}

async function loadHistoricoPage(){
  msg('Carregando equipamentos...', 'warn');
  await carregarEquipamentosHistorico();
  renderResumo();
  renderHistorico();
  msg('Histórico pronto para consulta.', 'ok');
}

async function carregarEquipamentosHistorico(){
  if(S.carregando) return;
  S.carregando = true;
  try{
    const res = await call('rpc_pesquisar_equipamentos_7a5', {
      p_busca: S.busca || '',
      p_status_filtro: 'todos',
      p_limit: 80,
      p_offset: 0
    });
    const atuais = res.items || [];
    if(S.selecionado && !atuais.some(e=>e.id===S.selecionado.id)) atuais.unshift(S.selecionado);
    S.equipamentos = atuais;
    S.total = Number(res.total || 0);
    renderEquipSelect();
  }finally{
    S.carregando = false;
  }
}

function equipamentoSelecionado(){ return S.equipamentos.find(e => e.id === $('historicoEquipamento')?.value) || S.selecionado; }
function renderEquipSelect(){
  const rows = S.equipamentos.slice(0,80);
  $('historicoEquipamento').innerHTML = '<option value="">Selecionar equipamento</option>' + rows.map(e=>`<option value="${e.id}">${esc(identificacao(e))}</option>`).join('');
  if(S.selecionado && rows.some(e=>e.id === S.selecionado.id)) $('historicoEquipamento').value = S.selecionado.id;
  if($('historicoTotalInfo')) $('historicoTotalInfo').textContent = `Mostrando ${rows.length} de ${S.total} equipamento(s). Use a busca para localizar outros.`;
}

function renderResumo(){
  const e = equipamentoSelecionado() || S.selecionado;
  if(!e){
    $('historicoResumo').innerHTML = '<div class="item"><b>Nenhum equipamento selecionado</b><small>Busque e selecione um equipamento.</small></div>';
    $('historicoRegra').textContent = 'Selecione um equipamento para ver a linha do tempo.';
    return;
  }
  const ativo = e.ativo === false ? 'Inativo/Baixado' : 'Ativo';
  $('historicoResumo').innerHTML = `
    <div class="item"><div><b>${esc(e.codigo || '-')} • ${esc(nomeEq(e))}</b><br><small>${esc(e.mac || e.serial || e.patrimonio || 'Sem identificação')}</small></div><span class="badge">${esc(ativo)}</span></div>
    <div class="item"><div><b>Status atual</b><br><small>${esc(e.status || '-')}</small></div><span class="badge">${esc(e.local || '-')}</span></div>
    <div class="item"><div><b>Atual vinculado</b><br><small>${esc([e.tecnico_atual,e.cliente_atual,e.os_atual].filter(Boolean).join(' • ') || 'Sem vínculo atual')}</small></div></div>
    <div class="item"><div><b>Motivo atual</b><br><small>${esc(e.motivo_atual || e.motivo_baixa || '-')}</small></div></div>`;
  $('historicoRegra').textContent = 'Clique em Carregar histórico para consultar os movimentos.';
}

async function carregarHistorico(ev){
  ev.preventDefault();
  try{
    const eq = equipamentoSelecionado();
    if(!eq) throw new Error('Selecione um equipamento.');
    S.selecionado = eq;
    msg('Carregando linha do tempo via RPC...', 'warn');
    S.historico = await call('rpc_historico_equipamento', { p_equipamento_id: eq.id }) || [];
    renderResumo();
    renderHistorico();
    msg(`Histórico carregado: ${S.historico.length} movimento(s).`, 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

function movimentosFiltrados(){
  const filtro = normalizar($('historicoFiltro')?.value || '');
  return S.historico.filter(m => !filtro || normalizar([m.tipo,m.tecnico,m.os,m.motivo,m.destino,m.status_final,m.cliente,m.condicao,m.obs].filter(Boolean).join(' ')).includes(filtro));
}
function renderHistorico(){
  const rows = movimentosFiltrados();
  $('historicoTimeline').innerHTML = rows.map(m=>`
    <div class="item">
      <div>
        <b>#${esc(m.seq)} • ${esc(m.tipo || '-')}</b><br>
        <small>${esc(dataCurta(m.data))} ${m.created_at ? '• ' + esc(dt(m.created_at)) : ''}</small><br>
        <small>Status: ${esc(m.status_final || '-')} • Destino: ${esc(m.destino || '-')}</small><br>
        <small>${esc([m.tecnico,m.cliente,m.os].filter(Boolean).join(' • ') || 'Sem técnico/cliente/OS')}</small><br>
        <small>${esc([m.motivo,m.condicao,m.obs].filter(Boolean).join(' • ') || 'Sem detalhe')}</small>
      </div>
      <span class="badge">${esc(m.origem || m.responsavel || '-')}</span>
    </div>`).join('') || '<div class="item"><b>Nenhum movimento encontrado</b><small>Carregue um equipamento ou ajuste o filtro.</small></div>';

  $('historicoTbody').innerHTML = rows.map(m=>`
    <tr>
      <td>${esc(m.seq)}</td>
      <td>${esc(dataCurta(m.data))}</td>
      <td><b>${esc(m.tipo || '-')}</b></td>
      <td><span class="badge">${esc(m.status_final || '-')}</span></td>
      <td>${esc(m.destino || '-')}</td>
      <td>${esc(m.tecnico || '-')}</td>
      <td>${esc([m.cliente,m.os].filter(Boolean).join(' • ') || '-')}</td>
      <td>${esc([m.motivo,m.condicao].filter(Boolean).join(' • ') || '-')}</td>
      <td>${esc(m.obs || '-')}</td>
    </tr>`).join('') || '<tr><td colspan="9">Nenhum movimento encontrado.</td></tr>';
}

async function copiarCsv(){
  try{
    if(!S.historico.length) throw new Error('Carregue um histórico antes de copiar CSV.');
    const cols = ['seq','data','created_at','tipo','codigo','mac','serial','status_final','destino','tecnico','cliente','os','motivo','condicao','obs','responsavel','fornecedor','nf','origem'];
    const csv = [cols.join(';')].concat(S.historico.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g,'""')}"`).join(';'))).join('\n');
    await navigator.clipboard.writeText(csv);
    msg('CSV copiado para a área de transferência.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

function addPdfText(doc, text, x, y, maxWidth, lineHeight=5){
  const lines = doc.splitTextToSize(pdfText(text), maxWidth);
  for(const line of lines){
    if(y > 282){ doc.addPage(); y = 16; }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}
function addPdfSectionTitle(doc, title, y){
  if(y > 270){ doc.addPage(); y = 16; }
  doc.setFont('helvetica','bold');
  doc.setFontSize(12);
  doc.text(title, 12, y);
  doc.setDrawColor(210);
  doc.line(12, y + 2, 198, y + 2);
  doc.setFont('helvetica','normal');
  return y + 8;
}
function addFooter(doc){
  const total = doc.getNumberOfPages();
  for(let i=1;i<=total;i++){
    doc.setPage(i);
    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(`Página ${i} de ${total}`, 12, 290);
    doc.text('LIKE Estoque - Histórico de movimentações', 198, 290, { align:'right' });
    doc.setTextColor(0);
  }
}
async function gerarPdf(){
  try{
    const eq = S.selecionado || equipamentoSelecionado();
    const rows = movimentosFiltrados();
    if(!eq) throw new Error('Selecione um equipamento antes de gerar PDF.');
    if(!S.historico.length) throw new Error('Carregue o histórico antes de gerar PDF.');
    if(!rows.length) throw new Error('Nenhum movimento encontrado para gerar PDF.');
    if(!window.jspdf?.jsPDF) throw new Error('Biblioteca jsPDF não carregou. Recarregue a página.');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const generatedAt = new Date().toLocaleString('pt-BR');
    let y = 14;

    doc.setFont('helvetica','bold');
    doc.setFontSize(16);
    doc.text('LIKE Estoque', 12, y);
    doc.setFontSize(13);
    doc.text('Relatório de movimentações do equipamento', 12, y + 8);
    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.text(`Gerado em: ${generatedAt}`, 12, y + 15);
    doc.text(`Movimentos no PDF: ${rows.length}`, 198, y + 15, { align:'right' });
    y += 25;

    y = addPdfSectionTitle(doc, 'Resumo do equipamento', y);
    doc.setFontSize(10);
    y = addPdfText(doc, `Código: ${eq.codigo || '-'} | Produto: ${nomeEq(eq) || '-'} | Identificação: ${eq.mac || eq.serial || eq.patrimonio || '-'}`, 12, y, 186);
    y = addPdfText(doc, `Status atual: ${eq.status || '-'} | Local atual: ${eq.local || '-'} | Ativo: ${eq.ativo === false ? 'Não' : 'Sim'}`, 12, y, 186);
    y = addPdfText(doc, `Vínculo atual: ${[eq.tecnico_atual, eq.cliente_atual, eq.os_atual].filter(Boolean).join(' | ') || '-'}`, 12, y, 186);
    y = addPdfText(doc, `Motivo atual: ${eq.motivo_atual || eq.motivo_baixa || '-'}`, 12, y, 186);
    y += 4;

    y = addPdfSectionTitle(doc, 'Linha do tempo das movimentações', y);
    doc.setFontSize(9);

    rows.forEach((m, idx) => {
      if(y > 260){ doc.addPage(); y = 16; }
      doc.setFont('helvetica','bold');
      doc.setFontSize(10);
      doc.text(`#${m.seq || idx + 1} - ${pdfText(m.tipo)}`, 12, y);
      doc.setFont('helvetica','normal');
      doc.setFontSize(9);
      doc.text(`Data: ${dataCurta(m.data)} | Status: ${pdfText(m.status_final)} | Destino: ${pdfText(m.destino)}`, 12, y + 5);
      y += 11;
      y = addPdfText(doc, `Técnico/Cliente/OS: ${[m.tecnico, m.cliente, m.os].filter(Boolean).join(' | ') || '-'}`, 16, y, 178, 4.5);
      y = addPdfText(doc, `Motivo/Condição: ${[m.motivo, m.condicao].filter(Boolean).join(' | ') || '-'}`, 16, y, 178, 4.5);
      y = addPdfText(doc, `Observação: ${m.obs || '-'}`, 16, y, 178, 4.5);
      y = addPdfText(doc, `Origem/Responsável: ${[m.origem, m.responsavel, m.fornecedor, m.nf].filter(Boolean).join(' | ') || '-'}`, 16, y, 178, 4.5);
      doc.setDrawColor(230);
      doc.line(12, y + 1, 198, y + 1);
      y += 6;
    });

    addFooter(doc);
    const filename = `historico_${fileSafe(eq.codigo || eq.mac || eq.serial || 'equipamento')}_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(filename);
    msg(`PDF gerado: ${filename}`, 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

function limpar(){
  ['historicoBuscaEquipamento','historicoEquipamento','historicoFiltro'].forEach(id=>{ if($(id)) $(id).value=''; });
  S.selecionado = null;
  S.historico = [];
  S.busca = '';
  renderEquipSelect();
  renderResumo();
  renderHistorico();
  msg('Consulta limpa.', 'ok');
}

inject();
window.historicoCleanLoad = loadHistoricoPage;
window.historicoCleanSelectById = async function(id){
  if(!id) return false;
  if(S.equipamentos.some(e=>e.id===id)){
    $('historicoEquipamento').value = id;
    S.selecionado = equipamentoSelecionado();
    renderResumo();
    return true;
  }
  const res = await call('rpc_pesquisar_equipamentos_7a5', { p_busca:id, p_status_filtro:'todos', p_limit:10, p_offset:0 });
  const eq = (res.items || []).find(e=>e.id===id);
  if(!eq) return false;
  S.selecionado = eq;
  if(!S.equipamentos.some(e=>e.id===id)) S.equipamentos.unshift(eq);
  renderEquipSelect();
  $('historicoEquipamento').value = id;
  renderResumo();
  return true;
};
