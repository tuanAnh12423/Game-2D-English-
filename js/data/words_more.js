// ============================================================
// KHO TỪ BỔ SUNG — từ mới cho các nhóm cũ, nhóm cảm xúc / sức khoẻ /
// tiền bạc, và các nhóm CỤM TỪ (cụm danh từ, cụm động từ hay dùng).
// Định dạng giống words.js: [en, ipa, nghĩa VN, câu ví dụ có chứa từ đó].
// Cụm từ dài cũng được, câu đố "điền vào chỗ trống" sẽ che cả cụm.
// ============================================================
(function () {
  const add = (cat, list) => { WORD_CATS[cat].words.push(...list); };

  add('daily', [
    ['errand', '/ˈerənd/', 'việc vặt', 'I need to run some errands after work.'],
    ['chore', '/tʃɔːr/', 'việc nhà', 'Washing the dishes is my least favorite chore.'],
    ['commute', '/kəˈmjuːt/', 'đi lại (nhà – chỗ làm)', 'My commute takes thirty minutes by motorbike.'],
    ['routine', '/ruːˈtiːn/', 'thói quen hằng ngày', 'Exercise is part of my morning routine.'],
    ['patient', '/ˈpeɪʃnt/', 'kiên nhẫn', 'Be patient, learning English takes time.'],
    ['confident', '/ˈkɑːnfɪdənt/', 'tự tin', 'She feels confident when she speaks English.'],
    ['polite', '/pəˈlaɪt/', 'lịch sự', 'Always be polite to customers.'],
    ['punctual', '/ˈpʌŋktʃuəl/', 'đúng giờ', 'Please be punctual for the meeting.'],
    ['goal', '/ɡoʊl/', 'mục tiêu', 'My goal is to speak English fluently.'],
    ['effort', '/ˈefərt/', 'nỗ lực', 'Success comes from hard work and effort.'],
    ['opportunity', '/ˌɑːpərˈtuːnəti/', 'cơ hội', 'This job is a great opportunity for me.'],
  ]);
  add('home', [
    ['balcony', '/ˈbælkəni/', 'ban công', 'We dry our clothes on the balcony.'],
    ['socket', '/ˈsɑːkɪt/', 'ổ cắm điện', 'Plug the charger into the socket.'],
    ['tap', '/tæp/', 'vòi nước', 'Turn off the tap after washing your hands.'],
    ['mop', '/mɑːp/', 'cây lau nhà; lau nhà', 'I mop the floor every weekend.'],
    ['rent', '/rent/', 'tiền thuê nhà', 'The rent is due at the end of the month.'],
  ]);
  add('food', [
    ['sour', '/ˈsaʊər/', 'chua', 'This soup is a little sour.'],
    ['salty', '/ˈsɔːlti/', 'mặn', 'The fish sauce is too salty for me.'],
    ['bitter', '/ˈbɪtər/', 'đắng', 'Black coffee tastes bitter.'],
    ['leftovers', '/ˈleftoʊvərz/', 'đồ ăn thừa', 'Keep the leftovers in the fridge.'],
    ['appetizer', '/ˈæpɪtaɪzər/', 'món khai vị', 'We ordered spring rolls as an appetizer.'],
  ]);
  add('city', [
    ['crosswalk', '/ˈkrɔːswɔːk/', 'vạch qua đường', 'Always cross the street at the crosswalk.'],
    ['roundabout', '/ˈraʊndəbaʊt/', 'vòng xuyến', 'Take the second exit at the roundabout.'],
    ['landmark', '/ˈlændmɑːrk/', 'địa danh, điểm mốc', 'The big clock tower is a famous landmark.'],
    ['downtown', '/ˌdaʊnˈtaʊn/', 'trung tâm thành phố', 'Our service center is downtown.'],
    ['neighborhood', '/ˈneɪbərhʊd/', 'khu phố', 'This neighborhood is quiet and safe.'],
  ]);
  add('nature', [
    ['sunrise', '/ˈsʌnraɪz/', 'bình minh', 'We woke up early to watch the sunrise.'],
    ['storm', '/stɔːrm/', 'cơn bão', 'A big storm is coming tonight.'],
    ['flood', '/flʌd/', 'lũ lụt; ngập', 'The street floods when it rains heavily.'],
    ['lotus', '/ˈloʊtəs/', 'hoa sen', 'The lotus is the national flower of Vietnam.'],
    ['pollution', '/pəˈluːʃn/', 'ô nhiễm', 'Air pollution is a problem in big cities.'],
    ['recycle', '/ˌriːˈsaɪkl/', 'tái chế', 'We recycle plastic bottles and cans.'],
  ]);
  add('travel', [
    ['check-in counter', '/ˈtʃek ɪn ˈkaʊntər/', 'quầy làm thủ tục', 'The check-in counter opens at six.'],
    ['round trip', '/raʊnd trɪp/', 'khứ hồi', 'I bought a round trip ticket.'],
    ['homestay', '/ˈhoʊmsteɪ/', 'nhà dân cho thuê trọ', 'We stayed at a homestay in Sa Pa.'],
    ['itinerary', '/aɪˈtɪnəreri/', 'lịch trình chuyến đi', 'Here is our itinerary for the trip.'],
    ['local', '/ˈloʊkl/', 'địa phương; người bản xứ', 'Ask a local for the best food.'],
    ['scenery', '/ˈsiːnəri/', 'phong cảnh', 'The scenery in Da Lat is amazing.'],
  ]);
  add('work', [
    ['teamwork', '/ˈtiːmwɜːrk/', 'tinh thần đồng đội', 'Teamwork makes the job easier.'],
    ['supervisor', '/ˈsuːpərvaɪzər/', 'người giám sát, quản lý', 'Ask your supervisor before you leave.'],
  ]);
  add('appliance', [
    ['dishwasher', '/ˈdɪʃwɑːʃər/', 'máy rửa bát', 'Put the plates in the dishwasher.'],
    ['water heater', '/ˈwɔːtər hiːtər/', 'máy nước nóng', 'The water heater takes ten minutes to warm up.'],
    ['air purifier', '/er ˈpjʊrɪfaɪər/', 'máy lọc không khí', 'An air purifier helps people with allergies.'],
    ['standby', '/ˈstændbaɪ/', 'chế độ chờ', 'The TV is in standby mode.'],
    ['energy-saving', '/ˈenərdʒi ˈseɪvɪŋ/', 'tiết kiệm năng lượng', 'This is an energy-saving model.'],
    ['vibration', '/vaɪˈbreɪʃn/', 'sự rung', 'Strong vibration can come from an unbalanced load.'],
    ['frost', '/frɔːst/', 'tuyết, lớp băng mỏng', 'There is too much frost in the freezer.'],
  ]);
  add('electronics', [
    ['amplifier', '/ˈæmplɪfaɪər/', 'bộ khuếch đại', 'The amplifier makes the signal stronger.'],
    ['oscillator', '/ˈɑːsɪleɪtər/', 'mạch dao động', 'The crystal oscillator sets the clock speed.'],
    ['rectifier', '/ˈrektɪfaɪər/', 'mạch chỉnh lưu', 'The rectifier changes AC to DC.'],
    ['ripple', '/ˈrɪpl/', 'độ gợn (điện áp)', 'A bad capacitor causes high ripple.'],
    ['overload', '/ˌoʊvərˈloʊd/', 'quá tải', 'The motor stopped because of an overload.'],
    ['firmware', '/ˈfɜːrmwer/', 'phần mềm nhúng', 'Update the firmware to fix the bug.'],
  ]);
  add('tools', [
    ['crimping tool', '/ˈkrɪmpɪŋ tuːl/', 'kìm bấm cos', 'Use a crimping tool to fix the terminal.'],
    ['heat gun', '/hiːt ɡʌn/', 'máy khò nhiệt', 'Shrink the tube with a heat gun.'],
    ['spirit level', '/ˈspɪrɪt ˈlevl/', 'thước thuỷ', 'Use a spirit level to hang the indoor unit straight.'],
    ['insulation tape', '/ˌɪnsəˈleɪʃn teɪp/', 'băng keo cách điện', 'Wrap the joint with insulation tape.'],
  ]);
  add('service', [
    ['warranty card', '/ˈwɔːrənti kɑːrd/', 'phiếu bảo hành', 'Please keep your warranty card.'],
    ['follow up', '/ˌfɑːloʊ ˈʌp/', 'theo dõi, liên hệ lại', 'I will follow up with you tomorrow.'],
    ['refund', '/ˈriːfʌnd/', 'hoàn tiền', 'You can get a refund within seven days.'],
    ['replacement', '/rɪˈpleɪsmənt/', 'sự thay thế; hàng thay thế', 'We will send a replacement part.'],
    ['on hold', '/ɑːn hoʊld/', 'giữ máy (chờ)', 'May I put you on hold for a moment?'],
    ['escalate', '/ˈeskəleɪt/', 'chuyển cấp cao hơn', 'I will escalate this case to my manager.'],
    ['availability', '/əˌveɪləˈbɪləti/', 'thời gian rảnh; tình trạng còn hàng', 'What is your availability this week?'],
  ]);
  add('industry', [
    ['production line', '/prəˈdʌkʃn laɪn/', 'dây chuyền sản xuất', 'The production line stopped for maintenance.'],
    ['raw material', '/rɔː məˈtɪriəl/', 'nguyên liệu thô', 'Raw material prices went up.'],
    ['inspection', '/ɪnˈspekʃn/', 'sự kiểm tra', 'Every unit passes a final inspection.'],
    ['batch', '/bætʃ/', 'lô hàng', 'This batch was made in May.'],
    ['forklift', '/ˈfɔːrklɪft/', 'xe nâng', 'Only trained staff can drive the forklift.'],
  ]);
  add('farm', [
    ['seedling', '/ˈsiːdlɪŋ/', 'cây con', 'Plant the seedlings in rows.'],
    ['barn', '/bɑːrn/', 'nhà kho nông trại, chuồng', 'The cows sleep in the barn.'],
    ['hen', '/hen/', 'gà mái', 'The hen laid three eggs today.'],
    ['feed', '/fiːd/', 'cho ăn; thức ăn gia súc', 'I feed the animals every morning.'],
    ['organic', '/ɔːrˈɡænɪk/', 'hữu cơ', 'These vegetables are organic.'],
  ]);

  // ---------- Nhóm mới ----------
  WORD_CATS.feelings = { name: 'Cảm xúc & tính cách', icon: '💖', words: [
    ['happy', '/ˈhæpi/', 'vui', 'I am happy to help you.'],
    ['excited', '/ɪkˈsaɪtɪd/', 'háo hức', 'I am excited about the new job.'],
    ['nervous', '/ˈnɜːrvəs/', 'hồi hộp, lo lắng', 'I feel nervous before the interview.'],
    ['worried', '/ˈwɜːrid/', 'lo lắng', 'The customer is worried about the bill.'],
    ['upset', '/ʌpˈset/', 'buồn bực', 'She was upset because the repair was late.'],
    ['angry', '/ˈæŋɡri/', 'tức giận', 'Stay calm when a customer is angry.'],
    ['calm', '/kɑːm/', 'bình tĩnh', 'Take a deep breath and stay calm.'],
    ['proud', '/praʊd/', 'tự hào', 'I am proud of my team.'],
    ['grateful', '/ˈɡreɪtfl/', 'biết ơn', 'I am grateful for your support.'],
    ['embarrassed', '/ɪmˈbærəst/', 'ngượng, xấu hổ', 'I was embarrassed when I forgot his name.'],
    ['bored', '/bɔːrd/', 'chán', 'I never feel bored when I learn new words.'],
    ['surprised', '/sərˈpraɪzd/', 'ngạc nhiên', 'I was surprised by the gift.'],
    ['lonely', '/ˈloʊnli/', 'cô đơn', 'My cat keeps me company, so I am never lonely.'],
    ['honest', '/ˈɑːnɪst/', 'trung thực', 'Always be honest with customers.'],
    ['kind', '/kaɪnd/', 'tốt bụng', 'It was very kind of you to help.'],
    ['careful', '/ˈkerfl/', 'cẩn thận', 'Be careful with the electric wires.'],
    ['hard-working', '/ˌhɑːrd ˈwɜːrkɪŋ/', 'chăm chỉ', 'Minh is a hard-working technician.'],
    ['curious', '/ˈkjʊriəs/', 'tò mò, ham học hỏi', 'Curious people learn faster.'],
    ['shy', '/ʃaɪ/', 'nhút nhát', 'Don’t be shy, just try to speak.'],
    ['cheerful', '/ˈtʃɪrfl/', 'vui vẻ, tươi tắn', 'She always has a cheerful smile.'],
  ]};
  WORD_CATS.health = { name: 'Sức khoẻ & cơ thể', icon: '🩺', words: [
    ['headache', '/ˈhedeɪk/', 'đau đầu', 'I have a headache today.'],
    ['fever', '/ˈfiːvər/', 'sốt', 'He has a fever, so he stayed home.'],
    ['cough', '/kɔːf/', 'ho', 'Drink warm water for your cough.'],
    ['sore throat', '/sɔːr θroʊt/', 'đau họng', 'I have a sore throat from talking all day.'],
    ['backache', '/ˈbækeɪk/', 'đau lưng', 'Lifting heavy units can cause a backache.'],
    ['medicine', '/ˈmedsn/', 'thuốc', 'Take this medicine after meals.'],
    ['pharmacy', '/ˈfɑːrməsi/', 'nhà thuốc', 'The pharmacy is next to the bank.'],
    ['injury', '/ˈɪndʒəri/', 'chấn thương', 'Wear gloves to avoid injury.'],
    ['rest', '/rest/', 'nghỉ ngơi', 'You should get some rest.'],
    ['exercise', '/ˈeksərsaɪz/', 'tập thể dục', 'I exercise for thirty minutes a day.'],
    ['sleep', '/sliːp/', 'giấc ngủ; ngủ', 'Try to get eight hours of sleep.'],
    ['shoulder', '/ˈʃoʊldər/', 'vai', 'My shoulder hurts.'],
    ['knee', '/niː/', 'đầu gối', 'Bend your knees when you lift a box.'],
    ['wrist', '/rɪst/', 'cổ tay', 'He hurt his wrist while fixing the washer.'],
    ['stomach', '/ˈstʌmək/', 'dạ dày, bụng', 'My stomach hurts after spicy food.'],
    ['allergy', '/ˈælərdʒi/', 'dị ứng', 'I have an allergy to dust.'],
    ['first aid', '/ˌfɜːrst ˈeɪd/', 'sơ cứu', 'Every van has a first aid kit.'],
    ['stress', '/stres/', 'căng thẳng', 'Music helps me reduce stress.'],
  ]};
  WORD_CATS.money = { name: 'Tiền bạc & mua bán', icon: '💰', words: [
    ['price', '/praɪs/', 'giá', 'What is the price of this part?'],
    ['cash', '/kæʃ/', 'tiền mặt', 'Do you want to pay by card or in cash?'],
    ['change', '/tʃeɪndʒ/', 'tiền thối lại', 'Here is your change.'],
    ['expensive', '/ɪkˈspensɪv/', 'đắt', 'This model is too expensive for me.'],
    ['cheap', '/tʃiːp/', 'rẻ', 'Cheap parts often break quickly.'],
    ['afford', '/əˈfɔːrd/', 'có đủ tiền mua', 'I can’t afford a new car yet.'],
    ['budget', '/ˈbʌdʒɪt/', 'ngân sách', 'What is your budget for a new fridge?'],
    ['save money', '/seɪv ˈmʌni/', 'tiết kiệm tiền', 'An inverter air conditioner helps you save money.'],
    ['transfer', '/trænsˈfɜːr/', 'chuyển khoản', 'You can pay by bank transfer.'],
    ['installment', '/ɪnˈstɔːlmənt/', 'trả góp (một kỳ)', 'You can pay in six monthly installments.'],
    ['quote', '/kwoʊt/', 'báo giá', 'Can you give me a quote for the repair?'],
    ['bargain', '/ˈbɑːrɡən/', 'món hời; mặc cả', 'This jacket was a real bargain.'],
    ['in stock', '/ɪn stɑːk/', 'còn hàng', 'Sorry, that part is not in stock.'],
    ['sold out', '/soʊld aʊt/', 'hết hàng', 'The new model is sold out.'],
    ['worth it', '/wɜːrθ ɪt/', 'đáng giá', 'It is expensive, but it is worth it.'],
  ]};

  // ---------- Cụm từ (cụm danh từ, cụm động từ, kết hợp từ) ----------
  WORD_CATS.phrase_daily = { name: 'Cụm từ đời sống', icon: '🗨️', words: [
    ['make a decision', '/meɪk ə dɪˈsɪʒn/', 'đưa ra quyết định', 'I need to make a decision today.'],
    ['take a break', '/teɪk ə breɪk/', 'nghỉ giải lao', 'Let’s take a break for ten minutes.'],
    ['take care of', '/teɪk ker əv/', 'chăm sóc', 'I take care of my little sister.'],
    ['look forward to', '/lʊk ˈfɔːrwərd tə/', 'mong chờ', 'I look forward to seeing you.'],
    ['get along with', '/ɡet əˈlɔːŋ wɪð/', 'hoà hợp với', 'I get along with my neighbors.'],
    ['run out of', '/rʌn aʊt əv/', 'hết (cái gì)', 'We have run out of milk.'],
    ['pick up', '/pɪk ʌp/', 'đón; nhặt lên', 'Can you pick up the kids at six?'],
    ['give up', '/ɡɪv ʌp/', 'bỏ cuộc', 'Never give up on your dreams.'],
    ['catch up', '/kætʃ ʌp/', 'bắt kịp; hàn huyên', 'Let’s meet for coffee and catch up.'],
    ['on time', '/ɑːn taɪm/', 'đúng giờ', 'The bus arrived on time.'],
    ['in a hurry', '/ɪn ə ˈhɜːri/', 'đang vội', 'Sorry, I’m in a hurry.'],
    ['by the way', '/baɪ ðə weɪ/', 'nhân tiện', 'By the way, how was your weekend?'],
    ['a piece of cake', '/ə piːs əv keɪk/', 'dễ như ăn bánh', 'This test was a piece of cake.'],
    ['good luck', '/ɡʊd lʌk/', 'chúc may mắn', 'Good luck with your exam!'],
    ['day off', '/deɪ ɔːf/', 'ngày nghỉ', 'Tomorrow is my day off.'],
    ['weekend plans', '/ˈwiːkend plænz/', 'kế hoạch cuối tuần', 'Do you have any weekend plans?'],
    ['street food', '/striːt fuːd/', 'đồ ăn đường phố', 'Vietnamese street food is famous.'],
    ['phone number', '/foʊn ˈnʌmbər/', 'số điện thoại', 'Could I have your phone number?'],
    ['grocery store', '/ˈɡroʊsəri stɔːr/', 'cửa hàng tạp hoá', 'There is a grocery store near my house.'],
    ['public transport', '/ˌpʌblɪk ˈtrænspɔːrt/', 'phương tiện công cộng', 'I use public transport to save money.'],
  ]};
  WORD_CATS.phrase_work = { name: 'Cụm từ công việc & khách hàng', icon: '🤝', words: [
    ['customer service', '/ˈkʌstəmər ˈsɜːrvɪs/', 'dịch vụ khách hàng', 'Good customer service builds trust.'],
    ['business hours', '/ˈbɪznəs aʊərz/', 'giờ làm việc', 'Our business hours are 8 a.m. to 5 p.m.'],
    ['work order', '/wɜːrk ˈɔːrdər/', 'phiếu công việc', 'Please sign the work order.'],
    ['service fee', '/ˈsɜːrvɪs fiː/', 'phí dịch vụ', 'The service fee is free during the warranty.'],
    ['home visit', '/hoʊm ˈvɪzɪt/', 'đến tận nhà', 'We offer a free home visit.'],
    ['customer complaint', '/ˈkʌstəmər kəmˈpleɪnt/', 'khiếu nại của khách', 'We handle every customer complaint carefully.'],
    ['contact information', '/ˈkɑːntækt ˌɪnfərˈmeɪʃn/', 'thông tin liên hệ', 'Please update your contact information.'],
    ['time slot', '/taɪm slɑːt/', 'khung giờ', 'We have a time slot at 2 p.m.'],
    ['team meeting', '/tiːm ˈmiːtɪŋ/', 'họp nhóm', 'We have a team meeting every Monday.'],
    ['job description', '/dʒɑːb dɪˈskrɪpʃn/', 'mô tả công việc', 'Read the job description carefully.'],
    ['sign up', '/saɪn ʌp/', 'đăng ký', 'Sign up for the training course.'],
    ['fill out', '/fɪl aʊt/', 'điền (mẫu đơn)', 'Please fill out this form.'],
    ['call back', '/kɔːl bæk/', 'gọi lại', 'Please call back in five minutes.'],
    ['hold on', '/hoʊld ɑːn/', 'chờ một chút', 'Hold on, let me check.'],
    ['look into', '/lʊk ˈɪntuː/', 'xem xét, tìm hiểu', 'I will look into the problem.'],
    ['set up', '/set ʌp/', 'lắp đặt, cài đặt', 'We will set up the new TV for you.'],
    ['figure out', '/ˈfɪɡjər aʊt/', 'tìm ra', 'I can’t figure out why it doesn’t work.'],
    ['as soon as possible', '/æz suːn æz ˈpɑːsəbl/', 'sớm nhất có thể', 'We will fix it as soon as possible.'],
    ['in advance', '/ɪn ədˈvæns/', 'trước (thời hạn)', 'Please book in advance.'],
    ['out of order', '/aʊt əv ˈɔːrdər/', 'hỏng, không hoạt động', 'The elevator is out of order.'],
  ]};
  WORD_CATS.phrase_tech = { name: 'Cụm từ kỹ thuật điện lạnh', icon: '🛠️', words: [
    ['main board', '/meɪn bɔːrd/', 'bo mạch chính', 'The main board needs to be replaced.'],
    ['power cord', '/ˈpaʊər kɔːrd/', 'dây nguồn', 'The power cord is damaged.'],
    ['circuit breaker', '/ˈsɜːrkɪt ˈbreɪkər/', 'cầu dao, CB', 'The circuit breaker tripped.'],
    ['indoor unit', '/ˈɪndɔːr ˈjuːnɪt/', 'dàn lạnh', 'The indoor unit is dripping water.'],
    ['outdoor unit', '/ˈaʊtdɔːr ˈjuːnɪt/', 'dàn nóng', 'The outdoor unit needs space for air flow.'],
    ['air filter', '/er ˈfɪltər/', 'lưới lọc gió', 'Clean the air filter every two weeks.'],
    ['drain pipe', '/dreɪn paɪp/', 'ống thoát nước', 'The drain pipe is blocked.'],
    ['refrigerant leak', '/rɪˈfrɪdʒərənt liːk/', 'rò rỉ môi chất lạnh', 'A refrigerant leak makes the AC cool poorly.'],
    ['temperature sensor', '/ˈtemprətʃər ˈsensər/', 'cảm biến nhiệt độ', 'The temperature sensor is out of range.'],
    ['door seal', '/dɔːr siːl/', 'gioăng cửa', 'The door seal is torn.'],
    ['water inlet valve', '/ˈwɔːtər ˈɪnlet vælv/', 'van cấp nước', 'Replace the water inlet valve.'],
    ['test run', '/test rʌn/', 'chạy thử', 'Let’s do a test run after the repair.'],
    ['safety check', '/ˈseɪfti tʃek/', 'kiểm tra an toàn', 'Always do a safety check before you start.'],
    ['voltage drop', '/ˈvoʊltɪdʒ drɑːp/', 'sụt áp', 'A voltage drop can stop the compressor.'],
    ['loose connection', '/luːs kəˈnekʃn/', 'tiếp xúc lỏng', 'A loose connection can cause sparks.'],
    ['user manual', '/ˈjuːzər ˈmænjuəl/', 'sách hướng dẫn sử dụng', 'You can find it in the user manual.'],
    ['maintenance schedule', '/ˈmeɪntənəns ˈskedʒuːl/', 'lịch bảo dưỡng', 'Follow the maintenance schedule.'],
  ]};
})();

// ============================================================
// CÂU HAY MỖI NGÀY — tục ngữ, châm ngôn, câu nói có ý nghĩa.
// Mỗi ngày hiện 1 câu (theo ngày thật), nghe & luyện nói để lưu vào sổ tay.
// [câu tiếng Anh, nghĩa tiếng Việt, ghi chú / câu tương đương]
// ============================================================
window.SENTENCES = [
  ['Practice makes perfect.', 'Có công mài sắt, có ngày nên kim.', 'Luyện tập nhiều sẽ thành thạo.'],
  ['Better late than never.', 'Muộn còn hơn không.', 'Dùng khi ai đó bắt đầu việc tốt hơi trễ.'],
  ['Actions speak louder than words.', 'Hành động có sức nặng hơn lời nói.', 'Làm hơn nói.'],
  ['Where there is a will, there is a way.', 'Có chí thì nên.', 'will = ý chí, way = con đường.'],
  ['Every cloud has a silver lining.', 'Trong cái rủi có cái may.', 'silver lining = viền bạc của đám mây.'],
  ['Rome wasn’t built in a day.', 'Thành Rome không xây xong trong một ngày.', 'Việc lớn cần thời gian, hãy kiên nhẫn.'],
  ['The early bird catches the worm.', 'Chim dậy sớm bắt được sâu.', 'Ai đến sớm, làm sớm thì có lợi.'],
  ['Don’t judge a book by its cover.', 'Đừng trông mặt mà bắt hình dong.', 'judge = đánh giá, cover = bìa.'],
  ['Two heads are better than one.', 'Hai cái đầu tốt hơn một.', 'Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.'],
  ['Honesty is the best policy.', 'Trung thực là thượng sách.', 'policy = chính sách.'],
  ['A friend in need is a friend indeed.', 'Hoạn nạn mới biết bạn hiền.', 'indeed = thực sự.'],
  ['Time is money.', 'Thời gian là tiền bạc.', 'Hay dùng trong công việc.'],
  ['No pain, no gain.', 'Không có khó khăn thì không có thành quả.', 'gain = đạt được.'],
  ['Learn from your mistakes.', 'Hãy học hỏi từ sai lầm của mình.', 'mistake = lỗi sai.'],
  ['Mistakes are proof that you are trying.', 'Sai lầm là bằng chứng bạn đang cố gắng.', 'proof = bằng chứng.'],
  ['Small steps every day lead to big results.', 'Bước nhỏ mỗi ngày dẫn đến kết quả lớn.', 'lead to = dẫn đến.'],
  ['Believe in yourself.', 'Hãy tin vào chính mình.', 'believe in = tin tưởng vào.'],
  ['It’s never too late to learn.', 'Học không bao giờ là muộn.', 'never too late = không bao giờ quá muộn.'],
  ['Knowledge is power.', 'Tri thức là sức mạnh.', 'knowledge /ˈnɑːlɪdʒ/.'],
  ['Done is better than perfect.', 'Làm xong còn hơn làm hoàn hảo mà không xong.', 'Đừng cầu toàn quá.'],
  ['Slow and steady wins the race.', 'Chậm mà chắc.', 'steady = đều đặn.'],
  ['Don’t put off until tomorrow what you can do today.', 'Việc hôm nay chớ để ngày mai.', 'put off = trì hoãn.'],
  ['Look before you leap.', 'Nghĩ kỹ trước khi hành động.', 'leap = nhảy (nhìn kỹ rồi hãy nhảy).'],
  ['Kill two birds with one stone.', 'Một mũi tên trúng hai đích.', 'Thành ngữ rất hay dùng.'],
  ['Better safe than sorry.', 'Cẩn tắc vô áy náy.', 'Câu cửa miệng của kỹ thuật viên khi làm an toàn điện.'],
  ['Safety first.', 'An toàn là trên hết.', 'Luôn ngắt điện trước khi sửa.'],
  ['The customer is always right.', 'Khách hàng luôn luôn đúng.', 'Tinh thần phục vụ: lắng nghe khách trước.'],
  ['A smile costs nothing but gives much.', 'Nụ cười chẳng tốn gì nhưng mang lại nhiều điều.', 'Tinh thần chăm sóc khách hàng.'],
  ['Listen first, then speak.', 'Hãy lắng nghe trước, rồi mới nói.', 'Kỹ năng quan trọng của Call Center.'],
  ['Thank you for your patience.', 'Cảm ơn quý khách đã kiên nhẫn chờ đợi.', 'Câu chuẩn khi khách phải chờ.'],
  ['I’m sorry for the inconvenience.', 'Tôi xin lỗi vì sự bất tiện này.', 'Câu xin lỗi chuyên nghiệp.'],
  ['How can I make this right for you?', 'Tôi có thể làm gì để khắc phục cho anh/chị?', 'Dùng khi khách không hài lòng.'],
  ['Let me check that for you.', 'Để tôi kiểm tra giúp anh/chị.', 'Câu dùng hằng ngày ở quầy và tổng đài.'],
  ['Is there anything else I can help you with?', 'Anh/chị còn cần tôi hỗ trợ gì nữa không?', 'Câu kết thúc cuộc gọi.'],
  ['Have a nice day!', 'Chúc anh/chị một ngày tốt lành!', 'Câu chào tạm biệt lịch sự.'],
  ['Teamwork makes the dream work.', 'Làm việc nhóm biến ước mơ thành hiện thực.', 'Câu vần vui hay dùng ở công ty.'],
  ['Quality is never an accident.', 'Chất lượng không bao giờ là ngẫu nhiên.', 'Câu của John Ruskin, hay dùng trong nhà máy.'],
  ['If it isn’t broken, don’t fix it.', 'Không hỏng thì đừng sửa.', 'Đừng thay đổi thứ đang chạy tốt.'],
  ['Measure twice, cut once.', 'Đo hai lần, cắt một lần.', 'Cẩn thận trước khi làm — câu của thợ.'],
  ['Every expert was once a beginner.', 'Chuyên gia nào cũng từng là người mới bắt đầu.', 'expert = chuyên gia, beginner = người mới.'],
  ['You don’t have to be perfect to be amazing.', 'Bạn không cần hoàn hảo để trở nên tuyệt vời.', 'amazing = tuyệt vời.'],
  ['Happiness is homemade.', 'Hạnh phúc được tạo nên từ chính ngôi nhà của mình.', 'homemade = tự làm ở nhà.'],
  ['East or west, home is best.', 'Đi đâu cũng không bằng nhà mình.', 'Câu có vần.'],
  ['An apple a day keeps the doctor away.', 'Mỗi ngày một quả táo, không cần gặp bác sĩ.', 'Ăn uống lành mạnh.'],
  ['Health is wealth.', 'Sức khoẻ là vàng.', 'wealth = sự giàu có.'],
  ['Laughter is the best medicine.', 'Một nụ cười bằng mười thang thuốc bổ.', 'laughter = tiếng cười.'],
  ['Good things take time.', 'Điều tốt đẹp cần thời gian.', 'Kiên nhẫn nhé!'],
  ['Dream big and work hard.', 'Hãy mơ lớn và làm việc chăm chỉ.', 'dream big = mơ ước lớn.'],
  ['Stay positive and keep going.', 'Hãy lạc quan và tiếp tục tiến lên.', 'keep going = tiếp tục.'],
  ['One day or day one. You decide.', '“Một ngày nào đó” hay “ngày đầu tiên”. Bạn quyết định.', 'Bắt đầu ngay hôm nay!'],
  ['The best time to start was yesterday. The next best time is now.', 'Thời điểm tốt nhất để bắt đầu là hôm qua. Tốt thứ nhì là ngay bây giờ.', 'Động lực để học mỗi ngày.'],
  ['A little progress each day adds up to big results.', 'Tiến bộ một chút mỗi ngày sẽ cộng lại thành kết quả lớn.', 'add up to = cộng lại thành.'],
  ['When one door closes, another opens.', 'Cánh cửa này đóng lại, cánh cửa khác sẽ mở ra.', 'Đừng nản khi thất bại.'],
  ['Kindness is free. Sprinkle it everywhere.', 'Sự tử tế là miễn phí. Hãy rắc nó khắp nơi.', 'sprinkle = rắc.'],
  ['Learning never exhausts the mind.', 'Học tập không bao giờ làm trí óc cạn kiệt.', 'Câu của Leonardo da Vinci.'],
  ['Hard work beats talent when talent doesn’t work hard.', 'Chăm chỉ thắng tài năng khi tài năng không chăm chỉ.', 'beat = đánh bại, talent = tài năng.'],
  ['Don’t count your chickens before they hatch.', 'Đừng vội mừng khi chưa chắc chắn.', 'hatch = nở (trứng). Hợp với trại gà của bạn!'],
  ['You reap what you sow.', 'Gieo nhân nào, gặt quả nấy.', 'reap = gặt, sow = gieo — hợp với ruộng của bạn.'],
  ['Make hay while the sun shines.', 'Tranh thủ khi có cơ hội.', 'hay = cỏ khô; phơi cỏ khi trời nắng.'],
  ['All good things come to those who wait.', 'Điều tốt đẹp đến với người biết chờ đợi.', 'Kiên nhẫn được đền đáp.'],
];
