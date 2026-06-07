import { table, call, first } from './api.js?v=3';

const S = { modelos: [], locais: [], equipamentos: [], ultimoComprovante: null };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const br = (v) => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const opId = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
const ativo = (x) => x && x.ativo !== false;
const norm = (v) => String(v || '').trim();
const normMac = (v) => norm(v).toUpperCase();
const numberValue = (id) => Number($(id)?.value || 0) || 0;
const safeFile = (v) => String(v || 'entrada').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'entrada';

function msg(text, type=''){
  const el=$('entradaMsg');
  if(el){ el.textContent=text; el.className='msg show '+type; }
}
function nomeModelo(m){ return [m.tipo,m.marca,m.modelo].filter(Boolean).join(' '); }
function isPatrimonioUnitario(m){ return String(m.categoria_estoque||'').toLowerCase()==='patrimônio' && String(m.controle||'').toLowerCase()==='unitário'; }
function modeloSelecionado(){ return S.modelos.find(x=>x.id===$('entradaModeloSelect')?.value); }
function exigeMacSn(){ const m=modeloSelecionado(); return m ? m.exige_mac_sn !== false : true; }
function travarIdentidade(){ ['entradaTipo','entradaMarca','entradaModelo'].forEach(id=>{ if($(id)) $(id).disabled=true; }); }
function atualizarMacSnUi(){
  const m = modeloSelecionado();
  const exige = exigeMacSn();
  const box = $('entradaMacSnBox');
  if(box) box.style.display = (!m || exige) ? 'grid' : 'none';
  if(m && !exige){ if($('entradaMac')) $('entradaMac').value=''; if($('entradaSerial')) $('entradaSerial').value=''; }
}
function nowBR(){ return new Date().toLocaleString('pt-BR'); }
function todayFile(){ return new Date().toISOString().slice(0,10); }

function inject(){
  if(!$('navEntradaClean')){ const cad=document.querySelector('[data-page="cadastros"]'); const btn=document.createElement('button'); btn.id='navEntradaClean'; btn.className='nav'; btn.dataset.page='entrada-clean'; btn.textContent='Entrada'; btn.onclick=showPage; cad?cad.insertAdjacentElement('afterend',btn):document.querySelector('.sidebar').appendChild(btn); }
  if(!$('page-entrada-clean')){
    const sec=document.createElement('section'); sec.id='page-entrada-clean'; sec.className='page'; sec.innerHTML=`
      <div class="card"><div class="table-head"><div><h2>Entrada de equipamento</h2><p>Entrada patrimonial unitária via RPC com comprovante PDF/WhatsApp.</p></div><button id="entradaReload" class="secondary">Recarregar dados</button></div><div id="entradaMsg" class="msg"></div></div>
      <div class="grid two"><form id="entradaForm" class="card form-card"><h2>Dados do equipamento</h2><select id="entradaModeloSelect"></select><div class="form-grid three-mini"><input id="entradaTipo" placeholder="Tipo" disabled><input id="entradaMarca" placeholder="Marca" disabled><input id="entradaModelo" placeholder="Modelo" disabled></div><div id="entradaMacSnBox" class="form-grid two"><input id="entradaMac" placeholder="MAC"><input id="entradaSerial" placeholder="Serial / SN"></div><div class="form-grid two"><select id="entradaLocal"></select><input id="entradaCusto" type="number" min="0" step="0.01" placeholder="Custo"></div><div class="form-grid two"><input id="entradaFornecedor" placeholder="Fornecedor"><input id="entradaNf" placeholder="NF / Documento"></div><input id="entradaResponsavel" placeholder="Responsável pela entrada"><input id="entradaObs" placeholder="Observação"><div class="actions"><button class="primary" type="submit">Registrar entrada</button><button class="secondary" id="entradaUltimoComprovante" type="button">Último comprovante</button><button class="secondary" id="entradaLimpar" type="button">Limpar</button></div></form><div class="card"><h2>Resumo antes de salvar</h2><div id="entradaPreview" class="list"></div><div id="entradaRegra" class="msg show warn">Selecione um patrimônio unitário.</div></div></div>
      <div class="card"><div class="table-head"><h2>Últimas entradas / equipamentos recentes</h2><input id="entradaBusca" placeholder="Filtrar código, MAC, serial, modelo ou local"></div><div class="table-wrap"><table><thead><tr><th>Código</th><th>Equipamento</th><th>MAC/SN</th><th>Status</th><th>Local</th><th>Custo</th><th>Entrada</th></tr></thead><tbody id="entradaTbody"></tbody></table></div></div>`;
    document.querySelector('.main').appendChild(sec);
  }
  $('entradaReload').onclick=()=>loadEntrada().catch(e=>msg(e.message,'bad'));
  $('entradaForm').onsubmit=salvarEntrada;
  $('entradaLimpar').onclick=limparForm;
  $('entradaUltimoComprovante').onclick=copiarUltimoComprovante;
  $('entradaModeloSelect').onchange=selecionarModelo;
  $('entradaBusca').oninput=renderTabela;
  ['entradaMac','entradaSerial','entradaLocal','entradaCusto','entradaFornecedor','entradaNf','entradaResponsavel','entradaObs'].forEach(id=>{ const el=$(id); if(el) el.addEventListener('input',renderPreview); });
  travarIdentidade(); atualizarMacSnUi();
}
function showPage(){ inject(); document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.id==='navEntradaClean')); document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='page-entrada-clean')); if($('pageTitle')) $('pageTitle').textContent='Entrada'; loadEntrada().catch(e=>msg(e.message,'bad')); }
async function loadEntrada(){ msg('Carregando modelos, locais e equipamentos...','warn'); S.modelos=await table('modelos','tipo',true); S.locais=await table('locais','nome',true); S.equipamentos=await table('equipamentos','created_at',false); fillSelects(); atualizarMacSnUi(); renderPreview(); renderTabela(); msg('Entrada pronta para uso.','ok'); }
function fillSelects(){ const modelos=S.modelos.filter(ativo).filter(isPatrimonioUnitario); $('entradaModeloSelect').innerHTML='<option value="">Selecionar patrimônio unitário</option>'+modelos.map(m=>`<option value="${m.id}">${esc(nomeModelo(m))}${m.exige_mac_sn===false?' • sem MAC/SN obrigatório':''}</option>`).join(''); const locais=S.locais.filter(ativo); $('entradaLocal').innerHTML=locais.map(l=>`<option value="${esc(l.nome)}">${esc(l.nome)}</option>`).join('')||'<option value="Estoque central">Estoque central</option>'; const central=locais.find(l=>String(l.nome||'').toLowerCase().includes('estoque')); if(central) $('entradaLocal').value=central.nome; }
function selecionarModelo(){ const m=modeloSelecionado(); if(!m){ atualizarMacSnUi(); return renderPreview(); } $('entradaTipo').value=m.tipo||''; $('entradaMarca').value=m.marca||''; $('entradaModelo').value=m.modelo||''; $('entradaCusto').value=m.custo_padrao||m.custo||0; travarIdentidade(); atualizarMacSnUi(); renderPreview(); }
function payload(){ const m=modeloSelecionado(); const tipo=norm($('entradaTipo').value), marca=norm($('entradaMarca').value), modelo=norm($('entradaModelo').value); const mac=normMac($('entradaMac')?.value), serial=norm($('entradaSerial')?.value).toUpperCase(); const local=norm($('entradaLocal').value)||'Estoque central'; const custo=numberValue('entradaCusto'); const fornecedor=norm($('entradaFornecedor').value), nf=norm($('entradaNf').value), responsavel=norm($('entradaResponsavel').value), obs=norm($('entradaObs').value); if(!m) throw new Error('Selecione um produto/modelo patrimonial.'); if(!tipo||!marca||!modelo) throw new Error('Produto selecionado inválido.'); if(exigeMacSn() && !mac && !serial) throw new Error('Este patrimônio exige MAC ou Serial/SN.'); return {tipo,marca,modelo,mac,serial,local,custo,fornecedor,nf,responsavel,obs,exige:exigeMacSn()}; }
function renderPreview(){ atualizarMacSnUi(); let p; try{p=payload();}catch(e){$('entradaPreview').innerHTML=`<div class="item"><b>Pendente</b><small>${esc(e.message)}</small></div>`; if($('entradaRegra')) $('entradaRegra').textContent=e.message; return;} if($('entradaRegra')) $('entradaRegra').textContent=p.exige?'Regra: este patrimônio exige MAC ou Serial/SN.':'Regra: este patrimônio não exige MAC/SN. Os campos foram ocultados.'; $('entradaPreview').innerHTML=`<div class="item"><div><b>${esc(p.tipo)} ${esc(p.marca)} ${esc(p.modelo)}</b><br><small>${esc(p.mac||p.serial||'Sem MAC/SN')}</small></div><span class="badge">${br(p.custo)}</span></div><div class="item"><div><b>Local</b><br><small>${esc(p.local)}</small></div><span class="badge">Em estoque</span></div><div class="item"><div><b>Origem</b><br><small>${esc([p.fornecedor,p.nf].filter(Boolean).join(' • ')||'Não informada')}</small></div></div><div class="item"><div><b>Responsável</b><br><small>${esc(p.responsavel||'Não informado')}</small></div></div>`; }

function snapshot(p, result, protocolo){
  return {
    protocolo,
    gerado_em: nowBR(),
    codigo: result?.codigo || 'gerado',
    status: result?.status || 'Em estoque',
    tipo: result?.tipo || p.tipo,
    marca: result?.marca || p.marca,
    modelo: result?.modelo || p.modelo,
    mac: result?.mac || p.mac,
    serial: result?.serial || p.serial,
    patrimonio: result?.patrimonio || result?.codigo || '',
    local: result?.local || p.local,
    custo: result?.custo ?? p.custo,
    fornecedor: p.fornecedor,
    nf: p.nf,
    responsavel: p.responsavel,
    obs: p.obs
  };
}
function textoComprovante(c){
  const linhas=[];
  linhas.push('✅ COMPROVANTE DE ENTRADA DE EQUIPAMENTO');
  linhas.push('Protocolo: ' + (c.protocolo || '-'));
  linhas.push('Data/Hora: ' + (c.gerado_em || nowBR()));
  linhas.push('Código: ' + (c.codigo || '-'));
  linhas.push('Equipamento: ' + [c.tipo,c.marca,c.modelo].filter(Boolean).join(' '));
  linhas.push('MAC/SN: ' + (c.mac || c.serial || '-'));
  linhas.push('Local: ' + (c.local || '-'));
  linhas.push('Custo: ' + br(c.custo));
  if(c.fornecedor) linhas.push('Fornecedor: ' + c.fornecedor);
  if(c.nf) linhas.push('NF/Documento: ' + c.nf);
  linhas.push('Responsável: ' + (c.responsavel || 'Não informado'));
  if(c.obs) linhas.push('Obs: ' + c.obs);
  linhas.push('');
  linhas.push('Entrada registrada e conferida no estoque.');
  return linhas.join('\n');
}
async function copiarTexto(texto, okMsg){
  try{
    await navigator.clipboard.writeText(texto);
    if(okMsg) msg(okMsg,'ok');
  }catch(e){
    window.prompt('Copie o comprovante:', texto);
  }
}
async function copiarUltimoComprovante(){
  if(!S.ultimoComprovante) return msg('Nenhum comprovante gerado nesta sessão.','warn');
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
function gerarPdf(c){
  if(!window.jspdf?.jsPDF) throw new Error('Biblioteca jsPDF não carregou.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  let y=14;
  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('LIKE Estoque',12,y); y+=8;
  doc.setFontSize(13); doc.text('Comprovante de entrada de equipamento',12,y); y+=7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y=addPdfText(doc,`Protocolo: ${c.protocolo || '-'} | Gerado em: ${c.gerado_em || nowBR()}`,12,y,186);
  y=addPdfText(doc,`Código: ${c.codigo || '-'} | Status: ${c.status || 'Em estoque'} | Local: ${c.local || '-'}`,12,y,186);
  y=addPdfText(doc,`Fornecedor: ${c.fornecedor || '-'} | NF/Documento: ${c.nf || '-'} | Responsável: ${c.responsavel || '-'}`,12,y,186);
  y=addPdfText(doc,`Custo: ${br(c.custo)} | Observação: ${c.obs || '-'}`,12,y,186);
  y+=4; doc.setDrawColor(210); doc.line(12,y,198,y); y+=7;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('Equipamento recebido',12,y); y+=7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y=addPdfText(doc,`Modelo: ${[c.tipo,c.marca,c.modelo].filter(Boolean).join(' ')}`,12,y,186);
  y=addPdfText(doc,`MAC/SN: ${c.mac || c.serial || '-'} | Patrimônio: ${c.patrimonio || '-'}`,12,y,186);
  y+=20;
  if(y>250){ doc.addPage(); y=30; }
  doc.setDrawColor(120); doc.line(20,y,90,y); doc.line(120,y,190,y); y+=5;
  doc.setFontSize(9); doc.text('Responsável pela entrada',31,y); doc.text('Conferência / Estoque',139,y);
  doc.setFontSize(8); doc.setTextColor(110); doc.text('Documento gerado pelo LIKE Estoque • Entrada individual.',12,290); doc.setTextColor(0);
  const filename = `comprovante_entrada_${safeFile(c.codigo || c.modelo)}_${todayFile()}.pdf`;
  doc.save(filename);
  return filename;
}
async function salvarEntrada(ev){
  ev.preventDefault();
  try{
    const p=payload();
    msg('Registrando entrada via RPC...','warn');
    const protocolo = opId();
    const result=first(await call('rpc_registrar_entrada_equipamento',{p_tipo:p.tipo,p_marca:p.marca,p_modelo:p.modelo,p_mac:p.mac,p_serial:p.serial,p_local:p.local,p_custo:p.custo,p_observacao:p.obs,p_fornecedor:p.fornecedor,p_nf:p.nf,p_responsavel:p.responsavel,p_client_operation_id:protocolo}));
    const comp = snapshot(p, result, protocolo);
    S.ultimoComprovante = comp;
    let pdfMsg='';
    try{ const file = gerarPdf(comp); pdfMsg = ` PDF gerado: ${file}.`; }catch(pdfErr){ pdfMsg = ` PDF não gerado: ${pdfErr.message}.`; }
    await copiarTexto(textoComprovante(comp), '');
    msg(`Entrada registrada com sucesso. Código: ${result?.codigo||'gerado'}. Comprovante WhatsApp copiado.${pdfMsg}`,'ok');
    limparForm(false);
    await loadEntrada();
  }catch(e){msg(e.message||String(e),'bad')}
}
function limparForm(clearMsg=true){ ['entradaModeloSelect','entradaTipo','entradaMarca','entradaModelo','entradaMac','entradaSerial','entradaCusto','entradaFornecedor','entradaNf','entradaResponsavel','entradaObs'].forEach(id=>{if($(id))$(id).value=''}); travarIdentidade(); atualizarMacSnUi(); if(clearMsg) msg('Formulário limpo.','ok'); renderPreview(); }
function renderTabela(){ const filtro=($('entradaBusca')?.value||'').toLowerCase(); const rows=S.equipamentos.filter(e=>!filtro||JSON.stringify(e).toLowerCase().includes(filtro)).slice(0,40); $('entradaTbody').innerHTML=rows.map(e=>`<tr><td><b>${esc(e.codigo||'-')}</b></td><td>${esc(nomeModelo(e))}</td><td>${esc(e.mac||e.serial||'-')}</td><td><span class="badge">${esc(e.status||'-')}</span></td><td>${esc(e.local||'-')}</td><td>${br(e.custo)}</td><td>${esc(e.created_at?new Date(e.created_at).toLocaleString('pt-BR'):'-')}</td></tr>`).join('')||'<tr><td colspan="7">Nenhum equipamento encontrado.</td></tr>'; }

inject(); window.entradaCleanLoad=loadEntrada;
