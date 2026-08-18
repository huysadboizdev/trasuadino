# Kế Hoạch Triển Khai: Nâng Cấp Toàn Diện Phân Hệ Khách Hàng (User)

> **Mục tiêu:** Xây dựng trọn vẹn trải nghiệm khách hàng với Dashboard Món Bán Chạy Nhất, Menu Tìm Kiếm/Lọc/Sắp Xếp đa chiều, Quản lý Hồ sơ cá nhân (bắt buộc địa chỉ nhận hàng) và Tính năng Định vị GPS 1-chạm tự động lấy địa chỉ giao hàng.

---

### Task 1: Xây Dựng Tiện Ích Định Vị GPS & Reverse Geocoding

**Files:**
- Create: `src/lib/geolocation.ts` (Hàm `getCurrentCoordinates()` và `reverseGeocode(lat, lng)` sử dụng OpenStreetMap Nominatim tiếng Việt)
- Create: `src/components/ui/AddressLocationPicker.tsx` (Component chọn địa chỉ có nút `[ 📍 Lấy Vị Trí GPS ]`, ô nhập địa chỉ chi tiết, thông báo tọa độ và bản đồ thu nhỏ).

---

### Task 2: Xây Dựng Modal / Phân Hệ Thông Tin Cá Nhân (UserProfileModal)

**Files:**
- Create: `src/components/user/UserProfileModal.tsx`
  - Quản lý Họ tên, Số điện thoại, Email.
  - Quản lý Địa chỉ giao hàng mặc định tích hợp nút định vị GPS 1-chạm.
  - Lưu cập nhật trực tiếp vào cơ sở dữ liệu / store và AuthContext.
- Create: `src/app/api/user/profile/route.ts` (API cập nhật thông tin cá nhân của user).

---

### Task 3: Nâng Cấp Trang Chủ / Dashboard Khách Hàng (Best Sellers & Hero)

**Files:**
- Modify: `src/app/page.tsx`
  - Section **🔥 MÓN BÁN CHẠY NHẤT (BEST SELLERS)**: Hiển thị các món hot/bán chạy ở vị trí trên cùng với giao diện nổi bật, bắt mắt.
  - Thanh Tabs phân loại trang: `TẤT CẢ MÓN`, `MÓN BÁN CHẠY`, `TRÀ SỮA`, `BÁNH & ĂN VẶT`.

---

### Task 4: Nâng Cấp Hệ Thống Menu Thông Minh (Search, Filter, Sort)

**Files:**
- Modify: `src/app/page.tsx`
  - **Search Bar:** Tìm kiếm nhanh theo tên món/nguyên liệu với nút xóa 1-chạm.
  - **Sort Controls:** Sắp xếp theo: `Mặc định`, `Giá: Thấp → Cao`, `Giá: Cao → Thấp`, `Mới nhất`, `Bán chạy nhất`.
  - **Price Range Filter:** Lọc theo mức giá (`Tất cả`, `< 30k`, `30k - 50k`, `> 50k`).
  - **Stock Filter:** Chỉ hiện món đang còn bán.

---

### Task 5: Tích Hợp Định Vị GPS Vào Form Thanh Toán & Đặt Hàng

**Files:**
- Modify: `src/app/page.tsx`
  - Trong Modal Đặt Hàng: Tích hợp `AddressLocationPicker` giúp khách chỉ cần bấm 1 nút `[ 📍 LẤY VỊ TRÍ HIỆN TẠI (GPS) ]` là tự động điền địa chỉ giao hàng chính xác mà không cần gõ bàn phím.
  - Bắt buộc điền Địa chỉ giao hàng khi đặt đơn.

---

### Task 6: Kiểm Thử & Tối Ưu UI/UX Đa Thiết Bị

- [ ] Kiểm thử tính năng Định vị GPS trên trình duyệt (lấy tọa độ và địa chỉ tiếng Việt thành công).
- [ ] Kiểm thử tìm kiếm, lọc theo giá, lọc theo danh mục và sắp xếp theo giá.
- [ ] Kiểm thử cập nhật thông tin cá nhân và lưu địa chỉ mặc định.
- [ ] Kiểm thử giao diện trên Điện Thoại (cảm ứng 1 tay) và Laptop/Desktop.
- [ ] Chạy `npx tsc --noEmit` xác nhận 0 lỗi.
