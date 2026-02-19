var App = App || {};

App.Config = (function () {
  var REQUIRED = [
    'SPREADSHEET_ID',
    'DRIVE_ROOT_FOLDER_ID'
  ];

  function get(key, fallbackValue) {
    var value = PropertiesService.getScriptProperties().getProperty(key);
    return value == null || value === '' ? fallbackValue : value;
  }

  function requireKey(key) {
    var value = get(key, '');
    if (!value) {
      throw new Error('Missing script property: ' + key);
    }
    return value;
  }

  function getSpreadsheetId() {
    return requireKey('SPREADSHEET_ID');
  }

  function getDriveRootFolderId() {
    return requireKey('DRIVE_ROOT_FOLDER_ID');
  }

  function getLineChannelAccessToken() {
    return get('LINE_CHANNEL_ACCESS_TOKEN', '');
  }

  function getLineChannelSecret() {
    return get('LINE_CHANNEL_SECRET', '');
  }

  function getLineOaId() {
    return get('LINE_OA_ID', '');
  }

  function getTelegramBotToken() {
    return get('TELEGRAM_BOT_TOKEN', '');
  }

  function getTelegramChatId() {
    return get('TELEGRAM_CHAT_ID', '');
  }

  function validateRequired() {
    var missing = [];
    REQUIRED.forEach(function (key) {
      if (!get(key, '')) {
        missing.push(key);
      }
    });
    return missing;
  }

  return {
    get: get,
    requireKey: requireKey,
    getSpreadsheetId: getSpreadsheetId,
    getDriveRootFolderId: getDriveRootFolderId,
    getLineChannelAccessToken: getLineChannelAccessToken,
    getLineChannelSecret: getLineChannelSecret,
    getLineOaId: getLineOaId,
    getTelegramBotToken: getTelegramBotToken,
    getTelegramChatId: getTelegramChatId,
    validateRequired: validateRequired
  };
})();
