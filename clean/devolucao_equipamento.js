import { table, call, first } from './api.js?v=5';
import { openMovimentacaoModal } from './movimentacao_modal.js?v=1';

const S = { equipamentos: [], tecnicos: [], locais: [], selecionado: null, ultimoComprovante: null, total: 0, busca: '', timer: null, carregando: false };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const opId = () => globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8); return v.toString(16); });
const ativo = x => x && x.ativo !== false;
const norm = v => String(v || '').trim();
const safeFile = v => String(v || 'devolucao').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'devolucao';
let bound = false;

function msg(text, type=''){
  const el = $('devolucaoMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeEq(e){ return [e?.tipo,e?.marca,e?.modelo].filter(Boolean).join(' ') || e?.codigo || '-'; }
function identificacao(e){ return [e.codigo, e.mac, e.serial, nomeEq(e)].filter(Boolean).join(' • '); }
function statusLower(e){ return String(e?.status || '').toLowerCase(); }
function nowBR(){ return new Date().toLocaleString('pt-BR'); }
function todayFile(){ return new Date().toISOString().slice(0,10); }
function isElegivelDevolucao(e){
  if(!ativo(e)) return false;
  return ['com técnico','com tecnico','instalado cliente','instalado no cliente','na rua','reservado'].includes(statusLower(e));
}
function destinoPorCondicao(condicao){
  const c = String(condicao || '').toLowerCase();
  if(c === 'bom') return 'Estoque central';
  if(c === 'sucata/inutilizar') return 'Inutilizado';
  return 'Manutenção';
}

function inject(){
  if(!$('navDevolucaoClean')){
    const ref = $('navSaidaClean') || $('navRetornoSemCadastroClean') || $('navEntradaLoteClean') || $('navEntradaClean') || document.querySelector('[data-page="cadastros"]');
    const btn = document.createElement('button');
    btn.id = 'navDevolucaoClean';
    btn.className = 'nav';
    btn.textContent = 'Devolução';
    btn.onclick = showPage;
    ref ? ref.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-devolucao-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-devolucao-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Devolução de equipamento</h2>
            <p>Busca equipamentos elegíveis direto no banco. Preparado para base grande sem carregar todos os equipamentos.</p>
          </div>
          <button id="devolucaoReload" class="secondary">Recarregar dados</button>
        </div>
        <div id="devolucaoMsg" class="msg"></div>
      </div>
      <div class="grid two">
        <form id="devolucaoForm" class="card form-card">
          <h2>Dados da devolução</h2>
          <input id="devolucaoBuscaEquipamento" placeholder="Buscar por código, MAC, SN, técnico, cliente ou OS">
          <select id="devolucaoEquipamento"></select>
          <div class="form-grid two">
            <select id="devolucaoTecnico"></select>
            <select id="devolucaoCondicao">
              <option value="Bom">Bom</option>
              <option value="Testar" selected>Testar</option>
              <option value="Defeituoso">Defeituoso</option>
              <option value="Sucata/Inutilizar">Sucata/Inutilizar</option>
            </select>
          </div>
          <div class="form-grid two">
            <select id="devolucaoDestino"></select>
            <input id="devolucaoOs" placeholder="OS / Atendimento">
          </div>
          <input id="devolucaoMotivo" placeholder="Motivo">
          <input id="devolucaoObs" placeholder="Observação">
          <div class="actions">
            <button class="primary" type="submit">Revisar devolução</button>
            <button class="secondary" id="devolucaoUltimoComprovante" type="button">Último comprovante</button>
            <button class="secondary" id="devolucaoLimpar" type="button">Limpar</button>
          </div>
        </form>
        <div class="card">
          <h2>Resumo antes de confirmar</h2>
          <div id="devolucaoPreview" class="list"></div>
          <div id="devolucaoRegra" class="msg show warn">Pesquise e selecione um equipamento em uso/fora do estoque.</div>
        </div>
      </div>
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Equipamentos elegíveis para devolução</h2>
            <p id="devolucaoTotalInfo">Mostrando até 80 equipamentos.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Equipamento</th><th>MAC/SN</th><th>Status</th><th>Atual</th><th>OS</th><th>Ação</th></tr></thead>
            <tbody id="devolucaoTbody"></tbody>
          </table>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  if(bound) return;
  bound = true;
  $('devolucaoReload').onclick = () => loadDevolucao().catch(e=>msg(e.message,'bad'));
  $('devolucaoForm').onsubmit = abrirConfirmacao;
  $('devolucaoLimpar').onclick = limparForm;
  $('devolucaoUltimoComprovante').onclick = copiarUltimoComprovante;
  $('devolucaoBuscaEquipamento').oninput = () => {
    S.busca = $('devolucaoBuscaEquipamento').value || '';
    clearTimeout(S.timer);
    S.timer = setTimeout(() => carregarEquipamentosElegiveis().catch(e=>msg(e.message,'bad')), 350);
  };
  $('devolucaoEquipamento').onchange = selecionarEquipamento;
  $('devolucaoCondicao').onchange = () => { ajustarDestinoPorCondicao(); renderPreview(); };
  $('devolucaoTecnico').onchange = renderPreview;
  ['devolucaoDestino','devolucaoOs','devolucaoMotivo','devolucaoObs'].forEach(id=>{
    const el=$(id); if(el) el.addEventListener('input', renderPreview);
  });
  document.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-devolucao-eq]');
    if(!btn) return;
    selecionarEquipamentoId(btn.dataset.devolucaoEq);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navDevolucaoClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-devolucao-clean'));
  const title = $('pageTitle');
  if(title) title.textContent = 'Devolução';
  loadDevolucao().catch(e=>msg(e.message,'bad'));
}

async function loadDevolucao(){
  msg('Carregando dados da devolução...', 'warn');
  S.tecnicos = await table('tecnicos','nome',true);
  S.locais = await table('locais','nome',true);
  fillTecnicos();
  fillDestinos();
  await carregarEquipamentosElegiveis();
  renderPreview();
  msg('Devolução pronta para uso.', 'ok');
}

async function carregarEquipamentosElegiveis(){
  if(S.carregando) return;
  S.carregando = true;
  try{
    const res = await call('rpc_pesquisar_equipamentos_7a5', {
      p_busca: S.busca || '',
      p_status_filtro: 'devolucao',
      p_limit: 80,
      p_offset: 0
    });
    const atuais = res.items || [];
    if(S.selecionado && !atuais.some(e => e.id === S.selecionado.id)) atuais.unshift(S.selecionado);
    S.equipamentos = atuais.filter(isElegivelDevolucao);
    S.total = Number(res.total || 0);
    renderEquipSelect();
    renderTabela();
  }finally{
    S.carregando = false;
  }
}

function fillTecnicos(){
  const tecnicos = S.tecnicos.filter(ativo);
  $('devolucaoTecnico').innerHTML = '<option value="">Técnico que devolveu</option>' + tecnicos.map(t=>`<option value="${esc(t.nome)}">${esc(t.nome)}</option>`).join('');
}
function fillDestinos(){
  const nomes = new Set(S.locais.filter(ativo).map(l=>l.nome).filter(Boolean));
  ['Estoque central','Manutenção','Inutilizado'].forEach(x=>nomes.add(x));
  $('devolucaoDestino').innerHTML = [...nomes].map(l=>`<option value="${esc(l)}">${esc(l)}</option>`).join('');
  ajustarDestinoPorCondicao(false);
}
function equipamentoSelecionado(){ return S.equipamentos.find(e=>e.id===$('devolucaoEquipamento')?.value) || S.selecionado; }
function selecionarEquipamentoId(id){
  const eq = S.equipamentos.find(e => e.id === id);
  if(!eq) return;
  S.selecionado = eq;
  renderEquipSelect();
  $('devolucaoEquipamento').value = id;
  selecionarEquipamento();
}
function renderEquipSelect(){
  const rows = S.equipamentos.slice(0,80);
  $('devolucaoEquipamento').innerHTML = '<option value="">Selecionar equipamento para devolução</option>' + rows.map(e=>`<option value="${e.id}">${esc(identificacao(e))}</option>`).join('');
  if(S.selecionado && rows.some(e=>e.id===S.selecionado.id)) $('devolucaoEquipamento').value = S.selecionado.id;
}
function selecionarEquipamento(){
  S.selecionado = equipamentoSelecionado();
  const eq = S.selecionado;
  if(eq){
    if(eq.tecnico_atual) $('devolucaoTecnico').value = eq.tecnico_atual;
    if(eq.os_atual) $('devolucaoOs').value = eq.os_atual;
  }
  renderPreview();
}
function ajustarDestinoPorCondicao(doRender=true){
  const destino = destinoPorCondicao($('devolucaoCondicao')?.value);
  if($('devolucaoDestino')) $('devolucaoDestino').value = destino;
  if(doRender) renderPreview();
}

function payload(){
  const eq = equipamentoSelecionado();
  const tecnico = norm($('devolucaoTecnico').value || eq?.tecnico_atual);
  const condicao = norm($('devolucaoCondicao').value) || 'Testar';
  const destino = norm($('devolucaoDestino').value) || destinoPorCondicao(condicao);
  const os = norm($('devolucaoOs').value || eq?.os_atual);
  const motivo = norm($('devolucaoMotivo').value) || 'Devolução operacional';
  const obs = norm($('devolucaoObs').value);
  if(!eq) throw new Error('Selecione um equipamento para devolução.');
  if(!isElegivelDevolucao(eq)) throw new Error('Esse equipamento não está elegível para devolução.');
  if(!condicao) throw new Error('Selecione a condição do equipamento.');
  if(!destino) throw new Error('Informe o destino da devolução.');
  return { eq, tecnico, condicao, destino, os, motivo, obs };
}

function resumoHtml(p){
  return `
    <div class="item"><div><b>${esc(p.eq.codigo || '-')} • ${esc(nomeEq(p.eq))}</b><br><small>${esc(p.eq.mac || p.eq.serial || 'Sem MAC/SN')}</small></div><span class="badge">${esc(p.eq.status || '-')}</span></div>
    <div class="item"><div><b>Atual</b><br><small>${esc([p.eq.tecnico_atual,p.eq.cliente_atual,p.eq.local].filter(Boolean).join(' • ') || 'Não informado')}</small></div></div>
    <div class="item"><div><b>Condição</b><br><small>${esc(p.condicao)}</small></div><span class="badge">${esc(p.destino)}</span></div>
    <div class="item"><div><b>Técnico / OS</b><br><small>${esc([p.tecnico,p.os].filter(Boolean).join(' • ') || 'Não informado')}</small></div></div>
    <div class="item"><div><b>Motivo / Observação</b><br><small>${esc([p.motivo,p.obs].filter(Boolean).join(' • ') || 'Sem observação')}</small></div></div>`;
}
function renderPreview(){
  let p;
  try{ p = payload(); }
  catch(e){ $('devolucaoPreview').innerHTML = `<div class="item"><b>Pendente</b><small>${esc(e.message)}</small></div>`; $('devolucaoRegra').textContent = e.message; return; }
  $('devolucaoRegra').textContent = 'Revise os dados antes de confirmar a devolução. Após confirmar, o sistema gera PDF e copia WhatsApp.';
  $('devolucaoPreview').innerHTML = resumoHtml(p);
}
async function abrirConfirmacao(ev){
  ev.preventDefault();
  try{
    const p = payload();
    const ok = await openMovimentacaoModal({
      title: 'Confirmar devolução',
      subtitle: 'A devolução altera status, local e histórico do equipamento. Depois da confirmação será gerado comprovante PDF e texto WhatsApp.',
      html: resumoHtml(p),
      confirmText: 'Confirmar devolução e gerar comprovante'
    });
    if(ok) await confirmarDevolucao(p);
  }catch(e){ msg(e.message,'bad'); renderPreview(); }
}

function snapshot(p, result, protocolo){
  return {
    protocolo,
    gerado_em: nowBR(),
    tecnico: p.tecnico,
    condicao: p.condicao,
    destino: p.destino,
    os: p.os,
    motivo: p.motivo,
    obs: p.obs,
    status_final: result?.status || result?.status_final || 'Atualizado',
    equipamento: { codigo: result?.codigo || p.eq.codigo, patrimonio: result?.patrimonio || p.eq.patrimonio, mac: result?.mac || p.eq.mac, serial: result?.serial || p.eq.serial, tipo: result?.tipo || p.eq.tipo, marca: result?.marca || p.eq.marca, modelo: result?.modelo || p.eq.modelo, status_anterior: p.eq.status, local_anterior: p.eq.local, tecnico_anterior: p.eq.tecnico_atual, cliente_anterior: p.eq.cliente_atual, os_anterior: p.eq.os_atual }
  };
}
function textoComprovante(s){
  const linhas = [];
  linhas.push('✅ COMPROVANTE DE DEVOLUÇÃO DE EQUIPAMENTO');
  linhas.push('Protocolo: ' + (s.protocolo || '-'));
  linhas.push('Data/Hora: ' + (s.gerado_em || nowBR()));
  linhas.push('Condição: ' + (s.condicao || '-'));
  linhas.push('Destino: ' + (s.destino || '-'));
  if(s.tecnico) linhas.push('Técnico que devolveu: ' + s.tecnico);
  linhas.push('OS/Ref: ' + (s.os || 'Não informada'));
  if(s.motivo) linhas.push('Motivo: ' + s.motivo);
  if(s.obs) linhas.push('Obs: ' + s.obs);
  linhas.push('');
  linhas.push('EQUIPAMENTO DEVOLVIDO:');
  linhas.push(`${s.equipamento.codigo || '-'} | ${nomeEq(s.equipamento)} | MAC/SN: ${s.equipamento.mac || s.equipamento.serial || '-'} | Patrimônio: ${s.equipamento.patrimonio || '-'}`);
  linhas.push('Status anterior: ' + (s.equipamento.status_anterior || '-'));
  linhas.push('Status final: ' + (s.status_final || '-'));
  linhas.push('');
  linhas.push('Declaro que o equipamento acima foi devolvido/conferido conforme registrado.');
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
function gerarPdf(s){
  if(!window.jspdf?.jsPDF) throw new Error('Biblioteca jsPDF não carregou.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  let y = 14;
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('LIKE Estoque', 12, y); y += 8;
  doc.setFontSize(13); doc.text('Comprovante de devolução de equipamento', 12, y); y += 7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y = addPdfText(doc, `Protocolo: ${s.protocolo || '-'} | Gerado em: ${s.gerado_em || nowBR()}`, 12, y, 186);
  y = addPdfText(doc, `Condição: ${s.condicao || '-'} | Destino: ${s.destino || '-'} | Status final: ${s.status_final || '-'}`, 12, y, 186);
  y = addPdfText(doc, `Técnico: ${s.tecnico || '-'} | OS/Ref: ${s.os || 'Não informada'}`, 12, y, 186);
  y = addPdfText(doc, `Motivo: ${s.motivo || '-'} | Observação: ${s.obs || '-'}`, 12, y, 186);
  y += 4; doc.setDrawColor(210); doc.line(12, y, 198, y); y += 7;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('Equipamento devolvido', 12, y); y += 7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y = addPdfText(doc, `Código: ${s.equipamento.codigo || '-'} | Patrimônio: ${s.equipamento.patrimonio || '-'}`, 12, y, 186);
  y = addPdfText(doc, `Modelo: ${nomeEq(s.equipamento)}`, 12, y, 186);
  y = addPdfText(doc, `MAC/SN: ${s.equipamento.mac || s.equipamento.serial || '-'}`, 12, y, 186);
  y = addPdfText(doc, `Origem anterior: ${[s.equipamento.tecnico_anterior,s.equipamento.cliente_anterior,s.equipamento.local_anterior].filter(Boolean).join(' • ') || '-'}`, 12, y, 186);
  y += 20;
  if(y > 250){ doc.addPage(); y = 30; }
  doc.setDrawColor(120); doc.line(20, y, 90, y); doc.line(120, y, 190, y); y += 5;
  doc.setFontSize(9); doc.text('Responsável pelo recebimento', 28, y); doc.text('Técnico / Entregador', 140, y);
  doc.setFontSize(8); doc.setTextColor(110); doc.text('Documento gerado pelo LIKE Estoque • Devolução.', 12, 290); doc.setTextColor(0);
  const filename = `comprovante_devolucao_${safeFile(s.equipamento.codigo || s.tecnico)}_${todayFile()}.pdf`;
  doc.save(filename);
  return filename;
}

async function confirmarDevolucao(p){
  try{
    msg('Registrando devolução via RPC...', 'warn');
    const protocolo = opId();
    const result = first(await call('rpc_registrar_devolucao_equipamento', { p_equipamento_id:p.eq.id, p_tecnico:p.tecnico, p_condicao:p.condicao, p_destino:p.destino, p_os:p.os, p_motivo:p.motivo, p_observacao:p.obs, p_client_operation_id:protocolo }));
    const comp = snapshot(p, result, protocolo);
    S.ultimoComprovante = comp;
    let pdfMsg = '';
    try{ pdfMsg = ` PDF gerado: ${gerarPdf(comp)}.`; }catch(pdfErr){ pdfMsg = ` PDF não gerado: ${pdfErr.message}.`; }
    await copiarTexto(textoComprovante(comp), '');
    msg(`Devolução registrada. Status: ${result?.status || 'atualizado'}. Comprovante WhatsApp copiado.${pdfMsg}`, 'ok');
    limparForm(false);
    await loadDevolucao();
  }catch(e){ msg(e.message || String(e),'bad'); }
}

function limparForm(show=true){
  ['devolucaoBuscaEquipamento','devolucaoEquipamento','devolucaoTecnico','devolucaoOs','devolucaoMotivo','devolucaoObs'].forEach(id=>{ if($(id)) $(id).value=''; });
  if($('devolucaoCondicao')) $('devolucaoCondicao').value='Testar';
  ajustarDestinoPorCondicao(false);
  S.selecionado = null;
  S.busca = '';
  renderEquipSelect();
  renderPreview();
  if(show) msg('Formulário limpo.', 'ok');
}
function renderTabela(){
  if($('devolucaoTotalInfo')) $('devolucaoTotalInfo').textContent = `Mostrando ${S.equipamentos.length} de ${S.total} elegíveis. Use a busca para localizar outros.`;
  $('devolucaoTbody').innerHTML = S.equipamentos.map(e=>`
    <tr>
      <td><b>${esc(e.codigo || '-')}</b></td>
      <td>${esc(nomeEq(e))}</td>
      <td>${esc(e.mac || e.serial || '-')}</td>
      <td><span class="badge">${esc(e.status || '-')}</span></td>
      <td>${esc([e.tecnico_atual,e.cliente_atual,e.local].filter(Boolean).join(' • ') || '-')}</td>
      <td>${esc(e.os_atual || '-')}</td>
      <td><button class="secondary" data-devolucao-eq="${e.id}">Selecionar</button></td>
    </tr>`).join('') || '<tr><td colspan="7">Nenhum equipamento elegível para devolução.</td></tr>';
}

inject();
window.devolucaoCleanLoad = loadDevolucao;
window.devolucaoCleanSelectById = async function(id){
  if(!id) return false;
  const atual = S.equipamentos.find(e => e.id === id);
  if(atual){ selecionarEquipamentoId(id); return true; }
  const res = await call('rpc_pesquisar_equipamentos_7a5', { p_busca:id, p_status_filtro:'todos', p_limit:10, p_offset:0 });
  const eq = (res.items || []).find(e => e.id === id);
  if(eq){
    S.selecionado = eq;
    if(!S.equipamentos.some(e => e.id === id)) S.equipamentos.unshift(eq);
    renderEquipSelect();
    $('devolucaoEquipamento').value = id;
    selecionarEquipamento();
    return true;
  }
  return false;
};
