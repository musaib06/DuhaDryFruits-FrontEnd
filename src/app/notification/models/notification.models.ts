/**
 * Notification Models
 * TypeScript interfaces for notification data
 */

export interface NotificationPreferences {
  id: number;
  customerId: number;
  whatsappNotifications: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingNotifications: boolean;
  orderUpdates: boolean;
  promotionalOffers: boolean;
  deliveryUpdates: boolean;
  cartReminders: boolean;
  consentGivenAt: Date;
  consentIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationLog {
  id: number;
  customerId: number;
  orderId?: number;
  type: 'whatsapp' | 'push' | 'email' | 'sms';
  channel: string;
  status: 'pending' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled';
  templateName?: string;
  templateVariables?: Record<string, any>;
  messageContent?: string;
  phoneNumber?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  createdAt: Date;
}

export interface NotificationStats {
  today: {
    sent: number;
    delivered: number;
    failed: number;
  };
  campaigns: {
    active: number;
    total: number;
    scheduled: number;
  };
  queues: Array<{
    name: string;
    waiting: number;
    active: number;
    failed: number;
  }>;
}

export interface Campaign {
  id: number;
  name: string;
  description?: string;
  type: 'whatsapp' | 'push' | 'email' | 'sms' | 'mixed';
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed';
  content: {
    title?: string;
    body?: string;
    templateName?: string;
    mediaUrl?: string;
    buttonText?: string;
    buttonUrl?: string;
  };
  segment: {
    type: string;
    filters?: Record<string, any>;
  };
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  readCount: number;
  scheduledAt?: Date;
  createdAt: Date;
}

export interface WhatsAppTemplate {
  id: number;
  name: string;
  templateId: string;
  language: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION' | 'ORDER_UPDATE' | 'CUSTOM';
  status: 'approved' | 'pending' | 'rejected' | 'disabled';
  description?: string;
  variables: string[];
  bodyText: string;
  headerText?: string;
  footerText?: string;
  isActive: boolean;
}

export interface PushSubscription {
  token: string;
  deviceType: 'web' | 'android' | 'ios';
  browser?: string;
  os?: string;
  deviceId?: string;
}
