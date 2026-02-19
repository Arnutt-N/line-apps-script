# OPERATIONS SOP (ภาษาไทย) - LINE OA Platform

เอกสารนี้เป็นมาตรฐานการปฏิบัติงานประจำของทีมปฏิบัติการ (Operations) และทีมแอดมินแชต เพื่อให้บริการสม่ำเสมอ, ตรวจสอบย้อนกลับได้, และรองรับการขยายทีม

---

## 1) วัตถุประสงค์

- ทำให้ทีมทำงานด้วยขั้นตอนเดียวกัน
- ลดความผิดพลาดจาก human error
- เพิ่มคุณภาพการตอบแชตและเวลาแก้ปัญหา
- สร้าง evidence ที่ตรวจสอบได้จาก logs/audit

---

## 2) ขอบเขต

ครอบคลุมงาน:
- Live Chat operations
- Auto-reply monitoring
- Rich menu operations
- User and role administration
- Daily/weekly/monthly system checks
- Handover และ incident escalation

ไม่ครอบคลุมงานพัฒนา feature ใหม่ (อ้างอิงเอกสาร deployment/release)

---

## 3) บทบาท (Roles)

- `Ops Lead`
  - คุมคุณภาพงานทั้งวัน
  - อนุมัติการเปลี่ยนค่า settings สำคัญ
- `Chat Agent`
  - ตอบลูกค้าใน Live Chat
  - tag/assign/toggle bot-manual ตาม policy
- `System Admin`
  - จัดการผู้ใช้และสิทธิ์
  - ตรวจ monitoring, logs, connections
- `On-call Engineer`
  - รับ incident escalation
  - rollback/mitigation เมื่อกระทบ production

---

## 4) SLA/SLO ที่แนะนำ

- First response time (manual chat): <= 3 นาที
- Re-opened unresolved chats: < 5%
- Webhook processing success: >= 99.5%
- Daily admin console availability: >= 99.9%

---

## 5) ขั้นตอนเริ่มงานของแต่ละกะ (Start-of-Shift)

ทุกกะต้องทำตามลำดับ:

1. เปิด `?page=dashboard` ตรวจ KPI หลัก
2. เปิด `?page=settings` และกด `testConnection(all)`
3. เปิด `?page=chat` ตรวจ queue ค้าง
4. ตรวจ `job_queue` ว่ามี failed jobs หรือไม่
5. ตรวจแจ้งเตือน Telegram ย้อนหลัง 12 ชั่วโมง
6. อ่าน handover note จากกะก่อน

ถ้าพบข้อผิดปกติ:
- ยกระดับไป Ops Lead ทันที
- เริ่ม Incident flow ถ้ากระทบผู้ใช้จริง

---

## 6) SOP งาน Live Chat

## 6.1 กฎการรับแชต

1. เรียงลำดับตอบจาก:
   - manual requests
   - unread สูงสุด
   - ลูกค้า VIP (ถ้ามี tagging)
2. เมื่อเริ่มรับเคส ให้เปลี่ยน room เป็น `manual`
3. อัปเดต note/tag ทุกเคสสำคัญ

## 6.2 กฎการส่งข้อความ

- ใช้ template ที่ผ่านการอนุมัติสำหรับข้อความมาตรฐาน
- หลีกเลี่ยงการส่งลิงก์ภายนอกที่ไม่ผ่าน whitelist
- ก่อนส่ง media ให้ตรวจสิทธิ์ไฟล์และความถูกต้องของ URL

## 6.3 ปิดเคส

- สรุปผลใน notes
- ตั้ง status room ตาม policy (`open`/`closed`)
- ถ้าเป็นคำถามซ้ำ ควรสร้าง/ปรับ intent + keyword ให้ bot

## 6.4 วิดีโอคอล

- ใช้ปุ่ม Video Call ในห้องแชต
- ต้องแจ้งลูกค้าก่อนทุกครั้งว่ากำลังเปิด external call link
- บันทึกเวลาที่เริ่ม call ใน notes

---

## 7) SOP งาน Auto Reply / Intent Operations

1. ตรวจ `intent hit rate` รายวัน
2. เก็บคำถามที่ bot ตอบไม่ได้
3. เพิ่ม keyword/response ทุกวันตาม top missed intents
4. ทดสอบผ่าน `Auto Replies -> Test Console` ก่อนเปิดใช้งานจริง
5. เมื่อแก้ intent สำคัญ ต้องจด changelog ใน handover

กฎคุณภาพ:
- ทุก intent ใหม่ต้องมี keyword อย่างน้อย 3 คำ
- ทุก intent ต้องมี fallback response
- หลีกเลี่ยง regex ซับซ้อนโดยไม่จำเป็น

---

## 8) SOP งาน Rich Menu

1. สร้าง rich menu ในหน้า Rich Menu
2. อัปโหลดรูปตามสเปก LINE
3. กำหนด action areas ด้วย JSON
4. ทดสอบบน staging ก่อน publish production
5. เมื่อตั้ง default ใหม่ ต้องแจ้งทีม support

Change window แนะนำ:
- ทำในช่วง traffic ต่ำ
- เตรียม rollback rich menu เดิมไว้เสมอ

---

## 9) SOP งาน User & Permission

## 9.1 เพิ่มผู้ใช้งานแอดมิน

1. เพิ่ม record ใน `admin_users`
2. กำหนด role (`owner/admin/agent/viewer`)
3. status=`active`
4. ทดสอบ login เข้าหน้า dashboard

## 9.2 เปลี่ยนสิทธิ์

- ใช้หลัก least privilege
- เปลี่ยนสิทธิ์เฉพาะ ticket ที่ได้รับอนุมัติ
- บันทึกเหตุผลทุกครั้งใน `audit_logs`

## 9.3 Offboarding

1. ตั้ง `status=inactive`
2. ย้าย assignment chats ไปเจ้าหน้าที่อื่น
3. ตรวจสอบว่าบัญชีไม่มี active session สำคัญ

---

## 10) งานประจำวัน (Daily Checklist)

- [ ] Dashboard KPI ปกติ
- [ ] Connections test ผ่าน
- [ ] Webhook ไม่มี error ผิดปกติ
- [ ] Failed jobs ใน `job_queue` = 0 หรือมี action แล้ว
- [ ] Unresolved manual chats ไม่เกิน threshold
- [ ] Telegram alerts ไม่มีค้าง
- [ ] สรุป handover ปิดท้ายกะ

---

## 11) งานประจำสัปดาห์ (Weekly Checklist)

- [ ] Review top customer intents ที่ตอบไม่ตรง
- [ ] ปรับ keyword/response templates
- [ ] ตรวจ role/permission drift
- [ ] ตรวจ retention policy และงาน archive
- [ ] ตรวจคุณภาพ media links (หมดอายุ/เข้าถึงไม่ได้)
- [ ] สุ่ม audit 10 conversations

---

## 12) งานประจำเดือน (Monthly Checklist)

- [ ] Review security baseline
- [ ] Incident drill 1 ครั้ง
- [ ] Capacity review (sheet rows, latency, quota)
- [ ] Backup/restore dry-run อย่างน้อย 1 ครั้ง
- [ ] สรุป KPI รายเดือนให้ผู้บริหาร

---

## 13) Handover SOP (ส่งมอบกะ)

ทุกกะต้องส่ง handover เป็นรูปแบบเดียวกัน:

```text
[Shift Handover]
วันที่/เวลา:
ผู้ส่ง:
ผู้รับ:

1) System Health
- dashboard summary:
- connection test:

2) Open Cases
- room id / user / issue / owner / ETA

3) Changes Made
- settings changed:
- intents/templates changed:
- rich menu changed:

4) Risks
- risk item / impact / mitigation

5) Action Next Shift
- item / owner / due
```

---

## 14) Escalation Matrix

- ภายใน 5 นาที: Chat Agent -> Ops Lead
- ภายใน 10 นาที: Ops Lead -> On-call Engineer
- ภายใน 15 นาที: หากกระทบกว้าง ให้เปิด Incident Room และประกาศสถานะ

เงื่อนไขที่ต้อง escalate ทันที:
- webhook ล้ม
- ส่งข้อความไม่ได้วงกว้าง
- admin เข้าไม่ได้หลายบัญชี
- data loss/suspected security issue

---

## 15) KPI Quality Review

วัดรายสัปดาห์:
- First response time median
- % manual takeover
- CSAT (ถ้ามี)
- Intent hit rate
- Re-open rate
- Error rate จาก LINE API

Action rule:
- ถ้า metric หลุดเป้า 2 สัปดาห์ติด -> เปิด improvement plan

---

## 16) สิ่งที่ห้ามทำ (Do Not)

- ห้ามแก้ Script Properties production โดยไม่มี ticket
- ห้ามเปลี่ยน role เป็น owner ให้ผู้ใช้ทั่วไป
- ห้าม publish rich menu โดยไม่ทดสอบ staging
- ห้ามลบข้อมูลสำคัญใน sheet โดยไม่มี backup
- ห้ามแชร์ token ผ่านแชตหรือเอกสารสาธารณะ

---

## 17) เอกสารอ้างอิงที่ต้องใช้ร่วมกัน

- `DEPLOYMENT_MANUAL_TH.md`
- `DEPLOYMENT_STAGING_TH.md`
- `RUNBOOK_INCIDENT_TH.md`
- `SECURITY_BASELINE_TH.md`

---

สิ้นสุดเอกสาร
