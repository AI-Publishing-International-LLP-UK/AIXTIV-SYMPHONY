
// Push Notification Service for ASOOS Mobile
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

class ASSOOSPushService {
  constructor() {
    this.app = initializeApp({"projectId":"asoos-mobile-infrastructure","messagingSenderId":"123456789012","apiKey":"AIzaSyD...","appId":"com.asoos.mobile"});
    this.messaging = getMessaging(this.app);
    this.setupMessageHandling();
  }

  async requestPermission() {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Push notification permission granted');
      return await this.getDeviceToken();
    } else {
      throw new Error('Push notification permission denied');
    }
  }

  async getDeviceToken() {
    try {
      const token = await getToken(this.messaging, {
        vapidKey: 'BKd...' // VAPID key for web push
      });
      return token;
    } catch (error) {
      console.error('Failed to get device token:', error);
      throw error;
    }
  }

  setupMessageHandling() {
    onMessage(this.messaging, (payload) => {
      console.log('Message received:', payload);
      this.displayNotification(payload);
    });
  }

  displayNotification(payload) {
    const { notification, data } = payload;
    
    // Create rich notification based on type
    const options = {
      body: notification.body,
      icon: '/icons/asoos-notification.png',
      badge: '/icons/asoos-badge.png',
      vibrate: data.vibration ? JSON.parse(data.vibration) : [200],
      actions: this.getNotificationActions(data.type),
      data: data
    };

    new Notification(notification.title, options);
  }

  getNotificationActions(type) {
    switch (type) {
      case 'infrastructure_alert':
        return [
          { action: 'acknowledge', title: '✅ Acknowledge' },
          { action: 'investigate', title: '🔍 Investigate' }
        ];
      case 'command_completion':
        return [
          { action: 'view', title: '👀 View Details' },
          { action: 'dismiss', title: '❌ Dismiss' }
        ];
      case 'security_alert':
        return [
          { action: 'secure', title: '🔒 Secure Account' },
          { action: 'review', title: '📋 Review Activity' }
        ];
      default:
        return [];
    }
  }
}

export default ASOOSPushService;
