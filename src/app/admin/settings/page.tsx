"use client";

import React, { useState, useEffect } from "react";
import { StoreSetting } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSetting | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Test Webhook state
  const [testOrderCode, setTestOrderCode] = useState("DINO-902");
  const [testAmount, setTestAmount] = useState(77000);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu cài đặt");
    } finally {
      setIsSaving(false);
    }
  };

  // Giả lập bắn webhook từ SePay để kiểm tra
  const handleSimulateWebhook = async () => {
    try {
      setIsTestingWebhook(true);
      setWebhookTestResult(null);

      const res = await fetch("/api/webhook/sepay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway: settings?.sepayBankName || "MBBank",
          accountNumber: settings?.sepayAccountNumber || "0988888888",
          transferAmount: testAmount,
          content: `${testOrderCode} thanh toan tra sua dino test`,
          transferType: "in",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWebhookTestResult(
          `✅ Thành công! SePay đã khớp đơn ${data.orderCode || testOrderCode} và cập nhật trạng thái "ĐÃ THANH TOÁN".`
        );
      } else {
        setWebhookTestResult(`❌ Thất bại: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setWebhookTestResult("❌ Lỗi khi gửi webhook thử nghiệm");
    } finally {
      setIsTestingWebhook(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mb-3" />
        <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
          Đang tải cài đặt hệ thống...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight uppercase">
              CÀI ĐẶT QUÁN & SEPAY
            </h1>
            <Badge variant="brand" size="sm">
              HỆ THỐNG
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Cấu hình thông tin thương hiệu, giờ mở cửa và cổng thanh toán tự động SePay
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleSave}
          isLoading={isSaving}
          className="w-full sm:w-auto text-xs sm:text-sm font-black shadow-md tracking-wider uppercase bg-brand-900 hover:bg-brand-950 text-white"
        >
          LƯU TẤT CẢ CÀI ĐẶT
        </Button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wide">
          ✓ Đã lưu cài đặt quán và SePay thành công!
        </div>
      )}

      {/* Form Settings */}
      <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
        {/* Phần 1: Thông tin quán */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200 shadow-sm space-y-4">
          <div className="border-b border-neutral-100 pb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-black text-neutral-900 uppercase tracking-tight">
              1. THÔNG TIN QUÁN & TRẠNG THÁI BÁN
            </h2>
            <Switch
              checked={settings.isOpen}
              onChange={(checked) =>
                setSettings({ ...settings, isOpen: checked })
              }
              labelRight={settings.isOpen ? "ĐANG NHẬN ĐƠN" : "TẠM NGHỈ BÁN"}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                TÊN THƯƠNG HIỆU QUÁN
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) =>
                  setSettings({ ...settings, storeName: e.target.value })
                }
                className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                HOTLINE LIÊN HỆ / ĐẶT HÀNG
              </label>
              <input
                type="text"
                value={settings.hotline}
                onChange={(e) =>
                  setSettings({ ...settings, hotline: e.target.value })
                }
                className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
              ĐỊA CHỈ CỬA HÀNG
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) =>
                setSettings({ ...settings, address: e.target.value })
              }
              className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                GIỜ MỞ CỬA
              </label>
              <input
                type="time"
                value={settings.openTime}
                onChange={(e) =>
                  setSettings({ ...settings, openTime: e.target.value })
                }
                className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                GIỜ ĐÓNG CỬA
              </label>
              <input
                type="time"
                value={settings.closeTime}
                onChange={(e) =>
                  setSettings({ ...settings, closeTime: e.target.value })
                }
                className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Phần 2: Cấu hình SePay Webhook */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200 shadow-sm space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-neutral-900 uppercase tracking-tight">
                2. CẤU HÌNH CỔNG THANH TOÁN TỰ ĐỘNG SEPAY
              </h2>
              <Badge variant="success" size="sm">
                VIETQR AUTO
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Nhận tiền chuyển khoản qua tài khoản ngân hàng và tự động cập nhật đơn hàng
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                NGÂN HÀNG THỤ HƯỞNG
              </label>
              <input
                type="text"
                value={settings.sepayBankName}
                onChange={(e) =>
                  setSettings({ ...settings, sepayBankName: e.target.value })
                }
                placeholder="VD: MBBank, Vietcombank, Techcombank..."
                className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                SỐ TÀI KHOẢN NGÂN HÀNG
              </label>
              <input
                type="text"
                value={settings.sepayAccountNumber}
                onChange={(e) =>
                  setSettings({ ...settings, sepayAccountNumber: e.target.value })
                }
                placeholder="VD: 0988888888..."
                className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                TÊN CHỦ TÀI KHOẢN (IN HOA)
              </label>
              <input
                type="text"
                value={settings.sepayAccountName}
                onChange={(e) =>
                  setSettings({ ...settings, sepayAccountName: e.target.value })
                }
                placeholder="VD: NGUYEN VAN A"
                className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                MÃ API KEY / TOKEN SEPAY
              </label>
              <input
                type="password"
                value={settings.sepayApiKey}
                onChange={(e) =>
                  setSettings({ ...settings, sepayApiKey: e.target.value })
                }
                placeholder="Nhập API Token lấy từ sepay.vn..."
                className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
          </div>

          {/* Webhook Endpoint Guide */}
          <div className="bg-neutral-50 p-3.5 sm:p-4 rounded-2xl border border-neutral-200 space-y-2">
            <p className="text-xs font-black text-neutral-900 uppercase tracking-wider">
              ĐƯỜNG DẪN WEBHOOK URL ĐỂ DÁN VÀO SEPAY.VN:
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value="https://your-domain.com/api/webhook/sepay"
                className="flex-1 min-w-0 px-3 py-2 bg-white rounded-xl border border-neutral-300 text-xs font-mono font-bold text-neutral-800"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold whitespace-nowrap"
                onClick={() => {
                  navigator.clipboard.writeText("https://your-domain.com/api/webhook/sepay");
                  alert("Đã sao chép đường dẫn Webhook!");
                }}
              >
                SAO CHÉP
              </Button>
            </div>
            <p className="text-[11px] text-neutral-500 font-medium">
              Khi có giao dịch chuyển tiền vào tài khoản ngân hàng của bạn, SePay sẽ tự động gọi vào đường dẫn này để khớp mã đơn hàng (VD: DINO-901).
            </p>
          </div>
        </div>

        {/* Phần 3: Công cụ kiểm thử SePay Webhook giả lập */}
        <div className="bg-brand-50/50 rounded-3xl p-4 sm:p-6 border border-brand-200 shadow-sm space-y-4">
          <div className="border-b border-brand-200/80 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-brand-950 uppercase tracking-tight">
                3. CÔNG CỤ TEST THỬ THANH TOÁN SEPAY (KHÔNG MẤT TIỀN THẬT)
              </h2>
              <Badge variant="purple" size="sm">
                SIMULATOR
              </Badge>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              Bắn tín hiệu thanh toán giả lập để kiểm tra tính năng tự động đổi trạng thái đơn sang "ĐÃ TRẢ SEPAY"
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                MÃ ĐƠN HÀNG CẦN TEST
              </label>
              <input
                type="text"
                value={testOrderCode}
                onChange={(e) => setTestOrderCode(e.target.value)}
                placeholder="VD: DINO-902..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-neutral-900 font-bold bg-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                SỐ TIỀN THANH TOÁN (VNĐ)
              </label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(Number(e.target.value))}
                placeholder="77000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-neutral-900 font-bold bg-white text-sm"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSimulateWebhook}
            isLoading={isTestingWebhook}
            className="w-full text-xs font-black uppercase tracking-wider bg-brand-800 hover:bg-brand-900 text-white"
          >
            BẮN WEBHOOK TEST XÁC NHẬN ĐÃ THANH TOÁN
          </Button>

          {webhookTestResult && (
            <div className="p-3 bg-white rounded-xl border border-brand-300 text-xs font-bold text-neutral-900">
              {webhookTestResult}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
