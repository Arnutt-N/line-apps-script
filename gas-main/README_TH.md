# GAS Main

โปรเจกต์นี้ย้ายแนวคิดจาก `D:\Line Chatbot\SakonNakhonBot\apps-script` เข้ามาเป็น Apps Script แยกใน repo นี้ โดยคง flow แบบบอทเดิม:

- รับ LINE webhook
- ตอบข้อความจากเมนูคงที่หรือจับ intent จาก Google Sheets
- append log ลงชีต
- ส่ง Telegram alert ได้ถ้าต้องการ

จุดที่ต่างจากต้นฉบับ:

- ตัด hardcoded token / spreadsheet ID ออกจาก source
- ใช้ Script Properties แทน
- เพิ่ม `doGet()`, `setupClassicWebhook()`, `testClassicConfig()`
- แยกเป็น subproject สำหรับ `clasp` ชัดเจน

## โครงสร้าง

- `src/Code.gs`
- `src/appsscript.json`
- `.clasp.example.json`

## Script Properties

จำเป็น:

- `SPREADSHEET_ID`
- `LINE_CHANNEL_ACCESS_TOKEN`

ไม่บังคับ:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `LINE_ENABLE_LOADING_INDICATOR`
- `LINE_LOADING_SECONDS`
- `CLASSIC_INTENT_SHEET_NAME`
- `CLASSIC_LOG_SHEET_NAME`
- `CLASSIC_FRIEND_HISTORY_SHEET_NAME`

ค่า default ของชื่อชีต:

- `CLASSIC_INTENT_SHEET_NAME=Sheet1`
- `CLASSIC_LOG_SHEET_NAME=Sheet2`
- `CLASSIC_FRIEND_HISTORY_SHEET_NAME=FriendHistory`

## โครงสร้างข้อมูลในชีต intent

อ่านจาก `Sheet1` หรือชื่อที่ตั้งใน `CLASSIC_INTENT_SHEET_NAME`

คอลัมน์:

- A `intent`
- B `response`
- C `image_type`
- D `image_data`
- E `image_alt_text`
- F `aspect_ratio`
- G `full_size_urls`
- H `preview_urls`
- I `size`
- J `aspect_mode`
- K `background_color`

## วิธีใช้

1. สร้าง Apps Script project ใหม่
2. copy `.clasp.example.json` เป็น `.clasp.json`
3. ใส่ `scriptId`
4. ในโฟลเดอร์ `gas-main` รัน `clasp push`
5. ตั้ง Script Properties
6. รัน `setupClassicWebhook()`
7. Deploy เป็น Web App
8. เอา URL `.../exec` ไปใส่ใน LINE webhook

## ฟังก์ชันสำคัญ

- `doPost(e)` รับ webhook
- `doGet()` health check
- `setupClassicWebhook()` สร้างชีตตั้งต้นที่ต้องใช้
- `testClassicConfig()` เช็ก config และนับจำนวนแถวข้อมูล

## หมายเหตุ

- ถ้าจะใช้ direct GAS webhook ให้ตั้ง `LINE_REQUIRE_SIGNATURE=false`
- loading indicator เป็น best-effort ของ LINE ไม่ได้การันตีว่าจะเห็นทุกครั้ง
