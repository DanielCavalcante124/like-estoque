(function(){
const PAGE_SIZE=20;
const state={};
let applying=false;
function css(){
 if(document.getElementById('pgTblCss'))return;
 const s=document.createElement('style');
 s.id='pgTblCss';
 s.textContent='.pgTblCtl{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:10px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;margin:8px 0 0}.pgTblCtl small{color:#64748b;font-weight:800}.pgTblCtl button{padding:8px 11px}.pgTblCtl .pgNum{font-weight:900;color:#0f4c81}.pgTblCtl select{width:auto;margin:0;padding:8px 10px}.pgTblInfo{display:flex;gap:8px;align-items:center;flex-wrap:wrap}@media print{.pgTblCtl{display:none!important}.tbl table tbody tr{display:table-row!important}}';
 document.head.appendChild(s);
}
function visible(el){
 if(!el)return false;
 if(el.closest('#legacyEstTHolder'))return false;
 if(el.closest('[style*="display:none"]'))return false;
 const r=el.getBoundingClientRect();
 return r.width>0&&r.height>0;
}
function idFor(table,i){
 if(!table.dataset.pgKey)table.dataset.pgKey='tbl_'+Date.now()+'_'+i+'_'+Math.random().toString(16).slice(2);
 return table.dataset.pgKey;
}
function rowsOf(table){
 const tb=table.tBodies&&table.tBodies[0];
 if(!tb)return [];
 return Array.from(tb.rows).filter(r=>!r.classList.contains('pgIgnore'));
}
function makeCtl(table,key){
 let wrap=table.closest('.tbl')||table.parentElement;
 if(!wrap)return null;
 let ctl=wrap.querySelector(':scope > .pgTblCtl[data-for="'+key+'"]');
 if(ctl)return ctl;
 ctl=document.createElement('div');
 ctl.className='pgTblCtl';
 ctl.dataset.for=key;
 ctl.innerHTML='<div class="pgTblInfo"><small class="pgTblResumo"></small><small>Página <span class="pgNum">1</span></small></div><div><button type="button" class="pgPrev">Anterior</button><button type="button" class="pgNext">Próxima</button></div>';
 wrap.appendChild(ctl);
 ctl.querySelector('.pgPrev').onclick=function(){state[key]=Math.max((state[key]||1)-1,1);applyAll(false)};
 ctl.querySelector('.pgNext').onclick=function(){state[key]=(state[key]||1)+1;applyAll(false)};
 return ctl;
}
function applyTable(table,i,reset){
 if(!visible(table))return;
 const rows=rowsOf(table);
 if(!rows.length)return;
 if(rows.length===1&&rows[0].cells.length&&/nenhum|sem saldo|sem histórico|sem equipamento|sem material/i.test(rows[0].textContent||''))return;
 const key=idFor(table,i);
 const pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
 if(reset||!state[key])state[key]=1;
 if(state[key]>pages)state[key]=pages;
 const page=state[key];
 const start=(page-1)*PAGE_SIZE,end=start+PAGE_SIZE;
 rows.forEach((r,idx)=>{r.style.display=(idx>=start&&idx<end)?'':'none'});
 let ctl=makeCtl(table,key);
 if(!ctl)return;
 ctl.style.display=rows.length>PAGE_SIZE?'flex':'none';
 let first=rows.length?start+1:0,last=Math.min(end,rows.length);
 ctl.querySelector('.pgTblResumo').textContent=rows.length+' registro(s) • mostrando '+first+'-'+last+' • 20 por página';
 ctl.querySelector('.pgNum').textContent=page+' / '+pages;
 ctl.querySelector('.pgPrev').disabled=page<=1;
 ctl.querySelector('.pgNext').disabled=page>=pages;
}
function applyAll(reset){
 if(applying)return;
 applying=true;
 try{
  css();
  Array.from(document.querySelectorAll('.tbl table')).forEach((t,i)=>applyTable(t,i,reset));
 }finally{applying=false}
}
function schedule(reset){clearTimeout(window.__pgTblTimer);window.__pgTblTimer=setTimeout(()=>applyAll(reset),120)}
const mo=new MutationObserver(function(muts){
 if(applying)return;
 if(muts.some(m=>m.type==='childList'))schedule(true);
});
document.addEventListener('DOMContentLoaded',function(){
 css();
 mo.observe(document.body,{childList:true,subtree:true});
 setTimeout(()=>applyAll(true),800);
 setTimeout(()=>applyAll(true),2500);
 setTimeout(()=>applyAll(true),7000);
});
window.paginarTabelas=function(){applyAll(true)};
})();