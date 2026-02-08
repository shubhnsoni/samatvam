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
  // CMS overwrite disabled — HTML is now the source of truth
  return;

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
          el.textContent = contentMap[id];
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
      twitter: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>',
      linkedin: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
      email: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
      youtube: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>',
      facebook: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>'
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
