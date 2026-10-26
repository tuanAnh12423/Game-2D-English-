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
//      factory · hotel · airport · farmshop · hvac · koi · phela (quán trà sữa)
//   Toà nhà KHÔNG được đè lên đường giữa (hàng 16–19, cột 22–25).
//   Cửa luôn ở mặt trước (phía dưới); lối đi ra đường lớn được tạo tự động.
// ============================================================
window.REGIONS = [
  {
    id: 'village', name: 'Làng Ven Sông', en: 'Riverside Village', gx: 0, gy: 1, level: 1, ground: 'grass',
    words: ['daily', 'home', 'food', 'farm'], parts: ['resistor', 'led', 'fuse', 'ceramic', 'diode', 'buzzer', 'elcap'],
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
    ],
  },
  {
    id: 'downtown', name: 'Phố Trung Tâm', en: 'Downtown', gx: 1, gy: 1, level: 1, ground: 'city',
    words: ['work', 'service', 'city'], parts: ['resistor', 'elcap', 'relay', 'bjt', 'diode', 'ceramic', 'ptc', 'valve', 'fuse', 'led'],
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
    words: ['electronics', 'tools'], parts: ['resistor', 'ceramic', 'elcap', 'diode', 'zener', 'led', 'bridge', 'bjt', 'reg7805', 'opto', 'relay', 'inductor', 'transformer', 'mov'],
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
    words: ['nature', 'daily', 'farm'], parts: ['ntc', 'resistor', 'led', 'mov', 'inductor', 'tfuse', 'buzzer'],
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
    words: ['travel', 'nature', 'food'], parts: ['mov', 'ntc', 'inductor', 'crystal', 'diode', 'runcap'],
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
    words: ['nature', 'travel'], parts: ['crystal', 'ntc', 'hall', 'tfuse', 'inductor', 'mcu'],
    ponds: 2, deco: { tree: 0.16, flower: 0.03, rock: 0.02, bush: 0.03 }, npcs: 2, dialog: 'travel',
    buildings: [
      { t: 'house', x: 10, y: 8, w: 5, h: 4, name: 'Nhà gỗ kiểm lâm' },
      { t: 'cafe', x: 31, y: 24, w: 6, h: 4, name: 'Trạm dừng chân' },
      { t: 'station', x: 30, y: 12, w: 3, h: 2, name: 'Trạm xe buýt' },
    ],
  },
  {
    id: 'industrial', name: 'Khu Công Nghiệp', en: 'Industrial Park', gx: 2, gy: 2, level: 5, ground: 'industrial',
    words: ['industry', 'appliance', 'electronics'], parts: ['mosfet', 'igbt', 'transformer', 'triac', 'hall', 'pump', 'heater', 'opto', 'reg7805', 'valve', 'pswitch', 'doorlock', 'olp'],
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
    words: ['electronics', 'industry', 'work'], parts: ['mcu', 'igbt', 'hall', 'booster', 'opto', 'crystal', 'mosfet', 'reg7805'],
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
    words: ['travel', 'city', 'service'], parts: ['booster', 'doorlock', 'pswitch', 'pump', 'heater', 'mcu', 'igbt'],
    ponds: 0, deco: { tree: 0.01, flower: 0.01, rock: 0, bush: 0.01 }, npcs: 6, dialog: 'travel',
    buildings: [
      { t: 'airport', x: 5, y: 3, w: 15, h: 9, name: 'Nhà Ga Sân Bay' },
      { t: 'hotel', x: 30, y: 5, w: 9, h: 6, name: 'Khách Sạn Sân Bay' },
      { t: 'cafe', x: 9, y: 23, w: 6, h: 4, name: 'Cà Phê Sân Bay' },
      { t: 'station', x: 30, y: 22, w: 3, h: 2, name: 'Trạm xe buýt' },
    ],
  },
];

// Thông tin hiển thị cho từng loại toà nhà
window.BUILDING_TYPES = {
  home: { icon: '🏠', roof: '#c62828', wall: '#ffe0b2' },
  service: { icon: '🛠️', roof: '#1565c0', wall: '#e3f2fd' },
  shop: { icon: '🔌', roof: '#ef6c00', wall: '#fff3e0' },
  library: { icon: '📚', roof: '#6a1b9a', wall: '#f3e5f5' },
  cafe: { icon: '☕', roof: '#6d4c41', wall: '#efebe9' },
  house: { icon: '🏡', roof: '#2e7d32', wall: '#f1f8e9' },
  station: { icon: '🚌', roof: '#fbc02d', wall: '#fffde7' },
  factory: { icon: '🏭', roof: '#546e7a', wall: '#cfd8dc' },
  hotel: { icon: '🏨', roof: '#00838f', wall: '#e0f7fa' },
  airport: { icon: '✈️', roof: '#455a64', wall: '#eceff1' },
  farmshop: { icon: '🌱', roof: '#7cb342', wall: '#f9fbe7' },
  hvac: { icon: '❄️', roof: '#0277bd', wall: '#e1f5fe' },
  koi: { icon: '🧋', roof: '#4e342e', wall: '#fff8e1' },
  phela: { icon: '🍵', roof: '#33691e', wall: '#f1f8e9' },
};
