(function(){
function load(id,src){if(document.getElementById(id))return;var s=document.createElement('script');s.id=id;s.src=src;document.body.appendChild(s)}
document.addEventListener('DOMContentLoaded',function(){
 setTimeout(function(){load('patch37loader','patch37.js?v=37')},1200);
 setTimeout(function(){load('patch38loader','patch38.js?v=38')},1800);
 setTimeout(function(){load('patch39loader','patch39.js?v=39')},2200);
 setTimeout(function(){load('patch42loader','patch42.js?v=42')},2600);
 setTimeout(function(){load('patch43loader','patch43.js?v=43')},3200);
 setTimeout(function(){load('patch44loader','patch44.js?v=44')},3600);
 setTimeout(function(){load('patch45loader','patch45.js?v=45')},4200);
 setTimeout(function(){load('patch46loader','patch46.js?v=46')},4700);
 setTimeout(function(){load('patch46loader','patch46.js?v=46')},7000);
});
})();