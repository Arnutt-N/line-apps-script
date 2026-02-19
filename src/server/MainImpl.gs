var App = App || {};

App.Main = (function () {
  function handleGet(e) {
    var params = e.parameter || {};
    var page = normalizePage_((params.page || 'dashboard').toLowerCase());
    var standalonePage = page === 'chat' ? 'chat' : '';
    var ctx = App.Auth.getContext();

    var template = HtmlService.createTemplateFromFile('Index');
    template.bootstrapJson = JSON.stringify({
      baseUrl: ScriptApp.getService().getUrl() || '',
      page: page,
      standalonePage: standalonePage,
      nowIso: App.Utils.nowIso(),
      user: {
        email: ctx.email,
        displayName: ctx.admin.display_name || ctx.email,
        role: ctx.admin.role || 'viewer'
      }
    });

    return template
      .evaluate()
      .setTitle('LINE OA Platform')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  function handlePost(e) {
    var params = e.parameter || {};
    var route = (params.route || 'api').toLowerCase();

    if (route === 'webhook') {
      try {
        var result = App.Webhook.handle(e || {});
        return App.Utils.jsonOutput(result);
      } catch (error) {
        // Log error but still return 200 to prevent LINE retry
        return App.Utils.jsonOutput({
          ok: false,
          error: error.message
        });
      }
    }

    var body = App.Utils.readJsonBody(e);
    var response = apiDispatch(body || {});
    return App.Utils.jsonOutput(response);
  }

  function apiDispatch(request) {
    var action = request.action || '';
    var payload = request.payload || {};

    if (!action) {
      throw new Error('Missing API action');
    }

    var ctx = App.Auth.requireContext();
    var result = App.Router.dispatch(action, payload, ctx);

    return {
      ok: true,
      action: action,
      data: result,
      serverTime: App.Utils.nowIso()
    };
  }

  
  function normalizePage_(page) {
    var map = {
      'live-chat': 'chat',
      'rich-menu': 'richmenu',
      'auto-reply': 'autoreply',
      'object-template': 'templates',
      'friend-histories': 'histories',
      'chat-histories': 'histories',
      'liff-management': 'liff'
    };
    return map[page] || page;
  }
  return {
    handleGet: handleGet,
    handlePost: handlePost,
    apiDispatch: apiDispatch
  };
})();

