"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Order, OrderStatus } from "@/lib/types";
import { BottomSheet } from "../ui/BottomSheet";
import { Badge, BadgeVariant } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ConfirmModal } from "../ui/ConfirmModal";
import { SepayQrPaymentModal } from "../payment/SepayQrPaymentModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "../ui/Toast";
import { useRealtime } from "@/hooks/useRealtime";
import { Copy, ExternalLink, Phone, Search, RefreshCw, X, Check } from "lucide-react";

interface UserOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserOrdersModal: React.FC<UserOrdersModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedQrOrder, setSelectedQrOrder] = useState<Order | null>(null);

  // Custom Cancel Confirm Modal State
  const [cancellingOrder, setCancellingOrder] = useState<{ id: string; code: string } | null>(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [cancelOrderError, setCancelOrderError] = useState<string | null>(null);
  
  // Search query state (phone or order code)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [savedGuestCodes, setSavedGuestCodes] = useState<string[]>([]);

  // Tải danh sách đơn lưu trên máy (LocalStorage)
  const loadSavedGuestCodes = useCallback(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("dino_guest_orders");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedGuestCodes(parsed);
          return parsed;
        }
      }
    } catch (e) {}
    return [];
  }, []);

  const fetchOrders = useCallback(async (customQuery?: string) => {
    try {
      setIsLoading(true);
      let queryParam = "";

      if (user?.email) {
        queryParam = `email=${encodeURIComponent(user.email)}`;
      } else if (user?.phone) {
        queryParam = `phone=${encodeURIComponent(user.phone)}`;
      } else {
        // Khách vãng lai
        const targetQ = customQuery !== undefined ? customQuery.trim() : searchQuery.trim();

        if (targetQ) {
          queryParam = `query=${encodeURIComponent(targetQ)}`;
        } else {
          // Tự động gom mã đơn & SĐT từ LocalStorage
          const localPhone = typeof window !== "undefined" ? localStorage.getItem("dino_guest_phone") || "" : "";
          const localCodes = loadSavedGuestCodes();

          if (localCodes.length > 0) {
            queryParam = `codes=${encodeURIComponent(localCodes.join(","))}`;
          } else if (localPhone.trim()) {
            queryParam = `phone=${encodeURIComponent(localPhone.trim())}`;
            if (!searchQuery) setSearchQuery(localPhone.trim());
          } else {
            setOrders([]);
            setIsLoading(false);
            return;
          }
        }
      }

      const res = await fetch(`/api/user/orders?${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user, searchQuery, loadSavedGuestCodes]);

  // Realtime SSE cập nhật tức thì
  useRealtime({
    role: "customer",
    userId: user?.id,
    phone: user?.phone || (searchQuery.match(/^[0-9+]{8,12}$/) ? searchQuery : undefined) || (typeof window !== "undefined" ? localStorage.getItem("dino_guest_phone") || undefined : undefined),
    onOrderStatusUpdated: (updatedOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === updatedOrder.id || o.orderCode === updatedOrder.orderCode);
        if (exists) {
          return prev.map((o) =>
            o.id === updatedOrder.id || o.orderCode === updatedOrder.orderCode ? updatedOrder : o
          );
        }
        return [updatedOrder, ...prev];
      });
    },
    onReconnect: () => {
      fetchOrders();
    },
  });

  useEffect(() => {
    if (isOpen) {
      loadSavedGuestCodes();
      fetchOrders();
    }
  }, [isOpen, user, loadSavedGuestCodes, fetchOrders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchOrders("");
  };

  const handleCopyTrackingLink = (orderCode: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/don-hang?code=${encodeURIComponent(orderCode)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(orderCode);
      showToast(`Đã sao chép link theo dõi đơn #${orderCode}!`, "success");
      setTimeout(() => setCopiedCode(null), 2500);
    }).catch(() => {
      showToast("Không thể sao chép liên kết", "warning");
    });
  };

  const handleCancelOrderClick = (orderId: string, orderCode: string) => {
    setCancellingOrder({ id: orderId, code: orderCode });
    setCancelOrderError(null);
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;

    try {
      setIsCancellingOrder(true);
      setCancelOrderError(null);
      const res = await fetch(`/api/orders/${cancellingOrder.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (res.ok) {
        showToast(`Đã hủy đơn hàng #${cancellingOrder.code}`, "success");
        setCancellingOrder(null);
        fetchOrders();
      } else {
        const data = await res.json().catch(() => ({}));
        setCancelOrderError(data.message || "Không thể hủy đơn hàng. Vui lòng thử lại.");
        showToast(data.message || "Lỗi khi hủy đơn hàng", "error");
      }
    } catch (err) {
      setCancelOrderError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
      showToast("Lỗi khi hủy đơn hàng", "error");
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const statusBadgeConfig: Record<
    OrderStatus,
    { label: string; variant: BadgeVariant; step: number; desc: string }
  > = {
    NEW: { label: "ĐÃ NHẬN ĐƠN", variant: "danger", step: 1, desc: "Quán đã nhận và đang chuẩn bị xếp hàng pha chế." },
    PREPARING: { label: "ĐANG PHA CHẾ", variant: "warning", step: 2, desc: "Nhân viên đang pha trà và nướng bánh tươi cho bạn." },
    DELIVERING: { label: "ĐANG GIAO HÀNG", variant: "info", step: 3, desc: "Tài xế đang giao đơn hàng đến địa chỉ của bạn (15-30p)." },
    COMPLETED: { label: "HOÀN TẤT", variant: "success", step: 4, desc: "🎉 Đơn hàng đã giao thành công! Cảm ơn bạn đã ủng hộ Trà Sữa Dino ❤️" },
    CANCELLED: { label: "ĐÃ HỦY", variant: "neutral", step: 0, desc: "Đơn hàng này đã bị hủy." },
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="THEO DÕI ĐƠN HÀNG"
      subtitle={user ? `Tài khoản: ${user.name || user.email}` : "Tra cứu không cần đăng nhập"}
      maxWidth="md"
      footer={
        <Button
          variant="outline"
          size="md"
          fullWidth
          onClick={onClose}
          className="text-xs font-black uppercase rounded-xl"
        >
          ĐÓNG
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Header toolbar & tra cứu */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-black text-neutral-500 uppercase tracking-wider">
            {user ? "ĐƠN HÀNG CỦA BẠN" : "LỊCH SỬ ĐẶT HÀNG"} ({orders.length})
          </span>
          <button
            onClick={() => fetchOrders()}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-900 hover:text-brand-950 transition-colors"
            title="Làm mới trạng thái đơn hàng"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Thanh tra cứu đa năng cho khách vãng lai & khách đã đăng nhập */}
        <form onSubmit={handleSearchSubmit} className="space-y-2">
          <div className="bg-neutral-50 p-2 rounded-2xl border border-neutral-200 flex items-center gap-2 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập SĐT hoặc Mã đơn (VD: 098... hoặc DINO-123)"
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="text-xs font-black uppercase bg-brand-900 text-white rounded-xl px-3.5 py-2 flex-shrink-0 shadow-2xs"
            >
              TRA CỨU
            </Button>
          </div>

          {/* Gợi ý mã đơn đã đặt gần đây trên thiết bị */}
          {!user && savedGuestCodes.length > 0 && !searchQuery && (
            <div className="flex items-center gap-1.5 flex-wrap px-1">
              <span className="text-[10px] font-bold text-neutral-400">Đã đặt gần đây:</span>
              {savedGuestCodes.slice(0, 4).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setSearchQuery(code);
                    fetchOrders(code);
                  }}
                  className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  #{code}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Danh sách đơn hàng */}
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-7 w-7 animate-spin rounded-full border-3 border-brand-600 border-t-transparent mb-2" />
            <p className="text-xs font-bold text-neutral-500 uppercase">
              Đang kiểm tra tiến độ đơn hàng...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5 p-4">
            <div className="text-3xl">🦕</div>
            <p className="text-sm font-black text-neutral-800 uppercase">
              CHƯA TÌM THẤY ĐƠN HÀNG NÀO
            </p>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
              Bạn có thể nhập <b>Số điện thoại đặt hàng</b> hoặc <b>Mã đơn (DINO-xxx)</b> vào ô tìm kiếm phía trên để tra cứu ngay nhé!
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            {orders.map((order) => {
              const statusCfg = statusBadgeConfig[order.orderStatus] || {
                label: order.orderStatus,
                variant: "neutral",
                step: 1,
                desc: "",
              };

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-2xs space-y-3 hover:border-brand-300 transition-all"
                >
                  {/* Progress Bar 4 bước */}
                  {order.orderStatus !== "CANCELLED" && (
                    <div className="space-y-1">
                      <div className="grid grid-cols-4 gap-1">
                        {[1, 2, 3, 4].map((s) => (
                          <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all ${
                              s <= statusCfg.step
                                ? order.orderStatus === "COMPLETED"
                                  ? "bg-emerald-600"
                                  : order.orderStatus === "DELIVERING"
                                  ? "bg-sky-600"
                                  : order.orderStatus === "PREPARING"
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                                : "bg-neutral-200"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-neutral-400 px-0.5">
                        <span className={statusCfg.step >= 1 ? "text-rose-600 font-black" : ""}>Nhận đơn</span>
                        <span className={statusCfg.step >= 2 ? "text-amber-600 font-black" : ""}>Pha chế</span>
                        <span className={statusCfg.step >= 3 ? "text-sky-600 font-black" : ""}>Đang giao</span>
                        <span className={statusCfg.step >= 4 ? "text-emerald-600 font-black" : ""}>Hoàn tất</span>
                      </div>
                    </div>
                  )}

                  {/* Header Đơn */}
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-brand-950 text-sm sm:text-base">
                          #{order.orderCode}
                        </span>
                        {/* Nút Copy link */}
                        <button
                          type="button"
                          onClick={() => handleCopyTrackingLink(order.orderCode)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                          title="Sao chép link theo dõi đơn hàng"
                        >
                          {copiedCode === order.orderCode ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-neutral-500" />
                              <span>Copy link</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-400 font-bold mt-0.5">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <Badge variant={statusCfg.variant} size="sm" dot>
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {/* Mô tả tiến trình hiện tại */}
                  <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700">
                    ℹ️ {statusCfg.desc}
                  </div>

                  {/* Địa chỉ giao hàng cụ thể & SĐT */}
                  <div className="text-xs text-neutral-600 space-y-1">
                    <div>
                      <span className="font-bold text-neutral-900">👤 Người nhận:</span>{" "}
                      {order.customerName} ({order.customerPhone})
                    </div>
                    <div>
                      <span className="font-bold text-neutral-900">📍 Địa chỉ giao:</span>{" "}
                      {order.deliveryAddress}
                    </div>
                    {order.note && (
                      <div className="text-neutral-500 italic">
                        <span className="font-bold text-neutral-700">📝 Ghi chú:</span> {order.note}
                      </div>
                    )}
                  </div>

                  {/* Danh sách món */}
                  <div className="space-y-1.5 text-xs pt-2 border-t border-neutral-100">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-bold text-neutral-900">
                            {item.quantity}x {item.productName}
                          </span>
                          {item.optionsNote && (
                            <p className="text-[11px] text-neutral-500 font-medium">
                              {item.optionsNote}
                            </p>
                          )}
                        </div>
                        <span className="font-black text-neutral-800 whitespace-nowrap">
                          {formatCurrency(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer Tổng tiền, Hủy đơn, Chi tiết & QR SePay */}
                  <div className="pt-2.5 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-neutral-500 block">
                        Tổng thanh toán:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm sm:text-base font-black text-brand-900">
                          {formatCurrency(order.totalAmount)}
                        </span>
                        {order.couponCode && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            🏷️ -{formatCurrency(order.discountAmount || 0)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Xem trang riêng */}
                      <a
                        href={`/don-hang?code=${encodeURIComponent(order.orderCode)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition-colors"
                        title="Mở toàn màn hình theo dõi đơn"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Trang riêng</span>
                      </a>

                      {/* Hủy đơn nếu còn mới */}
                      {order.orderStatus === "NEW" && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelOrderClick(order.id, order.orderCode)}
                          className="text-[11px] font-bold px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200"
                        >
                          HỦY ĐƠN
                        </Button>
                      )}

                      {/* Trạng thái thanh toán */}
                      {order.paymentMethod === "SEPAY_QR" ? (
                        order.paymentStatus === "PAID" ? (
                          <Badge variant="success" size="sm">
                            ĐÃ THANH TOÁN
                          </Badge>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectedQrOrder(order)}
                            className="text-xs font-black uppercase bg-brand-800 hover:bg-brand-900 text-white shadow-2xs"
                          >
                            THANH TOÁN QUA BANK
                          </Button>
                        )
                      ) : (
                        <Badge variant="neutral" size="sm">
                          💵 TIỀN MẶT (COD)
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hotline hỗ trợ nhanh */}
        <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-amber-700" />
            <span className="font-bold">Cần hỗ trợ đơn hàng khẩn cấp?</span>
          </div>
          <a
            href="tel:0858798206"
            className="font-black text-brand-950 underline hover:text-brand-800"
          >
            Hotline: 0858.798.206
          </a>
        </div>
      </div>

      {/* Modal Hiện QR SePay lại nếu đơn chưa thanh toán */}
      {selectedQrOrder && (
        <SepayQrPaymentModal
          isOpen={Boolean(selectedQrOrder)}
          onClose={() => setSelectedQrOrder(null)}
          orderCode={selectedQrOrder.orderCode}
          totalAmount={selectedQrOrder.totalAmount}
          onPaymentSuccess={() => {
            fetchOrders();
            showToast(`🎉 Đơn hàng #${selectedQrOrder.orderCode} đã được thanh toán thành công!`, "success");
          }}
        />
      )}

      {/* Custom Cancel Order Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(cancellingOrder)}
        onClose={() => {
          if (!isCancellingOrder) {
            setCancellingOrder(null);
            setCancelOrderError(null);
          }
        }}
        onConfirm={handleConfirmCancelOrder}
        title="Hủy đơn hàng?"
        message="Bạn có chắc chắn muốn hủy đơn hàng này không?"
        highlightText={cancellingOrder ? `#${cancellingOrder.code}` : undefined}
        highlightLabel="MÃ ĐƠN HÀNG"
        warningText="Đơn hàng sau khi hủy sẽ không thể khôi phục."
        confirmLabel="XÁC NHẬN HỦY ĐƠN"
        cancelLabel="ĐÓNG"
        variant="danger"
        isLoading={isCancellingOrder}
        errorMessage={cancelOrderError}
      />
    </BottomSheet>
  );
};
