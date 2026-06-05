(function(){
function removeLocal(tab,id){
 if(!window.D)return;
 if(tab==='produto_tipos'&&Array.isArray(D.produtoTipos))D.produtoTipos=D.produtoTipos.filter(x=>x.id!==id);
 if(tab==='produto_marcas'&&Array.isArray(D.produtoMarcas))D.produtoMarcas=D.produtoMarcas.filter(x=>x.id!==id);
 if(tab==='modelos'&&Array.isArray(D.modelos))D.modelos=D.modelos.filter(x=>x.id!==id);
}
function redrawProdutos(){try{if(typeof renderP==='function')renderP()}catch(e){}try{if(typeof render==='function')render()}catch(e){}}
window.p50Del=async function(tab,id){
 if(!confirm('Excluir este cadastro?'))return;
 var backup={tipos:[...(D.produtoTipos||[])],marcas:[...(D.produtoMarcas||[])],modelos:[...(D.modelos||[])]};
 removeLocal(tab,id);redrawProdutos();
 var r=await db().from(tab).delete().eq('id',id);
 if(r.error){D.produtoTipos=backup.tipos;D.produtoMarcas=backup.marcas;D.modelos=backup.modelos;redrawProdutos();alert('Erro ao excluir: '+r.error.message);return}
 try{if(typeof lp==='function')await lp()}catch(e){}try{redrawProdutos()}catch(e){}
};
function loadScript(id,src){if(document.getElementById(id))return;var s=document.createElement('script');s.id=id;s.src=src;document.body.appendChild(s)}
function loadExtra(){loadScript('patch52loader','patch52.js?v=52');loadScript('patch53loader','patch53.js?v=53');loadScript('patch54loader','patch54.js?v=54')}
setTimeout(loadExtra,800);setTimeout(loadExtra,2500);setTimeout(loadExtra,5000);
})();