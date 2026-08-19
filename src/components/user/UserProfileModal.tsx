import React, { useState, useEffect, useRef } from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { AddressLocationPicker } from "../ui/AddressLocationPicker";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "../ui/Toast";
import { SavedAddress } from "@/lib/types";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  focusField?: "name" | "phone" | "address";
  onSavedSuccess?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  focusField,
  onSavedSuccess,
}) => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Danh sách địa chỉ đã lưu
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(user?.savedAddresses || []);
  const [newLabel, setNewLabel] = useState("Nhà riêng");
  const [newAddressText, setNewAddressText] = useState("");
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setSavedAddresses(user.savedAddresses || []);
    }
  }, [user]);

  // Tự động focus vào trường còn thiếu
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (focusField === "name") {
          nameInputRef.current?.focus();
        } else if (focusField === "phone") {
          phoneInputRef.current?.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, focusField]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/\s/g, "");
    const cleanAddress = address.trim();

    if (!cleanName || cleanName.length < 2) {
      showToast("Vui lòng nhập tên Facebook để shop biết bạn là ai", "warning");
      nameInputRef.current?.focus();
      return;
    }

    if (!cleanPhone || !/^[0-9+]{9,12}$/.test(cleanPhone)) {
      showToast("Số điện thoại không hợp lệ (từ 9 - 12 chữ số)", "warning");
      phoneInputRef.current?.focus();
      return;
    }

    if (!cleanAddress || cleanAddress.length < 5) {
      showToast("Vui lòng nhập địa chỉ giao hàng cụ thể", "warning");
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email,
          name: cleanName,
          phone: cleanPhone,
          address: cleanAddress,
        }),
      });

      if (res.ok) {
        updateProfile({ name: cleanName, phone: cleanPhone, address: cleanAddress });
        showToast("Đã cập nhật thông tin thành công!", "success");
        onSavedSuccess?.();
        onClose();
      } else {
        showToast("Lỗi khi lưu thông tin", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewAddress = async () => {
    if (!newAddressText.trim()) {
      showToast("Vui lòng nhập địa chỉ", "warning");
      return;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email,
          action: "ADD_ADDRESS",
          addressData: {
            label: newLabel,
            address: newAddressText.trim(),
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSavedAddresses((prev) => [...prev, data.address]);
        setNewAddressText("");
        setIsAddingAddress(false);
        showToast("Đã lưu thêm địa chỉ mới!", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email,
          action: "DELETE_ADDRESS",
          addressId,
        }),
      });

      if (res.ok) {
        setSavedAddresses((prev) => prev.filter((a) => a.id !== addressId));
        showToast("Đã xóa địa chỉ khỏi danh bạ", "info");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="THÔNG TIN CÁ NHÂN & ĐỊA CHỈ"
      subtitle={`Tài khoản: ${user?.email || "Khách hàng"}`}
      maxWidth="md"
      footer={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            className="text-xs font-black uppercase"
          >
            ĐÓNG
          </Button>
          <Button
            type="submit"
            form="user-profile-form"
            variant="primary"
            size="md"
            isLoading={isSaving}
            className="flex-1 text-xs font-black uppercase tracking-wider bg-brand-900 hover:bg-brand-950 text-white"
          >
            LƯU THAY ĐỔI
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <form id="user-profile-form" onSubmit={handleSaveProfile} className="space-y-3.5">
          {/* Tên Facebook */}
          <div>
            <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
              Tên Facebook <span className="text-rose-600">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              required
            />
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
              SỐ ĐIỆN THOẠI GIAO HÀNG <span className="text-rose-600">*</span>
            </label>
            <input
              ref={phoneInputRef}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0908123456..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              required
            />
          </div>

          {/* Địa chỉ giao hàng mặc định (Tích hợp GPS 1-chạm) */}
          <div>
            <AddressLocationPicker
              value={address}
              onChange={(addr, latitude, longitude) => {
                setAddress(addr);
                setLat(latitude);
                setLng(longitude);
              }}
              lat={lat}
              lng={lng}
              savedAddresses={savedAddresses}
              required={true}
            />
          </div>
        </form>

        {/* Sổ địa chỉ lưu trữ (CRUD) */}
        <div className="pt-3 border-t border-neutral-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-neutral-700 uppercase tracking-wider">
              SỔ ĐỊA CHỈ ĐÃ LƯU ({savedAddresses.length})
            </span>
            <button
              type="button"
              onClick={() => setIsAddingAddress(!isAddingAddress)}
              className="text-xs font-black uppercase text-brand-900 underline"
            >
              {isAddingAddress ? "Đóng form" : "+ Thêm địa chỉ mới"}
            </button>
          </div>

          {isAddingAddress && (
            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5 animate-slide-up">
              <div className="flex gap-2">
                {["Nhà riêng", "Công ty", "Trường học"].map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setNewLabel(lbl)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition-all ${
                      newLabel === lbl
                        ? "bg-brand-900 text-white shadow-2xs"
                        : "bg-white text-neutral-700 border border-neutral-200"
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              <AddressLocationPicker
                value={newAddressText}
                onChange={(addr) => setNewAddressText(addr)}
                required={false}
              />

              <Button
                type="button"
                variant="primary"
                size="sm"
                fullWidth
                onClick={handleAddNewAddress}
                className="bg-brand-900 text-white font-black text-xs uppercase"
              >
                + LƯU VÀO SỔ ĐỊA CHỈ
              </Button>
            </div>
          )}

          {savedAddresses.map((sa) => (
            <div
              key={sa.id}
              className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-neutral-200 text-xs"
            >
              <div
                className="flex-1 cursor-pointer"
                onClick={() => setAddress(sa.address)}
              >
                <span className="font-black text-brand-950 uppercase block">
                  📍 {sa.label}
                </span>
                <span className="text-neutral-600 font-medium line-clamp-1">
                  {sa.address}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteAddress(sa.id)}
                className="text-rose-600 hover:text-rose-800 font-bold px-2 py-1 uppercase text-[11px]"
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
};
