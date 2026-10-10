export type MessageStatus = 'pending' | 'processing' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled';

export type MessageCategory = 'absence' | 'academic_note' | 'alert' | 'announcement' | 'custom';

export type MessagePriority = 'normal' | 'high' | 'urgent';

export interface OutboxMessage {
  id: string;
  recipient_name: string;
  recipient_phone: string;
  student_name?: string;
  student_id?: string;
  category: MessageCategory;
  template_id?: string;
  variables: Record<string, string>;
  message_body: string;
  status: MessageStatus;
  priority: MessagePriority;
  scheduled_at: string;
  sent_at?: string | null;
  delivered_at?: string | null;
  retry_count: number;
  max_retries: number;
  failure_reason?: string | null;
  driver_message_id?: string | null;
  gateway_type: 'direct_socket' | 'meta_cloud' | 'local_agent';
  source?: string;
  channel_id?: string;
  raw_payload?: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  category: MessageCategory;
  content: string;
  description: string;
  variables: string[]; // e.g. ['student_name', 'class', 'date', 'guardian_name']
  sample_data: Record<string, string>;
  is_official: boolean;
  updated_at: string;
}

export interface Recipient {
  id: string;
  student_name: string;
  student_id: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_relation: 'أب' | 'أم' | 'ولي أمر';
  grade_class: string;
  notes?: string;
}

export interface DeliveryLog {
  id: string;
  message_id: string;
  recipient_phone: string;
  recipient_name: string;
  event: 'ENQUEUED' | 'DISPATCHING' | 'SENT_TO_GATEWAY' | 'DELIVERED_TO_PHONE' | 'READ_BY_USER' | 'DISPATCH_FAILED' | 'RETRY_SCHEDULED';
  status: MessageStatus;
  timestamp: string;
  driver_code?: string;
  details: string;
  gateway_payload?: string;
}

export interface GatewayConfig {
  driver_type: 'direct_socket' | 'meta_cloud' | 'local_agent';
  driver_name: string;
  session_status: 'connected' | 'connecting' | 'disconnected' | 'qr_needed';
  phone_number: string;
  battery_level: number;
  anti_ban_delay_min: number; // seconds
  anti_ban_delay_max: number; // seconds
  max_messages_per_hour: number;
  auto_dispatch_enabled: boolean;
  dispatch_speed_seconds: number;
  webhook_endpoint?: string;
  api_key?: string;
  last_heartbeat?: string;
}
