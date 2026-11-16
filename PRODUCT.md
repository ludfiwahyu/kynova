# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TypeScript + Vite on the client (user asked for React). Server delegated: Node with built-in `node:sqlite`, `ws` for realtime, plain `node:http`. Chosen to keep dependencies minimal and run TypeScript directly without a build step.

## Users

Developers who build and test HTTP and WebSocket APIs, working alone or with teammates in a shared workspace.

## Product Purpose

An API client for HTTP and WebSocket APIs. Compose requests, organise them in collections, switch environments, inspect responses, and collaborate live with a team. Everything is free: no subscription, plan limits, or payment surface.

## Positioning

Collaboration (shared workspaces, roles, presence, comments) is included for every account rather than gated behind a paid plan.

## Operating Context

Runs as a web app next to a small Node server. The server sends API requests on the browser's behalf (avoids CORS), stores accounts and workspaces, and relays realtime changes.

## Capabilities and Constraints

Confirmed for the first version:

- Accounts: register and sign in with email and password.
- Workspaces with members and roles (owner, editor, viewer), joined through an invite link.
- Collections, folders, HTTP requests, WebSocket requests.
- Environments with `{{variable}}` substitution.
- Request editor: params, headers, auth, body. Response viewer: body, headers, status, time, size.
- History per user, code snippets, import and export of Collection v2.1.
- Themes named in the evidence (Dracula, Monokai, Solarized, Night Owl, Ayu, High Contrast) plus light and dark.
- Realtime sync, presence, and comments on requests.

Not in the first version: pre-request and test scripts, collection runner, mock servers, gRPC, MQTT, Socket.IO, performance tests, Git integration, MCP.

Excluded permanently: any subscription or paid feature (the evidence shows a `payments:view:*` surface; it is not rebuilt).

The request proxy binds to localhost by default because it can reach any address the server can.

## Brand Commitments

Name: Kynova (chosen by the user on 2026-11-16), with its own logo. On 2026-11-12 the user asked for a familiar desktop API client layout, density and neutral dark and light palettes. Paid or AI surfaces (Upgrade, AI chat, credits) are not included.

## Evidence on Hand


## Product Principles

- Free means complete: no feature is hidden, dimmed, or labelled as an upgrade.
- The request is the unit of work; everything else stays out of its way.
- Shared state is visible: who is here, who changed what.
- Familiar structure over novelty, so users of other API clients need no relearning.
