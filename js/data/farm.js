// ============================================================
// TRỒNG TRỌT — cây lớn theo THỜI GIAN THỰC (phút ngoài đời).
// Cây chỉ lớn khi đất còn ẩm: mỗi lần tưới giữ ẩm 12 giờ, trời mưa tự tưới.
// Muốn thêm cây mới: thêm 1 object, rồi thêm từ tiếng Anh vào nhóm `farm`
// trong words.js để từ đó vào Từ điển khi thu hoạch lần đầu.
//   min   : số phút thực để chín · seed: giá hạt · sell: giá bán 1 nông sản
//   shape : kiểu cây khi lớn (root, leafy, bush, vine, tall, low, big)
// ============================================================
window.CROPS = [
  { id: 'radish', en: 'radish', plural: 'radishes', vi: 'củ cải đỏ', min: 5, seed: 4, sell: 9, level: 1, xp: 4, color: '#e53950', shape: 'root' },
  { id: 'lettuce', en: 'lettuce', plural: 'heads of lettuce', vi: 'xà lách', min: 10, seed: 6, sell: 14, level: 1, xp: 6, color: '#8bc34a', shape: 'leafy' },
  { id: 'carrot', en: 'carrot', plural: 'carrots', vi: 'cà rốt', min: 20, seed: 8, sell: 20, level: 1, xp: 8, color: '#ff9800', shape: 'root' },
  { id: 'tomato', en: 'tomato', plural: 'tomatoes', vi: 'cà chua', min: 30, seed: 10, sell: 28, level: 2, xp: 10, color: '#e53935', shape: 'bush' },
  { id: 'cucumber', en: 'cucumber', plural: 'cucumbers', vi: 'dưa leo', min: 40, seed: 12, sell: 34, level: 2, xp: 12, color: '#43a047', shape: 'vine' },
  { id: 'corn', en: 'corn', plural: 'ears of corn', vi: 'ngô (bắp)', min: 60, seed: 15, sell: 45, level: 3, xp: 15, color: '#fdd835', shape: 'tall' },
  { id: 'chili', en: 'chili pepper', plural: 'chili peppers', vi: 'ớt', min: 90, seed: 18, sell: 60, level: 4, xp: 18, color: '#d50000', shape: 'bush' },
  { id: 'strawberry', en: 'strawberry', plural: 'strawberries', vi: 'dâu tây', min: 120, seed: 25, sell: 85, level: 5, xp: 24, color: '#ff1744', shape: 'low' },
  { id: 'pumpkin', en: 'pumpkin', plural: 'pumpkins', vi: 'bí ngô', min: 180, seed: 30, sell: 120, level: 6, xp: 30, color: '#fb8c00', shape: 'big' },
  { id: 'watermelon', en: 'watermelon', plural: 'watermelons', vi: 'dưa hấu', min: 240, seed: 40, sell: 160, level: 7, xp: 40, color: '#2e7d32', shape: 'big' },
];

// Dụng cụ & vật phẩm nông trại
window.FARM_ITEMS = [
  { id: 'tool_can', kind: 'tool', en: 'Watering can', vi: 'Bình tưới', price: 0, sym: 'can', color: '#29b6f6',
    desc: 'Tưới nước cho cây. Đất giữ ẩm 12 giờ (thời gian thực) sau mỗi lần tưới; hết ẩm cây sẽ ngừng lớn.' },
  { id: 'fert', kind: 'fert', en: 'Fertilizer', vi: 'Phân bón', price: 15, sym: 'fert', color: '#8d6e63',
    desc: 'Chọn phân bón ở thanh đồ nhanh rồi bấm vào cây đang lớn: cây lớn nhanh thêm 25%.' },
];

// Câu tiếng Anh xuất hiện khi làm nông
window.FARM_SAY = {
  plant: { en: 'plant', vi: 'gieo trồng', say: 'I plant the {crop} seeds in the soil.' },
  water: { en: 'water', vi: 'tưới nước', say: 'I water the {crop}.' },
  harvest: { en: 'harvest', vi: 'thu hoạch', say: 'I harvest the {crops}!' },
  fert: { en: 'fertilize', vi: 'bón phân', say: 'I fertilize the {crop}.' },
};

// Quán cà phê đặt mua nông sản mỗi ngày
window.CAFE_REQ = [
  { en: 'Could you bring us {n} {crops} for our salad, please?', vi: 'Bạn mang giúp quán {n} {vi} để làm salad được không?' },
  { en: 'We have run out of {crops}. Could you sell us {n}, please?', vi: 'Quán hết {vi} rồi. Bạn bán cho quán {n} được không?' },
  { en: 'Our chef needs {n} fresh {crops} today. Can you help?', vi: 'Đầu bếp cần {n} {vi} tươi hôm nay. Bạn giúp được không?' },
];
