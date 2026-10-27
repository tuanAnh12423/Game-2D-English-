// ============================================================
// BẢN ĐỒ THẾ GIỚI — mỗi vùng đất là 1 ô 48x36 trên lưới (gx, gy).
// MỞ RỘNG THẾ GIỚI: chỉ cần thêm 1 object vào mảng với gx/gy mới
// (ví dụ gx:3, gy:1). Đường đi nối giữa các vùng được tạo tự động.
//
//   level   : cấp độ cần để vào vùng
//   ground  : grass | city | sand | forest | industrial
//   words   : các nhóm từ vựng xuất hiện (khóa trong words.js)
//   parts   : linh kiện hay rơi ở vùng này (id trong components.js)
//   sea     : true = có biển ở mép dưới · river: {x, w} = sông dọc
//   ponds   : số hồ nước · deco: mật độ cây/hoa/đá/bụi
//   dialog  : chủ đề hội thoại của người đi đường (quests.js)
//   farms   : các thửa ruộng [{x, y, w, h}] để trồng trọt
//   buildings: t = loại toà nhà:
//      home · service · shop · library · cafe · house · station
//      factory · hotel · airport · farmshop · hvac · koi · phela (quán trà sữa) · mall (trung tâm thương mại)
//   Toà nhà KHÔNG được đè lên đường giữa (hàng 16–19, cột 22–25).
//   Cửa luôn ở mặt trước (phía dưới); lối đi ra đường lớn được tạo tự động.
// ============================================================
window.REGIONS = [
  {
    id: 'village', name: 'Làng Ven Sông', en: 'Riverside Village', gx: 0, gy: 1, level: 1, ground: 'grass',
    words: ['daily', 'home', 'food', 'farm', 'feelings', 'phrase_daily'], parts: ['resistor', 'led', 'fuse', 'ceramic', 'diode', 'buzzer', 'elcap'],
    river: { x: 40, w: 3 }, ponds: 1, deco: { tree: 0.05, flower: 0.05, rock: 0.006, bush: 0.012 }, npcs: 3, dialog: 'street',
    spawn: { x: 30, y: 15 },
    farms: [{ x: 16, y: 8, w: 6, h: 5 }],
    buildings: [
      { t: 'home', x: 27, y: 9, w: 6, h: 5, name: 'Nhà của bạn' },
      { t: 'house', x: 10, y: 8, w: 5, h: 4, name: 'Nhà bà Hoa' },
      { t: 'farmshop', x: 34, y: 8, w: 5, h: 4, name: 'Tiệm Nông Sản' },
      { t: 'house', x: 28, y: 23, w: 5, h: 4, name: 'Nhà chú Tư' },
      { t: 'house', x: 10, y: 23, w: 5, h: 4, name: 'Nhà cô Mai' },
      { t: 'station', x: 33, y: 20, w: 3, h: 2, name: 'Trạm xe buýt' },
      { t: 'ranch', x: 16, y: 23, w: 6, h: 4, name: 'Trại Chăn Nuôi' },
    ],
    pens: [{ x: 15, y: 29, w: 8, h: 5 }],
  },
  {
    id: 'downtown', name: 'Phố Trung Tâm', en: 'Downtown', gx: 1, gy: 1, level: 1, ground: 'city',
    words: ['work', 'service', 'city', 'phrase_work', 'money'], parts: ['resistor', 'elcap', 'relay', 'bjt', 'diode', 'ceramic', 'ptc', 'valve', 'fuse', 'led'],
    ponds: 0, deco: { tree: 0.012, flower: 0.01, rock: 0, bush: 0.01 }, npcs: 5, dialog: 'service',
    buildings: [
      { t: 'service', x: 7, y: 5, w: 10, h: 7, name: 'Trung Tâm Bảo Hành' },
      { t: 'library', x: 29, y: 6, w: 7, h: 5, name: 'Thư Viện' },
      { t: 'house', x: 39, y: 7, w: 5, h: 4, name: 'Chung cư A' },
      { t: 'cafe', x: 8, y: 23, w: 6, h: 4, name: 'Cà Phê Sáng' },
      { t: 'koi', x: 16, y: 22, w: 5, h: 4, name: 'KOI Thé' },
      { t: 'house', x: 29, y: 23, w: 5, h: 4, name: 'Nhà anh Bình' },
      { t: 'station', x: 38, y: 21, w: 3, h: 2, name: 'Trạm xe buýt' },
    ],
  },
  {
    id: 'market', name: 'Chợ Linh Kiện', en: 'Electronics Market', gx: 2, gy: 1, level: 2, ground: 'city',
    words: ['electronics', 'tools', 'phrase_tech', 'money'], parts: ['resistor', 'ceramic', 'elcap', 'diode', 'zener', 'led', 'bridge', 'bjt', 'reg7805', 'opto', 'relay', 'inductor', 'transformer', 'mov'],
    ponds: 0, deco: { tree: 0.01, flower: 0.006, rock: 0, bush: 0.006 }, npcs: 5, dialog: 'shop',
    buildings: [
      { t: 'shop', x: 7, y: 5, w: 11, h: 7, name: 'Chợ Linh Kiện & Xưởng' },
      { t: 'house', x: 30, y: 7, w: 5, h: 4, name: 'Tiệm sửa điện' },
      { t: 'cafe', x: 37, y: 7, w: 6, h: 4, name: 'Trà Đá Vỉa Hè' },
      { t: 'house', x: 9, y: 23, w: 5, h: 4, name: 'Nhà chị Lan' },
      { t: 'phela', x: 36, y: 23, w: 6, h: 4, name: 'Phê La' },
      { t: 'station', x: 30, y: 22, w: 3, h: 2, name: 'Trạm xe buýt' },
    ],
  },
  {
    id: 'park', name: 'Công Viên Hồ Sen', en: 'Lotus Lake Park', gx: 1, gy: 2, level: 2, ground: 'grass',
    words: ['nature', 'daily', 'farm', 'health', 'feelings'], parts: ['ntc', 'resistor', 'led', 'mov', 'inductor', 'tfuse', 'buzzer'],
    ponds: 4, deco: { tree: 0.06, flower: 0.09, rock: 0.01, bush: 0.015 }, npcs: 4, dialog: 'street',
    farms: [{ x: 35, y: 23, w: 6, h: 4 }],
    buildings: [
      { t: 'cafe', x: 8, y: 7, w: 6, h: 4, name: 'Quán Kem' },
      { t: 'house', x: 32, y: 8, w: 5, h: 4, name: 'Nhà ông Sáu' },
      { t: 'house', x: 9, y: 24, w: 5, h: 4, name: 'Nhà bé Na' },
      { t: 'station', x: 30, y: 22, w: 3, h: 2, name: 'Trạm xe buýt' },
    ],
  },
  {
    id: 'beach', name: 'Bãi Biển Xanh', en: 'Blue Beach', gx: 0, gy: 2, level: 3, ground: 'sand', sea: true,
    words: ['travel', 'nature', 'food', 'health', 'phrase_daily'], parts: ['mov', 'ntc', 'inductor', 'crystal', 'diode', 'runcap'],
    ponds: 0, deco: { tree: 0.018, flower: 0, rock: 0.012, bush: 0.004 }, npcs: 4, dialog: 'travel',
    buildings: [
      { t: 'hotel', x: 7, y: 5, w: 9, h: 6, name: 'Khách Sạn Biển' },
      { t: 'cafe', x: 30, y: 7, w: 6, h: 4, name: 'Quầy Nước Dừa' },
      { t: 'house', x: 38, y: 7, w: 5, h: 4, name: 'Nhà nghỉ Sóng' },
      { t: 'station', x: 30, y: 21, w: 3, h: 2, name: 'Trạm xe buýt' },
    ],
  },
  {
    id: 'forest', name: 'Rừng Thông', en: 'Pine Forest', gx: 0, gy: 0, level: 4, ground: 'forest',
    words: ['nature', 'travel', 'feelings'], parts: ['crystal', 'ntc', 'hall', 'tfuse', 'inductor', 'mcu'],
    ponds: 2, deco: { tree: 0.16, flower: 0.03, rock: 0.02, bush: 0.03 }, npcs: 2, dialog: 'travel',
    buildings: [
      { t: 'house', x: 10, y: 8, w: 5, h: 4, name: 'Nhà gỗ kiểm lâm' },
      { t: 'cafe', x: 31, y: 24, w: 6, h: 4, name: 'Trạm dừng chân' },
      { t: 'station', x: 30, y: 12, w: 3, h: 2, name: 'Trạm xe buýt' },
    ],
  },
  {
    id: 'industrial', name: 'Khu Công Nghiệp', en: 'Industrial Park', gx: 2, gy: 2, level: 5, ground: 'industrial',
    words: ['industry', 'appliance', 'electronics', 'phrase_tech'], parts: ['mosfet', 'igbt', 'transformer', 'triac', 'hall', 'pump', 'heater', 'opto', 'reg7805', 'valve', 'pswitch', 'doorlock', 'olp'],
    ponds: 0, deco: { tree: 0.01, flower: 0, rock: 0.004, bush: 0.006 }, npcs: 4, dialog: 'factory',
    buildings: [
      { t: 'factory', x: 5, y: 3, w: 13, h: 8, name: 'Nhà Máy Điện Lạnh' },
      { t: 'factory', x: 29, y: 3, w: 13, h: 8, name: 'Nhà Máy Bo Mạch' },
      { t: 'house', x: 8, y: 23, w: 5, h: 4, name: 'Kho phụ tùng' },
      { t: 'hvac', x: 34, y: 22, w: 9, h: 6, name: 'Học Viện HVAC' },
      { t: 'station', x: 30, y: 22, w: 3, h: 2, name: 'Trạm xe buýt' },
    ],
  },
  {
    id: 'techpark', name: 'Khu Công Nghệ Cao', en: 'Hi-Tech Park', gx: 1, gy: 0, level: 6, ground: 'city',
    words: ['electronics', 'industry', 'work', 'phrase_work', 'phrase_tech'], parts: ['mcu', 'igbt', 'hall', 'booster', 'opto', 'crystal', 'mosfet', 'reg7805'],
    ponds: 1, deco: { tree: 0.02, flower: 0.02, rock: 0, bush: 0.01 }, npcs: 4, dialog: 'factory',
    buildings: [
      { t: 'library', x: 7, y: 5, w: 9, h: 6, name: 'Phòng Lab R&D' },
      { t: 'factory', x: 29, y: 4, w: 12, h: 7, name: 'Nhà Máy Chip' },
      { t: 'house', x: 9, y: 23, w: 5, h: 4, name: 'Văn phòng startup' },
      { t: 'station', x: 30, y: 22, w: 3, h: 2, name: 'Trạm xe buýt' },
    ],
  },
  {
    id: 'airport', name: 'Sân Bay Quốc Tế', en: 'International Airport', gx: 2, gy: 0, level: 7, ground: 'city',
    words: ['travel', 'city', 'service', 'phrase_daily', 'money'], parts: ['booster', 'doorlock', 'pswitch', 'pump', 'heater', 'mcu', 'igbt'],
    ponds: 0, deco: { tree: 0.01, flower: 0.01, rock: 0, bush: 0.01 }, npcs: 6, dialog: 'travel',
    buildings: [
      { t: 'airport', x: 5, y: 3, w: 15, h: 9, name: 'Nhà Ga Sân Bay' },
      { t: 'hotel', x: 30, y: 5, w: 9, h: 6, name: 'Khách Sạn Sân Bay' },
      { t: 'cafe', x: 9, y: 23, w: 6, h: 4, name: 'Cà Phê Sân Bay' },
      { t: 'station', x: 30, y: 22, w: 3, h: 2, name: 'Trạm xe buýt' },
    ],
  },
  {
    id: 'shopping', name: 'Khu Mua Sắm', en: 'Shopping District', gx: 3, gy: 1, level: 2, ground: 'city',
    words: ['clothes', 'city', 'daily', 'money', 'feelings'], parts: ['resistor', 'led', 'buzzer', 'fuse', 'elcap', 'ceramic', 'diode'],
    ponds: 0, deco: { tree: 0.015, flower: 0.015, rock: 0, bush: 0.01 }, npcs: 6, dialog: 'shop',
    buildings: [
      { t: 'mall', x: 5, y: 3, w: 16, h: 9, name: 'TTTM Sao Mai' },
      { t: 'house', x: 30, y: 7, w: 5, h: 4, name: 'Căn hộ Sky' },
      { t: 'cafe', x: 37, y: 7, w: 6, h: 4, name: 'Bánh Mì & Cà Phê' },
      { t: 'house', x: 9, y: 23, w: 5, h: 4, name: 'Nhà cô Hạnh' },
      { t: 'station', x: 30, y: 22, w: 3, h: 2, name: 'Trạm xe buýt' },
      { t: 'petshop', x: 37, y: 22, w: 6, h: 4, name: 'Tiệm Thú Cưng Mochi' },
    ],
  },
];

// Thông tin hiển thị cho từng loại toà nhà
window.BUILDING_TYPES = {
  home: { icon: '🏠', roof: '#ff8fab', wall: '#fff3ea' },
  service: { icon: '🛠️', roof: '#7ec8f0', wall: '#f2faff' },
  shop: { icon: '🔌', roof: '#ffb27a', wall: '#fff7ec' },
  library: { icon: '📚', roof: '#b9a0f2', wall: '#f8f3ff' },
  cafe: { icon: '☕', roof: '#d7a98a', wall: '#fff6ee' },
  house: { icon: '🏡', roof: '#8fd6a7', wall: '#f5fff7' },
  station: { icon: '🚌', roof: '#ffd36b', wall: '#fffbea' },
  factory: { icon: '🏭', roof: '#a8bbd6', wall: '#f1f5fb' },
  hotel: { icon: '🏨', roof: '#7fd8cf', wall: '#f0fcfa' },
  airport: { icon: '✈️', roof: '#a7b8e8', wall: '#f3f6ff' },
  farmshop: { icon: '🌱', roof: '#b6e07a', wall: '#fbffef' },
  hvac: { icon: '❄️', roof: '#8ec5ff', wall: '#f0f8ff' },
  koi: { icon: '🧋', roof: '#e0b38c', wall: '#fff7ec' },
  phela: { icon: '🍵', roof: '#a7d48f', wall: '#f6fbef' },
  mall: { icon: '🛍️', roof: '#ff9ec7', wall: '#fff1f7' },
  ranch: { icon: '🐔', roof: '#e8968c', wall: '#fff6ee' },
  petshop: { icon: '🐾', roof: '#ffc078', wall: '#fffaf0' },
};
