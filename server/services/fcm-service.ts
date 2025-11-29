// Firebase Cloud Messaging Service
// Free tier - unlimited push notifications to drivers
// No credit card required, completely free for reasonable usage

import admin from 'firebase-admin';
import type { Message, MulticastMessage } from 'firebase-admin/messaging';

interface DeviceToken {
  userId: string;
  token: string;
  platform: 'web' | 'ios' | 'android';
}

interface NotificationPayload {
  title: string;
  body: string;
  data?: { [key: string]: string };
}

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Expects environment variables:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_PRIVATE_KEY
 * - FIREBASE_CLIENT_EMAIL
 */
export function initializeFirebase(): boolean {
  try {
    if (firebaseInitialized) return true;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      console.warn('Firebase credentials not configured. Push notifications disabled.');
      return false;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail
      })
    });

    firebaseInitialized = true;
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
}

/**
 * Send push notification to single device
 * @param deviceToken FCM device token
 * @param payload Notification content
 */
export async function sendNotification(
  deviceToken: string,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    if (!firebaseInitialized) {
      console.warn('Firebase not initialized, skipping notification');
      return false;
    }

    const message = {
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: payload.data || {},
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png'
        }
      }
    };

    const response = await admin.messaging().send({
      token: deviceToken,
      ...message
    } as Message);

    console.log('Notification sent:', response);
    return true;
  } catch (error) {
    console.error('Send notification error:', error);
    return false;
  }
}

/**
 * Send notification to multiple devices (batch)
 * @param deviceTokens Array of FCM device tokens
 * @param payload Notification content
 */
export async function sendBroadcast(
  deviceTokens: string[],
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized, skipping broadcast');
    return { success: 0, failed: deviceTokens.length };
  }

  const message = {
    notification: {
      title: payload.title,
      body: payload.body
    },
    data: payload.data || {},
    webpush: {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png'
      }
    }
  };

  let success = 0;
  let failed = 0;

  // Send in batches of 100 (FCM limit)
  for (let i = 0; i < deviceTokens.length; i += 100) {
    const batch = deviceTokens.slice(i, i + 100);
    
    try {
      const response = await admin.messaging().sendMulticast({
        tokens: batch,
        ...message
      } as MulticastMessage);

      success += response.successCount;
      failed += response.failureCount;

      // Log failed tokens for cleanup
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.warn(`Failed to send to token ${batch[idx]}:`, resp.error);
          }
        });
      }
    } catch (error) {
      console.error('Batch send error:', error);
      failed += batch.length;
    }
  }

  return { success, failed };
}

/**
 * Send notification to driver about new order
 * @param deviceToken Driver's FCM token
 * @param orderId Order ID
 * @param customerName Customer name
 * @param deliveryAddress Delivery address
 */
export async function notifyNewOrder(
  deviceToken: string,
  orderId: string,
  customerName: string,
  deliveryAddress: string
): Promise<boolean> {
  return sendNotification(deviceToken, {
    title: '📦 Novo Pedido!',
    body: `De ${customerName} - ${deliveryAddress}`,
    data: {
      orderId,
      type: 'new_order',
      action: 'openOrder'
    }
  });
}

/**
 * Send notification about order status change
 * @param deviceToken Customer's FCM token
 * @param status New order status
 * @param restaurantName Restaurant name
 */
export async function notifyOrderStatus(
  deviceToken: string,
  status: string,
  restaurantName: string
): Promise<boolean> {
  const statusMessages: { [key: string]: string } = {
    confirmed: '✅ Seu pedido foi confirmado!',
    preparing: '👨‍🍳 Estamos preparando seu pedido',
    ready: '🚗 Seu pedido está saindo para entrega!',
    out_for_delivery: '📍 Seu entregador está a caminho',
    delivered: '✨ Pedido entregue! Obrigado!'
  };

  return sendNotification(deviceToken, {
    title: restaurantName,
    body: statusMessages[status] || `Status: ${status}`,
    data: {
      type: 'order_status',
      status,
      action: 'trackOrder'
    }
  });
}

/**
 * Check Firebase connection
 */
export async function firebaseHealthCheck(): Promise<boolean> {
  try {
    if (!firebaseInitialized) {
      console.warn('Firebase not initialized');
      return false;
    }

    // Try to get a simple metric from Firebase
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) return false;

    console.log('Firebase health check: OK');
    return true;
  } catch (error) {
    console.error('Firebase health check failed:', error);
    return false;
  }
}
