(function(){
function E(id){return document.getElementById(id)}
function txt(v){return String(v==null?'':v)}
function nomeEq(e){return [e.tipo,e.marca,e.modelo].filter(Boolean).join(' ')}
function nomeMat(m){return [m.tipo,m.marca,m.modelo].filter(Boolean).join(' ')}
function qtd(v){let n=Number(v||0);return Number.isInteger(n)?String(n):String(n).replace('.',',')}
function tecEq(e){return (e.tecnicoAtual||e.tecnico_atual||e.tecnico||'').trim()}
function selectedTec(){let t=E('tecMainTitulo');let s=t?txt(t.textContent).replace(/^Técnico:\s*/i,'').split('•')[0].trim():'';if(s&&s!=='Selecione um técnico')return s;let active=document.querySelector('[data-tec-main].tecActiveFix');if(active)return active.dataset.tecMain||'';return window.tecSel||''}
async function loadMats(){try{return await loadTable('materiais_saldos','tipo',true)}catch(e){return []}}
function eqs(nome){return ((window.D&&D.equipamentos)||[]).filter(e=>tecEq(e)===nome&&!['Em estoque','Inutilizado','Perdido','Descarte autorizado','Instalado no cliente','Instalado cliente'].includes(e.status||''))}
async function mats(nome){let rows=await loadMats();return rows.filter(m=>(m.tecnico||'')===nome&&Number(m.quantidade||0)>0)}
async function textoConferencia(nome){let e=eqs(nome),m=await mats(nome);return '📦 CONFERÊNCIA DE ESTOQUE\n\nTécnico: '+nome+'\nData: '+new Date().toLocaleString('pt-BR')+'\n\nEQUIPAMENTOS:\n'+(e.map((x,i)=>(i+1)+'. '+(x.codigo||'')+' | '+nomeEq(x)+' | MAC/SN: '+(x.mac||x.serial||'-')+' | '+(x.status||'-')).join('\n')||'Sem equipamentos em posse.')+'\n\nMATERIAIS:\n'+(m.map(x=>'- '+nomeMat(x)+': '+qtd(x.quantidade)+' '+(x.unidade_saida||'')).join('\n')||'Sem materiais em posse.')+'\n\nFavor conferir e confirmar.'}
function fallbackCopy(text){let ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.focus();ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}document.body.removeChild(ta);return ok}
async function copyTec(){let nome=selectedTec();if(!nome){if(typeof msg==='function')msg('tecMainMsg','Selecione um técnico.','bad');return}let texto=await textoConferencia(nome);try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(texto)}else if(!fallbackCopy(texto)){throw Error('Área de transferência bloqueada')}}catch(e){fallbackCopy(texto)}if(typeof msg==='function')msg('tecMainMsg','Conferência copiada: '+nome+'.','ok')}
function markActive(el){document.querySelectorAll('[data-tec-main]').forEach(x=>x.classList.remove('tecActiveFix'));if(el)el.classList.add('tecActiveFix')}
function bind(){document.querySelectorAll('[data-tec-main]').forEach(el=>{if(!el.dataset.fixAct){el.dataset.fixAct='1';el.addEventListener('click',()=>markActive(el),true)}});let btn=E('tecMainCopiar');if(btn&&!btn.dataset.fixCopy){btn.dataset.fixCopy='1';btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopImmediatePropagation();copyTec()},true)}}
document.addEventListener('click',function(ev){let a=ev.target.closest&&ev.target.closest('[data-tec-main]');if(a)markActive(a);let b=ev.target.closest&&ev.target.closest('#tecMainCopiar');if(b){ev.preventDefault();ev.stopImmediatePropagation();copyTec()}},true);
document.addEventListener('DOMContentLoaded',()=>{[500,1500,3000,7000,12000].forEach(t=>setTimeout(bind,t));setInterval(bind,2000)});window.tecnicosActionsFixBind=bind;
})();