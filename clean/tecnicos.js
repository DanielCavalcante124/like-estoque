import { call } from './api.js?v=5';

const S = { resumo: null, tecnicos: [], detalhe: null, sel: '' };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const br = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const qtd = v => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function msg(t, c = ''){
  const e = $('tecCleanMsg');
  if(e){ e.textContent = t; e.className = 'msg show ' + c; }
}
function nomeEq(e){ return [e.tipo, e.marca, e.modelo].filter(Boolean).join(' ') || 'Equipamento'; }
function nomeMat(m){ return [m.tipo, m.marca, m.modelo].filter(Boolean).join(' ') || 'Material'; }
function itemTec(n){ return S.tecnicos.find(t => t.tecnico === n) || { tecnico:n, equipamentos:0, materiais:0, valor:0, sem_mac_sn:0, pendencias:0 }; }
function eqs(){ return S.detalhe?.equipamentos || []; }
function mats(){ return S.detalhe?.materiais || []; }
function valor(n){ return Number(itemTec(n).valor || 0); }
function pend(n){
  const t = itemTec(n);
  const p = [];
  if(Number(t.equipamentos || 0)) p.push(Number(t.equipamentos || 0) + ' equipamento(s) em posse');
  if(Number(t.materiais || 0)) p.push(Number(t.materiais || 0) + ' material(is) em posse');
  if(Number(t.sem_mac_sn || 0)) p.push(Number(t.sem_mac_sn || 0) + ' equipamento(s) sem MAC/SN');
  return p;
}
function fmt(v){
  try{ return v ? new Date(v).toLocaleString('pt-BR') : '-'; }
  catch(e){ return String(v || '-'); }
}

function inject(){
  if(!$('navTecnicosClean')){
    const ref = $('navMateriaisClean') || $('navEquipamentosClean') || document.querySelector('[data-page="cadastros"]');
    const b = document.createElement('button');
    b.id = 'navTecnicosClean';
    b.className = 'nav';
    b.textContent = 'Técnicos';
    b.onclick = show;
    ref ? ref.insertAdjacentElement('afterend', b) : document.querySelector('.sidebar').appendChild(b);
  }

  if(!$('page-tecnicos-clean')){
    const s = document.createElement('section');
    s.id = 'page-tecnicos-clean';
    s.className = 'page';
    s.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Técnicos</h2>
            <p>Visão por técnico calculada no banco: equipamentos, materiais, pendências e cobrança por WhatsApp.</p>
          </div>
          <button id="tecCleanReload" class="secondary">Recarregar técnicos</button>
        </div>
        <div class="form-grid two">
          <input id="tecBusca" placeholder="Buscar técnico">
          <select id="tecFiltro">
            <option value="todos">Todos</option>
            <option value="eq">Com equipamento</option>
            <option value="mat">Com material</option>
            <option value="pend">Com pendência</option>
            <option value="livre">Sem posse</option>
          </select>
        </div>
        <div id="tecCleanMsg" class="msg"></div>
      </div>

      <div class="kpis">
        <div class="kpi"><small>Técnicos</small><b id="tecKTotal">0</b></div>
        <div class="kpi"><small>Com equipamento</small><b id="tecKEquip">0</b></div>
        <div class="kpi"><small>Com material</small><b id="tecKMat">0</b></div>
        <div class="kpi"><small>Valor em posse</small><b id="tecKValor">R$ 0,00</b></div>
      </div>

      <div class="grid two">
        <div class="card"><h2>Lista</h2><div id="tecLista" class="list"></div></div>
        <div class="card">
          <div class="table-head">
            <h2 id="tecTitulo">Selecione um técnico</h2>
            <div class="actions" style="margin:0">
              <button id="tecCobrarWhatsapp" class="primary" type="button">Copiar cobrança WhatsApp</button>
              <button id="tecCopiar" class="secondary" type="button">Copiar resumo</button>
            </div>
          </div>
          <div id="tecResumo"></div>
          <textarea id="tecMensagemManual" rows="8" readonly style="display:none;width:100%;margin-top:10px;resize:vertical"></textarea>
        </div>
      </div>

      <div class="card"><h2>Equipamentos</h2><div class="table-wrap"><table><thead><tr><th>Código</th><th>Equipamento</th><th>MAC</th><th>SN</th><th>Status</th><th>Local</th><th>Cliente/OS</th><th>Custo</th></tr></thead><tbody id="tecEqT"></tbody></table></div></div>
      <div class="card"><h2>Materiais</h2><div class="table-wrap"><table><thead><tr><th>Categoria</th><th>Material</th><th>Unidade</th><th>Quantidade</th><th>Local</th></tr></thead><tbody id="tecMatT"></tbody></table></div></div>
      <div class="card"><h2>Histórico recente</h2><div class="table-wrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>Ação</th><th>Item</th><th>Qtd</th><th>Obs</th></tr></thead><tbody id="tecHistT"></tbody></table></div></div>`;
    document.querySelector('.main').appendChild(s);
  }

  $('tecCleanReload').onclick = () => load().catch(e => msg(e.message, 'bad'));
  $('tecBusca').oninput = renderLista;
  $('tecFiltro').onchange = renderLista;
  $('tecCopiar').onclick = copiarResumo;
  $('tecCobrarWhatsapp').onclick = copiarCobranca;
}

function show(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navTecnicosClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-tecnicos-clean'));
  if($('pageTitle')) $('pageTitle').textContent = 'Técnicos';
  load().catch(e => msg(e.message, 'bad'));
}

async function load(){
  msg('Carregando painel de técnicos no banco...', 'warn');
  S.resumo = await call('rpc_tecnicos_resumo_7a5', {}) || {};
  S.tecnicos = S.resumo.items || [];
  if(S.sel && !S.tecnicos.some(t => t.tecnico === S.sel)){
    S.sel = '';
    S.detalhe = null;
  }
  renderLista();
  await renderDetalhe();
  msg('Técnicos carregados.', 'ok');
}

function passa(t){
  const f = $('tecFiltro')?.value || 'todos';
  if(f === 'todos') return true;
  if(f === 'eq') return Number(t.equipamentos || 0) > 0;
  if(f === 'mat') return Number(t.materiais || 0) > 0;
  if(f === 'pend') return Number(t.pendencias || 0) > 0;
  if(f === 'livre') return Number(t.equipamentos || 0) === 0 && Number(t.materiais || 0) === 0;
  return true;
}

function renderLista(){
  const q = norm($('tecBusca')?.value || '');
  const all = S.tecnicos || [];
  const arr = all.filter(t => (!q || norm(t.tecnico).includes(q)) && passa(t));
  $('tecKTotal').textContent = Number(S.resumo?.total || all.length).toLocaleString('pt-BR');
  $('tecKEquip').textContent = Number(S.resumo?.com_equipamento || all.filter(t => Number(t.equipamentos || 0) > 0).length).toLocaleString('pt-BR');
  $('tecKMat').textContent = Number(S.resumo?.com_material || all.filter(t => Number(t.materiais || 0) > 0).length).toLocaleString('pt-BR');
  $('tecKValor').textContent = br(S.resumo?.valor_total ?? all.reduce((a, t) => a + Number(t.valor || 0), 0));
  $('tecLista').innerHTML = arr.map(t => {
    const n = t.tecnico;
    return `<div class="item" data-tec="${esc(n)}" style="cursor:pointer">
      <div><b>${esc(n)}</b><br><small>${Number(t.equipamentos || 0)} equipamento(s) • ${Number(t.materiais || 0)} material(is) • ${br(t.valor)}</small></div>
      <span class="badge">${Number(t.pendencias || 0)} pend.</span>
    </div>`;
  }).join('') || '<div class="item">Nenhum técnico encontrado.</div>';
  document.querySelectorAll('[data-tec]').forEach(x => x.onclick = () => selecionarTecnico(x.dataset.tec));
}

async function selecionarTecnico(nome){
  S.sel = nome;
  await carregarDetalhe(nome);
  renderDetalhe();
}
async function carregarDetalhe(nome){
  if(!nome) return;
  msg('Carregando detalhe do técnico...', 'warn');
  S.detalhe = await call('rpc_tecnico_detalhe_7a5', { p_tecnico: nome }) || null;
  msg('Detalhe carregado.', 'ok');
}

async function renderDetalhe(){
  const n = S.sel;
  if(!n){
    $('tecTitulo').textContent = 'Selecione um técnico';
    $('tecResumo').innerHTML = '<div class="msg show">Clique em um técnico.</div>';
    $('tecEqT').innerHTML = '<tr><td colspan="8">Selecione um técnico.</td></tr>';
    $('tecMatT').innerHTML = '<tr><td colspan="5">Selecione um técnico.</td></tr>';
    $('tecHistT').innerHTML = '<tr><td colspan="6">Selecione um técnico.</td></tr>';
    esconderMensagemManual();
    return;
  }
  if(!S.detalhe || S.detalhe.tecnico !== n){ await carregarDetalhe(n); }
  const e = eqs(), m = mats(), p = pend(n);
  $('tecTitulo').textContent = 'Técnico: ' + n;
  $('tecResumo').innerHTML = `<div class="kpis"><div class="kpi"><small>Equip.</small><b>${e.length}</b></div><div class="kpi"><small>Mat.</small><b>${m.length}</b></div><div class="kpi"><small>Valor</small><b>${br(valor(n))}</b></div><div class="kpi"><small>Pend.</small><b>${p.length}</b></div></div>${p.length ? `<div class="msg show bad">${p.map(esc).join('<br>')}</div>` : '<div class="msg show ok">Sem pendência crítica aparente.</div>'}`;
  $('tecEqT').innerHTML = e.map(x => `<tr><td>${esc(x.codigo)}</td><td>${esc(nomeEq(x))}</td><td>${esc(x.mac || '-')}</td><td>${esc(x.serial || '-')}</td><td>${esc(x.status || '-')}</td><td>${esc(x.local || '-')}</td><td>${esc(x.cliente_atual || '-')}<br><small>${esc(x.os_atual || '')}</small></td><td>${br(x.custo)}</td></tr>`).join('') || '<tr><td colspan="8">Sem equipamento em posse.</td></tr>';
  $('tecMatT').innerHTML = m.map(x => `<tr><td>${esc(x.categoria || '')}</td><td>${esc(nomeMat(x))}</td><td>${esc(x.unidade_saida || '')}</td><td><b>${qtd(x.quantidade)}</b></td><td>${esc(x.local || '-')}</td></tr>`).join('') || '<tr><td colspan="5">Sem material em posse.</td></tr>';
  renderHist();
  esconderMensagemManual();
}

function renderHist(){
  const a = (S.detalhe?.historico_equipamentos || []).map(x => ({ d: x.created_at || x.data, t: 'Equipamento', a: x.tipo || '', i: x.codigo || x.mac || x.serial || '', q: '', o: x.obs || x.motivo || '' }));
  const b = (S.detalhe?.historico_materiais || []).map(x => ({ d: x.created_at || x.data, t: 'Material', a: x.motivo || '', i: nomeMat(x), q: qtd(x.quantidade), o: x.obs || '' }));
  const rows = [...a, ...b].sort((x, y) => new Date(y.d || 0) - new Date(x.d || 0)).slice(0, 15);
  $('tecHistT').innerHTML = rows.map(x => `<tr><td>${esc(fmt(x.d))}</td><td>${esc(x.t)}</td><td>${esc(x.a)}</td><td>${esc(x.i)}</td><td>${esc(x.q)}</td><td>${esc(x.o)}</td></tr>`).join('') || '<tr><td colspan="6">Sem histórico recente.</td></tr>';
}

function textoResumo(){
  const n = S.sel;
  if(!n) return '';
  const linhas = [`Resumo de estoque - ${n}`, `Equipamentos: ${eqs().length}`];
  eqs().forEach(e => linhas.push(`- ${e.codigo || '-'} | ${nomeEq(e)} | MAC: ${e.mac || '-'} | SN: ${e.serial || '-'} | ${e.status || '-'}`));
  linhas.push(`Materiais: ${mats().length}`);
  mats().forEach(m => linhas.push(`- ${nomeMat(m)} | ${qtd(m.quantidade)} ${m.unidade_saida || ''}`));
  linhas.push(`Valor patrimônio: ${br(valor(n))}`);
  const p = pend(n);
  if(p.length){
    linhas.push('Pendências:');
    p.forEach(x => linhas.push('- ' + x));
  }
  return linhas.join('\n');
}

function textoCobranca(){
  const n = S.sel;
  if(!n) return '';
  const equipamentos = eqs();
  const materiais = mats();
  const agora = new Date().toLocaleString('pt-BR');
  const linhas = [`Bom dia, ${n}.`, '', 'Estou conferindo o estoque no LIKE Estoque e consta em sua posse os itens abaixo:', ''];
  if(equipamentos.length){
    linhas.push('*Equipamentos:*');
    equipamentos.forEach((e, i) => linhas.push(`${i + 1}. ${e.codigo || '-'} | ${nomeEq(e)} | MAC: ${e.mac || '-'} | SN: ${e.serial || '-'} | Status: ${e.status || '-'}${e.os_atual ? ' | OS: ' + e.os_atual : ''}`));
    linhas.push('');
  }
  if(materiais.length){
    linhas.push('*Materiais:*');
    materiais.forEach((m, i) => linhas.push(`${i + 1}. ${nomeMat(m)} | Qtd: ${qtd(m.quantidade)} ${m.unidade_saida || ''}`.trim()));
    linhas.push('');
  }
  if(!equipamentos.length && !materiais.length){
    linhas.push('No momento não consta equipamento ou material em sua posse. Caso tenha algo físico com você, responda informando para regularizarmos no sistema.');
    linhas.push('');
  }else{
    linhas.push('Por favor, responda esta mensagem informando:');
    linhas.push('1. O que já foi instalado, com cliente/endereço e OS;');
    linhas.push('2. O que ainda está com você para uso;');
    linhas.push('3. O que será devolvido ao estoque;');
    linhas.push('4. Se existe algum item perdido, danificado ou sem identificação.');
    linhas.push('');
    linhas.push('Equipamento ou material sem uso precisa retornar ao estoque para baixa da sua pendência no sistema.');
    linhas.push('');
  }
  linhas.push(`Conferência gerada em: ${agora}`);
  return linhas.join('\n');
}

function esconderMensagemManual(){
  const box = $('tecMensagemManual');
  if(box){ box.style.display = 'none'; box.value = ''; }
}
function mostrarMensagemManual(texto){
  const box = $('tecMensagemManual');
  if(!box) return;
  box.value = texto;
  box.style.display = 'block';
  box.focus();
  box.select();
}
async function copiarTexto(texto, sucesso){
  if(!texto){ msg('Selecione um técnico.', 'bad'); return; }
  try{
    await navigator.clipboard.writeText(texto);
    esconderMensagemManual();
    msg(sucesso, 'ok');
  }catch(e){
    mostrarMensagemManual(texto);
    msg('Não consegui copiar automaticamente. O texto ficou aberto abaixo para copiar manualmente.', 'warn');
  }
}
function copiarResumo(){ copiarTexto(textoResumo(), 'Resumo copiado.'); }
function copiarCobranca(){ copiarTexto(textoCobranca(), 'Cobrança para WhatsApp copiada.'); }

inject();
window.tecnicosCleanLoad = load;