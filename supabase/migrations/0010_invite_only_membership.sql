-- 0010: membership by invitation.
--
-- Every RLS policy in this schema scopes rows to the caller's organization,
-- which is correct. The hole was upstream of them: handle_new_user put every
-- new signup into one hard-coded organization, so anyone who could reach the
-- signup form landed inside the tenant that holds the client data. The
-- policies were doing their job — the membership rule was the problem.
--
-- After this, a profile is only created when an invitation exists for that
-- email address. Signing up without one leaves an auth user with no profile,
-- which every policy already treats as belonging to nothing: they see an
-- empty application, not somebody else's companies.
--
-- Fail-closed by omission rather than by raising. A trigger that raised would
-- abort the auth.users insert, and a bug in this function would then lock
-- everyone out of signing up at all.
--
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------------

create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  -- Always lower-cased, enforced rather than assumed: a unique index on
  -- lower(email) would be case-safe but cannot be named in an ON CONFLICT
  -- target, which is what re-inviting an address needs.
  email text not null unique check (email = lower(email)),
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null
);

alter table public.organization_invites enable row level security;

-- Only members of the inviting organization can see or manage its invitations,
-- and an invitee cannot read the table at all before they have a profile —
-- which is the point at which they would learn nothing new anyway.
drop policy if exists "organization members can read invites" on public.organization_invites;
create policy "organization members can read invites"
  on public.organization_invites for select
  using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
  );

drop policy if exists "organization admins can manage invites" on public.organization_invites;
create policy "organization admins can manage invites"
  on public.organization_invites for all
  using (
    organization_id in (
      select organization_id from public.profiles
      where id = auth.uid() and role in ('owner', 'admin')
    )
  )
  with check (
    organization_id in (
      select organization_id from public.profiles
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- Everyone already here keeps their access
-- ---------------------------------------------------------------------------
-- Existing members are grandfathered, and the first of them is promoted to
-- owner so there is somebody who can issue invitations. Without this the new
-- admin-only policy would leave nobody able to invite anyone.

update public.profiles
set role = 'owner'
where id = (
  select id from public.profiles
  where organization_id = '00000000-0000-0000-0000-000000000001'
  order by created_at asc
  limit 1
)
and not exists (
  select 1 from public.profiles
  where organization_id = '00000000-0000-0000-0000-000000000001'
    and role in ('owner', 'admin')
);

-- ---------------------------------------------------------------------------
-- The membership rule
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.organization_invites%rowtype;
begin
  select * into invite
  from public.organization_invites
  where lower(email) = lower(new.email)
    and accepted_at is null
    and expires_at > now()
  limit 1;

  -- No invitation, no membership. The account exists but belongs to no
  -- organization, so every policy returns nothing for it.
  if invite.id is null then
    return new;
  end if;

  insert into public.profiles (id, organization_id, full_name, role)
  values (
    new.id,
    invite.organization_id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    invite.role
  )
  on conflict (id) do nothing;

  update public.organization_invites
  set accepted_at = now(), accepted_by = new.id
  where id = invite.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
