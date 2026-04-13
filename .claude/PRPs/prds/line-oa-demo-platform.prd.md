# LINE OA Demo Platform — Refactor

> Sales-demo LINE OA management platform with 3 industry template packs (restaurant / clothing / school), built on Google Apps Script + Sheets. Used to close "รับทำ LINE" deals from Facebook inbound leads.

## Problem Statement

ต้องการปิดดีล "รับทำ LINE OA" จากลูกค้าที่ inbound มาทาง Facebook แต่ไม่มี demo ที่ **(1) ฟรี (2) โชว์ได้หลาย vertical ในการเปิด LINE ครั้งเดียว (3) ดูพร้อมใช้งานจริงไม่เหมือน lorem ipsum**. ระบบเดิมเป็นโครงสร้างแบบ single-tenant + auto-reply แบบ hardcode text ไม่สามารถ repurpose เป็น sales demo ได้

## Evidence

- โครงสร้าง `ModuleAutoReply.gs` เดิมเก็บ response เป็น plain text ตรงๆ ไม่มีระบบ template reference → เปลี่ยน response ระหว่าง demo ต้องแก้ sheet หลายแถว
- ไม่มี "Rich Menu Template Pack" concept — การสลับจากร้านอาหารไปโรงเรียนต้องสร้าง rich menu ใหม่ทั้งเซ็ต
- **Assumption — needs validation**: การมี demo ที่สลับ vertical ได้จะช่วยเพิ่ม conversion จาก inbound FB → ยังไม่มี baseline ตัวเลขจริง

## Proposed Solution

Refactor โครงสร้างเดิม (เก็บ Router/Auth/RBAC/Webhook/Audit ที่ดีอยู่) + เขียนใหม่ใน 4 ส่วน: (1) **Object Templates** — ดิกชันนารีกลางของ LINE Messaging API response (text/flex/image/sticker) ที่อ้างอิงด้วยชื่อตัวแปร, (2) **Auto-Reply v2** — keyword → inline text *หรือ* reference ไป object template, (3) **Rich Menu Template Packs** — 3 ชุด (restaurant/clothing/school) สลับ default OA menu ได้ 1-click + override per-user, (4) **Placeholder Renderer** — `{{user.displayName}}` / `{{sys.date}}` / `{{var.*}}` resolver ที่ render ตอน send. Bot/Manual toggle เดิมเก็บไว้ + เพิ่ม **Telegram escalation** เมื่อลูกค้ากดปุ่ม "คุยกับคน"

## Key Hypothesis

เราเชื่อว่า **LINE OA demo ที่สลับ rich menu pack 3 ร้านได้ + ตอบกลับ flex message สวยแบบใช้งานจริง** จะช่วยให้ปิดดีล "รับทำ LINE" ได้จากลูกค้า inbound ทาง Facebook

เราจะรู้ว่าถูกเมื่อ **มีลูกค้า inbox มาถามราคาอย่างน้อย 2 คน/สัปดาห์** หลัง deploy + โพสต์โปรโมท

## What We're NOT Building

- **Multi-tenant / data isolation** — ทุก demo shop ใช้ deployment เดียวกัน แยกด้วย `shop_id` field, ไม่คิดเรื่อง production hardening
- **Payment integration** — order flow จบที่ "ส่งข้อมูลไป Telegram admin" ไม่มี gateway
- **LIFF form builder UI** — มีโค้ดเดิม คงไว้แต่ไม่ลงทุนเพิ่ม
- **E-commerce full flow** — ไม่มี stock management, ไม่มี delivery tracking
- **Custom Variables UI แบบ chip picker** — deferred ไป post-MVP (รอบแรกใช้ dropdown ธรรมดา)
- **Per-user rich menu override UI** — schema รองรับแต่ admin UI deferred
- **Enterprise features** — 100-สาขา, SSO, staff role ซับซ้อน

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Facebook inbound ถามราคา | ≥ 2 คน/สัปดาห์ | นับจาก FB Page Inbox หลังโพสต์โปรโมท |
| Demo shop สลับได้เสถียร | 3 packs, สลับไม่พัง | Manual smoke test หลัง deploy |
| Admin setup auto-reply ใหม่ | ≤ 5 นาที / 1 intent | Self-timed โดย Topp |
| Flex message render ถูก | 100% (0 broken JSON) | Manual eye-ball 3 shops × 3 flows |

## Open Questions

- [ ] Rich menu images จะหาจากไหน — generate ด้วย AI image tool / stock free site / Canva? (ยังไม่ตัดสินใจ)
- [ ] LINE OA สำหรับ demo มีอยู่แล้วหรือต้องสร้างใหม่ (1 channel ต่อ 3 demo หรือ 1 channel ต่อ demo)?
- [ ] Telegram chat สำหรับ escalation — ใช้ chat เดียวกับ existing `TELEGRAM_CHAT_ID` หรือแยก?
- [ ] Seed data ภาษาอะไร — ไทยล้วน / ไทย+อีโมจิ / ไทย+อังกฤษ? (เสนอ: ไทย+อีโมจิเพื่อความเฟรนด์ลี่)

---

## Users & Context

### Primary User: Facebook Inbound Prospect

- **Who**: SME ไทยที่เห็นโพสต์ "รับทำ LINE" จากเพจคุณ แล้ว inbox มาถามราคา
- **Current behavior**: ตอบ DM ขอดูตัวอย่างงาน → คุณส่งภาพหน้าจอ/วิดีโอ → ลูกค้าไม่เห็นภาพรวมว่าจบได้ยังไง → เย็นๆ หาย
- **Trigger**: ทันทีที่คุณส่งลิงก์/QR LINE OA demo ให้ → เขาเปิดดูเอง
- **Success state**: เปิด LINE → เห็น rich menu 3 ร้าน → ลองกดสั่งของ → เห็น flex message สวย → ตัดสินใจปิดดีล

### Secondary User: You (Topp) ตอนพรีเซนต์

- **Who**: คุณเอง ที่กำลัง demo ต่อหน้าลูกค้า (ออนไลน์หรือออฟไลน์)
- **Current behavior**: ต้องเขียน flow ขึ้นมาใหม่ทุกครั้งที่ลูกค้าต่างประเภท
- **Trigger**: ลูกค้าถามว่า "ทำได้เหมือนโรงเรียนไหม"
- **Success state**: เปิด admin dashboard → สลับ pack → 10 วินาทีได้ rich menu โรงเรียนให้ลูกค้าเห็น

### Job to Be Done

> **ตอนทักคุยกับลูกค้าที่มาจากโพสต์ FB 'รับทำ LINE'** ผมต้องการให้เขาเปิด LINE → เห็น rich menu 3 ร้าน → ลองสั่งของได้จริง → เห็น flex message สวย **เพื่อจะได้ปิดดีลได้เลย**

### Non-Users

- Enterprise / chain 100 สาขา
- บริษัทที่มี dev team เอง
- คนที่ต้องการ e-commerce full flow (payment, stock, delivery)
- Admin ที่ต้อง setup 50+ keyword — เป้าหมายคือ showcase ไม่ใช่ production scale

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Rich Menu Template Pack (3 packs) + 1-click switcher | หัวใจของ demo — สิ่งแรกที่ prospect เห็น |
| Must | Object Templates sheet + renderer (text/flex/image) | Primitive ที่ auto-reply ทั้งหมดขึ้นอยู่ |
| Must | Auto-Reply v2 (inline text + template reference) | ทำให้ demo ตอบกลับได้เหมือนร้านจริง |
| Must | Placeholder rendering (`{{user.displayName}}`, `{{sys.shopName}}`) | ข้อความดู personalized ไม่ generic |
| Must | Bot/Manual toggle per user | ของเดิมมีอยู่ คงไว้ + ให้สลับผ่าน LINE postback ได้ |
| Must | Telegram escalation เมื่อกด "คุยกับคน" | ปลอดภัยตอน demo — ไม่มี agent จริง |
| Must | Seed data 3 shops (menu images + intents + flex JSON) | ไม่มี seed = ไม่มี demo |
| Must | Friend lifecycle (follow/unfollow/re-follow) events | โชว์ audit trail ตอน pitch "ระบบเก็บประวัติเพื่อนให้" |
| Must | Chat history view + export | โชว์ admin dashboard ว่าเก็บประวัติครบ |
| Should | Admin UI: สลับ pack ได้ในหน้าเดียว | Demo flow ราบรื่น ไม่ต้องเปิด sheet |
| Should | Placeholder dropdown ในหน้า template editor | UX ดีขึ้นเล็กน้อย (built-in vars เท่านั้น) |
| Could | Custom variables CRUD UI | Nice-to-have — seed 5 ตัวก่อน |
| Could | Per-user rich menu override UI | Schema รองรับ, UI deferred |
| Won't | Multi-tenant / data isolation | ไม่จำเป็นสำหรับ demo |
| Won't | Payment integration | Out of scope |
| Won't | Placeholder chip picker (rich text editor) | UI ซับซ้อน, dropdown ธรรมดาพอ |
| Won't | LIFF form builder | คงของเดิม ไม่ลงทุนเพิ่ม |

### MVP Scope (เพื่อ validate hypothesis)

**MVP = 1 LINE OA deployment** ที่โชว์ได้ครบ:
- สลับ rich menu pack ได้ 3 แบบ (restaurant / clothing / school)
- แต่ละ pack มี flow เปิด → ถามราคา → สั่งของ → flex menu → confirm
- กด "คุยกับคน" ได้ → ส่ง alert Telegram
- Admin dashboard ดู chat history + friend history + สลับ bot/manual ได้

### User Flow — Restaurant Demo (critical path)

```
Prospect เปิด LINE (ครั้งแรก)
  ↓
Rich Menu "ร้านอาหาร Demo" ปรากฏ (6 ปุ่ม: เมนูวันนี้, โปรโมชั่น, สั่งของ, จองโต๊ะ, ร้านอยู่ไหน, คุยกับคน)
  ↓
กด "เมนูวันนี้"
  ↓
Bot ตอบ Flex Carousel (3 เมนู + ปุ่ม "สั่งเลย")
  ↓
กด "สั่งเลย"
  ↓
Bot ถาม "ต้องการกี่ที่ครับ {{user.displayName}}?"
  ↓
Prospect ตอบ "2"
  ↓
Bot: "รับทราบครับ admin จะติดต่อกลับ" + ส่งข้อมูลเข้า Telegram
  ↓
(จบ flow)
```

---

## Technical Approach

**Feasibility**: **HIGH** — stack และ primitives หลัก (GAS, Sheets, LINE API, Telegram API, Router/Auth) มีอยู่แล้วใน codebase เดิม

### Architecture Notes

- **เก็บ namespace pattern เดิม** — `var App = App || {}; App.X = (function(){...})();`
- **เก็บ Router.gs MAP + audit auto-write** — ของดีที่สุดของโครงเดิม
- **Placeholder renderer** เป็น single pure function `App.Render.resolve(template, ctx)` — deep traverse JSON + substitute string fields
- **Object Template as reference**: field `template_id` ใน `intent_responses` อ้างอิง `object_templates.id`; ถ้า null ใช้ `inline_text` แทน
- **Rich Menu Pack** = collection ของ rich_menus ที่มี `pack_id` field; admin กด "activate pack X" → loop set default menu ที่ LINE + update active flag ใน sheet
- **Friend lifecycle** — เพิ่ม `event_type` enum (`follow` / `unfollow` / `refollow`) ใน `friend_histories` + computed `current_state` ใน `users` sheet
- **Telegram escalation** — webhook เจอ postback `action=escalate` → push message to agent + flip `bot_mode` to `manual` + ตอบลูกค้าว่ารอสักครู่
- **Script property ใหม่**: `DEMO_ACTIVE_PACK` = `restaurant | clothing | school` (cache ใน Script Properties เพื่อ fast read)

### Technical Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Rich menu image quality ไม่ถึง — demo ดูไม่น่าเชื่อ | HIGH | Budget 2–3 ชม. หา/generate ภาพก่อนเขียนโค้ด |
| LINE rich menu API rate limit ตอนสลับ pack บ่อย | MEDIUM | Cache menu_id ใน sheet; สลับด้วย `setDefaultRichMenu` อย่างเดียว (ไม่ create/delete ซ้ำ) |
| Flex JSON ยาวเกิน LINE limit (25KB ต่อ message) | MEDIUM | Validate ก่อน save + unit-test ต่อ template |
| GAS 6-min execution timeout ตอน setup 3 packs | LOW | Setup ทีละ pack + checkpoint ใน Script Properties |
| Placeholder render infinite loop (template อ้างตัวเอง) | LOW | Limit recursion depth = 3 |

---

## Implementation Phases

<!--
  STATUS: pending | in-progress | complete
  PARALLEL: phases ที่ run พร้อมกันได้ (e.g., "with 3")
  DEPENDS: phases ที่ต้อง complete ก่อน (e.g., "1, 2")
-->

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | Foundation Refactor | เก็บของดี (Router, Auth, Webhook, Audit), ปรับ SCHEMAS ใหม่ (object_templates, template_variables, rich_menu_packs, friend_events), รัน setupInitialize | complete | - | - | `.claude/PRPs/plans/completed/foundation-refactor.plan.md` |
| 2 | Object Templates + Placeholder Renderer | `object_templates` sheet + `App.Render.resolve()` + unit smoke tests (text/flex deep traversal) | pending | with 3 | 1 | - |
| 3 | Rich Menu Pack System | `rich_menu_packs` + `App.RichMenuPack.activate(packId)` + 1-click switcher API | pending | with 2 | 1 | - |
| 4 | Auto-Reply v2 | Rewrite `ModuleAutoReply` — keyword → `template_id` lookup หรือ inline text + placeholder render | pending | - | 2 | - |
| 5 | Bot/Manual Toggle + Telegram Escalation | ปรับ `ModuleChat.toggleMode` + webhook postback handler `action=escalate` + push Telegram | pending | with 6 | 1 | - |
| 6 | Friend Lifecycle Events | เพิ่ม event_type ใน friend_histories + state transition ใน webhook follow/unfollow | pending | with 5 | 1 | - |
| 7 | Seed Data — Restaurant | 1 rich menu pack + 6 intents + 4 flex templates + stock images | pending | with 8, 9 | 2, 3, 4 | - |
| 8 | Seed Data — Clothing | 1 rich menu pack + 6 intents + 4 flex templates + stock images | pending | with 7, 9 | 2, 3, 4 | - |
| 9 | Seed Data — School | 1 rich menu pack + 6 intents + 4 flex templates + stock images | pending | with 7, 8 | 2, 3, 4 | - |
| 10 | Admin UI Polish | Pack switcher on dashboard + chat history export + friend timeline | pending | - | 3, 4, 5, 6 | - |
| 11 | Deploy + FB Promo Post | clasp deploy → set webhook → โพสต์ FB | pending | - | 7, 8, 9, 10 | - |

### Phase Details

**Phase 1: Foundation Refactor** — _เสร็จวันนี้_
- **Goal**: โครงกระดูกใหม่ที่ phase อื่นเสียบได้
- **Scope**: ปรับ `SheetsRepo.SCHEMAS` เพิ่ม 4 sheets ใหม่, รัน `setupInitialize()`, เก็บ Router/Auth/Webhook/Audit เดิม
- **Success signal**: `setupInitialize()` รันผ่าน + ทุก sheet ถูกสร้าง + `system.schemas` endpoint return ครบ

**Phase 2: Object Templates + Placeholder Renderer** — _เสร็จวันนี้_
- **Goal**: Primitive กลางที่ทุก reply ใช้ร่วมกัน
- **Scope**: `App.Templates.get(id)`, `App.Render.resolve(template, ctx)` สำหรับ text / flex / image; built-in placeholder scopes `user.*`, `sys.*`, `ctx.*`, `var.*`
- **Success signal**: resolve test fixture 3 ตัว (text + placeholder, flex deep nested, image URL) → output ถูกต้อง

**Phase 3: Rich Menu Pack System** — _เสร็จวันนี้_
- **Goal**: สลับ pack ได้ 1 คำสั่ง
- **Scope**: `rich_menu_packs` schema, `App.RichMenuPack.activate(packId)` (set default menu ที่ LINE + update flag), endpoint `richmenu.activatePack`
- **Success signal**: activate pack ใหม่ → LINE OA เปลี่ยน default menu ภายใน 5 วินาที

**Phase 4: Auto-Reply v2** — _พรุ่งนี้_
- **Goal**: Auto-reply ที่ใช้ template ได้จริง
- **Scope**: เขียน `ModuleAutoReply` ใหม่, schema `intent_responses` มี 2 columns `template_id` และ `inline_text` (อันใดอันหนึ่ง), keyword match → resolve → send
- **Success signal**: intent "เมนูวันนี้" → ตอบ flex carousel ที่มี `{{user.displayName}}` ถูกต้อง

**Phase 5: Bot/Manual Toggle + Telegram Escalation** — _พรุ่งนี้_
- **Goal**: ลูกค้ากด "คุยกับคน" → admin รู้ทันที
- **Scope**: webhook postback `action=escalate` → flip `bot_mode=manual` + push Telegram alert ("ลูกค้า X ต้องการคุย, คลิกเพื่อเปิด admin console")
- **Success signal**: กดปุ่ม → Telegram notify ใน <5 วินาที + bot หยุด auto-reply user นั้น

**Phase 6: Friend Lifecycle Events** — _พรุ่งนี้_
- **Goal**: เก็บ add/block/re-add ครบ
- **Scope**: webhook `follow`/`unfollow` → append event + compute `current_state`
- **Success signal**: Follow → unfollow → follow อีกครั้ง → 3 events ถูก log พร้อม timestamp

**Phase 7–9: Seed Data (Restaurant / Clothing / School)** — _สัปดาห์นี้_
- **Goal**: แต่ละ pack ใช้งานได้จริงไม่ใช่ placeholder
- **Scope ต่อ pack**:
  - 1 rich menu image (2500×1686 หรือ 2500×843) + 6 areas
  - 6 intents (greeting, menu/catalog, promo, order, location, human-handoff)
  - 4 flex message templates (menu carousel, product card, confirm order, about us)
  - ภาพสินค้า 3–5 รูป (free stock)
- **Success signal**: smoke test flow "เปิด LINE → กด 3 ปุ่มหลัก → ได้ flex สวย" ต่อ pack

**Phase 10: Admin UI Polish** — _สัปดาห์นี้_
- **Goal**: Demo ต่อหน้าลูกค้าราบรื่น
- **Scope**: หน้า dashboard มีปุ่ม "Activate Pack: [Restaurant / Clothing / School]", chat history export CSV, friend timeline view
- **Success signal**: สลับ pack ใน UI → LINE OA เปลี่ยนภายใน 10 วินาที

**Phase 11: Deploy + FB Promo Post** — _สัปดาห์หน้า_
- **Goal**: เริ่มวัด hypothesis
- **Scope**: `clasp deploy`, set webhook production, โพสต์ FB พร้อม QR LINE OA demo
- **Success signal**: 2+ inbox ถามราคา ภายใน 7 วันแรก

### Parallelism Notes

- Phase 2 + 3 — independent ทั้งคู่เสียบกับ Phase 1 → run ขนานได้
- Phase 5 + 6 — อยู่คนละ webhook path (postback vs follow) → run ขนานได้
- Phase 7 + 8 + 9 — seed data แต่ละ pack ไม่กัน → ขนานสูงสุด 3 agents
- Phase 10 รอทุก seed เสร็จเพื่อ test UI กับข้อมูลจริง

### "เสร็จวันนี้" Re-scoped

"เสร็จวันนี้" = Phase 1–3 + Phase 4 เบสิก + Seed ร้านอาหาร (Phase 7 เวอร์ชัน minimal)
→ มี demo ร้านอาหาร 1 ร้านที่ใช้งานได้จริง + backbone พร้อมรับอีก 2 packs
→ Clothing + School เติมสัปดาห์นี้

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Stack | GAS + Sheets (ไม่เปลี่ยน) | Node.js + Postgres, Supabase | Constraint "ฟรี" + codebase เดิมใช้ได้ 60% |
| Refactor strategy | Rewrite ใหม่แต่เก็บของดี | Full rewrite / incremental patch | User ขอ "เขียนใหม่แต่ส่วนไหนของเดิมดีก็ใช้ต่อ" |
| Placeholder UI | Dropdown built-in vars | Chip picker (rich editor) | ลด complexity, UX ง่ายสำหรับ non-tech admin |
| Placeholder syntax | `{{scope.name}}` | `${name}`, `%name%` | Handlebars-style คนรู้จักเยอะ |
| Rich menu pack scope | Default + per-user override (schema รองรับ, UI deferred) | Default only / per-user only | ยืดหยุ่นแต่ไม่ต้องทำ UI ครบในรอบแรก |
| Bot/Manual toggle | Sheet flag + webhook check | LINE Chat Mode API | **LINE ไม่เปิด API ให้สลับ chat mode จากภายนอก** — ต้องทำเอง |
| Escalation channel | Telegram (ใช้ของเดิม) | Email, LINE Notify, Discord | `TelegramApi.gs` มีอยู่แล้ว + free |
| Timeline | Phased — 1 shop วันนี้, 2 ที่เหลือสัปดาห์นี้ | 3 shops ใน 1 วัน | ไม่มีทางเสร็จ 1 วันกับงานคุณภาพระดับ sales demo |

---

## Research Summary

### Market Context

| คู่แข่ง | ราคา | จุดอ่อน |
|---------|------|--------|
| LINE OA Manager (native) | ฟรี | Auto-reply จำกัด, ไม่มี intent matching, rich menu ไม่มี template pack |
| Lstep, Oamini | ฿1,500–5,000/เดือน | แพง, UI ญี่ปุ่น |
| Chatfuel, ManyChat | $15+/เดือน | ไม่ LINE-first |
| Lineman, Zort | ต่อ store | POS ไม่ใช่ chat platform |

**ช่องว่าง**: ไม่มีตัวไหนเป็น **ฟรี + multi-vertical demo + ไทย-first + ใช้ง่ายสำหรับ SME** → positioning ของโปรเจกต์นี้

### Technical Context (Codebase Exploration)

**Leverage ของเดิม**:
- `src/server/Router.gs` — MAP-based dispatch + auto audit (เก็บไว้)
- `src/server/Auth.gs` — sheet-driven RBAC (เก็บไว้)
- `src/server/Webhook.gs` — signature verify + event routing (เก็บไว้, เสริม postback handler)
- `src/server/TelegramApi.gs` — มี wrapper แล้ว (reuse สำหรับ escalation)
- `src/server/SheetsRepo.gs` SCHEMAS pattern (เก็บไว้, เพิ่ม schema ใหม่)
- Namespace pattern `var App = App || {}` (บังคับใช้ทั่วโปรเจกต์)

**Rewrite**:
- `src/server/ModuleAutoReply.gs` — ปัจจุบัน plain-text only, ไม่มี template ref
- `src/server/ModuleRichMenu.gs` — ไม่มี pack concept
- `src/server/Webhook.gs` postback handling — เพิ่ม action `escalate`

**New files**:
- `src/server/ModuleTemplates.gs` — object_templates CRUD
- `src/server/Render.gs` — placeholder renderer
- `src/server/ModuleRichMenuPack.gs` — pack activation

### LINE API Verification — "ปิด/เปิด chat mode"

**ยืนยันหลังค้น**: LINE Messaging API **ไม่มี endpoint** สำหรับสลับ chat mode (bot ↔ chat) ของ OA จากภายนอก → ต้องทำ flag `bot_mode` ในฝั่งเราเอง (ของเดิม `ModuleChat.toggleMode` ทำถูกต้องแล้ว)

---

*Generated: 2026-04-13*
*Status: DRAFT — needs validation on rich-menu image sourcing + LINE OA channel setup*
