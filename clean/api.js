import { APP_ENV, IS_STAGING, assertRpcAllowed } from './env.js?v=1';

let sb = null;

const DEFAULT_URL = 'https://yuyeyawigbbjtzghkbbr.supabase.co';
const DEFAULT_KEY = ['sb_publishable','_9DyOYVHN6035kbUjypbDkA_4zYHk_pI'].join('');

export function cfg(){
  try {
    const saved = JSON.parse(localStorage.getItem('like_cfg_v26') || '{}');
    return {
      url: saved.url || DEFAULT_URL,
      key: saved.key || DEFAULT_KEY,
      email: saved.email || '',
      env: APP_ENV
    };
  } catch(e){
    return { url: DEFAULT_URL, key: DEFAULT_KEY, email: '', env: APP_ENV };
  }
}

export function save(c){
  const current = cfg();
  const next = { ...current, ...c, env: APP_ENV };
  localStorage.setItem('like_cfg_v26', JSON.stringify(next));
}

export function init(url, token){
  const finalUrl = url || cfg().url;
  const finalToken = token || cfg().key;
  if(!finalUrl || !finalToken) throw new Error('Configuração do Supabase ausente.');
  sb = window.supabase.createClient(finalUrl, finalToken);
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
export async function call(name, params){
  if(IS_STAGING) assertRpcAllowed(name);
  const r = await db().rpc(name, params || {});
  if(r.error) throw r.error;
  return r.data;
}
export function first(data){ return Array.isArray(data) ? data[0] : data; }
export function appEnvironment(){ return APP_ENV; }
export function isStaging(){ return IS_STAGING; }
