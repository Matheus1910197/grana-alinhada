-- =====================================================
-- GRANA ALINHADA — função de "ping" (keep-alive)
-- Rode UMA vez em: Supabase → SQL Editor
--
-- Cria uma função que só devolve o número 1, sem acessar
-- nenhuma tabela nem dado de usuário. O GitHub Actions chama
-- essa função todo dia para o projeto contar como "ativo".
-- =====================================================

create or replace function public.ping()
returns integer
language sql
stable
set search_path = ''
as $$
    select 1;
$$;

grant execute on function public.ping() to anon, authenticated;
