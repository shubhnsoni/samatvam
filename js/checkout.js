// @shubhsonic
/* ============================================
   SAMATVAM LIVING — Checkout Module
   Conditionally enables Stripe / Razorpay checkout
   on public program pages. Does nothing when
   checkout is disabled in admin settings.
   ============================================ */

(async function initCheckout() {
  if (typeof CMS === 'undefined') return;

  // Load settings
  let settings;
  try {
    const raw = await CMS.getAll(CMS.KEYS.settings);
    settings = Array.isArray(raw) ? (raw[0] || {}) : (raw || {});
  } catch (e) { return; }

  const features = settings.features || {};
  if (!features.checkout) return; // Checkout is OFF — do nothing

  const provider = settings.paymentProvider || 'stripe';
  const stripeKey = settings.stripePublishableKey || '';
  const razorpayKey = settings.razorpayKeyId || '';

  // Load programs for price data
  let programs = [];
  try {
    programs = (await CMS.getAll(CMS.KEYS.programs)) || [];
  } catch (e) { return; }

  // Build lookup: program title → program data
  const programMap = {};
  programs.forEach(p => {
    programMap[p.title] = p;
    if (p.url) programMap[p.url] = p;
  });

  // =============================================
  // TRANSFORM CTAs
  // =============================================

  // Find all offering CTA buttons and program card links
  const ctaSelectors = [
    '.offering-cta-btn',           // Homepage offering cards
    '.program-card-link',          // Programs page cards
    '.program-detail-cta'          // Program detail pages
  ];

  // Also find CTA buttons that link to contact.html inside program sections
  document.querySelectorAll('a[href="contact.html"]').forEach(link => {
    const text = link.textContent.trim().toLowerCase();
    const isCheckoutCTA = text.includes('book a discovery call') ||
                          text.includes('enroll') ||
                          text.includes('buy now') ||
                          text.includes('join waitlist');
    const inProgramSection = link.closest('.offerings, .programs-grid, .program-detail, .program-cta-section');
    if (isCheckoutCTA && inProgramSection) {
      link.classList.add('checkout-cta');
    }
  });

  ctaSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.classList.add('checkout-cta'));
  });

  // Transform each CTA
  function transformCTAs() {
    document.querySelectorAll('.checkout-cta').forEach(btn => {
      // Determine which program this CTA belongs to
      const card = btn.closest('.offering-card, .program-card, .program-detail, .program-cta-section, section');
      if (!card) return;

      // Try to find program by title in the card
      const titleEl = card.querySelector('.offering-title, h3, h1, h2');
      const title = titleEl ? titleEl.textContent.trim() : '';
      const program = programMap[title];

      if (!program) return;

      // Skip programs with no price (custom pricing, coming soon)
      const priceUsd = program.priceUsd || 0;
      const priceInr = program.priceInr || 0;
      if (priceUsd === 0 && priceInr === 0) return;

      // Skip programs that are closed or waitlist with no price
      const status = (program.status || '').toLowerCase();
      if (status === 'closed') return;

      // Show geo-localized price on button
      let priceLabel = '';
      if (typeof GeoPricing !== 'undefined') {
        priceLabel = GeoPricing.formatPrice(priceUsd, priceInr);
      }

      // Transform the button
      btn.textContent = priceLabel ? `Enroll Now — ${priceLabel}` : 'Enroll Now';
      btn.href = '#';
      btn.setAttribute('data-program-id', program.id);
      btn.setAttribute('data-program-title', program.title);
      btn.setAttribute('data-price-usd', priceUsd);
      btn.setAttribute('data-price-inr', priceInr);

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        startCheckout(program);
      });
    });
  }

  // Wait for GeoPricing to be ready, then transform CTAs
  if (typeof GeoPricing !== 'undefined') {
    GeoPricing.onReady(() => {
      transformCTAs();
      GeoPricing.updatePriceElements();
    });
  } else {
    transformCTAs();
  }

  // =============================================
  // CHECKOUT FLOWS
  // =============================================

  async function startCheckout(program) {
    // Auto-select provider based on geo-location if both are configured
    let selectedProvider = provider;
    if (typeof GeoPricing !== 'undefined' && GeoPricing.isIndia() && razorpayKey) {
      selectedProvider = 'razorpay';
    } else if (typeof GeoPricing !== 'undefined' && !GeoPricing.isIndia() && stripeKey) {
      selectedProvider = 'stripe';
    }

    if (selectedProvider === 'stripe') {
      await startStripeCheckout(program);
    } else if (selectedProvider === 'razorpay') {
      await startRazorpayCheckout(program);
    }
  }

  // --- STRIPE CHECKOUT (redirect to hosted page) ---
  async function startStripeCheckout(program) {
    if (!stripeKey) {
      if (typeof gToast === 'function') gToast('Payment not configured. Please contact us.', 'error');
      else alert('Payment not configured. Please contact us.');
      return;
    }

    // If program has a Stripe Price ID, use it directly
    if (program.stripePriceId) {
      await redirectToStripe(program.stripePriceId, program);
      return;
    }

    // Otherwise show a message to contact
    if (typeof gToast === 'function') gToast('Online payment coming soon. Please contact us to enroll.', 'info');
    else alert('Online payment coming soon. Please contact us to enroll.');
  }

  async function redirectToStripe(priceId, program) {
    // Load Stripe.js if not already loaded
    if (!window.Stripe) {
      await loadScript('https://js.stripe.com/v3/');
    }

    try {
      const stripe = window.Stripe(stripeKey);
      const successUrl = window.location.origin + '/checkout-success.html?session_id={CHECKOUT_SESSION_ID}&program=' + encodeURIComponent(program.title);
      const cancelUrl = window.location.href;

      // Record pending payment
      try {
        await CMS.create(CMS.KEYS.payments, {
          clientEmail: '',
          programId: program.id,
          programTitle: program.title,
          amount: program.priceUsd || 0,
          currency: 'usd',
          provider: 'stripe',
          status: 'pending'
        });
      } catch (e) { /* non-blocking */ }

      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        successUrl: successUrl,
        cancelUrl: cancelUrl
      });

      if (error) {
        console.error('Stripe error:', error);
        if (typeof gToast === 'function') gToast(error.message, 'error');
      }
    } catch (e) {
      console.error('Stripe checkout error:', e);
      if (typeof gToast === 'function') gToast('Checkout error. Please try again.', 'error');
    }
  }

  // --- RAZORPAY CHECKOUT (modal) ---
  async function startRazorpayCheckout(program) {
    if (!razorpayKey) {
      if (typeof gToast === 'function') gToast('Payment not configured. Please contact us.', 'error');
      else alert('Payment not configured. Please contact us.');
      return;
    }

    // Load Razorpay if not already loaded
    if (!window.Razorpay) {
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    }

    const amount = program.priceInr || 0;
    if (amount === 0) {
      if (typeof gToast === 'function') gToast('Online payment coming soon. Please contact us.', 'info');
      return;
    }

    // Record pending payment
    let paymentRecord = null;
    try {
      paymentRecord = await CMS.create(CMS.KEYS.payments, {
        clientEmail: '',
        programId: program.id,
        programTitle: program.title,
        amount: amount,
        currency: 'inr',
        provider: 'razorpay',
        status: 'pending'
      });
    } catch (e) { /* non-blocking */ }

    const options = {
      key: razorpayKey,
      amount: amount, // in paise
      currency: 'INR',
      name: 'Samatvam Living',
      description: program.title,
      prefill: {},
      theme: { color: '#4A5D4E' },
      handler: async function(response) {
        // Payment successful
        try {
          if (paymentRecord && paymentRecord.id) {
            await CMS.update(CMS.KEYS.payments, paymentRecord.id, {
              status: 'completed',
              providerPaymentId: response.razorpay_payment_id || ''
            });
          }
        } catch (e) { /* non-blocking */ }
        // Send email notifications
        if (typeof SamatvamEmail !== 'undefined') {
          await SamatvamEmail.init();
          const amountDisplay = '₹' + ((amount || 0) / 100).toLocaleString('en-IN');
          SamatvamEmail.sendPaymentConfirmation({ programTitle: program.title, amount: amountDisplay, currency: 'INR', paymentId: response.razorpay_payment_id || '' });
          SamatvamEmail.sendAdminNotification({ subject: 'New Payment: ' + program.title, type: 'payment', fromName: '', fromEmail: '', details: 'Program: ' + program.title + '\nAmount: ' + amountDisplay + '\nProvider: Razorpay\nPayment ID: ' + (response.razorpay_payment_id || '') });
        }
        window.location.href = 'checkout-success.html?provider=razorpay&program=' + encodeURIComponent(program.title);
      },
      modal: {
        ondismiss: function() {
          if (typeof gToast === 'function') gToast('Payment cancelled', 'info');
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error('Razorpay error:', e);
      if (typeof gToast === 'function') gToast('Checkout error. Please try again.', 'error');
    }
  }

  // =============================================
  // UTILITY
  // =============================================

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

})();
