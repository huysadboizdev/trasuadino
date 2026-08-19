import { dataStore } from "./store";
import { Order, OrderStatus } from "./types";
import { realtimeHub } from "./realtime";

export interface UpdateOrderStatusResult {
  success: boolean;
  order?: Order;
  previousStatus?: OrderStatus;
  isUnchanged?: boolean;
  reason?: "NOT_FOUND" | "UPDATE_FAILED" | "INVALID_STATUS";
  message: string;
}

export const orderService = {
  getOrders(status?: string, email?: string): Order[] {
    return dataStore.getOrders(status, email);
  },

  getOrderById(identifier: string): Order | null {
    if (!identifier) return null;
    return dataStore.getOrderById(identifier);
  },

  createOrder(orderData: Omit<Order, "id" | "orderCode" | "createdAt">): Order {
    return dataStore.createOrder(orderData);
  },

  updateStatus(
    identifier: string,
    newStatus: OrderStatus,
    actor?: { source: "WEB_ADMIN" | "TELEGRAM_ADMIN" | "SYSTEM"; id?: string | number }
  ): UpdateOrderStatusResult {
    const raw = String(identifier || "").trim();
    if (!raw) {
      return {
        success: false,
        reason: "NOT_FOUND",
        message: "Mã đơn hàng không được để trống",
      };
    }

    const validStatuses: OrderStatus[] = [
      "NEW",
      "PREPARING",
      "DELIVERING",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(newStatus)) {
      return {
        success: false,
        reason: "INVALID_STATUS",
        message: `Trạng thái "${newStatus}" không hợp lệ`,
      };
    }

    console.log(
      `[OrderService.updateStatus] Looking up order identifier="${raw}", targetStatus="${newStatus}", actor=${actor?.source || "UNKNOWN"}(${actor?.id || ""})`
    );

    // 1. Tìm đơn hàng
    const existingOrder = dataStore.getOrderById(raw);
    if (!existingOrder) {
      console.warn(`[OrderService.updateStatus] Order lookup result: found=false, identifier="${raw}"`);
      return {
        success: false,
        reason: "NOT_FOUND",
        message: `Đơn hàng #${raw} không còn tồn tại trong hệ thống.`,
      };
    }

    console.log(
      `[OrderService.updateStatus] Order lookup result: found=true, id="${existingOrder.id}", orderCode="${existingOrder.orderCode}", currentStatus="${existingOrder.orderStatus}"`
    );

    // 2. Idempotent check
    if (existingOrder.orderStatus === newStatus) {
      console.log(`[OrderService.updateStatus] Status unchanged (${newStatus}), returning existing order`);
      return {
        success: true,
        order: existingOrder,
        previousStatus: existingOrder.orderStatus,
        isUnchanged: true,
        message: `Đơn hàng #${existingOrder.orderCode} đã ở trạng thái ${newStatus}.`,
      };
    }

    const prevStatus = existingOrder.orderStatus;

    // 3. Cập nhật trong cơ sở dữ liệu
    const updated = dataStore.updateOrderStatus(existingOrder.id, newStatus);
    if (!updated) {
      console.error(
        `[OrderService.updateStatus] Database update failed for orderId="${existingOrder.id}"`
      );
      return {
        success: false,
        reason: "UPDATE_FAILED",
        message: `Không thể cập nhật trạng thái đơn #${existingOrder.orderCode} vào cơ sở dữ liệu.`,
      };
    }

    console.log(
      `[OrderService.updateStatus] Order status updated successfully: id="${updated.id}", orderCode="${updated.orderCode}", status: ${prevStatus} -> ${newStatus}`
    );

    // 4. Bắn sự kiện realtime đồng bộ hai chiều (Admin Web, Khách hàng)
    realtimeHub.emitOrderStatusUpdated(updated);

    return {
      success: true,
      order: updated,
      previousStatus: prevStatus,
      message: `Đã cập nhật trạng thái đơn #${updated.orderCode} sang: ${newStatus}`,
    };
  },

  deleteOrder(identifier: string, actor?: { source: string; id?: string | number }): Order | null {
    const deleted = dataStore.deleteOrder(identifier);
    if (deleted) {
      console.log(
        `[OrderService.deleteOrder] Order deleted: id="${deleted.id}", orderCode="${deleted.orderCode}", actor=${actor?.source || "UNKNOWN"}`
      );
    }
    return deleted;
  },
};
