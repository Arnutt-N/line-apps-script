var App = App || {};

App.SystemApi = (function () {
  function schemas() {
    return {
      tables: App.SheetsRepo.listSchemas()
    };
  }

  function health() {
    return {
      nowIso: App.Utils.nowIso(),
      missingConfig: App.Config.validateRequired(),
      tableCount: App.SheetsRepo.listSchemas().length
    };
  }

  return {
    schemas: schemas,
    health: health
  };
})();
