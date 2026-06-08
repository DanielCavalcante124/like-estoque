import { call } from './api.js?v=3';

const S = { health:null };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const num = v => Number(v || 0).toLocaleString('pt-BR');
const dt = v => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return String(v || '-'); } };

function msg(text,type=''){
  const el = $('prodMsg');
  if(el){ el.textContent = text; el.className = 'msg show ' + type; }
}
function css(){
  if($('prodCss')) return;
  const s = document.createElement('style');
  s.id = 'prodCss';
  s.textContent = `.prod-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.prod-kpi{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:12px}.prod-kpi small{display:block;color:#64748b;font-weight:800}.prod-kpi b{font-size:21px}.prod-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.prod-actions{display:flex;gap:8px;flex-wrap:wrap}.prod-box{border:1px solid #e5e7eb;border-radius:14px;padding:10px;margin-bottom:8px;background:#fff}.prod-box b{display:block}.prod-box small{color:#64748b}.prod-ok{border-color:#16a34a;background:#f0fdf4}.prod-warn{border-color:#eab308;background:#fffbeb}.prod-bad{border-color:#dc2626;background:#fff7f7}.prod-status{border-width:2px}@media(max-width:1000px){.prod-kpis{grid-template-columns:repeat(3,1fr)}.prod-grid{grid-template-columns:1fr}}@media(max-width:650px){.prod-kpis{grid-template-columns:repeat(2,1fr)}.prod-actions button{width:100%}}`;
  document.head.appendChild(s);
}
function inject(){
  css();
  if(!$('navProducaoClean')){
    const ref = $('navAnaliseOperacionalClean') || $('navImpactoFechamentoClean') || $('navFechamentoClean') || document.querySelector('[data-page="cadastros"]');
    const b = document.createElement('button');
    b.id = 'navProducaoClean';
    b.className = 'nav';
    b.textContent = 'Produção';
    b.onclick = show;
    ref ? ref.insertAdjacentElement('afterend', b) : document.querySelector('.sidebar').appendChild(b);
  }
  if(!$('page-producao-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-producao-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div><h2>Hardening de produção</h2><p>Healthcheck técnico de segurança, RLS, RPCs anônimas, auditoria, período e contagens do sistema.</p></div>
          <button id="prodReload" class="secondary">Executar healthcheck</button>
        </div>
        <div class="prod-actions"><button id="prodPdf" class="secondary">Baixar PDF técnico</button><button id="prodWhats" class="secondary">Copiar resumo WhatsApp</button></div>
        <div id="prodMsg" class="msg show">Execute o healthcheck para validar produção.</div>
      </div>
      <div id="prodStatus"></div>
      <div id="prodKpis" class="prod-kpis"></div>
      <div class="prod-grid">
        <div class="card"><h2>Segurança</h2><div id="prodSeguranca"></div></div>
        <div class="card"><h2>Auditoria e período</h2><div id="prodAuditoria"></div></div>
      </div>
      <div class="card"><h2>Checklist operacional de produção</h2><div id="prodChecklist"></div></div>`;
    document.querySelector('.main').appendChild(sec);
  }
  $('prodReload').onclick = load;
  $('prodPdf').onclick = () => S.health ? gerarPdf(S.health) : msg('Execute o healthcheck antes do PDF.', 'warn');
  $('prodWhats').onclick = copiarWhats;
}
function show(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navProducaoClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-producao-clean'));
  if($('pageTitle')) $('pageTitle').textContent = 'Produção';
}
async function load(){
  try{
    msg('Executando healthcheck de produção...', 'warn');
    const health = await call('rpc_healthcheck_producao_6a', {});
    S.health = health;
    render(health);
    msg(health.ok ? 'Healthcheck aprovado.' : 'Healthcheck encontrou pendências.', health.ok ? 'ok' : 'bad');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function kpi(label,value){ return `<div class="prod-kpi"><small>${esc(label)}</small><b>${esc(value)}</b></div>`; }
function box(title,body,small='',cls=''){
  return `<div class="prod-box ${cls}"><b>${esc(title)}</b><small>${esc(body || '')}${small ? '<br>'+esc(small) : ''}</small></div>`;
}
function render(h){
  const c = h.contagens || {};
  const aud = h.auditoria_resumo || {};
  const periodo = h.periodo_atual || {};
  const tabelasSemRls = h.tabelas_sem_rls || [];
  const rpcAnon = h.rpc_executaveis_por_anon || [];
  $('prodStatus').innerHTML = `<div class="card prod-status ${h.ok ? 'prod-ok' : 'prod-bad'}"><div class="table-head"><div><h2>Status de produção</h2><p>${esc(h.recomendacao || '-')}</p></div><span class="badge">${h.ok ? 'Aprovado' : 'Pendência'}</span></div>${box('Gerado em', dt(h.gerado_em), 'Healthcheck não altera dados.')}</div>`;
  $('prodKpis').innerHTML = [
    kpi('Equipamentos', num(c.equipamentos)),
    kpi('Movimentos', num(c.movimentos)),
    kpi('Mat. movimentos', num(c.materiais_movimentos)),
    kpi('Fechamentos', num(c.fechamentos)),
    kpi('Usuários perfil', num(c.usuarios_perfil))
  ].join('');
  $('prodSeguranca').innerHTML = `
    ${box('RLS', tabelasSemRls.length ? `${num(tabelasSemRls.length)} tabela(s) sem RLS` : 'Todas as tabelas auditadas com RLS ativo', tabelasSemRls.join(', ') || 'Sem pendências automáticas.', tabelasSemRls.length ? 'prod-bad' : 'prod-ok')}
    ${box('RPCs anônimas', rpcAnon.length ? `${num(rpcAnon.length)} RPC(s) exposta(s)` : 'Nenhuma RPC executável por anon', rpcAnon.map(x => x.funcao).join(', ') || 'Superfície anônima zerada.', rpcAnon.length ? 'prod-bad' : 'prod-ok')}
    ${box('Cores internas', 'Execução direta bloqueada por hardening 6A', 'Fluxo externo deve passar pelos wrappers RPC públicos autenticados.', 'prod-ok')}`;
  $('prodAuditoria').innerHTML = `
    ${box('Auditoria operacional', `${num(aud.total)} divergência(s)`, `Críticas ${num(aud.criticas)} • Altas ${num(aud.altas)} • Médias ${num(aud.medias)} • Baixas ${num(aud.baixas)}`, Number(aud.total || 0) ? 'prod-bad' : 'prod-ok')}
    ${box('Período atual', periodo.bloqueado_por_sobreposicao ? 'Bloqueado por fechamento' : 'Livre no momento', `${periodo.periodo_inicio || '-'} até ${periodo.periodo_fim || '-'}`, periodo.bloqueado_por_sobreposicao ? 'prod-warn' : 'prod-ok')}`;
  $('prodChecklist').innerHTML = [
    box('1. Backup Supabase', 'Executar export/backup antes de uso contínuo', 'Não é automatizado por esta tela.', 'prod-warn'),
    box('2. Usuários e perfis', `${num(c.usuarios_perfil)} perfil(is) cadastrado(s)`, 'Validar se cada usuário tem perfil correto.'),
    box('3. GitHub Pages', 'Usar URL com cache bust após deploy', '/index-clean.html?v=6a-producao'),
    box('4. Dependências externas', 'Supabase JS e jsPDF carregam via CDN', 'Se quiser reduzir risco, hospedar cópias locais futuramente.', 'prod-warn'),
    box('5. Auditoria diária', 'Executar Produção + Análise operacional no início/fim do expediente', 'Mantém divergência visível antes de virar problema.')
  ].join('');
}
function resumoWhats(h){
  const c = h.contagens || {}, aud = h.auditoria_resumo || {}, rpcAnon = h.rpc_executaveis_por_anon || [], semRls = h.tabelas_sem_rls || [];
  return [`🛡️ HEALTHCHECK PRODUÇÃO - LIKE ESTOQUE`, `Status: ${h.ok ? 'Aprovado' : 'Pendência'}`, `Gerado em: ${dt(h.gerado_em)}`, '', `Equipamentos: ${c.equipamentos || 0}`, `Movimentos: ${c.movimentos || 0}`, `Fechamentos: ${c.fechamentos || 0}`, `Auditoria: ${aud.total || 0} divergência(s)`, `Tabelas sem RLS: ${semRls.length}`, `RPCs anon: ${rpcAnon.length}`, '', `Recomendação: ${h.recomendacao || '-'}`].join('\n');
}
async function copiarWhats(){
  if(!S.health) return msg('Execute o healthcheck antes de copiar.', 'warn');
  try{ await navigator.clipboard.writeText(resumoWhats(S.health)); msg('Resumo copiado para WhatsApp.', 'ok'); }
  catch(e){ window.prompt('Copie o resumo:', resumoWhats(S.health)); }
}
function pdfText(doc,text,x,y,w=180,lh=5){ const lines = doc.splitTextToSize(String(text ?? '-'),w); lines.forEach(line => { if(y>280){ doc.addPage(); y=16; } doc.text(line,x,y); y+=lh; }); return y; }
function footer(doc){ const p = doc.internal.getCurrentPageInfo().pageNumber; doc.setFontSize(8); doc.setTextColor(110); doc.text('LIKE Estoque • Hardening de produção 6A • Documento interno',14,287); doc.text(`Página ${p}`,180,287); doc.setTextColor(0); }
function gerarPdf(h){
  if(!window.jspdf?.jsPDF) return msg('jsPDF não carregou.', 'bad');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:'portrait', unit:'mm', format:'a4'});
  const c = h.contagens || {}, aud = h.auditoria_resumo || {}, periodo = h.periodo_atual || {};
  let y = 18;
  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text('LIKE Estoque',14,y); y+=9;
  doc.setFontSize(14); doc.text('Healthcheck de produção 6A',14,y); y+=8;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  y = pdfText(doc, `Status: ${h.ok ? 'Aprovado' : 'Pendência'} | Gerado em: ${dt(h.gerado_em)}`,14,y);
  y = pdfText(doc, `Recomendação: ${h.recomendacao || '-'}`,14,y,180);
  y+=4; doc.setDrawColor(0); doc.line(14,y,196,y); y+=8;
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.text('1. Indicadores técnicos',14,y); y+=7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  [['Equipamentos',c.equipamentos],['Movimentos',c.movimentos],['Movimentos de materiais',c.materiais_movimentos],['Fechamentos',c.fechamentos],['Usuários/perfis',c.usuarios_perfil],['Auditoria total',aud.total],['RPCs anon',(h.rpc_executaveis_por_anon||[]).length],['Tabelas sem RLS',(h.tabelas_sem_rls||[]).length]].forEach(row => { y = pdfText(doc, `${row[0]}: ${row[1] ?? 0}`,14,y); });
  y+=4;
  y = pdfText(doc, `Período atual: ${periodo.periodo_inicio || '-'} até ${periodo.periodo_fim || '-'} | Bloqueado: ${periodo.bloqueado_por_sobreposicao ? 'Sim' : 'Não'}`,14,y,180);
  y+=10; doc.setDrawColor(120); doc.line(24,y,92,y); doc.line(118,y,186,y); y+=5;
  doc.setFontSize(9); doc.text('Responsável técnico',39,y); doc.text('Gestor / Conferência',137,y);
  footer(doc);
  doc.save('healthcheck_producao_6a.pdf');
}

inject();
window.producaoHealthcheckLoad = load;
