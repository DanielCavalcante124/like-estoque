/* LIKE Estoque V30.1 - PDF em janela propria */
(function(){
  function $(id){return document.getElementById(id)}
  function printHtml(title, html){
    if(!html || !html.trim()){ alert('Gere o relatório antes de imprimir/PDF.'); return; }
    const css = `
      *{box-sizing:border-box} body{font-family:Segoe UI,Arial,sans-serif;color:#111827;margin:24px;background:white}
      h1,h2,h3{margin:0 0 10px;color:#0b1b34} p{margin:6px 0 12px}
      .card{border:1px solid #d8dee9;border-radius:14px;padding:18px;margin-bottom:14px;box-shadow:none;background:white}
      .tbl{overflow:visible;border:1px solid #d8dee9;border-radius:10px;margin-top:10px}
      table{width:100%;border-collapse:collapse;font-size:11px} th{background:#0f4c81;color:white;text-align:left} th,td{padding:7px;border-bottom:1px solid #e5e7eb;vertical-align:top}
      .status{display:inline-block;padding:3px 7px;border-radius:999px;background:#eef2ff;color:#3730a3;font-weight:700;font-size:11px;margin:2px}
      .gerGrid,.reportHead{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.rankGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .gerKpi,.reportKpi{border:1px solid #dbe4ef;background:#f8fafc;border-radius:12px;padding:10px}.gerKpi b,.reportKpi b{font-size:20px;display:block}
      .reportWarn{background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:10px;margin:10px 0}.dangerText{color:#991b1b;font-weight:900}.okText{color:#166534;font-weight:900}
      .signatureGrid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:50px}.lineSign{border-top:1px solid #111;text-align:center;padding-top:8px}
      button,input,select,textarea,.quickTop,.top,.side,.reportToolbar,.msg:empty{display:none!important}
      @page{size:A4 landscape;margin:10mm}
    `;
    const w = window.open('', '_blank');
    if(!w){ alert('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.'); return; }
    w.document.open();
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body>${html}<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`);
    w.document.close();
  }
  function hookPdfButtons(){
    const printTech = $('printReport');
    if(printTech && !printTech.dataset.pdfFixed){
      printTech.dataset.pdfFixed='1';
      printTech.onclick=function(){
        if(!$('reportArea')?.innerHTML.trim()) $('reportBtn')?.click();
        setTimeout(()=>printHtml('Relatório técnico LIKE internet', $('reportArea')?.innerHTML||''),200);
      };
    }
    const printGer = $('printGerReport');
    if(printGer && !printGer.dataset.pdfFixed){
      printGer.dataset.pdfFixed='1';
      printGer.onclick=function(){
        if(!$('gerReportArea')?.innerHTML.trim()) $('genGerReport')?.click();
        setTimeout(()=>printHtml('Relatório gerencial LIKE internet', $('gerReportArea')?.innerHTML||''),200);
      };
    }
  }
  document.addEventListener('DOMContentLoaded',()=>{
    setInterval(hookPdfButtons,700);
    setTimeout(hookPdfButtons,1200);
  });
})();