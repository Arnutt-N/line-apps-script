# line-apps-script

repo นี้ถูกแยกเป็นหลายโปรเจกต์แล้ว

## โฟลเดอร์หลัก

- `gas-main/` ระบบ webhook ตัวหลักที่อิงจากบอทเก่าที่ใช้งานได้จริง
- `gas-lite/` ระบบ webhook แบบเบา อ่าน intent จากชีตโดยตรง
- `gas-legacy/` ระบบหลักเดิมแบบ full platform ที่เก็บไว้เป็น legacy
- `cloudflare/line-webhook-proxy/` proxy ที่เคยทำไว้สำหรับ direct GAS webhook

## การใช้งาน

- ถ้าจะ deploy งานใหม่ ให้เริ่มจาก `gas-main/` หรือ `gas-lite/`
- ถ้าจะอ้างอิงระบบเดิม ให้เข้า `gas-legacy/`
- root repo ไม่มี `.clasp.json` แล้ว ต้องเข้าโฟลเดอร์โปรเจกต์ก่อนค่อยใช้ `clasp`
