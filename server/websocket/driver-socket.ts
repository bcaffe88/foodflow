import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { log } from "../logger";
import { storage } from "../storage";

interface DriverConnection {
  userId: string;
  tenantId: string;
  ws: WebSocket;
  lastLocation?: { lat: number; lng: number };
  lastPing: number;
}

export class DriverSocketManager {
  private static instance: DriverSocketManager;
  private wss?: WebSocketServer;
  private driverConnections = new Map<string, DriverConnection>();

  private constructor() {
    log("[DriverSocket] Manager initialized");
  }

  static getInstance(): DriverSocketManager {
    if (!this.instance) {
      this.instance = new DriverSocketManager();
    }
    return this.instance;
  }

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: "/ws/driver" });

    this.wss.on("connection", (ws: WebSocket) => {
      log("[DriverSocket] New connection");

      ws.on("message", async (data: string) => {
        try {
          const message = JSON.parse(data);
          await this.handleMessage(ws, message);
        } catch (error) {
          log(`[DriverSocket] Message parse error: ${error}`);
        }
      });

      ws.on("close", () => {
        this.handleDisconnect(ws);
      });

      ws.on("error", (error) => {
        log(`[DriverSocket] Error: ${error}`);
      });
    });

    log("[DriverSocket] WebSocket server initialized on /ws/driver");
  }

  private async handleMessage(ws: WebSocket, message: any): Promise<void> {
    const { action, userId, tenantId, data } = message;

    switch (action) {
      case "auth":
        await this.handleAuth(ws, userId, tenantId);
        break;

      case "location":
        await this.updateLocation(ws, data?.lat, data?.lng);
        break;

      case "ping":
        ws.send(JSON.stringify({ action: "pong" }));
        break;

      default:
        log(`[DriverSocket] Unknown action: ${action}`);
    }
  }

  private async handleAuth(ws: WebSocket, userId: string, tenantId: string): Promise<void> {
    const connectionId = `${userId}-${tenantId}`;
    this.driverConnections.set(connectionId, {
      userId,
      tenantId,
      ws,
      lastPing: Date.now(),
    });

    log(`[DriverSocket] Driver authenticated: ${connectionId}`);

    // Send initial available orders
    try {
      const orders = await storage.getAvailableOrdersByTenant(tenantId, "ready");
      ws.send(JSON.stringify({
        action: "orders_update",
        orders,
      }));
    } catch (error) {
      log(`[DriverSocket] Error loading initial orders: ${error}`);
    }
  }

  private async updateLocation(ws: WebSocket, lat: number, lng: number): Promise<void> {
    // Find driver by WebSocket
    let driverId = "";
    let tenantId = "";

    for (const [id, conn] of this.driverConnections.entries()) {
      if (conn.ws === ws) {
        driverId = conn.userId;
        tenantId = conn.tenantId;
        conn.lastLocation = { lat, lng };
        break;
      }
    }

    if (!driverId) return;

    try {
      // Save location to database (async, non-blocking)
      await storage.updateDriverLocation(driverId, lat, lng);

      // Broadcast driver location to nearby drivers (for future feature)
      this.broadcastToTenant(tenantId, {
        action: "driver_location_update",
        driverId,
        location: { lat, lng },
      });
    } catch (error) {
      log(`[DriverSocket] Error updating location: ${error}`);
    }
  }

  private handleDisconnect(ws: WebSocket): void {
    for (const [id, conn] of this.driverConnections.entries()) {
      if (conn.ws === ws) {
        this.driverConnections.delete(id);
        log(`[DriverSocket] Driver disconnected: ${id}`);
        break;
      }
    }
  }

  // Broadcast new orders to all online drivers
  async broadcastNewOrder(tenantId: string, orderId: string): Promise<void> {
    try {
      const order = await storage.getOrder(orderId);
      if (!order) return;

      const message = JSON.stringify({
        action: "new_order",
        order,
      });

      for (const [id, conn] of this.driverConnections.entries()) {
        if (conn.tenantId === tenantId && conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.send(message);
        }
      }

      log(`[DriverSocket] Broadcasted order ${orderId} to ${tenantId}`);
    } catch (error) {
      log(`[DriverSocket] Error broadcasting order: ${error}`);
    }
  }

  private broadcastToTenant(tenantId: string, data: any): void {
    const message = JSON.stringify(data);

    for (const [id, conn] of this.driverConnections.entries()) {
      if (conn.tenantId === tenantId && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(message);
      }
    }
  }

  getActiveDriversCount(tenantId: string): number {
    let count = 0;
    for (const [id, conn] of this.driverConnections.entries()) {
      if (conn.tenantId === tenantId && conn.ws.readyState === WebSocket.OPEN) {
        count++;
      }
    }
    return count;
  }
}

export const driverSocketManager = DriverSocketManager.getInstance();
