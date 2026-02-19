var App = App || {};

App.AutoReply = (function () {
  function list() {
    var intents = App.SheetsRepo.readAll('intents').map(function (row) {
      return {
        id: row.id,
        key: row.key,
        name: row.name,
        description: row.description,
        isActive: row.is_active === '' ? true : App.Utils.toBool(row.is_active),
        priority: Number(row.priority || 0)
      };
    });

    var keywords = App.SheetsRepo.readAll('intent_keywords').map(function (row) {
      return {
        id: row.id,
        intentId: row.intent_id,
        keyword: row.keyword,
        matchType: row.match_type || 'contains',
        weight: Number(row.weight || 1),
        isActive: row.is_active === '' ? true : App.Utils.toBool(row.is_active)
      };
    });

    var responses = App.SheetsRepo.readAll('intent_responses').map(function (row) {
      return {
        id: row.id,
        intentId: row.intent_id,
        responseType: row.response_type,
        templateId: row.template_id,
        response: App.Utils.parseJson(row.response_json, {}),
        isActive: row.is_active === '' ? true : App.Utils.toBool(row.is_active)
      };
    });

    return {
      intents: intents,
      keywords: keywords,
      responses: responses,
      templates: App.Templates.list({ category: '' }).items
    };
  }

  function createIntent(payload, ctx) {
    var row = App.SheetsRepo.insert('intents', {
      key: payload.key || ('intent_' + Date.now()),
      name: payload.name || 'New Intent',
      description: payload.description || '',
      is_active: payload.isActive == null ? 'true' : String(Boolean(payload.isActive)),
      priority: Number(payload.priority || 0)
    });

    App.SheetsRepo.appendAudit(ctx.email, 'autoreply.createIntent', 'intents', row.id, row);
    return row;
  }

  function updateIntent(payload, ctx) {
    var row = App.SheetsRepo.updateById('intents', payload.id, {
      key: payload.key,
      name: payload.name,
      description: payload.description,
      is_active: String(Boolean(payload.isActive)),
      priority: Number(payload.priority || 0)
    });

    App.SheetsRepo.appendAudit(ctx.email, 'autoreply.updateIntent', 'intents', row.id, row);
    return row;
  }

  function deleteIntent(payload, ctx) {
    App.SheetsRepo.removeById('intents', payload.id);

    App.SheetsRepo.readAll('intent_keywords').forEach(function (row) {
      if (String(row.intent_id) === String(payload.id)) {
        App.SheetsRepo.removeById('intent_keywords', row.id);
      }
    });

    App.SheetsRepo.readAll('intent_responses').forEach(function (row) {
      if (String(row.intent_id) === String(payload.id)) {
        App.SheetsRepo.removeById('intent_responses', row.id);
      }
    });

    App.SheetsRepo.appendAudit(ctx.email, 'autoreply.deleteIntent', 'intents', payload.id, {});

    return {
      removed: true,
      id: payload.id
    };
  }

  function upsertKeyword(payload, ctx) {
    var data = {
      intent_id: payload.intentId,
      keyword: payload.keyword,
      match_type: payload.matchType || 'contains',
      weight: Number(payload.weight || 1),
      is_active: payload.isActive == null ? 'true' : String(Boolean(payload.isActive))
    };

    var row;
    if (payload.id) {
      row = App.SheetsRepo.updateById('intent_keywords', payload.id, data);
    } else {
      row = App.SheetsRepo.insert('intent_keywords', data);
    }

    App.SheetsRepo.appendAudit(ctx.email, 'autoreply.upsertKeyword', 'intent_keywords', row.id, row);

    return row;
  }

  function upsertResponse(payload, ctx) {
    var data = {
      intent_id: payload.intentId,
      response_type: payload.responseType || 'template',
      template_id: payload.templateId || '',
      response_json: App.Utils.stringify(payload.response || {}),
      is_active: payload.isActive == null ? 'true' : String(Boolean(payload.isActive))
    };

    var row;
    if (payload.id) {
      row = App.SheetsRepo.updateById('intent_responses', payload.id, data);
    } else {
      row = App.SheetsRepo.insert('intent_responses', data);
    }

    App.SheetsRepo.appendAudit(ctx.email, 'autoreply.upsertResponse', 'intent_responses', row.id, row);
    return row;
  }

  function testMatch(payload) {
    var input = App.Utils.sanitizeText(payload.text || '');
    var match = matchIntent_(input);
    if (!match) {
      return {
        matched: false,
        text: input,
        intent: null,
        score: 0,
        messages: []
      };
    }

    return {
      matched: true,
      text: input,
      intent: match.intent,
      score: match.score,
      messages: messagesForIntent_(match.intent.id)
    };
  }

  function matchIntent_(text) {
    var normalized = String(text || '').toLowerCase();
    var intents = App.SheetsRepo.readAll('intents').filter(function (row) {
      return row.is_active === '' || App.Utils.toBool(row.is_active);
    });
    var keywords = App.SheetsRepo.readAll('intent_keywords').filter(function (row) {
      return row.is_active === '' || App.Utils.toBool(row.is_active);
    });

    var best = null;

    intents.forEach(function (intent) {
      var score = Number(intent.priority || 0);
      keywords.forEach(function (kw) {
        if (String(kw.intent_id) !== String(intent.id)) {
          return;
        }
        if (isKeywordMatch_(normalized, kw.keyword, kw.match_type || 'contains')) {
          score += Number(kw.weight || 1);
        }
      });

      if (best == null || score > best.score) {
        best = {
          intent: {
            id: intent.id,
            key: intent.key,
            name: intent.name,
            description: intent.description
          },
          score: score
        };
      }
    });

    if (!best || best.score <= 0) {
      return null;
    }

    return best;
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

    if (type === 'textV2') {
      return {
        type: 'text',
        text: payload.text || ''
      };
    }

    if (type === 'text') {
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
      text: payload.text || 'Unsupported template message'
    };
  }

  function messagesForIntent_(intentId) {
    var responses = App.SheetsRepo.readAll('intent_responses').filter(function (row) {
      var active = row.is_active === '' || App.Utils.toBool(row.is_active);
      return active && String(row.intent_id) === String(intentId);
    });

    if (!responses.length) {
      return [{ type: 'text', text: 'รับทราบครับ' }];
    }

    return responses.map(function (row) {
      if (row.template_id) {
        var template = App.SheetsRepo.findOne('response_templates', 'id', row.template_id);
        if (template) {
          return normalizeLineMessage_(App.Utils.parseJson(template.payload_json, { type: 'text', text: 'Template invalid' }));
        }
      }
      return normalizeLineMessage_(App.Utils.parseJson(row.response_json, { type: 'text', text: 'Response invalid' }));
    });
  }

  function getAutoReplyMessages(text) {
    var match = matchIntent_(text || '');
    if (!match) {
      return [];
    }
    return messagesForIntent_(match.intent.id);
  }

  return {
    list: list,
    createIntent: createIntent,
    updateIntent: updateIntent,
    deleteIntent: deleteIntent,
    upsertKeyword: upsertKeyword,
    upsertResponse: upsertResponse,
    testMatch: testMatch,
    getAutoReplyMessages: getAutoReplyMessages
  };
})();
