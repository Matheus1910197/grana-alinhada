create extension if not exists pgcrypto;


create table if not exists public.profiles (

    id uuid primary key
        references auth.users(id)
        on delete cascade,

    full_name text,

    created_at timestamptz
        not null
        default now()

);


create table if not exists public.transactions (

    id uuid primary key
        default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    description text not null,

    amount numeric(12,2)
        not null
        check(amount > 0),

    type text not null
        check(type in ('income', 'expense')),

    category text
        not null
        default 'Outros',

    date date
        not null
        default current_date,

    created_at timestamptz
        not null
        default now()

);


/* RLS */

alter table public.profiles
enable row level security;


alter table public.transactions
enable row level security;


/* PROFILES */

drop policy if exists profiles_select_own
on public.profiles;


create policy profiles_select_own

on public.profiles

for select

to authenticated

using (
    auth.uid() = id
);


drop policy if exists profiles_insert_own
on public.profiles;


create policy profiles_insert_own

on public.profiles

for insert

to authenticated

with check (
    auth.uid() = id
);


drop policy if exists profiles_update_own
on public.profiles;


create policy profiles_update_own

on public.profiles

for update

to authenticated

using (
    auth.uid() = id
)

with check (
    auth.uid() = id
);


/* TRANSACTIONS */

drop policy if exists transactions_select_own
on public.transactions;


create policy transactions_select_own

on public.transactions

for select

to authenticated

using (
    auth.uid() = user_id
);


drop policy if exists transactions_insert_own
on public.transactions;


create policy transactions_insert_own

on public.transactions

for insert

to authenticated

with check (
    auth.uid() = user_id
);


drop policy if exists transactions_update_own
on public.transactions;


create policy transactions_update_own

on public.transactions

for update

to authenticated

using (
    auth.uid() = user_id
)

with check (
    auth.uid() = user_id
);


drop policy if exists transactions_delete_own
on public.transactions;


create policy transactions_delete_own

on public.transactions

for delete

to authenticated

using (
    auth.uid() = user_id
);


/* CRIA PERFIL AUTOMATICAMENTE */

create or replace function public.handle_new_user()

returns trigger

language plpgsql

security definer

set search_path = public

as $$

begin

    insert into public.profiles (
        id,
        full_name
    )

    values (
        new.id,
        coalesce(
            new.raw_user_meta_data->>'full_name',
            ''
        )
    );

    return new;

end;

$$;


drop trigger if exists on_auth_user_created
on auth.users;


create trigger on_auth_user_created

after insert

on auth.users

for each row

execute procedure public.handle_new_user();


/* PERMISSÕES */

grant select, insert, update
on public.profiles
to authenticated;


grant select, insert, update, delete
on public.transactions
to authenticated;