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
async function del(t,id){const x=await db().from(t).delete().eq('id',id);if(x.error)throw x.error}

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
    let e={codigo:next('EQP','codigo'),patrimonio:next('PAT','patrimonio'),tipo:t,marca:m,modelo:mo,mac:mac||null,serial:sn||null,status:'Em estoque',local:$('local').value,custo:Number($('custo').value||0)};
    e=fromEq(await ins('equipamentos',toEq(e)));D.equipamentos.unshift(e);
    try{await ins('inventario',{equipamento_id:e.id,conferido:false,data:null,obs:null})}catch(_e){}
    await mov(e,'Entrada de estoque',{dest:e.local,obs:$('obs').value,mot:'Entrada'});
    ['mac','serial','custo','forn','nf','resp','obs'].forEach(i=>$(i).value='');render();msg('entMsg','Entrada registrada: '+e.codigo,'ok');
  }catch(e){msg('entMsg','Erro ao registrar entrada: '+e.message,'bad')}
}
function choose(id){sel=id;const e=D.equipamentos.find(x=>x.id==id);$('q').value=e.mac||e.serial||e.codigo;$('sugs').innerHTML='';$('prev').innerHTML=`<div class="item"><b>${esc(e.codigo)} • ${esc(e.modelo)}</b><span class="status">${esc(e.status)}</span></div>`}
function chooseD(id){dsel=id;const e=D.equipamentos.find(x=>x.id==id);$('dq').value=e.mac||e.serial||e.codigo;$('dsugs').innerHTML='';$('dprev').innerHTML=`<div class="item"><b>${esc(e.codigo)} • ${esc(e.modelo)}</b><span class="status">${esc(e.status)}</span></div>`}
function search(inp,out,fn){const q=N($(inp).value);$(out).innerHTML=q?D.equipamentos.filter(e=>N(Object.values(e).join(' ')).includes(q)).slice(0,10).map(e=>`<div class="sug" onclick="${fn}('${e.id}')"><b>${esc(e.codigo)}</b> ${esc(e.modelo)} • ${esc(e.mac||e.serial||'')} • ${esc(e.status)}</div>`).join(''):''}
async function saida(){
  try{
    const e=D.equipamentos.find(x=>x.id==sel);if(!e){msg('movMsg','Selecione equipamento.','bad');return}
    if(['Inutilizado','Perdido','Em manutenção'].includes(e.status)){msg('movMsg','Esse status não permite saída: '+e.status,'bad');return}
    e.status=$('movTipo').value=='Instalação cliente'?'Instalado cliente':$('movTipo').value=='Enviar para rua'?'Na rua':$('movTipo').value=='Reservar para OS'?'Reservado':'Com técnico';
    e.local=$('movDest').value;e.tecnicoAtual=$('movTec').value;e.clienteAtual=$('movCli').value;e.osAtual=$('movOS').value;e.motivoAtual=$('movMot').value;
    await upd('equipamentos',e.id,toEq(e));await mov(e,$('movTipo').value,{tec:e.tecnicoAtual,dest:e.local,cli:e.clienteAtual,os:e.osAtual,mot:e.motivoAtual,obs:$('movObs').value});
    sel=null;['q','movCli','movOS','movMot','movObs'].forEach(i=>$(i).value='');render();msg('movMsg','Saída registrada.','ok');
  }catch(e){msg('movMsg','Erro: '+e.message,'bad')}
}
async function devolucao(){
  try{
    const e=D.equipamentos.find(x=>x.id==dsel);if(!e){msg('devMsg','Selecione equipamento.','bad');return}
    const dest=$('devDest').value;
    e.status=dest=='Manutenção/Teste'?'Em manutenção':dest=='Inutilizado'?'Inutilizado':dest=='Perdido'?'Perdido':'Em estoque';
    e.local=dest=='Manutenção/Teste'?'Bancada técnica':dest;
    e.tecnicoAtual=e.status=='Em estoque'?'':$('devTec').value;e.clienteAtual='';e.osAtual=$('devOS').value;e.motivoAtual=$('devMot').value||$('devCond').value;e.inutilizadoObs=$('devObs').value;
    await upd('equipamentos',e.id,toEq(e));await mov(e,'Devolução',{tec:$('devTec').value,dest,os:e.osAtual,mot:e.motivoAtual,cond:$('devCond').value,obs:$('devObs').value});
    dsel=null;['dq','devOS','devMot','devObs'].forEach(i=>$(i).value='');render();msg('devMsg','Devolução registrada.','ok');
  }catch(e){msg('devMsg','Erro: '+e.message,'bad')}
}
async function manut(){
  try{
    const e=D.equipamentos.find(x=>x.id==$('manEq').value);if(!e){msg('manMsg','Selecione equipamento.','bad');return}
    const r=$('manRes').value;
    e.status=r.startsWith('Aprovado')?'Em estoque':r.startsWith('Inutilizar')?'Inutilizado':'Em manutenção';
    e.local=e.status=='Em estoque'?'Estoque central':r.startsWith('Enviar')?'Garantia':e.status=='Inutilizado'?'Inutilizado':'Bancada técnica';
    e.motivoAtual=r;e.inutilizadoObs=$('manObs').value;
    await upd('equipamentos',e.id,toEq(e));await mov(e,'Manutenção/Teste',{dest:e.local,mot:r,obs:$('manObs').value});$('manObs').value='';render();msg('manMsg','Resultado registrado.','ok');
  }catch(e){msg('manMsg','Erro: '+e.message,'bad')}
}

async function addModelo(){
  try{const tipo=$('mmTipo').value.trim(),marca=$('mmMarca').value.trim(),modelo=$('mmModelo').value.trim();
    if(!tipo||!marca||!modelo){msg('modMsg','Preencha Tipo, Marca e Modelo.','bad');return}
    if(D.modelos.some(m=>N(m.tipo)==N(tipo)&&N(m.marca)==N(marca)&&N(m.modelo)==N(modelo))){msg('modMsg','Esse produto/modelo já existe.','bad');return}
    const saved=await ins('modelos',{tipo,marca,modelo,custo_padrao:Number($('mmCusto').value||0),estoque_minimo:Number($('mmMin').value||0),estoque_ideal:Number($('mmIdeal').value||0)});
    D.modelos.push(saved);['mmTipo','mmMarca','mmModelo','mmCusto','mmMin','mmIdeal'].forEach(i=>$(i).value='');render();msg('modMsg','Modelo adicionado.','ok');
  }catch(e){msg('modMsg','Erro ao adicionar modelo: '+e.message,'bad')}
}
async function editModelo(id){try{const m=D.modelos.find(x=>x.id==id);const tipo=prompt('Tipo:',m.tipo);if(tipo===null)return;const marca=prompt('Marca:',m.marca);if(marca===null)return;const modelo=prompt('Modelo:',m.modelo);if(modelo===null)return;const custo=prompt('Custo padrão:',m.custo_padrao||0);if(custo===null)return;const min=prompt('Estoque mínimo:',m.estoque_minimo||0);if(min===null)return;const ideal=prompt('Estoque ideal:',m.estoque_ideal||0);if(ideal===null)return;const saved=await upd('modelos',id,{tipo:tipo.trim(),marca:marca.trim(),modelo:modelo.trim(),custo_padrao:Number(custo||0),estoque_minimo:Number(min||0),estoque_ideal:Number(ideal||0)});Object.assign(m,saved);render()}catch(e){alert('Erro ao editar modelo: '+e.message)}}
async function delModelo(id){try{const m=D.modelos.find(x=>x.id==id);if(!confirm('Excluir modelo '+m.tipo+' '+m.marca+' '+m.modelo+'?'))return;await del('modelos',id);D.modelos=D.modelos.filter(x=>x.id!=id);render()}catch(e){alert('Erro ao excluir modelo: '+e.message)}}
async function addTec(){try{const nome=$('tecNome').value.trim();if(!nome){msg('tecMsg','Informe o nome do técnico.','bad');return}if(D.tecnicos.some(t=>N(t.nome)==N(nome))){msg('tecMsg','Técnico já existe.','bad');return}const saved=await ins('tecnicos',{nome,ativo:true});D.tecnicos.push(saved);$('tecNome').value='';render();msg('tecMsg','Técnico adicionado.','ok')}catch(e){msg('tecMsg','Erro: '+e.message,'bad')}}
async function editTec(id){try{const t=D.tecnicos.find(x=>x.id==id);const nome=prompt('Nome do técnico:',t.nome);if(nome===null||!nome.trim())return;const saved=await upd('tecnicos',id,{nome:nome.trim()});Object.assign(t,saved);render()}catch(e){alert('Erro: '+e.message)}}
async function delTec(id){try{const t=D.tecnicos.find(x=>x.id==id);if(!confirm('Excluir técnico '+t.nome+'?'))return;await del('tecnicos',id);D.tecnicos=D.tecnicos.filter(x=>x.id!=id);render()}catch(e){alert('Erro: '+e.message)}}
async function addLocal(){try{const nome=$('locNome').value.trim(),tipo=$('locTipo').value;if(!nome){msg('locMsg','Informe o nome do local.','bad');return}if(D.locais.some(l=>N(l.nome)==N(nome))){msg('locMsg','Local já existe.','bad');return}const saved=await ins('locais',{nome,tipo,fixo:false});D.locais.push(saved);$('locNome').value='';render();msg('locMsg','Local adicionado.','ok')}catch(e){msg('locMsg','Erro: '+e.message,'bad')}}
async function editLocal(id){try{const l=D.locais.find(x=>x.id==id);const nome=prompt('Nome do local:',l.nome);if(nome===null||!nome.trim())return;const tipo=prompt('Tipo do local:',l.tipo||'Outro');if(tipo===null)return;const saved=await upd('locais',id,{nome:nome.trim(),tipo:tipo.trim()||'Outro'});Object.assign(l,saved);render()}catch(e){alert('Erro: '+e.message)}}
async function delLocal(id){try{const l=D.locais.find(x=>x.id==id);if(l.fixo){alert('Local fixo não pode ser excluído.');return}if(D.equipamentos.some(e=>e.local==l.nome)){alert('Local em uso por equipamento. Altere o local dos equipamentos antes.');return}if(!confirm('Excluir local '+l.nome+'?'))return;await del('locais',id);D.locais=D.locais.filter(x=>x.id!=id);render()}catch(e){alert('Erro: '+e.message)}}
async function editEq(id){try{const e=D.equipamentos.find(x=>x.id==id);const status=prompt('Status:',e.status);if(status===null)return;const local=prompt('Local:',e.local||'');if(local===null)return;const tec=prompt('Técnico atual:',e.tecnicoAtual||'');if(tec===null)return;const cli=prompt('Cliente/local atual:',e.clienteAtual||'');if(cli===null)return;const os=prompt('OS/Contrato:',e.osAtual||'');if(os===null)return;const custo=prompt('Custo:',e.custo||0);if(custo===null)return;Object.assign(e,{status:status.trim(),local:local.trim(),tecnicoAtual:tec.trim(),clienteAtual:cli.trim(),osAtual:os.trim(),custo:Number(custo||0)});Object.assign(e,fromEq(await upd('equipamentos',id,toEq(e))));await mov(e,'Edição manual',{dest:e.local,tec:e.tecnicoAtual,cli:e.clienteAtual,os:e.osAtual,obs:'Alteração manual no cadastro do equipamento'});render()}catch(e){alert('Erro ao editar equipamento: '+e.message)}}
async function delEq(id){try{const e=D.equipamentos.find(x=>x.id==id);if(!confirm('Excluir definitivamente o equipamento '+e.codigo+'?'))return;await del('equipamentos',id);D.equipamentos=D.equipamentos.filter(x=>x.id!=id);render()}catch(e){alert('Erro ao excluir equipamento: '+e.message)}}
async function inutilizarEq(id){try{const e=D.equipamentos.find(x=>x.id==id);const motivo=prompt('Motivo da inutilização:',e.motivoAtual||'');if(motivo===null)return;e.status='Inutilizado';e.local='Inutilizado';e.motivoAtual=motivo;e.inutilizadoObs=motivo;Object.assign(e,fromEq(await upd('equipamentos',id,toEq(e))));await mov(e,'Inutilização',{dest:'Inutilizado',mot:motivo,obs:motivo});render()}catch(e){alert('Erro ao inutilizar: '+e.message)}}

function techItems(nome){return D.equipamentos.filter(e=>e.tecnicoAtual==nome && !['Em estoque','Inutilizado','Perdido'].includes(e.status))}
function renderTechStock(){
  $('techStockBox').innerHTML=D.tecnicos.map(t=>{const itens=techItems(t.nome);const valor=itens.reduce((s,e)=>s+Number(e.custo||0),0);return `<div class="card"><h2>${esc(t.nome)} <span class="status">${itens.length} item(ns)</span> <span class="status ok">${br(valor)}</span></h2>${itens.length?`<div class="tbl"><table><thead><tr><th>Código</th><th>Modelo</th><th>MAC/SN</th><th>Status</th><th>Local</th><th>Cliente/backup</th><th>OS</th><th>Ações</th></tr></thead><tbody>${itens.map(e=>`<tr><td>${esc(e.codigo)}</td><td>${esc(e.tipo)} ${esc(e.marca)} ${esc(e.modelo)}</td><td>${esc(e.mac||e.serial||'')}</td><td>${esc(e.status)}</td><td>${esc(e.local||'')}</td><td>${esc(e.clienteAtual||'')}</td><td>${esc(e.osAtual||'')}</td><td><button onclick="editEq('${e.id}')">Editar</button><button class="warn" onclick="inutilizarEq('${e.id}')">Inutilizar</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="msg">Sem equipamento em posse.</div>'}</div>`}).join('')||'<div class="msg">Nenhum técnico cadastrado.</div>';
}
function render(){
  $('cod').value=next('EQP','codigo');$('pat').value=next('PAT','patrimonio');
  const old={tipo:$('tipo').value,marca:$('marca').value,modelo:$('modelo').value};
  const tipos=[...new Set(D.modelos.map(m=>m.tipo).filter(Boolean))].sort();
  const marcas=[...new Set(D.modelos.map(m=>m.marca).filter(Boolean))].sort();
  $('tipo').innerHTML='<option value="">Tipo</option>'+tipos.map(x=>`<option>${esc(x)}</option>`).join('');
  $('marca').innerHTML='<option value="">Marca</option>'+marcas.map(x=>`<option>${esc(x)}</option>`).join('');
  if(tipos.includes(old.tipo))$('tipo').value=old.tipo;if(marcas.includes(old.marca))$('marca').value=old.marca;
  const mods=D.modelos.filter(m=>(!$('tipo').value||m.tipo==$('tipo').value)&&(!$('marca').value||m.marca==$('marca').value));
  $('modelo').innerHTML='<option value="">Modelo</option>'+mods.map(m=>`<option>${esc(m.modelo)}</option>`).join('');
  if(mods.some(m=>m.modelo==old.modelo))$('modelo').value=old.modelo;
  const curLocal=$('local').value, curDest=$('movDest').value;
  ['local','movDest'].forEach(i=>{$(i).innerHTML=D.locais.map(l=>`<option>${esc(l.nome)}</option>`).join('')});
  if(D.locais.some(l=>l.nome==curLocal))$('local').value=curLocal;if(D.locais.some(l=>l.nome==curDest))$('movDest').value=curDest;
  ['movTec','devTec'].forEach(i=>{$(i).innerHTML='<option value="">Técnico</option>'+D.tecnicos.map(t=>`<option>${esc(t.nome)}</option>`).join('')});
  const est=D.equipamentos.filter(e=>e.status=='Em estoque');
  $('kTot').textContent=D.equipamentos.length;$('kEst').textContent=est.length;$('kTec').textContent=D.equipamentos.filter(e=>e.status=='Com técnico').length;$('kRua').textContent=D.equipamentos.filter(e=>['Na rua','Instalado cliente','Reservado'].includes(e.status)).length;
  $('statusBox').innerHTML=['Em estoque','Com técnico','Instalado cliente','Na rua','Reservado','Em manutenção','Inutilizado','Perdido'].map(s=>`<div class="item"><b>${s}</b><span class="status">${D.equipamentos.filter(e=>e.status==s).length}</span></div>`).join('');
  $('alertBox').innerHTML=D.modelos.map(m=>{const qtd=est.filter(e=>e.tipo==m.tipo&&e.marca==m.marca&&e.modelo==m.modelo).length;const min=Number(m.estoque_minimo||0);return min&&qtd<min?`<div class="item"><b>${esc(m.tipo)} ${esc(m.marca)} ${esc(m.modelo)}</b><span class="status bad">${qtd}/${min}</span></div>`:''}).join('')||'Nenhum alerta.';
  const f=N($('f').value);
  $('eqT').innerHTML=D.equipamentos.filter(e=>N(Object.values(e).join(' ')).includes(f)).map(e=>`<tr><td>${esc(e.codigo)}</td><td>${esc(e.tipo)}</td><td>${esc(e.marca)}</td><td>${esc(e.modelo)}</td><td>${esc(e.mac||'')}</td><td>${esc(e.serial||'')}</td><td>${esc(e.status)}</td><td>${esc(e.local||'')}</td><td>${esc(e.tecnicoAtual||'')}</td><td>${esc(e.clienteAtual||'')}</td><td><button onclick="editEq('${e.id}')">Editar</button><button class="warn" onclick="inutilizarEq('${e.id}')">Inutilizar</button><button class="bad" onclick="delEq('${e.id}')">Excluir</button></td></tr>`).join('')||'<tr><td colspan="11">Nenhum equipamento.</td></tr>';
  $('estT').innerHTML=est.map(e=>`<tr><td>${esc(e.codigo)}</td><td>${esc(e.modelo)}</td><td>${esc(e.mac||e.serial||'')}</td><td>${esc(e.patrimonio)}</td><td>${br(e.custo)}</td><td><button onclick="editEq('${e.id}')">Editar</button><button class="warn" onclick="inutilizarEq('${e.id}')">Inutilizar</button></td></tr>`).join('')||'<tr><td colspan="6">Nenhum item em estoque.</td></tr>';
  $('modelTable').innerHTML=D.modelos.map(m=>{const qtd=est.filter(e=>e.tipo==m.tipo&&e.marca==m.marca&&e.modelo==m.modelo).length;return`<tr><td>${esc(m.tipo)}</td><td>${esc(m.marca)}</td><td>${esc(m.modelo)}</td><td>${br(m.custo_padrao)}</td><td>${m.estoque_minimo||0}</td><td>${m.estoque_ideal||0}</td><td>${qtd}</td><td><button onclick="editModelo('${m.id}')">Editar</button><button class="bad" onclick="delModelo('${m.id}')">Excluir</button></td></tr>`}).join('')||'<tr><td colspan="8">Nenhum modelo cadastrado.</td></tr>';
  $('tecList').innerHTML=D.tecnicos.map(t=>`<div class="item"><b>${esc(t.nome)}</b><span><button onclick="editTec('${t.id}')">Editar</button><button class="bad" onclick="delTec('${t.id}')">Excluir</button></span></div>`).join('')||'Nenhum técnico.';
  $('locList').innerHTML=D.locais.map(l=>`<div class="item"><b>${esc(l.nome)}</b><span>${esc(l.tipo||'Outro')} ${l.fixo?'<span class="status">Fixo</span>':`<button onclick="editLocal('${l.id}')">Editar</button><button class="bad" onclick="delLocal('${l.id}')">Excluir</button>`}</span></div>`).join('')||'Nenhum local.';
  $('manEq').innerHTML='<option value="">Selecione</option>'+D.equipamentos.filter(e=>e.status=='Em manutenção').map(e=>`<option value="${e.id}">${esc(e.codigo)} • ${esc(e.modelo)}</option>`).join('');
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
