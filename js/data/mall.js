// ============================================================
// TRUNG TÂM THƯƠNG MẠI — mua quần áo bằng tiếng Anh, mặc lên nhân vật.
// Thêm món mới: thêm 1 dòng vào CLOTHES.
//   slot  : top | bottom | shoes | hat | glasses | bag
//   type  : kiểu vẽ trên nhân vật (top: tee polo shirt hoodie jacket dress ·
//           bottom: pants shorts skirt · shoes: shoe boot sandal ·
//           hat: cap sun beanie · glasses: sun clear · bag: backpack)
//   plural: danh từ số nhiều (jeans, shoes...) → “a pair of …”, “them”
//   size  : 'clothes' (S/M/L/XL) · 'shoes' (37–43) · bỏ trống = không cần size
// ============================================================
window.CLOTH_COLORS = {
  black: { en: 'black', vi: 'đen', hex: '#212121' },
  white: { en: 'white', vi: 'trắng', hex: '#f5f5f5' },
  gray: { en: 'gray', vi: 'xám', hex: '#9e9e9e' },
  red: { en: 'red', vi: 'đỏ', hex: '#e53935' },
  pink: { en: 'pink', vi: 'hồng', hex: '#f48fb1' },
  orange: { en: 'orange', vi: 'cam', hex: '#fb8c00' },
  yellow: { en: 'yellow', vi: 'vàng', hex: '#fdd835' },
  green: { en: 'green', vi: 'xanh lá', hex: '#43a047' },
  blue: { en: 'blue', vi: 'xanh dương', hex: '#1e88e5' },
  navy: { en: 'navy blue', vi: 'xanh navy', hex: '#283593' },
  purple: { en: 'purple', vi: 'tím', hex: '#8e24aa' },
  brown: { en: 'brown', vi: 'nâu', hex: '#6d4c41' },
  beige: { en: 'beige', vi: 'màu be', hex: '#d7ccc8' },
};

window.CLOTHES = [
  // Thời trang
  { id: 'tee', slot: 'top', type: 'tee', en: 'T-shirt', vi: 'Áo thun', price: 60, size: 'clothes', colors: ['white', 'black', 'red', 'yellow', 'green', 'blue', 'pink', 'gray'] },
  { id: 'polo', slot: 'top', type: 'polo', en: 'polo shirt', vi: 'Áo polo', price: 90, size: 'clothes', colors: ['white', 'navy', 'green', 'red', 'black'] },
  { id: 'shirt', slot: 'top', type: 'shirt', en: 'shirt', vi: 'Áo sơ mi', price: 110, size: 'clothes', colors: ['white', 'blue', 'pink', 'beige', 'black'] },
  { id: 'hoodie', slot: 'top', type: 'hoodie', en: 'hoodie', vi: 'Áo hoodie', price: 150, size: 'clothes', colors: ['gray', 'black', 'purple', 'pink', 'orange'] },
  { id: 'jacket', slot: 'top', type: 'jacket', en: 'jacket', vi: 'Áo khoác', price: 180, size: 'clothes', colors: ['black', 'navy', 'brown', 'green', 'red'] },
  { id: 'dress', slot: 'top', type: 'dress', en: 'dress', vi: 'Váy liền', price: 170, size: 'clothes', colors: ['red', 'pink', 'yellow', 'white', 'navy', 'purple'] },
  { id: 'jeans', slot: 'bottom', type: 'pants', en: 'jeans', vi: 'Quần jean', price: 140, size: 'clothes', plural: true, colors: ['blue', 'navy', 'black', 'gray'] },
  { id: 'trousers', slot: 'bottom', type: 'pants', en: 'trousers', vi: 'Quần tây', price: 130, size: 'clothes', plural: true, colors: ['black', 'navy', 'gray', 'beige', 'brown'] },
  { id: 'shorts', slot: 'bottom', type: 'shorts', en: 'shorts', vi: 'Quần short', price: 80, size: 'clothes', plural: true, colors: ['beige', 'navy', 'black', 'green', 'gray'] },
  { id: 'skirt', slot: 'bottom', type: 'skirt', en: 'skirt', vi: 'Chân váy', price: 100, size: 'clothes', colors: ['black', 'pink', 'navy', 'beige', 'red'] },
  // Giày dép
  { id: 'sneakers', slot: 'shoes', type: 'shoe', en: 'sneakers', vi: 'Giày thể thao', price: 160, size: 'shoes', plural: true, colors: ['white', 'black', 'red', 'blue', 'gray'] },
  { id: 'sandals', slot: 'shoes', type: 'sandal', en: 'sandals', vi: 'Dép quai hậu', price: 70, size: 'shoes', plural: true, colors: ['brown', 'black', 'beige'] },
  { id: 'boots', slot: 'shoes', type: 'boot', en: 'boots', vi: 'Giày bốt', price: 200, size: 'shoes', plural: true, colors: ['brown', 'black'] },
  // Phụ kiện
  { id: 'cap', slot: 'hat', type: 'cap', en: 'cap', vi: 'Mũ lưỡi trai', price: 60, colors: ['black', 'white', 'red', 'blue', 'green', 'pink'] },
  { id: 'sunhat', slot: 'hat', type: 'sun', en: 'sun hat', vi: 'Mũ rộng vành', price: 90, colors: ['beige', 'white', 'pink', 'yellow'] },
  { id: 'beanie', slot: 'hat', type: 'beanie', en: 'beanie', vi: 'Mũ len', price: 70, colors: ['gray', 'red', 'navy', 'yellow', 'black'] },
  { id: 'sunglasses', slot: 'glasses', type: 'sun', en: 'sunglasses', vi: 'Kính râm', price: 120, plural: true, colors: ['black'] },
  { id: 'glasses', slot: 'glasses', type: 'clear', en: 'glasses', vi: 'Kính gọng', price: 100, plural: true, colors: ['black'] },
  { id: 'backpack', slot: 'bag', type: 'backpack', en: 'backpack', vi: 'Ba lô', price: 150, colors: ['black', 'navy', 'red', 'pink', 'green', 'yellow'] },
];

window.CLOTH_SIZES = {
  clothes: [{ id: 'S', en: 'small' }, { id: 'M', en: 'medium' }, { id: 'L', en: 'large' }, { id: 'XL', en: 'extra large' }],
  shoes: ['37', '38', '39', '40', '41', '42', '43'].map((n) => ({ id: n, en: 'size ' + n })),
};
window.MALL_FLOORS = [
  { id: 'fashion', icon: '👕', name: 'Thời trang', slots: ['top', 'bottom'] },
  { id: 'shoes', icon: '👟', name: 'Giày dép', slots: ['shoes'] },
  { id: 'acc', icon: '🧢', name: 'Phụ kiện', slots: ['hat', 'glasses', 'bag'] },
];

// Nhóm từ vựng "Quần áo & mua sắm" (học khi mua đồ, và rơi ở Khu Mua Sắm)
WORD_CATS.clothes = { name: 'Quần áo & mua sắm', icon: '🛍️', words: [
  ['T-shirt', '/ˈtiː ʃɜːrt/', 'áo thun', 'This T-shirt is very comfortable.'],
  ['polo shirt', '/ˈpoʊloʊ ʃɜːrt/', 'áo polo', 'He wears a polo shirt to work.'],
  ['shirt', '/ʃɜːrt/', 'áo sơ mi', 'Please iron my white shirt.'],
  ['hoodie', '/ˈhʊdi/', 'áo hoodie', 'I wear a hoodie when it is cold.'],
  ['jacket', '/ˈdʒækɪt/', 'áo khoác', 'Take a jacket, it’s windy outside.'],
  ['dress', '/dres/', 'váy liền', 'She bought a red dress for the party.'],
  ['jeans', '/dʒiːnz/', 'quần jean', 'These jeans are too long for me.'],
  ['trousers', '/ˈtraʊzərz/', 'quần tây', 'He needs black trousers for the interview.'],
  ['shorts', '/ʃɔːrts/', 'quần short', 'I wear shorts at the beach.'],
  ['skirt', '/skɜːrt/', 'chân váy', 'This skirt matches your shirt.'],
  ['sneakers', '/ˈsniːkərz/', 'giày thể thao', 'My new sneakers are white.'],
  ['sandals', '/ˈsændlz/', 'dép quai hậu', 'Sandals are great in summer.'],
  ['boots', '/buːts/', 'giày bốt', 'Wear boots when it rains.'],
  ['cap', '/kæp/', 'mũ lưỡi trai', 'Technicians wear a red cap.'],
  ['sun hat', '/ˈsʌn hæt/', 'mũ rộng vành', 'Bring a sun hat to the beach.'],
  ['beanie', '/ˈbiːni/', 'mũ len', 'A beanie keeps your head warm.'],
  ['sunglasses', '/ˈsʌnɡlæsɪz/', 'kính râm', 'Don’t forget your sunglasses.'],
  ['glasses', '/ˈɡlæsɪz/', 'kính mắt', 'I need glasses to read.'],
  ['backpack', '/ˈbækpæk/', 'ba lô', 'My backpack is full of tools.'],
  ['fitting room', '/ˈfɪtɪŋ ruːm/', 'phòng thử đồ', 'Where is the fitting room?'],
  ['try on', '/traɪ ɑːn/', 'mặc thử', 'Can I try this on?'],
  ['tight', '/taɪt/', 'chật', 'These shoes are a bit tight.'],
  ['loose', '/luːs/', 'rộng, lỏng', 'This shirt is too loose.'],
  ['receipt', '/rɪˈsiːt/', 'biên lai, hoá đơn', 'Keep the receipt in case you need to return it.'],
  ['discount', '/ˈdɪskaʊnt/', 'giảm giá', 'Is there a discount today?'],
  ['cashier', '/kæˈʃɪr/', 'thu ngân', 'Please pay at the cashier.'],
  ['on sale', '/ɑːn seɪl/', 'đang giảm giá', 'These jackets are on sale.'],
]};
