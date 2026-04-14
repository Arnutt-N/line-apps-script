var LiteWebhookApp = (function () {
  var CACHE_KEY = 'lite_webhook_bundle_v1';
  var CACHE_TTL_SEC = 120;
  var LOG_HEADERS = ['timestamp', 'event_type', 'user_id', 'message_text', 'matched_intent', 'reply_count', 'status', 'error', 'raw_json'];

  function handleGet() {
    var spreadsheetId = getProperty_('SPREADSHEET_ID', '');
    var bundle = spreadsheetId ? getRuntimeBundle_() : {
      intents: [],
      keywords: [],
      responses: []
    };

    return jsonOutput_({
      ok: true,
      app: 'gas-webhook-lite',
      nowIso: new Date().toISOString(),
      spreadsheetConfigured: !!spreadsheetId,
      lineTokenConfigured: !!getProperty_('LINE_CHANNEL_ACCESS_TOKEN', ''),
      loadingIndicatorEnabled: toBool_(getProperty_('LINE_ENABLE_LOADING_INDICATOR', 'false')),
      counts: {
        intents: bundle.intents.length,
        keywords: bundle.keywords.length,
        responses: bundle.responses.length
      }
    });
  }

  function handlePost(e) {
    var bodyText = e && e.postData ? (e.postData.contents || '{}') : '{}';
    var payload = parseJson_(bodyText, {});
    var events = Array.isArray(payload.events) ? payload.events : [];
    var results = [];

    events.forEach(function (event) {
      try {
        results.push(handleEvent_(event));
      } catch (error) {
        logEvent_(event, {
          matchedIntent: '',
          replyCount: 0,
          status: 'error',
          error: error.message
        });
        results.push({
          ok: false,
          eventType: event && event.type ? event.type : '',
          error: error.message
        });
      }
    });

    return jsonOutput_({
      ok: true,
      processed: events.length,
      results: results
    });
  }

  function handleEvent_(event) {
    var type = String(event && event.type ? event.type : '');

    if (type === 'message') {
      return handleMessage_(event);
    }

    if (type === 'follow') {
      return handleFollow_(event);
    }

    logEvent_(event, {
      matchedIntent: '',
      replyCount: 0,
      status: 'skipped',
      error: ''
    });

    return {
      ok: true,
      eventType: type,
      skipped: true
    };
  }

  function handleMessage_(event) {
    var message = event.message || {};
    var text = String(message.text || '');

    if (message.type !== 'text') {
      logEvent_(event, {
        matchedIntent: '',
        replyCount: 0,
        status: 'skipped',
        error: 'Only text messages are handled'
      });

      return {
        ok: true,
        eventType: 'message',
        skipped: true,
        reason: 'Only text messages are handled'
      };
    }

    var match = matchIntent_(text);
    var replies = match ? messagesForIntent_(match.intent.id) : [];

    if (!replies.length) {
      var fallbackText = sanitizeText_(getProperty_('LINE_DEFAULT_FALLBACK_TEXT', ''));
      if (fallbackText) {
        replies = [{
          type: 'text',
          text: fallbackText
        }];
      }
    }

    if (!replies.length) {
      logEvent_(event, {
        matchedIntent: match ? match.intent.key : '',
        replyCount: 0,
        status: 'no_match',
        error: ''
      });

      return {
        ok: true,
        eventType: 'message',
        skipped: true,
        reason: 'No matching intent'
      };
    }

    if (shouldShowLoading_(event)) {
      try {
        showLoading_(event.source.userId, Number(getProperty_('LINE_LOADING_SECONDS', '5')));
      } catch (error) {
        // Loading indicator is best-effort only.
      }
    }

    replyMessages_(event.replyToken, replies);

    logEvent_(event, {
      matchedIntent: match ? match.intent.key : '',
      replyCount: replies.length,
      status: 'replied',
      error: ''
    });

    return {
      ok: true,
      eventType: 'message',
      matchedIntent: match ? match.intent.key : '',
      replyCount: replies.length
    };
  }

  function handleFollow_(event) {
    var welcomeText = sanitizeText_(getProperty_('LINE_WELCOME_TEXT', ''));
    if (!welcomeText || !event.replyToken) {
      logEvent_(event, {
        matchedIntent: '',
        replyCount: 0,
        status: 'skipped',
        error: ''
      });

      return {
        ok: true,
        eventType: 'follow',
        skipped: true
      };
    }

    if (shouldShowLoading_(event)) {
      try {
        showLoading_(event.source.userId, Number(getProperty_('LINE_LOADING_SECONDS', '5')));
      } catch (error) {
        // Loading indicator is best-effort only.
      }
    }

    replyMessages_(event.replyToken, [{
      type: 'text',
      text: welcomeText
    }]);

    logEvent_(event, {
      matchedIntent: 'follow_welcome',
      replyCount: 1,
      status: 'replied',
      error: ''
    });

    return {
      ok: true,
      eventType: 'follow',
      replyCount: 1
    };
  }

  function setupLiteWebhook() {
    ensureLogSheet_();
    return {
      ok: true,
      logSheetName: getLogSheetName_()
    };
  }

  function testLiteConfig() {
    var bundle = getRuntimeBundle_();
    return {
      ok: true,
      spreadsheetId: getRequiredProperty_('SPREADSHEET_ID'),
      lineTokenConfigured: !!getProperty_('LINE_CHANNEL_ACCESS_TOKEN', ''),
      counts: {
        intents: bundle.intents.length,
        keywords: bundle.keywords.length,
        responses: bundle.responses.length,
        templates: Object.keys(bundle.templatesById).length
      }
    };
  }

  function matchIntent_(text) {
    var normalized = String(text || '').toLowerCase();
    var runtime = getRuntimeBundle_();
    var best = null;

    runtime.intents.forEach(function (intent) {
      var score = Number(intent.priority || 0);

      runtime.keywords.forEach(function (keyword) {
        if (String(keyword.intent_id) !== String(intent.id)) {
          return;
        }

        if (isKeywordMatch_(normalized, keyword.keyword, keyword.match_type || 'contains')) {
          score += Number(keyword.weight || 1);
        }
      });

      if (best == null || score > best.score) {
        best = {
          intent: intent,
          score: score
        };
      }
    });

    if (!best || best.score <= 0) {
      return null;
    }

    return best;
  }

  function messagesForIntent_(intentId) {
    var runtime = getRuntimeBundle_();
    var rows = runtime.responses.filter(function (row) {
      return String(row.intent_id) === String(intentId) && isActive_(row.is_active);
    });

    if (!rows.length) {
      return [];
    }

    return rows.map(function (row) {
      if (row.template_id) {
        var template = runtime.templatesById[row.template_id];
        if (template) {
          return normalizeLineMessage_(parseJson_(template.payload_json, {
            type: 'text',
            text: 'Template invalid'
          }));
        }
      }

      return normalizeLineMessage_(parseJson_(row.response_json, {
        type: 'text',
        text: 'Response invalid'
      }));
    });
  }

  function getRuntimeBundle_() {
    var cache = CacheService.getScriptCache();
    var cached = null;

    try {
      cached = cache.get(CACHE_KEY);
    } catch (error) {
      cached = null;
    }

    if (cached) {
      var parsed = parseJson_(cached, null);
      if (parsed) {
        return parsed;
      }
    }

    var built = buildRuntimeBundle_();

    try {
      cache.put(CACHE_KEY, JSON.stringify(built), CACHE_TTL_SEC);
    } catch (error) {
      // Ignore cache failures; the bot can still read from Sheets directly.
    }

    return built;
  }

  function buildRuntimeBundle_() {
    var intents = readTable_('intents', ['id', 'key', 'name', 'description', 'is_active', 'priority', 'created_at', 'updated_at'])
      .filter(function (row) {
        return isActive_(row.is_active);
      });
    var keywords = readTable_('intent_keywords', ['id', 'intent_id', 'keyword', 'match_type', 'weight', 'is_active', 'created_at', 'updated_at'])
      .filter(function (row) {
        return isActive_(row.is_active);
      });
    var responses = readTable_('intent_responses', ['id', 'intent_id', 'response_type', 'template_id', 'response_json', 'is_active', 'created_at', 'updated_at']);
    var templates = readTable_('response_templates', ['id', 'name', 'category', 'payload_json', 'is_system', 'is_active', 'created_at', 'updated_at']);
    var templatesById = {};

    templates.forEach(function (row) {
      if (isActive_(row.is_active)) {
        templatesById[row.id] = row;
      }
    });

    return {
      intents: intents,
      keywords: keywords,
      responses: responses,
      templatesById: templatesById
    };
  }

  function readTable_(sheetName, headers) {
    var sheet = openSpreadsheet_().getSheetByName(sheetName);
    if (!sheet) {
      return [];
    }

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return [];
    }

    return sheet.getRange(2, 1, lastRow - 1, headers.length).getValues()
      .map(function (row) {
        var item = {};
        headers.forEach(function (header, index) {
          item[header] = row[index];
        });
        return item;
      })
      .filter(function (row) {
        return String(row.id || '').trim() !== '';
      });
  }

  function replyMessages_(replyToken, messages) {
    if (!replyToken) {
      throw new Error('Missing replyToken');
    }

    lineRequest_('/message/reply', {
      replyToken: replyToken,
      messages: messages
    });
  }

  function showLoading_(userId, loadingSeconds) {
    if (!userId) {
      return;
    }

    lineRequest_('/chat/loading/start', {
      chatId: userId,
      loadingSeconds: normalizeLoadingSeconds_(loadingSeconds)
    });
  }

  function lineRequest_(path, payload) {
    var response = UrlFetchApp.fetch('https://api.line.me/v2/bot' + path, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + getRequiredProperty_('LINE_CHANNEL_ACCESS_TOKEN')
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var code = response.getResponseCode();
    var text = response.getContentText() || '{}';
    if (code >= 400) {
      throw new Error('LINE API error ' + code + ': ' + text);
    }

    return parseJson_(text, { raw: text });
  }

  function shouldShowLoading_(event) {
    return toBool_(getProperty_('LINE_ENABLE_LOADING_INDICATOR', 'false')) &&
      !!(event && event.source && event.source.userId);
  }

  function normalizeLoadingSeconds_(value) {
    var seconds = Number(value || 5);
    var allowed = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
    if (allowed.indexOf(seconds) >= 0) {
      return seconds;
    }
    return 5;
  }

  function logEvent_(event, meta) {
    var sheet = ensureLogSheet_();
    var message = event && event.message ? event.message : {};
    var text = message.type === 'text' ? String(message.text || '') : '[' + String(message.type || event.type || '') + ']';
    var row = [
      new Date().toISOString(),
      String(event && event.type ? event.type : ''),
      String(event && event.source && event.source.userId ? event.source.userId : ''),
      text,
      String(meta && meta.matchedIntent ? meta.matchedIntent : ''),
      Number(meta && meta.replyCount ? meta.replyCount : 0),
      String(meta && meta.status ? meta.status : ''),
      String(meta && meta.error ? meta.error : ''),
      JSON.stringify(event || {})
    ];

    sheet.appendRow(row);
  }

  function ensureLogSheet_() {
    var ss = openSpreadsheet_();
    var sheetName = getLogSheetName_();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(LOG_HEADERS);
      sheet.setFrozenRows(1);
    }

    return sheet;
  }

  function getLogSheetName_() {
    return getProperty_('LITE_LOG_SHEET_NAME', 'lite_webhook_logs');
  }

  function openSpreadsheet_() {
    return SpreadsheetApp.openById(getRequiredProperty_('SPREADSHEET_ID'));
  }

  function getProperty_(key, fallbackValue) {
    var value = PropertiesService.getScriptProperties().getProperty(key);
    return value == null || value === '' ? fallbackValue : value;
  }

  function getRequiredProperty_(key) {
    var value = getProperty_(key, '');
    if (!value) {
      throw new Error('Missing script property: ' + key);
    }
    return value;
  }

  function parseJson_(value, fallbackValue) {
    if (value == null || value === '') {
      return fallbackValue;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      return fallbackValue;
    }
  }

  function jsonOutput_(data) {
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  function sanitizeText_(value) {
    return String(value == null ? '' : value).trim();
  }

  function toBool_(value) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    var normalized = String(value || '').toLowerCase();
    return normalized === 'true' || normalized === '1';
  }

  function isActive_(value) {
    return value === '' || toBool_(value);
  }

  function isKeywordMatch_(text, keyword, matchType) {
    var normalizedKeyword = String(keyword || '').toLowerCase();
    if (!normalizedKeyword) {
      return false;
    }

    if (matchType === 'exact') {
      return text === normalizedKeyword;
    }

    if (matchType === 'starts_with') {
      return text.indexOf(normalizedKeyword) === 0;
    }

    if (matchType === 'regex') {
      try {
        return new RegExp(keyword, 'i').test(text);
      } catch (error) {
        return false;
      }
    }

    return text.indexOf(normalizedKeyword) >= 0;
  }

  function normalizeLineMessage_(payload) {
    var type = payload.type;

    if (type === 'textV2' || type === 'text') {
      return {
        type: 'text',
        text: payload.text || ''
      };
    }

    if (type === 'sticker') {
      return {
        type: 'sticker',
        packageId: String(payload.packageId || ''),
        stickerId: String(payload.stickerId || '')
      };
    }

    if (type === 'image') {
      return {
        type: 'image',
        originalContentUrl: payload.originalContentUrl,
        previewImageUrl: payload.previewImageUrl || payload.originalContentUrl
      };
    }

    if (type === 'video') {
      return {
        type: 'video',
        originalContentUrl: payload.originalContentUrl,
        previewImageUrl: payload.previewImageUrl
      };
    }

    if (type === 'audio') {
      return {
        type: 'audio',
        originalContentUrl: payload.originalContentUrl,
        duration: Number(payload.duration || 1000)
      };
    }

    if (type === 'location') {
      return {
        type: 'location',
        title: payload.title || 'Location',
        address: payload.address || '-',
        latitude: Number(payload.latitude || 0),
        longitude: Number(payload.longitude || 0)
      };
    }

    if (type === 'template' || type === 'flex' || type === 'imagemap') {
      return payload;
    }

    return {
      type: 'text',
      text: payload.text || 'Unsupported message template'
    };
  }

  return {
    handleGet: handleGet,
    handlePost: handlePost,
    setupLiteWebhook: setupLiteWebhook,
    testLiteConfig: testLiteConfig
  };
})();

function doGet() {
  return LiteWebhookApp.handleGet();
}

function doPost(e) {
  return LiteWebhookApp.handlePost(e || {});
}

function setupLiteWebhook() {
  return LiteWebhookApp.setupLiteWebhook();
}

function testLiteConfig() {
  return LiteWebhookApp.testLiteConfig();
}
