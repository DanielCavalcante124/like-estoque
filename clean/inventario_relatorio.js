import { call } from './api.js?v=3';

const S={ctx:null,allowed:false,items:[],ativo:null,rel:null};
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const dt=v=>{try{return v?new Date(v).toLocaleString('pt-BR'):'-'}catch(e){return'-'}};
const lab=v=>({ok:'OK',divergente:'Divergente',nao_encontrado:'Não encontrado',duplicado:'Duplicado',inativo:'Inativo'}[v]||v);
const cls=v=>({ok:'ok',divergente:'warn',nao_encontrado:'bad',duplicado:'warn',inativo:'bad'}[v]||'');
function msg(t,c=''){const el=$('invRelMsg');if(el){el.textContent=t;el.className='msg show '+c;}}
function canView(ctx){const p=ctx?.permissoes||{};return !!(ctx?.is_admin||p.auditoria);}
function css(){if($('invRelCss'))return;const s=document.createElement('style');s.id='invRelCss';s.textContent=`.invrel-grid{display:grid;grid-template-columns:340px 1fr;gap:12px}.invrel-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.invrel-kpi{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:12px}.invrel-kpi small{display:block;color:#64748b;font-weight:800}.invrel-kpi b{font-size:22px}.invrel-card{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:12px;margin-bottom:10px}.invrel-card h3{margin:0 0 6px;font-size:16px}.invrel-card p{margin:4px 0;color:#475569}.invrel-active{border-color:#60a5fa;box-shadow:0 0 0 3px #dbeafe}.invrel-actions{display:flex;gap:8px;flex-wrap:wrap}.badge.ok{background:#dcfce7;color:#166534}.badge.bad{background:#fee2e2;color:#991b1b}.badge.warn{background:#fef3c7;color:#92400e}@media(max-width:1100px){.invrel-grid{grid-template-columns:1fr}.invrel-kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.invrel-kpis{grid-template-columns:1fr}.invrel-actions{display:grid;grid-template-columns:1fr}.invrel-actions>*{width:100%}}`;document.head.appendChild(s);}
function removeUi(){const n=$('navInvRelClean'),p=$('page-invrel-clean');const active=n?.classList.contains('active')||p?.classList.contains('active');n?.remove();p?.remove();if(active)document.querySelector('[data-page="dashboard"]')?.click();}
async function ensureAccess(){try{const ctx=await call('rpc_usuario_contexto_6c',{});S.ctx=ctx;S.allowed=canView(ctx);if(S.allowed)inject();else removeUi();return S.allowed;}catch(e){S.allowed=false;removeUi();return false;}}
function moveNav(){const nav=$('navInvRelClean');const g=$('sideGroupItems-gestao')||$('sideGroupItems-patrimonio');if(nav&&g&&!nav.closest('#'+g.id))g.appendChild(nav);const box=nav?.closest('.side-group');if(box&&nav?.classList.contains('active'))box.classList.remove('collapsed');}
function inject(){css();if(!$('navInvRelClean')){const ref=$('navInventarioBipClean')||$('navAuditoriaClean')||document.querySelector('[data-page="dashboard"]');const b=document.createElement('button');b.id='navInvRelClean';b.className='nav';b.textContent='Relatório Inventário';b.onclick=show;ref?ref.insertAdjacentElement('afterend',b):document.querySelector('.sidebar')?.appendChild(b);}if(!$('page-invrel-clean')){const sec=document.createElement('section');sec.id='page-invrel-clean';sec.className='page';sec.innerHTML=`<div class="card"><div class="table-head"><div><h2>Relatório e correção do inventário</h2><p>Analise bips, divergências e faltantes. Correções são guiadas e auditadas.</p></div><div class="invrel-actions"><button id="invRelReload" class="secondary">Recarregar</button><button id="invRelCsv" class="secondary">CSV</button><button id="invRelPdf" class="primary">PDF</button></div></div><div id="invRelMsg" class="msg show warn">Carregando...</div></div><div id="invRelKpis" class="invrel-kpis"></div><div class="invrel-grid"><div class="card"><div class="table-head"><h2>Inventários</h2><select id="invRelFiltro"><option value="">Todos</option><option value="aberto">Aberto</option><option value="em_conferencia">Em conferência</option><option value="finalizado">Finalizado</option></select></div><div id="invRelLista"></div></div><div><div class="card"><h2 id="invRelTitulo">Nenhum inventário selecionado</h2><p id="invRelInfo">Selecione um inventário para ver relatório.</p></div><div class="card"><h2>Divergências e bips</h2><div id="invRelBips"></div></div><div class="card"><h2>Faltantes</h2><div id="invRelFaltantes"></div></div></div></div>`;document.querySelector('.main')?.appendChild(sec);}bind();window.permissoes6DRefresh?.();setTimeout(moveNav,250);setTimeout(moveNav,1000);}
function bind(){if($('invRelReload').dataset.bound)return;$('invRelReload').dataset.bound='1';$('invRelReload').onclick=loadAll;$('invRelFiltro').onchange=loadInventarios;$('invRelCsv').onclick=csv;$('invRelPdf').onclick=pdf;}
async function show(){const ok=S.allowed||await ensureAccess();if(!ok){alert('Acesso restrito.');return;}inject();document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.id==='navInvRelClean'));document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='page-invrel-clean'));moveNav();if($('pageTitle'))$('pageTitle').textContent='Relatório Inventário';await loadAll();}
async function loadAll(){msg('Carregando relatórios...','warn');await loadInventarios();if(S.ativo)await loadRel(S.ativo.id);msg('Relatório carregado.','ok');}
async function loadInventarios(){const st=$('invRelFiltro')?.value||null;const res=await call('rpc_listar_inventarios_7a5',{p_status:st,p_limite:80});S.items=res.inventarios||[];renderLista();}
function renderLista(){$('invRelLista').innerHTML=(S.items||[]).map(i=>`<div class="invrel-card ${S.ativo?.id===i.id?'invrel-active':''}"><h3>${esc(i.codigo)}</h3><p><b>${esc(i.titulo)}</b></p><p>Local: ${esc(i.local_alvo)}</p><p>Status: <span class="badge">${esc(i.status)}</span></p><button class="secondary" data-invrel-id="${esc(i.id)}">Analisar</button></div>`).join('')||'<p>Nenhum inventário encontrado.</p>';document.querySelectorAll('[data-invrel-id]').forEach(b=>b.onclick=()=>loadRel(b.dataset.invrelId));}
async function loadRel(id){S.rel=await call('rpc_relatorio_inventario_7a5_2',{p_inventario_id:id});S.ativo=S.rel.inventario;renderLista();renderRel();}
function kpi(l,v){return `<div class="invrel-kpi"><small>${esc(l)}</small><b>${esc(v||0)}</b></div>`;}
function renderRel(){const r=S.rel?.resumo||{},i=S.ativo;$('invRelTitulo').textContent=`${i.codigo} — ${i.titulo}`;$('invRelInfo').textContent=`Local: ${i.local_alvo} • Status: ${i.status} • Aberto: ${dt(i.aberto_em)}`;$('invRelKpis').innerHTML=[kpi('Bipados',r.total_bipado),kpi('OK',r.ok),kpi('Divergentes',r.divergente),kpi('Não encontrados',r.nao_encontrado),kpi('Inativos',r.inativo),kpi('Faltantes',r.faltantes)].join('');renderBips();renderFaltantes();}
function renderBips(){const arr=S.rel?.bips||[];$('invRelBips').innerHTML=arr.map(b=>`<div class="invrel-card"><div class="table-head"><div><h3>${esc(b.codigo_bipado)}</h3><p>${esc(b.equipamento_codigo||'Sem cadastro')} ${b.mac?'• MAC '+esc(b.mac):''} ${b.serial?'• SN '+esc(b.serial):''}</p></div><span class="badge ${cls(b.resultado)}">${esc(lab(b.resultado))}</span></div><p>Sistema: ${esc(b.local_sistema||'-')} • Inventário: ${esc(b.local_alvo||'-')}</p><p>${esc(b.observacao||'')}</p>${b.resultado==='divergente'?`<button class="primary" data-corrigir-bip="${esc(b.id)}">Corrigir local para ${esc(b.local_alvo)}</button>`:''}</div>`).join('')||'<p>Nenhum bip registrado.</p>';document.querySelectorAll('[data-corrigir-bip]').forEach(b=>b.onclick=()=>corrigir(b.dataset.corrigirBip));}
function renderFaltantes(){const arr=S.rel?.faltantes||[];$('invRelFaltantes').innerHTML=arr.map(f=>`<div class="invrel-card"><h3>${esc(f.codigo||'-')}</h3><p>${esc(f.tipo||'')} ${esc(f.marca||'')} ${esc(f.modelo||'')}</p><p>MAC: ${esc(f.mac||'-')} • SN: ${esc(f.serial||'-')}</p><p>Local esperado: ${esc(f.local||'-')} • Técnico: ${esc(f.tecnico_atual||'-')}</p></div>`).join('')||'<p>Nenhum faltante encontrado.</p>';}
async function corrigir(bipId){try{const motivo=prompt('Motivo da correção de local:');if(!motivo)return;if(motivo.trim().length<8)throw new Error('Motivo muito curto.');await call('rpc_corrigir_divergencia_inventario_7a5_2',{p_bip_id:bipId,p_motivo:motivo.trim()});await loadRel(S.ativo.id);msg('Divergência corrigida com movimento e auditoria.','ok');}catch(e){msg(e.message||String(e),'bad');}}
function rows(){const inv=S.ativo||{};const b=(S.rel?.bips||[]).map(x=>({tipo:'BIP',codigo:x.equipamento_codigo||x.codigo_bipado,resultado:lab(x.resultado),local_sistema:x.local_sistema||'',local_alvo:x.local_alvo||'',mac:x.mac||'',serial:x.serial||''}));const f=(S.rel?.faltantes||[]).map(x=>({tipo:'FALTANTE',codigo:x.codigo||'',resultado:'Faltante',local_sistema:x.local||'',local_alvo:inv.local_alvo||'',mac:x.mac||'',serial:x.serial||''}));return b.concat(f);}
function csv(){if(!S.rel){msg('Selecione um inventário.','bad');return;}const head=['tipo','codigo','resultado','local_sistema','local_alvo','mac','serial'];const txt=[head.join(';')].concat(rows().map(r=>head.map(h=>`"${String(r[h]??'').replace(/"/g,'""')}"`).join(';'))).join('\n');const blob=new Blob([txt],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`inventario_${S.ativo.codigo}.csv`;a.click();URL.revokeObjectURL(a.href);}
function pdf(){
  if(!S.rel){msg('Selecione um inventário.','bad');return;}
  const js=window.jspdf?.jsPDF;
  if(!js){msg('jsPDF não carregado.','bad');return;}

  const doc=new js({orientation:'landscape',unit:'mm',format:'a4'});
  const inv=S.ativo||{};
  const r=S.rel.resumo||{};
  const W=297,H=210, M=10;
  let y=10;

  const clean=v=>String(v??'-').replace(/\s+/g,' ').trim();
  const pageBreak=(need=12)=>{ if(y+need>190){ footer(); doc.addPage(); y=12; header(false); } };
  const header=(first=true)=>{
    doc.setFillColor(15,76,129); doc.rect(0,0,W,16,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(13); doc.setFont(undefined,'bold');
    doc.text('LIKE Estoque - Relatório de Inventário',M,10);
    doc.setFontSize(8); doc.setFont(undefined,'normal');
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`,W-M,10,{align:'right'});
    doc.setTextColor(20,30,45);
    y=first?24:22;
  };
  const footer=()=>{
    const p=doc.internal.getNumberOfPages();
    doc.setFontSize(7); doc.setTextColor(100,116,139);
    doc.text('Documento gerado pelo LIKE Estoque. Inventário não altera estoque automaticamente; correções exigem auditoria.',M,202);
    doc.text(`Página ${p}`,W-M,202,{align:'right'});
    doc.setTextColor(20,30,45);
  };
  const section=t=>{ pageBreak(12); doc.setFillColor(241,245,249); doc.roundedRect(M,y, W-(M*2),8,1.5,1.5,'F'); doc.setFontSize(10); doc.setFont(undefined,'bold'); doc.setTextColor(15,76,129); doc.text(t,M+3,y+5.5); doc.setTextColor(20,30,45); y+=12; };
  const line=(l,v,x=M)=>{ doc.setFontSize(8); doc.setFont(undefined,'bold'); doc.text(`${l}:`,x,y); doc.setFont(undefined,'normal'); doc.text(clean(v),x+28,y); };
  const box=(l,v,x,w)=>{ doc.setDrawColor(226,232,240); doc.setFillColor(248,250,252); doc.roundedRect(x,y,w,18,2,2,'FD'); doc.setFontSize(7); doc.setFont(undefined,'bold'); doc.setTextColor(100,116,139); doc.text(l,x+3,y+6); doc.setFontSize(13); doc.setTextColor(15,23,42); doc.text(String(v??0),x+3,y+14); doc.setTextColor(20,30,45); };
  const table=(title,data)=>{
    section(title);
    if(!data.length){ doc.setFontSize(8); doc.setTextColor(100,116,139); doc.text('Nenhum registro nesta seção.',M,y); doc.setTextColor(20,30,45); y+=7; return; }
    const cols=[['Tipo',22],['Código',34],['Resultado',30],['Local sistema',46],['Local inventário',46],['MAC',42],['Serial',42]];
    const drawHead=()=>{ pageBreak(12); let x=M; doc.setFillColor(15,76,129); doc.setTextColor(255,255,255); doc.setFontSize(7); doc.setFont(undefined,'bold'); cols.forEach(c=>{doc.rect(x,y,c[1],7,'F'); doc.text(c[0],x+2,y+4.8); x+=c[1];}); doc.setTextColor(20,30,45); y+=7; };
    drawHead();
    data.forEach(row=>{
      const vals=[row.tipo,row.codigo,row.resultado,row.local_sistema,row.local_alvo,row.mac,row.serial].map(clean);
      const heights=vals.map((v,i)=>doc.splitTextToSize(v,cols[i][1]-4).length*4+4);
      const h=Math.max(8,...heights);
      if(y+h>190){ footer(); doc.addPage(); header(false); drawHead(); }
      let x=M; doc.setDrawColor(226,232,240); doc.setFontSize(7); doc.setFont(undefined,'normal');
      vals.forEach((v,i)=>{ doc.rect(x,y,cols[i][1],h); doc.text(doc.splitTextToSize(v,cols[i][1]-4),x+2,y+4); x+=cols[i][1]; });
      y+=h;
    });
    y+=4;
  };

  const allRows=rows();
  const divergentes=allRows.filter(x=>x.resultado==='Divergente');
  const naoEncontrados=allRows.filter(x=>x.resultado==='Não encontrado');
  const inativos=allRows.filter(x=>x.resultado==='Inativo');
  const faltantes=allRows.filter(x=>x.tipo==='FALTANTE');
  const ok=allRows.filter(x=>x.resultado==='OK');

  header(true);
  doc.setFontSize(16); doc.setFont(undefined,'bold'); doc.setTextColor(15,76,129); doc.text('Relatório de Inventário',M,y); y+=8;
  doc.setTextColor(20,30,45); doc.setFontSize(9); doc.setFont(undefined,'normal');
  line('Inventário',inv.codigo||'-'); y+=6;
  line('Título',inv.titulo||'-'); y+=6;
  line('Local',inv.local_alvo||'-'); line('Status',inv.status||'-',160); y+=6;
  line('Aberto em',dt(inv.aberto_em)); line('Finalizado em',dt(inv.finalizado_em),160); y+=9;

  box('BIPADOS',r.total_bipado||0,M,42); box('OK',r.ok||0,M+45,38); box('DIVERGENTES',r.divergente||0,M+86,44); box('NÃO ENCONTRADOS',r.nao_encontrado||0,M+133,50); box('INATIVOS',r.inativo||0,M+186,40); box('FALTANTES',r.faltantes||0,M+229,42); y+=24;

  section('Resumo executivo');
  doc.setFontSize(8); doc.setFont(undefined,'normal');
  const resumoTxt=[
    `Foram bipados ${r.total_bipado||0} itens para o local ${clean(inv.local_alvo)}.`,
    `Divergências de local: ${r.divergente||0}. Faltantes no local esperado: ${r.faltantes||0}. Não encontrados no cadastro: ${r.nao_encontrado||0}. Inativos/baixados encontrados: ${r.inativo||0}.`,
    'Itens divergentes devem ser corrigidos apenas após conferência física. Itens não encontrados, faltantes e inativos não são corrigidos automaticamente.'
  ].join(' ');
  doc.text(doc.splitTextToSize(resumoTxt,W-(M*2)),M,y); y+=18;

  table('1. Divergências de local',divergentes);
  table('2. Equipamentos faltantes no local esperado',faltantes);
  table('3. Bips não encontrados no cadastro',naoEncontrados);
  table('4. Equipamentos inativos/baixados bipados',inativos);
  table('5. Conferidos sem divergência',ok.slice(0,120));

  pageBreak(32); section('Assinaturas e conferência');
  doc.setFontSize(8); doc.text('Responsável pelo inventário',M,y+14); doc.line(M,y+10,95,y+10);
  doc.text('Gestor / auditoria',120,y+14); doc.line(120,y+10,205,y+10);
  doc.text('Data',230,y+14); doc.line(230,y+10,280,y+10);
  footer();
  const pages=doc.internal.getNumberOfPages();
  for(let i=1;i<=pages;i++){ doc.setPage(i); doc.setFontSize(7); doc.setTextColor(100,116,139); doc.text(`Página ${i} de ${pages}`,W-M,206,{align:'right'}); }
  doc.save(`inventario_${inv.codigo||'relatorio'}.pdf`);
}
function boot(){document.addEventListener('like:session',ev=>{if(ev.detail?.user)ensureAccess();else removeUi();});setTimeout(ensureAccess,1900);setTimeout(ensureAccess,4400);}
boot();
