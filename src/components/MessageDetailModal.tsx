import React from 'react';
import { 
  X, 
  Clock, 
  CheckCheck, 
  AlertCircle, 
  Send, 
  ExternalLink, 
  RefreshCw, 
  Smartphone, 
  User, 
  Calendar, 
  Tag 
} from 'lucide-react';
import { OutboxMessage } from '../types/whatsapp';

interface MessageDetailModalProps {
  message: OutboxMessage | null;
  onClose: () => void;
  onRetry: (id: string) => void;
  onSendNow: (id: string) => void;
}

export const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  message,
  onClose,
  onRetry,
  onSendNow,
}) => {
  if (!message) return null;

  const getStatusBadge = (status: OutboxMessage['status']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            تم التسليم (Delivered - ACK 2)
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded">
            <Send className="w-3.5 h-3.5 text-sky-400" />
            تم الإرسال (Sent - ACK 1)
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            قيد المعالجة في المحرك المباشر
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            فشل الإرسال (Failed)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            معلقة في الطابور (Pending)
          </span>
        );
    }
  };

  const cleanPhone = message.recipient_phone.replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message.message_body)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50 sticky top-0 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">تفاصيل سجل الرسالة في قاعدة البيانات</h3>
              <p className="text-xs font-mono text-slate-400">ID: {message.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Status & Priority Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">الحالة الراهنة:</span>
              {getStatusBadge(message.status)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">الأولوية:</span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                message.priority === 'urgent'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  : message.priority === 'high'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {message.priority === 'urgent' ? 'أولوية قصوى (عاجل)' : message.priority === 'high' ? 'أولوية مرتفعة' : 'أولوية عادية'}
              </span>
            </div>
          </div>

          {/* Recipient & Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800/60 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>المستلم وولي الأمر</span>
              </div>
              <div className="font-semibold text-slate-200 text-sm">{message.recipient_name}</div>
              {message.student_name && (
                <div className="text-xs text-slate-400">
                  الطالب: <span className="text-slate-300">{message.student_name}</span>
                </div>
              )}
              <div className="text-xs font-mono text-emerald-400 dir-ltr text-right">
                {message.recipient_phone}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800/60 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>التصنيف ومحرك الإرسال</span>
              </div>
              <div className="text-sm font-semibold text-slate-200">
                {message.category === 'absence' ? 'إشعار غياب' : message.category === 'academic_note' ? 'ملاحظة دراسية' : message.category === 'alert' ? 'تنبيه واستدعاء' : 'تعميم عام'}
              </div>
              <div className="text-xs text-slate-400">
                نوع المحرك: <span className="font-mono text-slate-300">Direct Baileys Socket</span>
              </div>
              {message.driver_message_id && (
                <div className="text-xs font-mono text-slate-400 truncate">
                  معرف المحرك: {message.driver_message_id}
                </div>
              )}
            </div>
          </div>

          {/* Timestamps Lifecycle */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2.5">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>دورة حياة الرسالة وسجل التوقيت (Timestamps):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">وقت الجدولة (Scheduled):</span>
                <span className="font-mono text-slate-200">{message.scheduled_at}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">وقت الخروج للمحرك (Sent):</span>
                <span className="font-mono text-slate-200">{message.sent_at || '—'}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">استلام إشعار الهاتف (Delivered):</span>
                <span className="font-mono text-emerald-400">{message.delivered_at || '—'}</span>
              </div>
            </div>
          </div>

          {/* Failure Info if any */}
          {message.failure_reason && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-400">
                <AlertCircle className="w-4 h-4" />
                <span>سبب الفشل المسجل من محرك الاتصال:</span>
              </div>
              <p className="font-mono text-rose-200">{message.failure_reason}</p>
              <div className="text-rose-400 text-[11px] pt-1">
                محاولات الإعادة: {message.retry_count} من {message.max_retries}
              </div>
            </div>
          )}

          {/* Rendered WhatsApp Message Preview */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              نص الرسالة كما يُرسل على تطبيق واتساب:
            </label>
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/40 relative">
              <div className="text-emerald-500 text-xs font-semibold mb-2 flex items-center gap-1">
                <span>معاينة فقاعة واتساب الرسمية</span>
              </div>
              <div className="whitespace-pre-line text-sm text-slate-200 bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-3.5 leading-relaxed font-sans shadow-sm">
                {message.message_body}
                <div className="mt-2 text-left text-[11px] text-emerald-400/80 font-mono">
                  {message.sent_at ? message.sent_at.split(' ')[1] : '08:00 AM'} ✓✓
                </div>
              </div>
            </div>
          </div>

          {/* Raw DB Record JSON */}
          <details className="group border border-slate-800 rounded-xl bg-slate-950/40 p-3">
            <summary className="text-xs font-mono text-slate-400 cursor-pointer hover:text-slate-200 flex items-center justify-between">
              <span>عرض السجل الخام في جدول whatsapp_outbox (JSON):</span>
              <span className="text-[11px] text-indigo-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <pre className="mt-3 p-3 rounded bg-slate-950 text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
              {JSON.stringify(message, null, 2)}
            </pre>
          </details>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-t border-slate-800 bg-slate-900/60">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-emerald-400 transition-colors p-2 rounded hover:bg-slate-800"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>فتح محادثة واتساب ويب مباشرة (wa.me)</span>
          </a>

          <div className="flex items-center gap-2">
            {message.status === 'failed' && (
              <button
                onClick={() => {
                  onRetry(message.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة الإرسال للطابور</span>
              </button>
            )}

            {message.status === 'pending' && (
              <button
                onClick={() => {
                  onSendNow(message.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال فوري الآن عبر المحرك</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
