# AGENTS.md - LINE OA Platform (Google Apps Script)

> เอกสารนี้สำหรับ AI Coding Agents ที่ต้องทำงานกับโปรเจกต์นี้ อ่านก่อนเริ่มทุกครั้ง

---

## 1) ภาพรวมโปรเจกต์

LINE OA Platform เป็นแพลตฟอร์มบริหารจัดการ LINE Official Account แบบครบวงจร พัฒนาด้วย Google Apps Script (V8) + Google Sheets + Google Drive มีฟีเจอร์หลักคือ Live Chat, Auto Reply, Rich Menu, LIFF Management และระบบสิทธิ์ผู้ใช้งาน (RBAC)

**ภาษาที่ใช้ในโปรเจกต์**: ไทย (เอกสารทั้งหมด), อังกฤษ (โค้ดและคอมเมนต์)

---

## 2) Technology Stack

| ส่วนงาน | เทคโนโลยี |
|---------|-----------|
| Backend Runtime | Google Apps Script (V8) |
| Database | Google Sheets (หลาย sheet tabs) |
| File Storage | Google Drive |
| Frontend Admin | HtmlService + Tailwind CSS v4 (Browser Build) + Lucide Icons |
| Font | Noto Sans Thai |
| LINE Integration | LINE Messaging API v2 |
| Alert Integration | Telegram Bot API (optional) |
| Deployment Tool | clasp (@google/clasp) |

---

## 3) โครงสร้างไฟล์ (File Structure)

```
line-apps-script/
├── .clasp.json              # ค่า clasp: scriptId และ rootDir
├── src/
│   ├── appsscript.json      # ค่า GAS: timezone, runtimeVersion (V8)
│   ├── Code.js              # placeholder (ไม่ใช้)
│   ├── Index.html           # หน้าแรก (shell HTML)
│   │
│   ├── server/              # Backend (.gs files)
│   │   ├── Main.gs          # Entrypoints: doGet, doPost, apiDispatch
│   │   ├── MainImpl.gs      # ตรรกะหลักของ Main
│   │   ├── Router.gs        # API routing table + dispatch
│   │   ├── Auth.gs          # Authentication + RBAC
│   │   ├── Config.gs        # อ่าน Script Properties
│   │   ├── SheetsRepo.gs    # Data layer (CRUD กับ Sheets)
│   │   ├── Utils.gs         # Utility functions
│   │   ├── Setup.gs         # Initialize system + seed data
│   │   │
│   │   ├── LineApi.gs       # LINE Messaging API wrapper
│   │   ├── DriveRepo.gs     # Google Drive operations
│   │   ├── TelegramApi.gs   # Telegram Bot API wrapper
│   │   ├── Webhook.gs       # LINE webhook handler
│   │   ├── SystemApi.gs     # System endpoints (schemas, health)
│   │   │
│   │   ├── ModuleDashboard.gs   # Dashboard module
│   │   ├── ModuleChat.gs        # Live chat module
│   │   ├── ModuleRichMenu.gs    # Rich menu management
│   │   ├── ModuleAutoReply.gs   # Auto reply / Intent system
│   │   ├── ModuleTemplates.gs   # Response templates
│   │   ├── ModuleHistories.gs   # Friend/chat histories
│   │   ├── ModuleLiff.gs        # LIFF management
│   │   └── ModuleSettings.gs    # System settings
│   │
│   └── *.html               # Frontend (HtmlService templates)
│       ├── ClientStyles.html        # Global CSS
│       ├── ClientComponents.html    # Reusable UI helpers
│       ├── ClientState.html         # State management (Store)
│       ├── ClientApi.html           # API client layer
│       ├── ClientApp.html           # App shell + router
│       ├── ClientPagesDashboard.html
│       ├── ClientPagesChat.html
│       ├── ClientPagesRichMenu.html
│       ├── ClientPagesAutoReply.html
│       ├── ClientPagesTemplates.html
│       ├── ClientPagesHistories.html
│       ├── ClientPagesLiff.html
│       └── ClientPagesSettings.html
│
└── *.md (เอกสารภาษาไทย)
    ├── README.md
    ├── ARCHITECTURE.md
    ├── DOCS_INDEX_TH.md
    ├── DEPLOYMENT_MANUAL_TH.md
    ├── DEPLOYMENT_STAGING_TH.md
    ├── OPERATIONS_SOP_TH.md
    ├── SECURITY_BASELINE_TH.md
    └── ... (อื่นๆ)
```

---

## 4) Architecture Overview

### 4.1 Backend Architecture

**Entry Points** (ใน `Main.gs`):
- `doGet(e)` - แสดงหน้าเว็บ (HtmlService)
- `doPost(e)` - รับ webhook และ API calls
- `apiDispatch(request)` - เรียกผ่าน `google.script.run`
- `setupInitialize()` - รันครั้งแรกเพื่อ setup ระบบ
- `setupSeedDemoData()` - สร้าง demo data

**Request Flow**:
```
doPost/doGet → MainImpl → Auth → Router → Module → SheetsRepo → Google Sheets
                                    ↓
                              LineApi/DriveRepo/TelegramApi
```

**Namespace Pattern**: ทุกไฟล์ใช้ pattern `var App = App || {}; App.ModuleName = (function() { ... })();`

### 4.2 Frontend Architecture

**รูปแบบ**: Vanilla JavaScript + ระบบ State Management แบบง่าย (Store pattern)

**File Loading Order** (ใน `Index.html`):
1. Tailwind CSS (CDN) + Lucide Icons (CDN)
2. ClientStyles (global CSS)
3. ClientApi (API layer)
4. ClientState (State management)
5. ClientComponents (UI helpers)
6. ClientPages* (Page modules)
7. ClientApp (App shell - โหลดสุดท้าย)

**Communication**:
- ใช้ `google.script.run` สำหรับเรียก server functions
- ใช้ `fetch` เป็น fallback (สำหรับ standalone mode)

---

## 5) Database Schema (Google Sheets)

 Sheets ที่ใช้เก็บข้อมูล (ดูเต็มใน `SheetsRepo.gs`):

| Sheet Name | หน้าที่ |
|------------|---------|
| `users` | ข้อมูลผู้ใช้ LINE |
| `chat_rooms` | ห้องแชตของแต่ละ user |
| `chat_messages` | ข้อความแชต |
| `friend_histories` | ประวัติ follow/unfollow |
| `intents` | Intent สำหรับ auto reply |
| `intent_keywords` | คำสำคัญของแต่ละ intent |
| `intent_responses` | คำตอบของแต่ละ intent |
| `response_templates` | เทมเพลตข้อความ |
| `rich_menus` | Rich menu definitions |
| `rich_menu_actions` | Actions ใน rich menu |
| `liff_forms` | LIFF form definitions |
| `admin_users` | ผู้ดูแลระบบ + roles |
| `roles` | Role definitions |
| `permissions` | Permission mappings |
| `system_settings` | การตั้งค่าระบบ |
| `audit_logs` | บันทึกการกระทำ |
| `job_queue` | คิวงาน async |
| `metrics_daily` | Metrics รายวัน |

**Data Access Pattern**: ใช้ `SheetsRepo` module เป็นตัวกลางทุกการเข้าถึง

---

## 6) Configuration (Script Properties)

ต้องตั้งค่าใน Google Apps Script Project → Project Settings → Script Properties:

**Required**:
- `SPREADSHEET_ID` - ID ของ Google Sheets ที่ใช้เป็นฐานข้อมูล
- `DRIVE_ROOT_FOLDER_ID` - ID ของ Drive folder สำหรับเก็บไฟล์

**LINE Integration**:
- `LINE_CHANNEL_ACCESS_TOKEN` - LINE channel access token
- `LINE_CHANNEL_SECRET` - LINE channel secret
- `LINE_OA_ID` - LINE OA ID (เช่น `@abc1234`)
- `LINE_REQUIRE_SIGNATURE` - บังคับตรวจ signature (ควรเป็น `true` ใน production)

**Telegram Alerts (Optional)**:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

---

## 7) Build & Deployment

### 7.1 Tools Required
```bash
npm install -g @google/clasp
clasp login
```

### 7.2 การ Deploy
```bash
# Push code ไปยัง GAS
clasp push

# หรือดูแบบ watch mode
clasp push --watch
```

### 7.3 Initial Setup Steps
1. สร้าง GAS project ใหม่ หรือ clone จากที่มี
2. อัปเดต `scriptId` ใน `.clasp.json`
3. Push code: `clasp push`
4. ตั้งค่า Script Properties ทั้งหมด (ดู Section 6)
5. รัน `setupInitialize()` จาก Apps Script editor
6. Deploy เป็น Web App:
   - Deploy → New deployment → Web App
   - Execute as: Me
   - Who has access: Anyone
7. Copy URL ไปตั้งค่า Webhook ใน LINE Developers Console
8. Webhook URL ต้องลงท้ายด้วย: `?route=webhook`

---

## 8) Code Style Guidelines

### 8.1 Naming Conventions
- **Files**: PascalCase (เช่น `ModuleChat.gs`, `ClientApi.html`)
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Modules**: App.ModuleName (PascalCase)

### 8.2 Code Patterns

**Module Pattern** (ทุกไฟล์ .gs):
```javascript
var App = App || {};

App.ModuleName = (function () {
  // Private functions (ชื่อลงท้ายด้วย _)
  function privateHelper_() { }
  
  // Public API
  function publicFunction() { }
  
  return {
    publicFunction: publicFunction
  };
})();
```

**Error Handling**:
- ใช้ `throw new Error('message')` สำหรับ error ที่ต้องการแจ้งผู้ใช้
- ใช้ `try-catch` ใน API calls ภายนอก

**Type Safety**:
- แปลงค่าด้วย `String()`, `Number()`, `App.Utils.toBool()`
- ใช้ `App.Utils.parseJson()` แทน `JSON.parse()` ตรงๆ

### 8.3 Frontend Patterns

**State Update**:
```javascript
// แบบ update ทั้ง object
Store.set({ loading: true });

// แบบ update nested path
Store.update('chat.selectedUser', user);
```

**API Call**:
```javascript
Api.request('action.name', payload)
  .then(data => { /* success */ })
  .catch(err => { /* error */ });
```

---

## 9) Security Considerations

### 9.1 Authentication & Authorization
- ใช้ Google Account authentication (ผ่าน `Session.getActiveUser()`)
- Allowlist ผู้ใช้ใน `admin_users` sheet
- RBAC ด้วย roles: `owner`, `admin`, `agent`, `viewer`
- Permissions เก็บใน `permissions` sheet

### 9.2 Secrets Management
- เก็บ token/secret ใน Script Properties เท่านั้น
- ห้าม hardcode secret ใน source code
- ห้าม log secret ลง console หรือ sheet
- ใช้ `App.Utils.maskSecret()` ถ้าต้องแสดง

### 9.3 Webhook Security
- เปิด `LINE_REQUIRE_SIGNATURE=true` ใน production
- ตรวจสอบ `x-line-signature` ในทุก request
- ใช้ `App.Utils.hmacSha256Base64()` สำหรับ verify

### 9.4 Input Validation
- ใช้ `App.Utils.sanitizeText()` ก่อนแสดงผล
- Validate payload ก่อน save ลง database
- จำกัดขนาด file upload

---

## 10) Testing Strategy

**ข้อจำกัด**: Google Apps Script ไม่มี automated testing framework ที่สมบูรณ์

### 10.1 Manual Testing
- ใช้ `setupSeedDemoData()` เพื่อสร้าง test data
- ทดสอบผ่านหน้าเว็บจริง
- ทดสอบ webhook ด้วย LINE Developers Console (Verify button)

### 10.2 Test Points สำคัญ
- API endpoints ทุกตัวใน `Router.gs`
- Webhook events: follow, unfollow, message, postback
- File upload (Drive integration)
- LINE API calls (rich menu, push message)

---

## 11) Common Tasks

### 11.1 เพิ่ม API Endpoint ใหม่
1. เพิ่ม handler function ใน `Module*.gs` ที่เหมาะสม
2. เพิ่ม route ใน `Router.gs` MAP
3. กำหนด permission ที่เหมาะสม
4. Audit log จะถูกบันทึกอัตโนมัติ

### 11.2 เพิ่ม Database Table ใหม่
1. เพิ่ม schema ใน `SheetsRepo.gs` → `SCHEMAS`
2. รัน `setupInitialize()` เพื่อสร้าง sheet

### 11.3 เพิ่มหน้า Frontend ใหม่
1. สร้าง `ClientPagesNewPage.html`
2. เพิ่มใน `Index.html` include list
3. เพิ่ม nav item ใน `ClientApp.html` → `navItems`
4. เพิ่ม route handling ใน `normalizePage_`

---

## 12) Documentation

เอกสารทั้งหมดอยู่ใน root directory (ภาษาไทย):

| เอกสาร | ใช้เมื่อไร |
|--------|-----------|
| `README.md` | เริ่มต้นใช้งาน |
| `ARCHITECTURE.md` | ดูโครงสร้างระบบ |
| `DEPLOYMENT_MANUAL_TH.md` | Deploy ครั้งแรก |
| `DEPLOYMENT_STAGING_TH.md` | Staging → Production |
| `SECURITY_BASELINE_TH.md` | Security review |
| `OPERATIONS_SOP_TH.md` | งานประจำวัน |
| `RUNBOOK_INCIDENT_TH.md` | แก้ไขปัญหา |

---

## 13) Important Notes

1. **Timezone**: ระบบใช้ `Asia/Bangkok` (ตั้งค่าใน `appsscript.json`)

2. **Standalone Chat Mode**: เปิดหน้า Chat แยก tab ได้โดยเพิ่ม `?page=chat` ใน URL

3. **Rate Limiting**: ตั้งค่า `rate_limit_per_minute` ใน `system_settings`

4. **Data Retention**: ตั้งค่า `retention_days_chat` สำหรับลบข้อความเก่า

5. **Polling**: Live Chat ใช้ polling ตามค่า `chat_poll_interval_ms` (default 3000ms)

6. **Audit Trail**: ทุก API action จะถูกบันทึกใน `audit_logs` sheet อัตโนมัติ

---

## 14) Troubleshooting

| ปัญหา | สาเหตุที่เป็นไปได้ | วิธีแก้ |
|-------|-------------------|---------|
| เปิดหน้าเว็บแล้วขาว | Permission denied / ไม่มีใน admin_users | เพิ่ม email ใน `admin_users` sheet |
| Webhook ไม่ทำงาน | URL ผิด / signature ไม่ตรง | ตรวจสอบ URL ลงท้าย `?route=webhook` และ `LINE_CHANNEL_SECRET` |
| ส่งข้อความไม่ได้ | Token หมดอายุ / ผิด | ตรวจสอบ `LINE_CHANNEL_ACCESS_TOKEN` |
| Sheet ไม่พบ | `SPREADSHEET_ID` ผิด | ตรวจสอบ Script Properties |

---

สิ้นสุดเอกสาร AGENTS.md
