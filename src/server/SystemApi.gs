var App = App || {};

App.SystemApi = (function () {
  function schemas() {
    return {
      tables: App.SheetsRepo.listSchemas()
    };
  }

  function health() {
    var requireSig = App.Config.getLineRequireSignature();
    return {
      nowIso: App.Utils.nowIso(),
      missingConfig: App.Config.validateRequired(),
      tableCount: App.SheetsRepo.listSchemas().length,
      webhook: {
        signatureRequired: requireSig,
        directGasWebhookSupportsSignatureCheck: false,
        status: requireSig ? 'misconfigured' : 'direct_gas_compatible',
        message: requireSig ?
          'Apps Script web apps do not expose X-Line-Signature. Disable LINE_REQUIRE_SIGNATURE or verify signatures in a proxy before forwarding to GAS.' :
          'Direct GAS webhook mode. LINE signature verification is disabled at the GAS layer.'
      }
    };
  }

  return {
    schemas: schemas,
    health: health
  };
})();
