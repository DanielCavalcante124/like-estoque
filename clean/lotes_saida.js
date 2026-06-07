import { call } from './api.js?v=3';

const S = { lotes: [], selecionado: null };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const qtd = (v) => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
const fmt = (v) => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return String(v || '-'); } };
const safeFile = (v) => String(v || 'lote').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'lote';

function msg(text, type=''){
  const el = $('lotesMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function nomeEq(e){ return [e.tipo,e.marca,e.modelo].filter(Boolean).join(' ') || e.codigo || '-'; }
function nomeMat(m){ return [m.tipo,m.marca,m.modelo].filter(Boolean).join(' ') || 'Material'; }
function byProto(p){ return S.lotes.find(l => String(l.protocolo) === String(p)); }

function injectCss(){
  if($('lotesSaidaCss')) return;
  const s = document.createElement('style');
  s.id = 'lotesSaidaCss';
  s.textContent = `
    .lote-card{border:1px solid #e5e7eb;border-radius:16px;padding:12px;background:#fff;margin:10px 0;cursor:pointer}
    .lote-card.active{border-color:#0f4c81;box-shadow:0 0 0 3px rgba(15,76,129,.12)}
    .lote-card h3{margin:0 0 6px}.lote-card small{color:#64748b;overflow-wrap:anywhere}.lote-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:8px}.lote-box{background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:8px}.lote-box small{font-weight:800}.lote-box b{display:block;overflow-wrap:anywhere;margin-top:3px}
    .lote-detail-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.lote-detail-head h2{margin:0}.lote-list{display:grid;gap:8px}.lote-row{display:flex;justify-content:space-between;gap:10px;border:1px solid #e5e7eb;background:#f8fafc;border-radius:14px;padding:10px}.lote-row div{min-width:0}.lote-row b,.lote-row small{overflow-wrap:anywhere}.lote-row small{color:#64748b}
    @media(max-width:900px){.lote-grid{grid-template-columns:1fr 1fr}.lote-row{flex-direction:column}}
    @media(max-width:520px){.lote-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}

function inject(){
  injectCss();
  if(!$('navLotesSaidaClean')){
    const ref = $('navOperacaoRapidaClean') || document.querySelector('[data-page="dashboard"]');
    const btn = document.createElement('button');
    btn.id = 'navLotesSaidaClean';
    btn.className = 'nav';
    btn.textContent = 'Lotes de saída';
    btn.onclick = showPage;
    ref ? ref.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }
  if(!$('page-lotes-saida-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-lotes-saida-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Histórico de lotes de saída</h2>
            <p>Consulte saídas confirmadas por protocolo, técnico, OS, equipamento ou material.</p>
          </div>
          <button id="lotesReload" class="secondary">Recarregar</button>
        </div>
        <div class="form-grid two">
          <input id="lotesBusca" placeholder="Buscar protocolo, técnico, OS, MAC, SN, código ou material">
          <select id="lotesLimit"><option value="25">25 lotes</option><option value="50" selected>50 lotes</option><option value="100">100 lotes</option><option value="200">200 lotes</option></select>
        </div>
        <div class="form-grid two">
          <input id="lotesIni" type="date">
          <input id="lotesFim" type="date">
        </div>
        <div class="actions">
          <button id="lotesBuscar" class="primary">Buscar lotes</button>
          <button id="lotesLimpar" class="secondary">Limpar filtros</button>
        </div>
        <div id="lotesMsg" class="msg show">Clique em buscar para carregar os lotes.</div>
      </div>
      <div class="kpis">
        <div class="kpi"><small>Lotes carregados</small><b id="lotesKTotal">0</b></div>
        <div class="kpi"><small>Equipamentos</small><b id="lotesKEq">0</b></div>
        <div class="kpi"><small>Materiais</small><b id="lotesKMat">0</b></div>
        <div class="kpi"><small>Último lote</small><b id="lotesKUltimo">-</b></div>
      </div>
      <div class="grid two">
        <div class="card">
          <h2>Lotes</h2>
          <div id="lotesLista"></div>
        </div>
        <div class="card">
          <div class="lote-detail-head">
            <div><h2 id="loteTitulo">Selecione um lote</h2><p id="loteSub">Nenhum lote selecionado.</p></div>
            <div class="actions">
              <button id="lotePdf" class="primary">PDF</button>
              <button id="loteWhats" class="secondary">WhatsApp</button>
            </div>
          </div>
          <div id="loteDetalhe"></div>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }
  $('lotesReload').onclick = load;
  $('lotesBuscar').onclick = load;
  $('lotesLimpar').onclick = limparFiltros;
  $('lotesBusca').onkeyup = (ev) => { if(ev.key === 'Enter') load(); };
  $('lotePdf').onclick = () => S.selecionado ? gerarPdf(S.selecionado) : msg('Selecione um lote.', 'bad');
  $('loteWhats').onclick = () => S.selecionado ? copiarWhats(S.selecionado) : msg('Selecione um lote.', 'bad');
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navLotesSaidaClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-lotes-saida-clean'));
  if($('pageTitle')) $('pageTitle').textContent = 'Lotes de saída';
  load();
}

async function load(){
  try{
    msg('Carregando lotes...', 'warn');
    const result = await call('rpc_historico_lotes_saida', {
      p_busca: $('lotesBusca')?.value.trim() || null,
      p_data_ini: $('lotesIni')?.value || null,
      p_data_fim: $('lotesFim')?.value || null,
      p_limit: Number($('lotesLimit')?.value || 50)
    });
    S.lotes = result?.lotes || [];
    if(S.selecionado){
      S.selecionado = byProto(S.selecionado.protocolo) || null;
    }
    renderLista();
    renderDetalhe();
    msg(S.lotes.length ? `${S.lotes.length} lote(s) carregado(s).` : 'Nenhum lote encontrado.', S.lotes.length ? 'ok' : 'warn');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

function renderLista(){
  const box = $('lotesLista');
  if(!box) return;
  $('lotesKTotal').textContent = S.lotes.length;
  $('lotesKEq').textContent = S.lotes.reduce((a,l)=>a+Number(l.equipamentos_count || 0),0);
  $('lotesKMat').textContent = S.lotes.reduce((a,l)=>a+Number(l.materiais_count || 0),0);
  $('lotesKUltimo').textContent = S.lotes[0] ? fmt(S.lotes[0].created_at).slice(0,16) : '-';
  box.innerHTML = S.lotes.map(l => `
    <div class="lote-card ${S.selecionado?.protocolo === l.protocolo ? 'active' : ''}" data-lote-proto="${esc(l.protocolo)}">
      <h3>${esc(l.tecnico || '-')}</h3>
      <small>Protocolo: ${esc(l.protocolo)}</small><br>
      <small>${esc(fmt(l.created_at))} • OS: ${esc(l.os || 'Não informada')}</small>
      <div class="lote-grid">
        <div class="lote-box"><small>Equip.</small><b>${esc(l.equipamentos_count || 0)}</b></div>
        <div class="lote-box"><small>Mat.</small><b>${esc(l.materiais_count || 0)}</b></div>
        <div class="lote-box"><small>Itens</small><b>${Number(l.equipamentos_count||0)+Number(l.materiais_count||0)}</b></div>
        <div class="lote-box"><small>OS</small><b>${esc(l.os || '-')}</b></div>
      </div>
    </div>`).join('') || '<div class="msg show">Nenhum lote carregado.</div>';
  document.querySelectorAll('[data-lote-proto]').forEach(el => el.onclick = () => { S.selecionado = byProto(el.dataset.loteProto); renderLista(); renderDetalhe(); });
}

function renderDetalhe(){
  const l = S.selecionado;
  if(!l){
    $('loteTitulo').textContent = 'Selecione um lote';
    $('loteSub').textContent = 'Nenhum lote selecionado.';
    $('loteDetalhe').innerHTML = '<div class="msg show">Clique em um lote na lista.</div>';
    return;
  }
  $('loteTitulo').textContent = 'Lote: ' + (l.tecnico || '-');
  $('loteSub').textContent = `Protocolo ${l.protocolo} • ${fmt(l.created_at)}`;
  $('loteDetalhe').innerHTML = `
    <div class="lote-grid">
      <div class="lote-box"><small>Técnico</small><b>${esc(l.tecnico || '-')}</b></div>
      <div class="lote-box"><small>OS/Ref</small><b>${esc(l.os || 'Não informada')}</b></div>
      <div class="lote-box"><small>Equipamentos</small><b>${esc(l.equipamentos_count || 0)}</b></div>
      <div class="lote-box"><small>Materiais</small><b>${esc(l.materiais_count || 0)}</b></div>
    </div>
    <h3>Equipamentos</h3>
    <div class="lote-list">
      ${(l.equipamentos || []).map((e,i)=>`<div class="lote-row"><div><b>${i+1}. ${esc(e.codigo || '-')} • ${esc(nomeEq(e))}</b><br><small>MAC/SN: ${esc(e.mac || e.serial || '-')} • Patrimônio: ${esc(e.patrimonio || '-')} • Status: ${esc(e.status_final || '-')}</small></div><span class="badge">${esc(e.os || l.os || '-')}</span></div>`).join('') || '<div class="msg show">Sem equipamentos neste lote.</div>'}
    </div>
    <h3>Materiais</h3>
    <div class="lote-list">
      ${(l.materiais || []).map(m=>`<div class="lote-row"><div><b>${esc(nomeMat(m))}</b><br><small>Categoria: ${esc(m.categoria || '-')} • Status: ${esc(m.status_final || '-')}</small></div><span class="badge">${qtd(m.quantidade)} ${esc(m.unidade_saida || '')}</span></div>`).join('') || '<div class="msg show">Sem materiais neste lote.</div>'}
    </div>
    <h3>Observação</h3>
    <div class="lote-box"><b>${esc(l.observacao || 'Sem observação')}</b></div>`;
}

function textoWhats(l){
  const linhas = [];
  linhas.push('✅ COMPROVANTE DE SAÍDA DE ESTOQUE');
  linhas.push('Protocolo: ' + (l.protocolo || '-'));
  linhas.push('Data/Hora: ' + fmt(l.created_at));
  linhas.push('Técnico: ' + (l.tecnico || '-'));
  linhas.push('OS/Ref: ' + (l.os || 'Não informada'));
  if(l.observacao) linhas.push('Obs: ' + l.observacao);
  linhas.push('');
  linhas.push('EQUIPAMENTOS (' + (l.equipamentos || []).length + '):');
  linhas.push((l.equipamentos || []).map((e,i)=>`${i+1}. ${e.codigo || '-'} | ${nomeEq(e)} | MAC/SN: ${e.mac || e.serial || '-'}`).join('\n') || 'Sem equipamentos.');
  linhas.push('');
  linhas.push('MATERIAIS (' + (l.materiais || []).length + '):');
  linhas.push((l.materiais || []).map(m=>`- ${nomeMat(m)}: ${qtd(m.quantidade)} ${m.unidade_saida || ''}`).join('\n') || 'Sem materiais.');
  linhas.push('');
  linhas.push('Recebi os itens acima e conferi as quantidades.');
  return linhas.join('\n');
}
async function copiarWhats(l){
  const text = textoWhats(l);
  try{
    await navigator.clipboard.writeText(text);
    msg('Comprovante copiado para WhatsApp.', 'ok');
  }catch(e){
    window.prompt('Copie o comprovante:', text);
  }
}
function addPdfText(doc, text, x, y, maxWidth, lineHeight=5){
  const lines = doc.splitTextToSize(String(text ?? '-'), maxWidth);
  for(const line of lines){
    if(y > 282){ doc.addPage(); y = 16; }
    doc.text(line, x, y); y += lineHeight;
  }
  return y;
}
function gerarPdf(l){
  try{
    if(!window.jspdf?.jsPDF) throw new Error('Biblioteca jsPDF não carregou.');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    let y = 14;
    doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('LIKE Estoque', 12, y); y += 8;
    doc.setFontSize(13); doc.text('Histórico de lote de saída', 12, y); y += 7;
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    y = addPdfText(doc, `Protocolo: ${l.protocolo || '-'} | Data: ${fmt(l.created_at)}`, 12, y, 186);
    y = addPdfText(doc, `Técnico: ${l.tecnico || '-'} | OS/Ref: ${l.os || 'Não informada'}`, 12, y, 186);
    y = addPdfText(doc, `Observação: ${l.observacao || 'Sem observação'}`, 12, y, 186);
    y += 4; doc.setDrawColor(210); doc.line(12, y, 198, y); y += 7;
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text(`Equipamentos (${(l.equipamentos || []).length})`, 12, y); y += 7;
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    if(!(l.equipamentos || []).length) y = addPdfText(doc, 'Sem equipamentos.', 12, y, 186);
    (l.equipamentos || []).forEach((e,i)=>{ y = addPdfText(doc, `${i+1}. ${e.codigo || '-'} | ${nomeEq(e)} | MAC/SN: ${e.mac || e.serial || '-'} | Patrimônio: ${e.patrimonio || '-'}`, 12, y, 186); });
    y += 4; if(y > 272){ doc.addPage(); y = 16; }
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text(`Materiais (${(l.materiais || []).length})`, 12, y); y += 7;
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    if(!(l.materiais || []).length) y = addPdfText(doc, 'Sem materiais.', 12, y, 186);
    (l.materiais || []).forEach((m,i)=>{ y = addPdfText(doc, `${i+1}. ${nomeMat(m)} | Quantidade: ${qtd(m.quantidade)} ${m.unidade_saida || ''} | Categoria: ${m.categoria || '-'}`, 12, y, 186); });
    y += 12; if(y > 250){ doc.addPage(); y = 30; }
    doc.setDrawColor(120); doc.line(20, y, 90, y); doc.line(120, y, 190, y); y += 5;
    doc.setFontSize(9); doc.text('Responsável pela entrega', 33, y); doc.text('Técnico / Recebedor', 137, y);
    doc.setFontSize(8); doc.setTextColor(110); doc.text('Documento gerado pelo LIKE Estoque • Histórico de lote.', 12, 290); doc.setTextColor(0);
    doc.save(`lote_saida_${safeFile(l.tecnico)}_${safeFile(l.protocolo).slice(0,8)}.pdf`);
    msg('PDF do lote gerado.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function limparFiltros(){
  $('lotesBusca').value = '';
  $('lotesIni').value = '';
  $('lotesFim').value = '';
  load();
}

document.addEventListener('click', async (ev)=>{
  const btn = ev.target.closest('button');
  if(!btn) return;
});

inject();
window.lotesSaidaCleanLoad = load;
