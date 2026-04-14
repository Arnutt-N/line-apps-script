var App = App || {};

App.SystemApi = (function () {
  function schemas() {
    return {
      tables: App.SheetsRepo.listSchemas()
    };
  }

  function health() {
    var requireSig = App.Config.getLineRequireSignature();
    var proxyProtected = !!App.Config.getWebhookProxySharedSecret();
    return {
      nowIso: App.Utils.nowIso(),
      missingConfig: App.Config.validateRequired(),
      tableCount: App.SheetsRepo.listSchemas().length,
      webhook: {
        mode: proxyProtected ? 'proxy_enforced' : 'direct_gas',
        signatureRequired: requireSig,
        proxyProtectionConfigured: proxyProtected,
        directGasWebhookSupportsSignatureCheck: false,
        status: proxyProtected ? 'proxy_protected' : (requireSig ? 'misconfigured' : 'direct_gas_compatible'),
        message: proxyProtected ?
          'Proxy-enforced webhook mode. The proxy must verify LINE signatures and inject the shared proxy token before forwarding to GAS.' :
          requireSig ?
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
