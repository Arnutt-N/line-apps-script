var App = App || {};

App.Dashboard = (function () {
  function summary() {
    var users = App.SheetsRepo.readAll('users');
    var rooms = App.SheetsRepo.readAll('chat_rooms');
    var messages = App.SheetsRepo.readAll('chat_messages');
    var intents = App.SheetsRepo.readAll('intents');

    var now = new Date();
    var nowMs = now.getTime();
    var twentyFourHoursMs = 24 * 60 * 60 * 1000;

    var recentMessagesIn = messages.filter(function (m) {
      return m.sender_type === 'user' && (nowMs - new Date(m.created_at || 0).getTime() <= twentyFourHoursMs);
    }).length;

    var recentMessagesOut = messages.filter(function (m) {
      return m.sender_type !== 'user' && (nowMs - new Date(m.created_at || 0).getTime() <= twentyFourHoursMs);
    }).length;

    var manualChats = rooms.filter(function (r) {
      return String(r.mode || '').toLowerCase() === 'manual';
    }).length;

    var unresolved = rooms.filter(function (r) {
      return String(r.status || '').toLowerCase() !== 'closed';
    }).length;

    var activeChats = rooms.filter(function (r) {
      var last = new Date(r.last_message_at || 0).getTime();
      return nowMs - last <= twentyFourHoursMs;
    }).length;

    var cards = [
      { key: 'activeChats', label: 'Active Chats', value: activeChats },
      { key: 'manualChats', label: 'Manual Chats', value: manualChats },
      { key: 'messagesIn24h', label: 'Messages In (24h)', value: recentMessagesIn },
      { key: 'messagesOut24h', label: 'Messages Out (24h)', value: recentMessagesOut },
      { key: 'followers', label: 'Followers', value: users.length },
      { key: 'openIssues', label: 'Unresolved', value: unresolved },
      { key: 'intentCount', label: 'Intent Count', value: intents.length }
    ];

    var trendRows = App.SheetsRepo.readAll('metrics_daily')
      .sort(function (a, b) {
        return String(a.metric_date).localeCompare(String(b.metric_date));
      })
      .slice(-14);

    return {
      cards: cards,
      trends: trendRows,
      generatedAt: App.Utils.nowIso()
    };
  }

  return {
    summary: summary
  };
})();
