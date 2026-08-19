"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Coupon, Category, Product } from "@/lib/types";
import { CouponModal } from "@/components/admin/CouponModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [filterType, setFilterType] = useState<"ALL" | "PERCENT" | "FIXED_AMOUNT">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Custom Delete Confirm Modal State
  const [deletingCoupon, setDeletingCoupon] = useState<{ id: string; code: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { showToast } = useToast();

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const [couponRes, catRes, prodRes] = await Promise.all([
        fetch("/api/coupons", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/products", { cache: "no-store" }),
      ]);

      if (couponRes.ok) {
        const data = await couponRes.json();
        setCoupons(data.coupons || []);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
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

  const handleDeleteClick = (id: string, code: string) => {
    setDeletingCoupon({ id, code });
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCoupon) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);
      const res = await fetch(`/api/coupons/${deletingCoupon.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== deletingCoupon.id));
        showToast(`Đã xóa mã giảm giá "${deletingCoupon.code}"`, "success");
        setDeletingCoupon(null);
      } else {
        setDeleteError(data.message || "Không thể xóa mã giảm giá. Vui lòng thử lại.");
        showToast(data.message || "Lỗi khi xóa mã", "error");
      }
    } catch (err) {
      setDeleteError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
      showToast("Lỗi khi xóa mã giảm giá", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (couponData: Partial<Coupon>) => {
    if (editingCoupon) {
      const res = await fetch(`/api/coupons/${editingCoupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json; charset=utf-8" },
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
        headers: { "Content-Type": "application/json; charset=utf-8" },
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

      const type = c.discountType || "PERCENT";
      const matchType = filterType === "ALL" || type === filterType;

      return matchSearch && matchStatus && matchType;
    });
  }, [coupons, searchQuery, filterStatus, filterType]);

  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.isActive).length;
    const totalUsed = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
    const fixedCoupons = coupons.filter((c) => c.discountType === "FIXED_AMOUNT").length;
    const percentCoupons = total - fixedCoupons;
    return { total, active, totalUsed, fixedCoupons, percentCoupons };
  }, [coupons]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-brand-900 text-white flex items-center justify-center font-black text-xl shadow-xs">
            🎟️
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-brand-950 tracking-tight uppercase">
              HỆ THỐNG MÃ GIẢM GIÁ & VOUCHER
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
              Cấu hình voucher Shopee-Style: Giảm %, Giảm cố định, Điều kiện đơn, Lịch sử mua & Khách hàng
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

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-2xs">
          <p className="text-[11px] font-black uppercase text-neutral-400">TỔNG VOUCHER</p>
          <p className="text-xl sm:text-2xl font-black text-brand-950 mt-1">{stats.total}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Chương trình khuyến mãi</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-2xs">
          <p className="text-[11px] font-black uppercase text-emerald-600">ĐANG HOẠT ĐỘNG</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{stats.active}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Khách hàng có thể dùng</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-2xs">
          <p className="text-[11px] font-black uppercase text-brand-700">LƯỢT ĐÃ SỬ DỤNG</p>
          <p className="text-xl sm:text-2xl font-black text-brand-900 mt-1">{stats.totalUsed}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Đơn hàng áp dụng thành công</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-2xs">
          <p className="text-[11px] font-black uppercase text-rose-600">CƠ CẤU VOUCHER</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              {stats.percentCoupons} mã %
            </span>
            <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              {stats.fixedCoupons} mã tiền
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Đa dạng hình thức giảm</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Tìm theo mã code hoặc mô tả..."
            className="w-full pl-3.5 pr-8 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 hover:text-neutral-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {/* Status Tabs */}
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "ACTIVE", label: "Đang bật" },
            { id: "INACTIVE", label: "Đang tắt" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as typeof filterStatus)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                filterStatus === tab.id
                  ? "bg-brand-900 text-white shadow-2xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          ))}

          <span className="text-neutral-300">|</span>

          {/* Type Tabs */}
          {[
            { id: "ALL", label: "Mọi loại" },
            { id: "PERCENT", label: "% Giảm" },
            { id: "FIXED_AMOUNT", label: "Tiền cố định" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as typeof filterType)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === tab.id
                  ? "bg-rose-600 text-white shadow-2xs font-black"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table / Grid List */}
      {isLoading ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-neutral-200 shadow-2xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-2" />
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Đang tải danh sách mã giảm giá...
          </p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="py-12 px-4 text-center bg-white rounded-3xl border border-neutral-200 shadow-2xs space-y-3">
          <span className="text-4xl block">🎟️</span>
          <p className="text-sm font-black text-neutral-800 uppercase">
            Không tìm thấy mã giảm giá nào
          </p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {searchQuery || filterStatus !== "ALL" || filterType !== "ALL"
              ? "Hãy thử tìm kiếm từ khóa khác hoặc đặt lại bộ lọc"
              : "Hãy tạo mã voucher đầu tiên để bắt đầu chương trình khuyến mãi cho quán nhé!"}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
          {filteredCoupons.map((cpn) => {
            const status = getCouponStatus(cpn);
            const isPercent = (cpn.discountType || "PERCENT") === "PERCENT";

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

                  {/* Discount Banner */}
                  <div className="bg-rose-50 border border-rose-200/80 p-2.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider block">
                        {isPercent ? "GIẢM THEO PHẦN TRĂM" : "GIẢM TIỀN CỐ ĐỊNH"}
                      </span>
                      <span className="text-xs text-rose-700 font-medium">
                        {isPercent && cpn.maxDiscountAmount
                          ? `Tối đa ${formatCurrency(cpn.maxDiscountAmount)}`
                          : "Áp dụng vào đơn"}
                      </span>
                    </div>
                    <span className="text-lg sm:text-xl font-black text-rose-600">
                      {isPercent
                        ? `-${cpn.discountValue ?? cpn.discountPercent}%`
                        : `-${formatCurrency(cpn.discountValue)}`}
                    </span>
                  </div>

                  {/* Description */}
                  {cpn.description && (
                    <p className="text-xs text-neutral-600 font-medium leading-relaxed line-clamp-2">
                      {cpn.description}
                    </p>
                  )}

                  {/* Conditions Details (Shopee-Style Rule Badges) */}
                  <div className="text-xs space-y-1.5 pt-2 border-t border-neutral-100 text-neutral-600 font-medium">
                    {/* Đơn tối thiểu */}
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Đơn tối thiểu:</span>
                      <span className="font-bold text-neutral-800">
                        {cpn.minOrderAmount ? formatCurrency(cpn.minOrderAmount) : "Không yêu cầu"}
                      </span>
                    </div>

                    {/* Số đơn hoàn thành */}
                    {cpn.minCompletedOrders ? (
                      <div className="flex items-center justify-between">
                        <span className="text-amber-700 font-bold">Đã hoàn thành:</span>
                        <span className="font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                          ≥ {cpn.minCompletedOrders} đơn
                        </span>
                      </div>
                    ) : null}

                    {/* Tổng chi tiêu tích lũy */}
                    {cpn.minTotalSpent ? (
                      <div className="flex items-center justify-between">
                        <span className="text-amber-700 font-bold">Chi tiêu tích lũy:</span>
                        <span className="font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                          ≥ {formatCurrency(cpn.minTotalSpent)}
                        </span>
                      </div>
                    ) : null}

                    {/* Nhóm khách hàng */}
                    {cpn.customerScope && cpn.customerScope !== "ALL" ? (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Đối tượng:</span>
                        <span className="font-bold text-emerald-700 text-[11px]">
                          {cpn.customerScope === "NEW_CUSTOMERS"
                            ? "Chỉ khách mới"
                            : "Chỉ khách thân thiết"}
                        </span>
                      </div>
                    ) : null}

                    {/* Phạm vi áp dụng món */}
                    {cpn.applyScope && cpn.applyScope !== "ALL" ? (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Phạm vi món:</span>
                        <span className="font-bold text-indigo-700 text-[11px]">
                          {cpn.applyScope === "CATEGORIES"
                            ? `${cpn.applicableCategoryIds?.length || 0} danh mục`
                            : `${cpn.applicableProductIds?.length || 0} món cụ thể`}
                        </span>
                      </div>
                    ) : null}

                    {/* Lượt dùng toàn hệ thống & mỗi khách */}
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Lượt dùng:</span>
                      <span className="font-bold text-neutral-800">
                        {cpn.usageCount || 0}
                        {cpn.usageLimit ? ` / ${cpn.usageLimit}` : " (vô hạn)"} •{" "}
                        <span className="text-brand-900 font-black">{cpn.usagePerUser || 1} lần/khách</span>
                      </span>
                    </div>

                    {/* Thời gian hiệu lực */}
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
                      onClick={() => handleDeleteClick(cpn.id, cpn.code)}
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
        categories={categories}
        products={products}
      />

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingCoupon)}
        onClose={() => {
          if (!isDeleting) {
            setDeletingCoupon(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa mã giảm giá?"
        message="Bạn có chắc chắn muốn xóa mã giảm giá này không?"
        highlightText={deletingCoupon?.code}
        highlightLabel="MÃ GIẢM GIÁ (VOUCHER)"
        warningText="Hành động này không thể hoàn tác."
        confirmLabel="XÓA MÃ GIẢM GIÁ"
        cancelLabel="HỦY"
        variant="danger"
        isLoading={isDeleting}
        errorMessage={deleteError}
      />
    </div>
  );
}
