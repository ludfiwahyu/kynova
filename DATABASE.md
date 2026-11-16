# Kynova database

Kynova stores accounts, workspaces and everything inside them in a database. Each person picks theirs when they sign in: the **local database** that comes with the server, or **their own PostgreSQL or Supabase database**. Everyone who picks the same database shares its accounts and workspaces, and collaborates live, even when each of them runs their own Kynova server.

## Engines

| | SQLite (default) | PostgreSQL | MySQL 8.0.19+ |
|---|---|---|---|
| Chosen when | `DATABASE_URL` is not set | `DATABASE_URL=postgres://...` | `DATABASE_URL=mysql://...` |
| Where the data lives | `data/kynova.db` (moved with `DATA_DIR`) | the PostgreSQL server you run | the MySQL server you run |
| Setup | none | create an empty database, set `DATABASE_URL` | create an empty database, set `DATABASE_URL` |
| Backups | `npm run db:backup` / `db:restore` | `pg_dump` / `pg_restore` | `mysqldump` |
| Live sync between servers | one server per file | yes (LISTEN/NOTIFY) | no: one server per database |

MySQL is for this server's own database (`DATABASE_URL`). The sign-in picker offers PostgreSQL and Supabase. MySQL has nothing like PostgreSQL's LISTEN/NOTIFY, so several Kynova servers on one MySQL database would not see each other's changes live; run one. MariaDB is not supported (the adapter uses MySQL's `AS excluded` row alias).

With SQLite there is nothing to install or start. `npm run dev` and `npm start` create the database file on first run, and bring its structure up to date on every start.

The server prints which engine it is using when it starts.

## Picking a database (each person)

The sign-in screen shows the database in use, with **Change**; once signed in, the top bar shows it, with a settings button beside it. The choices:

- **Local database**: this server's own (above). People collaborate by signing in to the same server.
- **My own database**: a PostgreSQL or Supabase connection string. Kynova creates its tables the first time, in a schema of their own named `kynova`, so they never mix with anything else in the database. Anyone who connects to the same database, through any Kynova server, signs in to the same accounts and sees the same workspaces.

How it works:

- The browser keeps only an id for the database, in a cookie. The connection string stays on the Kynova server, in `data/targets.json`, readable by its owner only. The id is derived with a secret in `data/targets.secret`, so it cannot be guessed from the connection string or from another id.
- Accounts belong to a database, so switching signs you out of the one you leave. Your data stays in each database.
- Every request runs against the database of the person making it ([server/database/context.ts](server/database/context.ts)).
- A Kynova server that is not on 127.0.0.1 refuses databases on private network addresses, as its request proxy does, and connects to the address it checked.

### SSL

| Choice | Meaning |
|---|---|
| Verify certificate (default) | Encrypted, and the server must prove who it is. Paste a CA certificate when it is not signed by a public authority. |
| Require, without verifying | Encrypted, but an impostor on the network could read along. Use only when you cannot get the CA. |
| Off | Not encrypted. Only for a database on the same machine or a trusted network. |

The choice is suggested from the connection string's `sslmode`.

### Supabase

1. In the Supabase dashboard, open **Connect** and copy the **Session pooler** connection string (port 5432), or the direct connection if your network has IPv6. Put your database password in it.
2. For **Verify certificate**, download the CA certificate from **Database settings › SSL Configuration** and paste it.
3. Pick **My own database** in Kynova, paste the string, **Test connection**, then **Use this database**.

Notes:

- The **transaction pooler (port 6543) is refused**: it keeps no session, and Kynova needs one for its schema setting and for live sync.
- Kynova's tables are in the `kynova` schema, which Supabase's API does not expose by default. They also have **row level security** switched on with no policies, so the project's `anon` and `authenticated` keys can read nothing even if the schema is exposed. Kynova connects as the tables' owner, which row level security does not restrict.

### Live sync between servers

Each Kynova server keeps the people connected to it in memory. When several servers share a PostgreSQL database, they tell each other about changes with PostgreSQL `LISTEN/NOTIFY` on the channel `kynova_changes`: which documents changed (each server reads them back from the database), membership changes, and who is in each workspace (repeated every 20 seconds, and forgotten after 60 seconds without news). The local SQLite database has one server, so it needs none of this.

## Tables

All ids are text (UUIDs or random tokens). All times are milliseconds since 1970 (`BIGINT`).

**users**: one row per account.

| Column | Meaning |
|---|---|
| `id` | primary key |
| `email` | unique; stored lowercase |
| `name` | display name |
| `color` | avatar colour |
| `password_hash` | scrypt hash, as `salt:hash` in hex |
| `created_at` | when the account was made |

**sessions**: one row per signed-in browser.

| Column | Meaning |
|---|---|
| `token_hash` | primary key; SHA-256 of the cookie token, so a leaked database cannot be used to sign in |
| `user_id` | → `users.id` |
| `expires_at` | 30 days after sign-in |

**workspaces**

| Column | Meaning |
|---|---|
| `id` | primary key |
| `name` | |
| `created_at` | |

**members**: who belongs to which workspace. Primary key `(workspace_id, user_id)`.

| Column | Meaning |
|---|---|
| `workspace_id` | → `workspaces.id` |
| `user_id` | → `users.id` |
| `role` | `owner`, `editor` or `viewer`; exactly one owner per workspace |

**invites**: invite links.

| Column | Meaning |
|---|---|
| `token` | primary key; the secret in the link |
| `workspace_id` | → `workspaces.id` |
| `role` | `editor` or `viewer` |
| `expires_at` | 7 days after creation |

**docs**: the contents of every workspace. Primary key `(workspace_id, entity, id)`.

| Column | Meaning |
|---|---|
| `workspace_id` | → `workspaces.id` |
| `entity` | `items`, `environments` or `comments` |
| `id` | the document's id |
| `data` | the whole document as JSON text |

**schema_migrations**: which structure changes this database has run (see Migrations).

### Relations

Every reference uses `ON DELETE CASCADE`:

- Deleting a user deletes their sessions and memberships.
- Deleting a workspace deletes its members, invites and docs.

Expired sessions and invites are deleted by the server once an hour.

### What is in `docs.data`

The shapes are defined in [shared/types.ts](shared/types.ts):

- `items`: `Item`, one of four kinds:
  - `collection`: at the top of the tree, `parentId` is `null`.
  - `folder`: inside a collection or another folder.
  - `http`: a request, with method, URL, params, headers, auth and body.
  - `websocket`: a WebSocket request, with its URL.

  Every item has a `parentId` and an `order`, which places it among its siblings.
- `environments`: `Environment`, a name and a list of variables.
- `comments`: `Comment`, a comment on a request. It holds the request's id, the author, the text and the time.

Workspace contents are stored as JSON because the sync protocol always reads and writes whole documents, and a request's nested shape would otherwise need about eight more tables.

The database does not check what is inside `data`. The server checks every document before storing it, in [server/validation.ts](server/validation.ts) and [server/docs.ts](server/docs.ts).

## Migrations

The structure of the database is a numbered list of plain SQL files, one folder per engine, in [server/database/migrations/](server/database/migrations/):

```
server/database/migrations/
  sqlite/0001_initial_schema.sql   0002_index_lookups_by_user.sql   0003_row_level_security_postgresql.sql
  postgres/  (the same names)
  mysql/     (the same names; VARCHAR keys, LONGTEXT documents, binary collation)
  supabase/  (the PostgreSQL files for Supabase, written by npm run db:sql)
```

Whenever Kynova opens a database (the local one at start, a picked one on first use), it runs every migration the database has not run yet, each in its own transaction, and records it in `schema_migrations`. A database made by a newer version of Kynova is refused rather than misread. On PostgreSQL and MySQL, servers starting on the same database at once take turns (an advisory lock, `GET_LOCK` on MySQL), so each migration runs once. On MySQL a structure change commits by itself, so a migration that fails halfway is not undone: fix the cause and start again.

| Version | Name | What it does |
|---|---|---|
| 1 | initial schema | The six tables |
| 2 | index lookups by user | Indexes for listing a person's workspaces and sessions |
| 3 | row level security postgresql | Switches row level security on for the tables Kynova's role owns. Nothing on SQLite or MySQL |

### Running migrations yourself

The app migrates by itself, so these are for preparing a database ahead of time, or for teams that run every schema change through their own tools.

```sh
npm run db:migrate                                   # the local database
npm run db:migrate -- "postgresql://…"               # your PostgreSQL or Supabase, in schema kynova
    [--ssl verify|require|off] [--ca supabase.crt] [--schema kynova]
npm run db:migrate -- "mysql://…"                    # a MySQL database
npm run db:sql                                       # writes the Supabase files below
```

To run the SQL with your own tools, take the files from `server/database/migrations/<engine>/` and run them in order (`psql -f`, `mysql < file`, `sqlite3 kynova.db < file`). Then add a row to `schema_migrations (version, name, applied_at)` for each, so Kynova does not run them again.

For Supabase, `npm run db:sql` writes the PostgreSQL files as `server/database/migrations/supabase/20261113000001_kynova_initial_schema.sql` …, for the SQL editor or `psql`. For `supabase db push`, copy them into your Supabase project's `supabase/migrations/` folder first (the Supabase CLI only looks there). Each creates the `kynova` schema if needed and records its version in `schema_migrations` by itself. Do not edit them; edit the PostgreSQL files and run `npm run db:sql` again (a test checks they match).

### Changing the structure

1. Add a file with the next number to **each** engine's folder, with the same name, such as `0004_add_avatar_url.sql`. A test checks the three folders match. Never edit, rename or remove one that has shipped, because databases that already ran it will not run it again.
2. Write each in its engine's SQL. A step one engine does not need is a file with only a comment.
3. A new table goes in `TABLES` (`server/database/migrations/index.ts`) and in the row level security list of a new PostgreSQL migration.
4. Run `npm run db:sql`, and restart the server; it migrates on start.

```sql
-- sqlite/0004_add_avatar_url.sql and postgres/0004_add_avatar_url.sql
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- mysql/0004_add_avatar_url.sql
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(2048);
```

## Writing queries

All database access goes through the interface in [server/database/types.ts](server/database/types.ts): `all`, `get`, `run`, `exec` and `transaction` (plus `notify` and `onNotify` for live sync). Code reaches the person's database through `db` from `server/database/index.ts`; outside a request, wrap the work in `runIn(target, …)`. Each engine has an adapter in `server/database/adapters/`. A query is written once and runs on all three, as long as it follows these rules:

- Use `?` for parameters. The PostgreSQL adapter numbers them (`$1`, `$2`, ...).
- Quote camelCase aliases: `AS "userId"`. PostgreSQL lowercases unquoted names; the MySQL adapter turns on ANSI_QUOTES so MySQL reads them the same way.
- Use `ON CONFLICT (...) DO NOTHING` or `DO UPDATE SET a = excluded.a`, never `INSERT OR IGNORE` or `REPLACE`. The MySQL adapter rewrites these into `INSERT IGNORE` and `AS excluded ON DUPLICATE KEY UPDATE`.
- Use single quotes for text in SQL; double quotes are names.
- Store times as `BIGINT` milliseconds and JSON as `TEXT`.
- Inside `db.transaction(async (tx) => ...)`, use only `tx`, and await only database calls.

## Backup and restore (SQLite)

```sh
npm run db:backup                       # data/backups/kynova-<date>-<time>.db
npm run db:backup -- my-backup.db       # a file you name
npm run db:restore -- data/backups/kynova-2026-11-12-093005.db
```

- **Backup** is safe while the server runs. It writes a complete copy, including changes not yet folded into the main file, and never changes the database.
- **Restore** needs the server stopped, and refuses to run while something answers on the server's port. Before replacing the database, it saves the current one as `data/backups/before-restore-<date>-<time>.db`, so a restore can be undone. A backup from an older version is migrated when the server next starts.

Backups live in `data/backups/`, which is inside `data/` and not committed to git. Copy them somewhere else to protect against losing the machine.

## Moving the local data

To take what is in the local SQLite database to PostgreSQL, Supabase or MySQL, stop the Kynova server and copy it across. The script creates the tables, refuses a database that already has users, and copies everything in one transaction. The SQLite file is only read.

- **To pick it in the app** (everyone connects to it themselves):
  ```sh
  npm run db:copy-to-postgres -- "postgresql://…" --schema kynova [--ssl verify|require|off] [--ca supabase.crt]
  ```
  Then pick the same database in Kynova, and sign in with your usual account.
- **To make it this server's local database** instead of SQLite:
  ```sh
  npm run db:copy-to-postgres -- postgres://user:password@host:5432/kynova
  DATABASE_URL=postgres://user:password@host:5432/kynova npm start
  ```
- **To MySQL**, as this server's local database:
  ```sh
  npm run db:copy-to-mysql -- mysql://user:password@host:3306/kynova
  DATABASE_URL=mysql://user:password@host:3306/kynova npm start
  ```

The sign-in rate limit is kept in each server's memory, so servers count attempts separately.

## Looking inside

With the server running, open the file read-only so the server is never kept waiting:

```sh
sqlite3 -readonly data/kynova.db
```

For example, `.tables`, or `SELECT email, name FROM users;`.

Graphical tools such as DB Browser for SQLite can also open the file read-only.
