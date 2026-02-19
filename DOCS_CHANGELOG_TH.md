# DOCS CHANGELOG (ภาษาไทย) - LINE OA Platform

เอกสารนี้ใช้ติดตามประวัติการเปลี่ยนแปลงของเอกสารทั้งหมดในโปรเจกต์ เพื่อให้ audit ได้ว่าใครเพิ่ม/แก้อะไร เมื่อไร และทำไม

---

## 1) วิธีใช้งาน

1. ทุกครั้งที่แก้เอกสาร ให้เพิ่มรายการใหม่ด้านบนสุดของหัวข้อ `2) บันทึกการเปลี่ยนแปลง`
2. ระบุไฟล์ที่แก้ให้ครบ
3. ระบุเหตุผลการเปลี่ยนแปลงแบบสั้นและชัดเจน
4. ถ้าเป็นการแก้เพื่อ incident/release ให้ใส่ reference ID

รูปแบบวันที่ที่แนะนำ: `YYYY-MM-DD`

---

## 2) บันทึกการเปลี่ยนแปลง

| วันที่ | ผู้แก้ | ไฟล์ที่แก้ | ประเภท | สรุปการเปลี่ยนแปลง | Reference |
|---|---|---|---|---|---|
| 2026-02-19 | codex | `ROLE_BASED_CHECKLISTS_TH.md` | Added | เพิ่ม checklist แยกตามบทบาท Agent/OpsLead/Release/Security/IC | - |
| 2026-02-19 | codex | `KPI_DASHBOARD_GUIDE_TH.md` | Added | เพิ่มคู่มืออ่าน KPI dashboard พร้อม threshold และ action playbook | - |
| 2026-02-19 | codex | `DOCS_INDEX_TH.md` | Updated | เพิ่มลิงก์และ workflow สำหรับ role checklists และ KPI guide | - |
| 2026-02-19 | codex | `DOCS_CHANGELOG_TH.md` | Updated | บันทึกรายการเอกสารล่าสุดและปรับตาราง changelog | - |
| 2026-02-19 | codex | `README.md` | Updated | เพิ่มลิงก์เอกสารใหม่ในหมวด Documentation | - |
| 2026-02-19 | codex | `DOCS_INDEX_TH.md` | Updated | เพิ่มรายการเอกสารใหม่และปรับ mapping/workflow ให้ครอบคลุม print pack/changelog | - |
| 2026-02-19 | codex | `README.md` | Updated | อัปเดตลิงก์ documentation ให้ครอบคลุมเอกสารใหม่ทั้งหมด | - |
| 2026-02-19 | codex | `DOCS_CHANGELOG_TH.md` | Updated | ปรับตาราง changelog และบันทึกรายการล่าสุด | - |
| 2026-02-19 | codex | `SOP_PRINT_PACK_TH.md` | Added | เพิ่ม SOP เวอร์ชันย่อพร้อมพิมพ์สำหรับหน้างาน | - |
| 2026-02-19 | codex | `DOCS_CHANGELOG_TH.md` | Added | สร้างเอกสารติดตามการเปลี่ยนแปลงเอกสารทั้งระบบ | - |
| 2026-02-19 | codex | `ONBOARDING_30_DAYS_TH.md` | Added | เพิ่มแผน onboarding 30 วันสำหรับทีมใหม่ | - |
| 2026-02-19 | codex | `TRAINING_PLAN_CHAT_AGENT_TH.md` | Added | เพิ่มแผนฝึกเฉพาะบทบาท chat agent | - |
| 2026-02-19 | codex | `CHECKLIST_DAILY_TH.md` | Added | เพิ่มเช็กลิสต์รายกะสำหรับงานปฏิบัติการ | - |
| 2026-02-19 | codex | `DEPLOYMENT_MANUAL_TH.md` | Added | เพิ่มคู่มือ deploy แบบละเอียด end-to-end | - |
| 2026-02-19 | codex | `DEPLOYMENT_STAGING_TH.md` | Added | เพิ่มคู่มือปล่อยงาน staging -> production | - |
| 2026-02-19 | codex | `RUNBOOK_INCIDENT_TH.md` | Added | เพิ่ม runbook รับมือเหตุขัดข้อง | - |
| 2026-02-19 | codex | `OPERATIONS_SOP_TH.md` | Added | เพิ่ม SOP งานประจำของทีม ops/support | - |
| 2026-02-19 | codex | `SECURITY_BASELINE_TH.md` | Added | เพิ่ม baseline ด้านความปลอดภัย production | - |
| 2026-02-19 | codex | `RELEASE_NOTE_TEMPLATE_TH.md` | Added | เพิ่มเทมเพลต release note มาตรฐาน | - |
| 2026-02-19 | codex | `POSTMORTEM_TEMPLATE_TH.md` | Added | เพิ่มเทมเพลต postmortem/RCA มาตรฐาน | - |

---

## 3) ประเภทการเปลี่ยนแปลง (Type)

- `Added`: เพิ่มเอกสารใหม่
- `Updated`: ปรับเนื้อหาเอกสารเดิม
- `Fixed`: แก้คำผิด/แก้ลิงก์/แก้รูปแบบ
- `Deprecated`: เลิกใช้งานเอกสาร
- `Removed`: ลบเอกสารออก

---

## 4) กฎคุณภาพเอกสาร (Doc Quality Gate)

ก่อนปิดงานเอกสารทุกครั้ง:
- [ ] ชื่อไฟล์สื่อความหมายชัด
- [ ] มีวัตถุประสงค์และขอบเขต
- [ ] มีขั้นตอนหรือ checklist ที่นำไปใช้ได้จริง
- [ ] ลิงก์ไปเอกสารที่เกี่ยวข้องครบ
- [ ] อัปเดต `DOCS_INDEX_TH.md` และ `README.md` แล้ว
- [ ] เพิ่มรายการใน `DOCS_CHANGELOG_TH.md` แล้ว

---

## 5) รายการเอกสารที่ active ปัจจุบัน

- `README.md`
- `ARCHITECTURE.md`
- `DOCS_INDEX_TH.md`
- `DOCS_CHANGELOG_TH.md`
- `DEPLOYMENT_MANUAL_TH.md`
- `DEPLOYMENT_STAGING_TH.md`
- `OPERATIONS_SOP_TH.md`
- `CHECKLIST_DAILY_TH.md`
- `SOP_PRINT_PACK_TH.md`
- `ROLE_BASED_CHECKLISTS_TH.md`
- `KPI_DASHBOARD_GUIDE_TH.md`
- `RUNBOOK_INCIDENT_TH.md`
- `SECURITY_BASELINE_TH.md`
- `RELEASE_NOTE_TEMPLATE_TH.md`
- `POSTMORTEM_TEMPLATE_TH.md`
- `ONBOARDING_30_DAYS_TH.md`
- `TRAINING_PLAN_CHAT_AGENT_TH.md`

---

สิ้นสุดเอกสาร
