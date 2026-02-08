// @shubhsonic
/* ============================================
   SAMATVAM LIVING — Main JS (Shared)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Navbar Scroll Effect ---
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // --- Mobile Nav Toggle (Bottom Sheet) ---
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navOverlay = document.getElementById('navOverlay');

  function openNav() {
    navMenu.classList.add('open');
    navToggle.classList.add('active');
    if (navOverlay) navOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    navMenu.classList.remove('open');
    navToggle.classList.remove('active');
    if (navOverlay) navOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.contains('open') ? closeNav() : openNav();
    });

    // Close menu on non-anchor link click (anchor links handled by smooth scroll below)
    navMenu.querySelectorAll('a').forEach(link => {
      if (!link.getAttribute('href').startsWith('#')) {
        link.addEventListener('click', closeNav);
      }
    });

    // Close on overlay click
    if (navOverlay) {
      navOverlay.addEventListener('click', closeNav);
    }
  }

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const href = this.getAttribute('href');
      const target = document.querySelector(href);
      if (!target) return;

      // If mobile nav is open, close it first then scroll after transition
      if (navMenu && navMenu.classList.contains('open')) {
        closeNav();
        setTimeout(() => {
          const y = target.getBoundingClientRect().top + window.pageYOffset - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }, 450);
      } else {
        const y = target.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

  // --- Simple fade-in observer for pages without GSAP ---
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length > 0 && !window.gsap) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    fadeEls.forEach(el => observer.observe(el));
  }

  // --- Before/After Slider ---
  document.querySelectorAll('.ba-slider').forEach(slider => {
    const before = slider.querySelector('.ba-slider__before');
    const handle = slider.querySelector('.ba-slider__handle');
    let isDragging = false;

    function setPosition(x) {
      const rect = slider.getBoundingClientRect();
      let pct = ((x - rect.left) / rect.width) * 100;
      pct = Math.max(5, Math.min(95, pct));
      before.style.width = pct + '%';
      handle.style.left = pct + '%';
    }

    slider.addEventListener('mousedown', (e) => { isDragging = true; setPosition(e.clientX); });
    window.addEventListener('mousemove', (e) => { if (isDragging) { e.preventDefault(); setPosition(e.clientX); } });
    window.addEventListener('mouseup', () => { isDragging = false; });

    slider.addEventListener('touchstart', (e) => { isDragging = true; setPosition(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('touchmove', (e) => { if (isDragging) { setPosition(e.touches[0].clientX); } }, { passive: true });
    window.addEventListener('touchend', () => { isDragging = false; });

    // Set default position to 80% (show mostly "after")
    before.style.width = '80%';
    handle.style.left = '80%';
  });

  // --- Active nav link highlight ---
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.style.opacity = '0.45';
      link.style.pointerEvents = 'none';
    }
  });

});

/* ============================================
   GLOBAL UTILITIES
   ============================================ */

// --- Global Toast ---
window.gToast = function(message, type, duration) {
  type = type || 'success';
  duration = duration || 3000;
  let toast = document.getElementById('gToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'gToast';
    toast.className = 'g-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'g-toast g-toast--' + type;
  requestAnimationFrame(() => { toast.classList.add('visible'); });
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.classList.remove('visible'); }, duration);
};

// --- Styled Confirmation Modal ---
window.gConfirm = function(title, text) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-modal">
        <div class="confirm-modal__icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <p class="confirm-modal__title">${title || 'Are you sure?'}</p>
        <p class="confirm-modal__text">${text || 'This action cannot be undone.'}</p>
        <div class="confirm-modal__actions">
          <button class="confirm-modal__btn confirm-modal__btn--cancel" data-action="cancel">Cancel</button>
          <button class="confirm-modal__btn confirm-modal__btn--danger" data-action="confirm">Delete</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    function close(result) {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 250);
      resolve(result);
    }

    overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
    overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
  });
};

// --- Form Validation ---
window.gValidate = function(formEl, rules) {
  let valid = true;
  formEl.querySelectorAll('.form-group--error').forEach(g => g.classList.remove('form-group--error'));

  for (const [name, rule] of Object.entries(rules)) {
    const input = formEl.querySelector(`[name="${name}"]`);
    if (!input) continue;
    const val = input.value.trim();
    const group = input.closest('.form-group');
    let errMsg = group ? group.querySelector('.form-error-msg') : null;

    if (!errMsg && group) {
      errMsg = document.createElement('p');
      errMsg.className = 'form-error-msg';
      group.appendChild(errMsg);
    }

    let error = null;
    if (rule.required && !val) error = rule.message || 'This field is required';
    else if (rule.email && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) error = 'Please enter a valid email';
    else if (rule.minLength && val.length < rule.minLength) error = `Minimum ${rule.minLength} characters`;

    if (error) {
      valid = false;
      if (group) group.classList.add('form-group--error');
      if (errMsg) errMsg.textContent = error;
    }
  }
  return valid;
};
