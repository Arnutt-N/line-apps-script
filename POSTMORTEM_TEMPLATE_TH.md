# POSTMORTEM TEMPLATE (ภาษาไทย) - Incident / RCA

> ใช้เอกสารนี้หลัง incident ทุกครั้ง โดยเน้นการเรียนรู้เชิงระบบ ไม่โทษบุคคล

---

## ส่วนที่ 1: ข้อมูล Incident

- `Incident ID`:
- `Incident Title`:
- `Severity`: `SEV-1/SEV-2/SEV-3/SEV-4`
- `Environment`: `production/staging`
- `Start Time`:
- `End Time`:
- `Duration`:
- `Incident Commander`:
- `Scribe`:
- `Owners Involved`:

---

## ส่วนที่ 2: Executive Summary

สรุปสั้น 3-6 บรรทัด:
- เกิดอะไรขึ้น
- กระทบใคร
- ระบบกลับมาปกติอย่างไร
- root cause ระดับสูงคืออะไร

---

## ส่วนที่ 3: Impact Assessment

## 3.1 ผู้ใช้งานที่ได้รับผลกระทบ

- จำนวนผู้ใช้ที่กระทบโดยประมาณ:
- กลุ่มผู้ใช้ที่กระทบ:
- ช่องทางที่กระทบ (chat/webhook/admin):

## 3.2 ผลกระทบทางธุรกิจ

- ข้อความที่ตกหล่นโดยประมาณ:
- SLA ที่ผิดพลาด:
- รายได้/โอกาสที่สูญเสีย (ถ้ามี):
- reputational impact:

---

## ส่วนที่ 4: Timeline (นาทีต่อนาที)

| เวลา (TZ) | เหตุการณ์ | ผู้กระทำ | หลักฐาน (log/link) |
|---|---|---|---|
|  | ตรวจพบปัญหา |  |  |
|  | Acknowledge |  |  |
|  | Mitigation เริ่ม |  |  |
|  | Service restored |  |  |
|  | Monitoring stable |  |  |

> ใส่เวลาจริงละเอียดที่สุดเท่าที่ทำได้

---

## ส่วนที่ 5: Detection & Response Evaluation

## 5.1 Detection

- ตรวจพบจากอะไร (alert/manual/customer report):
- detection lag เท่าไร:
- ทำไม alert ถึงพอ/ไม่พอ:

## 5.2 Response

- response lag เท่าไร:
- ทีมตัดสินใจถูก/พลาดตรงไหน:
- communication flow ชัดเจนหรือไม่:

---

## ส่วนที่ 6: Root Cause Analysis (RCA)

## 6.1 Immediate Cause

- สาเหตุใกล้ตัวที่ทำให้ระบบพังทันที:

## 6.2 Underlying Causes

- ช่องว่างด้าน process:
- ช่องว่างด้าน test:
- ช่องว่างด้าน monitoring:
- ช่องว่างด้าน architecture:

## 6.3 5 Whys

1. ทำไมเหตุการณ์นี้เกิดขึ้น?
2. ทำไมข้อ 1 ถึงเกิด?
3. ทำไมข้อ 2 ถึงเกิด?
4. ทำไมข้อ 3 ถึงเกิด?
5. ทำไมข้อ 4 ถึงเกิด?

สรุป root cause ที่แท้จริง:

---

## ส่วนที่ 7: สิ่งที่ทำได้ดี / สิ่งที่ต้องปรับ

## 7.1 สิ่งที่ทำได้ดี

- 
- 

## 7.2 สิ่งที่ต้องปรับ

- 
- 

---

## ส่วนที่ 8: Corrective Actions (Fix now)

| ลำดับ | งานแก้ทันที | Owner | Due Date | สถานะ |
|---|---|---|---|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |

---

## ส่วนที่ 9: Preventive Actions (Fix forever)

| ลำดับ | งานป้องกันระยะยาว | Owner | Due Date | Metric of Success |
|---|---|---|---|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |

ตัวอย่าง preventive actions:
- เพิ่ม alert ที่ครอบคลุม detection gap
- เพิ่ม integration test ก่อนปล่อย
- harden webhook signature policy
- ทำ canary/staged rollout

---

## ส่วนที่ 10: Verification Plan

หลังแก้ไขแล้วต้องพิสูจน์ว่าไม่เกิดซ้ำ:

- test cases ที่ต้องผ่าน:
- staging simulation plan:
- production guardrail ที่เพิ่ม:
- monitoring thresholds ใหม่:

Checklist:
- [ ] มี test ยืนยัน bug เดิม
- [ ] มี regression test ครอบคลุม
- [ ] มี monitor/alert ใหม่
- [ ] มีเอกสาร SOP update แล้ว

---

## ส่วนที่ 11: Communication Log

บันทึกการสื่อสารสำคัญ:

| เวลา | ช่องทาง | ผู้รับสาร | เนื้อหาโดยย่อ |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |

---

## ส่วนที่ 12: Lessons Learned

- สิ่งที่เรียนรู้ด้านเทคนิค:
- สิ่งที่เรียนรู้ด้าน process:
- สิ่งที่เรียนรู้ด้าน coordination:

---

## ส่วนที่ 13: Policy/Doc Updates

หลัง incident ต้องอัปเดตเอกสารใดบ้าง:

- [ ] `RUNBOOK_INCIDENT_TH.md`
- [ ] `OPERATIONS_SOP_TH.md`
- [ ] `SECURITY_BASELINE_TH.md`
- [ ] Deployment checklist
- [ ] อื่นๆ:

---

## ส่วนที่ 14: Sign-off

- Incident Commander sign-off:
- Engineering Manager sign-off:
- Ops Lead sign-off:
- Date closed:

เงื่อนไขปิด incident อย่างเป็นทางการ:
- [ ] service stable
- [ ] RCA เสร็จ
- [ ] action items ถูก assign ครบ
- [ ] stakeholder รับทราบ

---

## ภาคผนวก A: Blameless Guidelines

หลักปฏิบัติ:
- โฟกัสที่ระบบ, ไม่โทษคน
- เน้นข้อเท็จจริงจาก timeline/log
- ถกเถียงเชิงโครงสร้างเพื่อไม่ให้เกิดซ้ำ
- action items ต้องวัดผลได้

---

สิ้นสุดเทมเพลต
