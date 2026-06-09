(function(){
  if(window.likeEntradaFluxoSeguroAtivo)return;
  window.likeEntradaFluxoSeguroAtivo=true;
  const $=id=>document.getElementById(id);
  const val=id=>(($(id)?.value)||'').trim();
  const focus=id=>setTimeout(()=>{$(id)?.focus();$(id)?.select?.();},0);
  const msg=(id,t,c='')=>{const el=$(id);if(el){el.textContent=t;el.className='msg show '+c;}};
  const dinheiro=v=>(Number(v||0)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  function optText(id){const el=$(id);return (!el||el.selectedIndex<0)?'-':(el.options[el.selectedIndex].textContent||'-').trim();}
  function patchLabels(){
    const b1=document.querySelector('#entradaForm button.primary[type=submit]');
    if(b1)b1.textContent='Conferir e registrar entrada';
    const b2=document.querySelector('#loteForm button.primary[type=submit]');
    if(b2)b2.textContent='Conferir e finalizar entrada no sistema';
    const add=$('loteAdicionarItem');if(add)add.textContent='Pré-entrada do item';
    const foco=$('loteFocoMac');if(foco)foco.textContent='Voltar para MAC';
  }
  function confirmEntrada(ev){
    const form=ev.target;
    if(!form||form.id!=='entradaForm'||form.dataset.okFluxoSeguro==='1')return;
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    const modelo=optText('entradaModeloSelect');
    const mac=val('entradaMac').toUpperCase().replace(/-/g,':');
    const serial=val('entradaSerial').toUpperCase();
    if(!modelo||modelo==='Selecionar patrimônio unitário'){msg('entradaMsg','Selecione o modelo antes de registrar.','bad');return false;}
    if(!mac&&!serial){msg('entradaMsg','Informe MAC ou Serial/SN antes de registrar.','bad');focus('entradaMac');return false;}
    const linhas=[
      'CONFIRMAR ENTRADA DO EQUIPAMENTO?',
      '',
      'Equipamento: '+modelo,
      'MAC: '+(mac||'-'),
      'Serial/SN: '+(serial||'-'),
      'Local: '+(val('entradaLocal')||'Estoque central'),
      'Custo: '+dinheiro(val('entradaCusto')),
      'Fornecedor: '+(val('entradaFornecedor')||'-'),
      'NF/Documento: '+(val('entradaNf')||'-'),
      'Responsável: '+(val('entradaResponsavel')||'-'),
      '',
      'OK grava no sistema. Cancelar não registra nada.'
    ];
    if(!window.confirm(linhas.join('\n'))){msg('entradaMsg','Entrada cancelada. Nenhum registro foi gravado.','warn');return false;}
    form.dataset.okFluxoSeguro='1';
    setTimeout(()=>delete form.dataset.okFluxoSeguro,1500);
    form.requestSubmit();
    return false;
  }
  function keyEntrada(ev){
    const t=ev.target;if(!t)return;
    if(t.id==='entradaMac'&&ev.key==='Enter'){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();focus('entradaSerial');return false;}
    if(t.id==='entradaSerial'&&ev.key==='Enter'){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();$('entradaForm')?.requestSubmit();return false;}
  }
  function keyLote(ev){
    const t=ev.target;if(!t)return;
    if(t.id==='loteScanMac'&&ev.key==='Enter'){setTimeout(()=>focus('loteScanSerial'),20);}
    if(t.id==='loteScanSerial'&&ev.key==='Enter'){setTimeout(()=>focus('loteScanMac'),120);}
  }
  function clickLote(ev){
    if(ev.target?.closest?.('#loteAdicionarItem'))setTimeout(()=>focus('loteScanMac'),120);
    if(ev.target?.closest?.('#loteFocoMac'))setTimeout(()=>focus('loteScanMac'),0);
  }
  document.addEventListener('submit',confirmEntrada,true);
  document.addEventListener('keydown',keyEntrada,true);
  document.addEventListener('keydown',keyLote,false);
  document.addEventListener('click',clickLote,false);
  setInterval(patchLabels,800);
  patchLabels();
})();
