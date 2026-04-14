// Intent + Messages cache layer for gas-main (Phase 1).
// Two sheets (schema Option B):
//   intents:  intent | match_type | is_active | priority | description
//   messages: intent | order | type | payload_json | quick_reply_json
//
// Loaded once per 5 min into CacheService. Warm requests do memory lookup only.

var INTENT_CACHE_KEY = 'intent_map_v1';
var INTENT_CACHE_TTL_SEC = 300; // 5 minutes

var INTENT_SHEET_NAME = 'intents';
var MESSAGES_SHEET_NAME = 'messages';

var INTENT_SHEET_HEADERS = ['intent', 'match_type', 'is_active', 'priority', 'description'];
var MESSAGES_SHEET_HEADERS = ['intent', 'order', 'type', 'payload_json', 'quick_reply_json'];

// Idempotent. Run from Apps Script editor once per new spreadsheet.
function setupIntentSchema() {
  var ss = openSpreadsheet_();
  ensureSheetWithHeaders_(ss, INTENT_SHEET_NAME, INTENT_SHEET_HEADERS);
  ensureSheetWithHeaders_(ss, MESSAGES_SHEET_NAME, MESSAGES_SHEET_HEADERS);
  purgeIntentCache();

  return {
    ok: true,
    sheets: [INTENT_SHEET_NAME, MESSAGES_SHEET_NAME],
    cacheCleared: true
  };
}

// Manually flush cache after editing sheets.
function purgeIntentCache() {
  try {
    CacheService.getScriptCache().remove(INTENT_CACHE_KEY);
  } catch (error) {
    console.log('purgeIntentCache failed: ' + error);
  }
}

// Main entry: returns { normalizedKey: intentConfig } or {} if sheets missing.
// intentConfig = { intent, match_type, priority, description, messages: [...] }
function getIntentMap_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(INTENT_CACHE_KEY);

  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      console.log('getIntentMap_ cache parse failed, reloading: ' + error);
    }
  }

  var map = loadIntents_();

  try {
    cache.put(INTENT_CACHE_KEY, JSON.stringify(map), INTENT_CACHE_TTL_SEC);
  } catch (error) {
    console.log('getIntentMap_ cache put failed: ' + error);
  }

  return map;
}

// Public lookup called from webhook. Returns matched intent or null.
// Exact match only (per current config); match_type column future-proofs extension.
function findIntent_(userText) {
  var normalized = normalizeIntentKey_(userText);
  if (!normalized) {
    return null;
  }

  var map = getIntentMap_();
  var match = map[normalized];

  return match || null;
}

function loadIntents_() {
  var ss = openSpreadsheet_();
  var intentsSheet = ss.getSheetByName(INTENT_SHEET_NAME);
  var messagesSheet = ss.getSheetByName(MESSAGES_SHEET_NAME);

  if (!intentsSheet || !messagesSheet) {
    return {};
  }

  var map = {};

  var intentRows = intentsSheet.getDataRange().getValues();
  for (var i = 1; i < intentRows.length; i += 1) {
    var rawKey = String(intentRows[i][0] || '');
    var active = String(intentRows[i][2]).toLowerCase();
    if (!rawKey || active === 'false' || active === '0') {
      continue;
    }

    var normKey = normalizeIntentKey_(rawKey);
    if (!normKey) {
      continue;
    }

    map[normKey] = {
      intent: rawKey,
      match_type: String(intentRows[i][1] || 'exact').toLowerCase(),
      priority: Number(intentRows[i][3] || 0),
      description: String(intentRows[i][4] || ''),
      messages: []
    };
  }

  var messageRows = messagesSheet.getDataRange().getValues();
  for (var j = 1; j < messageRows.length; j += 1) {
    var linkKey = normalizeIntentKey_(String(messageRows[j][0] || ''));
    if (!map[linkKey]) {
      continue;
    }

    map[linkKey].messages.push({
      order: Number(messageRows[j][1] || 0),
      type: String(messageRows[j][2] || 'text').toLowerCase(),
      payload_json: String(messageRows[j][3] || ''),
      quick_reply_json: String(messageRows[j][4] || '')
    });
  }

  for (var k in map) {
    if (Object.prototype.hasOwnProperty.call(map, k)) {
      map[k].messages.sort(function (a, b) { return a.order - b.order; });
    }
  }

  return map;
}

// TODO — you implement this (5-10 lines).
//
// Normalizes a text string for exact-match comparison.
// Applied to BOTH the stored intent column and the incoming user message,
// so whatever rules you choose must be symmetric.
//
// Minimum you likely want:
//   - convert to String (input could be number/undefined from Sheets)
//   - trim leading/trailing whitespace
//   - lowercase (only affects English; Thai is case-less)
//
// Thai-specific considerations (optional but valuable):
//   - Unicode normalization: text.normalize('NFC') removes compose/decompose mismatch
//     (e.g. "เมนู" typed on iOS vs Android can differ byte-wise but look identical)
//   - Collapse internal whitespace: "q  a" vs "q a" — decide if these should match
//   - Zero-width chars: .replace(/[\u200B-\u200D\uFEFF]/g, '') removes ZWJ/ZWSP
//
// Return: normalized string (or '' for empty/null input — findIntent_ treats '' as no match)
function normalizeIntentKey_(text) {
  return String(text || '')
    .normalize('NFC')
    .trim()
    .toLowerCase();
}

// Seed one test row per demo scenario into intents + messages sheets.
// Refuses to run if sheets already have data (safety).
// Use seedTestDataForce() to overwrite.
function seedTestData() {
  return seedTestData_(false);
}

function seedTestDataForce() {
  return seedTestData_(true);
}

function seedTestData_(force) {
  var ss = openSpreadsheet_();
  var intentsSheet = ss.getSheetByName(INTENT_SHEET_NAME);
  var messagesSheet = ss.getSheetByName(MESSAGES_SHEET_NAME);

  if (!intentsSheet || !messagesSheet) {
    throw new Error('Sheets not found. Run setupIntentSchema() first.');
  }

  if (!force && (intentsSheet.getLastRow() > 1 || messagesSheet.getLastRow() > 1)) {
    throw new Error('Sheets already contain data. Use seedTestDataForce() to overwrite.');
  }

  if (intentsSheet.getLastRow() > 1) {
    intentsSheet.getRange(2, 1, intentsSheet.getLastRow() - 1, INTENT_SHEET_HEADERS.length).clearContent();
  }
  if (messagesSheet.getLastRow() > 1) {
    messagesSheet.getRange(2, 1, messagesSheet.getLastRow() - 1, MESSAGES_SHEET_HEADERS.length).clearContent();
  }

  var intents = [
    ['เมนู', 'exact', true, 0, 'ทดสอบ: ตอบ text 1 bubble'],
    ['ที่อยู่', 'exact', true, 0, 'ทดสอบ: text + location (2 bubbles)'],
    ['ติดต่อ', 'exact', true, 0, 'ทดสอบ: text + quick reply']
  ];

  var messages = [
    [
      'เมนู', 1, 'text',
      JSON.stringify({
        type: 'text',
        text: 'เมนูหลักค่ะ\nพิมพ์ "ที่อยู่" หรือ "ติดต่อ" เพื่อดูข้อมูล'
      }),
      ''
    ],
    [
      'ที่อยู่', 1, 'text',
      JSON.stringify({
        type: 'text',
        text: 'สำนักงานยุติธรรมจังหวัดสกลนคร\nศาลากลางจังหวัดสกลนคร ชั้น 1'
      }),
      ''
    ],
    [
      'ที่อยู่', 2, 'location',
      JSON.stringify({
        type: 'location',
        title: 'สำนักงานยุติธรรมจังหวัดสกลนคร',
        address: 'ศาลากลางจังหวัดสกลนคร ถ.ศูนย์ราชการ อ.เมือง จ.สกลนคร 47000',
        latitude: 17.1545,
        longitude: 104.1482
      }),
      ''
    ],
    [
      'ติดต่อ', 1, 'text',
      JSON.stringify({
        type: 'text',
        text: 'ติดต่อสอบถาม\nโทร 042-713400\nวันจันทร์-ศุกร์ 08.30-16.30 น.'
      }),
      JSON.stringify({
        items: [
          { type: 'action', action: { type: 'message', label: 'แชทเจ้าหน้าที่', text: '0' } },
          { type: 'action', action: { type: 'message', label: 'เมนูหลัก', text: 'เมนู' } }
        ]
      })
    ]
  ];

  intentsSheet.getRange(2, 1, intents.length, INTENT_SHEET_HEADERS.length).setValues(intents);
  messagesSheet.getRange(2, 1, messages.length, MESSAGES_SHEET_HEADERS.length).setValues(messages);

  purgeIntentCache();

  return {
    ok: true,
    intentsInserted: intents.length,
    messagesInserted: messages.length,
    cacheCleared: true,
    intentKeys: intents.map(function (row) { return row[0]; })
  };
}

// Quick verify function. Run from Apps Script editor after setupIntentSchema()
// and after adding at least one row in each sheet.
function testIntentRepo() {
  purgeIntentCache();

  var map = getIntentMap_();
  var keys = Object.keys(map);

  return {
    ok: true,
    intentCount: keys.length,
    sampleKeys: keys.slice(0, 5),
    sampleIntent: keys.length > 0 ? map[keys[0]] : null,
    cacheHit: !!CacheService.getScriptCache().get(INTENT_CACHE_KEY)
  };
}
