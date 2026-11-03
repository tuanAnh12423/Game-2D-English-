// ============================================================
// THỜI TRANG (bổ sung cho Trung Tâm Thương Mại & Tủ đồ)
// r3: kiểu dáng cho nhân vật người thật 3D (chế độ Như thật)
//   fab   : vân vải — denim jersey knit leather linen velvet wool boucle gingham jacquard
//   pat   : hoa văn — stripes dots plaid floral sport
//   c2    : màu phụ (sọc, chấm bi, áo trong khi mặc áo khoác mở, cổ áo)
//   neck  : round V collar turtle mandarin · sleeve: 0 sát nách · 1 ngắn · 2 dài
//   open  : áo khoác mở vạt · crop: áo croptop · btn: hàng cúc · flare: 1 váy xoè · 2 xếp ly
//   aodai : tà áo dài · rip: quần rách gối · sole: màu đế giày · heel: giày cao gót
//   costume: bộ hoá trang 3D thật (ranger / peasant)
// type: kiểu vẽ ở bản 2D (giữ tương thích)
// ============================================================
Object.assign(CLOTH_COLORS, {
  cream: { en: 'cream', vi: 'kem', hex: '#f3e9d2' },
  mint: { en: 'mint green', vi: 'xanh bạc hà', hex: '#9fe0c3' },
  lavender: { en: 'lavender', vi: 'tím oải hương', hex: '#c3b1e1' },
  wine: { en: 'wine red', vi: 'đỏ rượu vang', hex: '#7b1e3a' },
  sky: { en: 'sky blue', vi: 'xanh da trời', hex: '#8ec9f0' },
  gold: { en: 'gold', vi: 'vàng kim', hex: '#d4af37' },
  silver: { en: 'silver', vi: 'bạc', hex: '#c0c4cc' },
  denim: { en: 'light denim', vi: 'xanh jean nhạt', hex: '#7fa3c9' },
});

// thêm kiểu 3D cho đồ có sẵn
const R3_OLD = {
  tee: { fab: 'jersey', neck: 'round', sleeve: 1 }, polo: { fab: 'jersey', neck: 'collar', sleeve: 1, btn: 1 },
  shirt: { fab: 'linen', neck: 'collar', sleeve: 2, btn: 1 }, hoodie: { fab: 'knit', neck: 'round', sleeve: 2 },
  jacket: { fab: 'wool', open: 1, c2: '#f5f5f5', neck: 'collar', sleeve: 2 }, dress: { fab: 'linen', neck: 'V', sleeve: 1, flare: 1 },
  jeans: { fab: 'denim' }, trousers: { fab: 'wool' }, shorts: { fab: 'linen' }, skirt: { fab: 'wool', flare: 1 },
  sneakers: { sole: '#ffffff' }, boots: { sole: '#3e2723' }, sandals: { sole: '#8d6e63' },
};
CLOTHES.forEach((c) => { if (R3_OLD[c.id]) c.r3 = R3_OLD[c.id]; });

CLOTHES.push(
  // ---- áo ----
  { id: 'stripe_tee', slot: 'top', type: 'tee', en: 'striped T-shirt', vi: 'Áo thun kẻ sọc', price: 80, size: 'clothes', colors: ['navy', 'red', 'black', 'pink', 'green'], r3: { fab: 'jersey', pat: 'stripes', c2: '#f5f5f5', neck: 'round', sleeve: 1 } },
  { id: 'crop_top', slot: 'top', type: 'tee', en: 'crop top', vi: 'Áo croptop', price: 90, size: 'clothes', colors: ['white', 'pink', 'lavender', 'mint', 'black'], r3: { fab: 'jersey', crop: 1, neck: 'round', sleeve: 1 } },
  { id: 'sweater', slot: 'top', type: 'hoodie', en: 'turtleneck sweater', vi: 'Áo len cổ lọ', price: 160, size: 'clothes', colors: ['cream', 'beige', 'wine', 'gray', 'lavender'], r3: { fab: 'knit', neck: 'turtle', sleeve: 2 } },
  { id: 'cardigan', slot: 'top', type: 'jacket', en: 'cardigan', vi: 'Áo khoác len cardigan', price: 170, size: 'clothes', colors: ['cream', 'pink', 'mint', 'gray', 'beige'], r3: { fab: 'boucle', open: 1, c2: '#f5f5f5', neck: 'V', sleeve: 2, btn: 1 } },
  { id: 'denim_jacket', slot: 'top', type: 'jacket', en: 'denim jacket', vi: 'Áo khoác jean', price: 220, size: 'clothes', colors: ['denim', 'blue', 'black'], r3: { fab: 'denim', open: 1, c2: '#f5f5f5', neck: 'collar', sleeve: 2, btn: 1 } },
  { id: 'leather_jacket', slot: 'top', type: 'jacket', en: 'leather jacket', vi: 'Áo khoác da', price: 320, size: 'clothes', colors: ['black', 'brown', 'wine'], r3: { fab: 'leather', open: 1, c2: '#212121', neck: 'collar', sleeve: 2 } },
  { id: 'blazer', slot: 'top', type: 'jacket', en: 'blazer', vi: 'Áo vest công sở', price: 280, size: 'clothes', colors: ['navy', 'black', 'gray', 'beige', 'wine'], r3: { fab: 'wool', open: 1, c2: '#f5f5f5', neck: 'V', sleeve: 2, btn: 1 } },
  { id: 'track_jacket', slot: 'top', type: 'jacket', en: 'track jacket', vi: 'Áo khoác thể thao', price: 190, size: 'clothes', colors: ['black', 'navy', 'red', 'green', 'purple'], r3: { fab: 'jersey', pat: 'sport', c2: '#f5f5f5', neck: 'collar', sleeve: 2 } },
  { id: 'gingham_shirt', slot: 'top', type: 'shirt', en: 'gingham shirt', vi: 'Sơ mi ca-rô', price: 150, size: 'clothes', colors: ['red', 'blue', 'green', 'black'], r3: { fab: 'gingham', neck: 'collar', sleeve: 2, btn: 1 } },
  { id: 'polka_dress', slot: 'top', type: 'dress', en: 'polka dot dress', vi: 'Váy chấm bi', price: 230, size: 'clothes', colors: ['navy', 'red', 'black', 'pink'], r3: { fab: 'linen', pat: 'dots', c2: '#f5f5f5', neck: 'round', sleeve: 1, flare: 1 } },
  { id: 'floral_dress', slot: 'top', type: 'dress', en: 'floral dress', vi: 'Váy hoa nhí', price: 240, size: 'clothes', colors: ['cream', 'sky', 'pink', 'mint'], r3: { fab: 'linen', pat: 'floral', c2: '#e86a92', neck: 'V', sleeve: 0, flare: 1 } },
  { id: 'velvet_dress', slot: 'top', type: 'dress', en: 'velvet evening dress', vi: 'Đầm nhung dự tiệc', price: 380, size: 'clothes', colors: ['wine', 'black', 'navy', 'green'], r3: { fab: 'velvet', neck: 'V', sleeve: 2, flare: 1 } },
  { id: 'aodai', slot: 'top', type: 'dress', en: 'ao dai (Vietnamese long dress)', vi: 'Áo dài', price: 350, size: 'clothes', colors: ['white', 'red', 'pink', 'sky', 'lavender', 'gold'], r3: { fab: 'jacquard', neck: 'mandarin', sleeve: 2, aodai: 1 } },
  // ---- quần / váy ----
  { id: 'ripped_jeans', slot: 'bottom', type: 'pants', en: 'ripped jeans', vi: 'Quần jean rách', price: 170, size: 'clothes', plural: true, colors: ['denim', 'blue', 'black'], r3: { fab: 'denim', rip: 1 } },
  { id: 'joggers', slot: 'bottom', type: 'pants', en: 'joggers', vi: 'Quần jogger', price: 120, size: 'clothes', plural: true, colors: ['black', 'gray', 'navy'], r3: { fab: 'jersey', pat: 'sport', c2: '#f5f5f5' } },
  { id: 'silk_pants', slot: 'bottom', type: 'pants', en: 'silk trousers', vi: 'Quần lụa', price: 160, size: 'clothes', plural: true, colors: ['white', 'cream', 'black'], r3: { fab: 'jacquard' } },
  { id: 'pleated_skirt', slot: 'bottom', type: 'skirt', en: 'pleated skirt', vi: 'Chân váy xếp ly', price: 150, size: 'clothes', colors: ['navy', 'beige', 'pink', 'black', 'cream'], r3: { fab: 'wool', flare: 2 } },
  { id: 'plaid_skirt', slot: 'bottom', type: 'skirt', en: 'plaid skirt', vi: 'Chân váy ca-rô', price: 160, size: 'clothes', colors: ['red', 'navy', 'green', 'beige'], r3: { fab: 'wool', pat: 'plaid', c2: '#f5f5f5', flare: 2 } },
  // ---- giày ----
  { id: 'heels', slot: 'shoes', type: 'shoe', en: 'high heels', vi: 'Giày cao gót', price: 240, size: 'shoes', plural: true, colors: ['black', 'red', 'beige', 'white'], r3: { sole: '#1a1a1a', heel: 1 } },
  { id: 'loafers', slot: 'shoes', type: 'shoe', en: 'loafers', vi: 'Giày lười', price: 200, size: 'shoes', plural: true, colors: ['brown', 'black'], r3: { sole: '#2b1d16' } },
  // ---- cổ / tay ----
  { id: 'tie', slot: 'neck', type: 'tie', en: 'tie', vi: 'Cà vạt', price: 80, colors: ['navy', 'red', 'black', 'wine'] },
  { id: 'scarf', slot: 'neck', type: 'scarf', en: 'scarf', vi: 'Khăn choàng cổ', price: 90, colors: ['red', 'cream', 'gray', 'mint', 'wine'] },
  { id: 'necklace', slot: 'neck', type: 'necklace', en: 'necklace', vi: 'Vòng cổ', price: 260, colors: ['gold', 'silver'] },
  { id: 'handbag', slot: 'hand', type: 'handbag', en: 'handbag', vi: 'Túi xách tay', price: 280, colors: ['black', 'beige', 'pink', 'wine', 'white'] },
  // ---- hoá trang (mô hình 3D thật) ----
  { id: 'ranger', slot: 'costume', type: 'costume', en: 'ranger costume', vi: 'Trang phục thợ săn', price: 400, colors: ['green'], r3: { costume: 'Ranger' } },
  { id: 'peasant', slot: 'costume', type: 'costume', en: 'village costume', vi: 'Trang phục làng quê', price: 300, colors: ['brown'], r3: { costume: 'Peasant' } },
);

MALL_FLOORS.push({ id: 'style', icon: '💍', name: 'Cổ & tay', slots: ['neck', 'hand'] }, { id: 'costume', icon: '🎭', name: 'Hoá trang', slots: ['costume'] });

// bộ phối sẵn để mặc nhanh trong Tủ đồ (mỗi món: [id, màu])
window.OUTFIT_SETS = [
  { id: 'office', icon: '💼', vi: 'Công sở', en: 'office look', wear: { top: ['blazer', 'navy'], bottom: ['trousers', 'black'], shoes: ['loafers', 'black'], neck: ['tie', 'red'], hat: 'none' } },
  { id: 'street', icon: '🛹', vi: 'Dạo phố', en: 'street style', wear: { top: ['denim_jacket', 'denim'], bottom: ['ripped_jeans', 'black'], shoes: ['sneakers', 'white'], hat: ['cap', 'black'], glasses: ['sunglasses', 'black'] } },
  { id: 'cute', icon: '🎀', vi: 'Dễ thương', en: 'cute look', wear: { top: ['sweater', 'cream'], bottom: ['plaid_skirt', 'red'], shoes: ['loafers', 'brown'], hat: ['beanie', 'red'], hand: ['handbag', 'beige'] } },
  { id: 'sport', icon: '🏃', vi: 'Thể thao', en: 'sporty look', wear: { top: ['track_jacket', 'navy'], bottom: ['joggers', 'black'], shoes: ['sneakers', 'white'], hat: ['cap', 'white'] } },
  { id: 'party', icon: '🥂', vi: 'Dự tiệc', en: 'party look', wear: { top: ['velvet_dress', 'wine'], shoes: ['heels', 'black'], neck: ['necklace', 'gold'], hand: ['handbag', 'black'], hat: 'none' } },
  { id: 'summer', icon: '🌼', vi: 'Mùa hè', en: 'summer look', wear: { top: ['floral_dress', 'cream'], shoes: ['sandals', 'brown'], hat: ['sunhat', 'pink'], glasses: ['sunglasses', 'black'] } },
  { id: 'aodai', icon: '🇻🇳', vi: 'Áo dài', en: 'ao dai', wear: { top: ['aodai', 'red'], bottom: ['silk_pants', 'white'], shoes: ['heels', 'beige'], hat: 'none', neck: ['necklace', 'gold'] } },
  { id: 'rocker', icon: '🎸', vi: 'Cá tính', en: 'rock style', wear: { top: ['leather_jacket', 'black'], bottom: ['ripped_jeans', 'denim'], shoes: ['boots', 'black'], glasses: ['sunglasses', 'black'], hat: 'none' } },
  { id: 'ranger', icon: '🏹', vi: 'Hoá trang: Thợ săn', en: 'ranger costume', wear: { costume: ['ranger', 'green'] } },
  { id: 'peasant', icon: '🌾', vi: 'Hoá trang: Làng quê', en: 'village costume', wear: { costume: ['peasant', 'brown'] } },
];

// từ vựng thời trang mới
if (window.WORD_CATS && WORD_CATS.clothes) WORD_CATS.clothes.words.push(
  ['striped', '/straɪpt/', 'kẻ sọc', 'I like your striped T-shirt.'],
  ['polka dots', '/ˈpoʊlkə dɑːts/', 'chấm bi', 'Her dress has white polka dots.'],
  ['floral', '/ˈflɔːrəl/', 'có hoa văn hoa', 'A floral dress is perfect for summer.'],
  ['plaid', '/plæd/', 'ca-rô (kẻ ô)', 'He is wearing a plaid shirt.'],
  ['crop top', '/ˈkrɑːp tɑːp/', 'áo croptop', 'She wore a crop top and jeans.'],
  ['turtleneck', '/ˈtɜːrtlnek/', 'áo cổ lọ', 'A turtleneck keeps your neck warm.'],
  ['cardigan', '/ˈkɑːrdɪɡən/', 'áo khoác len', 'Put on a cardigan, it is chilly.'],
  ['blazer', '/ˈbleɪzər/', 'áo vest', 'Wear a blazer to the meeting.'],
  ['denim', '/ˈdenɪm/', 'vải jean', 'Denim never goes out of style.'],
  ['leather', '/ˈleðər/', 'da (thuộc)', 'This leather jacket is expensive.'],
  ['velvet', '/ˈvelvɪt/', 'vải nhung', 'The velvet dress feels soft.'],
  ['pleated skirt', '/ˈpliːtɪd skɜːrt/', 'chân váy xếp ly', 'School uniforms often have a pleated skirt.'],
  ['ripped jeans', '/rɪpt dʒiːnz/', 'quần jean rách', 'Ripped jeans are very trendy.'],
  ['high heels', '/ˌhaɪ ˈhiːlz/', 'giày cao gót', 'Walking in high heels is not easy.'],
  ['loafers', '/ˈloʊfərz/', 'giày lười', 'Loafers look smart with trousers.'],
  ['tie', '/taɪ/', 'cà vạt', 'He wears a tie to the office.'],
  ['scarf', '/skɑːrf/', 'khăn choàng', 'Wrap a scarf around your neck.'],
  ['necklace', '/ˈnekləs/', 'vòng cổ', 'That gold necklace is beautiful.'],
  ['handbag', '/ˈhændbæɡ/', 'túi xách', 'She keeps her phone in her handbag.'],
  ['outfit', '/ˈaʊtfɪt/', 'bộ trang phục', 'What a stylish outfit!'],
  ['stylish', '/ˈstaɪlɪʃ/', 'sành điệu', 'You look very stylish today.'],
  ['costume', '/ˈkɑːstuːm/', 'trang phục hoá trang', 'I wore a ranger costume to the festival.'],
);
