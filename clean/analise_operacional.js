import { call } from './api.js?v=3';

const S = { data:null };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const num = v => Number(v || 0).toLocaleString('pt-BR');
const br = v => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const dt = v => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return String(v || '-'); } };
const hoje = () => new Date().toISOString().slice(0,10);
const primeiroDiaMes = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10); };

function msg(text,type=''){
  const el = $('anaMsg');
  if(el){ el.textContent = text; el.className = 'msg show ' + type; }
}
function css(){
  if($('anaCss')) return;
  const s = document.createElement('style');
  s.id = 'anaCss';
  s.textContent = `.ana-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.ana-kpi{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:12px}.ana-kpi small{display:block;color:#64748b;font-weight:800}.ana-kpi b{font-size:21px}.ana-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ana-actions{display:flex;gap:8px;flex-wrap:wrap}.ana-box{border:1px solid #e5e7eb;border-radius:14px;padding:10px;margin-bottom:8px;background:#fff}.ana-box b{display:block}.ana-box small{color:#64748b}.ana-ok{border-color:#16a34a;background:#f0fdf4}.ana-warn{border-color:#eab308;background:#fffbeb}.ana-bad{border-color:#dc2626;background:#fff7f7}.ana-decision{border-width:2px}@media(max-width:1050px){.ana-kpis{grid-template-columns:repeat(3,1fr)}.ana-grid{grid-template-columns:1fr}}@media(max-width:650px){.ana-kpis{grid-template-columns:repeat(2,1fr)}.ana-actions button{width:100%}}`;
  document.head.appendChild(s);
}
function inject(){
  css();
  if(!$('navAnaliseOperacionalClean')){
    const ref = $('navImpactoFechamentoClean') || $('navFechamentoClean') || $('navRelatoriosClean') || document.querySelector('[data-page="cadastros"]');
    const b = document.createElement('button');
    b.id = 'navAnaliseOperacionalClean';
    b.className = 'nav';
    b.textContent = 'Análise operacional';
    b.onclick = show;
    ref ? ref.insertAdjacentElement('afterend', b) : document.querySelector('.sidebar').appendChild(b);
  }
  if(!$('page-analise-operacional-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-analise-operacional-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div><h2>Análise operacional consolidada</h2><p>Visão única de estoque, auditoria, fechamento, impacto do período e decisão operacional.</p></div>
          <button id="anaReload" class="secondary">Atualizar análise</button>
        </div>
        <div class="form-grid two"><input id="anaIni" type="date"><input id="anaFim" type="date"></div>
        <div class="ana-actions"><button id="anaGerar" class="primary">Gerar análise</button><button id="anaPdf" class="secondary">Baixar PDF executivo</button><button id="anaWhats" class="secondary">Copiar resumo WhatsApp</button></div>
        <div id="anaMsg" class="msg show">Informe o período e gere a análise consolidada.</div>
      </div>
      <div id="anaDecisao"></div>
      <div id="anaKpis" class="ana-kpis"></div>
      <div class="ana-grid">
        <div class="card"><h2>Estoque e valor</h2><div id="anaEstoque"></div></div>
        <div class="card"><h2>Auditoria e riscos</h2><div id="anaAuditoria"></div></div>
      </div>
      <div class="ana-grid">
        <div class="card"><h2>Fechamento e período</h2><div id="anaFechamento"></div></div>
        <div class="card"><h2>Impacto do período</h2><div id="anaImpacto"></div></div>
      </div>
      <div class="ana-grid">
        <div class="card"><h2>Top modelos</h2><div id="anaModelos"></div></div>
        <div class="card"><h2>Alertas operacionais</h2><div id="anaAlertas"></div></div>
      </div>
      <div class="card"><h2>Atalhos de análise</h2><div class="ana-actions" id="anaAtalhos"></div></div>`;
    document.querySelector('.main').appendChild(sec);
  }
  $('anaReload').onclick = gerar;
  $('anaGerar').onclick = gerar;
  $('anaPdf').onclick = () => S.data ? gerarPdf(S.data) : msg('Gere a análise antes do PDF.', 'warn');
  $('anaWhats').onclick = copiarWhats;
}
function show(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navAnaliseOperacionalClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-analise-operacional-clean'));
  if($('pageTitle')) $('pageTitle').textContent = 'Análise operacional';
  prepararDatas();
  renderAtalhos();
}
function prepararDatas(){
  if(!$('anaIni').value) $('anaIni').value = primeiroDiaMes();
  if(!$('anaFim').value) $('anaFim').value = hoje();
}
async function gerar(){
  try{
    const ini = $('anaIni').value;
    const fim = $('anaFim').value;
    if(!ini || !fim) throw new Error('Informe data inicial e final.');
    if(fim < ini) throw new Error('Data final não pode ser menor que a inicial.');
    msg('Gerando análise consolidada...', 'warn');
    const data = await call('rpc_consolidacao_operacional_5x', { p_periodo_inicio:ini, p_periodo_fim:fim });
    S.data = data;
    render(data);
    msg('Análise operacional atualizada.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function kpi(label,value){ return `<div class="ana-kpi"><small>${esc(label)}</small><b>${esc(value)}</b></div>`; }
function box(title,body,small='',cls=''){
  return `<div class="ana-box ${cls}"><b>${esc(title)}</b><small>${esc(body || '')}${small ? '<br>'+esc(small) : ''}</small></div>`;
}
function render(data){
  const rel = data?.relatorio || {};
  const aud = data?.auditoria || {};
  const imp = data?.impacto || {};
  const dec = data?.decisao_operacional || {};
  const k = rel.kpis || {};
  const ar = aud.resumo || {};
  const ir = imp.resumo || {};
  const risco = !dec.auditoria_limpa || Number(dec.pos_fechamento || 0) > 0;
  const blocked = !!dec.periodo_bloqueado;

  $('anaDecisao').innerHTML = `<div class="card ana-decision ${risco ? 'ana-bad' : blocked ? 'ana-warn' : 'ana-ok'}"><div class="table-head"><div><h2>Decisão operacional</h2><p>${esc(dec.recomendacao || 'Sem recomendação retornada.')}</p></div><span class="badge">${risco ? 'Ação necessária' : blocked ? 'Período bloqueado' : 'Operação normal'}</span></div>${box('Período analisado', `${data.periodo?.inicio || '-'} até ${data.periodo?.fim || '-'}`, `Gerado em: ${dt(data.gerado_em)}`)}</div>`;

  $('anaKpis').innerHTML = [
    kpi('Ativos', num(k.equipamentos_total)),
    kpi('Em estoque', num(k.em_estoque)),
    kpi('Com técnico', num(k.com_tecnico)),
    kpi('Valor ativo', br(k.valor_total_ativo)),
    kpi('Divergências', num(ar.total)),
    kpi('Movimentos', num(Number(dec.movimentos_patrimonio || 0) + Number(dec.movimentos_materiais || 0)))
  ].join('');

  $('anaEstoque').innerHTML = `
    ${box('Equipamentos ativos', `${num(k.equipamentos_total)} item(ns)`, `Valor ativo: ${br(k.valor_total_ativo)}`)}
    ${box('Distribuição operacional', `Em estoque ${num(k.em_estoque)} • Com técnico ${num(k.com_tecnico)} • Manutenção ${num(k.manutencao)}`, `Baixados/inativos: ${num(k.baixados_inativos)}`)}
    ${box('Materiais críticos', `${num(k.materiais_criticos)} item(ns)`, 'Baseado no mínimo/ideal do cadastro')}`;

  $('anaAuditoria').innerHTML = `
    ${box('Auditoria', ar.total ? `${num(ar.total)} divergência(s)` : 'Auditoria limpa', `Críticas ${num(ar.criticas)} • Altas ${num(ar.altas)} • Médias ${num(ar.medias)} • Baixas ${num(ar.baixas)}`, ar.total ? 'ana-bad' : 'ana-ok')}
    ${(aud.por_categoria || []).slice(0,5).map(c => box(c.categoria, `${num(c.total)} ocorrência(s)`)).join('') || '<div class="msg show ok">Nenhuma categoria com divergência.</div>'}`;

  $('anaFechamento').innerHTML = `
    ${box('Período fechado', blocked ? 'Bloqueado por fechamento Fechado' : 'Livre ou com fechamento cancelado', `Possui fechamento no período: ${dec.possui_fechamento_periodo ? 'Sim' : 'Não'}`, blocked ? 'ana-warn' : 'ana-ok')}
    ${(data.fechamentos?.fechamentos || []).slice(0,5).map(f => box(`${f.status} • ${f.periodo_inicio} até ${f.periodo_fim}`, `Responsável: ${f.responsavel || '-'}`, `Auditoria: ${num(f.auditoria_resumo?.total || 0)} diverg.`)).join('') || '<div class="msg show warn">Nenhum fechamento no histórico.</div>'}`;

  $('anaImpacto').innerHTML = `
    ${box('Impacto do período', `Patrimônio ${num(ir.total_movimentos_patrimonio)} • Materiais ${num(ir.total_movimentos_materiais)}`, `Quantidade materiais: ${num(ir.quantidade_materiais)}`)}
    ${box('Pós-fechamento', Number(dec.pos_fechamento || 0) ? `${num(dec.pos_fechamento)} movimento(s) posterior(es)` : 'Nenhum movimento posterior indevido', Number(dec.pos_fechamento || 0) ? 'Exige conferência' : 'Integridade preservada', Number(dec.pos_fechamento || 0) ? 'ana-bad' : 'ana-ok')}`;

  $('anaModelos').innerHTML = (rel.por_modelo || []).slice(0,8).map(m => box(`${m.tipo || '-'} ${m.marca || ''} ${m.modelo || ''}`, `${num(m.total)} item(ns)`, br(m.valor))).join('') || '<div class="msg show warn">Sem modelos para exibir.</div>';
  const alertas = rel.alertas || {};
  const qtdMac = (alertas.equipamentos_sem_mac_sn || []).length;
  const qtdMat = (alertas.materiais_criticos || []).length;
  const qtdMan = (alertas.equipamentos_manutencao || []).length;
  $('anaAlertas').innerHTML = `
    ${box('MAC/SN obrigatório pendente', `${num(qtdMac)} item(ns)`, 'Só conta modelo que exige identificação', qtdMac ? 'ana-bad' : 'ana-ok')}
    ${box('Materiais críticos', `${num(qtdMat)} item(ns)`, 'Abaixo do mínimo ou ideal', qtdMat ? 'ana-warn' : 'ana-ok')}
    ${box('Equipamentos em manutenção', `${num(qtdMan)} item(ns)`, 'Conferir tempo parado', qtdMan ? 'ana-warn' : 'ana-ok')}`;
}
function renderAtalhos(){
  const links = [
    ['Relatórios','navRelatoriosClean'],
    ['Fechamento','navFechamentoClean'],
    ['Impacto fechamento','navImpactoFechamentoClean'],
    ['Auditoria','navAuditoriaClean'],
    ['Dashboard','']
  ];
  $('anaAtalhos').innerHTML = links.map(([label,id]) => `<button class="secondary" type="button" data-ana-nav="${esc(id)}">${esc(label)}</button>`).join('');
  document.querySelectorAll('[data-ana-nav]').forEach(btn => {
    btn.onclick = () => btn.dataset.anaNav ? document.getElementById(btn.dataset.anaNav)?.click() : document.querySelector('[data-page="dashboard"]')?.click();
  });
}
function resumoWhats(data){
  const dec = data?.decisao_operacional || {}, k = data?.relatorio?.kpis || {}, ar = data?.auditoria?.resumo || {};
  return [`📊 ANÁLISE OPERACIONAL - LIKE ESTOQUE`, `Período: ${data?.periodo?.inicio || '-'} até ${data?.periodo?.fim || '-'}`, '', `Ativos: ${k.equipamentos_total || 0}`, `Em estoque: ${k.em_estoque || 0}`, `Com técnico: ${k.com_tecnico || 0}`, `Valor ativo: ${br(k.valor_total_ativo)}`, '', `Auditoria: ${ar.total || 0} divergência(s)`, `Período bloqueado: ${dec.periodo_bloqueado ? 'Sim' : 'Não'}`, `Possui fechamento: ${dec.possui_fechamento_periodo ? 'Sim' : 'Não'}`, `Movimentos: ${Number(dec.movimentos_patrimonio || 0) + Number(dec.movimentos_materiais || 0)}`, `Pós-fechamento: ${dec.pos_fechamento || 0}`, '', `Decisão: ${dec.recomendacao || '-'}`].join('\n');
}
async function copiarWhats(){
  if(!S.data) return msg('Gere a análise antes de copiar.', 'warn');
  try{ await navigator.clipboard.writeText(resumoWhats(S.data)); msg('Resumo copiado para WhatsApp.', 'ok'); }
  catch(e){ window.prompt('Copie o resumo:', resumoWhats(S.data)); }
}
function pdfText(doc,text,x,y,w=180,lh=5){ const lines = doc.splitTextToSize(String(text ?? '-'),w); lines.forEach(line => { if(y>280){ doc.addPage(); y=16; } doc.text(line,x,y); y+=lh; }); return y; }
function pdfTable(doc, head, rows, y, widths){
  const sx=14;
  const header=()=>{ doc.setFont('helvetica','bold'); doc.setFontSize(7); let x=sx; head.forEach((h,i)=>{ doc.text(String(h),x+1,y); x+=widths[i]; }); y+=3; doc.setDrawColor(210); doc.line(sx,y,196,y); y+=4; doc.setFont('helvetica','normal'); doc.setFontSize(7); };
  header();
  rows.forEach(r=>{ if(y>275){ doc.addPage(); y=18; header(); } let x=sx, max=1; const cells=r.map((c,i)=>{ const lines=doc.splitTextToSize(String(c??'-'), Math.max(10,widths[i]-2)); max=Math.max(max,lines.length); return lines; }); const h=Math.max(6,max*3.5+2); cells.forEach((lines,i)=>{ doc.text(lines.slice(0,4),x+1,y); x+=widths[i]; }); y+=h; doc.setDrawColor(238); doc.line(sx,y-2,196,y-2); });
  return y+3;
}
function footer(doc){ const p = doc.internal.getCurrentPageInfo().pageNumber; doc.setFontSize(8); doc.setTextColor(110); doc.text('LIKE Estoque • Análise operacional consolidada • Documento interno',14,287); doc.text(`Página ${p}`,180,287); doc.setTextColor(0); }
function gerarPdf(data){
  if(!window.jspdf?.jsPDF) return msg('jsPDF não carregou.', 'bad');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const rel = data.relatorio || {}, k = rel.kpis || {}, aud = data.auditoria?.resumo || {}, dec = data.decisao_operacional || {}, imp = data.impacto?.resumo || {};
  let y=18;
  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text('LIKE Estoque',14,y); y+=9;
  doc.setFontSize(14); doc.text('Análise operacional consolidada',14,y); y+=8;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y = pdfText(doc, `Período: ${data.periodo?.inicio || '-'} até ${data.periodo?.fim || '-'} | Gerado em: ${dt(data.gerado_em)}`,14,y);
  y = pdfText(doc, `Decisão: ${dec.recomendacao || '-'}`,14,y,180);
  y+=4; doc.setDrawColor(0); doc.line(14,y,196,y); y+=8;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('1. Indicadores executivos',14,y); y+=7;
  y = pdfTable(doc, ['Indicador','Valor'], [
    ['Equipamentos ativos', k.equipamentos_total || 0],
    ['Em estoque', k.em_estoque || 0],
    ['Com técnico', k.com_tecnico || 0],
    ['Valor ativo', br(k.valor_total_ativo)],
    ['Divergências auditoria', aud.total || 0],
    ['Período bloqueado', dec.periodo_bloqueado ? 'Sim' : 'Não'],
    ['Movimentos patrimônio', dec.movimentos_patrimonio || 0],
    ['Movimentos materiais', dec.movimentos_materiais || 0],
    ['Pós-fechamento', dec.pos_fechamento || 0]
  ], y, [105,77]);
  footer(doc);
  doc.addPage(); y=18;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('2. Modelos e alertas',14,y); y+=7;
  y = pdfTable(doc, ['Modelo','Total','Valor'], (rel.por_modelo || []).slice(0,30).map(m => [[m.tipo,m.marca,m.modelo].filter(Boolean).join(' '),m.total,br(m.valor)]), y, [100,25,57]);
  y+=5;
  const alertas = rel.alertas || {};
  y = pdfTable(doc, ['Alerta','Quantidade'], [
    ['MAC/SN obrigatório pendente', (alertas.equipamentos_sem_mac_sn || []).length],
    ['Materiais críticos', (alertas.materiais_criticos || []).length],
    ['Equipamentos em manutenção', (alertas.equipamentos_manutencao || []).length]
  ], y, [120,62]);
  footer(doc);
  doc.addPage(); y=18;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('3. Fechamento e impacto',14,y); y+=7;
  y = pdfText(doc, `Fechamento no período: ${dec.possui_fechamento_periodo ? 'Sim' : 'Não'} | Bloqueado: ${dec.periodo_bloqueado ? 'Sim' : 'Não'} | Impacto patrimônio: ${imp.total_movimentos_patrimonio || 0} | Impacto materiais: ${imp.total_movimentos_materiais || 0}`,14,y,180);
  y = pdfText(doc, `Auditoria: total ${aud.total || 0}, críticas ${aud.criticas || 0}, altas ${aud.altas || 0}, médias ${aud.medias || 0}, baixas ${aud.baixas || 0}.`,14,y,180);
  y+=18; doc.setDrawColor(120); doc.line(24,y,92,y); doc.line(118,y,186,y); y+=5;
  doc.setFontSize(9); doc.text('Responsável pela análise',36,y); doc.text('Gestor / Conferência',137,y);
  footer(doc);
  doc.save(`analise_operacional_${data.periodo?.inicio || 'inicio'}_${data.periodo?.fim || 'fim'}.pdf`);
}

inject();
window.analiseOperacionalLoad = gerar;
