import { Order, StoreSetting } from "./types";

type EventCallback = (event: string, data: any) => void;

class RealtimeHub {
  private subscribers: Map<string, Set<EventCallback>> = new Map();

  /**
   * Đăng ký nhận sự kiện trên một channel
   * Trả về hàm unsubscribe
   */
  subscribe(channel: string, callback: EventCallback): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    const set = this.subscribers.get(channel)!;
    set.add(callback);

    return () => {
      set.delete(callback);
      if (set.size === 0) {
        this.subscribers.delete(channel);
      }
    };
  }

  /**
   * Phát sự kiện tới một channel cụ thể
   */
  publish(channel: string, event: string, data: any) {
    const set = this.subscribers.get(channel);
    if (set && set.size > 0) {
      set.forEach((cb) => {
        try {
          cb(event, data);
        } catch (err) {
          console.error(`[RealtimeHub publish error on channel ${channel}]:`, err);
        }
      });
    }
  }

  /**
   * Bắn sự kiện Đơn hàng mới tạo tới tất cả Admin clients
   */
  emitOrderCreated(order: Order) {
    // 1. Gửi tới kênh admin
    this.publish("admin:orders", "order:created", order);

    // 2. Gửi tới kênh user tạo đơn (nếu có userId hoặc phone)
    if (order.userId) {
      this.publish(`user:${order.userId}`, "order:created", order);
    }
    if (order.customerPhone) {
      const cleanPhone = order.customerPhone.trim().replace(/\s/g, "");
      this.publish(`user:phone:${cleanPhone}`, "order:created", order);
    }
  }

  /**
   * Bắn sự kiện Cập nhật trạng thái đơn hàng (2 chiều: Admin <-> User)
   */
  emitOrderStatusUpdated(order: Order) {
    // 1. Gửi tới kênh admin để đồng bộ trạng thái giữa các màn hình admin
    this.publish("admin:orders", "order:status_updated", order);

    // 2. Gửi tới kênh user sở hữu đơn hàng
    if (order.userId) {
      this.publish(`user:${order.userId}`, "order:status_updated", order);
    }
    if (order.customerPhone) {
      const cleanPhone = order.customerPhone.trim().replace(/\s/g, "");
      this.publish(`user:phone:${cleanPhone}`, "order:status_updated", order);
    }
    if (order.orderCode) {
      this.publish(`order:${order.orderCode}`, "order:status_updated", order);
    }
  }

  /**
   * Bắn sự kiện Cập nhật trạng thái quán (Đóng / Mở cửa) tới tất cả khách hàng và Admin
   */
  emitStoreStatusUpdated(settings: StoreSetting) {
    this.publish("admin:orders", "store:status_updated", settings);
    this.publish("public:store", "store:status_updated", settings);
  }
}

// Global Singleton instance
const globalForRealtime = global as unknown as { realtimeHub?: RealtimeHub };
export const realtimeHub = globalForRealtime.realtimeHub || new RealtimeHub();
if (process.env.NODE_ENV !== "production") globalForRealtime.realtimeHub = realtimeHub;
