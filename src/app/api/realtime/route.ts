import { NextRequest } from "next/server";
import { realtimeHub } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const userId = searchParams.get("userId");
  const phone = searchParams.get("phone");

  const unsubs: Array<() => void> = [];

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Hàm gửi message dạng SSE format
      const sendEvent = (eventName: string, data: any) => {
        try {
          const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          // Controller might be closed
        }
      };

      // Gửi event connected ban đầu
      sendEvent("connected", { time: new Date().toISOString(), role, userId });

      // Đăng ký kênh theo role/user
      if (role === "admin" || role === "staff") {
        unsubs.push(realtimeHub.subscribe("admin:orders", sendEvent));
      }

      if (userId) {
        unsubs.push(realtimeHub.subscribe(`user:${userId}`, sendEvent));
      }

      // Kênh công khai trạng thái quán
      unsubs.push(realtimeHub.subscribe("public:store", sendEvent));

      if (phone) {
        const cleanPhone = phone.trim().replace(/\s/g, "");
        unsubs.push(realtimeHub.subscribe(`user:phone:${cleanPhone}`, sendEvent));
      }

      // Heartbeat ping mỗi 15s để giữ kết nối ổn định qua proxies/browsers
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      // Khi client disconnect / abort request
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unsubs.forEach((unsub) => unsub());
        try {
          controller.close();
        } catch {
          // Ignore
        }
      });
    },
    cancel() {
      unsubs.forEach((unsub) => unsub());
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
