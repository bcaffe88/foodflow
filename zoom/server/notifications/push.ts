// Sistema de Push Notifications via WebSocket
// Clientes se conectam e recebem atualizações em tempo real

import type { Express } from "express";
import { WebSocketServer } from "ws";
import type { Server as HTTPServer } from "http";
import { storage } from "../storage";

interface ClientConnection {
  ws: any;
  userId: string;
  type: "customer" | "restaurant" | "driver" | "admin";
}

const clients: Map<string, ClientConnection[]> = new Map();

export function setupPushNotifications(app: Express, server: HTTPServer) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: any, req: any) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get("userId");
    const userType = url.searchParams.get("type") as any;

    if (!userId || !userType) {
      ws.close(4000, "Missing userId or type");
      return;
    }

    const connection: ClientConnection = { ws, userId, type: userType };

    if (!clients.has(userId)) {
      clients.set(userId, []);
    }
    clients.get(userId)?.push(connection);


    ws.on("close", () => {
      const connections = clients.get(userId);
      if (connections) {
        const index = connections.indexOf(connection);
        if (index > -1) {
          connections.splice(index, 1);
        }
      }
    });

    ws.on("error", (error: any) => {
      console.error(`[WebSocket] Error for user ${userId}:`, error);
    });
  });

  return {
    notifyCustomer: (customerId: string, notification: any) => {
      const connections = clients.get(customerId);
      if (connections) {
        const message = JSON.stringify({
          type: "order_update",
          data: notification,
          timestamp: new Date().toISOString(),
        });
        connections.forEach((conn) => {
          if (conn.ws.readyState === 1) {
            conn.ws.send(message);
          }
        });
      }
    },

    notifyRestaurant: (restaurantId: string, notification: any) => {
      // Notifica todos os usuários desse restaurante
      clients.forEach((connections, userId) => {
        connections.forEach((conn) => {
          if (conn.type === "restaurant") {
            const message = JSON.stringify({
              type: "new_order",
              data: notification,
              timestamp: new Date().toISOString(),
            });
            if (conn.ws.readyState === 1) {
              conn.ws.send(message);
            }
          }
        });
      });
    },

    notifyDriver: (driverId: string, notification: any) => {
      const connections = clients.get(driverId);
      if (connections) {
        const message = JSON.stringify({
          type: "delivery_assignment",
          data: notification,
          timestamp: new Date().toISOString(),
        });
        connections.forEach((conn) => {
          if (conn.ws.readyState === 1) {
            conn.ws.send(message);
          }
        });
      }
    },

    notifyAdmin: (notification: any) => {
      // Notifica todos os admins conectados
      clients.forEach((connections) => {
        connections.forEach((conn) => {
          if (conn.type === "admin") {
            const message = JSON.stringify({
              type: "admin_alert",
              data: notification,
              timestamp: new Date().toISOString(),
            });
            if (conn.ws.readyState === 1) {
              conn.ws.send(message);
            }
          }
        });
      });
    },

    broadcast: (notification: any) => {
      const message = JSON.stringify({
        type: "broadcast",
        data: notification,
        timestamp: new Date().toISOString(),
      });
      clients.forEach((connections) => {
        connections.forEach((conn) => {
          if (conn.ws.readyState === 1) {
            conn.ws.send(message);
          }
        });
      });
    },
  };
}
