create extension if not exists pgcrypto;

create table if not exists public.modelos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  marca text not null,
  modelo text not null,
  custo_padrao numeric default 0,
  estoque_minimo int default 0,
  estoque_ideal int default 0,
  created_at timestamptz default now(),
  unique (tipo, marca, modelo)
);

create table if not exists public.tecnicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.locais (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  tipo text default 'Outro',
  fixo boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.equipamentos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  patrimonio text not null unique,
  tipo text not null,
  marca text not null,
  modelo text not null,
  mac text unique,
  serial text unique,
  status text not null default 'Em estoque',
  local text default 'Estoque central',
  tecnico_atual text,
  cliente_atual text,
  os_atual text,
  motivo_atual text,
  custo numeric default 0,
  inutilizado_data date,
  inutilizado_obs text,
  created_at timestamptz default now()
);

create table if not exists public.movimentos (
  id uuid primary key default gen_random_uuid(),
  equipamento_id uuid references public.equipamentos(id) on delete set null,
  data date default current_date,
  tipo text not null,
  codigo text,
  mac text,
  serial text,
  tecnico text,
  destino text,
  cliente text,
  os text,
  motivo text,
  condicao text,
  status_final text,
  obs text,
  responsavel text,
  fornecedor text,
  nf text,
  created_at timestamptz default now()
);

create table if not exists public.inventario (
  id uuid primary key default gen_random_uuid(),
  equipamento_id uuid references public.equipamentos(id) on delete cascade unique,
  conferido boolean default false,
  data date,
  obs text,
  updated_at timestamptz default now()
);

insert into public.locais (nome, tipo, fixo) values
('Estoque central', 'Estoque', true),
('Bancada técnica', 'Manutenção', false),
('Backup técnico', 'Técnico', false),
('Cliente final', 'Cliente', false),
('Na rua', 'Rua', false),
('Inutilizado', 'Inutilizado', false),
('Garantia', 'Manutenção', false),
('Perdido', 'Inutilizado', false)
on conflict (nome) do nothing;

insert into public.tecnicos (nome, ativo) values
('Daniel', true),
('Yan', true)
on conflict (nome) do nothing;

insert into public.modelos (tipo, marca, modelo, custo_padrao, estoque_minimo, estoque_ideal) values
('ONU', 'Intelbras', 'ONU 110', 180, 5, 15),
('Roteador', 'TP-LINK', 'Archer C50', 220, 3, 10)
on conflict (tipo, marca, modelo) do nothing;

alter table public.modelos enable row level security;
alter table public.tecnicos enable row level security;
alter table public.locais enable row level security;
alter table public.equipamentos enable row level security;
alter table public.movimentos enable row level security;
alter table public.inventario enable row level security;

drop policy if exists "auth all modelos" on public.modelos;
drop policy if exists "auth all tecnicos" on public.tecnicos;
drop policy if exists "auth all locais" on public.locais;
drop policy if exists "auth all equipamentos" on public.equipamentos;
drop policy if exists "auth all movimentos" on public.movimentos;
drop policy if exists "auth all inventario" on public.inventario;

create policy "auth all modelos" on public.modelos for all to authenticated using (true) with check (true);
create policy "auth all tecnicos" on public.tecnicos for all to authenticated using (true) with check (true);
create policy "auth all locais" on public.locais for all to authenticated using (true) with check (true);
create policy "auth all equipamentos" on public.equipamentos for all to authenticated using (true) with check (true);
create policy "auth all movimentos" on public.movimentos for all to authenticated using (true) with check (true);
create policy "auth all inventario" on public.inventario for all to authenticated using (true) with check (true);
