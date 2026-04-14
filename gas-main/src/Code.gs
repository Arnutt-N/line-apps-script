// Classic webhook bot adapted from the working Sakon Nakhon Apps Script bot.
// This version keeps the direct GAS flow simple and moves all secrets to Script Properties.

var socialMediaMessage = getSocialMediaMessage();
var imageMapMenu = getMenu();
var communityJusticeCenterMessage = getFlexCommunityJusticeCenter();
var carouselCommunityJusticeCenterMessage = getCarouselCommunityJusticeCenter();
var flexCommunityJusticeCenterMessage = getFlexCommunityJusticeCenter();
var qaFlexMessage = getQAFlexMessage();

var DEFAULT_RESPONSE = "สวัสดีค่ะ ขอบคุณที่ส่งข้อความถึงเรา\n👋 ต้องการแชทกับเจ้าหน้าที่พิมพ์ 0\n\nหรือติดต่อขอคำปรึกษาเบื้องต้นได้ที่\nโทร. 042-713400\nในเวลาราชการ วันจันทร์-ศุกร์ เวลา 08.30 - 16.30 น.";
var STAFF_RESPONSE = "สวัสดีค่ะ ขอบคุณที่ส่งข้อความถึงเรา\nเจ้าหน้าที่จะติดต่อกลับโดยเร็วค่ะ\n\nสำนักงานยุติธรรมจังหวัดสกลนคร ยินดีให้บริการ\nโทร. 042-713400\nในเวลาราชการ วันจันทร์-ศุกร์ เวลา 08.30 - 16.30 น.";
var FOLLOW_WELCOME_FIRST = "ยินดีต้อนรับสู่ LINE Official Account ค่ะ\n\nหากต้องการดูเมนูบริการ พิมพ์ 'เมนู' หรือ '1' ได้เลย";
var FOLLOW_WELCOME_RETURN = "ยินดีต้อนรับกลับมาอีกครั้งค่ะ\n\nหากต้องการดูเมนูบริการ พิมพ์ 'เมนู' หรือ '1' ได้เลย";
var UNFOLLOW_MESSAGE = "ขอบคุณที่ให้โอกาสเราได้ดูแลคุณ";
var CANCEL_MESSAGE = "ยกเลิกรายการเรียบร้อยค่ะ\n\nหากต้องการดูเมนูบริการ พิมพ์ 'เมนู' หรือ '1' ได้เลย";
var TELEGRAM_ALERT_MESSAGE = "\n\nมีผู้ใช้ต้องการแชทกับเจ้าหน้าที่ กรุณาเข้าไปตรวจสอบใน LINE OA Chat";

function doGet() {
  return jsonOutput_({
    ok: true,
    app: 'gas-main',
    spreadsheetConfigured: !!getSpreadsheetId_(),
    lineTokenConfigured: !!getLineChannelToken_(),
    telegramConfigured: !!getProperty_('TELEGRAM_BOT_TOKEN', '') && !!getProperty_('TELEGRAM_CHAT_ID', ''),
    loadingIndicatorEnabled: isLoadingEnabled_(),
    sheetNames: {
      intents: getIntentSheetName_(),
      logs: getConversationLogSheetName_(),
      friendHistory: getFriendHistorySheetName_()
    }
  });
}

function setupClassicWebhook() {
  var ss = openSpreadsheet_();

  ensureSheetWithHeaders_(ss, getIntentSheetName_(), [
    'intent', 'response', 'image_type', 'image_data', 'image_alt_text',
    'aspect_ratio', 'full_size_urls', 'preview_urls', 'size', 'aspect_mode', 'background_color'
  ]);
  ensureSheetWithHeaders_(ss, getConversationLogSheetName_(), [
    'Timestamp', 'UserId', 'UserMessage', 'BotResponse', 'DisplayName', 'PictureUrl'
  ]);
  ensureSheetWithHeaders_(ss, getFriendHistorySheetName_(), [
    'Timestamp', 'UserId', 'Action', 'Details', 'DisplayName', 'PictureUrl'
  ]);

  return testClassicConfig();
}

function testClassicConfig() {
  var ss = openSpreadsheet_();
  return {
    ok: true,
    app: 'gas-main',
    spreadsheetId: getSpreadsheetId_(),
    lineTokenConfigured: !!getLineChannelToken_(),
    telegramConfigured: !!getProperty_('TELEGRAM_BOT_TOKEN', '') && !!getProperty_('TELEGRAM_CHAT_ID', ''),
    loadingIndicatorEnabled: isLoadingEnabled_(),
    loadingSeconds: getLoadingSeconds_(),
    sheetNames: {
      intents: getIntentSheetName_(),
      logs: getConversationLogSheetName_(),
      friendHistory: getFriendHistorySheetName_()
    },
    counts: {
      intents: countDataRows_(ss.getSheetByName(getIntentSheetName_())),
      logs: countDataRows_(ss.getSheetByName(getConversationLogSheetName_())),
      friendHistory: countDataRows_(ss.getSheetByName(getFriendHistorySheetName_()))
    }
  };
}

function handleFollowEvent(sourceId, displayName, pictureUrl) {
  var friendCount = getFriendCount(sourceId);
  var newCount = friendCount + 1;
  var message = friendCount === 0 ? FOLLOW_WELCOME_FIRST : FOLLOW_WELCOME_RETURN;

  logFriendActivity(sourceId, 'follow', 'follow #' + newCount, displayName, pictureUrl);
  return message;
}

function handleUnfollowEvent(sourceId, displayName, pictureUrl) {
  var friendCount = getFriendCount(sourceId);
  logFriendActivity(sourceId, 'unfollow', 'unfollow after ' + friendCount + ' follow(s)', displayName, pictureUrl);
  return UNFOLLOW_MESSAGE;
}

function getFriendCount(sourceId) {
  var sheet = ensureSheetWithHeaders_(openSpreadsheet_(), getFriendHistorySheetName_(), [
    'Timestamp', 'UserId', 'Action', 'Details', 'DisplayName', 'PictureUrl'
  ]);
  var data = sheet.getDataRange().getValues();
  var count = 0;
  var i;

  for (i = 1; i < data.length; i += 1) {
    if (String(data[i][1]) === String(sourceId) && String(data[i][2]) === 'follow') {
      count += 1;
    }
  }

  return count;
}

function logFriendActivity(sourceId, action, details, displayName, pictureUrl) {
  var sheet = ensureSheetWithHeaders_(openSpreadsheet_(), getFriendHistorySheetName_(), [
    'Timestamp', 'UserId', 'Action', 'Details', 'DisplayName', 'PictureUrl'
  ]);

  sheet.appendRow([
    new Date(),
    sourceId,
    action,
    details,
    displayName || '',
    pictureUrl || ''
  ]);
}

function checkIntentAndGetResponse(userMsg) {
  var sheet = openSpreadsheet_().getSheetByName(getIntentSheetName_());
  var data;
  var i;

  if (!sheet) {
    return createTextResult_(DEFAULT_RESPONSE);
  }

  data = sheet.getDataRange().getValues();
  for (i = 1; i < data.length; i += 1) {
    var intent = safeLower_(data[i][0]);
    var response = String(data[i][1] || '');
    var imageType = String(data[i][2] || 'none');
    var imageData = String(data[i][3] || '');
    var imageAltText = String(data[i][4] || '');
    var aspectRatio = String(data[i][5] || 'auto');
    var fullSizeUrls = String(data[i][6] || '');
    var previewUrls = String(data[i][7] || '');
    var size = String(data[i][8] || '');
    var aspectMode = String(data[i][9] || '');
    var backgroundColor = String(data[i][10] || '');

    if (intent && intent === safeLower_(userMsg)) {
      if (safeLower_(response) === 'line-oa' || safeLower_(response) === 'no-action') {
        return {
          response: response,
          imageType: 'none',
          imageData: '',
          imageAltText: '',
          aspectRatio: 'auto',
          fullSizeUrls: '',
          previewUrls: '',
          size: '',
          aspectMode: '',
          backgroundColor: '',
          shouldReply: false
        };
      }

      return {
        response: response,
        imageType: imageType,
        imageData: imageData,
        imageAltText: imageAltText,
        aspectRatio: aspectRatio,
        fullSizeUrls: fullSizeUrls,
        previewUrls: previewUrls,
        size: size,
        aspectMode: aspectMode,
        backgroundColor: backgroundColor,
        shouldReply: true
      };
    }
  }

  return createTextResult_(DEFAULT_RESPONSE);
}

function logConversation(sourceId, userMsg, botResponse, displayName, pictureUrl) {
  var sheet = ensureSheetWithHeaders_(openSpreadsheet_(), getConversationLogSheetName_(), [
    'Timestamp', 'UserId', 'UserMessage', 'BotResponse', 'DisplayName', 'PictureUrl'
  ]);

  sheet.appendRow([
    new Date(),
    sourceId,
    String(userMsg || ''),
    stringifyForLog_(botResponse),
    displayName || '',
    pictureUrl || ''
  ]);
}

function getUserProfile(userId) {
  if (!userId) {
    return {
      displayName: 'Unknown',
      pictureUrl: ''
    };
  }

  return lineRequest_('/profile/' + encodeURIComponent(userId), null, 'get');
}

function startLoadingAnimation(userId, loadingSeconds) {
  if (!userId || !isLoadingEnabled_()) {
    return;
  }

  lineRequest_('/chat/loading/start', {
    chatId: userId,
    loadingSeconds: getLoadingSeconds_() || loadingSeconds
  }, 'post');
}

function doPost(e) {
  try {
    requireConfigured_();

    var payload = parseJson_(e && e.postData ? e.postData.contents : '{}', {});
    var events = Array.isArray(payload.events) ? payload.events : [];
    var results = [];
    var i;

    for (i = 0; i < events.length; i += 1) {
      results.push(handleEvent_(events[i]));
    }

    return jsonOutput_({
      ok: true,
      processed: events.length,
      results: results
    });
  } catch (error) {
    console.log('Error in doPost: ' + error);
    return jsonOutput_({
      ok: false,
      error: String(error && error.message ? error.message : error)
    });
  }
}

function handleEvent_(event) {
  var type = String(event && event.type ? event.type : '');
  var sourceId = getSourceId_(event);
  var userId = event && event.source ? event.source.userId : '';
  var profile = getProfileSafely_(userId, sourceId);

  switch (type) {
    case 'message':
      return handleMessageEvent_(event, sourceId, userId, profile);
    case 'follow':
      return handleFollowWebhook_(event, sourceId, profile);
    case 'unfollow':
      return handleUnfollowWebhook_(event, sourceId, profile);
    case 'postback':
      return handlePostbackEvent_(event, sourceId, profile);
    case 'join':
    case 'leave':
    case 'memberJoined':
    case 'memberLeft':
    case 'beacon':
      logConversation(sourceId, type, { info: 'Event received' }, profile.displayName, profile.pictureUrl);
      return { ok: true, type: type, skipped: true };
    default:
      logConversation(sourceId, type, { info: 'Unhandled event' }, profile.displayName, profile.pictureUrl);
      return { ok: true, type: type, skipped: true };
  }
}

function handleMessageEvent_(event, sourceId, userId, profile) {
  var message = event && event.message ? event.message : {};
  var normalized = safeLower_(message.text);
  var messages;
  var result;

  if (String(message.type || '') !== 'text') {
    logConversation(sourceId, '[' + String(message.type || 'unknown') + ']', 'Skipped non-text message', profile.displayName, profile.pictureUrl);
    return { ok: true, type: 'message', skipped: true };
  }

  switch (normalized) {
    case 'แชทกับเจ้าหน้าที่':
    case '0':
      sendTelegramNotify();
      maybeShowLoading_(userId);
      replyMsg(event.replyToken, { type: 'text', text: STAFF_RESPONSE });
      logConversation(sourceId, message.text, STAFF_RESPONSE, profile.displayName, profile.pictureUrl);
      return { ok: true, type: 'message', route: 'staff' };

    case 'เมนู':
    case 'menu':
    case '1':
      maybeShowLoading_(userId);
      replyMsg(event.replyToken, imageMapMenu);
      logConversation(sourceId, message.text, imageMapMenu, profile.displayName, profile.pictureUrl);
      return { ok: true, type: 'message', route: 'menu' };

    case 'social media':
      maybeShowLoading_(userId);
      replyMsg(event.replyToken, socialMediaMessage);
      logConversation(sourceId, message.text, socialMediaMessage, profile.displayName, profile.pictureUrl);
      return { ok: true, type: 'message', route: 'social-media' };

    case 'ยื่นขอรับบริการ':
    case 'ขอรับบริการ':
    case 'คำถามที่พบบ่อย':
    case 'คำถามพบบ่อย':
    case 'q&a':
    case 'faq':
      maybeShowLoading_(userId);
      replyMsg(event.replyToken, qaFlexMessage);
      logConversation(sourceId, message.text, qaFlexMessage, profile.displayName, profile.pictureUrl);
      return { ok: true, type: 'message', route: 'qa-flex' };

    case 'ศูนย์ยุติธรรมชุมชน':
    case 'ศยช.':
    case 'ศยช':
      maybeShowLoading_(userId);
      replyMsg(event.replyToken, communityJusticeCenterMessage);
      logConversation(sourceId, message.text, communityJusticeCenterMessage, profile.displayName, profile.pictureUrl);
      return { ok: true, type: 'message', route: 'community-justice' };

    case 'ยกเลิก':
    case 'cancel':
      replyMsg(event.replyToken, { type: 'text', text: CANCEL_MESSAGE });
      logConversation(sourceId, message.text, CANCEL_MESSAGE, profile.displayName, profile.pictureUrl);
      return { ok: true, type: 'message', route: 'cancel' };

    default:
      result = checkIntentAndGetResponse(message.text);
      if (!result.shouldReply) {
        logConversation(sourceId, message.text, result, profile.displayName, profile.pictureUrl);
        return { ok: true, type: 'message', route: 'no-action' };
      }

      messages = buildMessagesForResult_(result);
      maybeShowLoading_(userId);
      replyMessages_(event.replyToken, messages);
      logConversation(sourceId, message.text, result, profile.displayName, profile.pictureUrl);
      return { ok: true, type: 'message', route: 'intent', replyCount: messages.length };
  }
}

function handleFollowWebhook_(event, sourceId, profile) {
  var text = handleFollowEvent(sourceId, profile.displayName, profile.pictureUrl);
  replyMsg(event.replyToken, { type: 'text', text: text });
  logConversation(sourceId, 'follow', text, profile.displayName, profile.pictureUrl);
  return { ok: true, type: 'follow' };
}

function handleUnfollowWebhook_(event, sourceId, profile) {
  var text = handleUnfollowEvent(sourceId, profile.displayName, profile.pictureUrl);
  logConversation(sourceId, 'unfollow', text, profile.displayName, profile.pictureUrl);
  return { ok: true, type: 'unfollow' };
}

function handlePostbackEvent_(event, sourceId, profile) {
  var data = event && event.postback ? String(event.postback.data || '') : '';
  var text = 'คุณกดปุ่ม: ' + data;

  replyMsg(event.replyToken, { type: 'text', text: text });
  logConversation(sourceId, 'postback: ' + data, text, profile.displayName, profile.pictureUrl);
  return { ok: true, type: 'postback' };
}

function getLastKnownProfile(sourceId) {
  var sheet = openSpreadsheet_().getSheetByName(getConversationLogSheetName_());
  var data;
  var i;

  if (!sheet) {
    return null;
  }

  data = sheet.getDataRange().getValues();
  for (i = data.length - 1; i >= 1; i -= 1) {
    if (String(data[i][1]) === String(sourceId) && data[i][4] && String(data[i][4]) !== 'Unknown') {
      return {
        displayName: String(data[i][4]),
        pictureUrl: String(data[i][5] || '')
      };
    }
  }

  return null;
}

function sendTelegramNotify() {
  var botToken = getProperty_('TELEGRAM_BOT_TOKEN', '');
  var chatId = getProperty_('TELEGRAM_CHAT_ID', '');

  if (!botToken || !chatId) {
    return false;
  }

  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + botToken + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: chatId,
        text: TELEGRAM_ALERT_MESSAGE,
        parse_mode: 'HTML'
      }),
      muteHttpExceptions: true
    });
    return true;
  } catch (error) {
    console.log('Error sending Telegram notification: ' + error);
    return false;
  }
}

function replyMsg(replyToken, message) {
  replyMessages_(replyToken, [message]);
}

function pushMsg(message, userId) {
  lineRequest_('/message/push', {
    to: userId,
    messages: [{ type: 'text', text: String(message || '') }]
  }, 'post');
}

function replyMessages_(replyToken, messages) {
  if (!replyToken) {
    throw new Error('Missing replyToken');
  }

  lineRequest_('/message/reply', {
    replyToken: replyToken,
    messages: messages.slice(0, 5)
  }, 'post');
}

function lineRequest_(path, payload, method) {
  var response = UrlFetchApp.fetch('https://api.line.me/v2/bot' + path, {
    method: method || 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + getLineChannelToken_()
    },
    payload: payload ? JSON.stringify(payload) : null,
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  var text = response.getContentText() || '{}';

  if (code >= 400) {
    throw new Error('LINE API error ' + code + ': ' + text);
  }

  return parseJson_(text, { raw: text });
}

function buildMessagesForResult_(result) {
  var messages = [{ type: 'text', text: String(result.response || DEFAULT_RESPONSE) }];

  try {
    if (result.imageType === 'single' && result.imageData) {
      messages.push(createImageMessage(result.imageData, null, result.imageAltText));
    } else if (result.imageType === 'carousel' && result.imageData) {
      messages.push(createImageCarousel(result.imageData, result.imageAltText));
    } else if (result.imageType === 'flex_carousel' && result.imageData) {
      messages.push(createFlexImageCarousel(
        result.imageData,
        result.aspectRatio,
        result.fullSizeUrls,
        result.imageAltText,
        result.previewUrls,
        result.size,
        result.aspectMode,
        result.backgroundColor
      ));
    }
  } catch (error) {
    console.log('Error creating rich response: ' + error);
  }

  return messages;
}

function createTextResult_(response) {
  return {
    response: response,
    imageType: 'none',
    imageData: '',
    imageAltText: '',
    aspectRatio: 'auto',
    fullSizeUrls: '',
    previewUrls: '',
    size: '',
    aspectMode: '',
    backgroundColor: '',
    shouldReply: true
  };
}

function maybeShowLoading_(userId) {
  if (!userId || !isLoadingEnabled_()) {
    return;
  }

  try {
    startLoadingAnimation(userId, getLoadingSeconds_());
  } catch (error) {
    console.log('Loading indicator failed: ' + error);
  }
}

function getProfileSafely_(userId, sourceId) {
  try {
    return getUserProfile(userId);
  } catch (error) {
    console.log('Profile lookup failed: ' + error);
    return getLastKnownProfile(sourceId) || {
      displayName: 'Unknown',
      pictureUrl: ''
    };
  }
}

function getSourceId_(event) {
  var source = event && event.source ? event.source : {};
  return LineHelpers.getSourceId(source) || source.userId || 'unknown';
}

function requireConfigured_() {
  if (!getSpreadsheetId_()) {
    throw new Error('Missing script property: SPREADSHEET_ID');
  }
  if (!getLineChannelToken_()) {
    throw new Error('Missing script property: LINE_CHANNEL_ACCESS_TOKEN');
  }
}

function openSpreadsheet_() {
  return SpreadsheetApp.openById(getSpreadsheetId_());
}

function ensureSheetWithHeaders_(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function countDataRows_(sheet) {
  if (!sheet) {
    return 0;
  }

  return Math.max(sheet.getLastRow() - 1, 0);
}

function getLineChannelToken_() {
  return getProperty_('LINE_CHANNEL_ACCESS_TOKEN', '');
}

function getSpreadsheetId_() {
  return getProperty_('SPREADSHEET_ID', '');
}

function getIntentSheetName_() {
  return getProperty_('CLASSIC_INTENT_SHEET_NAME', 'Sheet1');
}

function getConversationLogSheetName_() {
  return getProperty_('CLASSIC_LOG_SHEET_NAME', 'Sheet2');
}

function getFriendHistorySheetName_() {
  return getProperty_('CLASSIC_FRIEND_HISTORY_SHEET_NAME', 'FriendHistory');
}

function getLoadingSeconds_() {
  var seconds = Number(getProperty_('LINE_LOADING_SECONDS', '5'));
  var allowed = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
  return allowed.indexOf(seconds) >= 0 ? seconds : 5;
}

function isLoadingEnabled_() {
  return toBool_(getProperty_('LINE_ENABLE_LOADING_INDICATOR', 'true'));
}

function getProperty_(key, fallbackValue) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  return value == null || value === '' ? fallbackValue : value;
}

function parseJson_(value, fallbackValue) {
  if (value == null || value === '') {
    return fallbackValue;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallbackValue;
  }
}

function stringifyForLog_(value) {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

function safeLower_(value) {
  return String(value || '').trim().toLowerCase();
}

function toBool_(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }

  var normalized = String(value || '').toLowerCase();
  return normalized === 'true' || normalized === '1';
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

var LineHelpers = (function (helpers) {
  'use strict';

  helpers.getSourceId = function (source) {
    try {
      switch (source.type) {
        case 'user':
          return source.userId;
        case 'group':
          return source.groupId;
        case 'room':
          return source.roomId;
        default:
          return '';
      }
    } catch (error) {
      console.log('LineHelpers.getSourceId error: ' + error);
      return '';
    }
  };

  return helpers;
})(LineHelpers || {});
