"use client";

import React, { useState } from "react";
import { getCurrentPosition, reverseGeocode } from "@/lib/geolocation";
import { useToast } from "./Toast";
import { SavedAddress } from "@/lib/types";

interface AddressLocationPickerProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  lat?: number;
  lng?: number;
  savedAddresses?: SavedAddress[];
  required?: boolean;
  error?: string | null;
}

export const AddressLocationPicker: React.FC<AddressLocationPickerProps> = ({
  value,
  onChange,
  lat,
  lng,
  savedAddresses = [],
  required = true,
  error,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{
    lat?: number;
    lng?: number;
    accuracy?: number;
  }>({
    lat,
    lng,
  });
  const { showToast } = useToast();

  const handleGetLocation = async () => {
    try {
      setIsLocating(true);
      showToast("Đang xác định vị trí thiết bị...", "info");

      // 1. Lấy tọa độ có độ chính xác cao nhất (Location Refinement)
      const pos = await getCurrentPosition();
      setCurrentCoords({ lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy });

      // 2. Chuyển đổi sang địa chỉ chi tiết nhất (Số nhà + Tên đường + Phường/Xã + Quận + TP)
      const geocode = await reverseGeocode(pos.lat, pos.lng);

      // 3. Tự động điền vào ô địa chỉ nhận hàng
      onChange(geocode.formattedAddress, pos.lat, pos.lng);
      showToast("Đã xác định vị trí và điền địa chỉ thành công!", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể lấy vị trí hiện tại";
      showToast(msg, "warning");
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider">
          ĐỊA CHỈ NHẬN HÀNG {required && <span className="text-rose-600">*</span>}
        </label>

        {/* Nút bấm định vị GPS DUY NHẤT 1-CHẠM */}
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={isLocating}
          className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-brand-900 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl border border-brand-200 transition-all active:scale-95 disabled:opacity-50 min-h-[34px]"
        >
          {isLocating ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-900 border-t-transparent" />
              <span>📍 ĐANG XÁC ĐỊNH VỊ TRÍ...</span>
            </>
          ) : (
            <>
              <span>📍 LẤY VỊ TRÍ GPS</span>
            </>
          )}
        </button>
      </div>

      {/* Sổ địa chỉ đã lưu (Nếu có) */}
      {savedAddresses.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-black uppercase text-neutral-400 whitespace-nowrap">
            CHỌN NHANH:
          </span>
          {savedAddresses.map((sa) => (
            <button
              key={sa.id}
              type="button"
              onClick={() => onChange(sa.address, sa.lat, sa.lng)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-all ${
                value === sa.address
                  ? "bg-brand-900 text-white border-brand-900 shadow-2xs"
                  : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {sa.label}: {sa.address.slice(0, 20)}...
            </button>
          ))}
        </div>
      )}

      {/* Ô nhập địa chỉ chính (Tự động điền & Luôn cho phép chỉnh sửa) */}
      <div className="relative">
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value, currentCoords.lat, currentCoords.lng)}
          placeholder="Nhập số nhà, tên đường, phường/xã hoặc bấm '📍 LẤY VỊ TRÍ GPS' ở trên..."
          className={`w-full px-3.5 py-2.5 rounded-xl border text-neutral-900 font-bold focus:outline-none text-sm transition-all resize-none ${
            error
              ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500"
              : "border-neutral-300 focus:ring-2 focus:ring-brand-500"
          }`}
          required={required}
        />
      </div>

      {/* Tình trạng vị trí tinh giản (Không tạo card rườm rà, không thêm button phụ) */}
      {error ? (
        <p className="text-[11px] font-bold text-rose-600 animate-slide-up">
          ⚠️ {error}
        </p>
      ) : currentCoords.lat && currentCoords.lng ? (
        <div className="space-y-1 animate-fade-in text-left">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-emerald-600 font-black">✓</span>
              <span className="truncate">Đã xác định vị trí</span>
              {currentCoords.accuracy !== undefined && (
                <span className="text-neutral-500 font-medium text-[10px]">
                  • ±{currentCoords.accuracy <= 30 ? `${currentCoords.accuracy.toFixed(1)}m` : `${Math.round(currentCoords.accuracy)}m`}
                </span>
              )}
            </div>
            <span className="text-[9px] font-black uppercase text-emerald-800 tracking-wider">
              {currentCoords.accuracy !== undefined && currentCoords.accuracy <= 30 ? "CHÍNH XÁC" : "TẠM ỔN"}
            </span>
          </div>

          {currentCoords.accuracy !== undefined && currentCoords.accuracy > 100 && (
            <p className="text-[10px] text-amber-700 font-medium px-1">
              ⚠️ Vị trí có độ chính xác chưa cao (±{Math.round(currentCoords.accuracy)}m). Bạn có thể kiểm tra và bổ sung thêm số nhà/tên đường cụ thể nhé.
            </p>
          )}
        </div>
      ) : (
        <p className="text-[10px] text-neutral-400 font-medium">
          Gợi ý: Bấm <b>&quot;📍 LẤY VỊ TRÍ GPS&quot;</b> để shipper giao đúng tận cửa nhà bạn.
        </p>
      )}
    </div>
  );
};
