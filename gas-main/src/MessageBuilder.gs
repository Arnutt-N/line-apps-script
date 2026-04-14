// Converts intent config (from findIntent_) into a LINE API messages array.
//
// Strategy: payload_json stores the COMPLETE LINE message object for that row.
// We parse it as-is and optionally attach `quickReply` from quick_reply_json.
// Any LINE message type works without code change (text/image/video/audio/
// location/sticker/flex/template/imagemap). LINE adds a new type? Just put
// its JSON in the sheet — no redeploy needed.
//
// Safety:
//   - LINE reply API allows max 5 messages per reply → we slice(0, 5)
//   - Each row parsed independently; a broken JSON row is skipped, not fatal
//   - Missing `type` field is skipped (LINE would reject anyway)

var MAX_MESSAGES_PER_REPLY = 5;

// Main: intentConfig (from findIntent_) → LINE messages array ready for reply.
function buildLineMessages_(intentConfig) {
  if (!intentConfig || !Array.isArray(intentConfig.messages) || intentConfig.messages.length === 0) {
    return [];
  }

  var rows = intentConfig.messages.slice(0, MAX_MESSAGES_PER_REPLY);
  var out = [];
  var i;
  var built;

  for (i = 0; i < rows.length; i += 1) {
    built = buildSingleMessage_(rows[i]);
    if (built) {
      out.push(built);
    }
  }

  return out;
}

// Parse one message row into a LINE message object, or null if invalid.
function buildSingleMessage_(row) {
  if (!row || !row.payload_json) {
    return null;
  }

  var payload = parseJson_(row.payload_json, null);
  if (!payload || typeof payload !== 'object' || !payload.type) {
    console.log('buildSingleMessage_ skipped: missing type in payload_json');
    return null;
  }

  if (row.quick_reply_json) {
    var qr = parseJson_(row.quick_reply_json, null);
    if (qr && Array.isArray(qr.items) && qr.items.length > 0) {
      payload.quickReply = qr;
    } else {
      console.log('buildSingleMessage_: invalid quick_reply_json shape (missing items[])');
    }
  }

  return payload;
}

// End-to-end dry run. Run from Apps Script editor.
// Does NOT call LINE API — just shows what would be sent for each seeded intent.
function testMessageBuilder() {
  var keys = ['เมนู', 'ที่อยู่', 'ติดต่อ', 'ไม่มีอยู่จริง'];
  var results = {};
  var i;
  var intent;
  var messages;

  for (i = 0; i < keys.length; i += 1) {
    intent = findIntent_(keys[i]);
    messages = buildLineMessages_(intent);
    results[keys[i]] = {
      matched: !!intent,
      messageCount: messages.length,
      types: messages.map(function (m) { return m.type; }),
      hasQuickReply: messages.some(function (m) { return !!m.quickReply; }),
      preview: messages
    };
  }

  return results;
}
