# Implementation Report: Foundation Refactor (Phase 1)

## Summary

Extended `SheetsRepo.SCHEMAS` ด้วย 3 ตารางใหม่ (`object_templates`, `template_variables`, `rich_menu_packs`) + appended 2 columns เข้าตารางเดิม (`rich_menus.pack_id`, `users.current_state`) + เพิ่ม 4 permission keys + seed 3 sample rich menu packs (restaurant/clothing/school) + documented new schemas + column-append gotcha ใน CLAUDE.md — backbone พร้อมรับ Phase 2–6 โดยไม่แตะ Router/Auth/Webhook

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Medium | Medium (ตรง) |
| Confidence | 9/10 | 9/10 (ผ่านตามแผน ไม่มี deviation) |
| Files Changed | 3 | 3 (`SheetsRepo.gs`, `Setup.gs`, `CLAUDE.md`) |
| Tasks planned | 9 | 9 (รวมเป็น 4 edits จริง) |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Extend SCHEMAS — add `object_templates` | Complete | Merged กับ Task 2–5 เป็น 1 edit (single SCHEMAS object literal) |
| 2 | Extend SCHEMAS — add `template_variables` | Complete | ดู Task 1 |
| 3 | Extend SCHEMAS — add `rich_menu_packs` | Complete | ดู Task 1 |
| 4 | Append `pack_id` to `rich_menus` | Complete | Placed before `created_at` (safe-append) |
| 5 | Append `current_state` to `users` | Complete | Placed before `created_at` (safe-append) |
| 6 | Extend `DEFAULT_PERMISSIONS` | Complete | 4 new keys ใน admin + `chat.escalate` ใน agent ด้วย |
| 7 | Add `DEFAULT_RICH_MENU_PACKS` + `seedRichMenuPacks_` | Complete | Wired เข้า `initialize()` หลัง `seedTemplates_` |
| 8 | Update CLAUDE.md | Complete | เพิ่ม 2 paragraphs ใต้ "Adding features" |
| 9 | clasp push + manual `setupInitialize` | **Pending user action** | ต้องรันใน Apps Script editor |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis | Pass | GAS ไม่มี linter; self-review ด้วย grep confirmed references สอดคล้อง |
| Unit Tests | N/A | GAS ไม่มี test framework |
| Build | N/A | GAS ไม่มี build step |
| Integration | **Pending user** | ต้อง `clasp push` + รัน `setupInitialize()` ในเครื่อง user |
| Edge Cases | Pass | Idempotent seed pattern mirrors existing seedRoles_ / seedSettings_ |

### Grep verification (all 3 new schemas + 2 column adds + seed function + permissions):

```
SheetsRepo.gs:5   users  → มี current_state ก่อน created_at
SheetsRepo.gs:13  object_templates schema ครบ 10 cols
SheetsRepo.gs:14  template_variables schema ครบ 9 cols
SheetsRepo.gs:15  rich_menus → มี pack_id ก่อน created_at
SheetsRepo.gs:17  rich_menu_packs schema ครบ 11 cols
Setup.gs:17-18    4 new permission keys ใน admin
Setup.gs:20       chat.escalate ใน agent
Setup.gs:35       DEFAULT_RICH_MENU_PACKS array (3 packs)
Setup.gs:75       seedRichMenuPacks_() wired ใน initialize()
Setup.gs:84-89    seedRichMenuPacks_ function definition (idempotent)
```

## Files Changed

| File | Action | Lines |
|---|---|---|
| `src/server/SheetsRepo.gs` | UPDATED | +3 / -1 (SCHEMAS block) |
| `src/server/Setup.gs` | UPDATED | +42 / -4 (permissions + seed const + seed fn + initialize wire-up) |
| `CLAUDE.md` | UPDATED | +3 (new Phase 1 note + gotcha paragraph) |

## Deviations from Plan

**None — implemented exactly as planned.**

Note: Plan listed 9 discrete tasks; implementation collapsed Tasks 1–5 into 1 Edit (single SCHEMAS object), Tasks 6–7 into 2 Edits. Output identical to plan.

## Issues Encountered

- **Read hook blocked re-reading unchanged files** — solved ด้วย initial Read to register file, then Edit. Non-blocking.
- **No local validation tooling** — expected; GAS workflow is `clasp push` + manual editor run. Noted in report as pending user action.

## Tests Written

**None** — GAS has no automated test framework (documented in `CLAUDE.md`). Validation is manual:

1. Fresh install: `setupInitialize()` ใน GAS editor → expect `{ok: true, ...}` + 3 new tabs + 3 rich_menu_packs rows
2. Re-init: run อีกครั้ง → idempotent, no duplicates
3. Schema verification: `apiDispatch({action:'system.schemas'})` → response includes 3 new tables
4. Permission seed: tab `permissions` → filter `role_key=admin` → 4 new rows present

## Manual Actions Required

**User must run**:

```bash
clasp push
clasp open
# ใน Apps Script editor: เลือก function setupInitialize → Run
```

Then verify in Google Sheets UI:
- ใหม่: tabs `object_templates`, `template_variables`, `rich_menu_packs`
- `rich_menu_packs` มี 3 rows: restaurant / clothing / school
- `rich_menus` header มี column `pack_id`
- `users` header มี column `current_state`
- `permissions` มี 4 rows ใหม่สำหรับ `admin`

## Next Steps

- [ ] User: `clasp push` + `setupInitialize()` smoke test
- [ ] `/prp-plan .claude/PRPs/prds/line-oa-demo-platform.prd.md` → plan Phase 2 (Object Templates + Placeholder Renderer)
- [ ] `/prp-plan ...` → plan Phase 3 (Rich Menu Pack System) — ขนานได้กับ Phase 2
- [ ] Consider commit: planning artifacts (`.claude/PRPs/`, `CLAUDE.md`) + code changes in one logical commit
