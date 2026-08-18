# Thiết Kế Chi Tiết: Trang Quản Trị Mobile-First (Admin Web) - Trà Sữa, Bánh & Đồ Ăn Vặt

**Ngày tạo:** 2026-08-17  
**Dự án:** Web bán hàng Trà Sữa Dino (Trà sữa, Bánh ngọt, Ăn vặt)  
**Phạm vi hiện tại:** Giai đoạn 1 - Xây dựng toàn bộ hệ thống Trang Quản Trị (Admin Portal) tối ưu cho điện thoại di động (Mobile-First), tối giản icon, tập trung trải nghiệm cảm ứng một tay, hỗ trợ upload ảnh cục bộ và cấu hình sẵn tích hợp SePay.

---

## 1. Mục Tiêu & Yêu Cầu Cốt Lõi

1. **Mobile-First nhưng Responsive Toàn Diện (Mobile, Tablet, Desktop):** 
   - Ưu tiên cao nhất cho trải nghiệm cảm ứng 1 tay trên điện thoại di động (thao tác 1-chạm, nút to, thanh điều hướng đáy).
   - Đồng thời **tự động thích ứng mượt mà trên Tablet và Laptop/PC**: Trên màn hình lớn, giao diện tự động chuyển thành dạng lưới đa cột (Grid), thanh điều hướng chuyển thành Sidebar / Header cố định, mở Modal cửa sổ nổi thay vì Bottom Sheet, chia cột danh sách đơn và chi tiết đơn song song, giữ tỷ lệ vàng, không bị co giãn vỡ layout hay trống trải xấu xí.
2. **Tối Giản Icon (Minimal Icons):** Hạn chế tối đa các biểu tượng rườm rà trên mọi kích thước màn hình. Sử dụng **Typography (chữ in rõ ràng)**, **Badge màu sắc phân loại** và **Nút bấm trực quan** để tạo cảm giác tinh gọn, hiện đại và không bị rối mắt.
3. **Các Chức Năng Quản Trị Cốt Lõi:**
   - **Quản lý Món Ăn & Đồ Uống:** Thêm, sửa, xóa, tìm kiếm, gạt công tắc bật/tắt nhanh "Còn hàng / Tạm hết", cấu hình Topping, Size và Tùy chọn đường/đá.
   - **Quản lý Danh Mục:** Quản lý nhóm Trà Sữa, Bánh Ngọt, Ăn Vặt, Topping...
   - **Quản lý Đơn Hàng:** Xem chi tiết đơn hàng, lọc theo trạng thái (Mới, Đang làm, Đang giao, Hoàn thành, Hủy), bấm gọi điện cho khách hàng, nút chuyển bước xử lý 1-chạm, xem trạng thái thanh toán SePay / Tiền mặt.
   - **Quản lý Người Dùng & Nhân Viên:** Danh sách người dùng, phân quyền Admin / Nhân viên.
   - **Cài Đặt Cửa Hàng & SePay:** Cấu hình thông tin quán, kết nối Webhook SePay VietQR.
4. **Lưu Trữ Hình Ảnh:** Tải ảnh từ thư viện/camera điện thoại và lưu trữ trực tiếp vào thư mục máy chủ cục bộ (`/public/uploads/`).
5. **Khả Năng Chạy Cross-Platform:** Hoạt động độc lập và hoàn hảo trên cả Windows và Ubuntu Server/Linux thông qua Next.js & Node.js.

---

## 2. Kiến Trúc Hệ Thống & Cấu Trúc Thư Mục

Dự án sử dụng **Next.js App Router** kết hợp **Tailwind CSS** và **Prisma ORM (SQLite / In-Memory State)**.

```
d:/trasuadino/
├── prisma/
│   └── schema.prisma              # Định nghĩa dữ liệu (User, Category, Product, Order...)
├── public/
│   └── uploads/                   # Thư mục lưu trữ ảnh tải lên từ điện thoại
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── layout.tsx         # Layout Admin Mobile (Header + Bottom Navigation Bar)
│   │   │   ├── page.tsx           # Dashboard thống kê nhanh gọn
│   │   │   ├── orders/
│   │   │   │   └── page.tsx       # Quản lý đơn hàng (Tabs lọc trạng thái, thẻ đơn hàng lớn)
│   │   │   ├── products/
│   │   │   │   └── page.tsx       # Quản lý món ăn, đồ uống (Bật/tắt còn hết 1-chạm)
│   │   │   ├── categories/
│   │   │   │   └── page.tsx       # Quản lý danh mục nhóm món
│   │   │   ├── users/
│   │   │   │   └── page.tsx       # Quản lý người dùng & phân quyền nhân viên
│   │   │   └── settings/
│   │   │       └── page.tsx       # Cài đặt quán & cấu hình kết nối SePay
│   │   ├── api/
│   │   │   ├── upload/route.ts    # API upload ảnh lưu local vào public/uploads
│   │   │   ├── products/route.ts  # API CRUD món ăn
│   │   │   ├── categories/route.ts# API CRUD danh mục
│   │   │   ├── orders/route.ts    # API xử lý đơn hàng & đổi trạng thái
│   │   │   └── webhook/sepay/route.ts # Webhook tiếp nhận thanh toán SePay
│   │   └── globals.css            # Style toàn trang, typography tối giản
│   ├── components/
│   │   ├── admin/
│   │   │   ├── MobileHeader.tsx   # Header tối giản, hiển thị trạng thái quán
│   │   │   ├── MobileBottomNav.tsx# Thanh điều hướng dạng Tab chữ cố định đáy màn hình
│   │   │   ├── OrderCard.tsx      # Thẻ đơn hàng to rõ, nút bấm chuyển trạng thái
│   │   │   ├── ProductCardAdmin.tsx # Thẻ món ăn có nút gạt Còn/Hết
│   │   │   └── ProductModal.tsx   # Modal/Bottom Sheet thêm/sửa món & chọn ảnh từ máy
│   │   └── ui/                    # Các nút bấm, Badge trạng thái, Switch toggles
│   └── lib/
│       ├── prisma.ts              # Khởi tạo kết nối Prisma Client
│       └── mock-data.ts           # Dữ liệu khởi tạo mẫu để test tính năng ngay
└── package.json
```

---

## 3. Thiết Kế UI/UX Responsive Đa Thiết Bị (Mobile, Tablet & Desktop)

### A. Chiến Lược Bố Cục Thích Ứng (Responsive Strategy)
| Thiết bị | Bố cục Điều Hướng | Danh Sách Món (Menu) | Màn Hình Đơn Hàng | Hộp Thoại / Form |
| :--- | :--- | :--- | :--- | :--- |
| **Điện Thoại (< 768px)** | Thanh Bottom Nav 5 tab chữ cố định đáy | 1 Cột thẻ lớn, cuộn dọc 1 tay | 1 Cột thẻ đơn to, nút gọi điện thoại nhanh | Bottom Sheet trượt từ đáy lên |
| **Máy Tính Bảng (768px - 1024px)** | Header cố định + Tab bar ngang | Lưới 2 cột cân đối | Lưới 2 cột thẻ đơn hàng | Modal cửa sổ nổi căn giữa |
| **Máy Tính / Laptop (>= 1024px)** | Sidebar cố định bên trái sang trọng | Lưới 3 - 4 cột sản phẩm kèm bộ lọc bên | Chia đôi màn hình: Cột trái danh sách đơn - Cột phải chi tiết đơn & in hóa đơn | Modal Popup rộng rãi, form 2 cột |

### B. Thanh Điều Hướng Đa Nền Tảng (Navigation)
- **Trên Mobile:** Thanh Tab Bar dạng chữ cố định đáy màn hình (`[ Đơn Hàng ]`, `[ Menu Món ]`, `[ Danh Mục ]`, `[ Tài Khoản ]`, `[ Cài Đặt ]`).
- **Trên Desktop & Tablet:** Tự động chuyển thành **Sidebar bên trái** hoặc **Top Bar cố định** với logo chữ **"DINO ADMIN"**, trạng thái quán và menu rõ ràng, không làm loãng không gian.

### C. Màn Hình Quản Lý Đơn Hàng (Orders Management)
- **Thanh Lọc Trạng Thái (Filter Pills):** Cuộn ngang mượt mà:
  `Tất cả` | `Mới nhận (3)` | `Đang làm` | `Đang giao` | `Hoàn thành` | `Đã hủy`
- **Thẻ Đơn Hàng (Order Card):**
  - Hàng trên: Mã đơn `#DINO-101` • Thời gian đặt (VD: `10 phút trước`).
  - Thông tin khách: Tên khách hàng + SĐT (Nút bấm màu xanh `[ Gọi Khách ]` mở trực tiếp ứng dụng gọi điện).
  - Chi tiết món:
    - *2x Trà Sữa Oolong Nướng (Size L, 50% Đường, 70% Đá, Trân Châu Đen)*
    - *1x Bánh Mì Phô Mai Chảy*
  - Badge Thanh Toán:
    - `[ ĐÃ THANH TOÁN SEPAY ]` (Nền xanh lá, chữ trắng đậm).
    - `[ THU TIỀN MẶT KHI GIAO ]` (Nền cam vàng, chữ đậm).
  - Tổng tiền: Hiển thị lớn, dễ nhìn (VD: `85.000 đ`).
  - **Nút Hành Động 1-Chạm:**
    - Đơn mới: Nút to `[ Nhận Đơn & Pha Chế ]` và nút phụ `[ Hủy Đơn ]`.
    - Đang làm: Nút `[ Giao Cho Khách / Shipper ]`.
    - Đang giao: Nút `[ Hoàn Thành Đơn ]`.

### C. Màn Hình Quản Lý Món Ăn & Đồ Uống (Products Management)
- Nút trên cùng: `[ + Thêm Món Mới ]` nổi bật.
- Thanh tìm kiếm và bộ lọc danh mục theo chữ.
- **Thẻ Món Ăn:**
  - Ảnh đại diện món (Tỉ lệ 1:1, góc bo nhẹ).
  - Tên món, Danh mục phân loại, Giá bán (VD: `32.000 đ`).
  - **Nút Chuyển Đổi Trạng Thái 1-Chạm:** Nút gạt Toggle to rõ:
    - Trạng thái `[ Đang Bán ]` (Màu xanh).
    - Trạng thái `[ Tạm Hết Hàng ]` (Màu đỏ xám).
  - Nút bấm `[ Chỉnh Sửa ]` và `[ Xóa ]`.
- **Bottom Sheet Thêm / Chỉnh Sửa Món:**
  - Nút `[ Chọn Ảnh Từ Điện Thoại ]` (mở thư viện ảnh hoặc máy ảnh).
  - Ô nhập Tên món, Giá bán, Danh mục (Dropdown danh sách).
  - Cấu hình Tùy chọn (Size M/L, Topping đi kèm, Mức đường/đá).
  - Nút lưu to bản `[ Lưu Thay Đổi ]`.

### D. Màn Hình Quản Lý Danh Mục (Categories Management)
- Danh sách các danh mục: Trà Sữa, Bánh Ngọt, Trà Trái Cây, Đồ Ăn Vặt, Topping.
- Thao tác: Thêm danh mục mới, Đổi tên, Thay đổi thứ tự hiển thị, Bật/Tắt hiển thị ngoài menu.

### E. Màn Hình Quản Lý Người Dùng & Phân Quyền (Users Management)
- Danh sách tài khoản: Tên, Số điện thoại, Vai trò (`Chủ Quán / Admin`, `Nhân Viên Pha Chế / Staff`, `Khách Hàng`).
- Thêm mới tài khoản nhân viên nhanh chóng.

### F. Màn Hình Cài Đặt & Cấu Hình SePay (Settings)
- Thông tin quán: Tên quán, SĐT hotline, Địa chỉ, Lời chào.
- Cấu hình SePay: Mã Token API SePay, Số tài khoản ngân hàng thụ hưởng, Mã QR VietQR mẫu để kiểm tra.

---

## 4. Cơ Chế Lưu Trữ File Ảnh Cục Bộ (Local Image Upload)

1. Khi Admin chọn ảnh từ điện thoại, Frontend gửi `FormData` chứa file ảnh đến API route `/api/upload`.
2. API route kiểm tra định dạng (JPG, PNG, WebP) và lưu file vào thư mục `/public/uploads/`.
3. Tên file được tự động gán uuid ngẫu nhiên kèm timestamp để tránh trùng lặp.
4. Trả về đường dẫn tĩnh `/uploads/ten-file.webp` để lưu vào thông tin món ăn và hiển thị trên toàn hệ thống.

---

## 5. Quy Trình Xác Thực & Triển Khai (Deployment)

*   **Chạy cục bộ:** Khởi động dự án Next.js (`npm run dev`) trên cổng `3000`.
*   **Chạy trên Windows:** `npm run build && npm start`.
*   **Chạy trên Ubuntu VPS:** Dùng PM2 quản lý tiến trình (`pm2 start npm --name "trasua-admin" -- start`).
