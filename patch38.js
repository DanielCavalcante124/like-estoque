(function(){
function $(i){return document.getElementById(i)}
function esc2(v){try{return esc(v??'')}catch(e){return String(v??'')}}
function fmt(v){try{return br(Number(v||0))}catch(e){return 'R$ '+Number(v||0).toFixed(2)}}
function nomeEq(e){return ((e.tipo||'')+' '+(e.marca||'')+' '+(e.modelo||'')).trim()}
function ultimoResp(e){
 var m=(D.movimentos||[]).find(function(x){return x.equipamento_id===e.id||x.codigo===e.codigo});
 return (m&&(m.tecnico||m.tec))||e.tecnicoAtual||'';
}
function nomes(){
 var a=[];(D.tecnicos||[]).forEach(function(t){if(t.nome)a.push(t.nome)});
 (D.pendencias||[]).forEach(function(p){if(p.tecnico)a.push(p.tecnico)});
 (D.descartes||[]).forEach(function(d){if(d.tecnico)a.push(d.tecnico)});
 (D.equipamentos||[]).forEach(function(e){var n=ultimoResp(e);if(n)a.push(n)});
 return Array.from(new Set(a)).sort();
}
function preencher(){var s=$('lossTec');if(!s)return;var old=s.value;s.innerHTML='<option value="">Todos</option>'+nomes().map(function(n){return '<option>'+esc2(n)+'</option>'}).join('');if(Array.from(s.options).some(function(o){return o.value===old}))s.value=old}
function linhas(){
 var r=[];
 (D.pendencias||[]).forEach(function(p){if(['Aberta','Cobrar valor','Divergente'].indexOf(p.status)>=0)r.push({o:'Pendencia',t:p.tecnico||'-',c:p.codigo||'',e:p.modelo||'',i:p.mac||p.serial||'',s:p.status||'',m:p.motivo||'',v:Number(p.valor_estimado||0)});});
 (D.descartes||[]).forEach(function(d){r.push({o:'Descarte',t:d.tecnico||'-',c:d.codigo||'',e:d.modelo||'',i:d.mac||d.serial||'',s:d.status||'',m:d.motivo||'',v:0});});
 (D.equipamentos||[]).forEach(function(e){if(['Perdido','Inutilizado','Descarte autorizado'].indexOf(e.status)>=0)r.push({o:'Equipamento',t:ultimoResp(e)||'-',c:e.codigo||'',e:nomeEq(e),i:e.mac||e.serial||'',s:e.status||'',m:e.motivoAtual||e.inutilizadoObs||'',v:Number(e.custo||0)});});
 return r;
}
function gerar(){var area=$('lossArea');if(!area)return;var tec=$('lossTec')?$('lossTec').value:'';var rs=linhas().filter(function(x){return !tec||x.t===tec});var ab=rs.filter(function(x){return x.s==='Aberta'}).length;var cb=rs.filter(function(x){return x.s==='Cobrar valor'}).length;var val=rs.reduce(function(s,x){return s+x.v},0);area.innerHTML='<div class="lossKpi"><div><small>Pendencias abertas</small><b>'+ab+'</b></div><div><small>Cobrar valor</small><b>'+cb+'</b></div><div><small>Ocorrencias</small><b>'+rs.length+'</b></div><div><small>Valor estimado</small><b>'+fmt(val)+'</b></div></div><div class="tbl"><table><thead><tr><th>Origem</th><th>Responsavel</th><th>Codigo</th><th>Equipamento</th><th>Status/Motivo</th><th>Valor</th></tr></thead><tbody>'+(rs.map(function(x){return '<tr><td>'+esc2(x.o)+'</td><td>'+esc2(x.t)+'</td><td>'+esc2(x.c)+'</td><td>'+esc2(x.e)+'<br><small>'+esc2(x.i)+'</small></td><td>'+esc2(x.s)+'<br><small>'+esc2(x.m)+'</small></td><td>'+fmt(x.v)+'</td></tr>'}).join('')||'<tr><td colspan="6">Sem ocorrencias.</td></tr>')+'</tbody></table></div>'}
function hook(){preencher();if($('lossGen'))$('lossGen').onclick=gerar;if($('lossCopy'))$('lossCopy').onclick=function(){var t=($('lossArea')&&$('lossArea').innerText)||'';if(t)navigator.clipboard.writeText(t)};if($('lossPrint'))$('lossPrint').onclick=function(){if(!$('lossArea').innerHTML)gerar();window.print()}}
document.addEventListener('DOMContentLoaded',function(){setInterval(hook,1000);setTimeout(hook,1200)});
})();