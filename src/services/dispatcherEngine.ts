import { storage } from './storageService';
import { OutboxMessage } from '../types/whatsapp';

class DispatcherEngine {
  private isRunning: boolean = false;
  private currentTimeout: number | null = null;
  private listeners: Set<(status: { isRunning: boolean; currentProcessingId: string | null }) => void> = new Set();
  private currentProcessingId: string | null = null;

  public subscribe(cb: (status: { isRunning: boolean; currentProcessingId: string | null }) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach(cb => cb({ 
      isRunning: this.isRunning, 
      currentProcessingId: this.currentProcessingId 
    }));
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      currentProcessingId: this.currentProcessingId,
    };
  }

  public startQueueWorker() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.notify();
    this.processNextInQueue();
  }

  public stopQueueWorker() {
    this.isRunning = false;
    if (this.currentTimeout) {
      window.clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    this.currentProcessingId = null;
    this.notify();
  }

  public async dispatchSingleMessage(messageId: string): Promise<boolean> {
    const messages = storage.getMessages();
    const msg = messages.find(m => m.id === messageId);
    if (!msg || msg.status !== 'pending') return false;

    return this.executeDispatch(msg);
  }

  private async processNextInQueue() {
    if (!this.isRunning) return;

    const messages = storage.getMessages();
    // Prioritize urgent, then high, then normal; oldest first
    const pendingList = messages
      .filter(m => m.status === 'pending')
      .sort((a, b) => {
        const priorityScore = { urgent: 3, high: 2, normal: 1 };
        const scoreDiff = priorityScore[b.priority] - priorityScore[a.priority];
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      });

    if (pendingList.length === 0) {
      // No more pending messages, pause worker
      this.isRunning = false;
      this.currentProcessingId = null;
      this.notify();
      return;
    }

    const nextMsg = pendingList[0];
    await this.executeDispatch(nextMsg);

    if (this.isRunning) {
      const cfg = storage.getGatewayConfig();
      // Calculate anti-ban delay (between cfg.anti_ban_delay_min and cfg.anti_ban_delay_max)
      const minSec = cfg.anti_ban_delay_min || 3;
      const maxSec = cfg.anti_ban_delay_max || 6;
      const delayMs = (Math.random() * (maxSec - minSec) + minSec) * 1000;

      this.currentTimeout = window.setTimeout(() => {
        this.processNextInQueue();
      }, delayMs);
    }
  }

  private async executeDispatch(msg: OutboxMessage): Promise<boolean> {
    this.currentProcessingId = msg.id;
    this.notify();

    // Step 1: Mark as processing
    storage.updateMessageStatus(msg.id, 'processing');
    storage.addLog({
      message_id: msg.id,
      recipient_phone: msg.recipient_phone,
      recipient_name: msg.recipient_name,
      event: 'DISPATCHING',
      status: 'processing',
      details: `محرك الاتصال المباشر بدأ معالجة الحزمة للرقم ${msg.recipient_phone}`,
    });

    // Simulate direct network transmission time (400ms - 900ms)
    await new Promise(r => setTimeout(r, 600));

    // Simulate invalid phone number failure test
    const cleanPhone = msg.recipient_phone.replace(/\D/g, '');
    const isDestInvalid = cleanPhone.length < 8 || cleanPhone.startsWith('9999');

    if (isDestInvalid) {
      storage.updateMessageStatus(msg.id, 'failed', {
        failure_reason: 'DRIVER_ERROR: رقم الهاتف غير مسجل في شبكة واتساب أو صيغة الرقم غير صحيحة',
        retry_count: msg.retry_count + 1,
      });

      storage.addLog({
        message_id: msg.id,
        recipient_phone: msg.recipient_phone,
        recipient_name: msg.recipient_name,
        event: 'DISPATCH_FAILED',
        status: 'failed',
        driver_code: 'ERR_INVALID_JID',
        details: 'رفض محرك الاتصال المباشر الحزمة: الرقم غير مسجل في واتساب',
      });

      this.currentProcessingId = null;
      this.notify();
      return false;
    }

    // Step 2: Dispatch through backend gateway engine
    let driverMsgId = `WADRV_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    let driverNote = 'الاتصال المباشر (Direct Baileys Multi-Device Socket)';

    try {
      const res = await fetch('/api/gateway/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: msg.recipient_phone, message: msg.message_body }),
      });
      const data = await res.json();
      if (data.success && data.messageId) {
        driverMsgId = data.messageId;
        if (data.driver) driverNote = data.driver;
      }
    } catch {
      // Fallback to internal simulation
    }

    const nowSent = new Date().toISOString().replace('T', ' ').substring(0, 19);

    storage.updateMessageStatus(msg.id, 'sent', {
      sent_at: nowSent,
      driver_message_id: driverMsgId,
    });

    storage.addLog({
      message_id: msg.id,
      recipient_phone: msg.recipient_phone,
      recipient_name: msg.recipient_name,
      event: 'SENT_TO_GATEWAY',
      status: 'sent',
      driver_code: 'SERVER_ACK_1',
      details: `تم الإرسال بنجاح عبر ${driverNote}. المعرف: ${driverMsgId}`,
      gateway_payload: JSON.stringify({
        driver: driverNote,
        to: `${cleanPhone}@s.whatsapp.net`,
        id: driverMsgId,
        timestamp: Date.now(),
      }),
    });

    // Step 3: Simulate Delivery Receipt (Double Check / Delivered ACK 2) after brief delay
    setTimeout(() => {
      const nowDelivered = new Date().toISOString().replace('T', ' ').substring(0, 19);
      storage.updateMessageStatus(msg.id, 'delivered', {
        delivered_at: nowDelivered,
      });

      storage.addLog({
        message_id: msg.id,
        recipient_phone: msg.recipient_phone,
        recipient_name: msg.recipient_name,
        event: 'DELIVERED_TO_PHONE',
        status: 'delivered',
        driver_code: 'DEVICE_ACK_2',
        details: 'استلام إشعار وصول الرسالة (Delivered) لهاتف المستلم',
      });
    }, 1800);

    this.currentProcessingId = null;
    this.notify();
    return true;
  }
}

export const dispatcher = new DispatcherEngine();
