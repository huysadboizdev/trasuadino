"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardStats, Order } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [ordersRes, prodsRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/products"),
      ]);

      if (ordersRes.ok && prodsRes.ok) {
        const ordersData = await ordersRes.json();
        const prodsData = await prodsRes.json();
        const orders: Order[] = ordersData.orders || [];

        const today = new Date().toDateString();
        const todayOrders = orders.filter(
          (o) => new Date(o.createdAt).toDateString() === today
        );
        const todayRevenue = todayOrders
          .filter(
            (o) => o.paymentStatus === "PAID" && o.orderStatus !== "CANCELLED"
          )
          .reduce((sum, o) => sum + o.totalAmount, 0);

        setStats({
          todayRevenue,
          todayOrdersCount: todayOrders.length,
          newOrdersCount: orders.filter((o) => o.orderStatus === "NEW").length,
          preparingOrdersCount: orders.filter((o) => o.orderStatus === "PREPARING").length,
          deliveringOrdersCount: orders.filter((o) => o.orderStatus === "DELIVERING").length,
          completedOrdersCount: orders.filter((o) => o.orderStatus === "COMPLETED").length,
          outOfStockProductsCount: (prodsData.products || []).filter(
            (p: { isAvailable: boolean }) => !p.isAvailable
          ).length,
        });

        setRecentOrders(orders.slice(0, 6));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleQuickAcceptOrder = async (orderId: string, orderCode: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PREPARING" }),
      });
      if (res.ok) {
        showToast(`Đã nhận đơn #${orderCode} và chuyển cho quầy pha chế!`, "success");
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight uppercase">
              TỔNG QUAN HÔM NAY
            </h1>
            <Badge variant="success" size="sm" dot className="animate-pulse">
              LIVE POS
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Bảng điều khiển theo dõi doanh thu và tiến độ vận hành quán
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            className="text-xs font-black uppercase shadow-2xs"
          >
            LÀM MỚI
          </Button>
          <Link href="/admin/orders">
            <Button
              variant="primary"
              size="sm"
              className="text-xs font-black uppercase tracking-wider bg-brand-900 hover:bg-brand-950 text-white shadow-sm"
            >
              VÀO BẾP & XỬ LÝ ĐƠN →
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isLoading && !stats ? (
        <div className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mb-3" />
          <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
            Đang tải dữ liệu tổng quan...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: Doanh thu */}
          <div className="bg-white rounded-3xl p-3.5 sm:p-6 border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase text-neutral-400 tracking-wider truncate">
              DOANH THU HÔM NAY
            </p>
            <p className="text-base sm:text-xl lg:text-2xl font-black text-emerald-700 mt-1.5 sm:mt-2 tracking-tight truncate">
              {formatCurrency(stats?.todayRevenue || 0)}
            </p>
            <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-500 font-bold">
              <span>Số đơn:</span>
              <span className="text-neutral-900 font-black">{stats?.todayOrdersCount || 0} đơn</span>
            </div>
          </div>

          {/* Card 2: Đơn mới chờ làm */}
          <div className="bg-white rounded-3xl p-3.5 sm:p-6 border border-rose-200 bg-rose-50/20 shadow-sm flex flex-col justify-between hover:border-rose-400 transition-all min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-[10px] sm:text-[11px] font-black uppercase text-rose-700 tracking-wider truncate">
                ĐƠN MỚI CẦN LÀM
              </p>
              {(stats?.newOrdersCount || 0) > 0 && (
                <span className="flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-rose-600 animate-ping flex-shrink-0" />
              )}
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-rose-600 mt-1.5 sm:mt-2">
              {stats?.newOrdersCount || 0}
            </p>
            <Link
              href="/admin/orders"
              className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-rose-200/60 text-[10px] sm:text-[11px] font-black uppercase text-rose-800 underline truncate"
            >
              Nhận pha chế ngay →
            </Link>
          </div>

          {/* Card 3: Đang làm & Giao */}
          <div className="bg-white rounded-3xl p-3.5 sm:p-6 border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase text-amber-800 tracking-wider truncate">
              ĐANG LÀM / GIAO
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-700 mt-1.5 sm:mt-2">
              {(stats?.preparingOrdersCount || 0) + (stats?.deliveringOrdersCount || 0)}
            </p>
            <p className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-neutral-100 text-[10px] sm:text-[11px] text-neutral-500 font-bold truncate">
              {stats?.preparingOrdersCount} làm • {stats?.deliveringOrdersCount} giao
            </p>
          </div>

          {/* Card 4: Món tạm hết */}
          <div className="bg-white rounded-3xl p-3.5 sm:p-6 border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-brand-300 transition-all min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase text-neutral-400 tracking-wider truncate">
              MÓN TẠM HẾT HÀNG
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-800 mt-1.5 sm:mt-2">
              {stats?.outOfStockProductsCount || 0}
            </p>
            <Link
              href="/admin/products"
              className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-neutral-100 text-[10px] sm:text-[11px] font-black uppercase text-brand-900 underline truncate"
            >
              Xem và bật mở lại →
            </Link>
          </div>
        </div>
      )}

      {/* Quick Action Navigation Grid */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200 shadow-sm space-y-3">
        <p className="text-xs font-black uppercase text-neutral-400 tracking-wider">
          LỐI TẮT QUẢN TRỊ 1-CHẠM
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
          <Link
            href="/admin/orders"
            className="flex flex-col items-center justify-center p-3.5 sm:p-4 bg-brand-50 hover:bg-brand-100 text-brand-950 font-black text-xs rounded-2xl border border-brand-200 uppercase tracking-tight text-center transition-all active:scale-98"
          >
            <span className="text-sm sm:text-base font-black mb-0.5 sm:mb-1 text-brand-800">
              {stats?.newOrdersCount || 0}
            </span>
            <span className="truncate w-full px-0.5">QUẢN LÝ ĐƠN HÀNG</span>
          </Link>
          <Link
            href="/admin/products"
            className="flex flex-col items-center justify-center p-3.5 sm:p-4 bg-neutral-50 hover:bg-neutral-100 text-neutral-900 font-black text-xs rounded-2xl border border-neutral-200 uppercase tracking-tight text-center transition-all active:scale-98"
          >
            <span className="text-sm sm:text-base font-black mb-0.5 sm:mb-1 text-neutral-700">
              MENU
            </span>
            <span className="truncate w-full px-0.5">MÓN & TOPPING</span>
          </Link>
          <Link
            href="/admin/categories"
            className="flex flex-col items-center justify-center p-3.5 sm:p-4 bg-neutral-50 hover:bg-neutral-100 text-neutral-900 font-black text-xs rounded-2xl border border-neutral-200 uppercase tracking-tight text-center transition-all active:scale-98"
          >
            <span className="text-sm sm:text-base font-black mb-0.5 sm:mb-1 text-neutral-700">
              NHÓM
            </span>
            <span className="truncate w-full px-0.5">DANH MỤC MÓN</span>
          </Link>
          <Link
            href="/admin/settings"
            className="flex flex-col items-center justify-center p-3.5 sm:p-4 bg-neutral-50 hover:bg-neutral-100 text-neutral-900 font-black text-xs rounded-2xl border border-neutral-200 uppercase tracking-tight text-center transition-all active:scale-98"
          >
            <span className="text-sm sm:text-base font-black mb-0.5 sm:mb-1 text-neutral-700">
              QR
            </span>
            <span className="truncate w-full px-0.5">CÀI ĐẶT & SEPAY</span>
          </Link>
        </div>
      </div>

      {/* Live Orders Ticker Feed */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200 shadow-sm space-y-4 min-w-0">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <h2 className="text-xs sm:text-base font-black text-neutral-900 uppercase tracking-tight truncate">
              TIẾN ĐỘ ĐƠN MỚI NHẤT
            </h2>
            <Badge variant="brand" size="sm" className="hidden xs:inline-flex">
              LIVE
            </Badge>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-black uppercase text-brand-900 underline hover:text-brand-700 flex-shrink-0"
          >
            Xem tất cả ({stats?.todayOrdersCount || recentOrders.length}) →
          </Link>
        </div>

        <div className="divide-y divide-neutral-100 min-w-0">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs min-w-0"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2">
                  <span className="font-black text-brand-950 text-xs sm:text-sm">
                    #{order.orderCode}
                  </span>
                  <span className="font-extrabold text-neutral-900 text-xs sm:text-sm truncate">
                    {order.customerName}
                  </span>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="text-[11px] font-bold text-emerald-700 underline"
                  >
                    {order.customerPhone}
                  </a>
                </div>
                <p className="text-xs text-neutral-600 font-medium mt-1 truncate">
                  {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                <div className="text-left sm:text-right">
                  <p className="font-black text-neutral-900 text-xs sm:text-sm">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <p className="text-[10px] font-black uppercase text-neutral-400">
                    {order.paymentMethod === "SEPAY_QR" ? "VietQR SePay" : "Tiền mặt COD"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Badge
                    variant={
                      order.orderStatus === "NEW"
                        ? "danger"
                        : order.orderStatus === "COMPLETED"
                        ? "success"
                        : order.orderStatus === "PREPARING"
                        ? "warning"
                        : "info"
                    }
                    size="sm"
                    className="text-[10px] sm:text-xs"
                  >
                    {order.orderStatus === "NEW"
                      ? "MỚI"
                      : order.orderStatus === "COMPLETED"
                      ? "HOÀN TẤT"
                      : order.orderStatus === "PREPARING"
                      ? "ĐANG LÀM"
                      : "ĐANG GIAO"}
                  </Badge>

                  {order.orderStatus === "NEW" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleQuickAcceptOrder(order.id, order.orderCode)}
                      className="text-xs font-black px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      NHẬN ĐƠN
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
