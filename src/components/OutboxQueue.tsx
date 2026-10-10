import React, { useState } from 'react';
import { 
  Send, 
  Clock, 
  CheckCheck, 
  AlertCircle, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  Plus, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  Eye, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  User, 
  Smartphone,
  Check
} from 'lucide-react';
import { OutboxMessage, MessageTemplate, Recipient, MessageStatus, MessageCategory, MessagePriority } from '../types/whatsapp';
import { MessageDetailModal } from './MessageDetailModal';
import { ComposeMessageModal } from './ComposeMessageModal';
import { BatchGeneratorModal } from './BatchGeneratorModal';

interface OutboxQueueProps {
  messages: OutboxMessage[];
  templates: MessageTemplate[];
  recipients: Recipient[];
  isQueueRunning: boolean;
  onToggleQueue: () => void;
  onAddMessage: (msg: Omit<OutboxMessage, 'id' | 'status' | 'retry_count' | 'max_retries' | 'scheduled_at' | 'gateway_type'>) => void;
  onAddBatch: (msgs: Array<Omit<OutboxMessage, 'id' | 'status' | 'retry_count' | 'max_retries' | 'scheduled_at' | 'gateway_type'> & Partial<OutboxMessage>>) => void;
  onRetryMessage: (id: string) => void;
  onRetryAllFailed: () => void;
  onDeleteMessage: (id: string) => void;
  onClearDelivered: () => void;
  onSendNow: (id: string) => void;
}

export const OutboxQueue: React.FC<OutboxQueueProps> = ({
  messages,
  templates,
  recipients,
  isQueueRunning,
  onToggleQueue,
  onAddMessage,
  onAddBatch,
  onRetryMessage,
  onRetryAllFailed,
  onDeleteMessage,
  onClearDelivered,
  onSendNow,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  const [selectedMessage, setSelectedMessage] = useState<OutboxMessage | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  // Metrics
  const totalCount = messages.length;
  const pendingCount = messages.filter(m => m.status === 'pending').length;
  const processingCount = messages.filter(m => m.status === 'processing').length;
  const sentCount = messages.filter(m => m.status === 'sent').length;
  const deliveredCount = messages.filter(m => m.status === 'delivered').length;
  const failedCount = messages.filter(m => m.status === 'failed').length;
  
  const completedCount = sentCount + deliveredCount;
  const successRate = totalCount > 0 ? Math.round((completedCount / (totalCount - pendingCount || 1)) * 100) : 100;

  // Filter messages
  const filteredMessages = messages.filter(m => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && m.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPhone = m.recipient_phone.toLowerCase().includes(q);
      const matchName = m.recipient_name.toLowerCase().includes(q);
      const matchStudent = (m.student_name || '').toLowerCase().includes(q);
      const matchBody = m.message_body.toLowerCase().includes(q);
      return matchPhone || matchName || matchStudent || matchBody;
    }
    return true;
  });

  const getStatusBadge = (status: MessageStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            <CheckCheck className="w-3 h-3 text-emerald-400" />
            تم التسليم
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
            <Send className="w-3 h-3 text-sky-400" />
            تم الإرسال
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
            <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
            قيد الإرسال
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            فشل الإرسال
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3 text-amber-400" />
            معلقة في الطابور
          </span>
        );
    }
  };

  const getCategoryLabel = (cat: MessageCategory) => {
    switch (cat) {
      case 'absence':
        return <span className="text-amber-400 font-medium">غياب طالب</span>;
      case 'academic_note':
        return <span className="text-indigo-400 font-medium">ملاحظة دراسية</span>;
      case 'alert':
        return <span className="text-rose-400 font-medium">تنبيه عاجل</span>;
      case 'announcement':
        return <span className="text-emerald-400 font-medium">تعميم عام</span>;
      default:
        return <span className="text-slate-400 font-medium">رسالة خاصة</span>;
    }
  };

  const getPriorityBadge = (p: MessagePriority) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded">
            عاجل جداً
          </span>
        );
      case 'high':
        return (
          <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
            مرتفع
          </span>
        );
      default:
        return (
          <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
            عادي
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Architectural Banner: Explaining the Outbox Queue role */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-900/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                طابور الإرسال المباشر (Message Outbox & Queue)
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              تخزين منظم للرسائل المجدولة والتلقائية (غياب، ملاحظات، تنبيهات). يتولى المحرك المباشر سحب الرسائل المعلقة وبثها إلى واتساب مع فاصل أمني لتجنب الحظر، وتحديث سجل الحالة فوراً.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleQueue}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                isQueueRunning
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-900/30'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/30'
              }`}
            >
              {isQueueRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>إيقاف المحرك مؤقتاً</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>بدء تفريغ الطابور المباشر</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsBatchOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>توليد دفعة تلقائية</span>
            </button>

            <button
              onClick={() => setIsComposeOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>رسالة جديدة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400">إجمالي الرسائل</div>
          <div className="text-xl font-bold font-mono text-slate-100">{totalCount}</div>
          <div className="text-[10px] text-slate-400">في قاعدة البيانات</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-900/30 space-y-1">
          <div className="text-[11px] text-amber-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>معلقة في الطابور</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">{pendingCount}</div>
          <div className="text-[10px] text-amber-400/80">Pending</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-900/30 space-y-1">
          <div className="text-[11px] text-indigo-400 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>قيد المعالجة</span>
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300">{processingCount}</div>
          <div className="text-[10px] text-indigo-400/80">In Gateway</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-sky-900/30 space-y-1">
          <div className="text-[11px] text-sky-400 flex items-center gap-1">
            <Send className="w-3 h-3" />
            <span>تم الإرسال</span>
          </div>
          <div className="text-xl font-bold font-mono text-sky-300">{sentCount}</div>
          <div className="text-[10px] text-sky-400/80">Sent ACK 1</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-900/30 space-y-1">
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCheck className="w-3 h-3" />
            <span>تم التسليم بنجاح</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300">{deliveredCount}</div>
          <div className="text-[10px] text-emerald-400/80">Delivered ACK 2</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-rose-900/30 space-y-1">
          <div className="text-[11px] text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>فشل الإرسال</span>
          </div>
          <div className="text-xl font-bold font-mono text-rose-300">{failedCount}</div>
          <div className="text-[10px] text-rose-400/80">نسبة الإنجاز {successRate}%</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="البحث برقم الهاتف، اسم ولي الأمر، اسم الطالب، أو نص الرسالة..."
              className="w-full pr-10 pl-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {failedCount > 0 && (
              <button
                onClick={onRetryAllFailed}
                className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="إعادة المحاولة لجميع الرسائل الفاشلة"
              >
                <RefreshCw className="w-3 h-3" />
                <span>إعادة الفاشل ({failedCount})</span>
              </button>
            )}

            {deliveredCount > 0 && (
              <button
                onClick={onClearDelivered}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="أرشفة وحذف الرسائل المسلمة لتنظيف العرض"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden md:inline">تنظيف المسلّم</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Badges / Segmented Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-1 text-slate-400 ml-2">
            <Filter className="w-3.5 h-3.5" />
            <span>الحالة:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === 'all' ? 'bg-slate-800 text-slate-100 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === 'pending' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              معلقة ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('sent')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === 'sent' ? 'bg-sky-500/20 text-sky-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              مرسلة ({sentCount})
            </button>
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === 'delivered' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              مسلمة ({deliveredCount})
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === 'failed' ? 'bg-rose-500/20 text-rose-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              فاشلة ({failedCount})
            </button>
          </div>

          {/* Category Filter dropdown */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">كافة التصنيفات</option>
            <option value="absence">إشعارات الغياب</option>
            <option value="academic_note">ملاحظات دراسية</option>
            <option value="alert">تنبيهات واستدعاء</option>
            <option value="announcement">تعاميم عامة</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">كافة الأولويات</option>
            <option value="urgent">أولوية قصوى (عاجل)</option>
            <option value="high">أولوية مرتفعة</option>
            <option value="normal">أولوية عادية</option>
          </select>
        </div>
      </div>

      {/* Main Outbox Messages Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="p-3.5 font-medium">المستلم والطالب</th>
                <th className="p-3.5 font-medium">الهاتف</th>
                <th className="p-3.5 font-medium">التصنيف والأولوية</th>
                <th className="p-3.5 font-medium">مقتطف نص الرسالة</th>
                <th className="p-3.5 font-medium">حالة التسليم</th>
                <th className="p-3.5 font-medium">التوقيت</th>
                <th className="p-3.5 font-medium text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-medium text-sm">لا توجد رسائل مطابقة للبحث أو الفلتر في طابور الإرسال</p>
                    <p className="text-xs text-slate-600 mt-1">
                      يمكنك توليد دفعة تلقائية أو إضافة رسالة جديدة إلى الطابور
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMessages.map(msg => (
                  <tr 
                    key={msg.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Recipient */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-200">{msg.recipient_name}</span>
                        {(msg.source === 'Tracker_System' || msg.id.startsWith('TRK_')) && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            نظام تراكر
                          </span>
                        )}
                      </div>
                      {msg.student_name ? (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>الطالب: {msg.student_name}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">مستلم مباشر</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="p-3.5 font-mono text-emerald-400/90 dir-ltr text-right">
                      {msg.recipient_phone}
                    </td>

                    {/* Category & Priority */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div>{getCategoryLabel(msg.category)}</div>
                        <div>{getPriorityBadge(msg.priority)}</div>
                      </div>
                    </td>

                    {/* Message Preview */}
                    <td className="p-3.5 max-w-xs">
                      <p className="line-clamp-2 text-slate-300 leading-relaxed font-sans">
                        {msg.message_body}
                      </p>
                    </td>

                    {/* Delivery Status */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div>{getStatusBadge(msg.status)}</div>
                        {msg.failure_reason && (
                          <div className="text-[10px] text-rose-400 line-clamp-1 max-w-[140px]" title={msg.failure_reason}>
                            {msg.failure_reason}
                          </div>
                        )}
                        {msg.driver_message_id && (
                          <div className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                            {msg.driver_message_id}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Timestamps */}
                    <td className="p-3.5 text-[11px] font-mono text-slate-400">
                      <div>{msg.scheduled_at.split(' ')[1] || msg.scheduled_at}</div>
                      <div className="text-[10px] text-slate-500">{msg.scheduled_at.split(' ')[0]}</div>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedMessage(msg)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                          title="عرض تفاصيل السجل في قاعدة البيانات"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {msg.status === 'pending' && (
                          <button
                            onClick={() => onSendNow(msg.id)}
                            className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                            title="إرسال فوري الآن عبر المحرك"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {msg.status === 'failed' && (
                          <button
                            onClick={() => onRetryMessage(msg.id)}
                            className="p-1.5 rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors"
                            title="إعادة المحاولة"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onDeleteMessage(msg.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="حذف من الطابور"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <MessageDetailModal
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
        onRetry={onRetryMessage}
        onSendNow={onSendNow}
      />

      <ComposeMessageModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        templates={templates}
        recipients={recipients}
        onAddMessage={onAddMessage}
      />

      <BatchGeneratorModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        recipients={recipients}
        templates={templates}
        onGenerateBatch={onAddBatch}
      />
    </div>
  );
};
