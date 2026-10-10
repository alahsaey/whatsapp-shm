import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Check, 
  Send, 
  Smartphone, 
  Tag, 
  Copy, 
  CheckCheck, 
  Code 
} from 'lucide-react';
import { MessageTemplate, MessageCategory } from '../types/whatsapp';

interface TemplatesManagerProps {
  templates: MessageTemplate[];
  onAddTemplate: (tpl: Omit<MessageTemplate, 'id' | 'updated_at'>) => void;
  onUpdateTemplate: (id: string, updates: Partial<MessageTemplate>) => void;
  onDeleteTemplate: (id: string) => void;
  onUseInCompose: (templateId: string) => void;
}

export const TemplatesManager: React.FC<TemplatesManagerProps> = ({
  templates,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onUseInCompose,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate>(templates[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<MessageCategory>('absence');
  const [formDesc, setFormDesc] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formVars, setFormVars] = useState<string[]>([]);
  const [sampleVars, setSampleVars] = useState<Record<string, string>>({});

  const startEdit = (tpl: MessageTemplate) => {
    setSelectedTemplate(tpl);
    setFormTitle(tpl.title);
    setFormCategory(tpl.category);
    setFormDesc(tpl.description);
    setFormContent(tpl.content);
    setFormVars([...tpl.variables]);
    setSampleVars({ ...tpl.sample_data });
    setIsEditing(true);
    setIsCreating(false);
  };

  const startCreate = () => {
    setFormTitle('');
    setFormCategory('custom');
    setFormDesc('');
    setFormContent('السلام عليكم ولي أمر الطالب {{student_name}}،\nنفيدكم بـ {{topic}}.\nشاكرين تعاونكم.\nإدارة {{school_name}}');
    setFormVars(['student_name', 'topic', 'school_name']);
    setSampleVars({
      student_name: 'محمد أحمد',
      topic: 'متابعة الأداء الدراسي',
      school_name: 'المدرسة النموذجية',
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('يرجى ملء العنوان ونص القالب');
      return;
    }

    // Extract variables {{var_name}} automatically from content
    const matched = formContent.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
    const extractedVars = Array.from(new Set(matched.map(m => m.replace(/[{}]/g, ''))));

    if (isCreating) {
      const created = {
        title: formTitle,
        category: formCategory,
        description: formDesc,
        content: formContent,
        variables: extractedVars,
        sample_data: sampleVars,
        is_official: false,
      };
      onAddTemplate(created);
      setIsCreating(false);
    } else if (isEditing && selectedTemplate) {
      onUpdateTemplate(selectedTemplate.id, {
        title: formTitle,
        category: formCategory,
        description: formDesc,
        content: formContent,
        variables: extractedVars,
        sample_data: sampleVars,
      });
      setIsEditing(false);
    }
  };

  const insertVariableIntoContent = (varName: string) => {
    const placeholder = `{{${varName}}}`;
    setFormContent(prev => prev + ' ' + placeholder);
    if (!formVars.includes(varName)) {
      setFormVars(prev => [...prev, varName]);
    }
    if (!sampleVars[varName]) {
      setSampleVars(prev => ({ ...prev, [varName]: `قيمة_${varName}` }));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Preview computation
  const getRenderedPreview = (tpl: MessageTemplate, liveSample?: Record<string, string>) => {
    let text = tpl.content;
    const samples = liveSample || tpl.sample_data;
    Object.entries(samples).forEach(([k, v]) => {
      text = text.replaceAll(`{{${k}}}`, v || `[${k}]`);
    });
    return text;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              إدارة القوالب والمتغيرات الديناميكية (Templates & Dynamic Tags)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            دور قاعدة البيانات في تجهيز النصوص والبيانات الرسمية: إنشاء قوالب الرسائل مع متغيرات ديناميكية مثل <code className="text-indigo-300 font-mono">{'{{student_name}}'}</code> و <code className="text-indigo-300 font-mono">{'{{date}}'}</code> لحقنها في طابور الإرسال دون أخطاء يدوية.
          </p>
        </div>

        <button
          onClick={startCreate}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/30 transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء قالب جديد</span>
        </button>
      </div>

      {/* Main Grid: Templates List & Detail / Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Right Column: Templates List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold text-slate-400 px-1">
            القوالب المتاحة في قاعدة البيانات ({templates.length})
          </div>

          <div className="space-y-2">
            {templates.map(tpl => {
              const isSelected = selectedTemplate?.id === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => {
                    setSelectedTemplate(tpl);
                    setIsEditing(false);
                    setIsCreating(false);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/20 text-slate-100 shadow-md'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-sm text-slate-200">{tpl.title}</div>
                    {tpl.is_official && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        معتمد
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {tpl.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-slate-800/80">
                    {tpl.variables.map(v => (
                      <span key={v} className="text-[10px] font-mono text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 px-1.5 py-0.5 rounded">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center/Right Column: Template Inspector / Editor */}
        <div className="lg:col-span-8">
          {isEditing || isCreating ? (
            /* Edit / Create Form */
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  <span>{isCreating ? 'إنشاء قالب رسالة جديد' : `تعديل القالب: ${selectedTemplate?.title}`}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  إلغاء التعديل
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">عنوان القالب:</label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="مثال: إشعار غياب، تنبيه موعد اختبار..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">التصنيف:</label>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value as MessageCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="absence">غياب طالب (تلقائي)</option>
                      <option value="academic_note">ملاحظة دراسية أو سلوكية</option>
                      <option value="alert">تنبيه عاجل واستدعاء</option>
                      <option value="announcement">تعميم ومواعيد رسمية</option>
                      <option value="custom">رسالة خاصة ومخصصة</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">الوصف والغرض:</label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="ملاحظة سريعة توضح متى يُستخدم هذا القالب..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Tags Quick Inserter */}
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>انقر لإدراج متغير ديناميكي داخل نص القالب:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'student_name', 
                      'guardian_name', 
                      'date', 
                      'grade_class', 
                      'time', 
                      'subject', 
                      'note_content', 
                      'topic', 
                      'school_name', 
                      'link'
                    ].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertVariableIntoContent(tag)}
                        className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-[11px] font-mono text-indigo-300 hover:border-indigo-500 hover:text-white transition-colors"
                      >
                        + {`{{${tag}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    نص القالب (يمكن كتابة المتغيرات بصيغة {'{{اسم_المتغير}}'}):
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={formContent}
                    onChange={e => setFormContent(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                  />
                </div>

                {/* Sample Data for Preview */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-slate-300">بيانات تجريبية للمعاينة (Sample Values):</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.keys(sampleVars).map(k => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="font-mono text-indigo-400 text-[11px] w-28 truncate">{`{{${k}}}`}:</span>
                        <input
                          type="text"
                          value={sampleVars[k] || ''}
                          onChange={e => setSampleVars({ ...sampleVars, [k]: e.target.value })}
                          className="flex-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setIsCreating(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ القالب في قاعدة البيانات</span>
                  </button>
                </div>
              </form>
            </div>
          ) : selectedTemplate ? (
            /* View / Preview Mode */
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-100 text-base">{selectedTemplate.title}</h3>
                    {selectedTemplate.is_official && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        قالب رسمي معتمد
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedTemplate.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(selectedTemplate)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={() => onUseInCompose(selectedTemplate.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال إلى الطابور بهذا القالب</span>
                  </button>
                </div>
              </div>

              {/* Template Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400">صيغة القالب الخام (Raw Template):</label>
                  <button
                    onClick={() => copyToClipboard(selectedTemplate.content, selectedTemplate.id)}
                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    {copiedId === selectedTemplate.id ? (
                      <>
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>نسخ النص</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-200 leading-relaxed whitespace-pre-line dir-ltr text-right">
                  {selectedTemplate.content}
                </div>
              </div>

              {/* Variables Tags */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">المتغيرات المطلوبة في هذا القالب:</label>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map(v => (
                    <div key={v} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-indigo-900/40 text-xs font-mono text-indigo-300 flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-indigo-400" />
                      <span>{`{{${v}}}`}</span>
                      <span className="text-slate-500 text-[10px]">
                        (= {selectedTemplate.sample_data[v] || 'قيمة'})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp Chat Simulation */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>محاكاة مظهر الرسالة في تطبيق واتساب بعد تعويض المتغيرات:</span>
                </label>

                {/* WhatsApp Chat Box */}
                <div className="rounded-2xl bg-[#0b141a] border border-slate-800 p-4 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>واتساب · رقم المدرسة الرسمي</span>
                  </div>

                  {/* Message Bubble */}
                  <div className="max-w-md ml-auto bg-[#005c4b] text-slate-100 rounded-xl rounded-tr-none p-3.5 text-xs leading-relaxed shadow-md whitespace-pre-line font-sans">
                    {getRenderedPreview(selectedTemplate)}
                    <div className="mt-2 text-left text-[10px] text-emerald-200/70 font-mono">
                      08:15 AM ✓✓
                    </div>
                  </div>
                </div>
              </div>

              {/* Delete button if not official */}
              {!selectedTemplate.is_official && (
                <div className="pt-2 text-left">
                  <button
                    onClick={() => onDeleteTemplate(selectedTemplate.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف هذا القالب من قاعدة البيانات</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 rounded-2xl bg-slate-900 border border-slate-800">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>اختر قالباً من القائمة لعرض تفاصيله أو أنشئ قالباً جديداً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
