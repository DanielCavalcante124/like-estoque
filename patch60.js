(function(){
function E(i){return document.getElementById(i)}
function H(v){try{return esc(v??'')}catch(e){return String(v??'')}}
function removeLocal(tab,id){
 if(!window.D)return;
 if(tab==='modelos'&&Array.isArray(D.modelos))D.modelos=D.modelos.filter(x=>x.id!==id);
 if(tab==='produto_tipos'&&Array.isArray(D.produtoTipos))D.produtoTipos=D.produtoTipos.filter(x=>x.id!==id);
 if(tab==='produto_marcas'&&Array.isArray(D.produtoMarcas))D.produtoMarcas=D.produtoMarcas.filter(x=>x.id!==id);
}
function renderProdutos(){
 var tb=E('p50Modelos');
 if(tb){
  var rows=(D.modelos||[]).map(function(m){
   return '<tr><td>'+H(m.tipo)+'</td><td>'+H(m.marca)+'</td><td><b>'+H(m.modelo)+'</b></td><td>'+H(m.controle||'Unitário')+'</td><td>'+H(m.unidade||'Unidade')+'</td><td>'+(m.exige_mac_sn===false?'Não':'Sim')+'</td><td>'+H(m.minimo??m.estoque_minimo??'')+'</td><td>'+H(m.ideal??m.estoque_ideal??'')+'</td><td><button onclick="p50Edit(\''+m.id+'\')">Editar</button><button class="bad" onclick="p50Del(\'modelos\',\''+m.id+'\')">Excluir</button></td></tr>';
  }).join('');
  tb.innerHTML=rows||'<tr><td colspan="9">Nenhum modelo/produto cadastrado.</td></tr>';
 }
 var tl=E('p50Tipos');
 if(tl){
  tl.innerHTML=(D.produtoTipos||[]).map(function(t){return '<div class="prodMini"><div><b>'+H(t.nome)+'</b><br><span class="prodTag">'+H(t.controle||'')+'</span> <span class="prodTag">'+(t.exige_mac_sn?'Exige MAC/SN':'Sem MAC/SN')+'</span></div><button class="bad" onclick="p50Del(\'produto_tipos\',\''+t.id+'\')">Excluir</button></div>'}).join('')||'<div class="msg">Nenhum tipo cadastrado.</div>';
 }
 var ml=E('p50Marcas');
 if(ml){
  ml.innerHTML=(D.produtoMarcas||[]).map(function(m){return '<div class="prodMini"><b>'+H(m.nome)+'</b><button class="bad" onclick="p50Del(\'produto_marcas\',\''+m.id+'\')">Excluir</button></div>'}).join('')||'<div class="msg">Nenhuma marca cadastrada.</div>';
 }
}
window.p50Del=async function(tab,id){
 if(!confirm('Excluir este cadastro?'))return;
 var backup={modelos:[...(D.modelos||[])],tipos:[...(D.produtoTipos||[])],marcas:[...(D.produtoMarcas||[])]};
 removeLocal(tab,id);
 renderProdutos();
 var r=await db().from(tab).delete().eq('id',id);
 if(r.error){
  D.modelos=backup.modelos;D.produtoTipos=backup.tipos;D.produtoMarcas=backup.marcas;
  renderProdutos();
  alert('Erro ao excluir: '+r.error.message);
  return;
 }
 try{if(tab==='modelos')D.modelos=await loadTable('modelos','tipo',true)}catch(e){}
 try{if(tab==='produto_tipos')D.produtoTipos=await loadTable('produto_tipos','nome',true)}catch(e){}
 try{if(tab==='produto_marcas')D.produtoMarcas=await loadTable('produto_marcas','nome',true)}catch(e){}
 renderProdutos();
};
setInterval(function(){if(E('p50Modelos'))renderProdutos()},3000);
})();