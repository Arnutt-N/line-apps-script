var App = App || {};

App.TelegramApi = (function () {
  function getToken_() {
    return App.Config.getTelegramBotToken();
  }

  function getChatId_() {
    return App.Config.getTelegramChatId();
  }

  function sendMessage(text) {
    var token = getToken_();
    var chatId = getChatId_();

    if (!token || !chatId) {
      return {
        enabled: false,
        ok: false,
        reason: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID'
      };
    }

    var url = 'https://api.telegram.org/bot' + token + '/sendMessage';
    var payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    };

    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var code = response.getResponseCode();
    var body = response.getContentText();

    if (code >= 400) {
      throw new Error('Telegram API error ' + code + ': ' + body);
    }

    return {
      enabled: true,
      ok: true,
      response: App.Utils.parseJson(body, { raw: body })
    };
  }

  return {
    sendMessage: sendMessage
  };
})();
