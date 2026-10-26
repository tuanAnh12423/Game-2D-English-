// ============================================================
// THÚ CƯNG · CHĂN NUÔI · NẤU ĂN — mở khoá dần theo cốt truyện.
// Thêm con vật / món ăn mới: chép một dòng và đổi id (không trùng).
// ============================================================

// Tiệm thú cưng — phải hỏi mua bằng tiếng Anh. level: cấp tối thiểu.
window.PET_SHOP = [
  { id: 'hamster', en: 'hamster', vi: 'Chuột hamster', price: 60, level: 1, age: 'two months', eat: 'seeds and fresh vegetables', eatVi: 'hạt và rau tươi' },
  { id: 'chick', en: 'chick', vi: 'Gà con', price: 50, level: 1, age: 'three weeks', eat: 'grains and small seeds', eatVi: 'ngũ cốc và hạt nhỏ' },
  { id: 'bunny', en: 'bunny', vi: 'Thỏ con', price: 100, level: 1, age: 'two months', eat: 'hay, carrots and leafy greens', eatVi: 'cỏ khô, cà rốt và rau lá xanh' },
  { id: 'cat', en: 'kitten', vi: 'Mèo con', price: 120, level: 2, age: 'three months', eat: 'kitten food and fresh water', eatVi: 'thức ăn cho mèo con và nước sạch' },
  { id: 'dog', en: 'puppy', vi: 'Cún con', price: 120, level: 2, age: 'four months', eat: 'puppy food, and it needs a walk every day', eatVi: 'thức ăn cho cún con, và cần đi dạo mỗi ngày' },
  { id: 'penguin', en: 'baby penguin', vi: 'Chim cánh cụt con', price: 350, level: 4, age: 'five months', eat: 'fish, and it loves cold water', eatVi: 'cá, và rất thích nước lạnh' },
  { id: 'fox', en: 'fox cub', vi: 'Cáo con', price: 400, level: 5, age: 'six months', eat: 'meat, fruit and berries', eatVi: 'thịt, trái cây và quả mọng' },
  { id: 'panda', en: 'baby panda', vi: 'Gấu trúc con', price: 600, level: 6, age: 'one year', eat: 'lots and lots of bamboo', eatVi: 'thật nhiều, thật nhiều tre' },
];

// Vật nuôi ở Trại Chăn Nuôi. cycle: số giờ (đã cho ăn) để ra 1 lượt sản phẩm.
// feedH: một lần cho ăn no bao nhiêu giờ (24 = cho ăn 1 lần/ngày là đủ).
// Sản phẩm tích lại tối đa RANCH_STORE lượt, nên ghé sáng & tối vẫn không phí.
window.ANIMALS = [
  { id: 'chicken', en: 'hen', plural: 'hens', vi: 'Gà mái', emoji: '🐔', price: 60, level: 1, product: 'egg', cycle: 3, feedH: 24, sound: 'Cluck cluck!', eats: 'grains and corn', eatsVi: 'ngũ cốc và bắp' },
  { id: 'duck', en: 'duck', plural: 'ducks', vi: 'Vịt', emoji: '🦆', price: 80, level: 1, product: 'duck_egg', cycle: 4, feedH: 24, sound: 'Quack quack!', eats: 'grains and small fish', eatsVi: 'ngũ cốc và cá nhỏ' },
  { id: 'pig', en: 'pig', plural: 'pigs', vi: 'Heo', emoji: '🐷', price: 150, level: 2, product: 'truffle', cycle: 8, feedH: 24, sound: 'Oink oink!', eats: 'vegetables, fruit and grains', eatsVi: 'rau, trái cây và ngũ cốc' },
  { id: 'sheep', en: 'sheep', plural: 'sheep', vi: 'Cừu', emoji: '🐑', price: 180, level: 3, product: 'wool', cycle: 12, feedH: 24, sound: 'Baa baa!', eats: 'grass and hay', eatsVi: 'cỏ và cỏ khô' },
  { id: 'cow', en: 'cow', plural: 'cows', vi: 'Bò sữa', emoji: '🐮', price: 250, level: 3, product: 'milk', cycle: 6, feedH: 24, sound: 'Moo!', eats: 'grass, hay and corn', eatsVi: 'cỏ, cỏ khô và bắp' },
];
window.RANCH_MAX = 8;
window.RANCH_STORE = 3;

// Vật phẩm mới: sản phẩm chăn nuôi, thức ăn gia súc, món ăn
window.RANCH_ITEMS = [
  { id: 'feed', kind: 'feed', emoji: '🌾', en: 'Animal feed', vi: 'Thức ăn gia súc', price: 4, desc: 'Cho vật nuôi ăn ở Trại Chăn Nuôi. Một lần cho ăn giúp con vật no 24 giờ thời gian thực.' },
  { id: 'egg', kind: 'product', emoji: '🥚', en: 'egg', vi: 'Trứng gà', price: 12, desc: 'Gà mái đẻ khi được cho ăn đầy đủ. Dùng để nấu ăn hoặc bán.' },
  { id: 'duck_egg', kind: 'product', emoji: '🪺', en: 'duck egg', vi: 'Trứng vịt', price: 16, desc: 'Trứng vịt to hơn trứng gà. Dùng để luộc hoặc bán.' },
  { id: 'milk', kind: 'product', emoji: '🥛', en: 'milk', vi: 'Sữa bò', price: 25, desc: 'Vắt từ bò sữa. Dùng làm súp, sinh tố, bánh.' },
  { id: 'wool', kind: 'product', emoji: '🧶', en: 'wool', vi: 'Lông cừu', price: 60, desc: 'Xén từ cừu. Bán được giá tốt.' },
  { id: 'truffle', kind: 'product', emoji: '🍄', en: 'truffle', vi: 'Nấm truffle', price: 90, desc: 'Heo có mũi rất thính, ủi đất tìm ra loại nấm quý này!' },
];

// Món ăn. ing: nguyên liệu (id vật phẩm; crop_ là nông sản). steps: các bước ĐÚNG THỨ TỰ.
window.DISHES = [
  { id: 'dish_friedegg', emoji: '🍳', en: 'fried egg', vi: 'Trứng ốp la', ing: { egg: 1 }, sell: 30, xp: 10,
    steps: [['Heat a pan over medium heat.', 'Làm nóng chảo ở lửa vừa.', 'heat'], ['Add a little oil.', 'Cho một ít dầu ăn.', 'add'], ['Crack the egg into the pan.', 'Đập trứng vào chảo.', 'crack'], ['Fry it for two minutes.', 'Chiên trong hai phút.', 'fry'], ['Sprinkle some salt and serve.', 'Rắc chút muối rồi dọn ra.', 'sprinkle']] },
  { id: 'dish_boiled', emoji: '🥚', en: 'boiled duck eggs', vi: 'Trứng vịt luộc', ing: { duck_egg: 2 }, sell: 45, xp: 12,
    steps: [['Fill a pot with water.', 'Đổ nước vào nồi.', 'fill'], ['Bring the water to a boil.', 'Đun sôi nước.', 'boil'], ['Gently put the eggs in.', 'Nhẹ nhàng thả trứng vào.', 'put in'], ['Boil them for ten minutes.', 'Luộc trong mười phút.', 'boil'], ['Cool the eggs in cold water and peel them.', 'Ngâm trứng vào nước lạnh rồi bóc vỏ.', 'peel']] },
  { id: 'dish_salad', emoji: '🥗', en: 'garden salad', vi: 'Salad rau vườn', ing: { crop_lettuce: 1, crop_tomato: 1, crop_cucumber: 1 }, sell: 110, xp: 15,
    steps: [['Wash all the vegetables.', 'Rửa sạch tất cả rau củ.', 'wash'], ['Chop the lettuce.', 'Cắt nhỏ xà lách.', 'chop'], ['Slice the tomato and the cucumber.', 'Thái lát cà chua và dưa leo.', 'slice'], ['Put everything in a bowl.', 'Cho tất cả vào tô.', 'put'], ['Add the dressing and toss well.', 'Thêm nước sốt và trộn đều.', 'toss']] },
  { id: 'dish_omelette', emoji: '🥘', en: 'tomato omelette', vi: 'Trứng chiên cà chua', ing: { egg: 2, crop_tomato: 1 }, sell: 75, xp: 15,
    steps: [['Wash and dice the tomato.', 'Rửa và thái hạt lựu cà chua.', 'dice'], ['Crack the eggs into a bowl.', 'Đập trứng vào tô.', 'crack'], ['Beat the eggs with a fork.', 'Đánh trứng bằng nĩa.', 'beat'], ['Fry the tomato in a hot pan.', 'Xào cà chua trong chảo nóng.', 'fry'], ['Pour the eggs over the tomato.', 'Đổ trứng lên cà chua.', 'pour'], ['Fold the omelette and serve.', 'Gấp đôi trứng rồi dọn ra.', 'fold']] },
  { id: 'dish_shake', emoji: '🥤', en: 'strawberry milkshake', vi: 'Sinh tố dâu sữa', ing: { crop_strawberry: 2, milk: 1 }, sell: 230, xp: 20,
    steps: [['Wash the strawberries.', 'Rửa dâu tây.', 'wash'], ['Cut off the green tops.', 'Cắt bỏ cuống xanh.', 'cut off'], ['Put the strawberries and milk in a blender.', 'Cho dâu và sữa vào máy xay.', 'put'], ['Blend until smooth.', 'Xay cho đến khi mịn.', 'blend'], ['Pour it into a glass.', 'Rót ra ly.', 'pour']] },
  { id: 'dish_soup', emoji: '🍲', en: 'pumpkin soup', vi: 'Súp bí đỏ', ing: { crop_pumpkin: 1, milk: 1 }, sell: 190, xp: 22,
    steps: [['Peel the pumpkin.', 'Gọt vỏ bí.', 'peel'], ['Cut it into small pieces.', 'Cắt thành miếng nhỏ.', 'cut'], ['Boil the pumpkin until it is soft.', 'Luộc bí đến khi mềm.', 'boil'], ['Blend the pumpkin.', 'Xay nhuyễn bí.', 'blend'], ['Stir in the milk.', 'Khuấy đều với sữa.', 'stir'], ['Season with salt and pepper.', 'Nêm muối và tiêu.', 'season']] },
  { id: 'dish_cake', emoji: '🍰', en: 'carrot cake', vi: 'Bánh cà rốt', ing: { crop_carrot: 2, egg: 2, milk: 1 }, sell: 150, xp: 25,
    steps: [['Preheat the oven.', 'Làm nóng lò nướng trước.', 'preheat'], ['Grate the carrots.', 'Bào nhỏ cà rốt.', 'grate'], ['Mix the eggs, milk and flour.', 'Trộn trứng, sữa và bột mì.', 'mix'], ['Add the carrots to the batter.', 'Cho cà rốt vào bột.', 'add'], ['Pour the batter into a cake pan.', 'Đổ bột vào khuôn.', 'pour'], ['Bake for thirty minutes.', 'Nướng trong ba mươi phút.', 'bake']] },
  { id: 'dish_truffle', emoji: '🍝', en: 'truffle omelette', vi: 'Trứng chiên nấm truffle', ing: { truffle: 1, egg: 2 }, sell: 260, xp: 30,
    steps: [['Clean the truffle with a soft brush.', 'Làm sạch nấm bằng cọ mềm.', 'clean'], ['Beat the eggs in a bowl.', 'Đánh trứng trong tô.', 'beat'], ['Melt some butter in a pan.', 'Đun chảy bơ trong chảo.', 'melt'], ['Pour in the eggs.', 'Đổ trứng vào.', 'pour'], ['Shave the truffle on top.', 'Bào mỏng nấm lên trên.', 'shave'], ['Serve it warm.', 'Dọn ra khi còn ấm.', 'serve']] },
];

// Hướng dẫn bằng tiếng Anh (có đọc to) cho từng tính năng mới
window.TUTORIALS = {
  ranch: { title: 'Welcome to the Ranch!', lines: [
    ['This is your ranch. You can raise hens, ducks, pigs, sheep and cows here.', 'Đây là trại chăn nuôi của bạn. Bạn có thể nuôi gà, vịt, heo, cừu và bò.'],
    ['First, buy an animal from the rancher. You must ask in English!', 'Trước tiên, mua một con vật từ chủ trại. Bạn phải hỏi bằng tiếng Anh!'],
    ['Feed your animals with animal feed or vegetables. A full animal is a happy animal.', 'Cho vật nuôi ăn bằng thức ăn gia súc hoặc rau củ. Con vật no là con vật vui.'],
    ['When an animal is fed, it makes a product: eggs, milk, wool or truffles.', 'Khi được cho ăn, con vật làm ra sản phẩm: trứng, sữa, lông cừu hoặc nấm truffle.'],
    ['Collect the products and sell them, or use them to cook delicious food.', 'Thu sản phẩm để bán, hoặc dùng để nấu món ăn ngon.'],
    ['Feed them once a day. Products keep piling up (up to three) even when the game is closed.', 'Cho ăn mỗi ngày một lần. Sản phẩm vẫn tích lại (tối đa 3 lượt) kể cả khi tắt game.'],
  ] },
  cook: { title: 'Let’s Cook!', lines: [
    ['Your home has a kitchen now. Open your home and tap “Kitchen”.', 'Nhà bạn đã có bếp. Vào nhà và bấm “Bếp”.'],
    ['Choose a recipe. You need all the ingredients in your bag.', 'Chọn một công thức. Bạn cần đủ nguyên liệu trong balo.'],
    ['Read the steps in English and put them in the right order.', 'Đọc các bước bằng tiếng Anh và sắp xếp đúng thứ tự.'],
    ['Learn cooking verbs: chop, slice, boil, fry, stir, crack, peel and bake.', 'Học động từ nấu ăn: chop (cắt nhỏ), slice (thái lát), boil (luộc), fry (chiên), stir (khuấy), crack (đập), peel (gọt), bake (nướng).'],
    ['Eat a dish to walk faster, or sell it at the Farm Shop for good money.', 'Ăn món để đi nhanh hơn, hoặc bán ở Tiệm Nông Sản được nhiều tiền.'],
  ] },
  pets: { title: 'Adopt a Pet!', lines: [
    ['Mochi Pet Shop is in the Shopping District.', 'Tiệm Thú Cưng Mochi ở Khu Mua Sắm.'],
    ['Pets are not free. You need coins, and you must ask for a pet in English.', 'Thú cưng không miễn phí. Bạn cần xu và phải hỏi mua bằng tiếng Anh.'],
    ['Say something like: “Could I adopt this puppy, please?”', 'Hãy nói kiểu: “Could I adopt this puppy, please?”'],
    ['Your pet will follow you everywhere, and your friends can see it online.', 'Thú cưng đi theo bạn mọi nơi, bạn bè online cũng nhìn thấy.'],
    ['Give your pet a treat and a hug every day to make it happy.', 'Cho thú cưng ăn vặt và ôm nó mỗi ngày để nó vui.'],
  ] },
};

// Hội thoại mua bán (thay {thing} = tên con vật, {price} = giá, {age}, {eat})
window.BUY_TALK = {
  pets: [
    { npc: '{greet}! Welcome to Mochi Pet Shop. How can I help you?', vi: '{greet}! Chào mừng đến Tiệm Thú Cưng Mochi. Tôi giúp gì được cho bạn?',
      o: [['Hi! I’m looking for a {thing}. Do you have any?', 2, '“I’m looking for…” — cách nói lịch sự khi tìm mua một thứ.'], ['{Thing}. Give me.', 1, 'Cộc lốc, thiếu lời chào.'], ['I want buy animal cheap now.', 0, 'Sai ngữ pháp (want TO buy) và thiếu lịch sự.']] },
    { npc: 'Yes, we do! This little {thing} is {age} old. Would you like to hold it?', vi: 'Có chứ! Bé {thing} này được {age}. Bạn có muốn bế thử không?',
      o: [['Yes, please! Oh, it’s so cute!', 2, 'Nhận lời bằng “Yes, please” và khen — rất tự nhiên.'], ['OK.', 1, 'Đúng nhưng quá ngắn.'], ['No. Don’t touch me.', 0, 'Thô lỗ với nhân viên.']] },
    { npc: 'It eats {eat}. Do you have any questions?', vi: 'Bé ăn {eat_vi}. Bạn có câu hỏi gì không?',
      o: [['How often should I feed it?', 2, '“How often…?” — hỏi tần suất, câu hỏi rất hữu ích.'], ['Food how many?', 1, 'Người nghe phải đoán ý.'], ['I don’t need to feed it.', 0, 'Nuôi thú cưng phải cho ăn!']] },
    { npc: 'Twice a day, with fresh water. It costs {price} coins. Can you take good care of it?', vi: 'Hai lần một ngày, kèm nước sạch. Giá {price} xu. Bạn chăm sóc bé tốt được chứ?',
      o: [['Of course. I promise I’ll take good care of it.', 2, '“I promise I’ll…” — hứa hẹn, tạo niềm tin.'], ['Maybe.', 1, 'Chưa đủ thuyết phục để nhân viên giao thú cưng.'], ['I’ll leave it outside all day.', 0, 'Nhân viên sẽ không bán cho bạn!']] },
  ],
  ranch: [
    { npc: '{greet}! I’m the rancher. Are you here to buy some animals?', vi: '{greet}! Tôi là chủ trại. Bạn đến mua vật nuôi à?',
      o: [['Yes! I’d like to start a small farm. Do you have any {things}?', 2, '“I’d like to…” — nói mong muốn một cách lịch sự.'], ['{Things}. Sell me.', 1, 'Cộc lốc.'], ['Give me free animals.', 0, 'Không ai cho không cả!']] },
    { npc: 'Sure! {Things} eat {eat}. Do you know how to look after them?', vi: 'Có chứ! {Things} ăn {eat_vi}. Bạn biết cách chăm chúng không?',
      o: [['Not really. Could you give me some tips?', 2, 'Thừa nhận chưa biết và xin lời khuyên — rất lịch sự.'], ['No.', 1, 'Quá ngắn, cuộc trò chuyện bị dừng.'], ['I know everything already.', 0, 'Kiêu ngạo.']] },
    { npc: 'Feed them every day and keep their home clean. Then they will give you {product}. The price is {price} coins.', vi: 'Cho ăn mỗi ngày và giữ chuồng sạch. Chúng sẽ cho bạn {product_vi}. Giá {price} xu.',
      o: [['That sounds fair. Thank you for the advice!', 2, 'Đồng ý giá và cảm ơn lời khuyên.'], ['Expensive.', 1, 'Chê đắt cộc lốc, không mặc cả lịch sự.'], ['Too much! You are a cheater!', 0, 'Xúc phạm người bán.']] },
  ],
};
