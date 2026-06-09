(function(){
  const params = new URLSearchParams(location.search);
  const isStaging = params.get('env') === 'staging' || window.LIKE_ESTOQUE_ENV === 'staging';

  const VERSION = {
    app: 'LIKE Estoque',
    version: isStaging ? '1.2.0-beta.1' : '1.1.3',
    releaseDate: '2026-06-09',
    codename: isStaging ? 'homologacao-free' : 'camada-env'
  };

  function ensureBadge(){
    if(document.getElementById('appVersionBadge')) return;

    const badge = document.createElement('div');
    badge.id = 'appVersionBadge';
    badge.style.position = 'fixed';
    badge.style.right = '14px';
    badge.style.bottom = '10px';
    badge.style.zIndex = '9999';
    badge.style.padding = '7px 10px';
    badge.style.borderRadius = '999px';
    badge.style.background = isStaging ? '#991b1b' : 'rgba(15, 23, 42, 0.92)';
    badge.style.color = '#fff';
    badge.style.fontSize = '11px';
    badge.style.fontWeight = '700';
    badge.style.boxShadow = '0 8px 22px rgba(0,0,0,.18)';
    badge.style.letterSpacing = '.2px';
    badge.title = VERSION.codename + ' • ' + VERSION.releaseDate;
    badge.textContent = (isStaging ? 'TESTE ' : '') + 'v' + VERSION.version;

    document.body.appendChild(badge);
  }

  function updateHeader(){
    const title = document.getElementById('pageTitle');
    if(!title || title.dataset.versionReady === '1') return;
    title.dataset.versionReady = '1';

    const small = document.createElement('small');
    small.textContent = ' v' + VERSION.version;
    small.style.fontSize = '12px';
    small.style.marginLeft = '8px';
    small.style.opacity = '.65';
    small.style.fontWeight = '700';
    title.appendChild(small);
  }

  function boot(){
    ensureBadge();
    updateHeader();
    window.LIKE_ESTOQUE_VERSION = VERSION;
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  }else{
    boot();
  }
})();
