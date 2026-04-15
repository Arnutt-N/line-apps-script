// Action → handler registry for the admin panel.
// To add a new endpoint: add an entry here + implement the matching handler.

var AdminRouter = (function () {
  var MAP = {
    'auth.whoami':         { public: true,  handler: function (p, ctx) { return ctx; } },

    'intents.list':        { handler: function (p, ctx) { return AdminIntents.list(); } },
    'intents.get':         { handler: function (p, ctx) { return AdminIntents.get(p); } },
    'intents.save':        { handler: function (p, ctx) { return AdminIntents.save(p); } },
    'intents.delete':      { handler: function (p, ctx) { return AdminIntents.remove(p); } },
    'intents.purgeCache':  { handler: function (p, ctx) { purgeIntentCache(); return { ok: true }; } },
    'intents.testMatch':   { handler: function (p, ctx) { return AdminIntents.testMatch(p); } },

    'histories.chats':     { handler: function (p, ctx) { return AdminHistories.chats(p); } },
    'histories.friends':   { handler: function (p, ctx) { return AdminHistories.friends(p); } },

    'flex.presets':        { handler: function (p, ctx) { return FlexPresets.list(); } },
    'flex.render':         { handler: function (p, ctx) { return FlexPresets.render(p); } }
  };

  function dispatch(action, payload, ctx) {
    var node = MAP[action];
    if (!node) {
      throw new Error('Unknown action: ' + action);
    }
    if (!node.public) {
      AdminAuth.requireAuthorized(ctx);
    }
    return node.handler(payload || {}, ctx);
  }

  return {
    dispatch: dispatch
  };
})();
