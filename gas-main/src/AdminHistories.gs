// Read-only listing endpoints for friend + chat history sheets.
//
// Uses classic sheets created by setupClassicWebhook():
//   FriendHistory:          Timestamp | UserId | Action | Details | DisplayName | PictureUrl
//   CLASSIC_LOG_SHEET_NAME: Timestamp | UserId | UserMessage | BotResponse | DisplayName | PictureUrl
//
// Returns most-recent-first; clamps to at most 500 rows per call to protect UI.

var AdminHistories = (function () {
  var MAX_LIMIT = 500;

  function readLastRows_(sheet, limit) {
    if (!sheet) return [];
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    var lastCol = sheet.getLastColumn();
    var take = Math.min(Math.max(1, Number(limit || 100)), MAX_LIMIT);
    var startRow = Math.max(2, lastRow - take + 1);
    var count = lastRow - startRow + 1;
    var values = sheet.getRange(startRow, 1, count, lastCol).getValues();
    return values.reverse();
  }

  function chats(payload) {
    var limit = Number(payload && payload.limit || 100);
    var sheet = openSpreadsheet_().getSheetByName(getConversationLogSheetName_());
    var rows = readLastRows_(sheet, limit);

    return {
      sheet: getConversationLogSheetName_(),
      count: rows.length,
      rows: rows.map(function (r) {
        return {
          timestamp: toIso_(r[0]),
          userId: String(r[1] || ''),
          userMessage: String(r[2] || ''),
          botResponse: String(r[3] || ''),
          displayName: String(r[4] || ''),
          pictureUrl: String(r[5] || '')
        };
      })
    };
  }

  function friends(payload) {
    var limit = Number(payload && payload.limit || 100);
    var sheet = openSpreadsheet_().getSheetByName(getFriendHistorySheetName_());
    var rows = readLastRows_(sheet, limit);

    return {
      sheet: getFriendHistorySheetName_(),
      count: rows.length,
      rows: rows.map(function (r) {
        return {
          timestamp: toIso_(r[0]),
          userId: String(r[1] || ''),
          action: String(r[2] || ''),
          details: String(r[3] || ''),
          displayName: String(r[4] || ''),
          pictureUrl: String(r[5] || '')
        };
      })
    };
  }

  function toIso_(value) {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString();
    var d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
  }

  return {
    chats: chats,
    friends: friends
  };
})();
