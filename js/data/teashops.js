// ============================================================
// QUÁN TRÀ SỮA — order bằng GIỌNG NÓI tiếng Anh, nhân viên rất khó tính.
// Thực đơn dựa trên thông tin công khai (blog, trang mall, trang thương hiệu)
// tháng 10/2026; giá chỉ mang tính tham khảo và có thể đã thay đổi.
//   price : giá tham khảo (nghìn đồng) theo từng size
//   keys  : các nhóm từ khoá máy cần nghe thấy (mỗi nhóm cần ít nhất 1 từ)
//   not   : từ khoá KHÔNG được có (để phân biệt các món gần giống nhau)
// Giá trong game = giá tham khảo / 2 (xu).
// ============================================================
window.TEA_SHOPS = {
  koi: {
    name: 'KOI Thé', icon: '🧋', staff: 'Barista KOI', look: 6,
    about: 'Thương hiệu trà Đài Loan. Món nổi tiếng: Trà sữa trân châu hoàng kim (hồng trà Assam, kem sữa, trân châu hoàng kim dai) và dòng Macchiato (lớp kem mặn béo trên nền trà đậm).',
    greet: 'Hi, welcome to KOI Thé! What can I get for you today?',
    sizes: [
      { id: 'S', en: 'small', vi: 'Nhỏ (S)', keys: ['small', 'size s'] },
      { id: 'M', en: 'medium', vi: 'Vừa (M)', keys: ['medium', 'size m'] },
      { id: 'L', en: 'large', vi: 'Lớn (L)', keys: ['large', 'size l', 'big'] },
    ],
    drinks: [
      { id: 'golden', en: 'Golden Bubble Milk Tea', vi: 'Trà sữa trân châu hoàng kim', price: [53, 74, 92],
        keys: [['golden'], ['bubble', 'bubbles', 'pearl', 'pearls', 'boba'], ['milk tea', 'milktea']] },
      { id: 'btm', en: 'Black Tea Macchiato', vi: 'Hồng trà Macchiato', price: [50, 69, 85],
        keys: [['black tea'], ['macchiato', 'machiato', 'makiato']], not: ['hazelnut'] },
      { id: 'gtm', en: 'Green Tea Macchiato', vi: 'Lục trà Macchiato', price: [50, 69, 85],
        keys: [['green tea'], ['macchiato', 'machiato', 'makiato']] },
      { id: 'hzm', en: 'Hazelnut Black Tea Macchiato', vi: 'Hồng trà Hazelnut Macchiato', price: [55, 76, 95],
        keys: [['hazelnut'], ['macchiato', 'machiato', 'makiato']] },
      { id: 'milo', en: 'Milo Macchiato', vi: 'Milo O Macchiato', price: [57, 79, 99],
        keys: [['milo', 'mylo', 'my low', 'milo o'], ['macchiato', 'machiato', 'makiato']] },
    ],
    toppings: [
      { id: 'none', en: '', vi: 'Không thêm' },
      { id: 'gb', en: 'golden bubbles', vi: 'Thêm trân châu hoàng kim', coins: 5, keys: [['golden'], ['bubble', 'bubbles', 'pearl', 'pearls']], noFor: ['golden'] },
    ],
  },
  phela: {
    name: 'Phê La', icon: '🍵', staff: 'Barista Phê La', look: 3,
    about: 'Thương hiệu Việt Nam về trà Ô Long đặc sản trồng ở nông trường B’Lao (Bảo Lộc, Lâm Đồng). Size gọi là “Phê” (vừa) và “La” (lớn). Topping đặc trưng: trân châu ô long.',
    greet: 'Hello, welcome to Phê La! What would you like to drink?',
    sizes: [
      { id: 'Phe', en: 'regular', vi: 'Size Phê (vừa)', keys: ['regular', 'standard', 'size phe', 'phe size', 'size fe', 'size pay', 'size fay', 'medium'] },
      { id: 'La', en: 'large', vi: 'Size La (lớn)', keys: ['large', 'size la', 'la size', 'big'] },
    ],
    drinks: [
      { id: 'olsp', en: 'Phe La Oolong Milk Tea', vi: 'Ô Long Sữa Phê La', price: [54, 69],
        keys: [['oolong', 'oo long', 'olong', 'u long'], ['milk tea', 'milktea']], not: ['jasmine', 'smoky', 'smoke', 'smoked', 'rice'] },
      { id: 'nhai', en: 'Jasmine Oolong Milk Tea', vi: 'Ô Long Nhài Sữa', price: [54, 69],
        keys: [['jasmine'], ['milk tea', 'milktea']] },
      { id: 'khoi', en: "Khoi B'Lao (smoky oolong milk tea)", vi: 'Khói B’Lao', price: [54, 69],
        keys: [['smoky', 'smoke', 'smoked', 'khoi', 'b lao', 'blao']] },
      { id: 'gaorang', en: 'Roasted Rice Oolong Milk Tea', vi: 'Ô Long Sữa Gạo Rang (gạo ST25)', price: [54, 69],
        keys: [['roasted rice', 'rice'], ['milk tea', 'milktea', 'oolong']] },
      { id: 'langbiang', en: 'Lang Biang (cold brew nitro oolong)', vi: 'Lang Biang (trà ủ lạnh sục nitơ)', price: [54, 69],
        keys: [['lang biang', 'langbiang', 'lang bian', 'long biang', 'cold brew']] },
    ],
    toppings: [
      { id: 'none', en: '', vi: 'Không thêm' },
      { id: 'op', en: 'oolong pearls', vi: 'Thêm trân châu ô long', coins: 5, keys: [['pearl', 'pearls', 'bubble', 'bubbles', 'boba']] },
    ],
  },
};

// Độ ngọt & đá (dùng chung)
window.TEA_SUGAR = [
  { id: 0, en: 'no sugar', vi: 'Không đường (0%)', keys: ['no sugar', 'zero sugar', 'sugar free', '0 percent sugar', '0 percent'] },
  { id: 30, en: '30% sugar', vi: '30% đường', keys: ['30 percent'] },
  { id: 50, en: '50% sugar', vi: '50% đường', keys: ['50 percent', 'half sugar'] },
  { id: 70, en: '70% sugar', vi: '70% đường', keys: ['70 percent'] },
  { id: 100, en: 'normal sugar', vi: 'Ngọt bình thường (100%)', keys: ['100 percent', 'normal sugar', 'regular sugar', 'full sugar'] },
];
window.TEA_ICE = [
  { id: 'no', en: 'no ice', vi: 'Không đá', keys: ['no ice', 'without ice'] },
  { id: 'less', en: 'less ice', vi: 'Ít đá', keys: ['less ice', 'little ice', 'light ice'] },
  { id: 'normal', en: 'normal ice', vi: 'Đá bình thường', keys: ['normal ice', 'regular ice', 'full ice'] },
];

// Câu nhân viên nói khi không hiểu — càng lúc càng gắt
window.TEA_STERN = [
  'Sorry, I didn’t get that. Tell me the drink, the size, the sugar level and the ice — and say please.',
  'Look, there’s a long line behind you. I can’t take an order like that. Next customer, please!',
];

// Bài học order (luyện từng cụm rồi thi)
window.TEA_LESSON = [
  { en: 'Can I get a large Golden Bubble Milk Tea, please?', vi: 'Cho tôi một ly trà sữa trân châu hoàng kim size lớn nhé.', tip: 'Mẫu câu gọi món: Can I get a + [size] + [tên món] + please?' },
  { en: 'Fifty percent sugar, less ice, please.', vi: '50% đường, ít đá nhé.', tip: 'Độ ngọt: no sugar / 30% / 50% / 70% / normal sugar. Đá: no ice / less ice / normal ice.' },
  { en: 'With oolong pearls, please.', vi: 'Thêm trân châu ô long nhé.', tip: 'Thêm topping: with + [topping].' },
  { en: 'A regular Jasmine Oolong Milk Tea, no sugar, no ice, please.', vi: 'Một ly Ô Long Nhài Sữa size Phê (vừa), không đường, không đá.', tip: 'Ở Phê La, size vừa là “Phê”, size lớn là “La” — khi nói tiếng Anh có thể dùng regular / large.' },
  { en: 'To go, please.', vi: 'Mang đi nhé.', tip: 'For here = uống tại quán · To go = mang đi.' },
  { en: 'My name is {name}.', vi: 'Tên tôi là {name}.', tip: 'Nhân viên sẽ hỏi tên để gọi khi đồ uống xong.' },
];
