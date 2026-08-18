# 🧋 TRÀ SỮA DINO - HỆ THỐNG AUTHENTICATION ACCESS TOKEN & REFRESH TOKEN

Tài liệu chi tiết về cơ chế Authentication Production-Ready được xây dựng trên mô hình **JWT Access Token (in-memory) + HttpOnly Refresh Token (with Rotation & Reuse Detection)**.

---

## 1. ⚙️ CẤU HÌNH TTL & TOKEN THEO ROLE

| Đối tượng | Access Token TTL | Refresh Token TTL | Nơi lưu trữ Access Token | Nơi lưu trữ Refresh Token |
| :--- | :--- | :--- | :--- | :--- |
| **CUSTOMER** | **15 phút** (`15m`) | **7 ngày** (`7d`) | In-Memory / React State | `HttpOnly`, `Secure`, `SameSite=Lax` Cookie |
| **ADMIN & STAFF** | **10 phút** (`10m`) | **3 ngày** (`3d`) | In-Memory / React State | `HttpOnly`, `Secure`, `SameSite=Lax` Cookie |

---

## 2. 🔐 BẢO MẬT & CƠ CHẾ HOẠT ĐỘNG

### 2.1. Access Token:
- Ký bằng thuật toán **HMAC SHA-256 (HS256)** với `JWT_ACCESS_SECRET`.
- Payload chứa: `sub` (userId), `email`, `name`, `role`, `type: "access"`.
- Không chứa mật khẩu hay thông tin nhạy cảm.
- Gửi lên server qua Header: `Authorization: Bearer <accessToken>`.

### 2.2. Refresh Token:
- **KHÔNG lưu trong `localStorage` hay `sessionStorage`**.
- Lưu trong **`HttpOnly` Cookie** (`dino_refresh_token`): Trình duyệt tự động gửi, ngăn chặn 100% tấn công XSS đánh cắp token.
- **Database / Store chỉ lưu mã băm `SHA-256` (`tokenHash`)**, không lưu token dạng plaintext.

### 2.3. Refresh Token Rotation & Token Reuse Detection:
- Mỗi khi gọi `POST /api/auth/refresh`:
  1. Server kiểm tra `tokenHash` trong Database.
  2. Nếu phát hiện token này nằm trong lịch sử token đã xoay vòng (**Token Reuse Alert**):
     - **Thu hồi ngay lập tức toàn bộ Token Family** liên quan.
     - Xóa Cookie và buộc đăng nhập lại để bảo vệ tài khoản.
  3. Nếu token hợp lệ: Hủy token cũ ➔ Cấp `Refresh Token` mới ➔ Cấp `Access Token` mới.

### 2.4. Single-Flight Refresh Lock (Frontend):
- Nếu có nhiều request đồng thời bị 401 khi Access Token hết hạn, hệ thống chỉ gửi **DUY NHẤT 1 request** đến `/api/auth/refresh`.
- Các request khác xếp hàng đợi kết quả và tự động retry đúng 1 lần với Access Token mới.

---

## 3. 📡 DANH SÁCH API ENDPOINTS

### 1. `POST /api/auth/login`
- **Body**: `{ email: string, password: string, deviceId?: string }`
- **Response**: `{ success: true, accessToken: string, user: User, message: string }`
- **Cookie**: Gắn `dino_refresh_token` (HttpOnly).

### 2. `POST /api/auth/register`
- **Body**: `{ email: string, password: string, confirmPassword?: string, name?: string }`
- **Response**: `{ success: true, accessToken: string, user: User, message: string }`
- **Cookie**: Gắn `dino_refresh_token` (HttpOnly).

### 3. `POST /api/auth/google`
- **Body**: `{ email: string, name?: string, googleId?: string, avatar?: string }`
- **Response**: `{ success: true, accessToken: string, user: User, message: string }`

### 4. `POST /api/auth/refresh`
- **Headers/Cookies**: Cookie `dino_refresh_token` tự động gửi.
- **Response**: `{ success: true, accessToken: string, user: User }`

### 5. `POST /api/auth/logout`
- **Action**: Thu hồi Refresh Session trong database và xóa sạch HttpOnly Cookie.

### 6. `POST /api/auth/logout-all`
- **Action**: Thu hồi toàn bộ Refresh Session của user trên mọi thiết bị.

### 7. `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response**: `{ success: true, user: User }`
