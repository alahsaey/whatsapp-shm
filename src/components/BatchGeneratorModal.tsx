import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  UserCheck, 
  AlertCircle, 
  Calendar, 
  Send, 
  BookOpen, 
  Clock 
} from 'lucide-react';
import { Recipient, MessageTemplate, OutboxMessage } from '../types/whatsapp';

interface BatchGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: Recipient[];
  templates: MessageTemplate[];
  onGenerateBatch: (messages: Array<Omit<OutboxMessage, 'id' | 'status' | 'retry_count' | 'max_retries' | 'scheduled_at' | 'gateway_type'> & Partial<OutboxMessage>>) => void;
}

export const BatchGeneratorModal: React.FC<BatchGeneratorModalProps> = ({
  isOpen,
  onClose,
  recipients,
  templates,
  onGenerateBatch,
}) => {
  const [batchType, setBatchType] = useState<'absence' | 'academic' | 'alert'>('absence');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(
    recipients.slice(0, 3).map(r => r.id)
  );
  const [customNote, setCustomNote] = useState<string>('مراجعة الواجبات وإحضار الكتاب المدرسي');
  const [examDate, setExamDate] = useState<string>('الأحد القادم الساعة 7:30 صباحاً');

  if (!isOpen) return null;

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    if (selectedRecipients.length === 0) {
      alert('يرجى اختيار طالب واحد على الأقل للدفعة');
      return;
    }

    const absenceTemplate = templates.find(t => t.category === 'absence') || templates[0];
    const academicTemplate = templates.find(t => t.category === 'academic_note') || templates[1];
    const alertTemplate = templates.find(t => t.category === 'alert') || templates[2];

    const targetRecs = recipients.filter(r => selectedRecipients.includes(r.id));
    const newMessages: Array<Omit<OutboxMessage, 'id' | 'status' | 'retry_count' | 'max_retries' | 'scheduled_at' | 'gateway_type'> & Partial<OutboxMessage>> = [];

    targetRecs.forEach(r => {
      if (batchType === 'absence') {
        const vars = {
          student_name: r.student_name,
          date: 'اليوم ' + new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()),
          grade_class: r.grade_class,
          school_name: 'ثانوية الأندلس النموذجية'
        };
        let body = absenceTemplate.content;
        Object.entries(vars).forEach(([k, v]) => {
          body = body.replaceAll(`{{${k}}}`, v);
        });

        newMessages.push({
          recipient_name: r.guardian_name,
          recipient_phone: r.guardian_phone,
          student_name: r.student_name,
          student_id: r.student_id,
          category: 'absence',
          template_id: absenceTemplate.id,
          variables: vars,
          message_body: body,
          priority: 'high',
        });
      } else if (batchType === 'academic') {
        const vars = {
          student_name: r.student_name,
          subject: 'الرياضيات واللغة العربية',
          note_content: customNote,
          school_name: 'ثانوية الأندلس النموذجية'
        };
        let body = academicTemplate.content;
        Object.entries(vars).forEach(([k, v]) => {
          body = body.replaceAll(`{{${k}}}`, v);
        });

        newMessages.push({
          recipient_name: r.guardian_name,
          recipient_phone: r.guardian_phone,
          student_name: r.student_name,
          student_id: r.student_id,
          category: 'academic_note',
          template_id: academicTemplate.id,
          variables: vars,
          message_body: body,
          priority: 'normal',
        });
      } else {
        const vars = {
          student_name: r.student_name,
          date: examDate,
          time: '08:30 صباحاً',
          topic: 'استدعاء عاجل ومراجعة الخطة الدراسية الفردية',
          school_name: 'ثانوية الأندلس النموذجية'
        };
        let body = alertTemplate.content;
        Object.entries(vars).forEach(([k, v]) => {
          body = body.replaceAll(`{{${k}}}`, v);
        });

        newMessages.push({
          recipient_name: r.guardian_name,
          recipient_phone: r.guardian_phone,
          student_name: r.student_name,
          student_id: r.student_id,
          category: 'alert',
          template_id: alertTemplate.id,
          variables: vars,
          message_body: body,
          priority: 'urgent',
        });
      }
    });

    onGenerateBatch(newMessages);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60 sticky top-0 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">توليد دفعة رسائل تلقائية في الطابور</h3>
              <p className="text-xs text-slate-400">محاكاة إدراج كشوفات الغياب والملاحظات المجدولة في قاعدة البيانات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Batch Type Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">نوع العملية التلقائية:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBatchType('absence')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  batchType === 'absence'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <UserCheck className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <span className="text-xs">كشف غياب اليوم</span>
              </button>

              <button
                type="button"
                onClick={() => setBatchType('academic')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  batchType === 'academic'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-bold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <BookOpen className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                <span className="text-xs">ملاحظات دراسية</span>
              </button>

              <button
                type="button"
                onClick={() => setBatchType('alert')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  batchType === 'alert'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-300 font-bold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <AlertCircle className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                <span className="text-xs">تنبيه واستدعاء عاجل</span>
              </button>
            </div>
          </div>

          {/* Quick Customization */}
          {batchType === 'academic' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">نص الملاحظة الدراسية:</label>
              <input
                type="text"
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {batchType === 'alert' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">موعد الاستدعاء:</label>
              <input
                type="text"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          {/* Recipients Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                تحديد الطلاب المشمولين بالدفعة ({selectedRecipients.length} تم تحديدهم):
              </label>
              <button
                type="button"
                onClick={() => {
                  if (selectedRecipients.length === recipients.length) {
                    setSelectedRecipients([]);
                  } else {
                    setSelectedRecipients(recipients.map(r => r.id));
                  }
                }}
                className="text-xs text-emerald-400 hover:underline"
              >
                {selectedRecipients.length === recipients.length ? 'إلغاء تحديد الكل' : 'تحديد جميع الطلاب'}
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              {recipients.map(r => {
                const isSelected = selectedRecipients.includes(r.id);
                return (
                  <div
                    key={r.id}
                    onClick={() => toggleRecipient(r.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer border text-xs transition-colors ${
                      isSelected
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-slate-200'
                        : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-semibold text-slate-200">{r.student_name}</span>
                        <span className="text-slate-400 mr-2">[{r.grade_class}]</span>
                      </div>
                    </div>
                    <div className="text-left font-mono text-emerald-400 dir-ltr text-[11px]">
                      {r.guardian_phone}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>ماذا سيحدث عند التوليد؟</span>
            </div>
            <p className="leading-relaxed">
              سيتم دمج بيانات كل طالب مع متغيرات القالب وتخزين {selectedRecipients.length} رسالة بحالة <span className="text-amber-400 font-mono">pending</span> داخل جدول <span className="text-emerald-400 font-mono">whatsapp_outbox</span>، جاهزة للإرسال المتتابع بواسطة محرك الاتصال المباشر.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-800 bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>توليد وإدراج ({selectedRecipients.length}) في الطابور</span>
          </button>
        </div>
      </div>
    </div>
  );
};
