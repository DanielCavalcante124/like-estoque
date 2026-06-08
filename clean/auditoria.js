import { call } from './api.js?v=3';

const S = { rel:null, page:1, pageSize:20, rows:[], head:[] };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt = v => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return String(v || '-'); } };
const today = () => new Date().toISOString().slice(0,10);
const safe = v => String(v || 'auditoria').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'auditoria';

function msg(t,c=''){
  const el = $('audMsg');
  if(el){ el.textContent = t; el.className = 'msg show ' + c; }
}
function css(){
  if($('audCss')) return;
  const s = document.createElement('style');
  s.id = 'audCss';
  s.textContent = `.aud-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.aud-kpi{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:12px}.aud-kpi small{display:block;color:#64748b;font-weight:800}.aud-kpi b{font-size:22px}.aud-kpi.critica{border-color:#dc2626}.aud-kpi.alta{border-color:#f97316}.aud-kpi.media{border-color:#eab308}.aud-kpi.baixa{border-color:#64748b}.aud-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.aud-card-line{border:1px solid #e5e7eb;border-radius:14px;padding:10px;margin-bottom:8px}.aud-card-line b{display:block}.aud-card-line small{color:#64748b}.aud-actions{display:flex;gap:8px;flex-wrap:wrap}.sev{font-weight:900;border-radius:999px;padding:4px 8px;display:inline-block}.sev.Crítica{background:#fee2e2;color:#991b1b}.sev.Alta{background:#ffedd5;color:#9a3412}.sev.Média{background:#fef9c3;color:#854d0e}.sev.Baixa{background:#f1f5f9;color:#334155}@media(max-width:900px){.aud-kpis{grid-template-columns:repeat(2,1fr)}.aud-grid{grid-template-columns:1fr}.aud-actions button{width:100%}}`;
  document.head.appendChild(s);
}
function inject(){
  css();
  if(!$('navAuditoriaClean')){
    const ref = $('navRelatoriosClean') || $('navTecnicosClean') || $('navMateriaisClean') || document.querySelector('[data-page="cadastros"]');
    const b = document.createElement('button');
    b.id = 'navAuditoriaClean';
    b.className = 'nav';
    b.textContent = 'Auditoria';
    b.onclick = show;
    ref ? ref.insertAdjacentElement('afterend', b) : document.querySelector('.sidebar').appendChild(b);
  }
  if(!$('page-auditoria-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-auditoria-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div><h2>Auditoria de divergências</h2><p>Detecta inconsistências reais no banco: status, técnico, identificação, duplicidades, saldo, movimentos e histórico.</p></div>
          <button id="audReload" class="secondary">Atualizar auditoria</button>
        </div>
        <div class="form-grid two">
          <select id="audGravidade"><option value="">Todas as gravidades</option><option>Crítica</option><option>Alta</option><option>Média</option><option>Baixa</option></select>
          <select id="audCategoria"><option value="">Todas as categorias</option></select>
        </div>
        <div class="aud-actions">
          <button id="audGerar" class="primary">Gerar auditoria</button>
          <button id="audCopiar" class="secondary">Copiar resumo WhatsApp</button>
          <button id="audCsv" class="secondary">Baixar CSV</button>
          <button id="audPdf" class="warn">Baixar PDF jsPDF</button>
        </div>
        <div id="audMsg" class="msg show">Clique em gerar auditoria.</div>
      </div>
      <div id="audKpis" class="aud-kpis"></div>
      <div class="aud-grid">
        <div class="card"><h2>Por gravidade</h2><div id="audPorGravidade"></div></div>
        <div class="card"><h2>Por categoria</h2><div id="audPorCategoria"></div></div>
      </div>
      <div class="card">
        <div class="table-head"><h2>Divergências encontradas</h2><div class="aud-actions"><button id="audPrev" class="secondary">Anterior</button><button id="audNext" class="secondary">Próxima</button></div></div>
        <div id="audPageInfo" class="rel-page-info">Página 1</div>
        <div id="audOut"></div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }
  $('audReload').onclick = load;
  $('audGerar').onclick = load;
  $('audCopiar').onclick = copiarResumo;
  $('audCsv').onclick = baixarCsv;
  $('audPdf').onclick = gerarPdf;
  $('audPrev').onclick = () => { if(S.page > 1){ S.page--; renderTable(); } };
  $('audNext').onclick = () => { const total = Math.max(1, Math.ceil(S.rows.length / S.pageSize)); if(S.page < total){ S.page++; renderTable(); } };
  $('audGravidade').onchange = load;
  $('audCategoria').onchange = load;
}
function params(){ return { p_gravidade:$('audGravidade')?.value || null, p_categoria:$('audCategoria')?.value || null }; }
function show(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navAuditoriaClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-auditoria-clean'));
  if($('pageTitle')) $('pageTitle').textContent = 'Auditoria';
  load().catch(e => msg(e.message || String(e), 'bad'));
}
async function load(){
  try{
    msg('Executando auditoria profunda...', 'warn');
    S.rel = await call('rpc_auditoria_divergencias_5v1', params());
    S.page = 1;
    atualizarCategorias();
    render();
    msg(`Auditoria concluída: ${S.rel?.resumo?.total || 0} divergência(s).`, (S.rel?.resumo?.criticas || 0) ? 'bad' : 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function atualizarCategorias(){
  const atual = $('audCategoria')?.value || '';
  const cats = (S.rel?.por_categoria || []).map(x => x.categoria).filter(Boolean);
  $('audCategoria').innerHTML = '<option value="">Todas as categorias</option>' + cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
  if(cats.includes(atual)) $('audCategoria').value = atual;
}
function render(){
  renderKpis(); renderResumo(); renderRows(); renderTable();
}
function kpi(label, val, cls=''){
  return `<div class="aud-kpi ${cls}"><small>${esc(label)}</small><b>${esc(val)}</b></div>`;
}
function renderKpis(){
  const r = S.rel?.resumo || {};
  $('audKpis').innerHTML = [
    kpi('Total', r.total ?? 0),
    kpi('Críticas', r.criticas ?? 0, 'critica'),
    kpi('Altas', r.altas ?? 0, 'alta'),
    kpi('Médias', r.medias ?? 0, 'media'),
    kpi('Baixas', r.baixas ?? 0, 'baixa')
  ].join('');
}
function renderResumo(){
  $('audPorGravidade').innerHTML = cards((S.rel?.por_gravidade || []).map(x=>({t:x.gravidade, s:x.total})));
  $('audPorCategoria').innerHTML = cards((S.rel?.por_categoria || []).map(x=>({t:x.categoria, s:x.total})));
}
function cards(rows){
  return rows.map(x=>`<div class="aud-card-line"><b>${esc(x.t)}: ${esc(x.s)}</b></div>`).join('') || '<div class="aud-card-line"><b>Sem dados.</b></div>';
}
function renderRows(){
  S.head = ['Gravidade','Categoria','Código','Item','Status/Local','Problema','Sugestão'];
  S.rows = (S.rel?.divergencias || []).map(d => [d.gravidade,d.categoria,d.codigo,d.item,`${d.status_atual || '-'} / ${d.local_atual || '-'}`,d.problema,d.sugestao]);
}
function renderTable(){
  const total = Math.max(1, Math.ceil(S.rows.length / S.pageSize));
  if(S.page > total) S.page = total;
  const start = (S.page - 1) * S.pageSize;
  const rows = S.rows.slice(start, start + S.pageSize);
  $('audPageInfo').textContent = `Página ${S.page} de ${total} • ${S.rows.length ? start+1 : 0}-${Math.min(start+S.pageSize,S.rows.length)} de ${S.rows.length}`;
  $('audOut').innerHTML = `<div class="table-wrap"><table><thead><tr>${S.head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td>${i===0 ? `<span class="sev ${esc(c)}">${esc(c)}</span>` : esc(c)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${S.head.length}">Sem divergências para os filtros selecionados.</td></tr>`}</tbody></table></div>`;
  $('audPrev').disabled = S.page <= 1;
  $('audNext').disabled = S.page >= total;
}
function resumoTexto(){
  const r = S.rel?.resumo || {};
  const lines = [];
  lines.push('🧾 AUDITORIA DE DIVERGÊNCIAS - LIKE ESTOQUE');
  lines.push('Gerado em: ' + fmt(S.rel?.gerado_em || new Date()));
  lines.push('Gravidade: ' + ($('audGravidade')?.value || 'Todas'));
  lines.push('Categoria: ' + ($('audCategoria')?.value || 'Todas'));
  lines.push('');
  lines.push(`Total: ${r.total || 0}`);
  lines.push(`Críticas: ${r.criticas || 0}`);
  lines.push(`Altas: ${r.altas || 0}`);
  lines.push(`Médias: ${r.medias || 0}`);
  lines.push(`Baixas: ${r.baixas || 0}`);
  lines.push('');
  lines.push('Principais divergências:');
  (S.rel?.divergencias || []).slice(0,10).forEach((d,i)=>lines.push(`${i+1}. [${d.gravidade}] ${d.codigo} - ${d.problema}`));
  return lines.join('\n');
}
async function copiarResumo(){
  if(!S.rel) return msg('Gere a auditoria primeiro.', 'warn');
  try{ await navigator.clipboard.writeText(resumoTexto()); msg('Resumo de auditoria copiado para WhatsApp.', 'ok'); }catch(e){ window.prompt('Copie o resumo:', resumoTexto()); }
}
function baixarCsv(){
  if(!S.rows.length) return msg('Sem divergências para exportar.', 'warn');
  const csv = [S.head, ...S.rows].map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = `auditoria_divergencias_${today()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  msg('CSV de auditoria baixado.', 'ok');
}
function pdfLib(){ if(!window.jspdf?.jsPDF) throw new Error('Biblioteca jsPDF não carregou.'); return window.jspdf.jsPDF; }
function addFooter(doc){ const p = doc.internal.getCurrentPageInfo().pageNumber; doc.setFontSize(8); doc.setTextColor(110); doc.text('LIKE Estoque • Auditoria de divergências • Documento interno', 14, 287); doc.text(`Página ${p}`, 180, 287); doc.setTextColor(0); }
function addHeader(doc, title){ doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.text('LIKE Estoque', 14, 12); doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.text(title, 14, 17); doc.setDrawColor(210); doc.line(14,20,196,20); }
function newPage(doc, title){ addFooter(doc); doc.addPage(); addHeader(doc,title); return 28; }
function text(doc, t, x, y, w=180, lh=5){ const lines = doc.splitTextToSize(String(t ?? '-'), w); lines.forEach(line=>{ if(y > 276) y = newPage(doc,'Continuação'); doc.text(line,x,y); y+=lh; }); return y; }
function section(doc, title, y){ if(y > 260) y = newPage(doc,title); doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text(title,14,y); y+=6; doc.setDrawColor(225); doc.line(14,y,196,y); y+=6; doc.setFont('helvetica','normal'); doc.setFontSize(8); return y; }
function box(doc, label, value, x, y){ doc.setDrawColor(200); doc.roundedRect(x,y,34,18,2,2); doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(90); doc.text(label,x+3,y+6); doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(0); doc.text(String(value),x+3,y+14); }
function pdfTable(doc, head, rows, y, widths){
  const sx = 14;
  const header = () => { doc.setFont('helvetica','bold'); doc.setFontSize(7); let x=sx; head.forEach((h,i)=>{ doc.text(String(h),x+1,y); x+=widths[i]; }); y+=3; doc.setDrawColor(210); doc.line(sx,y,196,y); y+=4; doc.setFont('helvetica','normal'); doc.setFontSize(7); };
  header();
  rows.forEach(r=>{
    if(y>275){ y = newPage(doc,'Continuação'); header(); }
    let x=sx, max=1;
    const cells = r.map((c,i)=>{ const lines = doc.splitTextToSize(String(c ?? '-'), Math.max(10,widths[i]-2)); max=Math.max(max, lines.length); return lines; });
    const h = Math.max(7, max*3.5+2);
    cells.forEach((lines,i)=>{ doc.text(lines.slice(0,5), x+1, y); x+=widths[i]; });
    y+=h; doc.setDrawColor(238); doc.line(sx,y-2,196,y-2);
  });
  return y+3;
}
async function gerarPdf(){
  try{
    if(!S.rel) await load();
    const JsPDF = pdfLib();
    const doc = new JsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const r = S.rel?.resumo || {};
    let y = 24;
    doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.text('LIKE Estoque',14,y); y+=9;
    doc.setFontSize(15); doc.text('Relatório de divergências e auditoria profunda',14,y); y+=8;
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    y = text(doc, `Emitido em: ${fmt(S.rel?.gerado_em || new Date())}`,14,y);
    y = text(doc, `Filtros: gravidade ${(params().p_gravidade || 'Todas')} | categoria ${(params().p_categoria || 'Todas')}`,14,y);
    y+=6; doc.setDrawColor(0); doc.line(14,y,196,y); y+=8;
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('Parecer executivo',14,y); y+=7;
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    y = text(doc, `A auditoria encontrou ${r.total || 0} divergência(s): ${r.criticas || 0} crítica(s), ${r.altas || 0} alta(s), ${r.medias || 0} média(s) e ${r.baixas || 0} baixa(s). A prioridade operacional deve seguir a gravidade, corrigindo primeiro duplicidades, vínculos incorretos, saldos negativos e movimentos órfãos.`,14,y,180);
    let x=14; [['Total',r.total||0],['Críticas',r.criticas||0],['Altas',r.altas||0],['Médias',r.medias||0],['Baixas',r.baixas||0]].forEach((b,i)=>{ box(doc,b[0],b[1],x,y); x+=37; });
    addFooter(doc);
    y = newPage(doc,'Resumo de auditoria');
    y = section(doc,'1. Divergências por gravidade',y);
    y = pdfTable(doc, ['Gravidade','Total'], (S.rel?.por_gravidade || []).map(x=>[x.gravidade,x.total]), y, [90,92]);
    y = section(doc,'2. Divergências por categoria',y);
    y = pdfTable(doc, ['Categoria','Total'], (S.rel?.por_categoria || []).map(x=>[x.categoria,x.total]), y, [120,62]);
    y = section(doc,'3. Plano de ação recomendado',y);
    const plano = [];
    if((r.criticas||0)>0) plano.push('Corrigir imediatamente divergências críticas antes de novas movimentações dos itens afetados.');
    if((r.altas||0)>0) plano.push('Tratar divergências altas no mesmo ciclo operacional de conferência.');
    if((r.medias||0)>0) plano.push('Regularizar divergências médias por lote de correção, validando cadastros, locais e vínculos.');
    if((r.baixas||0)>0) plano.push('Revisar divergências baixas como melhoria de rastreabilidade histórica.');
    if(!plano.length) plano.push('Nenhuma divergência encontrada nos filtros atuais. Manter auditoria periódica.');
    plano.forEach((p,i)=>{ y=text(doc,`${i+1}. ${p}`,16,y,174); y+=2; });
    y = newPage(doc,'Lista de divergências');
    y = section(doc,'4. Divergências detalhadas',y);
    const rows = (S.rel?.divergencias || []).map(d=>[d.gravidade,d.categoria,d.codigo,d.item,`${d.status_atual || '-'} / ${d.local_atual || '-'}`,d.problema,d.sugestao]);
    y = pdfTable(doc, ['Grav.','Categoria','Código','Item','Status/Local','Problema','Sugestão'], rows, y, [18,28,24,32,28,36,16]);
    y = newPage(doc,'Conferência');
    y = section(doc,'5. Checklist de correção',y);
    ['Divergências críticas bloqueadas/corrigidas','Duplicidades analisadas','Locais e técnicos regularizados','Saldos negativos corrigidos','Movimentos órfãos tratados','Histórico inicial conferido'].forEach(item=>{ doc.text('[ ] '+item,18,y); y+=8; });
    y+=18; doc.line(24,y,92,y); doc.line(118,y,186,y); y+=5; doc.setFontSize(9); doc.text('Responsável pela auditoria',34,y); doc.text('Gestor / Conferência',134,y); addFooter(doc);
    doc.save(`auditoria_divergencias_${today()}.pdf`);
    msg('PDF jsPDF de auditoria baixado.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

inject();
window.auditoriaCleanLoad = load;
