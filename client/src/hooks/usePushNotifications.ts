// Hook para gerenciar push notifications via WebSocket

import { useEffect, useState } from "react";
import { useToast } from "./use-toast";

interface PushNotification {
  type: string;
  data: any;
  timestamp: string;
}

export function usePushNotifications(userId?: string, userType?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const { toast } = useToast();
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!userId || !userType) return;

    const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws?userId=${userId}&type=${userType}`;

    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      try {
        const notification: PushNotification = JSON.parse(event.data);
        setNotifications((prev) => [notification, ...prev]);

        // Mostrar toast baseado no tipo
        switch (notification.type) {
          case "order_update":
            toast({
              title: "Atualização de Pedido",
              description: `Pedido ${notification.data.orderId} atualizado para ${notification.data.status}`,
            });
            break;

          case "new_order":
            toast({
              title: "Novo Pedido Recebido!",
              description: `${notification.data.customerName} - R$ ${notification.data.total}`,
            });
            break;

          case "delivery_assignment":
            toast({
              title: "Nova Entrega Atribuída",
              description: `Entrega para ${notification.data.customerAddress}`,
            });
            break;

          case "admin_alert":
            toast({
              title: "Alerta de Administrador",
              description: notification.data.message,
              variant: "destructive",
            });
            break;

          default:
            toast({
              title: "Nova Notificação",
              description: JSON.stringify(notification.data),
            });
        }
      } catch (error) {
      }
    };

    websocket.onerror = (error) => {
      setIsConnected(false);
    };

    websocket.onclose = () => {
      setIsConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [userId, userType, toast]);

  const sendMessage = (message: any) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    notifications,
    sendMessage,
  };
}
