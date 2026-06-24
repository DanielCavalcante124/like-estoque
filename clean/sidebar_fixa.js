const STYLE_ID = 'sidebarFixaDesktopCss';

function injectSidebarFixa(){
  if(document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @media (min-width: 901px){
      :root{--sidebar-desktop-width:280px}
      @media (max-width:1200px){:root{--sidebar-desktop-width:240px}}
      .app-shell{display:block!important;min-height:100vh!important;width:100%!important}
      .sidebar{
        position:fixed!important;
        top:0!important;
        left:0!important;
        bottom:0!important;
        width:var(--sidebar-desktop-width)!important;
        min-width:var(--sidebar-desktop-width)!important;
        height:100vh!important;
        max-height:100vh!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;
        z-index:100!important;
        border-right:1px solid #244260!important;
        box-shadow:8px 0 24px rgba(15,23,42,.12)!important;
      }
      .main{
        margin-left:var(--sidebar-desktop-width)!important;
        width:calc(100% - var(--sidebar-desktop-width))!important;
        min-height:100vh!important;
      }
      .mobile-menu-btn,.sidebar-backdrop{display:none!important}
    }
  `;
  document.head.appendChild(style);
}

injectSidebarFixa();
setTimeout(injectSidebarFixa, 500);
setTimeout(injectSidebarFixa, 1500);
setTimeout(injectSidebarFixa, 3000);

window.likeSidebarFixaRefresh = injectSidebarFixa;
