import { table, call } from './api.js?v=2';

const S = { modelos: [], locais: [], equipamentos: [] };
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const br = (v) => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const opId = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2);
const ativo = (x) => x && x.ativo !== false;

function msg(text, type=''){
  const el = $('entradaMsg');
  if(!el) return;
  el.textContent = text;
  el.className = 'msg show ' + type;
}

function nomeModelo(m){ return [m.tipo,m.marca,m.modelo].filter(Boolean).join(' '); }
function isPatrimonio(m){
  const c = String(m.categoria_estoque || m.categoria || m.controle || '').toLowerCase();
  if(c.includes('consumo') || c.includes('material')) return false;
  return true;
}
function norm(v){ return String(v || '').trim(); }
function normMac(v){ return norm(v).toUpperCase(); }
function numberValue(id){ return Number($(id)?.value || 0) || 0; }

function inject(){
  if(!$('navEntradaClean')){
    const cad = document.querySelector('[data-page="cadastros"]');
    const btn = document.createElement('button');
    btn.id = 'navEntradaClean';
    btn.className = 'nav';
    btn.dataset.page = 'entrada-clean';
    btn.textContent = 'Entrada';
    btn.onclick = showPage;
    cad ? cad.insertAdjacentElement('afterend', btn) : document.querySelector('.sidebar').appendChild(btn);
  }

  if(!$('page-entrada-clean')){
    const sec = document.createElement('section');
    sec.id = 'page-entrada-clean';
    sec.className = 'page';
    sec.innerHTML = `
      <div class="card">
        <div class="table-head">
          <div>
            <h2>Entrada de equipamento</h2>
            <p>Entrada patrimonial limpa via RPC. Não grava direto na tabela de equipamentos.</p>
          </div>
          <button id="entradaReload" class="secondary">Recarregar dados</button>
        </div>
        <div id="entradaMsg" class="msg"></div>
      </div>

      <div class="grid two">
        <form id="entradaForm" class="card form-card">
          <h2>Dados do equipamento</h2>
          <select id="entradaModeloSelect"></select>
          <div class="form-grid three-mini">
            <input id="entradaTipo" placeholder="Tipo. Ex: ONU, Roteador">
            <input id="entradaMarca" placeholder="Marca">
            <input id="entradaModelo" placeholder="Modelo">
          </div>
          <div class="form-grid two">
            <input id="entradaMac" placeholder="MAC">
            <input id="entradaSerial" placeholder="Serial / SN">
          </div>
          <div class="form-grid two">
            <select id="entradaLocal"></select>
            <input id="entradaCusto" type="number" min="0" step="0.01" placeholder="Custo">
          </div>
          <div class="form-grid two">
            <input id="entradaFornecedor" placeholder="Fornecedor">
            <input id="entradaNf" placeholder="NF / Documento">
          </div>
          <input id="entradaResponsavel" placeholder="Responsável pela entrada">
          <input id="entradaObs" placeholder="Observação">
          <div class="actions">
            <button class="primary" type="submit">Registrar entrada</button>
            <button class="secondary" id="entradaLimpar" type="button">Limpar</button>
          </div>
        </form>

        <div class="card">
          <h2>Resumo antes de salvar</h2>
          <div id="entradaPreview" class="list"></div>
          <div class="msg show warn">Regra: informe pelo menos MAC ou Serial. A entrada será criada em estoque e com histórico preservado.</div>
        </div>
      </div>

      <div class="card">
        <div class="table-head">
          <h2>Últimas entradas / equipamentos recentes</h2>
          <input id="entradaBusca" placeholder="Filtrar código, MAC, serial, modelo ou local">
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Equipamento</th><th>MAC/SN</th><th>Status</th><th>Local</th><th>Custo</th><th>Entrada</th></tr></thead>
            <tbody id="entradaTbody"></tbody>
          </table>
        </div>
      </div>`;
    document.querySelector('.main').appendChild(sec);
  }

  $('entradaReload').onclick = () => loadEntrada().catch(e=>msg(e.message,'bad'));
  $('entradaForm').onsubmit = salvarEntrada;
  $('entradaLimpar').onclick = limparForm;
  $('entradaModeloSelect').onchange = selecionarModelo;
  ['entradaTipo','entradaMarca','entradaModelo','entradaMac','entradaSerial','entradaLocal','entradaCusto','entradaFornecedor','entradaNf','entradaResponsavel','entradaObs'].forEach(id=>{
    const el = $(id); if(el) el.addEventListener('input', renderPreview);
  });
  $('entradaBusca').oninput = renderTabela;
}

function showPage(){
  inject();
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.id === 'navEntradaClean'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-entrada-clean'));
  const title = $('pageTitle');
  if(title) title.textContent = 'Entrada';
  loadEntrada().catch(e=>msg(e.message,'bad'));
}

async function loadEntrada(){
  msg('Carregando modelos, locais e equipamentos...', 'warn');
  S.modelos = await table('modelos','tipo',true);
  S.locais = await table('locais','nome',true);
  S.equipamentos = await table('equipamentos','created_at',false);
  fillSelects();
  renderPreview();
  renderTabela();
  msg('Entrada pronta para uso.', 'ok');
}

function fillSelects(){
  const modelos = S.modelos.filter(ativo).filter(isPatrimonio);
  $('entradaModeloSelect').innerHTML = '<option value="">Selecionar produto/modelo cadastrado</option>' + modelos.map(m=>`<option value="${m.id}">${esc(nomeModelo(m))}</option>`).join('');
  const locais = S.locais.filter(ativo);
  const opts = locais.map(l=>`<option value="${esc(l.nome)}">${esc(l.nome)}</option>`).join('');
  $('entradaLocal').innerHTML = opts || '<option value="Estoque central">Estoque central</option>';
  if(!$('entradaLocal').value){
    const central = locais.find(l => String(l.nome || '').toLowerCase().includes('estoque'));
    $('entradaLocal').value = central?.nome || 'Estoque central';
  }
}

function selecionarModelo(){
  const id = $('entradaModeloSelect').value;
  const m = S.modelos.find(x=>x.id===id);
  if(!m) return renderPreview();
  $('entradaTipo').value = m.tipo || '';
  $('entradaMarca').value = m.marca || '';
  $('entradaModelo').value = m.modelo || '';
  $('entradaCusto').value = m.custo_padrao || m.custo || 0;
  renderPreview();
}

function payload(){
  const tipo = norm($('entradaTipo').value);
  const marca = norm($('entradaMarca').value);
  const modelo = norm($('entradaModelo').value);
  const mac = normMac($('entradaMac').value);
  const serial = norm($('entradaSerial').value).toUpperCase();
  const local = norm($('entradaLocal').value) || 'Estoque central';
  const custo = numberValue('entradaCusto');
  const fornecedor = norm($('entradaFornecedor').value);
  const nf = norm($('entradaNf').value);
  const responsavel = norm($('entradaResponsavel').value);
  const obs = norm($('entradaObs').value);
  if(!tipo || !marca || !modelo) throw new Error('Selecione ou preencha tipo, marca e modelo.');
  if(!mac && !serial) throw new Error('Informe pelo menos MAC ou Serial/SN.');
  return { tipo, marca, modelo, mac, serial, local, custo, fornecedor, nf, responsavel, obs };
}

function renderPreview(){
  let p;
  try{ p = payload(); }
  catch(e){
    $('entradaPreview').innerHTML = `<div class="item"><b>Pendente</b><small>${esc(e.message)}</small></div>`;
    return;
  }
  $('entradaPreview').innerHTML = `
    <div class="item"><div><b>${esc(p.tipo)} ${esc(p.marca)} ${esc(p.modelo)}</b><br><small>${esc(p.mac || p.serial)}</small></div><span class="badge">${br(p.custo)}</span></div>
    <div class="item"><div><b>Local</b><br><small>${esc(p.local)}</small></div><span class="badge">Em estoque</span></div>
    <div class="item"><div><b>Origem</b><br><small>${esc([p.fornecedor,p.nf].filter(Boolean).join(' • ') || 'Não informada')}</small></div></div>
    <div class="item"><div><b>Responsável</b><br><small>${esc(p.responsavel || 'Não informado')}</small></div></div>`;
}

async function salvarEntrada(ev){
  ev.preventDefault();
  try{
    const p = payload();
    msg('Registrando entrada via RPC...', 'warn');
    const result = await call('rpc_registrar_entrada_equipamento', {
      p_tipo: p.tipo,
      p_marca: p.marca,
      p_modelo: p.modelo,
      p_mac: p.mac,
      p_serial: p.serial,
      p_local: p.local,
      p_custo: p.custo,
      p_observacao: p.obs,
      p_fornecedor: p.fornecedor,
      p_nf: p.nf,
      p_responsavel: p.responsavel,
      p_client_operation_id: opId()
    });
    msg(`Entrada registrada com sucesso. Código: ${result?.codigo || 'gerado'}.`, 'ok');
    limparForm(false);
    await loadEntrada();
  }catch(e){ msg(e.message || String(e), 'bad'); }
}

function limparForm(clearMsg=true){
  ['entradaModeloSelect','entradaTipo','entradaMarca','entradaModelo','entradaMac','entradaSerial','entradaCusto','entradaFornecedor','entradaNf','entradaResponsavel','entradaObs'].forEach(id=>{ if($(id)) $(id).value=''; });
  if(clearMsg) msg('Formulário limpo.', 'ok');
  renderPreview();
}

function renderTabela(){
  const filtro = ($('entradaBusca')?.value || '').toLowerCase();
  const rows = S.equipamentos
    .filter(e => !filtro || JSON.stringify(e).toLowerCase().includes(filtro))
    .slice(0,40);
  $('entradaTbody').innerHTML = rows.map(e=>`
    <tr>
      <td><b>${esc(e.codigo || '-')}</b></td>
      <td>${esc(nomeModelo(e))}</td>
      <td>${esc(e.mac || e.serial || '-')}</td>
      <td><span class="badge">${esc(e.status || '-')}</span></td>
      <td>${esc(e.local || '-')}</td>
      <td>${br(e.custo)}</td>
      <td>${esc(e.created_at ? new Date(e.created_at).toLocaleString('pt-BR') : '-')}</td>
    </tr>`).join('') || '<tr><td colspan="7">Nenhum equipamento encontrado.</td></tr>';
}

inject();
window.entradaCleanLoad = loadEntrada;
