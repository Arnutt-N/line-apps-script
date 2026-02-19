var App = App || {};

App.Utils = (function () {
  function nowIso() {
    return new Date().toISOString();
  }

  function uuid() {
    return Utilities.getUuid();
  }

  function toBool(value) {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return String(value).toLowerCase() === 'true' || String(value) === '1';
  }

  function parseJson(value, fallbackValue) {
    if (value == null || value === '') {
      return fallbackValue;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallbackValue;
    }
  }

  function stringify(value) {
    return JSON.stringify(value == null ? {} : value);
  }

  function sanitizeText(text) {
    return String(text == null ? '' : text).trim();
  }

  function readJsonBody(e) {
    if (!e || !e.postData || !e.postData.contents) {
      return {};
    }
    return parseJson(e.postData.contents, {});
  }

  function jsonOutput(data) {
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  function headersToMap(headers) {
    var map = {};
    if (!headers) {
      return map;
    }
    Object.keys(headers).forEach(function (k) {
      map[k.toLowerCase()] = headers[k];
    });
    return map;
  }

  function hmacSha256Base64(secret, text) {
    var sig = Utilities.computeHmacSha256Signature(text, secret);
    return Utilities.base64Encode(sig);
  }

  function maskSecret(value) {
    if (!value) {
      return '';
    }
    if (value.length <= 8) {
      return '********';
    }
    return value.slice(0, 4) + '...' + value.slice(-4);
  }

  function paginate(items, page, pageSize) {
    var currentPage = Math.max(1, Number(page || 1));
    var size = Math.max(1, Math.min(200, Number(pageSize || 20)));
    var start = (currentPage - 1) * size;
    return {
      page: currentPage,
      pageSize: size,
      total: items.length,
      items: items.slice(start, start + size)
    };
  }

  return {
    nowIso: nowIso,
    uuid: uuid,
    toBool: toBool,
    parseJson: parseJson,
    stringify: stringify,
    sanitizeText: sanitizeText,
    readJsonBody: readJsonBody,
    jsonOutput: jsonOutput,
    headersToMap: headersToMap,
    hmacSha256Base64: hmacSha256Base64,
    maskSecret: maskSecret,
    paginate: paginate
  };
})();
