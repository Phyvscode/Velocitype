# KeyTap backend + auth

Your backend is Supabase (Postgres + Auth) — no separate server needed. This
package adds: the database schema/security policies, an auth context, a
sign in/sign up screen, and the small App/SetupScreen wiring that gates the
game behind login.

## 1. Create/point at a Supabase project

1. Go to https://supabase.com → New project.
2. Project Settings → API → copy the **Project URL** and **anon public key**.
3. Copy `.env.example` to `.env` in your app root and fill those in:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

## 2. Run the migration

Supabase dashboard → SQL Editor → paste the contents of
`supabase/migrations/0001_init.sql` → Run.

(Or, if you use the CLI: `supabase db push` from a project with this
migrations folder linked to your project.)

This creates `public.saved_words` with Row Level Security so each user can
only see, insert, and delete their own rows. `user_id` defaults to
`auth.uid()`, so the existing insert in `ResultsScreen.tsx`
(`supabase.from('saved_words').insert({ word, meaning })`) keeps working
unchanged — Postgres fills in the owner automatically.

## 3. Enable email auth

Dashboard → Authentication → Providers → **Email** should already be on by
default. Two things worth checking:

- **Confirm email**: on by default. Turn it off in Authentication → Settings
  if you want users typing/playing immediately after sign up without
  checking their inbox.
- **Site URL / Redirect URLs**: Authentication → URL Configuration — add
  `http://localhost:5173` (and your deployed URL) so confirmation links
  work.

## 4. Drop these files into your app

No new npm packages are needed — `@supabase/supabase-js` is already a
dependency. Just add the new files and replace the two that changed:

```
src/
  contexts/
    AuthContext.tsx        # NEW — session state, signIn/signUp/signOut
  components/
    AuthScreen.tsx          # NEW — sign in / sign up UI
    SetupScreen.tsx          # CHANGED — adds sign-out button + email in header
  App.tsx                   # CHANGED — shows AuthScreen until a session exists
  main.tsx                  # CHANGED — wraps <App /> in <AuthProvider>
```

Everything else (`GameScreen.tsx`, `ResultsScreen.tsx`, `LibraryScreen.tsx`,
`lib/words.ts`, `lib/dictionary.ts`, `lib/supabase.ts`, `index.css`,
`vite-env.d.ts`) is unchanged — RLS handles the per-user scoping
transparently, so those files didn't need edits.

## How the auth flow works

- `AuthProvider` (in `main.tsx`) loads any existing Supabase session on
  mount and subscribes to auth state changes.
- `App.tsx` reads `useAuth()`: shows a spinner while loading, `AuthScreen`
  when there's no user, and the normal game screens once signed in.
- `AuthScreen` toggles between sign in / sign up, calls
  `supabase.auth.signInWithPassword` / `supabase.auth.signUp`, and surfaces
  errors inline.
- `SetupScreen` shows the signed-in email and a sign-out button.

## Full folder structure

```
keytap/
├── .env.example
├── README.md
├── supabase/
│   └── migrations/
│       └── 0001_init.sql
└── src/
    ├── index.css
    ├── main.tsx
    ├── App.tsx
    ├── vite-env.d.ts
    ├── contexts/
    │   └── AuthContext.tsx
    ├── lib/
    │   ├── supabase.ts
    │   ├── dictionary.ts
    │   └── words.ts
    └── components/
        ├── AuthScreen.tsx
        ├── SetupScreen.tsx
        ├── GameScreen.tsx
        ├── ResultsScreen.tsx
        └── LibraryScreen.tsx
```
