# Plan: Object Templates + Placeholder Renderer (Phase 2)

## Summary

สร้าง primitive กลางสำหรับ reply ทั้งระบบ — โมดูล `App.ObjectTemplates` (CRUD ต่อชีท `object_templates`), `App.Variables` (CRUD ต่อชีท `template_variables`), และ `App.Render.resolve(template, ctx)` ที่ deep-traverse JSON payload แทนค่า placeholder `{{scope.name}}` 4 ระดับ (`user.*`, `sys.*`, `ctx.*`, `var.*`) — พร้อม router entries + smoke test functions ที่รันจาก GAS editor เพื่อยืนยันว่า text/flex/image resolve ถูกต้อง โดยไม่แตะ `App.Templates` เดิม (ที่ยังใช้ `response_templates` สำหรับ auto-reply เก่า) และเว้น UI ไปจนถึง Phase 10

## User Story

As **Topp (developer ที่จะสร้าง Phase 4 Auto-Reply v2)**, I want **โมดูล `App.ObjectTemplates` + `App.Render` พร้อม dispatch ได้ทาง router**, so that **Phase 4 เรียก `App.Render.resolve(templateRow.payload, ctx)` ได้ทันทีโดยไม่ต้องกลับมาเขียน CRUD / substitution logic**

## Problem → Solution

**Current**: Phase 1 สร้าง schema `object_templates` + `template_variables` ไว้แล้วใน `SheetsRepo.SCHEMAS` แต่**ยังไม่มี handler module** อ่าน/เขียน — router ไม่มี entry, auto-reply เก่ายัง hardcode text ตรง `response_templates.payload_json` ไม่มี placeholder substitution

**Desired**: เพิ่ม 3 โมดูล:
1. `App.ObjectTemplates` — CRUD + `getByVariableKey(key)` lookup (อ้างอิงจาก `variable_key` slug เช่น `greeting_flex`)
2. `App.Variables` — CRUD รูปเดียวกัน ต่อ `template_variables` (custom vars ที่แอดมินกรอก เช่น `shopName`)
3. `App.Render.resolve(template, ctx)` — pure function, deep traverse `payload_json`, substitute `{{scope.name}}`, recursion depth cap = 3

Router gains 10 entries ใหม่ (5 ต่อโมดูล). Phase 4 pipe = `getByVariableKey(ref) → resolve(row.payload, ctx) → LINE API push`

## Metadata

- **Complexity**: Medium
- **Source PRD**: `.claude/PRPs/prds/line-oa-demo-platform.prd.md`
- **PRD Phase**: Phase 2 — Object Templates + Placeholder Renderer
- **Estimated Files**: 4 new (`ModuleObjectTemplates.gs`, `ModuleVariables.gs`, `Render.gs`, `ModuleSmoke.gs`) + 1 modified (`Router.gs`)
- **Estimated Lines**: ~350–450

---

## UX Design

**Internal change — no user-facing UX in this phase.**

Validation flow:
1. แอดมินเปิด GAS editor → รัน `App.ObjectTemplates.list({})` → คืน `{ rows: [] }`
2. รัน `smokeRenderText()` / `smokeRenderFlex()` / `smokeRenderImage()` ใน `ModuleSmoke.gs` → log ผลลัพธ์ + pass/fail
3. Frontend call `apiDispatch({ action: 'templates.object.list' })` → รับ list (empty ok)

UI สำหรับสร้าง/แก้ template จะทำใน Phase 10 (Admin UI Polish)

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 (critical) | `src/server/SheetsRepo.gs` | 1–25 (SCHEMAS) | ยืนยัน column order ของ `object_templates`, `template_variables` |
| P0 (critical) | `src/server/SheetsRepo.gs` | 26–239 (helpers) | `findAll`, `findOne`, `insert`, `update`, `remove`, `appendAudit` signatures |
| P0 (critical) | `src/server/ModuleTemplates.gs` | ทั้งไฟล์ (91 lines) | **Reference module** — CRUD pattern, `normalize_`, audit calls, return shapes |
| P0 (critical) | `src/server/Router.gs` | 1–90 (MAP + dispatch) | ต้องเพิ่ม entries สำหรับ `templates.object.*` และ `templates.variables.*` |
| P1 (important) | `src/server/Utils.gs` | ทั้งไฟล์ | `uuid`, `nowIso`, `stringify`, `parseJson` |
| P1 (important) | `src/server/Auth.gs` | 55–70 | permission resolution — `templates.object.manage` / `templates.variables.manage` seed ไว้แล้ว |
| P1 (important) | `src/server/Setup.gs` | DEFAULT_PERMISSIONS | ยืนยัน permission keys ครบ |
| P2 (reference) | `CLAUDE.md` | "Adding features" | New API endpoint checklist |
| P2 (reference) | `AGENTS.md` | Section 5 | Sheet schema reference |
| P2 (reference) | `.claude/PRPs/prds/line-oa-demo-platform.prd.md` | lines 140–210 | Technical Direction + Phase 2 details |

## External Documentation

No external research needed — ใช้ patterns ภายใน codebase ล้วน

---

## Patterns to Mirror

Code patterns ที่พบใน codebase — ตามให้เหมือน

### NAMESPACE_IIFE
```javascript
// SOURCE: src/server/ModuleTemplates.gs:1-91 (ทุก Module*.gs ใช้ pattern เดียวกัน)
var App = App || {};
App.ObjectTemplates = (function () {
  function list(payload) { /* ... */ }
  function privateHelper_() { /* trailing _ = private */ }
  return {
    list: list
  };
})();
```

### CRUD_HANDLER_SHAPE
```javascript
// SOURCE: src/server/ModuleTemplates.gs:4-48
function list(payload) {
  var rows = App.SheetsRepo.findAll('sheet_name', payload || {});
  return { rows: rows.map(normalize_) };
}

function create(payload, ctx) {
  var row = App.SheetsRepo.insert('sheet_name', {
    id: App.Utils.uuid(),
    // ...fields
    created_at: App.Utils.nowIso(),
    updated_at: App.Utils.nowIso()
  });
  App.SheetsRepo.appendAudit(ctx.email, 'action.key', 'sheet_name', row.id, row);
  return { row: normalize_(row) };
}
```

**Critical**: ทุก `create/update/remove` ต้องเรียก `App.SheetsRepo.appendAudit(ctx.email, actionKey, sheetName, rowId, deltaOrRow)` — router มี auto-audit แต่ตัว handler ก็มีอีกชั้นตามแบบ `ModuleTemplates`

### ROUTER_MAP_ENTRY
```javascript
// SOURCE: src/server/Router.gs:30-34 (MAP block)
'templates.object.list':   { permission: 'templates.object.manage', handlerPath: 'ObjectTemplates.list' },
'templates.object.get':    { permission: 'templates.object.manage', handlerPath: 'ObjectTemplates.get' },
'templates.object.create': { permission: 'templates.object.manage', handlerPath: 'ObjectTemplates.create' },
'templates.object.update': { permission: 'templates.object.manage', handlerPath: 'ObjectTemplates.update' },
'templates.object.remove': { permission: 'templates.object.manage', handlerPath: 'ObjectTemplates.remove' },
```

### PLACEHOLDER_REGEX
```javascript
// Handlebars-style, 2 braces, scoped
var PLACEHOLDER_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\.([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;
// Capture group 1 = scope, group 2 = name
// Reject nested braces / other syntax — keep it simple
```

### DEEP_TRAVERSE
```javascript
// Recursively walk any JSON shape — object, array, string, primitive
function walk_(node, depth, ctx) {
  if (depth > MAX_DEPTH) return node;      // guard against cycle
  if (typeof node === 'string') return substituteString_(node, ctx);
  if (Array.isArray(node)) return node.map(function (el) { return walk_(el, depth + 1, ctx); });
  if (node && typeof node === 'object') {
    var out = {};
    Object.keys(node).forEach(function (k) { out[k] = walk_(node[k], depth + 1, ctx); });
    return out;
  }
  return node;  // numbers, booleans, null — passthrough
}
```

### IMMUTABLE_RETURN
```javascript
// SOURCE: common/coding-style.md — NEVER mutate ctx or template
// walk_ creates new objects/arrays, never mutates source
```

### NORMALIZE_ROW
```javascript
// SOURCE: src/server/ModuleTemplates.gs:70-82
function normalize_(row) {
  return {
    id: row.id,
    variableKey: row.variable_key,
    name: row.name,
    messageType: row.message_type,
    payload: App.Utils.parseJson(row.payload_json) || {},
    description: row.description,
    isSystem: row.is_system === 'true',
    isActive: row.is_active === 'true',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
```

**Note**: snake_case ในชีท → camelCase ใน API response (pattern เดิม)

---

## Tasks

### Task 1 — สร้าง `App.ObjectTemplates` module

**Scope**: CRUD ครบ 5 ฟังก์ชัน + normalize_

**Files**:
- สร้างใหม่ `src/server/ModuleObjectTemplates.gs` (~110 lines)

**Functions**:
- `list(payload)` — filter ได้ด้วย `isActive`, `messageType`
- `get(payload)` — ดึงด้วย `id`
- `getByVariableKey(payload)` — ดึงด้วย `variable_key` (unique index ควรบังคับในโค้ด — ถ้าเจอ > 1 log warning)
- `create(payload, ctx)` — validate `variable_key` ไม่ซ้ำ + `payload_json` parse ได้ + `message_type` อยู่ใน `['text', 'flex', 'image', 'imagemap']`
- `update(payload, ctx)` — protect `is_system='true'` rows (ห้ามแก้ — return error ชัด)
- `remove(payload, ctx)` — protect `is_system='true'` rows

**Acceptance**: รัน `App.ObjectTemplates.create({ variableKey: 'test_greet', name: 'Test', messageType: 'text', payload: { type: 'text', text: 'Hi' } }, { email: 'you@you' })` → ได้ row กลับ + row อยู่ในชีทจริง + audit_logs มี entry `templates.object.create`

**Dependencies**: None (Phase 1 schema + permissions พร้อมแล้ว)

---

### Task 2 — สร้าง `App.Variables` module

**Scope**: CRUD 5 ฟังก์ชันต่อ `template_variables` + normalize_

**Files**:
- สร้างใหม่ `src/server/ModuleVariables.gs` (~90 lines)

**Functions**: `list`, `get`, `getByVarKey`, `create`, `update`, `remove` — รูปเดียวกับ Task 1 แต่ field คือ `var_key`, `var_name`, `var_value`

**Acceptance**: สร้าง `{ varKey: 'shopName', varName: 'ชื่อร้าน', varValue: 'ร้านเดโม' }` → read ผ่าน `getByVarKey('shopName')` ได้ → `normalize_` คืน `{ varKey, varName, varValue, ... }`

**Dependencies**: None

---

### Task 3 — สร้าง `App.Render` module (แกนหลัก)

**Scope**: Pure function `resolve(template, ctx)` ที่ deep-traverse

**Files**:
- สร้างใหม่ `src/server/Render.gs` (~80 lines)

**Signature**:
```javascript
App.Render.resolve(template, ctx)
// template: object | array | string — LINE message shape
// ctx: { user?: { displayName, pictureUrl, ... }, sys?: { date, time, shopName }, ctx?: {...}, cache?: <internal> }
// returns: cloned structure with substitutions, OR original if no matches
```

**Behavior**:
1. If `template` is string → substitute with regex, resolve ทุก match
2. If array → map recursively
3. If object → map values recursively
4. Recursion depth cap = 3 (จาก PRD) — return original node เกินเพดาน

**Scope resolution**:
| Scope | Lookup |
|---|---|
| `user.*` | `ctx.user[name]` → string หรือ fallback `''` ถ้า missing |
| `sys.*` | built-in `date`/`time` คำนวณจาก `App.Utils.nowIso()` + Bangkok TZ; อื่นๆ (`shopName`) อ่านจาก `system_settings` ผ่าน `App.SheetsRepo.findOne('system_settings', 'setting_key', name)?.setting_value` (cache ใน `ctx.cache.sys` เพื่อกัน Sheet read ซ้ำ) |
| `ctx.*` | `ctx.ctx?.[name]` → string |
| `var.*` | `App.Variables.getByVarKey({ varKey: name })` → row.varValue; cache ใน `ctx.cache.var` |

**Missing key policy**:
- Default = silent fallback (แทนด้วย `''`) — ไม่ throw, ไม่ log — กันไม่ให้ reply ล้มตอน demo
- ถ้าต้องการ debug, เพิ่ม optional flag `ctx.strict=true` → throw Error พร้อมชื่อ placeholder ที่ resolve ไม่ได้

**Acceptance**:
- `resolve('Hi {{user.displayName}}', { user: { displayName: 'Topp' } })` === `'Hi Topp'`
- `resolve({ type: 'text', text: '{{user.displayName}} ดูโปร {{var.promoCode}}' }, ctx)` → object ใหม่มีค่าแทน
- Flex bubble nested 3 ชั้น — เฉพาะ `text` fields ถูกแทน, `type`/`weight`/`color` ไม่แตะ
- `resolve('{{nonexistent.key}}')` → `''` (silent)
- Cycle guard: ถ้า sub ค่าที่คืนกลับมาเป็น `{{...}}` อีก, resolve รอบถัดไปถึง depth 3 แล้วหยุด

**Dependencies**: Task 2 (ต้องใช้ `App.Variables.getByVarKey` สำหรับ `var.*`)

---

### Task 4 — เพิ่ม router entries

**Scope**: 10 entries ใน `src/server/Router.gs` MAP

**Files**:
- แก้ `src/server/Router.gs` — เพิ่มบล็อก (ต่อท้าย section `templates.*`)

```javascript
// Object Templates (Phase 2)
'templates.object.list':    { permission: 'templates.object.manage', handlerPath: 'ObjectTemplates.list' },
'templates.object.get':     { permission: 'templates.object.manage', handlerPath: 'ObjectTemplates.get' },
'templates.object.create':  { permission: 'templates.object.manage', handlerPath: 'ObjectTemplates.create' },
'templates.object.update':  { permission: 'templates.object.manage', handlerPath: 'ObjectTemplates.update' },
'templates.object.remove':  { permission: 'templates.object.manage', handlerPath: 'ObjectTemplates.remove' },

// Template Variables (Phase 2)
'templates.variables.list':   { permission: 'templates.variables.manage', handlerPath: 'Variables.list' },
'templates.variables.get':    { permission: 'templates.variables.manage', handlerPath: 'Variables.get' },
'templates.variables.create': { permission: 'templates.variables.manage', handlerPath: 'Variables.create' },
'templates.variables.update': { permission: 'templates.variables.manage', handlerPath: 'Variables.update' },
'templates.variables.remove': { permission: 'templates.variables.manage', handlerPath: 'Variables.remove' },
```

**Acceptance**: frontend `apiDispatch({ action: 'templates.object.list' })` → ไม่ได้รับ 403/404 + ได้ `{ rows: [] }` ถ้ายังไม่ seed

**Dependencies**: Tasks 1, 2

---

### Task 5 — สร้าง `ModuleSmoke.gs` test functions

**Scope**: 3 functions รันจาก GAS editor เพื่อ validate render pipeline

**Files**:
- สร้างใหม่ `src/server/ModuleSmoke.gs` (~70 lines)

**Functions**:
- `smokeRenderText()` — resolve text เดี่ยว + log pass/fail
- `smokeRenderFlex()` — resolve flex bubble 3 ชั้น (header + body + footer) มี `{{user.displayName}}` ใน body.contents[0].text + `{{var.promoCode}}` ใน footer button
- `smokeRenderImage()` — resolve image message ที่มี `{{sys.shopName}}` ใน alt text

**Return shape**:
```javascript
{ name: 'smokeRenderFlex', passed: true, details: {...}, durationMs: 42 }
```

Log ผ่าน `console.log()` (GAS editor เห็น) + return ให้ orchestrator เรียกต่อได้

**ผนวก orchestrator**: `App.Smoke.runAll()` → รัน 3 smoke + รายงาน

**Acceptance**: เปิด GAS editor → เลือก function `App.Smoke.runAll` → รัน → ดู log ว่า `passed: true` ทั้ง 3 ข้อ

**Dependencies**: Tasks 1, 2, 3

---

### Task 6 — seed built-in object templates (optional, 2 ตัวอย่าง)

**Scope**: ใส่ seed ใน `Setup.gs` ตามแบบ `DEFAULT_RICH_MENU_PACKS` — 2 templates สำหรับ Phase 4/5 ใช้

**Files**: `src/server/Setup.gs`

**Seed data**:
```javascript
DEFAULT_OBJECT_TEMPLATES = [
  {
    variable_key: 'greeting_text',
    name: 'ทักทายเริ่มต้น',
    message_type: 'text',
    payload_json: '{"type":"text","text":"สวัสดี {{user.displayName}} ยินดีต้อนรับสู่ {{sys.shopName}}"}',
    description: 'ข้อความทักทายเมื่อลูกค้ากดติดตาม',
    is_system: 'true',
    is_active: 'true'
  },
  {
    variable_key: 'escalation_ack',
    name: 'รับเรื่องคุยกับคน',
    message_type: 'text',
    payload_json: '{"type":"text","text":"รอสักครู่นะคะ แอดมินกำลังจะมาคุยกับคุณ {{user.displayName}} ค่ะ"}',
    description: 'ตอบรับเมื่อ user กด "คุยกับคน"',
    is_system: 'true',
    is_active: 'true'
  }
]
```

+ `seedObjectTemplates_()` function called from `initialize()` — idempotent ผ่าน `findOne('object_templates', 'variable_key', row.variable_key)`

**Acceptance**: รัน `setupInitialize()` อีกครั้ง → ชีท `object_templates` มี 2 rows — รันซ้ำ → ยังคง 2 rows

**Dependencies**: Task 1 (ชีทต้อง accessible ผ่าน App.ObjectTemplates แต่ seed ใช้ SheetsRepo ตรงๆ ตาม pattern เดิม)

---

### Task 7 — update CLAUDE.md

**Scope**: บันทึก Phase 2 artifacts ใน section "Adding features"

**Files**: `CLAUDE.md`

**Additions**:
- Note ว่า `App.Templates` (เดิม) ยังใช้ `response_templates` — Phase 2 เพิ่ม `App.ObjectTemplates` ใหม่บน `object_templates`
- Placeholder syntax + 4 scope documented
- Smoke test: "run `App.Smoke.runAll()` from GAS editor after Phase 2 push"
- อ้างอิง plan file

**Acceptance**: `git diff CLAUDE.md` แสดงบล็อกใหม่ระบุ Phase 2 modules

**Dependencies**: Tasks 1–5 สำเร็จ

---

### Task 8 — push + smoke test (manual)

**Scope**: User รันใน environment จริง

**Steps**:
1. `clasp push`
2. เปิด GAS editor → รัน `setupInitialize()` (เพื่อ seed Task 6)
3. รัน `App.Smoke.runAll()` → ดู log
4. ยืนยัน sheet `object_templates` มี 2 rows seed

**Acceptance**: 3 smoke pass + 2 rows seeded + no errors in executions log

**Dependencies**: Tasks 1–7

---

## Validation Plan

GAS ไม่มี test runner — validate ผ่าน:

| Check | Method |
|---|---|
| โมดูลโหลดได้ | เปิด GAS editor → function list เห็น `App.ObjectTemplates.list`, `App.Variables.list`, `App.Render.resolve`, `App.Smoke.runAll` |
| CRUD ทำงาน | `smokeRenderText` สร้าง+ลบ template จริง + assert row hit/miss |
| Render ถูกต้อง | 3 smoke functions comparing expected vs actual JSON (deep equality via `JSON.stringify` compare) |
| Router ไม่ 404 | frontend call `apiDispatch({ action: 'templates.object.list' })` ใน devtools — verify ไม่มี error |
| Permission gate | login ด้วย account role `viewer` → call `templates.object.create` → expect 403 |
| Idempotent seed | รัน `setupInitialize()` 2 รอบ → row count คงที่ (2) |

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| `{{sys.shopName}}` อ่านจาก `system_settings` แต่ key ไม่มี → render เป็น `''` เงียบๆ | MEDIUM | Task 6 seed `system_settings.setting_key='shopName'` ถ้ายังไม่มี + mention ใน CLAUDE.md |
| Recursion depth ตื้นเกินไป (3) สำหรับ flex ใหม่ของ LINE | LOW | Flex มี max depth ~5 (bubble > body > box > box > text) — เพิ่ม MAX_DEPTH = 6 ถ้าทดสอบแล้วเจอตัดเกิน |
| Placeholder ใน non-text field (e.g. `color: "{{var.brandColor}}"`) | LOW | `walk_` traverse ทุก string field โดยไม่สนว่าเป็น text หรือ color — ใช้งานได้ทันที |
| Performance: resolve ทุกครั้งอ่าน sheet ซ้ำ (sys + var) | MEDIUM | In-memory cache ใน `ctx.cache.sys` / `ctx.cache.var` per-request; reset ทุก call |
| Conflict ระหว่าง `App.Templates` เดิม กับ `App.ObjectTemplates` ใหม่ | LOW | คนละชีท คนละ namespace คนละ permission key — ไม่ทับกัน; documented ใน CLAUDE.md |
| `var_key`/`variable_key` uniqueness ไม่มี DB constraint | MEDIUM | บังคับใน `create`/`update` handler: ถ้า `findOne` เจอแล้ว throw Error ชัดเจน |

---

## Out of Scope (ไว้ Phase ถัดไป)

- ❌ Admin UI สำหรับสร้าง/แก้ template (Phase 10)
- ❌ Placeholder dropdown picker ใน editor (Phase 10)
- ❌ Placeholder chip picker ใน rich editor (Won't ตาม PRD)
- ❌ Integration กับ auto-reply (Phase 4 — `ModuleAutoReply` rewrite)
- ❌ Integration กับ webhook escalation (Phase 5)
- ❌ Template versioning / rollback
- ❌ Template preview endpoint (Phase 10 UI + preview ทำ client-side ได้)
- ❌ Migration ของ `response_templates` เดิมมายัง `object_templates` (ปล่อยทั้งสองอยู่ร่วมกัน — auto-reply เก่ายังใช้ได้จนกว่า Phase 4 จะ rewrite)
