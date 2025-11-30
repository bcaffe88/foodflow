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
        userId,
        type: userType,
        token,
        ...(tenantId && { tenantId }),
      });
      
      const wsUrl = `${protocol}//${window.location.host}/ws?${params.toString()}`;
      console.log("[WebSocket] Connecting to:", wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WebSocket] ✅ Connected");
        setIsConnected(true);
        setReconnectAttempts(0);
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("[WebSocket] Message received:", message.type);
          onMessage?.(message);
        } catch (error) {
          console.error("[WebSocket] Message parse error:", error);
        }
      };

      ws.onclose = () => {
        console.log("[WebSocket] ❌ Disconnected");
        setIsConnected(false);
        onDisconnect?.();
        
        // Reconectar após 3 segundos (máx 5 tentativas)
        if (reconnectAttempts < 5) {
          setTimeout(() => {
            console.log("[WebSocket] Attempting reconnect...");
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("[WebSocket] Connection error:", error);
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
