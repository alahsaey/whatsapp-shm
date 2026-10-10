export const POSTGRESQL_DDL = `-- ==========================================================
-- قاعدة بيانات: مراسلات واتساب (WhatsApp Messaging System)
-- الإصدار: 2.0 (PostgreSQL / Supabase / Neon / Cloud SQL)
-- الغرض: إدارة طابور الإرسال (Queue & Outbox)، تتبع حالات التسليم،
--       إدارة القوالب والمتغيرات، والتكامل مع محرك الاتصال المباشر.
-- ==========================================================

-- 1. أنواع الحالات والتصنيفات (Enums)
CREATE TYPE message_status_enum AS ENUM (
    'pending',      -- معلقة في الطابور
    'processing',   -- قيد الاستلام بواسطة محرك الاتصال
    'sent',         -- تم الإرسال من السيرفر
    'delivered',    -- استلام إشعار الوصول لهاتف المستلم
    'read',         -- تمت القراءة (العلامة الزرقاء)
    'failed',       -- فشل الإرسال بعد استنفاد المحاولات
    'cancelled'     -- ملغاة يدوياً
);

CREATE TYPE message_priority_enum AS ENUM (
    'normal',       -- أولوية عادية (تعاميم وإعلانات)
    'high',         -- أولوية مرتفعة (غياب يومي وملاحظات هامة)
    'urgent'        -- أولوية قصوى (طوارئ واستدعاء فوري)
);

CREATE TYPE message_category_enum AS ENUM (
    'absence',          -- إشعارات الغياب
    'academic_note',    -- ملاحظات سلوكية ودراسية
    'alert',            -- تنبيهات واستدعاءات
    'announcement',     -- تعاميم وجداول
    'custom'            -- رسائل مخصصة
);

-- 2. جدول قوالب الرسائل والمتغيرات (whatsapp_templates)
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category message_category_enum NOT NULL DEFAULT 'custom',
    description TEXT,
    content TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['student_name', 'date', 'school_name']
    sample_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_official BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. جدول المستلمين والطلاب (whatsapp_recipients)
CREATE TABLE IF NOT EXISTS whatsapp_recipients (
    id VARCHAR(50) PRIMARY KEY,
    student_name VARCHAR(120) NOT NULL,
    student_id VARCHAR(30) UNIQUE,
    guardian_name VARCHAR(120) NOT NULL,
    guardian_phone VARCHAR(20) NOT NULL, -- بالصيغة الدولية مثل +966501234567
    guardian_relation VARCHAR(30) DEFAULT 'ولي أمر',
    grade_class VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. جدول طابور الإرسال الرئيسي (whatsapp_outbox)
CREATE TABLE IF NOT EXISTS whatsapp_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(120) NOT NULL,
    student_name VARCHAR(120),
    student_id VARCHAR(30),
    category message_category_enum NOT NULL DEFAULT 'custom',
    template_id VARCHAR(50) REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
    variables JSONB NOT NULL DEFAULT '{}'::jsonb,
    message_body TEXT NOT NULL,
    status message_status_enum NOT NULL DEFAULT 'pending',
    priority message_priority_enum NOT NULL DEFAULT 'normal',
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    failure_reason TEXT,
    driver_message_id VARCHAR(100), -- معرف الرسالة الصادر من محرك واتساب
    gateway_type VARCHAR(50) DEFAULT 'direct_socket',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- فهرس فائق السرعة لسحب الرسائل المعلقة بأولوية عاجلة أولاً
CREATE INDEX idx_whatsapp_outbox_queue 
ON whatsapp_outbox (status, priority DESC, scheduled_at ASC)
WHERE status = 'pending';

CREATE INDEX idx_whatsapp_outbox_phone ON whatsapp_outbox(recipient_phone);
CREATE INDEX idx_whatsapp_outbox_created_at ON whatsapp_outbox(created_at DESC);

-- 5. جدول سجل الحالة وسجلات التدقيق (whatsapp_delivery_logs)
CREATE TABLE IF NOT EXISTS whatsapp_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES whatsapp_outbox(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(120),
    event VARCHAR(50) NOT NULL, -- 'ENQUEUED', 'DISPATCHING', 'ACK_RECEIVED', 'FAILED'
    status message_status_enum NOT NULL,
    driver_code VARCHAR(50),
    details TEXT,
    gateway_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_delivery_logs_message_id ON whatsapp_delivery_logs(message_id);
CREATE INDEX idx_delivery_logs_created_at ON whatsapp_delivery_logs(created_at DESC);

-- 6. جدول إعدادات محرك الاتصال المباشر (whatsapp_gateway_config)
CREATE TABLE IF NOT EXISTS whatsapp_gateway_config (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default_engine',
    driver_type VARCHAR(50) NOT NULL DEFAULT 'direct_socket', -- 'direct_socket' | 'meta_cloud'
    driver_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    anti_ban_delay_min INT DEFAULT 3, -- بالثواني
    anti_ban_delay_max INT DEFAULT 7,
    max_messages_per_hour INT DEFAULT 250,
    is_active BOOLEAN DEFAULT TRUE,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

export const FIRESTORE_SCHEMA = `{
  "rules_version": "2",
  "service": "cloud.firestore",
  "collections": {
    "whatsapp_outbox": {
      "description": "طابور الإرسال والرسائل المجدولة والتلقائية",
      "fields": {
        "id": "string (docId)",
        "recipient_phone": "string (e.g. '+966501234567')",
        "recipient_name": "string",
        "student_name": "string",
        "category": "string ('absence' | 'academic_note' | 'alert' | 'announcement')",
        "message_body": "string",
        "status": "string ('pending' | 'processing' | 'sent' | 'delivered' | 'failed')",
        "priority": "string ('normal' | 'high' | 'urgent')",
        "scheduled_at": "timestamp",
        "sent_at": "timestamp | null",
        "delivered_at": "timestamp | null",
        "retry_count": "number",
        "failure_reason": "string | null",
        "driver_message_id": "string | null"
      },
      "indexes": [
        {"fields": [{"field": "status", "mode": "ASC"}, {"field": "priority", "mode": "DESC"}, {"field": "scheduled_at", "mode": "ASC"}]}
      ]
    },
    "whatsapp_templates": {
      "description": "قوالب الرسائل والمتغيرات الديناميكية",
      "fields": {
        "title": "string",
        "category": "string",
        "content": "string",
        "variables": "array<string>",
        "sample_data": "map"
      }
    },
    "whatsapp_delivery_logs": {
      "description": "سجل الأحداث وتتبع استجابات محرك الاتصال المباشر",
      "fields": {
        "message_id": "string",
        "event": "string",
        "status": "string",
        "details": "string",
        "timestamp": "timestamp"
      }
    }
  }
}`;

export const SAMPLE_QUERIES = [
  {
    title: 'سحب الدفعة التالية من طابور الإرسال (Queue Polling)',
    description: 'يستخدمه محرك الإرسال المباشر لجلب 10 رسائل جاهزة مرتبة حسب الأولوية وتاريخ الجدولة',
    sql: `SELECT id, recipient_phone, message_body, priority, retry_count
FROM whatsapp_outbox
WHERE status = 'pending' 
  AND scheduled_at <= CURRENT_TIMESTAMP
ORDER BY 
  CASE priority 
    WHEN 'urgent' THEN 1 
    WHEN 'high' THEN 2 
    ELSE 3 
  END, 
  scheduled_at ASC
LIMIT 10
FOR UPDATE SKIP LOCKED;`
  },
  {
    title: 'تحديث حالة الرسالة بعد استلام إشعار التسليم (Delivery ACK)',
    description: 'يتم تشغيله لحظة وصول Webhook أو Socket ACK من الهاتف المستلم',
    sql: `UPDATE whatsapp_outbox
SET 
  status = 'delivered',
  delivered_at = CURRENT_TIMESTAMP,
  driver_message_id = 'WADRV_ACK_84920'
WHERE id = '7b992f80-0a2b-4fcb-8e10-c4e95d9093bf';

-- تسجيل الحدث في سجل التدقيق
INSERT INTO whatsapp_delivery_logs (message_id, recipient_phone, event, status, details)
VALUES ('7b992f80-0a2b-4fcb-8e10-c4e95d9093bf', '+966501234567', 'DELIVERED_TO_PHONE', 'delivered', 'تم استلام الإشعار بنجاح');`
  },
  {
    title: 'إحصائيات ونسب تسليم رسائل الغياب اليوم (Analytics)',
    description: 'حساب نسبة النجاح، الرسائل المعلقة، والأخطاء لحملة غياب اليوم',
    sql: `SELECT 
  category,
  COUNT(*) AS total_messages,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_count,
  COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
  ROUND(
    (COUNT(*) FILTER (WHERE status IN ('sent', 'delivered'))::decimal / NULLIF(COUNT(*), 0)) * 100, 
    2
  ) AS success_rate_percent
FROM whatsapp_outbox
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY category;`
  }
];
