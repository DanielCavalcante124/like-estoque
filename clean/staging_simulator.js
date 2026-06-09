const KEY = 'like_staging_simulacoes_v1';

function readLog(){
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch(e){ return []; }
}

function writeLog(log){
  localStorage.setItem(KEY, JSON.stringify(log.slice(-200)));
}

function protocolo(){
  return 'SIM-' + new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14) + '-' + Math.random().toString(16).slice(2,6).toUpperCase();
}

function codigo(prefix='SIM'){
  return prefix + '-' + Math.random().toString(36).slice(2,8).toUpperCase();
}

function firstItem(params){
  if(Array.isArray(params?.p_itens)) return params.p_itens[0] || {};
  return params || {};
}

function entradaIndividual(params){
  return {
    simulated: true,
    codigo: codigo('EQ-SIM'),
    status: 'Em estoque',
    tipo: params.p_tipo || params.tipo || 'Teste',
    marca: params.p_marca || params.marca || 'Simulado',
    modelo: params.p_modelo || params.modelo || 'Homologação',
    mac: params.p_mac || params.mac || '',
    serial: params.p_serial || params.serial || '',
    local: params.p_local || params.local || 'Estoque central',
    custo: params.p_custo || params.custo || 0
  };
}

function entradaLote(params){
  const itens = Array.isArray(params?.p_itens) ? params.p_itens : [];
  return itens.map((item, idx) => ({
    simulated: true,
    linha: idx + 1,
    codigo: codigo('EQ-SIM'),
    status: 'Em estoque',
    tipo: item.tipo || 'Teste',
    marca: item.marca || 'Simulado',
    modelo: item.modelo || 'Homologação',
    mac: item.mac || '',
    serial: item.serial || '',
    local: item.local || 'Estoque central',
    custo: item.custo || 0
  }));
}

function genericMovimento(name, params){
  const item = firstItem(params);
  return {
    simulated: true,
    ok: true,
    protocolo: protocolo(),
    rpc: name,
    codigo: item.codigo || item.p_codigo || codigo('MOV-SIM'),
    status: 'Simulado',
    mensagem: 'Operação simulada no ambiente de teste. Nada foi gravado no Supabase real.'
  };
}

export function simulateRpc(name, params){
  let result;

  if(name === 'rpc_registrar_entrada_equipamento') result = entradaIndividual(params || {});
  else if(name === 'rpc_registrar_entrada_equipamento_lote') result = entradaLote(params || {});
  else result = genericMovimento(name, params || {});

  const log = readLog();
  log.push({
    id: protocolo(),
    created_at: new Date().toISOString(),
    rpc: name,
    params,
    result
  });
  writeLog(log);

  console.info('[LIKE Estoque][STAGING] RPC simulada:', name, result);
  return result;
}

export function listarSimulacoes(){
  return readLog();
}

export function limparSimulacoes(){
  localStorage.removeItem(KEY);
}
