let client = null;

export function readConfig(){
  try{
    const saved = JSON.parse(localStorage.getItem('like_cfg_v26') || localStorage.getItem('like_cfg_v25') || '{}');
    return { url: saved.url || '', key: saved.key || '', email: saved.email || '' };
  }catch(e){
    return { url: '', key: '', email: '' };
  }
}

export function saveConfig(cfg){
  const current = readConfig();
  localStorage.setItem('like_cfg_v26', JSON.stringify({ ...current, ...cfg }));
}

export function initClient(url, key){
  if(!url || !key) throw new Error('Informe URL e chave pública do Supabase.');
  client = window.supabase.createClient(url, key);
  return client;
}

export function getClient(){
  if(!client){
    const cfg = readConfig();
    initClient(cfg.url, cfg.key);
  }
  return client;
}

export async function login(email, password){
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if(error) throw error;
  saveConfig({ email });
  return data;
}

export async function logout(){
  const { error } = await getClient().auth.signOut();
  if(error) throw error;
}

export async function getSession(){
  const { data, error } = await getClient().auth.getSession();
  if(error) throw error;
  return data.session;
}

export async function loadTable(table, order = 'created_at', ascending = false){
  const { data, error } = await getClient().from(table).select('*').order(order, { ascending });
  if(error) throw error;
  return data || [];
}

export async function rpc(name, params){
  const { data, error } = await getClient().rpc(name, params || {});
  if(error) throw error;
  return Array.isArray(data) ? data[0] : data;
}
