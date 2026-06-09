import { APP_ENV, IS_STAGING, IS_LOCAL, canRunRpc } from './env.js?v=2';

let sb = null;

const DEFAULT_PROD_URL = 'https://yuyeyawigbbjtzghkbbr.supabase.co';
const DEFAULT_PROD_KEY = ['sb_publishable','_9DyOYVHN6035kbUjypbDkA_4zYHk_pI'].join('');
const DEFAULT_LOCAL_URL = 'http://127.0.0.1:54321';
const LEGACY_KEY = 'like_cfg_v26';
const ENV_KEY = 'like_cfg_v27_' + APP_ENV;

function defaultConfig(){
  if(IS_LOCAL){
    return { url: DEFAULT_LOCAL_URL, key: '', email: '', env: APP_ENV };
  }
  return { url: DEFAULT_PROD_URL, key: DEFAULT_PROD_KEY, email: '', env: APP_ENV };
}

function dbTable(name){
  if(!IS_STAGING) return name;
  const map = {
    equipamentos: 'teste_equipamentos',
    movimentos: 'teste_movimentos'
  };
  return map[name] || name;
}

function dbRpc(name){
  if(!IS_STAGING) return name;
  if(canRunRpc(name)) return name;
  return 'teste_' + name;
}

export function cfg(){
  try {
    const base = defaultConfig();
    const saved = JSON.parse(localStorage.getItem(ENV_KEY) || '{}');
    return {
      url: saved.url || base.url,
      key: saved.key || base.key,
      email: saved.email || '',
      env: APP_ENV
    };
  } catch(e){
    return defaultConfig();
  }
}

export function save(c){
  const current = cfg();
  const next = { ...current, ...c, env: APP_ENV };
  localStorage.setItem(ENV_KEY, JSON.stringify(next));
  if(APP_ENV !== 'production'){
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '{}');
    const safeLegacy = { ...legacy, email: next.email || legacy.email || '' };
    localStorage.setItem(LEGACY_KEY, JSON.stringify(safeLegacy));
  }
}

export function init(url, token){
  const finalUrl = url || cfg().url;
  const finalToken = token || cfg().key;
  if(!finalUrl || !finalToken) throw new Error('Configuração do Supabase ausente para o ambiente ' + APP_ENV + '.');
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
export async function table(name, order='created_at', asc=false){ const r = await db().from(dbTable(name)).select('*').order(order,{ascending:asc}); if(r.error) throw r.error; return r.data || []; }
export async function call(name, params){ const r = await db().rpc(dbRpc(name), params || {}); if(r.error) throw r.error; return r.data; }
export function first(data){ return Array.isArray(data) ? data[0] : data; }
export function appEnvironment(){ return APP_ENV; }
export function isStaging(){ return IS_STAGING; }
export function isLocal(){ return IS_LOCAL; }
