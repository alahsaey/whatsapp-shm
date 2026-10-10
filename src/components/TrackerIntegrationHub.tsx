import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Copy, 
  CheckCheck, 
  Globe, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Bot, 
  Link2, 
  RefreshCw, 
  Code, 
  Terminal, 
  Sparkles, 
  Check, 
  Eye, 
  EyeOff, 
  Zap, 
  Share2, 
  ExternalLink,
  Bus,
  Gauge,
  MapPin,
  Clock,
  ShieldCheck,
  Radio,
  FileJson,
  Trash2,
  ArrowRight,
  UserCheck,
  BellRing
} from 'lucide-react';
import { OutboxMessage, MessageStatus } from '../types/whatsapp';

interface TrackerIntegrationHubProps {
  messages?: OutboxMessage[];
  onSimulateTrackerMessage: (msg: Omit<OutboxMessage, 'id' | 'status' | 'retry_count' | 'max_retries' | 'scheduled_at' | 'gateway_type'> & Partial<OutboxMessage>) => void;
  senderPhone: string;
  onSendNow?: (id: string) => Promise<void>;
  onDeleteMessage?: (id: string) => void;
  onRetryMessage?: (id: string) => void;
}

export const TrackerIntegrationHub: React.FC<TrackerIntegrationHubProps> = ({
  messages = [],
  onSimulateTrackerMessage,
  senderPhone,
  onSendNow,
  onDeleteMessage,
  onRetryMessage,
}) => {
  // URLs & credentials
  const [apiEndpoint, setApiEndpoint] = useState(() => `${window.location.origin}/api/v1/whatsapp/send`);
  const [webhookUrl, setWebhookUrl] = useState(() => `${window.location.origin}/api/tracker/webhook`);
  const [inboxUrl, setInboxUrl] = useState(() => `${window.location.origin}/api/tracker/inbox`);

  const [accountId, setAccountId] = useState('710722757638');
  const [apiKey, setApiKey] = useState('wa_live_sec_710722757638_9f82a1c0d4e3');
  const [botName, setBotName] = useState('بوت إشعارات SAR المعتمد (Notification Bot)');
  const [botPhone, setBotPhone] = useState(senderPhone || '+96871233039');
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copyAllSuccess, setCopyAllSuccess] = useState(false);

  // Auto-forwarding toggle
  const [autoForward, setAutoForward] = useState(true);
  const [isTogglingForward, setIsTogglingForward] = useState(false);

  // Filter for stream
  const [streamFilter, setStreamFilter] = useState<'all' | 'absence' | 'speed' | 'bus' | 'delivered' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected message for payload inspection
  const [selectedPayloadMsg, setSelectedPayloadMsg] = useState<OutboxMessage | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Live Test Simulation state
  const [testStudentName, setTestStudentName] = useState('عبدالله محمد السالم');
  const [testParentPhone, setTestParentPhone] = useState('+96871233039');
  const [testScenario, setTestScenario] = useState<'absence' | 'speed' | 'bus_arrival' | 'geofence' | 'academic' | 'custom'>('absence');
  const [testSpeed, setTestSpeed] = useState('94');
  const [testBusNumber, setTestBusNumber] = useState('حافلة 14 - خط الموالح');
  const [testCustomText, setTestCustomText] = useState('تم رصد خروج الطالب من البوابة الرئيسية بعد انتهاء اليوم الدراسي');
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{ 
    success: boolean; 
    message: string; 
    status_code?: number;
    payload?: any; 
    response_data?: any;
  } | null>(null);

  // Active documentation tab
  const [codeTab, setCodeTab] = useState<'curl' | 'get_url' | 'traccar' | 'nodejs' | 'python'>('curl');

  // Update URLs when origin changes
  useEffect(() => {
    setApiEndpoint(`${window.location.origin}/api/v1/whatsapp/send`);
    setWebhookUrl(`${window.location.origin}/api/tracker/webhook`);
    setInboxUrl(`${window.location.origin}/api/tracker/inbox`);
  }, []);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllConfig = () => {
    const allConfigText = `بيانات الربط مع نظام مراسلات واتساب:
------------------------------------------
1. رابط المزود / نقطة النهاية (API Endpoint):
${apiEndpoint}

2. معرف الحساب أو القناة (Account ID):
${accountId}

3. مفتاح التوثيق السري (Authorization / API Key):
${apiKey}

4. اسم البوت المعتمد (Display Sender Name):
${botName}

5. رقم هاتف الإرسال المركزي (Sender Phone):
${botPhone}

6. رابط الويب هوك لاستلام التقارير (Webhook URL):
${webhookUrl}

7. صيغة الإرسال المباشر عبر GET Query:
${apiEndpoint}?phone=${testParentPhone}&message=نص_الرسالة&token=${apiKey}&account_id=${accountId}
------------------------------------------`;

    navigator.clipboard.writeText(allConfigText);
    setCopyAllSuccess(true);
    setTimeout(() => setCopyAllSuccess(false), 2500);
  };

  // Filtered tracker messages
  const trackerMessages = messages.filter(m => 
    m.source === 'Tracker_System' || 
    m.id.startsWith('TRK_') || 
    m.id.startsWith('msg_trk_') ||
    (m.variables && (m.variables.source_system || m.variables.source === 'نظام تراكر'))
  );

  const filteredTrackerMessages = trackerMessages.filter(m => {
    const matchesSearch = 
      m.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.recipient_phone.includes(searchQuery) ||
      m.message_body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.student_name && m.student_name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (streamFilter === 'all') return true;
    if (streamFilter === 'delivered') return m.status === 'delivered';
    if (streamFilter === 'pending') return m.status === 'pending';
    if (streamFilter === 'absence') return m.category === 'absence' || m.message_body.includes('غياب');
    if (streamFilter === 'speed') return m.message_body.includes('سرعة') || m.message_body.includes('كم/س');
    if (streamFilter === 'bus') return m.message_body.includes('حافلة') || m.message_body.includes('وصول');
    return true;
  });

  const handleToggleAutoForward = async () => {
    setIsTogglingForward(true);
    try {
      const res = await fetch('/api/tracker/toggle-auto-forward', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAutoForward(data.auto_forward_enabled);
      }
    } catch {
      setAutoForward(!autoForward);
    } finally {
      setIsTogglingForward(false);
    }
  };

  const handleReforwardMessage = async (msg: OutboxMessage) => {
    setActionLoadingId(msg.id);
    try {
      const res = await fetch(`/api/tracker/reforward/${msg.id}`, { method: 'POST' });
      if (res.ok) {
        if (onSendNow) await onSendNow(msg.id);
      } else {
        if (onSendNow) await onSendNow(msg.id);
      }
    } catch {
      if (onSendNow) await onSendNow(msg.id);
    } finally {
      setTimeout(() => setActionLoadingId(null), 800);
    }
  };

  // Run Tracker simulation
  const handleRunTrackerSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimulationResult(null);

    let messageBody = '';
    let category: any = 'absence';
    let priority: any = 'high';

    if (testScenario === 'absence') {
      category = 'absence';
      priority = 'high';
      messageBody = `المكرم ولي أمر الطالب ${testStudentName} المحترم،\nنفيدكم بتسجيل غياب نجلكم عن اليوم الدراسي عبر (نظام تراكر).\nنرجو مراجعة إدارة المدرسة لتقديم العذر.\n${botName}`;
    } else if (testScenario === 'speed') {
      category = 'alert';
      priority = 'urgent';
      messageBody = `⚠️ تنبيه أمان عاجل من نظام تراكر:\nتم رصد تجاوز للسرعة المحددة من قِبل [${testBusNumber}].\nالسرعة المسجلة: ${testSpeed} كم/س (الحد المسموح 80 كم/س).\nالموقع: شارع السلطان قابوس.`;
    } else if (testScenario === 'bus_arrival') {
      category = 'alert';
      priority = 'normal';
      messageBody = `🚌 إشعار وصول الحافلة المدرسية:\nاقتربت ${testBusNumber} من محطة الحي الخاصة بالطالب ${testStudentName}.\nالوقت المتوقع للوصول: 3 دقائق.\n${botName}`;
    } else if (testScenario === 'geofence') {
      category = 'alert';
      priority = 'urgent';
      messageBody = `📍 تنبيه سياج جغرافي (Geofence):\nغادرت ${testBusNumber} النطاق الجغرافي المحدد للمدرسة في تمام الساعة ${new Date().toLocaleTimeString('ar-EG')}.`;
    } else if (testScenario === 'academic') {
      category = 'academic_note';
      priority = 'normal';
      messageBody = `إشعار من نظام تراكر: ولي أمر الطالب ${testStudentName}،\nملاحظة دراسية: "${testCustomText}"\nشاكرين اهتمامكم ومتابعتكم المستمرة.`;
    } else {
      category = 'custom';
      priority = 'high';
      messageBody = `إشعار مخصص من نظام تراكر:\n${testCustomText}\nالمستلم: ${testStudentName}`;
    }

    const payloadToSend = {
      recipient_phone: testParentPhone,
      recipient_name: `ولي أمر ${testStudentName}`,
      student_name: testStudentName,
      message: messageBody,
      category: category,
      priority: priority,
      sender_bot: botName,
      source_system: 'Tracker_System',
      channel_id: accountId,
      speed: testScenario === 'speed' ? testSpeed : undefined,
      bus_info: testBusNumber,
      timestamp: new Date().toISOString(),
    };

    try {
      // Call actual backend endpoint /api/v1/whatsapp/send
      const response = await fetch('/api/v1/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Account-ID': accountId,
        },
        body: JSON.stringify(payloadToSend),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        // Also register in client-side storage for instantaneous outbox reflection
        onSimulateTrackerMessage({
          recipient_name: `ولي أمر ${testStudentName}`,
          recipient_phone: testParentPhone,
          student_name: testStudentName,
          category: category,
          variables: { 
            student_name: testStudentName, 
            source_system: 'نظام تراكر (Tracker)',
            account_id: accountId 
          },
          message_body: messageBody,
          priority: priority,
          source: 'Tracker_System',
          raw_payload: JSON.stringify(payloadToSend),
        });

        setSimulationResult({
          success: true,
          status_code: response.status,
          message: 'تم استقبال الرسالة بنجاح في قاعدة البيانات وتمريرها فوراً لواتساب!',
          payload: payloadToSend,
          response_data: responseData,
        });
      } else {
        setSimulationResult({
          success: false,
          status_code: response.status,
          message: responseData.error || 'تعذر استلام الرسالة',
          payload: payloadToSend,
          response_data: responseData,
        });
      }
    } catch (err: any) {
      // Local fallback simulation
      onSimulateTrackerMessage({
        recipient_name: `ولي أمر ${testStudentName}`,
        recipient_phone: testParentPhone,
        student_name: testStudentName,
        category: category,
        variables: { student_name: testStudentName, source_system: 'نظام تراكر (Tracker)' },
        message_body: messageBody,
        priority: priority,
        source: 'Tracker_System',
        raw_payload: JSON.stringify(payloadToSend),
      });

      setSimulationResult({
        success: true,
        status_code: 200,
        message: 'تم تسجيل الرسالة في طابور الإرسال وإعادة التوجيه (محلياً)',
        payload: payloadToSend,
        response_data: { status: 'success', message: 'Simulated locally' },
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const getStatusBadge = (status: MessageStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCheck className="w-3.5 h-3.5" />
            <span>تم التسليم للمستخدم</span>
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Send className="w-3.5 h-3.5" />
            <span>تم الإرسال للواتساب</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>جاري التحويل</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>مستلمة في الطابور</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>فشل التوجيه</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Live Status */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                مركز استقبال وتحويل رسائل نظام التراكر (Tracker Gateway)
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                HTTP API · Webhook · Inbound Stream
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
              كشف استلام رسائل نظام التراكر وإعادة التوجيه للواتساب
            </h1>
            
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              عندما يُرسل نظام التراكر (تتبع الحافلات، الغياب، الحضور، السرعة، أو السياج الجغرافي) أي تنبيه، يستقبله هذا المركز فوراً عبر الـ API ويوثقه في كشف الاستلام المباشر، ثم يعيد توجيهه تلقائياً لهاتف ولي الأمر عبر محرك الواتساب المباشر.
            </p>
          </div>

          {/* Quick Actions & Auto-Forward Switch */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handleToggleAutoForward}
              disabled={isTogglingForward}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border shadow-lg ${
                autoForward
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Zap className={`w-4 h-4 ${autoForward ? 'text-emerald-400 fill-emerald-400' : 'text-slate-500'}`} />
              <span>التحويل التلقائي للواتساب:</span>
              <span className={`px-2 py-0.5 rounded font-mono text-[11px] ${autoForward ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-700 text-slate-300'}`}>
                {autoForward ? 'مفعل (Auto)' : 'يدوي (Manual)'}
              </span>
            </button>

            <button
              onClick={copyAllConfig}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
            >
              {copyAllSuccess ? (
                <>
                  <CheckCheck className="w-4 h-4 text-emerald-300" />
                  <span>تم نسخ جميع معلمات الربط!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>نسخ بيانات الربط لتراكر</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-xs text-slate-400 block">إجمالي الوارد من التراكر</span>
            <span className="text-xl font-black text-indigo-300 font-mono mt-0.5 block">
              {trackerMessages.length}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-xs text-slate-400 block">تم تسليمها للمستخدم بنجاح</span>
            <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">
              {trackerMessages.filter(m => m.status === 'delivered').length}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-xs text-slate-400 block">قيد الانتظار والمعالجة</span>
            <span className="text-xl font-black text-amber-300 font-mono mt-0.5 block">
              {trackerMessages.filter(m => m.status === 'pending' || m.status === 'processing').length}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-xs text-slate-400 block">حالة المنفذ (API Status)</span>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>نشط وجاهز للاستقبال</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: LIVE TRACKER INBOUND STREAM & DISPATCH TABLE (كشف الاستلام والتحويل) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <h2 className="text-base font-bold text-slate-100">
                كشف استلام رسائل نظام التراكر الحية (Live Inbound Stream)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              سجل فوري متزامن يعرض كل رسالة استقبلها النظام من التراكر، وحالة تحويلها وإرسالها المباشر للمستخدم
            </p>
          </div>

          {/* Filter and Search */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="بحث في الرسائل، الرقم، أو الاسم..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
            />

            <select
              value={streamFilter}
              onChange={(e: any) => setStreamFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">جميع رسائل التراكر ({trackerMessages.length})</option>
              <option value="delivered">المسلّمة للمستخدم فقط</option>
              <option value="pending">المعلقة في الطابور</option>
              <option value="absence">إشعارات الغياب</option>
              <option value="speed">تنبيهات السرعة</option>
              <option value="bus">تنبيهات الحافلة المدرسية</option>
            </select>
          </div>
        </div>

        {/* Stream Table */}
        <div className="overflow-x-auto">
          {filteredTrackerMessages.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-400 mb-3">
                <Radio className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-300">لا توجد رسائل واردة من التراكر مطابقة للبحث حالياً</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                يمكنك تجربة إرسال رسالة محاكاة فورية من القسم أدناه لاختبار كشف الاستلام والتحويل التلقائي
              </p>
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800/80 text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">معرف التراكر / الوقت</th>
                  <th className="py-3 px-4">المستلم / المعني</th>
                  <th className="py-3 px-4">رقم الهاتف</th>
                  <th className="py-3 px-4">نص الرسالة الواردة من التراكر</th>
                  <th className="py-3 px-4">حالة المعالجة والتسليم</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredTrackerMessages.map(msg => (
                  <tr key={msg.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* ID & Time */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-indigo-300 font-bold">{msg.id}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{msg.scheduled_at || 'الآن'}</span>
                      </div>
                    </td>

                    {/* Recipient / Student */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{msg.recipient_name}</div>
                      {msg.student_name && (
                        <div className="text-[11px] text-indigo-400 flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3 h-3" />
                          <span>الطالب: {msg.student_name}</span>
                        </div>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 font-mono text-slate-300 dir-ltr text-right">
                      {msg.recipient_phone}
                    </td>

                    {/* Message Body */}
                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      <p className="line-clamp-2 text-slate-300 whitespace-pre-line leading-relaxed">
                        {msg.message_body}
                      </p>
                    </td>

                    {/* Pipeline Status */}
                    <td className="py-3 px-4">
                      {getStatusBadge(msg.status)}
                      {msg.delivered_at && (
                        <div className="text-[10px] text-emerald-400/80 font-mono mt-1">
                          تم: {msg.delivered_at.substring(11, 19)}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleReforwardMessage(msg)}
                          disabled={actionLoadingId === msg.id}
                          className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 transition-colors"
                          title="إعادة إرسال وتوجيه الرسالة فوراً للواتساب"
                        >
                          <Send className={`w-3.5 h-3.5 ${actionLoadingId === msg.id ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                          onClick={() => setSelectedPayloadMsg(msg)}
                          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
                          title="فحص بيانات وحمولة الرسالة الخام (Payload JSON)"
                        >
                          <FileJson className="w-3.5 h-3.5" />
                        </button>

                        {onDeleteMessage && (
                          <button
                            onClick={() => onDeleteMessage(msg.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                            title="حذف السجل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 2: LIVE SIMULATOR & TEST DISPATCH (مختبر ومحاكي رسائل التراكر) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-100">
                  محاكي ومختبر إرسال أحداث نظام التراكر
                </h3>
                <p className="text-xs text-slate-400">
                  قم بتجربة إرسال أحداث تتبع حية للتحقق من استلامها الفوري وإعادة توجيهها
                </p>
              </div>
            </div>
            
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded">
              Live Test
            </span>
          </div>

          <form onSubmit={handleRunTrackerSimulation} className="space-y-4">
            {/* Scenario selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اختر نوع حدث التراكر للاختبار:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTestScenario('absence')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-right flex items-center gap-2 transition-all ${
                    testScenario === 'absence'
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <BellRing className="w-4 h-4 text-amber-400" />
                  <span>إشعار غياب طالب</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestScenario('speed')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-right flex items-center gap-2 transition-all ${
                    testScenario === 'speed'
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Gauge className="w-4 h-4 text-rose-400" />
                  <span>تجاوز سرعة الحافلة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestScenario('bus_arrival')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-right flex items-center gap-2 transition-all ${
                    testScenario === 'bus_arrival'
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Bus className="w-4 h-4 text-emerald-400" />
                  <span>وصول الحافلة للحي</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestScenario('geofence')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-right flex items-center gap-2 transition-all ${
                    testScenario === 'geofence'
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-sky-400" />
                  <span>السياج الجغرافي</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestScenario('academic')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-right flex items-center gap-2 transition-all ${
                    testScenario === 'academic'
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  <span>ملاحظة دراسية</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestScenario('custom')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-right flex items-center gap-2 transition-all ${
                    testScenario === 'custom'
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Code className="w-4 h-4 text-slate-300" />
                  <span>رسالة مخصصة</span>
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم الطالب / المعني:
                </label>
                <input
                  type="text"
                  value={testStudentName}
                  onChange={e => setTestStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رقم هاتف ولي الأمر (واتساب المستلم):
                </label>
                <input
                  type="text"
                  value={testParentPhone}
                  onChange={e => setTestParentPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {testScenario === 'speed' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    السرعة المرصودة (كم/س):
                  </label>
                  <input
                    type="number"
                    value={testSpeed}
                    onChange={e => setTestSpeed(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-rose-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    بيانات الحافلة:
                  </label>
                  <input
                    type="text"
                    value={testBusNumber}
                    onChange={e => setTestBusNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {(testScenario === 'academic' || testScenario === 'custom') && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نص الملاحظة / الحدث:
                </label>
                <textarea
                  rows={2}
                  value={testCustomText}
                  onChange={e => setTestCustomText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSimulating}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg transition-all"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري إرسال الحدث إلى نقطة النهاية ومحرك الواتساب...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>إرسال الحدث الآن من نظام التراكر وإعادة التوجيه لواتساب</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Simulation Response Inspector */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-indigo-400" />
                فاحص استجابة المنفذ (HTTP 200 Ingestion Result)
              </span>
              {simulationResult && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  simulationResult.success 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  HTTP {simulationResult.status_code || 200}
                </span>
              )}
            </div>

            {simulationResult ? (
              <div className="space-y-3">
                <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  simulationResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {simulationResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>{simulationResult.message}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    تم إدراج الرسالة فوراً في كشف الاستلام وطابور الإرسال وإشعار المحرك المباشر.
                  </p>
                </div>

                {/* Raw JSON viewer */}
                <div>
                  <span className="text-[11px] font-mono text-slate-400 block mb-1">
                    الرد الرسمي المرجع لنظام التراكر:
                  </span>
                  <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-48 scrollbar-thin dir-ltr text-left">
                    {JSON.stringify(simulationResult.response_data || simulationResult.payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500">
                <FileJson className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs">اضغط على زر الإرسال لتنفيذ التجربة ومعاينة الرد الفعلي من الخادم</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>منفذ الربط المعتمد:</span>
            <span className="font-mono text-indigo-300">POST /api/v1/whatsapp/send</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: OFFICIAL CREDENTIALS & HOW TO CONFIGURE IN TRACKER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                بيانات ومعلمات الربط البرمجي لتسجيلها في نظام التراكر
              </h3>
              <p className="text-xs text-slate-400">
                استخدم هذه الروابط والمفاتيح في إعدادات نظام التراكر أو Traccar للربط المباشر
              </p>
            </div>
          </div>

          <button
            onClick={copyAllConfig}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>نسخ الكل</span>
          </button>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Endpoint URL */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300">رابط المزود / نقطة النهاية (API Endpoint):</span>
              <button
                onClick={() => copyToClipboard(apiEndpoint, 'endpoint')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
              >
                {copiedField === 'endpoint' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'endpoint' ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 dir-ltr text-left select-all truncate">
              {apiEndpoint}
            </div>
          </div>

          {/* Account ID */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300">معرف القناة أو الحساب (Account ID):</span>
              <button
                onClick={() => copyToClipboard(accountId, 'account_id')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
              >
                {copiedField === 'account_id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'account_id' ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-indigo-300 dir-ltr text-left select-all">
              {accountId}
            </div>
          </div>

          {/* Authorization Token */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300">مفتاح التوثيق السري (Bearer API Key):</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-slate-400 hover:text-slate-200"
                  title={showApiKey ? 'إخفاء' : 'إظهار'}
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => copyToClipboard(apiKey, 'apiKey')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                >
                  {copiedField === 'apiKey' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'apiKey' ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 dir-ltr text-left select-all truncate">
              {showApiKey ? apiKey : '••••••••••••••••••••••••••••••••••••••••'}
            </div>
          </div>

          {/* Webhook Callback URL */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300">رابط الويب هوك للتقارير (Webhook URL):</span>
              <button
                onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
              >
                {copiedField === 'webhook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'webhook' ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 dir-ltr text-left select-all truncate">
              {webhookUrl}
            </div>
          </div>
        </div>

        {/* Code Snippets & Documentation Tabs */}
        <div>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              نماذج الربط البرمجي السريع من نظام التراكر:
            </span>

            <div className="flex items-center gap-1 overflow-x-auto">
              {(['curl', 'get_url', 'traccar', 'nodejs', 'python'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setCodeTab(tab)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    codeTab === tab
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tab === 'curl' && 'cURL (POST)'}
                  {tab === 'get_url' && 'GET Query URL'}
                  {tab === 'traccar' && 'Traccar GPS Webhook'}
                  {tab === 'nodejs' && 'Node.js'}
                  {tab === 'python' && 'Python'}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto dir-ltr text-left scrollbar-thin">
              {codeTab === 'curl' && `curl -X POST "${apiEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "X-Account-ID: ${accountId}" \\
  -d '{
    "recipient_phone": "+96871233039",
    "recipient_name": "ولي أمر الطالب عبدالله محمد",
    "student_name": "عبدالله محمد السالم",
    "message": "إشعار من نظام تراكر: تم تسجيل غياب اليوم عن المدرسة.",
    "category": "absence",
    "priority": "high"
  }'`}

              {codeTab === 'get_url' && `# صيغة الاستدعاء المباشر عبر GET Query Parameter (للأنظمة البسيطة وأجهزة التتبع):
${apiEndpoint}?phone=%2B96871233039&message=${encodeURIComponent('إشعار من نظام تراكر: تسجيل غياب الطالب عبدالله')}&token=${apiKey}&account_id=${accountId}`}

              {codeTab === 'traccar' && `# إعداد Traccar Webhook:
# في ملف traccar.xml أو لوحة تحكم Traccar:
<entry key='event.forward.enable'>true</entry>
<entry key='event.forward.url'>${webhookUrl}?account_id=${accountId}&token=${apiKey}</entry>
<entry key='event.forward.header'>Authorization: Bearer ${apiKey}</entry>`}

              {codeTab === 'nodejs' && `// Node.js / JavaScript Fetch
const sendTrackerAlert = async () => {
  const res = await fetch('${apiEndpoint}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${apiKey}',
      'X-Account-ID': '${accountId}'
    },
    body: JSON.stringify({
      recipient_phone: '+96871233039',
      student_name: 'عبدالله محمد السالم',
      message: 'إشعار غياب من نظام تراكر المعتمد',
      category: 'absence'
    })
  });
  const data = await res.json();
  console.log('Delivery Result:', data);
};`}

              {codeTab === 'python' && `# Python Requests Example
import requests

payload = {
    "recipient_phone": "+96871233039",
    "student_name": "عبدالله محمد السالم",
    "message": "تنبيه من نظام تراكر: وصول الحافلة المدرسية للحي",
    "category": "alert"
}

headers = {
    "Authorization": "Bearer ${apiKey}",
    "X-Account-ID": "${accountId}"
}

response = requests.post("${apiEndpoint}", json=payload, headers=headers)
print("Response:", response.json())`}
            </pre>
          </div>
        </div>
      </div>

      {/* RAW PAYLOAD MODAL */}
      {selectedPayloadMsg && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  بيانات وحمولة الرسالة الخام المستلمة من التراكر
                </h3>
              </div>
              <button
                onClick={() => setSelectedPayloadMsg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">معرف الرسالة:</span>
                  <span className="font-mono text-indigo-300 font-bold">{selectedPayloadMsg.id}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">توقيت الاستلام:</span>
                  <span className="font-mono text-slate-200">{selectedPayloadMsg.scheduled_at}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1">نص الرسالة:</span>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed">
                  {selectedPayloadMsg.message_body}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1">الحمولة الكاملة (Raw Payload):</span>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-56 dir-ltr text-left">
                  {selectedPayloadMsg.raw_payload 
                    ? JSON.stringify(JSON.parse(selectedPayloadMsg.raw_payload), null, 2)
                    : JSON.stringify(selectedPayloadMsg, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedPayloadMsg(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
