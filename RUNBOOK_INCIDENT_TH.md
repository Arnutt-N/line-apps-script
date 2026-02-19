# RUNBOOK เหตุขัดข้อง (Incident Runbook) - LINE OA Platform

เอกสารนี้ใช้สำหรับรับมือปัญหา production อย่างเป็นขั้นตอน พร้อมเวลาตอบสนองและแนวทางสื่อสาร

---

## 1) วัตถุประสงค์

- ลดเวลา downtime
- ลดการตัดสินใจหน้างานแบบ ad-hoc
- ทำให้ทีมรู้ว่าใครทำอะไร เมื่อไร

---

## 2) นิยามระดับความรุนแรง (Severity)

- `SEV-1`: ระบบหลักใช้งานไม่ได้วงกว้าง (chat ส่ง/รับไม่ได้, webhook ล้ม)
- `SEV-2`: ระบบยังใช้ได้บางส่วน แต่กระทบธุรกิจชัดเจน (delay สูง, feature หลักล้มบางโมดูล)
- `SEV-3`: ปัญหาเล็ก/เฉพาะจุด มี workaround
- `SEV-4`: cosmetic หรือปรับปรุงทั่วไป

SLA ภายในทีม (แนะนำ):
- SEV-1: acknowledge <= 5 นาที, mitigation <= 30 นาที
- SEV-2: acknowledge <= 15 นาที, mitigation <= 2 ชั่วโมง
- SEV-3: acknowledge <= 4 ชั่วโมง

---

## 3) บทบาทระหว่าง Incident

- `Incident Commander (IC)`: ตัดสินใจหลัก, กำกับภาพรวม
- `Ops Engineer`: ตรวจ logs/deploy/rollback
- `App Engineer`: วิเคราะห์โค้ดและแก้ปัญหา
- `Comms Owner`: อัปเดตผู้เกี่ยวข้อง/ลูกค้า
- `Scribe`: บันทึก timeline

---

## 4) ช่องทางสื่อสาร

- ห้อง incident หลัก (Telegram/Slack)
- ห้อง stakeholder update
- ช่องทางประกาศลูกค้า (ถ้ามี)

รูปแบบชื่อ incident:
`INC-YYYYMMDD-HHMM-<short-title>`

---

## 5) ขั้นตอนรับมือมาตรฐาน (Universal Flow)

1. ตรวจจับ (Detect)
2. ยืนยันผลกระทบ (Confirm)
3. จัดระดับ Sev และแต่งตั้ง IC
4. ทำ mitigation เร็วที่สุด (rollback / disable feature / route switch)
5. ตรวจสอบว่าระบบกลับมาใช้งานได้
6. สื่อสารสถานะ
7. ทำ RCA + Postmortem

---

## 6) Playbook รายเหตุการณ์

## 6.1 Webhook LINE ล้ม (SEV-1)

อาการ:
- ผู้ใช้ส่งข้อความมาแล้วไม่มีบันทึกใน `chat_messages`
- LINE webhook verify fail

ตรวจสอบทันที:
1. ตรวจ Apps Script Executions ว่ามี error หรือไม่
2. ตรวจว่า URL webhook เป็น deployment ล่าสุด
3. ตรวจ `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`
4. ตรวจ `LINE_REQUIRE_SIGNATURE` และ logic verify signature

Mitigation:
1. rollback ไป deployment ก่อนหน้า
2. หากยังล้ม ให้ปิด signature ชั่วคราวเฉพาะฉุกเฉิน (ต้องอนุมัติ IC)
3. retest webhook verify

Exit criteria:
- ข้อความใหม่เข้าระบบได้ต่อเนื่อง 10 นาที

## 6.2 Admin เข้าไม่ได้ (Unauthorized) (SEV-2)

อาการ:
- เปิดหน้าแล้ว unauthorized

ตรวจสอบ:
1. `admin_users` มี email หรือไม่
2. status = `active` หรือไม่
3. role ถูกต้องหรือไม่
4. permissions ของ role ครบหรือไม่

Mitigation:
- เพิ่ม/แก้ record ใน `admin_users` และ `permissions`

## 6.3 ส่งข้อความไม่ออก (SEV-1/2)

อาการ:
- บันทึกในระบบได้ แต่ LINE ไม่ได้รับ

ตรวจสอบ:
1. token หมดอายุหรือไม่
2. response code จาก LINE API
3. payload message type ถูกสเปกหรือไม่

Mitigation:
1. เปลี่ยน token ใหม่
2. fallback ส่งเป็น text message ก่อน
3. ปิด feature type ที่พังชั่วคราว

## 6.4 Telegram แจ้งเตือนไม่ทำงาน (SEV-3)

ตรวจสอบ:
1. `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
2. bot เคยถูกเริ่มแชตแล้วหรือยัง
3. ดู `job_queue` ว่ามี failed jobs หรือไม่

Mitigation:
- แก้ token/chat id
- สั่ง retry queue

## 6.5 Google Sheets quota/latency สูง (SEV-2)

อาการ:
- API timeout
- response ช้า

Mitigation:
1. ลด polling interval ชั่วคราว (เช่นจาก 3000 -> 5000 ms)
2. ลด query ขนาดใหญ่
3. archive ข้อมูลเก่าออกจาก sheet หลัก

## 6.6 Rich Menu publish ไม่ได้ (SEV-3)

ตรวจสอบ:
1. actions JSON
2. image ขนาด/format ตาม LINE spec
3. LINE API response

Mitigation:
- revert ไป rich menu ที่เคยใช้ได้
- publish ใหม่เมื่อ payload ถูกต้อง

---

## 7) คำสั่งเช็คด่วน (Operational Quick Checks)

1. เปิดหน้า `?page=settings` -> `testConnection(all)`
2. เปิด `?page=chat` ดูข้อความเข้าล่าสุด
3. ตรวจ `audit_logs`, `job_queue`
4. ตรวจ Apps Script execution errors

---

## 8) เทมเพลตข้อความสื่อสารระหว่าง Incident

## 8.1 Internal (เริ่ม incident)

```text
[INCIDENT START]
ID: INC-YYYYMMDD-HHMM-xxxx
Severity: SEV-x
Impact: <อธิบายผลกระทบ>
Owner(IC): <ชื่อ>
Current action: <สิ่งที่กำลังทำ>
Next update: <เวลาอีกครั้ง>
```

## 8.2 Stakeholder update

```text
สถานะระบบ LINE OA ขณะนี้พบเหตุขัดข้องบางส่วนในโมดูล <...>
ทีมกำลังดำเนินการแก้ไข โดยคาดอัปเดตครั้งถัดไปเวลา <...>
ผลกระทบ: <...>
```

## 8.3 Resolved

```text
[INCIDENT RESOLVED]
ID: INC-YYYYMMDD-HHMM-xxxx
Resolved at: <เวลา>
Root cause (เบื้องต้น): <...>
Mitigation: <...>
Follow-up actions: <...>
```

---

## 9) Postmortem Template

หัวข้อขั้นต่ำ:
1. Incident ID
2. Timeline (นาทีต่อนาที)
3. Impact
4. Detection gap
5. Root cause (5-whys)
6. สิ่งที่ทำได้ดี
7. สิ่งที่ต้องปรับ
8. Action items + owner + due date

---

## 10) Action Items ที่ควรทำล่วงหน้า (ก่อนเกิดเหตุ)

- [ ] ตั้ง alert เมื่อ webhook error rate สูง
- [ ] ทำ dashboard log สรุปรายชั่วโมง
- [ ] เตรียม rollback SOP ให้ทุกคนเข้าถึง
- [ ] ซ้อม incident drill รายเดือน
- [ ] กำหนด on-call rotation

---

## 11) Definition of Done หลัง Incident

ปิด incident ได้เมื่อ:
- [ ] ระบบกลับมาปกติ
- [ ] monitor ไม่พบ error ซ้ำช่วงเฝ้าระวัง
- [ ] stakeholder รับทราบ
- [ ] postmortem ถูกสร้าง
- [ ] action items ถูก assign ครบ

---

สิ้นสุดเอกสาร
