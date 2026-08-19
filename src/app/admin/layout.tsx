"use client";

import React, { useState, useEffect, useRef } from "react";
import { MobileHeader } from "@/components/admin/MobileHeader";
import { MobileBottomNav } from "@/components/admin/MobileBottomNav";
import { DesktopSidebar } from "@/components/admin/DesktopSidebar";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { useToast } from "@/components/ui/Toast";
import { useRealtime } from "@/hooks/useRealtime";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOrdersCountRef = useRef(0);
  const { showToast, playDingSound } = useToast();

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        const newOrders = data.orders?.filter(
          (o: { orderStatus: string }) => o.orderStatus === "NEW"
        ) || [];
        const currentCount = newOrders.length;
        setNewOrdersCount(currentCount);
        prevOrdersCountRef.current = currentCount;
      }
    } catch (err) {
      console.error("Lỗi khi tải thông tin đơn hàng:", err);
    }
  };

  // Realtime listener cho toàn bộ Admin pages
  useRealtime({
    role: "admin",
    onOrderCreated: (newOrder) => {
      setNewOrdersCount((prev) => prev + 1);
      if (soundEnabled) {
        playDingSound();
      }
      showToast(
        `🛎️ ĐƠN HÀNG MỚI #${newOrder.orderCode} - ${newOrder.customerName} (${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(newOrder.totalAmount)}) [${newOrder.paymentMethod === "COD" ? "Tiền mặt COD" : "VietQR"}]`,
        "warning"
      );
    },
    onOrderStatusUpdated: () => {
      fetchStatus();
    },
    onReconnect: () => {
      fetchStatus();
    },
  });

  // Lấy cài đặt quán ban đầu
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.isOpen !== undefined) {
          setIsOpen(data.settings.isOpen);
        }
      })
      .catch((err) => console.error(err));

    fetchStatus();
  }, []);

  const handleToggleStoreOpen = async (openState: boolean) => {
    setIsOpen(openState);
    showToast(
      openState ? "Đã bật: Quán đang nhận đơn" : "Đã chuyển sang: Tạm đóng cửa nghỉ bán",
      openState ? "success" : "info"
    );
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: openState }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#f8f6f2] text-neutral-900 flex flex-col md:flex-row min-w-0">
      {/* Sidebar CỐ ĐỊNH 100% BÊN TRÁI CHO DESKTOP */}
      <DesktopSidebar
        isOpen={isOpen}
        onToggleStoreOpen={handleToggleStoreOpen}
        newOrdersCount={newOrdersCount}
      />

      {/* Vùng nội dung chính bên phải */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-y-auto pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
        {/* Header cho Điện Thoại */}
        <MobileHeader isOpen={isOpen} />

        {/* Nội dung trang */}
        <main className="flex-1 p-2.5 sm:p-4 md:p-5 lg:p-7 xl:p-8 max-w-[1920px] w-full mx-auto min-w-0">
          {children}
        </main>

        {/* Thanh điều hướng đáy cho Điện Thoại */}
        <MobileBottomNav newOrdersCount={newOrdersCount} />
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthGuard>
  );
}
