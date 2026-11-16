---
name: Kynova
description: A free API client with shared workspaces, laid out like a desktop API client.
colors:
  surface-dark: "#212121"
  raised-dark: "#282828"
  frame-dark: "#1c1c1c"
  line-dark: "#363636"
  ink-dark: "#f0f0f0"
  ink-secondary-dark: "#b3b3b3"
  ink-tertiary-dark: "#9a9a9a"
  action-blue-dark: "#3b72e1"
  surface-light: "#ffffff"
  frame-light: "#f9f9f9"
  line-light: "#e6e6e6"
  ink-light: "#212121"
  ink-secondary-light: "#5c5c5c"
  ink-tertiary-light: "#6b6b6b"
  action-blue-light: "#0265d2"
  get-dark: "#6bdd9a"
  post-dark: "#ffe47e"
  put-dark: "#74aef6"
  patch-dark: "#c0a8e1"
  delete-dark: "#f79a8e"
  options-dark: "#f15eb0"
  get-light: "#007f31"
  post-light: "#ad7a03"
  put-light: "#0053b8"
  patch-light: "#623497"
  delete-light: "#8e1a10"
  options-light: "#a61468"
  backdrop: "rgb(0 0 0 / 0.5)"
typography:
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 650
    lineHeight: 1.45
  headline:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.45
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.45
  caption:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: "0.04em"
  method:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 700
    letterSpacing: "0.02em"
  badge:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.5625rem"
    fontWeight: 700
    letterSpacing: "0.04em"
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "20px"
rounded:
  hairline: "2px"
  xs: "3px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
components:
  button:
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
  button-primary:
    backgroundColor: "{colors.action-blue-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
  send-button:
    backgroundColor: "{colors.action-blue-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "38px"
  url-box:
    rounded: "{rounded.sm}"
    height: "38px"
  input:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "32px"
  tree-row:
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.sm}"
    height: "28px"
  tab-strip:
    backgroundColor: "{colors.surface-dark}"
    height: "40px"
  menu:
    backgroundColor: "{colors.raised-dark}"
    rounded: "{rounded.md}"
  dialog:
    backgroundColor: "{colors.raised-dark}"
    rounded: "{rounded.lg}"
    width: "480px"
---

# Design System: Kynova

## Overview

**Creative North Star: "A familiar API workbench"**

On 2026-11-12 the user asked for a familiar desktop API client layout. That request replaced the earlier "Dispatch Desk" world, with its teal frame and stamped status. Someone who has used a desktop API client should find every control where they expect it: tabs of open requests, a sidebar tree of collections, a URL bar with Send, tabbed request settings, and the response underneath. Kynova keeps its own name and logo; AI surfaces and paid features are not included.

The look is neutral and dense. Greys carry the structure, blue marks the one main action, and colour elsewhere states a fact: an HTTP method, a status, a variable that resolves or does not.

**Key Characteristics:**

- Neutral greys in dark and light, with hairline borders between areas.
- One action colour, blue, for Send, primary buttons, focus and the active tab.
- Method colours on every request label.
- Every area can be resized by dragging the line between it and its neighbour.
- The Response and the Console and Issues panel can be moved: below, left or right of their neighbour.
- Twelve themes swap the palette; layout, type and density never change.

## Colors

The defaults are the dark and light themes. Every theme defines the same roles as CSS custom properties (`--bg`, `--panel`, `--raised`, `--line`, `--ink`, `--ink-2`, `--ink-3`, `--accent`, `--rail`), so components reference roles, never hex values.

### Primary

- **Action Blue** (#3b72e1 dark, #0265d2 light): Send, primary buttons, links, focus outlines, the underline of the active tab, the top edge of the active document tab, and resolved `{{variables}}`.

### Neutral

- **Surface** (#212121 dark, #ffffff light): the work area, sidebar and panels.
- **Raised** (#282828 dark): menus and dialogs.
- **Frame** (#1c1c1c dark, #f9f9f9 light): the top bar and status bar.
- **Line** (#363636 dark, #e6e6e6 light): every border and divider.
- **Ink**, **Ink Secondary**, **Ink Tertiary**: text, labels, and placeholders or line numbers.
- Hover, pressed and selected states are mixes of Ink into the surface (7%, 11%, 10%), so they work on every theme.

### Methods and status

- **Methods** (dark / light): GET and HEAD #6bdd9a / #007f31, POST #ffe47e / #ad7a03, PUT #74aef6 / #0053b8, PATCH #c0a8e1 / #623497, DELETE #f79a8e / #8e1a10, OPTIONS #f15eb0 / #a61468.
- **Status:** the GET green for success, a yellow for redirects, and the DELETE red for errors and destructive actions.
- **Variables:** a known `{{name}}` in Action Blue, an unknown one in red, a `:path` segment in the PATCH purple.
- **Overlays:** dialog backdrops use black at 50%.

### Named Rules

**The Fact Colour Rule.** Colour other than grey says something true: a method, a status, a variable's state, the main action. A colour that only decorates is wrong.

**The Role Token Rule.** Components use role tokens only, so all twelve themes keep working.

## Typography

**UI Font:** the system font (`font-sans`): San Francisco on a Mac, Segoe UI on Windows. Inter is a choice in Settings › General.
**Code Font:** the system monospace (`font-mono`): Menlo on a Mac, Consolas on Windows. JetBrains Mono is a choice in Settings › Code Editor.

Both are CSS variables (`--font-ui`, `--font-code`) the app sets from the settings; Tailwind's `font-sans` and `font-mono` point at them.

### Hierarchy

- **Title** (650, 1.375rem): headings of full-screen forms (sign-in, invite).
- **Headline** (600, 0.9375rem): dialog titles and Markdown headings.
- **Body** (400, 0.8125rem, line-height 1.45): the base size of the whole interface.
- **Label** (600, 0.75rem): field labels, table headers, response metadata.
- **Caption** (700, 0.6875rem, +0.04em, uppercase): sidebar section headers (COLLECTIONS, ENVIRONMENTS).
- **Method** (700, 0.625rem): the method labels in the tree, tabs and search.
- **Badge** (700, 0.5625rem): the HTTP and WS kind badges and counts on the rail.
- **Code** (400, 0.75rem, 20px lines): bodies, scripts, snippets, response bodies.

Numbers are tabular everywhere.

### Named Rules

**The Sent-Text Rule.** Mono is for text that is sent or received: bodies, scripts, snippets, responses. Labels and buttons are never mono. The URL bar and tables use the UI font.

## Layout

The workbench is one grid:

- **Rows:** a 44px top bar, the work area, and a 26px status bar.
- **Columns:** a sidebar (300px by default, 220–520px by dragging), the main area, an optional side panel (340px by default, 280–620px), and a 44px icon rail at the right edge.

The sidebar and the main area each start with a 40px bar:
- **Sidebar:** icon buttons for Collections, Environments and History.
- **Main area:** the tab strip, with the environment picker at its right.

A request tab stacks:
1. A 44px breadcrumb header ending in the editable name.
2. The URL bar: a 38px box holding method and URL, then Send.
3. The request tabs and their content.
4. A draggable divider.
5. The response.

The request and response split the height 45:55 by default, between 15% and 85%.

The response can also sit left or right of the request (half the width each by default, 20–80% by dragging), under the URL bar, which stays full width. When the editor is narrower than 600px the two stack again, request first, until it widens. A request pane narrower than 560px drops the Description column of its tables, and its tabs scroll sideways.

### Moving panels
- The Response and the Console and Issues panel each have a grip (six dots) at the end of their header.
- Dragging the grip draws a preview over the area the panel docks around: the half it would take, left, right or bottom (whichever edge the pointer is nearest), in Action Blue at 14% with a 1px Action Blue border, and a label such as "Right of the request". Releasing drops it there; Escape cancels.
- Clicking the grip opens the same three places as a menu, the current one checked, so the keyboard can move panels too.
- The place is a personal layout setting, kept across reloads.

Spacing follows a 4px scale. Work areas have 16px side gutters.

**Below 900px**, the sidebar and side panel float over the main area, and opening a tab puts the sidebar away.

## Motion

Motion (`motion/mini`) does the animations, all short and from `@/utils/motion.ts`: things fade and settle a few pixels into place with the app's ease-out curve; nothing moves when the system asks for reduced motion.

- **Menus and lists** (every Popover): fade in dropping 3px into place (140ms), fade out on close (100ms).
- **Dialogs**: fade in and out, opacity only; a transform would move the popovers inside them. Settings fades in and closes at once, so a quick ⌘, never lands on a closing dialog.
- **Panels**: the right panel slides in 12px from the right; the Console and Issues panel rises 10px (200ms).
- **Tab contents and new responses**: a 140 to 180ms fade.

## Elevation & Depth

Depth comes from hairlines and the slightly darker frame, not from shadows. One shadow exists, for things that float: menus, dialogs, the search results, and the sidebar and panel when they float on narrow screens.

### Shadow Vocabulary

- **Pop** (`box-shadow: 0 10px 28px -8px rgb(0 0 0 / 0.38), 0 2px 8px -2px rgb(0 0 0 / 0.2)`)

### Named Rules

**The Flat Workbench Rule.** Resting surfaces are flat. A shadow means the element floats and will go away.

## Shapes

- **2px:** the tab underline's top corners.
- **3px:** kind badges and inline code.
- **4px:** buttons, inputs, the URL box, tables, tree rows.
- **6px:** menus and the search box.
- **8px:** dialogs.
- **Circles:** avatars and dots; **pills:** badges.

Borders are 1px hairlines. Dividers are 1px lines with a 7px invisible grab area, and they turn blue on hover and while dragged.

## Components

### Logo
- An open C whose gap is closed by a dot: the point where client and server meet, a seal on the agreement. Drawn on a 32-unit grid (ring radius 8.5, stroke 3.75, round caps; dot radius 2.9) on a tile with an 8-unit radius.
- In the app the tile is `--accent` and the mark `--accent-ink`, so it follows the theme; the favicon uses Action Blue and white. It reads at 16px.

### URL bar
- One bordered 38px box holds the method (a select coloured by method) and the URL.
- `{{variables}}` and `:path` segments are coloured as you type.
- The URL includes the query string, kept in step with the Params table both ways.
- Send is a separate blue 38px button. Enter in the URL, or ⌘/Ctrl+Enter anywhere in the request, sends.

### Tabs
- **Request tabs:** text with a 2px blue underline when active. Counts follow in green (Params, Headers), and a green dot marks a tab with content (Authorization, Body, Scripts).
- **Document tabs:** method label and name. The active tab has a selected background and a 2px blue top edge. A preview tab, opened by a single click, is italic and is replaced by the next single click. Double-clicking it or editing in it keeps it.

### Key and value tables
- Columns: a checkbox, Key, Value, Description, and Bulk Edit in the header.
- A blank last row adds a row as you type. A switched-off row is struck through.
- Bulk Edit format: `key:value` per line, `//` for switched-off rows.
- Path variables use the same table with fixed keys.

### Sidebar tree
- 28px rows indented 16px per level, with a 1px guide line under each open container.
- Requests lead with their method label; folders and collections with an outline icon.
- Single click previews; double-click keeps the tab open.
- Row actions float over the end of the name on hover, so nothing moves. Right-click opens the same menu.
- Keyboard: arrow keys, Enter, Space, F2 and Delete.

### Menus
- 6px radius, a hairline border and the Pop shadow.
- Opened from a button or at the pointer. A menu flips above its anchor when there is no room below, always stays inside the window, and closes on scroll, resize, Escape or Tab.
- Arrow keys and Home/End move between items.

### Select
- Every dropdown is the app's own Select, never the browser's: a 32px field (or a borderless "quiet" one in toolbars) with a chevron that turns when open.
- The list opens on the chosen option, marked with a check. Arrow keys open and move it; Escape or Tab close it without a change.
- It uses the menu's popover, so it flips and stays inside the window. Inside a dialog it renders in that dialog.
- The HTTP method list adds a "Type a new method" field at the bottom for methods such as PROPFIND.

### Fields with an icon
- Search and filter fields hold the icon, the text and a round × clear button in one row, so nothing overlaps the typing.
- Focus on any field shows the blue border plus a soft 3px ring.

### Switches, segmented choices, swatches
- Switches are 32×18 with a sliding thumb.
- Segmented choices sit in one bordered group, with the chosen one on the selected background.
- Colour swatches are 22px circles; the chosen one has a ring.

### Database status and picker
- The top bar shows the database in use as a quiet pill (a database mark, then "Local database", or "Supabase · project" / "PostgreSQL · host"), with a settings button beside it that opens the Database dialog. On narrow screens only the mark shows.
- The picker offers two cards, Local database and My own database; the chosen one has the Action Blue border. Under My own database: databases used before, the connection string (hidden like a password, with a show button), SSL, an optional CA certificate, Test connection and Use this database.
- The sign-in card shows the database above the fields, with Change.

### Console and Issues panel
- A panel under the work area (not under the sidebar), opened from "Console" and "Issues" in the status bar, resizable by its top edge, closed with its X.
- Moved beside the work area, it takes a column of the work's height between the sidebar and the work, or between the work and the side panel: 420px by default, at least 320px, always leaving the work 360px. Its rows fold as on a narrow window. Below 900px it always sits under the work.
- Console rows read like a log: time, method in its colour, URL, source, status in its tone, duration. A row opens to its headers and bodies.
- Issues show an error or warning mark, the message, and where it is; a row opens the request or environment.

### Authorization tab
- Two columns: the Auth type Select (with an icon per type, grouped by lines) and where the data goes on the left; the type's settings on the right, a label column and a control column, each label with an info mark when it needs explaining.
- Settings most people leave alone fold under "Advanced configuration" (a chevron that turns), closed by default.
- Icons are neutral Lucide marks, not the logos of Akamai, Atlassian, AWS or Microsoft.
- On narrow screens the columns stack.

### Settings dialog
- A large modal (up to 1040×760) with the sections on the left (General, Themes, Shortcuts, Account, About) and the section's title and a close button at the top right.
- Each setting is a row: name and explanation on the left, its control on the right (switch, number field with its unit inside, radio choice or Select), divided by hairlines.
- Themes shows a Day and a Night card, each with a preview and a Select, or one card in Manual mode. The card in use is marked Active.
- Escape and the close button close it at once; ⌘, opens it.

### Code editor
- CodeMirror 6, styled from the role tokens: gutter in Ink Tertiary on the surface, a faint active line while focused, selections in Action Blue, syntax in the method colours (keys PUT blue, strings GET green, numbers POST yellow, literals and keywords PATCH purple). `{{variables}}` use the variable colours.
- Types like VS Code (see the Shortcuts list); Escape then Tab leaves the field.
- Find and replace draws with the app's own fields and buttons.
- The editor is its own stacking context, so its layers never cover menus.
- A JSON body and a JSON response each have a gear (`Settings2` icon) at the right end of their toolbar. It opens a menu of JSON styles, each with a small sample in the code font. The style is personal; stored JSON never changes with it.

## Do's and Don'ts

### Do:
- **Do** use the role tokens, never hex values.
- **Do** keep standard controls at 32px, the URL bar and Send at 38px, and tree rows at 28px.
- **Do** let every new area that divides space have a draggable divider, with a default restored by double-clicking it.
- **Do** keep transitions at 120–160ms with `cubic-bezier(0.16, 1, 0.3, 1)`, and honour `prefers-reduced-motion`.
- **Do** write empty states that say what goes there and how to fill it.

### Don't:
- **Don't** add upgrade prompts, AI credit offers, plan badges or locked features.
- **Don't** use colour for decoration.
- **Don't** put shadows on resting surfaces.
- **Don't** move content when showing hover actions; overlay them.
