"use client";

import React, { useState, useEffect } from "react";
import { User, UserRole } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("STAFF");
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { showToast } = useToast();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );

    try {
      await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      showToast(`Đã đổi quyền sang ${newRole}`, "success");
    } catch (err) {
      console.error(err);
      fetchUsers();
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.role === "ADMIN" && users.filter((u) => u.role === "ADMIN").length <= 1) {
      showToast("Không thể xóa tài khoản Quản trị viên duy nhất của quán", "warning");
      return;
    }

    if (!window.confirm(`Xóa tài khoản của "${user.name}"?`)) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        showToast(`Đã xóa tài khoản "${user.name}"`, "info");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi xóa người dùng", "error");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast("Vui lòng nhập họ tên và số điện thoại", "warning");
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim(),
          passwordHash: password.trim() || "admin123",
          role,
          address: address.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers((prev) => [data.user, ...prev]);
        setIsModalOpen(false);
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setAddress("");
        showToast("Đã tạo tài khoản mới thành công!", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi tạo tài khoản", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const roleBadgeMap: Record<UserRole, { label: string; variant: BadgeVariant }> = {
    ADMIN: { label: "CHỦ QUÁN / ADMIN", variant: "purple" },
    STAFF: { label: "NHÂN VIÊN PHA CHẾ", variant: "info" },
    CUSTOMER: { label: "KHÁCH HÀNG (USER)", variant: "neutral" },
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight uppercase">
              QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN
            </h1>
            <Badge variant="brand" size="sm">
              {users.length} TÀI KHOẢN
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Phân quyền rõ ràng: <b>Khách Hàng (Customer)</b> chỉ mua hàng, <b>Admin & Nhân viên</b> mới vào được trang này
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto text-xs sm:text-sm font-black shadow-md tracking-wider uppercase bg-brand-900 hover:bg-brand-950 text-white min-h-[44px]"
        >
          + THÊM NHÂN VIÊN MỚI
        </Button>
      </div>

      {/* Users List Cards */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mb-3" />
          <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
            Đang tải dữ liệu người dùng...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {users.map((user) => {
            const roleInfo = roleBadgeMap[user.role] || {
              label: user.role,
              variant: "neutral",
            };

            return (
              <div
                key={user.id}
                className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-sm flex flex-col justify-between transition-all min-w-0 ${
                  user.role === "ADMIN"
                    ? "border-purple-200 bg-purple-50/10"
                    : user.role === "STAFF"
                    ? "border-sky-200 bg-sky-50/10"
                    : "border-neutral-200"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={roleInfo.variant} size="sm" dot className="text-[10px] sm:text-xs truncate">
                      {roleInfo.label}
                    </Badge>
                    <span className="text-[11px] font-bold text-neutral-400 flex-shrink-0">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-neutral-900 tracking-tight truncate">
                    {user.name}
                  </h3>

                  <div className="mt-2 space-y-1 text-xs">
                    {user.email && (
                      <p className="text-neutral-600 font-bold truncate">
                        ✉️ {user.email}
                      </p>
                    )}
                    {user.phone && (
                      <p className="text-neutral-600 font-bold truncate">
                        📞 <a href={`tel:${user.phone}`} className="text-emerald-700 underline">{user.phone}</a>
                      </p>
                    )}
                    {user.address && (
                      <p className="text-neutral-500 font-medium truncate">
                        📍 {user.address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Role Switcher Controls */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[11px] font-black uppercase text-neutral-400 flex-shrink-0">
                      QUYỀN:
                    </span>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      className="text-xs font-black bg-neutral-100 border border-neutral-300 rounded-xl px-2 py-1 text-neutral-900 focus:outline-none"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="STAFF">NHÂN VIÊN</option>
                      <option value="CUSTOMER">KHÁCH HÀNG</option>
                    </select>
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteUser(user)}
                    className="text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 flex-shrink-0"
                  >
                    XÓA
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm Nhân Viên Mới */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="THÊM TÀI KHOẢN MỚI"
        subtitle="Tạo tài khoản quản trị hoặc nhân viên pha chế"
        maxWidth="sm"
        footer={
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2.5 w-full">
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={() => setIsModalOpen(false)}
              className="text-xs sm:text-sm font-black min-h-[44px]"
            >
              HỦY BỎ
            </Button>
            <Button
              type="submit"
              form="add-user-form"
              variant="primary"
              size="md"
              fullWidth
              isLoading={isSaving}
              className="text-xs sm:text-sm font-black uppercase tracking-wider bg-brand-900 text-white min-h-[44px]"
            >
              LƯU TÀI KHOẢN
            </Button>
          </div>
        }
      >
        <form id="add-user-form" onSubmit={handleCreateUser} className="space-y-3.5">
          <div>
            <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1">
              HỌ VÀ TÊN <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn Pha Chế..."
              className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm min-h-[44px]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1">
              SỐ ĐIỆN THOẠI <span className="text-rose-600">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0909123456..."
              className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm min-h-[44px]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1">
              EMAIL / GMAIL (DÙNG ĐỂ ĐĂNG NHẬP ADMIN)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="VD: nv1@dino.vn..."
              className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1">
              MẬT KHẨU ĐĂNG NHẬP (MẶC ĐỊNH: admin123)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mặc định: admin123"
              className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
              VAI TRÒ / PHÂN QUYỀN
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(["ADMIN", "STAFF", "CUSTOMER"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black uppercase transition-all truncate min-h-[40px] flex items-center justify-center ${
                    role === r
                      ? "bg-brand-900 text-white shadow-sm ring-2 ring-brand-900"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200"
                  }`}
                >
                  {r === "ADMIN" ? "👑 ADMIN (CHỦ)" : r === "STAFF" ? "☕ NHÂN VIÊN" : "👤 KHÁCH HÀNG"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1">
              GHI CHÚ / ĐỊA CHỈ
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: Quầy pha chế ca sáng..."
              className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm min-h-[44px]"
            />
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
