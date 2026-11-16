# Code style and structure

How code is written and where it lives in Kynova. Every new or changed file follows this.
The shape of the rules was set on `src/components/ui/KeyValueTable`, `src/components/ui/Button`,
`src/pages/history` and `src/settings/schema.ts`; look there when in doubt.

Keep the screen and behaviour the same while restyling code. Style changes are never mixed with
feature changes.

## 1. Formatting (Prettier, enforced)

Settings live in `.prettierrc`. Format on save, `npm run format`, `npm run format:check`.

| Rule | Value |
|---|---|
| Indent | 4 spaces, no tabs |
| Line ending | LF |
| Semicolons | none |
| Quotes | single in code, double in JSX attributes |
| Trailing commas | everywhere |
| Line width | 100 |
| JSX attributes | one per line (`singleAttributePerLine`) |
| Tailwind classes | sorted by `prettier-plugin-tailwindcss` |

Class names joined in a template keep the space outside the `${...}`:
`` `a ${on ? 'b' : ''}` ``, never `` `a${on ? ' b' : ''}` `` (Prettier trims it; a test checks this).

## 2. Writing code

- TypeScript everywhere. Prefer `interface` for object shapes, `type` for unions. A named type per
  union variant.
- Readable and airy: a blank line between logic blocks, early `return` for guards.
- Braces on every `if`, `else`, `for`, `while`, even for one statement.
- Objects with more than one property go one property per line. Same for config arrays and unions;
  a blank line between entries of a long config array. Use `// prettier-ignore` where Prettier would
  fold a short array or union back into one line.
- Airbnb habits apply (`const` first, no `var`, no nested ternaries, no magic values), except:
  no semicolons, 4-space indent, and `.ts` extensions where Node runs the file directly
  (see section 4).
- Do not split code into many tiny functions. Extract a function when it is reused or when a
  block needs a name to be understood.
- A component only when it is reused. No atomic-design layers. When one shape repeats, grow the
  global component (a new `variant` or prop) instead of writing the raw element again.
- No magic numbers, strings or URLs inline: put them in `config.ts` (per folder), `src/constants`
  or `shared/`.

### Comments

- No file-header essays. A file starts with its imports.
- Short one-line JSDoc on a field, type or function is fine when it says something the name does not.
- No comment that restates the code. Keep only real "why" notes and section banners.
- Section banner, for long files with groups (never more than 5 lines):

```ts
// ===================================================================
//
//   Types
//
// ===================================================================
```

A long title goes on two lines without the blank `//` rows.

## 3. Imports

- **Never `../`.** A test refuses it in `src/` and `server/`. `./x` in the same folder is fine.
- `src/`: `@/...` alias. Import from a folder's barrel when it has one:
  `import { Button, Select } from '@/components'`, same for `@/utils`, `@/constants`, `@/hooks`,
  `@/layouts`, `@/services`, `@/stores`, `@/settings`.
- Inside a component or page folder, import its own files by full alias path:
  `@/components/ui/Button/logic/config`, `@/pages/history/logic/mappers`.
- `server/`: `#server/...`. Shared code: `#shared/...` (from `package.json` `imports`).
- Order: external packages, then `@/` / `#` aliases, then `./` files. Type-only imports use
  `import type`.
- Own `@/` and `./` imports in `src/` have no `.ts` / `.tsx` extension. `#shared/...` imports keep
  `.ts` everywhere (also in `src/`), and so does all code in `server/`, `shared/`, `scripts/` and
  `electron/`, because Node runs those files directly.

## 4. Where files live

### Frontend, `src/`

```
src/
  App.tsx, main.tsx, env.d.ts
  assets/styles/        CSS and Tailwind entry
  components/           global parts
    index.ts            the only barrel; exports what pages may use
    ui/<Name>/          what pages import (through the barrel only)
    shared/             parts used by ui/ only; never exported, never imported by pages
    utils/helpers.ts    helpers for global components (classNames ...)
  constants/            storageKeys, timing, apiServices, defaults (+ index.ts)
  hooks/                global hooks (+ index.ts)
  layouts/<Name>/       app frame (Workbench)
  pages/<feature>/      one folder per feature
  services/             API client
  settings/             preferences, schema, shortcuts, themes, fonts
  stores/<category>/    state, grouped by category (+ index.ts)
  utils/<category>/     pure helpers, grouped by category (+ index.ts)
```

`index.ts` exists only at the top of a `src/` folder, or at the top of a page (`pages/<feature>/index.ts`).
A test enforces it.

### A component folder (`components/ui/<Name>/`) and a layout

```
Name/
  Name.tsx          JSX only
  types.ts          every interface and type of this component
  hooks/useName.ts  state and decisions
  logic/            pure functions, never JSX
    config.ts       constants, options, class maps, texts
    helpers.ts      pure helpers
    mappers.ts      turn data into what the JSX reads (view-model)
  components/       child components
  context/          React context, if any
```

Only create the folders the component needs.

### A page (`pages/<feature>/`)

```
<feature>/
  index.ts            exports the page entry
  types.ts
  components/         screens and parts (<Feature>View.tsx ...)
  hooks/              useFeatureView.ts ...
  logic/
    config.ts         constants, options, page config (tabs ...)
    helpers.ts        pure helpers
    mappers.ts        row and label builders
```

### Server, `server/`

```
server/
  index.ts, config.ts
  http/       router, static files, rate limit (HTTP plumbing only)
  routes/     one file per API area; parse the request, call a service, send the reply
  services/   the rules; proxy/ holds the sender and signing/
  database/   adapters/, migrations/<engine>/*.sql, scripts/, types.ts, context.ts
```

Routes hold no business rules. Services never touch `req` / `res`. SQL lives in `database/` only.
Migrations are `.sql` files per engine (`sqlite/`, `postgres/`, `mysql/`).

### Shared, `shared/`

Code used by both sides, with no Node or DOM imports. Global constants live here: `http.ts`
(status, headers, content types), `units.ts`, `ports.ts`, `patterns.ts`, `limits.ts`.

### Scripts and desktop

`scripts/` and `electron/`: files named in camelCase (`buildDesktop.ts`), `.ts` extensions,
`#shared/...` aliases.

## 5. Components

- `Name.tsx` is JSX only. State, handlers and decisions go to `hooks/useName.ts`; labels, titles,
  tones and other derived values go to `logic/mappers.ts`, so the JSX only reads fields.
- Inside JSX allow only `.map(...)` and a simple `cond && <El />` or `cond ? <A /> : <B />` between
  two elements. Template labels, `||`, `??`, spreads and chained ternaries are decided before the
  `return`.
- `return (` always wraps the JSX in parentheses. One early `if (!x) return null` guard is allowed
  before it.
- Every component has a real root element (`div.kv-root`, `div.sidebar-body`). No bare `<>` or
  `<Fragment>` as a root, no `return cond ? A : B`, no `VIEWS[mode]` lookup as the root. Put the mode
  switch as a ternary inside the root.
- A component that must return siblings (menu items, several panels) wraps them in
  `<span className="contents">` or `<div className="contents">` so the layout does not change.
  Menu item lists inside `<Menu>` stay a bare fragment.
- Static texts, numbers, sizes and option lists go in the folder's `logic/config.ts`, never at the
  top of a component file.
- A new `className` is a Tailwind utility when one exists; existing CSS classes stay.

### Use the global parts, never raw elements, in pages and layouts

| Need | Use |
|---|---|
| Button | `Button` (variants `default`, `primary`, `ghost`, `danger`, `link`, `icon`, `plain`, `send`, `topbarIcon`, `statusbarText`, `dbChoice`, `swatch`; props `icon`, `iconEnd`, `submit`) |
| Text field | `Field` + `Input` (variants `default`, `code`, `plain`) or `TextArea`, with `onValueChange` |
| Empty list | `EmptyState` |
| Form error | `FormError` |
| Sidebar header | `SidebarToolbar` |
| Others | `Select`, `Tabs`, `Switch`, `Radio`, `Dialog`, `Confirm`, `NameDialog`, `Menu`, `CopyButton`, `SearchInput` |

## 6. Hooks, stores, utils, settings

- Hooks: file `useThing.ts`, one hook per file, returns an object with named fields (not a tuple)
  once it returns more than two values.
- Stores: `stores/<category>/`; exported through `@/stores`. Components read through selectors.
- Utils: pure, no React, grouped in `utils/<category>/`; exported through `@/utils`. Tests sit next
  to the file as `name.test.ts`.
- Settings: shortcuts are listed once in `settings/shortcuts.ts` with typed ids and `Mod+...` keys;
  use `useShortcut` / `matchesShortcut`, never a hand-written key check. Preferences are described
  in `settings/schema.ts` and drawn from it.
- Pages that have tabs describe them in `logic/config.ts` through `definePage`.

## 7. Naming

| Thing | Style | Example |
|---|---|---|
| Component, type, interface | PascalCase | `KeyValueTable`, `ButtonProps` |
| Component file | PascalCase | `Button.tsx` |
| Hook | `use` + camelCase, file the same | `useHistoryView.ts` |
| Other files and folders in `logic/`, `utils/`, `server/`, `scripts/` | camelCase | `rateLimit.ts` |
| Constants | UPPER_SNAKE_CASE | `ERROR_STATUS_TEXT` |
| Functions, variables | camelCase, verb first for functions | `toHistoryDays` |
| Booleans | `is`, `has`, `can`, `should` | `isEmpty` |
| Test file | `<name>.test.ts` next to its subject | `tree.test.ts` |

## 8. Tooling that enforces this

| Command | What it does |
|---|---|
| `npm run format` / `format:check` | Prettier: layout, quotes, commas, class order |
| `npm run lint` / `lint:fix` | ESLint: everything Prettier cannot see (below) |
| `npm run typecheck` | TypeScript 7 (`tsc --noEmit`) |
| `npm test` | unit tests, including `src/imports.test.ts` |
| `npm run check` | all four, in that order |

ESLint lives in `tools/eslint/` with its own `package.json`, because typescript-eslint needs the
TypeScript 6 JavaScript API and the app builds with TypeScript 7. Install it once with
`npm run setup:lint`. The config is `tools/eslint/eslint.config.js`; VS Code picks it up from
`.vscode/settings.json` (extension `dbaeumer.vscode-eslint`) and fixes on save.

ESLint rules, all errors:

- `curly`: braces on every `if`, `else`, `for`, `while`.
- `no-restricted-imports`: no `../`.
- `simple-import-sort`: packages, then `@/` and `#`, then `./`, sorted inside each group.
- `local/import-extension`: no extension on own imports in `src/`, `.ts` kept elsewhere.
- `local/no-file-header`: no multi-line comment at the top of a file.
- `@stylistic/object-property-newline`, `object-curly-newline`: two or more properties go one per line.
- `@stylistic/padding-line-between-statements`: a blank line before `return`, after a block of
  `const`, and around `if`, `for`, `while`, `switch`, `try`, functions.
- `no-nested-ternary`, `eqeqeq`, `prefer-const`, `no-var`.
- `@typescript-eslint/consistent-type-imports`, `naming-convention` (types PascalCase).
- `.tsx` files in `src/`: no top-level `const` (go to `logic/config.ts`), no `return <>...</>`
  (except `*MenuItems.tsx`), no `return cond ? A : B`, no `||` / `??` or template text inside JSX
  children, `react/self-closing-comp`, `react/jsx-no-useless-fragment`, hooks rules.
- `src/pages` and `src/layouts`: no raw `<button>`, `<input>`, `<select>`, `<textarea>`.

A rule may be switched off for one line only with a comment that says why
(`// eslint-disable-next-line rule -- reason`).

## 9. What tests keep honest

`src/imports.test.ts` fails on: `../` imports, a space inside `${...}` in a class template, pages
importing `@/components/...` deeper than the barrel, `shared/` used outside `ui/`, `index.ts` in the
wrong place. `npm run check` and `npm run build` must pass after any style change.

## 10. Checklist before finishing a file

1. Prettier clean (4 spaces, no semicolons, single quotes, one attribute per line).
2. No `../`, no deep `@/components/...` from pages, no extension in `src/` imports.
3. Braces on every `if` / `for`; multi-property objects one per line.
4. No inline constants: moved to `config.ts`, `src/constants` or `shared/`.
5. Component: JSX only, real root, `return (`, logic in `hooks/` and `logic/`.
6. Raw `<button>`, `<input>`, `<select>`, `<textarea>` replaced by the global parts.
7. No header essay, no comment that repeats the code.
8. `npm run check` and `npm run build` pass.
