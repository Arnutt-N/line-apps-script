# ROLE BASED CHECKLISTS (ภาษาไทย) - LINE OA Platform

เอกสารนี้รวม checklist แยกตามบทบาท เพื่อให้แต่ละทีมทำงานตรงหน้าที่และส่งมอบได้ชัดเจน

---

## 1) Chat Agent Checklist

## ก่อนเริ่มกะ
- [ ] เปิด `?page=dashboard` เช็กภาพรวม
- [ ] เปิด `?page=chat` ดูคิวค้างและ unread สูง
- [ ] อ่าน handover จากกะก่อน
- [ ] ตรวจว่าระบบแจ้งเตือนทำงาน (toast/sound)

## ระหว่างกะ
- [ ] รับเคสตาม priority (manual request ก่อน)
- [ ] ทุกเคสที่รับเองสลับเป็น `manual`
- [ ] เพิ่ม note/tag สำหรับเคสสำคัญ
- [ ] แจ้ง ETA ลูกค้าเมื่อยังปิดเคสไม่ได้
- [ ] ทำ escalation ทันทีเมื่อเข้า trigger

## ก่อนจบกะ
- [ ] สรุป open cases
- [ ] ระบุ owner ต่อและ ETA
- [ ] ส่ง handover ตาม template
- [ ] ยืนยันไม่มีเคส critical ค้างโดยไม่แจ้ง

---

## 2) Ops Lead Checklist

## ต้นกะ
- [ ] ตรวจ `settings.testConnection(all)`
- [ ] ตรวจ dashboard KPI และ alert channel
- [ ] ตรวจ failed items ใน `job_queue`
- [ ] ยืนยัน staffing เพียงพอสำหรับ SLA

## ระหว่างกะ
- [ ] review SLA และ first response time ทุก 60 นาที
- [ ] คุมคุณภาพการตอบของ agent (sample review)
- [ ] ตรวจ incident trigger และสั่ง escalation
- [ ] อนุมัติการเปลี่ยน settings สำคัญตาม policy

## ปิดกะ
- [ ] สรุป health status ระบบ
- [ ] สรุปความเสี่ยงที่ต้องเฝ้าระวังต่อ
- [ ] ส่ง handover ให้ Ops Lead กะถัดไป

---

## 3) Release Manager Checklist

## ก่อนปล่อยงาน
- [ ] release note draft เสร็จ (`RELEASE_NOTE_TEMPLATE_TH.md`)
- [ ] staging deploy ผ่าน
- [ ] smoke test ผ่านครบตาม checklist
- [ ] rollback plan พร้อมและมี owner
- [ ] security checklist ผ่าน

## ระหว่างปล่อย
- [ ] deploy ตามลำดับใน `DEPLOYMENT_STAGING_TH.md`
- [ ] monitor logs แบบ real-time
- [ ] บันทึกเวลาเริ่ม/จบแต่ละขั้นตอน

## หลังปล่อย
- [ ] post-deploy smoke test ผ่าน
- [ ] ประกาศ release complete
- [ ] เฝ้าระวังอย่างน้อย 60 นาที
- [ ] ปิด release note พร้อม known issues

---

## 4) Security Reviewer Checklist

## รายสัปดาห์
- [ ] ตรวจ `admin_users` และ role drift
- [ ] ตรวจ permissions ที่เพิ่มใหม่ผิดปกติ
- [ ] ตรวจการใช้งาน secrets policy

## รายเดือน
- [ ] review `SECURITY_BASELINE_TH.md`
- [ ] ทบทวน token rotation status
- [ ] ตรวจไฟล์สาธารณะใน Drive
- [ ] ตรวจ incident ด้าน security ย้อนหลัง

## ก่อน Go-live release สำคัญ
- [ ] `LINE_REQUIRE_SIGNATURE=true` ใน production
- [ ] ไม่มี hardcoded secret ในโค้ด
- [ ] audit logging ยังทำงานปกติ
- [ ] rollback path ได้รับการทดสอบ

---

## 5) Incident Commander Checklist

## เมื่อเปิด incident
- [ ] กำหนด Severity และ owner roles
- [ ] เปิดช่องทางสื่อสาร incident
- [ ] ระบุ impact และ mitigation แรก

## ระหว่าง incident
- [ ] อัปเดตสถานะตามรอบเวลา
- [ ] ตัดสินใจ rollback/mitigation ตามข้อมูลจริง
- [ ] บันทึก timeline สำคัญ

## หลัง incident
- [ ] ยืนยันระบบกลับมาปกติ
- [ ] เริ่ม postmortem ภายใน 24 ชั่วโมง
- [ ] assign corrective/preventive actions

---

## 6) เอกสารอ้างอิงที่ต้องใช้ร่วม

- `OPERATIONS_SOP_TH.md`
- `CHECKLIST_DAILY_TH.md`
- `SOP_PRINT_PACK_TH.md`
- `DEPLOYMENT_STAGING_TH.md`
- `RUNBOOK_INCIDENT_TH.md`
- `SECURITY_BASELINE_TH.md`

---

สิ้นสุดเอกสาร
