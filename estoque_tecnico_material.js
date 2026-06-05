(function(){
let saldosTecCache=[];
function E(id){return document.getElementById(id)}
function X(v){try{return esc(v??'')}catch(e){return String(v??'')}}
function dinheiro(v){try{return br(Number(v||0))}catch(e){return 'R$ '+Number(v||0).toFixed(2)}}
function tecEq(e){return e.tecnicoAtual||e.tecnico_atual||e.tecnico||''}
function nomeEq(e){return ((e.tipo||'')+' '+(e.marca||'')+' '+(e.modelo||'')).trim()}
async function carregarSaldosTecnicos(){
 try{saldosTecCache=await loadTable('materiais_saldos','tipo',true)}catch(e){saldosTecCache=[]}
}
function mats(nome){return (saldosTecCache||[]).filter(m=>(m.tecnico||'')===nome&&Number(m.quantidade||0)>0)}
function eqs(nome){return (D.equipamentos||[]).filter(e=>tecEq(e)===nome&&!['Em estoque','Inutilizado','Perdido','Descarte autorizado','Instalado no cliente','Instalado cliente'].includes(e.status||''))}
function nomes(){return [...new Set([...(D.tecnicos||[]).map(t=>t.nome),...(D.equipamentos||[]).map(tecEq),...(saldosTecCache||[]).map(m=>m.tecnico)].filter(Boolean))].sort()}
function tabelaEquipamentos(lista){
 if(!lista.length)return '<div class="msg">Sem equipamento patrimonial em posse.</div>';
 return '<div class="tbl"><table><thead><tr><th>Código</th><th>Modelo</th><th>MAC/SN</th><th>Status</th><th>Local</th><th>Cliente/backup</th><th>OS</th><th>Ações</th></tr></thead><tbody>'+lista.map(e=>'<tr><td>'+X(e.codigo)+'</td><td>'+X(nomeEq(e))+'</td><td>'+X(e.mac||e.serial||'')+'</td><td>'+X(e.status)+'</td><td>'+X(e.local||'')+'</td><td>'+X(e.clienteAtual||'')+'</td><td>'+X(e.osAtual||'')+'</td><td><button onclick="editEq(\''+e.id+'\')">Editar</button><button class="warn" onclick="inutilizarEq(\''+e.id+'\')">Inutilizar</button></td></tr>').join('')+'</tbody></table></div>'
}
function tabelaMateriais(lista){
 if(!lista.length)return '<div class="msg">Sem material em posse.</div>';
 return '<div class="tbl"><table><thead><tr><th>Categoria</th><th>Material</th><th>Quantidade</th><th>Unidade</th><th>Local</th></tr></thead><tbody>'+lista.map(m=>'<tr><td>'+X(m.categoria||'')+'</td><td>'+X((m.tipo||'')+' '+(m.marca||'')+' '+(m.modelo||''))+'</td><td><b>'+X(m.quantidade)+'</b></td><td>'+X(m.unidade_saida||'')+'</td><td>'+X(m.local||'Técnico')+'</td></tr>').join('')+'</tbody></table></div>'
}
async function renderTechStockComMateriais(){
 const box=E('techStockBox');if(!box)return;
 await carregarSaldosTecnicos();
 const ns=nomes();
 box.innerHTML=ns.map(nome=>{
  const e=eqs(nome),m=mats(nome),valor=e.reduce((s,x)=>s+Number(x.custo||0),0);
  return '<div class="card"><h2>'+X(nome)+' <span class="status">'+e.length+' eqp</span> <span class="status ok">'+m.length+' mat</span> <span class="status">'+dinheiro(valor)+'</span></h2><h3>Equipamentos patrimoniais</h3>'+tabelaEquipamentos(e)+'<h3>Materiais em posse</h3>'+tabelaMateriais(m)+'</div>';
 }).join('')||'<div class="msg">Nenhum técnico cadastrado.</div>';
}
window.renderTechStock=renderTechStockComMateriais;
const pgBase=window.pg;
window.pg=function(p){pgBase(p);if(p==='tecnico')setTimeout(renderTechStockComMateriais,150)};
document.addEventListener('DOMContentLoaded',function(){setTimeout(renderTechStockComMateriais,2000);setTimeout(renderTechStockComMateriais,6000)});
})();