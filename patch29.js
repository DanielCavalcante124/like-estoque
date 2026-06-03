/* LIKE Estoque V29 - edição inline e relatório melhorado */
(function(){
  const statusList=['Em estoque','Com técnico','Instalado cliente','Na rua','Reservado','Em manutenção','Inutilizado','Perdido'];
  function byId(id){return document.getElementById(id)}
  function E(v){return esc(v??'')}
  function opt(list,val,placeholder=''){return (placeholder?`<option value="">${placeholder}</option>`:'')+list.map(x=>`<option value="${E(x)}" ${x===val?'selected':''}>${E(x)}</option>`).join('')}
  function locOpts(val){return opt(D.locais.map(l=>l.nome),val,'Local')}
  function tecOpts(val){return opt(D.tecnicos.map(t=>t.nome),val,'Técnico')}
  function modelFull(e){return `${E(e.tipo)} ${E(e.marca)} ${E(e.modelo)}`}
  function lastMovement(e){return D.movimentos.find(m=>m.equipamento_id===e.id||m.codigo===e.codigo)||null}
  function daysSince(dateStr){if(!dateStr)return null;const d=new Date(dateStr+'T00:00:00');if(isNaN(d))return null;return Math.floor((Date.now()-d.getTime())/86400000)}
  function addStyle(){if(byId('patch29style'))return;const s=document.createElement('style');s.id='patch29style';s.textContent=`.inlineInput,.inlineSelect{min-width:120px;padding:7px;border:1px solid #cbd5e1;border-radius:8px;margin:0}.inlineSmall{min-width:80px}.saveOk{outline:2px solid #22c55e}.reportHead{display:grid;grid-template-columns:1.2fr repeat(3,.6fr);gap:10px;margin:12px 0}.reportKpi{border:1px solid #dbe4ef;background:#f8fafc;border-radius:16px;padding:12px}.reportKpi b{font-size:24px;display:block}.reportWarn{background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:12px;margin:10px 0}.signatureGrid{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:40px}.lineSign{border-top:1px solid #111;padding-top:8px;text-align:center}@media print{#reportArea .card{box-shadow:none;border:0}.reportHead{grid-template-columns:repeat(4,1fr)}button,.quickTop,.side,.top{display:none!important}}`;document.head.appendChild(s)}
  window.saveInlineEq=async function(id){
    try{
      const e=D.equipamentos.find(x=>x.id===id); if(!e)return;
      const prefix='in_'+id.replaceAll('-','_')+'_';
      const oldStatus=e.status;
      e.status=byId(prefix+'status').value;
      e.local=byId(prefix+'local').value;
      e.tecnicoAtual=byId(prefix+'tec').value;
      e.clienteAtual=byId(prefix+'cli').value.trim();
      e.osAtual=byId(prefix+'os').value.trim();
      e.custo=Number(byId(prefix+'custo')?.value||e.custo||0);
      if(e.status==='Em estoque'){e.tecnicoAtual='';e.clienteAtual=''}
      if(['Inutilizado','Perdido'].includes(e.status)){e.local=e.status}
      Object.assign(e,fromEq(await upd('equipamentos',id,toEq(e))));
      await mov(e,'Edição inline',{tec:e.tecnicoAtual,dest:e.local,cli:e.clienteAtual,os:e.osAtual,mot:'Edição na tabela',obs:`Alterado na própria tabela. Status anterior: ${oldStatus}`});
      render();
    }catch(err){alert('Erro ao salvar: '+err.message)}
  };
  window.cancelInlineRender=function(){render()};
  function inlineRow(e,mode='full'){
    const p='in_'+e.id.replaceAll('-','_')+'_';
    const macsn=E(e.mac||e.serial||'');
    const actions=`<button class="ok" onclick="saveInlineEq('${e.id}')">Salvar</button><button onclick="showEqHistory('${e.id}')">Histórico</button><button class="warn" onclick="inutilizarEq('${e.id}')">Inutilizar</button>`;
    if(mode==='central')return `<tr><td><b>${E(e.codigo)}</b></td><td>${modelFull(e)}</td><td>${macsn}</td><td>${E(e.patrimonio)}</td><td><input id="${p}custo" class="inlineInput inlineSmall" type="number" value="${E(e.custo||0)}"></td><td><select id="${p}status" class="inlineSelect">${opt(statusList,e.status)}</select><select id="${p}local" class="inlineSelect">${locOpts(e.local)}</select>${actions}</td></tr>`;
    return `<tr><td><b>${E(e.codigo)}</b><br><small>${E(e.patrimonio||'')}</small></td><td>${E(e.tipo)}</td><td>${E(e.marca)}</td><td>${E(e.modelo)}</td><td>${E(e.mac||'')}</td><td>${E(e.serial||'')}</td><td><select id="${p}status" class="inlineSelect">${opt(statusList,e.status)}</select></td><td><select id="${p}local" class="inlineSelect">${locOpts(e.local)}</select></td><td><select id="${p}tec" class="inlineSelect">${tecOpts(e.tecnicoAtual)}</select></td><td><input id="${p}cli" class="inlineInput" value="${E(e.clienteAtual||'')}" placeholder="Cliente/backup"><input id="${p}os" class="inlineInput inlineSmall" value="${E(e.osAtual||'')}" placeholder="OS"><input id="${p}custo" class="inlineInput inlineSmall" type="number" value="${E(e.custo||0)}" placeholder="Custo"></td><td>${actions}</td></tr>`;
  }
  function renderInlineTables(){
    const est=D.equipamentos.filter(e=>e.status==='Em estoque');
    const f=N(byId('f')?.value||'');
    if(byId('eqT'))byId('eqT').innerHTML=D.equipamentos.filter(e=>N(Object.values(e).join(' ')).includes(f)).map(e=>inlineRow(e)).join('')||'<tr><td colspan="11">Nenhum equipamento.</td></tr>';
    if(byId('estT'))byId('estT').innerHTML=est.map(e=>inlineRow(e,'central')).join('')||'<tr><td colspan="6">Nenhum item em estoque.</td></tr>';
  }
  function techReportData(tec){
    const itens=D.equipamentos.filter(e=>e.tecnicoAtual===tec&&!['Em estoque','Inutilizado','Perdido'].includes(e.status));
    const valor=itens.reduce((s,e)=>s+Number(e.custo||0),0);
    const byStatus={}; itens.forEach(e=>byStatus[e.status]=(byStatus[e.status]||0)+1);
    const rows=itens.map(e=>{const lm=lastMovement(e);const dias=daysSince(lm?.data);return {e,lm,dias}}).sort((a,b)=>(b.dias||0)-(a.dias||0));
    return {itens,valor,byStatus,rows,criticos:rows.filter(r=>(r.dias||0)>=15)};
  }
  window.generateBetterReport=function(){
    const sel=byId('reportTec'); const tec=sel?.value;
    if(!tec){byId('reportMsg').textContent='Escolha um técnico.';byId('reportMsg').className='msg bad';byId('reportArea').innerHTML='';return}
    const data=techReportData(tec);
    byId('reportMsg').textContent=`Relatório gerado: ${data.itens.length} item(ns), ${data.criticos.length} pendência(s) acima de 15 dias.`;
    byId('reportMsg').className='msg ok';
    const statusHtml=Object.entries(data.byStatus).map(([s,q])=>`<span class="status">${E(s)}: ${q}</span>`).join(' ')||'<span class="status ok">Sem itens</span>';
    const critHtml=data.criticos.length?`<div class="reportWarn"><b>Atenção:</b> ${data.criticos.length} equipamento(s) estão há 15 dias ou mais desde a última movimentação. Priorizar conferência física e devolução.</div>`:'';
    byId('reportArea').innerHTML=`<div class="card"><h2>Relatório de responsabilidade técnica</h2><p><b>Técnico:</b> ${E(tec)}<br><b>Empresa:</b> LIKE internet<br><b>Data:</b> ${new Date().toLocaleString('pt-BR')}</p><div class="reportHead"><div class="reportKpi"><small>Status</small><br>${statusHtml}</div><div class="reportKpi"><small>Itens em posse</small><b>${data.itens.length}</b></div><div class="reportKpi"><small>Valor estimado</small><b>${br(data.valor)}</b></div><div class="reportKpi"><small>Pendências 15+ dias</small><b>${data.criticos.length}</b></div></div>${critHtml}<div class="tbl"><table><thead><tr><th>Código</th><th>Equipamento</th><th>MAC/SN</th><th>Status</th><th>Local</th><th>Cliente/OS</th><th>Última mov.</th><th>Dias</th><th>Observação conferência</th></tr></thead><tbody>${data.rows.map(r=>`<tr class="${(r.dias||0)>=15?'warnLine':''}"><td>${E(r.e.codigo)}</td><td>${modelFull(r.e)}</td><td>${E(r.e.mac||r.e.serial||'')}</td><td>${E(r.e.status)}</td><td>${E(r.e.local||'')}</td><td>${E(r.e.clienteAtual||'')} ${E(r.e.osAtual||'')}</td><td>${r.lm?E(r.lm.data)+' - '+E(r.lm.tipo):'Sem histórico'}</td><td>${r.dias??'-'}</td><td>☐ Conferido &nbsp; ☐ Devolver &nbsp; ☐ Divergente</td></tr>`).join('')||'<tr><td colspan="9">Sem itens em posse.</td></tr>'}</tbody></table></div><div class="signatureGrid"><div class="lineSign">Assinatura do técnico</div><div class="lineSign">Conferente / Estoquista</div></div></div>`;
  };
  function hookReport(){
    const btn=byId('reportBtn'); if(btn)btn.onclick=window.generateBetterReport;
    const print=byId('printReport'); if(print)print.onclick=()=>{if(!byId('reportArea')?.innerHTML.trim())window.generateBetterReport();setTimeout(()=>window.print(),150)};
    const copy=byId('copyReport'); if(copy)copy.onclick=()=>navigator.clipboard.writeText(byId('reportArea')?.innerText||'');
  }
  const oldRender29=render;
  render=function(){oldRender29();renderInlineTables();hookReport()};
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{addStyle();renderInlineTables();hookReport()},500));
})();