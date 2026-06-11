import { call } from './api.js?v=5';

const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const ativo = e => e && e.ativo !== false;
const nomeEq = e => [e?.tipo, e?.marca, e?.modelo].filter(Boolean).join(' ') || e?.codigo || '-';
const identificacao = e => [e?.codigo, e?.mac, e?.serial, nomeEq(e)].filter(Boolean).join(' • ');
const elegivel = e => {
  if(!ativo(e)) return false;
  const s = norm(e.status);
  const l = norm(e.local);
  return ['manutencao','manutencao','em manutencao','defeituoso','testar','garantia','aguardando baixa'].includes(s) || l.includes('manutencao') || l.includes('garantia');
};

const S = { timer:null, itens:[], total:0, busca:'' };

function msg(text, type=''){
  const el = $('manutencaoMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}

function currentSelected(){
  const id = $('manutencaoEquipamento')?.value;
  return S.itens.find(e => e.id === id) || null;
}

function renderSelect(){
  const sel = $('manutencaoEquipamento');
  if(!sel) return;
  const atual = sel.value;
  sel.innerHTML = '<option value="">Selecionar equipamento em manutenção/teste</option>' + S.itens.slice(0,80).map(e => `<option value="${e.id}">${esc(identificacao(e))}</option>`).join('');
  if(atual && S.itens.some(e => e.id === atual)) sel.value = atual;
}

function renderTable(){
  const body = $('manutencaoTbody');
  if(!body) return;
  const info = $('manutencaoTotalInfo');
  if(info) info.textContent = `Mostrando ${S.itens.length} de ${S.total} em manutenção/teste. Use a busca para localizar outros.`;
  body.innerHTML = S.itens.map(e => `
    <tr>
      <td><b>${esc(e.codigo || '-')}</b></td>
      <td>${esc(nomeEq(e))}</td>
      <td>${esc(e.mac || e.serial || '-')}</td>
      <td><span class="badge">${esc(e.status || '-')}</span></td>
      <td>${esc(e.local || '-')}</td>
      <td>${esc(e.motivo_atual || '-')}</td>
      <td><button class="secondary" data-manutencao-perf-eq="${e.id}">Selecionar</button></td>
    </tr>`).join('') || '<tr><td colspan="7">Nenhum equipamento em manutenção/teste.</td></tr>';
}

async function carregar(){
  const campo = $('manutencaoBuscaEquipamento');
  S.busca = campo?.value || '';
  const res = await call('rpc_pesquisar_equipamentos_7a5', {
    p_busca: S.busca,
    p_status_filtro: 'manutencao',
    p_limit: 80,
    p_offset: 0
  });
  S.itens = (res.items || []).filter(elegivel);
  S.total = Number(res.total || 0);
  renderSelect();
  renderTable();
}

function selectId(id){
  const item = S.itens.find(e => e.id === id);
  if(!item) return false;
  $('manutencaoEquipamento').value = id;
  $('manutencaoEquipamento').dispatchEvent(new Event('change', { bubbles:true }));
  return true;
}

function bind(){
  const campo = $('manutencaoBuscaEquipamento');
  if(campo && campo.dataset.perfBound !== '1'){
    campo.dataset.perfBound = '1';
    campo.addEventListener('input', () => {
      clearTimeout(S.timer);
      S.timer = setTimeout(() => carregar().catch(e => msg(e.message || String(e), 'bad')), 350);
    });
  }

  document.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-manutencao-perf-eq]');
    if(!btn) return;
    selectId(btn.dataset.manutencaoPerfEq);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

const originalLoad = window.manutencaoCleanLoad;
window.manutencaoCleanLoad = async function(){
  if(typeof originalLoad === 'function'){
    await originalLoad();
  }
  bind();
  await carregar();
  msg('Manutenção otimizada: busca paginada no banco ativa.', 'ok');
};

window.manutencaoCleanSelectById = async function(id){
  if(!id) return false;
  if(selectId(id)) return true;
  const res = await call('rpc_pesquisar_equipamentos_7a5', { p_busca:id, p_status_filtro:'todos', p_limit:10, p_offset:0 });
  const item = (res.items || []).find(e => e.id === id);
  if(!item) return false;
  S.itens.unshift(item);
  renderSelect();
  renderTable();
  return selectId(id);
};

setTimeout(() => {
  bind();
  if($('page-manutencao-clean')) carregar().catch(() => {});
}, 1500);
