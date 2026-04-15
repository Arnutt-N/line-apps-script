// Simple single-owner auth for the Phase 1 MVP admin panel.
//
// Authorization rule: the Google account viewing the Web App must match the
// `ADMIN_OWNER_EMAIL` Script Property (case-insensitive). If the property is
// empty, every logged-in Google user is treated as the owner (dev convenience).
//
// The Web App MUST be deployed with "Execute as: Me" and
// "Who has access: Anyone with Google account" (or Only myself) so that
// Session.getActiveUser().getEmail() returns a value.

var AdminAuth = (function () {
  var OWNER_ROLE = 'owner';
  var GUEST_ROLE = 'guest';

  function normalize_(email) {
    return String(email || '').trim().toLowerCase();
  }

  function getOwnerEmail_() {
    return normalize_(PropertiesService.getScriptProperties().getProperty('ADMIN_OWNER_EMAIL') || '');
  }

  function getActiveEmail_() {
    try {
      return normalize_(Session.getActiveUser().getEmail());
    } catch (error) {
      return '';
    }
  }

  function getContext() {
    var email = getActiveEmail_();
    var owner = getOwnerEmail_();
    var isAuthorized;

    if (!owner) {
      // Dev mode: no owner configured → any signed-in user passes.
      isAuthorized = !!email;
    } else {
      isAuthorized = !!email && email === owner;
    }

    return {
      email: email,
      displayName: email || 'Guest',
      role: isAuthorized ? OWNER_ROLE : GUEST_ROLE,
      ownerConfigured: !!owner,
      isAuthorized: isAuthorized
    };
  }

  function requireAuthorized(ctx) {
    if (!ctx || !ctx.isAuthorized) {
      throw new Error('Unauthorized. Configure ADMIN_OWNER_EMAIL and sign in with that Google account.');
    }
    return ctx;
  }

  return {
    getContext: getContext,
    requireAuthorized: requireAuthorized
  };
})();
