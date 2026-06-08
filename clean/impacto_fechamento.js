import { call } from './api.js?v=3';

const S = { fechamentos: [], relatorio: null };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const num = v => Number(v || 0).toLocaleString('pt-BR');
const dt = v => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return String(v || '-'); } };
const hoje = () => new Date().toISOString().slice(0,10);
const primeiroDiaMes = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10); };

function msg(text,type=''){
  const el = $('impMsg');
  if(el){ el.textContent = text; el.className = 'msg show ' + type; }
}
function css(){
  if($('impCss')) return;
  const s = document.createElement('style');
  s.id = 'impCss';
  s.textContent = `.imp-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.imp-kpi{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:12px}.imp-kpi small{display:block;color:#64748b;font-weight:800}.imp-kpi b{font-size:21px}.imp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.imp-actions{display:flex;gap:8px;flex-wrap:wrap}.imp-box{border:1px solid #e5e7eb;border-radius:14px;padding:10px;margin-bottom:8px;background:#fff}.imp-box b{display:block}.imp-box small{color:#64748b}.imp-ok{border-color:#16a34a;background:#f0fdf4}.imp-bad{border-color:#dc2626;background:#fff7f7}.imp-warn{border-color:#eab308;background:#fffbeb}@media(max-width:1000px){.imp-kpis{grid-template-columns:repeat(3,1fr)}.imp-grid{grid-template-columns:1fr}}@media(max-width:650px){.imp-kpis{grid-template-columns:repeat(2,1fr)}.imp-actions button{width:100%}}`;
  document.head.appendChild(s);
}
function inject(){
  css();
  if(!$('navImpactoFechamentoClean')){
    const ref = $('navFechamentoClean') || $('navAuditoriaClean') || $('navRelatoriosClean') || document.querySelector('[data-page="cadastros"]');
    const b = document.createElement('button');
    b.id = 'navImpactoFechamentoClean';
    b.className = 'nav';
    b.textContent = 'Impacto fechamento';
    b.onclick = show;
    ref ? ref.insertAdjacentElement('afterend', b) : document.querySelector('.sidebar').appendChild(b);
  }
  if(!$('page-impacto-fechamento-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-impacto-fechamento-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div><h2>Relatório de impacto de período fechado</h2><p>Conferência de movimentos que compõem o período, status do bloqueio e possíveis lançamentos posteriores.</p></div>
          <button id="impReload" class="secondary">Recarregar fechamentos</button>
        </div>
        <div class="form-grid two"><select id="impFechamento"></select><input id="impIni" type="date"></div>
        <div class="form-grid two"><input id="impFim" type="date"><input id="impObs" placeholder="Observação para PDF / conferência"></div>
        <div class="imp-actions"><button id="impGerar" class="primary">Gerar relatório</button><button id="impPdf" class="secondary">Baixar PDF jsPDF</button><button id="impWhats" class="secondary">Copiar resumo WhatsApp</button></div>
        <div id="impMsg" class="msg show">Selecione um fechamento ou informe um período.</div>
      </div>
      <div id="impKpis" class="imp-kpis"></div>
      <div id="impControle"></div>
      <div class="imp-grid">
        <div class="card"><h2>Patrimônio por tipo</h2><div id="impPatTipo"></div></div>
        <div class="card"><h2>Materiais por tipo</h2><div id="impMatTipo"></div></div>
      </div>
      <div class="imp-grid">
        <div class="card"><h2>Patrimônio por dia</h2><div id="impPatDia"></div></div>
        <div class="card"><h2>Materiais por dia</h2><div id="impMatDia"></div></div>
      </div>
      <div class="card"><h2>Movimentos patrimoniais do período</h2><div class="table-wrap"><table><thead><tr><th>Data</th><th>Código</th><th>Tipo</th><th>Técnico/Destino</th><th>Status</th></tr></thead><tbody id="impPatItens"></tbody></table></div></div>
      <div class="card"><h2>Movimentos de materiais do período</h2><div class="table-wrap"><table><thead><tr><th>Data</th><th>Material</th><th>Qtd.</th><th>Técnico/Destino</th><th>Origem</th></tr></thead><tbody id="impMatItens"></tbody></table></div></div>`;
    document.querySelector('.main').appendChild(sec);
  }

  $('impReload').onclick = loadFechamentos;
  $('impGerar').onclick = gerarRelatorio;
  $('impPdf').onclick = () => S.relatorio ? gerarPdf(S.relatorio) : msg('Gere o relatório antes do PDF.', 'warn');
  $('impWhats').onclick = copiarWhats;
  $('impFechamento').onchange = preencherPorFechamento;
}
function show(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navImpactoFechamentoClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-impacto-fechamento-clean'));
  if($('pageTitle')) $('pageTitle').textContent = 'Impacto fechamento';
  prepararDatas();
  loadFechamentos().catch(e => msg(e.message || String(e),'bad'));
}
function prepararDatas(){
  if(!$('impIni').value) $('impIni').value = primeiroDiaMes();
  if(!$('impFim').value) $('impFim').value = hoje();
}
async function loadFechamentos(){
  msg('Carregando fechamentos...', 'warn');
  const res = await call('rpc_listar_fechamentos_operacionais_5w', { p_limite:50 });
  S.fechamentos = res?.fechamentos || [];
  $('impFechamento').innerHTML = '<option value="">Usar período manual</option>' + S.fechamentos.map(f => `<option value="${esc(f.id)}">${esc(f.status)} • ${esc(f.periodo_inicio)} até ${esc(f.periodo_fim)} • ${esc(f.responsavel || '-')}</option>`).join('');
  msg('Fechamentos carregados.', 'ok');
}
function preencherPorFechamento(){
  const f = S.fechamentos.find(x => x.id === $('impFechamento').value);
  if(!f) return;
  $('impIni').value = f.periodo_inicio;
  $('impFim').value = f.periodo_fim;
}
async function gerarRelatorio(){
  try{
    const fechamentoId = $('impFechamento').value || null;
    const ini = $('impIni').value;
    const fim = $('impFim').value;
    if(!fechamentoId && (!ini || !fim)) throw new Error('Selecione um fechamento ou informe período inicial/final.');
    if(!fechamentoId && fim < ini) throw new Error('Data final não pode ser menor que a inicial.');
    msg('Gerando relatório de impacto...', 'warn');
    const rel = await call('rpc_relatorio_impacto_periodo_fechado_5w3', {
      p_fechamento_id: fechamentoId,
      p_periodo_inicio: fechamentoId ? null : ini,
      p_periodo_fim: fechamentoId ? null : fim
    });
    S.relatorio = rel;
    render(rel);
    msg('Relatório de impacto gerado.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function kpi(label,value){ return `<div class="imp-kpi"><small>${esc(label)}</small><b>${esc(value)}</b></div>`; }
function box(title,body,small='', cls=''){
  return `<div class="imp-box ${cls}"><b>${esc(title)}</b><small>${esc(body || '')}${small ? '<br>'+esc(small) : ''}</small></div>`;
}
function render(rel){
  const r = rel?.resumo || {};
  const movP = rel?.movimentos_patrimonio || {};
  const movM = rel?.movimentos_materiais || {};
  const pos = rel?.pos_fechamento || {};
  const bloqueado = !!r.periodo_bloqueado;
  const irregular = Number(r.movimentos_patrimonio_apos_fechamento || 0) + Number(r.materiais_apos_fechamento || 0);
  $('impKpis').innerHTML = [
    kpi('Status', r.fechamento_status || 'Sem fechamento'),
    kpi('Bloqueado', bloqueado ? 'Sim' : 'Não'),
    kpi('Mov. patrimônio', num(r.total_movimentos_patrimonio)),
    kpi('Mov. materiais', num(r.total_movimentos_materiais)),
    kpi('Qtd. materiais', num(r.quantidade_materiais)),
    kpi('Pós-fechamento', num(irregular))
  ].join('');
  $('impControle').innerHTML = `<div class="card ${irregular ? 'imp-bad' : bloqueado ? 'imp-ok' : 'imp-warn'}">
    <div class="table-head"><div><h2>Controle do período</h2><p>${esc(r.periodo_inicio)} até ${esc(r.periodo_fim)}</p></div><span class="badge">${bloqueado ? 'Período bloqueado' : 'Período não bloqueado'}</span></div>
    ${box('Fechamento', r.fechamento_protocolo || 'Sem fechamento Fechado vinculado', `Criado em: ${dt(r.fechamento_created_at)} • Status: ${r.fechamento_status || '-'}`)}
    ${box('Conferência pós-fechamento', irregular ? `${irregular} movimento(s) posterior(es) dentro do período` : 'Nenhum movimento posterior indevido encontrado', irregular ? 'Verifique a integridade do período.' : 'Resultado esperado para período fechado.')}
    ${box('Observação técnica', r.observacao_tecnica || '-', 'Bloqueios por trigger aparecem como erro para o operador, mas não viram linha de log persistida.')}
  </div>`;
  $('impPatTipo').innerHTML = renderList(movP.por_tipo || [], x => box(x.tipo, `${num(x.total)} movimento(s)`));
  $('impMatTipo').innerHTML = renderList(movM.por_tipo || [], x => box(x.tipo, `${num(x.total)} movimento(s)`, `Quantidade: ${num(x.quantidade)}`));
  $('impPatDia').innerHTML = renderList(movP.por_dia || [], x => box(x.data, `${num(x.total)} movimento(s)`));
  $('impMatDia').innerHTML = renderList(movM.por_dia || [], x => box(x.data, `${num(x.total)} movimento(s)`, `Quantidade: ${num(x.quantidade)}`));
  $('impPatItens').innerHTML = (movP.itens || []).slice(0,120).map(m => `<tr><td>${esc(dt(m.created_at))}</td><td><b>${esc(m.codigo || m.mac || m.serial || '-')}</b></td><td>${esc(m.tipo || '-')}</td><td>${esc([m.tecnico,m.destino].filter(Boolean).join(' • ') || '-')}</td><td>${esc(m.status_final || '-')}</td></tr>`).join('') || '<tr><td colspan="5">Sem movimentos patrimoniais no período.</td></tr>';
  $('impMatItens').innerHTML = (movM.itens || []).slice(0,120).map(m => `<tr><td>${esc(dt(m.created_at))}</td><td><b>${esc([m.tipo,m.marca,m.modelo].filter(Boolean).join(' ') || '-')}</b></td><td>${esc(num(m.quantidade))}</td><td>${esc([m.tecnico,m.destino].filter(Boolean).join(' • ') || '-')}</td><td>${esc(m.origem || '-')}</td></tr>`).join('') || '<tr><td colspan="5">Sem movimentos de materiais no período.</td></tr>';
}
function renderList(rows, fn){ return rows.length ? rows.map(fn).join('') : '<div class="msg show warn">Sem dados.</div>'; }
function resumoWhats(rel){
  const r = rel?.resumo || {};
  const irregular = Number(r.movimentos_patrimonio_apos_fechamento || 0) + Number(r.materiais_apos_fechamento || 0);
  return [`📊 RELATÓRIO DE IMPACTO DO PERÍODO`, `Período: ${r.periodo_inicio || '-'} até ${r.periodo_fim || '-'}`, `Status fechamento: ${r.fechamento_status || 'Sem fechamento'}`, `Período bloqueado: ${r.periodo_bloqueado ? 'Sim' : 'Não'}`, `Protocolo: ${r.fechamento_protocolo || '-'}`, '', `Movimentos patrimônio: ${r.total_movimentos_patrimonio || 0}`, `Movimentos materiais: ${r.total_movimentos_materiais || 0}`, `Quantidade materiais: ${r.quantidade_materiais || 0}`, `Movimentos pós-fechamento: ${irregular}`, '', irregular ? '⚠️ Existem movimentos posteriores dentro do período.' : '✅ Nenhum movimento posterior indevido encontrado.'].join('\n');
}
async function copiarWhats(){
  if(!S.relatorio) return msg('Gere o relatório antes de copiar.', 'warn');
  try{ await navigator.clipboard.writeText(resumoWhats(S.relatorio)); msg('Resumo copiado para WhatsApp.', 'ok'); }
  catch(e){ window.prompt('Copie o resumo:', resumoWhats(S.relatorio)); }
}
function pdfText(doc,text,x,y,w=180,lh=5){ const lines = doc.splitTextToSize(String(text ?? '-'),w); lines.forEach(line => { if(y>280){ doc.addPage(); y=16; } doc.text(line,x,y); y+=lh; }); return y; }
function pdfTable(doc, head, rows, y, widths){
  const sx = 14;
  const header = () => { doc.setFont('helvetica','bold'); doc.setFontSize(7); let x=sx; head.forEach((h,i)=>{ doc.text(String(h),x+1,y); x+=widths[i]; }); y+=3; doc.setDrawColor(210); doc.line(sx,y,196,y); y+=4; doc.setFont('helvetica','normal'); doc.setFontSize(7); };
  header();
  rows.forEach(r => { if(y>275){ doc.addPage(); y=18; header(); } let x=sx, max=1; const cells=r.map((c,i)=>{ const lines=doc.splitTextToSize(String(c??'-'), Math.max(10,widths[i]-2)); max=Math.max(max,lines.length); return lines; }); const h=Math.max(6,max*3.5+2); cells.forEach((lines,i)=>{ doc.text(lines.slice(0,4),x+1,y); x+=widths[i]; }); y+=h; doc.setDrawColor(238); doc.line(sx,y-2,196,y-2); });
  return y+3;
}
function footer(doc){ const p = doc.internal.getCurrentPageInfo().pageNumber; doc.setFontSize(8); doc.setTextColor(110); doc.text('LIKE Estoque • Impacto de período fechado • Documento interno',14,287); doc.text(`Página ${p}`,180,287); doc.setTextColor(0); }
function gerarPdf(rel){
  if(!window.jspdf?.jsPDF) return msg('jsPDF não carregou.', 'bad');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const r = rel?.resumo || {}, movP = rel?.movimentos_patrimonio || {}, movM = rel?.movimentos_materiais || {};
  const obs = $('impObs')?.value || '-';
  const irregular = Number(r.movimentos_patrimonio_apos_fechamento || 0) + Number(r.materiais_apos_fechamento || 0);
  let y = 18;
  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text('LIKE Estoque',14,y); y+=9;
  doc.setFontSize(14); doc.text('Relatório de impacto de período fechado',14,y); y+=8;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y = pdfText(doc, `Período: ${r.periodo_inicio || '-'} até ${r.periodo_fim || '-'} | Status: ${r.fechamento_status || 'Sem fechamento'} | Bloqueado: ${r.periodo_bloqueado ? 'Sim' : 'Não'}`,14,y);
  y = pdfText(doc, `Protocolo: ${r.fechamento_protocolo || '-'} | Criado em: ${dt(r.fechamento_created_at)}`,14,y);
  y = pdfText(doc, `Observação: ${obs}`,14,y);
  y += 4; doc.setDrawColor(0); doc.line(14,y,196,y); y+=8;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('1. Resumo de impacto',14,y); y+=7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y = pdfTable(doc, ['Indicador','Valor'], [
    ['Movimentos patrimoniais', r.total_movimentos_patrimonio || 0],
    ['Movimentos de materiais', r.total_movimentos_materiais || 0],
    ['Quantidade total de materiais', r.quantidade_materiais || 0],
    ['Movimentos pós-fechamento', irregular],
    ['Conclusão', irregular ? 'Exige conferência' : 'Sem lançamento posterior indevido']
  ], y, [100,82]);
  y = pdfText(doc, r.observacao_tecnica || '-',14,y,180);
  footer(doc);
  doc.addPage(); y=18;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('2. Patrimônio por tipo',14,y); y+=7;
  y = pdfTable(doc, ['Tipo','Total'], (movP.por_tipo || []).map(x=>[x.tipo,x.total]), y, [130,52]);
  y+=5; doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('3. Materiais por tipo',14,y); y+=7;
  y = pdfTable(doc, ['Tipo','Total','Quantidade'], (movM.por_tipo || []).map(x=>[x.tipo,x.total,x.quantidade]), y, [90,35,57]);
  footer(doc);
  doc.addPage(); y=18;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('4. Amostra de movimentos patrimoniais',14,y); y+=7;
  y = pdfTable(doc, ['Data','Código','Tipo','Destino'], (movP.itens || []).slice(0,60).map(m=>[dt(m.created_at),m.codigo || m.mac || m.serial || '-',m.tipo || '-', [m.tecnico,m.destino].filter(Boolean).join(' • ') || '-']), y, [35,35,55,57]);
  y+=5; doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('5. Amostra de movimentos de materiais',14,y); y+=7;
  y = pdfTable(doc, ['Data','Material','Qtd.','Destino'], (movM.itens || []).slice(0,60).map(m=>[dt(m.created_at),[m.tipo,m.marca,m.modelo].filter(Boolean).join(' ') || '-',m.quantidade || 0,[m.tecnico,m.destino].filter(Boolean).join(' • ') || '-']), y, [35,75,25,47]);
  footer(doc);
  doc.save(`impacto_periodo_${r.periodo_inicio || 'inicio'}_${r.periodo_fim || 'fim'}.pdf`);
}

inject();
window.impactoFechamentoLoad = loadFechamentos;
