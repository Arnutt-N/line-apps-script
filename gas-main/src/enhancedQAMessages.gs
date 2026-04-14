// Enhanced Q&A Message Functions for LINE Bot
// Supports single image messages and image carousels

// ฟังก์ชันสำหรับสร้างข้อความรูปภาพเดี่ยว
function createImageMessage(originalUrl, previewUrl, altText) {
  // PATTERN: Return LINE image message object
  var imageMessage = {
    type: "image",
    originalContentUrl: originalUrl,
    previewImageUrl: previewUrl || originalUrl,
    altText: altText || "รูปภาพประกอบ"
  };
  return imageMessage;
}

// ฟังก์ชันสำหรับสร้างข้อความรูปภาพแบบ carousel
function createImageCarousel(imageUrls, altText) {
  // PATTERN: Parse comma-separated URLs and create carousel
  // CRITICAL: Maximum 10 images in carousel
  var urls = imageUrls.split(',');
  var columns = [];
  
  for (var i = 0; i < Math.min(urls.length, 10); i++) {
    var imageUrl = urls[i].trim();
    if (imageUrl) { // Check if URL is not empty
      var column = {
        imageUrl: imageUrl,
        action: {
          type: "message", 
          text: "รูปที่ " + (i + 1)
        }
      };
      columns.push(column);
    }
  }
  
  var carouselMessage = {
    type: "template",
    altText: altText || "รูปภาพประกอบหลายรูป",
    template: {
      type: "image_carousel",
      columns: columns
    }
  };
  
  return carouselMessage;
}

// ฟังก์ชันสำหรับส่งข้อความหลายข้อความในคราวเดียว
function replyMultipleMsg(replyToken, messages, channelToken) {
  // CRITICAL: Maximum 5 messages per reply
  var url = 'https://api.line.me/v2/bot/message/reply';
  var opt = {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + channelToken,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': replyToken,
      'messages': messages.slice(0, 5) // Limit to 5 messages
    })
  };
  UrlFetchApp.fetch(url, opt);
}

// ===== FLEX IMAGE CAROUSEL FUNCTIONS (NEW) =====

// ฟังก์ชันสำหรับสร้าง Flex Message carousel แทน Image Carousel template
// Supports URI actions (opens full-size images) instead of message actions (text responses)
// ENHANCED: Now supports explicit size, aspectMode, and backgroundColor configuration
function createFlexImageCarousel(imageUrls, aspectRatio, fullSizeUrls, altText, previewUrls, size, aspectMode, backgroundColor) {
  // PATTERN: Parse URLs and create Flex carousel bubbles with enhanced configuration
  var urls = imageUrls.split(',');
  var fullUrls = fullSizeUrls ? fullSizeUrls.split(',') : urls;
  var previewUrlArray = previewUrls ? previewUrls.split(',') : urls;
  var bubbles = [];
  
  // Validate and set defaults for new configuration parameters
  var validatedConfig = validateFlexConfig(size, aspectMode, backgroundColor);
  
  // CRITICAL: Maximum 12 bubbles for Flex carousel
  for (var i = 0; i < Math.min(urls.length, 12); i++) {
    var imageUrl = urls[i].trim();
    var fullUrl = fullUrls[i] ? fullUrls[i].trim() : imageUrl;
    var previewUrl = previewUrlArray[i] ? previewUrlArray[i].trim() : imageUrl;
    
    if (imageUrl) {
      // Use configured aspect ratio or default
      var finalAspectRatio = aspectRatio === 'auto' ? '3:2' : aspectRatio;
      if (aspectRatio === 'legal') {
        finalAspectRatio = '4:5';  // Portrait format for legal infographics
      }
      
      var bubble = {
        type: "bubble",
        hero: {
          type: "image",
          url: previewUrl,
          size: validatedConfig.size,           // NEW: Configurable size
          aspectMode: validatedConfig.aspectMode, // NEW: Configurable aspect mode
          aspectRatio: finalAspectRatio,
          action: {
            type: "uri",
            uri: fullUrl
          }
        }
      };
      
      // Add background color styling if configured
      if (validatedConfig.backgroundColor) {
        bubble.styles = {
          body: {
            backgroundColor: validatedConfig.backgroundColor
          }
        };
      }
      
      bubbles.push(bubble);
    }
  }
  
  return {
    type: "flex",
    altText: altText || "รูปภาพประกอบ",
    contents: {
      type: "carousel",
      contents: bubbles
    }
  };
}

// ฟังก์ชันสำหรับกำหนด aspect mode ตามประเภทเนื้อหา
function getAspectMode(aspectRatio, contentType) {
  // Special handling for legal infographics
  if (aspectRatio === "legal" || contentType === "legal") {
    return "fit";  // Prevent text cropping for legal content
  }
  
  switch(aspectRatio) {
    case "1:1": return "fit";     // Square images - show full image
    case "3:2": return "cover";   // Landscape - crop to fit
    case "4:5": 
      return contentType === "legal" ? "fit" : "cover"; // Legal: fit, Others: cover
    default: return "cover";      // Default behavior
  }
}

// ฟังก์ชันสำหรับตรวจจับประเภทเนื้อหาจาก URL pattern
function detectContentType(imageUrl, contentType) {
  // Priority: Manual contentType > URL pattern detection > default
  if (contentType && contentType !== "general") {
    return contentType;
  }
  
  // Detect 2568-08-23 legal infographics from URL pattern
  if (imageUrl.includes("2568-08-23") || imageUrl.includes("legal")) {
    return "legal";
  }
  
  // Detect service images
  if (imageUrl.includes("service") || imageUrl.includes("บริการ")) {
    return "service";
  }
  
  // Detect promotional content
  if (imageUrl.includes("botnoi-obj") || imageUrl.includes("promotional")) {
    return "promotional";
  }
  
  return "general";
}

// ===== VALIDATION AND TEST FUNCTIONS =====

// ฟังก์ชันทดสอบการสร้างข้อความรูปภาพ (สำหรับการทดสอบใน Apps Script Editor)
function testImageMessageFormat() {
  console.log("=== Testing Single Image Message ===");
  var imageMsg = createImageMessage(
    "https://i.imgur.com/AOtbh61.jpg",
    null, 
    "Test image"
  );
  
  // Log each property separately to avoid console truncation
  console.log("Type: " + imageMsg.type);
  console.log("Original URL: " + imageMsg.originalContentUrl);
  console.log("Preview URL: " + imageMsg.previewImageUrl);
  console.log("Alt Text: " + imageMsg.altText);
  console.log("Complete JSON: " + JSON.stringify(imageMsg));
  
  console.log("=== Testing Image Carousel ===");
  var carouselMsg = createImageCarousel(
    "https://i.imgur.com/gXtqJ01.jpg,https://i.imgur.com/lRbeJDL.jpg",
    "Test carousel"
  );
  
  console.log("Type: " + carouselMsg.type);
  console.log("Alt Text: " + carouselMsg.altText);
  console.log("Template Type: " + carouselMsg.template.type);
  console.log("Columns Count: " + carouselMsg.template.columns.length);
  console.log("Complete JSON: " + JSON.stringify(carouselMsg));
}

// ฟังก์ชันทดสอบ Flex Image Carousel แบบใหม่ (NEW)
function testFlexCarouselFormat() {
  console.log("=== Testing Flex Image Carousel with Legal Content ===");
  
  // Test different aspect ratios including legal content
  var testConfigs = [
    { 
      urls: "https://i.imgur.com/img1.jpg,https://i.imgur.com/img2.jpg", 
      ratio: "3:2", 
      alt: "Landscape test", 
      contentType: "promotional" 
    },
    { 
      urls: "https://i.imgur.com/square1.jpg", 
      ratio: "1:1", 
      alt: "Square test", 
      contentType: "service" 
    },
    { 
      urls: "https://i.imgur.com/portrait1.jpg", 
      ratio: "4:5", 
      alt: "Portrait test", 
      contentType: "profile" 
    },
    { 
      urls: "https://i.imgur.com/2568-08-23-legal1.jpg,https://i.imgur.com/2568-08-23-legal2.jpg", 
      ratio: "legal", 
      alt: "Legal infographic test", 
      contentType: "legal",
      fullSizeUrls: "https://i.imgur.com/2568-08-23-legal1-full.jpg,https://i.imgur.com/2568-08-23-legal2-full.jpg"
    }
  ];
  
  for (var i = 0; i < testConfigs.length; i++) {
    var config = testConfigs[i];
    var flexMsg = createFlexImageCarousel(
      config.urls, 
      config.ratio, 
      config.fullSizeUrls || '', 
      config.alt, 
      '', 
      config.contentType
    );
    console.log("Content Type: " + config.contentType);
    console.log("Aspect Ratio: " + config.ratio);
    console.log("Bubbles Count: " + flexMsg.contents.contents.length);
    console.log("Alt Text: " + flexMsg.altText);
    
    // Log first bubble details for validation
    if (flexMsg.contents.contents.length > 0) {
      var firstBubble = flexMsg.contents.contents[0].hero;
      console.log("First Bubble - AspectMode: " + firstBubble.aspectMode);
      console.log("First Bubble - AspectRatio: " + firstBubble.aspectRatio);
      console.log("First Bubble - Action Type: " + firstBubble.action.type);
    }
    
    console.log("JSON: " + JSON.stringify(flexMsg));
    console.log("---");
  }
}

// ฟังก์ชันทดสอบเฉพาะ Legal Infographic Carousel (NEW)
function testLegalInfographicCarousel() {
  console.log("=== Testing Legal Infographic Carousel (2568-08-23) ===");
  
  var legalConfig = {
    urls: "https://i.imgur.com/2568-08-23-compensation.jpg,https://i.imgur.com/2568-08-23-procedure.jpg",
    ratio: "legal",
    fullSizeUrls: "https://i.imgur.com/2568-08-23-compensation-full.jpg,https://i.imgur.com/2568-08-23-procedure-full.jpg",
    alt: "ข้อมูลการขอรับค่าตอบแทนและขั้นตอนการให้บริการ",
    contentType: "legal"
  };
  
  var flexMsg = createFlexImageCarousel(
    legalConfig.urls,
    legalConfig.ratio,
    legalConfig.fullSizeUrls,
    legalConfig.alt,
    '',
    legalConfig.contentType
  );
  
  console.log("Legal Content Test:");
  console.log("Alt Text (Thai): " + flexMsg.altText);
  console.log("Bubbles Count: " + flexMsg.contents.contents.length);
  
  // Validate legal content optimization
  for (var i = 0; i < flexMsg.contents.contents.length; i++) {
    var hero = flexMsg.contents.contents[i].hero;
    console.log("Bubble " + (i + 1) + ":");
    console.log("  AspectMode: " + hero.aspectMode + " (Should be 'fit' for legal content)");
    console.log("  AspectRatio: " + hero.aspectRatio + " (Should be '4:5' for portrait legal content)");
    console.log("  Action URI: " + hero.action.uri + " (Should be full-size URL)");
  }
  
  console.log("Legal Flex JSON: " + JSON.stringify(flexMsg));
}

// ===== CONFIGURATION VALIDATION FUNCTIONS (NEW) =====

// ฟังก์ชันสำหรับตรวจสอบและกำหนดค่า default สำหรับ Flex carousel configuration
function validateFlexConfig(size, aspectMode, backgroundColor) {
  // Validate size parameter
  var validSizes = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl', '5xl', 'full'];
  var finalSize = 'full'; // Default
  if (size && size.trim() && validSizes.indexOf(size.trim()) !== -1) {
    finalSize = size.trim();
  }
  
  // Validate aspectMode parameter  
  var validAspectModes = ['cover', 'fit'];
  var finalAspectMode = 'fit'; // Default
  if (aspectMode && aspectMode.trim() && validAspectModes.indexOf(aspectMode.trim()) !== -1) {
    finalAspectMode = aspectMode.trim();
  }
  
  // Validate backgroundColor parameter
  var finalBackgroundColor = '';
  if (backgroundColor && backgroundColor.trim()) {
    // Basic validation for hex colors, rgb, or gradients
    var colorValue = backgroundColor.trim();
    if (colorValue.match(/^#[0-9A-Fa-f]{6}$/) || 
        colorValue.match(/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/) ||
        colorValue.indexOf('linear-gradient') === 0) {
      finalBackgroundColor = colorValue;
    }
  }
  
  return {
    size: finalSize,
    aspectMode: finalAspectMode,
    backgroundColor: finalBackgroundColor
  };
}

// ===== TESTING FUNCTIONS FOR NEW CONFIGURATION SYSTEM =====

// ฟังก์ชันทดสอบระบบ configuration ใหม่
function testFlexibleCarouselConfig() {
  console.log("=== Testing Flexible Carousel Configuration System ===");
  
  // Test different size configurations
  var sizeTests = [
    { size: 'xxs', aspectMode: 'fit', bg: '', desc: 'Extra extra small with fit' },
    { size: 'sm', aspectMode: 'cover', bg: '#E3F2FD', desc: 'Small with cover and blue background' },
    { size: 'lg', aspectMode: 'fit', bg: '', desc: 'Large with fit mode' },
    { size: 'full', aspectMode: 'cover', bg: 'rgb(248,249,250)', desc: 'Full size with cover and RGB background' },
    { size: '', aspectMode: '', bg: '', desc: 'Empty config (should use defaults)' },
    { size: 'invalid', aspectMode: 'invalid', bg: 'invalid', desc: 'Invalid config (should fallback to defaults)' }
  ];
  
  for (var i = 0; i < sizeTests.length; i++) {
    var config = sizeTests[i];
    console.log("--- Test " + (i + 1) + ": " + config.desc + " ---");
    
    var testUrls = "https://i.imgur.com/test1.jpg,https://i.imgur.com/test2.jpg";
    var flexMsg = createFlexImageCarousel(
      testUrls,
      '3:2',        // aspectRatio
      '',           // fullSizeUrls
      'Test: ' + config.desc,
      '',           // previewUrls
      config.size,      // NEW: size parameter
      config.aspectMode, // NEW: aspectMode parameter
      config.bg         // NEW: backgroundColor parameter
    );
    
    // Validate configuration application
    if (flexMsg.contents.contents.length > 0) {
      var firstBubble = flexMsg.contents.contents[0];
      console.log("Applied Size: " + firstBubble.hero.size);
      console.log("Applied AspectMode: " + firstBubble.hero.aspectMode);
      console.log("Applied AspectRatio: " + firstBubble.hero.aspectRatio);
      console.log("Background Color: " + (firstBubble.styles ? firstBubble.styles.body.backgroundColor : 'none'));
      console.log("Action Type: " + firstBubble.hero.action.type);
    }
    
    console.log("Complete JSON: " + JSON.stringify(flexMsg));
    console.log("");
  }
}

// ฟังก์ชันทดสอบการ validate configuration
function testConfigValidation() {
  console.log("=== Testing Configuration Validation ===");
  
  var validationTests = [
    { size: 'lg', aspectMode: 'cover', bg: '#FF5722', expected: 'valid' },
    { size: 'invalid', aspectMode: 'fit', bg: '', expected: 'size_default' },
    { size: 'xl', aspectMode: 'invalid', bg: '', expected: 'aspect_default' },
    { size: '', aspectMode: '', bg: 'invalid_color', expected: 'bg_ignored' },
    { size: null, aspectMode: undefined, bg: '', expected: 'all_defaults' }
  ];
  
  for (var i = 0; i < validationTests.length; i++) {
    var test = validationTests[i];
    var validated = validateFlexConfig(test.size, test.aspectMode, test.bg);
    console.log("Input: " + JSON.stringify(test));
    console.log("Output: " + JSON.stringify(validated));
    console.log("---");
  }
}