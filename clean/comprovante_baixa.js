const C = { pendente:null, ultimo:null, oldUuid:null, instalado:false, observer:null, tentativas:0 };
const $ = id => document.getElementById(id);
const norm = v => String(v || '').trim();
const safe = v => String(v || 'comprovante').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'comprovante';
const nowBR = () => new Date().toLocaleString('pt-BR');
const today = () => new Date().toISOString().slice(0,10);

function msg(text,type='ok'){
  const el = $('baixaMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}
function selectedText(id){
  const el = $(id);
  return el?.selectedOptions?.[0]?.textContent?.trim() || '';
}
function capture(){
  const opt = $('baixaEquipamento')?.selectedOptions?.[0];
  if(!opt || !opt.value) return null;
  return {
    protocolo: 'CMP-' + Date.now(),
    gerado_em: nowBR(),
    equipamento_id: opt.value,
    equipamento: opt.textContent.trim(),
    responsavel: selectedText('baixaResponsavel') || norm($('baixaResponsavel')?.value),
    motivo: norm($('baixaMotivo')?.value),
    observacao: norm($('baixaObs')?.value)
  };
}
function texto(c){
  return [
    'COMPROVANTE DE BAIXA CONTROLADA',
    'Protocolo: ' + (c.protocolo || '-'),
    'Data/Hora: ' + (c.gerado_em || nowBR()),
    'Responsável: ' + (c.responsavel || '-'),
    'Motivo: ' + (c.motivo || '-'),
    c.observacao ? 'Obs: ' + c.observacao : '',
    '',
    'EQUIPAMENTO:',
    c.equipamento || '-',
    '',
    'Registro de baixa lógica mantido para auditoria interna.'
  ].filter(x => x !== '').join('\n');
}
async function copiar(c, show=true){
  const t = texto(c);
  try{
    await navigator.clipboard.writeText(t);
    if(show) msg('Comprovante copiado para WhatsApp.', 'ok');
  }catch(e){
    window.prompt('Copie o comprovante:', t);
  }
}
function pdf(c){
  if(!window.jspdf?.jsPDF) throw new Error('Biblioteca jsPDF não carregou.');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  let y = 14;
  const add = (txt, bold=false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(String(txt || '-'), 186);
    lines.forEach(line => { if(y > 282){ doc.addPage(); y = 16; } doc.text(line, 12, y); y += 5; });
  };
  doc.setFontSize(16); add('LIKE Estoque', true); y += 3;
  doc.setFontSize(13); add('Comprovante de baixa controlada', true); y += 3;
  doc.setFontSize(9);
  add('Protocolo: ' + (c.protocolo || '-') + ' | Gerado em: ' + (c.gerado_em || nowBR()));
  add('Responsável: ' + (c.responsavel || '-'));
  add('Motivo: ' + (c.motivo || '-'));
  add('Observação: ' + (c.observacao || '-'));
  y += 4; doc.line(12, y, 198, y); y += 7;
  doc.setFontSize(12); add('Equipamento', true);
  doc.setFontSize(9); add(c.equipamento || '-');
  y += 18;
  if(y > 250){ doc.addPage(); y = 30; }
  doc.line(20, y, 90, y); doc.line(120, y, 190, y); y += 5;
  doc.text('Responsável pela baixa', 33, y); doc.text('Conferência / Auditoria', 138, y);
  doc.setFontSize(8); doc.text('Documento gerado pelo LIKE Estoque - baixa lógica sem exclusão física.', 12, 290);
  doc.save(`comprovante_baixa_${safe(c.equipamento)}_${today()}.pdf`);
}
function addUltimoButton(){
  if($('baixaUltimoComprovante')) return true;
  const limpar = $('baixaLimpar');
  if(!limpar) return false;
  const b = document.createElement('button');
  b.id = 'baixaUltimoComprovante';
  b.className = 'secondary';
  b.type = 'button';
  b.textContent = 'Último comprovante';
  b.onclick = () => C.ultimo ? copiar(C.ultimo) : msg('Nenhum comprovante gerado nesta sessão.', 'warn');
  limpar.insertAdjacentElement('beforebegin', b);
  return true;
}
function processarSucesso(textoMsg){
  if(!C.pendente || !/Baixa registrada/i.test(textoMsg || '')) return;
  const c = C.pendente;
  C.pendente = null;
  C.ultimo = c;
  let pdfMsg = '';
  try{ pdf(c); pdfMsg = ' PDF gerado.'; }catch(e){ pdfMsg = ' PDF não gerado: ' + e.message + '.'; }
  copiar(c, false).finally(() => msg('Baixa registrada. Comprovante WhatsApp copiado.' + pdfMsg, 'ok'));
}
function bind(){
  const form = $('baixaForm');
  const msgEl = $('baixaMsg');
  if(!form || !msgEl) return false;

  addUltimoButton();

  if(!form.dataset.comprovanteBaixaBound){
    form.dataset.comprovanteBaixaBound = '1';
    form.addEventListener('submit', () => {
      const c = capture();
      if(c) C.pendente = c;
    }, true);
  }

  if(!C.observer || C.observer.target !== msgEl){
    if(C.observer?.disconnect) C.observer.disconnect();
    const obs = new MutationObserver(() => processarSucesso(msgEl.textContent || ''));
    obs.observe(msgEl, { childList:true, characterData:true, subtree:true });
    obs.target = msgEl;
    C.observer = obs;
  }

  C.instalado = true;
  return true;
}
function boot(){
  bind();
  const timer = setInterval(() => {
    C.tentativas += 1;
    const ok = bind();
    if(ok && $('baixaUltimoComprovante')) clearInterval(timer);
    if(C.tentativas > 80) clearInterval(timer);
  }, 250);
}
boot();
document.addEventListener('click', () => setTimeout(bind, 80));
document.addEventListener('input', () => setTimeout(bind, 80));
window.baixaComprovanteLoad = boot;
