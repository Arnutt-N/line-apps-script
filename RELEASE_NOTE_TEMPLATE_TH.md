# RELEASE NOTE TEMPLATE (ภาษาไทย)

> ใช้เอกสารนี้ทุกครั้งที่ปล่อยเวอร์ชันใหม่ (staging/prod) เพื่อให้ทีม dev/ops/support เข้าใจผลกระทบและ rollback ได้เร็ว

---

## ส่วนที่ 1: ข้อมูลเวอร์ชัน

- `Release ID`:
- `Version`:
- `Environment`: `staging` / `production`
- `Release Date`:
- `Release Time`:
- `Release Owner`:
- `Approver`:
- `Related Ticket(s)`:
- `Git Commit / Tag`:

---

## ส่วนที่ 2: สรุปภาพรวม (Executive Summary)

- วัตถุประสงค์ของ release นี้:
- ผลลัพธ์ที่คาดหวัง:
- กลุ่มผู้ใช้งานที่ได้รับผลกระทบ:
- ความเสี่ยงรวม (Low/Medium/High):

---

## ส่วนที่ 3: รายการเปลี่ยนแปลง (Change Log)

## 3.1 Features ใหม่

| ลำดับ | รายการ | รายละเอียด | โมดูล/ไฟล์ที่เกี่ยวข้อง | Impact |
|---|---|---|---|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |

## 3.2 Bug Fixes

| ลำดับ | ปัญหาเดิม | วิธีแก้ | ผลกระทบ | Ticket |
|---|---|---|---|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |

## 3.3 Improvements / Refactor

| ลำดับ | รายการ | เหตุผล | ความเสี่ยง | หมายเหตุ |
|---|---|---|---|---|
| 1 |  |  |  |  |

---

## ส่วนที่ 4: Public Interface / Config Changes

ระบุทุกจุดที่มีผลกับ interface หรือการใช้งาน:

- API actions ที่เพิ่ม/แก้/ลบ:
- Sheet schema ที่เพิ่ม/แก้:
- Script Properties ใหม่/เปลี่ยน:
- Settings key ใหม่/เปลี่ยน:
- URL/route ใหม่:
- Rich Menu / LIFF / webhook behavior ที่เปลี่ยน:

ตัวอย่าง format:

| ประเภท | ก่อนหน้า | หลังเปลี่ยน | Migration Required |
|---|---|---|---|
| Script Property | ไม่มี `LINE_REQUIRE_SIGNATURE` | เพิ่ม `LINE_REQUIRE_SIGNATURE=true` | ใช่ |

---

## ส่วนที่ 5: Database & Migration

- มี migration หรือไม่: `Yes/No`
- รายละเอียด migration:
- วิธีรัน migration:
- ระยะเวลาที่ใช้โดยประมาณ:
- แผน rollback ของ migration:
- data backfill required: `Yes/No`

Checklist:
- [ ] backup ก่อน migration
- [ ] verify schema หลัง migration
- [ ] verify read/write path หลัง migration

---

## ส่วนที่ 6: Security Review

- มีการแตะ secrets หรือไม่:
- มีการเปลี่ยน RBAC/permissions หรือไม่:
- มีการเปลี่ยน webhook verification หรือไม่:
- มีการเพิ่ม external endpoint/CDN ใหม่หรือไม่:
- ผลการตรวจขั้นต่ำ:
  - [ ] ไม่ hardcode token
  - [ ] sanitize input ที่เกี่ยวข้อง
  - [ ] audit logs ทำงานปกติ

---

## ส่วนที่ 7: Testing Summary

## 7.1 Automated Checks

| รายการทดสอบ | ผลลัพธ์ | หมายเหตุ |
|---|---|---|
| Syntax Check | Pass/Fail |  |
| Unit/Function tests | Pass/Fail |  |
| Integration tests | Pass/Fail |  |

## 7.2 Manual Smoke Test

- [ ] เปิด `?page=dashboard`
- [ ] เปิด `?page=chat`
- [ ] send/receive chat ผ่าน
- [ ] toggle bot/manual ผ่าน
- [ ] auto reply ทำงาน
- [ ] rich menu flow (ถ้าแตะ) ผ่าน
- [ ] settings testConnection ผ่าน
- [ ] telegram alert ผ่าน (ถ้าแตะ)

## 7.3 Known Gaps

- test ที่ยังไม่ได้รัน:
- ความเสี่ยงที่ยอมรับได้:

---

## ส่วนที่ 8: Deployment Plan

- Deployment window:
- ขั้นตอน deploy:
  1. 
  2. 
  3. 
- ผู้รับผิดชอบแต่ละขั้นตอน:
- เวลาเฝ้าระวังหลัง deploy:

---

## ส่วนที่ 9: Rollback Plan

- Trigger conditions ที่ต้อง rollback:
- เวอร์ชัน fallback:
- ขั้นตอน rollback:
  1. 
  2. 
  3. 
- เวลา rollback โดยประมาณ:
- ผู้อนุมัติ rollback:

---

## ส่วนที่ 10: Monitoring หลังปล่อยงาน

ช่วงเฝ้าระวัง (อย่างน้อย 60 นาที):

- Metrics ที่ต้องดู:
  - webhook error rate
  - send message failure
  - chat latency/polling delay
  - job_queue failures
- logs ที่ต้องดู:
  - Apps Script Executions
  - audit_logs
  - Telegram incident channel

---

## ส่วนที่ 11: Communication Plan

## 11.1 แจ้งทีมภายในก่อนปล่อย

```text
[Release Notice]
Version:
Window:
Impact:
Owner:
Rollback owner:
```

## 11.2 แจ้งสถานะหลังปล่อย

```text
[Release Complete]
Version:
Start-End time:
Result:
Known issues:
Monitoring owner:
```

---

## ส่วนที่ 12: Sign-off

- Dev Owner: `อนุมัติ / ไม่อนุมัติ`
- Ops Owner: `อนุมัติ / ไม่อนุมัติ`
- Security/Compliance (ถ้ามี): `อนุมัติ / ไม่อนุมัติ`
- Product Owner: `อนุมัติ / ไม่อนุมัติ`

หมายเหตุสุดท้าย:

---

## ภาคผนวก A: Release Scorecard (แนะนำ)

ให้คะแนนก่อนปล่อย (1-5):

- Test Coverage Confidence:
- Rollback Readiness:
- Monitoring Readiness:
- Security Confidence:
- Docs Completeness:

เกณฑ์:
- ถ้าเฉลี่ย < 3.5 ไม่ควรปล่อย production

---

สิ้นสุดเทมเพลต
