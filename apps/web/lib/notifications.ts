class NotificationService {
  private readonly STORAGE_KEY = 'transcribe_notifications_enabled';
  private notificationsEnabled: boolean = false;

  constructor() {
    // Check if browser supports notifications
    if (this.isSupported()) {
      // Load saved preference
      this.notificationsEnabled = localStorage.getItem(this.STORAGE_KEY) === 'true';
    }
  }

  /**
   * Check if browser supports notifications
   */
  isSupported(): boolean {
    return 'Notification' in window;
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
    return this.isSupported() && Notification.permission === 'granted';
  }

  /**
   * Check if permission was denied
   */
  isDenied(): boolean {
    return this.isSupported() && Notification.permission === 'denied';
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
        localStorage.setItem(this.STORAGE_KEY, 'true');
        
        // Send test notification
        this.sendNotification({
          title: 'Notifications enabled!',
          body: 'You\'ll be notified when your transcriptions are ready.',
          icon: '/assets/icons/notification-icon.png',
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
    localStorage.setItem(this.STORAGE_KEY, 'false');
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
        icon: options.icon || '/assets/icons/notification-icon.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        timestamp: Date.now(),
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
  sendTranscriptionComplete(fileName: string, transcriptionId: string): void {
    this.sendNotification({
      title: '✅ Transcription complete!',
      body: `Your transcription for "${fileName}" is ready to view.`,
      tag: `transcription-${transcriptionId}`,
      data: { transcriptionId },
      requireInteraction: false,
    });
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
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;