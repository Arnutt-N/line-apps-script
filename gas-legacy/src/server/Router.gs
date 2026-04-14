var App = App || {};

App.Router = (function () {
  var MAP = {
    'dashboard.summary': { permission: 'dashboard.view', handlerPath: 'Dashboard.summary' },

    'chat.listUsers': { permission: 'chat.view', handlerPath: 'Chat.listUsers' },
    'chat.getRoom': { permission: 'chat.view', handlerPath: 'Chat.getRoom' },
    'chat.sendMessage': { permission: 'chat.send', handlerPath: 'Chat.sendMessage' },
    'chat.toggleMode': { permission: 'chat.manage', handlerPath: 'Chat.toggleMode' },
    'chat.pollUpdates': { permission: 'chat.view', handlerPath: 'Chat.pollUpdates' },
    'chat.runtimeConfig': { permission: 'chat.view', handlerPath: 'Chat.runtimeConfig' },

    'richmenu.list': { permission: 'richmenu.manage', handlerPath: 'RichMenu.list' },
    'richmenu.create': { permission: 'richmenu.manage', handlerPath: 'RichMenu.create' },
    'richmenu.uploadImage': { permission: 'richmenu.manage', handlerPath: 'RichMenu.uploadImage' },
    'richmenu.saveActions': { permission: 'richmenu.manage', handlerPath: 'RichMenu.saveActions' },
    'richmenu.publish': { permission: 'richmenu.manage', handlerPath: 'RichMenu.publish' },
    'richmenu.setDefault': { permission: 'richmenu.manage', handlerPath: 'RichMenu.setDefault' },
    'richmenu.delete': { permission: 'richmenu.manage', handlerPath: 'RichMenu.remove' },

    'autoreply.list': { permission: 'autoreply.manage', handlerPath: 'AutoReply.list' },
    'autoreply.createIntent': { permission: 'autoreply.manage', handlerPath: 'AutoReply.createIntent' },
    'autoreply.updateIntent': { permission: 'autoreply.manage', handlerPath: 'AutoReply.updateIntent' },
    'autoreply.deleteIntent': { permission: 'autoreply.manage', handlerPath: 'AutoReply.deleteIntent' },
    'autoreply.upsertKeyword': { permission: 'autoreply.manage', handlerPath: 'AutoReply.upsertKeyword' },
    'autoreply.upsertResponse': { permission: 'autoreply.manage', handlerPath: 'AutoReply.upsertResponse' },
    'autoreply.testMatch': { permission: 'autoreply.manage', handlerPath: 'AutoReply.testMatch' },

    'templates.list': { permission: 'templates.manage', handlerPath: 'Templates.list' },
    'templates.create': { permission: 'templates.manage', handlerPath: 'Templates.create' },
    'templates.update': { permission: 'templates.manage', handlerPath: 'Templates.update' },
    'templates.delete': { permission: 'templates.manage', handlerPath: 'Templates.remove' },
    'templates.clone': { permission: 'templates.manage', handlerPath: 'Templates.clone' },

    'histories.friends': { permission: 'histories.view', handlerPath: 'Histories.friends' },
    'histories.chats': { permission: 'histories.view', handlerPath: 'Histories.chats' },

    'liff.list': { permission: 'liff.manage', handlerPath: 'Liff.list' },
    'liff.create': { permission: 'liff.manage', handlerPath: 'Liff.create' },
    'liff.publish': { permission: 'liff.manage', handlerPath: 'Liff.publish' },
    'liff.delete': { permission: 'liff.manage', handlerPath: 'Liff.remove' },

    'settings.get': { permission: 'settings.manage', handlerPath: 'Settings.getAll' },
    'settings.update': { permission: 'settings.manage', handlerPath: 'Settings.update' },
    'settings.testConnection': { permission: 'settings.manage', handlerPath: 'Settings.testConnection' },

    'system.schemas': { permission: 'settings.admin', handlerPath: 'SystemApi.schemas' },
    'system.health': { permission: 'settings.admin', handlerPath: 'SystemApi.health' }
  };

  function dispatch(action, payload, ctx) {
    var node = MAP[action];
    if (!node) {
      throw new Error('Unknown action: ' + action);
    }

    App.Auth.requirePermission(ctx, node.permission);

    var handler = resolveHandler_(node.handlerPath);
    if (typeof handler !== 'function') {
      throw new Error('Invalid handler for action: ' + action);
    }

    var result = handler(payload || {}, ctx);

    App.SheetsRepo.appendAudit(ctx.email, action, 'api_action', action, {
      payload: payload || {}
    });

    return result;
  }

  function resolveHandler_(path) {
    var parts = String(path || '').split('.');
    var ref = App;

    for (var i = 0; i < parts.length; i += 1) {
      ref = ref[parts[i]];
      if (ref == null) {
        return null;
      }
    }

    return ref;
  }

  return {
    dispatch: dispatch
  };
})();

