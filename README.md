<p align="center">
  <img src="public/favicon.svg" width="96" height="96" alt="Kynova logo">
</p>

<h1 align="center">Kynova</h1>

<p align="center">
  An API client for HTTP and WebSocket APIs, with shared workspaces for teams.<br>
  Every feature is free: no subscription, no plan limits, no payment screen.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-7-3178c6" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-19-61dafb" alt="React">
  <img src="https://img.shields.io/badge/Node.js-24%2B-5fa04e" alt="Node.js 24+">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux%20%7C%20Web-555" alt="Platforms">
  <img src="https://img.shields.io/badge/built%20by-AI-8a5cf6" alt="Built by AI">
  <img src="https://img.shields.io/badge/status-in%20development-orange" alt="Status: in development">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT">
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#get-started">Get started</a> ·
  <a href="#install-and-build-per-device">Install per device</a> ·
  <a href="#configuration">Configuration</a> ·
  <a href="#license-and-credits">License</a>
</p>

<br>

<table>
<tr>
<td width="25%" valign="top">
<h3>⚡ Send anything</h3>
HTTP with any method, WebSocket, twelve authorization types, all signed on the server.
</td>
<td width="25%" valign="top">
<h3>👥 Work together</h3>
Workspaces, roles, live sync, presence and comments, for every account.
</td>
<td width="25%" valign="top">
<h3>🗄️ Your database</h3>
Built-in SQLite that works at once, or your own PostgreSQL, Supabase or MySQL.
</td>
<td width="25%" valign="top">
<h3>🖥️ Runs anywhere</h3>
In the browser next to a small Node server, or as a desktop app for macOS and Windows.
</td>
</tr>
</table>

> [!IMPORTANT]
> **Kynova is built entirely by AI.** Its code, tests and documentation were written by an AI model, directed and reviewed by a person.

> [!NOTE]
> **Still in development.** Features, settings and the database layout can change between versions without notice. Kynova is released under the **MIT License**: you are **free to clone, fork, change and share it**. See [License and credits](#license-and-credits).

---

## Features

**Requests**
- **HTTP:** standard and custom methods, query params synced with the URL, path variables, headers, and raw (JSON, text, XML) or URL-encoded bodies. Send with the button or ⌘/Ctrl + Enter.
- **WebSocket:** connect, send, and read a log of every message.
- **Authorization:** API Key, Basic, Bearer, Digest, Hawk, JWT Bearer, OAuth 1.0, OAuth 2.0 (all five grants, PKCE, auto-refresh), Akamai EdgeGrid, ASAP, AWS Signature and NTLM.
- **Responses:** status with its standard name (`400 Bad Request`), time and size; the body in a read-only code editor coloured by its content type (JSON, HTML, XML, JavaScript, CSS, YAML or text), with folding, indent guides, find and minimap; JSON, HTML and XML laid out automatically, with Show raw to see what arrived; headers; images; a progress bar while large responses arrive.

**Organising**
- **Collections, folders and requests:** drag to reorder or move, select several at once, duplicate, archive and restore; colour tags for collections and environments.
- **Environments and variables:** `{{name}}` anywhere, with suggestions as you type `{{` and details on hover; dynamic variables such as `{{$guid}}`; a Variables side panel with the open request's variables and the active environment.
- **Drafts and Save:** edits stay in your draft until ⌘/Ctrl + S; the last 10 saved versions per request can be opened and restored.
- **Import and export:** Collection v2.1 JSON, round-tripped with key order kept, and environment files; import several files at once, or drop them on the sidebar.
- **Code snippets:** cURL, HTTP, C (libcurl), C# (HttpClient, RestSharp), Dart (dio, http), Go, Java (OkHttp, Unirest), JavaScript (fetch, XHR), Node.js (Axios), PHP, Python (Requests) and Ruby, coloured in the editor.
- **History:** requests you sent, grouped by day, kept in your browser.
- **Tabs:** a preview tab for a single click, its own tab for anything opened on purpose; drag tabs to reorder, or drag sidebar rows onto the tab strip; middle click opens a row in the background.

**Editing**
- **Code editor in the VS Code style:** auto-closing brackets, multi-cursor, find and replace, folding, minimap, bracket colours and indent guides, ⌘/ or Ctrl + / to switch lines off with `//` (kept in the body, left out when sent), and word wrap with ⌥Z or Alt + Z.
- **Key/Value tables:** Table or Bulk Edit (`key:value` lines in the code editor, coloured), with an add button.
- **JSON style:** read and type JSON with double, single or no quotes; it is always stored and sent as plain JSON.
- **Console and Issues:** a log of every send, and a list of problems such as invalid JSON or variables with no value.

**Collaboration**
- Accounts and workspaces with owner, editor and viewer roles; invite links that expire after 7 days.
- Live sync, presence (who is online, and which request they have open), and comments on requests.

**Look and feel**
- Light, dark and eight more themes, or follow the system; shape settings (corners, density, icon weight); interface and code fonts; movable panels; keyboard shortcuts for Mac and Windows; zoom with ⌘/Ctrl + = in the desktop app.

---

## How it works

Kynova has two parts:

| Part | What it is | Where it lives |
|---|---|---|
| **Backend (BE)** | A Node.js server: accounts, workspaces, realtime sync (WebSocket), and a proxy that sends your API requests (so there is no CORS problem). | `server/`, `shared/` |
| **Frontend (FE)** | A React app built with Vite: everything you see and click. | `src/` |

The backend needs a database. There are two kinds:

- **Local database (default).** SQLite, built into Node.js. Nothing to install: the backend creates it on first start and keeps it up to date. **If you use the local database, Kynova works right away.**
- **External database.** PostgreSQL, Supabase or MySQL that you run yourself. Use it when a team should share one database, or several servers should sync live. It needs a few extra steps, described under each device below.

The desktop app bundles both parts: it starts the backend on `127.0.0.1` at a free port and shows the frontend in a window.

---

## Get started

The fastest way, on any device with Node.js 24 or newer:

```sh
npm install
npm run dev
```

Open http://localhost:8787 (the `PORT` in .env.local). The backend runs one port up, on 8788, with the local database. Sign up, and start sending requests.

---

## Install and build per device

Every device follows the same pattern:

1. **Prerequisites**
2. **Backend:** local database (ready at once), or an external database
3. **Frontend:** development mode, production build, or the desktop app

### Prerequisites (all devices)

| Tool | Version | Why |
|---|---|---|
| Node.js | 24 or newer (tested on 26) | runs the backend's TypeScript directly, and provides SQLite |
| npm | comes with Node.js | installs dependencies |
| Git | any | to get the code |

> [!NOTE]
> **Installing dependencies runs code.** `npm install` downloads packages and runs their install scripts on your computer. Only install from a copy of the code you trust.

<br>

### macOS

**1. Prerequisites**

```sh
brew install node git        # or the installer from nodejs.org
node -v                      # must print v24 or newer
git clone <repository-url> kynova
cd kynova
npm install
```

**2. Backend**

*Local database (ready to use):*

```sh
npm run dev:server           # backend only, on http://127.0.0.1:8788 (PORT + 1), data in ./data
```

*External database:* set `DATABASE_URL` before starting. Tables are created on first start.

```sh
# PostgreSQL or Supabase
DATABASE_URL="postgresql://user:password@host:5432/dbname" npm run dev:server

# MySQL 8.0.19+
DATABASE_URL="mysql://user:password@host:3306/dbname" npm run dev:server

# Optional: migrate ahead of time, without starting the server
npm run db:migrate -- "postgresql://user:password@host:5432/dbname"
```

You can also leave the backend on the local database and let each person pick their own PostgreSQL or Supabase on the sign-in screen (**Change › My own database**).

**3. Frontend**

```sh
# Development: backend and frontend together, with live reload
npm run dev                  # open http://localhost:8787 (PORT)

# Production: build once, then the backend serves the frontend
npm run build                # writes dist/
npm start                    # open http://127.0.0.1:8787
```

**4. Desktop app**

```sh
npm run desktop              # build and open the app (unpackaged)
npm run desktop:mac          # .dmg and .zip for Apple Silicon and Intel, in release/
```

The app is not signed. The first time, open it with right-click › **Open**.

<br>

### Windows

**1. Prerequisites**

Install Node.js 24+ from [nodejs.org](https://nodejs.org) (or `winget install OpenJS.NodeJS`) and Git from [git-scm.com](https://git-scm.com). Then, in PowerShell:

```powershell
node -v                      # must print v24 or newer
git clone <repository-url> kynova
cd kynova
npm install
```

**2. Backend**

*Local database (ready to use):*

```powershell
npm run dev:server           # http://127.0.0.1:8788 (PORT + 1), data in .\data
```

*External database:* in PowerShell, set the variable first.

```powershell
$env:DATABASE_URL = "postgresql://user:password@host:5432/dbname"   # or mysql://...
npm run dev:server
```

In Command Prompt use `set DATABASE_URL=postgresql://...` instead.

**3. Frontend**

```powershell
# Development
npm run dev                  # open http://localhost:8787 (PORT)

# Production
npm run build
$env:NODE_ENV = "production"; node server/index.ts   # open http://127.0.0.1:8787
```

> [!NOTE]
> `npm start` uses Unix syntax (`NODE_ENV=production ...`) and does not run in PowerShell or Command Prompt. Use the line above, or run `npm start` from Git Bash or WSL.

**4. Desktop app**

```powershell
npm run desktop              # build and open the app (unpackaged)
npm run desktop:win          # installer, portable .exe and .zip (x64), in release\
npm run desktop:win:zip      # only the .zip
```

The app is not signed, so Windows SmartScreen warns the first time: choose **More info › Run anyway**.

<br>

### Linux

**1. Prerequisites**

```sh
# Debian / Ubuntu, using the NodeSource repository for a current Node.js
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs git
node -v
git clone <repository-url> kynova
cd kynova
npm install
```

Other distributions: install Node.js 24+ with your package manager, `nvm` or `fnm`.

**2. Backend**

Same as macOS: `npm run dev:server` for the local database, or `DATABASE_URL=... npm run dev:server` for an external one.

**3. Frontend**

Same as macOS: `npm run dev` for development, `npm run build && npm start` for production.

**4. Desktop app**

`npm run desktop` opens the unpackaged app. No packaged Linux build (AppImage, .deb) is configured yet, and Linux is not tested; on Linux, the browser version is the supported way.

<br>

### Server for a team (any OS)

To run one Kynova that several people open in their browsers:

```sh
npm install
npm run build
HOST=0.0.0.0 PORT=8787 ALLOWED_HOSTS=kynova.example.com COOKIE_SECURE=1 \
DATABASE_URL="postgresql://user:password@host:5432/dbname" \
npm start
```

Put it behind a reverse proxy with HTTPS. Read [Running it for a team](#running-it-for-a-team) first.

<br>

### Build everything in the cloud

The **Desktop app** workflow in `.github/workflows/desktop.yml` builds the macOS `.dmg` files and the Windows installer, portable `.exe` and `.zip` on real Macs and Windows PCs. Run it from the Actions tab, or push a tag such as `v0.2.0`. Building the Windows installer on a Mac otherwise needs Rosetta (`softwareupdate --install-rosetta`).

---

## Configuration

All backend settings are environment variables.

| Variable | Default | Meaning |
|---|---|---|
| `HOST` | `127.0.0.1` | Address to listen on. |
| `PORT` | `8787` | Port to listen on. With `npm run dev` the page (Vite) takes it and the backend the port after it. |
| `DATA_DIR` | `./data` | Where the local database and its backups are kept. |
| `DATABASE_URL` | not set | A `postgres://` or `mysql://` URL to use instead of the local database. |
| `ALLOWED_HOSTS` | loopback names | Comma-separated host names the server answers to. Set it whenever `HOST` is not loopback. |
| `ALLOW_PRIVATE_TARGETS` | on for a loopback `HOST` | Whether the request proxy may reach private addresses. `1` to allow. |
| `COOKIE_SECURE` | off | `1` when served over HTTPS. |
| `STATIC_DIR` | `./dist` | Where the built frontend is served from. |
| `NODE_ENV` | | `production` to serve the built frontend. |

**Database commands**

```sh
npm run db:backup                          # back up the local database to data/backups/
npm run db:restore -- <file>               # restore it
npm run db:migrate -- "<postgres or mysql url>"
npm run db:sql                             # SQL files for psql or the Supabase CLI
npm run db:copy-to-postgres -- "<url>"     # move local data to PostgreSQL
npm run db:copy-to-mysql -- "<url>"        # move local data to MySQL
```

Engines compared, Supabase setup, SSL options and tables: [DATABASE.md](DATABASE.md).

### Running it for a team

On your own machine the defaults are safe: the server only listens on loopback and only answers to `localhost`, `127.0.0.1` and `::1`. Before sharing one server:

- **The request proxy sends requests from the server.** Anyone with an account can reach what the server can reach. With a non-loopback `HOST`, private and reserved addresses are blocked. Leave `ALLOW_PRIVATE_TARGETS` off unless every account holder may reach your internal network.
- **Set `ALLOWED_HOSTS`** to the name people use.
- **Serve it over HTTPS** and set `COOKIE_SECURE=1`.
- **Registration is open** to anyone who can reach the server, limited to 20 attempts per address every 15 minutes.

---

## Under the hood

```
shared/      Domain model and realtime protocol, used by both sides
server/      Backend: http/, routes/, services/ (auth, workspaces, sync, proxy and signing),
             database/ (adapters, migrations per engine, scripts)
src/         Frontend: components/, pages/, layouts/, stores/, settings/, utils/
electron/    Desktop app shell
scripts/     Desktop build and run helpers
```

React 19, TypeScript, Vite, Tailwind 4, CodeMirror 6 (with its legacy modes for snippet and response colours), zustand and Motion on the frontend; plain `node:http`, `node:sqlite`, `ws`, `pg` and `mysql2` on the backend; Electron for the desktop app.

**Development commands:** `npm test` (unit tests), `npm run typecheck`, `npm run format`, `npm run setup:lint` then `npm run lint`, and `npm run check` for all of them. Code rules: [CODE_STYLE.md](CODE_STYLE.md). Design: [DESIGN.md](DESIGN.md).

---

## Status

Kynova is **still in development** (version 0.1.0). It is not a finished product.

- **Expect changes:** features, screens, settings, environment variables and the database layout can change or be removed in any version. Migrations run on start, but back up your data (`npm run db:backup`) before you update.
- **No stable release yet:** there is no release schedule, no long-term support, and no promise of backward compatibility.
- **Tested:** unit tests and browser runs on macOS; SQLite, PostgreSQL 18 and MySQL 8.4; the packaged Mac app.
- **Not tested:** the Windows build running on Windows, the Windows installer, a real Supabase project, Linux; and, in a browser, the newest work: multi-file import and drop, the tab rules, Bulk Edit in the code editor, ⌘/ in every editor, and the response editor with its formatting and folding.
- **Known limitations:** environments are replaced whole, so two people changing different variables of one environment at once can lose one change; WebSocket requests connect from the browser, so they cannot set custom headers; invite links cannot be revoked before they expire.
- **Not built:** pre-request and test scripts, a collection runner, mock servers, GraphQL, gRPC, MQTT and Socket.IO.

---

## License and credits

Kynova is released under the [MIT License](LICENSE). Copyright (c) 2026 [ludfiwahyu](https://github.com/ludfiwahyu) and the [Kynova contributors](https://github.com/ludfiwahyu/kynova/graphs/contributors). Source: [github.com/ludfiwahyu/kynova](https://github.com/ludfiwahyu/kynova).

You are free to:

- clone the repository and run Kynova for yourself or your team.

The one condition: keep the copyright notice and the license text in every copy or substantial part of Kynova.

The software comes "as is", without warranty and without support.

Bundled fonts, icons and libraries keep their own open licenses:

| Part | Used for | License |
|---|---|---|
| [Inter](https://rsms.me/inter/) | Interface font (optional) | SIL Open Font License 1.1 |
| [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | Code font (optional) | SIL Open Font License 1.1 |
| [Lucide](https://lucide.dev) | Icons | ISC |
| [CodeMirror](https://codemirror.net) | Code editor | MIT |
| [React](https://react.dev), [Motion](https://motion.dev), [Zustand](https://github.com/pmndrs/zustand) | Interface, animation, state | MIT |

The full list of dependencies and their licenses is in `package.json` and `node_modules/*/LICENSE`.

The Kynova name and logo (`public/favicon.svg`) belong to the project. Forks are welcome to use them to say where they come from, but a modified version should use its own name and logo so people can tell them apart.

Kynova was written with [Claude](https://claude.com/claude-code) (Anthropic); commits made with it carry a `Co-Authored-By: Claude` line.

---

<p align="center"><sub>Kynova · built entirely by AI · in development · MIT License</sub></p>
