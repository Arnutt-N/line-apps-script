# AGENTS.md - Repo Overview

> เอกสารนี้ใช้สำหรับ agent ที่ทำงานกับ repo ปัจจุบันหลังแยกระบบหลักเดิมไปไว้ใน `gas-legacy/`

## โครงสร้างปัจจุบัน

```
line-apps-script/
├── gas-main/                    # โปรเจกต์ GAS ตัวหลักแบบ classic ที่ clone มาจากบอทเก่า
├── gas-lite/                    # โปรเจกต์ GAS แบบเบา ใช้ intent tables
├── gas-legacy/                  # ระบบหลักเดิม (live chat platform) + docs เดิม + clasp เดิม
├── cloudflare/
│   └── line-webhook-proxy/      # proxy ที่เคยทำไว้สำหรับ direct GAS webhook
└── AGENTS.md                    # เอกสารนี้
```

## หลักการทำงาน

1. อย่าคิดว่า root repo เป็น GAS project อีกต่อไป
2. ถ้าจะใช้ `clasp`, ให้เข้าโฟลเดอร์โปรเจกต์เป้าหมายก่อนเสมอ
3. ระบบหลักเดิมถูกมองเป็น `gas-legacy/` แล้ว งานใหม่ควรลงที่ `gas-main/` หรือ `gas-lite/`
4. ถ้าต้องแก้ระบบหลักเดิม ให้ทำใน `gas-legacy/`

## โปรเจกต์ที่ควรรู้

### `gas-main/`
- ใช้แนวคิดจากบอทเก่าที่เคยทำงานได้จริง
- ตอบ webhook แบบตรงไปตรงมา
- เก็บ config ใน Script Properties
- มี `README_TH.md`, `.clasp.example.json`, `src/appsscript.json`

### `gas-lite/`
- โปรเจกต์ GAS แบบเบา
- อ่านเฉพาะ `intents`, `intent_keywords`, `intent_responses`, `response_templates`
- ใช้สำหรับกรณีที่ต้องการลด latency ให้มากที่สุดบน GAS

### `gas-legacy/`
- ระบบ admin/live chat เดิมทั้งหมด
- มี `src/`, `.clasp.json`, docs ไทยเดิม, และ AGENTS เดิมอยู่ในโฟลเดอร์นี้
- ถ้าจะ push ระบบเก่า ให้ทำจากโฟลเดอร์นี้ ไม่ใช่ที่ root

## Deployment

- `gas-main/` และ `gas-lite/` ต้องมี `.clasp.json` ของตัวเอง
- `gas-legacy/.clasp.json` คือ config ของระบบเก่า
- root repo ไม่มี `.clasp.json` แล้ว เพื่อกัน `clasp` ยิงผิดโปรเจกต์

## หมายเหตุ

- `gas-lite/.clasp.json` เป็น local config ที่ยังไม่ควร commit ถ้าไม่ได้ตั้งใจ
- ถ้าเอกสารเชิงลึกเกี่ยวกับระบบเก่า ให้ดูใน `gas-legacy/`
