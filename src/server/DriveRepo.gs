var App = App || {};

App.DriveRepo = (function () {
  function root_() {
    return DriveApp.getFolderById(App.Config.getDriveRootFolderId());
  }

  function ensureFolder(folderName) {
    if (!folderName) {
      return root_();
    }

    var root = root_();
    var matches = root.getFoldersByName(folderName);
    if (matches.hasNext()) {
      return matches.next();
    }
    return root.createFolder(folderName);
  }

  function decodeDataUrl_(dataUrl) {
    var parts = String(dataUrl || '').split(',');
    if (parts.length < 2) {
      throw new Error('Invalid dataUrl payload');
    }

    var head = parts[0];
    var base64Data = parts[1];
    var mimeMatch = head.match(/data:(.*?);base64/);
    var mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    return {
      bytes: Utilities.base64Decode(base64Data),
      mimeType: mimeType
    };
  }

  function saveDataUrl(options) {
    options = options || {};
    var filename = options.filename || ('upload_' + Date.now());
    var folderName = options.folderName || '';
    var decoded = decodeDataUrl_(options.dataUrl || '');
    var mimeType = options.mimeType || decoded.mimeType;
    var folder = ensureFolder(folderName);
    var blob = Utilities.newBlob(decoded.bytes, mimeType, filename);
    var file = folder.createFile(blob);
    try {
      if (App.Utils.toBool(App.Config.get('DRIVE_PUBLIC_SHARING', 'true'))) {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
    } catch (error) {
    }

    return {
      id: file.getId(),
      name: file.getName(),
      mimeType: file.getMimeType(),
      url: file.getUrl(),
      size: file.getSize()
    };
  }

  function saveBlob(options) {
    options = options || {};
    var folder = ensureFolder(options.folderName || '');
    var file = folder.createFile(options.blob);
    try {
      if (App.Utils.toBool(App.Config.get('DRIVE_PUBLIC_SHARING', 'true'))) {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
    } catch (error) {
    }
    return {
      id: file.getId(),
      name: file.getName(),
      mimeType: file.getMimeType(),
      url: file.getUrl(),
      size: file.getSize()
    };
  }

  return {
    ensureFolder: ensureFolder,
    saveDataUrl: saveDataUrl,
    saveBlob: saveBlob
  };
})();

