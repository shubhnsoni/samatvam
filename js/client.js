// @shubhsonic
/* ============================================
   SAMATVAM LIVING — Client Portal JS
   Supabase-powered auth + async data loading
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {

  // --- Auth Guard (Supabase) ---
  const isLoginPage = window.location.pathname.includes('login.html');
  let session = null;
  let clientData = null;

  if (!isLoginPage && typeof CMS !== 'undefined') {
    session = await CMS.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return;
    }
    // Redirect admins to admin panel
    const role = await CMS.getUserRole();
    if (role === 'admin') {
      window.location.href = '../admin/index.html';
      return;
    }
    // Load client record linked to this auth user
    try {
      const allClients = await CMS.getAll(CMS.KEYS.clients);
      clientData = (allClients || []).find(c => c.authUserId === session.user.id) || null;
    } catch (e) {
      console.warn('Could not load client data:', e.message);
    }
  }

  // --- Sidebar Toggle (Mobile) ---
  const sidebar = document.querySelector('.cl-sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const overlay = document.getElementById('sidebarOverlay');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('visible');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    });
  }

  // --- Resource Filters ---
  const filterBtns = document.querySelectorAll('.cl-filter-btn');
  const resources = document.querySelectorAll('[data-phase], [data-type]');

  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.filterGroup;
        const value = btn.dataset.filter;

        // Toggle active state within group
        document.querySelectorAll(`.cl-filter-btn[data-filter-group="${group}"]`).forEach(b => {
          b.classList.remove('active');
        });
        btn.classList.add('active');

        applyFilters();
      });
    });
  }

  function applyFilters() {
    const activePhase = document.querySelector('.cl-filter-btn[data-filter-group="phase"].active');
    const activeType = document.querySelector('.cl-filter-btn[data-filter-group="type"].active');

    const phaseVal = activePhase ? activePhase.dataset.filter : 'all';
    const typeVal = activeType ? activeType.dataset.filter : 'all';

    document.querySelectorAll('.cl-resource-item').forEach(item => {
      const itemPhase = item.dataset.phase || '';
      const itemType = item.dataset.type || '';

      const phaseMatch = phaseVal === 'all' || itemPhase === phaseVal;
      const typeMatch = typeVal === 'all' || itemType === typeVal;

      item.style.display = (phaseMatch && typeMatch) ? '' : 'none';
    });
  }

  // --- FAQ Accordion ---
  const faqItems = document.querySelectorAll('.cl-faq__item');
  faqItems.forEach(item => {
    const question = item.querySelector('.cl-faq__question');
    if (question) {
      question.addEventListener('click', () => {
        // Close others
        faqItems.forEach(other => {
          if (other !== item) other.classList.remove('open');
        });
        item.classList.toggle('open');
      });
    }
  });

  // --- Reflection Form Save (Supabase) ---
  const reflectionForm = document.getElementById('reflectionForm');
  if (reflectionForm && typeof CMS !== 'undefined') {
    reflectionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(reflectionForm);
      const data = {};
      formData.forEach((val, key) => { data[key] = val; });

      const week = clientData ? clientData.week || 1 : 1;
      const focusTitle = clientData ? clientData.assignedFocus || '' : '';

      await CMS.add('reflections', {
        clientId: clientData ? clientData.id : null,
        authUserId: session ? session.user.id : null,
        week,
        focusTitle,
        sleep: data.sleep || '',
        energy: data.energy || '',
        hard: data.hard || '',
        good: data.good || ''
      });

      reflectionForm.reset();
      showToast('Reflection saved successfully');
      setTimeout(() => location.reload(), 600);
    });
  }

  // --- Chat Message Send ---
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  const chatThread = document.querySelector('.cl-chat__thread');

  if (chatSend && chatInput && chatThread) {
    function sendMessage() {
      const text = chatInput.value.trim();
      if (!text) return;

      const msgEl = document.createElement('div');
      msgEl.className = 'cl-message cl-message--client';
      msgEl.innerHTML = `
        <div class="cl-message__bubble cl-message__bubble--client">
          <p class="cl-message__text">${escapeHtml(text)}</p>
          <p class="cl-message__time">Just now</p>
        </div>
      `;
      chatThread.appendChild(msgEl);
      chatThread.scrollTop = chatThread.scrollHeight;
      chatInput.value = '';

      showToast('Message sent');
    }

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // --- Toast ---
  function showToast(message) {
    let toast = document.querySelector('.cl-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'cl-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2500);
  }

  // --- Escape HTML ---
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Sign Out (Supabase) ---
  const signOutLinks = document.querySelectorAll('.cl-sidebar__signout');
  signOutLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      if (typeof CMS !== 'undefined') await CMS.signOut();
      window.location.href = 'login.html';
    });
  });

  // =============================================
  // RESOURCES — Dynamic Rendering
  // =============================================
  const resourcesGrid = document.getElementById('resourcesGrid');
  if (resourcesGrid && typeof CMS !== 'undefined') {
    const resources = (await CMS.getAll(CMS.KEYS.resources)) || [];
    const clientPhaseRes = clientData ? clientData.phase || 'restore' : 'restore';
    const phaseOrderRes = ['restore', 'nourish', 'move'];
    const clientPhaseIdxRes = phaseOrderRes.indexOf(clientPhaseRes);

    function renderResources() {
      const activePhase = document.querySelector('.cl-filter-btn[data-filter-group="phase"].active');
      const activeType = document.querySelector('.cl-filter-btn[data-filter-group="type"].active');
      const phaseVal = activePhase ? activePhase.dataset.filter : 'all';
      const typeVal = activeType ? activeType.dataset.filter : 'all';

      // Group by phase
      const phases = ['restore', 'nourish', 'move'];
      let html = '';
      phases.forEach(phase => {
        if (phaseVal !== 'all' && phaseVal !== phase) return;
        const phaseResources = resources.filter(r => r.phase === phase && (typeVal === 'all' || r.type === typeVal));
        if (phaseResources.length === 0) return;
        const phaseIdx = phaseOrderRes.indexOf(phase);
        const isLocked = phaseIdx > clientPhaseIdxRes;
        html += `<h3 class="cl-section-title" style="margin-top:32px;text-transform:capitalize;">${phase} Phase</h3><div class="cl-grid">`;
        phaseResources.forEach(r => {
          const typeClass = 'cl-resource__type--' + phase;
          const actionLabel = r.type === 'video' ? 'Watch' : r.type === 'pdf' ? 'View' : 'Download';
          const linkAttr = !isLocked && r.url ? `href="${escapeHtml(r.url)}" target="_blank" rel="noopener"` : '';
          html += `
            <${!isLocked && r.url ? 'a' : 'div'} ${linkAttr} class="cl-resource cl-resource-item${isLocked ? ' cl-resource--locked' : ''}" data-phase="${r.phase}" data-type="${r.type}" style="text-decoration:none;color:inherit;${isLocked ? 'opacity:0.45;' : ''}">
              <div class="cl-resource__header">
                <span class="cl-resource__type ${typeClass}">${r.type}</span>
                ${r.duration ? '<span class="cl-resource__duration">' + escapeHtml(r.duration) + '</span>' : ''}
              </div>
              <h4 class="cl-resource__title">${escapeHtml(r.title)}</h4>
              <p class="cl-resource__desc">${escapeHtml(r.description || '')}</p>
              ${isLocked ? '<p class="cl-resource__locked-msg">Available in ' + phase + ' phase</p>' : '<p class="cl-resource__action" style="margin-top:auto;padding-top:8px;font-size:0.82rem;font-weight:500;color:var(--green);">' + actionLabel + ' →</p>'}
            </${!isLocked && r.url ? 'a' : 'div'}>`;
        });
        html += '</div>';
      });
      resourcesGrid.innerHTML = html || '<p class="text-muted">No resources found.</p>';
    }

    renderResources();

    // Re-render on filter change
    document.querySelectorAll('.cl-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(renderResources, 10);
      });
    });
  }

  // =============================================
  // COURSES — List Page
  // =============================================
  const courseGrid = document.getElementById('courseGrid');
  if (courseGrid && typeof CMS !== 'undefined') {
    const courses = (await CMS.getAll(CMS.KEYS.courses)) || [];
    const progress = (await CMS.getAll(CMS.KEYS.lessonProgress)) || [];
    const clientPhase = clientData ? clientData.phase || 'restore' : 'restore';

    const phaseOrder = ['restore', 'nourish', 'move'];
    const clientPhaseIdx = phaseOrder.indexOf(clientPhase);

    courses.forEach(course => {
      const coursePhaseIdx = phaseOrder.indexOf(course.phase);
      const isLocked = coursePhaseIdx > clientPhaseIdx;
      const lessons = course.lessons || [];
      const completedCount = lessons.filter(l => progress.find(p => p.lessonId === l.id && p.completed)).length;
      const pct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

      const card = document.createElement('div');
      card.className = 'cl-course-card' + (isLocked ? ' cl-course-card--locked' : '');
      if (!isLocked) {
        card.addEventListener('click', () => {
          const firstIncomplete = lessons.find(l => !progress.find(p => p.lessonId === l.id && p.completed));
          const targetLesson = firstIncomplete || lessons[0];
          if (targetLesson) window.location.href = 'lesson.html?id=' + targetLesson.id;
        });
      }

      card.innerHTML = `
        <span class="cl-course-card__phase cl-course-card__phase--${course.phase}">${course.phase} Phase</span>
        <h3 class="cl-course-card__title">${escapeHtml(course.title)}</h3>
        <p class="cl-course-card__desc">${escapeHtml(course.description)}</p>
        <div class="cl-course-card__meta">
          <span>${lessons.length} lesson${lessons.length !== 1 ? 's' : ''}</span>
          <span>${isLocked ? 'Locked' : pct + '% complete'}</span>
        </div>
        ${isLocked
          ? '<p class="cl-course-card__locked-msg">Available when you reach the ' + course.phase + ' phase</p>'
          : `<div class="cl-progress"><div class="cl-progress__fill cl-progress__fill--${course.phase}" style="width:${pct}%"></div></div>`
        }
      `;
      courseGrid.appendChild(card);
    });
  }

  // =============================================
  // COURSES — Lesson Viewer Page
  // =============================================
  const lessonContent = document.getElementById('lessonContent');
  if (lessonContent && typeof CMS !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const lessonId = params.get('id');
    if (!lessonId) { lessonContent.innerHTML = '<p>No lesson selected. <a href="courses.html">Back to courses</a></p>'; }
    else {
      const courses = (await CMS.getAll(CMS.KEYS.courses)) || [];
      let lesson = null, course = null, lessonIdx = -1;
      for (const c of courses) {
        const idx = (c.lessons || []).findIndex(l => l.id === lessonId);
        if (idx !== -1) { lesson = c.lessons[idx]; course = c; lessonIdx = idx; break; }
      }

      if (!lesson) {
        lessonContent.innerHTML = '<p>Lesson not found. <a href="courses.html">Back to courses</a></p>';
      } else {
        const progress = (await CMS.getAll(CMS.KEYS.lessonProgress)) || [];
        const lp = progress.find(p => p.lessonId === lessonId);
        const isCompleted = lp && lp.completed;
        const allLessons = course.lessons;
        const prevLesson = lessonIdx > 0 ? allLessons[lessonIdx - 1] : null;
        const nextLesson = lessonIdx < allLessons.length - 1 ? allLessons[lessonIdx + 1] : null;

        // Update breadcrumb
        const bc = document.getElementById('lessonBreadcrumb');
        if (bc) bc.textContent = lesson.title;

        // Update page title
        document.title = lesson.title + ' — Samatvam Living';

        let html = '<div class="cl-lesson-viewer">';

        // Video, reading, or linked resource content
        if (lesson.type === 'video' && lesson.videoUrl) {
          html += `
            <div class="cl-video-wrapper">
              <video id="lessonVideo" preload="metadata">
                <source src="${lesson.videoUrl}" type="video/mp4">
                Your browser does not support the video tag.
              </video>
              <div class="cl-video-controls">
                <button id="videoPlayBtn" title="Play/Pause"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>
                <input type="range" class="cl-video-seek" id="videoSeek" min="0" max="100" value="0" step="0.1">
                <span class="cl-video-time" id="videoTime">0:00 / 0:00</span>
                <button class="cl-video-speed" id="videoSpeed" title="Playback speed">1x</button>
                <button id="videoFullscreen" title="Fullscreen"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></button>
              </div>
            </div>`;
        } else if (lesson.type === 'reading' && lesson.content) {
          html += `<div class="cl-lesson-viewer__content">${escapeHtml(lesson.content)}</div>`;
        } else if (lesson.type === 'resource') {
          const linkedRes = lesson.resourceId && typeof CMS !== 'undefined' ? CMS.getById(CMS.KEYS.resources, lesson.resourceId) : null;
          const resUrl = linkedRes && linkedRes.url ? linkedRes.url : (lesson.videoUrl || '');
          const resTitle = linkedRes ? linkedRes.title : 'External Resource';
          if (resUrl) {
            html += `<div class="cl-lesson-viewer__content" style="text-align:center;padding:40px;">
              <p style="margin-bottom:16px;color:var(--text-muted);">This lesson links to an external resource:</p>
              <a href="${escapeHtml(resUrl)}" target="_blank" rel="noopener" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:8px;">Open ${escapeHtml(resTitle)} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>
            </div>`;
          }
        }

        // Lesson info
        html += `
          <div class="cl-lesson-viewer__header">
            <div>
              <h2 class="cl-lesson-viewer__title">${escapeHtml(lesson.title)}</h2>
              <div class="cl-lesson-viewer__meta">
                <span class="cl-lesson-type cl-lesson-type--${lesson.type}">${lesson.type}</span>
                <span>${lesson.duration || ''}</span>
                <span>${course.title}</span>
              </div>
            </div>
            <button class="cl-lesson-nav__btn ${isCompleted ? '' : 'cl-lesson-nav__btn--primary'}" id="markCompleteBtn">
              ${isCompleted ? '✓ Completed' : 'Mark as Complete'}
            </button>
          </div>
          <p class="cl-lesson-viewer__desc">${escapeHtml(lesson.description)}</p>
        `;

        // Coach tip
        if (lesson.coachTip) {
          html += `
            <div class="cl-coach-note">
              <p class="cl-coach-note__label">Coach Tip</p>
              <p class="cl-coach-note__text">"${escapeHtml(lesson.coachTip)}"</p>
            </div>`;
        }

        // Lesson list for this course
        html += `
          <div class="cl-card" style="margin-top:32px;">
            <h3 class="cl-card__title cl-card__title--sm" style="margin-bottom:12px;">${escapeHtml(course.title)} — All Lessons</h3>
            <div class="cl-lesson-list">`;
        allLessons.forEach(l => {
          const lProg = progress.find(p => p.lessonId === l.id);
          const done = lProg && lProg.completed;
          const isCurrent = l.id === lessonId;
          const inProg = lProg && !lProg.completed && lProg.watchedSeconds > 0;
          html += `
            <a href="lesson.html?id=${l.id}" class="cl-lesson-item${isCurrent ? ' cl-lesson-item--active' : ''}">
              <span class="cl-lesson-check${done ? ' cl-lesson-check--done' : (inProg ? ' cl-lesson-check--in-progress' : '')}">✓</span>
              <div class="cl-lesson-info">
                <p class="cl-lesson-title">${escapeHtml(l.title)}</p>
                <div class="cl-lesson-meta">
                  <span class="cl-lesson-type cl-lesson-type--${l.type}">${l.type}</span>
                  <span>${l.duration || ''}</span>
                </div>
              </div>
            </a>`;
        });
        html += '</div></div>';

        // Navigation
        html += `
          <div class="cl-lesson-nav">
            <button class="cl-lesson-nav__btn" ${prevLesson ? 'onclick="window.location.href=\'lesson.html?id=' + prevLesson.id + '\'"' : 'disabled'}>← Previous</button>
            <button class="cl-lesson-nav__btn cl-lesson-nav__btn--primary" ${nextLesson ? 'onclick="window.location.href=\'lesson.html?id=' + nextLesson.id + '\'"' : 'disabled'}>Next →</button>
          </div>`;

        html += '</div>';
        lessonContent.innerHTML = html;

        // --- Mark Complete Button ---
        const markBtn = document.getElementById('markCompleteBtn');
        if (markBtn) {
          markBtn.addEventListener('click', async () => {
            const cid = clientData ? clientData.id : null;
            if (lp && lp.id) {
              await CMS.update(CMS.KEYS.lessonProgress, lp.id, { completed: !lp.completed });
              showToast(!lp.completed ? 'Lesson marked complete!' : 'Lesson unmarked');
            } else {
              await CMS.add(CMS.KEYS.lessonProgress, { clientId: cid, lessonId, completed: true, watchedSeconds: 0, lastWatched: new Date().toISOString() });
              showToast('Lesson marked complete!');
            }
            setTimeout(() => location.reload(), 400);
          });
        }

        // --- Video Player Controls ---
        const video = document.getElementById('lessonVideo');
        if (video) {
          const playBtn = document.getElementById('videoPlayBtn');
          const seekBar = document.getElementById('videoSeek');
          const timeDisplay = document.getElementById('videoTime');
          const speedBtn = document.getElementById('videoSpeed');
          const fullscreenBtn = document.getElementById('videoFullscreen');
          const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
          let speedIdx = 2;

          // Resume from saved position
          if (lp && lp.watchedSeconds > 0 && !lp.completed) {
            video.addEventListener('loadedmetadata', () => {
              video.currentTime = Math.min(lp.watchedSeconds, video.duration - 1);
            }, { once: true });
          }

          function fmtTime(s) {
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return m + ':' + (sec < 10 ? '0' : '') + sec;
          }

          playBtn.addEventListener('click', () => {
            if (video.paused) { video.play(); playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'; }
            else { video.pause(); playBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>'; }
          });

          video.addEventListener('click', () => playBtn.click());

          video.addEventListener('timeupdate', () => {
            if (video.duration) {
              seekBar.value = (video.currentTime / video.duration) * 100;
              timeDisplay.textContent = fmtTime(video.currentTime) + ' / ' + fmtTime(video.duration);
            }
          });

          seekBar.addEventListener('input', () => {
            if (video.duration) video.currentTime = (seekBar.value / 100) * video.duration;
          });

          speedBtn.addEventListener('click', () => {
            speedIdx = (speedIdx + 1) % speeds.length;
            video.playbackRate = speeds[speedIdx];
            speedBtn.textContent = speeds[speedIdx] + 'x';
          });

          fullscreenBtn.addEventListener('click', () => {
            const wrapper = video.closest('.cl-video-wrapper');
            if (wrapper.requestFullscreen) wrapper.requestFullscreen();
            else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
          });

          // Save watch position every 10 seconds
          let saveTimer = null;
          let lpId = lp ? lp.id : null;
          video.addEventListener('timeupdate', () => {
            if (saveTimer) return;
            saveTimer = setTimeout(async () => {
              saveTimer = null;
              const cid = clientData ? clientData.id : null;
              const entry = { clientId: cid, lessonId, watchedSeconds: Math.floor(video.currentTime), lastWatched: new Date().toISOString() };
              if (lpId) {
                await CMS.update(CMS.KEYS.lessonProgress, lpId, entry);
              } else {
                entry.completed = false;
                const result = await CMS.add(CMS.KEYS.lessonProgress, entry);
                if (result && result.id) lpId = result.id;
              }
            }, 10000);
          });

          // Auto-complete at 90%
          let autoCompleted = false;
          video.addEventListener('timeupdate', async () => {
            if (autoCompleted) return;
            if (video.duration && video.currentTime / video.duration > 0.9) {
              autoCompleted = true;
              if (lpId) {
                await CMS.update(CMS.KEYS.lessonProgress, lpId, { completed: true });
              } else {
                const cid = clientData ? clientData.id : null;
                await CMS.add(CMS.KEYS.lessonProgress, { clientId: cid, lessonId, completed: true, watchedSeconds: Math.floor(video.currentTime), lastWatched: new Date().toISOString() });
              }
              showToast('Lesson auto-completed!');
              const btn = document.getElementById('markCompleteBtn');
              if (btn) { btn.textContent = '✓ Completed'; btn.classList.remove('cl-lesson-nav__btn--primary'); }
            }
          });
        }
      }
    }
  }

  // =============================================
  // DASHBOARD — Continue Learning Card
  // =============================================
  const continueCard = document.getElementById('continueLearning');
  if (continueCard && typeof CMS !== 'undefined') {
    const courses = (await CMS.getAll(CMS.KEYS.courses)) || [];
    const progress = (await CMS.getAll(CMS.KEYS.lessonProgress)) || [];

    // Find last watched lesson that isn't completed
    const sorted = [...progress].filter(p => !p.completed && p.watchedSeconds > 0).sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));
    let target = sorted[0] || null;

    // If no in-progress, find first incomplete lesson
    if (!target) {
      for (const c of courses) {
        for (const l of (c.lessons || [])) {
          if (!progress.find(p => p.lessonId === l.id && p.completed)) {
            target = { lessonId: l.id };
            break;
          }
        }
        if (target) break;
      }
    }

    if (target) {
      let lessonTitle = '', courseName = '';
      for (const c of courses) {
        const l = (c.lessons || []).find(l => l.id === target.lessonId);
        if (l) { lessonTitle = l.title; courseName = c.title; break; }
      }
      continueCard.innerHTML = `
        <a href="lesson.html?id=${target.lessonId}" class="cl-continue">
          <div class="cl-continue__icon"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
          <div class="cl-continue__info">
            <p class="cl-continue__title">${escapeHtml(lessonTitle)}</p>
            <p class="cl-continue__meta">${escapeHtml(courseName)}</p>
          </div>
        </a>`;
    } else {
      continueCard.innerHTML = '<p class="cl-card__text">All lessons completed! 🎉</p>';
    }
  }

  // =============================================
  // DASHBOARD — Dynamic Greeting, Phase, Focus, Resources
  // =============================================
  if (clientData && typeof CMS !== 'undefined') {
    // Greeting
    const titleEl = document.querySelector('.cl-header__title');
    if (titleEl && titleEl.textContent.includes('Good morning')) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      const firstName = (clientData.name || 'there').split(' ')[0];
      titleEl.textContent = `${greeting}, ${firstName}`;
    }

    // Week subtitle
    const subtitleEl = document.querySelector('.cl-header__subtitle');
    if (subtitleEl && subtitleEl.textContent.includes('Week')) {
      subtitleEl.textContent = `Week ${clientData.week || 1} of your journey`;
    }

    // Phase badge
    const phaseBadge = document.querySelector('.cl-badge');
    if (phaseBadge && phaseBadge.textContent.includes('Phase')) {
      const phase = clientData.phase || 'restore';
      phaseBadge.textContent = phase.charAt(0).toUpperCase() + phase.slice(1) + ' Phase';
      phaseBadge.className = 'cl-badge cl-badge--' + phase;
    }

    // Weekly focus card (dashboard)
    const focusCard = document.querySelector('.cl-card--highlight');
    if (focusCard && clientData.assignedFocus) {
      try {
        const focusTemplates = (await CMS.getAll(CMS.KEYS.focusTemplates)) || [];
        const focus = focusTemplates.find(f => f.id === clientData.assignedFocus || f.title === clientData.assignedFocus);
        if (focus) {
          const weekLabel = focusCard.querySelector('.cl-card__label');
          const focusTitle = focusCard.querySelector('.cl-card__title--lg');
          const focusText = focusCard.querySelector('.cl-card__text');
          if (weekLabel) weekLabel.textContent = `Week ${clientData.week || 1} Focus`;
          if (focusTitle) focusTitle.textContent = focus.title;
          if (focusText) focusText.textContent = focus.description || '';
        }
      } catch (e) { console.warn('Focus load error:', e.message); }
    }

    // Coach note card
    const coachNoteCard = document.querySelector('.cl-card__title--sm');
    if (coachNoteCard && coachNoteCard.textContent.includes('From')) {
      const notes = clientData.coachNotes || [];
      if (notes.length > 0) {
        const latest = notes[notes.length - 1];
        const noteText = coachNoteCard.closest('.cl-card').querySelector('.cl-card__text');
        const noteMeta = coachNoteCard.closest('.cl-card').querySelector('.cl-card__meta');
        if (noteText) noteText.textContent = `"${latest.text || latest}"`;
        if (noteMeta && latest.date) noteMeta.textContent = `Updated ${latest.date}`;
        coachNoteCard.textContent = `From ${clientData.coach || 'Coach'}`;
      }
    }

    // Recent resources (dashboard)
    const recentResources = document.querySelector('.cl-resource-list');
    if (recentResources && document.querySelector('.cl-header__title')?.textContent.includes('morning') === false || recentResources) {
      try {
        const resources = (await CMS.getAll(CMS.KEYS.resources)) || [];
        const phase = clientData.phase || 'restore';
        const phaseResources = resources.filter(r => (r.phase || '').toLowerCase() === phase).slice(0, 3);
        if (phaseResources.length && recentResources.closest('.cl-card')?.querySelector('.cl-card__title')?.textContent === 'Recent Resources') {
          let html = '';
          phaseResources.forEach(r => {
            const actionLabel = r.type === 'video' ? 'Watch' : r.type === 'pdf' ? 'View' : 'Download';
            html += `<div class="cl-resource-list__item">
              <div>
                <p class="cl-resource-list__name">${escapeHtml(r.title)}</p>
                <p class="cl-resource-list__meta">${r.type || ''} · ${(r.phase || '').charAt(0).toUpperCase() + (r.phase || '').slice(1)} Phase</p>
              </div>
              ${r.url ? `<a href="${escapeHtml(r.url)}" target="_blank" class="cl-resource-list__action">${actionLabel}</a>` : `<span class="cl-resource-list__action">${actionLabel}</span>`}
            </div>`;
          });
          recentResources.innerHTML = html;
        }
      } catch (e) { console.warn('Resources load error:', e.message); }
    }
  }

  // =============================================
  // FOCUS PAGE — Dynamic Rendering
  // =============================================
  const focusHighlight = document.querySelector('.cl-card--highlight');
  const isFocusPage = window.location.pathname.includes('focus.html');
  if (isFocusPage && focusHighlight && clientData && typeof CMS !== 'undefined') {
    try {
      const focusTemplates = (await CMS.getAll(CMS.KEYS.focusTemplates)) || [];
      const focus = focusTemplates.find(f => f.id === clientData.assignedFocus || f.title === clientData.assignedFocus);
      if (focus) {
        const weekLabel = focusHighlight.querySelector('.cl-card__label');
        const titleEl = focusHighlight.querySelector('.cl-card__title--lg') || focusHighlight.querySelector('h2');
        const descEl = focusHighlight.querySelector('.cl-card__text');

        if (weekLabel) weekLabel.textContent = `Week ${clientData.week || 1} Focus`;
        if (titleEl) titleEl.textContent = focus.title;
        if (descEl) descEl.textContent = focus.description || '';

        // Why it matters
        const infoBlocks = focusHighlight.querySelectorAll('.cl-info-block');
        if (infoBlocks[0] && focus.whyItMatters) {
          const text = infoBlocks[0].querySelector('.cl-card__text');
          if (text) text.textContent = focus.whyItMatters;
        }
        // Good enough
        if (infoBlocks[1] && focus.goodEnough) {
          const checklist = infoBlocks[1].querySelector('.cl-checklist');
          if (checklist) {
            const items = focus.goodEnough.split('\n').filter(s => s.trim());
            checklist.innerHTML = items.map(item =>
              `<div class="cl-checklist__item"><span class="cl-checklist__icon">✓</span> ${escapeHtml(item.replace(/^[-•]\s*/, ''))}</div>`
            ).join('');
          }
        }
        // Coach tip
        if (infoBlocks[2] && focus.coachTip) {
          const tipText = infoBlocks[2].querySelector('.cl-card__text');
          if (tipText) tipText.textContent = `"${focus.coachTip}" — ${clientData.coach || 'Coach'}`;
        }
      }

      // Previous focuses — show completed focus templates
      const prevSection = document.querySelector('.cl-section-title');
      if (prevSection && prevSection.textContent.includes('Previous')) {
        const prevGrid = prevSection.nextElementSibling;
        if (prevGrid) {
          const currentWeek = clientData.week || 1;
          const pastFocuses = focusTemplates
            .filter(f => f.id !== clientData.assignedFocus && f.title !== clientData.assignedFocus)
            .slice(0, currentWeek - 1);
          if (pastFocuses.length) {
            let html = '';
            pastFocuses.forEach((f, i) => {
              html += `<div class="cl-card cl-card--muted">
                <p class="cl-card__label">Week ${currentWeek - 1 - i}</p>
                <h4 class="cl-card__title cl-card__title--sm">${escapeHtml(f.title)}</h4>
                <p class="cl-card__text">${escapeHtml(f.description || '')}</p>
                <p class="cl-card__meta" style="color: var(--green);">✓ Completed</p>
              </div>`;
            });
            prevGrid.innerHTML = html;
          }
        }
      }
    } catch (e) { console.warn('Focus page load error:', e.message); }
  }

  // =============================================
  // PROGRESS PAGE — Load Past Reflections
  // =============================================
  const isProgressPage = window.location.pathname.includes('progress.html');
  if (isProgressPage && typeof CMS !== 'undefined' && session) {
    try {
      const reflections = (await CMS.getAll('reflections')) || [];
      const myReflections = reflections
        .filter(r => r.authUserId === session.user.id)
        .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));

      // Update week label on form
      const formLabel = document.querySelector('#reflectionForm')?.closest('.cl-card')?.querySelector('.cl-card__label');
      if (formLabel && clientData) formLabel.textContent = `Week ${clientData.week || 1} Reflection`;

      // Render past reflections
      const pastTitle = document.querySelector('.cl-section-title');
      if (pastTitle && pastTitle.textContent.includes('Past')) {
        let html = '';
        myReflections.forEach(r => {
          const date = new Date(r.createdAt || r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          html += `<div class="cl-card">
            <div class="cl-card__row cl-card__row--top" style="margin-bottom:16px;">
              <div>
                <p class="cl-card__label">Week ${r.week || '?'}</p>
                <p class="cl-card__meta">Focus: ${escapeHtml(r.focusTitle || 'N/A')}</p>
              </div>
              <span class="cl-card__meta">${date}</span>
            </div>`;
          if (r.sleep) html += `<div class="cl-reflection"><p class="cl-reflection__label">Sleep</p><p class="cl-reflection__text">"${escapeHtml(r.sleep)}"</p></div>`;
          if (r.energy) html += `<div class="cl-reflection"><p class="cl-reflection__label">Energy</p><p class="cl-reflection__text">"${escapeHtml(r.energy)}"</p></div>`;
          if (r.hard) html += `<div class="cl-reflection"><p class="cl-reflection__label">What felt hard</p><p class="cl-reflection__text">"${escapeHtml(r.hard)}"</p></div>`;
          if (r.good) html += `<div class="cl-reflection"><p class="cl-reflection__label">What felt good</p><p class="cl-reflection__text">"${escapeHtml(r.good)}"</p></div>`;
          if (r.coachFeedback) html += `<div class="cl-coach-note" style="margin-top:12px;"><p class="cl-coach-note__label">Coach Feedback</p><p class="cl-coach-note__text">"${escapeHtml(r.coachFeedback)}"</p></div>`;
          html += '</div>';
        });

        // Replace hardcoded past reflections
        let sibling = pastTitle.nextElementSibling;
        const toRemove = [];
        while (sibling) {
          if (sibling.classList.contains('cl-card')) toRemove.push(sibling);
          sibling = sibling.nextElementSibling;
        }
        toRemove.forEach(el => el.remove());
        pastTitle.insertAdjacentHTML('afterend', html || '<p class="text-muted" style="margin-top:16px;">No reflections yet. Write your first one above.</p>');
      }
    } catch (e) { console.warn('Reflections load error:', e.message); }
  }

  // =============================================
  // PLAN PAGE — Dynamic Phase & Timeline
  // =============================================
  const isPlanPage = window.location.pathname.includes('plan.html');
  if (isPlanPage && clientData) {
    // Update phase badge
    const phaseBadge = document.querySelector('.cl-badge');
    if (phaseBadge) {
      const phase = clientData.phase || 'restore';
      phaseBadge.textContent = phase.charAt(0).toUpperCase() + phase.slice(1) + ' Phase';
      phaseBadge.className = 'cl-badge cl-badge--' + phase;
    }

    // Update coach notes
    const coachNote = document.querySelector('.cl-coach-note__text');
    if (coachNote && clientData.coachNotes && clientData.coachNotes.length) {
      const latest = clientData.coachNotes[clientData.coachNotes.length - 1];
      coachNote.textContent = `"${latest.text || latest}" — ${clientData.coach || 'Coach'}`;
    }
  }

});
