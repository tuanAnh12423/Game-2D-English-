// ============================================================
// SỰ KIỆN THEO LỊCH THẬT — lặp lại hằng tuần theo giờ điện thoại.
// Thêm sự kiện mới: chép một khối bên dưới, đổi id (không trùng), ngày, giờ.
//   days   : thứ trong tuần (0 = Chủ nhật, 1 = Thứ 2 … 6 = Thứ 7)
//   start  : giờ bắt đầu (9.5 = 9:30), dur: số giờ diễn ra
//   place  : loại toà nhà tổ chức (service, library, koi, phela, farmshop…)
//   need   : tính năng phải mở trước thì mới thấy sự kiện
//   kind   : workshop (hội thảo: nghe giảng → hỏi đáp → kiểm tra)
//            teafest (ngày hội trà sữa) · market (chợ phiên nông sản)
// Người chơi được thông báo trước 3 ngày, nhắc lại trước 1 giờ và 10 phút.
// ============================================================
window.EVENT_NOTICE_H = 72;

window.EVENTS = [
  {
    id: 'washer', kind: 'workshop', icon: '🧺', name: 'Hội thảo Máy Giặt Inverter', en: 'Washing Machine Workshop',
    days: [6], start: 9, dur: 2, place: 'service', need: 'jobs',
    desc: 'Kỹ sư hãng giới thiệu cấu tạo máy giặt cửa trước / cửa trên, động cơ inverter, cách xử lý máy không xả nước, rung mạnh, không vắt. Cuối buổi có bài kiểm tra — đậu nhận chứng nhận.',
    host: 'Kỹ sư Hằng', look: 1,
    xp: 120, coins: 80, repeatXp: 40, gift: 'doorlock',
    slides: [
      { en: 'Good morning, everyone! Welcome to our washing machine workshop. Today we will talk about how a washing machine works and how to fix common problems.', vi: 'Chào buổi sáng mọi người! Chào mừng đến buổi hội thảo máy giặt. Hôm nay chúng ta nói về cách máy giặt hoạt động và cách xử lý các lỗi thường gặp.', words: ['workshop', 'common problem'] },
      { en: 'An inverter motor changes its speed smoothly. It uses less electricity and makes less noise than an old motor with a belt.', vi: 'Động cơ inverter thay đổi tốc độ mượt mà. Nó tốn ít điện hơn và êm hơn động cơ cũ dùng dây curoa.', words: ['inverter motor', 'belt', 'electricity'] },
      { en: 'When the machine does not drain, first check the drain filter and the drain hose. Very often, a coin or a hair clip is blocking the drain pump.', vi: 'Khi máy không xả nước, trước tiên kiểm tra lưới lọc xả và ống xả. Rất thường gặp là đồng xu hoặc kẹp tóc làm kẹt bơm xả.', words: ['drain filter', 'drain hose', 'drain pump'] },
      { en: 'If the machine shakes a lot during the spin cycle, the load is unbalanced or the transit bolts were not removed. Ask the customer to spread the clothes evenly.', vi: 'Nếu máy rung mạnh khi vắt, đồ giặt bị lệch hoặc chưa tháo bu-lông vận chuyển. Hướng dẫn khách trải đều quần áo trong lồng giặt.', words: ['spin cycle', 'unbalanced load', 'transit bolt'] },
      { en: 'The door lock keeps the door closed while there is water in the drum. If the door lock is faulty, the machine will not start.', vi: 'Khoá cửa giữ cửa đóng khi trong lồng còn nước. Nếu khoá cửa hỏng, máy sẽ không chạy.', words: ['door lock', 'drum', 'faulty'] },
      { en: 'Finally, remind customers to use the right amount of detergent and run a drum clean program once a month. Thank you for listening!', vi: 'Cuối cùng, nhắc khách dùng đúng lượng bột giặt và chạy chương trình vệ sinh lồng giặt mỗi tháng một lần. Cảm ơn mọi người đã lắng nghe!', words: ['detergent', 'drum clean'] },
    ],
    qa: [
      { npc: 'Does anyone have a question?', vi: 'Có ai có câu hỏi không?', o: [['Excuse me, could you explain how to clean the drain filter?', 2, 'Mở đầu bằng “Excuse me” và dùng “could you” — lịch sự, đúng chuẩn hội thảo.'], ['Tell me drain filter.', 1, 'Hiểu được nhưng cộc lốc, thiếu động từ và lời mở đầu.'], ['No. Bye.', 0, 'Không lịch sự và bỏ lỡ cơ hội học hỏi.']] },
      { npc: 'Good question! Open the small door at the bottom front, put a towel down, and turn the filter slowly to the left. Is that clear?', vi: 'Câu hỏi hay! Mở nắp nhỏ phía dưới mặt trước, lót khăn, vặn lưới lọc từ từ sang trái. Rõ chưa?', o: [['Yes, that’s very clear. Thank you so much!', 2, 'Xác nhận đã hiểu và cảm ơn — chuyên nghiệp.'], ['Yes.', 1, 'Đúng nhưng ngắn quá, nên thêm lời cảm ơn.'], ['I don’t care.', 0, 'Thô lỗ với diễn giả.']] },
    ],
    quiz: [
      { q: 'What should you check first when a washing machine does not drain?', a: 'The drain filter and the drain hose', o: ['The door glass', 'The power plug color', 'The detergent brand'] },
      { q: 'Why does an inverter motor save energy?', a: 'It changes its speed smoothly as needed', o: ['It always runs at full speed', 'It uses a longer belt', 'It works without electricity'] },
      { q: 'The machine shakes a lot during the spin cycle. What is a likely cause?', a: 'An unbalanced load or transit bolts not removed', o: ['Too little water in the tank', 'The door is too clean', 'The room is too cold'] },
      { q: 'What does the door lock do?', a: 'It keeps the door closed while there is water in the drum', o: ['It heats the water', 'It counts the clothes', 'It pumps water out'] },
      { q: '“Drain pump” in Vietnamese is…', a: 'Bơm xả', o: ['Van cấp nước', 'Lồng giặt', 'Bo mạch chính'] },
      { q: 'How often should customers run a drum clean program?', a: 'About once a month', o: ['Never', 'Every ten years', 'Only when the machine is new'] },
      { q: 'Which small objects often block the drain pump?', a: 'Coins and hair clips', o: ['Water drops', 'Soap bubbles', 'Sunlight'] },
    ],
  },
  {
    id: 'fridge', kind: 'workshop', icon: '🧊', name: 'Lớp chuyên đề Tủ Lạnh', en: 'Refrigerator Clinic',
    days: [3], start: 18.5, dur: 1.5, place: 'library', need: 'jobs',
    desc: 'Buổi tối thứ 4 sau giờ làm: máy nén inverter, dàn lạnh, dàn nóng, hệ thống xả đá, gioăng cửa. Học cách giải thích cho khách vì sao tủ không lạnh hoặc đóng tuyết.',
    host: 'Thầy Phong', look: 2,
    xp: 120, coins: 80, repeatXp: 40, gift: 'ntc',
    slides: [
      { en: 'Good evening, everyone! Tonight we will learn about refrigerators: the compressor, the evaporator, the condenser and the defrost system.', vi: 'Chào buổi tối mọi người! Tối nay chúng ta học về tủ lạnh: máy nén, dàn lạnh, dàn nóng và hệ thống xả đá.', words: ['compressor', 'evaporator', 'condenser'] },
      { en: 'The compressor pumps the refrigerant around the system. An inverter compressor changes its speed, so the temperature stays stable and the fridge uses less power.', vi: 'Máy nén đẩy môi chất lạnh đi khắp hệ thống. Máy nén inverter thay đổi tốc độ nên nhiệt độ ổn định và tủ tốn ít điện hơn.', words: ['refrigerant', 'inverter compressor', 'stable'] },
      { en: 'The evaporator takes heat out of the food compartment. The condenser releases that heat outside, so the back or the sides of the fridge feel warm. That is normal.', vi: 'Dàn lạnh hút nhiệt trong khoang chứa thực phẩm. Dàn nóng thải nhiệt ra ngoài nên phía sau hoặc hai bên hông tủ ấm lên. Điều đó là bình thường.', words: ['food compartment', 'release heat', 'normal'] },
      { en: 'In a frost-free fridge, a defrost heater melts the ice on the evaporator. If the heater or the defrost sensor is faulty, ice builds up and the fridge stops cooling well.', vi: 'Ở tủ không đóng tuyết, điện trở xả đá làm tan băng trên dàn lạnh. Nếu điện trở hoặc cảm biến xả đá hỏng, băng tích tụ và tủ kém lạnh.', words: ['frost-free', 'defrost heater', 'defrost sensor'] },
      { en: 'Always check the door gasket. A damaged gasket lets warm air in. Also ask customers to leave space around the fridge and not to put hot food inside.', vi: 'Luôn kiểm tra gioăng cửa. Gioăng hỏng làm khí nóng lọt vào. Nhắc khách để khoảng trống quanh tủ và không cho thức ăn còn nóng vào tủ.', words: ['door gasket', 'warm air', 'leave space'] },
    ],
    qa: [
      { npc: 'Any questions before the quiz?', vi: 'Có câu hỏi nào trước bài kiểm tra không?', o: [['Yes, I have a question. Why does the side of the fridge feel warm?', 2, 'Báo trước “I have a question” rồi hỏi rõ ràng.'], ['Why hot?', 1, 'Quá ngắn, người nghe phải đoán ý.'], ['Hurry up, I want to go home.', 0, 'Thiếu tôn trọng diễn giả.']] },
      { npc: 'Because the condenser releases heat there. It is completely normal. How would you explain that to a worried customer?', vi: 'Vì dàn nóng thải nhiệt ở đó. Hoàn toàn bình thường. Bạn sẽ giải thích cho khách đang lo lắng thế nào?', o: [['Don’t worry, it’s normal. The fridge is releasing heat to keep your food cold.', 2, 'Trấn an khách trước, rồi giải thích đơn giản — đúng kỹ năng chăm sóc khách hàng.'], ['It is condenser.', 1, 'Đúng kỹ thuật nhưng khách khó hiểu, thiếu trấn an.'], ['Your fridge is broken, buy a new one.', 0, 'Sai kỹ thuật và làm khách hoang mang.']] },
    ],
    quiz: [
      { q: 'Which part pumps the refrigerant around the system?', a: 'The compressor', o: ['The door gasket', 'The light bulb', 'The shelf'] },
      { q: 'The sides of the fridge feel warm. What should you tell the customer?', a: 'It is normal — the condenser releases heat', o: ['The fridge will explode', 'Turn it off forever', 'Put ice on the sides'] },
      { q: 'In a frost-free fridge, what melts the ice on the evaporator?', a: 'The defrost heater', o: ['The ice maker', 'The door switch', 'The fan blade'] },
      { q: 'What happens if the door gasket is damaged?', a: 'Warm air gets in and the fridge cools poorly', o: ['The fridge becomes quieter', 'The fridge uses less power', 'Nothing happens'] },
      { q: '“Evaporator” in Vietnamese is…', a: 'Dàn lạnh', o: ['Dàn nóng', 'Máy nén', 'Gioăng cửa'] },
      { q: 'Why is an inverter compressor better?', a: 'It keeps the temperature stable and saves power', o: ['It is always louder', 'It needs no refrigerant', 'It only works in winter'] },
      { q: 'Which advice is correct for customers?', a: 'Let hot food cool down before putting it in', o: ['Put hot soup in right away', 'Push the fridge against the wall', 'Keep the door open to save power'] },
    ],
  },
  {
    id: 'water', kind: 'workshop', icon: '💧', name: 'Ngày hội Máy Lọc Nước', en: 'Water Purifier Day',
    days: [5], start: 19, dur: 1.5, place: 'service', need: 'jobs',
    desc: 'Tối thứ 6: các lõi lọc, màng RO, chỉ số TDS, lịch thay lõi, bơm tăng áp. Luyện cách tư vấn khách thay lõi lọc đúng hạn bằng tiếng Anh.',
    host: 'Chị Mai', look: 3,
    xp: 120, coins: 80, repeatXp: 40, gift: 'booster',
    slides: [
      { en: 'Hello, everyone! Welcome to Water Purifier Day. Tonight we will look at filters, the RO membrane and how to advise customers.', vi: 'Xin chào mọi người! Chào mừng đến Ngày hội Máy Lọc Nước. Tối nay chúng ta tìm hiểu các lõi lọc, màng RO và cách tư vấn khách hàng.', words: ['water purifier', 'filter', 'advise'] },
      { en: 'The first filters are pre-filters. A sediment filter removes sand and rust. A carbon filter removes chlorine and bad smells.', vi: 'Các lõi đầu tiên là lõi lọc thô. Lõi PP giữ lại cát và gỉ sét. Lõi than hoạt tính khử clo và mùi hôi.', words: ['pre-filter', 'sediment filter', 'carbon filter'] },
      { en: 'The RO membrane has very tiny holes. It removes most dissolved salts and impurities. A booster pump pushes water through the membrane.', vi: 'Màng RO có lỗ cực nhỏ. Nó loại bỏ phần lớn muối hoà tan và tạp chất. Bơm tăng áp đẩy nước đi qua màng.', words: ['RO membrane', 'impurities', 'booster pump'] },
      { en: 'A TDS meter shows the total dissolved solids in the water. If the TDS of the purified water goes up, the membrane may need to be replaced.', vi: 'Bút đo TDS cho biết tổng chất rắn hoà tan trong nước. Nếu TDS của nước sau lọc tăng lên, có thể cần thay màng.', words: ['TDS meter', 'dissolved solids', 'replace'] },
      { en: 'Remind customers to replace the filters on schedule. Old filters can make the water taste bad and reduce the flow. Thank you!', vi: 'Nhắc khách thay lõi lọc đúng lịch. Lõi cũ làm nước có vị lạ và chảy yếu. Cảm ơn mọi người!', words: ['on schedule', 'taste', 'flow'] },
    ],
    qa: [
      { npc: 'Any questions?', vi: 'Có câu hỏi nào không?', o: [['Could you tell us how often the filters should be replaced?', 2, '“Could you tell us…” — câu hỏi gián tiếp, rất lịch sự.'], ['Change filter when?', 1, 'Hiểu được nhưng sai ngữ pháp, nghe cộc.'], ['I already know everything.', 0, 'Kiêu ngạo, không phù hợp.']] },
      { npc: 'It depends on the water quality and the user manual. Always follow the schedule in the manual. How would you remind a customer?', vi: 'Tuỳ chất lượng nước và sách hướng dẫn. Luôn làm theo lịch trong sách hướng dẫn. Bạn sẽ nhắc khách thế nào?', o: [['Just a friendly reminder: your filters are due for replacement this month.', 2, '“Just a friendly reminder” — cách nhắc nhẹ nhàng, chuyên nghiệp.'], ['Filter old. Buy new.', 1, 'Thiếu lịch sự, nghe như ép mua.'], ['You never clean anything, right?', 0, 'Đổ lỗi cho khách.']] },
    ],
    quiz: [
      { q: 'What does a sediment filter remove?', a: 'Sand and rust', o: ['Chlorine only', 'Electricity', 'Sugar'] },
      { q: 'What does a carbon filter remove?', a: 'Chlorine and bad smells', o: ['Large stones', 'Heat', 'Noise'] },
      { q: 'What pushes water through the RO membrane?', a: 'The booster pump', o: ['The faucet handle', 'The TDS meter', 'Gravity only'] },
      { q: 'The TDS of the purified water is going up. What may be needed?', a: 'Replacing the membrane', o: ['Adding more salt', 'Turning the purifier upside down', 'Nothing, it is better'] },
      { q: '“Màng lọc RO” in English is…', a: 'RO membrane', o: ['RO motor', 'RO bucket', 'RO cable'] },
      { q: 'What is a polite way to remind a customer?', a: '“Just a friendly reminder: your filters are due for replacement.”', o: ['“Change it now or else.”', '“Your water is dirty because of you.”', '“Whatever.”'] },
    ],
  },
  {
    id: 'teafest', kind: 'teafest', icon: '🧋', name: 'Ngày hội Trà Sữa', en: 'Bubble Tea Festival',
    days: [0], start: 14, dur: 4, place: 'koi', place2: 'phela', need: 'tea',
    desc: 'Chiều Chủ nhật ở KOI Thé và Phê La: giảm 50% mọi đồ uống, thẻ tích điểm — order chuẩn tiếng Anh 3 ly để nhận quà. Có gian đố vui từ vựng topping.',
    host: 'MC Bảo Anh', look: 6,
    xp: 90, coins: 60, stamps: 3,
    quiz: [
      { q: 'Trân châu đen in English is…', a: 'tapioca pearls', o: ['black stones', 'coffee beans', 'rice balls'] },
      { q: '“Less ice, please” means…', a: 'Ít đá', o: ['Không đá', 'Nhiều đá', 'Đá riêng'] },
      { q: 'Kem phô mai (lớp kem mặn trên ly) is called…', a: 'cheese foam', o: ['milk cake', 'butter cloud', 'salt cream'] },
      { q: 'How do you ask for 30% sugar?', a: '“30% sugar, please.”', o: ['“Sugar thirty give me.”', '“No more sweet.”', '“Sugar is bad.”'] },
      { q: '“For here or to go?” — you want to take it away. You say…', a: '“To go, please.”', o: ['“For here, please.”', '“Go away.”', '“I go.”'] },
      { q: 'Thạch (topping) in English is…', a: 'jelly', o: ['jam', 'gel pen', 'glue'] },
    ],
  },
  {
    id: 'market', kind: 'market', icon: '🌾', name: 'Chợ phiên Nông Sản', en: 'Farmers’ Market',
    days: [6], start: 7, dur: 3, place: 'farmshop', need: 'farm',
    desc: 'Sáng thứ 7 sớm: Tiệm Nông Sản mua nông sản giá GẤP ĐÔI. Hãy thu hoạch sẵn từ tối thứ 6 và luyện câu chào hàng bằng tiếng Anh.',
    host: 'Bác Ba', look: 4,
    sellMul: 2,
  },
];
