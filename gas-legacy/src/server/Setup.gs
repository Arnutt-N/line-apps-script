var App = App || {};

App.Setup = (function () {
  var DEFAULT_ROLES = [
    { role_key: 'owner', role_name: 'Owner', description: 'Full system control', is_system: 'true' },
    { role_key: 'admin', role_name: 'Admin', description: 'Manage core modules', is_system: 'true' },
    { role_key: 'agent', role_name: 'Agent', description: 'Live chat operation', is_system: 'true' },
    { role_key: 'viewer', role_name: 'Viewer', description: 'Read-only access', is_system: 'true' }
  ];

  var DEFAULT_PERMISSIONS = {
    owner: ['*'],
    admin: [
      'dashboard.view', 'chat.view', 'chat.send', 'chat.manage',
      'richmenu.manage', 'autoreply.manage', 'templates.manage',
      'histories.view', 'liff.manage', 'settings.manage', 'settings.admin',
      'templates.object.manage', 'templates.variables.manage',
      'richmenu.pack.manage', 'chat.escalate'
    ],
    agent: ['dashboard.view', 'chat.view', 'chat.send', 'histories.view', 'chat.escalate'],
    viewer: ['dashboard.view', 'histories.view']
  };

  var DEFAULT_SETTINGS = [
    { setting_key: 'chat_poll_interval_ms', setting_value: '3000', setting_type: 'number', is_secret: 'false' },
    { setting_key: 'chat_notification_sound', setting_value: 'true', setting_type: 'boolean', is_secret: 'false' },
    { setting_key: 'chat_notification_blink', setting_value: 'true', setting_type: 'boolean', is_secret: 'false' },
    { setting_key: 'default_video_call_url', setting_value: 'https://meet.google.com/new', setting_type: 'text', is_secret: 'false' },
    { setting_key: 'timezone', setting_value: 'Asia/Bangkok', setting_type: 'text', is_secret: 'false' },
    { setting_key: 'locale', setting_value: 'th-TH', setting_type: 'text', is_secret: 'false' },
    { setting_key: 'retention_days_chat', setting_value: '365', setting_type: 'number', is_secret: 'false' },
    { setting_key: 'rate_limit_per_minute', setting_value: '60', setting_type: 'number', is_secret: 'false' }
  ];

  var DEFAULT_RICH_MENU_PACKS = [
    {
      pack_key: 'restaurant',
      name: 'ร้านอาหาร Demo',
      vertical: 'restaurant',
      description: 'เมนูวันนี้, โปรโมชั่น, สั่งอาหาร, จองโต๊ะ, ร้านอยู่ไหน, คุยกับคน',
      cover_image_url: '',
      is_current: 'false',
      is_system: 'true',
      is_active: 'true'
    },
    {
      pack_key: 'clothing',
      name: 'ร้านขายเสื้อผ้า Demo',
      vertical: 'clothing',
      description: 'คอลเลคชั่นใหม่, โปรโมชั่น, สั่งของ, ไซส์, ที่ตั้งร้าน, คุยกับคน',
      cover_image_url: '',
      is_current: 'false',
      is_system: 'true',
      is_active: 'true'
    },
    {
      pack_key: 'school',
      name: 'โรงเรียน Demo',
      vertical: 'school',
      description: 'ตารางเรียน, ค่าเทอม, ติดต่อครู, กิจกรรม, แผนที่โรงเรียน, คุยกับคน',
      cover_image_url: '',
      is_current: 'false',
      is_system: 'true',
      is_active: 'true'
    }
  ];

  function initialize() {
    App.SheetsRepo.ensureAll();
    seedRoles_();
    seedPermissions_();
    var seededAdmin = seedAdmin_();
    seedSettings_();
    seedTemplates_();
    seedRichMenuPacks_();

    return {
      ok: true,
      initializedAt: App.Utils.nowIso(),
      seededAdmin: seededAdmin
    };
  }

  function seedRichMenuPacks_() {
    DEFAULT_RICH_MENU_PACKS.forEach(function (pack) {
      var found = App.SheetsRepo.findOne('rich_menu_packs', 'pack_key', pack.pack_key);
      if (!found) {
        App.SheetsRepo.insert('rich_menu_packs', pack);
      }
    });
  }

  function seedRoles_() {
    DEFAULT_ROLES.forEach(function (role) {
      var found = App.SheetsRepo.findOne('roles', 'role_key', role.role_key);
      if (!found) {
        App.SheetsRepo.insert('roles', role);
      }
    });
  }

  function seedPermissions_() {
    Object.keys(DEFAULT_PERMISSIONS).forEach(function (roleKey) {
      var perms = DEFAULT_PERMISSIONS[roleKey];
      perms.forEach(function (permissionKey) {
        var existing = App.SheetsRepo.readAll('permissions').find(function (row) {
          return row.role_key === roleKey && row.permission_key === permissionKey;
        });

        if (!existing) {
          App.SheetsRepo.insert('permissions', {
            role_key: roleKey,
            permission_key: permissionKey,
            is_allowed: 'true'
          });
        }
      });
    });
  }

  function normalizeEmail_(email) {
    return String(email || '').trim().toLowerCase();
  }

  function getActiveUserEmail_() {
    try {
      return normalizeEmail_(Session.getActiveUser().getEmail());
    } catch (error) {
      return '';
    }
  }

  function getEffectiveUserEmail_() {
    try {
      return normalizeEmail_(Session.getEffectiveUser().getEmail());
    } catch (error) {
      return '';
    }
  }

  function resolveSeedAdminEmail_() {
    var active = getActiveUserEmail_();
    if (active) {
      return active;
    }

    var bootstrap = normalizeEmail_(App.Config.get('BOOTSTRAP_ADMIN_EMAIL', ''));
    if (bootstrap) {
      return bootstrap;
    }

    if (App.Utils.toBool(App.Config.get('AUTH_USE_EFFECTIVE_USER_FALLBACK', 'false'))) {
      return getEffectiveUserEmail_();
    }

    return '';
  }

  function seedAdmin_() {
    var email = resolveSeedAdminEmail_();
    if (!email) {
      return {
        seeded: false,
        email: '',
        reason: 'No usable admin email. Set BOOTSTRAP_ADMIN_EMAIL or enable AUTH_USE_EFFECTIVE_USER_FALLBACK for single-admin setup.'
      };
    }

    var existing = App.SheetsRepo.findOne('admin_users', 'email', email);
    if (!existing) {
      App.SheetsRepo.insert('admin_users', {
        email: email,
        display_name: email,
        role: 'owner',
        status: 'active',
        last_login_at: App.Utils.nowIso()
      });

      return {
        seeded: true,
        created: true,
        email: email
      };
    }

    App.SheetsRepo.updateById('admin_users', existing.id, {
      status: 'active',
      last_login_at: App.Utils.nowIso()
    });

    return {
      seeded: true,
      created: false,
      email: email
    };
  }

  function seedSettings_() {
    DEFAULT_SETTINGS.forEach(function (setting) {
      var existing = App.SheetsRepo.findOne('system_settings', 'setting_key', setting.setting_key);
      if (!existing) {
        App.SheetsRepo.insert('system_settings', Object.assign({}, setting, {
          updated_by: 'system'
        }));
      }
    });
  }

  function seedTemplates_() {
    var templates = [
      { name: 'ข้อความต้อนรับ', category: 'intent_template', payload: { type: 'text', text: 'สวัสดี ยินดีต้อนรับ' } },
      { name: 'ขอบคณ', category: 'intent_template', payload: { type: 'text', text: 'ขอบคณทตดตอเรา' } },
      { name: 'ยกเลก', category: 'intent_template', payload: { type: 'text', text: 'ระบบยกเลกรายการใหแลว' } },
      { name: 'ข้อความเริ่มต้น', category: 'intent_template', payload: { type: 'text', text: 'กรุณาระบุรายละเอียดเพิ่มเติม' } },
      { name: 'Text message', category: 'object', payload: { type: 'text', text: 'Sample text' } },
      { name: 'Text message (v2)', category: 'object', payload: { type: 'textV2', text: '{user} sample text v2' } },
      { name: 'Sticker message', category: 'object', payload: { type: 'sticker', packageId: '446', stickerId: '1988' } },
      { name: 'Image message', category: 'object', payload: { type: 'image', originalContentUrl: 'https://example.com/image.jpg', previewImageUrl: 'https://example.com/preview.jpg' } },
      { name: 'Video message', category: 'object', payload: { type: 'video', originalContentUrl: 'https://example.com/video.mp4', previewImageUrl: 'https://example.com/video_preview.jpg' } },
      { name: 'Audio message', category: 'object', payload: { type: 'audio', originalContentUrl: 'https://example.com/audio.mp3', duration: 60000 } },
      { name: 'Location message', category: 'object', payload: { type: 'location', title: 'Office', address: 'Bangkok', latitude: 13.7563, longitude: 100.5018 } },
      { name: 'Coupon message', category: 'object', payload: { type: 'flex', altText: 'Coupon', contents: { type: 'bubble', body: { type: 'box', layout: 'vertical', contents: [{ type: 'text', text: 'Coupon 10%' }] } } } },
      { name: 'Imagemap message', category: 'object', payload: { type: 'imagemap', baseUrl: 'https://example.com/map', altText: 'Image map', baseSize: { width: 1040, height: 1040 }, actions: [] } },
      { name: 'Template Buttons', category: 'object', payload: { type: 'template', altText: 'Buttons', template: { type: 'buttons', text: 'เลือกเมนู', actions: [] } } },
      { name: 'Template Confirm', category: 'object', payload: { type: 'template', altText: 'Confirm', template: { type: 'confirm', text: 'ยืนยันไหม', actions: [] } } },
      { name: 'Template Carousel', category: 'object', payload: { type: 'template', altText: 'Carousel', template: { type: 'carousel', columns: [] } } },
      { name: 'Template Image Carousel', category: 'object', payload: { type: 'template', altText: 'Image Carousel', template: { type: 'image_carousel', columns: [] } } },
      { name: 'Flex Message', category: 'object', payload: { type: 'flex', altText: 'Flex', contents: { type: 'bubble', body: { type: 'box', layout: 'vertical', contents: [{ type: 'text', text: 'Flex message' }] } } } },
      { name: 'Quick Reply', category: 'object', payload: { type: 'text', text: 'Quick Reply Example', quickReply: { items: [] } } }
    ];

    templates.forEach(function (template) {
      var existing = App.SheetsRepo.findOne('response_templates', 'name', template.name);
      if (!existing) {
        App.SheetsRepo.insert('response_templates', {
          name: template.name,
          category: template.category,
          payload_json: JSON.stringify(template.payload),
          is_system: 'true',
          is_active: 'true'
        });
      }
    });
  }

  function seedDemoData() {
    var demoUser = App.SheetsRepo.findOne('users', 'line_user_id', 'U_DEMO_001');
    if (!demoUser) {
      demoUser = App.SheetsRepo.insert('users', {
        line_user_id: 'U_DEMO_001',
        display_name: 'Demo User',
        picture_url: '',
        status_message: 'Ready to chat',
        language: 'th',
        followed_at: App.Utils.nowIso(),
        readded_count: 1,
        last_seen_at: App.Utils.nowIso(),
        tags: 'demo,new',
        notes: '',
        is_blocked: 'false'
      });
    }

    var room = App.SheetsRepo.findOne('chat_rooms', 'user_id', demoUser.id);
    if (!room) {
      room = App.SheetsRepo.insert('chat_rooms', {
        user_id: demoUser.id,
        mode: 'bot',
        assigned_admin: '',
        last_message_at: App.Utils.nowIso(),
        last_message_text: 'สวัสดี ยินดีต้อนรับ',
        unread_count: 0,
        status: 'open'
      });
    }

    App.SheetsRepo.insert('chat_messages', {
      room_id: room.id,
      user_id: demoUser.id,
      sender_type: 'system',
      sender_id: 'system',
      message_type: 'text',
      text: 'สวัสดี ยินดีต้อนรับ',
      payload_json: '{}',
      file_drive_id: '',
      file_url: '',
      status: 'sent',
      is_read: 'true'
    });

    var seededIntent = seedDemoIntent_();

    return {
      ok: true,
      demoUserId: demoUser.id,
      roomId: room.id,
      intentId: seededIntent ? seededIntent.id : null
    };
  }

  function seedDemoIntent_() {
    var intent = App.SheetsRepo.findOne('intents', 'key', 'greeting');
    if (!intent) {
      intent = App.SheetsRepo.insert('intents', {
        key: 'greeting',
        name: 'ทักทาย',
        description: 'ตอบรับคำทักทายทั่วไป',
        priority: 10,
        is_active: 'true'
      });
    }

    var greetingKeywords = ['สวัสดี', 'สวัสดีครับ', 'สวัสดีค่ะ', 'hello', 'hi', 'ทักทาย'];
    greetingKeywords.forEach(function (kw) {
      var existing = App.SheetsRepo.findOne('intent_keywords', 'keyword', kw);
      if (!existing) {
        App.SheetsRepo.insert('intent_keywords', {
          intent_id: intent.id,
          keyword: kw,
          match_type: 'contains',
          weight: 1,
          is_active: 'true'
        });
      }
    });

    var greetingTemplate = App.SheetsRepo.findOne('response_templates', 'name', 'ข้อความต้อนรับ');
    var hasResponse = App.SheetsRepo.findMany('intent_responses', { intent_id: intent.id }).length > 0;
    if (!hasResponse) {
      App.SheetsRepo.insert('intent_responses', {
        intent_id: intent.id,
        response_type: greetingTemplate ? 'template' : 'text',
        template_id: greetingTemplate ? greetingTemplate.id : '',
        response_json: greetingTemplate ? '' : JSON.stringify({ type: 'text', text: 'สวัสดีครับ ยินดีต้อนรับ' }),
        is_active: 'true'
      });
    }

    return intent;
  }

  return {
    initialize: initialize,
    seedDemoData: seedDemoData
  };
})();

