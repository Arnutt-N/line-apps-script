# DOCS INDEX (ภาษาไทย) - LINE OA Platform

ศูนย์กลางเอกสารสำหรับโปรเจกต์นี้ เพื่อให้ทีมค้นหาเอกสารที่ถูกต้องได้เร็ว และใช้ตามลำดับงานจริง

---

## 1) แผนที่เอกสารทั้งหมด

| เอกสาร | วัตถุประสงค์ | ใช้เมื่อไร |
|---|---|---|
| `README.md` | คู่มือเริ่มต้นอย่างเร็ว | เริ่มใช้งานครั้งแรก |
| `ARCHITECTURE.md` | ภาพรวมสถาปัตยกรรมและโครงสร้างไฟล์ | วิเคราะห์ระบบ/ผลกระทบงานพัฒนา |
| `DOCS_INDEX_TH.md` | สารบัญเอกสารกลาง | ใช้หาเอกสารอย่างรวดเร็ว |
| `DOCS_CHANGELOG_TH.md` | ประวัติการเปลี่ยนแปลงเอกสารทั้งหมด | ใช้ audit/doc governance |
| `DEPLOYMENT_MANUAL_TH.md` | คู่มือ deploy แบบละเอียด end-to-end | ตั้งระบบครั้งแรกหรือย้ายระบบ |
| `CLOUDFLARE_WEBHOOK_PROXY_TH.md` | คู่มือใช้ Cloudflare Worker เป็น webhook proxy หน้า GAS | เมื่อ LINE verify webhook ไม่ผ่านเพราะ `302 Found` |
| `DEPLOYMENT_STAGING_TH.md` | ขั้นตอน staging -> production | ทุก release ที่ขึ้น production |
| `OPERATIONS_SOP_TH.md` | SOP งานประจำของทีมปฏิบัติการ | ใช้งานรายวันของ ops/support |
| `CHECKLIST_DAILY_TH.md` | เช็กลิสต์หน้างานรายกะ | ใช้ในแต่ละกะจริง |
| `SOP_PRINT_PACK_TH.md` | SOP แบบย่อสำหรับพิมพ์ใช้งานหน้างาน | แปะหน้าจอ/โต๊ะปฏิบัติการ |
| `ROLE_BASED_CHECKLISTS_TH.md` | Checklist แยกตามบทบาทงาน | ใช้กำกับคุณภาพรายบทบาท |
| `KPI_DASHBOARD_GUIDE_TH.md` | คู่มืออ่าน KPI และ threshold/action | ใช้ review dashboard รายวัน/สัปดาห์ |
| `RUNBOOK_INCIDENT_TH.md` | ขั้นตอนรับมือเหตุขัดข้อง | เมื่อเกิด incident |
| `SECURITY_BASELINE_TH.md` | มาตรฐานความปลอดภัยขั้นต่ำ | ก่อน go-live และ review รายเดือน |
| `RELEASE_NOTE_TEMPLATE_TH.md` | เทมเพลต release note | ก่อน-หลัง deploy ทุกเวอร์ชัน |
| `POSTMORTEM_TEMPLATE_TH.md` | เทมเพลต RCA/postmortem | หลัง incident ทุกครั้ง |
| `ONBOARDING_30_DAYS_TH.md` | แผน onboarding ทีมใหม่ 30 วัน | เริ่มงานสมาชิกใหม่ |
| `TRAINING_PLAN_CHAT_AGENT_TH.md` | แผนฝึกเฉพาะบทบาท chat agent | ฝึกและประเมิน agent |

---

## 2) ลำดับการอ่านที่แนะนำ

## 2.1 สำหรับผู้เริ่มต้นระบบใหม่
1. `README.md`
2. `DOCS_INDEX_TH.md`
3. `ARCHITECTURE.md`
4. `DEPLOYMENT_MANUAL_TH.md`
5. `CLOUDFLARE_WEBHOOK_PROXY_TH.md` (ถ้าใช้ LINE webhook ผ่าน proxy)
6. `SECURITY_BASELINE_TH.md`

## 2.2 สำหรับทีมปล่อยงาน (Release Team)
1. `DEPLOYMENT_STAGING_TH.md`
2. `RELEASE_NOTE_TEMPLATE_TH.md`
3. `RUNBOOK_INCIDENT_TH.md`
4. `POSTMORTEM_TEMPLATE_TH.md`

## 2.3 สำหรับทีมปฏิบัติการรายวัน (Ops/Support)
1. `OPERATIONS_SOP_TH.md`
2. `CHECKLIST_DAILY_TH.md`
3. `SOP_PRINT_PACK_TH.md`
4. `ROLE_BASED_CHECKLISTS_TH.md`
5. `KPI_DASHBOARD_GUIDE_TH.md`
6. `RUNBOOK_INCIDENT_TH.md`

## 2.4 สำหรับผู้จัดการทีมและ HR/Training
1. `ONBOARDING_30_DAYS_TH.md`
2. `TRAINING_PLAN_CHAT_AGENT_TH.md`
3. `OPERATIONS_SOP_TH.md`

---

## 3) Workflow เอกสารตามวงจรงานจริง

## 3.1 ก่อน deploy
- อ่าน `DEPLOYMENT_STAGING_TH.md`
- กรอก `RELEASE_NOTE_TEMPLATE_TH.md`
- ตรวจ security checklist จาก `SECURITY_BASELINE_TH.md`

## 3.2 ระหว่าง deploy
- ทำตามขั้นตอนใน `DEPLOYMENT_STAGING_TH.md`
- หากเกิดปัญหาใช้งาน `RUNBOOK_INCIDENT_TH.md`

## 3.3 หลัง deploy
- อัปเดต release note สถานะสุดท้าย
- ส่งมอบงานตาม `OPERATIONS_SOP_TH.md`
- ถ้าเกิด incident ให้กรอก `POSTMORTEM_TEMPLATE_TH.md`

## 3.4 งานประจำรายกะ
- ใช้ `CHECKLIST_DAILY_TH.md`
- ใช้ `SOP_PRINT_PACK_TH.md` เป็น quick card
- ใช้ `ROLE_BASED_CHECKLISTS_TH.md` เพื่อควบคุมตามบทบาท
- ใช้ `KPI_DASHBOARD_GUIDE_TH.md` เพื่อแปลผล metric และ trigger action

## 3.5 Onboarding สมาชิกใหม่
- ใช้ `ONBOARDING_30_DAYS_TH.md`
- ถ้าเป็น chat agent ใช้ `TRAINING_PLAN_CHAT_AGENT_TH.md`

---

## 4) Mapping ตามบทบาททีม

| บทบาท | เอกสารหลัก | เอกสารรอง |
|---|---|---|
| Developer | `ARCHITECTURE.md` | `DEPLOYMENT_STAGING_TH.md`, `RELEASE_NOTE_TEMPLATE_TH.md` |
| DevOps/Release Manager | `DEPLOYMENT_STAGING_TH.md` | `RUNBOOK_INCIDENT_TH.md`, `SECURITY_BASELINE_TH.md` |
| Chat Admin / Support | `OPERATIONS_SOP_TH.md` | `CHECKLIST_DAILY_TH.md`, `SOP_PRINT_PACK_TH.md`, `ROLE_BASED_CHECKLISTS_TH.md`, `KPI_DASHBOARD_GUIDE_TH.md` |
| Security / Compliance | `SECURITY_BASELINE_TH.md` | `POSTMORTEM_TEMPLATE_TH.md`, `DEPLOYMENT_MANUAL_TH.md` |
| Team Lead / Trainer | `ONBOARDING_30_DAYS_TH.md` | `TRAINING_PLAN_CHAT_AGENT_TH.md` |
| Product / Manager | `KPI_DASHBOARD_GUIDE_TH.md` | `RELEASE_NOTE_TEMPLATE_TH.md`, `POSTMORTEM_TEMPLATE_TH.md` |

---

## 5) กติกาการดูแลเอกสาร (Doc Governance)

1. ทุก release ต้องอัปเดตเอกสารที่กระทบจริง
2. หากมี endpoint/schema/setting ใหม่ ต้องอัปเดตอย่างน้อย:
   - `ARCHITECTURE.md`
   - `DEPLOYMENT_MANUAL_TH.md` (ถ้ามีขั้นตอนเพิ่ม)
3. ทุก incident ต้องมี postmortem ภายใน 72 ชั่วโมง
4. เอกสาร runbook/sop/security ต้อง review อย่างน้อยเดือนละ 1 ครั้ง
5. แผน onboarding/training ต้องทบทวนรายไตรมาส
6. ต้องบันทึกการเปลี่ยนแปลงเอกสารใน `DOCS_CHANGELOG_TH.md`

---

## 6) Quick Links

- Deploy ครั้งแรก: `DEPLOYMENT_MANUAL_TH.md`
- แก้ LINE webhook `302 Found`: `CLOUDFLARE_WEBHOOK_PROXY_TH.md`
- ปล่อยขึ้น production: `DEPLOYMENT_STAGING_TH.md`
- งานกะรายวัน: `CHECKLIST_DAILY_TH.md`
- SOP ย่อพร้อมพิมพ์: `SOP_PRINT_PACK_TH.md`
- Checklist แยกบทบาท: `ROLE_BASED_CHECKLISTS_TH.md`
- คู่มือ KPI dashboard: `KPI_DASHBOARD_GUIDE_TH.md`
- ระบบล่ม/ผิดปกติ: `RUNBOOK_INCIDENT_TH.md`
- สรุปหลัง incident: `POSTMORTEM_TEMPLATE_TH.md`
- อบรมทีมใหม่ 30 วัน: `ONBOARDING_30_DAYS_TH.md`
- ฝึก chat agent: `TRAINING_PLAN_CHAT_AGENT_TH.md`
- ประวัติเอกสาร: `DOCS_CHANGELOG_TH.md`

---

## 7) Change Log ของชุดเอกสาร

- `2026-02-19`: สร้างเอกสาร deployment/ops/security/runbook/templates
- `2026-02-19`: เพิ่ม checklist หน้างานรายวัน
- `2026-02-19`: เพิ่ม onboarding 30 วัน และ training plan chat agent
- `2026-02-19`: เพิ่ม docs changelog และ SOP print pack
- `2026-02-19`: เพิ่ม role-based checklists และ KPI dashboard guide
- `2026-04-14`: เพิ่มคู่มือ Cloudflare webhook proxy และอัปเดต docs ที่เกี่ยวข้อง

---

สิ้นสุดเอกสาร
