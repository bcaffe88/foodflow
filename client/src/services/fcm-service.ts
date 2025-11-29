// Firebase Cloud Messaging Frontend Service
// Handles device registration and push notification handling

export interface FCMConfig {
  apiKey: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
}

let messaging: any = null; // Firebase Messaging instance
let deviceToken: string | null = null;

/**
 * Initialize Firebase Messaging
 * Must be called before requesting permissions
 */
export async function initializeFCM(config?: FCMConfig): Promise<boolean> {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered for push notifications');
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }

    // Load Firebase dynamically
    const { initializeApp } = await import('firebase/app');
    const { getMessaging, onMessage, isSupported } = await import('firebase/messaging');

    if (!(await isSupported())) {
      console.warn('Firebase Messaging not supported in this browser');
      return false;
    }

    // Use default config or environment variables
    const firebaseConfig = config || {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn('Firebase config not available');
      return false;
    }

    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);

    // Handle foreground notifications
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      if (payload.notification) {
        // Show custom notification
        if (Notification.permission === 'granted') {
          new Notification(payload.notification.title || 'Notificação', {
            body: payload.notification.body,
            icon: payload.notification.icon,
            badge: payload.notification.badge,
            data: payload.data
          });
        }
      }
    });

    console.log('Firebase Messaging initialized');
    return true;
  } catch (error) {
    console.error('FCM initialization error:', error);
    return false;
  }
}

/**
 * Request notification permission and get device token
 * @returns Device token if successful, null otherwise
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (!messaging) {
      console.error('Firebase Messaging not initialized');
      return null;
    }

    const { getMessaging, getToken } = await import('firebase/messaging');

    if (Notification.permission === 'denied') {
      console.warn('Notification permission denied by user');
      return null;
    }

    if (Notification.permission === 'granted') {
      // Permission already granted
      deviceToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      console.log('Device token obtained:', deviceToken?.slice(0, 20) + '...');
      return deviceToken;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // Get token after permission granted
    deviceToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });

    console.log('Device token obtained after permission:', deviceToken?.slice(0, 20) + '...');
    return deviceToken;
  } catch (error) {
    console.error('Get device token error:', error);
    return null;
  }
}

/**
 * Register device token with backend
 * Call this after successfully obtaining device token
 */
export async function registerDeviceToken(
  userId: string,
  token: string,
  platform: 'web' | 'ios' | 'android' = 'web'
): Promise<boolean> {
  try {
    const response = await fetch('/api/drivers/register-device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        userId,
        token,
        platform
      })
    });

    if (!response.ok) {
      console.error('Device registration failed:', response.statusText);
      return false;
    }

    console.log('Device registered for push notifications');
    return true;
  } catch (error) {
    console.error('Register device error:', error);
    return false;
  }
}

/**
 * Get current device token
 */
export function getDeviceToken(): string | null {
  return deviceToken;
}

/**
 * Delete device token (logout/opt-out)
 */
export function clearDeviceToken(): void {
  deviceToken = null;
}

/**
 * Request and register device (complete flow)
 * @param userId User ID (driver or customer)
 */
export async function setupPushNotifications(userId: string): Promise<boolean> {
  try {
    // Step 1: Initialize if not done
    if (!messaging) {
      const initialized = await initializeFCM();
      if (!initialized) {
        console.warn('FCM initialization failed, push disabled');
        return false;
      }
    }

    // Step 2: Request permission and get token
    const token = await requestNotificationPermission();
    if (!token) {
      console.warn('Could not obtain device token');
      return false;
    }

    // Step 3: Register with backend
    const registered = await registerDeviceToken(userId, token);
    if (!registered) {
      console.warn('Could not register device with backend');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Setup push notifications error:', error);
    return false;
  }
}
