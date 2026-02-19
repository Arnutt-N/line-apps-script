# Architecture

## Backend
- Entrypoints: `src/server/Main.gs`, `src/server/MainImpl.gs`
- API dispatch: `src/server/Router.gs`
- Auth + RBAC: `src/server/Auth.gs`
- Data layer: `src/server/SheetsRepo.gs`
- Integrations:
  - LINE API: `src/server/LineApi.gs`
  - Drive storage: `src/server/DriveRepo.gs`
  - Telegram alerts: `src/server/TelegramApi.gs`
- Modules:
  - Dashboard: `src/server/ModuleDashboard.gs`
  - Live chat: `src/server/ModuleChat.gs`
  - Rich menu: `src/server/ModuleRichMenu.gs`
  - Auto reply: `src/server/ModuleAutoReply.gs`
  - Templates: `src/server/ModuleTemplates.gs`
  - Histories: `src/server/ModuleHistories.gs`
  - LIFF: `src/server/ModuleLiff.gs`
  - Settings: `src/server/ModuleSettings.gs`
  - Webhook: `src/server/Webhook.gs`

## Frontend
- Root page: `src/Index.html`
- Shell/router: `src/ClientApp.html`
- Style system: `src/ClientStyles.html`
- API layer: `src/ClientApi.html`
- App store: `src/ClientState.html`
- Reusable UI helpers: `src/ClientComponents.html`
- Page modules:
  - Dashboard: `src/ClientPagesDashboard.html`
  - Live chat: `src/ClientPagesChat.html`
  - Rich menu: `src/ClientPagesRichMenu.html`
  - Auto reply: `src/ClientPagesAutoReply.html`
  - Templates: `src/ClientPagesTemplates.html`
  - Histories: `src/ClientPagesHistories.html`
  - LIFF: `src/ClientPagesLiff.html`
  - Settings: `src/ClientPagesSettings.html`

## Initial setup
1. Set script properties in Apps Script project.
2. Run `setupInitialize()`.
3. Optionally run `setupSeedDemoData()`.
4. Deploy as Web App.
5. Configure LINE webhook route: `?route=webhook`.

## Notes
- Chat page standalone: open `?page=chat` in a new tab.
- Webhook signature verification is optional via `LINE_REQUIRE_SIGNATURE`.
- Roles/permissions are seeded and editable via Sheets.
