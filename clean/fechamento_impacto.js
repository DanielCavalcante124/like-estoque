import { call } from './api.js?v=3';

const I = { rel:null, fechamentos:[] };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const num = v => Number(v || 0).toLocaleString('pt-BR');
const dt = v => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return String(v || '-'); } };
const safe = v => String(v || 'periodo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,80) || 'periodo';

function msg(text,type=''){
  const el = $('impactoMsg');
  if(el){ el.textContent = text; el.className = 'msg show ' + type; }
}
function injectCss(){
  if($('impactoCss')) return;
  const s = document.createElement('style');
  s.id = 'impactoCss';
  s.textContent = `.impacto-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.impacto-kpi{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:12px}.impacto-kpi small{display:block;color:#64748b;font-weight:800}.impacto-kpi b{font-size:20px}.impacto-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.impacto-bad{border-color:#dc2626;background:#fff7f7}.impacto-ok{border-color:#16a34a;background:#f0fdf4}@media(max-width:1000px){.impacto-kpis{grid-template-columns:repeat(3,1fr)}.impacto-grid{grid-template-columns:1fr}}@media(max-width:650px){.impacto-kpis{grid-template-columns:repeat(2,1fr)}}`;
  document.head.appendChild(s);
}
function inject(){
  injectCss();
  const page = $('page-fechamento-clean');
  if(!page || $('impactoPeriodoCard')) return;
  const card = document.createElement('div');
  card.id = 'impactoPeriodoCard';
  card.className = 'card';
  card.innerHTML = `
    <div class="table-head">
      <div><h2>Relatório de impacto do período fechado</h2><p>Conferência das movimentações que compõem o período e verificação de lançamentos após o fechamento.</p></div>
      <button id="impactoReloadFechamentos" class="secondary">Recarregar fechamentos</button>
    </div>
    <div class="form-grid two">
      <select id="impactoFechamento"><option value="">Usar período manual</option></select>
      <button id="impactoGerar" class="primary" type="button">Gerar impacto</button>
    </div>
    <div class="fec-actions"><button id="impactoPdf" class="secondary" type="button">Baixar PDF jsPDF</button><button id="impactoWhats" class="secondary" type="button">Copiar resumo WhatsApp</button></div>
    <div id="impactoMsg" class="msg show">Selecione um fechamento ou use o período informado acima na tela.</div>
    <div id="impactoResultado"></div>`;
  const historicoCard = $('fecHistorico')?.closest('.card');
  if(historicoCard) historicoCard.insertAdjacentElement('beforebegin', card);
  else page.appendChild(card);

  $('impactoReloadFechamentos').onclick = carregarFechamentos;
  $('impactoGerar').onclick = gerarImpacto;
  $('impactoPdf').onclick = () => I.rel ? gerarPdf(I.rel) : msg('Gere o relatório de impacto antes do PDF.', 'warn');
  $('impactoWhats').onclick = copiarResumo;
  carregarFechamentos().catch(e => msg(e.message || String(e),'bad'));
}
async function carregarFechamentos(){
  const res = await call('rpc_listar_fechamentos_operacionais_5w', { p_limite:50 });
  I.fechamentos = res?.fechamentos || [];
  const sel = $('impactoFechamento');
  if(sel){
    sel.innerHTML = '<option value="">Usar período manual</option>' + I.fechamentos.map(f => `<option value="${esc(f.id)}">${esc(f.periodo_inicio)} até ${esc(f.periodo_fim)} • ${esc(f.status)} • ${esc(f.responsavel || '-')}</option>`).join('');
  }
  msg(`Fechamentos carregados: ${I.fechamentos.length}.`, 'ok');
}
function periodoManual(){
  const ini = $('fecIni')?.value;
  const fim = $('fecFim')?.value;
  if(!ini || !fim) throw new Error('Informe período inicial e final ou selecione um fechamento.');
  if(fim < ini) throw new Error('Data final não pode ser menor que a inicial.');
  return { ini, fim };
}
async function gerarImpacto(){
  try{
    msg('Gerando relatório de impacto...', 'warn');
    const fechamentoId = $('impactoFechamento')?.value || null;
    let args;
    if(fechamentoId){
      args = { p_fechamento_id:fechamentoId, p_periodo_inicio:null, p_periodo_fim:null };
    }else{
      const p = periodoManual();
      args = { p_fechamento_id:null, p_periodo_inicio:p.ini, p_periodo_fim:p.fim };
    }
    I.rel = await call('rpc_relatorio_impacto_periodo_fechado_5w3', args);
    render(I.rel);
    msg('Relatório de impacto gerado.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function kpi(label,value){ return `<div class="impacto-kpi"><small>${esc(label)}</small><b>${esc(value)}</b></div>`; }
function box(title,body,small='', cls=''){
  return `<div class="fec-box ${cls}"><b>${esc(title)}</b><small>${esc(body || '')}${small ? '<br>'+esc(small) : ''}</small></div>`;
}
function render(rel){
  const root = $('impactoResultado');
  if(!root) return;
  const mr = rel.movimentos_resumo || {};
  const mt = rel.materiais_resumo || {};
  const f = rel.fechamento || {};
  const controle = rel.controle || {};
  const apos = Number(mr.apos_o_fechamento || 0) + Number(mt.apos_o_fechamento || 0);
  const ctrlCls = controle.periodo_bloqueado_por_fechamento ? 'impacto-bad' : 'impacto-ok';
  root.innerHTML = `
    <div class="impacto-kpis">
      ${kpi('Mov. patrimônio', num(mr.total))}
      ${kpi('Patrimônio antes', num(mr.antes_do_fechamento))}
      ${kpi('Patrimônio após', num(mr.apos_o_fechamento))}
      ${kpi('Mov. materiais', num(mt.total))}
      ${kpi('Materiais antes', num(mt.antes_do_fechamento))}
      ${kpi('Materiais após', num(mt.apos_o_fechamento))}
    </div>
    <div class="impacto-grid">
      <div class="card ${ctrlCls}">
        <h2>Controle do período</h2>
        ${box('Período', `${rel.periodo_inicio} até ${rel.periodo_fim}`, controle.periodo_bloqueado_por_fechamento ? 'Existe fechamento Fechado bloqueando o período.' : 'Nenhum fechamento Fechado bloqueia o período.')}
        ${box('Fechamento referência', f.id ? `${f.status} • ${f.responsavel || '-'}` : 'Período manual', f.protocolo ? `Protocolo: ${f.protocolo}` : '')}
        ${box('Tentativas bloqueadas', 'Não ficam registradas em movimentos.', controle.observacao_bloqueio || '')}
        ${apos ? box('Atenção', `${apos} movimentação(ões) aparecem após a criação do fechamento.`, 'Isso indica lançamento posterior, fechamento cancelado ou dado legado.', 'impacto-bad') : box('Pós-fechamento', 'Nenhuma movimentação posterior encontrada no período.', 'Resultado esperado quando o período está Fechado e a trava está ativa.')}
      </div>
      <div class="card"><h2>Resumo por dia</h2>${renderDias(rel.dias || [])}</div>
    </div>
    <div class="impacto-grid">
      <div class="card"><h2>Tipos de movimentos patrimoniais</h2>${renderListaTipo(mr.por_tipo || [])}</div>
      <div class="card"><h2>Tipos de movimentos de materiais</h2>${renderListaTipo(mt.por_tipo || [], true)}</div>
    </div>
    <div class="card"><h2>Movimentos patrimoniais do período</h2>${renderMovimentos(rel.movimentos || [])}</div>
    <div class="card"><h2>Movimentos de materiais do período</h2>${renderMateriais(rel.materiais_movimentos || [])}</div>`;
}
function renderListaTipo(rows, qtd=false){
  return rows.map(r => `<div class="item"><div><b>${esc(r.tipo || '-')}</b><br><small>${qtd ? 'Quantidade: '+num(r.quantidade) : 'Tipo de movimento'}</small></div><span class="badge">${num(r.total)}</span></div>`).join('') || '<div class="msg show warn">Sem dados.</div>';
}
function renderDias(rows){
  return rows.map(d => `<div class="item"><div><b>${esc(d.data)}</b><br><small>${d.periodo_fechado ? 'Período fechado' : 'Não bloqueado'}</small></div><span class="badge">P:${num(d.movimentos)} • M:${num(d.materiais_movimentos)}</span></div>`).join('') || '<div class="msg show warn">Sem dias no período.</div>';
}
function renderMovimentos(rows){
  const html = rows.slice(0,120).map(m => `<tr><td>${esc(dt(m.created_at))}</td><td>${esc(m.data_ref || m.data || '-')}</td><td><b>${esc(m.codigo || '-')}</b></td><td>${esc(m.tipo || '-')}</td><td>${esc(m.tecnico || '-')}</td><td>${esc(m.destino || '-')}</td><td><span class="badge">${esc(m.momento || '-')}</span></td></tr>`).join('');
  return `<div class="table-wrap"><table><thead><tr><th>Criado em</th><th>Data</th><th>Código</th><th>Tipo</th><th>Técnico</th><th>Destino</th><th>Momento</th></tr></thead><tbody>${html || '<tr><td colspan="7">Sem movimentos patrimoniais.</td></tr>'}</tbody></table></div>`;
}
function renderMateriais(rows){
  const html = rows.slice(0,120).map(m => `<tr><td>${esc(dt(m.created_at))}</td><td>${esc(m.data_ref || '-')}</td><td><b>${esc([m.tipo,m.marca,m.modelo].filter(Boolean).join(' ') || '-')}</b></td><td>${esc(num(m.quantidade))}</td><td>${esc(m.tecnico || '-')}</td><td>${esc(m.destino || '-')}</td><td><span class="badge">${esc(m.momento || '-')}</span></td></tr>`).join('');
  return `<div class="table-wrap"><table><thead><tr><th>Criado em</th><th>Data</th><th>Material</th><th>Qtd</th><th>Técnico</th><th>Destino</th><th>Momento</th></tr></thead><tbody>${html || '<tr><td colspan="7">Sem movimentos de materiais.</td></tr>'}</tbody></table></div>`;
}
function resumoWhats(rel){
  const mr = rel.movimentos_resumo || {}, mt = rel.materiais_resumo || {}, f = rel.fechamento || {}, c = rel.controle || {};
  return [`📊 RELATÓRIO DE IMPACTO DO PERÍODO`, `Período: ${rel.periodo_inicio} até ${rel.periodo_fim}`, `Fechamento: ${f.status || 'manual'} ${f.protocolo ? '• '+f.protocolo : ''}`, `Bloqueado por fechamento Fechado: ${c.periodo_bloqueado_por_fechamento ? 'Sim' : 'Não'}`, '', 'Patrimônio:', `- Total: ${mr.total || 0}`, `- Antes do fechamento: ${mr.antes_do_fechamento || 0}`, `- Após o fechamento: ${mr.apos_o_fechamento || 0}`, '', 'Materiais:', `- Total: ${mt.total || 0}`, `- Antes do fechamento: ${mt.antes_do_fechamento || 0}`, `- Após o fechamento: ${mt.apos_o_fechamento || 0}`, '', 'Obs: tentativas bloqueadas por trigger não ficam registradas porque a transação é revertida.'].join('\n');
}
async function copiarResumo(){
  if(!I.rel) return msg('Gere o relatório de impacto antes de copiar.', 'warn');
  try{ await navigator.clipboard.writeText(resumoWhats(I.rel)); msg('Resumo copiado para WhatsApp.', 'ok'); }
  catch(e){ window.prompt('Copie o resumo:', resumoWhats(I.rel)); }
}
function pdfText(doc, text, x, y, w=180, lh=5){
  const lines = doc.splitTextToSize(String(text ?? '-'), w);
  for(const line of lines){ if(y > 280){ doc.addPage(); y = 16; } doc.text(line, x, y); y += lh; }
  return y;
}
function pdfTable(doc, head, rows, y, widths){
  const sx=14;
  const header=()=>{ doc.setFont('helvetica','bold'); doc.setFontSize(7); let x=sx; head.forEach((h,i)=>{ doc.text(String(h),x+1,y); x+=widths[i]; }); y+=3; doc.setDrawColor(210); doc.line(sx,y,196,y); y+=4; doc.setFont('helvetica','normal'); doc.setFontSize(7); };
  header();
  rows.forEach(r=>{ if(y>275){ doc.addPage(); y=18; header(); } let x=sx; const cells=r.map((c,i)=>doc.splitTextToSize(String(c??'-'), Math.max(10,widths[i]-2))); const max=Math.max(...cells.map(c=>c.length),1); cells.forEach((lines,i)=>{ doc.text(lines.slice(0,3),x+1,y); x+=widths[i]; }); y+=Math.max(6,max*3.5+2); doc.setDrawColor(238); doc.line(sx,y-2,196,y-2); });
  return y+3;
}
function footer(doc){ doc.setFontSize(8); doc.setTextColor(110); doc.text('LIKE Estoque • Relatório de impacto de período fechado',14,287); doc.setTextColor(0); }
function gerarPdf(rel){
  if(!window.jspdf?.jsPDF) return msg('jsPDF não carregou.', 'bad');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const mr = rel.movimentos_resumo || {}, mt = rel.materiais_resumo || {}, f = rel.fechamento || {}, c = rel.controle || {};
  let y=16;
  doc.setFont('helvetica','bold'); doc.setFontSize(17); doc.text('LIKE Estoque',14,y); y+=8;
  doc.setFontSize(13); doc.text('Relatório de impacto do período fechado',14,y); y+=7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y=pdfText(doc,`Período: ${rel.periodo_inicio} até ${rel.periodo_fim} | Gerado em: ${dt(rel.gerado_em)}`,14,y);
  y=pdfText(doc,`Fechamento: ${f.status || 'manual'} ${f.protocolo ? ' | Protocolo: '+f.protocolo : ''} | Bloqueado: ${c.periodo_bloqueado_por_fechamento ? 'Sim' : 'Não'}`,14,y);
  y=pdfText(doc,`Observação: ${c.observacao_bloqueio || '-'}`,14,y,180);
  y+=5; doc.line(14,y,196,y); y+=7;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('1. Resumo de impacto',14,y); y+=6; doc.setFont('helvetica','normal'); doc.setFontSize(8);
  y=pdfTable(doc,['Indicador','Valor'],[['Movimentos patrimoniais',mr.total||0],['Patrimônio antes do fechamento',mr.antes_do_fechamento||0],['Patrimônio após o fechamento',mr.apos_o_fechamento||0],['Movimentos de materiais',mt.total||0],['Materiais antes do fechamento',mt.antes_do_fechamento||0],['Materiais após o fechamento',mt.apos_o_fechamento||0]],y,[120,62]);
  y+=4; doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('2. Movimentos por tipo',14,y); y+=6; doc.setFont('helvetica','normal'); doc.setFontSize(8);
  y=pdfTable(doc,['Tipo','Total'],(mr.por_tipo||[]).slice(0,40).map(x=>[x.tipo,x.total]),y,[140,42]);
  footer(doc);
  doc.addPage(); y=16; doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('3. Movimentos patrimoniais',14,y); y+=6; doc.setFont('helvetica','normal'); doc.setFontSize(7);
  y=pdfTable(doc,['Criado em','Código','Tipo','Destino','Momento'],(rel.movimentos||[]).slice(0,80).map(m=>[dt(m.created_at),m.codigo,m.tipo,m.destino,m.momento]),y,[38,25,45,42,32]);
  footer(doc);
  doc.addPage(); y=16; doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('4. Movimentos de materiais',14,y); y+=6; doc.setFont('helvetica','normal'); doc.setFontSize(7);
  y=pdfTable(doc,['Criado em','Material','Qtd','Destino','Momento'],(rel.materiais_movimentos||[]).slice(0,80).map(m=>[dt(m.created_at),[m.tipo,m.marca,m.modelo].filter(Boolean).join(' '),m.quantidade,m.destino,m.momento]),y,[38,58,18,36,32]);
  footer(doc);
  doc.save(`impacto_periodo_${safe(rel.periodo_inicio)}_${safe(rel.periodo_fim)}.pdf`);
}

setTimeout(inject, 600);
window.impactoPeriodoLoad = gerarImpacto;
