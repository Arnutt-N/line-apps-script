# ONBOARDING 30 DAYS (ภาษาไทย) - LINE OA Platform

เอกสารนี้เป็นแผน Onboarding 30 วันสำหรับสมาชิกใหม่ในทีม (Dev / Ops / Chat Admin) เพื่อให้ขึ้นงานจริงได้อย่างปลอดภัยและวัดผลได้

---

## 1) เป้าหมายภายใน 30 วัน

- เข้าใจภาพรวมสถาปัตยกรรมและกระบวนการ deploy
- ใช้งานระบบ admin/live chat ได้ถูกต้องตาม SOP
- รับ incident พื้นฐานได้ตาม runbook
- ทำ release ขนาดเล็กผ่าน staging -> production ได้ 1 ครั้ง
- ส่งมอบเอกสาร/งานด้วยมาตรฐานทีม

---

## 2) เอกสารที่ต้องอ่าน (ตามลำดับ)

1. `README.md`
2. `DOCS_INDEX_TH.md`
3. `ARCHITECTURE.md`
4. `DEPLOYMENT_MANUAL_TH.md`
5. `OPERATIONS_SOP_TH.md`
6. `RUNBOOK_INCIDENT_TH.md`
7. `SECURITY_BASELINE_TH.md`
8. `RELEASE_NOTE_TEMPLATE_TH.md`
9. `POSTMORTEM_TEMPLATE_TH.md`
10. `CHECKLIST_DAILY_TH.md`

---

## 3) โครงแผน 30 วันแบบรายสัปดาห์

## Week 1 (Day 1-7): Foundation + Access

เป้าหมาย:
- เข้าใจระบบ end-to-end
- ได้รับสิทธิ์ที่จำเป็น
- ใช้งาน dashboard/chat/settings ขั้นพื้นฐาน

งานหลัก:
- Day 1
  - รับ onboarding account + access checklist
  - อ่านเอกสาร core 3 ฉบับแรก
  - เดินระบบผ่าน demo flow
- Day 2
  - เข้าใจโครงสร้างไฟล์ backend/frontend
  - เรียนรู้ schema sheets และความสัมพันธ์ข้อมูล
- Day 3
  - ทดลอง deploy บน staging (คู่กับพี่เลี้ยง)
  - รัน `setupInitialize()` และตรวจ schema
- Day 4
  - ทดลองใช้ live chat 3 คอลัมน์ครบ flow
  - ทดสอบ send text/file/sticker และ toggle mode
- Day 5
  - ฝึกตรวจ connection tests / logs
  - อ่าน incident runbook รอบแรก
- Day 6
  - shadow การทำงานจริงของ agent/ops
- Day 7
  - recap + mini assessment

Deliverables:
- อ่านเอกสารครบตาม target
- ผ่านระบบ staging ด้วยตัวเอง 1 รอบ (มีพี่เลี้ยงกำกับ)
- ส่ง note สรุปสิ่งที่เข้าใจ + คำถามค้าง

## Week 2 (Day 8-14): Operations + Quality

เป้าหมาย:
- ทำงานประจำวันตาม SOP ได้
- เข้าใจการวัด KPI และคุณภาพบริการ

งานหลัก:
- Day 8-9
  - ใช้ `CHECKLIST_DAILY_TH.md` จริงในกะ
  - ทำ handover template ให้ครบ
- Day 10
  - ฝึก triage ห้องแชตค้าง
  - ฝึกกำหนด tag/note/assignment
- Day 11
  - ฝึก intent test console และปรับ keyword
- Day 12
  - ฝึก rich menu workflow บน staging
- Day 13
  - ฝึกสื่อสาร incident mock (table-top)
- Day 14
  - review คุณภาพงานกับ mentor

Deliverables:
- Daily checklist ครบอย่างน้อย 3 วัน
- Handover อย่างน้อย 2 ชุด
- ข้อเสนอปรับ intent/response อย่างน้อย 3 รายการ

## Week 3 (Day 15-21): Controlled Ownership

เป้าหมาย:
- รับผิดชอบงานจริง scope จำกัด
- เริ่มปล่อยงานเล็กได้

งานหลัก:
- Day 15-16
  - รับ owner งาน routine 1 โมดูล (เช่น histories/settings checks)
- Day 17
  - ทำ change เล็กบน staging พร้อม release note draft
- Day 18
  - นำเสนอ risk + rollback plan
- Day 19
  - ทำ production shadow release (ร่วมกับ release manager)
- Day 20
  - ฝึกทำ RCA จาก incident เก่า 1 เคส
- Day 21
  - assessment กลางแผน

Deliverables:
- Release note draft 1 ชุด
- Rollback plan 1 ชุด
- RCA แบบฝึกหัด 1 ชุด

## Week 4 (Day 22-30): Independent Readiness

เป้าหมาย:
- พร้อมรับงานจริงโดยมี guardrails
- ส่งมอบเอกสารและงานได้ตามมาตรฐาน

งานหลัก:
- Day 22-24
  - รับผิดชอบกะจริงแบบ monitored
- Day 25
  - ทำ release ขนาดเล็ก (low-risk) จาก staging -> production
- Day 26
  - monitor หลัง deploy และสรุปผล
- Day 27
  - ทำ security checklist review
- Day 28
  - drill incident แบบจำลอง (SEV-2)
- Day 29
  - สรุป knowledge transfer ต่อทีม
- Day 30
  - final assessment + sign-off

Deliverables:
- release จริง 1 ครั้ง (low-risk)
- post-release report 1 ชุด
- final onboarding report + development plan 60 วันถัดไป

---

## 4) Matrix ทักษะที่ต้องผ่าน

| Skill | ระดับเป้าหมาย Day 30 | วิธีประเมิน |
|---|---|---|
| ระบบภาพรวม (Architecture) | อธิบาย flow ได้ครบ | oral review |
| Deploy Staging/Prod | ทำได้ตาม checklist | live exercise |
| Live Chat Operations | ทำกะได้ตาม SLA | shift observation |
| Incident Handling | ทำตาม runbook ได้ | simulation |
| Security Baseline | ทำ checklist ได้ครบ | monthly checklist drill |
| Documentation | เขียน release/handover ได้ | doc review |

ระดับความพร้อม:
- L1: เข้าใจทฤษฎี
- L2: ทำได้เมื่อมี mentor
- L3: ทำเองได้ภายใต้ SOP
- L4: นำทีม/สอนคนอื่นได้

เกณฑ์ผ่าน onboarding:
- ไม่มี skill สำคัญต่ำกว่า L2
- อย่างน้อย 4 หัวข้ออยู่ที่ L3

---

## 5) Onboarding Checklist (ติ๊กใช้งานจริง)

## Access & Environment
- [ ] Google account และสิทธิ์ครบ
- [ ] เข้าถึง Apps Script / Sheets / Drive ได้
- [ ] เข้าถึง LINE Developers ที่เกี่ยวข้องได้
- [ ] เข้าถึง Telegram incident channel ได้

## Technical Baseline
- [ ] รัน deploy staging ได้
- [ ] รัน setup functions ได้
- [ ] ทดสอบ webhook route ได้
- [ ] อ่าน logs และแปล error พื้นฐานได้

## Operations Readiness
- [ ] ทำ daily checklist ครบตามกะ
- [ ] ทำ handover ได้มาตรฐาน
- [ ] รับเคส live chat ได้ตาม SLA
- [ ] รู้เงื่อนไข escalation ชัดเจน

## Security & Compliance
- [ ] เข้าใจ policy เรื่อง secrets
- [ ] เข้าใจ RBAC และ offboarding
- [ ] ทำ security checklist รายเดือนเป็น

---

## 6) Risk ที่พบบ่อยช่วง Onboarding และวิธีลดความเสี่ยง

1. สิทธิ์ไม่ครบ ทำให้แก้ปัญหาหน้างานช้า
- วิธีลด: เตรียม access checklist day 1 และ verify day 2

2. เข้าใจ process release ไม่ครบ
- วิธีลด: บังคับทำ release dry-run บน staging

3. ไม่มั่นใจ incident flow
- วิธีลด: tabletop drill อย่างน้อย 2 ครั้งใน 30 วัน

4. เอกสารไม่อัปเดตตามงานจริง
- วิธีลด: review เอกสารทุกสัปดาห์พร้อม mentor

---

## 7) แบบประเมินวันสุดท้าย (Final Sign-off)

ผู้ประเมิน: ______________________
ผู้ถูกประเมิน: __________________
วันที่: __________________________

คะแนน (1-5):
- System understanding: __
- Deployment readiness: __
- Live ops readiness: __
- Incident readiness: __
- Security awareness: __
- Documentation quality: __

สรุปผล:
- [ ] ผ่าน onboarding (พร้อมขึ้นงาน)
- [ ] ผ่านแบบมีเงื่อนไข
- [ ] ยังไม่ผ่าน (ต้องขยายแผน)

Action plan ต่อ 30 วันถัดไป:
__________________________________________________
__________________________________________________

---

สิ้นสุดเอกสาร
