import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Check, 
  Smartphone, 
  User, 
  AlertTriangle 
} from 'lucide-react';
import { MessageTemplate, Recipient, MessageCategory, MessagePriority, OutboxMessage } from '../types/whatsapp';

interface ComposeMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: MessageTemplate[];
  recipients: Recipient[];
  onAddMessage: (msg: Omit<OutboxMessage, 'id' | 'status' | 'retry_count' | 'max_retries' | 'scheduled_at' | 'gateway_type'>) => void;
  initialTemplateId?: string;
}

export const ComposeMessageModal: React.FC<ComposeMessageModalProps> = ({
  isOpen,
  onClose,
  templates,
  recipients,
  onAddMessage,
  initialTemplateId,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId || '');
  const [recipientMode, setRecipientMode] = useState<'existing' | 'custom'>('existing');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(recipients[0]?.id || '');
  const [customPhone, setCustomPhone] = useState<string>('+96650');
  const [customName, setCustomName] = useState<string>('');
  const [category, setCategory] = useState<MessageCategory>('absence');
  const [priority, setPriority] = useState<MessagePriority>('normal');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [rawText, setRawText] = useState<string>('');

  // Handle template selection
  useEffect(() => {
    if (initialTemplateId) {
      setSelectedTemplateId(initialTemplateId);
    }
  }, [initialTemplateId]);

  useEffect(() => {
    if (selectedTemplateId) {
      const tpl = templates.find(t => t.id === selectedTemplateId);
      if (tpl) {
        setCategory(tpl.category);
        // Pre-fill variables with sample or active recipient
        const activeRec = recipients.find(r => r.id === selectedRecipientId);
        const initialVars: Record<string, string> = { ...tpl.sample_data };
        if (activeRec) {
          if (initialVars.student_name !== undefined) initialVars.student_name = activeRec.student_name;
          if (initialVars.grade_class !== undefined) initialVars.grade_class = activeRec.grade_class;
        }
        setVariables(initialVars);
      }
    }
  }, [selectedTemplateId, templates, selectedRecipientId, recipients]);

  // Compute rendered message body
  const getRenderedBody = (): string => {
    if (!selectedTemplateId) return rawText;
    const tpl = templates.find(t => t.id === selectedTemplateId);
    if (!tpl) return rawText;

    let body = tpl.content;
    Object.entries(variables).forEach(([key, val]) => {
      body = body.replaceAll(`{{${key}}}`, val || `[${key}]`);
    });
    return body;
  };

  const activeRecipient = recipients.find(r => r.id === selectedRecipientId);
  const targetPhone = recipientMode === 'existing' ? (activeRecipient?.guardian_phone || '') : customPhone;
  const targetName = recipientMode === 'existing' ? (activeRecipient?.guardian_name || '') : customName;
  const targetStudent = recipientMode === 'existing' ? activeRecipient?.student_name : '';
  const targetStudentId = recipientMode === 'existing' ? activeRecipient?.student_id : '';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPhone.trim() || !targetName.trim()) {
      alert('يرجى تحديد المستلم ورقم الهاتف');
      return;
    }

    const body = getRenderedBody();
    if (!body.trim()) {
      alert('يرجى كتابة نص الرسالة أو اختيار قالب');
      return;
    }

    onAddMessage({
      recipient_name: targetName,
      recipient_phone: targetPhone,
      student_name: targetStudent,
      student_id: targetStudentId,
      category,
      template_id: selectedTemplateId || undefined,
      variables,
      message_body: body,
      priority,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60 sticky top-0 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">إضافة رسالة جديدة إلى طابور الإرسال</h3>
              <p className="text-xs text-slate-400">حفظ السجل في جدول Outbox مع معالجة المتغيرات الديناميكية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>اختيار قالب معتمد (اختياري):</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTemplateId('')}
                className={`p-3 rounded-xl text-right border transition-all text-xs ${
                  !selectedTemplateId
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                رسالة حرة ومخصصة (بدون قالب)
              </button>
              {templates.map(tpl => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-3 rounded-xl text-right border transition-all text-xs ${
                    selectedTemplateId === tpl.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200">{tpl.title}</div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{tpl.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Selection */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>تحديد المستلم وولي الأمر:</span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRecipientMode('existing')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    recipientMode === 'existing' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  من سجل الطلاب
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode('custom')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    recipientMode === 'custom' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  إدخال رقم خارجي
                </button>
              </div>
            </div>

            {recipientMode === 'existing' ? (
              <div className="space-y-2">
                <select
                  value={selectedRecipientId}
                  onChange={e => setSelectedRecipientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {recipients.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.guardian_name} ({r.guardian_relation}) - الطالب: {r.student_name} [{r.grade_class}] ({r.guardian_phone})
                    </option>
                  ))}
                </select>
                {activeRecipient && (
                  <div className="text-xs text-emerald-400/90 flex items-center gap-2 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10 font-mono">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span dir="ltr">{activeRecipient.guardian_phone}</span>
                    <span className="text-slate-400">· {activeRecipient.student_name}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">اسم ولي الأمر / المستلم:</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="مثال: صالح ناصر الفهد"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">رقم الواتساب بالصيغة الدولية:</label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={customPhone}
                    onChange={e => setCustomPhone(e.target.value)}
                    placeholder="+96650XXXXXXX"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Priority & Category Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">أولوية المعالجة في الطابور:</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as MessagePriority)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="urgent">أولوية قصوى (عاجل - يقدم على كافة الرسائل)</option>
                <option value="high">أولوية مرتفعة (غياب وملاحظات هامة)</option>
                <option value="normal">أولوية عادية (تعاميم وإعلانات عامة)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">تصنيف الرسالة:</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as MessageCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="absence">غياب طالب (تلقائي)</option>
                <option value="academic_note">ملاحظة دراسية أو سلوكية</option>
                <option value="alert">تنبيه عاجل واستدعاء</option>
                <option value="announcement">تعميم ومواعيد رسمية</option>
                <option value="custom">رسالة خاصة</option>
              </select>
            </div>
          </div>

          {/* Template Dynamic Variables if template selected */}
          {selectedTemplateId && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-900/30 space-y-3">
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>تعبئة المتغيرات الديناميكية للقالب:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.keys(variables).map(key => (
                  <div key={key}>
                    <label className="text-[11px] text-slate-400 block mb-1 font-mono">{`{{${key}}}`}:</label>
                    <input
                      type="text"
                      value={variables[key] || ''}
                      onChange={e => setVariables({ ...variables, [key]: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Text Input if no template */}
          {!selectedTemplateId && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">نص الرسالة المباشر:</label>
              <textarea
                rows={4}
                required
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="اكتب نص الرسالة التي ستُرسل إلى ولي الأمر..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>
          )}

          {/* Live Preview Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 block">
              معاينة الرسالة النهائية المنقولة لمحرك الاتصال:
            </label>
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans">
              {getRenderedBody() || 'سيظهر النص النهائي هنا بعد اختيار القالب وتعبئة المتغيرات...'}
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إدراج في طابور الإرسال (Enqueue)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
