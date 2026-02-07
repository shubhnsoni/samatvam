// @shubhsonic
/* ============================================
   SAMATVAM LIVING — Email Module (EmailJS)
   Handles all email sending: contact form,
   payment confirmations, admin notifications.
   Does nothing if email is not configured.
   ============================================ */

const SamatvamEmail = {
  _initialized: false,
  _settings: null,
  _enabled: false,

  async init() {
    if (this._initialized) return this._enabled;
    this._initialized = true;

    if (typeof CMS === 'undefined') return false;

    try {
      const raw = await CMS.getAll(CMS.KEYS.settings);
      this._settings = Array.isArray(raw) ? (raw[0] || {}) : (raw || {});
    } catch (e) { return false; }

    const s = this._settings;
    const features = s.features || {};
    if (!features.emailNotifications) return false;
    if (!s.emailjsPublicKey || !s.emailjsServiceId) return false;

    // Load EmailJS SDK
    try {
      await this._loadScript('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js');
      if (window.emailjs) {
        window.emailjs.init(s.emailjsPublicKey);
        this._enabled = true;
      }
    } catch (e) {
      console.warn('EmailJS failed to load:', e);
    }

    return this._enabled;
  },

  // --- Send contact form email (to admin + auto-reply to user) ---
  async sendContactEmail(formData) {
    if (!this._enabled) return { success: false, reason: 'not_configured' };
    const s = this._settings;
    if (!s.emailjsContactTemplate) return { success: false, reason: 'no_template' };

    try {
      await window.emailjs.send(s.emailjsServiceId, s.emailjsContactTemplate, {
        from_name: formData.name || '',
        from_email: formData.email || '',
        phone: formData.phone || '',
        interest: formData.interest || '',
        message: formData.message || '',
        to_email: s.adminEmail || s.contactEmail || '',
        site_name: s.siteName || 'Samatvam Living'
      });
      return { success: true };
    } catch (e) {
      console.warn('Contact email error:', e);
      return { success: false, reason: e.text || e.message || 'send_failed' };
    }
  },

  // --- Send payment confirmation email (to client) ---
  async sendPaymentConfirmation(data) {
    if (!this._enabled) return { success: false, reason: 'not_configured' };
    const s = this._settings;
    if (!s.emailjsPaymentTemplate) return { success: false, reason: 'no_template' };

    try {
      await window.emailjs.send(s.emailjsServiceId, s.emailjsPaymentTemplate, {
        to_email: data.clientEmail || '',
        to_name: data.clientName || '',
        program_title: data.programTitle || '',
        amount: data.amount || '',
        currency: data.currency || 'USD',
        payment_id: data.paymentId || '',
        site_name: s.siteName || 'Samatvam Living',
        support_email: s.adminEmail || s.contactEmail || ''
      });
      return { success: true };
    } catch (e) {
      console.warn('Payment email error:', e);
      return { success: false, reason: e.text || e.message || 'send_failed' };
    }
  },

  // --- Send admin notification (new inquiry or payment) ---
  async sendAdminNotification(data) {
    if (!this._enabled) return { success: false, reason: 'not_configured' };
    const s = this._settings;
    if (!s.emailjsAdminTemplate) return { success: false, reason: 'no_template' };

    try {
      await window.emailjs.send(s.emailjsServiceId, s.emailjsAdminTemplate, {
        to_email: s.adminEmail || s.contactEmail || '',
        subject: data.subject || 'New Notification',
        type: data.type || 'notification',
        from_name: data.fromName || '',
        from_email: data.fromEmail || '',
        details: data.details || '',
        site_name: s.siteName || 'Samatvam Living'
      });
      return { success: true };
    } catch (e) {
      console.warn('Admin notification error:', e);
      return { success: false, reason: e.text || e.message || 'send_failed' };
    }
  },

  // --- Send a custom/manual email (admin reply to inquiry) ---
  async sendManualEmail(data) {
    if (!this._enabled) return { success: false, reason: 'not_configured' };
    const s = this._settings;
    // Use admin template for manual replies
    const templateId = s.emailjsAdminTemplate || s.emailjsContactTemplate;
    if (!templateId) return { success: false, reason: 'no_template' };

    try {
      await window.emailjs.send(s.emailjsServiceId, templateId, {
        to_email: data.toEmail || '',
        subject: data.subject || '',
        from_name: s.siteName || 'Samatvam Living',
        from_email: s.adminEmail || s.contactEmail || '',
        details: data.body || '',
        type: 'reply',
        site_name: s.siteName || 'Samatvam Living'
      });
      return { success: true };
    } catch (e) {
      console.warn('Manual email error:', e);
      return { success: false, reason: e.text || e.message || 'send_failed' };
    }
  },

  // --- Mailchimp: subscribe email to audience list ---
  async subscribeToMailchimp(data) {
    if (!this._initialized) await this.init();
    const s = this._settings;
    const features = s ? (s.features || {}) : {};
    if (!features.mailchimp) return { success: false, reason: 'not_enabled' };
    if (!s.mailchimpFormAction || !s.mailchimpU || !s.mailchimpId) return { success: false, reason: 'not_configured' };

    // Mailchimp embedded form JSONP subscribe (client-side safe)
    const baseUrl = s.mailchimpFormAction.replace('/post?', '/post-json?');
    const params = new URLSearchParams({
      u: s.mailchimpU,
      id: s.mailchimpId,
      EMAIL: data.email || '',
      FNAME: data.firstName || data.name || '',
      LNAME: data.lastName || '',
      c: 'mcCallback' // JSONP callback
    });

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        cleanup();
        resolve({ success: false, reason: 'timeout' });
      }, 8000);

      function cleanup() {
        clearTimeout(timeout);
        delete window.mcCallback;
        const el = document.getElementById('mc-jsonp');
        if (el) el.remove();
      }

      window.mcCallback = function(resp) {
        cleanup();
        if (resp && resp.result === 'success') {
          resolve({ success: true });
        } else {
          resolve({ success: false, reason: resp ? resp.msg : 'unknown' });
        }
      };

      const script = document.createElement('script');
      script.id = 'mc-jsonp';
      script.src = baseUrl + '&' + params.toString();
      document.head.appendChild(script);
    });
  },

  // --- Utility ---
  _loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
};

// Make globally available
window.SamatvamEmail = SamatvamEmail;
