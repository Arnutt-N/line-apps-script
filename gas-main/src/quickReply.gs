function getSocialMediaMessage() {
  return {
    "type": "text",
    "text": "กดปุ่มเลือกรายการที่ต้องการ",
    "quickReply": {
      "items": [
        {
          "type": "action",
          "imageUrl": "https://i.imgur.com/HnmLr4k.png",
          "action": {
            "type": "uri",
            "label": "Website",
            "uri": "https://sakonnakhon.moj.go.th"
          }
        },
        {
          "type": "action",
          "imageUrl": "https://i.imgur.com/Cg77syv.png",
          "action": {
            "type": "uri",
            "label": "Facebook",
            "uri": "https://www.facebook.com/mojsakonnakhon.justice2564"
          }
        },
        {
          "type": "action",
          "imageUrl": "https://i.imgur.com/AFs3s5i.png",
          "action": {
            "type": "message",
            "label": "ยกเลิก",
            "text": "ยกเลิก"
          }
        }
      ]
    }
  };
}
