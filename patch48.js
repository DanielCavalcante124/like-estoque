(function(){
function e(i){return document.getElementById(i)}
async function reload(){try{await loadAll()}catch(x){}try{if(window.loadProdutos)await window.loadProdutos()}catch(x){}try{render()}catch(x){}}
async function del(tab,id,msg){if(!confirm(msg||'Excluir registro?'))return;var r=await db().from(tab).delete().eq('id',id);if(r.error){alert('Erro ao excluir: '+r.error.message);return}await reload()}
window.prodDeleteTipo=function(id){del('produto_tipos',id,'Excluir este tipo?')}
window.prodDeleteMarca=function(id){del('produto_marcas',id,'Excluir esta marca?')}
window.prodDeleteModelo=function(id){del('modelos',id,'Excluir este modelo/produto?')}
function replaceButtons(){
 document.querySelectorAll('#prodTipoList button').forEach(function(b){b.textContent='Excluir';b.className='bad';var m=(b.getAttribute('onclick')||'').match(/prodToggleTipo\('([^']+)'/);if(m)b.setAttribute('onclick',"window.prodDeleteTipo('"+m[1]+"')")});
 document.querySelectorAll('#prodMarcaList button').forEach(function(b){b.textContent='Excluir';b.className='bad';var m=(b.getAttribute('onclick')||'').match(/prodToggleMarca\('([^']+)'/);if(m)b.setAttribute('onclick',"window.prodDeleteMarca('"+m[1]+"')")});
 document.querySelectorAll('#prodModeloTable button').forEach(function(b){if(b.textContent.trim()==='Desativar'){b.textContent='Excluir';b.className='bad';var m=(b.getAttribute('onclick')||'').match(/prodDisableModelo\('([^']+)'/);if(m)b.setAttribute('onclick',"window.prodDeleteModelo('"+m[1]+"')")}});
}
setInterval(replaceButtons,800);document.addEventListener('DOMContentLoaded',function(){setTimeout(replaceButtons,1500)});
})();