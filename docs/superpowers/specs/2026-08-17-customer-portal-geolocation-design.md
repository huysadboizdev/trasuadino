# Thiết Kế: Nâng Cấp Phân Hệ Khách Hàng (User Dashboard, Menu Tìm Kiếm/Lọc/Sắp Xếp & Định Vị Vị Trí Giao Hàng GPS)

**Ngày tạo:** 2026-08-17  
**Dự án:** Trà Sữa Dino  
**Mục tiêu:** Xây dựng trải nghiệm mua hàng toàn diện cho khách hàng:
1. **Trang Chủ / Dashboard Khách Hàng:** Khu vực **Món Bán Chạy Nhất (Best Sellers 🔥)**, món đề xuất nổi bật.
2. **Hệ Thống Menu Thông Minh:** Bộ tìm kiếm (Search), Bộ lọc danh mục & khoảng giá, Bộ sắp xếp (Giá tăng/giảm, Mới nhất, Bán chạy).
3. **Quản Lý Thông Tin Cá Nhân & Đơn Hàng:** Hồ sơ cá nhân (Tên, SĐT, Email, Sổ địa chỉ), Tra cứu tiến độ đơn hàng.
4. **Định Vị Vị Trí Giao Hàng GPS 1-Chạm (Geolocation & Reverse Geocoding):** Tự động lấy tọa độ GPS của điện thoại/máy tính ➔ Chuyển thành tên đường, số nhà, phường/quận tiếng Việt rõ ràng, giúp giao hàng chuẩn xác.

---

## 1. Chi Tiết Các Phân Hệ UI/UX

### A. Trang Chủ & Dashboard Khách Hàng
- **Khu Vực "Món Bán Chạy Nhất" (Best Sellers 🔥):**
  - Hiển thị danh sách các món ăn & trà sữa hot nhất, có lượt đặt nhiều nhất.
  - Thẻ món nổi bật có badge `🔥 BEST SELLER`, hiển thị giá bán và nút `[ + CHỌN MÓN ]` nhanh.
- **Thanh Chuyển Tab / Điều Hướng:**
  - `TRANG CHỦ` ➔ `THỰC ĐƠN MÓN` ➔ `ĐƠN HÀNG CỦA TÔI` ➔ `HỒ SƠ CỦA TÔI`.

### B. Bộ Công Cụ Menu Món Ăn (Search - Filter - Sort)
- **Search (Tìm kiếm thời gian thực):** Tìm kiếm theo tên đồ uống, tên bánh hoặc thành phần.
- **Filter (Lọc đa tiêu chí):**
  - Lọc theo Danh mục (Trà Sữa, Bánh Ngọt, Ăn Vặt, Topping...).
  - Lọc theo Khoảng giá (Dưới 30.000đ | 30.000đ - 50.000đ | Trên 50.000đ).
  - Lọc trạng thái (Chỉ hiện món còn hàng).
- **Sort (Sắp xếp thông minh):**
  - `Mặc định / Phổ biến nhất`
  - `Giá: Thấp đến Cao`
  - `Giá: Cao đến Thấp`
  - `Món mới nhất`

### C. Định Vị Vị Trí Giao Hàng Bằng GPS 1-Chạm (Smart Geolocation)
- **Nút "📍 LẤY VỊ TRÍ HIỆN TẠI (GPS)":**
  - Tích hợp HTML5 Geolocation API (`navigator.geolocation.getCurrentPosition`).
  - Sử dụng API Reverse Geocoding miễn phí không cần key (OpenStreetMap Nominatim).
  - Tự động lấy địa chỉ thực tế (Ví dụ: *Số 45, Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh*).
  - Điền tự động vào ô Địa chỉ nhận hàng và lưu vào Thông tin cá nhân của khách.
  - Khách vẫn có thể gõ thêm ghi chú chi tiết (Số tầng, Tên tòa nhà, Số phòng).

### D. Trang / Modal Hồ Sơ Cá Nhân & Lịch Sử Đơn Hàng
- **Hồ Sơ Cá Nhân (Profile):** Cập nhật Họ Tên, Số Điện Thoại, Địa chỉ giao hàng mặc định, Tọa độ vị trí.
- **Lịch Sử Đơn Hàng:** Xem lại các đơn đã đặt, tiến độ giao hàng 4 bước realtime, mở mã QR VietQR SePay để thanh toán.
