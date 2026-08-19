"use client";

import React, { useState, useEffect } from "react";
import { Category, Product } from "@/lib/types";
import { CategoryModal } from "@/components/admin/CategoryModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Custom Delete Confirm Modal State
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [catRes, prodRes] = await Promise.all([
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/products", { cache: "no-store" }),
      ]);

      if (catRes.ok && prodRes.ok) {
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        setCategories(catData.categories || []);
        setProducts(prodData.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleActive = async (cat: Category) => {
    const nextState = !cat.isActive;
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, isActive: nextState } : c))
    );

    try {
      await fetch(`/api/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextState }),
      });
      showToast(
        nextState ? `Đã hiển thị danh mục: ${cat.name}` : `Đã ẩn danh mục: ${cat.name}`,
        "info"
      );
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const handleDeleteClick = (cat: Category) => {
    setDeletingCategory(cat);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);
      const res = await fetch(`/api/categories/${deletingCategory.id}`, { method: "DELETE" });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
        showToast(`Đã xóa danh mục "${deletingCategory.name}"`, "success");
        setDeletingCategory(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.message || "Không thể xóa danh mục. Vui lòng thử lại.");
        showToast(data.message || "Lỗi khi xóa danh mục", "error");
      }
    } catch (err) {
      setDeleteError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
      showToast("Lỗi khi xóa danh mục", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveCategory = async (catData: Partial<Category>) => {
    if (editingCategory) {
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catData),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? data.category : c))
        );
        showToast("Đã cập nhật danh mục!", "success");
      }
    } else {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catData),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories((prev) => [...prev, data.category]);
        showToast("Đã tạo danh mục mới thành công!", "success");
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight uppercase">
              QUẢN LÝ DANH MỤC
            </h1>
            <Badge variant="brand" size="sm">
              {categories.length} NHÓM
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Tạo các nhóm phân loại món (VD: Trà Sữa, Trà Trái Cây, Bánh Ngọt, Đồ Ăn Vặt, Topping)
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto text-xs sm:text-sm font-black shadow-md tracking-wider uppercase bg-brand-900 hover:bg-brand-950 text-white"
        >
          + THÊM DANH MỤC
        </Button>
      </div>

      {/* Categories List Cards */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mb-3" />
          <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
            Đang tải dữ liệu danh mục...
          </p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-neutral-200 space-y-3">
          <p className="text-sm sm:text-base font-black text-neutral-900 uppercase">
            CHƯA CÓ DANH MỤC PHÂN LOẠI NÀO
          </p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto font-medium">
            Hãy bắt đầu tạo danh mục đầu tiên cho quán (ví dụ: Trà Sữa, Bánh Ngọt, Ăn Vặt).
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
            className="text-xs font-black uppercase tracking-wider bg-brand-900 text-white shadow-sm mt-2"
          >
            + TẠO DANH MỤC ĐẦU TIÊN
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {categories.map((cat) => {
            const productCount = products.filter((p) => p.categoryId === cat.id).length;

            return (
              <div
                key={cat.id}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-brand-300 transition-all min-w-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={cat.isActive ? "success" : "neutral"} size="sm" dot className="text-[10px] sm:text-xs">
                      {cat.isActive ? "HIỂN THỊ" : "TẠM ẨN"}
                    </Badge>
                    <span className="text-[10px] sm:text-xs font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-lg border border-neutral-200 flex-shrink-0">
                      Thứ tự: {cat.orderIndex}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight truncate">
                    {cat.name}
                  </h3>

                  {cat.description && (
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2 break-words font-medium">
                      {cat.description}
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-bold text-neutral-700">
                    <span>Số lượng món:</span>
                    <span className="bg-brand-50 text-brand-900 px-2.5 py-0.5 rounded-lg font-black border border-brand-200">
                      {productCount} Món
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
                  <Switch
                    checked={cat.isActive}
                    onChange={() => handleToggleActive(cat)}
                    labelRight={cat.isActive ? "Bật" : "Tắt"}
                  />

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(cat);
                        setIsModalOpen(true);
                      }}
                      className="text-xs font-bold shadow-2xs px-2.5 py-1"
                    >
                      SỬA
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteClick(cat)}
                      className="text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 shadow-2xs px-2.5 py-1"
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

      {/* Modal Thêm & Sửa Danh Mục */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        category={editingCategory}
      />

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingCategory)}
        onClose={() => {
          if (!isDeleting) {
            setDeletingCategory(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa danh mục món?"
        message={
          deletingCategory && products.filter((p) => p.categoryId === deletingCategory.id).length > 0
            ? `Danh mục này đang chứa ${products.filter((p) => p.categoryId === deletingCategory.id).length} món ăn. Bạn có chắc chắn muốn xóa không?`
            : "Bạn có chắc chắn muốn xóa danh mục này không?"
        }
        highlightText={deletingCategory?.name}
        highlightLabel="DANH MỤC ĐƯỢC CHỌN"
        warningText="Các món thuộc danh mục này có thể cần được phân loại lại."
        confirmLabel="XÓA DANH MỤC"
        cancelLabel="HỦY"
        variant="danger"
        isLoading={isDeleting}
        errorMessage={deleteError}
      />
    </div>
  );
}
