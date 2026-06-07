let sb=null,sel=null,dsel=null;
let D={modelos:[],tecnicos:[],locais:[],equipamentos:[],movimentos:[],inventario:[]};

const DEFAULT_URL='https://yuyeyawigbbjtzghkbbr.supabase.co';
const DEFAULT_KEY='sb_publishable_9DyOYVHN6035kbUjypbDkA_4zYHk_pI';

function $(id){return document.getElementById(id)}
function N(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
function today(){return new Date().toISOString().slice(0,10)}
function br(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function msg(id,text,cls=''){let el=$(id); if(el){el.textContent=text; el.className='msg '+cls}}
function db(){if(!sb)throw Error('Conecte ao Supabase primeiro.');return sb}
function opId(){return crypto&&crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(16).slice(2)}
async function rpcOne(name,params){const r=await db().rpc(name,params);if(r.error)throw r.error;return Array.isArray(r.data)?r.data[0]:r.data}
function isAtivo(e){return e&&e.ativo!==false&&e.status!=='Baixado'}
function cadAtivo(x){return !x||x.ativo!==false}

function saveCfg(){
  const c={url:$('url').value.trim(),key:$('key').value.trim(),email:$('email').value.trim(),pass:$('pass').value};
  localStorage.setItem('like_cfg_v26',JSON.stringify(c));
  msg('loginMsg','Configuração salva.','ok');
  return c;
}
function loadCfg(){
  try{const c=JSON.parse(localStorage.getItem('like_cfg_v26')||localStorage.getItem('like_cfg_v25')||'{}');
    $('url').value=c.url||DEFAULT_URL;$('key').value=c.key||DEFAULT_KEY;$('email').value=c.email||'';$('pass').value=c.pass||'';
  }catch(e){$('url').value=DEFAULT_URL;$('key').value=DEFAULT_KEY}
}
async function login(){
  try{
    const c=saveCfg();
    if(!c.url||!c.key||!c.email||!c.pass){msg('loginMsg','Preencha URL, chave, e-mail e senha.','bad');return}
    sb=supabase.createClient(c.url,c.key);
    const r=await sb.auth.signInWithPassword({email:c.email,password:c.pass});
    if(r.error)throw r.error;
    $('conn').textContent='● Online';$('conn').style.color='#dcfce7';$('st').textContent='Conectado como '+c.email;
    await loadAll();pg('dash');msg('loginMsg','Conectado.','ok');
  }catch(e){msg('loginMsg','Erro ao conectar: '+e.message,'bad')}
}
async function logout(){try{if(sb)await sb.auth.signOut()}catch(e){} sb=null;$('conn').textContent='● Offline';$('conn').style.color='';$('st').textContent='Sessão encerrada';pg('login')}
async function loadTable(t,order='id',asc=true){const r=await db().from(t).select('*').order(order,{ascending:asc});if(r.error)throw r.error;return r.data||[]}
async function loadAll(){
  D.modelos=await loadTable('modelos','tipo',true);
  D.tecnicos=await loadTable('tecnicos','nome',true);
  D.locais=await loadTable('locais','nome',true);
  D.equipamentos=(await loadTable('equipamentos','created_at',false)).map(fromEq);
  D.movimentos=await loadTable('movimentos','created_at',false);
  try{D.inventario=await loadTable('inventario','updated_at',false)}catch(e){D.inventario=[]}
  render();$('st').textContent='Dados carregados às '+new Date().toLocaleTimeString('pt-BR');
}
function fromEq(e){return {...e,tecnicoAtual:e.tecnico_atual||'',clienteAtual:e.cliente_atual||'',osAtual:e.os_atual||'',motivoAtual:e.motivo_atual||'',inutilizadoObs:e.inutilizado_obs||''}}
function toEq(e){return {codigo:e.codigo,patrimonio:e.patrimonio,tipo:e.tipo,marca:e.marca,modelo:e.modelo,mac:e.mac||null,serial:e.serial||null,status:e.status,local:e.local||null,tecnico_atual:e.tecnicoAtual||null,cliente_atual:e.clienteAtual||null,os_atual:e.osAtual||null,motivo_atual:e.motivoAtual||null,custo:Number(e.custo||0),inutilizado_obs:e.inutilizadoObs||null}}
async function ins(t,r){const x=await db().from(t).insert(r).select().single();if(x.error)throw x.error;return x.data}
async function upd(t,id,r){const x=await db().from(t).update(r).eq('id',id).select().single();if(x.error)throw x.error;return x.data}
async function del(t,id){throw Error('Exclusão direta bloqueada no frontend. Use desativação lógica via RPC.')}

function pg(p){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('on'));
  document.querySelectorAll('.nav').forEach(x=>x.classList.remove('on'));
  $('p-'+p).classList.add('on');
  document.querySelector(`[data-p="${p}"]`).classList.add('on');
  $('title').textContent=document.querySelector(`[data-p="${p}"]`).textContent;
  render();
}
function next(pre,field){let m=0;D.equipamentos.forEach(e=>{let x=String(e[field]||'').match(new RegExp('^'+pre+'-(\\d+)$','i'));if(x)m=Math.max(m,+x[1])});return pre+'-'+String(m+1).padStart(4,'0')}
async function mov(e,t,x={}){
  const r={equipamento_id:e.id,data:today(),tipo:t,codigo:e.codigo,mac:e.mac||null,serial:e.serial||null,tecnico:x.tec||'',destino:x.dest||'',cliente:x.cli||'',os:x.os||'',motivo:x.mot||'',condicao:x.cond||'',status_final:e.status,obs:x.obs||''};
  const saved=await ins('movimentos',r);D.movimentos.unshift(saved);
}

async function entrada(){
  try{
    const t=$('tipo').value,m=$('marca').value,mo=$('modelo').value,mac=$('mac').value.trim(),sn=$('serial').value.trim();
    if(!t||!m||!mo){msg('entMsg','Selecione tipo, marca e modelo. Cadastre o produto/modelo antes.','bad');return}
    if(!mac&&!sn){msg('entMsg','Informe MAC ou Serial/SN.','bad');return}
    if(D.equipamentos.some(e=>(mac&&N(e.mac)==N(mac))||(sn&&N(e.serial)==N(sn)))){msg('entMsg','Já existe equipamento com esse MAC ou Serial/SN.','bad');return}
    const e=fromEq(await rpcOne('rpc_registrar_entrada_equipamento',{
      p_tipo:t,p_marca:m,p_modelo:mo,p_mac:mac||null,p_serial:sn||null,p_local:$('local').value,
      p_custo:Number($('custo').value||0),p_observacao:$('obs').value,p_fornecedor:$('forn').value,
      p_nf:$('nf').value,p_responsavel:$('resp').value,p_client_operation_id:opId()
    }));
    ['mac','serial','custo','forn','nf','resp','obs'].forEach(i=>$(i).value='');
    await loadAll();render();msg('entMsg','Entrada registrada: '+e.codigo,'ok');
  }catch(e){msg('entMsg','Erro ao registrar entrada: '+e.message,'bad')}
}
function choose(id){sel=id;const e=D.equipamentos.find(x=>x.id==id);$('q').value=e.mac||e.serial||e.codigo;$('sugs').innerHTML='';$('prev').innerHTML=`<div class="item"><b>${esc(e.codigo)} • ${esc(e.modelo)}</b><span class="status">${esc(e.status)}</span></div>`}
function chooseD(id){dsel=id;const e=D.equipamentos.find(x=>x.id==id);$('dq').value=e.mac||e.serial||e.codigo;$('dsugs').innerHTML='';$('dprev').innerHTML=`<div class="item"><b>${esc(e.codigo)} • ${esc(e.modelo)}</b><span class="status">${esc(e.status)}</span></div>`}
function search(inp,out,fn){const q=N($(inp).value);$(out).innerHTML=q?D.equipamentos.filter(e=>N(Object.values(e).join(' ')).includes(q)).slice(0,10).map(e=>`<div class="sug" onclick="${fn}('${e.id}')"><b>${esc(e.codigo)}</b> ${esc(e.modelo)} • ${esc(e.mac||e.serial||'')} • ${esc(e.status)}</div>`).join(''):''}
async function saida(){
  try{
    const e=D.equipamentos.find(x=>x.id==sel);if(!e){msg('movMsg','Selecione equipamento.','bad');return}
    if(!isAtivo(e)||['Inutilizado','Perdido','Em manutenção','Baixado'].includes(e.status)){msg('movMsg','Esse status não permite saída: '+e.status,'bad');return}
    const saved=fromEq(await rpcOne('rpc_registrar_saida_equipamento',{
      p_equipamento_id:e.id,p_mov_tipo:$('movTipo').value,p_tecnico:$('movTec').value,p_destino:$('movDest').value,
      p_cliente:$('movCli').value,p_os:$('movOS').value,p_motivo:$('movMot').value,p_observacao:$('movObs').value,
      p_client_operation_id:opId()
    }));
    Object.assign(e,saved);
    sel=null;['q','movCli','movOS','movMot','movObs'].forEach(i=>$(i).value='');
    await loadAll();render();msg('movMsg','Saída registrada.','ok');
  }catch(e){msg('movMsg','Erro: '+e.message,'bad')}
}
async function devolucao(){
  try{
    const e=D.equipamentos.find(x=>x.id==dsel);if(!e){msg('devMsg','Selecione equipamento.','bad');return}
    const saved=fromEq(await rpcOne('rpc_registrar_devolucao_equipamento',{
      p_equipamento_id:e.id,p_tecnico:$('devTec').value,p_condicao:$('devCond').value,p_destino:$('devDest').value,
      p_os:$('devOS').value,p_motivo:$('devMot').value,p_observacao:$('devObs').value,p_client_operation_id:opId()
    }));
    Object.assign(e,saved);
    dsel=null;['dq','devOS','devMot','devObs'].forEach(i=>$(i).value='');
    await loadAll();render();msg('devMsg','Devolução registrada.','ok');
  }catch(e){msg('devMsg','Erro: '+e.message,'bad')}
}
async function manut(){
  try{
    const e=D.equipamentos.find(x=>x.id==$('manEq').value);if(!e){msg('manMsg','Selecione equipamento.','bad');return}
    const saved=fromEq(await rpcOne('rpc_registrar_manutencao_equipamento',{
      p_equipamento_id:e.id,p_resultado:$('manRes').value,p_observacao:$('manObs').value,p_client_operation_id:opId()
    }));
    Object.assign(e,saved);$('manObs').value='';await loadAll();render();msg('manMsg','Resultado registrado.','ok')
  }catch(e){msg('manMsg','Erro: '+e.message,'bad')}
}

async function addModelo(){
  try{const tipo=$('mmTipo').value.trim(),marca=$('mmMarca').value.trim(),modelo=$('mmModelo').value.trim();
    if(!tipo||!marca||!modelo){msg('modMsg','Preencha Tipo, Marca e Modelo.','bad');return}
    if(D.modelos.some(m=>cadAtivo(m)&&N(m.tipo)==N(tipo)&&N(m.marca)==N(marca)&&N(m.modelo)==N(modelo))){msg('modMsg','Esse produto/modelo já existe.','bad');return}
    await rpcOne('rpc_criar_modelo',{p_tipo:tipo,p_marca:marca,p_modelo:modelo,p_custo_padrao:Number($('mmCusto').value||0),p_estoque_minimo:Number($('mmMin').value||0),p_estoque_ideal:Number($('mmIdeal').value||0)});
    ['mmTipo','mmMarca','mmModelo','mmCusto','mmMin','mmIdeal'].forEach(i=>$(i).value='');await loadAll();render();msg('modMsg','Modelo salvo com segurança.','ok');
  }catch(e){msg('modMsg','Erro ao salvar modelo: '+e.message,'bad')}
}
async function editModelo(id){try{const m=D.modelos.find(x=>x.id==id);const tipo=prompt('Tipo:',m.tipo);if(tipo===null)return;const marca=prompt('Marca:',m.marca);if(marca===null)return;const modelo=prompt('Modelo:',m.modelo);if(modelo===null)return;const custo=prompt('Custo padrão:',m.custo_padrao||0);if(custo===null)return;const min=prompt('Estoque mínimo:',m.estoque_minimo||0);if(min===null)return;const ideal=prompt('Estoque ideal:',m.estoque_ideal||0);if(ideal===null)return;await rpcOne('rpc_editar_modelo',{p_modelo_id:id,p_tipo:tipo.trim(),p_marca:marca.trim(),p_modelo:modelo.trim(),p_custo_padrao:Number(custo||0),p_estoque_minimo:Number(min||0),p_estoque_ideal:Number(ideal||0)});await loadAll();render()}catch(e){alert('Erro ao editar modelo: '+e.message)}}
async function delModelo(id){try{const m=D.modelos.find(x=>x.id==id);if(!m)return;const motivo=prompt('Motivo para desativar modelo '+m.tipo+' '+m.marca+' '+m.modelo+':','Desativado pelo administrador');if(motivo===null)return;if(!motivo.trim()){alert('Informe o motivo.');return}await rpcOne('rpc_desativar_modelo',{p_modelo_id:id,p_motivo:motivo.trim()});await loadAll();render();alert('Modelo desativado. Histórico preservado.')}catch(e){alert('Erro ao desativar modelo: '+e.message)}}
async function addTec(){try{const nome=$('tecNome').value.trim();if(!nome){msg('tecMsg','Informe o nome do técnico.','bad');return}if(D.tecnicos.some(t=>cadAtivo(t)&&N(t.nome)==N(nome))){msg('tecMsg','Técnico já existe.','bad');return}await rpcOne('rpc_criar_tecnico',{p_nome:nome});$('tecNome').value='';await loadAll();render();msg('tecMsg','Técnico salvo com segurança.','ok')}catch(e){msg('tecMsg','Erro: '+e.message,'bad')}}
async function editTec(id){try{const t=D.tecnicos.find(x=>x.id==id);const nome=prompt('Nome do técnico:',t.nome);if(nome===null||!nome.trim())return;await rpcOne('rpc_editar_tecnico',{p_tecnico_id:id,p_nome:nome.trim()});await loadAll();render()}catch(e){alert('Erro: '+e.message)}}
async function delTec(id){try{const t=D.tecnicos.find(x=>x.id==id);if(!t)return;const motivo=prompt('Motivo para desativar técnico '+t.nome+':','Desativado pelo administrador');if(motivo===null)return;if(!motivo.trim()){alert('Informe o motivo.');return}await rpcOne('rpc_desativar_tecnico',{p_tecnico_id:id,p_motivo:motivo.trim()});await loadAll();render();alert('Técnico desativado. Histórico preservado.')}catch(e){alert('Erro ao desativar técnico: '+e.message)}}
async function addLocal(){try{const nome=$('locNome').value.trim(),tipo=$('locTipo').value;if(!nome){msg('locMsg','Informe o nome do local.','bad');return}if(D.locais.some(l=>cadAtivo(l)&&N(l.nome)==N(nome))){msg('locMsg','Local já existe.','bad');return}await rpcOne('rpc_criar_local',{p_nome:nome,p_tipo:tipo});$('locNome').value='';await loadAll();render();msg('locMsg','Local salvo com segurança.','ok')}catch(e){msg('locMsg','Erro: '+e.message,'bad')}}
async function editLocal(id){try{const l=D.locais.find(x=>x.id==id);const nome=prompt('Nome do local:',l.nome);if(nome===null||!nome.trim())return;const tipo=prompt('Tipo do local:',l.tipo||'Outro');if(tipo===null)return;await rpcOne('rpc_editar_local',{p_local_id:id,p_nome:nome.trim(),p_tipo:tipo.trim()||'Outro'});await loadAll();render()}catch(e){alert('Erro: '+e.message)}}
async function delLocal(id){try{const l=D.locais.find(x=>x.id==id);if(!l)return;if(l.fixo){alert('Local fixo não pode ser desativado.');return}const motivo=prompt('Motivo para desativar local '+l.nome+':','Desativado pelo administrador');if(motivo===null)return;if(!motivo.trim()){alert('Informe o motivo.');return}await rpcOne('rpc_desativar_local',{p_local_id:id,p_motivo:motivo.trim()});await loadAll();render();alert('Local desativado. Histórico preservado.')}catch(e){alert('Erro ao desativar local: '+e.message)}}
async function editEq(id){try{const e=D.equipamentos.find(x=>x.id==id);const status=prompt('Status:',e.status);if(status===null)return;const local=prompt('Local:',e.local||'');if(local===null)return;const tec=prompt('Técnico atual:',e.tecnicoAtual||'');if(tec===null)return;const cli=prompt('Cliente/local atual:',e.clienteAtual||'');if(cli===null)return;const os=prompt('OS/Contrato:',e.osAtual||'');if(os===null)return;const custo=prompt('Custo:',e.custo||0);if(custo===null)return;Object.assign(e,{status:status.trim(),local:local.trim(),tecnicoAtual:tec.trim(),clienteAtual:cli.trim(),osAtual:os.trim(),custo:Number(custo||0)});Object.assign(e,fromEq(await upd('equipamentos',id,toEq(e))));await mov(e,'Edição manual',{dest:e.local,tec:e.tecnicoAtual,cli:e.clienteAtual,os:e.osAtual,obs:'Alteração manual no cadastro do equipamento'});render()}catch(e){alert('Erro ao editar equipamento: '+e.message)}}
async function delEq(id){try{const e=D.equipamentos.find(x=>x.id==id);if(!e)return;const motivo=prompt('Motivo da baixa do equipamento '+e.codigo+':',e.motivoAtual||'');if(motivo===null)return;if(!motivo.trim()){alert('Informe o motivo da baixa.');return}const saved=fromEq(await rpcOne('rpc_baixar_equipamento',{p_equipamento_id:e.id,p_motivo:motivo.trim(),p_client_operation_id:opId()}));Object.assign(e,saved);await loadAll();render();alert('Equipamento baixado com histórico preservado: '+e.codigo)}catch(e){alert('Erro ao baixar equipamento: '+e.message)}}
async function inutilizarEq(id){try{const e=D.equipamentos.find(x=>x.id==id);const motivo=prompt('Motivo da inutilização:',e.motivoAtual||'');if(motivo===null)return;if(!motivo.trim()){alert('Informe o motivo da inutilização.');return}const saved=fromEq(await rpcOne('rpc_registrar_manutencao_equipamento',{p_equipamento_id:e.id,p_resultado:'Inutilizar',p_observacao:motivo.trim(),p_client_operation_id:opId()}));Object.assign(e,saved);await loadAll();render()}catch(e){alert('Erro ao inutilizar: '+e.message)}}

function techItems(nome){return D.equipamentos.filter(e=>isAtivo(e)&&e.tecnicoAtual==nome && !['Em estoque','Inutilizado','Perdido','Baixado'].includes(e.status))}
function renderTechStock(){
  const tecnicosAtivos=D.tecnicos.filter(cadAtivo);
  $('techStockBox').innerHTML=tecnicosAtivos.map(t=>{const itens=techItems(t.nome);const valor=itens.reduce((s,e)=>s+Number(e.custo||0),0);return `<div class="card"><h2>${esc(t.nome)} <span class="status">${itens.length} item(ns)</span> <span class="status ok">${br(valor)}</span></h2>${itens.length?`<div class="tbl"><table><thead><tr><th>Código</th><th>Modelo</th><th>MAC/SN</th><th>Status</th><th>Local</th><th>Cliente/backup</th><th>OS</th><th>Ações</th></tr></thead><tbody>${itens.map(e=>`<tr><td>${esc(e.codigo)}</td><td>${esc(e.tipo)} ${esc(e.marca)} ${esc(e.modelo)}</td><td>${esc(e.mac||e.serial||'')}</td><td>${esc(e.status)}</td><td>${esc(e.local||'')}</td><td>${esc(e.clienteAtual||'')}</td><td>${esc(e.osAtual||'')}</td><td><button onclick="editEq('${e.id}')">Editar</button><button class="warn" onclick="inutilizarEq('${e.id}')">Inutilizar</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="msg">Sem equipamento em posse.</div>'}</div>`}).join('')||'<div class="msg">Nenhum técnico cadastrado.</div>';
}
function render(){
  const modelosAtivos=D.modelos.filter(cadAtivo), tecnicosAtivos=D.tecnicos.filter(cadAtivo), locaisAtivos=D.locais.filter(cadAtivo);
  $('cod').value=next('EQP','codigo');$('pat').value=next('PAT','patrimonio');
  const old={tipo:$('tipo').value,marca:$('marca').value,modelo:$('modelo').value};
  const tipos=[...new Set(modelosAtivos.map(m=>m.tipo).filter(Boolean))].sort();
  const marcas=[...new Set(modelosAtivos.map(m=>m.marca).filter(Boolean))].sort();
  $('tipo').innerHTML='<option value="">Tipo</option>'+tipos.map(x=>`<option>${esc(x)}</option>`).join('');
  $('marca').innerHTML='<option value="">Marca</option>'+marcas.map(x=>`<option>${esc(x)}</option>`).join('');
  if(tipos.includes(old.tipo))$('tipo').value=old.tipo;if(marcas.includes(old.marca))$('marca').value=old.marca;
  const mods=modelosAtivos.filter(m=>(!$('tipo').value||m.tipo==$('tipo').value)&&(!$('marca').value||m.marca==$('marca').value));
  $('modelo').innerHTML='<option value="">Modelo</option>'+mods.map(m=>`<option>${esc(m.modelo)}</option>`).join('');
  if(mods.some(m=>m.modelo==old.modelo))$('modelo').value=old.modelo;
  const curLocal=$('local').value, curDest=$('movDest').value;
  ['local','movDest'].forEach(i=>{$(i).innerHTML=locaisAtivos.map(l=>`<option>${esc(l.nome)}</option>`).join('')});
  if(locaisAtivos.some(l=>l.nome==curLocal))$('local').value=curLocal;if(locaisAtivos.some(l=>l.nome==curDest))$('movDest').value=curDest;
  ['movTec','devTec'].forEach(i=>{$(i).innerHTML='<option value="">Técnico</option>'+tecnicosAtivos.map(t=>`<option>${esc(t.nome)}</option>`).join('')});
  const ativos=D.equipamentos.filter(isAtivo);
  const est=ativos.filter(e=>e.status=='Em estoque');
  $('kTot').textContent=ativos.length;$('kEst').textContent=est.length;$('kTec').textContent=ativos.filter(e=>e.status=='Com técnico').length;$('kRua').textContent=ativos.filter(e=>['Na rua','Instalado cliente','Reservado'].includes(e.status)).length;
  $('statusBox').innerHTML=['Em estoque','Com técnico','Instalado cliente','Na rua','Reservado','Em manutenção','Inutilizado','Perdido','Baixado'].map(s=>`<div class="item"><b>${s}</b><span class="status">${D.equipamentos.filter(e=>e.status==s).length}</span></div>`).join('');
  $('alertBox').innerHTML=modelosAtivos.map(m=>{const qtd=est.filter(e=>e.tipo==m.tipo&&e.marca==m.marca&&e.modelo==m.modelo).length;const min=Number(m.estoque_minimo||0);return min&&qtd<min?`<div class="item"><b>${esc(m.tipo)} ${esc(m.marca)} ${esc(m.modelo)}</b><span class="status bad">${qtd}/${min}</span></div>`:''}).join('')||'Nenhum alerta.';
  const f=N($('f').value);
  $('eqT').innerHTML=D.equipamentos.filter(e=>N(Object.values(e).join(' ')).includes(f)).map(e=>`<tr><td>${esc(e.codigo)}</td><td>${esc(e.tipo)}</td><td>${esc(e.marca)}</td><td>${esc(e.modelo)}</td><td>${esc(e.mac||'')}</td><td>${esc(e.serial||'')}</td><td>${esc(e.status)}</td><td>${esc(e.local||'')}</td><td>${esc(e.tecnicoAtual||'')}</td><td>${esc(e.clienteAtual||'')}</td><td><button onclick="editEq('${e.id}')">Editar</button><button class="warn" onclick="inutilizarEq('${e.id}')">Inutilizar</button>${isAtivo(e)?`<button class="bad" onclick="delEq('${e.id}')">Baixar</button>`:'<span class="status bad">Baixado</span>'}</td></tr>`).join('')||'<tr><td colspan="11">Nenhum equipamento.</td></tr>';
  $('estT').innerHTML=est.map(e=>`<tr><td>${esc(e.codigo)}</td><td>${esc(e.modelo)}</td><td>${esc(e.mac||e.serial||'')}</td><td>${esc(e.patrimonio)}</td><td>${br(e.custo)}</td><td><button onclick="editEq('${e.id}')">Editar</button><button class="warn" onclick="inutilizarEq('${e.id}')">Inutilizar</button></td></tr>`).join('')||'<tr><td colspan="6">Nenhum item em estoque.</td></tr>';
  $('modelTable').innerHTML=modelosAtivos.map(m=>{const qtd=est.filter(e=>e.tipo==m.tipo&&e.marca==m.marca&&e.modelo==m.modelo).length;return`<tr><td>${esc(m.tipo)}</td><td>${esc(m.marca)}</td><td>${esc(m.modelo)}</td><td>${br(m.custo_padrao)}</td><td>${m.estoque_minimo||0}</td><td>${m.estoque_ideal||0}</td><td>${qtd}</td><td><button onclick="editModelo('${m.id}')">Editar</button><button class="bad" onclick="delModelo('${m.id}')">Desativar</button></td></tr>`}).join('')||'<tr><td colspan="8">Nenhum modelo cadastrado.</td></tr>';
  $('tecList').innerHTML=tecnicosAtivos.map(t=>`<div class="item"><b>${esc(t.nome)}</b><span><button onclick="editTec('${t.id}')">Editar</button><button class="bad" onclick="delTec('${t.id}')">Desativar</button></span></div>`).join('')||'Nenhum técnico.';
  $('locList').innerHTML=locaisAtivos.map(l=>`<div class="item"><b>${esc(l.nome)}</b><span>${esc(l.tipo||'Outro')} ${l.fixo?'<span class="status">Fixo</span>':`<button onclick="editLocal('${l.id}')">Editar</button><button class="bad" onclick="delLocal('${l.id}')">Desativar</button>`}</span></div>`).join('')||'Nenhum local.';
  $('manEq').innerHTML='<option value="">Selecione</option>'+D.equipamentos.filter(e=>isAtivo(e)&&e.status=='Em manutenção').map(e=>`<option value="${e.id}">${esc(e.codigo)} • ${esc(e.modelo)}</option>`).join('');
  const hf=N($('histFilter').value);
  $('histT').innerHTML=D.movimentos.filter(m=>N(Object.values(m).join(' ')).includes(hf)).map(m=>`<tr><td>${esc(m.data||'')}</td><td>${esc(m.tipo||'')}</td><td>${esc(m.codigo||'')}</td><td>${esc(m.mac||m.serial||'')}</td><td>${esc(m.tecnico||'')}</td><td>${esc(m.destino||'')}</td><td>${esc(m.cliente||'')}</td><td>${esc(m.os||'')}</td><td>${esc(m.status_final||'')}</td><td>${esc(m.obs||'')}</td></tr>`).join('')||'<tr><td colspan="10">Sem histórico.</td></tr>';
  renderTechStock();
}

document.addEventListener('DOMContentLoaded',()=>{
  loadCfg();
  document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>pg(b.dataset.p));
  $('save').onclick=saveCfg;$('login').onclick=login;$('logout').onclick=logout;$('reload').onclick=()=>loadAll().catch(e=>alert(e.message));
  $('entrada').onclick=entrada;$('q').oninput=()=>search('q','sugs','choose');$('dq').oninput=()=>search('dq','dsugs','chooseD');
  $('saida').onclick=saida;$('devolver').onclick=devolucao;$('manBtn').onclick=manut;
  $('addModelo').onclick=addModelo;$('addTec').onclick=addTec;$('addLocal').onclick=addLocal;
  ['tipo','marca','f','histFilter'].forEach(i=>$(i).oninput=render);
  $('tipo').onchange=render;$('marca').onchange=render;
  render();
});
