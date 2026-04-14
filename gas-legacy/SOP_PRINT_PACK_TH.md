# SOP PRINT PACK (ภาษาไทย) - LINE OA Platform

> เอกสารย่อสำหรับพิมพ์แปะหน้างาน (1-2 หน้า)

วันที่: ____________
กะ: ____________
ผู้ปฏิบัติงาน: __________________

---

## 1) Start of Shift (10 นาทีแรก)

- [ ] เปิด `?page=dashboard` ดู KPI ผิดปกติ
- [ ] เปิด `?page=settings` -> `testConnection(all)`
- [ ] เปิด `?page=chat` ตรวจคิวค้างและ unread สูง
- [ ] ตรวจ `job_queue` ว่ามี failed jobs หรือไม่
- [ ] อ่าน handover กะก่อน

ถ้าพบเหตุรุนแรง:
- [ ] แจ้ง Ops Lead ทันที
- [ ] เปิด incident ตาม `RUNBOOK_INCIDENT_TH.md`

---

## 2) Live Chat Quick Rules

1. เคสที่รับเองต้องสลับเป็น `manual`
2. ตอบให้ชัดเจน สั้น ตรงคำถามก่อน
3. เคสสำคัญต้องมี note/tag เสมอ
4. ถ้าต้องใช้เวลา ให้แจ้ง ETA ลูกค้า
5. ปิดเคสแล้วต้องสรุปผลในห้องแชต

---

## 3) ระหว่างกะ (ทำทุก 60 นาที)

- [ ] ตรวจเคสเสี่ยงหลุด SLA
- [ ] ตรวจ send fail / webhook delay
- [ ] ตรวจข้อความ bot ที่ match ไม่ตรง
- [ ] ตรวจ Telegram alerts ที่ผิดปกติ

เวลาที่ตรวจ:
- รอบ 1: ______
- รอบ 2: ______
- รอบ 3: ______
- รอบ 4: ______

---

## 4) Escalation Trigger

Escalate ทันทีเมื่อ:
- [ ] webhook ไม่เข้า / แชตไม่รับข้อความ
- [ ] ส่งข้อความออกไม่ได้วงกว้าง
- [ ] admin เข้าระบบไม่ได้หลายบัญชี
- [ ] พบความเสี่ยงด้านข้อมูล/ความปลอดภัย

เส้นทางแจ้ง:
- Agent -> Ops Lead -> On-call Engineer

---

## 5) End of Shift

- [ ] สรุป open cases
- [ ] ระบุ owner ต่อ + ETA
- [ ] ระบุสิ่งที่เปลี่ยนในกะ (settings/intents/rich menu)
- [ ] ยืนยันไม่มี critical alert ค้าง
- [ ] ส่ง handover ให้กะถัดไป

Handover สั้น:
__________________________________________________
__________________________________________________
__________________________________________________

---

## 6) เอกสารอ้างอิงเร็ว

- SOP เต็ม: `OPERATIONS_SOP_TH.md`
- เช็กลิสต์รายวัน: `CHECKLIST_DAILY_TH.md`
- Incident runbook: `RUNBOOK_INCIDENT_TH.md`
- Security baseline: `SECURITY_BASELINE_TH.md`

---

Sign-off ผู้ปฏิบัติงาน: __________________  เวลา: ____________
Sign-off Ops Lead: ______________________  เวลา: ____________
