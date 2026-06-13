import { table, call, first } from './api.js?v=5';
import { openMovimentacaoModal } from './movimentacao_modal.js?v=1';

const S = { equipamentos: [], tecnicos: [], selecionado: null, ultimoComprovante: null, total: 0, busca: '', timer: null, carregando: false };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const opId = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
const ativo = (x) => x && x.ativo !== false;
const norm = (v) => String(v || '').trim();
const safeFile = (v) => String(v || 'baixa').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'baixa';
const normalizar = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
let bound = false;

const STATUS_ELEGIVEIS = ['aguardando baixa','inutilizado','defeituoso','manutencao','manutencao','em manutencao','em manutencao','garantia'];

function msg(text, type=''){
  const el = $('baixaMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeEq(e){ return [e?.tipo,e?.marca,e?.modelo].filter(Boolean).join(' ') || e?.codigo || '-'; }
function identificacao(e){ return [e.codigo, e.mac, e.serial, nomeEq(e)].filter(Boolean).join(' • '); }
function statusLower(e){ return normalizar(e.status); }
function localLower(e){ return normalizar(e.local); }
function nowBR(){ return new Date().toLocaleString('pt-BR'); }
function todayFile(){ return new Date().toISOString().slice(0,10); }
function isElegivelBaixa(e){
  if(!ativo(e)) return false;
  const s = statusLower(e);
  const l = localLower(e);
  return STATUS_ELEGIVEIS.includes(s) || l.includes('manutencao') || l.includes('garantia');
}

function inject(){
  if(!$('navBaixaClean')){
    const ref = $('navManutencaoClean') || $('navDevolucaoClean') || $('navSaidaClean') || document.querySelector('[data-page="cadastros"]');
    const btn = document.createElement('button');
    btn.id = 'navBaixaClean';
    btn.className = 'nav';
    btn.textContent = 'Baixa';
    btn.onclick = showPage;
    ref ? ref.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-baixa-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-baixa-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Baixa controlada</h2>
            <p>Finalize a baixa lógica de equipamentos já avaliados tecnicamente. Não exclui fisicamente o registro. A fila é buscada no banco.</p>
          </div>
          <button id="baixaReload" class="secondary">Recarregar dados</button>
        </div>
        <div id="baixaMsg" class="msg"></div>
      </div>

      <div class="grid two">
        <form id="baixaForm" class="card form-card">
          <h2>Dados da baixa</h2>
          <input id="baixaBuscaEquipamento" placeholder="Buscar por código, MAC, SN, modelo, status ou motivo">
          <select id="baixaEquipamento"></select>
          <select id="baixaResponsavel"></select>
          <textarea id="baixaMotivo" rows="5" placeholder="Motivo da baixa obrigatório, mínimo 10 caracteres"></textarea>
          <input id="baixaObs" placeholder="Observação complementar">
          <div class="actions">
            <button class="danger" type="submit">Revisar baixa</button>
            <button class="secondary" id="baixaUltimoComprovante" type="button">Último comprovante</button>
            <button class="secondary" id="baixaLimpar" type="button">Limpar</button>
          </div>
        </form>

        <div class="card">
          <h2>Resumo antes de confirmar</h2>
          <div id="baixaPreview" class="list"></div>
          <div id="baixaRegra" class="msg show warn">Selecione um equipamento elegível para baixa.</div>
        </div>
      </div>

      <div class="card">
        <div class="table-head">
          <div>
            <h2>Fila elegível para baixa</h2>
            <p id="baixaTotalInfo">Mostrando até 80 equipamentos.</p>
          </div>
          <input id="baixaFiltroTabela" placeholder="Filtrar lista carregada">
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Equipamento</th><th>MAC</th><th>SN</th><th>Status</th><th>Local</th><th>Motivo atual</th><th>Ação</th></tr></thead>
            <tbody id="baixaTbody"></tbody>
          </table>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  if(bound) return;
  bound = true;
  $('baixaReload').onclick = () => loadBaixa().catch(e=>msg(e.message,'bad'));
  $('baixaForm').onsubmit = abrirConfirmacao;
  $('baixaLimpar').onclick = limparForm;
  $('baixaUltimoComprovante').onclick = copiarUltimoComprovante;
  $('baixaBuscaEquipamento').oninput = () => {
    S.busca = $('baixaBuscaEquipamento')?.value || '';
    clearTimeout(S.timer);
    S.timer = setTimeout(() => carregarEquipamentosBaixa().catch(e=>msg(e.message,'bad')), 350);
  };
  $('baixaEquipamento').onchange = selecionarEquipamento;
  ['baixaResponsavel','baixaMotivo','baixaObs','baixaFiltroTabela'].forEach(id=>{
    const el = $(id);
    if(el) el.addEventListener('input', () => { if(id === 'baixaFiltroTabela') renderTabela(); else renderPreview(); });
  });
  document.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-baixa-eq]');
    if(!btn) return;
    selecionarEquipamentoId(btn.dataset.baixaEq);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navBaixaClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-baixa-clean'));
  const title = $('pageTitle');
  if(title) title.textContent = 'Baixa controlada';
  loadBaixa().catch(e=>msg(e.message,'bad'));
}

async function loadBaixa(){
  msg('Carregando fila de baixa...', 'warn');
  S.tecnicos = await table('tecnicos','nome',true);
  fillResponsaveis();
  await carregarEquipamentosBaixa();
  renderPreview();
  msg('Baixa controlada pronta para uso.', 'ok');
}

async function carregarEquipamentosBaixa(){
  if(S.carregando) return;
  S.carregando = true;
  try{
    const res = await call('rpc_pesquisar_equipamentos_7a5', {
      p_busca: S.busca || '',
      p_status_filtro: 'baixa',
      p_limit: 80,
      p_offset: 0
    });
    const atuais = res.items || [];
    if(S.selecionado && !atuais.some(e=>e.id===S.selecionado.id)) atuais.unshift(S.selecionado);
    S.equipamentos = atuais.filter(isElegivelBaixa);
    S.total = Number(res.total || 0);
    renderEquipSelect();
    renderTabela();
  }finally{
    S.carregando = false;
  }
}

function fillResponsaveis(){
  const tecnicos = S.tecnicos.filter(ativo);
  $('baixaResponsavel').innerHTML = '<option value="">Responsável pela baixa</option>' + tecnicos.map(t=>`<option value="${esc(t.nome)}">${esc(t.nome)}</option>`).join('');
}
function equipamentosElegiveis(){ return S.equipamentos.filter(isElegivelBaixa); }
function equipamentoSelecionado(){ return S.equipamentos.find(e=>e.id === $('baixaEquipamento')?.value) || S.selecionado; }
function selecionarEquipamentoId(id){
  const eq = S.equipamentos.find(e=>e.id === id);
  if(!eq) return;
  S.selecionado = eq;
  renderEquipSelect();
  $('baixaEquipamento').value = id;
  selecionarEquipamento();
}
function renderEquipSelect(){
  const rows = equipamentosElegiveis().slice(0,80);
  $('baixaEquipamento').innerHTML = '<option value="">Selecionar equipamento para baixa</option>' + rows.map(e=>`<option value="${e.id}">${esc(identificacao(e))}</option>`).join('');
  if(S.selecionado && rows.some(e=>e.id === S.selecionado.id)) $('baixaEquipamento').value = S.selecionado.id;
}
function selecionarEquipamento(){
  S.selecionado = equipamentoSelecionado();
  renderPreview();
}

function payload(){
  const eq = equipamentoSelecionado();
  const responsavel = norm($('baixaResponsavel').value);
  const motivo = norm($('baixaMotivo').value);
  const obs = norm($('baixaObs').value);
  if(!eq) throw new Error('Selecione um equipamento elegível para baixa.');
  if(!isElegivelBaixa(eq)) throw new Error('Esse equipamento não está elegível para baixa controlada.');
  if(!responsavel) throw new Error('Selecione o responsável pela baixa.');
  if(!motivo || motivo.length < 10) throw new Error('Informe motivo da baixa com pelo menos 10 caracteres.');
  return { eq, responsavel, motivo, obs };
}

function resumoHtml(p){
  return `
    <div class="item"><div><b>${esc(p.eq.codigo || '-')} • ${esc(nomeEq(p.eq))}</b><br><small>MAC: ${esc(p.eq.mac || '-')} • SN: ${esc(p.eq.serial || '-')}</small></div><span class="badge">${esc(p.eq.status || '-')}</span></div>
    <div class="item"><div><b>Local atual</b><br><small>${esc(p.eq.local || '-')}</small></div><span class="badge">Baixado</span></div>
    <div class="item"><div><b>Responsável</b><br><small>${esc(p.responsavel)}</small></div></div>
    <div class="item"><div><b>Motivo</b><br><small>${esc(p.motivo)}</small></div></div>
    <div class="item"><div><b>Observação</b><br><small>${esc(p.obs || 'Sem observação')}</small></div></div>
    <div class="msg show bad">Esta ação remove o equipamento da operação ativa e não deve ser usada para devolução comum.</div>`;
}
function renderPreview(){
  let p;
  try{ p = payload(); }
  catch(e){
    $('baixaPreview').innerHTML = `<div class="item"><b>Pendente</b><small>${esc(e.message)}</small></div>`;
    $('baixaRegra').textContent = e.message;
    return;
  }
  $('baixaRegra').textContent = 'Revise com atenção. A baixa é lógica e remove o equipamento da operação ativa.';
  $('baixaPreview').innerHTML = resumoHtml(p);
}
async function abrirConfirmacao(ev){
  ev.preventDefault();
  try{
    const p = payload();
    const ok = await openMovimentacaoModal({
      title: 'Confirmar baixa controlada',
      subtitle: 'A baixa deixa o equipamento inativo e registra histórico definitivo. Após confirmar, será gerado comprovante.',
      html: resumoHtml(p),
      confirmText: 'Confirmar baixa',
      danger: true
    });
    if(ok) await confirmarBaixa(p);
  }catch(e){ msg(e.message || String(e), 'bad'); renderPreview(); }
}

function snapshot(p, result, protocolo){
  return {
    protocolo,
    gerado_em: nowBR(),
    responsavel: p.responsavel,
    motivo: p.motivo,
    obs: p.obs,
    status_final: result?.status || result?.status_final || 'Baixado',
    equipamento: {
      codigo: result?.codigo || p.eq.codigo,
      patrimonio: result?.patrimonio || p.eq.patrimonio,
      mac: result?.mac || p.eq.mac,
      serial: result?.serial || p.eq.serial,
      tipo: result?.tipo || p.eq.tipo,
      marca: result?.marca || p.eq.marca,
      modelo: result?.modelo || p.eq.modelo,
      status_anterior: p.eq.status,
      local_anterior: p.eq.local,
      motivo_anterior: p.eq.motivo_atual || p.eq.motivo_baixa,
      tecnico_anterior: p.eq.tecnico_atual,
      cliente_anterior: p.eq.cliente_atual,
      os_anterior: p.eq.os_atual,
      custo: p.eq.custo
    }
  };
}
function textoComprovante(s){
  const linhas = [];
  linhas.push('COMPROVANTE DE BAIXA CONTROLADA');
  linhas.push('Protocolo: ' + (s.protocolo || '-'));
  linhas.push('Data/Hora: ' + (s.gerado_em || nowBR()));
  linhas.push('Responsável: ' + (s.responsavel || '-'));
  linhas.push('Motivo: ' + (s.motivo || '-'));
  if(s.obs) linhas.push('Obs: ' + s.obs);
  linhas.push('');
  linhas.push('EQUIPAMENTO:');
  linhas.push(`${s.equipamento.codigo || '-'} | ${nomeEq(s.equipamento)} | MAC: ${s.equipamento.mac || '-'} | SN: ${s.equipamento.serial || '-'} | Patrimônio: ${s.equipamento.patrimonio || '-'}`);
  linhas.push('Status anterior: ' + (s.equipamento.status_anterior || '-'));
  linhas.push('Local anterior: ' + (s.equipamento.local_anterior || '-'));
  linhas.push('Status final: ' + (s.status_final || 'Baixado'));
  linhas.push('');
  linhas.push('Registro de baixa lógica mantido para auditoria interna.');
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
    doc.text(line, x, y); y += lineHeight;
  }
  return y;
}
function gerarPdf(s){
  if(!window.jspdf?.jsPDF) throw new Error('Biblioteca jsPDF não carregou.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  let y = 14;
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('LIKE Estoque', 12, y); y += 8;
  doc.setFontSize(13); doc.text('Comprovante de baixa controlada', 12, y); y += 7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y = addPdfText(doc, `Protocolo: ${s.protocolo || '-'} | Gerado em: ${s.gerado_em || nowBR()}`, 12, y, 186);
  y = addPdfText(doc, `Responsável: ${s.responsavel || '-'} | Status final: ${s.status_final || 'Baixado'}`, 12, y, 186);
  y = addPdfText(doc, `Motivo: ${s.motivo || '-'}`, 12, y, 186);
  y = addPdfText(doc, `Observação: ${s.obs || '-'}`, 12, y, 186);
  y += 4; doc.setDrawColor(210); doc.line(12, y, 198, y); y += 7;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('Equipamento', 12, y); y += 7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y = addPdfText(doc, `Código: ${s.equipamento.codigo || '-'} | Patrimônio: ${s.equipamento.patrimonio || '-'}`, 12, y, 186);
  y = addPdfText(doc, `Modelo: ${nomeEq(s.equipamento)}`, 12, y, 186);
  y = addPdfText(doc, `MAC: ${s.equipamento.mac || '-'} | SN: ${s.equipamento.serial || '-'}`, 12, y, 186);
  y = addPdfText(doc, `Status anterior: ${s.equipamento.status_anterior || '-'} | Local anterior: ${s.equipamento.local_anterior || '-'}`, 12, y, 186);
  y = addPdfText(doc, `Origem anterior: ${[s.equipamento.tecnico_anterior,s.equipamento.cliente_anterior].filter(Boolean).join(' • ') || '-'}`, 12, y, 186);
  y = addPdfText(doc, `Motivo anterior: ${s.equipamento.motivo_anterior || '-'}`, 12, y, 186);
  if(s.equipamento.custo) y = addPdfText(doc, `Custo registrado: R$ ${Number(s.equipamento.custo || 0).toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})}`, 12, y, 186);
  y += 16;
  if(y > 250){ doc.addPage(); y = 30; }
  doc.setDrawColor(120); doc.line(20, y, 90, y); doc.line(120, y, 190, y); y += 5;
  doc.setFontSize(9); doc.text('Responsável pela baixa', 33, y); doc.text('Conferência / Auditoria', 138, y);
  doc.setFontSize(8); doc.setTextColor(110); doc.text('Documento gerado pelo LIKE Estoque - baixa lógica sem exclusão física.', 12, 290); doc.setTextColor(0);
  const filename = `comprovante_baixa_${safeFile(s.equipamento.codigo || s.responsavel)}_${todayFile()}.pdf`;
  doc.save(filename);
  return filename;
}

async function confirmarBaixa(p){
  try{
    msg('Registrando baixa controlada via RPC...', 'warn');
    const protocolo = opId();
    const result = first(await call('rpc_baixar_equipamento_controlado', {
      p_equipamento_id: p.eq.id,
      p_motivo: p.motivo,
      p_responsavel: p.responsavel,
      p_observacao: p.obs,
      p_client_operation_id: protocolo
    }));
    const comp = snapshot(p, result, protocolo);
    S.ultimoComprovante = comp;
    let pdfMsg = '';
    try{
      const file = gerarPdf(comp);
      pdfMsg = ` PDF gerado: ${file}.`;
    }catch(pdfErr){
      pdfMsg = ` PDF não gerado: ${pdfErr.message}.`;
    }
    await copiarTexto(textoComprovante(comp), '');
    msg(`Baixa registrada. Status: ${result?.status || 'Baixado'}. Comprovante WhatsApp copiado.${pdfMsg}`, 'ok');
    limparForm(false);
    await loadBaixa();
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

function limparForm(show=true){
  ['baixaBuscaEquipamento','baixaEquipamento','baixaResponsavel','baixaMotivo','baixaObs','baixaFiltroTabela'].forEach(id=>{ if($(id)) $(id).value=''; });
  S.selecionado = null;
  S.busca = '';
  renderEquipSelect();
  renderPreview();
  if(show) msg('Formulário limpo.', 'ok');
}
function renderTabela(){
  const filtro = normalizar($('baixaFiltroTabela')?.value || '');
  const rows = equipamentosElegiveis().filter(e => !filtro || normalizar([e.codigo,e.mac,e.serial,e.tipo,e.marca,e.modelo,e.status,e.local,e.motivo_atual,e.motivo_baixa].filter(Boolean).join(' ')).includes(filtro)).slice(0,80);
  if($('baixaTotalInfo')) $('baixaTotalInfo').textContent = `Mostrando ${S.equipamentos.length} de ${S.total} elegíveis. Use a busca para localizar outros.`;
  $('baixaTbody').innerHTML = rows.map(e=>`
    <tr>
      <td><b>${esc(e.codigo || '-')}</b></td>
      <td>${esc(nomeEq(e))}</td>
      <td>${esc(e.mac || '-')}</td>
      <td>${esc(e.serial || '-')}</td>
      <td><span class="badge">${esc(e.status || '-')}</span></td>
      <td>${esc(e.local || '-')}</td>
      <td>${esc(e.motivo_atual || e.motivo_baixa || '-')}</td>
      <td><button class="danger" data-baixa-eq="${e.id}">Selecionar</button></td>
    </tr>`).join('') || '<tr><td colspan="8">Nenhum equipamento elegível para baixa.</td></tr>';
}

inject();
window.baixaCleanLoad = loadBaixa;
window.baixaCleanSelectById = async function(id){
  if(!id) return false;
  if(S.equipamentos.some(e=>e.id===id)){ selecionarEquipamentoId(id); return true; }
  const res = await call('rpc_pesquisar_equipamentos_7a5', { p_busca:id, p_status_filtro:'todos', p_limit:10, p_offset:0 });
  const eq = (res.items || []).find(e=>e.id===id);
  if(!eq) return false;
  S.selecionado = eq;
  if(!S.equipamentos.some(e=>e.id===id)) S.equipamentos.unshift(eq);
  renderEquipSelect();
  $('baixaEquipamento').value = id;
  selecionarEquipamento();
  return true;
};