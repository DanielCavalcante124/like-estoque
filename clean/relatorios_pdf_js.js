import { call } from './api.js?v=3';

const $ = id => document.getElementById(id);
const br = v => Number(v || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const qtd = v => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
const fmt = v => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return String(v || '-'); } };
const nome = o => [o?.tipo, o?.marca, o?.modelo].filter(Boolean).join(' ') || '-';
const safe = v => String(v || 'relatorio_gerencial').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,90) || 'relatorio_gerencial';

function msg(text, type='ok'){
  const el = $('relCleanMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function hoje(){ return new Date().toISOString().slice(0,10); }
function getFiltros(){
  return {
    p_data_ini: $('relIni')?.value || null,
    p_data_fim: $('relFim')?.value || null,
    p_tecnico: $('relTecnico')?.value || null,
    p_status: $('relStatus')?.value || null
  };
}
function pdfLib(){
  if(!window.jspdf?.jsPDF) throw new Error('Biblioteca jsPDF não carregou.');
  return window.jspdf.jsPDF;
}
function addFooter(doc, page, total=''){
  const w = doc.internal.pageSize.getWidth();
  doc.setFont('helvetica','normal');
  doc.setFontSize(8);
  doc.setTextColor(110);
  doc.text('LIKE Estoque • Relatório gerencial • Documento interno', 14, 287);
  doc.text(`Página ${page}${total ? ' de ' + total : ''}`, w - 35, 287);
  doc.setTextColor(0);
}
function addHeader(doc, title){
  doc.setFont('helvetica','bold');
  doc.setFontSize(11);
  doc.text('LIKE Estoque', 14, 12);
  doc.setFont('helvetica','normal');
  doc.setFontSize(8);
  doc.text(title, 14, 17);
  doc.setDrawColor(210);
  doc.line(14, 20, 196, 20);
}
function newPage(doc, title){
  doc.addPage();
  addHeader(doc, title);
  return 28;
}
function split(doc, text, width){ return doc.splitTextToSize(String(text ?? '-'), width); }
function addText(doc, text, x, y, width=180, lh=5){
  const lines = split(doc, text, width);
  for(const line of lines){
    if(y > 276){ y = newPage(doc, 'Continuação'); }
    doc.text(line, x, y); y += lh;
  }
  return y;
}
function section(doc, title, y){
  if(y > 260) y = newPage(doc, title);
  doc.setFont('helvetica','bold');
  doc.setFontSize(12);
  doc.text(title, 14, y);
  y += 6;
  doc.setDrawColor(225);
  doc.line(14, y, 196, y);
  y += 6;
  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  return y;
}
function kpiBox(doc, label, value, x, y, w=42, h=18){
  doc.setDrawColor(200);
  doc.roundedRect(x, y, w, h, 2, 2);
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(95);
  doc.text(String(label), x+3, y+6);
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(0);
  doc.text(String(value), x+3, y+14);
}
function addKpis(doc, k, y){
  const items = [
    ['Equip. ativos', k.equipamentos_total ?? 0], ['Em estoque', k.em_estoque ?? 0], ['Com técnico', k.com_tecnico ?? 0], ['Manutenção', k.manutencao ?? 0],
    ['Sem MAC/SN', k.sem_mac_sn ?? 0], ['Mat. críticos', k.materiais_criticos ?? 0], ['Valor ativo', br(k.valor_total_ativo)], ['Movimentos', k.movimentos_periodo ?? 0],
    ['Lotes saída', k.lotes_saida_periodo ?? 0], ['Modelos', k.modelos_ativos ?? 0], ['Técnicos', k.tecnicos_ativos ?? 0], ['Baixados', k.baixados_inativos ?? 0]
  ];
  let x = 14;
  items.forEach((it, idx) => {
    kpiBox(doc, it[0], it[1], x, y);
    x += 46;
    if((idx+1) % 4 === 0){ x = 14; y += 22; }
  });
  return y + 4;
}
function table(doc, head, rows, y, widths){
  const startX = 14;
  const rowH = 6;
  const printHead = () => {
    doc.setFont('helvetica','bold'); doc.setFontSize(7);
    let x = startX;
    head.forEach((h, i) => { doc.text(String(h), x+1, y); x += widths[i]; });
    y += 3;
    doc.setDrawColor(210); doc.line(startX, y, 196, y); y += 4;
    doc.setFont('helvetica','normal');
  };
  printHead();
  rows.forEach(r => {
    if(y > 275){ y = newPage(doc, 'Continuação'); printHead(); }
    let x = startX;
    let maxLines = 1;
    const cells = r.map((c, i) => {
      const lines = split(doc, c ?? '-', Math.max(10, widths[i]-2));
      maxLines = Math.max(maxLines, lines.length);
      return lines;
    });
    const h = Math.max(rowH, maxLines * 3.5 + 2);
    cells.forEach((lines, i) => {
      doc.text(lines.slice(0,4), x+1, y);
      x += widths[i];
    });
    y += h;
    doc.setDrawColor(238); doc.line(startX, y-2, 196, y-2);
  });
  return y + 3;
}
function riscos(rel){
  const k = rel.kpis || {};
  const a = rel.alertas || {};
  return [
    ['Rastreabilidade', Number(k.sem_mac_sn||0) > 0 ? 'Médio' : 'Baixo', `${k.sem_mac_sn || 0} equipamento(s) sem MAC/SN.`],
    ['Reposição de material', Number(k.materiais_criticos||0) > 0 ? 'Alto' : 'Baixo', `${k.materiais_criticos || 0} material(is) em alerta.`],
    ['Manutenção', (a.equipamentos_manutencao||[]).length ? 'Médio' : 'Baixo', `${(a.equipamentos_manutencao||[]).length} equipamento(s) em manutenção.`],
    ['Carga de técnicos', Number(k.com_tecnico||0) > 0 ? 'Médio' : 'Baixo', `${k.com_tecnico || 0} patrimônio(s) com técnico.`]
  ];
}
function recomendacoes(rel){
  const k = rel.kpis || {}, a = rel.alertas || {};
  const r = [];
  if(Number(k.materiais_criticos||0)>0) r.push('Comprar/repor materiais críticos antes de novas demandas de campo. Prioridade para itens abaixo do mínimo.');
  if(Number(k.sem_mac_sn||0)>0) r.push('Regularizar equipamentos sem MAC/SN para evitar perda de rastreabilidade patrimonial.');
  if((a.equipamentos_manutencao||[]).length) r.push('Definir destino dos equipamentos em manutenção: voltar ao estoque, manter em teste ou baixar.');
  if(Number(k.com_tecnico||0)>0) r.push('Conferir carga por técnico e cruzar com OSs abertas/fechadas antes do fechamento mensal.');
  if(!r.length) r.push('Sem ação crítica imediata. Manter conferência periódica e assinatura do fechamento.');
  return r;
}
function buildRows(rel){
  const status = (rel.por_status||[]).map(x => [x.status, x.total, br(x.valor)]);
  const tecnicos = (rel.por_tecnico||[]).map(x => [x.tecnico, x.total, br(x.valor)]);
  const modelos = (rel.por_modelo||[]).map(x => [x.tipo, x.marca, x.modelo, x.total, br(x.valor)]);
  const materiaisCriticos = (rel.materiais||[]).filter(m => m.alerta && m.alerta !== 'OK').map(m => [nome(m), m.local||'-', m.tecnico||'-', qtd(m.quantidade), qtd(m.minimo), qtd(m.ideal), m.alerta]);
  const materiais = (rel.materiais||[]).map(m => [nome(m), m.local||'-', m.tecnico||'-', qtd(m.quantidade), qtd(m.minimo), qtd(m.ideal), m.alerta||'OK']);
  const movimentos = (rel.movimentos||[]).map(m => [fmt(m.data), m.codigo||'-', m.tipo||'-', m.tecnico||'-', m.destino||'-', [m.cliente,m.os].filter(Boolean).join(' / ') || '-', m.status_final||'-']);
  const alertas = [];
  (rel.alertas?.equipamentos_sem_mac_sn||[]).forEach(x => alertas.push(['Sem MAC/SN', x.codigo||'-', nome(x), x.status||'-', x.local||'-']));
  (rel.alertas?.materiais_criticos||[]).forEach(x => alertas.push(['Material crítico', '-', nome(x), `${qtd(x.quantidade)} ${x.unidade_saida||''}`, `${x.local||'-'} / ${x.tecnico||'-'}`]));
  (rel.alertas?.equipamentos_manutencao||[]).forEach(x => alertas.push(['Manutenção', x.codigo||'-', nome(x), x.motivo||'-', x.local||'-']));
  return { status, tecnicos, modelos, materiaisCriticos, materiais, movimentos, alertas };
}
async function gerarPdfGerencial(){
  try{
    msg('Gerando PDF gerencial real...', 'warn');
    const JsPDF = pdfLib();
    const rel = await call('rpc_relatorio_gerencial_5v', getFiltros());
    if(!rel?.ok && !rel?.kpis) throw new Error('RPC não retornou relatório válido.');
    const doc = new JsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const k = rel.kpis || {};
    const rows = buildRows(rel);
    let y = 24;

    doc.setFont('helvetica','bold'); doc.setFontSize(20);
    doc.text('LIKE Estoque', 14, y); y += 9;
    doc.setFontSize(15); doc.text('Relatório gerencial de fechamento operacional', 14, y); y += 8;
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    y = addText(doc, `Emitido em: ${fmt(rel.gerado_em || new Date())}`, 14, y, 180);
    y = addText(doc, `Período: ${getFiltros().p_data_ini || 'início'} até ${getFiltros().p_data_fim || 'hoje'} | Técnico: ${getFiltros().p_tecnico || 'Todos'} | Status: ${getFiltros().p_status || 'Todos'}`, 14, y, 180);
    y += 6;
    doc.setDrawColor(0); doc.line(14, y, 196, y); y += 8;
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('Parecer executivo', 14, y); y += 7;
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    y = addText(doc, `O estoque possui ${k.equipamentos_total || 0} equipamento(s) ativo(s), sendo ${k.em_estoque || 0} em estoque e ${k.com_tecnico || 0} com técnico. O valor patrimonial ativo estimado é ${br(k.valor_total_ativo)}. Foram identificados ${k.materiais_criticos || 0} material(is) em alerta, ${k.sem_mac_sn || 0} equipamento(s) sem MAC/SN e ${k.movimentos_periodo || 0} movimentação(ões) no período.`, 14, y, 180);
    y += 4;
    y = addKpis(doc, k, y);
    addFooter(doc, 1);

    y = newPage(doc, 'Riscos, alertas e recomendações');
    y = section(doc, '1. Matriz de risco operacional', y);
    y = table(doc, ['Risco','Nível','Evidência'], riscos(rel), y, [42,28,112]);
    y = section(doc, '2. Alertas prioritários', y);
    y = table(doc, ['Alerta','Código','Item','Status/Qtd/Motivo','Local/Técnico'], rows.alertas.slice(0,80), y, [32,26,54,38,32]);
    y = section(doc, '3. Plano de ação recomendado', y);
    recomendacoes(rel).forEach((r, idx) => { y = addText(doc, `${idx+1}. ${r}`, 16, y, 174); y += 2; });
    addFooter(doc, 2);

    y = newPage(doc, 'Distribuição patrimonial');
    y = section(doc, '4. Equipamentos por status', y);
    y = table(doc, ['Status','Total','Valor'], rows.status, y, [86,34,62]);
    y = section(doc, '5. Patrimônio por técnico', y);
    y = table(doc, ['Técnico','Total','Valor'], rows.tecnicos, y, [86,34,62]);
    addFooter(doc, 3);

    y = newPage(doc, 'Patrimônio por modelo');
    y = section(doc, '6. Patrimônio por modelo', y);
    y = table(doc, ['Tipo','Marca','Modelo','Total','Valor'], rows.modelos.slice(0,60), y, [32,38,58,22,32]);
    addFooter(doc, 4);

    y = newPage(doc, 'Materiais');
    y = section(doc, '7. Materiais críticos', y);
    y = table(doc, ['Material','Local','Técnico','Qtd','Mín.','Ideal','Alerta'], rows.materiaisCriticos.slice(0,80), y, [52,27,27,18,16,16,26]);
    y = section(doc, '8. Saldos de materiais', y);
    y = table(doc, ['Material','Local','Técnico','Qtd','Mín.','Ideal','Alerta'], rows.materiais.slice(0,120), y, [52,27,27,18,16,16,26]);
    addFooter(doc, 5);

    y = newPage(doc, 'Movimentações');
    y = section(doc, '9. Movimentações do período', y);
    y = addText(doc, 'A lista abaixo é limitada aos últimos 100 registros retornados pelo fechamento para manter o documento legível.', 14, y, 180); y += 2;
    y = table(doc, ['Data','Código','Tipo','Técnico','Destino','Cliente/OS','Status'], rows.movimentos.slice(0,100), y, [32,22,26,26,26,32,18]);
    addFooter(doc, 6);

    y = newPage(doc, 'Conferência e assinatura');
    y = section(doc, '10. Checklist de conferência', y);
    ['KPIs revisados','Alertas verificados','Materiais críticos encaminhados','Carga por técnico conferida','Movimentações do período revisadas','Divergências registradas para correção'].forEach(item => { doc.text('☐ ' + item, 18, y); y += 8; });
    y += 18;
    doc.line(24, y, 92, y); doc.line(118, y, 186, y); y += 5;
    doc.setFontSize(9); doc.text('Responsável pelo estoque', 35, y); doc.text('Gestor / Conferência', 133, y);
    addFooter(doc, 7);

    doc.save(`relatorio_gerencial_completo_${hoje()}.pdf`);
    msg('PDF gerencial completo baixado.', 'ok');
  }catch(e){
    msg(e.message || String(e), 'bad');
  }
}
function bind(){
  const btn = $('relPrint');
  if(!btn || btn.dataset.pdfJsReal === '1') return;
  btn.dataset.pdfJsReal = '1';
  btn.textContent = 'Baixar PDF gerencial completo';
  btn.onclick = gerarPdfGerencial;
}
function boot(){
  bind();
  const timer = setInterval(bind, 300);
  setTimeout(() => clearInterval(timer), 20000);
}
boot();
document.addEventListener('click', () => setTimeout(bind, 80));
window.relatorioPdfGerencialReal = gerarPdfGerencial;
