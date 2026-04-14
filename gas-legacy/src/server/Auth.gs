var App = App || {};

App.Auth = (function () {
  var OWNER_ROLE = 'owner';

  function normalizeEmail_(email) {
    return String(email || '').trim().toLowerCase();
  }

  function getSessionUserEmail_() {
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

  function canUseEffectiveFallback_() {
    return App.Utils.toBool(App.Config.get('AUTH_USE_EFFECTIVE_USER_FALLBACK', 'false'));
  }

  function getCurrentUserEmail() {
    var active = getSessionUserEmail_();
    if (active) {
      return active;
    }

    if (canUseEffectiveFallback_()) {
      return getEffectiveUserEmail_();
    }

    return '';
  }

  function getAdminByEmail(email) {
    if (!email) {
      return null;
    }
    var row = App.SheetsRepo.findOne('admin_users', 'email', normalizeEmail_(email));
    if (!row) {
      return null;
    }
    if (String(row.status || '').toLowerCase() === 'inactive') {
      return null;
    }
    return row;
  }

  function getPermissionsByRole(role) {
    if (!role) {
      return [];
    }
    if (role === OWNER_ROLE) {
      return ['*'];
    }

    return App.SheetsRepo
      .findMany('permissions', { role_key: role })
      .filter(function (p) {
        return App.Utils.toBool(p.is_allowed);
      })
      .map(function (p) {
        return p.permission_key;
      });
  }

  function can(permission, permissions) {
    if (!permission) {
      return true;
    }
    permissions = permissions || [];
    return permissions.indexOf('*') >= 0 || permissions.indexOf(permission) >= 0;
  }

  function getContext() {
    var email = normalizeEmail_(getCurrentUserEmail());
    var admin = null;

    try {
      admin = getAdminByEmail(email);
    } catch (error) {
      admin = null;
    }

    if (!admin) {
      return {
        email: email,
        activeEmail: getSessionUserEmail_(),
        effectiveEmail: getEffectiveUserEmail_(),
        usingEffectiveFallback: canUseEffectiveFallback_(),
        admin: {
          id: '',
          email: email,
          display_name: email || 'Guest',
          role: 'viewer',
          status: 'inactive'
        },
        permissions: [],
        isAuthorized: false
      };
    }

    var permissions = getPermissionsByRole(admin.role);
    return {
      email: email,
      activeEmail: getSessionUserEmail_(),
      effectiveEmail: getEffectiveUserEmail_(),
      usingEffectiveFallback: canUseEffectiveFallback_(),
      admin: admin,
      permissions: permissions,
      isAuthorized: true
    };
  }

  function requireContext() {
    var ctx = getContext();
    if (!ctx.isAuthorized) {
      throw new Error(
        'Unauthorized account: ' + (ctx.email || '(empty email)') +
        '. Active email=' + (ctx.activeEmail || '(empty)') +
        ', effective email=' + (ctx.effectiveEmail || '(empty)') +
        '. If active email is empty, redeploy Web App with user-auth mode or set AUTH_USE_EFFECTIVE_USER_FALLBACK=true for single-admin setup.'
      );
    }

    App.SheetsRepo.updateById('admin_users', ctx.admin.id, {
      last_login_at: App.Utils.nowIso()
    });

    return ctx;
  }

  function requirePermission(ctx, permission) {
    if (!can(permission, ctx.permissions)) {
      throw new Error('Forbidden permission: ' + permission);
    }
    return true;
  }

  return {
    getCurrentUserEmail: getCurrentUserEmail,
    getEffectiveUserEmail: getEffectiveUserEmail_,
    getContext: getContext,
    requireContext: requireContext,
    requirePermission: requirePermission,
    can: can
  };
})();
