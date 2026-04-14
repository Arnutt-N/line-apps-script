# LINE OA Platform (Google Apps Script)

Modern LINE OA admin platform with Google Apps Script + Google Sheets + Google Drive.

## Stack
- Google Apps Script (V8)
- Google Sheets (database)
- Google Drive (file storage)
- Tailwind CSS v4 (browser build)
- Lucide icons
- Noto Sans Thai

## Quick start
1. Install clasp and login.
2. Create a GAS project and update `.clasp.json` scriptId.
3. Push source: `clasp push`.
4. Run `setupInitialize()` once from Apps Script editor.
5. Configure script properties:
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `LINE_CHANNEL_SECRET`
   - `LINE_OA_ID`
   - `TELEGRAM_BOT_TOKEN` (optional)
   - `TELEGRAM_CHAT_ID` (optional)
   - `SPREADSHEET_ID`
   - `DRIVE_ROOT_FOLDER_ID`
6. Deploy as Web App.
7. Set LINE webhook URL to: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?route=webhook`.

## Notes
- Admin auth uses Google account email allowlist (`admin_users` sheet).
- Live Chat menu can open standalone page in new tab (`?page=chat`).
- Polling interval can be adjusted in Settings.
- Direct Google Apps Script web apps can't read the `X-Line-Signature` header. Keep `LINE_REQUIRE_SIGNATURE=false` unless you verify LINE signatures in an external proxy before forwarding to GAS.

## Documentation
- Thai docs index: `DOCS_INDEX_TH.md`
- Docs changelog: `DOCS_CHANGELOG_TH.md`
- Full deploy manual: `DEPLOYMENT_MANUAL_TH.md`
- Staging to production flow: `DEPLOYMENT_STAGING_TH.md`
- Operations SOP: `OPERATIONS_SOP_TH.md`
- Daily ops checklist: `CHECKLIST_DAILY_TH.md`
- SOP print pack: `SOP_PRINT_PACK_TH.md`
- Role based checklists: `ROLE_BASED_CHECKLISTS_TH.md`
- KPI dashboard guide: `KPI_DASHBOARD_GUIDE_TH.md`
- Incident runbook: `RUNBOOK_INCIDENT_TH.md`
- Security baseline: `SECURITY_BASELINE_TH.md`
- Release note template: `RELEASE_NOTE_TEMPLATE_TH.md`
- Postmortem template: `POSTMORTEM_TEMPLATE_TH.md`
- Onboarding 30 days: `ONBOARDING_30_DAYS_TH.md`
- Training plan chat agent: `TRAINING_PLAN_CHAT_AGENT_TH.md`
