# SECURITY BASELINE (ภาษาไทย) - LINE OA Platform

เอกสารนี้กำหนดมาตรฐานความปลอดภัยขั้นต่ำ (minimum security baseline) สำหรับการใช้งานจริง

---

## 1) วัตถุประสงค์

- ป้องกันข้อมูลรั่วไหลและการเข้าถึงโดยไม่ได้รับอนุญาต
- ลดความเสี่ยงจากการตั้งค่าผิด
- สร้างแนวทาง audit ที่ชัดเจน

---

## 2) ขอบเขต

ครอบคลุม:
- Google Apps Script
- Google Sheets/Drive
- LINE API integration
- Telegram integration
- Admin authentication และ RBAC
- Logging, incident response, data retention

---

## 3) Security Principles

- Least privilege
- Need-to-know
- Defense in depth
- Secure by default
- Auditability

---

## 4) Identity and Access Control

## 4.1 Admin Authentication
- ใช้ Google account เท่านั้น
- อนุญาตเฉพาะอีเมลที่อยู่ใน `admin_users`
- `status` ต้องเป็น `active`

## 4.2 RBAC
- ใช้ roles ที่กำหนด (`owner/admin/agent/viewer`)
- Permission changes ต้องมี ticket และ audit log
- ห้ามใช้ role owner สำหรับงานประจำวัน

## 4.3 Offboarding
- ปิดบัญชีทันทีเมื่อพนักงานออก
- ตรวจ role drift รายสัปดาห์

---

## 5) Secrets Management

## 5.1 แหล่งเก็บความลับ
- เก็บ token/secret ใน Script Properties เท่านั้น
- ห้ามเก็บ secret ใน Google Sheet, source code, หรือ chat

## 5.2 Secret Rotation Policy
- LINE token/secret: ทุก 90 วัน หรือเมื่อสงสัยรั่วไหล
- Telegram token: ทุก 90 วัน
- บันทึกวันเปลี่ยน secret ใน change log

## 5.3 Secret Access
- จำกัดสิทธิ์คนที่เข้าถึง Apps Script project settings
- แยก staging/prod secrets อย่างเด็ดขาด

---

## 6) Webhook and API Security

## 6.1 LINE Webhook
- ต้องเปิด `LINE_REQUIRE_SIGNATURE=true` ใน production
- ตรวจสอบ `x-line-signature` ทุกครั้ง

## 6.2 Input Validation
- sanitize ข้อความและ payload ก่อนเก็บ/ประมวลผล
- จำกัดขนาด payload/file ตาม policy

## 6.3 Rate Limiting (เชิงนโยบาย)
- ตั้งค่า `rate_limit_per_minute`
- monitor คำขอผิดปกติ

---

## 7) Data Protection

## 7.1 Data Classification (แนะนำ)
- Public: template ทั่วไป
- Internal: metrics, non-sensitive logs
- Confidential: user profile, chat history, tokens

## 7.2 Encryption
- ใช้ transport encryption (HTTPS) ตาม Google/LINE โดย default
- ห้าม export confidential data ไปช่องทางไม่เข้ารหัส

## 7.3 Data Minimization
- เก็บเฉพาะข้อมูลจำเป็นต่อธุรกิจ
- ลดการเก็บ PII ที่ไม่ใช้จริง

## 7.4 Retention
- กำหนด `retention_days_chat` ตามข้อกำหนดองค์กร/กฎหมาย
- archive และ purge ตาม schedule

---

## 8) Google Drive Security

- พิจารณา `DRIVE_PUBLIC_SHARING` ให้เหมาะกับนโยบายองค์กร
- ถ้าเปิด public sharing ต้องจำกัดประเภทไฟล์ที่อนุญาต
- ตรวจไฟล์สาธารณะรายสัปดาห์
- ห้ามอัปโหลดไฟล์ที่มีข้อมูลอ่อนไหวโดยไม่ป้องกัน

---

## 9) Logging and Audit

ต้องเก็บอย่างน้อย:
- `audit_logs` สำหรับการเปลี่ยนแปลงสำคัญ
- webhook failures
- LINE API failures
- admin permission changes

นโยบาย:
- log ต้องอ่านย้อนหลังได้
- ห้ามลบ audit logs โดยไม่มีอนุมัติ
- review logs รายวัน (ขั้นต่ำ)

---

## 10) Monitoring and Alerting

ขั้นต่ำที่ต้องมี:
- แจ้งเตือนเมื่อ webhook error rate สูง
- แจ้งเตือนเมื่อ send message failure สูงผิดปกติ
- แจ้งเตือนเมื่อ connection test ไม่ผ่าน
- แจ้งเตือน incident ผ่าน Telegram channel ทีมปฏิบัติการ

---

## 11) Backup, Restore, and BCP

## 11.1 Backup
- Spreadsheet backup รายวัน
- Drive folder backup รายสัปดาห์
- source code backup ผ่าน Git

## 11.2 Restore Drill
- ทดสอบ restore รายเดือน
- บันทึกเวลา recovery และ pain points

## 11.3 Business Continuity
- มี runbook และ on-call ครอบคลุม 24/7 ตามระดับธุรกิจ

---

## 12) Vulnerability and Patch Management

- ทบทวน dependency/CDN ที่ใช้งานทุกเดือน
- ตรวจ policy และ security headers อย่างสม่ำเสมอ
- เมื่อพบช่องโหว่ร้ายแรง:
  - เปิด incident ทันที
  - mitigate ชั่วคราว
  - deploy patch

---

## 13) Incident Response Security

เมื่อสงสัย security incident:

1. เปิด SEV-1 incident ทันที
2. Freeze การเปลี่ยนแปลงที่ไม่จำเป็น
3. หมุน secrets ที่เกี่ยวข้อง
4. ตรวจ audit trail ย้อนหลัง
5. ประเมินขอบเขตผลกระทบข้อมูล
6. แจ้งผู้เกี่ยวข้องตาม policy
7. สรุป RCA และ hardening actions

---

## 14) Compliance and Privacy (แนวทางทั่วไป)

- ระบุฐานกฎหมายการเก็บข้อมูลส่วนบุคคล
- มี privacy notice ชัดเจน
- รองรับคำขอลบข้อมูลตาม policy
- จำกัดสิทธิ์เข้าถึงข้อมูลลูกค้าเฉพาะผู้จำเป็น

---

## 15) Security Checklist ก่อน Go-live

- [ ] Production แยกจาก staging ชัดเจน
- [ ] `LINE_REQUIRE_SIGNATURE=true`
- [ ] Secrets อยู่ใน Script Properties เท่านั้น
- [ ] Admin RBAC ตรวจครบ
- [ ] Backup policy เปิดใช้งาน
- [ ] Incident runbook พร้อมใช้งาน
- [ ] Audit logs ทำงาน
- [ ] Retention policy ถูกกำหนด
- [ ] ปิดสิทธิ์ที่ไม่จำเป็นทั้งหมด

---

## 16) Security Checklist รายเดือน

- [ ] rotate tokens ตามรอบ
- [ ] review admin accounts และ roles
- [ ] review public files ใน Drive
- [ ] review failed login/unauthorized attempts
- [ ] review incident/action items ที่ค้าง

---

## 17) ข้อห้ามสำคัญ

- ห้าม push secrets ขึ้น repository
- ห้ามใช้ production token ใน staging
- ห้ามแจก URL/ข้อมูลลูกค้านอกทีม
- ห้าม bypass approval process สำหรับสิทธิ์ owner

---

## 18) เอกสารที่ต้องใช้อ้างอิงร่วม

- `DEPLOYMENT_MANUAL_TH.md`
- `DEPLOYMENT_STAGING_TH.md`
- `RUNBOOK_INCIDENT_TH.md`
- `OPERATIONS_SOP_TH.md`

---

สิ้นสุดเอกสาร
