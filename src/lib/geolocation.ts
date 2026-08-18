/**
 * Tiện ích định vị GPS & Chuyển đổi tọa độ thành địa chỉ tiếng Việt chi tiết nhất (Reverse Geocoding)
 */

export interface GeoLocationResult {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface GeocodeAddress {
  formattedAddress: string;
  houseNumber?: string;
  road?: string;
  ward?: string;
  district?: string;
  city?: string;
  addressLevel: "PRECISE" | "APPROXIMATE";
}

/**
 * Thu thập nhiều mẫu vị trí qua watchPosition và chọn mẫu có sai số (accuracy) nhỏ nhất
 * Ưu tiên kết quả có độ chính xác cao nhất và mới nhất, không lấy vội mẫu đầu tiên.
 */
export const getBestCurrentPosition = (options?: {
  targetAccuracy?: number;
  maxWaitTimeMs?: number;
  timeoutMs?: number;
}): Promise<GeoLocationResult> => {
  const targetAccuracy = options?.targetAccuracy ?? 10; // Đạt <= 10m thì kết thúc sớm ngay
  const maxWaitTimeMs = options?.maxWaitTimeMs ?? 7000; // Tối đa 7 giây tinh chỉnh

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator || !navigator.geolocation) {
      reject(new Error("Trình duyệt hoặc thiết bị của bạn không hỗ trợ định vị tự động."));
      return;
    }

    let watchId: number | null = null;
    let timerId: NodeJS.Timeout | null = null;
    let isSettled = false;
    const samples: GeoLocationResult[] = [];

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    };

    const finishWithBest = () => {
      if (isSettled) return;
      isSettled = true;
      cleanup();

      if (samples.length === 0) {
        reject(new Error("Hết thời gian chờ nhưng không nhận được tín hiệu vị trí từ thiết bị."));
        return;
      }

      // Sắp xếp chọn mẫu có sai số accuracy nhỏ nhất (nếu ngang nhau, chọn timestamp mới hơn)
      samples.sort((a, b) => {
        if (Math.abs(a.accuracy - b.accuracy) < 2) {
          return b.timestamp - a.timestamp;
        }
        return a.accuracy - b.accuracy;
      });

      resolve(samples[0]);
    };

    // Timer tối đa
    timerId = setTimeout(() => {
      finishWithBest();
    }, maxWaitTimeMs);

    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords = position.coords;
          const sample: GeoLocationResult = {
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords.accuracy,
            timestamp: position.timestamp || Date.now(),
          };

          samples.push(sample);

          // Nếu đạt độ chính xác cao (<= targetAccuracy), hoàn tất sớm ngay!
          if (sample.accuracy <= targetAccuracy) {
            finishWithBest();
          }
        },
        (error) => {
          if (samples.length > 0) {
            finishWithBest();
            return;
          }

          if (isSettled) return;
          isSettled = true;
          cleanup();

          let msg = "Không thể lấy vị trí hiện tại.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép quyền Vị trí trong cài đặt trình duyệt.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "Vị trí không khả dụng. Vui lòng kiểm tra và bật GPS trên thiết bị.";
          } else if (error.code === error.TIMEOUT) {
            msg = "Hết thời gian chờ tín hiệu vị trí GPS.";
          }

          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: options?.timeoutMs ?? 15000,
          maximumAge: 0,
        }
      );
    } catch (err) {
      cleanup();
      reject(err instanceof Error ? err : new Error("Lỗi khi kích hoạt định vị"));
    }
  });
};

/**
 * Lấy tọa độ GPS (Sử dụng cơ chế Best Accuracy Refinement)
 */
export const getCurrentPosition = (): Promise<GeoLocationResult> => {
  return getBestCurrentPosition();
};

/**
 * Hàm chuẩn hóa và format địa chỉ giao hàng Việt Nam chi tiết nhất từ dữ liệu bản đồ
 * Ưu tiên: [Số nhà] [Ngõ/Ngách nếu có] [Tên đường], [Phường/Xã], [Quận/Huyện nếu không trùng], [Tỉnh/Thành phố]
 */
export function formatDeliveryAddress(geoData: any): GeocodeAddress {
  if (!geoData || !geoData.address) {
    const cleanFallback = (geoData?.display_name || "")
      .replace(/,\s*\d{4,6},\s*Việt Nam$/i, "")
      .replace(/,\s*Việt Nam$/i, "")
      .trim();
    return {
      formattedAddress: cleanFallback,
      addressLevel: "APPROXIMATE",
    };
  }

  const addr = geoData.address;
  const parts: string[] = [];

  const cleanText = (str?: string) => (str ? str.trim().replace(/\s+/g, " ") : "");
  const removePrefix = (str: string, prefix: string) =>
    str.replace(new RegExp(`^${prefix}\\s+`, "i"), "").trim();

  // 1. Số nhà, ngõ/ngách & Tên đường
  let houseNumber = cleanText(
    addr.house_number ||
      addr.street_number ||
      addr.building_number ||
      addr.unit ||
      addr.housenumber
  );
  const road = cleanText(
    addr.road ||
      addr.street ||
      addr.pedestrian ||
      addr.residential ||
      addr.footway ||
      addr.path ||
      addr.highway ||
      addr.square
  );

  // Nếu trong addr không có house_number nhưng display_name có số nhà ở đầu (VD: "18, Phố Trần Đăng Ninh...")
  if (!houseNumber && geoData.display_name && road) {
    const match = geoData.display_name.match(/^(\d+[A-Za-z]?|\d+\/\d+[A-Za-z]?)\s*,\s*/);
    if (match) {
      houseNumber = match[1];
    }
  }

  let streetPart = "";
  if (houseNumber && road) {
    if (road.toLowerCase().startsWith(houseNumber.toLowerCase())) {
      streetPart = road;
    } else {
      streetPart = `${houseNumber} ${road}`;
    }
  } else if (road) {
    streetPart = road;
  } else if (houseNumber) {
    streetPart = `Số ${houseNumber}`;
  }

  if (streetPart) {
    parts.push(streetPart);
  }

  // 2. Phường / Xã / Thị trấn
  let ward = cleanText(
    addr.ward || addr.suburb || addr.quarter || addr.neighbourhood || addr.village || addr.hamlet
  );

  // 3. Quận / Huyện / Thị xã
  let district = cleanText(
    addr.city_district || addr.district || addr.county || addr.borough
  );

  // 4. Tỉnh / Thành phố
  let city = cleanText(
    addr.city || addr.province || addr.state || addr.region
  );

  // Chuẩn hóa tên Phường nếu chưa có tiền tố
  if (ward) {
    const lowerWard = ward.toLowerCase();
    if (
      !lowerWard.startsWith("phường") &&
      !lowerWard.startsWith("xã") &&
      !lowerWard.startsWith("thị trấn") &&
      !lowerWard.startsWith("khu phố")
    ) {
      ward = `Phường ${ward}`;
    }
  }

  // Chuẩn hóa tên Quận/Huyện nếu chưa có tiền tố
  if (district) {
    const lowerDist = district.toLowerCase();
    if (
      !lowerDist.startsWith("quận") &&
      !lowerDist.startsWith("huyện") &&
      !lowerDist.startsWith("thị xã") &&
      !lowerDist.startsWith("tp") &&
      !lowerDist.startsWith("thành phố")
    ) {
      district = `Quận ${district}`;
    }
  }

  // Deduplicate Phường vs Quận: Nếu Phường và Quận trùng tên (ví dụ: Phường Cầu Giấy vs Quận Cầu Giấy)
  if (ward && district) {
    const wardCore = removePrefix(removePrefix(ward, "Phường"), "Xã").toLowerCase();
    const distCore = removePrefix(removePrefix(district, "Quận"), "Huyện").toLowerCase();
    if (wardCore === distCore || ward.toLowerCase().includes(distCore)) {
      district = "";
    }
  }

  if (ward) parts.push(ward);
  if (district) parts.push(district);

  if (city) {
    parts.push(city);
  }

  // Lọc trùng lặp
  const uniqueParts: string[] = [];
  parts.forEach((p) => {
    if (p && !uniqueParts.some((existing) => existing.toLowerCase() === p.toLowerCase())) {
      uniqueParts.push(p);
    }
  });

  const formattedAddress =
    uniqueParts.length > 0
      ? uniqueParts.join(", ")
      : (geoData.display_name || "")
          .replace(/,\s*\d{4,6},\s*Việt Nam$/i, "")
          .replace(/,\s*Việt Nam$/i, "")
          .trim();

  const isPrecise = Boolean(houseNumber && road);

  return {
    formattedAddress,
    houseNumber: houseNumber || undefined,
    road: road || undefined,
    ward: ward || undefined,
    district: district || undefined,
    city: city || undefined,
    addressLevel: isPrecise ? "PRECISE" : "APPROXIMATE",
  };
}

/**
 * Chuyển đổi tọa độ GPS sang địa chỉ tiếng Việt chi tiết nhất (OpenStreetMap Nominatim API)
 */
export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<GeocodeAddress> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=vi`;

    const res = await fetch(url, {
      headers: {
        "Accept-Language": "vi-VN,vi;q=0.9",
        "User-Agent": "Trasuadino-Storefront/1.0",
      },
    });

    if (!res.ok) {
      throw new Error("Lỗi kết nối dịch vụ bản đồ");
    }

    const data = await res.json();
    return formatDeliveryAddress(data);
  } catch (error) {
    console.error("Lỗi reverse geocoding:", error);
    return {
      formattedAddress: `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      addressLevel: "APPROXIMATE",
    };
  }
};
