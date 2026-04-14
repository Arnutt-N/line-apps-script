# TRAINING PLAN CHAT AGENT (ภาษาไทย)

เอกสารนี้เป็นแผนฝึกเฉพาะบทบาท Chat Agent เพื่อให้ตอบลูกค้าได้ถูกต้อง เร็ว และสอดคล้องมาตรฐาน UX/Service

---

## 1) เป้าหมายการฝึก

- ตอบแชตตาม SLA ที่กำหนด
- ใช้เครื่องมือใน Live Chat ได้ครบ (mode toggle, notes, tags, export)
- ประสานงาน escalation ได้ถูกจังหวะ
- ส่งมอบ handover ได้ชัดเจน
- รักษามาตรฐานข้อมูลและความปลอดภัย

---

## 2) Competency Framework

| หมวด | สิ่งที่ต้องทำได้ | ระดับเป้าหมาย |
|---|---|---|
| Chat Workflow | รับเคส, ตอบ, สรุป, ปิดเคส | L3 |
| Tool Usage | ใช้ 3-column chat UI ครบฟังก์ชัน | L3 |
| SLA Discipline | รักษา first response และ follow-up | L3 |
| Communication Quality | ใช้ภาษาชัดเจน สุภาพ ตรงประเด็น | L3 |
| Escalation | แยกเคสทั่วไป/วิกฤตได้ | L3 |
| Security Awareness | ไม่แชร์ข้อมูลเสี่ยง/ทำตาม policy | L3 |

---

## 3) แผนฝึก 4 สัปดาห์

## สัปดาห์ที่ 1: Fundamentals

หัวข้อฝึก:
- โครงสร้างระบบ chat และบทบาท agent
- UI live chat: users list / room / profile
- โหมด `bot` vs `manual`
- การส่งข้อความ: text, emoji, sticker, file
- การอัปเดต note/tag

แบบฝึก:
- simulation 10 เคสพื้นฐาน
- ซ้อม response template มาตรฐาน

เกณฑ์ผ่าน:
- ใช้ฟังก์ชันหลักได้ครบโดยไม่ช่วยเหลือเกิน 2 ครั้ง

## สัปดาห์ที่ 2: Service Quality + SLA

หัวข้อฝึก:
- การจัดลำดับความสำคัญคิวแชต
- การเขียนข้อความให้กระชับและชัด
- การรับมือเคสยาก/ลูกค้าไม่พอใจ
- การตั้ง expectation เวลาแก้ปัญหา

แบบฝึก:
- role-play 15 เคส
- วัด first response time และ resolution quality

เกณฑ์ผ่าน:
- first response ตรงเป้า >= 90%

## สัปดาห์ที่ 3: Escalation & Incident Awareness

หัวข้อฝึก:
- เงื่อนไข escalation ไป Ops Lead / On-call
- ใช้ runbook เมื่อระบบผิดปกติ
- การสื่อสารใน incident channel

แบบฝึก:
- tabletop exercise 2 รอบ
- drill เคส webhook delay / send fail

เกณฑ์ผ่าน:
- escalation ถูกต้องตาม trigger 100%

## สัปดาห์ที่ 4: Production Shadow -> Ownership

หัวข้อฝึก:
- ทำงานกะจริงแบบ monitored
- handover เอกสารท้ายกะ
- review KPI รายวัน

แบบฝึก:
- รับเคสจริงพร้อม mentor review
- ส่ง handover 3 ชุด

เกณฑ์ผ่าน:
- ผ่าน quality review ต่อเนื่อง 3 วัน

---

## 4) Daily Training Routine (สำหรับช่วงฝึก)

ก่อนเริ่มกะ:
- [ ] เปิด dashboard/check connections
- [ ] อ่าน handover ล่าสุด
- [ ] ดูเคสค้างและ SLA risk

ระหว่างกะ:
- [ ] จัดลำดับคิวทุก 30-60 นาที
- [ ] ปรับ notes/tag ทุกเคสสำคัญ
- [ ] escalate ตาม policy ถ้าพบ trigger

ก่อนจบกะ:
- [ ] สรุป open cases
- [ ] ส่ง handover
- [ ] self-review 3 จุดที่ทำดี / 3 จุดที่ต้องปรับ

---

## 5) Response Quality Guidelines

หลักการตอบแชต:
1. ชัดเจน: ตอบตรงคำถามก่อน แล้วค่อยให้รายละเอียด
2. รวดเร็ว: แจ้งว่าได้รับเรื่องภายใน SLA
3. โปร่งใส: ถ้าใช้เวลาตรวจสอบ ให้ระบุ ETA
4. ปลอดภัย: ไม่ขอข้อมูลอ่อนไหวเกินจำเป็น
5. ปิดเคสอย่างมีคุณภาพ: สรุปและยืนยันความเข้าใจร่วม

รูปแบบข้อความแนะนำ:
- Opening: ทักทาย + ยืนยันรับเรื่อง
- Clarify: ถามข้อมูลที่จำเป็น
- Action: บอกสิ่งที่กำลังทำ
- Close: สรุปผล + ช่องทางติดตาม

---

## 6) Escalation Triggers สำหรับ Chat Agent

ต้อง escalate ทันทีเมื่อ:
- ระบบส่งข้อความไม่ได้ซ้ำหลายเคส
- webhook delay จนลูกค้ารอเกิน SLA
- พบข้อมูลเสี่ยงด้านความปลอดภัย
- ลูกค้าร้องเรียนระดับรุนแรง
- เคสเกิน authority ของ agent

เอกสารอ้างอิง:
- `RUNBOOK_INCIDENT_TH.md`
- `OPERATIONS_SOP_TH.md`

---

## 7) Scorecard ประเมิน Chat Agent

| หมวด | น้ำหนัก | คะแนนเต็ม | คะแนนได้ |
|---|---:|---:|---:|
| First response time | 20% | 100 |  |
| Resolution quality | 25% | 100 |  |
| Tool usage accuracy | 15% | 100 |  |
| Escalation correctness | 20% | 100 |  |
| Handover quality | 10% | 100 |  |
| Security compliance | 10% | 100 |  |

เกณฑ์ผ่าน:
- คะแนนรวม >= 80
- ห้าม fail ในหัวข้อ `Escalation correctness` และ `Security compliance`

---

## 8) Coaching & Feedback Loop

รอบ feedback แนะนำ:
- Daily: quick feedback 10-15 นาทีหลังจบกะ
- Weekly: 1:1 review 30 นาที
- Monthly: performance review + growth plan

โครง feedback:
- Keep: สิ่งที่ทำดีและต้องรักษา
- Improve: สิ่งที่ควรปรับทันที
- Next: เป้าหมายสัปดาห์ถัดไป

---

## 9) Training Completion Sign-off

ชื่อผู้ฝึก: __________________
ชื่อผู้ประเมิน: ______________
วันที่ประเมิน: ______________

ผลการประเมิน:
- [ ] ผ่าน
- [ ] ผ่านแบบมีเงื่อนไข
- [ ] ต้องฝึกเพิ่ม

Action items ต่อเนื่อง:
__________________________________________________
__________________________________________________

---

สิ้นสุดเอกสาร
