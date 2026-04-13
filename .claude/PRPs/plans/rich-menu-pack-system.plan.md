# Plan: Rich Menu Pack System (Phase 3)

## Summary

สร้าง `App.RichMenuPack` module ที่ orchestrate การสลับ rich menu pack ระหว่าง 3 verticals (restaurant / clothing / school) — เรียก `App.LineApi.setDefaultRichMenu` (มีอยู่แล้ว) กับ `line_rich_menu_id` ของ rich_menu ที่เป็น default ใน pack ที่เลือก, flip `is_current` flag ใน `rich_menu_packs`, และเก็บ `DEMO_ACTIVE_PACK` ลง Script Properties เพื่อ fast read — พร้อม router entries `richmenu.pack.*` + smoke function. **ไม่** สร้าง/ลบ rich menu ที่ LINE (ของเดิม `App.RichMenu.publish` ทำอยู่แล้ว — Phase 3 แค่สลับ default pointer)

## User Story

As **Topp (admin demo)**, I want **คลิก "Activate Restaurant" 1 ครั้งแล้ว LINE OA เปลี่ยน default rich menu ภายใน 5 วินาที**, so that **ตอน pitch prospect ผมสลับระหว่าง 3 demo packs ได้ไม่ติดขัด + `DEMO_ACTIVE_PACK` cache ใน Script Properties ให้ webhook รู้ว่า pack ไหน active (ใช้ routing auto-reply ใน Phase 4)**

## Problem → Solution

**Current**: Phase 1 seed `rich_menu_packs` 3 rows แต่ยังไม่มี code orchestrate การ activate. `App.RichMenu.setDefault(payload, ctx)` (ใน `ModuleRichMenu.gs:215`) สลับ menu เดี่ยวได้แล้ว แต่ไม่รู้จัก concept "pack" — ไม่ update `rich_menu_packs.is_current`, ไม่ set Script Property

**Desired**: โมดูล `App.RichMenuPack` ทำ 5 อย่างใน atomic-ish flow:
1. ค้นหา rich_menu row ที่ `pack_id=<target>` และ `is_default='true'`
2. ถ้า `line_rich_menu_id` ยังว่าง → reject + return error ชัดว่าต้อง publish ก่อน
3. เรียก `App.LineApi.setDefaultRichMenu(lineRichMenuId)` — ถ้า LINE error → abort, ไม่แตะ sheet
4. Update sheet: `is_current='false'` ทุก pack, `is_current='true'` เฉพาะ pack target
5. Set Script Property `DEMO_ACTIVE_PACK = pack_key`

Audit log + return summary `{ ok, packKey, defaultMenuId, activatedAt }`

## Metadata

- **Complexity**: Medium
- **Source PRD**: `.claude/PRPs/prds/line-oa-demo-platform.prd.md`
- **PRD Phase**: Phase 3 — Rich Menu Pack System
- **Estimated Files**: 2 new (`ModuleRichMenuPack.gs`, `ModuleSmokePack.gs`) + 1 modified (`Router.gs`) + 1 optional modified (`Config.gs` — DEMO_ACTIVE_PACK getter)
- **Estimated Lines**: ~300–400

---

## UX Design

**Admin-triggered, no UI yet** — เรียกผ่าน API (UI ใน Phase 10)

### Validation flow:
1. Admin (role=admin) call `apiDispatch({ action: 'richmenu.pack.list' })` → เห็น 3 packs + `isCurrent` flag
2. Call `richmenu.pack.activate` ด้วย `packId=<restaurant row id>` → ได้ `{ ok: true, packKey: 'restaurant', defaultMenuId: 'richmenu-abc123' }`
3. ภายใน 5 วินาที: เปิด LINE OA app → default rich menu เปลี่ยนเป็นของร้านอาหาร

### Guarded paths:
- ถ้ายังไม่ publish รัช menu ของ pack นั้นที่ LINE → reject with `{ ok: false, error: 'NO_PUBLISHED_MENU', message: 'Pack "restaurant" ยังไม่มี rich menu ที่ publish แล้ว กรุณา publish ก่อน activate pack' }`
- ถ้า pack_id ไม่มีในชีท → reject `{ ok: false, error: 'PACK_NOT_FOUND' }`
- ถ้า LINE API fail → reject + log, ไม่ flip sheet

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 (critical) | `src/server/ModuleRichMenu.gs` | 215–241 (`setDefault`) | **Reference pattern** — orchestrate sheet update + LINE call + audit; เขียน `App.RichMenuPack.activate` ตามแบบนี้ |
| P0 (critical) | `src/server/LineApi.gs` | 79–81 (`setDefaultRichMenu`) | ใช้ตรงๆ — ห้ามเขียน HTTP wrapper ใหม่ |
| P0 (critical) | `src/server/SheetsRepo.gs` | 1–25 (SCHEMAS) | ยืนยัน `rich_menu_packs` column order + `rich_menus.pack_id` |
| P0 (critical) | `src/server/Router.gs` | 14–20 (richmenu block) | pattern ที่จะ append entries ใหม่ |
| P0 (critical) | `src/server/Setup.gs` | DEFAULT_RICH_MENU_PACKS | 3 pack keys: `restaurant`, `clothing`, `school` |
| P1 (important) | `src/server/Config.gs` | ทั้งไฟล์ | pattern อ่าน/เขียน Script Properties สำหรับ `DEMO_ACTIVE_PACK` |
| P1 (important) | `src/server/Utils.gs` | ทั้งไฟล์ | `nowIso`, `stringify` |
| P1 (important) | `src/server/ModuleRichMenu.gs` | 1–100 (list, create) | เข้าใจ rich_menu row shape + `is_default` flag handling |
| P2 (reference) | `CLAUDE.md` | "Adding features" | Endpoint checklist |
| P2 (reference) | `.claude/PRPs/prds/line-oa-demo-platform.prd.md` | lines 140–210 | Technical Direction + Phase 3 (PRD line 148: pack = collection of rich_menus with pack_id) |

## External Documentation

### LINE Messaging API — Set default rich menu

**Endpoint**: `POST https://api.line.me/v2/bot/user/all/richmenu/{richMenuId}`

**Auth**: `Authorization: Bearer {channel access token}`

**Rate limit**: Standard (ไม่ใช่ premium) — 1,000 req/sec per channel; pack activate เรียกแค่ 1 request → ไม่น่าเจอ rate limit

**Wrapper ที่มีแล้ว**: `App.LineApi.setDefaultRichMenu(richMenuId)` (src/server/LineApi.gs:79)

**Reference**: https://developers.line.biz/en/reference/messaging-api/#set-default-rich-menu

**Error shape** (ที่ `request_` คืนเมื่อ LINE ตอบ non-2xx):
```javascript
{ ok: false, status: 404, body: '{"message":"The request body has 1 error(s)"}' }
```
→ Plan: ถ้า `!res.ok` → abort + throw Error

---

## Patterns to Mirror

### NAMESPACE_IIFE
```javascript
// SOURCE: src/server/ModuleRichMenu.gs:1
var App = App || {};
App.RichMenuPack = (function () {
  function list() { /* ... */ }
  function activate(payload, ctx) { /* ... */ }
  return { list: list, activate: activate };
})();
```

### ORCHESTRATED_ACTION (sheet + LINE API + audit)
```javascript
// SOURCE: src/server/ModuleRichMenu.gs:215-241 (setDefault pattern)
function activate(payload, ctx) {
  // 1. Load + validate
  var pack = App.SheetsRepo.findOne('rich_menu_packs', 'id', payload.packId);
  if (!pack) return { ok: false, error: 'PACK_NOT_FOUND' };

  // 2. Find default menu ใน pack
  var menus = App.SheetsRepo.findAll('rich_menus', { pack_id: payload.packId, is_default: 'true', is_active: 'true' });
  var target = menus[0];
  if (!target || !target.line_rich_menu_id) {
    return { ok: false, error: 'NO_PUBLISHED_MENU', message: '...' };
  }

  // 3. LINE API first (fail-fast — ถ้าพังก็ไม่แตะ sheet)
  App.LineApi.setDefaultRichMenu(target.line_rich_menu_id);

  // 4. Flip sheet flags
  App.SheetsRepo.findAll('rich_menu_packs', {}).forEach(function (row) {
    App.SheetsRepo.update('rich_menu_packs', row.id, { is_current: row.id === pack.id ? 'true' : 'false' });
  });

  // 5. Script Property cache
  PropertiesService.getScriptProperties().setProperty('DEMO_ACTIVE_PACK', pack.pack_key);

  // 6. Audit
  App.SheetsRepo.appendAudit(ctx.email, 'richmenu.pack.activate', 'rich_menu_packs', pack.id, { lineRichMenuId: target.line_rich_menu_id });

  return { ok: true, packKey: pack.pack_key, defaultMenuId: target.line_rich_menu_id, activatedAt: App.Utils.nowIso() };
}
```

**Critical**: เรียก LINE API **ก่อน** update sheet — ถ้า LINE พัง ก็ไม่มี ghost state ในชีท. ตรงกับ rule "fail-fast" ใน `common/coding-style.md`

### ROUTER_MAP_ENTRY
```javascript
// SOURCE: src/server/Router.gs:14-20
'richmenu.pack.list':     { permission: 'richmenu.pack.manage', handlerPath: 'RichMenuPack.list' },
'richmenu.pack.activate': { permission: 'richmenu.pack.manage', handlerPath: 'RichMenuPack.activate' },
'richmenu.pack.create':   { permission: 'richmenu.pack.manage', handlerPath: 'RichMenuPack.create' },
'richmenu.pack.update':   { permission: 'richmenu.pack.manage', handlerPath: 'RichMenuPack.update' },
'richmenu.pack.remove':   { permission: 'richmenu.pack.manage', handlerPath: 'RichMenuPack.remove' },
```

### SCRIPT_PROPERTY_ACCESS
```javascript
// SOURCE: src/server/Config.gs pattern — read via App.Config
function getActivePack() {
  var key = PropertiesService.getScriptProperties().getProperty('DEMO_ACTIVE_PACK') || '';
  return key;
}
// Prefer encapsulate ใน App.Config.getActivePack() เพื่อ Phase 4 webhook เรียก
```

### NORMALIZE_ROW + NESTED
```javascript
function normalize_(pack, menus) {
  return {
    id: pack.id,
    packKey: pack.pack_key,
    name: pack.name,
    vertical: pack.vertical,
    description: pack.description,
    coverImageUrl: pack.cover_image_url,
    isCurrent: pack.is_current === 'true',
    isSystem: pack.is_system === 'true',
    isActive: pack.is_active === 'true',
    menus: (menus || []).map(function (m) { return { id: m.id, name: m.name, isDefault: m.is_default === 'true', lineRichMenuId: m.line_rich_menu_id }; }),
    createdAt: pack.created_at,
    updatedAt: pack.updated_at
  };
}
```

---

## Tasks

### Task 1 — สร้าง `App.RichMenuPack.list` + `getActive`

**Scope**: Read-only operations

**Files**:
- สร้างใหม่ `src/server/ModuleRichMenuPack.gs` (stub ~60 lines; รวมของ Task 2 แล้วได้ ~180 lines)

**Functions**:
- `list()` — คืน 3 packs พร้อม nested menus (join `rich_menus` by `pack_id`) + `isCurrent` flag
- `getActive()` — คืน single pack ที่ `is_current='true'` หรือ `null`

**Acceptance**: `App.RichMenuPack.list()` คืน 3 rows (seed จาก Phase 1) — ทุก row `menus: []` เพราะยังไม่ publish rich menu ให้ pack ไหน

**Dependencies**: None (Phase 1 seed พร้อมแล้ว)

---

### Task 2 — implement `activate(packId)`

**Scope**: Core orchestration — 6 steps ตาม ORCHESTRATED_ACTION pattern

**Files**: `src/server/ModuleRichMenuPack.gs` (ต่อจาก Task 1)

**Steps**:
1. Load pack by `payload.packId` — return `PACK_NOT_FOUND` ถ้าไม่เจอ
2. Find `rich_menus` where `pack_id=packId` + `is_default='true'` + `is_active='true'`
3. Validate `line_rich_menu_id` ไม่ว่าง — ถ้าว่าง return `NO_PUBLISHED_MENU`
4. Call `App.LineApi.setDefaultRichMenu(lineRichMenuId)` (throw ถ้าพัง)
5. Flip `is_current` flags ใน `rich_menu_packs` (ล้างทั้งหมด แล้ว set ตัวเดียว)
6. `PropertiesService.getScriptProperties().setProperty('DEMO_ACTIVE_PACK', pack.pack_key)`
7. `appendAudit` + return payload

**Acceptance**:
- Pack ที่มี `line_rich_menu_id` จริง → LINE OA สลับ default menu ภายใน 5 วินาที
- Pack ที่ยังไม่มี → return `NO_PUBLISHED_MENU` + ชีทไม่เปลี่ยน + LINE API ไม่ถูกเรียก
- Packs อื่น: `is_current='false'` หลังจาก activate

**Dependencies**: Task 1

---

### Task 3 — implement CRUD (`create`, `update`, `remove`)

**Scope**: CRUD รองรับกรณีอยากเพิ่ม pack เอง (e.g., vertical ใหม่)

**Files**: `src/server/ModuleRichMenuPack.gs` (ต่อ)

**Guards**:
- `is_system='true'` rows → ห้าม remove (3 pack seed ต้องอยู่ถาวร)
- `is_system='true'` rows → update ได้แค่ `description`, `cover_image_url` (ไม่ให้แก้ `pack_key`)

**Acceptance**: User add pack `demo-salon` → list คืน 4 rows → remove → ลบได้ แต่ลบ `restaurant` → reject

**Dependencies**: Task 1

---

### Task 4 — เพิ่ม router entries

**Scope**: 5 entries ใน `src/server/Router.gs` MAP (ตาม block `ROUTER_MAP_ENTRY` ด้านบน)

**Files**: `src/server/Router.gs`

**Acceptance**: Frontend call `richmenu.pack.list` ได้ — ถ้า role=admin + permission พร้อม Phase 1 → 200 + rows; ถ้า role=viewer → 403

**Dependencies**: Tasks 1–3

---

### Task 5 — extend `App.Config` ด้วย `getActivePack()`

**Scope**: Encapsulate Script Property read — Phase 4 webhook + Phase 5 จะใช้

**Files**: `src/server/Config.gs`

**Add**:
```javascript
function getActivePack() {
  return PropertiesService.getScriptProperties().getProperty('DEMO_ACTIVE_PACK') || '';
}
// export ใน return { ... getActivePack: getActivePack }
```

**Acceptance**: `App.Config.getActivePack()` คืน string — ว่างถ้ายังไม่ activate

**Dependencies**: Task 2 (Script Property เขียนแล้ว)

---

### Task 6 — สร้าง smoke function `ModuleSmokePack.gs`

**Scope**: Test โดยไม่ยิง LINE API จริง (dry-run mode)

**Files**: `src/server/ModuleSmokePack.gs` (~80 lines)

**Approach** (GAS ไม่มี mocking framework):
1. `smokePackListFlow()` — เรียก `App.RichMenuPack.list()` → assert length >= 3 + `isCurrent` flag valid
2. `smokePackActivateDryRun()` — รัน activate แต่ก่อนเรียก LINE API, stub `App.LineApi.setDefaultRichMenu = function() { return { ok: true, stubbed: true }; }` → assert sheet flip + Script Property set → restore ฟังก์ชันเดิม

**⚠ Note**: Stubbing ใน GAS ทำผ่าน reassign ฟังก์ชันใน namespace — ต้อง wrap try/finally เพื่อ restore เสมอ

**Acceptance**: `App.Smoke.runAllPacks()` → 2 checks pass + LINE API ไม่ถูกยิงจริง + สถานะ sheet กลับเหมือนเดิมหลัง smoke

**Dependencies**: Tasks 1–3

---

### Task 7 — update CLAUDE.md

**Scope**: บันทึก Phase 3 artifacts ใน section "Adding features" + "Script Properties"

**Files**: `CLAUDE.md`

**Additions**:
- Script Property ใหม่: `DEMO_ACTIVE_PACK` (managed by `App.RichMenuPack.activate`, read by `App.Config.getActivePack`)
- Endpoint ใหม่: `richmenu.pack.*` + note ว่า `activate` เรียก LINE API จริง
- Smoke: `App.Smoke.runAllPacks()` — dry-run ปลอดภัย
- Gotcha: "activate requires pack to have at least 1 rich_menu with is_default=true and line_rich_menu_id filled (published)"

**Acceptance**: `git diff CLAUDE.md` แสดงบล็อก Phase 3

**Dependencies**: Tasks 1–6

---

### Task 8 — push + smoke (manual)

**Scope**: User-driven verification

**Steps**:
1. `clasp push`
2. เปิด GAS editor → รัน `App.Smoke.runAllPacks()` → ดู log
3. (Optional, live test) — Admin UI ยังไม่มี แต่ทดสอบผ่าน frontend devtools:
   - `google.script.run.apiDispatch({ action: 'richmenu.pack.list' })` → 3 packs
   - ถ้ามี rich menu published จริง: `apiDispatch({ action: 'richmenu.pack.activate', payload: { packId: '<id>' } })` → verify LINE OA เปลี่ยน default

**Acceptance**: Smoke pass + (optional live) LINE OA default menu เปลี่ยน

**Dependencies**: Tasks 1–7

---

## Validation Plan

| Check | Method |
|---|---|
| โมดูลโหลดได้ | GAS editor function list เห็น `App.RichMenuPack.list`, `.activate`, `.create`, `.update`, `.remove` |
| List คืนครบ | `App.RichMenuPack.list()` → 3 seed rows + `menus: []` |
| Activate guards: PACK_NOT_FOUND | `activate({ packId: 'fake-uuid' })` → `{ ok: false, error: 'PACK_NOT_FOUND' }` |
| Activate guards: NO_PUBLISHED_MENU | `activate({ packId: restaurantId })` ทันทีหลัง seed → `{ ok: false, error: 'NO_PUBLISHED_MENU' }` |
| Activate สำเร็จ (smoke dry-run) | `smokePackActivateDryRun()` pass + `is_current` flip + Script Property set |
| Activate live (manual) | admin + rich menu published แล้ว → LINE OA default เปลี่ยนภายใน 5 วินาที |
| Script Property cache | `App.Config.getActivePack()` คืน `pack_key` ของ pack ที่ active ล่าสุด |
| Audit | `audit_logs` sheet มี row `richmenu.pack.activate` หลัง activate |
| Permission gate | role=viewer call `richmenu.pack.activate` → 403 |

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| LINE API rate limit ตอน demo สลับเร็วๆ หลายรอบ | LOW | Standard quota 1k/sec; demo สลับ 3–5 ครั้งไม่ถึงเพดาน |
| LINE API token หมดอายุ / invalid | MEDIUM | `App.LineApi.request_` throw — `activate` จะ throw ก่อน flip sheet; user เห็น error ใน log |
| Race: 2 admins activate คนละ pack พร้อมกัน | LOW | GAS single-threaded per execution; sheet + Script Property last-write-wins ไม่ทำให้ LINE state เน่า |
| Admin activate pack ที่ไม่มี rich_menu published → UX งง | MEDIUM | Reject message ชัด `NO_PUBLISHED_MENU` + include `hint: 'publish รัช menu ก่อนใน Rich Menu page'` |
| Orphaned rich menus ที่ LINE (create แล้วไม่ลบ) | LOW | Out of scope — `App.RichMenu.remove` จัดการอยู่; Phase 3 ไม่ create/delete |
| Script Property `DEMO_ACTIVE_PACK` ตกค้างจาก test | LOW | Smoke reset Script Property หลัง dry-run หรือปล่อย (ถ้า live test ผู้ใช้รู้) |
| `is_current` flag ถูก set พร้อมกัน > 1 pack (data corruption) | MEDIUM | `activate` ใช้ forEach update — ถ้า exec ขัด, rerun `activate` แก้ได้; พิจารณา validator ใน `list()` ว่า `is_current='true'` count <= 1 |
| User manually edit `rich_menu_packs.pack_id` ใน sheet แล้ว ghost link | LOW | documented ใน CLAUDE.md — "ห้ามแก้ schema column ด้วยมือ" |

---

## Out of Scope (ไว้ Phase ถัดไป)

- ❌ Admin UI สลับ pack (Phase 10)
- ❌ Create new rich menu ที่ LINE (มีอยู่แล้วใน `App.RichMenu.publish` — Phase 3 reuse)
- ❌ Upload rich menu image (มีอยู่แล้วใน `App.RichMenu.uploadImage`)
- ❌ Per-user rich menu override UI (schema รองรับ `linkUserRichMenu` แต่ Won't ตาม PRD)
- ❌ Pack export/import (Phase 7–9 จะ seed fixtures แบบ JSON — ไม่ต้องทำ UI สำหรับ import)
- ❌ Auto-reply routing ตาม active pack (Phase 4 — `App.Config.getActivePack()` จะถูกอ่านที่นั่น)
- ❌ Telegram notification ตอน activate (ไม่จำเป็น — audit log พอ)
