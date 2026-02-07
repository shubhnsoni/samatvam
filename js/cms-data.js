// @shubhsonic
/* ============================================
   SAMATVAM LIVING — CMS Data Layer
   Supabase-powered with localStorage cache

   All methods are async. Callers must use:
     const data = await CMS.getAll('programs');

   Falls back to localStorage if Supabase is
   unavailable (offline mode).
   ============================================ */

const CMS = {
  // --- Table names (match Supabase schema) ---
  KEYS: {
    programs: 'programs',
    testimonials: 'testimonials',
    founders: 'founders',
    resources: 'resources',
    focusTemplates: 'focus_templates',
    blogPosts: 'blog_posts',
    clients: 'clients',
    settings: 'settings',
    courses: 'courses',
    lessonProgress: 'lesson_progress',
    contactSubmissions: 'contact_submissions',
    pageContent: 'page_content',
    stories: 'stories',
    reflections: 'reflections',
    payments: 'payments'
  },

  // --- Column mapping: JS camelCase → DB snake_case ---
  _toSnake: {
    idealFor: 'ideal_for',
    imageUrl: 'image_url',
    sortOrder: 'sort_order',
    displayOn: 'display_on',
    whyItMatters: 'why_it_matters',
    goodEnough: 'good_enough',
    coachTip: 'coach_tip',
    authUserId: 'auth_user_id',
    totalWeeks: 'total_weeks',
    enrolledDate: 'enrolled_date',
    lastActive: 'last_active',
    coachNotes: 'coach_notes',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    siteName: 'site_name',
    contactEmail: 'contact_email',
    whatsappNumber: 'whatsapp_number',
    footerTagline: 'footer_tagline',
    programAvailability: 'program_availability',
    clientId: 'client_id',
    lessonId: 'lesson_id',
    watchedSeconds: 'watched_seconds',
    lastWatched: 'last_watched',
    logoUrl: 'logo_url',
    ctaText: 'cta_text',
    ctaUrl: 'cta_url',
    beforeText: 'before_text',
    afterText: 'after_text',
    authorName: 'author_name',
    authorRole: 'author_role',
    imgBefore: 'img_before',
    imgAfter: 'img_after',
    videoUrl: 'video_url',
    displayOn: 'display_on',
    focusTitle: 'focus_title',
    coachFeedback: 'coach_feedback',
    assignedFocus: 'assigned_focus',
    priceUsd: 'price_usd',
    priceInr: 'price_inr',
    stripePriceId: 'stripe_price_id',
    razorpayPlanId: 'razorpay_plan_id',
    stripePublishableKey: 'stripe_publishable_key',
    stripeSecretKey: 'stripe_secret_key',
    razorpayKeyId: 'razorpay_key_id',
    razorpayKeySecret: 'razorpay_key_secret',
    paymentProvider: 'payment_provider',
    clientEmail: 'client_email',
    clientName: 'client_name',
    programId: 'program_id',
    programTitle: 'program_title',
    providerPaymentId: 'provider_payment_id',
    providerSessionId: 'provider_session_id',
    emailjsPublicKey: 'emailjs_public_key',
    emailjsServiceId: 'emailjs_service_id',
    emailjsContactTemplate: 'emailjs_contact_template',
    emailjsPaymentTemplate: 'emailjs_payment_template',
    emailjsAdminTemplate: 'emailjs_admin_template',
    adminEmail: 'admin_email',
    mailchimpFormAction: 'mailchimp_form_action',
    mailchimpU: 'mailchimp_u',
    mailchimpId: 'mailchimp_id',
    footerSocials: 'footer_socials',
    footerMenu: 'footer_menu',
    footerLegal: 'footer_legal',
    footerCopyright: 'footer_copyright'
  },

  _toCamel: null, // built on init

  _buildCamelMap() {
    this._toCamel = {};
    for (const [camel, snake] of Object.entries(this._toSnake)) {
      this._toCamel[snake] = camel;
    }
  },

  // Convert JS object keys to snake_case for DB
  _toDbRow(obj) {
    const row = {};
    for (const [key, val] of Object.entries(obj)) {
      const dbKey = this._toSnake[key] || key;
      row[dbKey] = val;
    }
    return row;
  },

  // Convert DB row keys to camelCase for JS
  _toJsObj(row) {
    if (!this._toCamel) this._buildCamelMap();
    const obj = {};
    for (const [key, val] of Object.entries(row)) {
      const jsKey = this._toCamel[key] || key;
      obj[jsKey] = val;
    }
    return obj;
  },

  // Convert array of DB rows to JS objects
  _toJsArray(rows) {
    return (rows || []).map(r => this._toJsObj(r));
  },

  // --- localStorage cache helpers ---
  _cacheKey(table) {
    return 'samatvam_' + table;
  },

  _cacheGet(table) {
    try {
      const data = localStorage.getItem(this._cacheKey(table));
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  },

  _cacheSet(table, data) {
    try {
      localStorage.setItem(this._cacheKey(table), JSON.stringify(data));
    } catch (e) { /* quota exceeded — ignore */ }
  },

  // --- Check if Supabase is available ---
  _hasSupabase() {
    return typeof supabaseClient !== 'undefined' && supabaseClient;
  },

  // --- Generic CRUD (async, Supabase-first, localStorage fallback) ---

  async getAll(table) {
    if (this._hasSupabase()) {
      try {
        const { data, error } = await supabaseClient.from(table).select('*');
        if (error) throw error;
        const jsData = this._toJsArray(data);
        this._cacheSet(table, jsData);
        return jsData;
      } catch (e) {
        console.warn('CMS.getAll Supabase error, using cache:', e.message);
      }
    }
    return this._cacheGet(table);
  },

  async saveAll(table, data) {
    // For settings (singleton object, not array)
    if (table === this.KEYS.settings && !Array.isArray(data)) {
      return this.update(table, 'settings', data);
    }
    this._cacheSet(table, data);
    return true;
  },

  async getById(table, id) {
    if (this._hasSupabase()) {
      try {
        const { data, error } = await supabaseClient.from(table).select('*').eq('id', id).single();
        if (error) throw error;
        return this._toJsObj(data);
      } catch (e) {
        console.warn('CMS.getById Supabase error, using cache:', e.message);
      }
    }
    const items = this._cacheGet(table);
    if (!items) return null;
    if (Array.isArray(items)) return items.find(item => item.id === id) || null;
    return items; // singleton like settings
  },

  async add(table, item) {
    const dbRow = this._toDbRow(item);
    // Generate ID if not provided
    if (!dbRow.id) {
      const prefix = table.substring(0, 4);
      dbRow.id = prefix + '-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    if (this._hasSupabase()) {
      try {
        const { data, error } = await supabaseClient.from(table).insert(dbRow).select().single();
        if (error) throw error;
        return this._toJsObj(data);
      } catch (e) {
        console.error('CMS.add Supabase error:', e.message);
        return null;
      }
    }
    // Fallback: localStorage
    const items = this._cacheGet(table) || [];
    item.id = dbRow.id;
    item.createdAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    items.push(item);
    this._cacheSet(table, items);
    return item;
  },

  async update(table, id, updates) {
    const dbUpdates = this._toDbRow(updates);
    // Remove id from updates to avoid overwriting PK
    delete dbUpdates.id;

    if (this._hasSupabase()) {
      try {
        const { data, error } = await supabaseClient.from(table).update(dbUpdates).eq('id', id).select().single();
        if (error) throw error;
        return this._toJsObj(data);
      } catch (e) {
        console.error('CMS.update Supabase error:', e.message);
        return null;
      }
    }
    // Fallback: localStorage
    const items = this._cacheGet(table);
    if (!items) return null;
    if (Array.isArray(items)) {
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return null;
      items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
      this._cacheSet(table, items);
      return items[index];
    }
    // Singleton (settings)
    const merged = { ...items, ...updates, updatedAt: new Date().toISOString() };
    this._cacheSet(table, merged);
    return merged;
  },

  async remove(table, id) {
    if (this._hasSupabase()) {
      try {
        const { error } = await supabaseClient.from(table).delete().eq('id', id);
        if (error) throw error;
        return true;
      } catch (e) {
        console.error('CMS.remove Supabase error:', e.message);
        return false;
      }
    }
    // Fallback: localStorage
    const items = this._cacheGet(table);
    if (!items || !Array.isArray(items)) return false;
    const filtered = items.filter(item => item.id !== id);
    this._cacheSet(table, filtered);
    return true;
  },

  // --- Auth helpers ---
  async getSession() {
    if (!this._hasSupabase()) return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  },

  async getUserRole() {
    const session = await this.getSession();
    if (!session) return null;
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (error) throw error;
      return data.role;
    } catch (e) {
      console.warn('getUserRole error:', e.message);
      return null;
    }
  },

  async signIn(email, password) {
    if (!this._hasSupabase()) return { error: { message: 'Supabase not available' } };
    return supabaseClient.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    if (!this._hasSupabase()) return;
    return supabaseClient.auth.signOut();
  },

  async signInWithMagicLink(email) {
    if (!this._hasSupabase()) return { error: { message: 'Supabase not available' } };
    return supabaseClient.auth.signInWithOtp({ email });
  },

  // --- Contact form submission (no auth required) ---
  async submitContactForm(formData) {
    const dbRow = this._toDbRow(formData);
    if (this._hasSupabase()) {
      try {
        const { data, error } = await supabaseClient.from('contact_submissions').insert(dbRow).select().single();
        if (error) throw error;
        return { success: true, data: this._toJsObj(data) };
      } catch (e) {
        console.error('Contact form error:', e.message);
        return { success: false, error: e.message };
      }
    }
    return { success: false, error: 'Supabase not available' };
  },

  // --- File Upload to Hostinger (via PHP endpoint) ---
  async uploadToServer(file, folder = 'general') {
    if (!this._hasSupabase()) return { url: null, error: 'Auth not available' };
    try {
      // Get current session token for auth
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) return { url: null, error: 'Not logged in' };

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('token', session.access_token);

      // POST to PHP upload endpoint (same origin on Hostinger)
      const response = await fetch('/api/upload.php', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Upload failed');
      }

      return { url: result.url, path: result.path, error: null };
    } catch (e) {
      console.error('Server upload error:', e.message);
      return { url: null, error: e.message };
    }
  },

  // --- File Upload to Supabase Storage (logo only) ---
  async uploadFile(file, folder = 'general') {
    if (!this._hasSupabase()) return { url: null, error: 'Supabase not available' };
    try {
      // Generate unique filename: folder/timestamp-originalname
      const ext = file.name.split('.').pop();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `${folder}/${Date.now()}-${safeName}`;

      const { data, error } = await supabaseClient.storage
        .from('media')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabaseClient.storage
        .from('media')
        .getPublicUrl(data.path);

      return { url: urlData.publicUrl, path: data.path, error: null };
    } catch (e) {
      console.error('Upload error:', e.message);
      return { url: null, error: e.message };
    }
  },

  async deleteFile(path) {
    if (!this._hasSupabase()) return { error: 'Supabase not available' };
    try {
      const { error } = await supabaseClient.storage
        .from('media')
        .remove([path]);
      if (error) throw error;
      return { error: null };
    } catch (e) {
      console.error('Delete file error:', e.message);
      return { error: e.message };
    }
  },

  getPublicUrl(path) {
    if (!this._hasSupabase()) return '';
    const { data } = supabaseClient.storage
      .from('media')
      .getPublicUrl(path);
    return data.publicUrl || '';
  },

  // --- No-op: seed data lives in SQL now ---
  initDefaults() {
    // Seed data is handled by supabase/migrations/002_seed_data.sql
    // This method is kept for backward compatibility but does nothing.
  }
};
