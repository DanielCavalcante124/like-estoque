import { call, table } from './api.js?v=5';

const S = { ctx:null, allowed:false, saldos:[], inventarios:[], ativo:null, resumo:null, finalizarArmado:false };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const qtd = v => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
const dt = v => { try { return v ? new Date(v).toLocaleString('pt-BR') : '-'; } catch(e){ return '-'; } };

function msg(t,c=''){
  const e = $('invMatMsg');
  if(e){ e.textContent = t; e.className = 'msg show ' + c; }
}

function css(){
  if($('invMatCss')) return;
  const s = document.createElement('style');
  s.id = 'invMatCss';
  s.textContent = `.invmat-grid{display:grid;grid-template-columns:410px 1fr;gap:12px}.invmat-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.invmat-kpi{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:12px}.invmat-kpi small{display:block;color:#64748b;font-weight:800}.invmat-kpi b{font-size:22px}.invmat-card{border:1px solid #e5e7eb;border-radius:16px;background:#fff;padding:12px;margin-bottom:10px}.invmat-card h3{margin:0 0 6px;font-size:16px}.invmat-card p{margin:4px 0;color:#475569}.invmat-active{border-color:#60a5fa;box-shadow:0 0 0 3px #dbeafe}.invmat-preview{border:1px solid #bfdbfe;background:#eff6ff;color:#1e3a8a;border-radius:14px;padding:10px;margin:8px 0;font-size:13px;line-height:1.45}.invmat-preview b{display:block;color:#0f172a;margin-bottom:4px}.invmat-preview.warn{border-color:#fde68a;background:#fffbeb;color:#92400e}.invmat-preview.bad{border-color:#fecaca;background:#fef2f2;color:#991b1b}.invmat-actions{display:flex;gap:8px;flex-wrap:wrap}.invmat-count{width:130px!important}.invmat-dif.ok{color:#166534;font-weight:800}.invmat-dif.bad{color:#991b1b;font-weight:800}.invmat-dif.warn{color:#92400e;font-weight:800}@media(max-width:1100px){.invmat-grid{grid-template-columns:1fr}.invmat-kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.invmat-kpis{grid-template-columns:1fr}.invmat-actions{display:grid;grid-template-columns:1fr}.invmat-actions>*{width:100%}}`;
  document.head.appendChild(s);
}

function canView(ctx){
  const p = ctx?.permissoes || {};
  return !!(ctx?.is_admin || p.auditoria);
}

function removeUi(){
  const n = $('navInventarioMateriaisClean'), p = $('page-inventario-materiais-clean');
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
  const nav = $('navInventarioMateriaisClean');
  const ref = $('navInventarioBipClean');
  if(nav && ref && nav.previousElementSibling !== ref) ref.insertAdjacentElement('afterend', nav);
  const g = $('sideGroupItems-gestao') || $('sideGroupItems-patrimonio');
  if(nav && g && !nav.closest('#' + g.id)) g.appendChild(nav);
  const box = nav?.closest('.side-group');
  if(box && nav?.classList.contains('active')) box.classList.remove('collapsed');
}

function inject(){
  css();
  if(!$('navInventarioMateriaisClean')){
    const ref = $('navInventarioBipClean') || $('navAuditoriaClean') || $('navRelatoriosClean') || document.querySelector('[data-page="dashboard"]');
    const b = document.createElement('button');
    b.id = 'navInventarioMateriaisClean';
    b.className = 'nav';
    b.textContent = 'Inventário materiais';
    b.onclick = show;
    ref ? ref.insertAdjacentElement('afterend', b) : document.querySelector('.sidebar')?.appendChild(b);
  }

  if(!$('page-inventario-materiais-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-inventario-materiais-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Inventário de materiais</h2>
            <p>Contagem por quantidade. Use para cabos, conectores, fontes e materiais de consumo.</p>
          </div>
          <button id="invMatReload" class="secondary">Recarregar</button>
        </div>
        <div id="invMatMsg" class="msg show warn">Carregando...</div>
      </div>

      <div id="invMatKpis" class="invmat-kpis"></div>

      <div class="invmat-grid">
        <div>
          <form id="invMatAbrirForm" class="card form-card">
            <h2>Abrir inventário de materiais</h2>
            <input id="invMatTitulo" placeholder="Ex: Inventário de conectores - Estoque central">
            <select id="invMatLocal"></select>
            <select id="invMatEscopo">
              <option value="completo">Todos os materiais do local</option>
              <option value="tipo">Material por tipo</option>
              <option value="modelo">Material por marca e modelo</option>
            </select>
            <div id="invMatFiltros" class="form-grid two" style="display:none">
              <select id="invMatTipo"></select>
              <select id="invMatMarca"></select>
              <select id="invMatModelo"></select>
            </div>
            <div id="invMatPreview" class="invmat-preview">Selecione o local para ver os materiais com saldo.</div>
            <textarea id="invMatObs" placeholder="Observação opcional"></textarea>
            <button class="primary" type="submit">Abrir inventário de materiais</button>
          </form>

          <div class="card">
            <div class="table-head">
              <h2>Inventários de materiais</h2>
              <select id="invMatFiltro">
                <option value="">Todos</option>
                <option value="aberto">Aberto</option>
                <option value="em_conferencia">Em conferência</option>
                <option value="finalizado">Finalizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div id="invMatLista"></div>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="table-head">
              <div>
                <h2 id="invMatAtivoTitulo">Nenhum inventário selecionado</h2>
                <p id="invMatAtivoInfo">Abra ou selecione um inventário de materiais.</p>
              </div>
              <button id="invMatFinalizar" class="danger">Finalizar</button>
            </div>
          </div>

          <div class="card">
            <h2>Materiais para contagem</h2>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Material</th><th>Unid.</th><th>Sistema</th><th>Contado</th><th>Dif.</th><th>Obs</th><th>Ação</th></tr></thead>
                <tbody id="invMatItens"></tbody>
              </table>
            </div>
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
  if($('invMatAbrirForm').dataset.bound) return;
  $('invMatAbrirForm').dataset.bound = '1';
  $('invMatReload').onclick = loadAll;
  $('invMatAbrirForm').onsubmit = abrir;
  $('invMatFiltro').onchange = loadInventarios;
  $('invMatEscopo').onchange = renderFiltros;
  $('invMatLocal').onchange = () => { renderTipos(); renderPreview(); };
  $('invMatTipo').onchange = () => { renderMarcas(); renderPreview(); };
  $('invMatMarca').onchange = () => { renderModelos(); renderPreview(); };
  $('invMatModelo').onchange = renderPreview;
  $('invMatFinalizar').onclick = finalizar;
}

async function show(){
  const ok = S.allowed || await ensureAccess();
  if(!ok){ msg('Acesso restrito.', 'bad'); return; }
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navInventarioMateriaisClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-inventario-materiais-clean'));
  moveNav();
  if($('pageTitle')) $('pageTitle').textContent = 'Inventário de materiais';
  await loadAll();
}

async function loadAll(){
  msg('Carregando materiais...', 'warn');
  S.saldos = await table('materiais_saldos','tipo',true);
  await loadInventarios();
  renderLocais();
  renderFiltros();
  if(S.ativo) await loadResumo(S.ativo.id);
  msg('Inventário de materiais carregado.', 'ok');
}

async function loadInventarios(){
  const st = $('invMatFiltro')?.value || null;
  const res = await call('rpc_listar_inventarios_7a5', { p_status: st, p_limite: 80 });
  S.inventarios = (res.inventarios || []).filter(i => (i.tipo_inventario || 'equipamentos') === 'materiais');
  renderLista();
}

function saldosPositivos(){
  return (S.saldos || []).filter(s => Number(s.quantidade || 0) !== 0 && String(s.local || '').trim());
}

function saldosDoLocal(){
  const local = $('invMatLocal')?.value || '';
  return saldosPositivos().filter(s => norm(s.local) === norm(local));
}

function escopoAtual(){
  return {
    escopo: $('invMatEscopo')?.value || 'completo',
    tipo: $('invMatTipo')?.value || '',
    marca: $('invMatMarca')?.value || '',
    modelo: $('invMatModelo')?.value || ''
  };
}

function saldoNoEscopo(s){
  const e = escopoAtual();
  if(e.escopo === 'completo') return true;
  if(e.escopo === 'tipo') return norm(s.tipo) === norm(e.tipo);
  if(e.escopo === 'modelo') return norm(s.tipo) === norm(e.tipo) && norm(s.marca) === norm(e.marca) && norm(s.modelo) === norm(e.modelo);
  return true;
}

function saldosEsperados(){
  return saldosDoLocal().filter(saldoNoEscopo);
}

function unique(rows, field){
  return [...new Set(rows.map(r => r?.[field]).filter(Boolean))].sort((a,b) => String(a).localeCompare(String(b),'pt-BR'));
}

function opts(el, placeholder, values, current){
  const exists = current && values.some(v => String(v) === String(current));
  el.innerHTML = `<option value="">${esc(values.length ? placeholder : 'Nenhuma opção com saldo neste local')}</option>` + values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  el.value = exists ? current : '';
}

function renderLocais(){
  const atual = $('invMatLocal')?.value || '';
  const locais = unique(saldosPositivos(), 'local');
  opts($('invMatLocal'), 'Selecione o local', locais, atual);
}

function renderFiltros(){
  const escopo = $('invMatEscopo')?.value || 'completo';
  $('invMatFiltros').style.display = escopo === 'completo' ? 'none' : 'grid';
  $('invMatMarca').style.display = escopo === 'modelo' ? '' : 'none';
  $('invMatModelo').style.display = escopo === 'modelo' ? '' : 'none';
  if(escopo !== 'modelo'){
    $('invMatMarca').value = '';
    $('invMatModelo').value = '';
  }
  renderTipos();
  renderPreview();
}

function renderTipos(){
  const atual = $('invMatTipo')?.value || '';
  opts($('invMatTipo'), 'Selecione o tipo', unique(saldosDoLocal(), 'tipo'), atual);
  renderMarcas();
}

function renderMarcas(){
  const tipo = $('invMatTipo')?.value || '';
  const atual = $('invMatMarca')?.value || '';
  const base = saldosDoLocal().filter(s => !tipo || norm(s.tipo) === norm(tipo));
  opts($('invMatMarca'), 'Selecione a marca', unique(base, 'marca'), atual);
  renderModelos();
}

function renderModelos(){
  const tipo = $('invMatTipo')?.value || '';
  const marca = $('invMatMarca')?.value || '';
  const atual = $('invMatModelo')?.value || '';
  const base = saldosDoLocal().filter(s => (!tipo || norm(s.tipo) === norm(tipo)) && (!marca || norm(s.marca) === norm(marca)));
  opts($('invMatModelo'), 'Selecione o modelo', unique(base, 'modelo'), atual);
}

function renderPreview(){
  const box = $('invMatPreview');
  if(!box) return;
  const local = $('invMatLocal')?.value || '-';
  const e = escopoAtual();
  const arr = saldosEsperados();
  const totalQtd = arr.reduce((a,s) => a + Number(s.quantidade || 0), 0);
  let cls = 'invmat-preview';
  if(arr.length <= 0) cls += ' warn';
  const filtro = e.escopo === 'completo' ? 'Todos os materiais' : e.escopo === 'tipo' ? `Tipo: ${e.tipo || '-'}` : `Tipo: ${e.tipo || '-'} • Marca: ${e.marca || '-'} • Modelo: ${e.modelo || '-'}`;
  box.className = cls;
  box.innerHTML = `<b>Escopo da contagem por quantidade</b>Local: ${esc(local)}<br>${esc(filtro)}<br>Itens com saldo: <b>${arr.length}</b><br>Quantidade total no sistema: <b>${qtd(totalQtd)}</b>`;
}

function escopoLabel(i){
  const e = i?.escopo || 'completo';
  if(e === 'tipo') return `Tipo: ${i.filtro_tipo || '-'}`;
  if(e === 'modelo') return `Modelo: ${[i.filtro_tipo, i.filtro_marca, i.filtro_modelo].filter(Boolean).join(' • ')}`;
  return 'Completo';
}

function kpi(label, value){ return `<div class="invmat-kpi"><small>${esc(label)}</small><b>${esc(value)}</b></div>`; }

function renderKpis(){
  const r = S.resumo?.resumo || {};
  $('invMatKpis').innerHTML = [
    kpi('Itens', r.itens || 0),
    kpi('Sistema', qtd(r.sistema_total || 0)),
    kpi('Contado', qtd(r.contado_total || 0)),
    kpi('Diferença', qtd(r.diferenca_total || 0)),
    kpi('Divergentes', r.itens_divergentes || 0)
  ].join('');
}

function renderLista(){
  $('invMatLista').innerHTML = (S.inventarios || []).map(i => `
    <div class="invmat-card ${S.ativo?.id === i.id ? 'invmat-active' : ''}">
      <h3>${esc(i.codigo)}</h3>
      <p><b>${esc(i.titulo)}</b></p>
      <p>Local: ${esc(i.local_alvo)}</p>
      <p>Escopo: <b>${esc(escopoLabel(i))}</b></p>
      <p>Status: <span class="badge">${esc(i.status)}</span></p>
      <button class="secondary" data-invmat-id="${esc(i.id)}">Selecionar</button>
    </div>`).join('') || '<p>Nenhum inventário de materiais.</p>';
  document.querySelectorAll('[data-invmat-id]').forEach(b => b.onclick = () => selecionar(b.dataset.invmatId));
}

async function selecionar(id){
  S.ativo = S.inventarios.find(i => i.id === id) || { id };
  await loadResumo(id);
  renderLista();
}

async function loadResumo(id){
  S.resumo = await call('rpc_resumo_inventario_materiais_7a5', { p_inventario_id:id });
  S.ativo = S.resumo.inventario;
  $('invMatAtivoTitulo').textContent = `${S.ativo.codigo} — ${S.ativo.titulo}`;
  $('invMatAtivoInfo').textContent = `Local: ${S.ativo.local_alvo} • Escopo: ${escopoLabel(S.ativo)} • Status: ${S.ativo.status} • Aberto: ${dt(S.ativo.aberto_em)}`;
  renderKpis();
  renderItens();
}

function difClass(v){
  const n = Number(v || 0);
  if(n === 0) return 'ok';
  return n < 0 ? 'bad' : 'warn';
}

function renderItens(){
  const arr = S.resumo?.itens || [];
  $('invMatItens').innerHTML = arr.map(i => `
    <tr data-invmat-item="${esc(i.id)}">
      <td><b>${esc([i.tipo, i.marca, i.modelo].filter(Boolean).join(' • ') || 'Material')}</b><br><small>${esc(i.local || '')}</small></td>
      <td>${esc(i.unidade_saida || '-')}</td>
      <td><b>${qtd(i.quantidade_sistema)}</b></td>
      <td><input class="invmat-count" type="number" min="0" step="0.001" value="${esc(i.quantidade_contada || 0)}"></td>
      <td class="invmat-dif ${difClass(i.diferenca)}">${qtd(i.diferenca)}</td>
      <td><input class="invmat-obs" placeholder="Obs" value="${esc(i.observacao || '')}"></td>
      <td><button class="primary invmat-save" type="button">Salvar</button></td>
    </tr>`).join('') || '<tr><td colspan="7">Nenhum material neste inventário.</td></tr>';
  document.querySelectorAll('[data-invmat-item] .invmat-save').forEach(btn => btn.onclick = salvarItem);
}

async function abrir(ev){
  ev.preventDefault();
  try{
    const titulo = $('invMatTitulo').value.trim();
    const local = $('invMatLocal').value;
    const escopo = $('invMatEscopo').value || 'completo';
    const tipo = $('invMatTipo').value || null;
    const marca = $('invMatMarca').value || null;
    const modelo = $('invMatModelo').value || null;
    const esperados = saldosEsperados().length;

    if(!titulo) throw new Error('Informe o título.');
    if(!local) throw new Error('Selecione o local.');
    if(escopo !== 'completo' && !tipo) throw new Error('Selecione o tipo de material.');
    if(escopo === 'modelo' && (!marca || !modelo)) throw new Error('Selecione marca e modelo do material.');
    if(esperados <= 0) throw new Error('Não há materiais com saldo para este local e escopo.');

    const res = await call('rpc_abrir_inventario_materiais_7a5', {
      p_titulo: titulo,
      p_local_alvo: local,
      p_observacao: $('invMatObs').value.trim() || null,
      p_escopo: escopo,
      p_filtro_tipo: escopo === 'completo' ? null : tipo,
      p_filtro_marca: escopo === 'modelo' ? marca : null,
      p_filtro_modelo: escopo === 'modelo' ? modelo : null
    });

    S.ativo = res.inventario;
    $('invMatTitulo').value = '';
    $('invMatObs').value = '';
    await loadInventarios();
    await loadResumo(S.ativo.id);
    msg('Inventário de materiais aberto.', 'ok');
  }catch(e){
    msg(e.message || String(e), 'bad');
  }
}

async function salvarItem(ev){
  try{
    const tr = ev.target.closest('[data-invmat-item]');
    const id = tr.dataset.invmatItem;
    const quantidade = Number(tr.querySelector('.invmat-count').value || 0);
    const obs = tr.querySelector('.invmat-obs').value.trim() || null;
    await call('rpc_contar_material_inventario_7a5', {
      p_contagem_id: id,
      p_quantidade_contada: quantidade,
      p_observacao: obs
    });
    await loadResumo(S.ativo.id);
    msg('Quantidade contada salva.', 'ok');
  }catch(e){
    msg(e.message || String(e), 'bad');
  }
}

async function finalizar(){
  try{
    if(!S.ativo) throw new Error('Selecione um inventário de materiais.');
    if(!S.finalizarArmado){
      S.finalizarArmado = true;
      $('invMatFinalizar').textContent = 'Clique novamente para finalizar';
      msg('Confirme clicando novamente. Isso fecha a contagem, não corrige saldo automaticamente.', 'warn');
      setTimeout(() => {
        S.finalizarArmado = false;
        if($('invMatFinalizar')) $('invMatFinalizar').textContent = 'Finalizar';
      }, 5000);
      return;
    }
    S.finalizarArmado = false;
    $('invMatFinalizar').textContent = 'Finalizar';
    await call('rpc_finalizar_inventario_7a5', { p_inventario_id:S.ativo.id, p_observacao:'Inventário de materiais finalizado pela tela de contagem.' });
    await loadInventarios();
    await loadResumo(S.ativo.id);
    msg('Inventário de materiais finalizado.', 'ok');
  }catch(e){
    msg(e.message || String(e), 'bad');
  }
}

function boot(){
  document.addEventListener('like:session', ev => { if(ev.detail?.user) ensureAccess(); else removeUi(); });
  setTimeout(ensureAccess, 2200);
  setTimeout(ensureAccess, 4800);
}

boot();
