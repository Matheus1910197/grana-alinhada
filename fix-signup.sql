-- =====================================================
-- GRANA ALINHADA — correção do cadastro
-- Rode este arquivo UMA vez em: Supabase → SQL Editor
--
-- O que faz:
-- 1) Recria a função que cria o perfil ao cadastrar, de forma
--    segura: se algo falhar no perfil, o cadastro NÃO é bloqueado
--    (antes, qualquer erro aqui virava "Database error saving new user").
-- 2) Recria o gatilho (trigger) em auth.users.
-- 3) Cria o perfil de quem já tem conta mas ficou sem perfil.
-- =====================================================

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;


create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

    insert into public.profiles (id, full_name)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', '')
    )
    on conflict (id) do nothing;

    return new;

exception when others then

    -- Nunca bloqueia o cadastro por causa do perfil
    raise warning 'handle_new_user falhou: %', sqlerrm;
    return new;

end;
$$;


drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute procedure public.handle_new_user();


-- Perfis que ficaram faltando
insert into public.profiles (id, full_name)
select
    u.id,
    coalesce(u.raw_user_meta_data->>'full_name', '')
from auth.users u
where not exists (
    select 1 from public.profiles p where p.id = u.id
);
