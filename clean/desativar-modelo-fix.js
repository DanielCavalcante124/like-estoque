(function(){
  function cfg(){
    try{return JSON.parse(localStorage.getItem('like_cfg_v26')||'{}')}catch(e){return {}}
  }
  function getDb(){
    const c=cfg();
    if(!c.url||!c.key) throw new Error('URL/chave do Supabase não encontradas. Faça login novamente.');
    return window.supabase.createClient(c.url,c.key);
  }
  async function rpcDesativarModelo(id,motivo){
    const r=await getDb().rpc('rpc_desativar_modelo',{p_modelo_id:id,p_motivo:motivo});
    if(r.error) throw r.error;
    return r.data;
  }
  function show(text,kind){
    const el=document.getElementById('modeloMsg');
    if(el){el.textContent=text;el.className='msg show '+(kind||'');}
  }
  async function handle(ev){
    const btn=ev.target&&ev.target.closest?ev.target.closest('[data-desativar-modelo]'):null;
    if(!btn)return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    const id=btn.getAttribute('data-desativar-modelo');
    if(!id){show('ID do modelo não encontrado no botão.','bad');return false;}
    const tr=btn.closest('tr');
    const nome=tr?Array.from(tr.children).slice(0,3).map(td=>td.textContent.trim()).join(' / '):id;
    const motivo=prompt('Motivo para desativar '+nome+':','Desativado pelo administrador');
    if(motivo===null)return false;
    try{
      btn.disabled=true;
      btn.textContent='Desativando...';
      show('Desativando modelo via RPC...', 'warn');
      await rpcDesativarModelo(id,(motivo.trim()||'Desativado pelo administrador'));
      if(tr)tr.remove();
      show('Modelo desativado com sucesso. Histórico preservado.', 'ok');
      setTimeout(function(){if(window.location.href.includes('index-clean'))location.reload();},900);
    }catch(e){
      btn.disabled=false;
      btn.textContent='Desativar';
      show('Erro ao desativar modelo: '+(e.message||e), 'bad');
    }
    return false;
  }
  document.addEventListener('click',handle,true);
  window.desativarModeloFixAtivo=true;
})();

(function(){
  if(window.likeEntradaFluxoSeguroLoader)return;
  window.likeEntradaFluxoSeguroLoader=true;
  var s=document.createElement('script');
  s.src='clean/entrada_fluxo_seguro.js?v=1';
  s.defer=true;
  document.body.appendChild(s);
})();
