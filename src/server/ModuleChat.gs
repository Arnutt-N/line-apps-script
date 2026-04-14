var App = App || {};

App.Chat = (function () {
  var HUMAN_KEYWORDS = ['เจ้าหน้าที่', 'human', 'agent', 'แอดมิน', 'พนักงาน'];

  function listUsers(payload) {
    payload = payload || {};
    var query = String(payload.query || '').toLowerCase();

    var users = App.SheetsRepo.readAll('users');
    var rooms = App.SheetsRepo.readAll('chat_rooms');

    var roomByUser = {};
    rooms.forEach(function (room) {
      roomByUser[String(room.user_id)] = room;
    });

    var items = users.map(function (user) {
      var room = roomByUser[String(user.id)] || {};
      return {
        id: user.id,
        lineUserId: user.line_user_id,
        displayName: user.display_name || user.line_user_id,
        pictureUrl: user.picture_url || '',
        statusMessage: user.status_message || '',
        language: user.language || 'th',
        tags: user.tags || '',
        notes: user.notes || '',
        isBlocked: App.Utils.toBool(user.is_blocked || false),
        lastSeenAt: user.last_seen_at || '',
        room: {
          id: room.id || '',
          mode: room.mode || 'bot',
          unreadCount: Number(room.unread_count || 0),
          status: room.status || 'open',
          lastMessageAt: room.last_message_at || '',
          lastMessageText: room.last_message_text || ''
        }
      };
    }).filter(function (item) {
      if (!query) {
        return true;
      }
      return [
        item.displayName,
        item.lineUserId,
        item.statusMessage,
        item.tags,
        item.room.lastMessageText
      ].join(' ').toLowerCase().indexOf(query) >= 0;
    }).sort(function (a, b) {
      return String(b.room.lastMessageAt || '').localeCompare(String(a.room.lastMessageAt || ''));
    });

    return App.Utils.paginate(items, payload.page, payload.pageSize || 50);
  }

  function getRoom(payload) {
    payload = payload || {};
    var user = resolveUser_(payload);
    if (!user) {
      throw new Error('User not found');
    }

    var room = ensureRoomByUserId(user.id);
    var messages = App.SheetsRepo.readAll('chat_messages')
      .filter(function (row) {
        return String(row.room_id) === String(room.id);
      })
      .sort(function (a, b) {
        return String(a.created_at).localeCompare(String(b.created_at));
      });

    var take = Number(payload.limit || 100);
    if (messages.length > take) {
      messages = messages.slice(messages.length - take);
    }

    return {
      user: normalizeUser_(user),
      room: normalizeRoom_(room),
      messages: messages.map(normalizeMessage_)
    };
  }

  function sendMessage(payload, ctx) {
    payload = payload || {};
    var user = resolveUser_(payload);
    if (!user) {
      throw new Error('Target user not found');
    }

    var room = ensureRoomByUserId(user.id);
    var built = buildLineMessages_(payload);
    var sent = [];
    var lineResult = null;

    if (built.messages.length === 0) {
      throw new Error('No message content to send');
    }

    if (App.Config.getLineChannelAccessToken()) {
      lineResult = App.LineApi.pushMessage(user.line_user_id, built.messages);
    } else {
      lineResult = { status: 200, data: { mocked: true } };
    }

    built.messages.forEach(function (msg) {
      var row = App.SheetsRepo.insert('chat_messages', {
        room_id: room.id,
        user_id: user.id,
        sender_type: 'admin',
        sender_id: ctx.email,
        message_type: msg.type,
        text: msg.type === 'text' ? msg.text : '',
        payload_json: App.Utils.stringify(msg),
        file_drive_id: built.fileMeta ? built.fileMeta.id : '',
        file_url: built.fileMeta ? built.fileMeta.url : '',
        status: 'sent',
        is_read: 'true'
      });
      sent.push(normalizeMessage_(row));
    });

    App.SheetsRepo.updateById('chat_rooms', room.id, {
      last_message_at: App.Utils.nowIso(),
      last_message_text: built.previewText,
      unread_count: 0,
      mode: payload.forceMode || room.mode
    });

    return {
      room: normalizeRoom_(App.SheetsRepo.findOne('chat_rooms', 'id', room.id)),
      user: normalizeUser_(user),
      sentMessages: sent,
      lineResult: lineResult
    };
  }

  function toggleMode(payload, ctx) {
    payload = payload || {};
    var roomId = payload.roomId || '';
    var mode = String(payload.mode || '').toLowerCase();

    if (mode !== 'bot' && mode !== 'manual') {
      throw new Error('Invalid room mode');
    }

    var room = roomId
      ? App.SheetsRepo.findOne('chat_rooms', 'id', roomId)
      : null;

    if (!room && payload.userId) {
      room = ensureRoomByUserId(payload.userId);
    }

    if (!room) {
      throw new Error('Room not found');
    }

    var updated = App.SheetsRepo.updateById('chat_rooms', room.id, {
      mode: mode,
      assigned_admin: ctx.email
    });

    return normalizeRoom_(updated);
  }

  function pollUpdates(payload) {
    payload = payload || {};
    var roomId = payload.roomId || '';
    var since = String(payload.since || '');

    if (!roomId) {
      return {
        messages: [],
        serverTime: App.Utils.nowIso()
      };
    }

    var rows = App.SheetsRepo.readAll('chat_messages')
      .filter(function (row) {
        if (String(row.room_id) !== String(roomId)) {
          return false;
        }
        if (!since) {
          return true;
        }
        return String(row.created_at) > since;
      })
      .sort(function (a, b) {
        return String(a.created_at).localeCompare(String(b.created_at));
      });

    return {
      messages: rows.map(normalizeMessage_),
      serverTime: App.Utils.nowIso()
    };
  }

  function ensureUserByLineId(lineUserId, profilePatch) {
    if (!lineUserId) {
      throw new Error('Missing lineUserId');
    }

    var row = App.SheetsRepo.findOne('users', 'line_user_id', lineUserId);
    var now = App.Utils.nowIso();

    if (!row) {
      row = App.SheetsRepo.insert('users', {
        line_user_id: lineUserId,
        display_name: profilePatch && profilePatch.displayName ? profilePatch.displayName : lineUserId,
        picture_url: profilePatch && profilePatch.pictureUrl ? profilePatch.pictureUrl : '',
        status_message: profilePatch && profilePatch.statusMessage ? profilePatch.statusMessage : '',
        language: profilePatch && profilePatch.language ? profilePatch.language : 'th',
        followed_at: now,
        unfollowed_at: '',
        readded_count: 1,
        last_seen_at: now,
        tags: '',
        notes: '',
        is_blocked: 'false'
      });
    } else {
      row = App.SheetsRepo.updateById('users', row.id, {
        display_name: (profilePatch && profilePatch.displayName) || row.display_name,
        picture_url: (profilePatch && profilePatch.pictureUrl) || row.picture_url,
        status_message: (profilePatch && profilePatch.statusMessage) || row.status_message,
        language: (profilePatch && profilePatch.language) || row.language,
        last_seen_at: now
      });
    }

    return row;
  }

  function ensureRoomByUserId(userId) {
    var room = App.SheetsRepo.findOne('chat_rooms', 'user_id', userId);
    if (!room) {
      room = App.SheetsRepo.insert('chat_rooms', {
        user_id: userId,
        mode: 'bot',
        assigned_admin: '',
        last_message_at: '',
        last_message_text: '',
        unread_count: 0,
        status: 'open'
      });
    }
    return room;
  }

  function ingestInboundMessage(event) {
    var source = event.source || {};
    var lineUserId = source.userId;
    if (!lineUserId) {
      return { skipped: true, reason: 'No source.userId' };
    }

    var user = App.SheetsRepo.findOne('users', 'line_user_id', lineUserId);
    if (!user) {
      user = ensureUserByLineId(lineUserId, {});
    }

    var room = App.SheetsRepo.findOne('chat_rooms', 'user_id', user.id);
    if (!room) {
      room = ensureRoomByUserId(user.id);
    }

    var message = event.message || {};
    var textValue = message.type === 'text' ? (message.text || '') : '';

    return {
      user: user,
      room: room,
      eventType: event.type,
      lineUserId: lineUserId,
      message: {
        type: message.type || event.type,
        text: textValue,
        payload_json: App.Utils.stringify(message)
      },
      shouldSwitchToManual: isHumanRequest_(textValue)
    };
  }

  function runBotReply(inbound, replyToken) {
    if (!inbound || !inbound.message) {
      return { skipped: true };
    }

    var room = inbound.room || {};
    if (!room.id || String(room.mode || 'bot') !== 'bot') {
      return { skipped: true, reason: 'Room mode is manual' };
    }

    if (inbound.shouldSwitchToManual) {
      return { skipped: true, reason: 'Escalated to manual' };
    }

    var payload = App.Utils.parseJson(inbound.message.payload_json, {});
    if (payload.type !== 'text') {
      return { skipped: true, reason: 'Auto reply only for text' };
    }

    var replies = App.AutoReply.getAutoReplyMessages(payload.text || '');
    if (!replies.length) {
      return { skipped: true, reason: 'No matching intent' };
    }

    try {
      if (App.Config.getLineChannelAccessToken()) {
        if (replyToken) {
          App.LineApi.replyMessage(replyToken, replies);
        } else {
          App.LineApi.pushMessage(inbound.user.line_user_id, replies);
        }
      }

      return {
        ok: true,
        count: replies.length,
        replies: replies
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message
      };
    }
  }

  function persistInboundActivity_(inbound, botResult) {
    if (!inbound || !inbound.user || !inbound.room || !inbound.message) {
      return null;
    }

    var room = inbound.room;
    var user = inbound.user;
    var now = App.Utils.nowIso();
    var previewText = previewTextFromMessage_(App.Utils.parseJson(inbound.message.payload_json, {
      type: inbound.message.type,
      text: inbound.message.text
    }));

    App.SheetsRepo.updateById('users', user.id, {
      last_seen_at: now
    });

    var inboundRow = App.SheetsRepo.insert('chat_messages', {
      room_id: room.id,
      user_id: user.id,
      sender_type: 'user',
      sender_id: inbound.lineUserId,
      message_type: inbound.message.type,
      text: inbound.message.text || '',
      payload_json: inbound.message.payload_json,
      file_drive_id: '',
      file_url: '',
      status: 'received',
      is_read: 'false'
    });

    if (botResult && botResult.ok && botResult.replies && botResult.replies.length) {
      botResult.replies.forEach(function (msg) {
        App.SheetsRepo.insert('chat_messages', {
          room_id: room.id,
          user_id: user.id,
          sender_type: 'bot',
          sender_id: 'bot',
          message_type: msg.type,
          text: msg.type === 'text' ? msg.text : '',
          payload_json: App.Utils.stringify(msg),
          file_drive_id: '',
          file_url: '',
          status: 'sent',
          is_read: 'true'
        });
      });
      previewText = previewTextFromMessage_(botResult.replies[botResult.replies.length - 1]);
    }

    App.SheetsRepo.updateById('chat_rooms', room.id, {
      last_message_at: now,
      last_message_text: previewText,
      unread_count: Number(room.unread_count || 0) + 1,
      status: 'open',
      mode: inbound.shouldSwitchToManual ? 'manual' : room.mode
    });

    if (inbound.shouldSwitchToManual) {
      sendHumanAlert_(user, inbound.message.text || '');
    }

    return inboundRow;
  }

  function resolveUser_(payload) {
    if (payload.userId) {
      var byId = App.SheetsRepo.findOne('users', 'id', payload.userId);
      if (byId) {
        return byId;
      }
    }

    if (payload.lineUserId) {
      var byLine = App.SheetsRepo.findOne('users', 'line_user_id', payload.lineUserId);
      if (byLine) {
        return byLine;
      }
    }

    if (payload.roomId) {
      var room = App.SheetsRepo.findOne('chat_rooms', 'id', payload.roomId);
      if (room) {
        return App.SheetsRepo.findOne('users', 'id', room.user_id);
      }
    }

    return null;
  }

  function normalizeUser_(row) {
    return {
      id: row.id,
      lineUserId: row.line_user_id,
      displayName: row.display_name,
      pictureUrl: row.picture_url,
      statusMessage: row.status_message,
      language: row.language,
      tags: row.tags,
      notes: row.notes,
      lastSeenAt: row.last_seen_at
    };
  }

  function normalizeRoom_(row) {
    return {
      id: row.id,
      userId: row.user_id,
      mode: row.mode,
      assignedAdmin: row.assigned_admin,
      lastMessageAt: row.last_message_at,
      lastMessageText: row.last_message_text,
      unreadCount: Number(row.unread_count || 0),
      status: row.status
    };
  }

  function normalizeMessage_(row) {
    return {
      id: row.id,
      roomId: row.room_id,
      userId: row.user_id,
      senderType: row.sender_type,
      senderId: row.sender_id,
      messageType: row.message_type,
      text: row.text,
      payload: App.Utils.parseJson(row.payload_json, {}),
      fileDriveId: row.file_drive_id,
      fileUrl: row.file_url,
      status: row.status,
      isRead: App.Utils.toBool(row.is_read),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  function buildLineMessages_(payload) {
    var type = String(payload.messageType || 'text').toLowerCase();
    var fileMeta = null;

    if (payload.fileDataUrl) {
      fileMeta = App.DriveRepo.saveDataUrl({
        filename: payload.fileName || ('file_' + Date.now()),
        dataUrl: payload.fileDataUrl,
        mimeType: payload.fileMimeType || '',
        folderName: 'chat_uploads'
      });
    }

    if (type === 'text' || type === 'emoji') {
      var text = payload.text || '';
      return {
        messages: [{ type: 'text', text: text }],
        fileMeta: fileMeta,
        previewText: text
      };
    }

    if (type === 'sticker') {
      return {
        messages: [{
          type: 'sticker',
          packageId: String(payload.packageId || '446'),
          stickerId: String(payload.stickerId || '1988')
        }],
        fileMeta: fileMeta,
        previewText: '[Sticker]'
      };
    }

    if (type === 'image') {
      var imageUrl = payload.originalContentUrl || (fileMeta ? fileMeta.url : '');
      return {
        messages: [{ type: 'image', originalContentUrl: imageUrl, previewImageUrl: payload.previewImageUrl || imageUrl }],
        fileMeta: fileMeta,
        previewText: '[Image]'
      };
    }

    if (type === 'video') {
      return {
        messages: [{
          type: 'video',
          originalContentUrl: payload.originalContentUrl || (fileMeta ? fileMeta.url : ''),
          previewImageUrl: payload.previewImageUrl || (fileMeta ? fileMeta.url : '')
        }],
        fileMeta: fileMeta,
        previewText: '[Video]'
      };
    }

    if (type === 'audio') {
      return {
        messages: [{
          type: 'audio',
          originalContentUrl: payload.originalContentUrl || (fileMeta ? fileMeta.url : ''),
          duration: Number(payload.duration || 1000)
        }],
        fileMeta: fileMeta,
        previewText: '[Audio]'
      };
    }

    if (type === 'location') {
      return {
        messages: [{
          type: 'location',
          title: payload.title || 'Location',
          address: payload.address || '-',
          latitude: Number(payload.latitude || 0),
          longitude: Number(payload.longitude || 0)
        }],
        fileMeta: fileMeta,
        previewText: '[Location]'
      };
    }

    if (type === 'file') {
      var fileText = payload.text || 'ส่งไฟล์: ' + (fileMeta ? fileMeta.url : payload.fileUrl || '');
      return {
        messages: [{ type: 'text', text: fileText }],
        fileMeta: fileMeta,
        previewText: '[File]'
      };
    }

    if (payload.lineMessageObject) {
      return {
        messages: [payload.lineMessageObject],
        fileMeta: fileMeta,
        previewText: '[' + (payload.lineMessageObject.type || 'object') + ']'
      };
    }

    throw new Error('Unsupported messageType: ' + type);
  }

  function previewTextFromMessage_(message) {
    if (!message) {
      return '';
    }
    if (message.type === 'text') {
      return message.text || '';
    }
    return '[' + message.type + ']';
  }

  function isHumanRequest_(text) {
    var normalized = String(text || '').toLowerCase();
    if (!normalized) {
      return false;
    }

    return HUMAN_KEYWORDS.some(function (keyword) {
      return normalized.indexOf(String(keyword).toLowerCase()) >= 0;
    });
  }

  function runtimeConfig() {
    return {
      pollIntervalMs: Number(App.Settings.getSettingValue('chat_poll_interval_ms', 3000)),
      videoCallUrl: String(App.Settings.getSettingValue('default_video_call_url', 'https://meet.google.com/new'))
    };
  }
  function sendHumanAlert_(user, text) {
    try {
      App.TelegramApi.sendMessage(
        '<b>LINE OA Human Request</b>\n' +
        'User: ' + (user.display_name || user.line_user_id) + '\n' +
        'LINE UID: ' + user.line_user_id + '\n' +
        'Message: ' + text
      );
    } catch (error) {
      App.SheetsRepo.insert('job_queue', {
        job_type: 'telegram_alert',
        status: 'failed',
        payload_json: App.Utils.stringify({ userId: user.id, text: text }),
        retry_count: 0,
        next_run_at: '',
        last_error: error.message
      });
    }
  }

  return {
    listUsers: listUsers,
    getRoom: getRoom,
    sendMessage: sendMessage,
    toggleMode: toggleMode,
    pollUpdates: pollUpdates,
    ensureUserByLineId: ensureUserByLineId,
    ensureRoomByUserId: ensureRoomByUserId,
    ingestInboundMessage: ingestInboundMessage,
    runBotReply: runBotReply,
    persistInboundActivity: persistInboundActivity_,
    runtimeConfig: runtimeConfig,
    normalizeMessage: normalizeMessage_
  };
})();

