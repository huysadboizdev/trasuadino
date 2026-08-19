/**
 * Phone Action Utilities
 * Provides safe phone interaction:
 * - Mobile devices: triggers native dialer (tel: protocol)
 * - Desktop/Laptop: copies phone number to clipboard and triggers toast, preventing system app popups
 */

export type ToastCallback = (message: string, type?: "success" | "error" | "info" | "warning") => void;

/**
 * Detect if the client is running on a mobile device / phone with cellular dialer support.
 * Reliably distinguishes desktop/laptops (including touch-screen Windows laptops) from mobile phones.
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent || "";
  
  // 1. Mobile Operating Systems / Devices
  const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  
  // 2. Coarse pointer + no hover (Pure touch devices like iOS / Android phones and tablets)
  // Laptops with touchscreens still have hover: hover and fine pointer, so they won't match.
  const isPureTouchDevice =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  // 3. Match if mobile UA or pure touch device on smaller screen
  return isMobileUA || (isPureTouchDevice && window.innerWidth < 1024);
}

/**
 * Clean phone string to digits and leading plus sign
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return "";
  return phone.trim().replace(/[^0-9+]/g, "");
}

/**
 * Safely copy text to clipboard with modern API and reliable fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Try modern Clipboard API
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to execCommand below
  }

  // Fallback for non-secure origins or older browsers
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "-9999px";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn("Fallback clipboard copy failed:", err);
    return false;
  }
}

/**
 * Universal handler for phone clicks:
 * - Mobile: opens native phone app
 * - Desktop: copies to clipboard & invokes toast notification
 */
export async function handlePhoneAction(
  phoneNumber: string,
  showToast?: ToastCallback,
  e?: React.MouseEvent
): Promise<"called" | "copied" | "failed"> {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (!phoneNumber) return "failed";

  const clean = cleanPhoneNumber(phoneNumber);

  if (isMobileDevice()) {
    // On Mobile: Trigger native phone dialer
    window.location.href = `tel:${clean}`;
    return "called";
  }

  // On Desktop / Laptop: Copy to clipboard and show toast
  const success = await copyToClipboard(clean || phoneNumber);
  if (success) {
    if (showToast) {
      showToast(`Đã sao chép số điện thoại: ${phoneNumber}`, "success");
    }
    return "copied";
  } else {
    if (showToast) {
      showToast(`Không thể sao chép số điện thoại ${phoneNumber}`, "error");
    }
    return "failed";
  }
}
