import bcrypt from "bcryptjs";
import { Category, Product, Order, User, SavedAddress, StoreSetting, OrderStatus, DashboardStats, Coupon, RefreshSession } from "./types";
import { nhungCategories, nhungProducts } from "./nhungMenuData";

declare global {
  // eslint-disable-next-line no-var
  var __STORE__: {
    categories: Category[];
    products: Product[];
    orders: Order[];
    users: User[];
    coupons: Coupon[];
    refreshSessions: RefreshSession[];
    rotatedTokensHistory: { tokenHash: string; familyId: string; rotatedAt: string }[];
    settings: StoreSetting;
  } | undefined;
}

const envAdminEmail = (process.env.ADMIN_EMAIL || "admin@dino.vn").trim();
const envAdminPassword = (process.env.ADMIN_PASSWORD || "admin123").trim();

if (!global.__STORE__) {
  global.__STORE__ = {
    categories: [...nhungCategories],
    products: [...nhungProducts],
    orders: [],
    coupons: [
      {
        id: "cpn-dino10",
        code: "DINO10",
        description: "Giảm 10% toàn menu cho khách hàng mới",
        discountPercent: 10,
        minOrderAmount: 0,
        maxDiscountAmount: 50000,
        isActive: true,
        usageLimit: 100,
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "cpn-dino20",
        code: "DINO20",
        description: "Giảm 20% cho đơn hàng từ 60.000đ",
        discountPercent: 20,
        minOrderAmount: 60000,
        maxDiscountAmount: 30000,
        isActive: true,
        usageLimit: 50,
        usageCount: 0,
        createdAt: new Date().toISOString(),
      },
    ],
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
    settings: {
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
    },
  };
}

const store = global.__STORE__;
if (!store.coupons) {
  store.coupons = [
    {
      id: "cpn-dino10",
      code: "DINO10",
      description: "Giảm 10% toàn menu cho khách hàng mới",
      discountPercent: 10,
      minOrderAmount: 0,
      maxDiscountAmount: 50000,
      isActive: true,
      usageLimit: 100,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "cpn-dino20",
      code: "DINO20",
      description: "Giảm 20% cho đơn hàng từ 60.000đ",
      discountPercent: 20,
      minOrderAmount: 60000,
      maxDiscountAmount: 30000,
      isActive: true,
      usageLimit: 50,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    },
  ];
}
if (!store.refreshSessions) {
  store.refreshSessions = [];
}
if (!store.rotatedTokensHistory) {
  store.rotatedTokensHistory = [];
}

// Luôn đảm bảo nạp đầy đủ danh mục và thực đơn Quán Nhung (44 món đồ uống + 4 món topping)
store.categories = [...nhungCategories];
store.products = [...nhungProducts];

// Đồng bộ tài khoản Admin từ biến môi trường .env
const adminIdx = store.users.findIndex((u) => u.role === "ADMIN" || u.id === "usr-1" || u.id === "usr-admin");
if (adminIdx !== -1) {
  store.users[adminIdx] = {
    ...store.users[adminIdx],
    id: "usr-admin",
    name: store.users[adminIdx].name || "Chủ Quán (Admin)",
    email: envAdminEmail,
    passwordHash: envAdminPassword,
    role: "ADMIN",
  };
} else {
  store.users.unshift({
    id: "usr-admin",
    name: "Chủ Quán (Admin)",
    email: envAdminEmail,
    passwordHash: envAdminPassword,
    role: "ADMIN",
    createdAt: new Date().toISOString(),
  });
}

export const dataStore = {
  // --- Categories ---
  getCategories: () => {
    if (!store.categories || store.categories.length < nhungCategories.length) {
      store.categories = [...nhungCategories];
    }
    return store.categories;
  },
  getCategoryById: (id: string) => store.categories.find((c) => c.id === id),
  addCategory: (cat: Omit<Category, "id">) => {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
    };
    store.categories.push(newCat);
    return newCat;
  },
  updateCategory: (id: string, updates: Partial<Category>) => {
    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      store.categories[idx] = { ...store.categories[idx], ...updates };
      return store.categories[idx];
    }
    return null;
  },
  deleteCategory: (id: string) => {
    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const removed = store.categories.splice(idx, 1);
      return removed[0];
    }
    return null;
  },

  // --- Products ---
  getProducts: (categoryId?: string, search?: string) => {
    if (!store.products || store.products.length < nhungProducts.length) {
      store.products = [...nhungProducts];
    }
    // Tự động đồng bộ ảnh, isFeatured và lượt bán mới nhất từ nhungProducts
    nhungProducts.forEach((np) => {
      const existing = store.products.find((p) => p.id === np.id || p.name === np.name);
      if (existing) {
        if (existing.image !== np.image) existing.image = np.image;
        if (existing.isFeatured !== np.isFeatured) existing.isFeatured = np.isFeatured;
        if (np.salesCount && (!existing.salesCount || existing.salesCount < np.salesCount)) existing.salesCount = np.salesCount;
      }
    });

    let list = store.products;
    if (categoryId && categoryId !== "ALL") {
      list = list.filter((p) => p.categoryId === categoryId);
    }
    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    return list;
  },
  getProductById: (id: string) => store.products.find((p) => p.id === id),
  addProduct: (prod: Omit<Product, "id">) => {
    const category = store.categories.find((c) => c.id === prod.categoryId);
    const newProd: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
      categoryName: category?.name || "Món quán",
      salesCount: prod.salesCount || 0,
      createdAt: new Date().toISOString(),
    };
    store.products.unshift(newProd);
    return newProd;
  },
  updateProduct: (id: string, updates: Partial<Product>) => {
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      if (updates.categoryId) {
        const cat = store.categories.find((c) => c.id === updates.categoryId);
        if (cat) updates.categoryName = cat.name;
      }
      store.products[idx] = { ...store.products[idx], ...updates };
      return store.products[idx];
    }
    return null;
  },
  toggleProductAvailability: (id: string) => {
    const prod = store.products.find((p) => p.id === id);
    if (prod) {
      prod.isAvailable = !prod.isAvailable;
      return prod;
    }
    return null;
  },
  deleteProduct: (id: string) => {
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      const removed = store.products.splice(idx, 1);
      return removed[0];
    }
    return null;
  },

  // --- Điều Chỉnh Giá Sản Phẩm (Từng món hoặc Toàn bộ) ---
  adjustProductPrices: (params: {
    scope: "ALL" | "SELECTED";
    productIds?: string[];
    adjustmentType: "FIXED" | "PERCENT";
    amount: number;
    roundTo?: number;
  }) => {
    const { scope, productIds = [], adjustmentType, amount, roundTo = 1000 } = params;
    const targetProducts = scope === "ALL"
      ? store.products
      : store.products.filter((p) => productIds.includes(p.id));

    const updatedList: { id: string; name: string; oldPrice: number; newPrice: number }[] = [];

    targetProducts.forEach((p) => {
      const oldPrice = p.price;
      let newPrice = oldPrice;
      if (adjustmentType === "FIXED") {
        newPrice = oldPrice + amount;
      } else if (adjustmentType === "PERCENT") {
        newPrice = oldPrice * (1 + amount / 100);
      }

      if (roundTo > 0) {
        newPrice = Math.round(newPrice / roundTo) * roundTo;
      }
      newPrice = Math.max(0, Math.round(newPrice));

      p.price = newPrice;
      updatedList.push({ id: p.id, name: p.name, oldPrice, newPrice });
    });

    return {
      success: true,
      updatedCount: updatedList.length,
      products: updatedList,
    };
  },

  // --- Reset/Seed Menu ---
  seedNhungMenu: () => {
    store.categories = [...nhungCategories];
    store.products = [...nhungProducts];
    return {
      categories: store.categories,
      products: store.products,
      totalDrinks: 44,
      totalToppings: 4,
      totalCategories: 9,
    };
  },

  // --- Orders ---
  getOrders: (status?: string, email?: string) => {
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
  getOrderById: (id: string) => store.orders.find((o) => o.id === id || o.orderCode === id),
  updateOrderStatus: (id: string, status: OrderStatus) => {
    const ord = store.orders.find((o) => o.id === id || o.orderCode === id);
    if (ord) {
      ord.orderStatus = status;
      ord.updatedAt = new Date().toISOString();
      return ord;
    }
    return null;
  },
  createOrder: (orderData: Omit<Order, "id" | "orderCode" | "createdAt">) => {
    const codeNum = Math.floor(100 + Math.random() * 900);
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderCode: `DINO-${codeNum}`,
      createdAt: new Date().toISOString(),
    };
    store.orders.unshift(newOrder);

    // Tăng salesCount cho các món trong đơn
    orderData.items.forEach((item) => {
      const prod = store.products.find((p) => p.name === item.productName || p.id === item.productId);
      if (prod) {
        prod.salesCount = (prod.salesCount || 0) + item.quantity;
      }
    });

    // Nếu có áp dụng mã giảm giá, tăng lượt dùng mã
    if (orderData.couponCode) {
      const cpn = store.coupons?.find(
        (c) => c.code.toUpperCase() === orderData.couponCode?.toUpperCase().trim()
      );
      if (cpn) {
        cpn.usageCount = (cpn.usageCount || 0) + 1;
      }
    }

    return newOrder;
  },
  deleteOrder: (id: string) => {
    const idx = store.orders.findIndex((o) => o.id === id || o.orderCode === id);
    if (idx !== -1) {
      return store.orders.splice(idx, 1)[0];
    }
    return null;
  },
  markOrderPaidByCode: (orderCode: string) => {
    const ord = store.orders.find(
      (o) => o.orderCode.toLowerCase() === orderCode.toLowerCase()
    );
    if (ord) {
      ord.paymentStatus = "PAID";
      ord.updatedAt = new Date().toISOString();
      return ord;
    }
    return null;
  },

  // --- Coupons (Mã Giảm Giá) ---
  getCoupons: () => {
    if (!store.coupons) store.coupons = [];
    return [...store.coupons].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
  getCouponById: (id: string) => store.coupons?.find((c) => c.id === id),
  getCouponByCode: (code: string) => {
    const clean = code.toUpperCase().trim();
    return store.coupons?.find((c) => c.code.toUpperCase().trim() === clean);
  },
  createCoupon: (couponData: Omit<Coupon, "id" | "usageCount" | "createdAt">) => {
    if (!store.coupons) store.coupons = [];
    const cleanCode = couponData.code.toUpperCase().trim().replace(/\s+/g, "");

    const existing = store.coupons.find((c) => c.code.toUpperCase() === cleanCode);
    if (existing) {
      throw new Error(`Mã giảm giá "${cleanCode}" đã tồn tại trên hệ thống.`);
    }

    const newCoupon: Coupon = {
      ...couponData,
      id: `cpn-${Date.now()}`,
      code: cleanCode,
      discountPercent: Math.min(100, Math.max(1, Number(couponData.discountPercent))),
      minOrderAmount: Number(couponData.minOrderAmount || 0),
      maxDiscountAmount: couponData.maxDiscountAmount ? Number(couponData.maxDiscountAmount) : undefined,
      usageLimit: couponData.usageLimit ? Number(couponData.usageLimit) : undefined,
      usageCount: 0,
      isActive: couponData.isActive !== false,
      createdAt: new Date().toISOString(),
    };
    store.coupons.unshift(newCoupon);
    return newCoupon;
  },
  updateCoupon: (id: string, updates: Partial<Coupon>) => {
    if (!store.coupons) store.coupons = [];
    const idx = store.coupons.findIndex((c) => c.id === id);
    if (idx !== -1) {
      if (updates.code) {
        updates.code = updates.code.toUpperCase().trim().replace(/\s+/g, "");
        const dup = store.coupons.find((c) => c.id !== id && c.code.toUpperCase() === updates.code);
        if (dup) throw new Error(`Mã giảm giá "${updates.code}" đã được sử dụng.`);
      }
      if (updates.discountPercent !== undefined) {
        updates.discountPercent = Math.min(100, Math.max(1, Number(updates.discountPercent)));
      }
      store.coupons[idx] = {
        ...store.coupons[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return store.coupons[idx];
    }
    return null;
  },
  toggleCoupon: (id: string) => {
    if (!store.coupons) store.coupons = [];
    const cpn = store.coupons.find((c) => c.id === id);
    if (cpn) {
      cpn.isActive = !cpn.isActive;
      cpn.updatedAt = new Date().toISOString();
      return cpn;
    }
    return null;
  },
  deleteCoupon: (id: string) => {
    if (!store.coupons) store.coupons = [];
    const idx = store.coupons.findIndex((c) => c.id === id);
    if (idx !== -1) {
      return store.coupons.splice(idx, 1)[0];
    }
    return null;
  },
  validateCoupon: (code: string, orderAmount: number) => {
    if (!code || !code.trim()) {
      return { valid: false, message: "Vui lòng nhập mã giảm giá" };
    }
    const cleanCode = code.toUpperCase().trim();
    if (!store.coupons) store.coupons = [];
    const coupon = store.coupons.find((c) => c.code.toUpperCase() === cleanCode);

    if (!coupon) {
      return { valid: false, message: `Mã giảm giá "${cleanCode}" không tồn tại` };
    }

    if (!coupon.isActive) {
      return { valid: false, message: `Mã giảm giá "${coupon.code}" hiện đang tạm khóa hoặc đã tắt` };
    }

    const now = new Date().getTime();

    if (coupon.startDate) {
      const start = new Date(coupon.startDate).getTime();
      if (now < start) {
        return { valid: false, message: `Mã giảm giá "${coupon.code}" chưa đến thời gian áp dụng` };
      }
    }

    if (coupon.endDate) {
      const end = new Date(coupon.endDate).getTime();
      if (now > end) {
        return { valid: false, message: `Mã giảm giá "${coupon.code}" đã hết hạn sử dụng` };
      }
    }

    if (coupon.usageLimit && coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, message: `Mã giảm giá "${coupon.code}" đã hết lượt sử dụng` };
    }

    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      const formatMin = new Intl.NumberFormat("vi-VN").format(coupon.minOrderAmount);
      return {
        valid: false,
        message: `Đơn hàng tối thiểu ${formatMin}đ mới đủ điều kiện áp dụng mã này (Đơn hiện tại: ${new Intl.NumberFormat("vi-VN").format(orderAmount)}đ)`,
      };
    }

    // Tính toán số tiền giảm
    let discountAmount = Math.round((orderAmount * coupon.discountPercent) / 100);
    if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
    discountAmount = Math.min(discountAmount, orderAmount);
    const finalAmount = Math.max(0, orderAmount - discountAmount);

    return {
      valid: true,
      coupon,
      discountAmount,
      finalAmount,
      message: `Áp dụng thành công! Giảm ${coupon.discountPercent}% (-${new Intl.NumberFormat("vi-VN").format(discountAmount)}đ)`,
    };
  },

  // --- Users & Authentication & Profile CRUD ---
  getUsers: () => store.users,
  findUserByEmail: (email: string) =>
    store.users.find(
      (u) =>
        u.email?.toLowerCase() === email.toLowerCase().trim() ||
        (u.phone && u.phone === email.trim())
    ),
  findUserById: (id: string) => store.users.find((u) => u.id === id),

  registerUser: (email: string, rawPassword: string, name?: string) => {
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
    return newUser;
  },

  authenticateUser: (identifier: string, passwordAttempt: string) => {
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

    // Kiểm tra mật khẩu (hỗ trợ cả bcrypt và mật khẩu cũ nếu có)
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
    return newSession;
  },

  findRefreshSessionByHash: (tokenHash: string): RefreshSession | undefined => {
    if (!store.refreshSessions) store.refreshSessions = [];
    return store.refreshSessions.find((s) => s.tokenHash === tokenHash);
  },

  findRotatedTokenRecord: (tokenHash: string) => {
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
    if (!store.refreshSessions) store.refreshSessions = [];
    if (!store.rotatedTokensHistory) store.rotatedTokensHistory = [];

    const session = store.refreshSessions.find((s) => s.tokenHash === oldTokenHash);
    if (!session) return null;

    // Lưu lại token cũ vào lịch sử để phát hiện Reuse
    store.rotatedTokensHistory.push({
      tokenHash: oldTokenHash,
      familyId: session.familyId,
      rotatedAt: new Date().toISOString(),
    });

    // Cập nhật session với hash mới và thời gian hết hạn mới
    session.tokenHash = newTokenHash;
    session.expiresAt = newExpiresAt.toISOString();
    session.lastUsedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();
    if (ipAddress) session.ipAddress = ipAddress;
    if (userAgent) session.userAgent = userAgent;

    return session;
  },

  revokeRefreshSession: (tokenHash: string): boolean => {
    if (!store.refreshSessions) store.refreshSessions = [];
    const session = store.refreshSessions.find((s) => s.tokenHash === tokenHash);
    if (session) {
      session.revokedAt = new Date().toISOString();
      session.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  },

  revokeFamilySessions: (familyId: string): number => {
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
    return count;
  },

  revokeAllUserSessions: (userId: string): number => {
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
    return count;
  },

  loginWithGoogle: (email: string, name: string, googleId: string, avatar?: string) => {
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
    return user;
  },

  updateUserProfile: (userId: string, updates: Partial<User>) => {
    const user = store.users.find((u) => u.id === userId || u.email === userId);
    if (user) {
      if (updates.name) user.name = updates.name;
      if (updates.phone) user.phone = updates.phone;
      if (updates.address) user.address = updates.address;
      if (updates.avatar) user.avatar = updates.avatar;
      return user;
    }
    return null;
  },

  // Saved Addresses CRUD
  addSavedAddress: (userId: string, addressData: Omit<SavedAddress, "id">) => {
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
    return newAddress;
  },

  deleteSavedAddress: (userId: string, addressId: string) => {
    const user = store.users.find((u) => u.id === userId || u.email === userId);
    if (!user || !user.savedAddresses) return false;
    user.savedAddresses = user.savedAddresses.filter((a) => a.id !== addressId);
    return true;
  },

  addUser: (user: Omit<User, "id" | "createdAt">) => {
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    store.users.unshift(newUser);
    return newUser;
  },
  updateUserRole: (id: string, role: "ADMIN" | "STAFF" | "CUSTOMER") => {
    const user = store.users.find((u) => u.id === id);
    if (user) {
      user.role = role;
      return user;
    }
    return null;
  },
  deleteUser: (id: string) => {
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      return store.users.splice(idx, 1)[0];
    }
    return null;
  },

  // --- Settings ---
  getSettings: () => store.settings,
  updateSettings: (updates: Partial<StoreSetting>) => {
    store.settings = { ...store.settings, ...updates };
    return store.settings;
  },

  // --- Dashboard Stats ---
  getDashboardStats: (): DashboardStats => {
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
