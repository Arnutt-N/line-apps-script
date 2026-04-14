var App = App || {};

App.Templates = (function () {
  function list(payload) {
    payload = payload || {};
    var category = payload.category || '';
    var rows = App.SheetsRepo.readAll('response_templates').filter(function (row) {
      var active = row.is_active === '' || App.Utils.toBool(row.is_active);
      var categoryMatch = !category || row.category === category;
      return active && categoryMatch;
    });

    return {
      items: rows.map(normalize_)
    };
  }

  function create(payload, ctx) {
    var row = App.SheetsRepo.insert('response_templates', {
      name: payload.name || 'New Template',
      category: payload.category || 'object',
      payload_json: App.Utils.stringify(payload.payload || {}),
      is_system: 'false',
      is_active: 'true'
    });
    App.SheetsRepo.appendAudit(ctx.email, 'templates.create', 'response_templates', row.id, row);
    return normalize_(row);
  }

  function update(payload, ctx) {
    var row = App.SheetsRepo.updateById('response_templates', payload.id, {
      name: payload.name,
      category: payload.category,
      payload_json: App.Utils.stringify(payload.payload || {})
    });
    App.SheetsRepo.appendAudit(ctx.email, 'templates.update', 'response_templates', row.id, row);
    return normalize_(row);
  }

  function remove(payload, ctx) {
    var row = App.SheetsRepo.removeById('response_templates', payload.id);
    App.SheetsRepo.appendAudit(ctx.email, 'templates.delete', 'response_templates', payload.id, payload);
    return {
      removed: row != null,
      id: payload.id
    };
  }

  function clone(payload, ctx) {
    var source = App.SheetsRepo.findOne('response_templates', 'id', payload.id);
    if (!source) {
      throw new Error('Template not found');
    }

    var row = App.SheetsRepo.insert('response_templates', {
      name: (payload.name || source.name + ' (Copy)'),
      category: source.category,
      payload_json: source.payload_json,
      is_system: 'false',
      is_active: 'true'
    });

    App.SheetsRepo.appendAudit(ctx.email, 'templates.clone', 'response_templates', row.id, {
      sourceId: payload.id
    });

    return normalize_(row);
  }

  function normalize_(row) {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      payload: App.Utils.parseJson(row.payload_json, {}),
      isSystem: App.Utils.toBool(row.is_system),
      isActive: row.is_active === '' ? true : App.Utils.toBool(row.is_active),
      updatedAt: row.updated_at,
      createdAt: row.created_at
    };
  }

  return {
    list: list,
    create: create,
    update: update,
    remove: remove,
    clone: clone,
    normalize: normalize_
  };
})();
