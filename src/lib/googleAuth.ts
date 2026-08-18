"use client";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
  }
}

export interface GoogleUserProfile {
  email: string;
  name: string;
  avatar?: string;
  googleId?: string;
}

export const loadGoogleGsiScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if (window.google?.accounts?.oauth2) return resolve();

    const existing = document.getElementById("google-gsi-client");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      // Nếu đã load xong trước đó
      if (window.google?.accounts?.oauth2) resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
};

export const triggerGoogleOAuth = async (): Promise<GoogleUserProfile> => {
  await loadGoogleGsiScript();

  return new Promise((resolve, reject) => {
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "652476813264-4q4nabf1ffa6tcmp10kcihakbfgv5m61.apps.googleusercontent.com";

    if (!window.google?.accounts?.oauth2) {
      return reject(
        new Error("Chưa nạp được Google SDK. Vui lòng kiểm tra kết nối mạng và thử lại!")
      );
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error));
          }

          if (tokenResponse?.access_token) {
            try {
              const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const profile = await res.json();
              if (profile?.email) {
                return resolve({
                  email: profile.email,
                  name: profile.name || profile.email.split("@")[0],
                  avatar: profile.picture,
                  googleId: profile.sub,
                });
              } else {
                return reject(new Error("Không thể lấy thông tin email từ Google"));
              }
            } catch (err) {
              return reject(err);
            }
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error_callback: (err: any) => {
          reject(new Error(err?.message || "Đã hủy đăng nhập Google"));
        },
      });

      tokenClient.requestAccessToken({ prompt: "select_account" });
    } catch (err) {
      reject(err);
    }
  });
};
