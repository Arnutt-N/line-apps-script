var App = App || {};

App.LineApi = (function () {
  var BASE_URL = 'https://api.line.me/v2/bot';

  function token_() {
    var token = App.Config.getLineChannelAccessToken();
    if (!token) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured');
    }
    return token;
  }

  function request_(method, path, body, contentType) {
    var options = {
      method: method,
      headers: {
        Authorization: 'Bearer ' + token_()
      },
      muteHttpExceptions: true
    };

    if (body != null) {
      var isByteArray = Object.prototype.toString.call(body) === '[object Array]';
      if (typeof body === 'string' || isByteArray) {
        options.payload = body;
      } else {
        options.payload = JSON.stringify(body);
      }
      options.contentType = contentType || 'application/json';
    }

    var response = UrlFetchApp.fetch(BASE_URL + path, options);
    var text = response.getContentText() || '{}';
    var code = response.getResponseCode();
    var data = App.Utils.parseJson(text, { raw: text });

    if (code >= 400) {
      throw new Error('LINE API error ' + code + ': ' + text);
    }

    return {
      status: code,
      data: data
    };
  }

  function pushMessage(userId, messages) {
    return request_('post', '/message/push', {
      to: userId,
      messages: messages
    });
  }

  function replyMessage(replyToken, messages) {
    return request_('post', '/message/reply', {
      replyToken: replyToken,
      messages: messages
    });
  }

  function getProfile(userId) {
    return request_('get', '/profile/' + encodeURIComponent(userId), null).data;
  }

  function createRichMenu(payload) {
    return request_('post', '/richmenu', payload).data;
  }

  function uploadRichMenuImage(richMenuId, imageBlob) {
    return request_(
      'post',
      '/richmenu/' + encodeURIComponent(richMenuId) + '/content',
      imageBlob.getBytes(),
      imageBlob.getContentType()
    ).data;
  }

  function setDefaultRichMenu(richMenuId) {
    return request_('post', '/user/all/richmenu/' + encodeURIComponent(richMenuId), {}).data;
  }

  function linkUserRichMenu(userId, richMenuId) {
    return request_('post', '/user/' + encodeURIComponent(userId) + '/richmenu/' + encodeURIComponent(richMenuId), {}).data;
  }

  function unlinkUserRichMenu(userId) {
    return request_('delete', '/user/' + encodeURIComponent(userId) + '/richmenu', null).data;
  }

  function deleteRichMenu(richMenuId) {
    return request_('delete', '/richmenu/' + encodeURIComponent(richMenuId), null).data;
  }

  return {
    pushMessage: pushMessage,
    replyMessage: replyMessage,
    getProfile: getProfile,
    createRichMenu: createRichMenu,
    uploadRichMenuImage: uploadRichMenuImage,
    setDefaultRichMenu: setDefaultRichMenu,
    linkUserRichMenu: linkUserRichMenu,
    unlinkUserRichMenu: unlinkUserRichMenu,
    deleteRichMenu: deleteRichMenu
  };
})();

