"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Order, OrderStatus } from "@/lib/types";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SepayQrPaymentModal } from "@/components/payment/SepayQrPaymentModal";
import { useToast } from "@/components/ui/Toast";
import { useRealtime } from "@/hooks/useRealtime";
import {
  Search,
  ArrowLeft,
  Copy,
  Check,
  Phone,
  Truck,
  Clock,
  MapPin,
  RefreshCw,
  ShoppingBag,
  AlertCircle,
  Share2,
} from "lucide-react";

const statusBadgeConfig: Record<
  OrderStatus,
  { label: string; variant: BadgeVariant; step: number; title: string; desc: string; color: string }
> = {
  NEW: {
    label: "ĐÃ NHẬN ĐƠN",
    variant: "danger",
    step: 1,
    title: "Đơn hàng đã được tiếp nhận",
    desc: "Quán đã nhận được đơn và đang chuẩn bị nguyên liệu xếp vào hàng pha chế.",
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
  PREPARING: {
    label: "ĐANG PHA CHẾ",
    variant: "warning",
    step: 2,
    title: "Đang pha trà & làm bánh tươi",
    desc: "Barista của Dino đang pha chế trà sữa theo đúng yêu cầu đường, đá, topping của bạn.",
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
  DELIVERING: {
    label: "ĐANG GIAO HÀNG",
    variant: "info",
    step: 3,
    title: "Tài xế đang trên đường giao đến bạn",
    desc: "Đơn hàng đã rời quán và đang được vận chuyển nhanh chóng (dự kiến 15-30 phút).",
    color: "text-sky-700 bg-sky-50 border-sky-200",
  },
  COMPLETED: {
    label: "GIAO THÀNH CÔNG",
    variant: "success",
    step: 4,
    title: "Đơn hàng đã hoàn tất!",
    desc: "🎉 Đơn hàng đã được giao thành công. Chúc bạn thưởng thức trà sữa ngon miệng!",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  CANCELLED: {
    label: "ĐÃ HỦY ĐƠN",
    variant: "neutral",
    step: 0,
    title: "Đơn hàng đã bị hủy",
    desc: "Đơn hàng này đã được hủy theo yêu cầu hoặc do sự cố.",
    color: "text-neutral-600 bg-neutral-100 border-neutral-200",
  },
};

function TrackingContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || searchParams.get("id") || "";
  const initialPhone = searchParams.get("phone") || "";
  const initialToken = searchParams.get("token") || "";

  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState<string>(initialCode || initialPhone || initialToken || "");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [selectedQrOrder, setSelectedQrOrder] = useState<Order | null>(null);

  // Cancel order modal state
  const [cancellingOrder, setCancellingOrder] = useState<{ id: string; code: string } | null>(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchOrders = useCallback(
    async (queryTerm?: string) => {
      try {
        setIsLoading(true);
        setHasSearched(true);
        let q = queryTerm !== undefined ? queryTerm.trim() : searchQuery.trim();

        // Nếu không truyền gì vào ô tìm kiếm, thử đọc từ LocalStorage
        if (!q && typeof window !== "undefined") {
          const rawCodes = localStorage.getItem("dino_guest_orders");
          const localPhone = localStorage.getItem("dino_guest_phone");
          if (rawCodes) {
            try {
              const arr = JSON.parse(rawCodes);
              if (Array.isArray(arr) && arr.length > 0) {
                q = arr[0];
                setSearchQuery(q);
              }
            } catch (e) {}
          } else if (localPhone) {
            q = localPhone;
            setSearchQuery(q);
          }
        }

        if (!q) {
          setOrders([]);
          setSelectedOrder(null);
          setIsLoading(false);
          return;
        }

        const res = await fetch(`/api/user/orders?query=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          const list: Order[] = data.orders || [];
          setOrders(list);
          if (list.length > 0) {
            setSelectedOrder(list[0]);
          } else {
            setSelectedOrder(null);
          }
        } else {
          setOrders([]);
          setSelectedOrder(null);
        }
      } catch (err) {
        console.error("Lỗi tra cứu đơn hàng:", err);
        showToast("Lỗi kết nối khi tra cứu đơn hàng", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, showToast]
  );

  // Lắng nghe Realtime SSE
  useRealtime({
    role: "customer",
    phone: selectedOrder?.customerPhone || (searchQuery.match(/^[0-9+]{8,12}$/) ? searchQuery : undefined),
    onOrderStatusUpdated: (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id || o.orderCode === updatedOrder.orderCode ? updatedOrder : o))
      );
      if (selectedOrder && (selectedOrder.id === updatedOrder.id || selectedOrder.orderCode === updatedOrder.orderCode)) {
        setSelectedOrder(updatedOrder);
        const statusCfg = statusBadgeConfig[updatedOrder.orderStatus];
        if (statusCfg) {
          showToast(`🔔 Đơn #${updatedOrder.orderCode}: ${statusCfg.title}`, "info");
        }
      }
    },
    onReconnect: () => {
      if (searchQuery) fetchOrders(searchQuery);
    },
  });

  useEffect(() => {
    fetchOrders(initialCode || initialPhone || initialToken || undefined);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      showToast("Vui lòng nhập SĐT hoặc Mã đơn", "warning");
      return;
    }
    fetchOrders(searchQuery.trim());
  };

  const handleCopyLink = () => {
    if (!selectedOrder || typeof window === "undefined") return;
    const url = `${window.location.origin}/don-hang?code=${encodeURIComponent(selectedOrder.orderCode)}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedLink(true);
        showToast(`Đã sao chép liên kết theo dõi đơn #${selectedOrder.orderCode}!`, "success");
        setTimeout(() => setCopiedLink(false), 2500);
      })
      .catch(() => {
        showToast("Không thể sao chép liên kết", "warning");
      });
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;
    try {
      setIsCancellingOrder(true);
      setCancelError(null);
      const res = await fetch(`/api/orders/${cancellingOrder.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (res.ok) {
        showToast(`Đã hủy thành công đơn hàng #${cancellingOrder.code}`, "success");
        setCancellingOrder(null);
        fetchOrders(searchQuery);
      } else {
        const data = await res.json().catch(() => ({}));
        setCancelError(data.message || "Không thể hủy đơn hàng.");
        showToast(data.message || "Lỗi khi hủy đơn hàng", "error");
      }
    } catch (err) {
      setCancelError("Lỗi kết nối máy chủ");
      showToast("Lỗi kết nối khi hủy đơn", "error");
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

  const currentStatusCfg = selectedOrder
    ? statusBadgeConfig[selectedOrder.orderStatus] || {
        label: selectedOrder.orderStatus,
        variant: "neutral" as BadgeVariant,
        step: 1,
        title: selectedOrder.orderStatus,
        desc: "",
        color: "text-neutral-700 bg-neutral-50 border-neutral-200",
      }
    : null;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-900 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-2xs safe-top">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-700 hover:text-brand-900 bg-neutral-100 hover:bg-neutral-200/80 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Menu Quán</span>
          </Link>

          <Link href="/" className="flex items-center gap-2 select-none group">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-900 to-brand-950 text-white flex items-center justify-center font-black text-sm shadow-2xs">
              🦕
            </div>
            <span className="font-black text-brand-950 text-sm sm:text-base tracking-tight uppercase">
              TRÀ SỮA DINO
            </span>
          </Link>

          <a
            href="tel:0858798206"
            className="inline-flex items-center gap-1 text-xs font-black text-brand-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95"
            title="Gọi Hotline hỗ trợ quán"
          >
            <Phone className="w-3.5 h-3.5 text-brand-900" />
            <span className="hidden xs:inline">Hotline:</span>
            <span>0858.798.206</span>
          </a>
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 w-full flex-1 space-y-4 sm:space-y-6">
        {/* Banner tiêu đề & Ô tìm kiếm */}
        <div className="bg-gradient-to-r from-[#2c1209] via-[#482017] to-[#2c1209] text-white p-4 sm:p-6 rounded-3xl shadow-md border border-brand-900/60 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight uppercase flex items-center gap-2">
                <span>🛵 THEO DÕI TIẾN ĐỘ ĐƠN HÀNG</span>
              </h1>
              <p className="text-xs sm:text-sm text-amber-200/90 font-medium mt-0.5">
                Tra cứu tức thì bằng Số điện thoại hoặc Mã đơn hàng (Không cần đăng nhập)
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchOrders(searchQuery)}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold text-amber-100 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-xl transition-colors select-none"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Cập nhật mới nhất</span>
            </button>
          </div>

          {/* Form tìm kiếm */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập SĐT nhận hàng hoặc Mã đơn (VD: 098... hoặc DINO-8801)"
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-white text-neutral-900 text-xs sm:text-sm font-bold placeholder:text-neutral-400 focus:outline-none focus:ring-3 focus:ring-amber-400 shadow-inner"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="bg-amber-400 hover:bg-amber-300 text-brand-950 font-black uppercase text-xs sm:text-sm px-4 sm:px-6 rounded-2xl shadow-md flex-shrink-0"
            >
              TRA CỨU
            </Button>
          </form>
        </div>

        {/* Danh sách tab chọn đơn nếu tìm thấy nhiều đơn cùng SĐT */}
        {orders.length > 1 && (
          <div className="bg-white p-2.5 rounded-2xl border border-neutral-200 shadow-2xs space-y-1.5">
            <div className="text-[11px] font-black uppercase text-neutral-500 px-1">
              Tìm thấy {orders.length} đơn hàng của bạn:
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {orders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                const statusCfg = statusBadgeConfig[ord.orderStatus];
                return (
                  <button
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`flex-shrink-0 text-left px-3 py-2 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? "bg-brand-950 text-white border-brand-950 shadow-sm"
                        : "bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200"
                    }`}
                  >
                    <div className="font-black">#{ord.orderCode}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{statusCfg?.label || ord.orderStatus}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CHI TIẾT ĐƠN HÀNG */}
        {isLoading ? (
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center shadow-sm space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-brand-700 border-t-transparent" />
            <p className="text-xs sm:text-sm font-bold text-neutral-500 uppercase">
              Đang tra cứu thông tin đơn hàng...
            </p>
          </div>
        ) : !selectedOrder ? (
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 sm:p-12 text-center shadow-sm space-y-3">
            <div className="text-4xl sm:text-5xl">🦕</div>
            <h3 className="text-base sm:text-lg font-black text-brand-950 uppercase">
              {hasSearched ? "Không tìm thấy đơn hàng nào" : "Chưa có đơn hàng nào để hiển thị"}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
              Vui lòng kiểm tra lại <b>Số điện thoại</b> hoặc <b>Mã đơn hàng</b> trong ô tìm kiếm phía trên, hoặc quay lại trang chủ để đặt ly trà sữa yêu thích của bạn nhé!
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-black text-xs uppercase shadow-sm transition-all active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Đặt Trà Sữa Ngay</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6">
            {/* Header thông tin mã đơn & Nút chia sẻ */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Mã đơn hàng:
                  </span>
                  <span className="text-base sm:text-xl font-black text-brand-950 font-mono">
                    #{selectedOrder.orderCode}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-neutral-500 font-medium mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Thời gian đặt: {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="text-xs font-bold rounded-xl border-neutral-200 text-neutral-700 hover:bg-neutral-100 flex items-center gap-1.5"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Đã chép link</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Chia sẻ đơn</span>
                    </>
                  )}
                </Button>

                {currentStatusCfg && (
                  <Badge variant={currentStatusCfg.variant} size="md" dot>
                    {currentStatusCfg.label}
                  </Badge>
                )}
              </div>
            </div>

            {/* TIẾN TRÌNH TRẠNG THÁI (STEPPER 4 BƯỚC) */}
            {selectedOrder.orderStatus !== "CANCELLED" ? (
              <div className="space-y-3 bg-neutral-50/80 p-4 sm:p-5 rounded-2xl border border-neutral-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-neutral-600 tracking-wider">
                    Tiến độ thực hiện
                  </span>
                  <span className="text-xs font-bold text-neutral-500 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-brand-700" />
                    <span>Giao nhanh 15-30p</span>
                  </span>
                </div>

                {/* Thanh tiến trình */}
                <div className="grid grid-cols-4 gap-1 sm:gap-2">
                  {[1, 2, 3, 4].map((stepNum) => {
                    const isActive = currentStatusCfg && currentStatusCfg.step >= stepNum;
                    const isCompleted = selectedOrder.orderStatus === "COMPLETED";
                    return (
                      <div
                        key={stepNum}
                        className={`h-2 sm:h-2.5 rounded-full transition-all duration-500 ${
                          isActive
                            ? isCompleted
                              ? "bg-emerald-600"
                              : stepNum === 3
                              ? "bg-sky-600"
                              : stepNum === 2
                              ? "bg-amber-500"
                              : "bg-rose-500"
                            : "bg-neutral-200"
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Các mốc text bên dưới */}
                <div className="grid grid-cols-4 text-center text-[10px] sm:text-xs font-bold text-neutral-400">
                  <span className={currentStatusCfg && currentStatusCfg.step >= 1 ? "text-rose-600 font-black" : ""}>
                    1. Nhận đơn
                  </span>
                  <span className={currentStatusCfg && currentStatusCfg.step >= 2 ? "text-amber-600 font-black" : ""}>
                    2. Pha chế
                  </span>
                  <span className={currentStatusCfg && currentStatusCfg.step >= 3 ? "text-sky-600 font-black" : ""}>
                    3. Đang giao
                  </span>
                  <span className={currentStatusCfg && currentStatusCfg.step >= 4 ? "text-emerald-600 font-black" : ""}>
                    4. Hoàn tất
                  </span>
                </div>

                {/* Box mô tả chi tiết trạng thái hiện tại */}
                <div className={`p-3 sm:p-3.5 rounded-xl border ${currentStatusCfg?.color} space-y-1`}>
                  <div className="font-black text-xs sm:text-sm">{currentStatusCfg?.title}</div>
                  <div className="text-[11px] sm:text-xs leading-relaxed opacity-90">
                    {currentStatusCfg?.desc}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-100 p-4 rounded-2xl border border-neutral-300 text-neutral-700 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                <div>
                  <div className="font-black text-sm">Đơn hàng này đã bị hủy</div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    Nếu có thắc mắc, vui lòng liên hệ hotline 0858.798.206 để được hỗ trợ.
                  </div>
                </div>
              </div>
            )}

            {/* THÔNG TIN NGƯỜI NHẬN & ĐỊA CHỈ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Box 1: Người nhận & Hotline */}
              <div className="bg-neutral-50 p-3.5 sm:p-4 rounded-2xl border border-neutral-200/80 space-y-2">
                <div className="text-xs font-black uppercase text-neutral-500 tracking-wider">
                  Thông tin khách hàng
                </div>
                <div className="text-xs sm:text-sm space-y-1">
                  <div>
                    <span className="font-bold text-neutral-900">👤 Họ tên:</span>{" "}
                    <span className="font-semibold text-neutral-800">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900">📞 Số điện thoại:</span>{" "}
                    <span className="font-mono font-bold text-neutral-900">{selectedOrder.customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Địa chỉ giao hàng & Ghi chú */}
              <div className="bg-neutral-50 p-3.5 sm:p-4 rounded-2xl border border-neutral-200/80 space-y-2">
                <div className="text-xs font-black uppercase text-neutral-500 tracking-wider">
                  Địa chỉ nhận hàng
                </div>
                <div className="text-xs sm:text-sm space-y-1">
                  <div className="flex items-start gap-1 text-neutral-800">
                    <MapPin className="w-3.5 h-3.5 text-brand-800 flex-shrink-0 mt-0.5" />
                    <span className="font-medium leading-tight">{selectedOrder.deliveryAddress}</span>
                  </div>
                  {selectedOrder.note && (
                    <div className="text-xs text-amber-800 italic pt-1 border-t border-neutral-200/60">
                      <b>Ghi chú:</b> {selectedOrder.note}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DANH SÁCH MÓN ĐÃ ĐẶT */}
            <div className="space-y-2.5">
              <div className="text-xs font-black uppercase text-neutral-500 tracking-wider">
                Chi tiết món ({selectedOrder.items.reduce((s, i) => s + i.quantity, 0)} món)
              </div>
              <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-100 overflow-hidden bg-white">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 sm:p-3.5 flex items-start justify-between gap-3 text-xs sm:text-sm">
                    <div className="space-y-1 min-w-0">
                      <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                        <span className="inline-block px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-950 font-black text-xs border border-brand-200">
                          {item.quantity}x
                        </span>
                        <span className="truncate">{item.productName}</span>
                      </div>
                      {item.optionsNote && (
                        <p className="text-[11px] text-neutral-500 font-medium pl-6 leading-tight">
                          {item.optionsNote}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-black text-neutral-900">{formatCurrency(item.totalPrice)}</div>
                      <div className="text-[10px] text-neutral-400 font-medium">
                        {formatCurrency(item.unitPrice)} / ly
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TỔNG KẾT THANH TOÁN & NÚT THAO TÁC */}
            <div className="bg-neutral-50 p-4 sm:p-5 rounded-2xl border border-neutral-200 space-y-3">
              <div className="space-y-1.5 text-xs sm:text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Tạm tính món:</span>
                  <span className="font-semibold text-neutral-800">
                    {formatCurrency(selectedOrder.subtotalAmount || selectedOrder.totalAmount)}
                  </span>
                </div>

                {selectedOrder.couponCode && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Mã giảm giá ({selectedOrder.couponCode}):</span>
                    <span>-{formatCurrency(selectedOrder.discountAmount || 0)}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-600">
                  <span>Hình thức thanh toán:</span>
                  <span className="font-bold text-neutral-900">
                    {selectedOrder.paymentMethod === "SEPAY_QR"
                      ? "Chuyển khoản Ngân hàng (SePay QR)"
                      : "Tiền mặt khi nhận hàng (COD)"}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
                  <span className="font-black text-neutral-900 text-sm sm:text-base">TỔNG THANH TOÁN:</span>
                  <span className="font-black text-base sm:text-xl text-brand-900">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="pt-2 border-t border-neutral-200/80 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  {selectedOrder.paymentMethod === "SEPAY_QR" ? (
                    selectedOrder.paymentStatus === "PAID" ? (
                      <Badge variant="success" size="md">
                        ✓ ĐÃ THANH TOÁN
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={() => setSelectedQrOrder(selectedOrder)}
                        className="bg-brand-900 hover:bg-brand-950 text-white text-xs font-black uppercase rounded-xl px-4 py-2.5 shadow-sm"
                      >
                        THANH TOÁN QR NGÂN HÀNG
                      </Button>
                    )
                  ) : (
                    <Badge variant="neutral" size="md">
                      💵 THANH TOÁN TIỀN MẶT KHI NHẬN (COD)
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedOrder.orderStatus === "NEW" && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        setCancellingOrder({
                          id: selectedOrder.id,
                          code: selectedOrder.orderCode,
                        })
                      }
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl px-3 py-2"
                    >
                      HỦY ĐƠN
                    </Button>
                  )}

                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold transition-all shadow-2xs active:scale-95"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Đặt thêm món</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. FOOTER */}
      <footer className="bg-white border-t border-neutral-200/80 py-4 px-3 text-center text-xs text-neutral-500">
        <p className="font-bold text-neutral-700">Trà Sữa &amp; Bánh Tươi Dino • 740 Triệu Quốc Đạt, Triệu Sơn, Thanh Hóa</p>
        <p className="text-[11px] text-neutral-400 mt-0.5">Hotline hỗ trợ khách hàng: 0858.798.206 (08:00 - 22:30)</p>
      </footer>

      {/* MODAL QR SEPAY NẾU ĐƠN CHƯA THANH TOÁN */}
      {selectedQrOrder && (
        <SepayQrPaymentModal
          isOpen={Boolean(selectedQrOrder)}
          onClose={() => setSelectedQrOrder(null)}
          orderCode={selectedQrOrder.orderCode}
          totalAmount={selectedQrOrder.totalAmount}
          onPaymentSuccess={() => {
            fetchOrders(selectedQrOrder.orderCode);
            showToast(`🎉 Đơn hàng #${selectedQrOrder.orderCode} đã được thanh toán thành công!`, "success");
          }}
        />
      )}

      {/* MODAL XÁC NHẬN HỦY ĐƠN */}
      <ConfirmModal
        isOpen={Boolean(cancellingOrder)}
        onClose={() => {
          if (!isCancellingOrder) {
            setCancellingOrder(null);
            setCancelError(null);
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
        errorMessage={cancelError}
      />
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
          <div className="text-center space-y-2">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-brand-700 border-t-transparent" />
            <p className="text-xs font-bold text-neutral-500 uppercase">Đang tải trang theo dõi đơn...</p>
          </div>
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
