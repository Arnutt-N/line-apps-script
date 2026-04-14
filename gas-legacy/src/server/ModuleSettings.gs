var App = App || {};

App.Settings = (function () {
  function getAll() {
    var rows = App.SheetsRepo.readAll('system_settings');
    var settings = {};

    rows.forEach(function (row) {
      settings[row.setting_key] = convertValue_(row.setting_value, row.setting_type, App.Utils.toBool(row.is_secret));
    });

    return {
      settings: settings,
      scriptProperties: {
        LINE_OA_ID: App.Config.getLineOaId(),
        LINE_CHANNEL_ACCESS_TOKEN: App.Utils.maskSecret(App.Config.getLineChannelAccessToken()),
        LINE_CHANNEL_SECRET: App.Utils.maskSecret(App.Config.getLineChannelSecret()),
        WEBHOOK_PROXY_SHARED_SECRET: App.Utils.maskSecret(App.Config.getWebhookProxySharedSecret()),
        TELEGRAM_BOT_TOKEN: App.Utils.maskSecret(App.Config.getTelegramBotToken()),
        TELEGRAM_CHAT_ID: App.Config.getTelegramChatId(),
        SPREADSHEET_ID: App.Config.getSpreadsheetId(),
        DRIVE_ROOT_FOLDER_ID: App.Config.getDriveRootFolderId()
      }
    };
  }

  function getSettingValue(settingKey, fallbackValue) {
    var row = App.SheetsRepo.findOne('system_settings', 'setting_key', settingKey);
    if (!row) {
      return fallbackValue;
    }
    return convertValue_(row.setting_value, row.setting_type, false);
  }

  function update(payload, ctx) {
    payload = payload || {};
    var mode = payload.mode || 'sheet';

    if (mode === 'scriptProperty') {
      if (!payload.key) {
        throw new Error('Missing script property key');
      }
      PropertiesService.getScriptProperties().setProperty(payload.key, String(payload.value || ''));
      App.SheetsRepo.appendAudit(ctx.email, 'settings.updateProperty', 'script_properties', payload.key, {
        key: payload.key
      });

      return {
        updated: true,
        mode: 'scriptProperty',
        key: payload.key
      };
    }

    if (!payload.key) {
      throw new Error('Missing setting key');
    }

    var existing = App.SheetsRepo.findOne('system_settings', 'setting_key', payload.key);
    var value = String(payload.value == null ? '' : payload.value);
    var settingType = payload.settingType || (existing ? existing.setting_type : 'text');

    var data = {
      setting_key: payload.key,
      setting_value: value,
      setting_type: settingType,
      is_secret: payload.isSecret ? 'true' : 'false',
      updated_by: ctx.email
    };

    var row;
    if (existing) {
      row = App.SheetsRepo.updateById('system_settings', existing.id, data);
    } else {
      row = App.SheetsRepo.insert('system_settings', data);
    }

    App.SheetsRepo.appendAudit(ctx.email, 'settings.update', 'system_settings', row.id, {
      key: payload.key
    });

    return {
      updated: true,
      mode: 'sheet',
      key: row.setting_key,
      value: convertValue_(row.setting_value, row.setting_type, App.Utils.toBool(row.is_secret))
    };
  }

  function testConnection(payload) {
    payload = payload || {};
    var target = payload.target || 'all';
    var requireSig = App.Config.getLineRequireSignature();
    var proxySecret = App.Config.getWebhookProxySharedSecret();
    var proxyEnabled = !!proxySecret;

    var results = {
      sheets: null,
      drive: null,
      line: null,
      telegram: null
    };

    if (target === 'all' || target === 'sheets') {
      try {
        var ss = SpreadsheetApp.openById(App.Config.getSpreadsheetId());
        results.sheets = { ok: true, name: ss.getName() };
      } catch (error) {
        results.sheets = { ok: false, error: error.message };
      }
    }

    if (target === 'all' || target === 'drive') {
      try {
        var folder = DriveApp.getFolderById(App.Config.getDriveRootFolderId());
        results.drive = { ok: true, name: folder.getName(), id: folder.getId() };
      } catch (error) {
        results.drive = { ok: false, error: error.message };
      }
    }

    if (target === 'all' || target === 'line') {
      var lineToken = App.Config.getLineChannelAccessToken();
      var lineSecret = App.Config.getLineChannelSecret();
      results.line = {
        ok: !!lineToken && (proxyEnabled || !requireSig || !!lineSecret),
        detail: lineToken ? 'LINE access token configured' : 'LINE token missing',
        channelSecretConfigured: !!lineSecret,
        proxyProtectionConfigured: proxyEnabled,
        signatureRequired: requireSig,
        webhookMode: proxyEnabled ? 'proxy_enforced' : (requireSig ? 'direct_signature_required' : 'direct_unsigned'),
        webhookCompatibility: proxyEnabled ? {
          ok: true,
          detail: 'Proxy mode enabled. The proxy must verify X-Line-Signature and forward payloads with the shared proxy token.'
        } : requireSig ? {
          ok: false,
          detail: 'Direct Google Apps Script web apps cannot read X-Line-Signature. Disable LINE_REQUIRE_SIGNATURE or place a proxy in front of GAS.'
        } : {
          ok: true,
          detail: 'Direct Google Apps Script webhook mode. LINE signature verification is disabled at the GAS layer.'
        }
      };
    }

    if (target === 'all' || target === 'telegram') {
      try {
        var token = App.Config.getTelegramBotToken();
        var chatId = App.Config.getTelegramChatId();
        results.telegram = {
          ok: !!token && !!chatId,
          detail: !!token && !!chatId ? 'Telegram configured' : 'Telegram token/chatId missing'
        };
      } catch (error) {
        results.telegram = {
          ok: false,
          error: error.message
        };
      }
    }

    return {
      checkedAt: App.Utils.nowIso(),
      target: target,
      results: results
    };
  }

  function convertValue_(value, settingType, maskSecret) {
    if (maskSecret) {
      return App.Utils.maskSecret(String(value || ''));
    }

    if (settingType === 'number') {
      return Number(value || 0);
    }

    if (settingType === 'boolean') {
      return App.Utils.toBool(value);
    }

    if (settingType === 'json') {
      return App.Utils.parseJson(value, {});
    }

    return value;
  }

  return {
    getAll: getAll,
    update: update,
    testConnection: testConnection,
    getSettingValue: getSettingValue
  };
})();
