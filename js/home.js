// @shubhsonic
/* ============================================
   SAMATVAM LIVING — Homepage Animations & Interactions
   GSAP + ScrollTrigger for scroll animations
   Testimonial carousel, offering toggles, scroll progress
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {

  // =============================================
  // SCROLL PROGRESS BAR
  // =============================================
  const scrollProgress = document.getElementById('scrollProgress');
  if (scrollProgress) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      scrollProgress.style.transform = 'scaleX(' + progress + ')';
    });
  }

  // =============================================
  // OFFERING EXPAND/COLLAPSE TOGGLES
  // =============================================
  document.querySelectorAll('.offering-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const details = document.getElementById(targetId);
      if (!details) return;

      const isActive = details.classList.contains('active');
      // Close all others
      document.querySelectorAll('.offering-details.active').forEach(d => d.classList.remove('active'));
      document.querySelectorAll('.offering-toggle.active').forEach(b => {
        b.classList.remove('active');
        b.innerHTML = 'Learn More <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
      });

      if (!isActive) {
        details.classList.add('active');
        btn.classList.add('active');
        btn.innerHTML = 'Show Less <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
      }
    });
  });

  // =============================================
  // TESTIMONIAL CAROUSEL (dynamic from Supabase)
  // =============================================

  // Fallback data if Supabase unavailable
  const fallbackTestimonials = [
    { quote: "He took the stress out of the entire programme so this was not just a diet plan. He focuses on being happy and content throughout the journey, which is something which we haven't seen with other coaches before, and we've known coaches to be uber pushy, especially when it comes to achieving a goal — this was not the case with Hritwik.", author: 'Dhruvi and Ankit', role: 'Financial Analysts', result: 'Lost 17 kgs in 3 months', beforeImg: '', afterImg: '', videoUrl: '' },
    { quote: 'Working with Hritwik for four months has been transformative. I have lost 7 kg, improved my health, and adopted sustainable habits. His flexible approach focuses on fat loss, muscle gain, and practical nutrition, while incorporating mindfulness practices like pranayama and yoga. With his guidance, I\'ve improved thyroid function, reduced sugar intake, and enhanced my energy, immunity, skin, hair, and sleep quality.', author: 'Disha Jain', role: 'Actuary', result: 'Lost 7 kg, improved thyroid', beforeImg: '', afterImg: '', videoUrl: '' },
    { quote: 'Working with Hritwik has been life-changing. Despite being a paraplegic, I lost 7 kg in six months, thanks to his tailored nutrition plan and logical guidance. I feel more energetic, less hungry, and free from unhealthy cravings. His comprehensive framework empowers sustainable changes, and his approachable nature makes the journey even better.', author: 'Adeep Jain', role: 'Actuary', result: 'Lost 7 kg in 6 months', beforeImg: '', afterImg: '', videoUrl: '' },
    { quote: 'I have lost 20 kg in 5 months, but this was more than just weight loss — it was a complete lifestyle transformation. Hritwik\'s program focused on sustainable habits, from improving sleep and customizing workouts to providing real-time meal feedback and healthy choices while traveling. His holistic approach and constant support made a huge difference, helping me achieve balance physically, emotionally, and mentally.', author: 'Myraa', role: 'Chartered Accountant', result: 'Lost 20 kg in 5 months', beforeImg: '', afterImg: '', videoUrl: '' },
    { quote: 'After years of gut issues, acidity, weight gain, and thyroid imbalance, this program completely changed my health. In one year, my gut improved, antacids stopped, thyroid levels normalized, and I lost over 10 kg — without any strict dieting. The biggest value was understanding my body. The habits I learned are now part of my lifestyle and benefit my entire family. Truly a transformative experience.', author: 'Reetika Jain', role: 'Age 46, Middle East', result: 'Lost 10+ kg, thyroid normalized', beforeImg: '', afterImg: '', videoUrl: '' }
  ];

  // Load testimonials from Supabase (filtered to homepage)
  let testimonials = fallbackTestimonials;
  try {
    if (typeof CMS !== 'undefined') {
      const dbTestimonials = (await CMS.getAll(CMS.KEYS.testimonials)) || [];
      const homepageTestimonials = dbTestimonials
        .filter(t => !t.displayOn || t.displayOn.length === 0 || t.displayOn.includes('homepage'))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(t => ({
          quote: t.quote || '',
          author: t.author || '',
          role: t.program || '',
          result: t.result || '',
          beforeImg: t.imgBefore || '',
          afterImg: t.imgAfter || '',
          videoUrl: t.videoUrl || ''
        }));
      if (homepageTestimonials.length) testimonials = homepageTestimonials;
    }
  } catch (e) {
    console.warn('Testimonials load error, using fallback:', e.message);
  }

  const carouselEl = document.getElementById('testimonialCarousel');
  if (carouselEl && testimonials.length) {
    const baBeforeImg = document.getElementById('baBeforeImg');
    const baAfterImg = document.getElementById('baAfterImg');
    const baSlider = document.getElementById('baSlider');
    const baAfter = document.getElementById('baAfter');
    const baHandle = document.getElementById('baHandle');
    const videoBtn = document.getElementById('testimonialVideoBtn');
    const quoteEl = document.getElementById('testimonialQuote');
    const nameEl = document.getElementById('testimonialName');
    const roleEl = document.getElementById('testimonialRole');
    const resultEl = document.getElementById('testimonialResult');
    const dotsEl = document.getElementById('testimonialDots');
    const prevBtn = document.getElementById('testimonialPrev');
    const nextBtn = document.getElementById('testimonialNext');

    // Video modal elements
    const videoModal = document.getElementById('videoModal');
    const videoModalBackdrop = document.getElementById('videoModalBackdrop');
    const videoModalClose = document.getElementById('videoModalClose');
    const videoModalPlayer = document.getElementById('videoModalPlayer');

    let activeIndex = 0;
    let isPaused = false;

    // Build dots
    testimonials.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'testimonial-carousel__dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    });

    function render() {
      const t = testimonials[activeIndex];
      const hasBoth = t.beforeImg && t.afterImg;
      const hasSingle = !hasBoth && (t.beforeImg || t.afterImg);
      const mediaEl = carouselEl.querySelector('.testimonial-carousel__media');
      const sliderEl = document.getElementById('baSlider');

      if (hasBoth) {
        baBeforeImg.src = t.beforeImg;
        baBeforeImg.alt = t.author + ' — Before';
        baAfterImg.src = t.afterImg;
        baAfterImg.alt = t.author + ' — After';
        baAfterImg.style.objectPosition = '';
        if (mediaEl) mediaEl.style.display = '';
        if (sliderEl) sliderEl.style.display = '';
        // Reset slider to 50%
        baAfter.style.clipPath = 'inset(0 0 0 50%)';
        baHandle.style.left = '50%';
      } else if (hasSingle) {
        const singleImg = t.afterImg || t.beforeImg;
        // Show media area but hide slider, show single image
        if (mediaEl) mediaEl.style.display = '';
        if (sliderEl) {
          sliderEl.style.display = 'block';
          sliderEl.style.cursor = 'default';
        }
        baAfterImg.src = singleImg;
        baAfterImg.alt = t.author;
        baAfterImg.style.objectPosition = 'top';
        baBeforeImg.src = '';
        baAfter.style.clipPath = 'inset(0)';
        baHandle.style.display = 'none';
        // Hide labels
        sliderEl.querySelectorAll('.ba-slider__label').forEach(l => l.style.display = 'none');
      } else {
        if (mediaEl) mediaEl.style.display = 'none';
      }

      // Restore slider controls when both images exist
      if (hasBoth) {
        baHandle.style.display = '';
        if (sliderEl) {
          sliderEl.style.cursor = 'ew-resize';
          sliderEl.querySelectorAll('.ba-slider__label').forEach(l => l.style.display = '');
        }
      }

      quoteEl.textContent = '\u201C' + t.quote + '\u201D';
      nameEl.textContent = t.author;
      roleEl.textContent = t.role;
      resultEl.textContent = t.result;

      // Show/hide video button
      if (t.videoUrl) {
        videoBtn.classList.remove('hidden');
      } else {
        videoBtn.classList.add('hidden');
      }

      dotsEl.querySelectorAll('.testimonial-carousel__dot').forEach((d, i) => {
        d.classList.toggle('active', i === activeIndex);
      });
    }

    function goTo(idx) {
      activeIndex = idx;
      render();
    }

    function next() {
      goTo((activeIndex + 1) % testimonials.length);
    }

    function prev() {
      goTo((activeIndex - 1 + testimonials.length) % testimonials.length);
    }

    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);

    // --- Before/After Slider Drag ---
    let isDragging = false;

    function updateSlider(clientX) {
      const rect = baSlider.getBoundingClientRect();
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(5, Math.min(95, pct));
      baAfter.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
      baHandle.style.left = pct + '%';
    }

    baSlider.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      isPaused = true;
      updateSlider(e.clientX);
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        updateSlider(e.clientX);
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    baSlider.addEventListener('touchstart', (e) => {
      isDragging = true;
      isPaused = true;
      updateSlider(e.touches[0].clientX);
    }, { passive: true });

    baSlider.addEventListener('touchmove', (e) => {
      if (isDragging) {
        e.preventDefault();
        updateSlider(e.touches[0].clientX);
      }
    }, { passive: false });

    baSlider.addEventListener('touchend', () => {
      isDragging = false;
      isPaused = false;
    }, { passive: true });

    // --- Video Modal ---
    function openVideoModal(url) {
      const isLocal = url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov');
      if (isLocal) {
        videoModalPlayer.innerHTML = '<video src="' + url + '" controls autoplay style="width:100%;max-height:80vh;border-radius:8px;"></video>';
      } else {
        videoModalPlayer.innerHTML = '<iframe src="' + url + '?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
      }
      videoModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeVideoModal() {
      videoModal.classList.remove('active');
      videoModalPlayer.innerHTML = '';
      document.body.style.overflow = '';
    }

    videoBtn.addEventListener('click', () => {
      const t = testimonials[activeIndex];
      if (t.videoUrl) openVideoModal(t.videoUrl);
    });

    if (videoModalClose) videoModalClose.addEventListener('click', closeVideoModal);
    if (videoModalBackdrop) videoModalBackdrop.addEventListener('click', closeVideoModal);

    // --- Carousel hover/swipe ---
    carouselEl.addEventListener('mouseenter', () => { isPaused = true; });
    carouselEl.addEventListener('mouseleave', () => { if (!isDragging) isPaused = false; });

    // Touch swipe on content area (not on slider)
    let touchStartX = 0;
    const contentEl = carouselEl.querySelector('.testimonial-carousel__content');
    if (contentEl) {
      contentEl.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        isPaused = true;
      }, { passive: true });
      contentEl.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 40) {
          diff > 0 ? next() : prev();
        }
        isPaused = false;
      }, { passive: true });
    }

    // Auto-advance every 6s
    setInterval(() => { if (!isPaused) next(); }, 6000);

    render();
  }

  // =============================================
  // GSAP ANIMATIONS
  // =============================================
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP not loaded — content visible by default');
    document.querySelectorAll('.hero-line, .hero-sub, .hero-desc, .hero-cta, .hero-scroll-hint--desktop').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Helper: scroll-triggered reveal
  function revealFrom(targets, triggerEl, fromVars, extraVars) {
    return gsap.from(targets, {
      scrollTrigger: {
        trigger: triggerEl,
        start: 'top 85%',
        toggleActions: 'play none none none',
        ...extraVars?.scrollTrigger
      },
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      clearProps: 'opacity,transform',
      ...fromVars,
      ...extraVars
    });
  }

  // --- HERO ---
  // Set initial state for button separately
  gsap.set('.hero-cta', { opacity: 0, y: 20, scale: 0.92 });

  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .to('.hero-line[data-line="1"]', { opacity: 1, y: 0, duration: 0.9, delay: 0.3 })
    .to('.hero-line[data-line="2"]', { opacity: 1, y: 0, duration: 0.9 }, '-=0.5')
    .to('.hero-line[data-line="3"]', { opacity: 1, y: 0, duration: 0.9 }, '-=0.5')
    .to('.hero-sub', { opacity: 1, y: 0, duration: 0.7 }, '-=0.3')
    .to('.hero-desc', { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
    .to('.hero-cta', { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.4)' }, '-=0.3')
    .to('.hero-scroll-hint--desktop', { opacity: 1, duration: 0.6 }, '-=0.4');

  // Problem bubbles
  const bubbles = document.querySelectorAll('[data-bubble]');
  const leftBubbles = [0, 1, 2, 3, 6, 10, 12];

  if (bubbles.length && window.innerWidth > 1024) {
    // Desktop: pin hero, reveal one by one on scroll
    const bubbleTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: '+=' + (bubbles.length * 120 + 300),
        pin: true,
        scrub: 0.6,
        pinSpacing: true
      }
    });

    bubbles.forEach((bubble, i) => {
      const isLeft = leftBubbles.includes(i);
      bubbleTl.fromTo(bubble, {
        opacity: 0,
        scale: 0.4,
        x: isLeft ? -60 : 60
      }, {
        opacity: 1,
        scale: 1,
        x: 0,
        duration: 1,
        ease: 'back.out(1.5)'
      });
      bubbleTl.to({}, { duration: 0.15 });
    });

    bubbleTl.to({}, { duration: 1.5 });

    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: '+=' + (bubbles.length * 120 + 500),
      onLeave: () => {
        bubbles.forEach((bubble, i) => {
          gsap.to(bubble, {
            y: i % 2 === 0 ? -5 : 5,
            duration: 2 + (i * 0.2),
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
          });
        });
      }
    });
  } else if (bubbles.length && window.innerWidth <= 768) {
    // Mobile: 4 bubbles pop in after hero intro
    const mobileBubbles = document.querySelectorAll('.hero-bubble--5, .hero-bubble--2, .hero-bubble--11, .hero-bubble--12');
    mobileBubbles.forEach((bubble, i) => {
      gsap.fromTo(bubble, {
        opacity: 0,
        scale: 0.4
      }, {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        delay: 2.5 + (i * 0.5),
        ease: 'back.out(1.5)'
      });
    });
  }

  // Squiggly underline draw animations
  document.querySelectorAll('.hero-squiggle path').forEach((path, i) => {
    const length = path.getTotalLength ? path.getTotalLength() : 400;
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 1.2,
      delay: 0.8 + (i * 0.5),
      ease: 'power2.inOut'
    });
  });

  // --- FRAMEWORK ---
  revealFrom('.framework-intro__label', '.framework-intro', { y: 20 });
  revealFrom('.framework-intro__text', '.framework-intro', { y: 20, delay: 0.15 });

  document.querySelectorAll('.pillar-card').forEach((card, i) => {
    revealFrom(card, card, { y: 40, delay: i * 0.2 });
  });

  revealFrom('.framework-closing', '.framework-closing', { y: 20 });

  // --- FOUNDERS ---
  document.querySelectorAll('.founder-row').forEach(row => {
    const img = row.querySelector('.founder-row__image');
    const content = row.querySelector('.founder-row__content');
    const isReverse = row.classList.contains('founder-row--reverse');

    if (img) revealFrom(img, row, { x: isReverse ? 50 : -50 });
    if (content) revealFrom(content, row, { x: isReverse ? -50 : 50, delay: 0.15 });
  });

  revealFrom('.founders-mission__inner', '.founders-mission', { y: 40 });

  // --- OFFERINGS ---
  revealFrom('.offerings-intro', '.offerings-intro', { y: 30 });
  document.querySelectorAll('.offering-card').forEach((card, i) => {
    revealFrom(card, '.offerings-grid', { y: 30, delay: i * 0.1 });
  });

  // --- TESTIMONIALS ---
  revealFrom('.testimonial-carousel', '.testimonial-carousel', { y: 30 });

  // Testimonial happy pills — appear one by one with delay on scroll
  const testiPills = document.querySelectorAll('[data-testi-pill]');
  if (testiPills.length && window.innerWidth > 1024) {
    const pillTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.testimonials',
        start: 'top 65%',
        toggleActions: 'play none none none'
      }
    });

    testiPills.forEach((pill, i) => {
      const isLeft = i < 3;
      pillTl.fromTo(pill, {
        opacity: 0,
        scale: 0.5,
        x: isLeft ? -40 : 40
      }, {
        opacity: 1,
        scale: 1,
        x: 0,
        duration: 0.6,
        ease: 'back.out(1.5)'
      }, i * 0.4);
    });

    // Gentle float after all appear
    pillTl.call(() => {
      testiPills.forEach((pill, i) => {
        gsap.to(pill, {
          y: i % 2 === 0 ? -5 : 5,
          duration: 2.2 + (i * 0.2),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      });
    });
  }

  // --- FINAL CTA --- underline animation on scroll
  revealFrom('.final-cta__title', '.final-cta', { y: 30 });
  revealFrom('.final-cta__sub', '.final-cta', { y: 20, delay: 0.15 });
  revealFrom('.final-cta__actions', '.final-cta', { y: 20, delay: 0.3 });

  // Animate the CTA squiggle underline — stroke draw like hero squiggles
  const ctaSquiggle = document.querySelector('.cta-squiggle path');
  if (ctaSquiggle) {
    const len = ctaSquiggle.getTotalLength ? ctaSquiggle.getTotalLength() : 400;
    ctaSquiggle.style.strokeDasharray = len;
    ctaSquiggle.style.strokeDashoffset = len;
    ScrollTrigger.create({
      trigger: '.final-cta',
      start: 'top 75%',
      onEnter: () => {
        gsap.to(ctaSquiggle, {
          strokeDashoffset: 0,
          duration: 1.2,
          ease: 'power2.inOut'
        });
      },
      once: true
    });
  }

  // --- FOUNDERS: fluid appearing animations ---
  revealFrom('.founders-intro', '.founders-intro', { y: 30 });

});
