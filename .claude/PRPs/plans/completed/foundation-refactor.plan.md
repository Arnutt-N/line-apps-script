# Plan: Foundation Refactor (Phase 1)

## Summary

เพิ่ม 3 sheet schemas ใหม่ (`object_templates`, `template_variables`, `rich_menu_packs`) และเติม 2 columns เข้า schemas เดิม (`rich_menus.pack_id`, `users.current_state`) ผ่านการแก้ `SheetsRepo.SCHEMAS` + เพิ่ม seed functions ใน `Setup.gs` + ขยาย `DEFAULT_PERMISSIONS` สำหรับ action ใหม่ — ทำให้ backbone พร้อมรับ Phase 2–6 ต่อยอด โดยไม่แตะ Router/Auth/Webhook ที่ใช้ได้ดีอยู่แล้ว

## User Story

As **Topp (developer รันงาน refactor)**, I want **schema primitives + seed data พร้อมใช้ใน 1 crash-free `setupInitialize()`**, so that **Phase 2 (Object Templates + Renderer) เสียบ CRUD ได้ทันทีโดยไม่ต้องกลับมาแก้ schema**

## Problem → Solution

**Current**: SCHEMAS เดิมรองรับ auto-reply แบบ inline response (`response_templates`, `intent_responses`) และ rich menus เดี่ยวๆ ไม่มี concept "pack" / "variable_key reference" / "custom vars" → Phase 2–4 ไม่มีที่เสียบ

**Desired**: SCHEMAS มี dedicated tables สำหรับ (1) object template อ้างอิงด้วย `variable_key` เช่น `greeting_flex`, (2) custom variables ที่ admin กรอกเอง, (3) rich menu pack metadata + `pack_id` column ใน rich_menus, (4) user lifecycle state — ทั้งหมดใส่ `setupInitialize()` ได้ idempotent

## Metadata

- **Complexity**: Medium
- **Source PRD**: `.claude/PRPs/prds/line-oa-demo-platform.prd.md`
- **PRD Phase**: Phase 1 — Foundation Refactor
- **Estimated Files**: 3 (SheetsRepo.gs, Setup.gs, + CLAUDE.md update for new schemas)
- **Estimated Lines**: ~150–200

---

## UX Design

**Internal change — no user-facing UX transformation.**

Validation ผ่าน Apps Script editor + `system.schemas` endpoint (existing) คืน list schemas ใหม่กลับมา

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 (critical) | `src/server/SheetsRepo.gs` | 1–25 (SCHEMAS block) | Pattern ที่จะ extend — ห้ามแตก |
| P0 (critical) | `src/server/SheetsRepo.gs` | 27–60 (`ensureAll`, `ensureSheet_`) | เข้าใจ header-diff logic ก่อนเพิ่ม column |
| P0 (critical) | `src/server/Setup.gs` | ทั้งไฟล์ | ต้องเพิ่ม seed functions ตรง pattern `seedRoles_` / `seedSettings_` |
| P1 (important) | `src/server/Auth.gs` | 55–70 (`getPermissionsByRole`) | เข้าใจ permission wildcard `*` + seed pattern |
| P1 (important) | `src/server/Router.gs` | ทั้งไฟล์ | ไม่ต้องแก้ แต่ต้องรู้ action → permission mapping เพื่อ Phase 2–4 |
| P2 (reference) | `src/server/Utils.gs` | ทั้งไฟล์ | `nowIso`, `uuid`, `stringify`, `parseJson` — ห้ามเขียน util ซ้ำ |
| P2 (reference) | `CLAUDE.md` | ทั้งไฟล์ | Namespace pattern + "adding new sheet" checkpoint |
| P2 (reference) | `AGENTS.md` | Section 5 (Database Schema) | มีตารางอธิบายแต่ละ sheet |

## External Documentation

No external research needed — ใช้ patterns ภายใน codebase ล้วน

---

## Patterns to Mirror

Code patterns ที่พบใน codebase — ตามให้เหมือน

### NAMESPACE_IIFE
```javascript
// SOURCE: src/server/SheetsRepo.gs:1, Setup.gs:1 (ทุก .gs ไฟล์ใช้ pattern เดียวกัน)
var App = App || {};

App.ModuleName = (function () {
  function privateHelper_() { }  // trailing underscore = private
  function publicFn() { }
  return { publicFn: publicFn };
})();
```
**Critical**: ใช้ `var` ไม่ใช่ `const/let` สำหรับ `App` root — เพราะ GAS concatenate ทุก `.gs` เข้า global scope เดียว ต้อง redeclare ได้ปลอดภัย

### SCHEMA_DEFINITION
```javascript
// SOURCE: src/server/SheetsRepo.gs:4-23
var SCHEMAS = {
  users: ['id', 'line_user_id', 'display_name', ..., 'created_at', 'updated_at'],
  chat_rooms: ['id', 'user_id', 'mode', ..., 'created_at', 'updated_at'],
  // ทุก table ลงท้ายด้วย created_at, updated_at
  // 'id' column อยู่ตำแหน่งแรกเสมอ
};
```
**Rules**:
- `id` ต้องเป็นคอลัมน์แรก — `insert()` auto-populate ด้วย `App.Utils.uuid()`
- `created_at` + `updated_at` ต้องอยู่ท้าย — `insert`/`updateById` auto-manage
- ใช้ snake_case สำหรับ column name
- Boolean columns เก็บเป็น string `'true'` / `'false'` — ใช้ `App.Utils.toBool()` อ่าน
- JSON columns ลงท้ายด้วย `_json` — ใช้ `App.Utils.stringify` / `App.Utils.parseJson`

### SEED_FUNCTION_PATTERN
```javascript
// SOURCE: src/server/Setup.gs:51-60 (seedRoles_)
function seedRoles_() {
  DEFAULT_ROLES.forEach(function (role) {
    var found = App.SheetsRepo.findOne('roles', 'role_key', role.role_key);
    if (!found) {
      App.SheetsRepo.insert('roles', role);
    }
  });
}
```
**Pattern**:
- ทุก seed function เป็น private (trailing `_`)
- ใช้ `findOne(table, uniqueField, value)` เพื่อ idempotent check
- เพิ่มเฉพาะ row ที่ยังไม่มี — **ห้าม** overwrite existing
- เรียกจาก `initialize()` เรียงกัน

### PERMISSION_SEED
```javascript
// SOURCE: src/server/Setup.gs:10-15
var DEFAULT_PERMISSIONS = {
  owner: ['*'],
  admin: ['dashboard.view', 'chat.view', ...],
  agent: ['dashboard.view', 'chat.view', 'chat.send', 'histories.view'],
  viewer: ['dashboard.view', 'histories.view']
};
```
**Rule**: ถ้า action ใหม่ต้อง authorize ต้องเพิ่ม key ใน `admin` array (owner มี `*` ครอบแล้ว)

### IDEMPOTENT_INITIALIZE
```javascript
// SOURCE: src/server/Setup.gs:32-43
function initialize() {
  App.SheetsRepo.ensureAll();
  seedRoles_();
  seedPermissions_();
  var seededAdmin = seedAdmin_();
  seedSettings_();
  seedTemplates_();
  // ^ เพิ่ม seed function ใหม่ที่นี่
  return { ok: true, initializedAt: App.Utils.nowIso(), seededAdmin: seededAdmin };
}
```

### COLUMN_ADD_SAFE
```javascript
// SOURCE: SheetsRepo.gs:42-48 (ensureSheet_)
// header-diff logic: หาก headers มิสแมตช์ → rewrite row 1
// ข้อมูลเดิมไม่ถูกลบ แต่ต้อง append columns ใหม่ที่ "ท้าย" array
// ถ้าแทรกกลาง → data rows misalign!
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/server/SheetsRepo.gs` | UPDATE | เพิ่ม 3 new entries ใน SCHEMAS + append 2 columns ไปที่ `users` และ `rich_menus` |
| `src/server/Setup.gs` | UPDATE | เพิ่ม 4 new permission keys ใน DEFAULT_PERMISSIONS + เพิ่ม `seedRichMenuPacks_` (sample pack metadata) + เรียกจาก `initialize()` |
| `CLAUDE.md` | UPDATE | Section "Adding features" — ระบุว่า Phase 1 เพิ่ม 3 sheets ใหม่ + note เรื่อง "column ต้อง append ท้าย array" |

## NOT Building

- **`Module*.gs` CRUD endpoints สำหรับ object_templates / template_variables / rich_menu_packs** — เป็นของ Phase 2 + 3
- **Seed content ของ templates** — Phase 2 ขึ้นไป (ยกเว้น 3 sample pack metadata ที่ต้องมีเพื่อ verify schema)
- **Router.gs action entries** สำหรับ action ใหม่ — Phase 2/3/4 แต่ละเฟสลงทะเบียน action ของตัวเอง
- **Migrate response_templates → object_templates** — deprecate ไว้ก่อน, ลบในเฟสหลัง
- **Placeholder renderer (`App.Render.resolve`)** — Phase 2
- **Rich menu image upload + LINE API sync** — Phase 3
- **Friend lifecycle webhook logic** — Phase 6
- **UI** — ไม่มีการเปลี่ยน frontend ในเฟสนี้

---

## Step-by-Step Tasks

### Task 1: Extend SCHEMAS — add `object_templates`

- **ACTION**: แก้ `src/server/SheetsRepo.gs` เพิ่ม entry ใหม่ใน `SCHEMAS` object
- **IMPLEMENT**:
  ```javascript
  object_templates: [
    'id',
    'variable_key',   // slug-style stable reference, e.g. 'greeting_flex', 'menu_carousel'
    'name',           // Thai display name for admin UI
    'message_type',   // 'text' | 'textV2' | 'flex' | 'image' | 'sticker' | 'video' | 'audio' | 'location' | 'imagemap' | 'template'
    'payload_json',   // LINE Messaging API payload (stringified)
    'description',
    'is_system',      // 'true' | 'false' — system templates cannot be deleted
    'is_active',
    'created_at',
    'updated_at'
  ]
  ```
- **MIRROR**: SCHEMA_DEFINITION pattern (id first, created/updated last, snake_case, `_json` suffix for JSON, boolean-as-string)
- **IMPORTS**: ไม่มี (SCHEMAS เป็น static object)
- **GOTCHA**: `variable_key` ต้อง unique — แต่ไม่มี DB-level constraint, ต้อง enforce ใน Phase 2 CRUD layer
- **VALIDATE**:
  ```bash
  clasp push && clasp open
  # ใน editor: รัน setupInitialize() → เปิด Sheets ดูว่า tab object_templates ถูกสร้าง header 10 columns
  ```

### Task 2: Extend SCHEMAS — add `template_variables`

- **ACTION**: เพิ่ม entry ใหม่ใน `SCHEMAS`
- **IMPLEMENT**:
  ```javascript
  template_variables: [
    'id',
    'var_key',      // slug used in {{var.xxx}} — e.g. 'promoCode', 'deliveryFee'
    'var_name',     // Thai display name — e.g. 'โค้ดโปรโมชั่น'
    'var_value',
    'description',
    'is_system',
    'is_active',
    'created_at',
    'updated_at'
  ]
  ```
- **MIRROR**: SCHEMA_DEFINITION
- **GOTCHA**: อย่าใช้ column name `value` เฉยๆ — ชนกับ JS reserved-ish / getValues — ใช้ `var_value`
- **VALIDATE**: ดู tab `template_variables` ใน Sheets หลัง `setupInitialize()`

### Task 3: Extend SCHEMAS — add `rich_menu_packs`

- **ACTION**: เพิ่ม entry ใหม่
- **IMPLEMENT**:
  ```javascript
  rich_menu_packs: [
    'id',
    'pack_key',      // 'restaurant' | 'clothing' | 'school' | custom
    'name',          // Thai display name — 'ร้านอาหาร Demo'
    'vertical',      // 'restaurant' | 'clothing' | 'school' | 'other'
    'description',
    'cover_image_url',
    'is_current',    // 'true' = เป็น active pack ตอนนี้ (เปลี่ยนที่ละ 1 pack)
    'is_active',
    'created_at',
    'updated_at'
  ]
  ```
- **MIRROR**: SCHEMA_DEFINITION
- **GOTCHA**: `is_current` ต้องเป็น true ได้ครั้งละ 1 row ทั้ง sheet — enforce ใน Phase 3 activate logic
- **VALIDATE**: tab `rich_menu_packs` มี 10 columns

### Task 4: Append `pack_id` column to existing `rich_menus` schema

- **ACTION**: เพิ่ม `'pack_id'` เข้าท้าย array ของ `rich_menus` schema (ก่อน `created_at`)
- **IMPLEMENT**:
  ```javascript
  // Before:
  rich_menus: ['id', 'name', 'size', 'width', 'height', 'image_drive_id', 'image_url', 'line_rich_menu_id', 'is_default', 'is_active', 'created_at', 'updated_at'],

  // After:
  rich_menus: ['id', 'name', 'size', 'width', 'height', 'image_drive_id', 'image_url', 'line_rich_menu_id', 'is_default', 'is_active', 'pack_id', 'created_at', 'updated_at'],
  ```
- **MIRROR**: COLUMN_ADD_SAFE — แทรกก่อน `created_at`/`updated_at` ปลอดภัยเพราะ `ensureSheet_` rewrite เฉพาะ header row, data rows เดิมที่ยังไม่มีค่า `pack_id` จะปล่อย empty → ต้องมี guard ใน Phase 3 code
- **GOTCHA**: ถ้ามี data rows เดิม → column `created_at` / `updated_at` ใน row เดิมจะ shift ไปอยู่ column ผิดตำแหน่ง! **Acceptable risk เพราะ demo ยังไม่มี prod data** — ถ้ากลัว ให้ล้าง rich_menus sheet ก่อน `setupInitialize()` หรือ migrate ด้วยมือ
- **Mitigation**: Commit log หรือ docstring เตือนว่า "Phase 1 schema change is destructive to existing rich_menus rows"
- **VALIDATE**: ดู header row ของ sheet `rich_menus` ใน Google Sheets UI ว่ามี column `pack_id` เพิ่มก่อน `created_at`

### Task 5: Append `current_state` column to `users` schema

- **ACTION**: เพิ่ม `'current_state'` เข้าท้าย array `users` (ก่อน `created_at`)
- **IMPLEMENT**:
  ```javascript
  users: ['id', 'line_user_id', 'display_name', 'picture_url', 'status_message', 'language', 'followed_at', 'unfollowed_at', 'readded_count', 'last_seen_at', 'tags', 'notes', 'is_blocked', 'current_state', 'created_at', 'updated_at'],
  ```
- **MIRROR**: COLUMN_ADD_SAFE
- **SEMANTICS**: `current_state` = `'follower' | 'unfollowed' | 'blocked' | 'new'`; Phase 6 webhook จะ update, แต่ Phase 1 สร้าง column เฉยๆ
- **GOTCHA**: เช่นเดียวกับ Task 4 — destructive ต่อ rows เดิม, demo OK
- **VALIDATE**: header `users` มี `current_state` ก่อน `created_at`

### Task 6: Extend `DEFAULT_PERMISSIONS` in Setup.gs

- **ACTION**: แก้ `src/server/Setup.gs` เพิ่ม permission keys ใหม่ให้ admin role
- **IMPLEMENT**:
  ```javascript
  var DEFAULT_PERMISSIONS = {
    owner: ['*'],
    admin: [
      'dashboard.view', 'chat.view', 'chat.send', 'chat.manage',
      'richmenu.manage', 'autoreply.manage', 'templates.manage',
      'histories.view', 'liff.manage', 'settings.manage', 'settings.admin',
      // NEW for Phase 2–6:
      'templates.object.manage',   // object_templates CRUD (Phase 2)
      'templates.variables.manage', // template_variables CRUD (Phase 2)
      'richmenu.pack.manage',      // rich_menu_packs activate/CRUD (Phase 3)
      'chat.escalate'              // Telegram escalation trigger (Phase 5)
    ],
    agent: ['dashboard.view', 'chat.view', 'chat.send', 'histories.view', 'chat.escalate'],
    viewer: ['dashboard.view', 'histories.view']
  };
  ```
- **MIRROR**: PERMISSION_SEED — keys ใช้ dot-notation, `owner` มี wildcard ไม่ต้องเพิ่ม
- **IMPORTS**: ไม่มี (constant)
- **GOTCHA**: `seedPermissions_()` idempotent — เพิ่ม key ใหม่จะถูก insert เฉพาะที่ยังไม่มี; key เก่าที่ admin แก้ใน sheet แล้วจะ **ไม่** ถูก revert
- **VALIDATE**:
  ```bash
  # After setupInitialize()
  # ใน Sheets tab 'permissions' → filter role_key=admin → ต้องมี 4 rows ใหม่
  ```

### Task 7: Add `seedRichMenuPacks_` function — seed 3 sample packs

- **ACTION**: เพิ่ม private function ใน `App.Setup` + เรียกจาก `initialize()`
- **IMPLEMENT**:
  ```javascript
  // Add near other seed functions in Setup.gs
  var DEFAULT_RICH_MENU_PACKS = [
    {
      pack_key: 'restaurant',
      name: 'ร้านอาหาร Demo',
      vertical: 'restaurant',
      description: 'เมนู, โปรโมชั่น, สั่งอาหาร, จองโต๊ะ, ร้านอยู่ไหน, คุยกับคน',
      cover_image_url: '',
      is_current: 'false',
      is_system: 'true',
      is_active: 'true'
    },
    {
      pack_key: 'clothing',
      name: 'ร้านขายเสื้อผ้า Demo',
      vertical: 'clothing',
      description: 'คอลเลคชั่นใหม่, โปรโมชั่น, สั่งของ, ขนาด, ที่ตั้งร้าน, คุยกับคน',
      cover_image_url: '',
      is_current: 'false',
      is_system: 'true',
      is_active: 'true'
    },
    {
      pack_key: 'school',
      name: 'โรงเรียน Demo',
      vertical: 'school',
      description: 'ตารางเรียน, ค่าเทอม, ติดต่อครู, กิจกรรม, แผนที่โรงเรียน, คุยกับคน',
      cover_image_url: '',
      is_current: 'false',
      is_system: 'true',
      is_active: 'true'
    }
  ];

  function seedRichMenuPacks_() {
    DEFAULT_RICH_MENU_PACKS.forEach(function (pack) {
      var found = App.SheetsRepo.findOne('rich_menu_packs', 'pack_key', pack.pack_key);
      if (!found) {
        App.SheetsRepo.insert('rich_menu_packs', pack);
      }
    });
  }
  ```
  แล้วเพิ่มใน `initialize()` ก่อน return:
  ```javascript
  App.SheetsRepo.ensureAll();
  seedRoles_();
  seedPermissions_();
  var seededAdmin = seedAdmin_();
  seedSettings_();
  seedTemplates_();
  seedRichMenuPacks_();  // ← NEW
  ```
- **MIRROR**: SEED_FUNCTION_PATTERN — ใช้ `findOne(table, uniqueField, value)` + insert ถ้าไม่มี
- **IMPORTS**: ไม่มี
- **GOTCHA**: แค่ metadata; rich menu image + line_rich_menu_id เป็น Phase 3 + Phase 7–9 เติม
- **VALIDATE**:
  ```
  # After setupInitialize()
  # Sheet 'rich_menu_packs' มี 3 rows: restaurant, clothing, school
  ```

### Task 8: Update CLAUDE.md to reflect new schemas

- **ACTION**: เพิ่ม section สั้นๆ ที่ "Adding features" checkpoint ระบุว่ามี schemas ใหม่
- **IMPLEMENT**: append 3 lines ใต้ "**New sheet:** add to `SCHEMAS` in `SheetsRepo.gs` + rerun `setupInitialize()`":
  ```markdown

  **Phase 1 schemas (new):** `object_templates`, `template_variables`, `rich_menu_packs`. Existing `rich_menus` has new `pack_id` column; `users` has new `current_state`.

  **Gotcha when adding columns:** `ensureSheet_` rewrites only the header row, not data. Always append new columns **before** `created_at`/`updated_at` at the end — inserting mid-array shifts existing data off by one column.
  ```
- **MIRROR**: existing CLAUDE.md style (terse, action-oriented)
- **GOTCHA**: อย่าเขียนยาว — CLAUDE.md ควร <150 lines
- **VALIDATE**: เปิดอ่าน CLAUDE.md ดู section นี้ปรากฏ

### Task 9: Push + run setupInitialize + smoke test

- **ACTION**: `clasp push` → เปิด editor → รัน `setupInitialize()` → verify
- **IMPLEMENT**:
  ```bash
  clasp push
  clasp open
  # ใน editor: เลือก function setupInitialize → Run
  ```
- **VALIDATE**:
  1. ไม่มี error ใน execution log
  2. Google Sheets เปิดดู: มี 3 tabs ใหม่ (`object_templates`, `template_variables`, `rich_menu_packs`)
  3. `rich_menu_packs` มี 3 rows (restaurant/clothing/school)
  4. `rich_menus` header row มี column `pack_id`
  5. `users` header row มี column `current_state`
  6. `permissions` มี 4 rows ใหม่สำหรับ role `admin`
  7. (ไม่บังคับ) เปิดเว็บ deployment → call `system.schemas` endpoint → เช็ค response รวม 3 sheets ใหม่

---

## Testing Strategy

### "Unit" Tests (manual — GAS ไม่มี test runner)

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `setupInitialize()` — ครั้งแรก | Spreadsheet ว่าง | 20+ tabs (16 เดิม + 3 ใหม่ + ยิง seed) | - |
| `setupInitialize()` — ครั้งที่สอง | มี data อยู่แล้ว | No error, idempotent (ไม่ duplicate seed row) | Idempotency |
| `setupInitialize()` — หลังมีข้อมูล rich_menus เดิม | 1 row ใน rich_menus | Header มี pack_id, data row เก่าไม่ shift | Column append |
| `seedRichMenuPacks_()` — เรียก 2 ครั้ง | ครั้งที่ 1 insert 3 rows | ครั้งที่ 2 ไม่ insert ซ้ำ (unique ด้วย pack_key) | Idempotency |
| `setupInitialize()` — ไม่ set SPREADSHEET_ID | Script properties ว่าง | Throw "Missing script property: SPREADSHEET_ID" | Config missing |

### Edge Cases Checklist

- [x] Empty spreadsheet — `ensureAll` สร้างครบ
- [x] Repeat init — idempotent (ไม่เพิ่ม duplicate)
- [x] Header reshape — `ensureSheet_` rewrite row 1 ถูก
- [ ] Existing data in `rich_menus` / `users` — **KNOWN DATA LOSS risk** ถ้ารันบน prod sheet
- [x] Permission seed collision — existing row ไม่โดน overwrite
- [ ] **Concurrent access** — ไม่ test (GAS สะดุดเอง Lock Service ไม่ใช้)
- [x] Missing SPREADSHEET_ID — throw ชัดเจน

### Manual Validation Script

บันทึกผ่าน Execution log + Google Sheets UI:

1. **Fresh install** path:
   - Script Properties: set `SPREADSHEET_ID`, `DRIVE_ROOT_FOLDER_ID`, `BOOTSTRAP_ADMIN_EMAIL`
   - Run `setupInitialize()` → expect `{ ok: true, ... }`
   - Check sheet count = 20 (17 เดิม + 3 ใหม่)
2. **Re-init** path:
   - Run `setupInitialize()` อีกรอบ
   - Check `rich_menu_packs` ยังมี 3 rows ไม่ซ้ำ
3. **Schema mutation** path (ทดสอบ column add):
   - เพิ่ม dummy row ใน `rich_menus` (pre-existing แบบ manual)
   - Run `setupInitialize()` again
   - Sanity check: dummy row data ยัง align columns เดิม
4. **API surface** path:
   - Deploy web app → call `POST` body `{"action":"system.schemas"}`
   - Response ต้อง include `object_templates`, `template_variables`, `rich_menu_packs`

---

## Validation Commands

### Static Analysis / Lint

GAS ไม่มี linter local. ใช้:

```bash
clasp push
```
EXPECT: "Pushed N files" without syntax errors. หาก GAS runtime error จะโผล่ตอนรัน `setupInitialize()` เท่านั้น

### Execution Test

```
# ใน Apps Script editor
Run → setupInitialize
```
EXPECT: Execution log แสดง completed, `{ok: true, seededAdmin: {...}}` ใน return value

### Schema Verification

```
# ใน Apps Script editor หรือ browser console ของ web app
apiDispatch({ action: 'system.schemas' })
```
EXPECT: Array มี 20 items รวม `object_templates`, `template_variables`, `rich_menu_packs`

### Sheets UI Spot Check

1. เปิด Google Sheet ที่ configured
2. มี tab ใหม่ 3 tabs
3. Frozen row 1 มี headers ครบ
4. `rich_menu_packs` มี 3 rows pre-seeded

---

## Acceptance Criteria

- [ ] `src/server/SheetsRepo.gs` `SCHEMAS` เพิ่ม 3 entries + 2 columns
- [ ] `src/server/Setup.gs` `DEFAULT_PERMISSIONS.admin` มี 4 keys ใหม่
- [ ] `src/server/Setup.gs` มี `seedRichMenuPacks_()` + `DEFAULT_RICH_MENU_PACKS` + เรียกจาก `initialize()`
- [ ] `CLAUDE.md` update section "Adding features" + gotcha about column insertion
- [ ] `clasp push` ผ่าน zero syntax error
- [ ] `setupInitialize()` รัน 1 ครั้งสำเร็จ (fresh install)
- [ ] `setupInitialize()` รัน 2 ครั้งยัง idempotent (no duplicate)
- [ ] `system.schemas` endpoint return ครบ 20 tables รวมใหม่
- [ ] Rich menu packs 3 rows seed ครบ (restaurant / clothing / school)

## Completion Checklist

- [ ] NAMESPACE_IIFE pattern คง `var App = App || {}`
- [ ] SCHEMA_DEFINITION — id first, created_at/updated_at last, snake_case, `_json` suffix สำหรับ JSON, boolean-as-string
- [ ] SEED_FUNCTION_PATTERN — private name ลงท้าย `_`, idempotent ด้วย `findOne` check
- [ ] PERMISSION_SEED — dot-notation keys, เพิ่มแค่ใน admin array
- [ ] ไม่มี `const`/`let` ที่ top-level ของ `App` namespace (GAS global concat)
- [ ] ไม่มี `Module*.gs` ใหม่ในเฟสนี้ — เหลือไว้ Phase 2+
- [ ] ไม่แตะ `Router.gs` MAP — เหลือให้ Phase 2+ เพิ่ม action ของตัวเอง
- [ ] ไม่แตะ `Auth.gs`, `Webhook.gs`, frontend files
- [ ] CLAUDE.md update ไม่เกิน 10 บรรทัด

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Append column ไปที่ rich_menus ชน data เดิม misalign | MEDIUM | HIGH (lost data) | เตือนใน CLAUDE.md + suggest ล้าง tabs ก่อน init; demo platform ยังไม่มี prod data — risk low จริง |
| seed `rich_menu_packs` ชนกับ manual row ที่ admin สร้างเอง (same pack_key) | LOW | LOW | `findOne` check ด้วย `pack_key` ก่อน insert — ข้ามถ้ามีแล้ว |
| Permission seed `chat.escalate` ใน `agent` ทำให้ agent ที่มีอยู่ถูก upgrade permission โดยไม่ตั้งใจ | LOW | LOW | แจ้งใน commit message + สาธิตใน demo ก็ต้องการ feature นี้อยู่แล้ว |
| `setupInitialize()` 6-min timeout | LOW | MEDIUM | 3 new tables + 3 seed rows เล็กมาก — ไม่น่าถึง limit |
| `variable_key` / `pack_key` / `var_key` เขียนผิด collision ระหว่าง Phase 2 CRUD | MEDIUM | MEDIUM | Phase 2 ต้อง enforce uniqueness ตอน create + reject slash/space |
| Existing `response_templates` กับ `object_templates` ซ้ำ concept confusion | MEDIUM | LOW | Phase 4 migrate แล้ว deprecate `response_templates` |

## Notes

- **Keep `response_templates`**: ไม่ remove ในเฟสนี้ — deprecate ใน Phase 4 หลัง `ModuleAutoReply` rewrite เสร็จ
- **`friend_histories` ไม่ต้องแก้**: ของเดิมมี `event_type`, `source`, `ref_code`, `nth_add`, `event_at` ครบแล้วสำหรับ lifecycle ของ Phase 6
- **`pack_id` ใน `rich_menus`** เป็น logical FK — GAS Sheets ไม่มี constraint enforcement → Phase 3 CRUD ต้อง validate เอง
- **Naming decisions**:
  - `variable_key` (object_templates) — slug เช่น `greeting_flex`
  - `var_key` (template_variables) — slug เช่น `promoCode`
  - `pack_key` (rich_menu_packs) — slug เช่น `restaurant`
  - ใช้ suffix `_key` ทุก slug เพื่อ distinguish จาก user-facing `name`
- **ไม่ gen test file**: GAS ไม่มี test framework (ดู CLAUDE.md) — validation ผ่านการรัน `setupInitialize()` + sheets UI check
