# คู่มือ Deployment ระบบ LINE OA Platform (Google Apps Script) - ภาษาไทย

> เอกสารนี้อธิบายการ Deploy แบบละเอียดสำหรับโปรเจกต์ในโฟลเดอร์นี้ โดยใช้ Google Apps Script + Google Sheets + Google Drive + LINE Messaging API + Telegram

---

## สารบัญ

1. ภาพรวมระบบและสิ่งที่ต้องรู้ก่อนเริ่ม
2. สิ่งที่ต้องเตรียม (Accounts / Tools / สิทธิ์)
3. ขั้นตอนเตรียม LINE และ Telegram
4. ขั้นตอนเตรียม Google Sheets และ Google Drive
5. ขั้นตอนเตรียม Google Apps Script Project
6. การตั้งค่า Script Properties ทั้งหมด
7. การ Push โค้ดด้วย clasp
8. การรัน Setup ฟังก์ชันครั้งแรก
9. การ Deploy เป็น Web App
10. การตั้งค่า Webhook บน LINE Developers
11. การทดสอบระบบแบบ End-to-End
12. การอัปเดตเวอร์ชันระบบในอนาคต
13. แผน Backup / Restore / Rollback
14. Security Hardening สำหรับ Production
15. Troubleshooting (ปัญหาที่พบบ่อย)
16. Go-live Checklist

---

## 1) ภาพรวมระบบและสิ่งที่ต้องรู้ก่อนเริ่ม

ระบบนี้ประกอบด้วย:
- Backend: Google Apps Script (`.gs`)
- Frontend Admin: HtmlService (`.html`) + Tailwind + Lucide
- Database: Google Sheets (หลาย sheet tabs)
- File Storage: Google Drive (สำหรับรูป/ไฟล์/rich menu)
- Integrations:
  - LINE Messaging API (webhook, send message, rich menu)
  - Telegram Bot API (แจ้งเตือนเมื่อลูกค้าขอคุยเจ้าหน้าที่)

แนวทางสิทธิ์ผู้ดูแลระบบ:
- ระบบใช้ Google account email เป็นตัวระบุตัวตน
- ใช้ allowlist จาก sheet `admin_users` + role/permission

---

## 2) สิ่งที่ต้องเตรียม (Accounts / Tools / สิทธิ์)

### 2.1 บัญชีและบริการที่ต้องมี
- Google account (แนะนำ Workspace หากใช้ทีมงาน)
- LINE Official Account
- LINE Developers Channel (Messaging API)
- Telegram Bot + Chat ID (ถ้าต้องการแจ้งเตือน)

### 2.2 Tools บนเครื่อง
1. Node.js 18+ (เครื่องนี้มี Node v24 ใช้งานได้)
2. `@google/clasp`
3. สิทธิ์เข้าถึง Google Sheets และ Google Drive ที่จะใช้

ติดตั้ง `clasp`:
```bash
npm install -g @google/clasp
```

ล็อกอิน:
```bash
clasp login
```

---

## 3) ขั้นตอนเตรียม LINE และ Telegram

## 3.1 LINE Developers
1. เข้า `https://developers.line.biz/`
2. สร้าง Provider (ถ้ายังไม่มี)
3. สร้าง Messaging API Channel
4. เก็บค่าที่ต้องใช้:
   - `Channel access token`
   - `Channel secret`
   - `LINE OA ID` (เช่น `@abc1234`)
5. เปิดใช้งาน Webhook (จะตั้ง URL หลัง deploy เสร็จ)

## 3.2 Telegram
1. คุยกับ `@BotFather`
2. สร้าง bot และรับ `TELEGRAM_BOT_TOKEN`
3. หา `TELEGRAM_CHAT_ID`
   - ส่งข้อความหา bot ก่อน
   - ใช้ API `getUpdates` หรือ bot helper เพื่อดู chat id

---

## 4) ขั้นตอนเตรียม Google Sheets และ Google Drive

## 4.1 สร้าง Spreadsheet สำหรับเป็นฐานข้อมูล
1. สร้าง Google Sheet ใหม่ 1 ไฟล์
2. จด `Spreadsheet ID` (ส่วนใน URL ระหว่าง `/d/` และ `/edit`)

ตัวอย่าง URL:
`https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxxxxxxxxx/edit`

ค่า `SPREADSHEET_ID` คือ `xxxxxxxxxxxxxxxxxxxx`

> ไม่ต้องสร้างแท็บเองทั้งหมด ระบบจะสร้างให้เมื่อรัน `setupInitialize()`

## 4.2 สร้างโฟลเดอร์ Google Drive สำหรับไฟล์ระบบ
1. สร้างโฟลเดอร์หลัก เช่น `line-oa-platform-storage`
2. จด `Folder ID` จาก URL

ตัวอย่าง URL:
`https://drive.google.com/drive/folders/yyyyyyyyyyyyyyyyyyyy`

ค่า `DRIVE_ROOT_FOLDER_ID` คือ `yyyyyyyyyyyyyyyyyyyy`

---

## 5) ขั้นตอนเตรียม Google Apps Script Project

มี 2 วิธี (เลือกวิธีเดียว):

### วิธี A: สร้างผ่าน Apps Script UI แล้วใส่ Script ID ใน `.clasp.json`
1. เข้า `https://script.google.com/`
2. New project
3. คัดลอก Script ID จาก Project Settings
4. เปิดไฟล์ `.clasp.json` ในโปรเจกต์นี้
5. ใส่ค่า `scriptId`

ตัวอย่าง:
```json
{
  "scriptId": "1AbCDefGh...",
  "rootDir": "src"
}
```

### วิธี B: สร้างผ่าน CLI
```bash
clasp create --type standalone --title "LINE OA Platform"
```
จากนั้นยืนยันว่า `.clasp.json` ชี้ `rootDir` เป็น `src`

---

## 6) การตั้งค่า Script Properties ทั้งหมด

เข้า Apps Script Editor -> Project Settings -> Script properties

### 6.1 Required (ต้องมี)
- `SPREADSHEET_ID`
- `DRIVE_ROOT_FOLDER_ID`

### 6.2 LINE (แนะนำให้มีครบ)
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `LINE_OA_ID`

### 6.3 Telegram (optional)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

### 6.4 Optional ที่มีประโยชน์
- `LINE_REQUIRE_SIGNATURE`
  - `true` = บังคับตรวจลายเซ็น webhook
  - `false` = ไม่บังคับ (ค่าเริ่มต้น)
- `DRIVE_PUBLIC_SHARING`
  - `true` = ตั้งไฟล์ที่อัปโหลดให้เปิดแบบ Anyone with link (เหมาะกับการส่ง media link ให้ LINE)
  - `false` = ไม่เปิด share อัตโนมัติ

> Production แนะนำ `LINE_REQUIRE_SIGNATURE=true`

---

## 7) การ Push โค้ดด้วย clasp

จากโฟลเดอร์โปรเจกต์:

```bash
clasp push
```

ถ้าต้องดึงไฟล์จาก GAS ลงมาก่อน:
```bash
clasp pull
```

---

## 8) การรัน Setup ฟังก์ชันครั้งแรก

เปิด Apps Script editor แล้วรันตามลำดับ:

1. `setupInitialize()`
2. (optional) `setupSeedDemoData()`

### 8.1 สิ่งที่ `setupInitialize()` จะทำ
- สร้าง sheet tabs ตาม schema ทั้งหมด
- seed roles
- seed permissions
- เพิ่ม admin owner คนแรกจากอีเมลผู้รัน
- seed system settings เริ่มต้น
- seed object templates เริ่มต้น

### 8.2 ตรวจสอบผลลัพธ์หลังรัน
ใน Spreadsheet ควรมี tabs เช่น:
- `users`
- `chat_rooms`
- `chat_messages`
- `friend_histories`
- `intents`
- `intent_keywords`
- `intent_responses`
- `response_templates`
- `rich_menus`
- `rich_menu_actions`
- `liff_forms`
- `admin_users`
- `roles`
- `permissions`
- `system_settings`
- `audit_logs`
- `job_queue`
- `metrics_daily`

---

## 9) การ Deploy เป็น Web App

ใน Apps Script editor:
1. กด `Deploy` -> `New deployment`
2. เลือกประเภท `Web app`
3. ตั้งค่า:
   - Execute as: `User deploying the app`
   - Who has access: ตามนโยบายองค์กร
4. กด Deploy
5. คัดลอก URL Web App

ตัวอย่าง:
`https://script.google.com/macros/s/AKfycbxxxxxx/exec`

### 9.1 URLs ที่ใช้ในระบบ
- หน้า dashboard: `.../exec?page=dashboard`
- หน้า live chat standalone: `.../exec?page=chat`
- webhook endpoint: `.../exec?route=webhook`

---

## 10) การตั้งค่า Webhook บน LINE Developers

1. ไปที่ LINE Developers -> Messaging API ของ channel
2. วาง Webhook URL:
   - `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?route=webhook`
3. กด Verify
4. เปิด Use webhook = Enabled

### 10.1 ถ้า Verify ไม่ผ่าน
ตรวจสอบ:
- Deploy URL ถูกต้องหรือไม่ (deployment ล่าสุด)
- Script Properties ของ LINE ถูกต้อง
- Apps Script ไม่มี error ใน Executions

---

## 11) การทดสอบระบบแบบ End-to-End

## 11.1 ทดสอบเปิดหน้า admin
1. เปิด URL `.../exec?page=dashboard`
2. ตรวจสอบว่าเห็น sidebar + dashboard cards

## 11.2 ทดสอบ Live Chat
1. คลิกเมนู `Live Chat (New Tab)`
2. หน้า chat ต้องเปิดใน tab ใหม่
3. ต้องเห็น layout 3 คอลัมน์:
   - user list
   - chat room
   - user profile
4. ทดสอบส่งข้อความ text
5. ทดสอบส่งไฟล์/รูป
6. ทดสอบ toggle `bot/manual`

## 11.3 ทดสอบ webhook รับข้อความจริง
1. ส่งข้อความจากผู้ใช้จริงใน LINE OA
2. ดูว่ามี row ใหม่ใน `chat_messages`
3. ดู `chat_rooms.unread_count` เพิ่ม
4. หากตรง keyword intent ให้ bot ตอบกลับได้

## 11.4 ทดสอบ Telegram alert
1. ส่งข้อความที่เข้ากลุ่มคำขอ human เช่น `เจ้าหน้าที่`
2. ตรวจสอบว่า:
   - room ถูกเปลี่ยนเป็น manual
   - มีแจ้งเตือนเข้า Telegram

## 11.5 ทดสอบ Rich Menu
1. สร้าง rich menu record
2. อัปโหลดรูป
3. ใส่ actions JSON
4. กด Publish
5. ตั้ง default
6. ทดสอบใน LINE OA

## 11.6 ทดสอบ Settings
1. เข้า Settings
2. กด `testConnection` เป้าหมาย `all`
3. ต้องได้ผลลัพธ์ `sheets/drive/line/telegram` ตามที่ตั้งค่า

---

## 12) การอัปเดตเวอร์ชันระบบในอนาคต

ทุกครั้งที่แก้โค้ด:
1. แก้ไฟล์ใน local
2. `clasp push`
3. Deploy version ใหม่
4. ทดสอบ smoke test อย่างน้อย:
   - เปิด dashboard
   - เปิด live chat
   - ยิง webhook test

> แนะนำทำ release log ทุกครั้งที่ deploy

---

## 13) แผน Backup / Restore / Rollback

## 13.1 Backup ที่ควรทำ
- Export Spreadsheet เป็นสำเนารายวัน
- สำรอง Drive folder รายสัปดาห์
- เก็บ `.clasp.json` และโค้ดใน Git

## 13.2 Rollback กรณี deployment มีปัญหา
1. เปิด Deployments
2. เลือก deployment เวอร์ชันก่อนหน้า
3. สลับให้ URL production ชี้เวอร์ชันที่ stable

## 13.3 Restore data
- กู้คืน spreadsheet จาก Version history หรือไฟล์สำเนา
- ตรวจสอบความสอดคล้อง `id` columns

---

## 14) Security Hardening สำหรับ Production

1. ตั้ง `LINE_REQUIRE_SIGNATURE=true`
2. จำกัดผู้ใช้ admin ผ่าน `admin_users` + role matrix
3. ห้ามใส่ token ลงใน sheet ปกติ ให้เก็บใน Script Properties
4. ตรวจสอบ `audit_logs` เป็นประจำ
5. ตั้งค่า `DRIVE_PUBLIC_SHARING` ตาม policy จริงขององค์กร
6. แยกบัญชี deploy production และ staging
7. ตั้ง retention policy ข้อมูลแชตตามข้อกฎหมาย

---

## 15) Troubleshooting (ปัญหาที่พบบ่อย)

## ปัญหา: เปิดหน้าแล้วขึ้น Unauthorized
สาเหตุ:
- email ยังไม่อยู่ใน `admin_users`
- user status เป็น inactive

วิธีแก้:
1. เพิ่มแถวใน `admin_users`
2. กำหนด role (`owner/admin/agent/viewer`)
3. ตั้ง status = `active`

## ปัญหา: webhook เข้าแต่ไม่บันทึกลง sheet
สาเหตุ:
- `SPREADSHEET_ID` ผิด
- สิทธิ์ไม่พอ
- error ใน webhook handler

วิธีแก้:
1. เช็ค Script Properties
2. เช็ค Apps Script Executions logs
3. ทดสอบ `settings.testConnection`

## ปัญหา: LINE ส่งรูป/วิดีโอไม่ขึ้น
สาเหตุ:
- URL ไฟล์ไม่ public

วิธีแก้:
1. เปิด `DRIVE_PUBLIC_SHARING=true`
2. ยืนยันว่าไฟล์เข้าถึงได้ via URL

## ปัญหา: Telegram ไม่แจ้งเตือน
สาเหตุ:
- token/chat id ผิด
- bot ยังไม่เคยคุยกับ chat เป้าหมาย

วิธีแก้:
1. ทดสอบ token ด้วย `getMe`
2. ส่งข้อความหา bot ก่อน
3. เช็ค `job_queue` และ execution logs

## ปัญหา: Rich Menu publish ไม่สำเร็จ
สาเหตุ:
- payload areas ไม่ถูกต้อง
- image type/size ไม่ตรงเงื่อนไข LINE

วิธีแก้:
1. ตรวจ actions JSON
2. ใช้ภาพตามสเปก LINE Messaging API

---

## 16) Go-live Checklist

ก่อนเปิดใช้งานจริง:
- [ ] ตั้ง Script Properties ครบทั้งหมด
- [ ] รัน `setupInitialize()` สำเร็จ
- [ ] admin_users ตั้งค่า owner/admin ครบ
- [ ] webhook verify ผ่าน และเปิดใช้งานแล้ว
- [ ] test chat send/receive ผ่าน
- [ ] test auto reply ผ่าน
- [ ] test telegram alert ผ่าน
- [ ] test rich menu publish ผ่าน
- [ ] มี backup plan และ rollback plan
- [ ] มีผู้รับผิดชอบ monitoring logs

หลัง Go-live 24 ชม. แรก:
- [ ] เฝ้าดู execution errors
- [ ] ตรวจ chat queue และ response delay
- [ ] ตรวจ quality ของ intent matching
- [ ] ตรวจ audit logs ความผิดปกติ

---

## ภาคผนวก A: คำสั่งที่ใช้บ่อย

```bash
clasp login
clasp push
clasp pull
clasp deployments
clasp open
```

---

## ภาคผนวก B: ค่าเริ่มต้นที่ระบบ seed ให้

ตัวอย่าง `system_settings` เริ่มต้น:
- `chat_poll_interval_ms=3000`
- `chat_notification_sound=true`
- `chat_notification_blink=true`
- `default_video_call_url=https://meet.google.com/new`
- `timezone=Asia/Bangkok`
- `locale=th-TH`
- `retention_days_chat=365`
- `rate_limit_per_minute=60`

---

หากต้องการเอกสารแยกเพิ่มเติมสำหรับ `Staging -> Production` pipeline, release checklist ราย sprint, หรือ SOP ทีม support สามารถต่อจากคู่มือนี้ได้ทันที
