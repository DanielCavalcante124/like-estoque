import { table, call } from './api.js?v=3';

const S = { rel:null, tecnicos:[], status:[], page:1, pageSize:25, tab:'movimentos', lastRows:[], lastHead:[], lastTitle:'Relatório gerencial' };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const br = v => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const qtd = v => Number(v || 0).toLocaleString('pt-BR',{maximumFractionDigits:3});
const fmt = v => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return String(v || '-'); } };
const safeFile = v => String(v || 'relatorio').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'relatorio';
const nomeItem = o => [o?.tipo,o?.marca,o?.modelo].filter(Boolean).join(' ') || '-';

function msg(text,type=''){
  const el = $('relCleanMsg');
  if(el){ el.textContent = text; el.className = 'msg show ' + type; }
}
function css(){
  if($('relGerencialCss')) return;
  const s = document.createElement('style');
  s.id = 'relGerencialCss';
  s.textContent = `.rel-actions{display:flex;gap:8px;flex-wrap:wrap}.rel-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.rel-tab{border:1px solid #dbe4ef;background:#fff;border-radius:999px;padding:8px 12px;cursor:pointer}.rel-tab.active{background:#0f4c81;color:#fff;border-color:#0f4c81}.rel-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.rel-kpi{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:12px}.rel-kpi small{display:block;color:#64748b;font-weight:800}.rel-kpi b{font-size:22px}.rel-kpi.warn{border-color:#f59e0b}.rel-kpi.bad{border-color:#ef4444}.rel-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:12px}.rel-alert-list{display:grid;gap:8px}.rel-alert{border:1px solid #e5e7eb;background:#fff;border-radius:14px;padding:10px}.rel-alert b{display:block}.rel-alert small{color:#64748b}.rel-table-wrap table th,.rel-table-wrap table td{white-space:nowrap}.rel-doc-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.rel-doc-head h1{margin:0}.rel-doc-head p{margin:4px 0;color:#64748b}.rel-doc-meta{text-align:right;color:#64748b}.rel-footer{margin-top:20px;color:#64748b;font-size:12px}.rel-sign{display:flex;justify-content:space-between;gap:30px;margin-top:28px}.rel-sign div{flex:1;text-align:center}.rel-sign span{display:block;border-top:1px solid #222;height:8px}.rel-page-info{color:#64748b;font-size:13px;margin:8px 0}.rel-section{margin:18px 0;break-inside:avoid}.rel-section h3{margin:0 0 8px}.rel-section p{margin:4px 0;color:#334155}.rel-print-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.rel-print-kpi{border:1px solid #dbe4ef;border-radius:12px;padding:8px}.rel-print-kpi small{display:block;color:#64748b}.rel-print-kpi b{font-size:17px}.rel-recommend{border-left:4px solid #0f4c81;padding:8px 10px;background:#f8fafc;margin:6px 0}.rel-pagebreak{break-before:page}@media(max-width:1100px){.rel-kpis{grid-template-columns:repeat(3,1fr)}.rel-grid{grid-template-columns:1fr}}@media(max-width:620px){.rel-kpis{grid-template-columns:1fr 1fr}.rel-actions button{width:100%}.rel-doc-head{display:block}.rel-doc-meta{text-align:left}.rel-sign{display:block}.rel-sign div{margin-top:30px}}@media print{body{background:#fff!important}.sidebar,.topbar,.no-print,.rel-tabs,#relCleanMsg{display:none!important}.app-shell{display:block!important}.main{margin:0!important;padding:0!important}.card{box-shadow:none!important;border:none!important;padding:0!important}.rel-doc{display:block!important}.rel-table-wrap{overflow:visible!important}.rel-table-wrap table{font-size:9.5px;width:100%;border-collapse:collapse}.rel-table-wrap th,.rel-table-wrap td{border:1px solid #d1d5db;padding:4px}.rel-print-kpis{grid-template-columns:repeat(4,1fr)}.rel-section{break-inside:avoid}.rel-pagebreak{break-before:page}.rel-sign{page-break-inside:avoid}}`;
  document.head.appendChild(s);
}
function inject(){
  css();
  if(!$('navRelatoriosClean')){
    const ref = $('navTecnicosClean') || $('navMateriaisClean') || $('navEquipamentosClean') || document.querySelector('[data-page="cadastros"]');
    const b = document.createElement('button');
    b.id = 'navRelatoriosClean'; b.className = 'nav'; b.textContent = 'Relatórios'; b.onclick = show;
    ref ? ref.insertAdjacentElement('afterend', b) : document.querySelector('.sidebar').appendChild(b);
  }
  if(!$('page-relatorios-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-relatorios-clean'; sec.className = 'page';
    sec.innerHTML = `<div class="card no-print"><div class="table-head"><div><h2>Relatórios gerenciais</h2><p>Fechamento operacional com KPIs, alertas, estoque, técnicos, materiais e movimentações.</p></div><button id="relReload" class="secondary">Atualizar relatório</button></div><div class="form-grid two"><input id="relIni" type="date" title="Data inicial"><input id="relFim" type="date" title="Data final"></div><div class="form-grid two"><select id="relTecnico"><option value="">Todos os técnicos</option></select><select id="relStatus"><option value="">Todos os status</option></select></div><div class="rel-actions"><button id="relFechar" class="primary">Gerar fechamento</button><button id="relCopiar" class="secondary">Copiar resumo WhatsApp</button><button id="relCsv" class="secondary">Baixar CSV da tabela</button><button id="relPrint" class="warn">Imprimir / PDF completo</button></div><div id="relCleanMsg" class="msg show">Clique em gerar fechamento.</div></div><div class="rel-kpis no-print" id="relKpis"></div><div class="rel-grid no-print"><div class="card"><h2>Distribuição</h2><div class="rel-tabs" id="relTabs"></div><div id="relResumoCards"></div></div><div class="card"><h2>Alertas operacionais</h2><div id="relAlertas" class="rel-alert-list"></div></div></div><div class="card rel-doc" id="relPrintArea"><div class="rel-doc-head"><div><h1>LIKE Estoque</h1><p>Relatório gerencial / fechamento operacional</p></div><div class="rel-doc-meta"><b id="relDocTitulo">Relatório</b><br><span id="relDocMeta">Emitido em --</span></div></div><h2 id="relTitulo">Resultado</h2><div id="relPageInfo" class="rel-page-info">Página 1</div><div class="rel-actions no-print"><button id="relPrev" class="secondary">Anterior</button><button id="relNext" class="secondary">Próxima</button></div><div id="relOut"></div><div class="rel-sign"><div><span></span><p>Responsável pela conferência</p></div><div><span></span><p>Data / assinatura</p></div></div><div class="rel-footer">Documento gerado pelo LIKE Estoque • Uso interno • Conferir dados antes de decisões operacionais</div></div>`;
    document.querySelector('.main').appendChild(sec);
  }
  $('relReload').onclick = load;
  $('relFechar').onclick = load;
  $('relCopiar').onclick = copiarResumo;
  $('relCsv').onclick = baixarCsv;
  $('relPrint').onclick = imprimirCompleto;
  $('relPrev').onclick = () => { if(S.page > 1){ S.page--; renderTable(); } };
  $('relNext').onclick = () => { const total = Math.max(1, Math.ceil(S.lastRows.length / S.pageSize)); if(S.page < total){ S.page++; renderTable(); } };
  ['relIni','relFim','relTecnico','relStatus'].forEach(id => { const el = $(id); if(el) el.onchange = load; });
}
function show(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navRelatoriosClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-relatorios-clean'));
  if($('pageTitle')) $('pageTitle').textContent = 'Relatórios gerenciais';
  load().catch(e => msg(e.message || String(e), 'bad'));
}
async function loadFiltros(){
  if(!S.tecnicos.length){
    try{ S.tecnicos = await table('tecnicos','nome',true); }catch(e){ S.tecnicos = []; }
    const atual = $('relTecnico')?.value || '';
    $('relTecnico').innerHTML = '<option value="">Todos os técnicos</option>' + S.tecnicos.filter(t=>t.ativo!==false).map(t=>`<option value="${esc(t.nome)}">${esc(t.nome)}</option>`).join('');
    $('relTecnico').value = atual;
  }
  if(!S.status.length){
    S.status = ['Em estoque','Com técnico','Manutenção','Aguardando baixa','Baixado','Reservado','Instalado cliente'];
    const atual = $('relStatus')?.value || '';
    $('relStatus').innerHTML = '<option value="">Todos os status</option>' + S.status.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
    $('relStatus').value = atual;
  }
}
async function load(){
  try{
    msg('Gerando fechamento operacional...', 'warn');
    await loadFiltros();
    S.rel = await call('rpc_relatorio_gerencial_5v', { p_data_ini:$('relIni')?.value || null, p_data_fim:$('relFim')?.value || null, p_tecnico:$('relTecnico')?.value || null, p_status:$('relStatus')?.value || null });
    S.page = 1; S.tab = 'movimentos'; render();
    msg('Fechamento gerencial carregado.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function render(){ if(!S.rel) return; renderKpis(); renderTabs(); renderResumo(); renderAlertas(); renderTable(); }
function kpi(label,value,sub='',cls=''){ return `<div class="rel-kpi ${cls}"><small>${esc(label)}</small><b>${esc(value)}</b>${sub?`<small>${esc(sub)}</small>`:''}</div>`; }
function renderKpis(){
  const k = S.rel?.kpis || {};
  $('relKpis').innerHTML = [kpi('Equipamentos ativos',k.equipamentos_total??0,`${k.equipamentos_filtrados??0} filtrados`),kpi('Em estoque',k.em_estoque??0),kpi('Com técnico',k.com_tecnico??0),kpi('Manutenção',k.manutencao??0,'',Number(k.manutencao||0)?'warn':''),kpi('Sem MAC/SN',k.sem_mac_sn??0,'',Number(k.sem_mac_sn||0)?'warn':''),kpi('Materiais críticos',k.materiais_criticos??0,'',Number(k.materiais_criticos||0)?'bad':''),kpi('Valor ativo',br(k.valor_total_ativo)),kpi('Movimentos período',k.movimentos_periodo??0),kpi('Lotes de saída',k.lotes_saida_periodo??0),kpi('Modelos ativos',k.modelos_ativos??0),kpi('Técnicos ativos',k.tecnicos_ativos??0),kpi('Baixados/inativos',k.baixados_inativos??0)].join('');
}
function renderTabs(){
  const tabs = [['movimentos','Movimentos'],['materiais','Materiais'],['status','Por status'],['tecnicos','Por técnico'],['modelos','Por modelo'],['alertas','Alertas']];
  $('relTabs').innerHTML = tabs.map(([id,label])=>`<button class="rel-tab ${S.tab===id?'active':''}" data-rel-tab="${id}">${esc(label)}</button>`).join('');
  document.querySelectorAll('[data-rel-tab]').forEach(b => b.onclick = () => { S.tab = b.dataset.relTab; S.page = 1; renderTabs(); renderTable(); });
}
function renderResumo(){
  const status = S.rel?.por_status || [], tecnicos = S.rel?.por_tecnico || [];
  $('relResumoCards').innerHTML = `<div class="table-wrap rel-table-wrap"><table><thead><tr><th>Status</th><th>Total</th><th>Valor</th></tr></thead><tbody>${status.slice(0,8).map(s=>`<tr><td>${esc(s.status)}</td><td>${esc(s.total)}</td><td>${esc(br(s.valor))}</td></tr>`).join('') || '<tr><td colspan="3">Sem dados.</td></tr>'}</tbody></table></div><h3>Técnicos com patrimônio</h3><div class="table-wrap rel-table-wrap"><table><thead><tr><th>Técnico</th><th>Total</th><th>Valor</th></tr></thead><tbody>${tecnicos.slice(0,8).map(t=>`<tr><td>${esc(t.tecnico)}</td><td>${esc(t.total)}</td><td>${esc(br(t.valor))}</td></tr>`).join('') || '<tr><td colspan="3">Sem dados.</td></tr>'}</tbody></table></div>`;
}
function linesHtml(lines){ return lines.length ? lines.map(esc).join('<br>') : 'Nenhuma pendência relevante.'; }
function card(title,total,lines){ return `<div class="rel-alert"><b>${esc(title)}: ${esc(total)}</b><small>${linesHtml(lines)}</small></div>`; }
function renderAlertas(){
  const a = S.rel?.alertas || {}, sem = a.equipamentos_sem_mac_sn || [], mat = a.materiais_criticos || [], man = a.equipamentos_manutencao || [];
  $('relAlertas').innerHTML = card('Equipamentos sem MAC/SN', sem.length, sem.slice(0,5).map(x=>`${x.codigo || '-'} • ${nomeItem(x)} • ${x.status || '-'}`)) + card('Materiais críticos', mat.length, mat.slice(0,5).map(x=>`${nomeItem(x)} • ${qtd(x.quantidade)} ${x.unidade_saida || ''} • mín. ${qtd(x.minimo)}`)) + card('Equipamentos em manutenção', man.length, man.slice(0,5).map(x=>`${x.codigo || '-'} • ${nomeItem(x)} • ${x.motivo || '-'}`));
}
function dataFor(tab){
  const r = S.rel || {};
  if(tab==='materiais') return { title:'Saldos de materiais', head:['Material','Categoria','Local','Técnico','Qtd','Mínimo','Ideal','Alerta'], rows:(r.materiais||[]).map(m=>[nomeItem(m),m.categoria||'-',m.local||'-',m.tecnico||'-',qtd(m.quantidade),qtd(m.minimo),qtd(m.ideal),m.alerta||'OK']) };
  if(tab==='status') return { title:'Equipamentos por status', head:['Status','Total','Valor'], rows:(r.por_status||[]).map(s=>[s.status,s.total,br(s.valor)]) };
  if(tab==='tecnicos') return { title:'Patrimônio por técnico', head:['Técnico','Total','Valor'], rows:(r.por_tecnico||[]).map(t=>[t.tecnico,t.total,br(t.valor)]) };
  if(tab==='modelos') return { title:'Patrimônio por modelo', head:['Tipo','Marca','Modelo','Total','Valor'], rows:(r.por_modelo||[]).map(m=>[m.tipo,m.marca,m.modelo,m.total,br(m.valor)]) };
  if(tab==='alertas'){
    const a = r.alertas || {}, rows = [];
    (a.equipamentos_sem_mac_sn||[]).forEach(x=>rows.push(['Sem MAC/SN',x.codigo,nomeItem(x),x.status||'-',x.local||'-']));
    (a.materiais_criticos||[]).forEach(x=>rows.push(['Material crítico','-',nomeItem(x),`${qtd(x.quantidade)} ${x.unidade_saida||''}`,`${x.local||'-'} / ${x.tecnico||'-'}`]));
    (a.equipamentos_manutencao||[]).forEach(x=>rows.push(['Manutenção',x.codigo,nomeItem(x),x.motivo||'-',x.local||'-']));
    return { title:'Alertas operacionais', head:['Alerta','Código','Item','Status/Qtd/Motivo','Local/Técnico'], rows };
  }
  return { title:'Movimentações do período', head:['Data','Código','Tipo','Técnico','Destino','Cliente/OS','Motivo','Status final'], rows:(r.movimentos||[]).map(m=>[fmt(m.data),m.codigo||'-',m.tipo||'-',m.tecnico||'-',m.destino||'-',[m.cliente,m.os].filter(Boolean).join(' / ')||'-',m.motivo||'-',m.status_final||'-']) };
}
function renderTable(){
  const d = dataFor(S.tab); S.lastTitle = d.title; S.lastHead = d.head; S.lastRows = d.rows;
  const total = Math.max(1, Math.ceil(d.rows.length / S.pageSize)); if(S.page > total) S.page = total;
  const start = (S.page - 1) * S.pageSize, rows = d.rows.slice(start, start + S.pageSize);
  $('relTitulo').textContent = d.title; $('relDocTitulo').textContent = d.title; $('relDocMeta').textContent = `Emitido em ${fmt(S.rel?.gerado_em || new Date())}`;
  $('relPageInfo').textContent = `Página ${S.page} de ${total} • Registros ${d.rows.length ? start+1 : 0}-${Math.min(start+S.pageSize,d.rows.length)} de ${d.rows.length}`;
  $('relOut').innerHTML = tabela(d.head, rows, d.head.length);
  $('relPrev').disabled = S.page <= 1; $('relNext').disabled = S.page >= total;
}
function tabela(head, rows, colspan){
  return `<div class="table-wrap rel-table-wrap"><table class="rel-table"><thead><tr>${head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${colspan || head.length}">Sem dados.</td></tr>`}</tbody></table></div>`;
}
function printKpi(label,value,sub=''){
  return `<div class="rel-print-kpi"><small>${esc(label)}</small><b>${esc(value)}</b>${sub?`<small>${esc(sub)}</small>`:''}</div>`;
}
function recomendacoes(){
  const k = S.rel?.kpis || {}, a = S.rel?.alertas || {};
  const r = [];
  if(Number(k.materiais_criticos||0)>0) r.push(`Priorizar reposição dos ${k.materiais_criticos} material(is) crítico(s), começando pelos itens abaixo do mínimo.`);
  if(Number(k.sem_mac_sn||0)>0) r.push(`Regularizar cadastro dos ${k.sem_mac_sn} equipamento(s) sem MAC/SN para melhorar rastreabilidade.`);
  if((a.equipamentos_manutencao||[]).length) r.push(`Resolver fila de manutenção: testar, devolver ao estoque ou encaminhar para baixa controlada.`);
  if(Number(k.com_tecnico||0)>0) r.push(`Conferir carga dos técnicos e cruzar com OS/saídas recentes antes do fechamento.`);
  if(!r.length) r.push('Sem alerta crítico no fechamento. Manter conferência periódica e assinatura do responsável.');
  return r;
}
function resumoTexto(){
  const k = S.rel?.kpis || {}, a = S.rel?.alertas || {};
  return ['📊 FECHAMENTO OPERACIONAL - LIKE ESTOQUE','Gerado em: '+fmt(S.rel?.gerado_em || new Date()),'Período: '+(($('relIni')?.value || 'início')+' até '+($('relFim')?.value || 'hoje')),'Técnico: '+($('relTecnico')?.value || 'Todos'),'Status: '+($('relStatus')?.value || 'Todos'),'','KPIs:','- Equipamentos ativos: '+(k.equipamentos_total ?? 0),'- Em estoque: '+(k.em_estoque ?? 0),'- Com técnico: '+(k.com_tecnico ?? 0),'- Manutenção: '+(k.manutencao ?? 0),'- Sem MAC/SN: '+(k.sem_mac_sn ?? 0),'- Materiais críticos: '+(k.materiais_criticos ?? 0),'- Movimentos no período: '+(k.movimentos_periodo ?? 0),'- Lotes de saída no período: '+(k.lotes_saida_periodo ?? 0),'','Alertas:','- Equipamentos sem MAC/SN: '+((a.equipamentos_sem_mac_sn || []).length),'- Materiais críticos: '+((a.materiais_criticos || []).length),'- Equipamentos em manutenção: '+((a.equipamentos_manutencao || []).length),'','Conferir relatório completo no sistema antes de decisões operacionais.'].join('\n');
}
function renderPdfCompleto(){
  if(!S.rel) return;
  const k = S.rel.kpis || {}, a = S.rel.alertas || {};
  const status = dataFor('status'), tecnicos = dataFor('tecnicos'), modelos = dataFor('modelos'), materiais = dataFor('materiais'), movimentos = dataFor('movimentos'), alertas = dataFor('alertas');
  const materiaisCriticos = (S.rel.materiais || []).filter(m => m.alerta && m.alerta !== 'OK').map(m=>[nomeItem(m), m.local || '-', m.tecnico || '-', qtd(m.quantidade), qtd(m.minimo), qtd(m.ideal), m.alerta]);
  $('relTitulo').textContent = 'Relatório gerencial completo';
  $('relDocTitulo').textContent = 'Fechamento completo';
  $('relDocMeta').textContent = `Emitido em ${fmt(S.rel.gerado_em || new Date())}`;
  $('relPageInfo').textContent = `Período: ${$('relIni')?.value || 'início'} até ${$('relFim')?.value || 'hoje'} • Técnico: ${$('relTecnico')?.value || 'Todos'} • Status: ${$('relStatus')?.value || 'Todos'}`;
  $('relOut').innerHTML = `
    <div class="rel-section"><h3>1. Resumo executivo</h3><p>Este relatório consolida a posição operacional do estoque, patrimônio por técnico, materiais, movimentações e alertas que exigem ação.</p><div class="rel-print-kpis">
      ${printKpi('Equipamentos ativos', k.equipamentos_total ?? 0, `${k.equipamentos_filtrados ?? 0} filtrados`)}
      ${printKpi('Em estoque', k.em_estoque ?? 0)}
      ${printKpi('Com técnico', k.com_tecnico ?? 0)}
      ${printKpi('Manutenção', k.manutencao ?? 0)}
      ${printKpi('Sem MAC/SN', k.sem_mac_sn ?? 0)}
      ${printKpi('Materiais críticos', k.materiais_criticos ?? 0)}
      ${printKpi('Valor ativo', br(k.valor_total_ativo))}
      ${printKpi('Movimentos', k.movimentos_periodo ?? 0)}
      ${printKpi('Lotes de saída', k.lotes_saida_periodo ?? 0)}
      ${printKpi('Modelos ativos', k.modelos_ativos ?? 0)}
      ${printKpi('Técnicos ativos', k.tecnicos_ativos ?? 0)}
      ${printKpi('Baixados/inativos', k.baixados_inativos ?? 0)}
    </div></div>
    <div class="rel-section"><h3>2. Alertas prioritários</h3>${tabela(alertas.head, alertas.rows.slice(0,80), alertas.head.length)}</div>
    <div class="rel-section"><h3>3. Recomendações de ação</h3>${recomendacoes().map(x=>`<div class="rel-recommend">${esc(x)}</div>`).join('')}</div>
    <div class="rel-section rel-pagebreak"><h3>4. Distribuição por status</h3>${tabela(status.head, status.rows, status.head.length)}</div>
    <div class="rel-section"><h3>5. Patrimônio por técnico</h3>${tabela(tecnicos.head, tecnicos.rows, tecnicos.head.length)}</div>
    <div class="rel-section"><h3>6. Patrimônio por modelo</h3>${tabela(modelos.head, modelos.rows.slice(0,50), modelos.head.length)}</div>
    <div class="rel-section rel-pagebreak"><h3>7. Materiais críticos</h3>${tabela(['Material','Local','Técnico','Qtd','Mínimo','Ideal','Alerta'], materiaisCriticos, 7)}</div>
    <div class="rel-section"><h3>8. Saldos de materiais</h3>${tabela(materiais.head, materiais.rows.slice(0,120), materiais.head.length)}</div>
    <div class="rel-section rel-pagebreak"><h3>9. Movimentações do período</h3><p>Lista limitada aos últimos 100 registros retornados pela RPC para manter o PDF legível.</p>${tabela(movimentos.head, movimentos.rows.slice(0,100), movimentos.head.length)}</div>`;
}
async function imprimirCompleto(){
  if(!S.rel){ await load(); }
  if(!S.rel) return msg('Não foi possível gerar o relatório.', 'bad');
  renderPdfCompleto();
  msg('Relatório completo preparado. Na janela de impressão, escolha Salvar como PDF.', 'ok');
  setTimeout(() => window.print(), 120);
}
async function copiarResumo(){
  if(!S.rel) return msg('Gere o fechamento primeiro.', 'warn');
  try{ await navigator.clipboard.writeText(resumoTexto()); msg('Resumo do fechamento copiado para WhatsApp.', 'ok'); }catch(e){ window.prompt('Copie o resumo:', resumoTexto()); }
}
function baixarCsv(){
  if(!S.lastRows.length) return msg('Tabela sem dados para exportar.', 'warn');
  const csv = [S.lastHead, ...S.lastRows].map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = `${safeFile(S.lastTitle)}_${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); msg('CSV baixado.', 'ok');
}

inject();
window.relatoriosCleanLoad = load;
