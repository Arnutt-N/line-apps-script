# KPI DASHBOARD GUIDE (ภาษาไทย) - LINE OA Platform

เอกสารนี้ใช้เป็นคู่มืออ่าน KPI ในหน้า Dashboard และกำหนด action threshold เมื่อค่าผิดปกติ

---

## 1) วัตถุประสงค์

- ให้ทีมอ่านค่าบน dashboard ตรงกัน
- กำหนด trigger ที่ต้องลงมือทำทันที
- แยกสาเหตุเชิงระบบกับเชิงปฏิบัติการได้เร็ว

---

## 2) KPI หลักที่ระบบแสดง

- `Active Chats`
- `Manual Chats`
- `Messages In (24h)`
- `Messages Out (24h)`
- `Followers`
- `Unresolved`
- `Intent Count`

และ trend จากตาราง `metrics_daily`

---

## 3) วิธีตีความ KPI

## 3.1 Active Chats
ความหมาย:
- จำนวนห้องแชตที่ active ในช่วง 24 ชั่วโมงล่าสุด

ตีความ:
- สูงขึ้นพร้อม `Messages In` เพิ่ม: demand เพิ่มตามปกติ
- สูงขึ้นแต่ `Messages Out` ไม่ขึ้นตาม: เสี่ยง backlog

Action แนะนำ:
- เช็ก staffing และ first response time
- กระจายงานไป agent เพิ่มถ้าจำเป็น

## 3.2 Manual Chats
ความหมาย:
- จำนวนห้องที่ถูกตั้งเป็นโหมด `manual`

ตีความ:
- สูงผิดปกติ: bot coverage ต่ำ หรือมีเคสซับซ้อนเพิ่ม

Action แนะนำ:
- review top intents ที่ fail
- เพิ่ม keyword/response ใน auto-reply

## 3.3 Messages In/Out (24h)
ความหมาย:
- ปริมาณข้อความขาเข้า/ขาออกใน 24 ชั่วโมง

ตีความ:
- In สูง Out ต่ำผิดปกติ: เสี่ยงตอบช้า/ส่งไม่ออก

Action แนะนำ:
- ตรวจ LINE API failures
- ตรวจ webhook/queue delay

## 3.4 Unresolved
ความหมาย:
- จำนวนห้องที่ยังไม่ปิดเคส

ตีความ:
- สูงต่อเนื่องหลายวัน: process ปิดเคสหรือ SLA มีปัญหา

Action แนะนำ:
- review oldest unresolved cases
- ตั้ง owner และ ETA ชัดเจน

## 3.5 Intent Count
ความหมาย:
- จำนวน intent ทั้งหมดในระบบ

ตีความ:
- ไม่ใช่ KPI คุณภาพโดยตรง
- ต้องดูคู่กับ hit rate และ miss rate

Action แนะนำ:
- วัดผล intent effectiveness ไม่ใช่จำนวนเพียงอย่างเดียว

---

## 4) Suggested Thresholds (ปรับตามธุรกิจ)

| KPI | Green | Yellow | Red |
|---|---|---|---|
| First response time (median) | <= 3 นาที | 3-5 นาที | > 5 นาที |
| Unresolved chats | <= 20 | 21-40 | > 40 |
| Messages In vs Out gap | <= 10% | 11-25% | > 25% |
| Manual chat ratio | <= 35% | 36-55% | > 55% |
| Webhook error rate | < 0.5% | 0.5-1% | > 1% |

หมายเหตุ:
- ใช้เป็น baseline เริ่มต้น ต้องปรับตาม peak season

---

## 5) Action Playbook ตามระดับสถานะ

## Green
- ทำ monitoring ปกติ
- ทำ daily checklist ตามรอบ

## Yellow
- Ops Lead review root cause เบื้องต้น
- ปรับ staffing/priority queue
- ติดตามทุก 30-60 นาที

## Red
- เปิด escalation ทันที
- หากกระทบวงกว้างให้เปิด incident
- พิจารณา mitigation เช่น rollback/reduce scope

---

## 6) Dashboard Review Cadence

- รายชั่วโมง: Ops Lead
- รายวัน: Ops + Product review
- รายสัปดาห์: trend + improvement backlog
- รายเดือน: KPI target calibration

---

## 7) Root Cause Hints (แยกสาเหตุเร็ว)

ถ้า `Messages In` เพิ่มเร็ว:
- ตรวจ campaign/event ภายนอก
- ตรวจ bot intent coverage

ถ้า `Messages Out` ลด:
- ตรวจ LINE token/permission
- ตรวจ send API errors

ถ้า `Unresolved` พุ่ง:
- ตรวจ handover quality
- ตรวจ assignment discipline

ถ้า `Manual ratio` สูง:
- ตรวจ auto-reply quality
- ตรวจ template completeness

---

## 8) Reporting Template (Daily KPI)

```text
[Daily KPI Summary]
Date:
Shift/Owner:

1) KPI Snapshot
- Active Chats:
- Manual Chats:
- Messages In/Out:
- Unresolved:

2) Risk Signals
- ...

3) Actions Taken Today
- ...

4) Plan Next 24h
- ...
```

---

## 9) เอกสารอ้างอิง

- `OPERATIONS_SOP_TH.md`
- `CHECKLIST_DAILY_TH.md`
- `RUNBOOK_INCIDENT_TH.md`
- `SECURITY_BASELINE_TH.md`

---

สิ้นสุดเอกสาร
