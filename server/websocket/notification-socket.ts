import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { log } from "../logger";
import jwt from "jsonwebtoken";

interface NotificationConnection {
  userId: string;
  userType: string;
  tenantId?: string;
  ws: WebSocket;
  lastPing: number;
}

export class NotificationSocketManager {
  private static instance: NotificationSocketManager;
  private wss?: WebSocketServer;
  private connections = new Map<string, NotificationConnection>();

  private constructor() {
    log("[NotificationSocket] Manager initialized");
  }

  static getInstance(): NotificationSocketManager {
    if (!this.instance) {
      this.instance = new NotificationSocketManager();
    }
    return this.instance;
  }

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws: WebSocket, req) => {
      try {
        const url = new URL(req.url || "", "http://localhost");
        const userId = url.searchParams.get("userId");
        const userType = url.searchParams.get("type");
        const token = url.searchParams.get("token");

        if (!userId || !userType) {
          ws.send(JSON.stringify({ error: "Missing userId or type" }));
          ws.close();
          return;
        }

        // Verify token if provided
        let tenantId: string | undefined;
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
            tenantId = decoded.tenantId;
          } catch (error) {
            log(`[NotificationSocket] Token verification failed: ${error}`);
          }
        }

        const connectionId = `${userId}-${userType}`;
        this.connections.set(connectionId, {
          userId,
          userType,
          tenantId,
          ws,
          lastPing: Date.now(),
        });

        log(`[NotificationSocket] Connection established: ${connectionId}`);

        ws.on("message", async (data: string) => {
          try {
            const message = JSON.parse(data);
            this.handleMessage(ws, message, connectionId);
          } catch (error) {
            log(`[NotificationSocket] Message parse error: ${error}`);
          }
        });

        ws.on("close", () => {
          this.handleDisconnect(connectionId);
        });

        ws.on("error", (error) => {
          log(`[NotificationSocket] Error: ${error}`);
        });

        // Send connection confirmation
        ws.send(JSON.stringify({ action: "connected", userId, userType }));
      } catch (error) {
        log(`[NotificationSocket] Connection error: ${error}`);
        ws.close();
      }
    });

    log("[NotificationSocket] WebSocket server initialized on /ws");
  }

  private handleMessage(ws: WebSocket, message: any, connectionId: string): void {
    const { action } = message;

    switch (action) {
      case "ping":
        ws.send(JSON.stringify({ action: "pong" }));
        break;
      default:
        log(`[NotificationSocket] Unknown action: ${action}`);
    }
  }

  private handleDisconnect(connectionId: string): void {
    this.connections.delete(connectionId);
    log(`[NotificationSocket] Connection closed: ${connectionId}`);
  }

  // Broadcast notification to specific user
  sendNotification(userId: string, userType: string, notification: any): void {
    const connectionId = `${userId}-${userType}`;
    const conn = this.connections.get(connectionId);

    if (conn && conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(JSON.stringify(notification));
      log(`[NotificationSocket] Notification sent to ${connectionId}`);
    }
  }

  // Broadcast to all users of a type
  broadcastByType(userType: string, notification: any): void {
    let count = 0;
    this.connections.forEach((conn) => {
      if (conn.userType === userType && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify(notification));
        count++;
      }
    });
    log(`[NotificationSocket] Broadcasted to ${count} ${userType}s`);
  }

  // Broadcast to tenant
  broadcastByTenant(tenantId: string, notification: any): void {
    let count = 0;
    this.connections.forEach((conn) => {
      if (conn.tenantId === tenantId && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify(notification));
        count++;
      }
    });
    log(`[NotificationSocket] Broadcasted to ${count} users in tenant ${tenantId}`);
  }

  getConnectionsCount(): number {
    return this.connections.size;
  }
}

export const notificationSocketManager = NotificationSocketManager.getInstance();
