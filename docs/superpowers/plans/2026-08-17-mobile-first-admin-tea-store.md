# Kế Hoạch Triển Khai: Trang Quản Trị Mobile-First (Admin) - Trà Sữa Dino

> **Mục tiêu:** Xây dựng trọn vẹn bộ tính năng trang Quản Trị (Admin) tối ưu cao độ cho điện thoại di động (Mobile-First) nhưng đồng thời thích ứng hoàn hảo trên Máy Tính Bảng (Tablet) và Máy Tính Để Bàn (Desktop/Laptop), không bị vỡ bố cục, tối giản icon, tập trung thao tác mượt mà, hỗ trợ upload ảnh cục bộ, quản lý đơn hàng theo trạng thái, quản lý món & danh mục, quản lý người dùng và cấu hình SePay.

**Kiến trúc:** Next.js App Router (TypeScript, Tailwind CSS Responsive), Prisma ORM (SQLite `dev.db`), Lưu trữ ảnh local (`public/uploads`), SePay Webhook Handler.  
**Tech Stack:** Next.js 14/15, React 19/18, Tailwind CSS (Mobile + Desktop Responsive), Prisma, SQLite.

---

### Task 1: Khởi Tạo Dự Án Next.js & Cấu Hình Tailwind CSS Mobile-First

**Files:**
- Create/Initialize: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `src/app/globals.css`, `src/app/layout.tsx`
- Create: `public/uploads/.gitkeep`

- [ ] **Step 1: Khởi tạo project Next.js với Tailwind CSS và TypeScript**
- [ ] **Step 2: Cấu hình `src/app/globals.css` với hệ màu chuẩn, font chữ nét, tối ưu cảm ứng (touch-action, tap-highlight, safe-area-inset)**
- [ ] **Step 3: Tạo layout gốc với viewport `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no` tối ưu cho điện thoại**

---

### Task 2: Thiết Lập Prisma Schema & Mock Data Store (Cơ Sở Dữ Liệu)

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Create: `src/lib/types.ts`
- Create: `src/lib/mock-data.ts` (chứa danh mục, món mẫu, đơn hàng mẫu, người dùng mẫu để test ngay không cần nạp thủ công)

- [ ] **Step 1: Tạo file `prisma/schema.prisma` gồm User, Category, Product, ProductOption, Order, OrderItem, PaymentTransaction, Setting**
- [ ] **Step 2: Tạo `src/lib/types.ts` định nghĩa interface chuẩn TypeScript cho toàn hệ thống**
- [ ] **Step 3: Tạo `src/lib/mock-data.ts` với đầy đủ dữ liệu mẫu ban đầu để kiểm thử ngay lập tức**

---

### Task 3: Xây Dựng Bộ UI Components & Layout Thích Ứng (Responsive Mobile + Desktop)

**Files:**
- Create: `src/components/ui/Badge.tsx` (Thẻ trạng thái màu sắc nét: Đang bán, Hết hàng, Đã trả SePay, Thu tiền mặt, Mới nhận, Đang giao...)
- Create: `src/components/ui/Button.tsx` (Nút bấm to bản tối ưu ngón tay trên mobile, tinh tế trên PC)
- Create: `src/components/ui/Switch.tsx` (Nút gạt bật/tắt nhanh Còn/Hết)
- Create: `src/components/ui/BottomSheet.tsx` (Bảng trượt từ đáy màn hình trên mobile / Modal Popup trung tâm trên desktop)
- Create: `src/components/admin/MobileHeader.tsx` (Header gọn gàng trên điện thoại)
- Create: `src/components/admin/MobileBottomNav.tsx` (Thanh điều hướng cố định 5 tab chữ dưới đáy điện thoại - tự ẩn trên màn hình lớn)
- Create: `src/components/admin/DesktopSidebar.tsx` (Sidebar menu sang trọng cố định bên trái trên Desktop / Laptop)

- [ ] **Step 1: Xây dựng các UI atomic components (Badge, Button, Switch, Modal/BottomSheet thích ứng đa kích thước màn hình)**
- [ ] **Step 2: Xây dựng Layout Admin thích ứng: Mobile dùng `MobileHeader` + `MobileBottomNav`, Desktop/Tablet dùng `DesktopSidebar`**

---

### Task 4: Xây Dựng Tính Năng Quản Lý Món Ăn & Đồ Uống (Products Management)

**Files:**
- Create: `src/app/api/products/route.ts` (GET danh sách món, POST thêm món mới, PUT sửa món, DELETE xóa món)
- Create: `src/app/api/products/[id]/toggle/route.ts` (API bật/tắt Còn hàng/Tạm hết nhanh 1-chạm)
- Create: `src/components/admin/ProductCardAdmin.tsx` (Thẻ món hiển thị ảnh, tên, giá, nút gạt Còn/Hết, nút Sửa/Xóa)
- Create: `src/components/admin/ProductFormModal.tsx` (Form thêm/sửa món: tải ảnh từ camera/thư viện, chọn danh mục, cấu hình giá, topping/size)
- Create: `src/app/admin/products/page.tsx` (Trang danh sách món với bộ lọc danh mục và thanh tìm kiếm nhanh)

- [ ] **Step 1: Viết API route xử lý CRUD sản phẩm và bật/tắt trạng thái Còn/Hết**
- [ ] **Step 2: Xây dựng giao diện danh sách món ăn trên điện thoại**
- [ ] **Step 3: Xây dựng form thêm/sửa món có tính năng chọn ảnh chụp từ điện thoại**

---

### Task 5: Xây Dựng Tính Năng Quản Lý Danh Mục (Categories Management)

**Files:**
- Create: `src/app/api/categories/route.ts` (CRUD danh mục: Trà sữa, Bánh ngọt, Đồ ăn vặt, Topping...)
- Create: `src/components/admin/CategoryModal.tsx`
- Create: `src/app/admin/categories/page.tsx`

- [ ] **Step 1: Viết API route quản lý danh mục**
- [ ] **Step 2: Xây dựng giao diện quản lý danh mục, đổi thứ tự hiển thị, bật/tắt hiển thị**

---

### Task 6: Xây Dựng Tính Năng Quản Lý Đơn Hàng (Orders Management)

**Files:**
- Create: `src/app/api/orders/route.ts` (Lấy danh sách đơn, lọc theo trạng thái)
- Create: `src/app/api/orders/[id]/status/route.ts` (Cập nhật trạng thái đơn: Mới -> Đang làm -> Đang giao -> Xong / Hủy)
- Create: `src/components/admin/OrderCard.tsx` (Thẻ đơn hàng lớn, nút gọi điện thoại trực tiếp, chi tiết món/topping, badge SePay/COD, nút chuyển bước 1-chạm)
- Create: `src/app/admin/orders/page.tsx` (Giao diện tab lọc: Tất cả | Mới (badge đỏ) | Đang làm | Đang giao | Hoàn thành | Đã hủy)

- [ ] **Step 1: Viết API route xử lý đơn hàng và chuyển đổi trạng thái**
- [ ] **Step 2: Xây dựng giao diện thẻ đơn hàng to rõ, dễ thao tác ngón tay khi đang bận pha chế**
- [ ] **Step 3: Thêm bộ đếm đơn mới và thanh lọc nhanh**

---

### Task 7: Xây Dựng Tính Năng Quản Lý Người Dùng & Phân Quyền (Users Management)

**Files:**
- Create: `src/app/api/users/route.ts` (Lấy danh sách người dùng, thêm tài khoản nhân viên/quản lý)
- Create: `src/app/admin/users/page.tsx` (Giao diện danh sách người dùng, gắn thẻ Admin/Nhân viên/Khách)

- [ ] **Step 1: Viết API route quản lý tài khoản**
- [ ] **Step 2: Xây dựng giao diện quản lý tài khoản nhân viên và khách hàng**

---

### Task 8: Xây Dựng Cơ Chế Tải & Lưu Trữ Ảnh Cục Bộ (Local Upload API)

**Files:**
- Create: `src/app/api/upload/route.ts` (Nhận FormData từ điện thoại, lưu vào `./public/uploads/`, trả về static URL)

- [ ] **Step 1: Viết API `/api/upload` hỗ trợ upload file JPG, PNG, WebP trực tiếp từ điện thoại**
- [ ] **Step 2: Kiểm thử upload ảnh và hiển thị preview trực tiếp trên form thêm món**

---

### Task 9: Xây Dựng Trang Cài Đặt & Cấu Hình SePay Webhook

**Files:**
- Create: `src/app/api/settings/route.ts` (Lưu thông tin quán & API key SePay)
- Create: `src/app/api/webhook/sepay/route.ts` (Tiếp nhận webhook tự động từ SePay, khớp mã đơn và đổi trạng thái thành "ĐÃ THANH TOÁN")
- Create: `src/app/admin/settings/page.tsx` (Giao diện cấu hình quán & test kết nối SePay)

- [ ] **Step 1: Xây dựng API cấu hình quán và webhook SePay**
- [ ] **Step 2: Xây dựng trang Cài đặt trên điện thoại để quản trị viên nhập thông tin ngân hàng & SePay**

---

### Task 10: Xây Dựng Dashboard Tổng Quan & Kiểm Thử Toàn Diện (Windows & Ubuntu)

**Files:**
- Create: `src/app/admin/page.tsx` (Dashboard hiển thị doanh thu hôm nay, số đơn mới, món bán chạy, nút tắt/bật mở cửa quán nhanh)
- Test/Verify: Toàn bộ thao tác cảm ứng trên khung màn hình điện thoại (Chrome DevTools Mobile & thiết bị thực tế)

- [ ] **Step 1: Hoàn thiện Dashboard trang chủ Admin**
- [ ] **Step 2: Kiểm thử luồng thao tác: Thêm món -> Tải ảnh -> Bật tắt hết hàng -> Xem đơn hàng -> Chuyển trạng thái đơn -> Đổi quyền nhân viên**
- [ ] **Step 3: Kiểm tra build production `npm run build` đảm bảo hoạt động chuẩn xác trên cả Windows và Ubuntu**
