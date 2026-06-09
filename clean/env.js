const params = new URLSearchParams(location.search);
const urlEnv = params.get('env') || '';
const forcedEnv = window.LIKE_ESTOQUE_ENV || '';
const pathEnv = location.pathname.toLowerCase().includes('teste') ? 'staging' : '';

const rawEnv = forcedEnv || urlEnv || pathEnv || 'production';

export const APP_ENV = rawEnv === 'staging' ? 'staging' : 'production';
export const IS_STAGING = APP_ENV === 'staging';
export const IS_PRODUCTION = APP_ENV === 'production';

export function envLabel(){
  return IS_STAGING ? 'AMBIENTE DE TESTE' : 'PRODUÇÃO';
}

export function canRunRpc(rpcName){
  if(!IS_STAGING) return true;

  const allowed = [
    /^rpc_dashboard_operacional$/,
    /^rpc_relatorio_/,
    /^rpc_auditoria_/,
    /^rpc_historico_/,
    /^rpc_listar_/,
    /^rpc_resumo_/,
    /^rpc_validar_/,
    /^rpc_usuario_contexto_/,
    /^rpc_perfis_disponiveis_/,
    /^rpc_matriz_permissoes_/,
    /^rpc_healthcheck_/,
    /^rpc_revisao_final_/,
    /^rpc_plano_contingencia_/,
    /^rpc_export_backup_/,
    /^rpc_termo_inventario_/
  ];

  return allowed.some(rx => rx.test(String(rpcName || '')));
}

function bootBanner(){
  if(!IS_STAGING) return;
  if(document.getElementById('ambienteTesteBanner')) return;

  const banner = document.createElement('div');
  banner.id = 'ambienteTesteBanner';
  banner.textContent = 'AMBIENTE DE TESTE — gravando somente em tabelas teste_';
  banner.style.position = 'fixed';
  banner.style.left = '0';
  banner.style.right = '0';
  banner.style.top = '0';
  banner.style.zIndex = '10000';
  banner.style.padding = '10px 14px';
  banner.style.textAlign = 'center';
  banner.style.fontWeight = '900';
  banner.style.letterSpacing = '.4px';
  banner.style.background = '#b91c1c';
  banner.style.color = '#fff';
  banner.style.boxShadow = '0 8px 22px rgba(0,0,0,.22)';

  document.body.appendChild(banner);
  document.body.style.paddingTop = '44px';
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootBanner);
}else{
  bootBanner();
}

window.LIKE_ESTOQUE_ENV_ATUAL = APP_ENV;
