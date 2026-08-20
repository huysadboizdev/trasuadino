"use client";

import { useEffect, useRef, useCallback } from "react";
import { Order, StoreSetting } from "@/lib/types";

interface UseRealtimeOptions {
  role?: "admin" | "staff" | "customer";
  userId?: string;
  phone?: string;
  onOrderCreated?: (order: Order) => void;
  onOrderStatusUpdated?: (order: Order) => void;
  onStoreStatusUpdated?: (settings: StoreSetting) => void;
  onReconnect?: () => void;
}

export function useRealtime({
  role = "customer",
  userId,
  phone,
  onOrderCreated,
  onOrderStatusUpdated,
  onStoreStatusUpdated,
  onReconnect,
}: UseRealtimeOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  // Store callbacks in refs to prevent unnecessary re-connections
  const callbacksRef = useRef({
    onOrderCreated,
    onOrderStatusUpdated,
    onStoreStatusUpdated,
    onReconnect,
  });

  useEffect(() => {
    callbacksRef.current = {
      onOrderCreated,
      onOrderStatusUpdated,
      onStoreStatusUpdated,
      onReconnect,
    };
  });

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (userId) params.set("userId", userId);
    if (phone) params.set("phone", phone);

    const url = `/api/realtime?${params.toString()}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      if (reconnectAttemptsRef.current > 0) {
        callbacksRef.current.onReconnect?.();
      }
      reconnectAttemptsRef.current = 0;
    };

    es.addEventListener("order:created", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as Order;
        callbacksRef.current.onOrderCreated?.(data);
      } catch (err) {
        console.error("[Realtime parse error - order:created]:", err);
      }
    });

    es.addEventListener("order:status_updated", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as Order;
        callbacksRef.current.onOrderStatusUpdated?.(data);
      } catch (err) {
        console.error("[Realtime parse error - order:status_updated]:", err);
      }
    });

    es.addEventListener("store:status_updated", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as StoreSetting;
        callbacksRef.current.onStoreStatusUpdated?.(data);
      } catch (err) {
        console.error("[Realtime parse error - store:status_updated]:", err);
      }
    });

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;

      // Exponential backoff reconnect: 2s, 4s, 8s, up to max 15s
      const delay = Math.min(15000, 2000 * Math.pow(1.5, reconnectAttemptsRef.current));
      reconnectAttemptsRef.current += 1;

      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [role, userId, phone]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);
}
