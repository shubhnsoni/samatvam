// @shubhsonic
/* ============================================
   SAMATVAM LIVING — Geo-based Pricing
   Detects user country via IP and shows
   INR in India, USD everywhere else.
   ============================================ */

const GeoPricing = (function () {
  let _country = null;
  let _isIndia = false;
  let _ready = false;
  const _callbacks = [];

  // Detect country via free IP API (no key needed)
  async function detect() {
    if (_ready) return;
    // Check sessionStorage cache first
    const cached = sessionStorage.getItem('geo_country');
    if (cached) {
      _country = cached;
      _isIndia = cached === 'IN';
      _ready = true;
      _runCallbacks();
      return;
    }
    try {
      const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      _country = data.country_code || 'US';
      sessionStorage.setItem('geo_country', _country);
    } catch (e) {
      // Fallback: try alternative API
      try {
        const res2 = await fetch('https://ip2c.org/s', { signal: AbortSignal.timeout(3000) });
        const text = await res2.text();
        // Response format: 1;CC;CCC;Country Name
        const parts = text.split(';');
        _country = parts[1] || 'US';
        sessionStorage.setItem('geo_country', _country);
      } catch (e2) {
        _country = 'US'; // Default to US if all APIs fail
      }
    }
    _isIndia = _country === 'IN';
    _ready = true;
    _runCallbacks();
  }

  function _runCallbacks() {
    _callbacks.forEach(fn => fn(_isIndia, _country));
    _callbacks.length = 0;
  }

  function onReady(fn) {
    if (_ready) fn(_isIndia, _country);
    else _callbacks.push(fn);
  }

  // Format price based on location
  function formatPrice(usd, inr) {
    if (_isIndia && inr) {
      return '₹' + Number(inr).toLocaleString('en-IN');
    }
    if (usd) {
      return '$' + Number(usd).toLocaleString('en-US');
    }
    // Fallback: show both
    if (usd && inr) return '$' + usd + ' / ₹' + Number(inr).toLocaleString('en-IN');
    return '';
  }

  // Get currency code
  function currency() {
    return _isIndia ? 'INR' : 'USD';
  }

  function isIndia() {
    return _isIndia;
  }

  function country() {
    return _country;
  }

  // Auto-replace pricing elements on the page
  // Elements should have: data-price-usd="900" data-price-inr="75000"
  function updatePriceElements() {
    document.querySelectorAll('[data-price-usd], [data-price-inr]').forEach(el => {
      const usd = el.getAttribute('data-price-usd');
      const inr = el.getAttribute('data-price-inr');
      const formatted = formatPrice(usd, inr);
      if (formatted) el.textContent = formatted;
    });
  }

  // Initialize
  detect();

  // Auto-update prices after DOM is ready and after CMS content loads
  function autoUpdate() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        onReady(() => updatePriceElements());
      });
    } else {
      onReady(() => updatePriceElements());
    }
    // Re-run after CMS content loader finishes (delayed)
    onReady(() => {
      setTimeout(updatePriceElements, 500);
      setTimeout(updatePriceElements, 1500);
    });
  }
  autoUpdate();

  return {
    onReady,
    formatPrice,
    currency,
    isIndia,
    country,
    updatePriceElements,
    detect
  };
})();
