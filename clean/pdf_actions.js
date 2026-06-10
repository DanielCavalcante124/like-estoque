const ACTIVE_PANEL_ID = 'pdfActionsPanel';

function removeOldPanel(){
  const old = document.getElementById(ACTIVE_PANEL_ID);
  if(old) old.remove();
}

function printPdfUrl(url){
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '1px';
  frame.style.height = '1px';
  frame.style.border = '0';
  frame.style.opacity = '0';
  frame.src = url;
  frame.onload = () => {
    try{
      frame.contentWindow.focus();
      frame.contentWindow.print();
    }catch(e){
      window.open(url, '_blank', 'noopener');
    }
  };
  document.body.appendChild(frame);
  setTimeout(() => frame.remove(), 120000);
}

function downloadPdfUrl(url, filename){
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function showPanel(url, filename){
  removeOldPanel();

  const panel = document.createElement('div');
  panel.id = ACTIVE_PANEL_ID;
  panel.style.position = 'fixed';
  panel.style.right = '16px';
  panel.style.bottom = '56px';
  panel.style.zIndex = '12000';
  panel.style.width = 'min(360px, calc(100vw - 32px))';
  panel.style.background = '#0f172a';
  panel.style.color = '#fff';
  panel.style.border = '1px solid rgba(255,255,255,.16)';
  panel.style.boxShadow = '0 22px 70px rgba(15,23,42,.35)';
  panel.style.borderRadius = '16px';
  panel.style.padding = '14px';
  panel.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';

  panel.innerHTML = `
    <div style="display:flex;gap:10px;align-items:flex-start;justify-content:space-between">
      <div>
        <div style="font-weight:900;font-size:14px;margin-bottom:3px">PDF gerado</div>
        <div style="font-size:12px;color:#cbd5e1;line-height:1.35;word-break:break-word">${filename}</div>
      </div>
      <button type="button" data-pdf-close style="border:0;background:transparent;color:#cbd5e1;font-size:20px;cursor:pointer;line-height:1">×</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      <button type="button" data-pdf-print style="border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:800;padding:10px 12px;cursor:pointer">Imprimir agora</button>
      <button type="button" data-pdf-download style="border:0;border-radius:10px;background:#334155;color:#fff;font-weight:800;padding:10px 12px;cursor:pointer">Baixar novamente</button>
      <button type="button" data-pdf-open style="border:0;border-radius:10px;background:#475569;color:#fff;font-weight:800;padding:10px 12px;cursor:pointer">Abrir PDF</button>
    </div>
    <div style="font-size:11px;color:#94a3b8;margin-top:10px;line-height:1.35">A impressão é opcional. O download automático atual continua funcionando.</div>
  `;

  panel.querySelector('[data-pdf-close]').onclick = () => panel.remove();
  panel.querySelector('[data-pdf-print]').onclick = () => printPdfUrl(url);
  panel.querySelector('[data-pdf-download]').onclick = () => downloadPdfUrl(url, filename);
  panel.querySelector('[data-pdf-open]').onclick = () => window.open(url, '_blank', 'noopener');

  document.body.appendChild(panel);
  setTimeout(() => {
    if(document.body.contains(panel)) panel.remove();
  }, 90000);
}

export function savePdfAndOfferPrint(doc, filename){
  doc.save(filename);
  try{
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    showPanel(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 180000);
  }catch(e){
    console.warn('Não foi possível preparar opção de impressão do PDF.', e);
  }
  return filename;
}
