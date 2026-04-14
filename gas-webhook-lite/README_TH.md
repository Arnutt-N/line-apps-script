# GAS Webhook Lite

โปรเจกต์นี้เป็น Apps Script คนละตัวกับระบบ admin/live chat หลัก ใช้สำหรับตอบ LINE webhook แบบเบาและเร็วที่สุดเท่าที่ทำได้บน GAS

แนวคิด:
- รับ webhook
- match intent จาก Google Sheets
- reply กลับ LINE
- append log แบบบางที่สุดลงชีตเดียว

ไม่ทำใน path นี้:
- RBAC
- live chat rooms/messages แบบเต็มระบบ
- rich menu / LIFF / dashboard
- write หลายตารางต่อข้อความ

## โครงสร้าง

- `src/Code.gs`
- `src/appsscript.json`
- `.clasp.example.json`

## Script Properties ที่ต้องใช้

จำเป็น:
- `SPREADSHEET_ID`
- `LINE_CHANNEL_ACCESS_TOKEN`

แนะนำ:
- `LINE_REQUIRE_SIGNATURE=false`

ตัวเลือก:
- `LINE_DEFAULT_FALLBACK_TEXT`
- `LINE_WELCOME_TEXT`
- `LITE_LOG_SHEET_NAME`
- `LINE_ENABLE_LOADING_INDICATOR`
- `LINE_LOADING_SECONDS`

หมายเหตุ:
- Apps Script web app อ่าน `X-Line-Signature` ไม่ได้ตรง ๆ
- ถ้าจะใช้ direct GAS webhook ให้ตั้ง `LINE_REQUIRE_SIGNATURE=false`

## ใช้ข้อมูลจากชีตไหน

โปรเจกต์นี้อ่านข้อมูลจาก spreadsheet เดิมในตาราง:
- `intents`
- `intent_keywords`
- `intent_responses`
- `response_templates`

และจะสร้าง log sheet ใหม่ชื่อ:
- `lite_webhook_logs`
หรือค่าที่ตั้งใน `LITE_LOG_SHEET_NAME`

## ขั้นตอน deploy

1. สร้าง Apps Script project ใหม่
2. copy `.clasp.example.json` เป็น `.clasp.json`
3. ใส่ `scriptId` ของโปรเจกต์ใหม่
4. จากโฟลเดอร์ `gas-webhook-lite` รัน:

```bash
clasp push
```

5. เข้า Apps Script editor แล้วตั้ง Script Properties
6. รัน `setupLiteWebhook()` ครั้งแรก
7. Deploy เป็น Web App
8. เอา URL `.../exec` ไปใส่ใน LINE Webhook URL

## ฟังก์ชันสำคัญ

- `doPost(e)` รับ webhook
- `doGet()` health/config check
- `setupLiteWebhook()` สร้าง log sheet
- `testLiteConfig()` เช็ก config และนับจำนวน intent data

## สิ่งที่คาดหวัง

ข้อดี:
- เร็วกว่าเอาระบบ live chat ทั้งก้อนมารับ webhook
- โครงง่าย ดูแลง่าย
- reuse intent/template จาก spreadsheet เดิมได้

ข้อจำกัด:
- ไม่มีข้อมูล chat room แบบเต็มระบบ
- ถ้าจะให้ระบบหลักเห็นข้อความ ต้องทำ sync/import เพิ่มแยกต่างหาก
- loading indicator เป็น best-effort เท่านั้น และ LINE ไม่การันตีว่าจะแสดงทุกครั้ง
