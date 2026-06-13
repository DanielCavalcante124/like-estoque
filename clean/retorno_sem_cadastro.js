import { table, call, first } from './api.js?v=5';

const S = { modelos: [], locais: [], tecnicos: [], retornos: [], ultimoComprovante: null, timer: null };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const br = v => Number(v || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const opId = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
const ativo = x => x && x.ativo !== false;
const norm = v => String(v || '').trim();
const upper = v => norm(v).toUpperCase();
const safeFile = v => String(v || 'retorno').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'retorno';
const todayFile = () => new Date().toISOString().slice(0,10);
const nowBR = () => new Date().toLocaleString('pt-BR');

function msg(text, type=''){
  const el = $('retornoMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeModelo(m){ return [m?.tipo, m?.marca, m?.modelo].filter(Boolean).join(' '); }
function isPatrimonioUnitario(m){ return String(m.categoria_estoque || '').toLowerCase() === 'patrimônio' && String(m.controle || '').toLowerCase() === 'unitário'; }
function modeloSelecionado(){ return S.modelos.find(x => x.id === $('retornoModeloSelect')?.value); }
function exigeMacSn(){ const m = modeloSelecionado(); return m ? m.exige_mac_sn !== false : true; }
function destinoPorCondicao(condicao){
  const c = String(condicao || '').toLowerCase();
  if(c === 'bom') return 'Estoque central';
  if(c === 'sucata/inutilizar') return 'Inutilizado';
  return 'Manutenção';
}
function numberValue(id){ return Number($(id)?.value || 0) || 0; }
function travarIdentidade(){ ['retornoTipo','retornoMarca','retornoModelo'].forEach(id => { if($(id)) $(id).disabled = true; }); }
function atualizarMacSnUi(){
  const m = modeloSelecionado();
  const exige = exigeMacSn();
  const box = $('retornoMacSnBox');
  if(box) box.style.display = (!m || exige) ? 'grid' : 'none';
  if(m && !exige){
    if($('retornoMac')) $('retornoMac').value = '';
    if($('retornoSerial')) $('retornoSerial').value = '';
  }
}

function inject(){
  if(!$('navRetornoSemCadastroClean')){
    const ref = $('navEntradaLoteClean') || $('navEntradaClean') || document.querySelector('[data-page="cadastros"]');
    const btn = document.createElement('button');
    btn.id = 'navRetornoSemCadastroClean';
    btn.className = 'nav';
    btn.textContent = 'Retorno sem cadastro';
    btn.onclick = showPage;
    ref ? ref.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar')?.appendChild(btn);
  }

  if(!$('page-retorno-sem-cadastro-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-retorno-sem-cadastro-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Retorno sem cadastro</h2>
            <p>Use quando um equipamento antigo voltou da rua e ainda não existe no sistema. A duplicidade de MAC/SN é validada no banco.</p>
          </div>
          <button id="retornoReload" class="secondary">Recarregar dados</button>
        </div>
        <div id="retornoMsg" class="msg"></div>
      </div>
      <div class="grid two">
        <form id="retornoForm" class="card form-card">
          <h2>Identificação do retorno</h2>
          <select id="retornoModeloSelect"></select>
          <div class="form-grid three-mini">
            <input id="retornoTipo" placeholder="Tipo" disabled>
            <input id="retornoMarca" placeholder="Marca" disabled>
            <input id="retornoModelo" placeholder="Modelo" disabled>
          </div>
          <div id="retornoMacSnBox" class="form-grid two">
            <input id="retornoMac" placeholder="MAC">
            <input id="retornoSerial" placeholder="Serial / SN">
          </div>
          <div class="form-grid two">
            <select id="retornoTecnico"></select>
            <select id="retornoCondicao">
              <option value="Bom">Bom</option>
              <option value="Testar" selected>Testar</option>
              <option value="Defeituoso">Defeituoso</option>
              <option value="Sucata/Inutilizar">Sucata/Inutilizar</option>
            </select>
          </div>
          <div class="form-grid two">
            <select id="retornoDestino"></select>
            <input id="retornoCusto" type="number" min="0" step="0.01" placeholder="Custo estimado">
          </div>
          <input id="retornoResponsavel" placeholder="Responsável pelo lançamento">
          <input id="retornoObs" placeholder="Observação do retorno">
          <div class="actions">
            <button class="primary" type="submit">Registrar retorno</button>
            <button class="secondary" id="retornoUltimoComprovante" type="button">Último comprovante</button>
            <button class="secondary" id="retornoLimpar" type="button">Limpar</button>
          </div>
        </form>
        <div class="card">
          <h2>Resumo antes de salvar</h2>
          <div id="retornoPreview" class="list"></div>
          <div id="retornoRegra" class="msg show warn">Selecione um patrimônio unitário.</div>
        </div>
      </div>
      <div class="card">
        <div class="table-head">
          <h2>Últimos retornos sem cadastro</h2>
          <input id="retornoBusca" placeholder="Filtrar código, técnico, MAC, serial, modelo ou condição">
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Equipamento</th><th>MAC</th><th>SN</th><th>Técnico</th><th>Condição</th><th>Status</th><th>Local</th><th>Data</th></tr></thead>
            <tbody id="retornoTbody"></tbody>
          </table>
        </div>
      </div>`;
    document.querySelector('.main')?.appendChild(sec);
  }

  $('retornoReload').onclick = () => loadRetorno().catch(e => msg(e.message, 'bad'));
  $('retornoForm').onsubmit = salvarRetorno;
  $('retornoLimpar').onclick = limparForm;
  $('retornoUltimoComprovante').onclick = copiarUltimoComprovante;
  $('retornoModeloSelect').onchange = selecionarModelo;
  $('retornoCondicao').onchange = ajustarDestinoPorCondicao;
  $('retornoBusca').oninput = () => {
    clearTimeout(S.timer);
    S.timer = setTimeout(() => carregarRetornosRecentes().catch(e => msg(e.message, 'bad')), 350);
  };
  ['retornoMac','retornoSerial'].forEach(id => {
    const el = $(id);
    if(el) el.addEventListener('input', () => {
      renderPreview();
      clearTimeout(S.timer);
      S.timer = setTimeout(() => validarIdentidadeFormulario().catch(() => {}), 450);
    });
  });
  ['retornoTecnico','retornoDestino','retornoCusto','retornoResponsavel','retornoObs'].forEach(id => {
    const el = $(id);
    if(el) el.addEventListener('input', renderPreview);
  });
  travarIdentidade();
  atualizarMacSnUi();
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navRetornoSemCadastroClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-retorno-sem-cadastro-clean'));
  const title = $('pageTitle');
  if(title) title.textContent = 'Retorno sem cadastro';
  loadRetorno().catch(e => msg(e.message, 'bad'));
}

async function loadRetorno(){
  msg('Carregando dados de retorno...', 'warn');
  S.modelos = await table('modelos','tipo',true);
  S.locais = await table('locais','nome',true);
  S.tecnicos = await table('tecnicos','nome',true);
  await carregarRetornosRecentes();
  fillSelects();
  atualizarMacSnUi();
  renderPreview();
  msg('Retorno sem cadastro pronto para uso.', 'ok');
}

async function carregarRetornosRecentes(){
  const busca = $('retornoBusca')?.value || '';
  const res = await call('rpc_pesquisar_equipamentos_7a5', {
    p_busca: busca,
    p_status_filtro: 'retorno_sem_cadastro',
    p_limit: 60,
    p_offset: 0
  });
  S.retornos = res.items || [];
  renderTabela();
}

function fillSelects(){
  const modelos = S.modelos.filter(ativo).filter(isPatrimonioUnitario);
  $('retornoModeloSelect').innerHTML = '<option value="">Selecionar patrimônio unitário</option>' + modelos.map(m => `<option value="${m.id}">${esc(nomeModelo(m))}${m.exige_mac_sn===false?' • sem MAC/SN obrigatório':''}</option>`).join('');
  const tecnicos = S.tecnicos.filter(ativo);
  $('retornoTecnico').innerHTML = '<option value="">Técnico que devolveu</option>' + tecnicos.map(t => `<option value="${esc(t.nome)}">${esc(t.nome)}</option>`).join('');
  const nomesLocais = new Set(S.locais.filter(ativo).map(l => l.nome).filter(Boolean));
  ['Estoque central','Manutenção','Inutilizado'].forEach(l => nomesLocais.add(l));
  $('retornoDestino').innerHTML = [...nomesLocais].map(l => `<option value="${esc(l)}">${esc(l)}</option>`).join('');
  ajustarDestinoPorCondicao(false);
}

function selecionarModelo(){
  const m = modeloSelecionado();
  if(!m){ atualizarMacSnUi(); return renderPreview(); }
  $('retornoTipo').value = m.tipo || '';
  $('retornoMarca').value = m.marca || '';
  $('retornoModelo').value = m.modelo || '';
  $('retornoCusto').value = m.custo_padrao || m.custo || 0;
  travarIdentidade();
  atualizarMacSnUi();
  renderPreview();
}

function ajustarDestinoPorCondicao(doRender=true){
  const destino = destinoPorCondicao($('retornoCondicao')?.value);
  if($('retornoDestino')) $('retornoDestino').value = destino;
  if(doRender) renderPreview();
}

async function buscarEquipamentoExistente(mac, serial){
  const termo = mac || serial || '';
  if(!termo) return null;
  const res = await call('rpc_pesquisar_equipamentos_7a5', {
    p_busca: termo,
    p_status_filtro: 'todos',
    p_limit: 10,
    p_offset: 0
  });
  return (res.items || []).find(e => (mac && upper(e.mac) === mac) || (serial && upper(e.serial) === serial)) || null;
}

async function validarIdentidadeFormulario(){
  if(!exigeMacSn()) return null;
  const mac = upper($('retornoMac')?.value).replace(/-/g, ':');
  const serial = upper($('retornoSerial')?.value);
  if(!mac && !serial) return null;
  const existente = await buscarEquipamentoExistente(mac, serial);
  if(existente && $('retornoRegra')){
    const id = mac && upper(existente.mac) === mac ? `MAC ${mac}` : `Serial/SN ${serial}`;
    $('retornoRegra').textContent = `Já existe equipamento com ${id}: ${existente.codigo || '-'} • Status ${existente.status || '-'}`;
  }
  return existente;
}

function payloadPreview(){
  const m = modeloSelecionado();
  const tipo = norm($('retornoTipo').value);
  const marca = norm($('retornoMarca').value);
  const modelo = norm($('retornoModelo').value);
  const mac = upper($('retornoMac')?.value).replace(/-/g, ':');
  const serial = upper($('retornoSerial')?.value);
  const tecnico = norm($('retornoTecnico').value);
  const condicao = norm($('retornoCondicao').value) || 'Testar';
  const destino = norm($('retornoDestino').value) || destinoPorCondicao(condicao);
  const custo = numberValue('retornoCusto');
  const responsavel = norm($('retornoResponsavel').value);
  const obs = norm($('retornoObs').value);
  if(!m) throw new Error('Selecione um produto/modelo patrimonial.');
  if(!tipo || !marca || !modelo) throw new Error('Produto selecionado inválido.');
  if(exigeMacSn() && !mac && !serial) throw new Error('Este patrimônio exige MAC ou Serial/SN.');
  return { tipo, marca, modelo, mac, serial, tecnico, condicao, destino, custo, responsavel, obs, exige: exigeMacSn() };
}

async function payload(){
  const p = payloadPreview();
  const existente = await validarIdentidadeFormulario();
  if(existente){
    const id = p.mac && upper(existente.mac) === p.mac ? `MAC ${p.mac}` : `Serial/SN ${p.serial}`;
    throw new Error(`Já existe equipamento com esse ${id} no sistema: ${existente.codigo || '-'}.`);
  }
  return p;
}

function renderPreview(){
  atualizarMacSnUi();
  let p;
  try{ p = payloadPreview(); }
  catch(e){
    $('retornoPreview').innerHTML = `<div class="item"><b>Pendente</b><small>${esc(e.message)}</small></div>`;
    if($('retornoRegra')) $('retornoRegra').textContent = e.message;
    return;
  }
  if($('retornoRegra')) $('retornoRegra').textContent = p.exige ? 'Regra: este patrimônio exige MAC ou Serial/SN. A duplicidade é validada no banco.' : 'Regra: este patrimônio não exige MAC/SN. Os campos foram ocultados.';
  $('retornoPreview').innerHTML = `
    <div class="item"><div><b>${esc(p.tipo)} ${esc(p.marca)} ${esc(p.modelo)}</b><br><small>MAC: ${esc(p.mac || '-')} • SN: ${esc(p.serial || '-')}</small></div><span class="badge">${br(p.custo)}</span></div>
    <div class="item"><div><b>Técnico</b><br><small>${esc(p.tecnico || 'Não informado')}</small></div><span class="badge">Retorno</span></div>
    <div class="item"><div><b>Condição</b><br><small>${esc(p.condicao)}</small></div><span class="badge">${esc(p.destino)}</span></div>
    <div class="item"><div><b>Responsável</b><br><small>${esc(p.responsavel || 'Não informado')}</small></div></div>
    <div class="item"><div><b>Observação</b><br><small>${esc(p.obs || 'Sem observação')}</small></div></div>`;
}

function snapshot(p, result, protocolo){
  return { protocolo, gerado_em: nowBR(), codigo: result?.codigo || 'gerado', status: result?.status || 'Registrado', tipo: result?.tipo || p.tipo, marca: result?.marca || p.marca, modelo: result?.modelo || p.modelo, mac: result?.mac || p.mac, serial: result?.serial || p.serial, tecnico: result?.tecnico_devolucao || p.tecnico, condicao: result?.condicao_retorno || p.condicao, destino: result?.local || p.destino, custo: result?.custo ?? p.custo, responsavel: p.responsavel, obs: p.obs };
}
function textoComprovante(c){
  return [
    'COMPROVANTE DE RETORNO SEM CADASTRO',
    'Protocolo: ' + (c.protocolo || '-'),
    'Data/Hora: ' + (c.gerado_em || nowBR()),
    'Código gerado: ' + (c.codigo || '-'),
    'Equipamento: ' + [c.tipo,c.marca,c.modelo].filter(Boolean).join(' '),
    'MAC: ' + (c.mac || '-'),
    'SN: ' + (c.serial || '-'),
    'Técnico que devolveu: ' + (c.tecnico || 'Não informado'),
    'Condição: ' + (c.condicao || '-'),
    'Destino: ' + (c.destino || '-'),
    'Custo estimado: ' + br(c.custo),
    'Responsável: ' + (c.responsavel || 'Não informado'),
    c.obs ? 'Obs: ' + c.obs : '',
    '',
    'Retorno sem cadastro registrado e conferido para regularização do estoque.'
  ].filter(Boolean).join('\n');
}
async function copiarTexto(texto, okMsg){
  await navigator.clipboard.writeText(texto);
  if(okMsg) msg(okMsg, 'ok');
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
function gerarPdf(c){
  if(!window.jspdf?.jsPDF) throw new Error('Biblioteca jsPDF não carregou.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  let y = 14;
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('LIKE Estoque', 12, y); y += 8;
  doc.setFontSize(13); doc.text('Comprovante de retorno sem cadastro', 12, y); y += 7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y = addPdfText(doc, `Protocolo: ${c.protocolo || '-'} | Gerado em: ${c.gerado_em || nowBR()}`, 12, y, 186);
  y = addPdfText(doc, `Código: ${c.codigo || '-'} | Status: ${c.status || '-'} | Destino: ${c.destino || '-'}`, 12, y, 186);
  y = addPdfText(doc, `Técnico: ${c.tecnico || '-'} | Condição: ${c.condicao || '-'} | Responsável: ${c.responsavel || '-'}`, 12, y, 186);
  y = addPdfText(doc, `Custo estimado: ${br(c.custo)} | Observação: ${c.obs || '-'}`, 12, y, 186);
  y += 4; doc.setDrawColor(210); doc.line(12, y, 198, y); y += 7;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('Equipamento recebido', 12, y); y += 7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y = addPdfText(doc, `Modelo: ${[c.tipo,c.marca,c.modelo].filter(Boolean).join(' ')}`, 12, y, 186);
  y = addPdfText(doc, `MAC: ${c.mac || '-'} | SN: ${c.serial || '-'}`, 12, y, 186);
  y += 20;
  if(y > 250){ doc.addPage(); y = 30; }
  doc.setDrawColor(120); doc.line(20, y, 90, y); doc.line(120, y, 190, y); y += 5;
  doc.setFontSize(9); doc.text('Responsável pelo recebimento', 28, y); doc.text('Conferência / Regularização', 133, y);
  doc.setFontSize(8); doc.setTextColor(110); doc.text('Documento gerado pelo LIKE Estoque • Retorno sem cadastro.', 12, 290); doc.setTextColor(0);
  const filename = `comprovante_retorno_sem_cadastro_${safeFile(c.codigo || c.modelo)}_${todayFile()}.pdf`;
  doc.save(filename);
  return filename;
}

async function salvarRetorno(ev){
  ev.preventDefault();
  try{
    const p = await payload();
    msg('Registrando retorno sem cadastro via RPC...', 'warn');
    const protocolo = opId();
    const result = first(await call('rpc_registrar_retorno_sem_cadastro', { p_tipo:p.tipo, p_marca:p.marca, p_modelo:p.modelo, p_mac:p.mac, p_serial:p.serial, p_tecnico:p.tecnico, p_condicao:p.condicao, p_destino:p.destino, p_observacao:p.obs, p_responsavel:p.responsavel, p_custo:p.custo, p_client_operation_id:protocolo }));
    const comp = snapshot(p, result, protocolo);
    S.ultimoComprovante = comp;
    let pdfMsg = '';
    try{ pdfMsg = ` PDF gerado: ${gerarPdf(comp)}.`; }catch(pdfErr){ pdfMsg = ` PDF não gerado: ${pdfErr.message}.`; }
    await copiarTexto(textoComprovante(comp), '');
    msg(`Retorno sem cadastro registrado. Código: ${result?.codigo || 'gerado'}. Comprovante WhatsApp copiado.${pdfMsg}`, 'ok');
    limparForm(false);
    await loadRetorno();
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

function limparForm(show=true){
  ['retornoModeloSelect','retornoTipo','retornoMarca','retornoModelo','retornoMac','retornoSerial','retornoTecnico','retornoCusto','retornoResponsavel','retornoObs'].forEach(id => { if($(id)) $(id).value=''; });
  if($('retornoCondicao')) $('retornoCondicao').value='Testar';
  ajustarDestinoPorCondicao(false);
  travarIdentidade();
  atualizarMacSnUi();
  if(show) msg('Formulário limpo.', 'ok');
  renderPreview();
}

function renderTabela(){
  const rows = S.retornos || [];
  $('retornoTbody').innerHTML = rows.map(e => `
    <tr>
      <td><b>${esc(e.codigo || '-')}</b></td>
      <td>${esc(nomeModelo(e))}</td>
      <td>${esc(e.mac || '-')}</td>
      <td>${esc(e.serial || '-')}</td>
      <td>${esc(e.tecnico_devolucao || '-')}</td>
      <td>${esc(e.condicao_retorno || '-')}</td>
      <td><span class="badge">${esc(e.status || '-')}</span></td>
      <td>${esc(e.local || '-')}</td>
      <td>${esc(e.retorno_data || (e.created_at ? new Date(e.created_at).toLocaleDateString('pt-BR') : '-'))}</td>
    </tr>`).join('') || '<tr><td colspan="9">Nenhum retorno sem cadastro encontrado.</td></tr>';
}

inject();
window.retornoSemCadastroCleanLoad = loadRetorno;