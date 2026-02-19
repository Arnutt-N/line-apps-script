var App = App || {};

App.Webhook = (function () {
  function handle(e) {
    var bodyText = e && e.postData ? (e.postData.contents || '{}') : '{}';
    var payload = App.Utils.parseJson(bodyText, {});
    var events = payload.events || [];

    verifySignatureIfPossible_(e, bodyText);

    var results = [];
    events.forEach(function (event) {
      try {
        results.push(handleEvent_(event));
      } catch (error) {
        results.push({
          ok: false,
          error: error.message,
          eventType: event.type
        });
      }
    });

    return {
      ok: true,
      processed: events.length,
      results: results
    };
  }

  function verifySignatureIfPossible_(e, bodyText) {
    var secret = App.Config.getLineChannelSecret();
    var requireSig = App.Utils.toBool(App.Config.get('LINE_REQUIRE_SIGNATURE', 'false'));
    var headers = App.Utils.headersToMap(e && e.headers ? e.headers : null);
    var signature = headers['x-line-signature'];

    if (!secret || !signature) {
      if (requireSig) {
        throw new Error('Cannot verify LINE signature in this environment');
      }
      return;
    }

    var expected = App.Utils.hmacSha256Base64(secret, bodyText);
    if (expected !== signature) {
      throw new Error('Invalid LINE signature');
    }
  }

  function handleEvent_(event) {
    if (event.type === 'follow') {
      return handleFollow_(event);
    }

    if (event.type === 'unfollow') {
      return handleUnfollow_(event);
    }

    if (event.type === 'message') {
      return handleMessage_(event);
    }

    if (event.type === 'postback') {
      return handlePostback_(event);
    }

    return {
      ok: true,
      skipped: true,
      reason: 'Unsupported event: ' + event.type
    };
  }

  function handleFollow_(event) {
    var source = event.source || {};
    if (!source.userId) {
      return { ok: false, reason: 'No source.userId' };
    }

    var user = App.Chat.ensureUserByLineId(source.userId, {});
    var hadFollowHistory = String(user.followed_at || '') !== '';
    var nextCount = Number(user.readded_count || 0);
    if (hadFollowHistory) {
      nextCount += 1;
    }
    if (nextCount <= 0) {
      nextCount = 1;
    }

    user = App.SheetsRepo.updateById('users', user.id, {
      followed_at: App.Utils.nowIso(),
      unfollowed_at: '',
      readded_count: nextCount,
      last_seen_at: App.Utils.nowIso()
    });

    App.SheetsRepo.insert('friend_histories', {
      user_id: user.id,
      event_type: 'follow',
      source: source.type || 'line',
      ref_code: '',
      nth_add: nextCount,
      event_at: App.Utils.nowIso(),
      payload_json: App.Utils.stringify(event)
    });

    return {
      ok: true,
      eventType: 'follow',
      userId: user.id
    };
  }

  function handleUnfollow_(event) {
    var source = event.source || {};
    if (!source.userId) {
      return { ok: false, reason: 'No source.userId' };
    }

    var user = App.Chat.ensureUserByLineId(source.userId, {});
    App.SheetsRepo.updateById('users', user.id, {
      unfollowed_at: App.Utils.nowIso()
    });

    App.SheetsRepo.insert('friend_histories', {
      user_id: user.id,
      event_type: 'unfollow',
      source: source.type || 'line',
      ref_code: '',
      nth_add: Number(user.readded_count || 1),
      event_at: App.Utils.nowIso(),
      payload_json: App.Utils.stringify(event)
    });

    return {
      ok: true,
      eventType: 'unfollow',
      userId: user.id
    };
  }

  function handleMessage_(event) {
    var inbound = App.Chat.ingestInboundMessage(event);
    var bot = App.Chat.runBotReply(inbound);

    return {
      ok: true,
      eventType: 'message',
      userId: inbound.user ? inbound.user.id : '',
      roomId: inbound.room ? inbound.room.id : '',
      bot: bot
    };
  }

  function handlePostback_(event) {
    var source = event.source || {};
    if (!source.userId) {
      return { ok: false, reason: 'No source.userId' };
    }

    var user = App.Chat.ensureUserByLineId(source.userId, {});
    var room = App.Chat.ensureRoomByUserId(user.id);
    var postback = event.postback || {};

    var row = App.SheetsRepo.insert('chat_messages', {
      room_id: room.id,
      user_id: user.id,
      sender_type: 'user',
      sender_id: source.userId,
      message_type: 'postback',
      text: postback.data || '',
      payload_json: App.Utils.stringify(postback),
      file_drive_id: '',
      file_url: '',
      status: 'received',
      is_read: 'false'
    });

    App.SheetsRepo.updateById('chat_rooms', room.id, {
      last_message_at: App.Utils.nowIso(),
      last_message_text: '[postback]',
      unread_count: Number(room.unread_count || 0) + 1,
      status: 'open'
    });

    return {
      ok: true,
      eventType: 'postback',
      messageId: row.id
    };
  }

  return {
    handle: handle
  };
})();

