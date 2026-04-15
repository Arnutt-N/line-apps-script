// Five Flex Message preset templates for the admin editor.
//
// Public API:
//   FlexPresets.list()         → [{ id, name, fields: [...] }]   — catalogue for UI
//   FlexPresets.render({id, values}) → LINE Flex message object  — ready to store in payload_json
//
// Each `fields` entry describes one form input:
//   { key, label, type: 'text'|'textarea'|'url'|'color', required?, placeholder?, default? }

var FlexPresets = (function () {
  var LINE_GREEN = '#06C755';

  var PRESETS = {
    announcement: {
      name: 'ประกาศ (Announcement)',
      description: 'หัวข้อเด่น + เนื้อหาหลัก สำหรับแจ้งข่าวสาร',
      altTextDefault: 'ประกาศ',
      fields: [
        { key: 'title',    label: 'หัวข้อ',   type: 'text',     required: true,  default: 'ประกาศจากเจ้าหน้าที่' },
        { key: 'subtitle', label: 'หัวข้อรอง', type: 'text',     default: 'ข้อมูลอัพเดตล่าสุด' },
        { key: 'body',     label: 'เนื้อหา',   type: 'textarea', required: true,  default: 'กรอกเนื้อหาที่ต้องการประกาศ...' },
        { key: 'footer',   label: 'ผู้ประกาศ', type: 'text',     default: 'สำนักงานฯ' }
      ],
      build: function (v) {
        return {
          type: 'bubble',
          size: 'mega',
          header: {
            type: 'box', layout: 'vertical', backgroundColor: LINE_GREEN, paddingAll: '16px',
            contents: [
              { type: 'text', text: v.title || 'ประกาศ', weight: 'bold', color: '#FFFFFF', size: 'lg', wrap: true },
              v.subtitle ? { type: 'text', text: v.subtitle, color: '#DCFCE7', size: 'sm', margin: 'sm', wrap: true } : null
            ].filter(Boolean)
          },
          body: {
            type: 'box', layout: 'vertical', paddingAll: '16px', spacing: 'md',
            contents: [
              { type: 'text', text: v.body || '', wrap: true, color: '#1F2937', size: 'md' }
            ]
          },
          footer: v.footer ? {
            type: 'box', layout: 'vertical', paddingAll: '12px',
            contents: [{ type: 'text', text: v.footer, size: 'xs', color: '#94A3B8', align: 'end' }]
          } : undefined
        };
      }
    },

    contact: {
      name: 'นามบัตร (Contact Card)',
      description: 'ชื่อ + เบอร์โทร + อีเมล + ปุ่มโทร',
      altTextDefault: 'นามบัตรติดต่อ',
      fields: [
        { key: 'name',   label: 'ชื่อ',          type: 'text', required: true, default: 'สำนักงานยุติธรรมจังหวัดสกลนคร' },
        { key: 'role',   label: 'ตำแหน่ง/แผนก',  type: 'text', default: 'ศูนย์บริการประชาชน' },
        { key: 'phone',  label: 'เบอร์โทร',      type: 'text', required: true, default: '042-713400' },
        { key: 'email',  label: 'อีเมล',         type: 'text', default: '' },
        { key: 'hours',  label: 'เวลาทำการ',     type: 'text', default: 'จ-ศ 08.30-16.30 น.' }
      ],
      build: function (v) {
        var phoneDigits = String(v.phone || '').replace(/[^0-9+]/g, '');
        return {
          type: 'bubble',
          body: {
            type: 'box', layout: 'vertical', paddingAll: '20px', spacing: 'md',
            contents: [
              { type: 'text', text: v.name || '', weight: 'bold', size: 'lg', wrap: true, color: '#0F172A' },
              v.role ? { type: 'text', text: v.role, size: 'sm', color: '#64748B', wrap: true } : null,
              { type: 'separator', margin: 'md' },
              {
                type: 'box', layout: 'vertical', margin: 'md', spacing: 'sm',
                contents: [
                  makeKv_('โทร',   v.phone || '-'),
                  v.email ? makeKv_('อีเมล', v.email) : null,
                  v.hours ? makeKv_('เวลา',  v.hours) : null
                ].filter(Boolean)
              }
            ].filter(Boolean)
          },
          footer: {
            type: 'box', layout: 'vertical', paddingAll: '12px',
            contents: [
              {
                type: 'button', style: 'primary', color: LINE_GREEN, height: 'sm',
                action: { type: 'uri', label: 'โทรเลย', uri: 'tel:' + (phoneDigits || '0000000000') }
              }
            ]
          }
        };
      }
    },

    product: {
      name: 'สินค้า/บริการ (Product Card)',
      description: 'รูป + ชื่อ + ราคา + ปุ่มดูรายละเอียด',
      altTextDefault: 'สินค้าบริการ',
      fields: [
        { key: 'imageUrl', label: 'URL รูปภาพ', type: 'url',  required: true, default: 'https://via.placeholder.com/1040x585.png?text=Product' },
        { key: 'title',    label: 'ชื่อสินค้า',   type: 'text', required: true, default: 'ชื่อสินค้า' },
        { key: 'subtitle', label: 'รายละเอียดสั้น', type: 'text', default: 'รายละเอียดย่อ' },
        { key: 'price',    label: 'ราคา',        type: 'text', default: '฿0' },
        { key: 'ctaLabel', label: 'ข้อความปุ่ม',   type: 'text', default: 'ดูรายละเอียด' },
        { key: 'ctaUrl',   label: 'URL ปุ่ม',     type: 'url',  default: 'https://line.me/' }
      ],
      build: function (v) {
        return {
          type: 'bubble',
          hero: {
            type: 'image', url: v.imageUrl || 'https://via.placeholder.com/1040x585.png',
            size: 'full', aspectRatio: '20:13', aspectMode: 'cover'
          },
          body: {
            type: 'box', layout: 'vertical', spacing: 'sm',
            contents: [
              { type: 'text', text: v.title || '', weight: 'bold', size: 'xl', wrap: true },
              v.subtitle ? { type: 'text', text: v.subtitle, size: 'sm', color: '#64748B', wrap: true } : null,
              v.price ? { type: 'text', text: v.price, weight: 'bold', size: 'lg', color: LINE_GREEN, margin: 'md' } : null
            ].filter(Boolean)
          },
          footer: {
            type: 'box', layout: 'vertical',
            contents: [{
              type: 'button', style: 'primary', color: LINE_GREEN, height: 'sm',
              action: { type: 'uri', label: v.ctaLabel || 'ดูรายละเอียด', uri: v.ctaUrl || 'https://line.me/' }
            }]
          }
        };
      }
    },

    menu: {
      name: 'เมนูรายการ (Menu List)',
      description: 'รายการปุ่มสูงสุด 4 รายการ (ส่งข้อความกลับ)',
      altTextDefault: 'เมนูบริการ',
      fields: [
        { key: 'title',   label: 'หัวข้อเมนู',   type: 'text', required: true, default: 'เลือกบริการ' },
        { key: 'item1',   label: 'ปุ่มที่ 1 (ข้อความ)', type: 'text', default: 'บริการ 1' },
        { key: 'item2',   label: 'ปุ่มที่ 2 (ข้อความ)', type: 'text', default: 'บริการ 2' },
        { key: 'item3',   label: 'ปุ่มที่ 3 (ข้อความ)', type: 'text', default: '' },
        { key: 'item4',   label: 'ปุ่มที่ 4 (ข้อความ)', type: 'text', default: '' }
      ],
      build: function (v) {
        var items = [v.item1, v.item2, v.item3, v.item4]
          .map(function (s) { return String(s || '').trim(); })
          .filter(Boolean)
          .slice(0, 4);

        return {
          type: 'bubble',
          body: {
            type: 'box', layout: 'vertical', paddingAll: '20px', spacing: 'md',
            contents: [
              { type: 'text', text: v.title || 'เลือกบริการ', weight: 'bold', size: 'lg', color: '#0F172A' },
              { type: 'separator', margin: 'md' }
            ].concat(items.map(function (label) {
              return {
                type: 'button', style: 'secondary', height: 'sm', margin: 'sm',
                action: { type: 'message', label: label, text: label }
              };
            }))
          }
        };
      }
    },

    event: {
      name: 'กิจกรรม/อีเวนท์ (Event Hero)',
      description: 'รูปใหญ่ + วันเวลา + สถานที่ + ปุ่มเปิดลิงก์',
      altTextDefault: 'กิจกรรม',
      fields: [
        { key: 'imageUrl', label: 'URL รูปภาพ', type: 'url',     required: true, default: 'https://via.placeholder.com/1040x585.png?text=Event' },
        { key: 'title',    label: 'ชื่อกิจกรรม', type: 'text',    required: true, default: 'ชื่อกิจกรรม' },
        { key: 'date',     label: 'วัน-เวลา',    type: 'text',    default: 'วันที่ 1 ม.ค. 2569 เวลา 09.00' },
        { key: 'place',    label: 'สถานที่',     type: 'text',    default: 'สถานที่จัดงาน' },
        { key: 'body',     label: 'คำอธิบาย',    type: 'textarea', default: 'รายละเอียดกิจกรรม...' },
        { key: 'ctaLabel', label: 'ข้อความปุ่ม',  type: 'text',    default: 'ลงทะเบียน' },
        { key: 'ctaUrl',   label: 'URL ปุ่ม',    type: 'url',     default: 'https://line.me/' }
      ],
      build: function (v) {
        return {
          type: 'bubble',
          size: 'giga',
          hero: {
            type: 'image', url: v.imageUrl || 'https://via.placeholder.com/1040x585.png',
            size: 'full', aspectRatio: '20:13', aspectMode: 'cover'
          },
          body: {
            type: 'box', layout: 'vertical', spacing: 'md',
            contents: [
              { type: 'text', text: v.title || '', weight: 'bold', size: 'xl', wrap: true },
              {
                type: 'box', layout: 'vertical', spacing: 'xs', margin: 'md',
                contents: [
                  v.date ?  makeKv_('เมื่อ',   v.date)  : null,
                  v.place ? makeKv_('ที่ไหน', v.place) : null
                ].filter(Boolean)
              },
              v.body ? { type: 'text', text: v.body, wrap: true, size: 'sm', color: '#334155', margin: 'md' } : null
            ].filter(Boolean)
          },
          footer: {
            type: 'box', layout: 'vertical',
            contents: [{
              type: 'button', style: 'primary', color: LINE_GREEN, height: 'sm',
              action: { type: 'uri', label: v.ctaLabel || 'รายละเอียด', uri: v.ctaUrl || 'https://line.me/' }
            }]
          }
        };
      }
    }
  };

  function makeKv_(label, value) {
    return {
      type: 'box', layout: 'baseline', spacing: 'sm',
      contents: [
        { type: 'text', text: label, color: '#94A3B8', size: 'sm', flex: 2 },
        { type: 'text', text: String(value), color: '#0F172A', size: 'sm', flex: 5, wrap: true }
      ]
    };
  }

  function list() {
    var ids = Object.keys(PRESETS);
    return ids.map(function (id) {
      var p = PRESETS[id];
      return {
        id: id,
        name: p.name,
        description: p.description,
        altTextDefault: p.altTextDefault,
        fields: p.fields
      };
    });
  }

  function render(payload) {
    var id = String(payload && payload.id || '');
    var preset = PRESETS[id];
    if (!preset) {
      throw new Error('Unknown flex preset: ' + id);
    }
    var values = (payload && payload.values) || {};
    var altText = String(payload.altText || preset.altTextDefault || 'Flex Message');
    var bubble = preset.build(values);

    return {
      type: 'flex',
      altText: altText,
      contents: bubble
    };
  }

  return {
    list: list,
    render: render
  };
})();
