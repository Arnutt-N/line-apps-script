# Cloudflare Webhook Proxy สำหรับ LINE OA Platform

คู่มือนี้ใช้แก้ปัญหา LINE Verify webhook แล้วได้ `302 Found` จาก Google Apps Script Web App โดยวาง Cloudflare Worker ไว้หน้า GAS

---

## 1) ภาพรวม

แนวทางนี้ทำงานดังนี้:

1. LINE ส่ง webhook มาที่ Cloudflare Worker
2. Worker ตรวจ `X-Line-Signature` ด้วย `LINE_CHANNEL_SECRET`
3. Worker ใส่ `proxyToken` เพิ่มใน body แล้ว forward ต่อเข้า GAS
4. GAS รับเฉพาะ request ที่มี `proxyToken` ตรงกับ `WEBHOOK_PROXY_SHARED_SECRET`

ผลลัพธ์:
- LINE จะเห็น response จาก Worker แทน redirect ของ GAS
- GAS จะไม่รับ direct webhook ที่ไม่มี shared secret จาก proxy
- ไม่ต้องพึ่ง query string ระหว่าง redirect ของ Apps Script

---

## 2) ไฟล์ที่เพิ่มใน repo

- `cloudflare/line-webhook-proxy/src/index.js`
- `cloudflare/line-webhook-proxy/wrangler.jsonc`
- `cloudflare/line-webhook-proxy/package.json`
- `cloudflare/line-webhook-proxy/.dev.vars.example`

ฝั่ง GAS มีการเพิ่มรองรับ:
- Script Property `WEBHOOK_PROXY_SHARED_SECRET`
- ตรวจ `proxyToken` ใน body ก่อนประมวลผล webhook

---

## 3) ค่าที่ต้องตั้ง

### 3.1 Google Apps Script Script Properties

ต้องมีค่าปกติเดิมทั้งหมด และเพิ่ม:

- `WEBHOOK_PROXY_SHARED_SECRET`
  - เป็น secret แบบสุ่ม
  - ใช้ค่าเดียวกับ `GAS_PROXY_TOKEN` ฝั่ง Worker

ค่าที่แนะนำเมื่อใช้ proxy:

- `LINE_REQUIRE_SIGNATURE=false`
  - ให้ Worker เป็นคน verify signature แทน

### 3.2 Cloudflare Worker Secrets

ตั้ง secret เหล่านี้ใน Worker:

- `LINE_CHANNEL_SECRET`
- `GAS_WEBHOOK_URL`
  - ใช้ URL ของ GAS Web App แบบ `.../exec`
  - ไม่จำเป็นต้องใส่ `?route=webhook`
- `GAS_PROXY_TOKEN`
  - ต้องตรงกับ `WEBHOOK_PROXY_SHARED_SECRET` ใน GAS

---

## 4) ขั้นตอน deploy Worker

จาก root ของ repo:

```bash
cd cloudflare/line-webhook-proxy
npm install
npx wrangler login
```

ตั้ง secrets:

```bash
npx wrangler secret put LINE_CHANNEL_SECRET
npx wrangler secret put GAS_WEBHOOK_URL
npx wrangler secret put GAS_PROXY_TOKEN
```

deploy:

```bash
npx wrangler deploy
```

หลัง deploy สำเร็จจะได้ URL ประมาณ:

`https://line-oa-webhook-proxy.<subdomain>.workers.dev`

Webhook endpoint ที่ใช้กับ LINE คือ:

`https://line-oa-webhook-proxy.<subdomain>.workers.dev/webhook`

---

## 5) วิธีตั้งค่าฝั่ง LINE Developers

1. ไปที่ LINE Developers Console
2. เปิด Messaging API ของ channel
3. เปลี่ยน Webhook URL จาก GAS URL ไปเป็น Worker URL:
   - `https://<your-worker>.workers.dev/webhook`
4. กด Verify
5. เปิด Use webhook

---

## 6) วิธีตรวจสอบหลังตั้งค่า

### 6.1 ตรวจ health ของ Worker

เปิด:

`https://<your-worker>.workers.dev/health`

ควรได้ JSON ที่มีค่า `ok: true`

### 6.2 ทดสอบ Verify ใน LINE

ถ้า config ถูก:
- LINE Verify ควรได้ `200`
- ไม่ควรขึ้น `302 Found`

### 6.3 ทดสอบ direct hit ไป GAS

ถ้าตั้ง `WEBHOOK_PROXY_SHARED_SECRET` แล้ว:
- request ที่ยิงเข้า GAS ตรงๆ โดยไม่มี `proxyToken` จะถูกปฏิเสธ

---

## 7) Local development

สร้างไฟล์ `.dev.vars` จากตัวอย่าง:

```bash
copy .dev.vars.example .dev.vars
```

แล้วรัน:

```bash
npx wrangler dev
```

---

## 8) Rollback

ถ้าต้อง rollback ชั่วคราว:

1. เปลี่ยน Webhook URL ใน LINE กลับไปที่ GAS เดิม
2. ลบหรือเคลียร์ `WEBHOOK_PROXY_SHARED_SECRET` ใน GAS ถ้าต้องการให้ direct GAS รับ webhook ได้อีกครั้ง

---

## 9) หมายเหตุด้านความปลอดภัย

- ห้าม commit ค่า secret ลง repo
- `WEBHOOK_PROXY_SHARED_SECRET` และ `GAS_PROXY_TOKEN` ต้องเป็นค่าที่เดายาก
- ถ้าเปลี่ยน secret ฝั่งใดฝั่งหนึ่ง ต้องเปลี่ยนอีกฝั่งให้ตรงกันทันที
- หากใช้ custom domain บน Cloudflare สามารถชี้ webhook ไปที่โดเมนนั้นแทน `workers.dev` ได้

---

สิ้นสุดเอกสาร
