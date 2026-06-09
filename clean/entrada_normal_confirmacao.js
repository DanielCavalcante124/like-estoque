(function(){
  if(window.likeEntradaNormalConfirmacaoAtiva)return;
  window.likeEntradaNormalConfirmacaoAtiva=true;
  function $(id){return document.getElementById(id)}
  function v(id){var el=$(id);return el&&el.value?String(el.value).trim():''}
  function foco(id){setTimeout(function(){var el=$(id);if(el){el.focus();if(el.select)el.select()}},30)}
  function aviso(t,c){var el=$('entradaMsg');if(el){el.textContent=t;el.className='msg show '+(c||'')}}
  function modelo(){var el=$('entradaModeloSelect');return !el||el.selectedIndex<0?'-':el.options[el.selectedIndex].textContent.trim()}
  function confirmar(){
    var mac=v('entradaMac').toUpperCase().replace(/-/g,':');
    var sn=v('entradaSerial').toUpperCase();
    var m=modelo();
    if(!m||m==='Selecionar patrimônio unitário'){aviso('Selecione o modelo antes de registrar.','bad');return false}
    if(!mac&&!sn){aviso('Informe MAC ou Serial/SN antes de registrar.','bad');foco('entradaMac');return false}
    return confirm(['CONFIRMAR ENTRADA DO EQUIPAMENTO?','','Equipamento: '+m,'MAC: '+(mac||'-'),'Serial/SN: '+(sn||'-'),'Local: '+(v('entradaLocal')||'Estoque central'),'Fornecedor: '+(v('entradaFornecedor')||'-'),'NF/Documento: '+(v('entradaNf')||'-'),'Responsável: '+(v('entradaResponsavel')||'-'),'','OK grava no sistema. Cancelar não registra nada.'].join('\n'))
  }
  function salvar(){
    var f=$('entradaForm');
    if(!f)return;
    if(!confirmar()){aviso('Entrada cancelada. Nenhum registro foi gravado.','warn');return}
    if(typeof f.onsubmit==='function')f.onsubmit({preventDefault:function(){}});
  }
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('#entradaForm button[type=submit]'):null;
    if(!b)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    salvar();
  },true);
  document.addEventListener('keydown',function(e){
    var t=e.target;if(!t)return;
    if(t.id==='entradaMac'&&e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();foco('entradaSerial')}
    if(t.id==='entradaSerial'&&e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();salvar()}
  },true);
  setInterval(function(){var b=document.querySelector('#entradaForm button[type=submit]');if(b)b.textContent='Conferir e registrar entrada'},800);
})();
