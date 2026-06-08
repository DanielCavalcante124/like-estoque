import { call } from './api.js?v=3';

const S = { preview:null, ultimo:null, historico:[], periodo:null };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const num = v => Number(v || 0).toLocaleString('pt-BR');
const br = v => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const dt = v => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return String(v || '-'); } };
const hoje = () => new Date().toISOString().slice(0,10);
const primeiroDiaMes = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10); };
const uuid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function msg(text,type=''){
  const el = $('fecMsg');
  if(el){ el.textContent = text; el.className = 'msg show ' + type; }
}
function css(){
  if($('fecCss')) return;
  const s = document.createElement('style');
  s.id = 'fecCss';
  s.textContent = `.fec-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.fec-kpi{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:12px}.fec-kpi small{display:block;color:#64748b;font-weight:800}.fec-kpi b{font-size:21px}.fec-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fec-actions{display:flex;gap:8px;flex-wrap:wrap}.fec-box{border:1px solid #e5e7eb;border-radius:14px;padding:10px;margin-bottom:8px;background:#fff}.fec-box b{display:block}.fec-box small{color:#64748b}.fec-assinatura{border:1px dashed #94a3b8;border-radius:14px;padding:12px;background:#f8fafc}.fec-status-cancelado{background:#fee2e2;color:#991b1b}.fec-status-fechado{background:#dcfce7;color:#166534}.fec-cancel-note{border-color:#fecaca;background:#fff7f7}.fec-periodo-ok{border-color:#16a34a;background:#f0fdf4}.fec-periodo-bad{border-color:#dc2626;background:#fff7f7}@media(max-width:1000px){.fec-kpis{grid-template-columns:repeat(3,1fr)}.fec-grid{grid-template-columns:1fr}}@media(max-width:650px){.fec-kpis{grid-template-columns:repeat(2,1fr)}.fec-actions button{width:100%}}`;
  document.head.appendChild(s);
}
function inject(){
  css();
  if(!$('navFechamentoClean')){
    const ref = $('navAuditoriaClean') || $('navRelatoriosClean') || $('navTecnicosClean') || document.querySelector('[data-page="cadastros"]');
    const b = document.createElement('button');
    b.id = 'navFechamentoClean'; b.className = 'nav'; b.textContent = 'Fechamento'; b.onclick = show;
    ref ? ref.insertAdjacentElement('afterend', b) : document.querySelector('.sidebar').appendChild(b);
  }
  if(!$('page-fechamento-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-fechamento-clean'; sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head"><div><h2>Fechamento operacional</h2><p>Fechamento formal por período com assinatura, auditoria, histórico, PDF jsPDF, cancelamento e bloqueio de período fechado.</p></div><button id="fecReload" class="secondary">Recarregar histórico</button></div>
        <div class="form-grid two"><input id="fecIni" type="date"><input id="fecFim" type="date"></div>
        <div class="form-grid two"><input id="fecResponsavel" placeholder="Responsável pelo fechamento"><input id="fecAssinatura" placeholder="Nome para assinatura operacional"></div>
        <div class="form-grid two"><input id="fecDocumento" placeholder="Documento / matrícula / identificação"><input id="fecObs" placeholder="Observações do fechamento"></div>
        <div class="fec-actions"><button id="fecValidarPeriodo" class="secondary">Validar período</button><button id="fecPreview" class="primary">Gerar prévia</button><button id="fecSalvar" class="warn">Confirmar fechamento</button><button id="fecPdf" class="secondary">Baixar PDF jsPDF</button><button id="fecWhats" class="secondary">Copiar resumo WhatsApp</button></div>
        <div id="fecMsg" class="msg show">Valide o período antes de confirmar o fechamento.</div>
      </div>
      <div id="fecPeriodoBox"></div>
      <div id="fecKpis" class="fec-kpis"></div>
      <div class="fec-grid">
        <div class="card"><h2>Resumo do período</h2><div id="fecResumo"></div></div>
        <div class="card"><h2>Auditoria no fechamento</h2><div id="fecAuditoria"></div></div>
      </div>
      <div class="fec-grid">
        <div class="card"><h2>Distribuição final por status</h2><div id="fecStatus"></div></div>
        <div class="card"><h2>Assinatura operacional</h2><div id="fecAssBox" class="fec-assinatura"></div></div>
      </div>
      <div class="card"><h2>Histórico de fechamentos</h2><div id="fecHistorico" class="table-wrap"></div></div>`;
    document.querySelector('.main').appendChild(sec);
  }
  $('fecReload').onclick = loadHistorico;
  $('fecValidarPeriodo').onclick = () => validarPeriodoTela(true);
  $('fecPreview').onclick = gerarPreview;
  $('fecSalvar').onclick = salvarFechamento;
  $('fecPdf').onclick = () => {
    const f = S.ultimo || S.preview;
    if(!f) return msg('Gere uma prévia ou confirme um fechamento antes do PDF.', 'warn');
    gerarPdf(f);
  };
  $('fecWhats').onclick = copiarResumo;
  ['fecIni','fecFim'].forEach(id => $(id)?.addEventListener('change', () => { S.periodo=null; renderPeriodoBox(); }));
}
function show(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navFechamentoClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-fechamento-clean'));
  if($('pageTitle')) $('pageTitle').textContent = 'Fechamento';
  prepararDatas();
  renderPeriodoBox();
  loadHistorico().catch(e=>msg(e.message || String(e),'bad'));
}
function prepararDatas(){
  if(!$('fecIni').value) $('fecIni').value = primeiroDiaMes();
  if(!$('fecFim').value) $('fecFim').value = hoje();
}
function validarCampos({exigirResponsavel=true}={}){
  const ini = $('fecIni').value;
  const fim = $('fecFim').value;
  const responsavel = ($('fecResponsavel').value || '').trim();
  const assinatura = ($('fecAssinatura').value || '').trim();
  const documento = ($('fecDocumento').value || '').trim();
  const obs = ($('fecObs').value || '').trim();
  if(!ini || !fim) throw new Error('Informe período inicial e final.');
  if(fim < ini) throw new Error('Data final não pode ser menor que a inicial.');
  if(exigirResponsavel && responsavel.length < 3) throw new Error('Informe o responsável pelo fechamento.');
  return { ini, fim, responsavel, assinatura, documento, obs };
}
async function validarPeriodoTela(showMsg=false){
  const p = validarCampos({exigirResponsavel:false});
  const res = await call('rpc_validar_periodo_fechamento_5w2', { p_periodo_inicio:p.ini, p_periodo_fim:p.fim });
  S.periodo = res;
  renderPeriodoBox();
  if(showMsg){
    msg(res.bloqueado_por_sobreposicao ? 'Período bloqueado por fechamento já Fechado.' : 'Período livre para fechamento.', res.bloqueado_por_sobreposicao ? 'bad' : 'ok');
  }
  return res;
}
function renderPeriodoBox(){
  const el = $('fecPeriodoBox');
  if(!el) return;
  if(!S.periodo){
    el.innerHTML = `<div class="card"><h2>Controle de período fechado</h2><div class="msg show warn">Período ainda não validado. Fechamentos com status Fechado bloqueiam sobreposição e novas movimentações no período.</div></div>`;
    return;
  }
  const blocked = !!S.periodo.bloqueado_por_sobreposicao;
  const rows = S.periodo.fechamentos_sobrepostos || [];
  el.innerHTML = `<div class="card ${blocked ? 'fec-periodo-bad' : 'fec-periodo-ok'}"><div class="table-head"><div><h2>Controle de período fechado</h2><p>${blocked ? 'Período bloqueado por fechamento Fechado existente.' : 'Período livre para novo fechamento.'}</p></div><span class="badge">${blocked ? 'Bloqueado' : 'Livre'}</span></div>${rows.map(f=>box('Fechamento sobreposto', `${f.periodo_inicio} até ${f.periodo_fim}`, `Protocolo: ${f.protocolo} • Responsável: ${f.responsavel || '-'}`)).join('') || '<div class="msg show ok">Nenhum fechamento Fechado sobreposto.</div>'}</div>`;
}
function exigirPeriodoLivre(res){
  if(res?.bloqueado_por_sobreposicao){
    throw new Error('Este período já possui fechamento Fechado sobreposto. Cancele o fechamento anterior para refazer ou escolha outro período.');
  }
}
async function gerarPreview(){
  try{
    const p = validarCampos();
    msg('Validando período...', 'warn');
    const periodo = await validarPeriodoTela(false);
    exigirPeriodoLivre(periodo);
    msg('Gerando prévia do fechamento...', 'warn');
    const rel = await call('rpc_relatorio_gerencial_5v', { p_data_ini:p.ini, p_data_fim:p.fim, p_tecnico:null, p_status:null });
    const aud = await call('rpc_auditoria_divergencias_5v1', { p_gravidade:null, p_categoria:null });
    const mov = resumoMovimentosRelatorio(rel);
    S.preview = {
      preview:true,
      protocolo:'prévia',
      status:'Prévia',
      periodo_inicio:p.ini,
      periodo_fim:p.fim,
      responsavel:p.responsavel,
      observacao:p.obs,
      assinatura_nome:p.assinatura,
      assinatura_documento:p.documento,
      assinado_em:p.assinatura ? new Date().toISOString() : null,
      saldo_inicial:{tipo:'pre_visualizacao', mensagem:'Saldo inicial formal será definido ao confirmar fechamento.'},
      saldo_final:saldoFinalFromRel(rel),
      resumo_movimentos:mov,
      auditoria_resumo:aud?.resumo || {},
      divergencias:aud?.divergencias || [],
      controle_periodo:periodo,
      payload:{relatorio:rel,auditoria:aud,controle_periodo:periodo}
    };
    S.ultimo = null;
    renderFechamento(S.preview);
    msg('Prévia gerada. Revise antes de confirmar o fechamento.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function resumoMovimentosRelatorio(rel){
  const rows = rel?.movimentos || [];
  const lower = v => String(v||'').toLowerCase();
  const count = pred => rows.filter(m => pred(lower(m.tipo))).length;
  const porTipo = {};
  rows.forEach(m => { const t = m.tipo || 'Sem tipo'; porTipo[t] = (porTipo[t]||0)+1; });
  return {
    entradas: count(t=>t.includes('entrada')),
    saidas: count(t=>t.includes('saída')||t.includes('saida')||t.includes('enviar')||t.includes('instala')),
    devolucoes: count(t=>t.includes('devolu')||t.includes('retorno')),
    manutencoes: count(t=>t.includes('manuten')||t.includes('manutenc')),
    baixas: count(t=>t.includes('baixa')||t.includes('inutil')),
    correcoes_auditoria: count(t=>t.includes('correção de auditoria')||t.includes('correcao de auditoria')),
    total_movimentos: rows.length,
    por_tipo: Object.entries(porTipo).map(([tipo,total])=>({tipo,total})).sort((a,b)=>b.total-a.total)
  };
}
function saldoFinalFromRel(rel){
  const k = rel?.kpis || {};
  return { equipamentos_ativos:k.equipamentos_total || 0, em_estoque:k.em_estoque || 0, com_tecnico:k.com_tecnico || 0, manutencao:k.manutencao || 0, baixados_inativos:k.baixados_inativos || 0, valor_ativo:k.valor_total_ativo || 0, por_status:rel?.por_status || [] };
}
async function salvarFechamento(){
  try{
    const p = validarCampos();
    msg('Validando período antes de confirmar...', 'warn');
    const periodo = await validarPeriodoTela(false);
    exigirPeriodoLivre(periodo);
    if(!S.preview && !confirm('Você ainda não gerou prévia. Deseja confirmar mesmo assim?')) return;
    if(!confirm(`Confirmar fechamento de ${p.ini} até ${p.fim}?\n\nApós confirmado, novas movimentações dentro desse período serão bloqueadas.`)) return;
    msg('Confirmando fechamento operacional...', 'warn');
    const res = await call('rpc_criar_fechamento_operacional_5w', {
      p_periodo_inicio:p.ini,
      p_periodo_fim:p.fim,
      p_responsavel:p.responsavel,
      p_observacao:p.obs || null,
      p_assinatura_nome:p.assinatura || null,
      p_assinatura_documento:p.documento || null,
      p_client_operation_id:uuid()
    });
    const f = res?.fechamento || res;
    S.ultimo = f; S.preview = null;
    renderFechamento(f); gerarPdf(f); await loadHistorico();
    msg('Fechamento confirmado. O período fechado agora bloqueia novas movimentações internas.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
async function cancelarFechamento(id){
  try{
    const f = S.historico.find(x => x.id === id);
    if(!f) return msg('Fechamento não encontrado no histórico carregado.', 'bad');
    if(f.status !== 'Fechado') return msg('Somente fechamento com status Fechado pode ser cancelado.', 'warn');
    const responsavel = prompt('Responsável pelo cancelamento:', f.responsavel || '')?.trim();
    if(!responsavel) return;
    const motivo = prompt('Motivo do cancelamento do fechamento:')?.trim();
    if(!motivo || motivo.length < 12) return msg('Motivo do cancelamento deve ter pelo menos 12 caracteres.', 'warn');
    if(!confirm(`Confirmar CANCELAMENTO do fechamento ${f.periodo_inicio} até ${f.periodo_fim}?\n\nO registro não será apagado. O período deixará de bloquear movimentações e poderá ser refeito.`)) return;
    msg('Cancelando fechamento via RPC...', 'warn');
    const res = await call('rpc_cancelar_fechamento_operacional_5w1', { p_fechamento_id:id, p_motivo:motivo, p_responsavel:responsavel, p_client_operation_id:uuid() });
    const cancelado = res?.fechamento || f;
    S.ultimo = cancelado; renderFechamento(cancelado); gerarPdf(cancelado); await loadHistorico();
    S.periodo = null; renderPeriodoBox();
    msg('Fechamento cancelado. O período não bloqueia mais movimentações nem novo fechamento.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
async function loadHistorico(){
  try{ const res = await call('rpc_listar_fechamentos_operacionais_5w', { p_limite:30 }); S.historico = res?.fechamentos || []; renderHistorico(); }
  catch(e){ $('fecHistorico').innerHTML = `<div class="msg show bad">${esc(e.message || String(e))}</div>`; }
}
function kpi(label,value){ return `<div class="fec-kpi"><small>${esc(label)}</small><b>${esc(value)}</b></div>`; }
function renderFechamento(f){
  const sf = f.saldo_final || {}, mv = f.resumo_movimentos || {}, aud = f.auditoria_resumo || {};
  $('fecKpis').innerHTML = [kpi('Ativos', num(sf.equipamentos_ativos)),kpi('Em estoque', num(sf.em_estoque)),kpi('Com técnico', num(sf.com_tecnico)),kpi('Movimentos', num(mv.total_movimentos)),kpi('Divergências', num(aud.total)),kpi('Valor ativo', br(sf.valor_ativo))].join('');
  const cancelBox = f.status === 'Cancelado' ? box('Cancelamento', `Cancelado em ${dt(f.cancelado_em)} por ${f.cancelado_responsavel || '-'}`, `Motivo: ${f.cancelado_motivo || '-'} | Protocolo: ${f.cancelamento_protocolo || '-'}`, 'fec-cancel-note') : '';
  const controleBox = box('Controle do período', f.status === 'Fechado' ? 'Período bloqueado para novas movimentações.' : (f.status === 'Cancelado' ? 'Fechamento cancelado: período liberado.' : 'Prévia: bloqueio será aplicado após confirmar.'), `Período: ${f.periodo_inicio} até ${f.periodo_fim}`);
  $('fecResumo').innerHTML = `${box('Status', f.status || (f.preview ? 'Prévia' : 'Fechado'), f.preview ? 'Prévia não salva' : `Protocolo: ${f.protocolo}`)}${box('Período', `${f.periodo_inicio} até ${f.periodo_fim}`, f.preview ? 'Prévia não salva' : `Criado em: ${dt(f.created_at)}`)}${controleBox}${box('Saldo inicial', saldoInicialTexto(f.saldo_inicial), 'Regra: usa fechamento anterior quando existir')}${box('Movimentações', `Entradas ${num(mv.entradas)} • Saídas ${num(mv.saidas)} • Devoluções ${num(mv.devolucoes)} • Baixas ${num(mv.baixas)}`, `Total: ${num(mv.total_movimentos)}`)}${box('Observação', f.observacao || '-', `Responsável: ${f.responsavel || '-'}`)}${cancelBox}`;
  $('fecAuditoria').innerHTML = `${box('Resumo da auditoria', `Total ${num(aud.total)} • Críticas ${num(aud.criticas)} • Altas ${num(aud.altas)} • Médias ${num(aud.medias)} • Baixas ${num(aud.baixas)}`, Number(aud.total||0) ? 'Fechamento possui pendência de auditoria' : 'Auditoria limpa no momento do fechamento')}${(f.divergencias || []).slice(0,5).map(d=>box(`[${d.gravidade}] ${d.codigo || '-'}`, d.problema || '-', d.sugestao || '')).join('') || '<div class="msg show ok">Nenhuma divergência registrada no fechamento.</div>'}`;
  $('fecStatus').innerHTML = (sf.por_status || []).map(s=>box(s.status, `${num(s.total)} item(ns)`, br(s.valor))).join('') || '<div class="msg show warn">Sem distribuição por status.</div>';
  $('fecAssBox').innerHTML = `<b>${esc(f.assinatura_nome || 'Sem assinatura nominal')}</b><br><small>Documento: ${esc(f.assinatura_documento || '-')}<br>Assinado em: ${esc(dt(f.assinado_em))}<br>Responsável: ${esc(f.responsavel || '-')}</small>`;
}
function box(title,body,small='', extraClass=''){ return `<div class="fec-box ${extraClass}"><b>${esc(title)}</b><small>${esc(body || '')}${small ? '<br>'+esc(small) : ''}</small></div>`; }
function saldoInicialTexto(si){ if(!si) return 'Não informado'; if(si.tipo === 'sem_fechamento_anterior') return 'Sem fechamento anterior formal'; if(si.tipo === 'fechamento_anterior') return `Importado do fechamento anterior até ${si.periodo_fim || '-'}`; return si.mensagem || si.tipo || 'Prévia'; }
function renderHistorico(){
  $('fecHistorico').innerHTML = `<table><thead><tr><th>Data</th><th>Período</th><th>Responsável</th><th>Status</th><th>Auditoria</th><th>Ações</th></tr></thead><tbody>${S.historico.map(f=>`<tr><td>${esc(dt(f.created_at))}</td><td>${esc(f.periodo_inicio)} até ${esc(f.periodo_fim)}</td><td>${esc(f.responsavel)}</td><td><span class="badge ${f.status === 'Cancelado' ? 'fec-status-cancelado' : 'fec-status-fechado'}">${esc(f.status)}</span></td><td>${esc(num(f.auditoria_resumo?.total || 0))} diverg.</td><td><div class="fec-actions"><button class="secondary" data-fec-pdf="${esc(f.id)}">PDF</button>${f.status === 'Fechado' ? `<button class="danger" data-fec-cancelar="${esc(f.id)}">Cancelar</button>` : ''}</div></td></tr>`).join('') || '<tr><td colspan="6">Nenhum fechamento salvo.</td></tr>'}</tbody></table>`;
  document.querySelectorAll('[data-fec-pdf]').forEach(btn => btn.onclick = () => { const f = S.historico.find(x=>x.id===btn.dataset.fecPdf); if(f) gerarPdf(f); });
  document.querySelectorAll('[data-fec-cancelar]').forEach(btn => btn.onclick = () => cancelarFechamento(btn.dataset.fecCancelar));
}
function resumoWhats(f){
  const sf = f.saldo_final || {}, mv = f.resumo_movimentos || {}, aud = f.auditoria_resumo || {};
  const lines = [`📌 FECHAMENTO OPERACIONAL - LIKE ESTOQUE`, `Status: ${f.status || 'Prévia'}`, `Período: ${f.periodo_inicio} até ${f.periodo_fim}`, `Responsável: ${f.responsavel || '-'}`, `Protocolo: ${f.protocolo || 'prévia'}`, '', 'Saldo final:', `- Ativos: ${sf.equipamentos_ativos || 0}`, `- Em estoque: ${sf.em_estoque || 0}`, `- Com técnico: ${sf.com_tecnico || 0}`, `- Baixados/inativos: ${sf.baixados_inativos || 0}`, '', 'Movimentos:', `- Entradas: ${mv.entradas || 0}`, `- Saídas: ${mv.saidas || 0}`, `- Devoluções: ${mv.devolucoes || 0}`, `- Baixas: ${mv.baixas || 0}`, `- Total: ${mv.total_movimentos || 0}`, '', `Auditoria: ${aud.total || 0} divergência(s)`, `Assinatura: ${f.assinatura_nome || '-'}`];
  if(f.status === 'Fechado') lines.push('', 'Controle:', '- Período fechado bloqueia novas movimentações internas.');
  if(f.status === 'Cancelado') lines.push('', 'Cancelamento:', `- Protocolo: ${f.cancelamento_protocolo || '-'}`, `- Responsável: ${f.cancelado_responsavel || '-'}`, `- Data: ${dt(f.cancelado_em)}`, `- Motivo: ${f.cancelado_motivo || '-'}`);
  return lines.join('\n');
}
async function copiarResumo(){ const f = S.ultimo || S.preview; if(!f) return msg('Gere uma prévia ou confirme um fechamento antes de copiar.', 'warn'); try{ await navigator.clipboard.writeText(resumoWhats(f)); msg('Resumo copiado para WhatsApp.', 'ok'); }catch(e){ window.prompt('Copie o resumo:', resumoWhats(f)); } }
function pdfText(doc, text, x, y, w=180, lh=5){ const lines = doc.splitTextToSize(String(text ?? '-'), w); lines.forEach(line => { if(y > 280){ doc.addPage(); y = 16; } doc.text(line,x,y); y+=lh; }); return y; }
function pdfTable(doc, head, rows, y, widths){ const sx=14; const header=()=>{ doc.setFont('helvetica','bold'); doc.setFontSize(7); let x=sx; head.forEach((h,i)=>{ doc.text(String(h),x+1,y); x+=widths[i]; }); y+=3; doc.setDrawColor(210); doc.line(sx,y,196,y); y+=4; doc.setFont('helvetica','normal'); doc.setFontSize(7); }; header(); rows.forEach(r=>{ if(y>275){ doc.addPage(); y=18; header(); } let x=sx, max=1; const cells=r.map((c,i)=>{ const lines=doc.splitTextToSize(String(c??'-'), Math.max(10,widths[i]-2)); max=Math.max(max,lines.length); return lines; }); const h=Math.max(6,max*3.5+2); cells.forEach((lines,i)=>{ doc.text(lines.slice(0,4),x+1,y); x+=widths[i]; }); y+=h; doc.setDrawColor(238); doc.line(sx,y-2,196,y-2); }); return y+3; }
function footer(doc){ const p = doc.internal.getCurrentPageInfo().pageNumber; doc.setFontSize(8); doc.setTextColor(110); doc.text('LIKE Estoque • Fechamento operacional • Documento interno',14,287); doc.text(`Página ${p}`,180,287); doc.setTextColor(0); }
function gerarPdf(f){
  if(!window.jspdf?.jsPDF) return msg('jsPDF não carregou.', 'bad');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:'portrait', unit:'mm', format:'a4'});
  const sf = f.saldo_final || {}, mv = f.resumo_movimentos || {}, aud = f.auditoria_resumo || {};
  let y=18;
  doc.setFont('helvetica','bold'); doc.setFontSize(19); doc.text('LIKE Estoque',14,y); y+=9;
  doc.setFontSize(14); doc.text('Fechamento operacional por período',14,y); y+=8;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y=pdfText(doc,`Status: ${f.status || 'Prévia'} | Protocolo: ${f.protocolo || 'prévia'} | Período: ${f.periodo_inicio} até ${f.periodo_fim}`,14,y);
  y=pdfText(doc,`Responsável: ${f.responsavel || '-'} | Assinatura: ${f.assinatura_nome || '-'} | Documento: ${f.assinatura_documento || '-'}`,14,y);
  y=pdfText(doc,`Controle de período: ${f.status === 'Fechado' ? 'período bloqueado para novas movimentações' : f.status === 'Cancelado' ? 'período liberado por cancelamento' : 'bloqueio aplicado somente após confirmação'}`,14,y,180);
  y=pdfText(doc,`Observação: ${f.observacao || '-'}`,14,y,180);
  if(f.status === 'Cancelado') y=pdfText(doc,`CANCELAMENTO: ${f.cancelado_motivo || '-'} | Responsável: ${f.cancelado_responsavel || '-'} | Data: ${dt(f.cancelado_em)} | Protocolo: ${f.cancelamento_protocolo || '-'}`,14,y,180);
  y+=5; doc.setDrawColor(0); doc.line(14,y,196,y); y+=8;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('1. Resumo executivo',14,y); y+=7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y=pdfText(doc,`O fechamento consolidou ${sf.equipamentos_ativos || 0} equipamento(s) ativo(s), ${sf.em_estoque || 0} em estoque, ${sf.com_tecnico || 0} com técnico e ${sf.baixados_inativos || 0} baixado(s)/inativo(s). No período foram registrados ${mv.total_movimentos || 0} movimento(s). A auditoria apontou ${aud.total || 0} divergência(s).`,14,y,180);
  y+=3;
  y=pdfTable(doc,['Indicador','Valor'],[['Ativos',sf.equipamentos_ativos||0],['Em estoque',sf.em_estoque||0],['Com técnico',sf.com_tecnico||0],['Baixados/inativos',sf.baixados_inativos||0],['Valor ativo',br(sf.valor_ativo)],['Divergências auditoria',aud.total||0]],y,[95,87]);
  footer(doc);
  doc.addPage(); y=18; doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('2. Movimentações do período',14,y); y+=7; doc.setFont('helvetica','normal'); doc.setFontSize(8);
  y=pdfTable(doc,['Tipo','Total'],(mv.por_tipo||[]).map(x=>[x.tipo,x.total]),y,[130,52]);
  y+=5; doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('3. Saldo final por status',14,y); y+=7; doc.setFont('helvetica','normal'); doc.setFontSize(8);
  y=pdfTable(doc,['Status','Total','Valor'],(sf.por_status||[]).map(x=>[x.status,x.total,br(x.valor)]),y,[90,30,62]);
  footer(doc);
  doc.addPage(); y=18; doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('4. Auditoria e conferência',14,y); y+=7; doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y=pdfText(doc,`Auditoria: total ${aud.total||0}, críticas ${aud.criticas||0}, altas ${aud.altas||0}, médias ${aud.medias||0}, baixas ${aud.baixas||0}.`,14,y);
  if((f.divergencias||[]).length) y=pdfTable(doc,['Grav.','Categoria','Código','Problema'],(f.divergencias||[]).slice(0,60).map(d=>[d.gravidade,d.categoria,d.codigo,d.problema]),y,[20,42,30,90]); else y=pdfText(doc,'Nenhuma divergência registrada no fechamento.',14,y);
  y+=18; doc.setDrawColor(120); doc.line(24,y,92,y); doc.line(118,y,186,y); y+=5; doc.setFontSize(9); doc.text('Responsável pelo fechamento',34,y); doc.text('Gestor / Conferência',135,y);
  footer(doc);
  doc.save(`fechamento_operacional_${f.status === 'Cancelado' ? 'cancelado_' : ''}${f.periodo_inicio}_${f.periodo_fim}.pdf`);
}

inject();
window.fechamentoCleanLoad = loadHistorico;
