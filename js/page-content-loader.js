// @shubhsonic
/* ============================================
   SAMATVAM LIVING — Page Content Loader
   Loads editable content from Supabase page_content
   table and replaces hardcoded content on public pages.

   Attributes:
     data-cms="id"      → replaces textContent
     data-cms-img="id"  → replaces img src
     data-cms-bg="id"   → replaces background-image url
     data-cms-video="id"→ stores video URL as data attr
     data-cms-link="id" → replaces href on anchor tags
   ============================================ */

(async function loadPageContent() {
  // Determine which page we're on
  const path = window.location.pathname;
  let page = 'homepage';
  if (path.includes('about')) page = 'about';
  else if (path.includes('stories')) page = 'stories';
  else if (path.includes('how-it-works')) page = 'how-it-works';
  else if (path.includes('index') || path.endsWith('/')) page = 'homepage';
  else return; // Not a managed page

  try {
    const allContent = (await CMS.getAll(CMS.KEYS.pageContent)) || [];
    const pageContent = allContent.filter(c => c.page === page);
    if (!pageContent.length) return;

    // Build a lookup map: id → value
    const contentMap = {};
    pageContent.forEach(c => { contentMap[c.id] = c.value; });

    // 1. Replace text content (data-cms)
    document.querySelectorAll('[data-cms]').forEach(el => {
      const id = el.getAttribute('data-cms');
      if (contentMap[id] !== undefined && contentMap[id] !== '') {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.value = contentMap[id];
        } else if (el.tagName === 'A' && id.includes('cta_url')) {
          el.href = contentMap[id];
        } else {
          el.innerHTML = contentMap[id];
        }
      }
    });

    // 2. Replace image src (data-cms-img)
    document.querySelectorAll('[data-cms-img]').forEach(el => {
      const id = el.getAttribute('data-cms-img');
      if (contentMap[id] && contentMap[id] !== '') {
        el.src = contentMap[id];
      }
    });

    // 3. Replace background-image (data-cms-bg)
    document.querySelectorAll('[data-cms-bg]').forEach(el => {
      const id = el.getAttribute('data-cms-bg');
      if (contentMap[id] && contentMap[id] !== '') {
        el.style.backgroundImage = `url('${contentMap[id]}')`;
      }
    });

    // 4. Store video URL as data attribute (data-cms-video)
    document.querySelectorAll('[data-cms-video]').forEach(el => {
      const id = el.getAttribute('data-cms-video');
      if (contentMap[id] && contentMap[id] !== '') {
        el.setAttribute('data-video-url', contentMap[id]);
      }
    });

    // 5. Replace href on anchor tags (data-cms-link)
    document.querySelectorAll('[data-cms-link]').forEach(el => {
      const id = el.getAttribute('data-cms-link');
      if (contentMap[id] && contentMap[id] !== '') {
        el.href = contentMap[id];
      }
    });

    // Load logo + footer from settings
    const settings = (await CMS.getAll(CMS.KEYS.settings)) || {};
    const s = Array.isArray(settings) ? (settings[0] || {}) : settings;
    if (s.logoUrl) {
      document.querySelectorAll('.navbar-brand').forEach(brand => {
        const svg = brand.querySelector('svg');
        if (svg) {
          const img = document.createElement('img');
          img.src = s.logoUrl;
          img.alt = s.siteName || 'Samatvam Living';
          img.style.height = '28px';
          img.style.width = 'auto';
          svg.replaceWith(img);
        }
      });
    }

    // --- Footer dynamic content ---
    const socialIcons = {
      instagram: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>',
      linkedin: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
      email: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
      whatsapp: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
    };

    // Social links
    const footerSocials = s.footerSocials;
    if (footerSocials && Array.isArray(footerSocials)) {
      document.querySelectorAll('.footer-socials').forEach(container => {
        const html = footerSocials
          .filter(sc => sc.enabled && sc.url)
          .map(sc => {
            const href = sc.platform === 'email' ? ('mailto:' + sc.url) : sc.url;
            const icon = socialIcons[sc.platform] || '';
            return `<a href="${href}" aria-label="${sc.platform}" target="_blank" rel="noopener">${icon}</a>`;
          }).join('');
        if (html) container.innerHTML = html;
      });
    }

    // Sitemap menu
    const footerMenu = s.footerMenu;
    if (footerMenu && Array.isArray(footerMenu)) {
      document.querySelectorAll('.footer-col').forEach(col => {
        const heading = col.querySelector('.footer-heading');
        if (heading && heading.textContent.trim() === 'Sitemap') {
          const linksEl = col.querySelector('.footer-links');
          if (linksEl) {
            linksEl.innerHTML = footerMenu
              .filter(m => m.enabled)
              .map(m => `<a href="${m.url}">${m.label}</a>`)
              .join('');
          }
        }
      });
    }

    // Legal links
    const footerLegal = s.footerLegal;
    if (footerLegal && Array.isArray(footerLegal)) {
      document.querySelectorAll('.footer-col').forEach(col => {
        const heading = col.querySelector('.footer-heading');
        if (heading && heading.textContent.trim() === 'Legal') {
          const linksEl = col.querySelector('.footer-links');
          if (linksEl) {
            linksEl.innerHTML = footerLegal
              .filter(m => m.enabled)
              .map(m => `<a href="${m.url}">${m.label}</a>`)
              .join('');
          }
        }
      });
    }

    // Contact email
    if (s.contactEmail || s.adminEmail) {
      const contactEmail = s.contactEmail || s.adminEmail;
      document.querySelectorAll('.footer-col').forEach(col => {
        const heading = col.querySelector('.footer-heading');
        if (heading && heading.textContent.trim() === 'Contact') {
          const linksEl = col.querySelector('.footer-links');
          if (linksEl) linksEl.innerHTML = `<a href="mailto:${contactEmail}">${contactEmail}</a>`;
        }
      });
    }

    // Copyright
    if (s.footerCopyright) {
      document.querySelectorAll('.footer-bottom p').forEach(p => {
        if (p.textContent.includes('©') || p.textContent.includes('Samatvam')) {
          p.textContent = s.footerCopyright;
        }
      });
    }
  } catch (e) {
    console.warn('Page content loader error:', e.message);
  }
})();
