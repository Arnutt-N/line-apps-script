# คู่มือ Deployment แบบ Staging -> Production (ภาษาไทย)

เอกสารนี้ต่อยอดจาก `DEPLOYMENT_MANUAL_TH.md` โดยเน้นการทำงานแบบ 2 environment เพื่อความปลอดภัยในการปล่อยงานจริง

---

## 1) เป้าหมาย

- ลดความเสี่ยงการพังใน Production
- บังคับให้ทุก release ผ่าน Staging ก่อน
- ทำให้ rollback ได้เร็วเมื่อเกิดปัญหา

---

## 2) โครงสร้าง Environment ที่แนะนำ

## 2.1 แยกทรัพยากรคนละชุด

แนะนำให้มีทรัพยากรแยก 100% ระหว่าง `staging` และ `production`:
- Apps Script Project: 2 โปรเจกต์
- Spreadsheet: 2 ไฟล์
- Drive Root Folder: 2 โฟลเดอร์
- LINE Channel: 2 channel (ดีที่สุด) หรือ 1 channel + ปิด webhook สลับช่วงทดสอบ
- Telegram: 2 chat id (ops-stg, ops-prod)

## 2.2 ตารางตัวแปรแยก env

| Key | staging | production |
|---|---|---|
| `SPREADSHEET_ID` | stg sheet id | prod sheet id |
| `DRIVE_ROOT_FOLDER_ID` | stg folder id | prod folder id |
| `LINE_CHANNEL_ACCESS_TOKEN` | stg token | prod token |
| `LINE_CHANNEL_SECRET` | stg secret | prod secret |
| `LINE_OA_ID` | stg oa | prod oa |
| `TELEGRAM_BOT_TOKEN` | stg bot token | prod bot token |
| `TELEGRAM_CHAT_ID` | stg chat | prod chat |
| `LINE_REQUIRE_SIGNATURE` | true | true |
| `DRIVE_PUBLIC_SHARING` | true/false ตามนโยบาย | true/false ตามนโยบาย |

---

## 3) โครงสร้างโค้ดและ release policy

## 3.1 Branch policy (แนะนำ)
- `main`: production-ready only
- `develop`: integration branch
- `feature/*`: งานย่อย
- `hotfix/*`: แก้ด่วน production

## 3.2 กฎก่อน merge เข้า `main`
- ผ่าน smoke test บน staging
- ไม่มี error สำคัญใน Apps Script execution logs
- webhook test ผ่าน
- chat send/receive ผ่าน
- settings testConnection ผ่าน

---

## 4) Step-by-step: ตั้งค่า Staging ครั้งแรก

1. สร้าง Apps Script project สำหรับ staging
2. ตั้ง `.clasp.staging.json` (หรือสลับ `.clasp.json`) ให้ชี้ scriptId ของ staging
3. ตั้ง Script Properties ฝั่ง staging ทั้งหมด
4. `clasp push`
5. รัน `setupInitialize()`
6. (optional) รัน `setupSeedDemoData()`
7. Deploy Web App -> เก็บ Staging URL
8. ตั้ง LINE webhook ของ channel staging ไปที่ `...?route=webhook`
9. ทดสอบ end-to-end ตาม checklist

---

## 5) Step-by-step: ตั้งค่า Production ครั้งแรก

1. สร้าง Apps Script project สำหรับ production
2. เปลี่ยน scriptId ไปของ production
3. ตั้ง Script Properties ฝั่ง production
4. `clasp push`
5. รัน `setupInitialize()`
6. ตรวจ owner/admin ใน `admin_users`
7. Deploy Web App -> เก็บ Production URL
8. ตั้ง LINE webhook production
9. ทดสอบ smoke test production แบบจำกัด scope

---

## 6) ขั้นตอน Promotion (Staging -> Production)

ใช้ทุกครั้งก่อนปล่อยจริง:

1. Freeze `develop` และ cut release commit
2. Push โค้ด release เข้า staging ก่อน
3. Deploy staging และรัน test suite + smoke test
4. UAT โดยทีมที่เกี่ยวข้อง
5. สร้าง release note
6. Tag commit เช่น `v1.2.0`
7. สลับ scriptId เป็น production
8. `clasp push` ไป production
9. Deploy production version ใหม่
10. รัน post-deploy smoke test (10-20 นาทีแรก)
11. Monitor logs/Telegram alert อย่างน้อย 1 ชั่วโมง

---

## 7) Smoke Test Checklist (บังคับ)

- [ ] เปิด `?page=dashboard` ได้
- [ ] เปิด `?page=chat` ได้
- [ ] ส่งข้อความจาก admin -> user ได้
- [ ] รับข้อความจาก user -> ระบบบันทึกได้
- [ ] bot intent ตอบกลับได้
- [ ] toggle bot/manual ทำงาน
- [ ] Telegram alert ทำงานเมื่อขอคุยเจ้าหน้าที่
- [ ] Rich menu list/create ทำงาน
- [ ] settings testConnection = ok ตาม environment

---

## 8) แผน Rollback แบบเร็ว

เมื่อ production มีปัญหา:

1. เปิด Apps Script -> Deployments
2. เลือก deployment เวอร์ชันก่อนหน้า (stable)
3. สลับ production ให้ใช้ deployment เดิม
4. ทดสอบ smoke test ขั้นต่ำ 5 จุด
5. แจ้งทีมว่าระบบ rollback เรียบร้อย

เป้าหมายเวลา:
- ตรวจพบปัญหา -> rollback เริ่ม: <= 5 นาที
- rollback เสร็จ + verify: <= 15 นาที

---

## 9) แนวทางจัดการ Data ระหว่าง Staging/Production

- ห้ามแชร์ Spreadsheet เดียวกัน
- ห้ามใช้ production token ใน staging
- ข้อมูล PII บน staging ควรเป็น anonymized
- Log และ audit ต้องแยกชุด

---

## 10) Release Checklist ก่อนกด Deploy Production

- [ ] Commit hash ตรงกับ release note
- [ ] Script Properties production ถูก env
- [ ] Staging ผ่าน test ล่าสุด
- [ ] มี rollback version ที่พร้อมใช้งาน
- [ ] แจ้งทีม support เวลา release แล้ว
- [ ] มี owner monitor หลังปล่อยงาน

---

## 11) เอกสารที่ควรมีคู่กัน

- `DEPLOYMENT_MANUAL_TH.md`
- `RUNBOOK_INCIDENT_TH.md`
- release notes ต่อเวอร์ชัน
- postmortem template

---

สิ้นสุดเอกสาร
