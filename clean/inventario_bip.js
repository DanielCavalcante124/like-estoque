import { call, table } from './api.js?v=5';

const S = { ctx:null, allowed:false, locais:[], inventarios:[], ativo:null, resumo:null, finalizarArmado:false };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const cls = v => ({ ok:'ok', divergente:'warn', nao_encontrado:'bad', duplicado:'warn', inativo:'bad', fora_escopo:'warn' }[v] || '');
const lab = v => ({ ok:'OK', divergente:'Divergente', nao_encontrado:'Não encontrado', duplicado:'Duplicado', inativo:'Inativo', fora_escopo:'Fora do escopo' }[v] || v);
const dt = v => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return '-'; } };

function msg(t,c=''){
  const el = $('invMsg');
  if(el){ el.textContent = t; el.className = 'msg show ' + c; }
}

function css(){
  if($('invBipCss')) return;
  const s = document.createElement('style');
  s.id = 'invBipCss';
  s.textContent = `.inv-grid{display:grid;grid-template-columns:390px 1fr;gap:12px}.inv-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.inv-kpi{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:12px}.inv-kpi small{display:block;color:#64748b;font-weight:800}.inv-kpi b{font-size:22px}.inv-bip{font-size:22px!important;font-weight:900;letter-spacing:.03em;text-transform:uppercase}.inv-card{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:12px;margin-bottom:10px}.inv-card h3{margin:0 0 6px;font-size:16px}.inv-card p{margin:4px 0;color:#475569}.inv-actions{display:flex;gap:8px;flex-wrap:wrap}.inv-active{border-color:#60a5fa;box-shadow:0 0 0 3px #dbeafe}.badge.ok{background:#dcfce7;color:#166534}.badge.bad{background:#fee2e2;color:#991b1b}.badge.warn{background:#fef3c7;color:#92400e}.inv-muted{color:#64748b;font-size:12px}.inv-info{border:1px solid #bfdbfe;background:#eff6ff;color:#1e3a8a;border-radius:14px;padding:10px;margin:8px 0;font-size:13px;line-height:1.45}.inv-info b{display:block;color:#0f172a;margin-bottom:4px}@media(max-width:1100px){.inv-grid{grid-template-columns:1fr}.inv-kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.inv-kpis{grid-template-columns:1fr}.inv-actions{display:grid;grid-template-columns:1fr}.inv-actions>*{width:100%}.inv-bip{font-size:18px!important}}`;
  document.head.appendChild(s);
}

function canView(ctx){
  const p = ctx?.permissoes || {};
  return !!(ctx?.is_admin || p.auditoria);
}

function removeUi(){
  const n = $('navInventarioBipClean'), p = $('page-inventario-bip-clean');
  const active = n?.classList.contains('active') || p?.classList.contains('active');
  n?.remove();
  p?.remove();
  if(active) document.querySelector('[data-page="dashboard"]')?.click();
}

async function ensureAccess(){
  try{
    const ctx = await call('rpc_usuario_contexto_6c', {});
    S.ctx = ctx;
    S.allowed = canView(ctx);
    if(S.allowed) inject(); else removeUi();
    return S.allowed;
  }catch(e){
    S.allowed = false;
    removeUi();
    return false;
  }
}

function moveNav(){
  const nav = $('navInventarioBipClean');
  const g = $('sideGroupItems-gestao') || $('sideGroupItems-patrimonio');
  if(nav && g && !nav.closest('#' + g.id)) g.appendChild(nav);
  const box = nav?.closest('.side-group');
  if(box && nav?.classList.contains('active')) box.classList.remove('collapsed');
}

function inject(){
  css();
  if(!$('navInventarioBipClean')){
    const ref = $('navAuditoriaClean') || $('navRelatoriosClean') || document.querySelector('[data-page="dashboard"]');
    const b = document.createElement('button');
    b.id = 'navInventarioBipClean';
    b.className = 'nav';
    b.textContent = 'Inventário';
    b.onclick = show;
    ref ? ref.insertAdjacentElement('afterend', b) : document.querySelector('.sidebar')?.appendChild(b);
  }

  if(!$('page-inventario-bip-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-inventario-bip-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Inventário de equipamentos</h2>
            <p>Inventário completo dos equipamentos físicos do local. Para materiais, use a tela Inventário materiais.</p>
          </div>
          <button id="invReload" class="secondary">Recarregar</button>
        </div>
        <div id="invMsg" class="msg show warn">Carregando...</div>
      </div>

      <div id="invKpis" class="inv-kpis"></div>

      <div class="inv-grid">
        <div>
          <form id="invAbrirForm" class="card form-card">
            <h2>Abrir inventário de equipamentos</h2>
            <input id="invTitulo" placeholder="Ex: Inventário completo - Estoque central">
            <select id="invLocal"></select>
            <div class="inv-info">
              <b>Escopo fixo</b>
              Esta tela conta todos os equipamentos físicos do local selecionado por bipagem, MAC, serial, patrimônio ou código. Não há filtro por modelo nesta tela.
            </div>
            <textarea id="invObs" placeholder="Observação opcional"></textarea>
            <button class="primary" type="submit">Abrir inventário</button>
          </form>

          <div class="card">
            <div class="table-head">
              <h2>Inventários de equipamentos</h2>
              <select id="invFiltro">
                <option value="">Todos</option>
                <option value="aberto">Aberto</option>
                <option value="em_conferencia">Em conferência</option>
                <option value="finalizado">Finalizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div id="invLista"></div>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="table-head">
              <div>
                <h2 id="invAtivoTitulo">Nenhum inventário selecionado</h2>
                <p id="invAtivoInfo">Abra ou selecione uma contagem.</p>
              </div>
              <button id="invFinalizar" class="danger">Finalizar</button>
            </div>
            <input id="invBip" class="inv-bip" placeholder="Bipe MAC, serial, patrimônio ou código" autocomplete="off">
            <div class="inv-actions">
              <button id="invBipBtn" class="primary">Registrar bip</button>
              <button id="invFoco" class="secondary">Focar campo</button>
            </div>
          </div>

          <div class="card">
            <h2>Bips e divergências</h2>
            <div id="invBips"></div>
          </div>
        </div>
      </div>`;
    document.querySelector('.main')?.appendChild(sec);
  }
  bind();
  window.permissoes6DRefresh?.();
  setTimeout(moveNav, 250);
  setTimeout(moveNav, 1000);
}

function bind(){
  if($('invAbrirForm').dataset.bound) return;
  $('invAbrirForm').dataset.bound = '1';
  $('invReload').onclick = loadAll;
  $('invAbrirForm').onsubmit = abrir;
  $('invFiltro').onchange = loadInventarios;
  $('invBipBtn').onclick = bipar;
  $('invFoco').onclick = () => $('invBip').focus();
  $('invBip').addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); bipar(); } });
  $('invFinalizar').onclick = finalizar;
}

async function show(){
  const ok = S.allowed || await ensureAccess();
  if(!ok){ msg('Acesso restrito.', 'bad'); return; }
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navInventarioBipClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-inventario-bip-clean'));
  moveNav();
  if($('pageTitle')) $('pageTitle').textContent = 'Inventário de equipamentos';
  await loadAll();
  setTimeout(() => $('invBip')?.focus(), 300);
}

async function loadAll(){
  msg('Carregando inventário...', 'warn');
  await loadLocais();
  await loadInventarios();
  if(S.ativo) await loadResumo(S.ativo.id);
  msg('Inventário carregado.', 'ok');
}

async function loadLocais(){
  S.locais = await table('locais','nome',true);
  $('invLocal').innerHTML = (S.locais || [])
    .filter(l => l.ativo !== false)
    .map(l => `<option value="${esc(l.nome)}">${esc(l.nome)}${l.tipo ? ' — ' + esc(l.tipo) : ''}</option>`)
    .join('');
}

async function loadInventarios(){
  const st = $('invFiltro')?.value || null;
  const res = await call('rpc_listar_inventarios_7a5', { p_status: st, p_limite: 80 });
  S.inventarios = (res.inventarios || []).filter(i => (i.tipo_inventario || 'equipamentos') === 'equipamentos');
  renderLista();
}

function escopoLabel(){
  return 'Completo do local';
}

function kpi(l,v){ return `<div class="inv-kpi"><small>${esc(l)}</small><b>${esc(v)}</b></div>`; }

function renderKpis(){
  const r = S.resumo?.resumo || {};
  $('invKpis').innerHTML = [
    kpi('Esperados', r.esperados || 0),
    kpi('Bipados', r.total_bipado || 0),
    kpi('OK', r.ok || 0),
    kpi('Divergentes', r.divergente || 0),
    kpi('Não encontrados', r.nao_encontrado || 0),
    kpi('Faltantes', r.faltantes || 0)
  ].join('');
}

function renderLista(){
  $('invLista').innerHTML = (S.inventarios || []).map(i => `
    <div class="inv-card ${S.ativo?.id === i.id ? 'inv-active' : ''}">
      <h3>${esc(i.codigo)}</h3>
      <p><b>${esc(i.titulo)}</b></p>
      <p>Local: ${esc(i.local_alvo)}</p>
      <p>Escopo: <b>${esc(escopoLabel(i))}</b></p>
      <p>Status: <span class="badge">${esc(i.status)}</span></p>
      <button class="secondary" data-inv-id="${esc(i.id)}">Selecionar</button>
    </div>`).join('') || '<p>Nenhum inventário de equipamentos.</p>';
  document.querySelectorAll('[data-inv-id]').forEach(b => b.onclick = () => selecionar(b.dataset.invId));
}

async function selecionar(id){
  S.ativo = S.inventarios.find(i => i.id === id) || { id };
  await loadResumo(id);
  renderLista();
  setTimeout(() => $('invBip')?.focus(), 150);
}

async function loadResumo(id){
  S.resumo = await call('rpc_resumo_inventario_7a5', { p_inventario_id: id });
  S.ativo = S.resumo.inventario;
  $('invAtivoTitulo').textContent = `${S.ativo.codigo} — ${S.ativo.titulo}`;
  $('invAtivoInfo').textContent = `Local: ${S.ativo.local_alvo} • Escopo: ${escopoLabel(S.ativo)} • Status: ${S.ativo.status} • Aberto: ${dt(S.ativo.aberto_em)}`;
  renderKpis();
  renderBips();
}

function renderBips(){
  const arr = S.resumo?.bips || [];
  $('invBips').innerHTML = arr.map(b => `
    <div class="inv-card">
      <div class="table-head">
        <div>
          <h3>${esc(b.codigo_bipado)}</h3>
          <p>${esc(b.equipamento_codigo || 'Sem cadastro')} ${b.mac ? '• MAC ' + esc(b.mac) : ''} ${b.serial ? '• SN ' + esc(b.serial) : ''}</p>
        </div>
        <span class="badge ${cls(b.resultado)}">${esc(lab(b.resultado))}</span>
      </div>
      <p>Sistema: ${esc(b.local_sistema || '-')} • Inventário: ${esc(b.local_alvo || '-')}</p>
      <p>${esc(b.observacao || '')}</p>
      <div class="inv-muted">${dt(b.bipado_em)}</div>
    </div>`).join('') || '<p>Nenhum bip registrado.</p>';
}

async function abrir(ev){
  ev.preventDefault();
  try{
    const titulo = $('invTitulo').value.trim();
    const local = $('invLocal').value;
    if(!titulo) throw new Error('Informe o título.');
    if(!local) throw new Error('Selecione o local.');

    const res = await call('rpc_abrir_inventario_7a5', {
      p_titulo: titulo,
      p_local_alvo: local,
      p_observacao: $('invObs').value.trim() || null,
      p_escopo: 'completo',
      p_filtro_tipo: null,
      p_filtro_marca: null,
      p_filtro_modelo: null
    });

    S.ativo = res.inventario;
    $('invTitulo').value = '';
    $('invObs').value = '';
    await loadInventarios();
    await loadResumo(S.ativo.id);
    msg('Inventário de equipamentos aberto.', 'ok');
  }catch(e){
    msg(e.message || String(e), 'bad');
  }
}

async function bipar(){
  try{
    if(!S.ativo) throw new Error('Abra ou selecione um inventário.');
    if(!['aberto','em_conferencia'].includes(S.ativo.status)) throw new Error('Inventário não aceita mais bips.');
    const v = $('invBip').value.trim();
    if(!v) throw new Error('Bipe ou digite um código.');
    const res = await call('rpc_bipar_equipamento_inventario_7a5', { p_inventario_id:S.ativo.id, p_codigo_bipado:v, p_observacao:null });
    $('invBip').value = '';
    await loadResumo(S.ativo.id);
    msg(res.duplicado ? 'Bip duplicado.' : `Bip registrado: ${lab(res.resultado)}`, res.resultado === 'ok' ? 'ok' : res.resultado === 'divergente' || res.resultado === 'fora_escopo' ? 'warn' : 'bad');
    $('invBip').focus();
  }catch(e){
    msg(e.message || String(e), 'bad');
  }
}

async function finalizar(){
  try{
    if(!S.ativo) throw new Error('Selecione um inventário.');
    if(!S.finalizarArmado){
      S.finalizarArmado = true;
      $('invFinalizar').textContent = 'Clique novamente para finalizar';
      msg('Confirme clicando novamente em Finalizar. Isso apenas fecha a contagem, não corrige estoque.', 'warn');
      setTimeout(() => {
        S.finalizarArmado = false;
        if($('invFinalizar')) $('invFinalizar').textContent = 'Finalizar';
      }, 5000);
      return;
    }
    S.finalizarArmado = false;
    $('invFinalizar').textContent = 'Finalizar';
    await call('rpc_finalizar_inventario_7a5', { p_inventario_id:S.ativo.id, p_observacao:'Inventário de equipamentos finalizado pela tela de bipagem.' });
    await loadInventarios();
    await loadResumo(S.ativo.id);
    msg('Inventário finalizado.', 'ok');
  }catch(e){
    msg(e.message || String(e), 'bad');
  }
}

function boot(){
  document.addEventListener('like:session', ev => { if(ev.detail?.user) ensureAccess(); else removeUi(); });
  setTimeout(ensureAccess, 1800);
  setTimeout(ensureAccess, 4300);
}

boot();
