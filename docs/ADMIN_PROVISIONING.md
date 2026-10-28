# Admin user provisioning (manual)

There is **no public registration** and **no auto-provisioning**.

## Create the first ADMIN

1. Create a user in Supabase Auth (Dashboard → Authentication → Users), or use `npx tsx scripts/create-admin.ts`.
2. Ensure `auth.users.id` is known.
3. Insert a matching `public.users` row:

```sql
insert into public.users (id, email, name, role, is_active)
values (
  '<auth-user-uuid>',
  'admin@example.com',
  'Admin User',
  'ADMIN',
  true
);
```

4. Confirm:
   - Auth login succeeds
   - `public.users.id` equals `auth.users.id`
   - `role = ADMIN` and `is_active = true`

## In-app provisioning (Step 9+)

ADMINs can provision users from **Settings** when `SUPABASE_SERVICE_ROLE_KEY`
is set in the server environment. That flow invites/creates the Auth user and
inserts the matching `public.users` row (no public self-registration).

Manual SQL / `scripts/create-admin.ts` remain valid for bootstrap.
