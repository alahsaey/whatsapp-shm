// =================================================================
// محرك الاتصال المباشر لواتساب (Direct Baileys Gateway Server)
// نظام: مراسلات واتساب | WhatsApp Correspondence System
// يعمل بدون أي طرف ثالث أو شركات وسيطة - مجاني 100% وآمن
// المتطلبات: Node.js 18+ | مكتبة @whiskeysockets/baileys
// التشغيل: node whatsapp-direct-driver.js
// =================================================================
import makeWASocket, { 
  useMultiFileAuthState, 
  DisconnectReason 
} from '@whiskeysockets/baileys';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
let isWhatsAppConnected = false;
let waSocket = null;

async function startWhatsAppGateway() {
  console.log('🔄 جاري بدء جلسة المقبس المباشر مع خوادم واتساب...');
  const { state, saveCreds } = await useMultiFileAuthState('auth_session');
  
  waSocket = makeWASocket({
    auth: state,
    printQRInTerminal: true, // يطبع الباركود الرسمي المشفر مباشرة في شاشة التيرمينال
    browser: ['مراسلات واتساب', 'Chrome', '124.0.0.0']
  });

  waSocket.ev.on('creds.update', saveCreds);

  waSocket.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('📌 تم استلام باركود تشفير رسمي من واتساب. امسحه الآن من تطبيق واتساب في هاتفك!');
    }
    if (connection === 'close') {
      isWhatsAppConnected = false;
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('⚠️ انقطع الاتصال، جاري المحاولة تلقائياً:', shouldReconnect);
      if (shouldReconnect) startWhatsAppGateway();
    } else if (connection === 'open') {
      isWhatsAppConnected = true;
      console.log('✅ تم الارتباط الفعلي المباشر بشبكة واتساب بنجاح! جاهز لاستقبال رسائل الطابور.');
    }
  });

  // فحص حالة الخادم
  app.get('/status', (req, res) => {
    res.json({ 
      connected: isWhatsAppConnected,
      engine: 'Direct Baileys Web Socket',
      status: isWhatsAppConnected ? 'ONLINE' : 'WAITING_QR_SCAN'
    });
  });

  // استقبال وإرسال الرسائل من طابور قاعدة البيانات
  app.post('/api/dispatch', async (req, res) => {
    try {
      const { phone, message } = req.body;
      if (!phone || !message) {
        return res.status(400).json({ success: false, error: 'phone and message are required' });
      }

      if (!isWhatsAppConnected || !waSocket) {
        return res.status(503).json({ 
          success: false, 
          error: 'واتساب غير متصل حالياً، يرجى مسح الباركود أولاً في شاشة السيرفر' 
        });
      }

      const cleanPhone = phone.replace(/\D/g, '');
      const jid = `${cleanPhone}@s.whatsapp.net`;
      
      const sent = await waSocket.sendMessage(jid, { text: message });
      console.log(`📤 تم إرسال الرسالة بنجاح إلى: ${cleanPhone} [المعرف: ${sent.key.id}]`);

      res.json({ 
        success: true, 
        messageId: sent.key.id,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('❌ خطأ في الإرسال:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀 خادم محرك واتساب يعمل الآن على المنفذ: http://localhost:${PORT}`);
    console.log(`📡 يمكنك ربطه بتطبيق قاعدة بيانات مراسلات واتساب مباشرة عبر Local Gateway URL.`);
  });
}

startWhatsAppGateway();
