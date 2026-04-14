var App = App || {};

App.Liff = (function () {
  function list() {
    return {
      items: App.SheetsRepo.readAll('liff_forms').map(function (row) {
        return {
          id: row.id,
          name: row.name,
          liffId: row.liff_id,
          status: row.status,
          schema: App.Utils.parseJson(row.schema_json, {}),
          publishedAt: row.published_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      })
    };
  }

  function create(payload, ctx) {
    var row = App.SheetsRepo.insert('liff_forms', {
      name: payload.name || 'New LIFF Form',
      liff_id: payload.liffId || '',
      status: 'draft',
      schema_json: App.Utils.stringify(payload.schema || defaultSchema_()),
      published_at: ''
    });

    App.SheetsRepo.appendAudit(ctx.email, 'liff.create', 'liff_forms', row.id, row);

    return {
      id: row.id,
      name: row.name,
      status: row.status
    };
  }

  function publish(payload, ctx) {
    var row = App.SheetsRepo.findOne('liff_forms', 'id', payload.id);
    if (!row) {
      throw new Error('LIFF form not found');
    }

    var updated = App.SheetsRepo.updateById('liff_forms', row.id, {
      status: 'published',
      liff_id: payload.liffId || row.liff_id,
      schema_json: App.Utils.stringify(payload.schema || App.Utils.parseJson(row.schema_json, {})),
      published_at: App.Utils.nowIso()
    });

    App.SheetsRepo.appendAudit(ctx.email, 'liff.publish', 'liff_forms', updated.id, updated);

    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      liffId: updated.liff_id,
      publishedAt: updated.published_at
    };
  }

  function remove(payload, ctx) {
    App.SheetsRepo.removeById('liff_forms', payload.id);
    App.SheetsRepo.appendAudit(ctx.email, 'liff.delete', 'liff_forms', payload.id, {});

    return {
      removed: true,
      id: payload.id
    };
  }

  function defaultSchema_() {
    return {
      version: 1,
      title: 'LIFF Form',
      fields: [
        { id: 'fullName', type: 'text', label: 'Full Name', required: true },
        { id: 'phone', type: 'tel', label: 'Phone', required: true },
        { id: 'note', type: 'textarea', label: 'Note', required: false }
      ]
    };
  }

  return {
    list: list,
    create: create,
    publish: publish,
    remove: remove
  };
})();
