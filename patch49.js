(function(){
function g(i){return document.getElementById(i)}
function ok(){return window.db&&window.D}
async function reload(){try{await loadAll()}catch(e){}try{render()}catch(e){}}
async function rm(table,id){if(!ok())return alert('Sistema ainda carregando. Tente novamente.');if(!confirm('Excluir este cadastro?'))return;var r=await db().from(table).delete().eq('id',id);if(r.error)return alert('Erro ao excluir: '+r.error.message);await reload()}
window.prodDeleteTipo=function(id){rm('produto_tipos',id)};
window.prodDeleteMarca=function(id){rm('produto_marcas',id)};
window.prodDeleteModelo=function(id){rm('modelos',id)};
function fix(){
 var tipos=(D&&D.produtoTipos)||[];
 var marcas=(D&&D.produtoMarcas)||[];
 var modelos=(D&&D.modelos)||[];
 var tl=g('prodTipoList');
 if(tl)tl.innerHTML=tipos.map(function(t){return '<div class="prodMini"><div><b>'+esc(t.nome||'')+'</b><br><span class="prodTag '+(t.controle==='Quantidade'?'warn':'ok')+'">'+esc(t.controle||'')+'</span> <span class="prodTag '+(t.exige_mac_sn?'bad':'ok')+'">'+(t.exige_mac_sn?'Exige MAC/SN':'Sem MAC/SN')+'</span></div><button class="bad" onclick="window.prodDeleteTipo(\''+t.id+'\')">Excluir</button></div>'}).join('')||'<div class="msg">Nenhum tipo cadastrado.</div>';
 var ml=g('prodMarcaList');
 if(ml)ml.innerHTML=marcas.map(function(m){return '<div class="prodMini"><b>'+esc(m.nome||'')+'</b><button class="bad" onclick="window.prodDeleteMarca(\''+m.id+'\')">Excluir</button></div>'}).join('')||'<div class="msg">Nenhuma marca cadastrada.</div>';
 var mt=g('prodModeloTable');
 if(mt)mt.innerHTML=modelos.map(function(m){return '<tr><td>'+esc(m.tipo||'')+'</td><td>'+esc(m.marca||'')+'</td><td><b>'+esc(m.modelo||'')+'</b></td><td>'+esc(m.controle||'Unitário')+'</td><td>'+esc(m.unidade||'Unidade')+'</td><td>'+(m.exige_mac_sn===false?'Não':'Sim')+'</td><td>'+esc(m.minimo??m.estoque_minimo??'')+'</td><td>'+esc(m.ideal??m.estoque_ideal??'')+'</td><td><button onclick="window.prodEditModelo(\''+m.id+'\')">Editar</button><button class="bad" onclick="window.prodDeleteModelo(\''+m.id+'\')">Excluir</button></td></tr>'}).join('')||'<tr><td colspan="9">Nenhum modelo/produto cadastrado.</td></tr>';
}
setInterval(function(){if(g('p-cadastros')&&g('p-cadastros').classList.contains('on'))fix()},500);
document.addEventListener('DOMContentLoaded',function(){setTimeout(fix,2000);setTimeout(fix,4000)});
})();