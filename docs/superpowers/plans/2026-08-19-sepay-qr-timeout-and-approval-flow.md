# Kế Hoạch Triển Khai: Luồng Duyệt Đơn SePay QR Tự Động & Hết Hạn 5 Phút

> **Dành cho Agent/Kỹ sư:** Kế hoạch chi tiết từng bước (task-by-task) để hoàn thiện luồng thanh toán VietQR SePay: chỉ xuất đơn cho quán/Telegram khi SePay đã duyệt thanh toán thành công, đếm ngược 5 phút tự động hủy đơn và vô hiệu hóa mã QR nếu không thanh toán.

**Mục tiêu:** 
1. Đối với đơn `SEPAY_QR`: Chưa bắn đơn sang Telegram Admin/Pha chế khi mới tạo. Chỉ khi SePay nhận tiền và bắn Webhook thành công (`paymentStatus = PAID`), hệ thống mới chính thức duyệt đơn, gửi thông báo Telegram Admin và phát lệnh pha chế.
2. Thiết lập cơ chế đếm ngược 5 phút (300s): Nếu sau 5 phút khách không chuyển khoản, hệ thống tự động hủy đơn (`CANCELLED`), ẩn mã QR và thông báo hết hạn trên giao diện khách hàng.
3. Đối với đơn `COD`: Giữ nguyên luồng tạo đơn và thông báo Telegram ngay lập tức.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, SSE Realtime Hub, Telegram Bot API, SePay Webhook.

---

### Phân rã nhiệm vụ (Task Breakdown)

- **Task 1: Cập nhật luồng tạo đơn `POST /api/orders`**
  - Đơn `COD`: Bắn `notifyTelegramNewOrder` ngay lập tức như hiện tại.
  - Đơn `SEPAY_QR`: Tạo đơn với `orderStatus = "PENDING_PAYMENT"` hoặc `orderStatus = "NEW"` kèm `paymentStatus = "PENDING"`, **KHÔNG** bắn `notifyTelegramNewOrder` cho đến khi có Webhook.
  - Ghi nhận `expiresAt` (5 phút sau `createdAt`) vào Order.

- **Task 2: Nâng cấp Webhook Handler `src/lib/sepayWebhook.ts`**
  - Khi nhận tiền hợp lệ từ SePay:
    - Chuyển `order.paymentStatus = "PAID"`.
    - Chuyển `order.orderStatus = "NEW"` (nếu đang chờ thanh toán).
    - Bắn thông báo `notifyTelegramNewOrder` (với đầy đủ các nút bấm pha chế) + `notifyTelegramPaymentSuccess`.
    - Bắn sự kiện SSE Realtime tới Admin Dashboard để quán nhận đơn pha chế tức thì.
  - Nếu đơn đã quá 5 phút hoặc đã bị hủy trước đó: ghi log cảnh báo và xử lý hoàn tiền/đối soát nếu cần.

- **Task 3: Nâng cấp API kiểm tra thanh toán & tự động hủy đơn `GET /api/orders/[id]/payment-status`**
  - Tính toán `timeLeftSeconds` (thời gian còn lại trong 5 phút).
  - Nếu `now > expiresAt` (quá 5 phút) và `paymentStatus === "PENDING"`:
    - Tự động cập nhật `orderStatus = "CANCELLED"`, `paymentStatus = "CANCELLED"`.
    - Trả về `{ success: true, isExpired: true, paymentStatus: "CANCELLED", orderStatus: "CANCELLED", paid: false }`.

- **Task 4: Nâng cấp Giao diện Thanh toán `src/components/payment/SepayQrPaymentModal.tsx`**
  - Thêm đồng hồ đếm ngược trực quan `05:00` -> `00:00` với thanh tiến trình (progress bar).
  - Khi hết 5 phút (`timeLeft <= 0` hoặc API trả về `isExpired`):
    - Dừng polling ngay lập tức.
    - Ẩn hoàn toàn ảnh mã QR.
    - Hiển thị màn hình "❌ HẾT HẠN THANH TOÁN" kèm lý do an toàn và nút "Đặt lại đơn hàng mới" / "Đóng".

- **Task 5: Kiểm thử toàn diện & Verification**
  - Test Case 1: Đơn COD -> Telegram nhận ngay.
  - Test Case 2: Đơn SePay QR -> Telegram chưa nhận khi chưa trả tiền -> Webhook trả tiền -> Telegram nhận đơn ngay kèm trạng thái ĐÃ THANH TOÁN.
  - Test Case 3: Đơn SePay QR -> Chờ 5 phút không trả tiền -> QR biến mất, đơn tự động hủy.
  - Build test Next.js (`npm run build`).

---

### Task 1: Cập nhật luồng tạo đơn `POST /api/orders`

**Files:**
- Modify: `src/app/api/orders/route.ts`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Bổ sung trường `expiresAt` vào interface `Order` trong `src/lib/types.ts`**

```typescript
export interface Order {
  id: string;
  orderCode: string;
  trackingToken?: string;
  isGuest?: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  userId?: string;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  note?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotalAmount?: number;
  couponCode?: string;
  discountPercent?: number;
  discountAmount?: number;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  expiresAt?: string; // Thời hạn thanh toán (createdAt + 5 phút cho SEPAY_QR)
  updatedAt?: string;
  completedAt?: string;
}
```

- [ ] **Step 2: Cập nhật `POST /api/orders` để chỉ gửi Telegram khi là đơn COD**

Trong `src/app/api/orders/route.ts`:
- Nếu `paymentMethod === "SEPAY_QR"`, thiết lập `expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()`.
- Chỉ gọi `notifyTelegramNewOrder(newOrder)` nếu `paymentMethod === "COD"`. Đối với `SEPAY_QR`, hoãn thông báo cho đến khi SePay Webhook duyệt thanh toán thành công.

---

### Task 2: Nâng cấp Webhook Handler `src/lib/sepayWebhook.ts`

**Files:**
- Modify: `src/lib/sepayWebhook.ts`
- Modify: `src/lib/store.ts`

- [ ] **Step 1: Xử lý kích hoạt đơn hàng khi SePay duyệt thanh toán**

Trong `src/lib/sepayWebhook.ts`:
- Khi nhận được thanh toán hợp lệ cho đơn hàng `SEPAY_QR`:
  1. Cập nhật `paymentStatus = "PAID"`.
  2. Bắn thông báo `notifyTelegramNewOrder(order)` đến Telegram Bot với trạng thái "ĐÃ THANH TOÁN (SEPAY QR)" để nhân viên pha chế bắt đầu làm món.
  3. Bắn thông báo phụ `notifyTelegramPaymentSuccess(order, amount)`.
  4. Bắn sự kiện SSE Realtime `realtimeHub.emitOrderCreated(order)` hoặc `realtimeHub.emitOrderStatusUpdated(order)` để Admin Dashboard cập nhật tức thì.

---

### Task 3: Nâng cấp API `GET /api/orders/[id]/payment-status` & Tự động hủy đơn quá 5 phút

**Files:**
- Modify: `src/app/api/orders/[id]/payment-status/route.ts`
- Modify: `src/lib/store.ts`

- [ ] **Step 1: Thêm logic kiểm tra thời gian hết hạn trong `payment-status`**

- Tính thời gian còn lại:
  ```typescript
  const now = Date.now();
  const createdAtMs = new Date(order.createdAt).getTime();
  const expiresAtMs = order.expiresAt ? new Date(order.expiresAt).getTime() : createdAtMs + 5 * 60 * 1000;
  const timeLeftSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
  const isExpired = timeLeftSeconds <= 0 && order.paymentStatus === "PENDING";
  ```
- Nếu `isExpired === true`:
  - Cập nhật `order.orderStatus = "CANCELLED"`, `order.paymentStatus = "CANCELLED"`.
  - Lưu vào store.
  - Trả về `{ success: true, orderCode: order.orderCode, paymentStatus: "CANCELLED", orderStatus: "CANCELLED", isExpired: true, paid: false, timeLeftSeconds: 0 }`.

---

### Task 4: Nâng cấp Giao diện `SepayQrPaymentModal.tsx`

**Files:**
- Modify: `src/components/payment/SepayQrPaymentModal.tsx`

- [ ] **Step 1: Thêm đồng hồ đếm ngược 5 phút trực quan (MM:SS)**
- [ ] **Step 2: Xử lý trạng thái hết hạn `EXPIRED`**
  - Khi `timeLeft === 0` hoặc server báo `isExpired`:
    - Dừng polling.
    - Ẩn hoàn toàn ảnh QR.
    - Hiển thị card "❌ HẾT HẠN THANH TOÁN".
    - Thêm nút "Đặt lại đơn hàng" / "Đóng".

---

### Task 5: Kiểm thử và Xác nhận (Verification)

- [ ] **Step 1: Chạy kịch bản kiểm thử mô phỏng 3 luồng:**
  - Luồng 1: Đơn COD -> Có ngay trên Telegram.
  - Luồng 2: Đơn QR -> Chưa lên Telegram -> Bắn Webhook giả lập -> Lên Telegram ngay.
  - Luồng 3: Đơn QR -> Hết hạn 5 phút -> Tự hủy đơn, ẩn QR.
- [ ] **Step 2: Chạy `npm run build` kiểm tra toàn bộ project.**
- [ ] **Step 3: Commit và push lên GitHub.**
