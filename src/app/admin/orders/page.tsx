"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Order, OrderStatus } from "@/lib/types";
import { OrderCard } from "@/components/admin/OrderCard";
import { ReceiptModal } from "@/components/admin/ReceiptModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AdminFilterSelect, FilterOption } from "@/components/admin/AdminFilterSelect";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useRealtime } from "@/hooks/useRealtime";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreatingTestOrder, setIsCreatingTestOrder] = useState<boolean>(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Custom Delete Order Modal State
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { showToast, playDingSound } = useToast();

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Realtime Event Stream cho Admin (< 50ms)
  useRealtime({
    role: "admin",
    onOrderCreated: (newOrder) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === newOrder.id || o.orderCode === newOrder.orderCode)) {
          return prev;
        }
        return [newOrder, ...prev];
      });
      playDingSound?.();
      showToast(
        `🛎️ ĐƠN HÀNG MỚI #${newOrder.orderCode} - ${newOrder.customerName} (${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(newOrder.totalAmount)}) [${newOrder.paymentMethod === "COD" ? "Tiền mặt COD" : "Chuyển khoản Bank"}]`,
        "warning"
      );
    },
    onOrderStatusUpdated: (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    },
    onReconnect: () => {
      fetchOrders();
    },
  });

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 15000); // Polling dự phòng mỗi 15s
    return () => clearInterval(timer);
  }, []);

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    // Cập nhật UI tức thì
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, orderStatus: newStatus } : o))
    );

    try {
      await fetch(`/api/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error(err);
      fetchOrders();
    }
  };

  // Tạo đơn hàng thử nghiệm nhanh
  const handleCreateTestOrder = async () => {
    try {
      setIsCreatingTestOrder(true);
      const randomCode = Math.floor(10 + Math.random() * 90);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: `Khách Hàng Thử ${randomCode}`,
          customerPhone: "0908" + Math.floor(100000 + Math.random() * 900000),
          deliveryAddress: "Giao tận tay bàn số 3",
          note: "Uống liền, ít ngọt 50% đường",
          paymentMethod: "SEPAY_QR",
          totalAmount: 77000,
          items: [
            {
              productName: "Trà Sữa Oolong Nướng Trân Châu",
              quantity: 1,
              unitPrice: 43000,
              optionsNote: "Size L, 50% Đường, 70% Đá, Thêm Trân Châu Đen",
              totalPrice: 43000,
            },
            {
              productName: "Khoai Tây Lắc Phô Mai",
              quantity: 1,
              unitPrice: 34000,
              optionsNote: "Nóng giòn lắc phô mai",
              totalPrice: 34000,
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrders((prev) => [data.order, ...prev]);
        showToast(`Đã tạo đơn mới #${data.order.orderCode}!`, "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi tạo đơn thử", "error");
    } finally {
      setIsCreatingTestOrder(false);
    }
  };

  // Xóa đơn hàng thật sự khỏi database
  const handleDeleteOrder = async () => {
    if (!deletingOrder) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      const res = await fetch(`/api/orders/${deletingOrder.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Cập nhật danh sách đơn hàng tức thì trên UI
        setOrders((prev) => prev.filter((o) => o.id !== deletingOrder.id));
        showToast(`Đã xóa đơn hàng #${deletingOrder.orderCode} thành công!`, "success");
        setDeletingOrder(null);
      } else {
        setDeleteError(data.message || "Không thể xóa đơn hàng. Vui lòng thử lại.");
        showToast(data.message || "Lỗi khi xóa đơn hàng", "error");
      }
    } catch (err) {
      console.error("Lỗi xóa đơn hàng:", err);
      setDeleteError("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
      showToast("Không thể xóa đơn hàng. Vui lòng thử lại.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      new: orders.filter((o) => o.orderStatus === "NEW").length,
      preparing: orders.filter((o) => o.orderStatus === "PREPARING").length,
      delivering: orders.filter((o) => o.orderStatus === "DELIVERING").length,
      completed: orders.filter((o) => o.orderStatus === "COMPLETED").length,
      cancelled: orders.filter((o) => o.orderStatus === "CANCELLED").length,
    };
  }, [orders]);

  const statusOptions: FilterOption[] = useMemo(
    () => [
      {
        id: "ALL",
        label: "Tất cả",
        count: statusCounts.all,
        dotColor: "bg-brand-900",
      },
      {
        id: "NEW",
        label: "Mới nhận",
        count: statusCounts.new,
        dotColor: "bg-amber-500",
      },
      {
        id: "PREPARING",
        label: "Đang pha chế",
        count: statusCounts.preparing,
        dotColor: "bg-orange-500",
      },
      {
        id: "DELIVERING",
        label: "Đang giao",
        count: statusCounts.delivering,
        dotColor: "bg-sky-600",
      },
      {
        id: "COMPLETED",
        label: "Hoàn tất",
        count: statusCounts.completed,
        dotColor: "bg-emerald-600",
      },
      {
        id: "CANCELLED",
        label: "Đã hủy",
        count: statusCounts.cancelled,
        dotColor: "bg-neutral-600",
      },
    ],
    [statusCounts]
  );

  function removeVietnameseTones(str: string): string {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim();
  }

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const qNorm = removeVietnameseTones(searchQuery);

    return orders.filter((o) => {
      const matchStatus =
        selectedStatus === "ALL" || o.orderStatus === selectedStatus;
      const matchSearch =
        !q ||
        o.orderCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        removeVietnameseTones(o.customerName).includes(qNorm) ||
        o.customerPhone.includes(q);
      return matchStatus && matchSearch;
    });
  }, [orders, selectedStatus, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight uppercase">
              QUẢN LÝ ĐƠN HÀNG
            </h1>
            {statusCounts.new > 0 ? (
              <Badge variant="danger" size="sm" dot className="animate-pulse">
                {statusCounts.new} ĐƠN MỚI
              </Badge>
            ) : (
              <Badge variant="success" size="sm" dot>
                SẴN SÀNG
              </Badge>
            )}
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Xử lý và chuyển trạng thái đơn hàng theo thời gian thực (Cập nhật tự động)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            className="text-xs font-black uppercase shadow-2xs"
          >
            LÀM MỚI
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateTestOrder}
            isLoading={isCreatingTestOrder}
            className="text-xs font-black uppercase tracking-wider bg-brand-900 hover:bg-brand-950 text-white shadow-sm"
          >
            + TẠO ĐƠN THỬ
          </Button>
        </div>
      </div>

      {/* Search & Filter Controls Area */}
      <div className="bg-white rounded-3xl p-3.5 sm:p-5 border border-neutral-200 shadow-sm space-y-3">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo mã đơn (#DINO-...), số điện thoại hoặc tên khách..."
            className="w-full px-4 py-2.5 sm:py-3 rounded-2xl border border-neutral-300 text-neutral-900 font-bold placeholder:text-neutral-400 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs text-xs sm:text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400 hover:text-neutral-700 uppercase"
            >
              XÓA
            </button>
          )}
        </div>

        {/* Mobile Filter Trigger (Compact Dropdown / BottomSheet - NO Horizontal Scroll) */}
        <div className="lg:hidden">
          <AdminFilterSelect
            label="Trạng thái"
            title="TRẠNG THÁI ĐƠN HÀNG"
            subtitle="Chọn trạng thái đơn hàng để lọc"
            value={selectedStatus}
            options={statusOptions}
            onChange={(val) => setSelectedStatus(val)}
          />
        </div>

        {/* Desktop Filter Tabs (Inline Segmented Buttons for >= 1024px) */}
        <div className="hidden lg:flex items-center gap-2 flex-wrap select-none pt-1">
          {statusOptions.map((opt) => {
            const isSelected = selectedStatus === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedStatus(opt.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-black uppercase transition-all border flex items-center gap-2 ${
                  isSelected
                    ? "bg-brand-900 text-white border-brand-900 shadow-sm"
                    : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Filter State Summary Indicator */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-xs font-bold text-neutral-600">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="text-neutral-400 flex-shrink-0">Đang hiển thị:</span>
            <span className="text-brand-950 font-black truncate">
              {statusOptions.find((o) => o.id === selectedStatus)?.label || "Tất cả"}
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-700 flex-shrink-0 font-extrabold">
              {filteredOrders.length} đơn hàng
            </span>
            {searchQuery && (
              <span className="text-amber-800 font-medium truncate hidden sm:inline">
                (từ khóa &ldquo;{searchQuery}&rdquo;)
              </span>
            )}
          </div>

          {(selectedStatus !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStatus("ALL");
                setSearchQuery("");
              }}
              className="text-xs text-brand-900 hover:text-brand-700 font-black uppercase underline flex-shrink-0 ml-2"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Orders Grid */}
      {isLoading && orders.length === 0 ? (
        <div className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mb-3" />
          <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
            Đang tải dữ liệu đơn hàng...
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-neutral-200">
          <p className="text-base font-extrabold text-neutral-800 uppercase">
            Không có đơn hàng nào
          </p>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Các đơn mới sẽ tự động xuất hiện và phát âm thanh thông báo
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              onViewReceipt={(ord) => setSelectedReceiptOrder(ord)}
              onDelete={(ord) => {
                setDeletingOrder(ord);
                setDeleteError(null);
              }}
            />
          ))}
        </div>
      )}

      {/* Modal Xem & In Hóa Đơn */}
      <ReceiptModal
        isOpen={Boolean(selectedReceiptOrder)}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
      />

      {/* Modal Xác Nhận Xóa Đơn Hàng */}
      <ConfirmModal
        isOpen={Boolean(deletingOrder)}
        onClose={() => {
          if (!isDeleting) {
            setDeletingOrder(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleDeleteOrder}
        title="Xóa đơn hàng?"
        message="Bạn có chắc chắn muốn xóa đơn hàng này khỏi cơ sở dữ liệu không?"
        highlightText={deletingOrder ? `#${deletingOrder.orderCode}` : undefined}
        highlightLabel="Mã đơn hàng"
        warningText="Không thể hoàn tác sau khi xóa. Đơn hàng sẽ bị xóa hoàn toàn khỏi hệ thống để tránh dữ liệu rác."
        confirmLabel={isDeleting ? "Đang xóa..." : "Xóa đơn hàng"}
        cancelLabel="Hủy"
        variant="danger"
        isLoading={isDeleting}
        errorMessage={deleteError}
      />
    </div>
  );
}
