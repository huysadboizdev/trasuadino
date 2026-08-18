"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Coupon } from "@/lib/types";
import { CouponModal } from "@/components/admin/CouponModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const { showToast } = useToast();

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải mã giảm giá:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggleActive = async (id: string, code: string) => {
    try {
      const res = await fetch(`/api/coupons/${id}/toggle`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
        );
        showToast(data.message, "success");
      } else {
        showToast(data.message || "Lỗi khi đổi trạng thái", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ", "error");
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${code}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        showToast(`Đã xóa mã giảm giá "${code}"`, "info");
      } else {
        showToast(data.message || "Lỗi khi xóa mã", "error");
      }
    } catch (err) {
      showToast("Lỗi khi xóa mã giảm giá", "error");
    }
  };

  const handleSave = async (couponData: Partial<Coupon>) => {
    if (editingCoupon) {
      const res = await fetch(`/api/coupons/${editingCoupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, "success");
        fetchCoupons();
      } else {
        throw new Error(data.message || "Cập nhật mã thất bại");
      }
    } else {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, "success");
        fetchCoupons();
      } else {
        throw new Error(data.message || "Tạo mã thất bại");
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép mã "${text}" vào bộ nhớ tạm`, "success");
  };

  const formatCurrency = (val?: number) => {
    if (!val) return "0đ";
    return new Intl.NumberFormat("vi-VN").format(val) + "đ";
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Check live status of coupon
  const getCouponStatus = (cpn: Coupon) => {
    if (!cpn.isActive) {
      return { label: "ĐÃ TẮT", variant: "neutral" as const };
    }
    const now = new Date().getTime();
    if (cpn.startDate && now < new Date(cpn.startDate).getTime()) {
      return { label: "CHƯA BẮT ĐẦU", variant: "warning" as const };
    }
    if (cpn.endDate && now > new Date(cpn.endDate).getTime()) {
      return { label: "HẾT HẠN", variant: "danger" as const };
    }
    if (cpn.usageLimit && cpn.usageLimit > 0 && cpn.usageCount >= cpn.usageLimit) {
      return { label: "HẾT LƯỢT DÙNG", variant: "danger" as const };
    }
    return { label: "ĐANG ÁP DỤNG", variant: "success" as const };
  };

  const filteredCoupons = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return coupons.filter((c) => {
      const matchSearch =
        !q ||
        c.code.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q));

      const matchStatus =
        filterStatus === "ALL" ||
        (filterStatus === "ACTIVE" && c.isActive) ||
        (filterStatus === "INACTIVE" && !c.isActive);

      return matchSearch && matchStatus;
    });
  }, [coupons, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.isActive).length;
    const totalUsed = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
    return { total, active, totalUsed };
  }, [coupons]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-brand-900 text-white flex items-center justify-center font-black text-xl shadow-xs">
            🏷️
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-brand-950 tracking-tight uppercase">
              QUẢN LÝ MÃ GIẢM GIÁ
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
              Cài đặt khuyến mãi giảm % theo ngày, theo giờ hoặc bật/tắt linh hoạt
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setEditingCoupon(null);
            setIsModalOpen(true);
          }}
          className="text-xs sm:text-sm font-black shadow-md tracking-wider uppercase bg-brand-900 hover:bg-brand-950 text-white"
        >
          + TẠO MÃ GIẢM GIÁ MỚI
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Tổng số mã
            </p>
            <p className="text-2xl sm:text-3xl font-black text-brand-950 mt-1">
              {stats.total}
            </p>
          </div>
          <span className="text-3xl">🎟️</span>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Đang hoạt động
            </p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {stats.active}
            </p>
          </div>
          <span className="text-3xl">🟢</span>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Lượt khách đã dùng
            </p>
            <p className="text-2xl sm:text-3xl font-black text-brand-800 mt-1">
              {stats.totalUsed}
            </p>
          </div>
          <span className="text-3xl">🛍️</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Tìm theo mã voucher hoặc mô tả..."
            className="w-full px-4 py-2.5 rounded-2xl border border-neutral-300 text-xs sm:text-sm font-bold placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400 hover:text-neutral-700"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "ACTIVE", label: "Đang bật" },
            { id: "INACTIVE", label: "Đã tắt" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as typeof filterStatus)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                filterStatus === tab.id
                  ? "bg-brand-900 text-white border-brand-900 shadow-2xs font-black"
                  : "bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table / Grid List */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-2" />
          <p className="text-xs text-neutral-500 font-bold">Đang tải danh sách mã giảm giá...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-neutral-200 space-y-3">
          <p className="text-base font-black text-neutral-800 uppercase">
            Chưa có mã giảm giá nào
          </p>
          <p className="text-xs text-neutral-500 font-medium max-w-sm mx-auto">
            Hãy tạo các mã khuyến mãi theo % (ví dụ: DINO10, DINO20) để kích cầu và tri ân khách hàng!
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingCoupon(null);
              setIsModalOpen(true);
            }}
            className="bg-brand-900 hover:bg-brand-950 text-white font-black text-xs uppercase"
          >
            + TẠO MÃ ĐẦU TIÊN
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCoupons.map((cpn) => {
            const status = getCouponStatus(cpn);
            return (
              <div
                key={cpn.id}
                className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all duration-200 shadow-2xs flex flex-col justify-between hover:shadow-md ${
                  cpn.isActive
                    ? "border-neutral-200 hover:border-brand-300"
                    : "border-neutral-200 bg-neutral-50/70 opacity-80"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Code Badge + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-base sm:text-lg tracking-wider text-brand-950 bg-amber-100/80 border border-amber-300 px-3 py-1 rounded-xl">
                        {cpn.code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(cpn.code)}
                        className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs transition-colors"
                        title="Sao chép mã"
                      >
                        📋
                      </button>
                    </div>

                    <Badge variant={status.variant} size="sm" dot>
                      {status.label}
                    </Badge>
                  </div>

                  {/* Discount percentage banner */}
                  <div className="bg-rose-50 border border-rose-200/80 p-2.5 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-800">
                      Mức giảm giá:
                    </span>
                    <span className="text-lg font-black text-rose-600">
                      -{cpn.discountPercent}%
                    </span>
                  </div>

                  {/* Description */}
                  {cpn.description && (
                    <p className="text-xs text-neutral-600 font-medium leading-relaxed">
                      {cpn.description}
                    </p>
                  )}

                  {/* Conditions Details */}
                  <div className="text-xs space-y-1.5 pt-2 border-t border-neutral-100 text-neutral-600 font-medium">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Đơn tối thiểu:</span>
                      <span className="font-bold text-neutral-800">
                        {cpn.minOrderAmount ? formatCurrency(cpn.minOrderAmount) : "Không yêu cầu"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Giảm tối đa:</span>
                      <span className="font-bold text-neutral-800">
                        {cpn.maxDiscountAmount ? formatCurrency(cpn.maxDiscountAmount) : "Không giới hạn"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Lượt sử dụng:</span>
                      <span className="font-bold text-neutral-800">
                        {cpn.usageCount || 0}
                        {cpn.usageLimit ? ` / ${cpn.usageLimit} lượt` : " lượt (vô hạn)"}
                      </span>
                    </div>

                    {(cpn.startDate || cpn.endDate) && (
                      <div className="pt-1 text-[11px] space-y-0.5 bg-neutral-50 p-2 rounded-xl border border-neutral-200">
                        {cpn.startDate && (
                          <p className="text-neutral-500">
                            🕒 Từ: <b>{formatDateTime(cpn.startDate)}</b>
                          </p>
                        )}
                        {cpn.endDate && (
                          <p className="text-neutral-500">
                            ⌛ Đến: <b>{formatDateTime(cpn.endDate)}</b>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions: Toggle Active + Edit / Delete */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <Switch
                    checked={cpn.isActive}
                    onChange={() => handleToggleActive(cpn.id, cpn.code)}
                    labelRight={cpn.isActive ? "Đang Bật" : "Đang Tắt"}
                  />

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCoupon(cpn);
                        setIsModalOpen(true);
                      }}
                      className="text-xs font-black px-2.5 py-1"
                    >
                      SỬA
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(cpn.id, cpn.code)}
                      className="text-xs font-black bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-2.5 py-1"
                    >
                      XÓA
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tạo & Sửa Coupon */}
      <CouponModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCoupon(null);
        }}
        onSave={handleSave}
        coupon={editingCoupon}
      />
    </div>
  );
}
