import { call } from './api.js?v=3';

const S = { admin:false, contexto:null, plano:null, exportacao:null, historico:[] };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const num = v => Number(v || 0).toLocaleString('pt-BR');
const dt = v => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return String(v || '-'); } };
const hoje = () => new Date().toISOString().slice(0,10);
const primeiroDiaMes = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10); };

function msg(text,type=''){
  const el = $('bkpMsg');
  if(el){ el.textContent = text; el.className = 'msg show ' + type; }
}
function css(){
  if($('bkpCss')) return;
  const s = document.createElement('style');
  s.id = 'bkpCss';
  s.textContent = `.bkp-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.bkp-kpi{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:12px}.bkp-kpi small{display:block;color:#64748b;font-weight:800}.bkp-kpi b{font-size:21px}.bkp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.bkp-actions{display:flex;gap:8px;flex-wrap:wrap}.bkp-box{border:1px solid #e5e7eb;border-radius:14px;padding:10px;margin-bottom:8px;background:#fff}.bkp-box b{display:block}.bkp-box small{color:#64748b}.bkp-ok{border-color:#16a34a;background:#f0fdf4}.bkp-warn{border-color:#eab308;background:#fffbeb}.bkp-bad{border-color:#dc2626;background:#fff7f7}.bkp-code{font-family:ui-monospace,monospace;font-size:12px;word-break:break-all}@media(max-width:1000px){.bkp-kpis{grid-template-columns:repeat(3,1fr)}.bkp-grid{grid-template-columns:1fr}}@media(max-width:650px){.bkp-kpis{grid-template-columns:repeat(2,1fr)}.bkp-actions button{width:100%}}`;
  document.head.appendChild(s);
}
function removeAdminUi(){
  const nav = $('navBackupClean');
  const page = $('page-backup-clean');
  const active = nav?.classList.contains('active') || page?.classList.contains('active');
  if(nav) nav.remove();
  if(page) page.remove();
  if(active) document.querySelector('[data-page="dashboard"]')?.click();
}
async function ensureAdmin(){
  try{
    const ctx = await call('rpc_usuario_contexto_6a1', {});
    S.contexto = ctx;
    S.admin = !!ctx?.is_admin;
    if(S.admin) inject(); else removeAdminUi();
    return S.admin;
  }catch(e){ S.admin=false; removeAdminUi(); return false; }
}
function inject(){
  css();
  if(!$('navBackupClean')){
    const ref = $('navProducaoClean') || $('navAnaliseOperacionalClean') || $('navImpactoFechamentoClean') || document.querySelector('[data-page="cadastros"]');
    const b = document.createElement('button');
    b.id = 'navBackupClean';
    b.className = 'nav';
    b.textContent = 'Backup';
    b.onclick = show;
    ref ? ref.insertAdjacentElement('afterend', b) : document.querySelector('.sidebar')?.appendChild(b);
  }
  if(!$('page-backup-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-backup-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head"><div><h2>Backup e contingência</h2><p>Painel interno de administrador para exportação operacional JSON, registro, histórico e plano de recuperação.</p></div><button id="bkpReload" class="secondary">Recarregar histórico</button></div>
        <div class="form-grid two"><input id="bkpIni" type="date"><input id="bkpFim" type="date"></div>
        <div class="form-grid two"><input id="bkpResponsavel" placeholder="Responsável pelo backup"><input id="bkpObs" placeholder="Observação / local onde foi salvo"></div>
        <div class="bkp-actions"><button id="bkpGerar" class="primary">Gerar e baixar JSON</button><button id="bkpRegistrar" class="warn">Registrar backup executado</button><button id="bkpPlano" class="secondary">Carregar plano</button><button id="bkpPdf" class="secondary">Baixar PDF plano</button><button id="bkpWhats" class="secondary">Copiar WhatsApp</button></div>
        <div id="bkpMsg" class="msg show">Backup operacional deve ser salvo fora do Supabase. Esta tela não substitui backup completo oficial.</div>
      </div>
      <div id="bkpKpis" class="bkp-kpis"></div>
      <div class="bkp-grid"><div class="card"><h2>Último backup gerado</h2><div id="bkpUltimo"></div></div><div class="card"><h2>Plano de contingência</h2><div id="bkpPlanoBox"></div></div></div>
      <div class="card"><h2>Histórico de backups registrados</h2><div class="table-wrap"><table><thead><tr><th>Data</th><th>Arquivo</th><th>Período</th><th>Responsável</th><th>Hash</th></tr></thead><tbody id="bkpHistorico"></tbody></table></div></div>`;
    document.querySelector('.main')?.appendChild(sec);
  }
  $('bkpReload').onclick = loadHistorico;
  $('bkpGerar').onclick = gerarBackup;
  $('bkpRegistrar').onclick = registrarBackup;
  $('bkpPlano').onclick = loadPlano;
  $('bkpPdf').onclick = () => S.plano || S.exportacao ? gerarPdf() : msg('Carregue o plano ou gere um backup antes do PDF.', 'warn');
  $('bkpWhats').onclick = copiarWhats;
}
async function show(){
  const ok = S.admin || await ensureAdmin();
  if(!ok){ alert('Acesso restrito ao administrador.'); return; }
  inject(); prepararDatas();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navBackupClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-backup-clean'));
  if($('pageTitle')) $('pageTitle').textContent = 'Backup';
  loadHistorico().catch(e=>msg(e.message || String(e),'bad'));
}
function prepararDatas(){
  if(!$('bkpIni').value) $('bkpIni').value = primeiroDiaMes();
  if(!$('bkpFim').value) $('bkpFim').value = hoje();
}
function validarPeriodo(){
  const ini = $('bkpIni').value;
  const fim = $('bkpFim').value;
  if(!ini || !fim) throw new Error('Informe data inicial e final.');
  if(fim < ini) throw new Error('Data final não pode ser menor que a inicial.');
  return {ini,fim};
}
async function sha256(text){
  if(!crypto?.subtle) return 'sha256_indisponivel';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function baixarArquivo(nome, texto, mime='application/json'){
  const blob = new Blob([texto], { type:mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
async function gerarBackup(){
  try{
    const ok = S.admin || await ensureAdmin();
    if(!ok) throw new Error('Acesso restrito ao administrador.');
    const p = validarPeriodo();
    msg('Gerando backup operacional JSON...', 'warn');
    const res = await call('rpc_export_backup_operacional_6b', { p_periodo_inicio:p.ini, p_periodo_fim:p.fim });
    const payload = res.payload || res;
    const texto = JSON.stringify(payload, null, 2);
    const nome = res.arquivo_sugerido || `like_estoque_backup_operacional_${Date.now()}.json`;
    const hash = await sha256(texto);
    const size = new Blob([texto]).size;
    baixarArquivo(nome, texto);
    S.exportacao = { res, payload, texto, nome, hash, size, periodo:p };
    renderUltimo();
    msg('Backup JSON gerado e baixado. Salve fora do Supabase e registre a execução.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
async function registrarBackup(){
  try{
    const ok = S.admin || await ensureAdmin();
    if(!ok) throw new Error('Acesso restrito ao administrador.');
    if(!S.exportacao) throw new Error('Gere e baixe o JSON antes de registrar.');
    const responsavel = ($('bkpResponsavel').value || '').trim();
    const obs = ($('bkpObs').value || '').trim();
    if(responsavel.length < 3) throw new Error('Informe o responsável pelo backup.');
    if(!confirm('Confirmar registro do backup executado? O arquivo precisa estar salvo fora do Supabase.')) return;
    const p = S.exportacao.periodo;
    const res = await call('rpc_registrar_backup_operacional_6b', {
      p_tipo:'operacional_json',
      p_periodo_inicio:p.ini,
      p_periodo_fim:p.fim,
      p_descricao:'Backup operacional JSON gerado pela tela 6B',
      p_arquivo_nome:S.exportacao.nome,
      p_hash_texto:S.exportacao.hash,
      p_tamanho_estimado_bytes:S.exportacao.size,
      p_responsavel:responsavel,
      p_observacao:obs || null
    });
    await loadHistorico();
    msg('Backup registrado no histórico operacional.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
async function loadHistorico(){
  const ok = S.admin || await ensureAdmin();
  if(!ok) return;
  const res = await call('rpc_listar_backups_operacionais_6b', { p_limite:30 });
  S.historico = res.backups || [];
  renderHistorico();
}
async function loadPlano(){
  try{
    const ok = S.admin || await ensureAdmin();
    if(!ok) throw new Error('Acesso restrito ao administrador.');
    const plano = await call('rpc_plano_contingencia_6b', {});
    S.plano = plano;
    renderPlano();
    msg('Plano de contingência carregado.', 'ok');
  }catch(e){ msg(e.message || String(e), 'bad'); }
}
function kpi(label,value){ return `<div class="bkp-kpi"><small>${esc(label)}</small><b>${esc(value)}</b></div>`; }
function box(title,body,small='',cls=''){
  return `<div class="bkp-box ${cls}"><b>${esc(title)}</b><small>${esc(body || '')}${small ? '<br>'+esc(small) : ''}</small></div>`;
}
function renderUltimo(){
  const e = S.exportacao;
  const c = e?.payload?.contagens || {};
  $('bkpKpis').innerHTML = [
    kpi('Equipamentos', num(c.equipamentos)),
    kpi('Movimentos', num(c.movimentos_periodo)),
    kpi('Mat. mov.', num(c.materiais_movimentos_periodo)),
    kpi('Fechamentos', num(c.fechamentos)),
    kpi('Tamanho', `${num(e.size)} bytes`)
  ].join('');
  $('bkpUltimo').innerHTML = `
    ${box('Arquivo', e.nome, 'Salve fora do Supabase.', 'bkp-ok')}
    ${box('Hash SHA-256', e.hash, 'Use para conferir integridade do arquivo.', 'bkp-warn')}
    ${box('Período', `${e.periodo.ini} até ${e.periodo.fim}`, `Tamanho: ${num(e.size)} bytes`)}`;
}
function renderPlano(){
  const p = S.plano;
  if(!p){ $('bkpPlanoBox').innerHTML = '<div class="msg show warn">Plano ainda não carregado.</div>'; return; }
  $('bkpPlanoBox').innerHTML = `
    ${box('Objetivo', p.objetivo || '-')}
    ${box('RTO / RPO sugeridos', `RTO: ${p.rto_rpo_sugeridos?.rto || '-'}`, `RPO: ${p.rto_rpo_sugeridos?.rpo || '-'}`, 'bkp-warn')}
    ${(p.politica_backup || []).map(x=>box(x.item, x.frequencia, `${x.responsavel} • ${x.armazenamento}`)).join('')}`;
}
function renderHistorico(){
  $('bkpHistorico').innerHTML = S.historico.map(b => `<tr><td>${esc(dt(b.created_at))}</td><td><b>${esc(b.arquivo_nome || '-')}</b></td><td>${esc(b.periodo_inicio || '-')} até ${esc(b.periodo_fim || '-')}</td><td>${esc(b.responsavel || '-')}</td><td><span class="bkp-code">${esc((b.hash_texto || '-').slice(0,22))}</span></td></tr>`).join('') || '<tr><td colspan="5">Nenhum backup registrado.</td></tr>';
}
function resumoWhats(){
  const e = S.exportacao;
  const p = S.plano;
  if(e){
    const c = e.payload?.contagens || {};
    return [`💾 BACKUP OPERACIONAL - LIKE ESTOQUE`, `Arquivo: ${e.nome}`, `Período: ${e.periodo.ini} até ${e.periodo.fim}`, `Tamanho: ${e.size} bytes`, `SHA-256: ${e.hash}`, '', `Equipamentos: ${c.equipamentos || 0}`, `Movimentos período: ${c.movimentos_periodo || 0}`, `Materiais movimentos: ${c.materiais_movimentos_periodo || 0}`, `Fechamentos: ${c.fechamentos || 0}`, '', 'Salvar fora do Supabase. Backup completo oficial: Supabase Dashboard/CLI.'].join('\n');
  }
  if(p){
    return [`🧯 PLANO DE CONTINGÊNCIA - LIKE ESTOQUE`, `Objetivo: ${p.objetivo || '-'}`, `RTO: ${p.rto_rpo_sugeridos?.rto || '-'}`, `RPO: ${p.rto_rpo_sugeridos?.rpo || '-'}`, '', `Observação: ${p.observacao || '-'}`].join('\n');
  }
  return 'Nenhum backup/plano carregado.';
}
async function copiarWhats(){
  try{ await navigator.clipboard.writeText(resumoWhats()); msg('Resumo copiado para WhatsApp.', 'ok'); }
  catch(e){ window.prompt('Copie o resumo:', resumoWhats()); }
}
function pdfText(doc,text,x,y,w=180,lh=5){ const lines = doc.splitTextToSize(String(text ?? '-'),w); lines.forEach(line=>{ if(y>280){ doc.addPage(); y=16; } doc.text(line,x,y); y+=lh; }); return y; }
function footer(doc){ const p = doc.internal.getCurrentPageInfo().pageNumber; doc.setFontSize(8); doc.setTextColor(110); doc.text('LIKE Estoque • Backup e contingência 6B • Documento interno',14,287); doc.text(`Página ${p}`,180,287); doc.setTextColor(0); }
function gerarPdf(){
  if(!window.jspdf?.jsPDF) return msg('jsPDF não carregou.', 'bad');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:'portrait', unit:'mm', format:'a4'});
  const e = S.exportacao;
  const p = S.plano;
  let y = 18;
  doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text('LIKE Estoque',14,y); y+=9;
  doc.setFontSize(14); doc.text('Backup, recuperação e contingência - 6B',14,y); y+=8;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  if(e){
    const c = e.payload?.contagens || {};
    y = pdfText(doc, `Backup operacional JSON: ${e.nome}`,14,y);
    y = pdfText(doc, `Período: ${e.periodo.ini} até ${e.periodo.fim} | Tamanho: ${e.size} bytes`,14,y);
    y = pdfText(doc, `SHA-256: ${e.hash}`,14,y,180);
    y+=4; doc.setDrawColor(0); doc.line(14,y,196,y); y+=8;
    [['Equipamentos',c.equipamentos],['Modelos',c.modelos],['Técnicos',c.tecnicos],['Locais',c.locais],['Movimentos período',c.movimentos_periodo],['Materiais movimentos período',c.materiais_movimentos_periodo],['Fechamentos',c.fechamentos]].forEach(r=>{ y=pdfText(doc, `${r[0]}: ${r[1] || 0}`,14,y); });
    y+=5;
  }
  if(p){
    y = pdfText(doc, `Objetivo: ${p.objetivo || '-'}`,14,y,180);
    y = pdfText(doc, `RTO: ${p.rto_rpo_sugeridos?.rto || '-'}`,14,y,180);
    y = pdfText(doc, `RPO: ${p.rto_rpo_sugeridos?.rpo || '-'}`,14,y,180);
    y+=4; doc.setFont('helvetica','bold'); doc.text('Política de backup',14,y); y+=6; doc.setFont('helvetica','normal');
    (p.politica_backup || []).forEach(x => { y=pdfText(doc, `• ${x.item}: ${x.frequencia} | ${x.responsavel} | ${x.armazenamento}`,14,y,180); });
    y+=4; doc.setFont('helvetica','bold'); doc.text('Recuperação',14,y); y+=6; doc.setFont('helvetica','normal');
    (p.procedimento_recuperacao || []).forEach(x => { y=pdfText(doc, `• ${x}`,14,y,180); });
  }
  y+=10; doc.setDrawColor(120); doc.line(24,y,92,y); doc.line(118,y,186,y); y+=5;
  doc.setFontSize(9); doc.text('Responsável pelo backup',36,y); doc.text('Gestor / Conferência',137,y);
  footer(doc);
  doc.save('backup_contingencia_6b.pdf');
}
function boot(){
  document.addEventListener('like:session', ev => { if(ev.detail?.user) ensureAdmin(); else removeAdminUi(); });
  setTimeout(ensureAdmin, 1400);
  setTimeout(ensureAdmin, 3800);
}

boot();
window.backupLoad = loadHistorico;
window.backupAdminRefresh = ensureAdmin;
