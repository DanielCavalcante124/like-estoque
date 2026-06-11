import { table, call } from './api.js?v=5';

const S = { rel:null, tecnicos:[], status:[], page:1, pageSize:25, tab:'movimentos', lastRows:[], lastHead:[], lastTitle:'Relatório gerencial' };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const br = v => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const qtd = v => Number(v || 0).toLocaleString('pt-BR',{maximumFractionDigits:3});
const fmt = v => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return String(v || '-'); } };
const nomeItem = o => [o?.tipo,o?.marca,o?.modelo].filter(Boolean).join(' ') || '-';
const safeFile = v => String(v || 'relatorio').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'relatorio';
const hoje = () => new Date().toISOString().slice(0,10);
const LIMITES = { p_mov_limit:100, p_mat_limit:200, p_alert_limit:100 };

function msg(text,type=''){
  const el = $('relCleanMsg');
  if(el){ el.textContent = text; el.className = 'msg show ' + type; }
}
function css(){
  if($('relGerencialCss')) return;
  const s = document.createElement('style');
  s.id = 'relGerencialCss';
  s.textContent = `.rel-actions{display:flex;gap:8px;flex-wrap:wrap}.rel-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.rel-tab{border:1px solid #dbe4ef;background:#fff;border-radius:999px;padding:8px 12px;cursor:pointer}.rel-tab.active{background:#0f4c81;color:#fff;border-color:#0f4c81}.rel-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.rel-kpi{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:12px}.rel-kpi small{display:block;color:#64748b;font-weight:800}.rel-kpi b{font-size:22px}.rel-kpi.warn{border-color:#f59e0b}.rel-kpi.bad{border-color:#ef4444}.rel-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:12px}.rel-alert-list{display:grid;gap:8px}.rel-alert{border:1px solid #e5e7eb;background:#fff;border-radius:14px;padding:10px}.rel-alert b{display:block}.rel-alert small{color:#64748b}.rel-table-wrap table th,.rel-table-wrap table td{white-space:nowrap}.rel-page-info{color:#64748b;font-size:13px;margin:8px 0}.rel-limit-note{margin-top:8px;font-size:12px;color:#64748b;font-weight:700}@media(max-width:1100px){.rel-kpis{grid-template-columns:repeat(3,1fr)}.rel-grid{grid-template-columns:1fr}}@media(max-width:620px){.rel-kpis{grid-template-columns:1fr 1fr}.rel-actions button{width:100%}}`;
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
    sec.innerHTML = `
      <div class="card">
        <div class="table-head"><div><h2>Relatórios gerenciais</h2><p>Fechamento operacional com KPIs, alertas, estoque, técnicos, materiais e movimentações. Listas pesadas são limitadas no banco para manter performance.</p></div><button id="relReload" class="secondary">Atualizar relatório</button></div>
        <div class="form-grid two"><input id="relIni" type="date" title="Data inicial"><input id="relFim" type="date" title="Data final"></div>
        <div class="form-grid two"><select id="relTecnico"><option value="">Todos os técnicos</option></select><select id="relStatus"><option value="">Todos os status</option></select></div>
        <div class="rel-actions"><button id="relFechar" class="primary">Gerar fechamento</button><button id="relCopiar" class="secondary">Copiar resumo WhatsApp</button><button id="relCsv" class="secondary">Baixar CSV da tabela</button><button id="relPrint" class="warn">Baixar PDF gerencial</button></div>
        <div id="relCleanMsg" class="msg show">Clique em gerar fechamento.</div>
      </div>
      <div class="rel-kpis" id="relKpis"></div>
      <div class="rel-grid">
        <div class="card"><h2>Distribuição</h2><div class="rel-tabs" id="relTabs"></div><div id="relResumoCards"></div></div>
        <div class="card"><h2>Alertas operacionais</h2><div id="relAlertas" class="rel-alert-list"></div></div>
      </div>
      <div class="card"><h2 id="relTitulo">Resultado</h2><div id="relPageInfo" class="rel-page-info">Página 1</div><div class="rel-actions"><button id="relPrev" class="secondary">Anterior</button><button id="relNext" class="secondary">Próxima</button></div><div id="relOut"></div><div id="relLimitNote" class="rel-limit-note"></div></div>`;
    document.querySelector('.main').appendChild(sec);
  }
  $('relReload').onclick = load;
  $('relFechar').onclick = load;
  $('relCopiar').onclick = copiarResumo;
  $('relCsv').onclick = baixarCsv;
  $('relPrint').onclick = gerarPdfGerencial;
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
function filtros(){ return { p_data_ini:$('relIni')?.value || null, p_data_fim:$('relFim')?.value || null, p_tecnico:$('relTecnico')?.value || null, p_status:$('relStatus')?.value || null, ...LIMITES }; }
async function carregarRelatorio(){ return await call('rpc_relatorio_gerencial_7a5', filtros()); }
async function load(){
  try{
    msg('Gerando fechamento operacional limitado no banco...', 'warn');
    await loadFiltros();
    S.rel = await carregarRelatorio();
    S.page = 1; S.tab = 'movimentos'; render();
    msg('Fechamento gerencial carregado com limites de performance.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function render(){ if(!S.rel) return; renderKpis(); renderTabs(); renderResumo(); renderAlertas(); renderTable(); }
function kpi(label,value,sub='',cls=''){ return `<div class="rel-kpi ${cls}"><small>${esc(label)}</small><b>${esc(value)}</b>${sub?`<small>${esc(sub)}</small>`:''}</div>`; }
function renderKpis(){
  const k = S.rel?.kpis || {};
  $('relKpis').innerHTML = [
    kpi('Equipamentos ativos',k.equipamentos_total??0,`${k.equipamentos_filtrados??0} filtrados`),
    kpi('Em estoque',k.em_estoque??0),
    kpi('Com técnico',k.com_tecnico??0),
    kpi('Manutenção',k.manutencao??0,'',Number(k.manutencao||0)?'warn':''),
    kpi('Sem MAC/SN',k.sem_mac_sn??0,'',Number(k.sem_mac_sn||0)?'warn':''),
    kpi('Materiais críticos',k.materiais_criticos??0,'',Number(k.materiais_criticos||0)?'bad':''),
    kpi('Valor ativo',br(k.valor_total_ativo)),
    kpi('Movimentos período',k.movimentos_periodo??0,`mostra até ${S.rel?.limites?.movimentos || LIMITES.p_mov_limit}`),
    kpi('Lotes de saída',k.lotes_saida_periodo??0),
    kpi('Modelos ativos',k.modelos_ativos??0),
    kpi('Técnicos ativos',k.tecnicos_ativos??0),
    kpi('Baixados/inativos',k.baixados_inativos??0)
  ].join('');
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
  if(tab==='materiais') return { title:'Saldos de materiais', limitKey:'materiais', totalRef:null, head:['Material','Categoria','Local','Técnico','Qtd','Mínimo','Ideal','Alerta'], rows:(r.materiais||[]).map(m=>[nomeItem(m),m.categoria||'-',m.local||'-',m.tecnico||'-',qtd(m.quantidade),qtd(m.minimo),qtd(m.ideal),m.alerta||'OK']) };
  if(tab==='status') return { title:'Equipamentos por status', head:['Status','Total','Valor'], rows:(r.por_status||[]).map(s=>[s.status,s.total,br(s.valor)]) };
  if(tab==='tecnicos') return { title:'Patrimônio por técnico', head:['Técnico','Total','Valor'], rows:(r.por_tecnico||[]).map(t=>[t.tecnico,t.total,br(t.valor)]) };
  if(tab==='modelos') return { title:'Patrimônio por modelo', head:['Tipo','Marca','Modelo','Total','Valor'], rows:(r.por_modelo||[]).map(m=>[m.tipo,m.marca,m.modelo,m.total,br(m.valor)]) };
  if(tab==='alertas'){
    const a = r.alertas || {}, rows = [];
    (a.equipamentos_sem_mac_sn||[]).forEach(x=>rows.push(['Sem MAC/SN',x.codigo,nomeItem(x),x.status||'-',x.local||'-']));
    (a.materiais_criticos||[]).forEach(x=>rows.push(['Material crítico','-',nomeItem(x),`${qtd(x.quantidade)} ${x.unidade_saida||''}`,`${x.local||'-'} / ${x.tecnico||'-'}`]));
    (a.equipamentos_manutencao||[]).forEach(x=>rows.push(['Manutenção',x.codigo,nomeItem(x),x.motivo||'-',x.local||'-']));
    return { title:'Alertas operacionais', limitKey:'alertas', head:['Alerta','Código','Item','Status/Qtd/Motivo','Local/Técnico'], rows };
  }
  return { title:'Movimentações do período', limitKey:'movimentos', totalRef:S.rel?.kpis?.movimentos_periodo, head:['Data','Código','Tipo','Técnico','Destino','Cliente/OS','Motivo','Status final'], rows:(r.movimentos||[]).map(m=>[fmt(m.data),m.codigo||'-',m.tipo||'-',m.tecnico||'-',m.destino||'-',[m.cliente,m.os].filter(Boolean).join(' / ')||'-',m.motivo||'-',m.status_final||'-']) };
}
function renderTable(){
  const d = dataFor(S.tab); S.lastTitle = d.title; S.lastHead = d.head; S.lastRows = d.rows;
  const total = Math.max(1, Math.ceil(d.rows.length / S.pageSize)); if(S.page > total) S.page = total;
  const start = (S.page - 1) * S.pageSize, rows = d.rows.slice(start, start + S.pageSize);
  $('relTitulo').textContent = d.title;
  $('relPageInfo').textContent = `Página ${S.page} de ${total} • Registros ${d.rows.length ? start+1 : 0}-${Math.min(start+S.pageSize,d.rows.length)} de ${d.rows.length}`;
  $('relOut').innerHTML = tabelaHtml(d.head, rows, d.head.length);
  $('relPrev').disabled = S.page <= 1; $('relNext').disabled = S.page >= total;
  const limite = d.limitKey ? S.rel?.limites?.[d.limitKey] : null;
  $('relLimitNote').textContent = limite ? `Lista operacional limitada no banco a ${limite} registro(s). Total real quando aplicável: ${d.totalRef ?? 'ver KPIs/resumo'}.` : '';
}
function tabelaHtml(head, rows, colspan){
  return `<div class="table-wrap rel-table-wrap"><table><thead><tr>${head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${colspan || head.length}">Sem dados.</td></tr>`}</tbody></table></div>`;
}
function resumoTexto(){
  const k = S.rel?.kpis || {}, a = S.rel?.alertas || {}, lim = S.rel?.limites || {};
  return ['📊 FECHAMENTO OPERACIONAL - LIKE ESTOQUE','Gerado em: '+fmt(S.rel?.gerado_em || new Date()),'Período: '+((filtros().p_data_ini || 'início')+' até '+(filtros().p_data_fim || 'hoje')),'Técnico: '+(filtros().p_tecnico || 'Todos'),'Status: '+(filtros().p_status || 'Todos'),'','KPIs:','- Equipamentos ativos: '+(k.equipamentos_total ?? 0),'- Em estoque: '+(k.em_estoque ?? 0),'- Com técnico: '+(k.com_tecnico ?? 0),'- Manutenção: '+(k.manutencao ?? 0),'- Sem MAC/SN: '+(k.sem_mac_sn ?? 0),'- Materiais críticos: '+(k.materiais_criticos ?? 0),'- Movimentos no período: '+(k.movimentos_periodo ?? 0),`- Detalhes carregados: até ${lim.movimentos || LIMITES.p_mov_limit} movimentos, ${lim.materiais || LIMITES.p_mat_limit} materiais e ${lim.alertas || LIMITES.p_alert_limit} alertas.`,'','Alertas:','- Equipamentos sem MAC/SN: '+((a.equipamentos_sem_mac_sn || []).length),'- Materiais críticos: '+((a.materiais_criticos || []).length),'- Equipamentos em manutenção: '+((a.equipamentos_manutencao || []).length)].join('\n');
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
  a.href = url; a.download = `${safeFile(S.lastTitle)}_${hoje()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); msg('CSV baixado da tabela carregada.', 'ok');
}
function pdfLib(){ if(!window.jspdf?.jsPDF) throw new Error('Biblioteca jsPDF não carregou.'); return window.jspdf.jsPDF; }
function addText(doc, text, x, y, width=180, lh=5){ const lines = doc.splitTextToSize(String(text ?? '-'), width); for(const line of lines){ if(y > 276){ doc.addPage(); y = 18; } doc.text(line,x,y); y += lh; } return y; }
function section(doc, title, y){ if(y > 260){ doc.addPage(); y = 18; } doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text(title,14,y); y += 7; doc.setFont('helvetica','normal'); doc.setFontSize(8); return y; }
function pdfTable(doc, head, rows, y){
  doc.setFont('helvetica','bold'); y = addText(doc, head.join(' | '), 14, y, 180, 4); doc.setFont('helvetica','normal');
  rows.forEach(r => { y = addText(doc, r.join(' | '), 14, y, 180, 4); if(y > 276){ doc.addPage(); y = 18; } });
  return y + 4;
}
function buildRows(rel){
  const status=(rel.por_status||[]).map(x=>[x.status,x.total,br(x.valor)]);
  const tecnicos=(rel.por_tecnico||[]).map(x=>[x.tecnico,x.total,br(x.valor)]);
  const modelos=(rel.por_modelo||[]).map(x=>[x.tipo,x.marca,x.modelo,x.total,br(x.valor)]);
  const materiaisCriticos=(rel.materiais||[]).filter(m=>m.alerta&&m.alerta!=='OK').map(m=>[nomeItem(m),m.local||'-',m.tecnico||'-',qtd(m.quantidade),qtd(m.minimo),qtd(m.ideal),m.alerta]);
  const materiais=(rel.materiais||[]).map(m=>[nomeItem(m),m.local||'-',m.tecnico||'-',qtd(m.quantidade),qtd(m.minimo),qtd(m.ideal),m.alerta||'OK']);
  const movimentos=(rel.movimentos||[]).map(m=>[fmt(m.data),m.codigo||'-',m.tipo||'-',m.tecnico||'-',m.destino||'-',[m.cliente,m.os].filter(Boolean).join(' / ')||'-',m.status_final||'-']);
  const alertas=[];
  (rel.alertas?.equipamentos_sem_mac_sn||[]).forEach(x=>alertas.push(['Sem MAC/SN',x.codigo||'-',nomeItem(x),x.status||'-',x.local||'-']));
  (rel.alertas?.materiais_criticos||[]).forEach(x=>alertas.push(['Material crítico','-',nomeItem(x),`${qtd(x.quantidade)} ${x.unidade_saida||''}`,`${x.local||'-'} / ${x.tecnico||'-'}`]));
  (rel.alertas?.equipamentos_manutencao||[]).forEach(x=>alertas.push(['Manutenção',x.codigo||'-',nomeItem(x),x.motivo||'-',x.local||'-']));
  return {status,tecnicos,modelos,materiaisCriticos,materiais,movimentos,alertas};
}
function riscos(rel){ const k=rel.kpis||{}, a=rel.alertas||{}; return [['Rastreabilidade',Number(k.sem_mac_sn||0)>0?'Médio':'Baixo',`${k.sem_mac_sn||0} equipamento(s) sem MAC/SN.`],['Reposição de material',Number(k.materiais_criticos||0)>0?'Alto':'Baixo',`${k.materiais_criticos||0} material(is) crítico(s).`],['Manutenção',(a.equipamentos_manutencao||[]).length?'Médio':'Baixo',`${(a.equipamentos_manutencao||[]).length} equipamento(s) em manutenção.`],['Carga de técnicos',Number(k.com_tecnico||0)>0?'Médio':'Baixo',`${k.com_tecnico||0} patrimônio(s) com técnico.`]]; }
function recomendacoes(rel){ const k=rel.kpis||{}, a=rel.alertas||{}, r=[]; if(Number(k.materiais_criticos||0)>0) r.push('Comprar/repor materiais críticos antes de novas demandas de campo.'); if(Number(k.sem_mac_sn||0)>0) r.push('Regularizar equipamentos sem MAC/SN para preservar rastreabilidade.'); if((a.equipamentos_manutencao||[]).length) r.push('Definir destino dos equipamentos em manutenção: voltar ao estoque, manter em teste ou baixar.'); if(Number(k.com_tecnico||0)>0) r.push('Conferir carga por técnico e cruzar com OSs abertas/fechadas antes do fechamento mensal.'); if(!r.length) r.push('Sem ação crítica imediata. Manter conferência periódica.'); return r; }
async function gerarPdfGerencial(){
  try{
    msg('Gerando PDF gerencial limitado...', 'warn');
    const JsPDF = pdfLib();
    const rel = await carregarRelatorio();
    if(!rel?.kpis) throw new Error('RPC não retornou relatório válido.');
    const doc = new JsPDF({orientation:'portrait', unit:'mm', format:'a4'});
    const k = rel.kpis || {}, rows = buildRows(rel), lim = rel.limites || {};
    let y=18;
    doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text('LIKE Estoque',14,y); y+=9;
    doc.setFontSize(13); doc.text('Relatório gerencial de fechamento operacional',14,y); y+=8;
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    y=addText(doc,`Emitido em: ${fmt(rel.gerado_em || new Date())}`,14,y,180);
    y=addText(doc,`Período: ${filtros().p_data_ini || 'início'} até ${filtros().p_data_fim || 'hoje'} | Técnico: ${filtros().p_tecnico || 'Todos'} | Status: ${filtros().p_status || 'Todos'}`,14,y,180);
    y=addText(doc,`Limites: até ${lim.movimentos || LIMITES.p_mov_limit} movimentos, ${lim.materiais || LIMITES.p_mat_limit} materiais e ${lim.alertas || LIMITES.p_alert_limit} alertas. KPIs continuam calculados sobre a base/período completos.`,14,y,180);
    y=section(doc,'Parecer executivo',y);
    y=addText(doc,`Equipamentos ativos: ${k.equipamentos_total || 0}. Em estoque: ${k.em_estoque || 0}. Com técnico: ${k.com_tecnico || 0}. Valor ativo estimado: ${br(k.valor_total_ativo)}. Movimentos no período: ${k.movimentos_periodo || 0}.`,14,y,180);
    y=section(doc,'Riscos e recomendações',y); y=pdfTable(doc,['Risco','Nível','Evidência'],riscos(rel),y); recomendacoes(rel).forEach((r,i)=>{ y=addText(doc,`${i+1}. ${r}`,14,y,180); });
    y=section(doc,'Equipamentos por status',y); y=pdfTable(doc,['Status','Total','Valor'],rows.status,y);
    y=section(doc,'Patrimônio por técnico',y); y=pdfTable(doc,['Técnico','Total','Valor'],rows.tecnicos,y);
    y=section(doc,'Patrimônio por modelo',y); y=pdfTable(doc,['Tipo','Marca','Modelo','Total','Valor'],rows.modelos.slice(0,60),y);
    y=section(doc,'Materiais críticos',y); y=pdfTable(doc,['Material','Local','Técnico','Qtd','Mín.','Ideal','Alerta'],rows.materiaisCriticos.slice(0,80),y);
    y=section(doc,'Movimentações recentes do período',y); y=pdfTable(doc,['Data','Código','Tipo','Técnico','Destino','Cliente/OS','Status'],rows.movimentos.slice(0,100),y);
    doc.save(`relatorio_gerencial_${hoje()}.pdf`);
    msg('PDF gerencial baixado.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

inject();
window.relatoriosCleanLoad = load;
window.relatorioPdfGerencialReal = gerarPdfGerencial;
