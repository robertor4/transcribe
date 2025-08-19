class NotificationService {
  private readonly STORAGE_KEY = 'transcribe_notifications_enabled';
  private notificationsEnabled: boolean = false;

  constructor() {
    // Check if browser supports notifications
    if (this.isSupported()) {
      // Load saved preference
      if (typeof window !== 'undefined') {
        this.notificationsEnabled = localStorage.getItem(this.STORAGE_KEY) === 'true';
      }
    }
  }

  /**
   * Check if browser supports notifications
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.notificationsEnabled && this.hasPermission();
  }

  /**
   * Check if we have permission to send notifications
   */
  hasPermission(): boolean {
    return typeof window !== 'undefined' && this.isSupported() && Notification.permission === 'granted';
  }

  /**
   * Check if permission was denied
   */
  isDenied(): boolean {
    return typeof window !== 'undefined' && this.isSupported() && Notification.permission === 'denied';
  }

  /**
   * Get current notification status
   */
  getStatus(): 'enabled' | 'disabled' | 'denied' | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    if (this.isDenied()) return 'denied';
    if (this.isEnabled()) return 'enabled';
    return 'disabled';
  }

  /**
   * Request permission and enable notifications
   */
  async enable(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported in this browser');
      return false;
    }

    if (this.isDenied()) {
      console.warn('Notification permission was denied. Please enable in browser settings.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        this.notificationsEnabled = true;
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.STORAGE_KEY, 'true');
        }
        
        // Send test notification
        this.sendNotification({
          title: 'Notifications enabled!',
          body: 'You\'ll be notified when your transcriptions are ready.',
          icon: '/assets/icons/notification-icon.svg',
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Disable notifications
   */
  disable(): void {
    this.notificationsEnabled = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, 'false');
    }
  }

  /**
   * Toggle notifications on/off
   */
  async toggle(): Promise<boolean> {
    if (this.isEnabled()) {
      this.disable();
      return false;
    } else {
      return await this.enable();
    }
  }

  /**
   * Send a notification
   */
  sendNotification(options: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
  }): void {
    console.log('sendNotification called with:', options);
    console.log('Notification enabled status:', this.isEnabled());
    console.log('Document has focus:', document.hasFocus());
    
    if (!this.isEnabled()) {
      console.log('Notifications are not enabled');
      return;
    }

    // Don't send notification if the page is currently focused
    if (document.hasFocus()) {
      console.log('Page is focused, skipping notification');
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/assets/icons/notification-icon.svg',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
      });

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        // If there's custom data, handle it
        if (options.data?.transcriptionId) {
          // Could navigate to specific transcription
          console.log('Notification clicked for transcription:', options.data.transcriptionId);
        }
      };

      // Auto-close notification after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Send notification for completed transcription
   */
  sendTranscriptionComplete(fileName: string, transcriptionId: string, forceNotification: boolean = false): void {
    // For testing/debugging, we can force the notification even if page is focused
    if (forceNotification) {
      this.sendNotificationForced({
        title: '✅ Transcription complete!',
        body: `Your transcription for "${fileName}" is ready to view.`,
        tag: `transcription-${transcriptionId}`,
        data: { transcriptionId },
        requireInteraction: false,
      });
    } else {
      this.sendNotification({
        title: '✅ Transcription complete!',
        body: `Your transcription for "${fileName}" is ready to view.`,
        tag: `transcription-${transcriptionId}`,
        data: { transcriptionId },
        requireInteraction: false,
      });
    }
  }

  /**
   * Send notification without focus check (for testing)
   */
  sendNotificationForced(options: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
  }): void {
    console.log('sendNotificationForced called with:', options);
    
    if (!this.isEnabled()) {
      console.log('Notifications are not enabled');
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/assets/icons/notification-icon.svg',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
      });

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        if (options.data?.transcriptionId) {
          console.log('Notification clicked for transcription:', options.data.transcriptionId);
        }
      };

      // Auto-close notification after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);
      
      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Send notification for failed transcription
   */
  sendTranscriptionFailed(fileName: string, transcriptionId: string): void {
    this.sendNotification({
      title: '❌ Transcription failed',
      body: `Failed to transcribe "${fileName}". Please try again.`,
      tag: `transcription-${transcriptionId}`,
      data: { transcriptionId },
      requireInteraction: false,
    });
  }

  /**
   * Debug method to check notification status and send test
   */
  debug(): void {
    console.log('=== Notification Debug Info ===');
    console.log('Browser supports notifications:', this.isSupported());
    console.log('Notification permission:', this.isSupported() ? Notification.permission : 'N/A');
    console.log('Notifications enabled in app:', this.notificationsEnabled);
    console.log('Has permission:', this.hasPermission());
    console.log('Is enabled (overall):', this.isEnabled());
    console.log('Current status:', this.getStatus());
    console.log('Document has focus:', document.hasFocus());
    console.log('===============================');
    
    // Try to send a test notification
    if (this.isEnabled()) {
      console.log('Attempting to send test notification...');
      try {
        const testNotification = new Notification('🔔 Test Notification', {
          body: 'If you see this, notifications are working!',
          icon: '/assets/icons/notification-icon.svg',
          tag: 'test-notification',
          requireInteraction: false,
        });
        
        testNotification.onclick = () => {
          console.log('Test notification clicked!');
          testNotification.close();
        };
        
        console.log('Test notification created successfully');
        
        setTimeout(() => {
          testNotification.close();
          console.log('Test notification auto-closed');
        }, 5000);
      } catch (error) {
        console.error('Failed to create test notification:', error);
      }
    } else {
      console.log('Cannot send test notification - notifications not enabled or permission denied');
    }
  }
}

// Export singleton instance
const notificationService = new NotificationService();

// Make it available globally for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).notificationService = notificationService;
  console.log('Notification service available as window.notificationService');
  console.log('Run window.notificationService.debug() to check status');
}

export default notificationService;