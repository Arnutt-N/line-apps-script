var App = App || {};

App.Histories = (function () {
  function friends(payload) {
    payload = payload || {};
    var source = payload.source || '';
    var eventType = payload.eventType || '';

    var rows = App.SheetsRepo.readAll('friend_histories').filter(function (row) {
      var sourceMatch = !source || row.source === source;
      var eventMatch = !eventType || row.event_type === eventType;
      return sourceMatch && eventMatch;
    }).sort(function (a, b) {
      return String(b.event_at).localeCompare(String(a.event_at));
    });

    var users = App.SheetsRepo.readAll('users');
    var userMap = {};
    users.forEach(function (user) {
      userMap[String(user.id)] = user;
    });

    var mapped = rows.map(function (row) {
      var user = userMap[String(row.user_id)] || {};
      return {
        id: row.id,
        userId: row.user_id,
        lineUserId: user.line_user_id || '',
        displayName: user.display_name || '',
        eventType: row.event_type,
        source: row.source,
        refCode: row.ref_code,
        nthAdd: Number(row.nth_add || 0),
        eventAt: row.event_at,
        payload: App.Utils.parseJson(row.payload_json, {})
      };
    });

    return App.Utils.paginate(mapped, payload.page, payload.pageSize || 50);
  }

  function chats(payload) {
    payload = payload || {};
    var query = String(payload.query || '').toLowerCase();
    var senderType = payload.senderType || '';
    var messageType = payload.messageType || '';

    var users = App.SheetsRepo.readAll('users');
    var userMap = {};
    users.forEach(function (user) {
      userMap[String(user.id)] = user;
    });

    var rows = App.SheetsRepo.readAll('chat_messages').filter(function (row) {
      var senderMatch = !senderType || row.sender_type === senderType;
      var typeMatch = !messageType || row.message_type === messageType;
      var text = [
        row.text,
        row.sender_id,
        (userMap[String(row.user_id)] || {}).display_name,
        (userMap[String(row.user_id)] || {}).line_user_id
      ].join(' ').toLowerCase();
      var queryMatch = !query || text.indexOf(query) >= 0;
      return senderMatch && typeMatch && queryMatch;
    }).sort(function (a, b) {
      return String(b.created_at).localeCompare(String(a.created_at));
    });

    var mapped = rows.map(function (row) {
      var user = userMap[String(row.user_id)] || {};
      return {
        id: row.id,
        roomId: row.room_id,
        userId: row.user_id,
        lineUserId: user.line_user_id || '',
        displayName: user.display_name || '',
        senderType: row.sender_type,
        messageType: row.message_type,
        text: row.text,
        payload: App.Utils.parseJson(row.payload_json, {}),
        createdAt: row.created_at,
        status: row.status
      };
    });

    return App.Utils.paginate(mapped, payload.page, payload.pageSize || 100);
  }

  return {
    friends: friends,
    chats: chats
  };
})();
