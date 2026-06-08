import { table, call } from './api.js?v=3';

const S = { rel:null, tecnicos:[], status:[], page:1, pageSize:25, tab:'movimentos', lastRows:[], lastHead:[], lastTitle:'Relatório gerencial' };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const br = v => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const qtd = v => Number(v || 0).toLocaleString('pt-BR',{maximumFractionDigits:3});
const fmt = v => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return String(v || '-'); } };
const nomeItem = o => [o?.tipo,o?.marca,o?.modelo].filter(Boolean).join(' ') || '-';
const safeFile = v => String(v || 'relatorio').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'relatorio';
const hoje = () => new Date().toISOString().slice(0,10);

function msg(text,type=''){
  const el = $('relCleanMsg');
  if(el){ el.textContent = text; el.className = 'msg show ' + type; }
}
function css(){
  if($('relGerencialCss')) return;
  const s = document.createElement('style');
  s.id = 'relGerencialCss';
  s.textContent = `.rel-actions{display:flex;gap:8px;flex-wrap:wrap}.rel-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.rel-tab{border:1px solid #dbe4ef;background:#fff;border-radius:999px;padding:8px 12px;cursor:pointer}.rel-tab.active{background:#0f4c81;color:#fff;border-color:#0f4c81}.rel-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.rel-kpi{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:12px}.rel-kpi small{display:block;color:#64748b;font-weight:800}.rel-kpi b{font-size:22px}.rel-kpi.warn{border-color:#f59e0b}.rel-kpi.bad{border-color:#ef4444}.rel-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:12px}.rel-alert-list{display:grid;gap:8px}.rel-alert{border:1px solid #e5e7eb;background:#fff;border-radius:14px;padding:10px}.rel-alert b{display:block}.rel-alert small{color:#64748b}.rel-table-wrap table th,.rel-table-wrap table td{white-space:nowrap}.rel-page-info{color:#64748b;font-size:13px;margin:8px 0}@media(max-width:1100px){.rel-kpis{grid-template-columns:repeat(3,1fr)}.rel-grid{grid-template-columns:1fr}}@media(max-width:620px){.rel-kpis{grid-template-columns:1fr 1fr}.rel-actions button{width:100%}}`;
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
        <div class="table-head"><div><h2>Relatórios gerenciais</h2><p>Fechamento operacional com KPIs, alertas, estoque, técnicos, materiais e movimentações.</p></div><button id="relReload" class="secondary">Atualizar relatório</button></div>
        <div class="form-grid two"><input id="relIni" type="date" title="Data inicial"><input id="relFim" type="date" title="Data final"></div>
        <div class="form-grid two"><select id="relTecnico"><option value="">Todos os técnicos</option></select><select id="relStatus"><option value="">Todos os status</option></select></div>
        <div class="rel-actions"><button id="relFechar" class="primary">Gerar fechamento</button><button id="relCopiar" class="secondary">Copiar resumo WhatsApp</button><button id="relCsv" class="secondary">Baixar CSV da tabela</button><button id="relPrint" class="warn">Baixar PDF gerencial completo</button></div>
        <div id="relCleanMsg" class="msg show">Clique em gerar fechamento.</div>
      </div>
      <div class="rel-kpis" id="relKpis"></div>
      <div class="rel-grid">
        <div class="card"><h2>Distribuição</h2><div class="rel-tabs" id="relTabs"></div><div id="relResumoCards"></div></div>
        <div class="card"><h2>Alertas operacionais</h2><div id="relAlertas" class="rel-alert-list"></div></div>
      </div>
      <div class="card"><h2 id="relTitulo">Resultado</h2><div id="relPageInfo" class="rel-page-info">Página 1</div><div class="rel-actions"><button id="relPrev" class="secondary">Anterior</button><button id="relNext" class="secondary">Próxima</button></div><div id="relOut"></div></div>`;
    document.querySelector('.main').appendChild(sec);
  }
  $('relReload').onclick = load;
  $('relFechar').onclick = load;
  $('relCopiar').onclick = copiarResumo;
  $('relCsv').onclick = baixarCsv;
  $('relPrint').onclick = gerarPdfGerencial;
  $('relPrint').textContent = 'Baixar PDF gerencial completo';
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
function filtros(){ return { p_data_ini:$('relIni')?.value || null, p_data_fim:$('relFim')?.value || null, p_tecnico:$('relTecnico')?.value || null, p_status:$('relStatus')?.value || null }; }
async function load(){
  try{
    msg('Gerando fechamento operacional...', 'warn');
    await loadFiltros();
    S.rel = await call('rpc_relatorio_gerencial_5v', filtros());
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
  $('relTitulo').textContent = d.title;
  $('relPageInfo').textContent = `Página ${S.page} de ${total} • Registros ${d.rows.length ? start+1 : 0}-${Math.min(start+S.pageSize,d.rows.length)} de ${d.rows.length}`;
  $('relOut').innerHTML = tabelaHtml(d.head, rows, d.head.length);
  $('relPrev').disabled = S.page <= 1; $('relNext').disabled = S.page >= total;
}
function tabelaHtml(head, rows, colspan){
  return `<div class="table-wrap rel-table-wrap"><table><thead><tr>${head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${colspan || head.length}">Sem dados.</td></tr>`}</tbody></table></div>`;
}
function resumoTexto(){
  const k = S.rel?.kpis || {}, a = S.rel?.alertas || {};
  return ['📊 FECHAMENTO OPERACIONAL - LIKE ESTOQUE','Gerado em: '+fmt(S.rel?.gerado_em || new Date()),'Período: '+((filtros().p_data_ini || 'início')+' até '+(filtros().p_data_fim || 'hoje')),'Técnico: '+(filtros().p_tecnico || 'Todos'),'Status: '+(filtros().p_status || 'Todos'),'','KPIs:','- Equipamentos ativos: '+(k.equipamentos_total ?? 0),'- Em estoque: '+(k.em_estoque ?? 0),'- Com técnico: '+(k.com_tecnico ?? 0),'- Manutenção: '+(k.manutencao ?? 0),'- Sem MAC/SN: '+(k.sem_mac_sn ?? 0),'- Materiais críticos: '+(k.materiais_criticos ?? 0),'- Movimentos no período: '+(k.movimentos_periodo ?? 0),'','Alertas:','- Equipamentos sem MAC/SN: '+((a.equipamentos_sem_mac_sn || []).length),'- Materiais críticos: '+((a.materiais_criticos || []).length),'- Equipamentos em manutenção: '+((a.equipamentos_manutencao || []).length)].join('\n');
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
  a.href = url; a.download = `${safeFile(S.lastTitle)}_${hoje()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); msg('CSV baixado.', 'ok');
}

function pdfLib(){ if(!window.jspdf?.jsPDF) throw new Error('Biblioteca jsPDF não carregou.'); return window.jspdf.jsPDF; }
function addHeader(doc, title){ doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.text('LIKE Estoque', 14, 12); doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.text(title, 14, 17); doc.setDrawColor(210); doc.line(14,20,196,20); }
function addFooter(doc){ const n = doc.internal.getCurrentPageInfo().pageNumber; doc.setFontSize(8); doc.setTextColor(120); doc.text('LIKE Estoque • Relatório gerencial • Documento interno',14,287); doc.text(`Página ${n}`,180,287); doc.setTextColor(0); }
function newPage(doc, title){ addFooter(doc); doc.addPage(); addHeader(doc,title); return 28; }
function addText(doc, text, x, y, width=180, lh=5){ const lines = doc.splitTextToSize(String(text ?? '-'), width); for(const line of lines){ if(y > 276) y = newPage(doc,'Continuação'); doc.text(line,x,y); y += lh; } return y; }
function section(doc, title, y){ if(y > 260) y = newPage(doc,title); doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text(title,14,y); y += 6; doc.setDrawColor(225); doc.line(14,y,196,y); y += 6; doc.setFont('helvetica','normal'); doc.setFontSize(8.5); return y; }
function kpiBox(doc, label, value, x, y){ doc.setDrawColor(200); doc.roundedRect(x,y,42,18,2,2); doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(90); doc.text(String(label),x+3,y+6); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(0); doc.text(String(value),x+3,y+14); }
function addKpis(doc,k,y){ const arr=[['Equip. ativos',k.equipamentos_total??0],['Em estoque',k.em_estoque??0],['Com técnico',k.com_tecnico??0],['Manutenção',k.manutencao??0],['Sem MAC/SN',k.sem_mac_sn??0],['Mat. críticos',k.materiais_criticos??0],['Valor ativo',br(k.valor_total_ativo)],['Movimentos',k.movimentos_periodo??0],['Lotes saída',k.lotes_saida_periodo??0],['Modelos',k.modelos_ativos??0],['Técnicos',k.tecnicos_ativos??0],['Baixados',k.baixados_inativos??0]]; let x=14; arr.forEach((it,i)=>{ kpiBox(doc,it[0],it[1],x,y); x+=46; if((i+1)%4===0){ x=14; y+=22; } }); return y+4; }
function pdfTable(doc, head, rows, y, widths){ const startX=14; const printHead=()=>{ doc.setFont('helvetica','bold'); doc.setFontSize(7); let x=startX; head.forEach((h,i)=>{ doc.text(String(h),x+1,y); x+=widths[i]; }); y+=3; doc.setDrawColor(210); doc.line(startX,y,196,y); y+=4; doc.setFont('helvetica','normal'); doc.setFontSize(7); }; printHead(); rows.forEach(r=>{ if(y>275){ y=newPage(doc,'Continuação'); printHead(); } let x=startX, max=1; const cells=r.map((c,i)=>{ const lines=doc.splitTextToSize(String(c??'-'), Math.max(10,widths[i]-2)); max=Math.max(max,lines.length); return lines; }); const h=Math.max(6,max*3.5+2); cells.forEach((lines,i)=>{ doc.text(lines.slice(0,4),x+1,y); x+=widths[i]; }); y+=h; doc.setDrawColor(238); doc.line(startX,y-2,196,y-2); }); return y+3; }
function buildRows(rel){ const status=(rel.por_status||[]).map(x=>[x.status,x.total,br(x.valor)]); const tecnicos=(rel.por_tecnico||[]).map(x=>[x.tecnico,x.total,br(x.valor)]); const modelos=(rel.por_modelo||[]).map(x=>[x.tipo,x.marca,x.modelo,x.total,br(x.valor)]); const materiaisCriticos=(rel.materiais||[]).filter(m=>m.alerta&&m.alerta!=='OK').map(m=>[nomeItem(m),m.local||'-',m.tecnico||'-',qtd(m.quantidade),qtd(m.minimo),qtd(m.ideal),m.alerta]); const materiais=(rel.materiais||[]).map(m=>[nomeItem(m),m.local||'-',m.tecnico||'-',qtd(m.quantidade),qtd(m.minimo),qtd(m.ideal),m.alerta||'OK']); const movimentos=(rel.movimentos||[]).map(m=>[fmt(m.data),m.codigo||'-',m.tipo||'-',m.tecnico||'-',m.destino||'-',[m.cliente,m.os].filter(Boolean).join(' / ')||'-',m.status_final||'-']); const alertas=[]; (rel.alertas?.equipamentos_sem_mac_sn||[]).forEach(x=>alertas.push(['Sem MAC/SN',x.codigo||'-',nomeItem(x),x.status||'-',x.local||'-'])); (rel.alertas?.materiais_criticos||[]).forEach(x=>alertas.push(['Material crítico','-',nomeItem(x),`${qtd(x.quantidade)} ${x.unidade_saida||''}`,`${x.local||'-'} / ${x.tecnico||'-'}`])); (rel.alertas?.equipamentos_manutencao||[]).forEach(x=>alertas.push(['Manutenção',x.codigo||'-',nomeItem(x),x.motivo||'-',x.local||'-'])); return {status,tecnicos,modelos,materiaisCriticos,materiais,movimentos,alertas}; }
function riscos(rel){ const k=rel.kpis||{}, a=rel.alertas||{}; return [['Rastreabilidade',Number(k.sem_mac_sn||0)>0?'Médio':'Baixo',`${k.sem_mac_sn||0} equipamento(s) sem MAC/SN.`],['Reposição de material',Number(k.materiais_criticos||0)>0?'Alto':'Baixo',`${k.materiais_criticos||0} material(is) crítico(s).`],['Manutenção',(a.equipamentos_manutencao||[]).length?'Médio':'Baixo',`${(a.equipamentos_manutencao||[]).length} equipamento(s) em manutenção.`],['Carga de técnicos',Number(k.com_tecnico||0)>0?'Médio':'Baixo',`${k.com_tecnico||0} patrimônio(s) com técnico.`]]; }
function recomendacoes(rel){ const k=rel.kpis||{}, a=rel.alertas||{}, r=[]; if(Number(k.materiais_criticos||0)>0) r.push('Comprar/repor materiais críticos antes de novas demandas de campo. Prioridade para itens abaixo do mínimo.'); if(Number(k.sem_mac_sn||0)>0) r.push('Regularizar equipamentos sem MAC/SN para evitar perda de rastreabilidade patrimonial.'); if((a.equipamentos_manutencao||[]).length) r.push('Definir destino dos equipamentos em manutenção: voltar ao estoque, manter em teste ou baixar.'); if(Number(k.com_tecnico||0)>0) r.push('Conferir carga por técnico e cruzar com OSs abertas/fechadas antes do fechamento mensal.'); if(!r.length) r.push('Sem ação crítica imediata. Manter conferência periódica e assinatura do fechamento.'); return r; }
async function gerarPdfGerencial(){
  try{
    msg('Gerando PDF gerencial real...', 'warn');
    const JsPDF = pdfLib();
    const rel = await call('rpc_relatorio_gerencial_5v', filtros());
    if(!rel?.kpis) throw new Error('RPC não retornou relatório válido.');
    const doc = new JsPDF({orientation:'portrait', unit:'mm', format:'a4'});
    const k = rel.kpis || {}, rows = buildRows(rel);
    let y=24;
    doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.text('LIKE Estoque',14,y); y+=9;
    doc.setFontSize(15); doc.text('Relatório gerencial de fechamento operacional',14,y); y+=8;
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    y=addText(doc,`Emitido em: ${fmt(rel.gerado_em || new Date())}`,14,y,180);
    y=addText(doc,`Período: ${filtros().p_data_ini || 'início'} até ${filtros().p_data_fim || 'hoje'} | Técnico: ${filtros().p_tecnico || 'Todos'} | Status: ${filtros().p_status || 'Todos'}`,14,y,180);
    y+=6; doc.setDrawColor(0); doc.line(14,y,196,y); y+=8;
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('Parecer executivo',14,y); y+=7;
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    y=addText(doc,`O estoque possui ${k.equipamentos_total || 0} equipamento(s) ativo(s), sendo ${k.em_estoque || 0} em estoque e ${k.com_tecnico || 0} com técnico. O valor patrimonial ativo estimado é ${br(k.valor_total_ativo)}. Foram identificados ${k.materiais_criticos || 0} material(is) em alerta, ${k.sem_mac_sn || 0} equipamento(s) sem MAC/SN e ${k.movimentos_periodo || 0} movimentação(ões) no período.`,14,y,180);
    y+=4; y=addKpis(doc,k,y); addFooter(doc);

    y=newPage(doc,'Riscos, alertas e recomendações');
    y=section(doc,'1. Matriz de risco operacional',y); y=pdfTable(doc,['Risco','Nível','Evidência'],riscos(rel),y,[42,28,112]);
    y=section(doc,'2. Alertas prioritários',y); y=pdfTable(doc,['Alerta','Código','Item','Status/Qtd/Motivo','Local/Técnico'],rows.alertas.slice(0,80),y,[32,26,54,38,32]);
    y=section(doc,'3. Plano de ação recomendado',y); recomendacoes(rel).forEach((r,i)=>{ y=addText(doc,`${i+1}. ${r}`,16,y,174); y+=2; });

    y=newPage(doc,'Distribuição patrimonial');
    y=section(doc,'4. Equipamentos por status',y); y=pdfTable(doc,['Status','Total','Valor'],rows.status,y,[86,34,62]);
    y=section(doc,'5. Patrimônio por técnico',y); y=pdfTable(doc,['Técnico','Total','Valor'],rows.tecnicos,y,[86,34,62]);

    y=newPage(doc,'Patrimônio por modelo');
    y=section(doc,'6. Patrimônio por modelo',y); y=pdfTable(doc,['Tipo','Marca','Modelo','Total','Valor'],rows.modelos.slice(0,60),y,[32,38,58,22,32]);

    y=newPage(doc,'Materiais');
    y=section(doc,'7. Materiais críticos',y); y=pdfTable(doc,['Material','Local','Técnico','Qtd','Mín.','Ideal','Alerta'],rows.materiaisCriticos.slice(0,80),y,[52,27,27,18,16,16,26]);
    y=section(doc,'8. Saldos de materiais',y); y=pdfTable(doc,['Material','Local','Técnico','Qtd','Mín.','Ideal','Alerta'],rows.materiais.slice(0,120),y,[52,27,27,18,16,16,26]);

    y=newPage(doc,'Movimentações');
    y=section(doc,'9. Movimentações do período',y); y=addText(doc,'A lista abaixo é limitada aos últimos 100 registros retornados pelo fechamento para manter o documento legível.',14,y,180); y+=2;
    y=pdfTable(doc,['Data','Código','Tipo','Técnico','Destino','Cliente/OS','Status'],rows.movimentos.slice(0,100),y,[32,22,26,26,26,32,18]);

    y=newPage(doc,'Conferência e assinatura');
    y=section(doc,'10. Checklist de conferência',y); ['KPIs revisados','Alertas verificados','Materiais críticos encaminhados','Carga por técnico conferida','Movimentações do período revisadas','Divergências registradas para correção'].forEach(item=>{ doc.text('[ ] '+item,18,y); y+=8; });
    y+=18; doc.line(24,y,92,y); doc.line(118,y,186,y); y+=5; doc.setFontSize(9); doc.text('Responsável pelo estoque',35,y); doc.text('Gestor / Conferência',133,y); addFooter(doc);
    doc.save(`relatorio_gerencial_completo_${hoje()}.pdf`);
    msg('PDF gerencial completo baixado.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

inject();
window.relatoriosCleanLoad = load;
window.relatorioPdfGerencialReal = gerarPdfGerencial;
