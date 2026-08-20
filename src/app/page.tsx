"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Category, Product, StoreSetting } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserOrdersModal } from "@/components/user/UserOrdersModal";
import { UserProfileModal } from "@/components/user/UserProfileModal";
import { AddressLocationPicker } from "@/components/ui/AddressLocationPicker";
import { CustomDropdown, DropdownOption } from "@/components/ui/CustomDropdown";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { useRealtime } from "@/hooks/useRealtime";
import {
  ProductCustomizationModal,
  CustomizationResult,
} from "@/components/customer/ProductCustomizationModal";
import { ProductCard } from "@/components/customer/ProductCard";
import { MissingProfileModal } from "@/components/customer/MissingProfileModal";
import { OnboardingGuideModal } from "@/components/customer/OnboardingGuideModal";
import { SepayQrPaymentModal } from "@/components/payment/SepayQrPaymentModal";
import { Footer } from "@/components/ui/Footer";
import { MapPin, Truck, Phone, Copy, Check, ExternalLink, AlertCircle } from "lucide-react";

interface CartItem {
  id: string;
  product: Product;
  size: string;
  sizePrice?: number;
  sugar: string;
  ice: string;
  toppings: string[];
  toppingsDetail?: { id?: string; name: string; price: number }[];
  note?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  optionsNote?: string;
}

// Hàm chuẩn hóa tiếng Việt bỏ dấu giúp tìm kiếm không dấu / có dấu siêu mượt mà
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

const sortOptions: DropdownOption<"DEFAULT" | "PRICE_ASC" | "PRICE_DESC" | "NEWEST">[] = [
  { value: "DEFAULT", label: "Sắp xếp: Mặc định", shortLabel: "Mặc định" },
  { value: "PRICE_ASC", label: "Giá: Thấp → Cao", shortLabel: "Giá thấp → cao" },
  { value: "PRICE_DESC", label: "Giá: Cao → Thấp", shortLabel: "Giá cao → thấp" },
  { value: "NEWEST", label: "Món mới nhất", shortLabel: "Mới nhất" },
];

const priceOptions: DropdownOption<"ALL" | "UNDER_30K" | "30K_50K" | "OVER_50K">[] = [
  { value: "ALL", label: "Khoảng giá: Tất cả", shortLabel: "Tất cả giá" },
  { value: "UNDER_30K", label: "Khoảng giá: Dưới 30k", shortLabel: "< 30k" },
  { value: "30K_50K", label: "Khoảng giá: 30k - 50k", shortLabel: "30k - 50k" },
  { value: "OVER_50K", label: "Khoảng giá: Trên 50k", shortLabel: "> 50k" },
];

function NhungLogoBadge({ className = "w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12" }: { className?: string }) {
  return (
    <div className={`relative flex-shrink-0 ${className} flex items-center justify-center`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm select-none"
        aria-label="Logo Nhung Tea"
      >
        <defs>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');
            .nhung-script-font {
              font-family: 'Caveat', 'Brush Script MT', 'Dancing Script', 'Segoe Script', cursive, sans-serif;
            }
          `}</style>
          {/* Nền gradient nâu đỏ ấm áp */}
          <linearGradient id="nhungBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5c2418" />
            <stop offset="50%" stopColor="#3d160e" />
            <stop offset="100%" stopColor="#240c06" />
          </linearGradient>

          {/* Viền ánh kim vàng sang trọng */}
          <linearGradient id="nhungGoldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="80%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#FEF3C7" />
          </linearGradient>

          {/* Gradient chữ Nhung màu kem ánh vàng */}
          <linearGradient id="nhungTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#FFFBEB" />
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>
        </defs>

        {/* Khung Squircle bo góc thanh lịch */}
        <rect
          x="3"
          y="3"
          width="94"
          height="94"
          rx="24"
          fill="url(#nhungBgGrad)"
          stroke="url(#nhungGoldBorder)"
          strokeWidth="2.5"
        />

        {/* Vòng chỉ vàng mảnh bên trong */}
        <rect
          x="8"
          y="8"
          width="84"
          height="84"
          rx="19"
          stroke="#FDE68A"
          strokeWidth="0.8"
          strokeDasharray="3 2.5"
          opacity="0.45"
        />

        {/* Lá trà xanh tươi phía trên */}
        <g transform="translate(50, 19)">
          <path
            d="M -1 2 C -7 -5 -14 -3 -13 4 C -12 9 -6 8 -1 2 Z"
            fill="#84CC16"
          />
          <path
            d="M -1 2 C -6 0 -10 1 -13 4"
            stroke="#4D7C0F"
            strokeWidth="0.6"
            strokeLinecap="round"
          />
          <path
            d="M 1 2 C 7 -6 15 -3 14 4 C 13 9 7 7 1 2 Z"
            fill="#A3E635"
          />
          <path
            d="M 1 2 C 6 -1 10 1 14 4"
            stroke="#4D7C0F"
            strokeWidth="0.6"
            strokeLinecap="round"
          />
          <circle cx="0" cy="2.5" r="1.2" fill="#FDE68A" />
        </g>

        {/* Chữ script 'Nhung' mềm mại thanh lịch */}
        <text
          x="50"
          y="56"
          textAnchor="middle"
          dominantBaseline="central"
          className="nhung-script-font"
          fontSize="36"
          fontWeight="bold"
          fontStyle="italic"
          fill="url(#nhungTextGrad)"
          stroke="#381308"
          strokeWidth="0.6"
        >
          Nhung
        </text>

        {/* Họa tiết trân châu & sao vàng phía dưới */}
        <g transform="translate(50, 80)">
          <circle cx="-13" cy="0" r="1.8" fill="#FBBF24" opacity="0.85" />
          <path
            d="M 0 -3.5 L 1.2 -1 L 3.5 0 L 1.2 1 L 0 3.5 L -1.2 1 L -3.5 0 L -1.2 -1 Z"
            fill="#FDE68A"
          />
          <circle cx="13" cy="0" r="1.8" fill="#FBBF24" opacity="0.85" />
        </g>
      </svg>
    </div>
  );
}

export default function StorefrontHomePage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSetting | null>(null);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<"ALL" | "UNDER_30K" | "30K_50K" | "OVER_50K">("ALL");
  const [sortBy, setSortBy] = useState<"DEFAULT" | "PRICE_ASC" | "PRICE_DESC" | "NEWEST">("DEFAULT");

  // Kiểm tra có đang áp dụng bất kỳ bộ lọc/tìm kiếm nào không
  const hasActiveFilter = useMemo(() => {
    return searchQuery.trim() !== "" || selectedCategory !== "ALL" || priceFilter !== "ALL";
  }, [searchQuery, selectedCategory, priceFilter]);

  // State điều khiển mở rộng / thu gọn Best Sellers (người dùng có thể toggle thủ công)
  const [isBestSellersExpanded, setIsBestSellersExpanded] = useState<boolean>(true);

  // Tự động thu gọn khi có filter/search, tự động mở lại đầy đủ khi xóa hết filter/search
  useEffect(() => {
    setIsBestSellersExpanded(!hasActiveFilter);
  }, [hasActiveFilter, searchQuery, selectedCategory, priceFilter]);

  // Đóng dropdown khi click outside hoặc bấm Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCategoryDropdownOpen(false);
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCategoryDropdownOpen]);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [isUserOrdersOpen, setIsUserOrdersOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Product Customization Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);

  // Cart State (CRUD)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Coupon State
  const [inputCouponCode, setInputCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType?: "PERCENT" | "FIXED_AMOUNT";
    discountValue?: number;
    discountPercent?: number;
    discountAmount: number;
    maxDiscountAmount?: number;
    description?: string;
  } | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState<boolean>(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Form đặt hàng
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLat, setDeliveryLat] = useState<number | undefined>(undefined);
  const [deliveryLng, setDeliveryLng] = useState<number | undefined>(undefined);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"SEPAY_QR" | "COD">("SEPAY_QR");
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderCode: string;
    totalAmount: number;
    paymentMethod: "SEPAY_QR" | "COD";
  } | null>(null);
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; address?: string }>({});

  // Missing Profile Notification Modal State
  const [isMissingInfoModalOpen, setIsMissingInfoModalOpen] = useState<boolean>(false);
  const [missingFieldsState, setMissingFieldsState] = useState<{
    name?: boolean;
    phone?: boolean;
    address?: boolean;
  }>({});
  const [profileFocusField, setProfileFocusField] = useState<"name" | "phone" | "address" | undefined>(undefined);
  const [pendingOrderAfterProfile, setPendingOrderAfterProfile] = useState<boolean>(false);

  // Realtime lắng nghe cập nhật trạng thái đơn hàng & trạng thái quán khi khách đang duyệt menu
  useRealtime({
    role: "customer",
    userId: user?.id,
    phone: user?.phone || customerPhone,
    onOrderStatusUpdated: (updatedOrder) => {
      const statusLabels: Record<string, string> = {
        PREPARING: `📦 Đơn #${updatedOrder.orderCode} đang được pha chế!`,
        DELIVERING: `🚚 Đơn #${updatedOrder.orderCode} đang được giao đến bạn!`,
        COMPLETED: `🎉 ĐƠN HÀNG ĐÃ GIAO THÀNH CÔNG! Mã đơn: #${updatedOrder.orderCode}. Cảm ơn bạn đã mua hàng tại Trà Sữa Dino ❤️`,
        CANCELLED: `❌ Đơn #${updatedOrder.orderCode} đã bị hủy.`,
      };
      const msg = statusLabels[updatedOrder.orderStatus];
      if (msg) {
        showToast(msg, updatedOrder.orderStatus === "COMPLETED" ? "success" : "info");
      }
    },
    onStoreStatusUpdated: (updatedSettings) => {
      if (updatedSettings) {
        setStoreSettings(updatedSettings);
        if (updatedSettings.isOpen !== undefined) {
          setIsStoreOpen(updatedSettings.isOpen);
          if (!updatedSettings.isOpen) {
            showToast("📢 Quán vừa chuyển sang trạng thái tạm đóng cửa nghỉ bán.", "info");
          } else {
            showToast("🎉 Quán đã mở cửa nhận đơn hàng trở lại!", "success");
          }
        }
      }
    },
  });

  useEffect(() => {
    if (user) {
      if (user.name) setCustomerName(user.name);
      if (user.phone) setCustomerPhone(user.phone);
      if (user.address) setDeliveryAddress(user.address);
    } else {
      // Tự động khôi phục thông tin từ lần đặt trước (dành cho khách chưa đăng nhập)
      try {
        const savedName = localStorage.getItem("dino_guest_name");
        const savedPhone = localStorage.getItem("dino_guest_phone");
        const savedAddress = localStorage.getItem("dino_guest_address");
        if (savedName && !customerName) setCustomerName(savedName);
        if (savedPhone && !customerPhone) setCustomerPhone(savedPhone);
        if (savedAddress && !deliveryAddress) setDeliveryAddress(savedAddress);
      } catch (e) {}
    }
  }, [user]);

  // Handler khi bấm "ĐẶT HÀNG NGAY →" hoặc "Thanh toán" trong giỏ (Không cần đăng nhập / đăng ký)
  const handleInitiateCheckout = () => {
    if (!isStoreOpen) {
      showToast("Xin lỗi quý khách, quán tạm thời đóng cửa, xin quý khách vui lòng quay lại sau.", "warning");
      return;
    }

    if (cart.length === 0) {
      showToast("Giỏ hàng của bạn đang trống", "warning");
      return;
    }

    // Mở trực tiếp popup ĐẶT HÀNG GIAO TẬN NƠI
    setIsCartDrawerOpen(false);
    setIsCheckoutOpen(true);
  };

  // Handler khi bấm "NHẬP THÔNG TIN TẠI ĐÂY" trong modal thông báo thiếu thông tin
  const handleGoToProfileToFillInfo = () => {
    setIsMissingInfoModalOpen(false);

    // Xác định field đầu tiên đang thiếu để focus
    let targetField: "name" | "phone" | "address" = "name";
    if (missingFieldsState.name) targetField = "name";
    else if (missingFieldsState.phone) targetField = "phone";
    else if (missingFieldsState.address) targetField = "address";

    setProfileFocusField(targetField);
    setPendingOrderAfterProfile(true);

    if (!user) {
      // Chưa đăng nhập -> mở AuthModal
      setIsAuthOpen(true);
    } else {
      // Đã đăng nhập -> mở UserProfileModal
      setIsProfileOpen(true);
    }
  };

  // Handler khi User lưu thông tin cá nhân thành công
  const handleProfileSavedSuccess = () => {
    if (user) {
      if (user.name) setCustomerName(user.name);
      if (user.phone) setCustomerPhone(user.phone);
      if (user.address) setDeliveryAddress(user.address);
    }

    if (pendingOrderAfterProfile) {
      setPendingOrderAfterProfile(false);
      // Tự động mở Checkout flow cho user tiếp tục đặt hàng mà không mất giỏ hàng!
      setIsCheckoutOpen(true);
      showToast("Đã cập nhật thông tin thành công! Bạn có thể xác nhận đặt hàng ngay.", "success");
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [catRes, prodRes, setRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/products"),
        fetch("/api/settings"),
      ]);
      if (catRes.ok && prodRes.ok) {
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        setCategories(catData.categories || []);
        setProducts(prodData.products || []);
      }
      if (setRes && setRes.ok) {
        const setData = await setRes.json();
        if (setData.settings) {
          setStoreSettings(setData.settings);
          if (setData.settings.isOpen !== undefined) {
            setIsStoreOpen(setData.settings.isOpen);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleFocus = () => {
      fetchData();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Món bán chạy (Best Sellers)
  const bestSellers = useMemo(() => {
    return products
      .filter((p) => p.isAvailable && p.isFeatured)
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
  }, [products]);

  // Bộ lọc danh sách món thông minh (Tương thích tìm kiếm có dấu & không dấu)
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // 1. Lọc theo danh mục
    if (selectedCategory !== "ALL") {
      list = list.filter((p) => p.categoryId === selectedCategory);
    }

    // 2. Lọc theo từ khóa tìm kiếm (hỗ trợ cả có dấu và không dấu: "tra sua", "trà sữa", "olong", "đào")
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const qNormalized = removeVietnameseTones(searchQuery);

      list = list.filter((p) => {
        const nameLower = p.name.toLowerCase();
        const nameNormalized = removeVietnameseTones(p.name);
        const nameMatch = nameLower.includes(q) || nameNormalized.includes(qNormalized);

        const descLower = (p.description || "").toLowerCase();
        const descNormalized = removeVietnameseTones(p.description || "");
        const descMatch = descLower.includes(q) || descNormalized.includes(qNormalized);

        const catNameLower = (p.categoryName || "").toLowerCase();
        const catNameNormalized = removeVietnameseTones(p.categoryName || "");
        const catMatch = catNameLower.includes(q) || catNameNormalized.includes(qNormalized);

        return nameMatch || descMatch || catMatch;
      });
    }

    // 3. Lọc theo mức giá
    if (priceFilter === "UNDER_30K") {
      list = list.filter((p) => p.price < 30000);
    } else if (priceFilter === "30K_50K") {
      list = list.filter((p) => p.price >= 30000 && p.price <= 50000);
    } else if (priceFilter === "OVER_50K") {
      list = list.filter((p) => p.price > 50000);
    }

    // 4. Sắp xếp theo thứ tự
    if (sortBy === "PRICE_ASC") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "PRICE_DESC") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "NEWEST") {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return list;
  }, [products, selectedCategory, searchQuery, priceFilter, sortBy]);

  // Thông tin danh mục đang được chọn (cho Selector trên Mobile)
  const currentCategoryInfo = useMemo(() => {
    if (selectedCategory === "ALL") {
      return { name: "Tất Cả Món", count: products.length };
    }
    const cat = categories.find((c) => c.id === selectedCategory);
    const count = products.filter((p) => p.categoryId === selectedCategory).length;
    return { name: cat ? cat.name : "Tất Cả Món", count };
  }, [selectedCategory, categories, products]);

  const handleOpenProduct = (product: Product) => {
    if (!product.isAvailable) return;
    setEditingCartItem(null);
    setSelectedProduct(product);
  };

  const handleEditCartItem = (item: CartItem) => {
    setEditingCartItem(item);
    setSelectedProduct(item.product);
  };

  // Cart Handlers (CRUD)
  const handleConfirmCustomization = (result: CustomizationResult) => {
    if (editingCartItem) {
      // 1. Chỉnh sửa một cart item đã có
      setCart((prev) =>
        prev.map((item) =>
          item.id === editingCartItem.id
            ? {
                ...item,
                product: result.product,
                size: result.size,
                sizePrice: result.sizePrice,
                sugar: result.sugar,
                ice: result.ice,
                toppings: result.toppings.map((t) => t.name),
                toppingsDetail: result.toppings,
                note: result.note,
                quantity: result.quantity,
                unitPrice: result.unitPrice,
                totalPrice: result.totalPrice,
                optionsNote: result.optionsNote,
              }
            : item
        )
      );
      showToast(`Đã cập nhật món "${result.product.name}"`, "success");
      setEditingCartItem(null);
      setSelectedProduct(null);
    } else {
      // 2. Thêm món mới vào giỏ hàng
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        product: result.product,
        size: result.size,
        sizePrice: result.sizePrice,
        sugar: result.sugar,
        ice: result.ice,
        toppings: result.toppings.map((t) => t.name),
        toppingsDetail: result.toppings,
        note: result.note,
        quantity: result.quantity,
        unitPrice: result.unitPrice,
        totalPrice: result.totalPrice,
        optionsNote: result.optionsNote,
      };

      setCart((prev) => {
        // Kiểm tra xem đã có món y hệt (cùng món, cùng size, cùng đường, cùng đá, cùng toppings, cùng note) chưa
        const existingIndex = prev.findIndex((item) => {
          if (item.product.id !== newItem.product.id) return false;
          if (item.size !== newItem.size) return false;
          if (item.sugar !== newItem.sugar) return false;
          if (item.ice !== newItem.ice) return false;
          if ((item.note || "").trim() !== (newItem.note || "").trim()) return false;

          const topsA = [...(item.toppings || [])].sort();
          const topsB = [...(newItem.toppings || [])].sort();
          if (topsA.length !== topsB.length) return false;
          return topsA.every((val, idx) => val === topsB[idx]);
        });

        if (existingIndex !== -1) {
          const updated = [...prev];
          const existing = updated[existingIndex];
          const newQty = existing.quantity + newItem.quantity;
          updated[existingIndex] = {
            ...existing,
            quantity: newQty,
            totalPrice: existing.unitPrice * newQty,
          };
          return updated;
        }

        return [...prev, newItem];
      });

      showToast(`Đã thêm "${result.product.name}" vào giỏ`, "success");
      setSelectedProduct(null);
    }
  };

  const handleUpdateCartQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== itemId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, quantity: newQty, totalPrice: item.unitPrice * newQty }
          : item
      )
    );
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const cartTotalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Tự động tính lại số tiền giảm khi số lượng giỏ hàng thay đổi
  useEffect(() => {
    if (appliedCoupon && cartTotalAmount > 0) {
      let discount = 0;
      if (appliedCoupon.discountType === "FIXED_AMOUNT") {
        discount = Math.min(appliedCoupon.discountValue || appliedCoupon.discountAmount, cartTotalAmount);
      } else {
        const pct = appliedCoupon.discountValue ?? appliedCoupon.discountPercent ?? 10;
        discount = Math.round((cartTotalAmount * pct) / 100);
        if (appliedCoupon.maxDiscountAmount && appliedCoupon.maxDiscountAmount > 0) {
          discount = Math.min(discount, appliedCoupon.maxDiscountAmount);
        }
      }
      discount = Math.min(discount, cartTotalAmount);
      setAppliedCoupon((prev) => (prev ? { ...prev, discountAmount: discount } : null));
    } else if (cartTotalAmount === 0 && appliedCoupon) {
      setAppliedCoupon(null);
    }
  }, [cartTotalAmount]);

  const finalTotalAmount = useMemo(() => {
    return Math.max(0, cartTotalAmount - (appliedCoupon?.discountAmount || 0));
  }, [cartTotalAmount, appliedCoupon]);

  const handleApplyCoupon = async () => {
    if (!inputCouponCode.trim()) {
      setCouponError("Vui lòng nhập mã giảm giá");
      return;
    }

    if (cartTotalAmount <= 0) {
      setCouponError("Giỏ hàng của bạn đang trống");
      return;
    }

    try {
      setIsCheckingCoupon(true);
      setCouponError(null);

      const itemsPayload = cart.map((c) => ({
        productId: c.product.id,
        productName: c.product.name,
        unitPrice: c.unitPrice,
        quantity: c.quantity,
        totalPrice: c.totalPrice,
      }));

      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: inputCouponCode.trim(),
          orderAmount: cartTotalAmount,
          items: itemsPayload,
          user: user
            ? { id: user.id, email: user.email, phone: user.phone || customerPhone.trim() }
            : { phone: customerPhone.trim() },
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon({
          code: data.coupon.code,
          discountType: data.coupon.discountType || "PERCENT",
          discountValue: data.coupon.discountValue ?? data.coupon.discountPercent,
          discountPercent: data.coupon.discountPercent,
          discountAmount: data.discountAmount,
          maxDiscountAmount: data.coupon.maxDiscountAmount,
          description: data.coupon.description,
        });
        showToast(data.message, "success");
      } else {
        setCouponError(data.message || "Mã giảm giá không hợp lệ");
        showToast(data.message || "Không thể áp dụng mã", "error");
      }
    } catch (err) {
      setCouponError("Lỗi kết nối kiểm tra mã");
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setInputCouponCode("");
    setCouponError(null);
    showToast("Đã hủy áp dụng mã giảm giá", "info");
  };

  // Kiểm tra gợi ý nếu địa chỉ ghi rõ tỉnh/thành phố khác ngoài Thanh Hóa / Sầm Sơn
  const isAddressOutsideScope = useMemo(() => {
    if (!deliveryAddress || deliveryAddress.trim().length < 4) return false;
    const lower = deliveryAddress.toLowerCase();
    const farProvinces = [
      "hà nội", "ha noi", "hcm", "hồ chí minh", "ho chi minh", "sài gòn", "sai gon",
      "đà nẵng", "da nang", "hải phòng", "hai phong", "cần thơ", "can tho",
      "bình dương", "binh duong", "đồng nai", "dong nai", "nghệ an", "nghe an",
      "quảng ninh", "quang ninh", "hải dương", "hai duong", "bắc ninh", "bac ninh",
      "thái nguyên", "nam định", "ninh bình", "hưng yên", "vĩnh phúc", "phú thọ"
    ];
    const isFar = farProvinces.some((p) => lower.includes(p));
    const isLocal = lower.includes("thanh hóa") || lower.includes("thanh hoa") || lower.includes("sầm sơn") || lower.includes("sam son");
    return isFar && !isLocal;
  }, [deliveryAddress]);

  const validateOrderForm = () => {
    const errors: { name?: string; phone?: string; address?: string } = {};

    if (!customerName.trim()) {
      errors.name = "Vui lòng nhập họ tên người nhận";
    }

    if (!customerPhone.trim()) {
      errors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^[0-9+]{9,12}$/.test(customerPhone.trim().replace(/\s/g, ""))) {
      errors.phone = "Số điện thoại không hợp lệ";
    }

    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 5) {
      errors.address = "Vui lòng nhập địa chỉ cụ thể hoặc bấm 'Lấy Vị Trí GPS'";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isStoreOpen) {
      showToast("Xin lỗi quý khách, quán tạm thời đóng cửa, xin quý khách vui lòng quay lại sau.", "warning");
      return;
    }

    if (isOrdering) return;

    if (!validateOrderForm()) {
      showToast("Vui lòng điền đủ họ tên, SĐT và địa chỉ nhận hàng", "warning");
      return;
    }

    try {
      setIsOrdering(true);
      const itemsPayload = cart.map((c) => {
        let optNote = c.optionsNote;
        if (!optNote) {
          const parts: string[] = [];
          if (c.size) parts.push(c.size);
          if (c.sugar) parts.push(c.sugar);
          if (c.ice) parts.push(c.ice);
          if (c.toppings && c.toppings.length > 0) {
            parts.push(`Topping: ${c.toppings.join(", ")}`);
          }
          if (c.note && c.note.trim()) {
            parts.push(`Ghi chú: ${c.note.trim()}`);
          }
          optNote = parts.join(" • ");
        }

        return {
          productId: c.product.id,
          productName: c.product.name,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          optionsNote: optNote,
          totalPrice: c.totalPrice,
        };
      });

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: user?.email || undefined,
          userId: user?.id || undefined,
          deliveryAddress: deliveryAddress.trim(),
          deliveryLat,
          deliveryLng,
          note: note.trim(),
          paymentMethod,
          subtotalAmount: cartTotalAmount,
          couponCode: appliedCoupon?.code || undefined,
          discountPercent: appliedCoupon?.discountPercent || undefined,
          discountAmount: appliedCoupon?.discountAmount || undefined,
          totalAmount: finalTotalAmount,
          items: itemsPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrderSuccess({
          orderCode: data.order.orderCode,
          totalAmount: data.order.totalAmount,
          paymentMethod: data.order.paymentMethod || paymentMethod,
        });

        // Tự động lưu thông tin khách, mã đơn và tracking token vào localStorage cho khách vãng lai
        try {
          localStorage.setItem("dino_guest_name", customerName.trim());
          localStorage.setItem("dino_guest_phone", customerPhone.trim());
          localStorage.setItem("dino_guest_address", deliveryAddress.trim());

          const rawOrders = localStorage.getItem("dino_guest_orders");
          const existingOrders: string[] = rawOrders ? JSON.parse(rawOrders) : [];
          if (!existingOrders.includes(data.order.orderCode)) {
            existingOrders.unshift(data.order.orderCode);
            localStorage.setItem("dino_guest_orders", JSON.stringify(existingOrders.slice(0, 20)));
          }

          if (data.order.trackingToken) {
            const rawTokens = localStorage.getItem("dino_guest_tracking_tokens");
            const existingTokens: string[] = rawTokens ? JSON.parse(rawTokens) : [];
            if (!existingTokens.includes(data.order.trackingToken)) {
              existingTokens.unshift(data.order.trackingToken);
              localStorage.setItem("dino_guest_tracking_tokens", JSON.stringify(existingTokens.slice(0, 20)));
            }
          }
        } catch (e) {}

        setCart([]);
        setAppliedCoupon(null);
        setInputCouponCode("");
        setIsCheckoutOpen(false);
        setIsCartDrawerOpen(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(
          errData.message || "Xin lỗi quý khách, quán tạm thời đóng cửa, xin quý khách vui lòng quay lại sau.",
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi gửi đơn hàng", "error");
    } finally {
      setIsOrdering(false);
    }
  };

  const handleCopyOrderLink = (code: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/don-hang?code=${encodeURIComponent(code)}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        showToast(`Đã sao chép link theo dõi đơn #${code}!`, "success");
      })
      .catch(() => {
        showToast("Không thể sao chép liên kết", "warning");
      });
  };

  const isUserAdminOrStaff = user?.role === "ADMIN" || user?.role === "STAFF";

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-900 selection:bg-brand-500 selection:text-white flex flex-col justify-between">
      {/* 0. ANNOUNCEMENT BAR: ĐỊA CHỈ QUÁN & PHẠM VI GIAO HÀNG */}
      <aside
        aria-label="Thông tin địa chỉ quán và phạm vi giao hàng"
        className="w-full bg-gradient-to-r from-[#2c1209] via-[#482017] to-[#2c1209] text-amber-100 text-[11px] sm:text-xs font-semibold py-1.5 px-3 border-b border-brand-900/50 select-none shadow-2xs"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          {/* Địa chỉ quán có link Google Maps */}
          <a
            href="https://www.google.com/maps/search/?api=1&query=740+Đường+Triệu+Quốc+Đạt,+Triệu+Sơn,+Thanh+Hóa"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-amber-200 hover:text-white transition-colors"
            title="Bấm để xem vị trí quán trên Google Maps"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="font-bold text-white">Địa chỉ:</span>
            <span className="truncate">740, Đường Triệu Quốc Đạt, Triệu Sơn, Thanh Hóa</span>
          </a>

          {/* Phạm vi giao hàng */}
          <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-100">
            <Truck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>Chỉ giao hàng khu vực <strong>Sầm Sơn &amp; lân cận</strong> (15-30p)</span>
          </div>
        </div>
      </aside>

      {/* 1. HEADER CHUYÊN NGHIỆP, CÂN ĐỐI & CHUẨN RESPONSIVE TOÀN BỘ THIẾT BỊ */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-2xs transition-all safe-top">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
          
          {/* A. CỤM BRAND (LOGO + MASCOT + TÊN + STATUS + TAGLINE) */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 select-none group min-w-0 flex-shrink">
            {/* Mascot Icon */}
            <div className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-900 via-brand-950 to-[#2c140e] text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-xs group-hover:scale-105 group-hover:shadow-md transition-all flex-shrink-0 border border-brand-800/20">
              🦕
            </div>

            {/* Brand Text Info */}
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-none flex-wrap sm:flex-nowrap">
                <span className="font-black text-brand-950 text-xs xs:text-sm sm:text-base md:text-lg tracking-tight uppercase truncate">
                  TRÀ SỮA DINO
                </span>
                {isStoreOpen ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[8px] xs:text-[9px] sm:text-[10px] font-black border border-emerald-200/80 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Mở cửa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[8px] xs:text-[9px] sm:text-[10px] font-black border border-rose-200/80 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Tạm đóng cửa
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-brand-700/90 font-bold hidden xs:block truncate mt-0.5">
                Trà Tươi Mỗi Ngày • Bánh Nóng Hổi
              </p>
            </div>
          </Link>

          {/* B. CÁC ĐIỂM NỔI BẬT THƯƠNG HIỆU (HIỆN TRÊN DESKTOP/TABLET - CÂN ĐỐI KHOẢNG TRỐNG) */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-bold text-neutral-600 select-none">
            <div className="flex items-center gap-1.5 bg-neutral-50/80 border border-neutral-200/60 px-3 py-1.5 rounded-xl shadow-2xs">
              <span>🚚</span>
              <span className="text-neutral-800">Giao nhanh 15-30p</span>
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=740+Đường+Triệu+Quốc+Đạt,+Triệu+Sơn,+Thanh+Hóa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-neutral-50/80 hover:bg-neutral-100 border border-neutral-200/60 px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
              title="Xem bản đồ 740 Đường Triệu Quốc Đạt, Triệu Sơn"
            >
              <span>📍</span>
              <span className="text-neutral-800 font-bold">740 Triệu Quốc Đạt</span>
            </a>
            <div className="flex items-center gap-1.5 bg-neutral-50/80 border border-neutral-200/60 px-3 py-1.5 rounded-xl shadow-2xs">
              <span>🍃</span>
              <span className="text-neutral-800">100% Trà tươi sạch</span>
            </div>
          </div>

          {/* C. ACTION BUTTONS (ĐĂNG NHẬP / TÀI KHOẢN / ĐƠN HÀNG) */}
          <div className="flex items-center gap-1.5 sm:gap-2 select-none flex-shrink-0">
            {user ? (
              <>
                {/* Nút Đơn Hàng */}
                <button
                  onClick={() => setIsUserOrdersOpen(true)}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] sm:text-xs font-bold transition-all min-h-[38px] flex items-center gap-1 border border-neutral-200/60 shadow-2xs active:scale-95"
                  title="Xem đơn hàng của tôi"
                >
                  <span>🧾</span>
                  <span className="hidden sm:inline">Đơn hàng</span>
                </button>

                {/* Nút Hồ Sơ */}
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-brand-50 text-brand-950 border border-brand-200 hover:bg-brand-100 text-[11px] sm:text-xs font-bold transition-all max-w-[80px] sm:max-w-[130px] truncate min-h-[38px] flex items-center gap-1 shadow-2xs active:scale-95"
                  title="Thông tin tài khoản"
                >
                  <span>👤</span>
                  <span className="truncate">{user.name || user.email?.split("@")[0]}</span>
                </button>

                {/* Nút Admin nếu có quyền */}
                {isUserAdminOrStaff && (
                  <Link
                    href="/admin"
                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-brand-900 hover:bg-brand-950 text-white text-[11px] sm:text-xs font-black shadow-xs min-h-[38px] flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <span>⚡</span>
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                {/* Nút Thoát */}
                <button
                  onClick={() => {
                    logout();
                    showToast("Đã đăng xuất tài khoản", "info");
                  }}
                  className="text-neutral-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] flex items-center"
                  title="Đăng xuất"
                >
                  Thoát
                </button>
              </>
            ) : (
              <>
                {/* Nút Tra Cứu Đơn cho khách chưa đăng nhập */}
                <button
                  onClick={() => setIsUserOrdersOpen(true)}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] sm:text-xs font-bold transition-all min-h-[38px] flex items-center gap-1.5 border border-neutral-200/80 shadow-2xs active:scale-95 whitespace-nowrap"
                  title="Tra cứu tiến độ đơn hàng không cần đăng nhập"
                >
                  <span>🧾</span>
                  <span className="hidden xs:inline">Tra cứu đơn</span>
                </button>

                {/* Nút Đăng nhập */}
                <button
                  onClick={() => {
                    setAuthDefaultTab("LOGIN");
                    setIsAuthOpen(true);
                  }}
                  className="px-3 py-2 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-brand-900 to-brand-950 hover:from-brand-950 hover:to-black text-white font-black uppercase text-[11px] sm:text-xs tracking-wider transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-1.5 min-h-[38px] whitespace-nowrap border border-brand-800/30"
                >
                  <span>👤</span>
                  <span>Đăng nhập</span>
                </button>
              </>
            )}
          </div>

        </div>
      </header>

      {/* 2. MAIN BODY */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3.5 sm:py-6 space-y-4 sm:space-y-6 w-full max-w-full">
        {/* Banner Header Thương Hiệu Màu Nâu Đậm */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#2c1209] via-[#461e14] to-[#240c06] text-white px-3.5 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5 shadow-md border border-amber-950/60 sm:border-brand-900/40 flex items-center justify-between gap-2.5 sm:gap-4 w-full min-w-0">
          {/* Lớp ánh sáng ấm nhẹ làm nền thêm chiều sâu */}
          <div
            className="pointer-events-none absolute -right-10 -top-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl"
            aria-hidden="true"
          />

          {/* Cụm Bên Trái: Logo "Nhung" + Tên Thương Hiệu + Slogan */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <NhungLogoBadge className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-extrabold text-white leading-snug sm:leading-tight truncate tracking-tight">
                Trà Sữa &amp; Bánh Tươi Dino
              </h1>
              <p className="text-[11px] sm:text-xs md:text-sm text-amber-200/90 font-medium truncate mt-0.5 flex items-center gap-1.5">
                Ủ trà tươi mỗi ngày • Giao nhanh 15-30p
              </p>
            </div>
          </div>

          {/* Cụm Bên Phải: Nút Xem Địa Chỉ Quán Trên Bản Đồ */}
          <div className="flex items-center flex-shrink-0">
            <a
              href="https://www.google.com/maps/search/?api=1&query=740+Đường+Triệu+Quốc+Đạt,+Triệu+Sơn,+Thanh+Hóa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-xs text-amber-50 shadow-2xs transition-all select-none active:scale-95 group"
              title="Bấm để xem vị trí quán trên Google Maps"
            >
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <span className="text-[9px] text-amber-200 block leading-none font-medium">Địa chỉ quán:</span>
                <span className="text-[10px] sm:text-xs md:text-sm font-bold whitespace-nowrap text-white">
                  740 Triệu Quốc Đạt
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* CỤM CARD THÔNG TIN ĐỊA CHỈ & PHẠM VI GIAO HÀNG NỔI BẬT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 w-full">
          {/* Card 1: Địa chỉ cửa hàng */}
          <a
            href="https://www.google.com/maps/search/?api=1&query=740+Đường+Triệu+Quốc+Đạt,+Triệu+Sơn,+Thanh+Hóa"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white hover:bg-neutral-50/80 border border-neutral-200/90 hover:border-brand-300 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs transition-all"
            title="Bấm xem đường đi đến quán trên Google Maps"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase text-rose-700 tracking-wider">
                    ĐỊA CHỈ CỬA HÀNG
                  </span>
                  <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">
                    Google Maps ↗
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-neutral-900 truncate mt-0.5">
                  740, Đường Triệu Quốc Đạt, Triệu Sơn, Thanh Hóa
                </p>
              </div>
            </div>
          </a>

          {/* Card 2: Phạm vi giao hàng */}
          <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs select-none">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-300/80 text-amber-800 flex items-center justify-center flex-shrink-0">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-800" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] sm:text-[11px] font-black uppercase text-amber-800 tracking-wider">
                  PHẠM VI GIAO HÀNG TẬN NƠI
                </span>
                <p className="text-xs sm:text-sm font-bold text-amber-950 truncate mt-0.5">
                  Sầm Sơn, Thanh Hóa &amp; các khu vực lân cận
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center text-[11px] font-bold text-amber-900 bg-white/90 px-2.5 py-1 rounded-xl border border-amber-200/80 flex-shrink-0">
              ⚡ 15-30p
            </span>
          </div>
        </div>

        {/* BANNER THÔNG BÁO TẠM ĐÓNG CỬA NGHỈ BÁN */}
        {!isStoreOpen && (
          <div className="bg-rose-50 border-2 border-rose-300/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-rose-950 flex items-start gap-3 shadow-xs animate-fade-in select-none">
            <div className="h-9 w-9 rounded-xl bg-rose-200/80 text-rose-800 flex items-center justify-center font-black text-lg flex-shrink-0 border border-rose-300">
              🔒
            </div>
            <div className="space-y-1 text-xs sm:text-sm flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-rose-900 uppercase tracking-tight text-sm sm:text-base">
                  Quán tạm thời đóng cửa nghỉ bán
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-200/80 text-rose-800 text-[10px] font-black uppercase">
                  Tạm ngưng nhận đơn
                </span>
              </div>
              <p className="text-rose-800 font-medium leading-relaxed">
                Quý khách vẫn có thể xem danh sách món, giá bán và các loại topping. Tính năng đặt hàng sẽ mở lại khi quán bắt đầu nhận đơn (Giờ mở cửa: <b>{storeSettings?.openTime || "08:00"} – {storeSettings?.closeTime || "22:30"}</b>).
              </p>
            </div>
          </div>
        )}

        {/* Thanh Tìm Kiếm & Lọc Nhanh */}
        <div className="space-y-2.5 w-full max-w-full">
          {/* Ô Tìm Kiếm */}
          <div className="relative w-full min-w-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Tìm trà sữa, bánh tươi, topping..."
              className="w-full pl-3.5 pr-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-neutral-200 bg-white text-neutral-900 font-bold placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400 hover:text-neutral-700 uppercase"
              >
                ✕
              </button>
            )}
          </div>

          {/* A. MOBILE CATEGORY SELECTOR (Ẩn trên Desktop md+) */}
          <div className="relative w-full max-w-full md:hidden" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all shadow-2xs select-none active:scale-[0.99] text-left ${
                isCategoryDropdownOpen
                  ? "bg-brand-50 border-brand-800 ring-2 ring-brand-700/20"
                  : "bg-white border-brand-200/90 hover:border-brand-400"
              }`}
              aria-haspopup="listbox"
              aria-expanded={isCategoryDropdownOpen}
              aria-label="Chọn danh mục món"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl flex-shrink-0">🍹</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase text-brand-700 tracking-wider leading-none">
                    DANH MỤC MÓN
                  </p>
                  <p className="text-xs sm:text-sm font-black text-brand-950 truncate mt-0.5">
                    {currentCategoryInfo.name} ({currentCategoryInfo.count} món)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[11px] font-black text-brand-900 bg-brand-100 px-2 py-0.5 rounded-lg">
                  {isCategoryDropdownOpen ? "Đóng ▲" : "Chọn ▼"}
                </span>
              </div>
            </button>

            {/* Custom Dropdown Menu List */}
            {isCategoryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-white border border-neutral-200/90 rounded-2xl p-2 shadow-floating space-y-1 animate-slide-up max-h-72 overflow-y-auto overscroll-contain">
                <div className="px-2 py-1.5 border-b border-neutral-100 flex items-center justify-between">
                  <span className="text-[11px] font-black text-neutral-400 uppercase tracking-wider">
                    DANH SÁCH DANH MỤC ({categories.length + 1})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(false)}
                    className="text-xs font-bold text-neutral-400 hover:text-neutral-700 p-0.5"
                  >
                    ✕
                  </button>
                </div>

                {/* Option: Tất Cả */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("ALL");
                    setIsCategoryDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                    selectedCategory === "ALL"
                      ? "bg-brand-900 text-white font-black shadow-2xs"
                      : "text-neutral-800 hover:bg-neutral-100 font-bold"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={selectedCategory === "ALL" ? "text-amber-300 font-black" : "text-neutral-300"}>
                      {selectedCategory === "ALL" ? "✓" : "•"}
                    </span>
                    <span>Tất cả món</span>
                  </div>
                  <span className={selectedCategory === "ALL" ? "text-white/90 font-black" : "text-neutral-400 font-bold"}>
                    ({products.length})
                  </span>
                </button>

                {/* Options: Từng Danh Mục */}
                {categories.map((cat) => {
                  const count = products.filter((p) => p.categoryId === cat.id).length;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                        isSelected
                          ? "bg-brand-900 text-white font-black shadow-2xs"
                          : "text-neutral-800 hover:bg-neutral-100 font-bold"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className={isSelected ? "text-amber-300 font-black" : "text-neutral-300"}>
                          {isSelected ? "✓" : "•"}
                        </span>
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <span className={isSelected ? "text-white/90 font-black" : "text-neutral-400 font-bold"}>
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* B. DESKTOP TABS (Ẩn trên Mobile <md, Hiện trên Desktop md+) */}
          {categories.length > 0 && (
            <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none w-full max-w-full">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase whitespace-nowrap transition-all border ${
                  selectedCategory === "ALL"
                    ? "bg-brand-900 text-white border-brand-900 shadow-xs"
                    : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 shadow-2xs"
                }`}
              >
                Tất cả ({products.length})
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black uppercase whitespace-nowrap transition-all border ${
                      isSelected
                        ? "bg-brand-900 text-white border-brand-900 shadow-xs"
                        : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 shadow-2xs"
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* C. LỌC GIÁ & SẮP XẾP */}
          {/* C1: Mobile Filter & Sort (2 cột CustomDropdown gọn gàng, 0 overflow) */}
          <div className="grid grid-cols-2 gap-2 md:hidden w-full max-w-full">
            <CustomDropdown
              value={priceFilter}
              onChange={(val) => setPriceFilter(val)}
              options={priceOptions}
              align="left"
              ariaLabel="Lọc theo khoảng giá"
              className="w-full"
            />

            <CustomDropdown
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={sortOptions}
              align="right"
              ariaLabel="Sắp xếp sản phẩm"
              className="w-full"
            />
          </div>

          {/* C2: Desktop Filter & Sort (Chips ngang + CustomDropdown, md:flex) */}
          <div className="hidden md:flex items-center justify-between gap-2 text-xs text-neutral-600 w-full max-w-full">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              <span className="text-[11px] font-black uppercase text-neutral-400 mr-1">
                MỨC GIÁ:
              </span>
              {[
                { id: "ALL", label: "Tất cả" },
                { id: "UNDER_30K", label: "< 30k" },
                { id: "30K_50K", label: "30k - 50k" },
                { id: "OVER_50K", label: "> 50k" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPriceFilter(f.id as typeof priceFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    priceFilter === f.id
                      ? "bg-brand-100 text-brand-950 font-black border border-brand-300 shadow-2xs"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <CustomDropdown
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={sortOptions}
              align="right"
              ariaLabel="Sắp xếp sản phẩm"
              className="flex-shrink-0"
            />
          </div>
        </div>

        {/* 3. MỤC MÓN BÁN CHẠY (BEST SELLERS) */}
        {bestSellers.length > 0 && (
          <div className="space-y-1.5 pt-0.5 w-full max-w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-black text-brand-950 uppercase tracking-wider flex items-center gap-1">
                  <span>🔥</span> MÓN BÁN CHẠY (BEST SELLERS)
                </h2>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  {bestSellers.length} món
                </span>
              </div>

              {/* Nút Thu gọn / Hiện lại Best Sellers */}
              <button
                type="button"
                onClick={() => setIsBestSellersExpanded((prev) => !prev)}
                className={`text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 border select-none active:scale-95 ${
                  isBestSellersExpanded
                    ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-neutral-200"
                    : "bg-brand-50 text-brand-900 hover:bg-brand-100 border-brand-300 font-black shadow-2xs"
                }`}
                title={isBestSellersExpanded ? "Thu gọn mục bán chạy" : "Hiện lại danh sách món bán chạy"}
              >
                <span>{isBestSellersExpanded ? "Thu gọn ⌃" : "Hiện danh sách ⌄"}</span>
              </button>
            </div>

            {/* Danh sách thẻ sản phẩm Best Sellers (Thu gọn mượt mà 300ms với max-height & opacity) */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isBestSellersExpanded
                  ? "max-h-[2500px] opacity-100"
                  : "max-h-0 opacity-0 pointer-events-none"
              }`}
            >
              <div className="w-full max-w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3.5 pt-1">
                {bestSellers.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    onClick={() => handleOpenProduct(item)}
                    isBestSeller
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. DANH SÁCH THỰC ĐƠN */}
        {isLoading ? (
          <div className="py-12 text-center w-full">
            <div className="inline-block h-7 w-7 animate-spin rounded-full border-3 border-brand-500 border-t-transparent mb-2" />
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Đang tải thực đơn thơm ngon...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-neutral-200 space-y-2.5 shadow-2xs w-full">
            <p className="text-xs font-black text-neutral-900 uppercase">
              Quán Đang Cập Nhật Thực Đơn
            </p>
            <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
              Bạn có thể cài đặt sẵn thông tin giao hàng hoặc quay lại sau ít phút nhé!
            </p>
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsProfileOpen(true)}
                className="text-xs font-bold"
              >
                📍 Cài Đặt Địa Chỉ Giao Hàng
              </Button>
            )}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-neutral-200 shadow-2xs w-full">
            <p className="text-xs font-bold text-neutral-800">
              Không tìm thấy món ăn nào phù hợp với tìm kiếm
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setPriceFilter("ALL");
                setSelectedCategory("ALL");
              }}
              className="text-xs font-bold text-brand-700 hover:text-brand-900 underline mt-1.5"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 w-full max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
              <h2 className="text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider">
                {searchQuery.trim()
                  ? `🔍 KẾT QUẢ TÌM KIẾM CHO "${searchQuery}" (${filteredProducts.length} MÓN)`
                  : selectedCategory !== "ALL"
                  ? `🍹 ${currentCategoryInfo.name.toUpperCase()} (${filteredProducts.length} MÓN)`
                  : priceFilter !== "ALL"
                  ? `💰 KẾT QUẢ THEO GIÁ (${filteredProducts.length} MÓN)`
                  : `📋 THỰC ĐƠN TỔNG HỢP (${filteredProducts.length} MÓN)`}
              </h2>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-800 bg-brand-50/80 border border-brand-200/60 px-2.5 py-1 rounded-lg w-fit">
                <Truck className="w-3.5 h-3.5 text-brand-700 flex-shrink-0" />
                <span>Giao tận nơi Sầm Sơn &amp; lân cận</span>
              </div>
            </div>
            <div className="w-full max-w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => handleOpenProduct(product)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 5. FOOTER CHUYÊN NGHIỆP */}
      <Footer />

      {/* 6. FLOATING BOTTOM BAR (Khi có món trong giỏ) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-3.5 bg-white/95 backdrop-blur-md border-t border-neutral-200 shadow-floating safe-bottom animate-slide-up w-full">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 min-w-0">
            <div
              className="cursor-pointer select-none min-w-0 flex-1"
              onClick={() => setIsCartDrawerOpen(true)}
            >
              <p className="text-[11px] font-black text-brand-700 uppercase tracking-wider truncate">
                🛍️ Giỏ hàng: {totalCartCount} món (Xem chi tiết ↑)
              </p>
              <p className="text-base sm:text-xl font-black text-brand-950 truncate">
                {formatCurrency(cartTotalAmount)}
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleInitiateCheckout}
              disabled={!isStoreOpen}
              className={`text-xs font-black uppercase tracking-wider px-5 sm:px-7 py-3 sm:py-3.5 rounded-2xl shadow-md active:scale-95 flex-shrink-0 ${
                !isStoreOpen
                  ? "bg-neutral-300 text-neutral-500 cursor-not-allowed hover:bg-neutral-300"
                  : "bg-brand-900 hover:bg-brand-950 text-white"
              }`}
            >
              {isStoreOpen ? "Đặt hàng ngay →" : "Quán tạm đóng cửa"}
            </Button>
          </div>
        </div>
      )}

      {/* 6. DRAWER GIỎ HÀNG (CRUD) */}
      <BottomSheet
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        title="GIỎ HÀNG CỦA BẠN"
        subtitle={`Tổng: ${formatCurrency(cartTotalAmount)} (${totalCartCount} món)`}
        maxWidth="md"
        footer={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsCartDrawerOpen(false)}
              className="text-xs font-black uppercase rounded-2xl"
            >
              Thêm món
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleInitiateCheckout}
              disabled={!isStoreOpen}
              className={`flex-1 text-xs font-black uppercase py-3.5 rounded-2xl shadow-md ${
                !isStoreOpen
                  ? "bg-neutral-300 text-neutral-500 cursor-not-allowed hover:bg-neutral-300"
                  : "bg-brand-900 hover:bg-brand-950 text-white"
              }`}
            >
              {isStoreOpen
                ? `Thanh toán (${formatCurrency(cartTotalAmount)})`
                : "Quán tạm đóng cửa"}
            </Button>
          </div>
        }
      >
        {/* THÔNG BÁO PHẠM VI GIAO HÀNG TRONG GIỎ HÀNG */}
        <div className="mb-3 p-2.5 bg-amber-50/90 rounded-xl border border-amber-200/80 space-y-1 text-xs select-none">
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            <Truck className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
            <span>Phạm vi giao hàng: Sầm Sơn &amp; lân cận</span>
          </div>
          <p className="text-[11px] text-amber-900/90 font-medium leading-relaxed">
            Trà Sữa Dino hiện chỉ phục vụ giao hàng trong khu vực Sầm Sơn, Thanh Hóa &amp; các khu vực lân cận. Vui lòng kiểm tra địa chỉ trước khi đặt.
          </p>
        </div>

        <div className="space-y-3 divide-y divide-neutral-100">
          {cart.map((item) => (
            <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-2.5 text-xs">
              <div className="flex-1 min-w-0 pr-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-neutral-900 text-xs sm:text-sm truncate">
                    {item.product.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleEditCartItem(item)}
                    className="text-[11px] font-bold text-brand-900 hover:text-brand-950 underline px-1 py-0.5 rounded"
                    title="Chỉnh sửa option và topping món"
                  >
                    Sửa
                  </button>
                </div>
                <p className="text-neutral-500 font-medium text-[11px] break-words">
                  {item.size}, {item.sugar}, {item.ice}
                  {item.toppings && item.toppings.length > 0 ? ` • Topping: ${item.toppings.join(", ")}` : ""}
                </p>
                {item.note && (
                  <p className="text-[11px] text-amber-950 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80 font-medium inline-block max-w-full break-words">
                    ✍️ {item.note}
                  </p>
                )}
                <p className="font-black text-brand-900 text-xs sm:text-sm">
                  {formatCurrency(item.totalPrice)}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                <div className="flex items-center gap-0.5 border border-neutral-300 rounded-lg p-0.5 bg-white">
                  <button
                    onClick={() => handleUpdateCartQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 rounded bg-neutral-100 font-bold text-neutral-800 flex items-center justify-center active:scale-90"
                    aria-label="Giảm số lượng"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-bold text-neutral-900 text-xs">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateCartQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 rounded bg-neutral-100 font-bold text-neutral-800 flex items-center justify-center active:scale-90"
                    aria-label="Tăng số lượng"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => handleRemoveCartItem(item.id)}
                  className="text-rose-600 hover:text-rose-800 font-bold px-1.5 py-1 text-[11px]"
                  title="Xóa món khỏi giỏ hàng"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* 7. POPUP TÙY BIẾN CHỌN MÓN HIỆN ĐẠI (CHỌN SIZE, ĐƯỜNG, ĐÁ, TOPPING MULTI-SELECT & GHI CHÚ) */}
      <ProductCustomizationModal
        isOpen={Boolean(selectedProduct)}
        onClose={() => {
          setSelectedProduct(null);
          setEditingCartItem(null);
        }}
        product={selectedProduct}
        initialData={
          editingCartItem
            ? {
                size: editingCartItem.size,
                sugar: editingCartItem.sugar,
                ice: editingCartItem.ice,
                toppings: editingCartItem.toppings,
                note: editingCartItem.note,
                quantity: editingCartItem.quantity,
              }
            : undefined
        }
        isEditing={Boolean(editingCartItem)}
        onConfirm={handleConfirmCustomization}
      />

      {/* 8. MODAL ĐẶT HÀNG & ĐỊA CHỈ GPS */}
      <BottomSheet
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="ĐẶT HÀNG GIAO TẬN NƠI"
        subtitle={`Tổng thanh toán: ${formatCurrency(finalTotalAmount)}${
          appliedCoupon ? ` (Đã giảm ${appliedCoupon.discountPercent}%)` : ""
        }`}
        maxWidth="md"
        footer={
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            isLoading={isOrdering}
            disabled={!isStoreOpen}
            onClick={handlePlaceOrder}
            className={`text-xs sm:text-sm font-black uppercase py-3.5 rounded-2xl shadow-md ${
              !isStoreOpen
                ? "bg-neutral-300 text-neutral-500 cursor-not-allowed hover:bg-neutral-300"
                : "bg-brand-900 hover:bg-brand-950 text-white"
            }`}
          >
            {isStoreOpen
              ? `Xác nhận đặt hàng (${formatCurrency(finalTotalAmount)})`
              : "Quán tạm đóng cửa (Không nhận đơn)"}
          </Button>
        }
      >
        <form onSubmit={handlePlaceOrder} className="space-y-3.5">
          {!isStoreOpen && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs font-medium space-y-1 select-none">
              <div className="font-bold flex items-center gap-1.5 text-rose-950">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Quán đang tạm đóng cửa nghỉ bán</span>
              </div>
              <p>
                Xin lỗi quý khách, quán tạm thời đóng cửa, xin quý khách vui lòng quay lại sau.
              </p>
            </div>
          )}
          {!user && (
            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between text-xs text-neutral-700">
              <span>Đăng nhập để lưu địa chỉ và theo dõi đơn:</span>
              <button
                type="button"
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setIsAuthOpen(true);
                }}
                className="font-bold underline"
              >
                Đăng nhập
              </button>
            </div>
          )}

          {/* Họ tên */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Tên Facebook người nhận <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                setFormErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="VD: Nguyễn Văn A..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-neutral-900 font-medium focus:outline-none text-sm ${
                formErrors.name ? "border-rose-400 bg-rose-50/20" : "border-neutral-300"
              }`}
              required
            />
            {formErrors.name && (
              <p className="text-[11px] text-rose-600 font-bold mt-0.5">⚠️ {formErrors.name}</p>
            )}
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Số điện thoại nhận hàng <span className="text-rose-600">*</span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => {
                setCustomerPhone(e.target.value);
                setFormErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              placeholder="VD: 0908123456..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-neutral-900 font-medium focus:outline-none text-sm ${
                formErrors.phone ? "border-rose-400 bg-rose-50/20" : "border-neutral-300"
              }`}
              required
            />
            {formErrors.phone && (
              <p className="text-[11px] text-rose-600 font-bold mt-0.5">⚠️ {formErrors.phone}</p>
            )}
          </div>

          {/* THÔNG BÁO PHẠM VI GIAO HÀNG TẠI CHECKOUT */}
          <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200/90 space-y-1 text-xs select-none">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <Truck className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>Phạm vi giao hàng</span>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-900 font-medium leading-relaxed">
              Trà Sữa Dino hiện chỉ giao hàng trong khu vực <strong>Sầm Sơn, Thanh Hóa</strong> và các khu vực lân cận thuộc phạm vi phục vụ.
            </p>
          </div>

          {/* Địa chỉ giao hàng (GPS) */}
          <div>
            <AddressLocationPicker
              value={deliveryAddress}
              onChange={(addr, lat, lng) => {
                setDeliveryAddress(addr);
                setDeliveryLat(lat);
                setDeliveryLng(lng);
                setFormErrors((prev) => ({ ...prev, address: undefined }));
              }}
              lat={deliveryLat}
              lng={deliveryLng}
              savedAddresses={user?.savedAddresses || []}
              required={true}
              error={formErrors.address}
            />

            {/* CẢNH BÁO THÂN THIỆN NẾU ĐỊA CHỈ THUỘC TỈNH/THÀNH PHỐ XA */}
            {isAddressOutsideScope && (
              <div className="mt-2.5 p-3 bg-amber-50/95 border border-amber-300/90 rounded-2xl text-xs space-y-2 animate-in fade-in select-none">
                <div className="flex items-start gap-2 text-amber-950">
                  <span className="text-base flex-shrink-0">⚠️</span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-amber-950">
                      Địa chỉ của bạn có thể nằm ngoài phạm vi giao hàng trực tiếp.
                    </p>
                    <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                      Trà Sữa Dino hiện phục vụ giao hàng tại Sầm Sơn và các khu vực lân cận. Vui lòng liên hệ hotline quán để được hỗ trợ kiểm tra tuyến giao nhanh nhất.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-amber-200">
                  <a
                    href="tel:0858798206"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 hover:bg-emerald-50 transition-colors shadow-2xs"
                  >
                    <Phone className="w-3 h-3 text-emerald-700" />
                    <span>Gọi 0858798206 xác nhận</span>
                  </a>
                  <a
                    href="https://zalo.me/0858798206"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-white px-2.5 py-1 rounded-lg border border-sky-300 hover:bg-sky-50 transition-colors shadow-2xs"
                  >
                    <span>Chat Zalo</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Ghi chú cho quán (nếu có)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Để riêng trân châu, giao trước 11h..."
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-neutral-900 font-medium focus:outline-none text-sm"
            />
          </div>

          {/* Mã giảm giá (Coupon / Voucher) */}
          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5">
            <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider">
              🎟️ MÃ GIẢM GIÁ (VOUCHER)
            </label>

            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl animate-scale-up">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs sm:text-sm text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 uppercase tracking-wider">
                    {appliedCoupon.code}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    {appliedCoupon.discountType === "PERCENT"
                      ? `Giảm ${appliedCoupon.discountValue ?? appliedCoupon.discountPercent}% (-${formatCurrency(appliedCoupon.discountAmount)})`
                      : `Giảm -${formatCurrency(appliedCoupon.discountAmount)}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs font-black text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Bỏ mã giảm giá"
                >
                  ✕ Bỏ mã
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCouponCode}
                  onChange={(e) => {
                    setInputCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ""));
                    setCouponError(null);
                  }}
                  placeholder="Nhập mã voucher (VD: DINO10, DINO20)..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleApplyCoupon}
                  isLoading={isCheckingCoupon}
                  className="bg-brand-900 hover:bg-brand-950 text-white font-black text-xs uppercase px-4 rounded-xl"
                >
                  ÁP DỤNG
                </Button>
              </div>
            )}

            {couponError && (
              <p className="text-[11px] font-bold text-rose-600 animate-slide-up">
                ⚠️ {couponError}
              </p>
            )}

            {/* Chi tiết tính tiền */}
            <div className="pt-2 border-t border-neutral-200/80 space-y-1 text-xs font-medium text-neutral-600">
              <div className="flex justify-between items-center">
                <span>Tạm tính tiền món ({totalCartCount} món):</span>
                <span className="font-bold text-neutral-900">{formatCurrency(cartTotalAmount)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center text-emerald-700 font-bold">
                  <span>
                    Khuyến mãi ({appliedCoupon.code}
                    {appliedCoupon.discountType === "PERCENT"
                      ? ` - ${appliedCoupon.discountValue ?? appliedCoupon.discountPercent}%`
                      : ""}):
                  </span>
                  <span>-{formatCurrency(appliedCoupon.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-neutral-200 text-sm font-black text-brand-950">
                <span>Tổng cộng thanh toán:</span>
                <span className="text-base text-brand-900">{formatCurrency(finalTotalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Hình thức thanh toán
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("SEPAY_QR")}
                className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === "SEPAY_QR"
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-2xs"
                    : "bg-white text-neutral-800 border-neutral-300"
                }`}
              >
                Thanh toán qua Bank
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("COD")}
                className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === "COD"
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-2xs"
                    : "bg-white text-neutral-800 border-neutral-300"
                }`}
              >
                Tiền mặt khi nhận (COD)
              </button>
            </div>
          </div>
        </form>
      </BottomSheet>

      {/* 9. MODAL ĐẶT HÀNG THÀNH CÔNG & THANH TOÁN QR */}
      {orderSuccess && orderSuccess.paymentMethod === "SEPAY_QR" && (
        <SepayQrPaymentModal
          isOpen={Boolean(orderSuccess)}
          onClose={() => setOrderSuccess(null)}
          orderCode={orderSuccess.orderCode}
          totalAmount={orderSuccess.totalAmount}
          onPaymentSuccess={() => {
            showToast(`🎉 Đơn hàng #${orderSuccess.orderCode} đã được thanh toán thành công!`, "success");
          }}
          onViewOrders={() => setIsUserOrdersOpen(true)}
          onReorder={() => {
            setOrderSuccess(null);
            setIsCheckoutOpen(true);
          }}
        />
      )}

      {orderSuccess && orderSuccess.paymentMethod === "COD" && (
        <BottomSheet
          isOpen={Boolean(orderSuccess)}
          onClose={() => setOrderSuccess(null)}
          title="❤️ CẢM ƠN BẠN!"
          subtitle={`Mã đơn: #${orderSuccess.orderCode}`}
          maxWidth="md"
          footer={
            <div className="space-y-2 w-full">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => {
                  setOrderSuccess(null);
                  setIsUserOrdersOpen(true);
                }}
                className="text-xs sm:text-sm font-black uppercase tracking-wider bg-brand-900 hover:bg-brand-950 text-white py-3.5 rounded-2xl shadow-md"
              >
                Xem tiến độ đơn hàng ngay →
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyOrderLink(orderSuccess.orderCode)}
                  className="w-full py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-amber-300 shadow-2xs active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép link</span>
                </button>
                <Link
                  href={`/don-hang?code=${encodeURIComponent(orderSuccess.orderCode)}`}
                  onClick={() => setOrderSuccess(null)}
                  className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-neutral-300 shadow-2xs active:scale-95 text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở trang riêng</span>
                </Link>
              </div>
            </div>
          }
        >
          <div className="text-center space-y-4 py-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 text-2xl font-black shadow-2xs">
              ✓
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-black text-brand-950 uppercase tracking-tight">
                Đặt hàng thành công!
              </h4>
              <p className="text-xs sm:text-sm font-medium text-neutral-600 mt-1">
                Đơn hàng của bạn đã được gửi đến quán Trà Sữa Dino.
              </p>
            </div>

            {/* GIAO DIỆN COD */}
            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-900 tracking-wider">
                  PHƯƠNG THỨC THANH TOÁN
                </span>
                <Badge variant="warning" size="sm">
                  💵 TIỀN MẶT KHI NHẬN (COD)
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 text-xs">
                <span className="text-neutral-600 font-medium">Mã đơn hàng:</span>
                <span className="font-mono font-black text-sm text-brand-950">#{orderSuccess.orderCode}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-600 font-medium">Tổng tiền cần thanh toán:</span>
                <span className="font-black text-base text-brand-900">
                  {formatCurrency(orderSuccess.totalAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-600 font-medium">Trạng thái đơn:</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  🟢 Quán đã nhận đơn
                </span>
              </div>

              <p className="text-[11px] text-amber-800 font-medium bg-white/80 p-2.5 rounded-xl border border-amber-200/60 text-center mt-1">
                💡 Bạn có thể xem lại tiến độ đơn bất kỳ lúc nào tại mục <b>"Tra cứu đơn"</b> trên trang chủ hoặc mở link theo dõi mà <b>không cần đăng nhập tài khoản</b>.
              </p>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} defaultTab={authDefaultTab} />
      <UserOrdersModal isOpen={isUserOrdersOpen} onClose={() => setIsUserOrdersOpen(false)} />
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        focusField={profileFocusField}
        onSavedSuccess={handleProfileSavedSuccess}
      />
      <MissingProfileModal
        isOpen={isMissingInfoModalOpen}
        onClose={() => setIsMissingInfoModalOpen(false)}
        missingFields={missingFieldsState}
        onGoToProfile={handleGoToProfileToFillInfo}
      />
      <OnboardingGuideModal />
    </div>
  );
}
