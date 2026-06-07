let sb = null;

export function cfg(){
  try { return JSON.parse(localStorage.getItem('like_cfg_v26') || '{}'); }
  catch(e){ return {}; }
}

export function save(c){
  localStorage.setItem('like_cfg_v26', JSON.stringify({ ...cfg(), ...c }));
}

export function init(url, token){
  if(!url || !token) throw new Error('Informe URL e chave do Supabase.');
  sb = window.supabase.createClient(url, token);
  return sb;
}

export function db(){
  if(!sb){ const c = cfg(); init(c.url, c.key); }
  return sb;
}

export async function signIn(email, password){
  const r = await db().auth.signInWithPassword({ email, password });
  if(r.error) throw r.error;
  save({ email });
  return r.data;
}

export async function signOut(){ await db().auth.signOut(); }
export async function session(){ const r = await db().auth.getSession(); if(r.error) throw r.error; return r.data.session; }
export async function table(name, order='created_at', asc=false){ const r = await db().from(name).select('*').order(order,{ascending:asc}); if(r.error) throw r.error; return r.data || []; }
export async function call(name, params){ const r = await db().rpc(name, params || {}); if(r.error) throw r.error; return Array.isArray(r.data) ? r.data[0] : r.data; }
