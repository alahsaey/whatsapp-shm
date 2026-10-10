import React, { useState, useEffect } from 'react';
import { storage } from './services/storageService';
import { dispatcher } from './services/dispatcherEngine';
import { OutboxMessage, MessageTemplate, Recipient, DeliveryLog, GatewayConfig } from './types/whatsapp';
import { Navbar } from './components/Navbar';
import { OutboxQueue } from './components/OutboxQueue';
import { TemplatesManager } from './components/TemplatesManager';
import { DeliveryLogs } from './components/DeliveryLogs';
import { GatewayEngine } from './components/GatewayEngine';
import { DatabaseSchemaViewer } from './components/DatabaseSchemaViewer';
import { ComposeMessageModal } from './components/ComposeMessageModal';
import { TrackerIntegrationHub } from './components/TrackerIntegrationHub';

export default function App() {
  const [activeTab, setActiveTab] = useState<'outbox' | 'templates' | 'logs' | 'gateway' | 'schema' | 'tracker'>('outbox');
  const [messages, setMessages] = useState<OutboxMessage[]>(storage.getMessages());
  const [templates, setTemplates] = useState<MessageTemplate[]>(storage.getTemplates());
  const [recipients, setRecipients] = useState<Recipient[]>(storage.getRecipients());
  const [logs, setLogs] = useState<DeliveryLog[]>(storage.getLogs());
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfig>(storage.getGatewayConfig());
  const [isQueueRunning, setIsQueueRunning] = useState<boolean>(dispatcher.getStatus().isRunning);

  // Modal to compose with selected template
  const [composeTemplateId, setComposeTemplateId] = useState<string | undefined>(undefined);
  const [isComposeDirectOpen, setIsComposeDirectOpen] = useState(false);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribeStorage = storage.subscribe(() => {
      setMessages([...storage.getMessages()]);
      setTemplates([...storage.getTemplates()]);
      setRecipients([...storage.getRecipients()]);
      setLogs([...storage.getLogs()]);
      setGatewayConfig({ ...storage.getGatewayConfig() });
    });

    const unsubscribeDispatcher = dispatcher.subscribe(status => {
      setIsQueueRunning(status.isRunning);
    });

    return () => {
      unsubscribeStorage();
      unsubscribeDispatcher();
    };
  }, []);

  const handleToggleQueue = () => {
    if (isQueueRunning) {
      dispatcher.stopQueueWorker();
    } else {
      dispatcher.startQueueWorker();
    }
  };

  const handleAddMessage = (msg: Omit<OutboxMessage, 'id' | 'status' | 'retry_count' | 'max_retries' | 'scheduled_at' | 'gateway_type'>) => {
    storage.addMessage(msg);
  };

  const handleAddBatch = (batch: Array<Omit<OutboxMessage, 'id' | 'status' | 'retry_count' | 'max_retries' | 'scheduled_at' | 'gateway_type'> & Partial<OutboxMessage>>) => {
    storage.addBatchMessages(batch);
  };

  const handleRetryMessage = (id: string) => {
    storage.retryFailedMessage(id);
  };

  const handleRetryAllFailed = () => {
    storage.retryAllFailed();
  };

  const handleDeleteMessage = (id: string) => {
    storage.deleteMessage(id);
  };

  const handleClearDelivered = () => {
    storage.clearDelivered();
  };

  const handleSendNow = async (id: string) => {
    await dispatcher.dispatchSingleMessage(id);
  };

  const handleResetData = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين قاعدة البيانات إلى حالتها النموذجية؟')) {
      dispatcher.stopQueueWorker();
      storage.resetToDefaults();
    }
  };

  const handleUseTemplateInCompose = (tplId: string) => {
    setComposeTemplateId(tplId);
    setIsComposeDirectOpen(true);
  };

  const handleDirectTestSend = async (phone: string, text: string): Promise<boolean> => {
    const msg = storage.addMessage({
      recipient_name: 'مستلم الاختبار التجريبي',
      recipient_phone: phone,
      category: 'custom',
      variables: {},
      message_body: text,
      priority: 'urgent',
    });
    return await dispatcher.dispatchSingleMessage(msg.id);
  };

  const pendingCount = messages.filter(m => m.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gatewayConfig={gatewayConfig}
        isQueueRunning={isQueueRunning}
        onToggleQueue={handleToggleQueue}
        pendingCount={pendingCount}
        onResetData={handleResetData}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'outbox' && (
          <OutboxQueue
            messages={messages}
            templates={templates}
            recipients={recipients}
            isQueueRunning={isQueueRunning}
            onToggleQueue={handleToggleQueue}
            onAddMessage={handleAddMessage}
            onAddBatch={handleAddBatch}
            onRetryMessage={handleRetryMessage}
            onRetryAllFailed={handleRetryAllFailed}
            onDeleteMessage={handleDeleteMessage}
            onClearDelivered={handleClearDelivered}
            onSendNow={handleSendNow}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesManager
            templates={templates}
            onAddTemplate={tpl => storage.addTemplate(tpl)}
            onUpdateTemplate={(id, u) => storage.updateTemplate(id, u)}
            onDeleteTemplate={id => storage.deleteTemplate(id)}
            onUseInCompose={handleUseTemplateInCompose}
          />
        )}

        {activeTab === 'logs' && (
          <DeliveryLogs
            logs={logs}
            onClearLogs={() => storage.clearLogs()}
          />
        )}

        {activeTab === 'gateway' && (
          <GatewayEngine
            config={gatewayConfig}
            onUpdateConfig={cfg => storage.saveGatewayConfig(cfg)}
            onDirectTestSend={handleDirectTestSend}
          />
        )}

        {activeTab === 'schema' && (
          <DatabaseSchemaViewer />
        )}

        {activeTab === 'tracker' && (
          <TrackerIntegrationHub
            messages={messages}
            onSimulateTrackerMessage={handleAddMessage}
            senderPhone={gatewayConfig.phone_number || '96871233039'}
            onSendNow={handleSendNow}
            onDeleteMessage={handleDeleteMessage}
            onRetryMessage={handleRetryMessage}
          />
        )}
      </main>

      {/* Compose modal directly triggered from template tab */}
      <ComposeMessageModal
        isOpen={isComposeDirectOpen}
        onClose={() => {
          setIsComposeDirectOpen(false);
          setComposeTemplateId(undefined);
        }}
        templates={templates}
        recipients={recipients}
        initialTemplateId={composeTemplateId}
        onAddMessage={handleAddMessage}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            نظام وقاعدة بيانات <span className="text-slate-300 font-semibold">مراسلات واتساب</span> · طابور الإرسال والمحرك المباشر
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>Direct Socket Driver</span>
            <span>·</span>
            <span>PostgreSQL & Firestore Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
