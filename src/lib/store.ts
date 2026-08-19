import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import {
  Category,
  Product,
  Order,
  User,
  SavedAddress,
  StoreSetting,
  OrderStatus,
  DashboardStats,
  Coupon,
  VoucherUsage,
  RefreshSession,
} from "./types";
import { nhungCategories, nhungProducts } from "./nhungMenuData";
import { normalizeCoupon, validateVoucherEngine, ValidateVoucherResult } from "./voucherService";

interface StoreState {
  categories: Category[];
  products: Product[];
  orders: Order[];
  users: User[];
  coupons: Coupon[];
  voucherUsages: VoucherUsage[];
  refreshSessions: RefreshSession[];
  rotatedTokensHistory: { tokenHash: string; familyId: string; rotatedAt: string }[];
  settings: StoreSetting;
}

declare global {
  // eslint-disable-next-line no-var
  var __STORE__: StoreState | undefined;
}

const envAdminEmail = (process.env.ADMIN_EMAIL || "admin@dino.vn").trim();
const envAdminPassword = (process.env.ADMIN_PASSWORD || "admin123").trim();

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store_data.json");

const defaultSettings: StoreSetting = {
  storeName: "TRÀ SỮA & ĂN VẶT NHUNG",
  hotline: "0988.888.888",
  address: "Cửa hàng Quán Nhung, TP. Hồ Chí Minh",
  isOpen: true,
  openTime: "08:00",
  closeTime: "22:30",
  sepayApiKey: "",
  sepayAccountNumber: "",
  sepayBankName: "MBBank",
  sepayAccountName: "",
  sepayQrPattern: "",
};

const defaultCoupons: Coupon[] = [
  {
    id: "cpn-dino10",
    code: "DINO10",
    description: "Giảm 10% toàn menu cho khách hàng mới",
    discountType: "PERCENT",
    discountValue: 10,
    discountPercent: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 50000,
    customerScope: "ALL",
    isActive: true,
    usageLimit: 100,
    usageCount: 0,
    usagePerUser: 1,
    applyScope: "ALL",
    applicableCategoryIds: [],
    applicableProductIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "cpn-dino20",
    code: "DINO20",
    description: "Giảm 20% cho đơn hàng từ 60.000đ",
    discountType: "PERCENT",
    discountValue: 20,
    discountPercent: 20,
    minOrderAmount: 60000,
    maxDiscountAmount: 30000,
    customerScope: "ALL",
    isActive: true,
    usageLimit: 50,
    usageCount: 0,
    usagePerUser: 1,
    applyScope: "ALL",
    applicableCategoryIds: [],
    applicableProductIds: [],
    createdAt: new Date().toISOString(),
  },
];

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.error("Lỗi tạo thư mục data:", e);
    }
  }
}

export function saveStoreToFile(customState?: StoreState) {
  const target = customState || global.__STORE__;
  if (!target) return;
  try {
    ensureDataDirectory();
    fs.writeFileSync(STORE_FILE, JSON.stringify(target, null, 2), "utf-8");
    global.__STORE__ = target;
  } catch (e) {
    console.error("Lỗi lưu file store_data.json:", e);
  }
}

export function getStore(): StoreState {
  ensureDataDirectory();
  if (fs.existsSync(STORE_FILE)) {
    try {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          if (!Array.isArray(parsed.categories)) parsed.categories = [...nhungCategories];
          if (!Array.isArray(parsed.products)) parsed.products = [...nhungProducts];
          if (!Array.isArray(parsed.orders)) parsed.orders = [];
          if (!Array.isArray(parsed.coupons)) parsed.coupons = [...defaultCoupons];
          if (!Array.isArray(parsed.voucherUsages)) parsed.voucherUsages = [];
          if (!Array.isArray(parsed.users)) parsed.users = [];
          if (!Array.isArray(parsed.refreshSessions)) parsed.refreshSessions = [];
          if (!Array.isArray(parsed.rotatedTokensHistory)) parsed.rotatedTokensHistory = [];
          if (!parsed.settings || typeof parsed.settings !== "object") {
            parsed.settings = { ...defaultSettings };
          }

          // Chuẩn hóa toàn bộ danh sách coupons đã lưu
          parsed.coupons = parsed.coupons.map((c: any) => normalizeCoupon(c));

          // Đảm bảo có tài khoản Admin từ biến môi trường
          const hasAdmin = parsed.users.some(
            (u: User) => u.role === "ADMIN" || u.id === "usr-admin"
          );
          if (!hasAdmin) {
            parsed.users.unshift({
              id: "usr-admin",
              name: "Chủ Quán (Admin)",
              email: envAdminEmail,
              passwordHash: envAdminPassword,
              role: "ADMIN",
              address: "Cửa hàng chính",
              createdAt: new Date().toISOString(),
            });
          }

          // Đảm bảo có tài khoản Khách Vãng Lai hệ thống cố định
          const hasSystemGuest = parsed.users.some(
            (u: User) => u.id === "usr-system-guest"
          );
          if (!hasSystemGuest) {
            parsed.users.push({
              id: "usr-system-guest",
              name: "Khách Vãng Lai (System)",
              role: "CUSTOMER",
              createdAt: new Date().toISOString(),
            });
          }

          global.__STORE__ = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.error("Lỗi đọc file store_data.json:", e);
    }
  }

  // Khởi tạo mặc định nếu file chưa có
  const defaultStore: StoreState = {
    categories: [...nhungCategories],
    products: [...nhungProducts],
    orders: [],
    coupons: [...defaultCoupons],
    voucherUsages: [],
    refreshSessions: [],
    rotatedTokensHistory: [],
    users: [
      {
        id: "usr-admin",
        name: "Chủ Quán (Admin)",
        email: envAdminEmail,
        passwordHash: envAdminPassword,
        role: "ADMIN",
        address: "Cửa hàng chính",
        createdAt: new Date().toISOString(),
      },
    ],
    settings: { ...defaultSettings },
  };

  saveStoreToFile(defaultStore);
  global.__STORE__ = defaultStore;
  return defaultStore;
}

export const dataStore = {
  // --- Categories ---
  getCategories: () => {
    const store = getStore();
    return store.categories;
  },
  getCategoryById: (id: string) => {
    const store = getStore();
    return store.categories.find((c) => c.id === id);
  },
  addCategory: (cat: Omit<Category, "id">) => {
    const store = getStore();
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
    };
    store.categories.push(newCat);
    saveStoreToFile(store);
    return newCat;
  },
  updateCategory: (id: string, updates: Partial<Category>) => {
    const store = getStore();
    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      store.categories[idx] = { ...store.categories[idx], ...updates };
      saveStoreToFile(store);
      return store.categories[idx];
    }
    return null;
  },
  deleteCategory: (id: string) => {
    const store = getStore();
    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const removed = store.categories.splice(idx, 1);
      saveStoreToFile(store);
      return removed[0];
    }
    return null;
  },

  // --- Products ---
  getProducts: (categoryId?: string, search?: string) => {
    const store = getStore();
    let list = store.products;
    if (categoryId && categoryId !== "ALL") {
      list = list.filter((p) => p.categoryId === categoryId);
    }
    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    return list;
  },
  getProductById: (id: string) => {
    const store = getStore();
    return store.products.find((p) => p.id === id);
  },
  addProduct: (prod: Omit<Product, "id">) => {
    const store = getStore();
    const category = store.categories.find((c) => c.id === prod.categoryId);
    const newProd: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
      categoryName: category?.name || "Món quán",
      salesCount: prod.salesCount || 0,
      createdAt: new Date().toISOString(),
    };
    store.products.unshift(newProd);
    saveStoreToFile(store);
    return newProd;
  },
  updateProduct: (id: string, updates: Partial<Product>) => {
    const store = getStore();
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      if (updates.categoryId) {
        const cat = store.categories.find((c) => c.id === updates.categoryId);
        if (cat) updates.categoryName = cat.name;
      }
      store.products[idx] = { ...store.products[idx], ...updates };
      saveStoreToFile(store);
      return store.products[idx];
    }
    return null;
  },
  toggleProductAvailability: (id: string) => {
    const store = getStore();
    const prod = store.products.find((p) => p.id === id);
    if (prod) {
      prod.isAvailable = !prod.isAvailable;
      saveStoreToFile(store);
      return prod;
    }
    return null;
  },
  deleteProduct: (id: string) => {
    const store = getStore();
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const removed = store.products.splice(idx, 1);
      saveStoreToFile(store);
      return removed[0];
    }
    return null;
  },

  // --- Điều Chỉnh Giá Sản Phẩm (Tăng / Giảm Cố định hoặc Phần trăm) ---
  adjustProductPrices: (params: {
    scope: "ALL" | "SELECTED";
    productIds?: string[];
    adjustmentType: "FIXED" | "PERCENT";
    direction?: "INCREASE" | "DECREASE";
    amount: number;
    roundTo?: number;
  }) => {
    const store = getStore();
    const { scope, productIds = [], adjustmentType, direction = "INCREASE", amount, roundTo = 1000 } = params;
    const targetProducts =
      scope === "ALL"
        ? store.products
        : store.products.filter((p) => productIds.includes(p.id));

    const updatedList: { id: string; name: string; oldPrice: number; newPrice: number }[] = [];
    const effectiveAmount = direction === "DECREASE" ? -Math.abs(amount) : Math.abs(amount);

    targetProducts.forEach((p) => {
      const oldPrice = p.price;
      let newPrice = oldPrice;
      if (adjustmentType === "FIXED") {
        newPrice = oldPrice + effectiveAmount;
      } else if (adjustmentType === "PERCENT") {
        newPrice = oldPrice * (1 + effectiveAmount / 100);
      }

      if (roundTo > 0) {
        newPrice = Math.round(newPrice / roundTo) * roundTo;
      }
      newPrice = Math.max(0, Math.round(newPrice));

      p.price = newPrice;
      updatedList.push({ id: p.id, name: p.name, oldPrice, newPrice });
    });

    saveStoreToFile(store);

    return {
      success: true,
      updatedCount: updatedList.length,
      products: updatedList,
    };
  },

  // --- Reset/Seed Menu ---
  seedNhungMenu: () => {
    const store = getStore();
    store.categories = [...nhungCategories];
    store.products = [...nhungProducts];
    saveStoreToFile(store);
    return {
      categories: store.categories,
      products: store.products,
      totalDrinks: 44,
      totalToppings: 4,
      totalCategories: 10,
    };
  },

  // --- Orders ---
  getOrders: (status?: string, email?: string) => {
    const store = getStore();
    let list = [...store.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (status && status !== "ALL") {
      list = list.filter((o) => o.orderStatus === status);
    }
    if (email) {
      list = list.filter(
        (o) => o.customerEmail?.toLowerCase() === email.toLowerCase()
      );
    }
    return list;
  },
  getOrderById: (identifier: string) => {
    const store = getStore();
    if (!identifier) return null;
    const raw = String(identifier).trim();
    const cleanUpper = raw.replace(/^#/, "").trim().toUpperCase();
    return (
      store.orders.find(
        (o) =>
          o.id === raw ||
          o.orderCode === raw ||
          o.id.toUpperCase() === cleanUpper ||
          o.orderCode.toUpperCase() === cleanUpper ||
          (o.trackingToken && o.trackingToken === raw)
      ) || null
    );
  },
  updateOrderStatus: (identifier: string, status: OrderStatus) => {
    const store = getStore();
    if (!identifier) return null;
    const raw = String(identifier).trim();
    const cleanUpper = raw.replace(/^#/, "").trim().toUpperCase();
    const ord = store.orders.find(
      (o) =>
        o.id === raw ||
        o.orderCode === raw ||
        o.id.toUpperCase() === cleanUpper ||
        o.orderCode.toUpperCase() === cleanUpper ||
        (o.trackingToken && o.trackingToken === raw)
    );
    if (ord) {
      const prevStatus = ord.orderStatus;
      ord.orderStatus = status;
      ord.updatedAt = new Date().toISOString();

      // Nếu đơn hàng bị HỦY (CANCELLED) và đơn này từng áp dụng mã voucher:
      // Hoàn lại số lượt sử dụng voucher cho hệ thống
      if (status === "CANCELLED" && prevStatus !== "CANCELLED" && ord.couponCode) {
        const cpn = store.coupons?.find(
          (c) => c.code.toUpperCase() === ord.couponCode?.toUpperCase().trim()
        );
        if (cpn) {
          cpn.usageCount = Math.max(0, (cpn.usageCount || 1) - 1);
        }
        if (store.voucherUsages) {
          const uIdx = store.voucherUsages.findIndex(
            (u) => u.orderId === ord.id || u.orderCode === ord.orderCode
          );
          if (uIdx !== -1) {
            store.voucherUsages.splice(uIdx, 1);
          }
        }
      }

      saveStoreToFile(store);
      return ord;
    }
    return null;
  },
  createOrder: (orderData: Omit<Order, "id" | "orderCode" | "createdAt">) => {
    const store = getStore();
    const codeNum = Math.floor(100 + Math.random() * 900);
    const trackingToken = `trk_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const finalUserId = (orderData.userId && orderData.userId.trim()) || "usr-system-guest";
    const isGuest = !orderData.userId || orderData.userId === "usr-system-guest";
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderCode: `DINO-${codeNum}`,
      userId: finalUserId,
      trackingToken,
      isGuest,
      createdAt: new Date().toISOString(),
    };
    store.orders.unshift(newOrder);

    // Tăng salesCount cho các món trong đơn
    orderData.items.forEach((item) => {
      const prod = store.products.find(
        (p) => p.name === item.productName || p.id === item.productId
      );
      if (prod) {
        prod.salesCount = (prod.salesCount || 0) + item.quantity;
      }
    });

    // Nếu có áp dụng mã giảm giá, tăng lượt dùng mã & ghi nhận bản ghi lưu vết (voucherUsage)
    if (orderData.couponCode) {
      const cleanCode = orderData.couponCode.toUpperCase().trim();
      const cpn = store.coupons?.find((c) => c.code.toUpperCase() === cleanCode);
      if (cpn) {
        cpn.usageCount = (cpn.usageCount || 0) + 1;

        if (!store.voucherUsages) store.voucherUsages = [];
        store.voucherUsages.unshift({
          id: `vusage-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          couponId: cpn.id,
          couponCode: cpn.code,
          userId: orderData.userId,
          customerPhone: orderData.customerPhone,
          customerEmail: orderData.customerEmail,
          orderId: newOrder.id,
          orderCode: newOrder.orderCode,
          discountAmount: orderData.discountAmount || 0,
          usedAt: new Date().toISOString(),
        });
      }
    }

    saveStoreToFile(store);
    return newOrder;
  },
  deleteOrder: (identifier: string) => {
    const store = getStore();
    if (!identifier) return null;
    const raw = String(identifier).trim();
    const cleanUpper = raw.replace(/^#/, "").trim().toUpperCase();
    const idx = store.orders.findIndex(
      (o) =>
        o.id === raw ||
        o.orderCode === raw ||
        o.id.toUpperCase() === cleanUpper ||
        o.orderCode.toUpperCase() === cleanUpper
    );
    if (idx !== -1) {
      const removed = store.orders.splice(idx, 1)[0];
      // Xóa các bản ghi liên quan (voucherUsages) nếu có để tránh orphan data
      if (store.voucherUsages) {
        store.voucherUsages = store.voucherUsages.filter(
          (u) => u.orderId !== removed.id && u.orderCode !== removed.orderCode
        );
      }
      saveStoreToFile(store);
      return removed;
    }
    return null;
  },
  markOrderPaidByCode: (orderCode: string) => {
    const store = getStore();
    const ord = store.orders.find(
      (o) => o.orderCode.toLowerCase() === orderCode.toLowerCase()
    );
    if (ord) {
      ord.paymentStatus = "PAID";
      ord.updatedAt = new Date().toISOString();
      saveStoreToFile(store);
      return ord;
    }
    return null;
  },

  // --- Coupons (Mã Giảm Giá - Voucher Engine) ---
  getCoupons: () => {
    const store = getStore();
    if (!store.coupons) store.coupons = [];
    return [...store.coupons]
      .map((c) => normalizeCoupon(c))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  getCouponById: (id: string) => {
    const store = getStore();
    const c = store.coupons?.find((cp) => cp.id === id);
    return c ? normalizeCoupon(c) : undefined;
  },
  getCouponByCode: (code: string) => {
    const store = getStore();
    const clean = code.toUpperCase().trim();
    const c = store.coupons?.find((cp) => cp.code.toUpperCase().trim() === clean);
    return c ? normalizeCoupon(c) : undefined;
  },
  createCoupon: (couponData: Partial<Coupon> & { code: string }) => {
    const store = getStore();
    if (!store.coupons) store.coupons = [];
    const cleanCode = couponData.code.toUpperCase().trim().replace(/\s+/g, "");

    const existing = store.coupons.find((c) => c.code.toUpperCase() === cleanCode);
    if (existing) {
      throw new Error(`Mã giảm giá "${cleanCode}" đã tồn tại trên hệ thống.`);
    }

    const newCoupon: Coupon = normalizeCoupon({
      ...couponData,
      id: `cpn-${Date.now()}`,
      code: cleanCode,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    });

    store.coupons.unshift(newCoupon);
    saveStoreToFile(store);
    return newCoupon;
  },
  updateCoupon: (id: string, updates: Partial<Coupon>) => {
    const store = getStore();
    if (!store.coupons) store.coupons = [];
    const idx = store.coupons.findIndex((c) => c.id === id);
    if (idx !== -1) {
      if (updates.code) {
        updates.code = updates.code.toUpperCase().trim().replace(/\s+/g, "");
        const dup = store.coupons.find((c) => c.id !== id && c.code.toUpperCase() === updates.code);
        if (dup) throw new Error(`Mã giảm giá "${updates.code}" đã được sử dụng.`);
      }

      const merged = {
        ...store.coupons[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      store.coupons[idx] = normalizeCoupon(merged);
      saveStoreToFile(store);
      return store.coupons[idx];
    }
    return null;
  },
  toggleCoupon: (id: string) => {
    const store = getStore();
    if (!store.coupons) store.coupons = [];
    const cpn = store.coupons.find((c) => c.id === id);
    if (cpn) {
      cpn.isActive = !cpn.isActive;
      cpn.updatedAt = new Date().toISOString();
      saveStoreToFile(store);
      return normalizeCoupon(cpn);
    }
    return null;
  },
  deleteCoupon: (id: string) => {
    const store = getStore();
    if (!store.coupons) store.coupons = [];
    const idx = store.coupons.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const removed = store.coupons.splice(idx, 1)[0];
      saveStoreToFile(store);
      return normalizeCoupon(removed);
    }
    return null;
  },
  validateCoupon: (
    code: string,
    orderAmount: number,
    items?: { productId?: string; productName?: string; unitPrice: number; quantity: number; totalPrice: number }[],
    user?: { id?: string; email?: string; phone?: string }
  ): ValidateVoucherResult => {
    const store = getStore();
    if (!store.coupons) store.coupons = [];
    if (!store.orders) store.orders = [];
    if (!store.products) store.products = [];
    if (!store.voucherUsages) store.voucherUsages = [];

    return validateVoucherEngine({
      code,
      orderAmount,
      items,
      user,
      coupons: store.coupons,
      orders: store.orders,
      products: store.products,
      voucherUsages: store.voucherUsages,
    });
  },

  // --- Users & Authentication & Profile CRUD ---
  getUsers: () => {
    const store = getStore();
    return store.users.filter((u) => u.id !== "usr-system-guest");
  },
  findUserByEmail: (email: string) => {
    const store = getStore();
    return store.users.find(
      (u) =>
        u.email?.toLowerCase() === email.toLowerCase().trim() ||
        (u.phone && u.phone === email.trim())
    );
  },
  findUserById: (id: string) => {
    const store = getStore();
    return store.users.find((u) => u.id === id);
  },

  registerUser: (email: string, rawPassword: string, name?: string) => {
    const store = getStore();
    const cleanEmail = email.toLowerCase().trim();
    const existing = store.users.find((u) => u.email?.toLowerCase() === cleanEmail);
    if (existing) return null;

    const defaultName = name?.trim() || cleanEmail.split("@")[0];
    const passwordHash = bcrypt.hashSync(rawPassword, 10);

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: defaultName,
      email: cleanEmail,
      passwordHash,
      role: "CUSTOMER",
      savedAddresses: [],
      createdAt: new Date().toISOString(),
    };
    store.users.unshift(newUser);
    saveStoreToFile(store);
    return newUser;
  },

  authenticateUser: (identifier: string, passwordAttempt: string) => {
    const store = getStore();
    const cleanId = identifier.toLowerCase().trim();
    const currentAdminEmail = (process.env.ADMIN_EMAIL || "admin@dino.vn").toLowerCase().trim();
    const currentAdminPassword = (process.env.ADMIN_PASSWORD || "admin123").trim();

    // 1. Kiểm tra nếu người dùng đăng nhập bằng tài khoản Admin từ .env
    if (cleanId === currentAdminEmail) {
      if (passwordAttempt === currentAdminPassword) {
        let adminUser = store.users.find((u) => u.role === "ADMIN" || u.id === "usr-admin");
        if (!adminUser) {
          adminUser = {
            id: "usr-admin",
            name: "Chủ Quán (Admin)",
            email: currentAdminEmail,
            passwordHash: currentAdminPassword,
            role: "ADMIN",
            address: "Cửa hàng chính",
            createdAt: new Date().toISOString(),
          };
          store.users.unshift(adminUser);
          saveStoreToFile(store);
        } else {
          adminUser.email = currentAdminEmail;
          adminUser.role = "ADMIN";
        }
        return { success: true, user: adminUser };
      } else {
        return { success: false, error: "INVALID_PASSWORD" };
      }
    }

    // 2. Kiểm tra tài khoản Người dùng / Khách hàng thông thường trong hệ thống
    const user = store.users.find(
      (u) =>
        u.email?.toLowerCase() === cleanId ||
        (u.phone && u.phone === cleanId)
    );
    if (!user) return { success: false, error: "EMAIL_NOT_FOUND" };

    let isMatch = false;
    if (user.passwordHash) {
      if (user.passwordHash.startsWith("$2a$") || user.passwordHash.startsWith("$2b$")) {
        isMatch = bcrypt.compareSync(passwordAttempt, user.passwordHash);
      } else {
        isMatch = user.passwordHash === passwordAttempt;
      }
    }

    if (!isMatch) {
      return { success: false, error: "INVALID_PASSWORD" };
    }
    return { success: true, user };
  },

  // --- Refresh Token & Session Management ---
  createRefreshSession: (params: {
    userId: string;
    tokenHash: string;
    familyId: string;
    role: "ADMIN" | "STAFF" | "CUSTOMER";
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }): RefreshSession => {
    const store = getStore();
    if (!store.refreshSessions) store.refreshSessions = [];

    const newSession: RefreshSession = {
      id: `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: params.userId,
      tokenHash: params.tokenHash,
      familyId: params.familyId,
      role: params.role,
      deviceId: params.deviceId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      expiresAt: params.expiresAt.toISOString(),
      lastUsedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    store.refreshSessions.unshift(newSession);
    saveStoreToFile(store);
    return newSession;
  },

  findRefreshSessionByHash: (tokenHash: string): RefreshSession | undefined => {
    const store = getStore();
    if (!store.refreshSessions) store.refreshSessions = [];
    return store.refreshSessions.find((s) => s.tokenHash === tokenHash);
  },

  findRotatedTokenRecord: (tokenHash: string) => {
    const store = getStore();
    if (!store.rotatedTokensHistory) store.rotatedTokensHistory = [];
    return store.rotatedTokensHistory.find((r) => r.tokenHash === tokenHash);
  },

  rotateRefreshSession: (
    oldTokenHash: string,
    newTokenHash: string,
    newExpiresAt: Date,
    ipAddress?: string,
    userAgent?: string
  ): RefreshSession | null => {
    const store = getStore();
    if (!store.refreshSessions) store.refreshSessions = [];
    if (!store.rotatedTokensHistory) store.rotatedTokensHistory = [];

    const session = store.refreshSessions.find((s) => s.tokenHash === oldTokenHash);
    if (!session) return null;

    store.rotatedTokensHistory.push({
      tokenHash: oldTokenHash,
      familyId: session.familyId,
      rotatedAt: new Date().toISOString(),
    });

    session.tokenHash = newTokenHash;
    session.expiresAt = newExpiresAt.toISOString();
    session.lastUsedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();
    if (ipAddress) session.ipAddress = ipAddress;
    if (userAgent) session.userAgent = userAgent;

    saveStoreToFile(store);
    return session;
  },

  revokeRefreshSession: (tokenHash: string): boolean => {
    const store = getStore();
    if (!store.refreshSessions) store.refreshSessions = [];
    const session = store.refreshSessions.find((s) => s.tokenHash === tokenHash);
    if (session) {
      session.revokedAt = new Date().toISOString();
      session.updatedAt = new Date().toISOString();
      saveStoreToFile(store);
      return true;
    }
    return false;
  },

  revokeFamilySessions: (familyId: string): number => {
    const store = getStore();
    if (!store.refreshSessions) store.refreshSessions = [];
    let count = 0;
    const now = new Date().toISOString();
    store.refreshSessions.forEach((s) => {
      if (s.familyId === familyId && !s.revokedAt) {
        s.revokedAt = now;
        s.updatedAt = now;
        count++;
      }
    });
    if (count > 0) saveStoreToFile(store);
    return count;
  },

  revokeAllUserSessions: (userId: string): number => {
    const store = getStore();
    if (!store.refreshSessions) store.refreshSessions = [];
    let count = 0;
    const now = new Date().toISOString();
    store.refreshSessions.forEach((s) => {
      if (s.userId === userId && !s.revokedAt) {
        s.revokedAt = now;
        s.updatedAt = now;
        count++;
      }
    });
    if (count > 0) saveStoreToFile(store);
    return count;
  },

  loginWithGoogle: (email: string, name: string, googleId: string, avatar?: string) => {
    const store = getStore();
    const cleanEmail = email.toLowerCase().trim();
    const envAdminEmail = (process.env.ADMIN_EMAIL || "admin@dino.vn").toLowerCase().trim();
    const isEnvAdmin = cleanEmail === envAdminEmail;

    let user = store.users.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (!user) {
      user = {
        id: isEnvAdmin ? "usr-admin" : `usr-${Date.now()}`,
        name: isEnvAdmin ? "Chủ Quán (Admin)" : (name || cleanEmail.split("@")[0]),
        email: cleanEmail,
        googleId,
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
        role: isEnvAdmin ? "ADMIN" : "CUSTOMER",
        savedAddresses: [],
        createdAt: new Date().toISOString(),
      };
      store.users.unshift(user);
    } else {
      user.googleId = googleId;
      if (avatar) user.avatar = avatar;
      if (name && !isEnvAdmin) user.name = name;
      if (isEnvAdmin) {
        user.role = "ADMIN";
      }
    }
    saveStoreToFile(store);
    return user;
  },

  updateUserProfile: (userId: string, updates: Partial<User>) => {
    const store = getStore();
    const user = store.users.find((u) => u.id === userId || u.email === userId);
    if (user) {
      if (updates.name) user.name = updates.name;
      if (updates.phone) user.phone = updates.phone;
      if (updates.address) user.address = updates.address;
      if (updates.avatar) user.avatar = updates.avatar;
      saveStoreToFile(store);
      return user;
    }
    return null;
  },

  // Saved Addresses CRUD
  addSavedAddress: (userId: string, addressData: Omit<SavedAddress, "id">) => {
    const store = getStore();
    const user = store.users.find((u) => u.id === userId || u.email === userId);
    if (!user) return null;
    if (!user.savedAddresses) user.savedAddresses = [];

    const newAddress: SavedAddress = {
      ...addressData,
      id: `addr-${Date.now()}`,
    };
    user.savedAddresses.push(newAddress);
    if (!user.address || addressData.isDefault) {
      user.address = newAddress.address;
    }
    saveStoreToFile(store);
    return newAddress;
  },

  deleteSavedAddress: (userId: string, addressId: string) => {
    const store = getStore();
    const user = store.users.find((u) => u.id === userId || u.email === userId);
    if (!user || !user.savedAddresses) return false;
    user.savedAddresses = user.savedAddresses.filter((a) => a.id !== addressId);
    saveStoreToFile(store);
    return true;
  },

  addUser: (user: Omit<User, "id" | "createdAt">) => {
    const store = getStore();
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    store.users.unshift(newUser);
    saveStoreToFile(store);
    return newUser;
  },
  updateUserRole: (id: string, role: "ADMIN" | "STAFF" | "CUSTOMER") => {
    const store = getStore();
    const user = store.users.find((u) => u.id === id);
    if (user) {
      user.role = role;
      saveStoreToFile(store);
      return user;
    }
    return null;
  },
  deleteUser: (id: string) => {
    const store = getStore();
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      const removed = store.users.splice(idx, 1)[0];
      saveStoreToFile(store);
      return removed;
    }
    return null;
  },

  // --- Settings ---
  getSettings: () => {
    const store = getStore();
    return store.settings;
  },
  updateSettings: (updates: Partial<StoreSetting>) => {
    const store = getStore();
    store.settings = { ...store.settings, ...updates };
    saveStoreToFile(store);
    return store.settings;
  },

  // --- Dashboard Stats ---
  getDashboardStats: (): DashboardStats => {
    const store = getStore();
    const today = new Date().toDateString();
    const todayOrders = store.orders.filter(
      (o) => new Date(o.createdAt).toDateString() === today
    );
    const todayRevenue = todayOrders
      .filter((o) => o.paymentStatus === "PAID" && o.orderStatus !== "CANCELLED")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      todayRevenue,
      todayOrdersCount: todayOrders.length,
      newOrdersCount: store.orders.filter((o) => o.orderStatus === "NEW").length,
      preparingOrdersCount: store.orders.filter((o) => o.orderStatus === "PREPARING").length,
      deliveringOrdersCount: store.orders.filter((o) => o.orderStatus === "DELIVERING").length,
      completedOrdersCount: store.orders.filter((o) => o.orderStatus === "COMPLETED").length,
      outOfStockProductsCount: store.products.filter((p) => !p.isAvailable).length,
    };
  },
};
