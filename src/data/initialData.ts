import { MessageTemplate, Recipient, OutboxMessage, GatewayConfig, DeliveryLog } from '../types/whatsapp';

export const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl_absence',
    title: 'إشعار غياب طالب (تلقائي)',
    category: 'absence',
    description: 'يُرسل لولي الأمر في حال تسجيل غياب الطالب في الطابور الصباحي أو الحصص',
    content: 'المكرم ولي أمر الطالب {{student_name}} المحترم،\nنفيدكم بغياب نجلكم عن مقاعد الدراسة اليوم {{date}} في الصف {{grade_class}} دون عذر مسبق.\nنرجو تزويد إدارة المدرسة بمبرر الغياب عبر الرابط أو مراجعة وكيل شؤون الطلاب.\nشاكرين حرصكم ومتابعتكم.\nإدارة مدرسة {{school_name}}',
    variables: ['student_name', 'date', 'grade_class', 'school_name'],
    sample_data: {
      student_name: 'عبدالله محمد السالم',
      date: 'اليوم الأربعاء',
      grade_class: 'الثاني ثانوي / أ',
      school_name: 'الأندلس الثانوية'
    },
    is_official: true,
    updated_at: '2026-10-06'
  },
  {
    id: 'tpl_academic_note',
    title: 'ملاحظة سلوكية وأكاديمية',
    category: 'academic_note',
    description: 'تنبيه ولي الأمر بشأن التحصيل الدراسي أو السلوك الإيجابي/المخالف',
    content: 'السلام عليكم ورحمة الله، ولي أمر الطالب {{student_name}}،\nنود إحاطتكم علماً بملاحظة في مادة {{subject}}:\n"{{note_content}}"\nنأمل التكرم بمتابعة الطالب لتعزيز مستواه الدراسي ومساندة جهود معلم المادة.\nمع خالص التقدير، المرشد الطلابي - {{school_name}}',
    variables: ['student_name', 'subject', 'note_content', 'school_name'],
    sample_data: {
      student_name: 'عمر خالد المنصور',
      subject: 'الرياضيات المتقدمة',
      note_content: 'لوحظ تحسن ملحوظ في المشاركة الصفية وحل الواجبات الأخيرة.',
      school_name: 'ثانوية المجد'
    },
    is_official: true,
    updated_at: '2026-10-05'
  },
  {
    id: 'tpl_urgent_alert',
    title: 'تنبيه عاجل واستدعاء ولي أمر',
    category: 'alert',
    description: 'إشعار ذو أولوية قصوى لحالات الطوارئ أو مراجعة إدارة المدرسة',
    content: 'تنبيه عاجل وهام: ولي أمر الطالب {{student_name}}،\nنرجو التكرم بالحضور إلى مقر إدارة المدرسة غداً {{date}} الساعة {{time}} للأهمية القصوى، بخصوص {{topic}}.\nشاكرين سرعة تجاوبكم واهتمامكم.\nإدارة المدرسة: {{school_name}}',
    variables: ['student_name', 'date', 'time', 'topic', 'school_name'],
    sample_data: {
      student_name: 'فهد إبراهيم الدوسري',
      date: 'الخميس 08 أكتوبر',
      time: '09:30 صباحاً',
      topic: 'مراجعة الخطة العلاجية والغياب المتكرر',
      school_name: 'ثانوية الأندلس'
    },
    is_official: true,
    updated_at: '2026-10-04'
  },
  {
    id: 'tpl_announcement',
    title: 'تعميم جدول الاختبارات والفعاليات',
    category: 'announcement',
    description: 'رسالة جماعية مجدولة لأولياء الأمور بشأن المواعيد الرسمية',
    content: 'أولياء الأمور الكرام،\nنلفت عنايتكم إلى بدء {{event_name}} اعتباراً من {{date}}.\nيرجى حث أبنائنا وبناتنا على الاستعداد والالتزام بالحضور في الموعد المحدد {{time}}.\nللاطلاع على الجدول الكامل يرجى زيارة الرابط التالي:\n{{link}}\nتمنياتنا لجميع الطلاب بالتوفيق والنجاح.',
    variables: ['event_name', 'date', 'time', 'link'],
    sample_data: {
      event_name: 'اختبارات منتصف الفصل الدراسي الأول',
      date: 'الأحد القادم',
      time: 'الساعة 7:00 صباحاً',
      link: 'https://school.edu.sa/exams-q1'
    },
    is_official: true,
    updated_at: '2026-10-03'
  }
];

export const INITIAL_RECIPIENTS: Recipient[] = [
  {
    id: 'rec_1',
    student_name: 'عبدالله محمد السالم',
    student_id: '4410982',
    guardian_name: 'محمد عبدالله السالم',
    guardian_phone: '+966501234567',
    guardian_relation: 'أب',
    grade_class: 'الثاني ثانوي / أ',
    notes: 'يفضل التواصل الصباحي'
  },
  {
    id: 'rec_2',
    student_name: 'عمر خالد المنصور',
    student_id: '4410853',
    guardian_name: 'خالد عمر المنصور',
    guardian_phone: '+966559876543',
    guardian_relation: 'أب',
    grade_class: 'الثاني ثانوي / ب',
  },
  {
    id: 'rec_3',
    student_name: 'فهد إبراهيم الدوسري',
    student_id: '4411204',
    guardian_name: 'إبراهيم فهد الدوسري',
    guardian_phone: '+966543210987',
    guardian_relation: 'ولي أمر',
    grade_class: 'الأول ثانوي / ج',
    notes: 'حالة متابعة سلوكية'
  },
  {
    id: 'rec_4',
    student_name: 'سارة عبدالعزيز القحطاني',
    student_id: '4412390',
    guardian_name: 'نورة عبدالعزيز',
    guardian_phone: '+966567891234',
    guardian_relation: 'أم',
    grade_class: 'الثالث ثانوي / علمي',
  },
  {
    id: 'rec_5',
    student_name: 'سلطان بدر المطيري',
    student_id: '4413110',
    guardian_name: 'بدر سلطان المطيري',
    guardian_phone: '+966505544332',
    guardian_relation: 'أب',
    grade_class: 'الأول ثانوي / أ',
  },
  {
    id: 'rec_6',
    student_name: 'ريان أحمد الغامدي',
    student_id: '4414022',
    guardian_name: 'أحمد سعيد الغامدي',
    guardian_phone: '+966533221100',
    guardian_relation: 'أب',
    grade_class: 'الثاني ثانوي / ج',
  }
];

export const INITIAL_MESSAGES: OutboxMessage[] = [
  {
    id: 'msg_101',
    recipient_name: 'محمد عبدالله السالم',
    recipient_phone: '+966501234567',
    student_name: 'عبدالله محمد السالم',
    student_id: '4410982',
    category: 'absence',
    template_id: 'tpl_absence',
    variables: {
      student_name: 'عبدالله محمد السالم',
      date: 'اليوم الأربعاء',
      grade_class: 'الثاني ثانوي / أ',
      school_name: 'الأندلس الثانوية'
    },
    message_body: 'المكرم ولي أمر الطالب عبدالله محمد السالم المحترم،\nنفيدكم بغياب نجلكم عن مقاعد الدراسة اليوم الأربعاء في الصف الثاني ثانوي / أ دون عذر مسبق.\nنرجو تزويد إدارة المدرسة بمبرر الغياب عبر الرابط أو مراجعة وكيل شؤون الطلاب.\nشاكرين حرصكم ومتابعتكم.\nإدارة مدرسة الأندلس الثانوية',
    status: 'delivered',
    priority: 'high',
    scheduled_at: '2026-10-07 07:45:00',
    sent_at: '2026-10-07 07:45:12',
    delivered_at: '2026-10-07 07:45:18',
    retry_count: 0,
    max_retries: 3,
    failure_reason: null,
    driver_message_id: 'WADRV_3928172901_ACK',
    gateway_type: 'direct_socket'
  },
  {
    id: 'msg_102',
    recipient_name: 'خالد عمر المنصور',
    recipient_phone: '+966559876543',
    student_name: 'عمر خالد المنصور',
    student_id: '4410853',
    category: 'academic_note',
    template_id: 'tpl_academic_note',
    variables: {
      student_name: 'عمر خالد المنصور',
      subject: 'الرياضيات المتقدمة',
      note_content: 'لوحظ تحسن ملحوظ في المشاركة الصفية وحل الواجبات الأخيرة.',
      school_name: 'ثانوية المجد'
    },
    message_body: 'السلام عليكم ورحمة الله، ولي أمر الطالب عمر خالد المنصور،\nنود إحاطتكم علماً بملاحظة في مادة الرياضيات المتقدمة:\n"لوحظ تحسن ملحوظ في المشاركة الصفية وحل الواجبات الأخيرة."\nنأمل التكرم بمتابعة الطالب لتعزيز مستواه الدراسي ومساندة جهود معلم المادة.\nمع خالص التقدير، المرشد الطلابي - ثانوية المجد',
    status: 'sent',
    priority: 'normal',
    scheduled_at: '2026-10-07 08:10:00',
    sent_at: '2026-10-07 08:10:04',
    delivered_at: null,
    retry_count: 0,
    max_retries: 3,
    failure_reason: null,
    driver_message_id: 'WADRV_3928172944_SENT',
    gateway_type: 'direct_socket'
  },
  {
    id: 'msg_103',
    recipient_name: 'إبراهيم فهد الدوسري',
    recipient_phone: '+966543210987',
    student_name: 'فهد إبراهيم الدوسري',
    student_id: '4411204',
    category: 'alert',
    template_id: 'tpl_urgent_alert',
    variables: {
      student_name: 'فهد إبراهيم الدوسري',
      date: 'الخميس 08 أكتوبر',
      time: '09:30 صباحاً',
      topic: 'مراجعة الخطة العلاجية والغياب المتكرر',
      school_name: 'ثانوية الأندلس'
    },
    message_body: 'تنبيه عاجل وهام: ولي أمر الطالب فهد إبراهيم الدوسري،\nنرجو التكرم بالحضور إلى مقر إدارة المدرسة غداً الخميس 08 أكتوبر الساعة 09:30 صباحاً للأهمية القصوى، بخصوص مراجعة الخطة العلاجية والغياب المتكرر.\nشاكرين سرعة تجاوبكم واهتمامكم.\nإدارة المدرسة: ثانوية الأندلس',
    status: 'pending',
    priority: 'urgent',
    scheduled_at: '2026-10-07 08:30:00',
    sent_at: null,
    delivered_at: null,
    retry_count: 0,
    max_retries: 3,
    failure_reason: null,
    driver_message_id: null,
    gateway_type: 'direct_socket'
  },
  {
    id: 'msg_104',
    recipient_name: 'نورة عبدالعزيز',
    recipient_phone: '+966567891234',
    student_name: 'سارة عبدالعزيز القحطاني',
    student_id: '4412390',
    category: 'absence',
    template_id: 'tpl_absence',
    variables: {
      student_name: 'سارة عبدالعزيز القحطاني',
      date: 'اليوم الأربعاء',
      grade_class: 'الثالث ثانوي / علمي',
      school_name: 'الأندلس الثانوية'
    },
    message_body: 'المكرم ولي أمر الطالب سارة عبدالعزيز القحطاني المحترم،\nنفيدكم بغياب نجلكم عن مقاعد الدراسة اليوم الأربعاء في الصف الثالث ثانوي / علمي دون عذر مسبق.\nنرجو تزويد إدارة المدرسة بمبرر الغياب عبر الرابط أو مراجعة وكيل شؤون الطلاب.\nشاكرين حرصكم ومتابعتكم.\nإدارة مدرسة الأندلس الثانوية',
    status: 'pending',
    priority: 'high',
    scheduled_at: '2026-10-07 08:35:00',
    sent_at: null,
    delivered_at: null,
    retry_count: 0,
    max_retries: 3,
    failure_reason: null,
    driver_message_id: null,
    gateway_type: 'direct_socket'
  },
  {
    id: 'msg_105',
    recipient_name: 'بدر سلطان المطيري',
    recipient_phone: '+966505544332',
    student_name: 'سلطان بدر المطيري',
    student_id: '4413110',
    category: 'alert',
    template_id: 'tpl_urgent_alert',
    variables: {
      student_name: 'سلطان بدر المطيري',
      date: 'الأحد القادم',
      time: '10:00 صباحاً',
      topic: 'استلام التقرير الطبي ومناقشة جدول الحصص',
      school_name: 'الأندلس الثانوية'
    },
    message_body: 'تنبيه عاجل وهام: ولي أمر الطالب سلطان بدر المطيري،\nنرجو التكرم بالحضور إلى مقر إدارة المدرسة غداً الأحد القادم الساعة 10:00 صباحاً للأهمية القصوى، بخصوص استلام التقرير الطبي ومناقشة جدول الحصص.\nشاكرين سرعة تجاوبكم واهتمامكم.\nإدارة المدرسة: الأندلس الثانوية',
    status: 'failed',
    priority: 'normal',
    scheduled_at: '2026-10-07 08:00:00',
    sent_at: null,
    delivered_at: null,
    retry_count: 3,
    max_retries: 3,
    failure_reason: 'DRIVER_ERROR: Connection timed out after 3 retries (WhatsApp Socket busy)',
    driver_message_id: null,
    gateway_type: 'direct_socket'
  }
];

export const INITIAL_LOGS: DeliveryLog[] = [
  {
    id: 'log_1',
    message_id: 'msg_101',
    recipient_phone: '+966501234567',
    recipient_name: 'محمد عبدالله السالم',
    event: 'DELIVERED_TO_PHONE',
    status: 'delivered',
    timestamp: '2026-10-07 07:45:18',
    driver_code: 'ACK_2',
    details: 'استلام إشعار التسليم المزدوج (Double Check) من هاتف المستلم بنجاح',
    gateway_payload: '{"ack": 2, "id": "WADRV_3928172901_ACK", "status": "DELIVERED", "to": "966501234567@s.whatsapp.net"}'
  },
  {
    id: 'log_2',
    message_id: 'msg_101',
    recipient_phone: '+966501234567',
    recipient_name: 'محمد عبدالله السالم',
    event: 'SENT_TO_GATEWAY',
    status: 'sent',
    timestamp: '2026-10-07 07:45:12',
    driver_code: 'ACK_1',
    details: 'خروج الرسالة من طابور قاعدة البيانات إلى محرك الاتصال المباشر (Direct Baileys Driver)',
    gateway_payload: '{"ack": 1, "id": "WADRV_3928172901_ACK", "status": "SERVER_ACK"}'
  },
  {
    id: 'log_3',
    message_id: 'msg_102',
    recipient_phone: '+966559876543',
    recipient_name: 'خالد عمر المنصور',
    event: 'SENT_TO_GATEWAY',
    status: 'sent',
    timestamp: '2026-10-07 08:10:04',
    driver_code: 'ACK_1',
    details: 'تم ضخ الرسالة إلى محرك البث مع تشغيل فاصل الأمان ضد الحظر (4.2 ثانية)',
    gateway_payload: '{"ack": 1, "id": "WADRV_3928172944_SENT", "status": "PENDING_DELIVERY"}'
  },
  {
    id: 'log_4',
    message_id: 'msg_105',
    recipient_phone: '+966505544332',
    recipient_name: 'بدر سلطان المطيري',
    event: 'DISPATCH_FAILED',
    status: 'failed',
    timestamp: '2026-10-07 08:02:15',
    driver_code: 'ERR_TIMEOUT',
    details: 'تجاوز مهلة الاستجابة بعد 3 محاولات، تم وضع علامة فشل بقاعدة البيانات',
    gateway_payload: '{"error": "SOCKET_TIMEOUT", "retries": 3, "failed_at": "2026-10-07T08:02:15Z"}'
  }
];

export const INITIAL_GATEWAY: GatewayConfig = {
  driver_type: 'direct_socket',
  driver_name: 'محرك الاتصال المباشر (Direct Baileys/Web Socket Engine)',
  session_status: 'connected',
  phone_number: '+966500001234',
  battery_level: 94,
  anti_ban_delay_min: 3,
  anti_ban_delay_max: 7,
  max_messages_per_hour: 250,
  auto_dispatch_enabled: false,
  dispatch_speed_seconds: 4,
  webhook_endpoint: 'https://school-gateway.local:8080/webhook/status',
  api_key: 'wa_sec_live_9a87f2e1c3904b77'
};
