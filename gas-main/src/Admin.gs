// Admin web-app entry for gas-main Phase 1 MVP.
//
// Single-entry routing:
//   - doGet(e)            → if e.parameter.mode === 'health' return JSON health
//                           else render Index.html (admin SPA shell)
//   - doPost(e)            → existing classic webhook handler (unchanged)
//   - apiDispatch(request) → callable from google.script.run, goes through AdminRouter
//
// This file owns the admin SPA bootstrap ONLY. Webhook logic stays in Code.gs.

var Admin = Admin || {};

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Called by google.script.run from the browser.
function apiDispatch(request) {
  try {
    var input = request || {};
    var action = String(input.action || '');
    var payload = input.payload || {};

    if (!action) {
      return { ok: false, error: 'Missing API action' };
    }

    var ctx = AdminAuth.getContext();
    if (!ctx.isAuthorized && action !== 'auth.whoami') {
      return { ok: false, error: 'Unauthorized account: ' + (ctx.email || '(empty email)') };
    }

    var data = AdminRouter.dispatch(action, payload, ctx);

    return {
      ok: true,
      action: action,
      data: data,
      serverTime: new Date().toISOString()
    };
  } catch (error) {
    console.log('apiDispatch error: ' + (error && error.stack || error));
    return { ok: false, error: String(error && error.message || error) };
  }
}

function renderAdminPanel_(e) {
  var params = (e && e.parameter) || {};
  var page = String(params.page || 'intents').toLowerCase();
  var ctx = AdminAuth.getContext();

  var template = HtmlService.createTemplateFromFile('Index');
  template.bootstrapJson = JSON.stringify({
    baseUrl: ScriptApp.getService().getUrl() || '',
    page: page,
    nowIso: new Date().toISOString(),
    user: {
      email: ctx.email,
      displayName: ctx.displayName,
      role: ctx.role,
      isAuthorized: ctx.isAuthorized
    }
  });

  return template
    .evaluate()
    .setTitle('LINE OA Admin — Phase 1 MVP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
