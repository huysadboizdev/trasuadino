# Thiết Kế: Hệ Thống Khách Hàng (User Storefront) & Xác Thực Tài Khoản (Auth)

**Ngày tạo:** 2026-08-17  
**Dự án:** Trà Sữa Dino  
**Mục tiêu:** Xây dựng trọn vẹn phân hệ Khách Hàng (Storefront), Đăng Nhập, Đăng Ký (Email/Gmail, Mật khẩu >= 6 ký tự, vào ngay không cần verify, gợi ý lỗi khi nhập sai), Đăng Nhập Google 1-chạm, Lịch sử đơn hàng cá nhân và tự động điền thông tin khi thanh toán.

---

## 1. Yêu Cầu Cốt Lõi & Trải Nghiệm Khách Hàng (User UI/UX)

1. **Xác Thực Tài Khoản (Authentication):**
   - **Đăng Ký:** Nhập Họ tên, Gmail/Email, Số điện thoại và Mật khẩu (tối thiểu 6 ký tự).
   - **Không cần Verify Email:** Đăng ký thành công là tự động đăng nhập và vào mua hàng ngay lập tức.
   - **Đăng Nhập:** Đăng nhập bằng Email/Gmail + Mật khẩu.
   - **Đăng Nhập Google:** Nút `[ Tiếp Tục Với Google ]` 1-chạm, tự động lấy họ tên & gmail của khách để đăng nhập.
   - **Gợi Ý & Báo Lỗi Trực Quan (Realtime Validation):**
     - Báo lỗi ngay dưới ô nhập khi Email không đúng định dạng.
     - Báo lỗi khi Mật khẩu dưới 6 ký tự (có dòng nhắc `Mật khẩu cần tối thiểu 6 ký tự`).
     - Báo lỗi rõ ràng khi sai mật khẩu hoặc Email đã được đăng ký trước đó.

2. **Trải Nghiệm Đặt Hàng Mượt Mà (Smart Storefront):**
   - **Tự động điền thông tin (Auto-fill):** Khi khách đã đăng nhập, thông tin Tên, SĐT, Địa chỉ sẽ tự động điền sẵn vào form đặt hàng.
   - **Bảng Chọn Tùy Biến (Bottom Sheet):** Chọn Size, Mức đường, Mức đá, Topping cộng tiền tự động.
   - **Lịch Sử Đơn Hàng Cá Nhân (`/account` hoặc Modal Tra Cứu):** Khách xem lại danh sách đơn của mình, trạng thái pha chế/giao hàng realtime và mã VietQR SePay để thanh toán lại nếu chưa trả.

3. **Thiết Kế Tối Giản Icon & Responsive:**
   - Hạn chế icon, sử dụng chữ in rõ ràng, badge màu sắc nét.
   - Tối ưu 100% cảm ứng 1 tay trên điện thoại di động và cân đối trên Tablet / Máy tính.

---

## 2. Kiến Trúc Dữ Liệu & API

### Model User & Auth (Prisma / Store)
- `User`: `id`, `name`, `email` (unique), `phone`, `passwordHash`, `role` (`CUSTOMER`, `STAFF`, `ADMIN`), `address`, `avatar`, `googleId`.

### Các API Routes:
- `POST /api/auth/register`: Đăng ký bằng Email + Mật khẩu (validate >= 6 ký tự) ➔ Trả về User session.
- `POST /api/auth/login`: Đăng nhập bằng Email + Mật khẩu ➔ Trả về User session.
- `POST /api/auth/google`: Đăng nhập/Đăng ký nhanh với Google.
- `GET /api/auth/me`: Lấy thông tin user hiện tại đang đăng nhập.
- `GET /api/user/orders`: Lấy danh sách lịch sử đơn hàng của user.
