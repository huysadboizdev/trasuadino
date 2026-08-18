# Kế Hoạch Triển Khai: Phân Hệ Khách Hàng (User) & Xác Thực Tài Khoản (Auth)

> **Mục tiêu:** Xây dựng trọn vẹn giao diện và tính năng cho khách hàng: Đăng ký Gmail (mật khẩu >= 6 ký tự, vào ngay không cần verify), Đăng nhập thường & Google 1-chạm, báo lỗi chi tiết khi nhập sai, Đặt món tùy biến (Size/Đường/Đá/Topping), Tự động điền thông tin và Tra cứu lịch sử đơn hàng.

**Kiến trúc:** Next.js App Router, AuthContext (Client State + LocalStorage/Cookie), API Auth Routes, Validation Helpers.  
**Tech Stack:** Next.js 14, React 18, Tailwind CSS, TypeScript.

---

### Task 1: Nâng Cấp Data Model & API Xác Thực (Auth Backend)

**Files:**
- Modify: `src/lib/types.ts` (thêm `email`, `googleId` vào User type)
- Modify: `src/lib/store.ts` (hỗ trợ tìm kiếm theo email, kiểm tra mật khẩu, tạo user mới, cập nhật phiên đăng nhập)
- Create: `src/app/api/auth/register/route.ts` (Đăng ký tài khoản: kiểm tra email hợp lệ, mật khẩu >= 6 ký tự, trả về user session)
- Create: `src/app/api/auth/login/route.ts` (Đăng nhập: kiểm tra email, mật khẩu, trả về lỗi chi tiết nếu sai)
- Create: `src/app/api/auth/google/route.ts` (Đăng nhập nhanh với Google 1-chạm)

---

### Task 2: Xây Dựng AuthContext & Quản Lý Phiên Đăng Nhập Client

**Files:**
- Create: `src/context/AuthContext.tsx` (Provider lưu user hiện tại, hàm login, register, loginWithGoogle, logout, updateProfile)
- Modify: `src/app/layout.tsx` (Bọc `AuthProvider` vào ứng dụng)

---

### Task 3: Xây Dựng Hộp Thoại Đăng Nhập & Đăng Ký (AuthModal / BottomSheet)

**Files:**
- Create: `src/components/auth/AuthModal.tsx` (Modal/BottomSheet 3 tab: ĐĂNG NHẬP | ĐĂNG KÝ | GOOGLE)
  - Validate email chuẩn định dạng, hiển thị dòng cảnh báo đỏ ngay bên dưới ô nhập nếu sai.
  - Validate mật khẩu >= 6 ký tự (vừa gõ vừa đếm độ dài và nhắc nhở trực quan).
  - Nút `[ Tiếp Tục Với Google ]` to bản nổi bật.
  - Tự động đóng modal và báo Toast chào mừng khi hoàn tất.

---

### Task 4: Nâng Cấp Header & Trang Chủ Khách Hàng (Storefront Header)

**Files:**
- Modify: `src/app/page.tsx`
  - Header hiển thị: Nút `[ ĐĂNG NHẬP ]` / `[ ĐĂNG KÝ ]` nếu chưa đăng nhập.
  - Nếu đã đăng nhập: Hiển thị `[ Chào, Tên Khách ]`, Nút `[ ĐƠN CỦA TÔI ]`, Nút `[ ĐĂNG XUẤT ]`.
  - Tự động điền Tên, SĐT, Địa chỉ của User vào Form đặt hàng để khách không phải gõ lại.

---

### Task 5: Xây Dựng Màn Hình / Modal Lịch Sử Đơn Hàng Cá Nhân (User Orders)

**Files:**
- Create: `src/components/user/UserOrdersModal.tsx` (Hiển thị danh sách đơn khách đã đặt, trạng thái pha chế theo thời gian thực, tổng tiền, mã VietQR thanh toán lại nếu chưa trả).
- Create: `src/app/api/user/orders/route.ts` (API lấy đơn theo SĐT hoặc User ID).

---

### Task 6: Kiểm Thử Toàn Diện Luồng Khách Hàng & Xác Thực (Windows & Ubuntu)

- [ ] Kiểm thử Đăng ký với mật khẩu < 6 ký tự ➔ Báo lỗi `Mật khẩu cần tối thiểu 6 ký tự`.
- [ ] Kiểm thử Đăng ký với email sai định dạng ➔ Báo lỗi `Email không hợp lệ`.
- [ ] Kiểm thử Đăng ký thành công ➔ Tự động đăng nhập và chào mừng.
- [ ] Kiểm thử Đăng nhập sai mật khẩu ➔ Báo lỗi `Mật khẩu không chính xác`.
- [ ] Kiểm thử Đăng nhập Google 1-chạm ➔ Đăng nhập thành công tức thì.
- [ ] Kiểm thử Đặt hàng khi đã đăng nhập ➔ Tự động điền thông tin và lưu vào lịch sử đơn.
