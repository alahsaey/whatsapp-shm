import { 
  OutboxMessage, 
  MessageTemplate, 
  Recipient, 
  DeliveryLog, 
  GatewayConfig, 
  MessageStatus 
} from '../types/whatsapp';
import { 
  INITIAL_MESSAGES, 
  INITIAL_TEMPLATES, 
  INITIAL_RECIPIENTS, 
  INITIAL_LOGS, 
  INITIAL_GATEWAY 
} from '../data/initialData';

const STORAGE_KEYS = {
  MESSAGES: 'wa_db_messages_v1',
  TEMPLATES: 'wa_db_templates_v1',
  RECIPIENTS: 'wa_db_recipients_v1',
  LOGS: 'wa_db_logs_v1',
  GATEWAY: 'wa_db_gateway_v1',
};

class StorageService {
  private listeners: Set<() => void> = new Set();
  private syncInterval: any = null;

  constructor() {
    this.startServerSync();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  // Auto-sync with backend Express server where Tracker messages arrive
  private startServerSync() {
    if (typeof window === 'undefined') return;
    
    // Initial fetch
    this.fetchFromServer();

    // Periodic polling every 2 seconds for real-time tracker stream
    if (!this.syncInterval) {
      this.syncInterval = setInterval(() => {
        this.fetchFromServer();
      }, 2000);
    }
  }

  public async fetchFromServer() {
    try {
      const [msgRes, logRes] = await Promise.all([
        fetch('/api/messages'),
        fetch('/api/logs')
      ]);

      if (msgRes.ok) {
        const msgJson = await msgRes.json();
        if (msgJson.success && Array.isArray(msgJson.data) && msgJson.data.length > 0) {
          const localMessages = this.getMessages();
          const serverMap = new Map<string, OutboxMessage>();
          
          // Add local ones first
          localMessages.forEach(m => serverMap.set(m.id, m));
          // Overwrite / add server ones (which includes tracker incoming messages)
          msgJson.data.forEach((m: OutboxMessage) => serverMap.set(m.id, m));

          const merged = Array.from(serverMap.values()).sort((a, b) => {
            const timeA = new Date(a.scheduled_at || 0).getTime();
            const timeB = new Date(b.scheduled_at || 0).getTime();
            return timeB - timeA;
          });

          if (JSON.stringify(merged) !== JSON.stringify(localMessages)) {
            localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(merged));
            this.notify();
          }
        }
      }

      if (logRes.ok) {
        const logJson = await logRes.json();
        if (logJson.success && Array.isArray(logJson.data) && logJson.data.length > 0) {
          const localLogs = this.getLogs();
          const logMap = new Map<string, DeliveryLog>();
          localLogs.forEach(l => logMap.set(l.id, l));
          logJson.data.forEach((l: DeliveryLog) => logMap.set(l.id, l));

          const mergedLogs = Array.from(logMap.values())
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 300);

          if (JSON.stringify(mergedLogs) !== JSON.stringify(localLogs)) {
            localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(mergedLogs));
            this.notify();
          }
        }
      }
    } catch {
      // Backend offline or local fallback mode
    }
  }

  // --- Messages / Outbox ---
  public getMessages(): OutboxMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!data) {
        this.saveMessages(INITIAL_MESSAGES);
        return INITIAL_MESSAGES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_MESSAGES;
    }
  }

  public saveMessages(messages: OutboxMessage[]) {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    this.notify();
  }

  public addMessage(message: Omit<OutboxMessage, 'id' | 'status' | 'retry_count' | 'max_retries' | 'scheduled_at' | 'gateway_type'> & Partial<OutboxMessage>): OutboxMessage {
    const messages = this.getMessages();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newMessage: OutboxMessage = {
      id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'pending',
      retry_count: 0,
      max_retries: 3,
      scheduled_at: now,
      gateway_type: 'direct_socket',
      ...message,
    };
    messages.unshift(newMessage);
    this.saveMessages(messages);

    // Log the enqueue event
    this.addLog({
      message_id: newMessage.id,
      recipient_phone: newMessage.recipient_phone,
      recipient_name: newMessage.recipient_name,
      event: 'ENQUEUED',
      status: 'pending',
      details: `تم إدراج الرسالة في طابور الإرسال (Outbox) - فئة: ${newMessage.category}`,
    });

    return newMessage;
  }

  public addBatchMessages(newMsgs: Array<Omit<OutboxMessage, 'id' | 'status' | 'retry_count' | 'max_retries' | 'scheduled_at' | 'gateway_type'> & Partial<OutboxMessage>>): number {
    const messages = this.getMessages();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const formattedList: OutboxMessage[] = newMsgs.map((m, idx) => ({
      id: `msg_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
      status: 'pending',
      retry_count: 0,
      max_retries: 3,
      scheduled_at: now,
      gateway_type: 'direct_socket',
      ...m,
    }));

    const combined = [...formattedList, ...messages];
    this.saveMessages(combined);

    formattedList.forEach(item => {
      this.addLog({
        message_id: item.id,
        recipient_phone: item.recipient_phone,
        recipient_name: item.recipient_name,
        event: 'ENQUEUED',
        status: 'pending',
        details: `إدراج دفعة تلقائية: ${item.student_name || item.recipient_name}`,
      });
    });

    return formattedList.length;
  }

  public updateMessageStatus(id: string, status: MessageStatus, extras?: Partial<OutboxMessage>) {
    const messages = this.getMessages();
    const index = messages.findIndex(m => m.id === id);
    if (index === -1) return;

    const current = messages[index];
    const updated: OutboxMessage = {
      ...current,
      status,
      ...extras,
    };
    messages[index] = updated;
    this.saveMessages(messages);
  }

  public retryFailedMessage(id: string) {
    const messages = this.getMessages();
    const msg = messages.find(m => m.id === id);
    if (!msg) return;

    this.updateMessageStatus(id, 'pending', {
      failure_reason: null,
      retry_count: 0,
    });

    this.addLog({
      message_id: id,
      recipient_phone: msg.recipient_phone,
      recipient_name: msg.recipient_name,
      event: 'RETRY_SCHEDULED',
      status: 'pending',
      details: 'تمت إعادة تعيين الرسالة إلى الطابور للمحاولة مجدداً عبر المحرك المباشر',
    });
  }

  public retryAllFailed(): number {
    const messages = this.getMessages();
    let count = 0;
    messages.forEach(m => {
      if (m.status === 'failed') {
        m.status = 'pending';
        m.retry_count = 0;
        m.failure_reason = null;
        count++;
      }
    });
    if (count > 0) {
      this.saveMessages(messages);
      this.addLog({
        message_id: 'SYSTEM_BULK',
        recipient_phone: 'ALL',
        recipient_name: 'النظام',
        event: 'RETRY_SCHEDULED',
        status: 'pending',
        details: `تمت إعادة جدولة ${count} رسائل فاشلة للإرسال مجدداً في طابور العمليات`,
      });
    }
    return count;
  }

  public deleteMessage(id: string) {
    const messages = this.getMessages().filter(m => m.id !== id);
    this.saveMessages(messages);
  }

  public clearDelivered() {
    const messages = this.getMessages().filter(m => m.status !== 'delivered');
    this.saveMessages(messages);
  }

  // --- Templates ---
  public getTemplates(): MessageTemplate[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (!data) {
        this.saveTemplates(INITIAL_TEMPLATES);
        return INITIAL_TEMPLATES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TEMPLATES;
    }
  }

  public saveTemplates(templates: MessageTemplate[]) {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    this.notify();
  }

  public addTemplate(tpl: Omit<MessageTemplate, 'id' | 'updated_at'>): MessageTemplate {
    const templates = this.getTemplates();
    const newTemplate: MessageTemplate = {
      ...tpl,
      id: `tpl_${Date.now()}`,
      updated_at: new Date().toISOString().split('T')[0],
    };
    templates.push(newTemplate);
    this.saveTemplates(templates);
    return newTemplate;
  }

  public updateTemplate(id: string, updates: Partial<MessageTemplate>) {
    const templates = this.getTemplates();
    const idx = templates.findIndex(t => t.id === id);
    if (idx !== -1) {
      templates[idx] = {
        ...templates[idx],
        ...updates,
        updated_at: new Date().toISOString().split('T')[0],
      };
      this.saveTemplates(templates);
    }
  }

  public deleteTemplate(id: string) {
    const templates = this.getTemplates().filter(t => t.id !== id);
    this.saveTemplates(templates);
  }

  // --- Recipients ---
  public getRecipients(): Recipient[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECIPIENTS);
      if (!data) {
        this.saveRecipients(INITIAL_RECIPIENTS);
        return INITIAL_RECIPIENTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_RECIPIENTS;
    }
  }

  public saveRecipients(recipients: Recipient[]) {
    localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(recipients));
    this.notify();
  }

  // --- Delivery Logs ---
  public getLogs(): DeliveryLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (!data) {
        this.saveLogs(INITIAL_LOGS);
        return INITIAL_LOGS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_LOGS;
    }
  }

  public saveLogs(logs: DeliveryLog[]) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 200))); // keep latest 200
    this.notify();
  }

  public addLog(log: Omit<DeliveryLog, 'id' | 'timestamp'> & { timestamp?: string }) {
    const logs = this.getLogs();
    const newLog: DeliveryLog = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: log.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...log,
    };
    logs.unshift(newLog);
    this.saveLogs(logs);
  }

  public clearLogs() {
    this.saveLogs([]);
  }

  // --- Gateway Config ---
  public getGatewayConfig(): GatewayConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GATEWAY);
      if (!data) {
        this.saveGatewayConfig(INITIAL_GATEWAY);
        return INITIAL_GATEWAY;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_GATEWAY;
    }
  }

  public saveGatewayConfig(cfg: GatewayConfig) {
    localStorage.setItem(STORAGE_KEYS.GATEWAY, JSON.stringify(cfg));
    this.notify();
  }

  // --- Full Reset ---
  public resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(INITIAL_TEMPLATES));
    localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(INITIAL_RECIPIENTS));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
    localStorage.setItem(STORAGE_KEYS.GATEWAY, JSON.stringify(INITIAL_GATEWAY));
    this.notify();
  }
}

export const storage = new StorageService();
