let modalEl = null;
let resolver = null;

function ensureModal(){
  if(modalEl) return modalEl;

  const style = document.createElement('style');
  style.id = 'movimentacaoModalStyle';
  style.textContent = `
    .mov-modal{position:fixed;inset:0;background:rgba(15,23,42,.66);z-index:99999;display:none;align-items:center;justify-content:center;padding:18px}
    .mov-modal.open{display:flex}
    .mov-modal-box{background:#fff;border-radius:22px;max-width:760px;width:100%;padding:24px;box-shadow:0 32px 90px rgba(0,0,0,.38);border:1px solid rgba(15,23,42,.08)}
    .mov-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
    .mov-modal-title{margin:0;font-size:22px;color:#0f172a;letter-spacing:-.3px}
    .mov-modal-subtitle{margin:4px 0 0;color:#64748b;font-size:13px;line-height:1.45}
    .mov-modal-close{border:0;background:#f1f5f9;color:#334155;border-radius:12px;padding:8px 11px;font-weight:900;cursor:pointer}
    .mov-modal-body{margin:14px 0;max-height:62vh;overflow:auto;padding-right:2px}
    .mov-modal-actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:16px}
    .mov-modal-actions button{border:0;border-radius:14px;padding:12px 16px;font-weight:800;cursor:pointer}
    .mov-modal-confirm{background:linear-gradient(135deg,#0f4c81 0%,#0b6aa8 100%);color:#fff;box-shadow:0 10px 24px rgba(15,76,129,.22)}
    .mov-modal-confirm.danger{background:linear-gradient(135deg,#991b1b 0%,#dc2626 100%);box-shadow:0 10px 24px rgba(153,27,27,.22)}
    .mov-modal-cancel{background:#e2e8f0;color:#0f172a}
    @media(max-width:640px){.mov-modal{padding:10px;align-items:flex-end}.mov-modal-box{border-radius:20px;padding:18px}.mov-modal-actions{flex-direction:column-reverse}.mov-modal-actions button{width:100%}}
  `;
  document.head.appendChild(style);

  modalEl = document.createElement('div');
  modalEl.id = 'movimentacaoModal';
  modalEl.className = 'mov-modal';
  modalEl.innerHTML = `
    <div class="mov-modal-box" role="dialog" aria-modal="true" aria-labelledby="movimentacaoModalTitle">
      <div class="mov-modal-head">
        <div>
          <h2 id="movimentacaoModalTitle" class="mov-modal-title">Confirmar movimentação</h2>
          <p id="movimentacaoModalSubtitle" class="mov-modal-subtitle">Revise os dados antes de confirmar.</p>
        </div>
        <button id="movimentacaoModalClose" class="mov-modal-close" type="button" aria-label="Fechar">×</button>
      </div>
      <div id="movimentacaoModalBody" class="mov-modal-body"></div>
      <div class="mov-modal-actions">
        <button id="movimentacaoModalCancel" class="mov-modal-cancel" type="button">Cancelar</button>
        <button id="movimentacaoModalConfirm" class="mov-modal-confirm" type="button">Confirmar</button>
      </div>
    </div>`;
  document.body.appendChild(modalEl);

  const close = () => resolveAndClose(false);
  modalEl.addEventListener('click', ev => { if(ev.target === modalEl) close(); });
  modalEl.querySelector('#movimentacaoModalClose').onclick = close;
  modalEl.querySelector('#movimentacaoModalCancel').onclick = close;
  modalEl.querySelector('#movimentacaoModalConfirm').onclick = () => resolveAndClose(true);
  document.addEventListener('keydown', ev => {
    if(ev.key === 'Escape' && modalEl?.classList.contains('open')) close();
  });
  return modalEl;
}

function resolveAndClose(value){
  if(!modalEl) return;
  modalEl.classList.remove('open');
  const r = resolver;
  resolver = null;
  if(r) r(value);
}

export function openMovimentacaoModal({ title='Confirmar movimentação', subtitle='Revise os dados antes de confirmar.', html='', confirmText='Confirmar', cancelText='Cancelar', danger=false } = {}){
  const modal = ensureModal();
  modal.querySelector('#movimentacaoModalTitle').textContent = title;
  modal.querySelector('#movimentacaoModalSubtitle').textContent = subtitle;
  modal.querySelector('#movimentacaoModalBody').innerHTML = html;
  modal.querySelector('#movimentacaoModalCancel').textContent = cancelText;
  const confirm = modal.querySelector('#movimentacaoModalConfirm');
  confirm.textContent = confirmText;
  confirm.classList.toggle('danger', !!danger);
  modal.classList.add('open');
  return new Promise(resolve => { resolver = resolve; });
}
