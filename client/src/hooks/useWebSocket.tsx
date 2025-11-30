import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  action?: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  userId: string;
  userType: string;
  token: string;
  tenantId?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket({
  userId,
  userType,
  token,
  tenantId,
  onMessage,
  onConnect,
  onDisconnect,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const params = new URLSearchParams({
        userId: userId || "",
        type: userType,
        token: token || "",
        ...(tenantId && { tenantId }),
      });
      
      const wsUrl = `${protocol}//${window.location.host}/ws?${params.toString()}`;
      console.log("[WebSocket] 🔗 Connecting to:", wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WebSocket] ✅ Connected successfully");
        setIsConnected(true);
        setReconnectAttempts(0);
        onConnect?.();
        
        // Send initial ping to test connection
        ws.send(JSON.stringify({ action: "ping" }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("[WebSocket] 📨 Message:", message.action || message.type);
          onMessage?.(message);
        } catch (error) {
          console.error("[WebSocket] ❌ Parse error:", error);
        }
      };

      ws.onclose = (event) => {
        console.log(`[WebSocket] ❌ Disconnected (code: ${event.code}, reason: ${event.reason})`);
        setIsConnected(false);
        onDisconnect?.();
        
        // Exponential backoff: 3s, 6s, 12s, 24s, 48s
        if (reconnectAttempts < 5) {
          const delay = 3000 * Math.pow(2, reconnectAttempts);
          setTimeout(() => {
            console.log(`[WebSocket] 🔄 Reconnecting... (attempt ${reconnectAttempts + 1}/5)`);
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else {
          console.error("[WebSocket] ❌ Max reconnection attempts reached");
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] ⚠️ Error:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("[WebSocket] 💥 Connection error:", error);
    }
  }, [userId, userType, token, tenantId, onMessage, onConnect, onDisconnect, reconnectAttempts]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    isConnected,
    send,
    reconnectAttempts,
  };
}
