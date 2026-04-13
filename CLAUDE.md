# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Prior art

A comprehensive, Thai-primary agent brief already exists at `AGENTS.md`. Read it for file-level structure, sheet schemas, and code style specifics. This file captures the pieces that are *not* obvious from browsing files.

The Thai documentation index is `DOCS_INDEX_TH.md`; `ARCHITECTURE.md` has the short English version.

## Commands

This project is Google Apps Script — there is no `package.json`, no test runner, and no local build. Everything ships via `clasp`.

```bash
clasp push              # upload src/ to the GAS project in .clasp.json
clasp push --watch      # auto-push on file changes
clasp open              # open the GAS editor in a browser
clasp deploy            # create a new web-app deployment
```

One-time setup functions live in `src/server/Setup.gs` and must be run **from the Apps Script editor** (not locally):

- `setupInitialize()` — creates all sheets, seeds roles/permissions/system_settings. Idempotent.
- `setupSeedDemoData()` — seeds demo users, chat rooms, intents, templates.

There is no automated test suite. Verification is manual via the deployed web app and the LINE Developers Console "Verify" button for the webhook.

## Architecture — things that are not obvious

### Single-entrypoint request routing

Every request funnels through `src/server/Main.gs`:

- `doGet(e)` renders the SPA shell (`Index.html`) with a bootstrap JSON containing the signed-in user's role.
- `doPost(e)` branches on `?route=`: `route=webhook` goes to `App.Webhook.handle`; anything else is treated as a JSON API envelope.
- `apiDispatch(request)` is the callable invoked by `google.script.run` from the browser. Same envelope as HTTP POST — frontend uses whichever is available.

The API envelope is `{ action, payload }`. `App.Router` (`src/server/Router.gs`) owns a single `MAP` table where each action is `{ permission, handlerPath }`. `handlerPath` is a dotted string (`"Chat.sendMessage"`) resolved against the global `App` namespace. **To add a new endpoint, you must edit Router.gs — there is no auto-discovery.** Every dispatched action auto-writes to `audit_logs` before returning.

### Namespace pattern

All `.gs` files use the same IIFE module pattern:

```javascript
var App = App || {};
App.ModuleName = (function () {
  function privateHelper_() { }   // trailing _ = private
  function publicFn() { }
  return { publicFn: publicFn };
})();
```

GAS concatenates all `.gs` files into a shared global scope, so `var App = App || {}` is the glue that lets files in any load order contribute to the same namespace. Do not use `const`/`let` for the `App` root — the redeclaration must be safe.

### Frontend is HtmlService, not a bundler

`src/*.html` files are **Apps Script HTML templates**, not static pages. `Index.html` pulls siblings in via `<?!= include('ClientStyles') ?>` (the `include` helper lives in `Main.gs`). The order in `Index.html` is load-bearing — `ClientApp.html` (the shell that boots everything) must load last, after pages, components, store, and API layer.

Frontend-to-backend calls prefer `google.script.run.apiDispatch({action, payload})` and fall back to `fetch` when the page is opened standalone (e.g. `?page=chat` in a new tab). Both paths hit the same `App.Main.apiDispatch`.

### Auth and RBAC are sheet-driven

`App.Auth.getContext()` reads `Session.getActiveUser().getEmail()` and cross-references the `admin_users` sheet. If the email is not present, the user sees a blank/denied page. Roles (`owner`, `admin`, `agent`, `viewer`) and their `permissions` live in sheets — editing those sheets at runtime changes authorization immediately. There is no code deployment needed to grant/revoke access.

### Data layer is one file

`src/server/SheetsRepo.gs` holds the `SCHEMAS` constant (column definitions for every sheet) and all CRUD helpers. When adding a new table, add the schema there and rerun `setupInitialize()` — nothing else creates sheets.

### Webhook signature is optional by flag

`App.Webhook.handle` checks `x-line-signature` only when Script Property `LINE_REQUIRE_SIGNATURE=true`. Production deployments **must** set this; the default-off is for local smoke tests.

### Standalone chat mode

The live chat page can be opened in its own tab via `?page=chat`. `App.Main.handleGet` sets `standalonePage` in the bootstrap JSON, and `ClientApp.html` switches the layout to hide the nav chrome. Keep this in mind when editing `ClientApp.html` routing logic.

### Timezone and runtime

`src/appsscript.json` pins `Asia/Bangkok` and `V8`. Date handling throughout the server assumes Bangkok time — `App.Utils.nowIso()` is the canonical "now".

## Required Script Properties

Set in Apps Script → Project Settings → Script Properties. `App.Config` reads them; the app will not boot without these:

- `SPREADSHEET_ID`, `DRIVE_ROOT_FOLDER_ID`
- `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`, `LINE_OA_ID`
- `LINE_REQUIRE_SIGNATURE` (set to `true` in production)
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (optional — alerts only)

## Adding features — the critical checkpoints

**New API endpoint:** handler in the right `Module*.gs` + entry in `Router.gs` `MAP` + permission string that exists in the `permissions` sheet (or add it).

**New sheet:** add to `SCHEMAS` in `SheetsRepo.gs` + rerun `setupInitialize()` in the GAS editor.

**Phase 1 schemas (added 2026-04-13):** `object_templates`, `template_variables`, `rich_menu_packs`. Existing `rich_menus` gained `pack_id` column; `users` gained `current_state`. `DEFAULT_PERMISSIONS.admin` in `Setup.gs` gained `templates.object.manage`, `templates.variables.manage`, `richmenu.pack.manage`, `chat.escalate`.

**Gotcha when adding columns to an existing sheet:** `ensureSheet_` rewrites only the header row — it does not migrate data. Always append new columns *before* `created_at`/`updated_at` at the end of the array. Inserting mid-array shifts all existing data rows off by one column, silently corrupting the sheet.

**New frontend page:** create `ClientPagesFoo.html` + add `<?!= include('ClientPagesFoo') ?>` to `Index.html` (before `ClientApp`) + register in `ClientApp.html` `navItems` and `normalizePage_` mapping.
