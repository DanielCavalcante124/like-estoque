(function(){
function load(id,src){if(document.getElementById(id))return;var s=document.createElement('script');s.id=id;s.src=src;document.body.appendChild(s)}
document.addEventListener('DOMContentLoaded',function(){
 setTimeout(function(){load('patch37loader','patch37.js?v=37')},1200);
 setTimeout(function(){load('patch38loader','patch38.js?v=38')},1800);
 setTimeout(function(){load('patch39loader','patch39.js?v=39')},2200);
 setTimeout(function(){load('patch39loader','patch39.js?v=39')},4200);
});
})();