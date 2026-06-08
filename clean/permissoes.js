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
  s.textContent = `
    .perm-hidden{display:none!important}
    .perm-card{border:1px solid #e5e7eb;border-radius:14px;background:#fff;padding:8px 10px;margin-top:10px;font-size:12px;color:#172033;white-space:normal}
    .perm-card b{display:block;color:#0f172a}.perm-card small{color:#64748b}.perm-denied{border:1px solid #fecaca;background:#fff7f7;color:#991b1b;border-radius:14px;padding:14px;margin:12px 0}
    .mobile-menu-btn,.sidebar-backdrop{display:none}
    @media(max-width:900px){
      body{padding-top:58px}
      body.menu-open{overflow:hidden}
      .app-shell{display:block!important}
      .mobile-menu-btn{display:flex;position:fixed;top:10px;left:10px;z-index:1002;width:46px;height:46px;align-items:center;justify-content:center;border-radius:14px;background:#0d1b2e;color:#fff;border:1px solid #244260;box-shadow:0 12px 28px rgba(15,23,42,.25);font-size:22px;line-height:1;margin:0}
      .mobile-menu-btn span{display:block;transform:translateY(-1px)}
      .sidebar-backdrop{display:block;position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:1000;opacity:0;pointer-events:none;transition:opacity .18s ease}
      body.menu-open .sidebar-backdrop{opacity:1;pointer-events:auto}
      .sidebar{display:block!important;position:fixed!important;top:0!important;left:0!important;bottom:0!important;width:min(84vw,320px)!important;min-width:0!important;max-width:320px!important;height:100dvh!important;z-index:1001!important;transform:translateX(-104%);transition:transform .22s ease;overflow-y:auto!important;overflow-x:hidden!important;white-space:normal!important;padding:18px 14px calc(22px + env(safe-area-inset-bottom,0px))!important;box-shadow:18px 0 42px rgba(15,23,42,.28)!important;border-right:1px solid #244260!important;border-bottom:0!important;scroll-snap-type:none!important}
      body.menu-open .sidebar{transform:translateX(0)}
      .sidebar .brand{display:block!important;margin:0 0 14px!important;min-width:0!important;padding-left:52px;white-space:normal!important}
      .sidebar .brand strong{font-size:20px!important;line-height:1.15}.sidebar .brand span{display:block!important;max-width:none!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;margin-top:3px}
      .sidebar .nav{display:flex!important;width:100%!important;min-width:0!important;min-height:46px!important;margin:5px 0!important;padding:12px!important;text-align:left!important;justify-content:flex-start!important;align-items:center!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:14px!important;white-space:normal!important;scroll-snap-align:none!important}
      .sidebar .nav.active{box-shadow:inset 4px 0 0 #60a5fa!important;background:#173051!important}
      .legacy-link{display:flex!important;width:100%!important;min-height:44px!important;margin:10px 0!important;align-items:center!important;white-space:normal!important}
      .session-box{display:block!important;width:100%!important;min-width:0!important;margin:12px 0!important;white-space:normal!important}
      .perm-card{background:#122640!important;color:#e5e7eb!important;border-color:#244260!important}.perm-card b{color:#fff!important}.perm-card small{color:#cbd5e1!important}
      .main{padding:12px!important;padding-bottom:calc(24px + env(safe-area-inset-bottom,0px))!important}
      .topbar{position:static!important;margin:0 0 12px!important;border-radius:16px!important;padding:12px 12px 12px 62px!important;min-height:58px!important}
      .topbar h1{font-size:22px!important}.topbar p{font-size:12px!important;line-height:1.35!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    }
    @media(min-width:901px){.sidebar{position:sticky;top:0;height:100vh;overflow-y:auto}.mobile-menu-btn,.sidebar-backdrop{display:none!important}}
  `;
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
function openSidebar(){ document.body.classList.add('menu-open'); $('mobileMenuBtn')?.setAttribute('aria-expanded','true'); }
function closeSidebar(){ document.body.classList.remove('menu-open'); $('mobileMenuBtn')?.setAttribute('aria-expanded','false'); }
function toggleSidebar(){ document.body.classList.contains('menu-open') ? closeSidebar() : openSidebar(); }
function setupSidebarLateral(){
  if($('mobileMenuBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'mobileMenuBtn';
  btn.className = 'mobile-menu-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label','Abrir menu lateral');
  btn.setAttribute('aria-expanded','false');
  btn.innerHTML = '<span>☰</span>';
  btn.onclick = toggleSidebar;
  const back = document.createElement('div');
  back.id = 'sidebarBackdrop';
  back.className = 'sidebar-backdrop';
  back.onclick = closeSidebar;
  document.body.appendChild(btn);
  document.body.appendChild(back);
  document.addEventListener('keydown', ev => { if(ev.key === 'Escape') closeSidebar(); });
  document.addEventListener('click', ev => {
    if(ev.target.closest('.sidebar .nav, .sidebar .legacy-link')) closeSidebar();
  });
}
function observe(){
  const obs = new MutationObserver(() => applyNavRules());
  obs.observe(document.body, { childList:true, subtree:true });
}
function boot(){
  css();
  setupSidebarLateral();
  protectClicks();
  observe();
  document.addEventListener('like:session', ev => { if(ev.detail?.user) loadContext(); else { S.ctx=null; S.perms={}; applyNavRules(); closeSidebar(); } });
  setTimeout(loadContext, 1000);
  setTimeout(loadContext, 2500);
  setInterval(applyNavRules, 2000);
}

boot();
window.permissoes6DRefresh = loadContext;
window.permissoes6DCan = can;
window.sidebarLateralOpen = openSidebar;
window.sidebarLateralClose = closeSidebar;
