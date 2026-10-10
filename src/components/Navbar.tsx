import React from 'react';
import { 
  Database, 
  Send, 
  FileText, 
  Activity, 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  Play, 
  Pause,
  Key
} from 'lucide-react';
import { GatewayConfig } from '../types/whatsapp';

interface NavbarProps {
  activeTab: 'outbox' | 'templates' | 'logs' | 'gateway' | 'schema' | 'tracker';
  setActiveTab: (tab: 'outbox' | 'templates' | 'logs' | 'gateway' | 'schema' | 'tracker') => void;
  gatewayConfig: GatewayConfig;
  isQueueRunning: boolean;
  onToggleQueue: () => void;
  pendingCount: number;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  gatewayConfig,
  isQueueRunning,
  onToggleQueue,
  pendingCount,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-100 tracking-tight">
                  مراسلات واتساب
                </span>
                <span className="hidden sm:inline-block text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  Outbox & DB Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                طابور الإرسال · سجل الحالة · إدارة القوالب · محرك الاتصال المباشر
              </p>
            </div>
          </div>

          {/* Quick Queue Status & Worker Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleQueue}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isQueueRunning
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
              }`}
              title={isQueueRunning ? 'إيقاف طابور المعالجة المباشر مؤقتاً' : 'تشغيل محرك الإرسال المباشر'}
            >
              {isQueueRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                  <span>المحرك يعمل ({pendingCount} معلقة)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span>تشغيل الطابور ({pendingCount})</span>
                </>
              )}
            </button>

            {/* Direct Driver Status Badge */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  gatewayConfig.session_status === 'connected' ? 'bg-emerald-400' : 'bg-rose-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  gatewayConfig.session_status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}></span>
              </span>
              <span>محرك الاتصال المباشر: </span>
              <span className="font-semibold text-emerald-400">
                {gatewayConfig.session_status === 'connected' ? 'متصل' : 'غير متصل'}
              </span>
            </div>

            {/* Reset sample data */}
            <button
              onClick={onResetData}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="إعادة تعيين البيانات النموذجية"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 rtl:space-x-reverse overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/60 pt-1">
          <button
            onClick={() => setActiveTab('outbox')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'outbox'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>طابور الإرسال (Outbox)</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500/20 text-amber-300 text-xs px-1.5 py-0.5 rounded font-mono">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'templates'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>إدارة القوالب والمتغيرات</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'logs'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>سجل الحالة والتدقيق (Delivery Logs)</span>
          </button>

          <button
            onClick={() => setActiveTab('gateway')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'gateway'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>محرك الاتصال المباشر (Driver/Gateway)</span>
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'tracker'
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Key className="w-4 h-4 text-indigo-400" />
            <span>الربط مع نظام تراكر (Tracker API)</span>
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
              جديد
            </span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'schema'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>هندسة قاعدة البيانات واستعلامات SQL</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
