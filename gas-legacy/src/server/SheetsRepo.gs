var App = App || {};

App.SheetsRepo = (function () {
  var READ_CACHE = {};
  var SCHEMAS = {
    users: ['id', 'line_user_id', 'display_name', 'picture_url', 'status_message', 'language', 'followed_at', 'unfollowed_at', 'readded_count', 'last_seen_at', 'tags', 'notes', 'is_blocked', 'current_state', 'created_at', 'updated_at'],
    chat_rooms: ['id', 'user_id', 'mode', 'assigned_admin', 'last_message_at', 'last_message_text', 'unread_count', 'status', 'created_at', 'updated_at'],
    chat_messages: ['id', 'room_id', 'user_id', 'sender_type', 'sender_id', 'message_type', 'text', 'payload_json', 'file_drive_id', 'file_url', 'status', 'is_read', 'created_at', 'updated_at'],
    friend_histories: ['id', 'user_id', 'event_type', 'source', 'ref_code', 'nth_add', 'event_at', 'payload_json', 'created_at', 'updated_at'],
    intents: ['id', 'key', 'name', 'description', 'is_active', 'priority', 'created_at', 'updated_at'],
    intent_keywords: ['id', 'intent_id', 'keyword', 'match_type', 'weight', 'is_active', 'created_at', 'updated_at'],
    intent_responses: ['id', 'intent_id', 'response_type', 'template_id', 'response_json', 'is_active', 'created_at', 'updated_at'],
    response_templates: ['id', 'name', 'category', 'payload_json', 'is_system', 'is_active', 'created_at', 'updated_at'],
    object_templates: ['id', 'variable_key', 'name', 'message_type', 'payload_json', 'description', 'is_system', 'is_active', 'created_at', 'updated_at'],
    template_variables: ['id', 'var_key', 'var_name', 'var_value', 'description', 'is_system', 'is_active', 'created_at', 'updated_at'],
    rich_menus: ['id', 'name', 'size', 'width', 'height', 'image_drive_id', 'image_url', 'line_rich_menu_id', 'is_default', 'is_active', 'pack_id', 'created_at', 'updated_at'],
    rich_menu_actions: ['id', 'rich_menu_id', 'bounds_json', 'action_type', 'label', 'data_json', 'is_active', 'created_at', 'updated_at'],
    rich_menu_packs: ['id', 'pack_key', 'name', 'vertical', 'description', 'cover_image_url', 'is_current', 'is_system', 'is_active', 'created_at', 'updated_at'],
    liff_forms: ['id', 'name', 'liff_id', 'status', 'schema_json', 'published_at', 'created_at', 'updated_at'],
    admin_users: ['id', 'email', 'display_name', 'role', 'status', 'last_login_at', 'created_at', 'updated_at'],
    roles: ['id', 'role_key', 'role_name', 'description', 'is_system', 'created_at', 'updated_at'],
    permissions: ['id', 'role_key', 'permission_key', 'is_allowed', 'created_at', 'updated_at'],
    system_settings: ['id', 'setting_key', 'setting_value', 'setting_type', 'is_secret', 'updated_by', 'created_at', 'updated_at'],
    audit_logs: ['id', 'actor_email', 'action_key', 'target_type', 'target_id', 'detail_json', 'ip_hash', 'created_at', 'updated_at'],
    job_queue: ['id', 'job_type', 'status', 'payload_json', 'retry_count', 'next_run_at', 'last_error', 'created_at', 'updated_at'],
    metrics_daily: ['id', 'metric_date', 'active_chats', 'manual_chats', 'messages_in', 'messages_out', 'unresolved_chats', 'intent_hit_rate', 'avg_first_response_sec', 'created_at', 'updated_at']
  };

  function open_() {
    return SpreadsheetApp.openById(App.Config.getSpreadsheetId());
  }

  function ensureAll() {
    var ss = open_();
    Object.keys(SCHEMAS).forEach(function (name) {
      ensureSheet_(ss, name, SCHEMAS[name]);
    });
  }

  function ensureSheet_(ss, name, headers) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }

    var currentHeaders = sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      : [];

    var needReset = currentHeaders.length !== headers.length || headers.some(function (header, idx) {
      return currentHeaders[idx] !== header;
    });

    if (needReset) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }

    return sheet;
  }

  function sheet_(name) {
    var headers = SCHEMAS[name];
    if (!headers) {
      throw new Error('Unknown table: ' + name);
    }
    var ss = open_();
    return ensureSheet_(ss, name, headers);
  }

  function headers_(name) {
    return SCHEMAS[name];
  }

  function readAll(name) {
    if (READ_CACHE[name]) {
      return cloneRows_(READ_CACHE[name]);
    }

    var sheet = sheet_(name);
    var headers = headers_(name);
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return [];
    }

    var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    var rows = values
      .map(function (row) {
        var obj = {};
        headers.forEach(function (h, idx) {
          obj[h] = row[idx];
        });
        return obj;
      })
      .filter(function (row) {
        return String(row.id || '').trim() !== '';
      });

    READ_CACHE[name] = cloneRows_(rows);
    return cloneRows_(READ_CACHE[name]);
  }

  function indexById_(rows) {
    var index = {};
    rows.forEach(function (row, i) {
      index[String(row.id)] = i;
    });
    return index;
  }

  function insert(name, data) {
    var sheet = sheet_(name);
    var headers = headers_(name);
    var now = App.Utils.nowIso();
    var row = Object.assign({}, data || {});

    row.id = row.id || App.Utils.uuid();
    if (headers.indexOf('created_at') >= 0) {
      row.created_at = row.created_at || now;
    }
    if (headers.indexOf('updated_at') >= 0) {
      row.updated_at = now;
    }

    var values = headers.map(function (h) {
      return row[h] == null ? '' : row[h];
    });
    sheet.appendRow(values);
    invalidateCache_(name);
    return row;
  }

  function updateById(name, id, patch) {
    var sheet = sheet_(name);
    var headers = headers_(name);
    var rows = readAll(name);
    var index = indexById_(rows);
    var rowIndex = index[String(id)];

    if (rowIndex == null) {
      throw new Error('Row not found: ' + name + ':' + id);
    }

    var target = rows[rowIndex];
    Object.keys(patch || {}).forEach(function (key) {
      target[key] = patch[key];
    });

    if (headers.indexOf('updated_at') >= 0) {
      target.updated_at = App.Utils.nowIso();
    }

    var values = headers.map(function (h) {
      return target[h] == null ? '' : target[h];
    });

    sheet.getRange(rowIndex + 2, 1, 1, headers.length).setValues([values]);
    invalidateCache_(name);
    return target;
  }

  function upsert(name, keyField, row) {
    keyField = keyField || 'id';
    var rows = readAll(name);
    var found = rows.find(function (r) {
      return String(r[keyField]) === String(row[keyField]);
    });
    if (found) {
      return updateById(name, found.id, row);
    }
    return insert(name, row);
  }

  function findOne(name, key, value) {
    var rows = readAll(name);
    for (var i = 0; i < rows.length; i += 1) {
      if (String(rows[i][key]) === String(value)) {
        return rows[i];
      }
    }
    return null;
  }

  function findMany(name, criteria) {
    criteria = criteria || {};
    return readAll(name).filter(function (row) {
      return Object.keys(criteria).every(function (key) {
        return String(row[key]) === String(criteria[key]);
      });
    });
  }

  function removeById(name, id) {
    var row = findOne(name, 'id', id);
    if (!row) {
      return null;
    }
    if (Object.prototype.hasOwnProperty.call(row, 'is_active')) {
      return updateById(name, id, { is_active: 'false' });
    }

    var sheet = sheet_(name);
    var headers = headers_(name);
    var rows = readAll(name);
    var idx = rows.findIndex(function (r) {
      return String(r.id) === String(id);
    });

    if (idx >= 0) {
      sheet.deleteRow(idx + 2);
    }
    invalidateCache_(name);
    return row;
  }

  function cloneRows_(rows) {
    return rows.map(function (row) {
      return Object.assign({}, row);
    });
  }

  function invalidateCache_(name) {
    delete READ_CACHE[name];
  }

  function appendAudit(actorEmail, actionKey, targetType, targetId, detail) {
    return insert('audit_logs', {
      actor_email: actorEmail || '',
      action_key: actionKey || '',
      target_type: targetType || '',
      target_id: targetId || '',
      detail_json: App.Utils.stringify(detail || {}),
      ip_hash: ''
    });
  }

  function listSchemas() {
    return Object.keys(SCHEMAS).map(function (name) {
      return {
        table: name,
        columns: SCHEMAS[name]
      };
    });
  }

  return {
    SCHEMAS: SCHEMAS,
    ensureAll: ensureAll,
    readAll: readAll,
    insert: insert,
    updateById: updateById,
    upsert: upsert,
    findOne: findOne,
    findMany: findMany,
    removeById: removeById,
    appendAudit: appendAudit,
    listSchemas: listSchemas
  };
})();
