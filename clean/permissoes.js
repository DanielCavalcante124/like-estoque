import { call } from './api.js?v=3';

const S = { ctx:null, perms:{}, perfil:'sem_perfil' };
const $ = id => document.getElementById(id);
const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

const NAV_RULES = [
  { selector:'[data-page="dashboard"]', perm:'consulta', fallback:true },
  { selector:'[data-page="cadastros"]', perm:'cadastros' },
  { selector:'#navUsuariosClean', perm:'gerenciar_usuarios' },
  { selector:'#navBackupClean', perm:'backup' },
  { selector:'#navProducaoClean', perm:'painel_producao' },
  { selector:'#navAnaliseOperacionalClean', perm:'fechamento' },
  { selector:'#navImpactoFechamentoClean', perm:'fechamento' },
  { selector:'#navFechamentoClean', perm:'fechamento' },
  { selector:'#navAuditoriaClean', perm:'auditoria' },
  { selector:'#navRelatoriosClean', perm:'relatorios' },
  { selector:'#navBaixaClean', perm:'baixa' },
  { selector:'#navManutencaoClean', perm:'manutencao' },
  { selector:'#navMateriaisClean', perm:'materiais' },
  { selector:'#navEquipamentosClean', perm:'equipamentos' },
  { selector:'#navTecnicosClean', perm:'cadastros' },
  { selector:'#navHistoricoClean', perm:'consulta' },
  { selector:'#navOperacaoRapidaClean', perm:'operacao_estoque' },
  { selector:'#navLotesSaidaClean', perm:'operacao_estoque' },
  { selector:'#navEntradaClean', perm:'operacao_estoque' },
  { selector:'#navEntradaLoteClean', perm:'operacao_estoque' },
  { selector:'#navRetornoSemCadastroClean', perm:'operacao_estoque' },
  { selector:'#navSaidaClean', perm:'operacao_estoque' },
  { selector:'#navDevolucaoClean', perm:'operacao_estoque' }
];

const TEXT_RULES = [
  { text:'produção', perm:'painel_producao' },
  { text:'producao', perm:'painel_producao' },
  { text:'backup', perm:'backup' },
  { text:'usuários', perm:'gerenciar_usuarios' },
  { text:'usuarios', perm:'gerenciar_usuarios' },
  { text:'análise operacional', perm:'fechamento' },
  { text:'analise operacional', perm:'fechamento' },
  { text:'impacto fechamento', perm:'fechamento' },
  { text:'fechamento', perm:'fechamento' },
  { text:'auditoria', perm:'auditoria' },
  { text:'relatórios', perm:'relatorios' },
  { text:'relatorios', perm:'relatorios' },
  { text:'baixa', perm:'baixa' },
  { text:'manutenção', perm:'manutencao' },
  { text:'manutencao', perm:'manutencao' },
  { text:'materiais', perm:'materiais' },
  { text:'equipamentos', perm:'equipamentos' },
  { text:'cadastros', perm:'cadastros' }
];

function css(){
  if($('permCss')) return;
  const s = document.createElement('style');
  s.id = 'permCss';
  s.textContent = `.perm-hidden{display:none!important}.perm-card{border:1px solid #e5e7eb;border-radius:14px;background:#fff;padding:8px 10px;margin-top:10px;font-size:12px}.perm-card b{display:block}.perm-card small{color:#64748b}.perm-denied{border:1px solid #fecaca;background:#fff7f7;color:#991b1b;border-radius:14px;padding:14px;margin:12px 0}`;
  document.head.appendChild(s);
}
function can(perm){
  if(!perm) return true;
  if(S.perms.admin) return true;
  return !!S.perms[perm];
}
function hideElement(el, denied=true){
  if(!el) return;
  el.classList.toggle('perm-hidden', denied);
  el.setAttribute('data-perm-denied', denied ? '1' : '0');
}
function firstAllowedNav(){
  return document.querySelector('[data-page="dashboard"]') || document.querySelector('.nav:not(.perm-hidden)');
}
function applyNavRules(){
  NAV_RULES.forEach(r => document.querySelectorAll(r.selector).forEach(el => hideElement(el, !can(r.perm) && !r.fallback)));

  document.querySelectorAll('.nav, aside button, .sidebar button').forEach(el => {
    const t = norm(el.textContent);
    const rule = TEXT_RULES.find(r => t === norm(r.text) || t.includes(norm(r.text)));
    if(rule) hideElement(el, !can(rule.perm));
  });

  document.querySelectorAll('[data-perm]').forEach(el => hideElement(el, !can(el.dataset.perm)));

  const cadPage = $('page-cadastros');
  if(cadPage) cadPage.classList.toggle('perm-hidden', !can('cadastros'));

  const activeDenied = document.querySelector('.page.active.perm-hidden, .page.active [data-perm-denied="1"]');
  const activeNavDenied = document.querySelector('.nav.active.perm-hidden');
  if(activeDenied || activeNavDenied){
    const nav = firstAllowedNav();
    nav?.click?.();
  }
}
function renderProfileCard(){
  css();
  let el = $('permProfileCard');
  const side = document.querySelector('.sidebar');
  if(!side) return;
  if(!el){
    el = document.createElement('div');
    el.id = 'permProfileCard';
    el.className = 'perm-card';
    side.appendChild(el);
  }
  const nome = S.ctx?.nome || 'Usuário';
  el.innerHTML = `<b>${esc(S.perfil || 'sem perfil')}</b><small>${esc(nome)}<br>${esc(resumoPermissoes())}</small>`;
}
function resumoPermissoes(){
  if(S.perms.admin) return 'acesso total';
  const list = [];
  if(S.perms.operacao_estoque) list.push('operação');
  if(S.perms.relatorios) list.push('relatórios');
  if(S.perms.fechamento) list.push('fechamento');
  if(S.perms.cadastros) list.push('cadastros');
  if(S.perms.backup) list.push('backup');
  return list.length ? list.join(' • ') : 'acesso restrito';
}
async function loadContext(){
  try{
    const ctx = await call('rpc_usuario_contexto_6c', {});
    S.ctx = ctx;
    S.perfil = ctx?.perfil || 'sem_perfil';
    S.perms = ctx?.permissoes || {};
    document.body.dataset.perfil = S.perfil;
    renderProfileCard();
    applyNavRules();
    return ctx;
  }catch(e){
    S.ctx = null; S.perms = {}; S.perfil = 'sem_perfil';
    document.body.dataset.perfil = 'sem_perfil';
    applyNavRules();
    return null;
  }
}
function protectClicks(){
  document.addEventListener('click', ev => {
    const el = ev.target.closest('[data-perm]');
    if(el && !can(el.dataset.perm)){
      ev.preventDefault();
      ev.stopPropagation();
      alert('Seu perfil não tem permissão para esta ação.');
    }
  }, true);
}
function observe(){
  const obs = new MutationObserver(() => applyNavRules());
  obs.observe(document.body, { childList:true, subtree:true });
}
function boot(){
  css();
  protectClicks();
  observe();
  document.addEventListener('like:session', ev => { if(ev.detail?.user) loadContext(); else { S.ctx=null; S.perms={}; applyNavRules(); } });
  setTimeout(loadContext, 1000);
  setTimeout(loadContext, 2500);
  setInterval(applyNavRules, 2000);
}

boot();
window.permissoes6DRefresh = loadContext;
window.permissoes6DCan = can;
