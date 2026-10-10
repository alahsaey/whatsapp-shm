import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Clock, 
  RefreshCw, 
  Smartphone, 
  ArrowUpRight, 
  Terminal 
} from 'lucide-react';
import { DeliveryLog } from '../types/whatsapp';

interface DeliveryLogsProps {
  logs: DeliveryLog[];
  onClearLogs: () => void;
}

export const DeliveryLogs: React.FC<DeliveryLogsProps> = ({
  logs,
  onClearLogs,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = logs.filter(log => {
    if (eventFilter !== 'all' && log.event !== eventFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPhone = log.recipient_phone.toLowerCase().includes(q);
      const matchName = log.recipient_name.toLowerCase().includes(q);
      const matchId = log.message_id.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      return matchPhone || matchName || matchId || matchDetails;
    }
    return true;
  });

  const getEventBadge = (event: DeliveryLog['event']) => {
    switch (event) {
      case 'DELIVERED_TO_PHONE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            استلام إشعار التسليم (ACK 2)
          </span>
        );
      case 'SENT_TO_GATEWAY':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
            <Send className="w-3.5 h-3.5 text-sky-400" />
            تم البث للمحرك (Sent)
          </span>
        );
      case 'DISPATCHING':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            معالجة المقبس (Socket Transmission)
          </span>
        );
      case 'DISPATCH_FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            فشل الإرسال (Driver Rejection)
          </span>
        );
      case 'RETRY_SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            إعادة جدولة في الطابور
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            إدراج في الطابور (Enqueued)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 border border-sky-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              سجل الحالة والتدقيق (Delivery Status & Driver Logs)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            تتبع حالة كل رسالة لحظة بلحظة: من إدراجها معلقة (Pending)، إلى مغادرتها نحو محرك الاتصال (Sent)، وصولاً إلى إشعار التسليم المزدوج من هاتف ولي الأمر (Delivered)، أو توثيق كود الخطأ عند الفشل (Failed).
          </p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>تفريغ السجل</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="البحث برقم الهاتف، معرف الرسالة، أو تفاصيل الخطأ..."
              className="w-full pr-10 pl-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={eventFilter}
              onChange={e => setEventFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="all">كافة أحداث السجل ({logs.length})</option>
              <option value="DELIVERED_TO_PHONE">تم التسليم للهاتف (Delivered)</option>
              <option value="SENT_TO_GATEWAY">تم البث للمحرك (Sent)</option>
              <option value="DISPATCHING">قيد المعالجة (Dispatching)</option>
              <option value="DISPATCH_FAILED">فشل الإرسال (Failed)</option>
              <option value="ENQUEUED">إدراج في الطابور (Enqueued)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chronological Logs Feed */}
      <div className="space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 rounded-2xl bg-slate-900 border border-slate-800">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
            <p className="text-sm font-medium">لا توجد سجلات مطابقة للبحث</p>
            <p className="text-xs text-slate-600 mt-1">يتم توليد الأحداث تلقائياً عند تشغيل طابور الإرسال</p>
          </div>
        ) : (
          filteredLogs.map(log => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getEventBadge(log.event)}
                    <span className="font-semibold text-slate-200 text-xs">
                      {log.recipient_name}
                    </span>
                    <span className="font-mono text-emerald-400/90 text-xs dir-ltr">
                      {log.recipient_phone}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <span>{log.timestamp}</span>
                    {log.driver_code && (
                      <span className="bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] text-indigo-300">
                        {log.driver_code}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {log.details}
                </p>

                {log.gateway_payload && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono"
                    >
                      <Terminal className="w-3 h-3" />
                      <span>{isExpanded ? 'إخفاء الحزمة البرمجية (Payload)' : 'عرض الحزمة البرمجية المرسلة للمحرك'}</span>
                    </button>

                    {isExpanded && (
                      <pre className="mt-2 p-3 rounded-lg bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto border border-slate-800 dir-ltr text-left">
                        {log.gateway_payload}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
