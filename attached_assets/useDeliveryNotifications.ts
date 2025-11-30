import { useEffect, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface DeliveryNotification {
  id: number;
  orderNumber: string;
  customerName: string;
  deliveryAddress: string;
  total: number;
  createdAt: Date;
}

export function useDeliveryNotifications(driverId: number | null, enabled: boolean = true) {
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([]);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: availableOrders } = trpc.delivery.getAvailableOrders.useQuery(
    undefined,
    {
      enabled: enabled && !!driverId,
      refetchInterval: 10000, // Poll every 10 seconds
    }
  );

  useEffect(() => {
    // Create notification sound
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio("data:audio/wav;base64,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");
    }
  }, []);

  useEffect(() => {
    if (!availableOrders || !enabled) return;

    // Check for new orders
    const newOrders = availableOrders.filter(
      (order) => new Date(order.createdAt) > lastChecked
    );

    if (newOrders.length > 0) {
      // Play notification sound
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          // Ignore audio play errors
        });
      }

      // Show toast notifications
      newOrders.forEach((order) => {
        toast.success(`🚚 Novo pedido disponível!`, {
          description: `Pedido #${order.orderNumber} - ${formatPrice(order.total)}`,
          duration: 10000,
        });
      });

      const mappedOrders = newOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        deliveryAddress: order.deliveryAddress,
        total: order.total,
        createdAt: order.createdAt,
      }));
      setNotifications((prev) => [...mappedOrders, ...prev]);
      setLastChecked(new Date());
    }
  }, [availableOrders, enabled, lastChecked]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    clearNotifications,
    hasNewNotifications: notifications.length > 0,
  };
}
