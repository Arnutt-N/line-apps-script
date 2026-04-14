var App = App || {};

App.RichMenu = (function () {
  function list() {
    var menus = App.SheetsRepo.readAll('rich_menus').filter(function (row) {
      return row.is_active === '' || App.Utils.toBool(row.is_active);
    });
    var actions = App.SheetsRepo.readAll('rich_menu_actions').filter(function (row) {
      return row.is_active === '' || App.Utils.toBool(row.is_active);
    });

    var actionMap = {};
    actions.forEach(function (action) {
      var key = String(action.rich_menu_id);
      if (!actionMap[key]) {
        actionMap[key] = [];
      }
      actionMap[key].push({
        id: action.id,
        bounds: App.Utils.parseJson(action.bounds_json, {}),
        actionType: action.action_type,
        label: action.label,
        data: App.Utils.parseJson(action.data_json, {})
      });
    });

    return {
      items: menus.map(function (menu) {
        return {
          id: menu.id,
          name: menu.name,
          size: menu.size,
          width: Number(menu.width || 2500),
          height: Number(menu.height || 1686),
          imageDriveId: menu.image_drive_id,
          imageUrl: menu.image_url,
          lineRichMenuId: menu.line_rich_menu_id,
          isDefault: App.Utils.toBool(menu.is_default),
          isActive: menu.is_active === '' ? true : App.Utils.toBool(menu.is_active),
          actions: actionMap[String(menu.id)] || []
        };
      })
    };
  }

  function create(payload, ctx) {
    var row = App.SheetsRepo.insert('rich_menus', {
      name: payload.name || 'New Rich Menu',
      size: payload.size || 'large',
      width: Number(payload.width || 2500),
      height: Number(payload.height || 1686),
      image_drive_id: '',
      image_url: '',
      line_rich_menu_id: '',
      is_default: payload.isDefault ? 'true' : 'false',
      is_active: 'true'
    });

    App.SheetsRepo.appendAudit(ctx.email, 'richmenu.create', 'rich_menus', row.id, row);

    return {
      id: row.id,
      name: row.name,
      size: row.size,
      width: Number(row.width),
      height: Number(row.height)
    };
  }

  function uploadImage(payload, ctx) {
    var menu = App.SheetsRepo.findOne('rich_menus', 'id', payload.richMenuId);
    if (!menu) {
      throw new Error('Rich menu not found');
    }

    var file = App.DriveRepo.saveDataUrl({
      filename: payload.fileName || ('rich_menu_' + Date.now() + '.png'),
      dataUrl: payload.dataUrl,
      folderName: 'rich_menu_images'
    });

    var updated = App.SheetsRepo.updateById('rich_menus', menu.id, {
      image_drive_id: file.id,
      image_url: file.url
    });

    App.SheetsRepo.appendAudit(ctx.email, 'richmenu.uploadImage', 'rich_menus', updated.id, {
      file: file
    });

    return {
      richMenuId: updated.id,
      imageDriveId: updated.image_drive_id,
      imageUrl: updated.image_url
    };
  }

  function saveActions(payload, ctx) {
    var menu = App.SheetsRepo.findOne('rich_menus', 'id', payload.richMenuId);
    if (!menu) {
      throw new Error('Rich menu not found');
    }

    App.SheetsRepo.readAll('rich_menu_actions').forEach(function (row) {
      if (String(row.rich_menu_id) === String(menu.id)) {
        App.SheetsRepo.updateById('rich_menu_actions', row.id, {
          is_active: 'false'
        });
      }
    });

    var actions = payload.actions || [];
    var created = actions.map(function (action) {
      return App.SheetsRepo.insert('rich_menu_actions', {
        rich_menu_id: menu.id,
        bounds_json: App.Utils.stringify(action.bounds || {}),
        action_type: action.actionType || 'message',
        label: action.label || '',
        data_json: App.Utils.stringify(action.data || {}),
        is_active: 'true'
      });
    });

    App.SheetsRepo.appendAudit(ctx.email, 'richmenu.saveActions', 'rich_menus', menu.id, {
      actionCount: created.length
    });

    return {
      richMenuId: menu.id,
      actionCount: created.length
    };
  }

  function publish(payload, ctx) {
    var menu = App.SheetsRepo.findOne('rich_menus', 'id', payload.richMenuId);
    if (!menu) {
      throw new Error('Rich menu not found');
    }

    var actions = App.SheetsRepo.readAll('rich_menu_actions').filter(function (row) {
      return String(row.rich_menu_id) === String(menu.id) && (row.is_active === '' || App.Utils.toBool(row.is_active));
    });

    var lineActions = actions.map(function (row) {
      var data = App.Utils.parseJson(row.data_json, {});
      var actionType = row.action_type || 'message';

      if (actionType === 'uri') {
        return {
          type: 'uri',
          label: row.label || data.label || 'Open',
          uri: data.uri || 'https://line.me'
        };
      }

      if (actionType === 'postback') {
        return {
          type: 'postback',
          label: row.label || data.label || 'Action',
          data: data.data || 'action=default',
          displayText: data.displayText || ''
        };
      }

      return {
        type: 'message',
        label: row.label || data.label || 'Message',
        text: data.text || row.label || 'menu'
      };
    });

    var payloadForLine = {
      size: {
        width: Number(menu.width || 2500),
        height: Number(menu.height || 1686)
      },
      selected: App.Utils.toBool(menu.is_default),
      name: menu.name,
      chatBarText: menu.name,
      areas: actions.map(function (row, index) {
        return {
          bounds: App.Utils.parseJson(row.bounds_json, { x: 0, y: index * 300, width: 2500, height: 300 }),
          action: lineActions[index]
        };
      })
    };

    var lineResponse = App.LineApi.createRichMenu(payloadForLine);
    var lineRichMenuId = lineResponse.richMenuId;

    if (menu.image_drive_id) {
      var file = DriveApp.getFileById(menu.image_drive_id);
      var blob = file.getBlob();
      App.LineApi.uploadRichMenuImage(lineRichMenuId, blob);
    }

    if (App.Utils.toBool(menu.is_default)) {
      App.LineApi.setDefaultRichMenu(lineRichMenuId);
    }

    var updated = App.SheetsRepo.updateById('rich_menus', menu.id, {
      line_rich_menu_id: lineRichMenuId
    });

    App.SheetsRepo.appendAudit(ctx.email, 'richmenu.publish', 'rich_menus', updated.id, {
      lineRichMenuId: lineRichMenuId
    });

    return {
      id: updated.id,
      lineRichMenuId: lineRichMenuId
    };
  }

  function setDefault(payload, ctx) {
    var menu = App.SheetsRepo.findOne('rich_menus', 'id', payload.richMenuId);
    if (!menu) {
      throw new Error('Rich menu not found');
    }
    if (!menu.line_rich_menu_id) {
      throw new Error('Rich menu not published to LINE yet');
    }

    App.SheetsRepo.readAll('rich_menus').forEach(function (row) {
      if (App.Utils.toBool(row.is_default)) {
        App.SheetsRepo.updateById('rich_menus', row.id, { is_default: 'false' });
      }
    });

    App.LineApi.setDefaultRichMenu(menu.line_rich_menu_id);
    var updated = App.SheetsRepo.updateById('rich_menus', menu.id, {
      is_default: 'true'
    });

    App.SheetsRepo.appendAudit(ctx.email, 'richmenu.setDefault', 'rich_menus', updated.id, {});

    return {
      id: updated.id,
      isDefault: true
    };
  }

  function remove(payload, ctx) {
    var menu = App.SheetsRepo.findOne('rich_menus', 'id', payload.id);
    if (!menu) {
      return { removed: false, id: payload.id };
    }

    if (menu.line_rich_menu_id) {
      try {
        App.LineApi.deleteRichMenu(menu.line_rich_menu_id);
      } catch (error) {
      }
    }

    App.SheetsRepo.updateById('rich_menus', menu.id, {
      is_active: 'false'
    });

    App.SheetsRepo.appendAudit(ctx.email, 'richmenu.delete', 'rich_menus', menu.id, {});

    return {
      removed: true,
      id: menu.id
    };
  }

  return {
    list: list,
    create: create,
    uploadImage: uploadImage,
    saveActions: saveActions,
    publish: publish,
    setDefault: setDefault,
    remove: remove
  };
})();
