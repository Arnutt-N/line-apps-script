// Admin-side CRUD for the `intents` + `messages` sheets used by IntentRepo.gs.
//
// Schema (kept in sync with IntentRepo.gs):
//   intents:  intent | match_type | is_active | priority | description
//   messages: intent | order | type | payload_json | quick_reply_json
//
// Design:
//   - The sheet `intent` column is the PRIMARY KEY (unique normalized text).
//   - `save` is upsert by the normalized key; rename is disallowed (delete + create).
//   - `messages` for an intent are rewritten wholesale on save (simpler than diff).
//   - Every mutating call clears the CacheService bucket IntentRepo uses.

var AdminIntents = (function () {
  var INTENT_HEADERS = ['intent', 'match_type', 'is_active', 'priority', 'description'];
  var MESSAGE_HEADERS = ['intent', 'order', 'type', 'payload_json', 'quick_reply_json'];

  function getSheets_() {
    var ss = openSpreadsheet_();
    var intents = ensureSheetWithHeaders_(ss, 'intents', INTENT_HEADERS);
    var messages = ensureSheetWithHeaders_(ss, 'messages', MESSAGE_HEADERS);
    return { ss: ss, intents: intents, messages: messages };
  }

  function readRows_(sheet, headers) {
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return [];
    }
    var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    var rows = [];
    for (var i = 0; i < values.length; i += 1) {
      var row = {};
      var hasAny = false;
      for (var j = 0; j < headers.length; j += 1) {
        row[headers[j]] = values[i][j];
        if (values[i][j] !== '' && values[i][j] != null) {
          hasAny = true;
        }
      }
      row.__rowIndex = i + 2;
      if (hasAny) {
        rows.push(row);
      }
    }
    return rows;
  }

  function list() {
    var sheets = getSheets_();
    var intents = readRows_(sheets.intents, INTENT_HEADERS);
    var messages = readRows_(sheets.messages, MESSAGE_HEADERS);

    var countByKey = {};
    for (var i = 0; i < messages.length; i += 1) {
      var key = normalizeIntentKey_(String(messages[i].intent || ''));
      if (!key) continue;
      countByKey[key] = (countByKey[key] || 0) + 1;
    }

    return intents.map(function (row) {
      var key = normalizeIntentKey_(String(row.intent || ''));
      return {
        intent: String(row.intent || ''),
        match_type: String(row.match_type || 'exact'),
        is_active: row.is_active === true || String(row.is_active).toLowerCase() === 'true',
        priority: Number(row.priority || 0),
        description: String(row.description || ''),
        messageCount: countByKey[key] || 0
      };
    });
  }

  function findIntentRow_(sheet, key) {
    var rows = readRows_(sheet, INTENT_HEADERS);
    for (var i = 0; i < rows.length; i += 1) {
      if (normalizeIntentKey_(String(rows[i].intent || '')) === key) {
        return rows[i];
      }
    }
    return null;
  }

  function get(payload) {
    var key = normalizeIntentKey_(String(payload && payload.intent || ''));
    if (!key) {
      throw new Error('intent is required');
    }

    var sheets = getSheets_();
    var intentRow = findIntentRow_(sheets.intents, key);
    if (!intentRow) {
      return null;
    }

    var messageRows = readRows_(sheets.messages, MESSAGE_HEADERS)
      .filter(function (row) {
        return normalizeIntentKey_(String(row.intent || '')) === key;
      })
      .sort(function (a, b) { return Number(a.order || 0) - Number(b.order || 0); })
      .map(function (row) {
        return {
          order: Number(row.order || 0),
          type: String(row.type || 'text'),
          payload_json: String(row.payload_json || ''),
          quick_reply_json: String(row.quick_reply_json || '')
        };
      });

    return {
      intent: String(intentRow.intent || ''),
      match_type: String(intentRow.match_type || 'exact'),
      is_active: intentRow.is_active === true || String(intentRow.is_active).toLowerCase() === 'true',
      priority: Number(intentRow.priority || 0),
      description: String(intentRow.description || ''),
      messages: messageRows
    };
  }

  function validatePayload_(payload) {
    var intentText = String(payload && payload.intent || '').trim();
    if (!intentText) {
      throw new Error('intent text is required');
    }
    if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
      throw new Error('At least one message is required');
    }
    if (payload.messages.length > 5) {
      throw new Error('LINE replies are limited to 5 messages per intent');
    }
    for (var i = 0; i < payload.messages.length; i += 1) {
      var m = payload.messages[i] || {};
      if (!m.type) {
        throw new Error('Message #' + (i + 1) + ' is missing a type');
      }
      if (!m.payload_json) {
        throw new Error('Message #' + (i + 1) + ' is missing payload_json');
      }
      try { JSON.parse(m.payload_json); } catch (err) {
        throw new Error('Message #' + (i + 1) + ' payload_json is not valid JSON');
      }
      if (m.quick_reply_json) {
        try { JSON.parse(m.quick_reply_json); } catch (err) {
          throw new Error('Message #' + (i + 1) + ' quick_reply_json is not valid JSON');
        }
      }
    }
  }

  function save(payload) {
    validatePayload_(payload);

    var intentText = String(payload.intent).trim();
    var key = normalizeIntentKey_(intentText);
    if (!key) {
      throw new Error('intent cannot be empty after normalization');
    }

    var previousKey = payload.previousKey ? normalizeIntentKey_(String(payload.previousKey)) : '';
    var sheets = getSheets_();

    // If previousKey differs (rename), remove the old intent + messages first.
    if (previousKey && previousKey !== key) {
      deleteByKey_(sheets, previousKey);
    }

    // Upsert intent row.
    var existing = findIntentRow_(sheets.intents, key);
    var rowValues = [
      intentText,
      String(payload.match_type || 'exact'),
      payload.is_active !== false,
      Number(payload.priority || 0),
      String(payload.description || '')
    ];

    if (existing) {
      sheets.intents.getRange(existing.__rowIndex, 1, 1, INTENT_HEADERS.length).setValues([rowValues]);
    } else {
      sheets.intents.appendRow(rowValues);
    }

    // Rewrite messages: delete old rows, append new ones.
    deleteMessagesByKey_(sheets.messages, key);

    var messageValues = payload.messages.map(function (m, index) {
      return [
        intentText,
        Number(m.order || (index + 1)),
        String(m.type || 'text'),
        String(m.payload_json || ''),
        String(m.quick_reply_json || '')
      ];
    });

    if (messageValues.length > 0) {
      sheets.messages.getRange(
        sheets.messages.getLastRow() + 1, 1,
        messageValues.length, MESSAGE_HEADERS.length
      ).setValues(messageValues);
    }

    purgeIntentCache();

    return { ok: true, intent: intentText, messageCount: messageValues.length };
  }

  function deleteMessagesByKey_(sheet, key) {
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    var values = sheet.getRange(2, 1, lastRow - 1, MESSAGE_HEADERS.length).getValues();
    // Delete from bottom up so indices stay stable.
    for (var i = values.length - 1; i >= 0; i -= 1) {
      if (normalizeIntentKey_(String(values[i][0] || '')) === key) {
        sheet.deleteRow(i + 2);
      }
    }
  }

  function deleteByKey_(sheets, key) {
    var lastRow = sheets.intents.getLastRow();
    if (lastRow >= 2) {
      var values = sheets.intents.getRange(2, 1, lastRow - 1, INTENT_HEADERS.length).getValues();
      for (var i = values.length - 1; i >= 0; i -= 1) {
        if (normalizeIntentKey_(String(values[i][0] || '')) === key) {
          sheets.intents.deleteRow(i + 2);
        }
      }
    }
    deleteMessagesByKey_(sheets.messages, key);
  }

  function remove(payload) {
    var key = normalizeIntentKey_(String(payload && payload.intent || ''));
    if (!key) {
      throw new Error('intent is required');
    }
    var sheets = getSheets_();
    deleteByKey_(sheets, key);
    purgeIntentCache();
    return { ok: true, intent: payload.intent };
  }

  function testMatch(payload) {
    var text = String(payload && payload.text || '');
    purgeIntentCache();
    var intent = findIntent_(text);
    if (!intent) {
      return { matched: false, text: text, messages: [] };
    }
    return {
      matched: true,
      text: text,
      intent: intent.intent,
      messages: buildLineMessages_(intent)
    };
  }

  return {
    list: list,
    get: get,
    save: save,
    remove: remove,
    testMatch: testMatch
  };
})();
