"use client";

import React, { useState, useEffect, useRef } from "react";
import { MobileHeader } from "@/components/admin/MobileHeader";
import { MobileBottomNav } from "@/components/admin/MobileBottomNav";
import { DesktopSidebar } from "@/components/admin/DesktopSidebar";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { useToast } from "@/components/ui/Toast";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOrdersCountRef = useRef(0);
  const { showToast, playDingSound } = useToast();

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
  }, []);

  // Lấy danh sách đơn định kỳ để kiểm tra đơn mới
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          const newOrders = data.orders?.filter(
            (o: { orderStatus: string }) => o.orderStatus === "NEW"
          ) || [];
          const currentCount = newOrders.length;

          if (currentCount > prevOrdersCountRef.current && prevOrdersCountRef.current > 0) {
            if (soundEnabled) {
              playDingSound();
            }
            showToast(`Bạn có ${currentCount} đơn hàng mới cần chuẩn bị!`, "warning");
          }

          prevOrdersCountRef.current = currentCount;
          setNewOrdersCount(currentCount);
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin đơn hàng:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [soundEnabled, playDingSound, showToast]);

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
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-y-auto pb-20 md:pb-8">
        {/* Header cho Điện Thoại */}
        <MobileHeader isOpen={isOpen} />

        {/* Nội dung trang */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
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
