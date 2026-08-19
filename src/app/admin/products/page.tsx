"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Product, Category } from "@/lib/types";
import { ProductCardAdmin } from "@/components/admin/ProductCardAdmin";
import { ProductFormModal } from "@/components/admin/ProductFormModal";
import { BulkPriceAdjustmentModal } from "@/components/admin/BulkPriceAdjustmentModal";
import { AdminFilterSelect, FilterOption } from "@/components/admin/AdminFilterSelect";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "AVAILABLE" | "OUT_OF_STOCK">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);

  // Custom Confirm States
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteProductError, setDeleteProductError] = useState<string | null>(null);
  const [isSeedConfirmOpen, setIsSeedConfirmOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
      ]);

      if (prodRes.ok && catRes.ok) {
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        setProducts(prodData.products || []);
        setCategories(catData.categories || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const qNorm = removeVietnameseTones(searchQuery);

    return products.filter((p) => {
      const matchCategory =
        selectedCategory === "ALL" || p.categoryId === selectedCategory;
      const matchStock =
        stockFilter === "ALL" ||
        (stockFilter === "AVAILABLE" && p.isAvailable) ||
        (stockFilter === "OUT_OF_STOCK" && !p.isAvailable);
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        removeVietnameseTones(p.name).includes(qNorm) ||
        (p.description && (p.description.toLowerCase().includes(q) || removeVietnameseTones(p.description).includes(qNorm)));
      return matchCategory && matchStock && matchSearch;
    });
  }, [products, selectedCategory, stockFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = products.length;
    const available = products.filter((p) => p.isAvailable).length;
    const outOfStock = total - available;
    return { total, available, outOfStock };
  }, [products]);

  const categoryOptions: FilterOption[] = useMemo(() => {
    return [
      {
        id: "ALL",
        label: "Tất cả danh mục",
        count: products.length,
      },
      ...categories.map((cat) => ({
        id: cat.id,
        label: cat.name,
        count: products.filter((p) => p.categoryId === cat.id).length,
      })),
    ];
  }, [categories, products]);

  const stockOptions: FilterOption[] = useMemo(
    () => [
      {
        id: "ALL",
        label: "Tất cả trạng thái",
        count: stats.total,
        dotColor: "bg-neutral-800",
      },
      {
        id: "AVAILABLE",
        label: "Còn bán",
        count: stats.available,
        dotColor: "bg-emerald-600",
      },
      {
        id: "OUT_OF_STOCK",
        label: "Tạm hết",
        count: stats.outOfStock,
        dotColor: "bg-rose-600",
      },
    ],
    [stats]
  );

  const handleToggle = async (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isAvailable: !p.isAvailable } : p))
    );

    try {
      const res = await fetch(`/api/products/${id}/toggle`, { method: "POST" });
      if (!res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const handleDeleteClick = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (target) {
      setDeletingProduct(target);
      setDeleteProductError(null);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deletingProduct) return;

    try {
      setIsDeletingProduct(true);
      setDeleteProductError(null);
      const res = await fetch(`/api/products/${deletingProduct.id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
        showToast(`Đã xóa món "${deletingProduct.name}"`, "success");
        setDeletingProduct(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteProductError(data.message || "Xóa món thất bại. Vui lòng thử lại.");
        showToast(data.message || "Xóa món thất bại", "error");
      }
    } catch (err) {
      setDeleteProductError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
      showToast("Lỗi khi xóa món", "error");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (editingProduct) {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? data.product : p))
        );
      }
    } else {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts((prev) => [data.product, ...prev]);
      }
    }
  };

  const handleConfirmSeedMenu = async () => {
    try {
      setIsSeeding(true);
      const res = await fetch("/api/menu/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast("Đã nạp toàn bộ thực đơn Quán Nhung (48 món) thành công!", "success");
        setIsSeedConfirmOpen(false);
        await fetchData();
      } else {
        showToast(data.message || "Lỗi khi nạp menu", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối", "error");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Stats Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight uppercase">
              QUẢN LÝ MENU & MÓN
            </h1>
            <Badge variant="brand" size="sm">
              {stats.total} MÓN
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs font-bold text-neutral-600">
            <span className="text-emerald-700">
              ● Đang bán: {stats.available} món
            </span>
            <span className="text-rose-700">
              ● Tạm hết: {stats.outOfStock} món
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsBulkPriceModalOpen(true)}
            className="flex-1 md:flex-none text-xs sm:text-sm font-black uppercase tracking-wider bg-amber-50 text-amber-950 hover:bg-amber-100 border-amber-300 shadow-2xs"
            title="Tăng giá từng món hoặc toàn bộ menu"
          >
            ⚡ ĐIỀU CHỈNH GIÁ
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => setIsSeedConfirmOpen(true)}
            className="flex-1 md:flex-none text-xs sm:text-sm font-black uppercase tracking-wider bg-brand-50 text-brand-950 hover:bg-brand-100 border-brand-300 shadow-2xs"
            title="Nạp lại thực đơn chuẩn Quán Nhung (53 món)"
          >
            🔄 NẠP MENU NHUNG (53 MÓN)
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (categories.length === 0) {
                showToast("Vui lòng tạo ít nhất 1 Danh Mục trước khi thêm món!", "warning");
              }
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="flex-1 md:flex-none text-xs sm:text-sm font-black shadow-md tracking-wider uppercase bg-brand-900 hover:bg-brand-950 text-white"
          >
            + THÊM MÓN MỚI
          </Button>
        </div>
      </div>

      {/* Cảnh báo nếu chưa có danh mục nào */}
      {categories.length === 0 && !isLoading && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-amber-950 uppercase tracking-wider">
              QUÁN CHƯA CÓ DANH MỤC MÓN NÀO
            </p>
            <p className="text-xs text-amber-800 font-medium mt-0.5">
              Bạn nên tạo trước các nhóm danh mục như: <b>Trà Sữa, Bánh Ngọt, Đồ Ăn Vặt</b> để phân loại món.
            </p>
          </div>
          <Link href="/admin/categories">
            <Button
              variant="primary"
              size="sm"
              className="text-xs font-black uppercase bg-amber-800 text-white whitespace-nowrap"
            >
              + TẠO DANH MỤC NGAY →
            </Button>
          </Link>
        </div>
      )}

      {/* Search & Filter Controls Area */}
      {products.length > 0 && (
        <div className="bg-white rounded-3xl p-3.5 sm:p-5 border border-neutral-200 shadow-sm space-y-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên món ăn, đồ uống hoặc thành phần..."
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

          {/* Mobile & Tablet Filters (Dropdown / BottomSheet - NO Horizontal Scroll) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:hidden">
            {/* Category Dropdown */}
            <AdminFilterSelect
              label="Danh mục"
              title="DANH MỤC MÓN"
              subtitle="Chọn nhóm danh mục để lọc món"
              value={selectedCategory}
              options={categoryOptions}
              onChange={(val) => setSelectedCategory(val)}
            />

            {/* Stock Status Dropdown */}
            <AdminFilterSelect
              label="Trạng thái"
              title="TRẠNG THÁI BÁN"
              subtitle="Chọn trạng thái còn bán / tạm hết"
              value={stockFilter}
              options={stockOptions}
              onChange={(val) => setStockFilter(val as "ALL" | "AVAILABLE" | "OUT_OF_STOCK")}
            />
          </div>

          {/* Desktop Filters (Inline Tabs & Chips for >= 1024px) */}
          <div className="hidden lg:flex flex-col gap-3 pt-1">
            {/* Category Chips Bar */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap select-none">
                <span className="text-xs font-black text-neutral-400 uppercase tracking-wider mr-1">
                  Danh mục:
                </span>
                {categoryOptions.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3.5 py-1.5 rounded-2xl text-xs font-black uppercase transition-all border flex items-center gap-2 ${
                        isSelected
                          ? "bg-brand-900 text-white border-brand-900 shadow-sm"
                          : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Stock Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap select-none">
              <span className="text-xs font-black text-neutral-400 uppercase tracking-wider mr-1">
                Trạng thái:
              </span>
              {stockOptions.map((st) => {
                const isSelected = stockFilter === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => setStockFilter(st.id as "ALL" | "AVAILABLE" | "OUT_OF_STOCK")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? st.id === "AVAILABLE"
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                          : st.id === "OUT_OF_STOCK"
                          ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                          : "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                    }`}
                  >
                    <span>{st.label}</span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {st.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter State Summary Indicator */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs font-bold text-neutral-600">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="text-neutral-400 flex-shrink-0">Đang hiển thị:</span>
              <span className="text-brand-950 font-black truncate">
                {selectedCategory === "ALL"
                  ? "Tất cả danh mục"
                  : categories.find((c) => c.id === selectedCategory)?.name || "Danh mục"}
              </span>
              <span className="text-neutral-400">•</span>
              <span className="text-neutral-800 font-bold truncate">
                {stockFilter === "ALL"
                  ? "Tất cả trạng thái"
                  : stockFilter === "AVAILABLE"
                  ? "Còn bán"
                  : "Tạm hết"}
              </span>
              <span className="text-neutral-400">•</span>
              <span className="text-neutral-700 flex-shrink-0 font-extrabold">
                {filteredProducts.length} món
              </span>
              {searchQuery && (
                <span className="text-amber-800 font-medium truncate hidden sm:inline">
                  (từ khóa &ldquo;{searchQuery}&rdquo;)
                </span>
              )}
            </div>

            {(selectedCategory !== "ALL" || stockFilter !== "ALL" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  setStockFilter("ALL");
                  setSearchQuery("");
                }}
                className="text-xs text-brand-900 hover:text-brand-700 font-black uppercase underline flex-shrink-0 ml-2"
              >
                Đặt lại
              </button>
            )}
          </div>
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mb-3" />
          <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
            Đang tải dữ liệu món ăn...
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-neutral-200 space-y-3">
          <p className="text-base font-black text-neutral-900 uppercase">
            QUÁN CHƯA CÓ MÓN ĂN / ĐỒ UỐNG NÀO
          </p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto font-medium">
            Hãy bấm nút bên dưới để thêm món đầu tiên vào menu của quán (chụp/chọn ảnh, đặt giá và cấu hình topping).
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="text-xs font-black uppercase tracking-wider bg-brand-900 text-white shadow-sm mt-2"
          >
            + THÊM MÓN ĐẦU TIÊN
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-neutral-200">
          <p className="text-base font-extrabold text-neutral-800 uppercase">
            Không tìm thấy món ăn nào theo bộ lọc
          </p>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Hãy thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {filteredProducts.map((product) => (
            <ProductCardAdmin
              key={product.id}
              product={product}
              onEdit={(prod) => {
                setEditingProduct(prod);
                setIsModalOpen(true);
              }}
              onDelete={handleDeleteClick}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Modal / Bottom Sheet Thêm & Sửa Món */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
        categories={categories}
      />

      {/* Modal Điều Chỉnh Tăng Giá Hàng Loạt */}
      <BulkPriceAdjustmentModal
        isOpen={isBulkPriceModalOpen}
        onClose={() => setIsBulkPriceModalOpen(false)}
        products={products}
        categories={categories}
        onSuccess={fetchData}
      />

      {/* Custom Delete Product Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingProduct)}
        onClose={() => {
          if (!isDeletingProduct) {
            setDeletingProduct(null);
            setDeleteProductError(null);
          }
        }}
        onConfirm={handleConfirmDeleteProduct}
        title="Xóa món ăn / đồ uống?"
        message="Bạn có chắc chắn muốn xóa món này khỏi thực đơn của quán không?"
        highlightText={deletingProduct?.name}
        highlightLabel="TÊN MÓN ĂN"
        warningText="Hành động này không thể hoàn tác."
        confirmLabel="XÓA MÓN ĂN"
        cancelLabel="HỦY"
        variant="danger"
        isLoading={isDeletingProduct}
        errorMessage={deleteProductError}
      />

      {/* Custom Seed Menu Confirm Modal */}
      <ConfirmModal
        isOpen={isSeedConfirmOpen}
        onClose={() => {
          if (!isSeeding) {
            setIsSeedConfirmOpen(false);
          }
        }}
        onConfirm={handleConfirmSeedMenu}
        title="Nạp lại menu chuẩn Quán Nhung?"
        message="Hệ thống sẽ nạp lại toàn bộ 44 món đồ uống + 4 món topping chuẩn của Quán Nhung."
        highlightText="48 MÓN ĐỒ UỐNG & TOPPING"
        highlightLabel="DỮ LIỆU THỰC ĐƠN CHUẨN"
        warningText="Các món hiện tại sẽ được cập nhật đồng bộ."
        confirmLabel="ĐỒNG Ý NẠP MENU"
        cancelLabel="HỦY"
        variant="primary"
        isLoading={isSeeding}
      />
    </div>
  );
}
