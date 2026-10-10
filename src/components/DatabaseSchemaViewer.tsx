import React, { useState } from 'react';
import { 
  Database, 
  Code, 
  Copy, 
  CheckCheck, 
  Download, 
  Table, 
  Layers, 
  FileText, 
  Send, 
  Activity, 
  Cpu, 
  Sparkles, 
  Flame 
} from 'lucide-react';
import { POSTGRESQL_DDL, FIRESTORE_SCHEMA, SAMPLE_QUERIES } from '../data/schemaSql';

export const DatabaseSchemaViewer: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'postgres' | 'firestore' | 'queries'>('postgres');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tablesSummary = [
    {
      name: 'whatsapp_outbox',
      title: 'طابور الإرسال والرسائل',
      icon: Send,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      desc: 'الوعاء الرئيسي لتجميع الرسائل المجدولة والتلقائية (غياب، ملاحظات، تنبيهات) قبل الإرسال.',
      columns: [
        { name: 'id', type: 'UUID PRIMARY KEY', note: 'المعرف الفريد' },
        { name: 'recipient_phone', type: 'VARCHAR(20)', note: 'رقم هاتف ولي الأمر الدولي' },
        { name: 'recipient_name', type: 'VARCHAR(120)', note: 'اسم المستلم' },
        { name: 'student_name', type: 'VARCHAR(120)', note: 'اسم الطالب المرتبط' },
        { name: 'category', type: 'ENUM', note: 'absence | note | alert | announcement' },
        { name: 'template_id', type: 'VARCHAR(50) FK', note: 'معرف القالب المستخدم' },
        { name: 'message_body', type: 'TEXT', note: 'نص الرسالة النهائي بعد دمج المتغيرات' },
        { name: 'status', type: 'ENUM', note: 'pending | processing | sent | delivered | failed' },
        { name: 'priority', type: 'ENUM', note: 'urgent | high | normal' },
        { name: 'scheduled_at', type: 'TIMESTAMPTZ', note: 'موعد الجدولة' },
        { name: 'sent_at', type: 'TIMESTAMPTZ', note: 'وقت الخروج للمحرك' },
        { name: 'delivered_at', type: 'TIMESTAMPTZ', note: 'وقت استلام إشعار التسليم' },
        { name: 'retry_count', type: 'INT', note: 'عدد المحاولات المنفذة' },
        { name: 'driver_message_id', type: 'VARCHAR(100)', note: 'معرف الرسالة من محرك واتساب' },
      ],
      indexes: [
        'CREATE INDEX ON whatsapp_outbox (status, priority DESC, scheduled_at ASC) WHERE status = "pending"',
        'CREATE INDEX ON whatsapp_outbox (recipient_phone)',
      ]
    },
    {
      name: 'whatsapp_templates',
      title: 'إدارة القوالب والمتغيرات',
      icon: FileText,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      desc: 'تجهيز نصوص الرسائل الرسمية وقواعد المتغيرات الديناميكية لتوليد الرسائل الموحدة بدقة.',
      columns: [
        { name: 'id', type: 'VARCHAR(50) PRIMARY KEY', note: 'معرف القالب' },
        { name: 'title', type: 'VARCHAR(150)', note: 'عنوان القالب' },
        { name: 'category', type: 'ENUM', note: 'تصنيف القالب' },
        { name: 'content', type: 'TEXT', note: 'النص الأصلي مع وسوم {{المتغير}}' },
        { name: 'variables', type: 'JSONB', note: 'مصفوفة أسماء المتغيرات المطلوبة' },
        { name: 'sample_data', type: 'JSONB', note: 'قيم افتراضية للمعاينة' },
        { name: 'is_official', type: 'BOOLEAN', note: 'هل القالب رسمي ومعتمد' },
      ],
      indexes: ['CREATE INDEX ON whatsapp_templates(category)']
    },
    {
      name: 'whatsapp_delivery_logs',
      title: 'سجل الحالة والتدقيق',
      icon: Activity,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10 border-sky-500/20',
      desc: 'التتبع الدقيق لكل حدث واستجابة من المحرك المباشر وتوثيق استلام إشعارات الهاتف أو أسباب الفشل.',
      columns: [
        { name: 'id', type: 'UUID PRIMARY KEY', note: 'معرف الحدث' },
        { name: 'message_id', type: 'UUID FK', note: 'مرجع الرسالة في Outbox' },
        { name: 'recipient_phone', type: 'VARCHAR(20)', note: 'الرقم المستهدف' },
        { name: 'event', type: 'VARCHAR(50)', note: 'ENQUEUED | SENT | DELIVERED | FAILED' },
        { name: 'status', type: 'ENUM', note: 'حالة الرسالة في تلك اللحظة' },
        { name: 'driver_code', type: 'VARCHAR(50)', note: 'كود المحرك ACK_1 / ACK_2 / ERR' },
        { name: 'details', type: 'TEXT', note: 'شرح تفصيلي للحدث' },
        { name: 'gateway_payload', type: 'JSONB', note: 'الحزمة البرمجية الخام' },
      ],
      indexes: [
        'CREATE INDEX ON whatsapp_delivery_logs(message_id)',
        'CREATE INDEX ON whatsapp_delivery_logs(created_at DESC)',
      ]
    },
    {
      name: 'whatsapp_recipients',
      title: 'سجل المستلمين والطلاب',
      icon: Database,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      desc: 'قاعدة بيانات الطلاب وأولياء أمورهم وفصولهم الدراسية لربط الإشعارات بالأرقام المعتمدة.',
      columns: [
        { name: 'id', type: 'VARCHAR(50) PRIMARY KEY', note: 'معرف المستلم' },
        { name: 'student_name', type: 'VARCHAR(120)', note: 'اسم الطالب الكامل' },
        { name: 'student_id', type: 'VARCHAR(30) UNIQUE', note: 'الرقم الأكاديمي' },
        { name: 'guardian_name', type: 'VARCHAR(120)', note: 'اسم ولي الأمر' },
        { name: 'guardian_phone', type: 'VARCHAR(20)', note: 'رقم هاتف الواتساب المعتمد' },
        { name: 'guardian_relation', type: 'VARCHAR(30)', note: 'صلة القرابة (أب، أم...)' },
        { name: 'grade_class', type: 'VARCHAR(50)', note: 'المرحلة والصف الدراسي' },
      ],
      indexes: ['CREATE INDEX ON whatsapp_recipients(guardian_phone)']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Philosophical Answer to "What is the Database role?" */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-900/40 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base sm:text-lg font-bold text-slate-100">
            ما هو دور قاعدة البيانات "مراسلات واتساب"؟
          </h2>
        </div>
        
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
          قاعدة البيانات وحدها (سواء <span className="text-emerald-400 font-semibold font-mono">PostgreSQL</span> أو <span className="text-amber-400 font-semibold font-mono">Firestore</span>) هي <strong className="text-white">وعاء تخزين ومنظم ذكي</strong>، تتلخص أدوارها الجوهرية في ثلاثة أعمدة رئيسية:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-900/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Send className="w-4 h-4" />
              <span>1. طابور الإرسال (Outbox & Queue)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              تجميع الرسائل المجدولة والتلقائية (مثل إشعارات الغياب اليومي، الملاحظات الأكاديمية، والتنبيهات العاجلة)، وفرزها حسب الأولويات لتكون جاهزة لسحبها بواسطة المحرك.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-sky-900/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
              <Activity className="w-4 h-4" />
              <span>2. سجل الحالة (Delivery Status)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              تتبع دورة حياة كل رسالة (معلقة Pending، قيد المعالجة Processing، تم الإرسال Sent، تم التسليم Delivered، أو فشل Failed) مع توثيق التوقيت ومعرفات المحرك بدقة.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-indigo-900/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
              <FileText className="w-4 h-4" />
              <span>3. إدارة القوالب والمتغيرات</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              تجهيز نصوص الرسائل والبيانات الرسمية ودمج الحقول الديناميكية (<code className="text-indigo-300 font-mono">{'{{student_name}}'}</code>، <code className="text-indigo-300 font-mono">{'{{date}}'}</code>) تلقائياً قبل ضخها للطابور.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-300 flex items-start gap-2.5">
          <Cpu className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <p className="leading-relaxed">
            <strong>ملاحظة تقنية حاسمة:</strong> قاعدة البيانات لا تتصل بشبكة واتساب بمفردها؛ بل تحتاج إلى <strong>محرك اتصال مباشر (Driver/Gateway)</strong> مثل مكتبة Baileys أو Meta Direct Cloud API، وهو ما يضمن سرعة الاستجابة وأمان البيانات بدلاً من الاعتماد على شركات ومواقع وسيطة.
          </p>
        </div>
      </div>

      {/* Database Tables Breakdown */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Table className="w-4 h-4 text-emerald-400" />
          <span>جداول ومجموعات قاعدة البيانات (Schema Architecture)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tablesSummary.map(t => {
            const Icon = t.icon;
            return (
              <div key={t.name} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.bgColor} ${t.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-slate-100 text-xs">{t.name}</div>
                      <div className="text-[11px] text-slate-400">{t.title}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                    {t.columns.length} أعمدة
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {t.desc}
                </p>

                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400">أبرز الحقول:</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                    {t.columns.slice(0, 6).map(c => (
                      <div key={c.name} className="flex items-center justify-between p-1 rounded bg-slate-950/60 border border-slate-800/80 px-2">
                        <span className="text-slate-300">{c.name}</span>
                        <span className="text-emerald-400 text-[10px]">{c.type.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {t.indexes && (
                  <div className="pt-1">
                    <span className="text-[10px] font-mono text-slate-500 block truncate" title={t.indexes[0]}>
                      ⚡ {t.indexes[0]}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabbed Code & Queries Studio */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden space-y-0">
        {/* Code Tabs Header */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab('postgres')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeCodeTab === 'postgres'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>مخطط PostgreSQL DDL الكامل</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('firestore')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeCodeTab === 'firestore'
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>مخطط Firestore Blueprint</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('queries')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeCodeTab === 'queries'
                  ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>استعلامات تشغيل الطابور والتحليل</span>
            </button>
          </div>

          {/* Download & Copy */}
          <div className="flex items-center gap-2">
            {activeCodeTab === 'postgres' && (
              <>
                <button
                  onClick={() => copyToClipboard(POSTGRESQL_DDL, 'ddl_pg')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5"
                >
                  {copiedKey === 'ddl_pg' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'ddl_pg' ? 'تم النسخ' : 'نسخ SQL'}</span>
                </button>
                <button
                  onClick={() => downloadFile(POSTGRESQL_DDL, 'whatsapp_correspondence_schema.sql', 'text/sql')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل .sql</span>
                </button>
              </>
            )}

            {activeCodeTab === 'firestore' && (
              <>
                <button
                  onClick={() => copyToClipboard(FIRESTORE_SCHEMA, 'ddl_fs')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5"
                >
                  {copiedKey === 'ddl_fs' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'ddl_fs' ? 'تم النسخ' : 'نسخ JSON'}</span>
                </button>
                <button
                  onClick={() => downloadFile(FIRESTORE_SCHEMA, 'whatsapp_firestore_blueprint.json', 'application/json')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل .json</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeCodeTab === 'postgres' && (
            <pre className="p-4 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto border border-slate-800 dir-ltr text-left max-h-[480px]">
              {POSTGRESQL_DDL}
            </pre>
          )}

          {activeCodeTab === 'firestore' && (
            <pre className="p-4 rounded-xl bg-slate-950 text-amber-300 font-mono text-xs overflow-x-auto border border-slate-800 dir-ltr text-left max-h-[480px]">
              {FIRESTORE_SCHEMA}
            </pre>
          )}

          {activeCodeTab === 'queries' && (
            <div className="space-y-4">
              {SAMPLE_QUERIES.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-100 text-xs">{q.title}</div>
                      <div className="text-[11px] text-slate-400">{q.description}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(q.sql, `query_${idx}`)}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 hover:border-slate-500"
                    >
                      {copiedKey === `query_${idx}` ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === `query_${idx}` ? 'تم النسخ' : 'نسخ الاستعلام'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-900/80 text-sky-300 font-mono text-xs overflow-x-auto border border-slate-800/80 dir-ltr text-left">
                    {q.sql}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
