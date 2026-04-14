var App = App || {};

function doGet(e) {
  return App.Main.handleGet(e || {});
}

function doPost(e) {
  return App.Main.handlePost(e || {});
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function apiDispatch(request) {
  return App.Main.apiDispatch(request || {});
}

function setupInitialize() {
  return App.Setup.initialize();
}

function setupSeedDemoData() {
  return App.Setup.seedDemoData();
}
