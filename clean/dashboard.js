import { table } from './api.js';

const S={equipamentos:[],modelos:[],tecnicos:[],locais:[],saldos:[],movEq:[],movMat:[]};
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const br=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const qtd=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:3});
const ativo=x=>x&&x.ativo!==false;
const eqAtivo=e=>e&&e.ativo!==false&&!['Baixado','Inutilizado','Perdido'].includes(e.status||'');
function nomeEq(e){return [e.tipo,e.marca,e.modelo].filter(Boolean).join(' ')}
function nomeMat(m){return [m.tipo,m.marca,m.modelo].filter(Boolean).join(' ')}
function msg(t,c=''){let e=$('dashCleanMsg');if(e){e.textContent=t;e.className='msg show '+c}}
function tecEq(e){return String(e.tecnico_atual||e.tecnico||'').trim()}
function matsTec(n){return S.saldos.filter(s=>String(s.tecnico||'').trim()===n&&Number(s.quantidade||0)>0)}
function eqsTec(n){return S.equipamentos.filter(e=>eqAtivo(e)&&tecEq(e)===n&&!['Em estoque','Instalado cliente','Instalado no cliente'].includes(e.status||''))}
function valorTec(n){return eqsTec(n).reduce((a,e)=>a+Number(e.custo||0),0)}
function isMaterial(m){let c=String(m.categoria_estoque||m.categoria||m.controle||'').toLowerCase(),t=nomeEq(m).toLowerCase();return c.includes('consumo')||c.includes('material')||c.includes('fechado')||/(rj45|conector|cabo|drop|bobina|fibra|cordão|cordao|patch|pigtail)/.test(t)}
function inject(){
 const sec=$('page-dashboard');if(!sec)return;
 sec.innerHTML=`<div class="card"><div class="table-head"><div><h2>Dashboard operacional</h2><p>Painel limpo consolidado: estoque, técnicos, materiais, alertas e últimas movimentações.</p></div><button id="dashCleanReload" class="secondary">Atualizar dashboard</button></div><div id="dashCleanMsg" class="msg"></div></div><div class="kpis"><div class="kpi"><small>Equipamentos ativos</small><b id="dashEqAtivos">0</b></div><div class="kpi"><small>Em estoque</small><b id="dashEqEstoque">0</b></div><div class="kpi"><small>Com técnicos</small><b id="dashEqTec">0</b></div><div class="kpi"><small>Valor em posse</small><b id="dashValorTec">R$ 0,00</b></div></div><div class="grid two"><div class="card"><h2>Equipamentos por status</h2><div id="dashStatus"></div></div><div class="card"><h2>Alertas operacionais</h2><div id="dashAlertas"></div></div></div><div class="grid two"><div class="card"><h2>Materiais críticos</h2><div class="table-wrap"><table><thead><tr><th>Material</th><th>Saldo</th><th>Mínimo</th><th>Status</th></tr></thead><tbody id="dashMateriaisCriticos"></tbody></table></div></div><div class="card"><h2>Técnicos com pendências</h2><div id="dashTecnicosPend"></div></div></div><div class="card"><h2>Últimas movimentações</h2><div class="table-wrap"><table><thead><tr><th>Data</th><th>Origem</th><th>Tipo</th><th>Item</th><th>Técnico</th><th>Obs</th></tr></thead><tbody id="dashMovs"></tbody></table></div></div>`;
 $('dashCleanReload').onclick=()=>load().catch(e=>msg(e.message,'bad'));
}
async function load(){
 msg('Carregando dashboard...','warn');
 S.equipamentos=await table('equipamentos','created_at',false);
 S.modelos=await table('modelos','tipo',true);
 S.tecnicos=await table('tecnicos','nome',true);
 S.locais=await table('locais','nome',true);
 S.saldos=await table('materiais_saldos','tipo',true);
 S.movEq=await table('movimentos','created_at',false);
 S.movMat=await table('materiais_movimentos','created_at',false);
 render();msg('Dashboard atualizado.','ok')
}
function render(){renderKpis();renderStatus();renderAlertas();renderMateriaisCriticos();renderTecnicosPend();renderMovs()}
function renderKpis(){let a=S.equipamentos.filter(eqAtivo);$('dashEqAtivos').textContent=a.length;$('dashEqEstoque').textContent=a.filter(e=>e.status==='Em estoque').length;$('dashEqTec').textContent=a.filter(e=>e.status==='Com técnico').length;let nomes=[...new Set(a.map(tecEq).filter(Boolean))];$('dashValorTec').textContent=br(nomes.reduce((s,n)=>s+valorTec(n),0))}
function renderStatus(){let map={};S.equipamentos.forEach(e=>{let s=e.status||'Sem status';map[s]=(map[s]||0)+1});$('dashStatus').innerHTML=Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([s,n])=>`<div class="item"><b>${esc(s)}</b><span class="badge">${n}</span></div>`).join('')||'<div class="item">Sem dados.</div>'}
function renderAlertas(){let arr=[];let semMac=S.equipamentos.filter(e=>eqAtivo(e)&&!e.mac&&!e.serial);if(semMac.length)arr.push(`${semMac.length} equipamento(s) ativo(s) sem MAC/SN`);let semCusto=S.equipamentos.filter(e=>eqAtivo(e)&&!Number(e.custo||0));if(semCusto.length)arr.push(`${semCusto.length} equipamento(s) sem custo`);let baixo=materiaisBaixos();if(baixo.length)arr.push(`${baixo.length} material(is) abaixo do mínimo`);let tec=tecnicosPendentes();if(tec.length)arr.push(`${tec.length} técnico(s) com posse/pendência`);$('dashAlertas').innerHTML=arr.length?arr.map(a=>`<div class="item"><b>${esc(a)}</b><span class="badge">Atenção</span></div>`).join(''):'<div class="msg show ok">Sem alerta crítico aparente.</div>'}
function saldoModelo(id){return S.saldos.filter(s=>s.modelo_id===id||s.id_modelo===id||String(s.tipo+'|'+s.marca+'|'+s.modelo)===String((S.modelos.find(m=>m.id===id)||{}).tipo+'|'+(S.modelos.find(m=>m.id===id)||{}).marca+'|'+(S.modelos.find(m=>m.id===id)||{}).modelo)).reduce((a,s)=>a+Number(s.quantidade||0),0)}
function materiaisBaixos(){return S.modelos.filter(ativo).filter(isMaterial).map(m=>({m,sl:saldoModelo(m.id),min:Number(m.estoque_minimo||m.minimo||0)})).filter(x=>x.min>0&&x.sl<x.min)}
function renderMateriaisCriticos(){let rows=materiaisBaixos();$('dashMateriaisCriticos').innerHTML=rows.map(x=>`<tr><td>${esc(nomeEq(x.m))}</td><td><b>${qtd(x.sl)}</b></td><td>${qtd(x.min)}</td><td><span class="badge">Baixo</span></td></tr>`).join('')||'<tr><td colspan="4">Nenhum material abaixo do mínimo.</td></tr>'}
function tecnicosPendentes(){let nomes=new Set();S.tecnicos.filter(ativo).forEach(t=>t.nome&&nomes.add(t.nome));S.equipamentos.forEach(e=>tecEq(e)&&nomes.add(tecEq(e)));S.saldos.forEach(s=>s.tecnico&&nomes.add(String(s.tecnico).trim()));return [...nomes].map(n=>({nome:n,eq:eqsTec(n).length,mat:matsTec(n).length,valor:valorTec(n)})).filter(x=>x.eq||x.mat).sort((a,b)=>(b.eq+b.mat)-(a.eq+a.mat))}
function renderTecnicosPend(){let rows=tecnicosPendentes().slice(0,12);$('dashTecnicosPend').innerHTML=rows.map(t=>`<div class="item"><div><b>${esc(t.nome)}</b><br><small>${t.eq} equipamento(s) • ${t.mat} material(is)</small></div><span class="badge">${br(t.valor)}</span></div>`).join('')||'<div class="msg show ok">Nenhum técnico com posse.</div>'}
function renderMovs(){let a=S.movEq.map(m=>({d:m.created_at||m.data,o:'Equipamento',t:m.tipo||'',i:m.codigo||m.mac||m.serial||'',tec:m.tecnico||'',obs:m.obs||m.motivo||''}));let b=S.movMat.map(m=>({d:m.created_at||m.data,o:'Material',t:m.motivo||'Material',i:nomeMat(m),tec:m.tecnico||'',obs:m.obs||''}));let rows=[...a,...b].sort((x,y)=>new Date(y.d||0)-new Date(x.d||0)).slice(0,15);$('dashMovs').innerHTML=rows.map(x=>`<tr><td>${esc(fmt(x.d))}</td><td>${esc(x.o)}</td><td>${esc(x.t)}</td><td>${esc(x.i)}</td><td>${esc(x.tec)}</td><td>${esc(x.obs)}</td></tr>`).join('')||'<tr><td colspan="6">Sem movimentações.</td></tr>'}
function fmt(v){try{return v?new Date(v).toLocaleString('pt-BR'):'-'}catch(e){return String(v||'-')}}
function boot(){inject();setTimeout(()=>load().catch(()=>{}),1200);document.querySelector('[data-page="dashboard"]')?.addEventListener('click',()=>setTimeout(()=>load().catch(e=>msg(e.message,'bad')),200))}
boot();window.dashboardCleanLoad=load;
