# 👷 Hành Trình Kỹ Thuật Viên — English & Electronics Quest

Game nhập vai 2D (nhìn từ trên xuống) để **học tiếng Anh** và **kiến thức điện tử / điện lạnh**, chơi trên **điện thoại và iPad** ngay trong trình duyệt. Không cần cài đặt, không cần mạng sau lần mở đầu tiên.

## Cách chơi

Bạn là **Minh**, một kỹ thuật viên trẻ vừa nhận việc ở Trung Tâm Bảo Hành.

| Hoạt động | Mô tả |
|---|---|
| 🟡 **Quả cầu chữ** | Chạm vào để gặp từ tiếng Anh mới. Trả lời đúng câu đố (chọn nghĩa, nghe phát âm, điền vào câu) để đưa từ vào **Từ điển**. Càng gặp lại, độ thuộc (★) càng tăng. |
| 🔩 **Linh kiện** | Điện trở, tụ, điốt, MOSFET, IGBT, vi điều khiển, rơ-le PTC, cảm biến NTC, van cấp nước... mỗi loại có thẻ: chức năng, **cách đo kiểm**, thiết bị thường gặp. |
| 🛠️ **Đi làm** | Nhận đơn sửa chữa ở Trung Tâm Bảo Hành → mang đủ linh kiện tới nhà khách → trả lời câu **chẩn đoán bằng tiếng Anh**. |
| 🔌 **Chợ Linh Kiện** | Mua/bán linh kiện, **lắp ráp mạch** ở Xưởng (nguồn 5V, nguồn xung, bo điều khiển, cụm xả đá, inverter...). |
| 💬 **Giao tiếp** | Nói chuyện với người đi đường, khách hàng qua điện thoại (Call Center), chủ tiệm, lễ tân... chọn câu trả lời phù hợp. |
| 📚 **Thư viện** | Ôn tập từ vựng, ưu tiên những từ chưa thuộc. |
| 🚌 **Xe buýt** | Đi nhanh giữa các vùng đất. |
| 🌙 **Ngày / đêm** | 1 giây = 1 phút trong game. Về nhà ngủ để sang ngày mới, nhận đơn mới và lưu game. |

**Điều khiển:** kéo ngón tay ở nửa trái màn hình để đi; nút tròn bên phải để Vào nhà / Nói chuyện (hoặc cứ đi thẳng vào cửa). Trên máy tính: WASD/mũi tên + Space.

### Thế giới (9 vùng, mở khoá theo cấp độ)

| Vùng | Level | Chủ đề từ vựng |
|---|---|---|
| Làng Ven Sông (nhà bạn) | 1 | Cuộc sống, trong nhà, ăn uống |
| Phố Trung Tâm | 1 | Công việc, chăm sóc khách hàng, giao thông |
| Chợ Linh Kiện | 2 | Điện tử cơ bản, dụng cụ |
| Công Viên Hồ Sen | 2 | Thiên nhiên |
| Bãi Biển Xanh | 3 | Du lịch |
| Rừng Thông | 4 | Thiên nhiên, du lịch |
| Khu Công Nghiệp | 5 | Nhà máy, điện lạnh, điện tử |
| Khu Công Nghệ Cao | 6 | Điện tử, sản xuất |
| Sân Bay Quốc Tế | 7 | Du lịch, thành phố |

Hiện có **219 từ vựng / 12 nhóm**, **33 linh kiện**, **10 mạch lắp ráp**, **17 đơn sửa chữa**, **14 nhiệm vụ cốt truyện**.

## Chơi trên điện thoại / iPad

Game là trang web tĩnh, cần đưa lên một địa chỉ web (ví dụ **GitHub Pages**, miễn phí):

1. Vào repo trên GitHub → **Settings → Pages**.
2. *Source*: **Deploy from a branch**, chọn nhánh chứa game và thư mục `/ (root)` → **Save**.
3. Sau 1–2 phút sẽ có link dạng `https://<tên-tài-khoản>.github.io/<tên-repo>/`.
4. **iPhone/iPad:** mở link bằng **Safari** → nút **Chia sẻ** → **Thêm vào MH chính**. Game sẽ chạy toàn màn hình như ứng dụng và chơi được khi không có mạng.
   **Android:** mở bằng Chrome → menu ⋮ → **Thêm vào màn hình chính**.

> Không nghe phát âm trên iPhone? Hãy tắt công tắc im lặng và kiểm tra ⚙️ Cài đặt trong game.

Tiến trình được lưu tự động trên chính thiết bị (localStorage).

## Mở rộng thế giới (không cần biết lập trình nhiều)

Mọi nội dung nằm trong thư mục `js/data/`, mỗi mục chỉ là một dòng/khối dữ liệu:

| Muốn thêm | Sửa file | Cách làm |
|---|---|---|
| Từ vựng | `js/data/words.js` | Thêm `['word', '/ipa/', 'nghĩa', 'Example sentence.']` vào một nhóm, hoặc tạo nhóm mới. |
| Linh kiện | `js/data/components.js` → `PARTS` | Thêm object `{ id, en, vi, sym, color, rarity, price, desc, test, used }`. |
| Mạch lắp ráp | `js/data/components.js` → `RECIPES` | `need: { id_linh_kiện: số_lượng }` và đoạn `learn` giải thích. |
| Đơn sửa chữa / mã lỗi mới | `js/data/quests.js` → `JOBS` | Hiện tượng (EN + VN), linh kiện cần, câu hỏi chẩn đoán 4 đáp án + giải thích. |
| Hội thoại | `js/data/quests.js` → `DIALOGS` | Câu NPC nói, nghĩa, các câu trả lời, `ok` = vị trí câu đúng. |
| Nhiệm vụ cốt truyện | `js/data/quests.js` → `STORY` | Loại: `enter, words, parts, jobs, craft, talk, level, regions`. |
| **Vùng đất mới** | `js/data/regions.js` | Thêm 1 object với toạ độ lưới `gx, gy` mới (ví dụ `gx: 3, gy: 1`). Bản đồ tự lớn ra, đường đi tự nối. |

Sau khi sửa, tăng số phiên bản `CACHE` trong `sw.js` (ví dụ `tech-english-v2`) để điện thoại tải bản mới.

> ⚠️ Giá trị đo trong thẻ linh kiện chỉ mang tính tham khảo — luôn đối chiếu tài liệu kỹ thuật của từng model.

## Cấu trúc mã nguồn

```
index.html          giao diện chính
css/style.css       giao diện, tối ưu cảm ứng
js/util.js          tiện ích, lưu game, âm thanh, đọc phát âm (Text-to-Speech)
js/icons.js         vẽ linh kiện & nhân vật bằng code (không cần ảnh)
js/world.js         tạo bản đồ từ dữ liệu vùng đất, vẽ ô đất, toà nhà, bản đồ nhỏ
js/input.js         cần điều khiển ảo, nút hành động, bàn phím
js/game.js          vòng lặp game, nhân vật, vật phẩm, nhiệm vụ
js/ui.js            hộp thoại: đố từ, cửa hàng, xưởng, từ điển, bản đồ...
js/data/*.js        TOÀN BỘ nội dung có thể mở rộng
sw.js, manifest.json  chơi offline & cài lên màn hình chính
```

Chạy thử trên máy tính: `python3 -m http.server` trong thư mục game rồi mở `http://localhost:8000`.
