// @shubhsonic
/* ============================================
   SAMATVAM LIVING — Admin Panel JS
   Full CMS CRUD, dynamic rendering, filters
   Supabase-powered (async/await)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  (async () => {

  // --- Auth Check (Supabase) ---
  const isLoginPage = window.location.pathname.includes('login.html');
  if (!isLoginPage) {
    const session = await CMS.getSession();
    if (!session) { window.location.href = 'login.html'; return; }
    const role = await CMS.getUserRole();
    if (role !== 'admin') {
      await CMS.signOut();
      window.location.href = 'login.html';
      return;
    }
  }

  // =============================================
  // UTILITIES
  // =============================================

  function showToast(message, type = 'success') {
    const existing = document.querySelector('.admin-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
  }
  window.showToast = showToast;

  async function confirmDelete(name) {
    if (typeof gConfirm === 'function') {
      return gConfirm('Delete ' + name + '?', 'This action cannot be undone. All associated data will be permanently removed.');
    }
    return confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`);
  }

  function toggleForm(formId, show) {
    const f = document.getElementById(formId);
    if (!f) return;
    f.style.display = show ? 'block' : (f.style.display === 'none' ? 'block' : 'none');
    if (f.style.display === 'block') f.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  window.toggleForm = toggleForm;

  function getFormData(formEl) {
    const data = {};
    formEl.querySelectorAll('input, textarea, select').forEach(el => {
      if (!el.name) return;
      if (el.type === 'checkbox') { data[el.name] = el.checked; }
      else { data[el.name] = el.value; }
    });
    return data;
  }

  function resetForm(formEl) {
    formEl.querySelectorAll('input, textarea, select').forEach(el => {
      if (el.type === 'checkbox') el.checked = false;
      else if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else el.value = '';
    });
    formEl.removeAttribute('data-edit-id');
  }

  function phaseClass(phase) {
    if (!phase) return 'phase-restore';
    const p = phase.toLowerCase();
    if (p.includes('nourish')) return 'phase-nourish';
    if (p.includes('move')) return 'phase-move';
    return 'phase-restore';
  }

  function statusClass(status) {
    if (!status) return 'status-active';
    const s = status.toLowerCase();
    if (s === 'paused') return 'status-paused';
    if (s === 'completed') return 'status-completed';
    if (s === 'pending') return 'status-pending';
    return 'status-active';
  }

  // =============================================
  // MOBILE SIDEBAR TOGGLE
  // =============================================

  const sidebarToggle = document.getElementById('adminSidebarToggle');
  const sidebarOverlay = document.getElementById('adminSidebarOverlay');
  const sidebar = document.querySelector('.admin-sidebar');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (sidebarOverlay) {
        sidebarOverlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
        requestAnimationFrame(() => sidebarOverlay.classList.toggle('visible', sidebar.classList.contains('open')));
      }
    });
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('visible');
      setTimeout(() => sidebarOverlay.style.display = 'none', 300);
    });
  }

  // =============================================
  // SIGN OUT
  // =============================================

  document.querySelectorAll('.admin-signout').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      await CMS.signOut();
      window.location.href = 'login.html';
    });
  });

  // =============================================
  // DASHBOARD (index.html)
  // =============================================

  const dashStats = document.getElementById('dashboardStats');
  if (dashStats) {
    const clients = (await CMS.getAll(CMS.KEYS.clients)) || [];
    const resources = (await CMS.getAll(CMS.KEYS.resources)) || [];
    const programs = (await CMS.getAll(CMS.KEYS.programs)) || [];
    let contactCount = 0;
    try { const subs = (await CMS.getAll(CMS.KEYS.contactSubmissions)) || []; contactCount = subs.filter(s => s.status === 'new').length; } catch(e) {}
    const active = clients.filter(c => c.status === 'active').length;
    const pending = clients.filter(c => c.status === 'paused').length;
    dashStats.innerHTML = `
      <div class="stat-card"><p class="label">Total Clients</p><p class="stat-value">${clients.length}</p><p class="stat-change positive">${active} active</p></div>
      <div class="stat-card"><p class="label">Active Programs</p><p class="stat-value">${programs.length}</p><p class="stat-change neutral">Running</p></div>
      <div class="stat-card"><p class="label">New Inquiries</p><p class="stat-value">${contactCount}</p><p class="stat-change ${contactCount > 0 ? 'positive' : 'neutral'}">${contactCount > 0 ? 'Needs response' : 'All handled'}</p></div>
      <div class="stat-card"><p class="label">Resources</p><p class="stat-value">${resources.length}</p><p class="stat-change positive">Available</p></div>
    `;
  }

  const dashClients = document.getElementById('dashboardClients');
  if (dashClients) {
    const clients = ((await CMS.getAll(CMS.KEYS.clients)) || []).slice(0, 5);
    dashClients.innerHTML = clients.map(c => `
      <tr>
        <td class="client-name">${c.name}</td>
        <td>${c.program}</td>
        <td><span class="phase-badge phase-badge--sm ${phaseClass(c.phase)}">${c.phase || 'Restore'}</span></td>
        <td><span class="status-badge ${statusClass(c.status)}">${c.status || 'Active'}</span></td>
        <td>${c.lastActive || '—'}</td>
      </tr>
    `).join('');
  }

  // =============================================
  // CLIENTS LIST (clients.html)
  // =============================================

  const clientsTable = document.getElementById('clientsTableBody');
  if (clientsTable) {
    let allClients = (await CMS.getAll(CMS.KEYS.clients)) || [];

    function renderClients(list) {
      clientsTable.innerHTML = list.map(c => `
        <tr>
          <td class="client-name">${c.name}</td>
          <td>${c.email || '—'}</td>
          <td>${c.program}</td>
          <td><span class="phase-badge phase-badge--sm ${phaseClass(c.phase)}">${c.phase || 'Restore'}</span></td>
          <td>${c.week || '—'}/${c.totalWeeks || '—'}</td>
          <td><span class="status-badge ${statusClass(c.status)}">${c.status || 'Active'}</span></td>
          <td>${c.lastActive || '—'}</td>
          <td><a href="client-detail.html?id=${c.id}" class="admin-view-link">View →</a></td>
        </tr>
      `).join('');
    }

    renderClients(allClients);

    // Stats
    const cStats = document.getElementById('clientStats');
    if (cStats) {
      const active = allClients.filter(c => c.status === 'active').length;
      const paused = allClients.filter(c => c.status === 'paused').length;
      const completed = allClients.filter(c => c.status === 'completed').length;
      cStats.innerHTML = `
        <div class="stat-card"><p class="label">Total</p><p class="stat-value">${allClients.length}</p></div>
        <div class="stat-card"><p class="label">Active</p><p class="stat-value">${active}</p></div>
        <div class="stat-card"><p class="label">Paused</p><p class="stat-value">${paused}</p></div>
        <div class="stat-card"><p class="label">Completed</p><p class="stat-value">${completed}</p></div>
      `;
    }

    // Search + Filter
    const searchInput = document.getElementById('clientSearch');
    const filterSelect = document.getElementById('clientFilter');
    function applyFilters() {
      let list = allClients;
      const q = (searchInput?.value || '').toLowerCase();
      const prog = filterSelect?.value || 'all';
      if (q) list = list.filter(c => c.name.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q));
      if (prog !== 'all') list = list.filter(c => c.program === prog);
      renderClients(list);
    }
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterSelect) filterSelect.addEventListener('change', applyFilters);

    // --- Add Client Form ---
    const addClientBtn = document.getElementById('addClientBtn');
    const addClientForm = document.getElementById('addClientForm');
    const cancelNewClient = document.getElementById('cancelNewClientBtn');
    if (addClientBtn && addClientForm) {
      addClientBtn.addEventListener('click', () => {
        addClientForm.style.display = addClientForm.style.display === 'none' ? 'block' : 'none';
        if (addClientForm.style.display === 'block') addClientForm.scrollIntoView({ behavior: 'smooth' });
      });
      if (cancelNewClient) cancelNewClient.addEventListener('click', () => { addClientForm.style.display = 'none'; });
    }

    const saveNewClient = document.getElementById('saveNewClientBtn');
    if (saveNewClient) {
      saveNewClient.addEventListener('click', async () => {
        const name = document.getElementById('newClientName')?.value.trim();
        const email = document.getElementById('newClientEmail')?.value.trim();
        const phone = document.getElementById('newClientPhone')?.value.trim();
        const program = document.getElementById('newClientProgram')?.value;
        const phase = document.getElementById('newClientPhase')?.value;
        const sendInvite = document.getElementById('newClientInvite')?.checked;

        if (!name || !email) {
          showToast('Name and email are required', 'error');
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          showToast('Please enter a valid email', 'error');
          return;
        }

        saveNewClient.textContent = 'Creating...';
        saveNewClient.disabled = true;

        try {
          // Create client record
          const clientId = 'client-' + Date.now().toString(36);
          const clientData = {
            id: clientId,
            name,
            email,
            phone,
            program,
            phase,
            week: 1,
            totalWeeks: 12,
            status: 'active',
            coach: 'Coach',
            enrolledDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            lastActive: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            coachNotes: []
          };

          // If sending invite, create Supabase auth user via magic link
          if (sendInvite && typeof supabase !== 'undefined') {
            try {
              const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: { name, role: 'client' }
              });
              if (authErr) {
                // Fallback: send magic link instead
                await supabase.auth.signInWithOtp({ email, options: { data: { name } } });
                showToast('Magic link sent to ' + email, 'success');
              } else if (authData?.user) {
                clientData.authUserId = authData.user.id;
              }
            } catch (inviteErr) {
              // Fallback: just send magic link
              try {
                await supabase.auth.signInWithOtp({ email, options: { data: { name } } });
                showToast('Magic link sent to ' + email, 'success');
              } catch (e2) { console.warn('Could not send invite:', e2.message); }
            }
          }

          await CMS.add(CMS.KEYS.clients, clientData);
          showToast('Client created successfully');
          addClientForm.style.display = 'none';
          document.getElementById('newClientName').value = '';
          document.getElementById('newClientEmail').value = '';
          document.getElementById('newClientPhone').value = '';
          setTimeout(() => window.location.reload(), 600);
        } catch (e) {
          showToast('Error creating client: ' + e.message, 'error');
        } finally {
          saveNewClient.textContent = 'Create Client';
          saveNewClient.disabled = false;
        }
      });
    }
  }

  // =============================================
  // CLIENT DETAIL (client-detail.html)
  // =============================================

  const detailMain = document.getElementById('clientDetailMain');
  if (detailMain) {
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('id') || 'client-1';
    const client = await CMS.getById(CMS.KEYS.clients, clientId);
    if (!client) { detailMain.innerHTML = '<p>Client not found.</p>'; }
    else {
      // Populate header
      const dh = document.getElementById('detailHeader');
      if (dh) dh.innerHTML = `
        <div>
          <p class="admin-breadcrumb"><a href="clients.html">← Back to Clients</a></p>
          <h1>${client.name}</h1>
          <p>${client.program} · Week ${client.week || '?'} of ${client.totalWeeks || '?'}</p>
        </div>
        <div class="admin-header__actions">
          <span class="phase-badge ${phaseClass(client.phase)}">${client.phase || 'Restore'} Phase</span>
          <span class="status-badge ${statusClass(client.status)}" style="padding:8px 16px;">${client.status || 'Active'}</span>
        </div>
      `;

      // Populate fields
      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
      setVal('cd-name', client.name);
      setVal('cd-email', client.email);
      setVal('cd-phone', client.phone);
      setVal('cd-enrolled', client.enrolledDate);
      setVal('cd-program', client.program);
      setVal('cd-phase', client.phase);
      setVal('cd-week', client.week);
      setVal('cd-status', client.status);

      // Quick info
      const qi = document.getElementById('quickInfo');
      if (qi) qi.innerHTML = `
        <div class="admin-quick-info__row"><span class="admin-quick-info__label">Coach</span><span class="admin-quick-info__value">${client.coach || '—'}</span></div>
        <div class="admin-quick-info__row"><span class="admin-quick-info__label">Start Date</span><span>${client.enrolledDate || '—'}</span></div>
        <div class="admin-quick-info__row"><span class="admin-quick-info__label">Sessions Done</span><span>${client.week || 0} / ${client.totalWeeks || 0}</span></div>
        <div class="admin-quick-info__row"><span class="admin-quick-info__label">Last Active</span><span>${client.lastActive || '—'}</span></div>
      `;

      // Current focus
      const focusTemplates = (await CMS.getAll(CMS.KEYS.focusTemplates)) || [];
      const focusSelect = document.getElementById('cd-focus');
      if (focusSelect) {
        focusSelect.innerHTML = focusTemplates.map(f => `<option value="${f.id}">${f.title}</option>`).join('');
      }

      // Save client changes
      const saveBtn = document.getElementById('saveClientBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
          await CMS.update(CMS.KEYS.clients, clientId, {
            name: document.getElementById('cd-name')?.value,
            email: document.getElementById('cd-email')?.value,
            phone: document.getElementById('cd-phone')?.value,
            program: document.getElementById('cd-program')?.value,
            phase: document.getElementById('cd-phase')?.value,
            week: parseInt(document.getElementById('cd-week')?.value) || 1,
            status: document.getElementById('cd-status')?.value,
            assignedFocus: document.getElementById('cd-focus')?.value || ''
          });
          showToast('Client updated');
        });
      }

      // Add coach note
      const addNoteBtn = document.getElementById('addNoteBtn');
      if (addNoteBtn) {
        addNoteBtn.addEventListener('click', async () => {
          const textarea = document.getElementById('newNoteText');
          if (!textarea || !textarea.value.trim()) return;
          const notes = client.coachNotes || [];
          notes.unshift({ text: textarea.value.trim(), author: 'Admin', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) });
          await CMS.update(CMS.KEYS.clients, clientId, { coachNotes: notes });
          textarea.value = '';
          renderCoachNotes(notes);
          showToast('Note added');
        });
      }

      function renderCoachNotes(notes) {
        const container = document.getElementById('coachNotesList');
        if (!container) return;
        container.innerHTML = (notes || []).map(n => `
          <div class="admin-coach-note">
            <div class="admin-coach-note__header">
              <p class="admin-coach-note__author">${n.author}</p>
              <p class="admin-coach-note__date">${n.date}</p>
            </div>
            <p class="admin-coach-note__text">${n.text}</p>
          </div>
        `).join('') || '<p class="text-small text-muted">No notes yet.</p>';
      }
      renderCoachNotes(client.coachNotes);

      // Pause / Remove
      document.getElementById('pauseClientBtn')?.addEventListener('click', async () => {
        await CMS.update(CMS.KEYS.clients, clientId, { status: 'paused' });
        showToast('Client paused');
        setTimeout(() => window.location.reload(), 800);
      });
      document.getElementById('removeClientBtn')?.addEventListener('click', async () => {
        if (await confirmDelete(client.name)) {
          await CMS.remove(CMS.KEYS.clients, clientId);
          showToast('Client removed', 'error');
          setTimeout(() => window.location.href = 'clients.html', 800);
        }
      });

      // --- Client Reflections Viewer ---
      const reflContainer = document.getElementById('clientReflections');
      if (reflContainer) {
        try {
          const allReflections = (await CMS.getAll(CMS.KEYS.reflections)) || [];
          const clientRefls = allReflections
            .filter(r => r.clientId === clientId || r.client_id === clientId)
            .sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));

          if (!clientRefls.length) {
            reflContainer.innerHTML = '<p class="text-small text-muted">No reflections submitted yet.</p>';
          } else {
            reflContainer.innerHTML = clientRefls.map(r => {
              const date = new Date(r.createdAt || r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const esc = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
              let html = `<div style="border:1px solid var(--border);border-radius:10px;padding:16px;" data-refl-id="${r.id}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                  <span style="font-weight:600;">Week ${r.week || '?'} — ${esc(r.focusTitle || r.focus_title || 'N/A')}</span>
                  <span style="font-size:0.78rem;color:#999;">${date}</span>
                </div>`;
              if (r.sleep) html += `<p style="font-size:0.85rem;margin-bottom:6px;"><strong>Sleep:</strong> ${esc(r.sleep)}</p>`;
              if (r.energy) html += `<p style="font-size:0.85rem;margin-bottom:6px;"><strong>Energy:</strong> ${esc(r.energy)}</p>`;
              if (r.hard) html += `<p style="font-size:0.85rem;margin-bottom:6px;"><strong>What felt hard:</strong> ${esc(r.hard)}</p>`;
              if (r.good) html += `<p style="font-size:0.85rem;margin-bottom:6px;"><strong>What felt good:</strong> ${esc(r.good)}</p>`;
              // Coach feedback
              if (r.coachFeedback || r.coach_feedback) {
                html += `<div style="background:var(--cream,#FAF8F5);padding:10px 14px;border-radius:8px;margin-top:10px;">
                  <p style="font-size:0.78rem;font-weight:600;color:var(--green);margin-bottom:4px;">Coach Feedback</p>
                  <p style="font-size:0.85rem;">${esc(r.coachFeedback || r.coach_feedback)}</p>
                </div>`;
              }
              html += `<div style="margin-top:10px;">
                <textarea class="refl-feedback-input" placeholder="Add coach feedback..." style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:0.82rem;font-family:var(--font-sans);resize:vertical;min-height:50px;">${r.coachFeedback || r.coach_feedback || ''}</textarea>
                <button class="btn btn-secondary refl-feedback-btn" data-id="${r.id}" style="margin-top:6px;font-size:0.8rem;padding:6px 14px;">Save Feedback</button>
              </div>`;
              html += '</div>';
              return html;
            }).join('');

            reflContainer.querySelectorAll('.refl-feedback-btn').forEach(btn => {
              btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const textarea = btn.previousElementSibling;
                const feedback = textarea?.value.trim();
                if (!feedback) return;
                await CMS.update(CMS.KEYS.reflections, id, { coachFeedback: feedback });
                showToast('Feedback saved');
                btn.textContent = 'Saved!';
                setTimeout(() => { btn.textContent = 'Save Feedback'; }, 1500);
              });
            });
          }
        } catch (e) {
          reflContainer.innerHTML = '<p class="text-small text-muted">Could not load reflections.</p>';
          console.warn('Reflections load error:', e.message);
        }
      }
    }
  }

  // =============================================
  // GENERIC CMS LIST PAGES (async)
  // =============================================

  function initCMSPage(config) {
    const { listId, formId, cmsKey, renderItem, getFormItem, formFields } = config;
    const listEl = document.getElementById(listId);
    const formEl = document.getElementById(formId);
    if (!listEl) return;

    async function render(items) {
      if (!items) items = (await CMS.getAll(cmsKey)) || [];
      listEl.innerHTML = items.length ? items.map(item => renderItem(item)).join('') : '<p class="text-small text-muted" style="padding:16px;">No items yet.</p>';

      // Bind delete
      listEl.querySelectorAll('.cms-item-actions button.delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const name = btn.closest('.cms-item')?.querySelector('h4')?.textContent || 'this item';
          if (await confirmDelete(name)) {
            await CMS.remove(cmsKey, id);
            await render();
            showToast('Item deleted');
          }
        });
      });

      // Bind edit
      listEl.querySelectorAll('.cms-item-actions button.edit-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const item = await CMS.getById(cmsKey, id);
          if (!item || !formEl) return;
          formEl.style.display = 'block';
          formEl.setAttribute('data-edit-id', id);
          if (formFields) {
            formFields.forEach(f => {
              const el = formEl.querySelector(`[name="${f}"]`);
              if (!el) return;
              if (el.type === 'checkbox') el.checked = !!item[f];
              else el.value = item[f] || '';
            });
          }
          formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });

      // Bind publish (blog)
      listEl.querySelectorAll('.cms-item-actions button.publish-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const item = await CMS.getById(cmsKey, id);
          if (!item) return;
          const newStatus = item.status === 'published' ? 'draft' : 'published';
          await CMS.update(cmsKey, id, { status: newStatus });
          await render();
          showToast(newStatus === 'published' ? 'Article published' : 'Article unpublished');
        });
      });
    }

    render();

    // Form save
    if (formEl) {
      const saveBtn = formEl.querySelector('.btn-primary');
      const cancelBtn = formEl.querySelector('.btn-secondary');

      if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          const editId = formEl.getAttribute('data-edit-id');
          const item = getFormItem(formEl);
          if (editId) {
            await CMS.update(cmsKey, editId, item);
            showToast('Item updated');
          } else {
            await CMS.add(cmsKey, item);
            showToast('Item added');
          }
          formEl.style.display = 'none';
          resetForm(formEl);
          await render();
        });
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
          e.preventDefault();
          formEl.style.display = 'none';
          resetForm(formEl);
        });
      }
    }

    // Add button
    const addBtn = document.getElementById('addItemBtn');
    if (addBtn && formEl) {
      addBtn.addEventListener('click', () => {
        resetForm(formEl);
        formEl.style.display = 'block';
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    return { render };
  }

  // =============================================
  // CMS: PROGRAMS
  // =============================================

  initCMSPage({
    listId: 'programsList',
    formId: 'programForm',
    cmsKey: CMS.KEYS.programs,
    formFields: ['title', 'duration', 'status', 'idealFor', 'description', 'url', 'format', 'price'],
    renderItem: (p) => `
      <div class="cms-item">
        <div class="cms-item-info"><h4>${p.title}</h4><p>${p.duration || '—'} · ${p.status || 'Open'} · ${p.idealFor || '—'}</p></div>
        <div class="cms-item-actions"><button class="edit-btn" data-id="${p.id}">Edit</button><button class="delete" data-id="${p.id}">Delete</button></div>
      </div>`,
    getFormItem: (f) => getFormData(f)
  });

  // =============================================
  // CMS: TESTIMONIALS (new format with before/after + video)
  // =============================================

  const testiList = document.getElementById('testimonialsList');
  const testiForm = document.getElementById('testimonialForm');

  if (testiList && testiForm) {
    let allTestimonials = [];

    async function loadTestimonials() {
      allTestimonials = (await CMS.getAll(CMS.KEYS.testimonials)) || [];
      allTestimonials.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      renderTestimonials();
    }

    function renderTestimonials() {
      if (!allTestimonials.length) {
        testiList.innerHTML = '<p class="text-small text-muted">No testimonials yet. Click "+ Add Testimonial" to create one.</p>';
        return;
      }
      let html = '';
      allTestimonials.forEach(t => {
        const featBadge = t.featured ? '<span style="background:var(--green);color:#fff;padding:2px 8px;border-radius:4px;font-size:0.7rem;margin-left:8px;">FEATURED</span>' : '';
        const imgPreview = t.imgBefore ? `<img src="${t.imgBefore}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin-right:10px;">` : '';
        html += `<div class="cms-item" style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;">
            ${imgPreview}
            <div>
              <strong>${t.author || 'Unnamed'}</strong>${featBadge}
              <div style="font-size:0.8rem;color:#999;">${t.badge || ''} · ${t.result || ''} · ${t.program || ''}</div>
            </div>
          </div>
          <button class="btn btn-secondary edit-testi-btn" data-id="${t.id}" style="font-size:0.8rem;padding:4px 12px;">Edit</button>
        </div>`;
      });
      testiList.innerHTML = html;
      testiList.querySelectorAll('.edit-testi-btn').forEach(btn => {
        btn.addEventListener('click', () => editTestimonial(btn.dataset.id));
      });
    }

    function resetTestiForm() {
      testiForm.style.display = 'none';
      document.getElementById('testiEditId').value = '';
      document.getElementById('testiBadge').value = '';
      document.getElementById('testiResult').value = '';
      document.getElementById('testiQuote').value = '';
      document.getElementById('testiContext').value = '';
      document.getElementById('testiBeforeText').value = '';
      document.getElementById('testiAfterText').value = '';
      document.getElementById('testiAuthor').value = '';
      document.getElementById('testiProgram').value = '1:1 Coaching';
      document.getElementById('testiImgBefore').value = '';
      document.getElementById('testiImgAfter').value = '';
      document.getElementById('testiVideoUrl').value = '';
      document.getElementById('testiSortOrder').value = '0';
      document.getElementById('testiFeatured').checked = false;
      document.getElementById('testiDispHomepage').checked = true;
      document.getElementById('testiDispStories').checked = true;
      document.getElementById('testiImgBeforePreview').innerHTML = '<span style="color:#999;font-size:0.8rem;">No image</span>';
      document.getElementById('testiImgAfterPreview').innerHTML = '<span style="color:#999;font-size:0.8rem;">No image</span>';
      document.getElementById('testiVideoPreview').innerHTML = '<span style="color:#999;font-size:0.8rem;">No video</span>';
      document.getElementById('deleteTestiBtn').style.display = 'none';
      document.getElementById('testiFormTitle').textContent = 'Add New Testimonial';
    }

    function editTestimonial(id) {
      const t = allTestimonials.find(x => x.id === id);
      if (!t) return;
      document.getElementById('testiEditId').value = t.id;
      document.getElementById('testiBadge').value = t.badge || '';
      document.getElementById('testiResult').value = t.result || '';
      document.getElementById('testiQuote').value = t.quote || '';
      document.getElementById('testiContext').value = t.context || '';
      document.getElementById('testiBeforeText').value = t.beforeText || '';
      document.getElementById('testiAfterText').value = t.afterText || '';
      document.getElementById('testiAuthor').value = t.author || '';
      document.getElementById('testiProgram').value = t.program || '1:1 Coaching';
      document.getElementById('testiImgBefore').value = t.imgBefore || '';
      document.getElementById('testiImgAfter').value = t.imgAfter || '';
      document.getElementById('testiVideoUrl').value = t.videoUrl || '';
      document.getElementById('testiSortOrder').value = t.sortOrder || 0;
      document.getElementById('testiFeatured').checked = !!t.featured;
      const dispOn = t.displayOn || [];
      document.getElementById('testiDispHomepage').checked = dispOn.includes('homepage');
      document.getElementById('testiDispStories').checked = dispOn.includes('stories');
      document.getElementById('testiImgBeforePreview').innerHTML = t.imgBefore ? `<img src="${t.imgBefore}" style="max-height:100px;border-radius:6px;">` : '<span style="color:#999;font-size:0.8rem;">No image</span>';
      document.getElementById('testiImgAfterPreview').innerHTML = t.imgAfter ? `<img src="${t.imgAfter}" style="max-height:100px;border-radius:6px;">` : '<span style="color:#999;font-size:0.8rem;">No image</span>';
      document.getElementById('testiVideoPreview').innerHTML = t.videoUrl ? `<video src="${t.videoUrl}" style="max-height:100px;border-radius:6px;" controls></video>` : '<span style="color:#999;font-size:0.8rem;">No video</span>';
      document.getElementById('deleteTestiBtn').style.display = 'inline-block';
      document.getElementById('testiFormTitle').textContent = 'Edit Testimonial';
      testiForm.style.display = 'block';
      testiForm.scrollIntoView({ behavior: 'smooth' });
    }

    document.getElementById('addTestimonialBtn')?.addEventListener('click', () => {
      resetTestiForm();
      testiForm.style.display = 'block';
      testiForm.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('cancelTestiBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      resetTestiForm();
    });

    document.getElementById('saveTestiBtn')?.addEventListener('click', async (e) => {
      e.preventDefault();
      const author = document.getElementById('testiAuthor').value.trim();
      if (!author) { showToast('Client name is required', 'error'); return; }

      const displayOn = [];
      if (document.getElementById('testiDispHomepage').checked) displayOn.push('homepage');
      if (document.getElementById('testiDispStories').checked) displayOn.push('stories');

      const data = {
        badge: document.getElementById('testiBadge').value.trim(),
        result: document.getElementById('testiResult').value.trim(),
        quote: document.getElementById('testiQuote').value.trim(),
        context: document.getElementById('testiContext').value.trim(),
        beforeText: document.getElementById('testiBeforeText').value.trim(),
        afterText: document.getElementById('testiAfterText').value.trim(),
        author,
        program: document.getElementById('testiProgram').value,
        imgBefore: document.getElementById('testiImgBefore').value.trim(),
        imgAfter: document.getElementById('testiImgAfter').value.trim(),
        videoUrl: document.getElementById('testiVideoUrl').value.trim(),
        sortOrder: parseInt(document.getElementById('testiSortOrder').value) || 0,
        featured: document.getElementById('testiFeatured').checked,
        displayOn,
      };

      const editId = document.getElementById('testiEditId').value;
      if (editId) {
        await CMS.update(CMS.KEYS.testimonials, editId, data);
        showToast('Testimonial updated');
      } else {
        await CMS.add(CMS.KEYS.testimonials, data);
        showToast('Testimonial added');
      }
      resetTestiForm();
      await loadTestimonials();
    });

    document.getElementById('deleteTestiBtn')?.addEventListener('click', async () => {
      const editId = document.getElementById('testiEditId').value;
      if (!editId) return;
      if (!confirm('Delete this testimonial permanently?')) return;
      await CMS.remove(CMS.KEYS.testimonials, editId);
      showToast('Testimonial deleted');
      resetTestiForm();
      await loadTestimonials();
    });

    loadTestimonials();
  }

  // =============================================
  // CMS: RESOURCES
  // =============================================

  const resPage = initCMSPage({
    listId: 'resourcesList',
    formId: 'resourceForm',
    cmsKey: CMS.KEYS.resources,
    formFields: ['title', 'type', 'phase', 'duration', 'program', 'description', 'url'],
    renderItem: (r) => `
      <div class="cms-item" data-phase="${(r.phase || '').toLowerCase()}" data-type="${(r.type || '').toLowerCase()}">
        <div class="cms-item-info"><h4>${r.title}</h4><p>${r.type || '—'} · ${r.duration || ''} · ${r.phase || '—'} Phase · ${r.program || 'All'}</p></div>
        <div class="cms-item-actions"><button class="edit-btn" data-id="${r.id}">Edit</button><button class="delete" data-id="${r.id}">Delete</button></div>
      </div>`,
    getFormItem: (f) => getFormData(f)
  });

  // Resource filters
  const resPhaseFilter = document.getElementById('resPhaseFilter');
  const resTypeFilter = document.getElementById('resTypeFilter');
  if (resPhaseFilter && resPage) {
    async function filterResources() {
      const phase = resPhaseFilter.value.toLowerCase();
      const type = resTypeFilter?.value.toLowerCase() || 'all';
      let items = (await CMS.getAll(CMS.KEYS.resources)) || [];
      if (phase !== 'all') items = items.filter(r => (r.phase || '').toLowerCase() === phase);
      if (type !== 'all') items = items.filter(r => (r.type || '').toLowerCase() === type);
      resPage.render(items);
    }
    resPhaseFilter.addEventListener('change', filterResources);
    if (resTypeFilter) resTypeFilter.addEventListener('change', filterResources);
  }

  // =============================================
  // CMS: FOCUS TEMPLATES
  // =============================================

  const focusListEl = document.getElementById('focusListRestore') || document.getElementById('focusList');
  if (focusListEl) {
    const focusFormEl = document.getElementById('focusForm');

    async function renderFocusTemplates() {
      const all = (await CMS.getAll(CMS.KEYS.focusTemplates)) || [];
      const groups = { restore: [], nourish: [], move: [] };
      all.forEach(t => {
        const p = (t.phase || 'restore').toLowerCase();
        if (groups[p]) groups[p].push(t); else groups.restore.push(t);
      });

      ['restore', 'nourish', 'move'].forEach(phase => {
        const el = document.getElementById('focusList-' + phase);
        if (!el) return;
        el.innerHTML = groups[phase].map(t => `
          <div class="cms-item">
            <div class="cms-item-info"><h4>${t.title}</h4><p>${t.description || '—'}</p></div>
            <div class="cms-item-actions"><button class="edit-btn" data-id="${t.id}">Edit</button><button class="delete" data-id="${t.id}">Delete</button></div>
          </div>
        `).join('') || '<p class="text-small text-muted" style="padding:8px 16px;">No templates.</p>';

        // Bind events
        el.querySelectorAll('.delete').forEach(btn => {
          btn.addEventListener('click', async () => {
            const name = btn.closest('.cms-item')?.querySelector('h4')?.textContent || 'this item';
            if (await confirmDelete(name)) {
              await CMS.remove(CMS.KEYS.focusTemplates, btn.dataset.id);
              await renderFocusTemplates();
              showToast('Template deleted');
            }
          });
        });
        el.querySelectorAll('.edit-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const item = await CMS.getById(CMS.KEYS.focusTemplates, btn.dataset.id);
            if (!item || !focusFormEl) return;
            focusFormEl.style.display = 'block';
            focusFormEl.setAttribute('data-edit-id', item.id);
            ['title', 'phase', 'description', 'whyItMatters', 'goodEnough', 'coachTip'].forEach(f => {
              const el = focusFormEl.querySelector(`[name="${f}"]`);
              if (el) el.value = item[f] || '';
            });
            focusFormEl.scrollIntoView({ behavior: 'smooth' });
          });
        });
      });
    }

    await renderFocusTemplates();

    // Form save
    if (focusFormEl) {
      const saveBtn = focusFormEl.querySelector('.btn-primary');
      const cancelBtn = focusFormEl.querySelector('.btn-secondary');
      if (saveBtn) saveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const editId = focusFormEl.getAttribute('data-edit-id');
        const data = getFormData(focusFormEl);
        if (editId) { await CMS.update(CMS.KEYS.focusTemplates, editId, data); showToast('Template updated'); }
        else { await CMS.add(CMS.KEYS.focusTemplates, data); showToast('Template added'); }
        focusFormEl.style.display = 'none';
        resetForm(focusFormEl);
        await renderFocusTemplates();
      });
      if (cancelBtn) cancelBtn.addEventListener('click', (e) => { e.preventDefault(); focusFormEl.style.display = 'none'; resetForm(focusFormEl); });
    }

    document.getElementById('addItemBtn')?.addEventListener('click', () => {
      if (focusFormEl) { resetForm(focusFormEl); focusFormEl.style.display = 'block'; focusFormEl.scrollIntoView({ behavior: 'smooth' }); }
    });
  }

  // =============================================
  // CMS: BLOG
  // =============================================

  initCMSPage({
    listId: 'blogList',
    formId: 'blogForm',
    cmsKey: CMS.KEYS.blogPosts,
    formFields: ['title', 'category', 'status', 'excerpt', 'body', 'image'],
    renderItem: (b) => `
      <div class="cms-item">
        <div class="cms-item-info"><h4>${b.title}</h4><p>${b.status === 'published' ? 'Published' : 'Draft'} · ${b.category || '—'} · ${b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}</p></div>
        <div class="cms-item-actions"><button class="edit-btn" data-id="${b.id}">Edit</button><button class="publish-btn" data-id="${b.id}">${b.status === 'published' ? 'Unpublish' : 'Publish'}</button><button class="delete" data-id="${b.id}">Delete</button></div>
      </div>`,
    getFormItem: (f) => getFormData(f)
  });

  // =============================================
  // CMS: FOUNDERS
  // =============================================

  const founder1Form = document.getElementById('founder1Form');
  const founder2Form = document.getElementById('founder2Form');

  async function initFounderForm(formEl, index) {
    if (!formEl) return;
    const founders = (await CMS.getAll(CMS.KEYS.founders)) || [];
    const founder = founders[index];

    const previewName = document.getElementById('founderPreviewName' + index);
    const previewRole = document.getElementById('founderPreviewRole' + index);
    const previewQuote = document.getElementById('founderPreviewQuote' + index);
    const previewImg = document.getElementById('founderImg' + index);
    const imgUrlInput = document.getElementById('founderImgUrl' + index);

    if (founder) {
      ['name', 'role', 'quote', 'bio', 'certifications'].forEach(f => {
        const el = formEl.querySelector(`[name="${f}"]`);
        if (el) el.value = founder[f] || '';
      });
      if (previewName) previewName.textContent = founder.name || 'Founder Name';
      if (previewRole) previewRole.textContent = founder.role || 'Role';
      if (previewQuote) previewQuote.textContent = founder.quote ? '"' + founder.quote + '"' : '';
      if (previewImg && founder.imageUrl) {
        previewImg.innerHTML = '<img src="' + founder.imageUrl + '" alt="' + (founder.name || '') + '">';
        previewImg.classList.add('founder-preview__img--has-image');
      }
      if (imgUrlInput) imgUrlInput.value = founder.imageUrl || '';
    }

    // Live preview updates
    const nameInput = formEl.querySelector('[name="name"]');
    const roleInput = formEl.querySelector('[name="role"]');
    const quoteInput = formEl.querySelector('[name="quote"]');
    if (nameInput && previewName) nameInput.addEventListener('input', () => { previewName.textContent = nameInput.value || 'Founder Name'; });
    if (roleInput && previewRole) roleInput.addEventListener('input', () => { previewRole.textContent = roleInput.value || 'Role'; });
    if (quoteInput && previewQuote) quoteInput.addEventListener('input', () => { previewQuote.textContent = quoteInput.value ? '"' + quoteInput.value + '"' : ''; });

    // Image URL preview
    if (imgUrlInput && previewImg) {
      imgUrlInput.addEventListener('change', () => {
        const url = imgUrlInput.value.trim();
        if (url) {
          previewImg.innerHTML = '<img src="' + url + '" alt="Preview">';
          previewImg.classList.add('founder-preview__img--has-image');
        }
      });
    }

    const saveBtn = formEl.querySelector('.btn-primary');
    if (saveBtn) {
      saveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const data = getFormData(formEl);
        if (imgUrlInput) data.imageUrl = imgUrlInput.value.trim();
        if (founder) { await CMS.update(CMS.KEYS.founders, founder.id, data); }
        else { await CMS.add(CMS.KEYS.founders, data); }
        showToast('Founder saved');
      });
    }
  }

  await initFounderForm(founder1Form, 0);
  await initFounderForm(founder2Form, 1);

  // =============================================
  // SETTINGS
  // =============================================

  const settingsPage = document.getElementById('settingsPage');
  if (settingsPage) {
    const settings = (await CMS.getAll(CMS.KEYS.settings)) || {};
    // Settings from Supabase comes as array with single item or object
    const s = Array.isArray(settings) ? (settings[0] || {}) : settings;

    // General form
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setVal('set-siteName', s.siteName);
    setVal('set-contactEmail', s.contactEmail);
    setVal('set-whatsapp', s.whatsappNumber);
    setVal('set-tagline', s.footerTagline);

    document.getElementById('saveSettingsBtn')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await CMS.update(CMS.KEYS.settings, s.id || 'settings', {
        siteName: document.getElementById('set-siteName')?.value,
        contactEmail: document.getElementById('set-contactEmail')?.value,
        whatsappNumber: document.getElementById('set-whatsapp')?.value,
        footerTagline: document.getElementById('set-tagline')?.value
      });
      showToast('Settings saved');
    });

    // Feature toggles
    function bindToggle(elId, path) {
      const el = document.getElementById(elId);
      if (!el) return;
      const keys = path.split('.');
      let val = s;
      keys.forEach(k => val = val?.[k]);
      el.checked = !!val;
      el.addEventListener('change', async () => {
        let obj = s;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!obj[keys[i]]) obj[keys[i]] = {};
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = el.checked;
        await CMS.update(CMS.KEYS.settings, s.id || 'settings', {
          features: s.features,
          programAvailability: s.programAvailability
        });
        showToast('Setting updated');
      });
    }

    bindToggle('toggle-blog', 'features.blog');
    bindToggle('toggle-selfReg', 'features.selfRegistration');
    bindToggle('toggle-messaging', 'features.inAppMessaging');
    bindToggle('toggle-coaching', 'programAvailability.coaching');
    bindToggle('toggle-cohort', 'programAvailability.cohort');
    bindToggle('toggle-corporate', 'programAvailability.corporate');
    bindToggle('toggle-masterclass', 'programAvailability.masterclass');

    // --- Coming Soon Mode ---
    const comingSoonToggle = document.getElementById('toggle-comingSoon');
    const siteModeBadge = document.getElementById('siteModeBadge');
    const siteModeIndicator = document.getElementById('siteModeIndicator');
    const siteModeText = document.getElementById('siteModeText');

    const previewLinkBox = document.getElementById('previewLinkBox');
    const previewLinkInput = document.getElementById('previewLinkInput');
    const copyPreviewLink = document.getElementById('copyPreviewLink');

    function generateToken() {
      var arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      return Array.from(arr, function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    }

    function updatePreviewLink(isComingSoon, token) {
      if (!previewLinkBox) return;
      if (isComingSoon && token) {
        var origin = window.location.origin.replace('/admin', '').replace(/\/$/, '');
        var siteBase = origin.includes('samatvam.living') ? origin : origin;
        previewLinkInput.value = siteBase + '/?preview=' + token;
        previewLinkBox.style.display = 'block';
      } else {
        previewLinkBox.style.display = 'none';
      }
    }

    function updateSiteModeBadge(isComingSoon) {
      if (!siteModeBadge) return;
      if (isComingSoon) {
        siteModeBadge.style.background = 'rgba(234, 179, 8, 0.12)';
        siteModeBadge.style.color = '#B45309';
        siteModeIndicator.style.background = '#EAB308';
        siteModeText.textContent = 'Coming Soon — Site is hidden from public';
      } else {
        siteModeBadge.style.background = 'rgba(107, 159, 133, 0.12)';
        siteModeBadge.style.color = 'var(--green)';
        siteModeIndicator.style.background = 'var(--green)';
        siteModeText.textContent = 'Live — Site is publicly accessible';
      }
    }

    if (comingSoonToggle) {
      const isComingSoon = !!(s.features && s.features.comingSoon);
      comingSoonToggle.checked = isComingSoon;
      updateSiteModeBadge(isComingSoon);
      updatePreviewLink(isComingSoon, s.features && s.features.previewToken);

      comingSoonToggle.addEventListener('change', async () => {
        if (!s.features) s.features = {};
        s.features.comingSoon = comingSoonToggle.checked;
        if (comingSoonToggle.checked && !s.features.previewToken) {
          s.features.previewToken = generateToken();
        }
        if (!comingSoonToggle.checked) {
          delete s.features.previewToken;
        }
        await CMS.update(CMS.KEYS.settings, s.id || 'settings', { features: s.features });
        updateSiteModeBadge(comingSoonToggle.checked);
        updatePreviewLink(comingSoonToggle.checked, s.features.previewToken);
        showToast(comingSoonToggle.checked ? 'Coming Soon mode enabled' : 'Site is now Live');
      });
    }

    if (copyPreviewLink) {
      copyPreviewLink.addEventListener('click', function() {
        previewLinkInput.select();
        navigator.clipboard.writeText(previewLinkInput.value).then(function() {
          copyPreviewLink.textContent = 'Copied!';
          setTimeout(function() { copyPreviewLink.textContent = 'Copy Link'; }, 2000);
        });
      });
    }

    // --- Payment Settings ---
    const paymentCard = document.getElementById('paymentSettingsCard');
    if (paymentCard) {
      const checkoutToggle = document.getElementById('toggle-checkout');
      const configFields = document.getElementById('paymentConfigFields');
      const providerSelect = document.getElementById('pay-provider');
      const stripeFieldsEl = document.getElementById('stripeFields');
      const razorpayFieldsEl = document.getElementById('razorpayFields');

      // Load current values
      if (checkoutToggle) {
        checkoutToggle.checked = !!(s.features && s.features.checkout);
        configFields.style.display = checkoutToggle.checked ? 'block' : 'none';
      }
      if (providerSelect) providerSelect.value = s.paymentProvider || 'stripe';
      const payVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
      payVal('pay-stripePublishable', s.stripePublishableKey);
      payVal('pay-stripeSecret', s.stripeSecretKey);
      payVal('pay-razorpayKeyId', s.razorpayKeyId);
      payVal('pay-razorpayKeySecret', s.razorpayKeySecret);

      // Show/hide provider fields
      function updateProviderFields() {
        const prov = providerSelect ? providerSelect.value : 'stripe';
        if (stripeFieldsEl) stripeFieldsEl.style.display = prov === 'stripe' ? 'block' : 'none';
        if (razorpayFieldsEl) razorpayFieldsEl.style.display = prov === 'razorpay' ? 'block' : 'none';
      }
      updateProviderFields();
      if (providerSelect) providerSelect.addEventListener('change', updateProviderFields);

      // Toggle checkout on/off
      if (checkoutToggle) {
        checkoutToggle.addEventListener('change', async () => {
          configFields.style.display = checkoutToggle.checked ? 'block' : 'none';
          if (!s.features) s.features = {};
          s.features.checkout = checkoutToggle.checked;
          await CMS.update(CMS.KEYS.settings, s.id || 'settings', { features: s.features });
          showToast(checkoutToggle.checked ? 'Checkout enabled' : 'Checkout disabled');
        });
      }

      // Save payment settings
      document.getElementById('savePaymentSettingsBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await CMS.update(CMS.KEYS.settings, s.id || 'settings', {
          paymentProvider: providerSelect ? providerSelect.value : 'stripe',
          stripePublishableKey: document.getElementById('pay-stripePublishable')?.value || '',
          stripeSecretKey: document.getElementById('pay-stripeSecret')?.value || '',
          razorpayKeyId: document.getElementById('pay-razorpayKeyId')?.value || '',
          razorpayKeySecret: document.getElementById('pay-razorpayKeySecret')?.value || ''
        });
        showToast('Payment settings saved');
      });
    }

    // --- Email Settings ---
    const emailCard = document.getElementById('emailSettingsCard');
    if (emailCard) {
      const emailToggle = document.getElementById('toggle-emailNotifications');
      const emailFields = document.getElementById('emailConfigFields');

      // Load current values
      if (emailToggle) {
        emailToggle.checked = !!(s.features && s.features.emailNotifications);
        emailFields.style.display = emailToggle.checked ? 'block' : 'none';
      }
      const eVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
      eVal('email-adminEmail', s.adminEmail);
      eVal('email-publicKey', s.emailjsPublicKey);
      eVal('email-serviceId', s.emailjsServiceId);
      eVal('email-contactTemplate', s.emailjsContactTemplate);
      eVal('email-paymentTemplate', s.emailjsPaymentTemplate);
      eVal('email-adminTemplate', s.emailjsAdminTemplate);

      // Toggle
      if (emailToggle) {
        emailToggle.addEventListener('change', async () => {
          emailFields.style.display = emailToggle.checked ? 'block' : 'none';
          if (!s.features) s.features = {};
          s.features.emailNotifications = emailToggle.checked;
          await CMS.update(CMS.KEYS.settings, s.id || 'settings', { features: s.features });
          showToast(emailToggle.checked ? 'Email notifications enabled' : 'Email notifications disabled');
        });
      }

      // Save
      document.getElementById('saveEmailSettingsBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await CMS.update(CMS.KEYS.settings, s.id || 'settings', {
          adminEmail: document.getElementById('email-adminEmail')?.value || '',
          emailjsPublicKey: document.getElementById('email-publicKey')?.value || '',
          emailjsServiceId: document.getElementById('email-serviceId')?.value || '',
          emailjsContactTemplate: document.getElementById('email-contactTemplate')?.value || '',
          emailjsPaymentTemplate: document.getElementById('email-paymentTemplate')?.value || '',
          emailjsAdminTemplate: document.getElementById('email-adminTemplate')?.value || ''
        });
        showToast('Email settings saved');
      });
    }

    // --- Mailchimp Settings ---
    const mcCard = document.getElementById('mailchimpSettingsCard');
    if (mcCard) {
      const mcToggle = document.getElementById('toggle-mailchimp');
      const mcFields = document.getElementById('mailchimpConfigFields');

      if (mcToggle) {
        mcToggle.checked = !!(s.features && s.features.mailchimp);
        mcFields.style.display = mcToggle.checked ? 'block' : 'none';
      }
      const mcVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
      mcVal('mc-formAction', s.mailchimpFormAction);
      mcVal('mc-u', s.mailchimpU);
      mcVal('mc-id', s.mailchimpId);

      if (mcToggle) {
        mcToggle.addEventListener('change', async () => {
          mcFields.style.display = mcToggle.checked ? 'block' : 'none';
          if (!s.features) s.features = {};
          s.features.mailchimp = mcToggle.checked;
          await CMS.update(CMS.KEYS.settings, s.id || 'settings', { features: s.features });
          showToast(mcToggle.checked ? 'Mailchimp enabled' : 'Mailchimp disabled');
        });
      }

      document.getElementById('saveMailchimpBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await CMS.update(CMS.KEYS.settings, s.id || 'settings', {
          mailchimpFormAction: document.getElementById('mc-formAction')?.value || '',
          mailchimpU: document.getElementById('mc-u')?.value || '',
          mailchimpId: document.getElementById('mc-id')?.value || ''
        });
        showToast('Mailchimp settings saved');
      });
    }

    // --- Team & Roles (dynamic admin management) ---
    const adminListBody = document.getElementById('adminListBody');
    if (adminListBody) {
      const currentSession = await CMS.getSession();
      const currentUserId = currentSession ? currentSession.user.id : null;

      async function loadAdmins() {
        try {
          const { data: admins, error } = await supabaseClient
            .from('profiles')
            .select('id, full_name, email, role, updated_at')
            .eq('role', 'admin')
            .order('updated_at', { ascending: true });
          if (error) throw error;

          // Also get emails from auth (via profiles join isn't possible client-side, so show what we have)
          if (!admins || admins.length === 0) {
            adminListBody.innerHTML = '<tr><td colspan="5" class="text-muted text-center" style="padding:20px;">No admins found.</td></tr>';
            return;
          }

          adminListBody.innerHTML = admins.map(a => {
            const isSelf = a.id === currentUserId;
            const displayName = a.full_name || '—';
            const displayEmail = a.email || a.id.substring(0, 8) + '...';
            const removeBtn = isSelf
              ? '<span class="text-small text-muted">You</span>'
              : `<button class="btn btn-secondary btn-sm remove-admin-btn" data-id="${a.id}" data-name="${displayName}" style="font-size:0.75rem;padding:4px 10px;color:#D32F2F;">Remove</button>`;
            return `<tr>
              <td class="client-name">${displayName}</td>
              <td>${displayEmail}</td>
              <td>Admin</td>
              <td><span class="status-badge status-active">Active</span></td>
              <td>${removeBtn}</td>
            </tr>`;
          }).join('');

          // Bind remove buttons
          adminListBody.querySelectorAll('.remove-admin-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.dataset.id;
              const name = btn.dataset.name;
              const confirmed = typeof gConfirm === 'function'
                ? await gConfirm('Remove admin?', `"${name}" will lose admin access and be set to client role.`)
                : confirm(`Remove "${name}" from admin?`);
              if (!confirmed) return;
              try {
                const { error } = await supabaseClient
                  .from('profiles')
                  .update({ role: 'client' })
                  .eq('id', id);
                if (error) throw error;
                showToast(name + ' removed from admin');
                await loadAdmins();
              } catch (e) {
                showToast('Error: ' + e.message, 'error');
              }
            });
          });
        } catch (e) {
          adminListBody.innerHTML = '<tr><td colspan="5" class="text-muted text-center" style="padding:20px;">Could not load admins.</td></tr>';
          console.warn('Load admins error:', e.message);
        }
      }

      await loadAdmins();

      // Add new admin
      document.getElementById('addAdminBtn')?.addEventListener('click', async () => {
        const email = document.getElementById('newAdminEmail')?.value.trim();
        const name = document.getElementById('newAdminName')?.value.trim();
        if (!email) { showToast('Email is required', 'error'); return; }

        const btn = document.getElementById('addAdminBtn');
        btn.textContent = 'Adding...';
        btn.disabled = true;

        try {
          // Find user by email in profiles — we need to look up via auth
          // Since we can't query auth.users client-side, try to find by creating/inviting
          // First, try to find existing profile by querying all profiles (admin has SELECT access)
          const { data: allProfiles, error: pErr } = await supabaseClient
            .from('profiles')
            .select('id, full_name, role')
            .limit(500);

          if (pErr) throw pErr;

          // We need the auth user's email — but profiles don't store email
          // Best approach: use admin.createUser or signInWithOtp to create the user, then update role
          // Try admin API first
          let userId = null;

          try {
            const { data: authData, error: authErr } = await supabaseClient.auth.admin.createUser({
              email: email,
              email_confirm: true,
              user_metadata: { full_name: name || '', role: 'admin' }
            });
            if (authErr) {
              // User might already exist — try inviteUserByEmail
              const { data: inviteData, error: inviteErr } = await supabaseClient.auth.admin.inviteUserByEmail(email);
              if (inviteErr) {
                // User likely already exists — we need to find them
                // List users to find by email
                const { data: listData, error: listErr } = await supabaseClient.auth.admin.listUsers();
                if (!listErr && listData && listData.users) {
                  const found = listData.users.find(u => u.email === email);
                  if (found) userId = found.id;
                }
                if (!userId) throw new Error('Could not find or create user with email: ' + email + '. Make sure they have an account first.');
              } else if (inviteData?.user) {
                userId = inviteData.user.id;
              }
            } else if (authData?.user) {
              userId = authData.user.id;
            }
          } catch (adminErr) {
            // Admin API not available (anon key) — try to find user another way
            // Send magic link to create account, then admin must manually retry
            try {
              await supabaseClient.auth.signInWithOtp({ email, options: { data: { full_name: name || '' } } });
              showToast('Magic link sent to ' + email + '. After they sign in, click "Add Admin" again.', 'info');
              btn.textContent = 'Add Admin';
              btn.disabled = false;
              return;
            } catch (e2) {
              throw new Error('Cannot create admin: ' + (adminErr.message || e2.message));
            }
          }

          if (userId) {
            // Update profile role to admin
            const updateData = { role: 'admin' };
            if (name) updateData.full_name = name;
            if (email) updateData.email = email;
            const { error: updateErr } = await supabaseClient
              .from('profiles')
              .update(updateData)
              .eq('id', userId);

            if (updateErr) throw updateErr;
            showToast(email + ' added as admin');
            document.getElementById('newAdminEmail').value = '';
            document.getElementById('newAdminName').value = '';
            await loadAdmins();
          }
        } catch (e) {
          showToast('Error: ' + e.message, 'error');
        }

        btn.textContent = 'Add Admin';
        btn.disabled = false;
      });
    }

    // Reset data (clears localStorage cache only)
    document.getElementById('resetDataBtn')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear local cache? Database data will remain.')) {
        Object.values(CMS.KEYS).forEach(key => localStorage.removeItem('samatvam_' + key));
        showToast('Local cache cleared', 'error');
        setTimeout(() => window.location.reload(), 1500);
      }
    });
  }

  // =============================================
  // PAGE CONTENT EDITOR (cms-pages.html)
  // =============================================

  const pageContentEditor = document.getElementById('pageContentEditor');
  if (pageContentEditor) {
    let allPageContent = [];
    let activePage = 'homepage';

    // Tab switching
    const pageTabs = document.getElementById('pageTabs');
    const footerEditorEl = document.getElementById('footerEditor');
    const pageContentSaveBar = document.getElementById('pageContentSaveBar');
    if (pageTabs) {
      pageTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.admin-tab');
        if (!tab) return;
        activePage = tab.dataset.page;
        pageTabs.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (activePage === 'footer') {
          pageContentEditor.style.display = 'none';
          if (pageContentSaveBar) pageContentSaveBar.style.display = 'none';
          if (footerEditorEl) { footerEditorEl.style.display = 'block'; loadFooterEditor(); }
        } else {
          pageContentEditor.style.display = '';
          if (pageContentSaveBar) pageContentSaveBar.style.display = '';
          if (footerEditorEl) footerEditorEl.style.display = 'none';
          renderPageContent();
        }
      });
    }

    async function loadPageContent() {
      allPageContent = (await CMS.getAll(CMS.KEYS.pageContent)) || [];
      renderPageContent();
    }

    // Detect if a field is an image or video type
    function isMediaField(field) {
      return /img|image|photo|video|logo/.test(field);
    }
    function isVideoField(field) {
      return /video/.test(field);
    }

    function renderPageContent() {
      const items = allPageContent.filter(c => c.page === activePage);
      if (!items.length) {
        pageContentEditor.innerHTML = '<div class="admin-card"><p class="text-small text-muted">No editable content found for this page. Run the SQL migration 003 first.</p></div>';
        return;
      }

      // Group by section
      const sections = {};
      items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      items.forEach(item => {
        if (!sections[item.section]) sections[item.section] = [];
        sections[item.section].push(item);
      });

      let html = '';
      for (const [section, fields] of Object.entries(sections)) {
        const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1);
        html += `<div class="admin-card">
          <h3>${sectionTitle} Section</h3>
          <div class="admin-form">`;
        fields.forEach(f => {
          const fieldLabel = f.field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

          if (isMediaField(f.field)) {
            // Media field: show upload + URL input + preview
            const accept = isVideoField(f.field) ? 'video/*' : 'image/*';
            const previewTag = isVideoField(f.field)
              ? (f.value ? `<video src="${f.value}" style="max-height:120px;max-width:100%;border-radius:6px;" controls></video>` : '<span style="color:#999;font-size:0.8rem;">No file uploaded</span>')
              : (f.value ? `<img src="${f.value}" style="max-height:120px;max-width:100%;border-radius:6px;">` : '<span style="color:#999;font-size:0.8rem;">No image uploaded</span>');

            html += `<div class="form-group" style="border:1px solid var(--border);padding:12px;border-radius:8px;margin-bottom:12px;">
              <label style="font-weight:600;">${fieldLabel}</label>
              <div id="preview-${f.id}" style="margin:8px 0;">${previewTag}</div>
              <input type="text" name="pc-${f.id}" value="${(f.value || '').replace(/"/g, '&quot;')}" placeholder="images/path/to/file.jpg">
            </div>`;
          } else {
            // Text field
            const isLong = f.value && f.value.length > 80;
            if (isLong) {
              html += `<div class="form-group">
                <label>${fieldLabel}</label>
                <textarea name="pc-${f.id}" rows="3" style="width:100%;">${f.value || ''}</textarea>
              </div>`;
            } else {
              html += `<div class="form-group">
                <label>${fieldLabel}</label>
                <input type="text" name="pc-${f.id}" value="${(f.value || '').replace(/"/g, '&quot;')}">
              </div>`;
            }
          }
        });
        html += `</div></div>`;
      }
      pageContentEditor.innerHTML = html;
    }

    // Save all changes
    document.getElementById('savePageContentBtn')?.addEventListener('click', async () => {
      const btn = document.getElementById('savePageContentBtn');
      btn.textContent = 'Saving...';
      btn.disabled = true;
      let saved = 0;
      for (const item of allPageContent) {
        const el = pageContentEditor.querySelector(`[name="pc-${item.id}"]`);
        if (!el) continue;
        const newVal = el.value;
        if (newVal !== item.value) {
          await CMS.update(CMS.KEYS.pageContent, item.id, { value: newVal });
          item.value = newVal;
          saved++;
        }
      }
      btn.textContent = 'Save All Changes';
      btn.disabled = false;
      showToast(saved > 0 ? `${saved} field(s) updated` : 'No changes to save');
    });

    // --- Footer Editor ---
    let footerSocials = [];
    let footerMenu = [];
    let footerLegal = [];
    let footerCopyright = '';

    async function loadFooterEditor() {
      const raw = await CMS.getAll(CMS.KEYS.settings);
      const s = Array.isArray(raw) ? (raw[0] || {}) : (raw || {});
      footerSocials = s.footerSocials || [
        { platform: 'instagram', url: 'https://www.instagram.com/samatvam.living?igsh=MWJzNms4anoyYThvYQ==', enabled: true },
        { platform: 'linkedin', url: 'https://www.linkedin.com/company/samatvam1/', enabled: true },
        { platform: 'email', url: 'contact@samatvam.living', enabled: true },
        { platform: 'whatsapp', url: 'https://chat.whatsapp.com/FN0CyVJSDCxDWwJ8gKian3', enabled: true }
      ];
      footerMenu = s.footerMenu || [];
      footerLegal = s.footerLegal || [];
      footerCopyright = s.footerCopyright || '';
      renderFooterSocials();
      renderFooterMenu();
      renderFooterLegal();
      const cpEl = document.getElementById('footerCopyrightInput');
      if (cpEl) cpEl.value = footerCopyright;
    }

    function renderFooterSocials() {
      const el = document.getElementById('footerSocialsList');
      if (!el) return;
      el.innerHTML = footerSocials.map((s, i) => `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <label style="display:flex;align-items:center;gap:6px;min-width:120px;cursor:pointer;"><input type="checkbox" data-social-idx="${i}" ${s.enabled ? 'checked' : ''}> <strong style="text-transform:capitalize;">${s.platform}</strong></label>
        <input type="text" data-social-url="${i}" value="${s.url || ''}" placeholder="https://..." style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:0.85rem;">
      </div>`).join('');
    }

    function renderFooterMenu() {
      const el = document.getElementById('footerMenuList');
      if (!el) return;
      el.innerHTML = footerMenu.map((m, i) => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" data-menu-enabled="${i}" ${m.enabled ? 'checked' : ''}></label>
        <input type="text" data-menu-label="${i}" value="${m.label || ''}" style="width:140px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:0.85rem;">
        <input type="text" data-menu-url="${i}" value="${m.url || ''}" style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:0.85rem;">
        <button class="btn btn-secondary btn-sm remove-menu-btn" data-idx="${i}" style="font-size:0.7rem;padding:4px 8px;color:#D32F2F;">✕</button>
      </div>`).join('');
      el.querySelectorAll('.remove-menu-btn').forEach(btn => {
        btn.addEventListener('click', () => { footerMenu.splice(parseInt(btn.dataset.idx), 1); renderFooterMenu(); });
      });
    }

    function renderFooterLegal() {
      const el = document.getElementById('footerLegalList');
      if (!el) return;
      el.innerHTML = footerLegal.map((m, i) => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" data-legal-enabled="${i}" ${m.enabled ? 'checked' : ''}></label>
        <input type="text" data-legal-label="${i}" value="${m.label || ''}" style="width:140px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:0.85rem;">
        <input type="text" data-legal-url="${i}" value="${m.url || ''}" style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:0.85rem;">
        <button class="btn btn-secondary btn-sm remove-legal-btn" data-idx="${i}" style="font-size:0.7rem;padding:4px 8px;color:#D32F2F;">✕</button>
      </div>`).join('');
      el.querySelectorAll('.remove-legal-btn').forEach(btn => {
        btn.addEventListener('click', () => { footerLegal.splice(parseInt(btn.dataset.idx), 1); renderFooterLegal(); });
      });
    }

    document.getElementById('addMenuItemBtn')?.addEventListener('click', () => {
      const label = document.getElementById('newMenuLabel')?.value.trim();
      const url = document.getElementById('newMenuUrl')?.value.trim();
      if (!label) return;
      footerMenu.push({ label, url: url || '#', enabled: true });
      renderFooterMenu();
      document.getElementById('newMenuLabel').value = '';
      document.getElementById('newMenuUrl').value = '';
    });

    document.getElementById('addLegalItemBtn')?.addEventListener('click', () => {
      const label = document.getElementById('newLegalLabel')?.value.trim();
      const url = document.getElementById('newLegalUrl')?.value.trim();
      if (!label) return;
      footerLegal.push({ label, url: url || '#', enabled: true });
      renderFooterLegal();
      document.getElementById('newLegalLabel').value = '';
      document.getElementById('newLegalUrl').value = '';
    });

    document.getElementById('saveFooterBtn')?.addEventListener('click', async () => {
      const btn = document.getElementById('saveFooterBtn');
      btn.textContent = 'Saving...'; btn.disabled = true;

      // Collect social values from DOM
      footerSocials.forEach((s, i) => {
        const cb = document.querySelector(`[data-social-idx="${i}"]`);
        const url = document.querySelector(`[data-social-url="${i}"]`);
        if (cb) s.enabled = cb.checked;
        if (url) s.url = url.value.trim();
      });
      // Collect menu values
      footerMenu.forEach((m, i) => {
        const cb = document.querySelector(`[data-menu-enabled="${i}"]`);
        const label = document.querySelector(`[data-menu-label="${i}"]`);
        const url = document.querySelector(`[data-menu-url="${i}"]`);
        if (cb) m.enabled = cb.checked;
        if (label) m.label = label.value.trim();
        if (url) m.url = url.value.trim();
      });
      // Collect legal values
      footerLegal.forEach((m, i) => {
        const cb = document.querySelector(`[data-legal-enabled="${i}"]`);
        const label = document.querySelector(`[data-legal-label="${i}"]`);
        const url = document.querySelector(`[data-legal-url="${i}"]`);
        if (cb) m.enabled = cb.checked;
        if (label) m.label = label.value.trim();
        if (url) m.url = url.value.trim();
      });
      footerCopyright = document.getElementById('footerCopyrightInput')?.value || '';

      await CMS.update(CMS.KEYS.settings, 'settings', {
        footerSocials: footerSocials,
        footerMenu: footerMenu,
        footerLegal: footerLegal,
        footerCopyright: footerCopyright
      });
      btn.textContent = 'Save Footer Settings'; btn.disabled = false;
      showToast('Footer settings saved');
    });

    loadPageContent();
  }

  // =============================================
  // LOGO UPLOAD (settings.html)
  // =============================================

  const logoUploadSection = document.getElementById('logoUploadSection');
  if (logoUploadSection) {
    const logoPreview = document.getElementById('logoPreview');
    const logoUrlInput = document.getElementById('logoUrlInput');
    const saveLogoBtn = document.getElementById('saveLogoBtn');

    // Load current logo
    async function loadLogo() {
      const settings = (await CMS.getAll(CMS.KEYS.settings)) || {};
      const s = Array.isArray(settings) ? (settings[0] || {}) : settings;
      if (s.logoUrl) {
        logoPreview.innerHTML = `<img src="${s.logoUrl}" alt="Logo" style="max-height:60px;">`;
        logoUrlInput.value = s.logoUrl;
      }
    }
    loadLogo();

    // Save logo
    if (saveLogoBtn) {
      saveLogoBtn.addEventListener('click', async () => {
        const url = logoUrlInput.value.trim();
        if (!url) { showToast('No logo to save', 'error'); return; }
        const settings = (await CMS.getAll(CMS.KEYS.settings)) || {};
        const s = Array.isArray(settings) ? (settings[0] || {}) : settings;
        await CMS.update(CMS.KEYS.settings, s.id || 'settings', { logoUrl: url });
        showToast('Logo saved');
      });
    }
  }

  // =============================================
  // CMS COURSES PAGE
  // =============================================
  const coursesList = document.getElementById('coursesList');
  if (coursesList) {
    const courseForm = document.getElementById('courseForm');
    const lessonFormWrap = document.getElementById('lessonFormWrap');
    const courseTabs = document.getElementById('courseTabs');
    let editingCourseId = null;
    let editingLessonIdx = -1;
    let activePhase = 'all';

    // Populate linked resource dropdown
    async function populateResourceDropdown(selectedId) {
      const sel = lessonFormWrap ? lessonFormWrap.querySelector('[name="lesResourceId"]') : null;
      if (!sel) return;
      const resources = (await CMS.getAll(CMS.KEYS.resources)) || [];
      sel.innerHTML = '<option value="">— None —</option>' + resources.map(r =>
        `<option value="${r.id}"${r.id === selectedId ? ' selected' : ''}>${r.title} (${r.type} · ${r.phase})</option>`
      ).join('');
    }

    // Tab click handler
    if (courseTabs) {
      courseTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.admin-tab');
        if (!tab) return;
        activePhase = tab.dataset.phase;
        courseTabs.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderCourses();
      });
    }

    async function renderCourses() {
      const courses = (await CMS.getAll(CMS.KEYS.courses)) || [];
      const progress = (await CMS.getAll(CMS.KEYS.lessonProgress)) || [];

      // Update tab counts
      if (courseTabs) {
        const counts = { all: courses.length, restore: 0, nourish: 0, move: 0 };
        courses.forEach(c => { if (counts[c.phase] !== undefined) counts[c.phase]++; });
        courseTabs.querySelectorAll('.admin-tab').forEach(tab => {
          const phase = tab.dataset.phase;
          const countEl = tab.querySelector('.admin-tab__count');
          if (countEl) countEl.textContent = counts[phase] || 0;
          else {
            const span = document.createElement('span');
            span.className = 'admin-tab__count';
            span.textContent = counts[phase] || 0;
            tab.appendChild(span);
          }
        });
      }

      const filtered = activePhase === 'all' ? courses : courses.filter(c => c.phase === activePhase);
      coursesList.innerHTML = filtered.map(c => {
        const lessons = c.lessons || [];
        const completions = lessons.filter(l => progress.find(p => p.lessonId === l.id && p.completed)).length;
        return `
          <div class="cms-item" style="flex-direction:column;align-items:stretch;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <div class="cms-item-info">
                <h4>${c.title}</h4>
                <p>${c.phase} phase · ${lessons.length} lessons · ${completions} completed by clients</p>
              </div>
              <div class="cms-item-actions">
                <button class="edit-course-btn" data-id="${c.id}">Edit</button>
                <button class="delete" data-id="${c.id}">Delete</button>
              </div>
            </div>
            <div class="cl-lesson-list" style="border:1px solid var(--border);border-radius:8px;">
              ${lessons.map((l, i) => `
                <div class="cl-lesson-item" style="cursor:default;">
                  <span class="cl-lesson-type cl-lesson-type--${l.type}">${l.type}</span>
                  <div class="cl-lesson-info">
                    <p class="cl-lesson-title">${l.title}</p>
                    <div class="cl-lesson-meta"><span>${l.duration || ''}</span></div>
                  </div>
                  <div class="cms-item-actions">
                    <button class="edit-lesson-btn" data-course="${c.id}" data-idx="${i}">Edit</button>
                    <button class="delete-lesson-btn delete" data-course="${c.id}" data-idx="${i}">Remove</button>
                  </div>
                </div>
              `).join('')}
              <div style="padding:10px 16px;">
                <button class="btn btn-secondary add-lesson-btn" data-course="${c.id}" style="font-size:0.78rem;padding:6px 16px;">+ Add Lesson</button>
              </div>
            </div>
          </div>`;
      }).join('') || `<p class="text-small text-muted">${activePhase === 'all' ? 'No courses yet.' : 'No ' + activePhase + ' phase courses yet.'}</p>`;

      // Bind course edit
      coursesList.querySelectorAll('.edit-course-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const c = await CMS.getById(CMS.KEYS.courses, btn.dataset.id);
          if (!c || !courseForm) return;
          editingCourseId = c.id;
          courseForm.querySelector('[name="title"]').value = c.title;
          courseForm.querySelector('[name="phase"]').value = c.phase;
          courseForm.querySelector('[name="description"]').value = c.description || '';
          courseForm.querySelector('h3').textContent = 'Edit Course';
          courseForm.style.display = 'block';
          if (lessonFormWrap) lessonFormWrap.style.display = 'none';
          courseForm.scrollIntoView({ behavior: 'smooth' });
        });
      });

      // Bind course delete
      coursesList.querySelectorAll('.cms-item-actions > button.delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!(await confirmDelete('this course'))) return;
          await CMS.remove(CMS.KEYS.courses, btn.dataset.id);
          await renderCourses();
          showToast('Course deleted');
        });
      });

      // Bind lesson edit
      coursesList.querySelectorAll('.edit-lesson-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const c = await CMS.getById(CMS.KEYS.courses, btn.dataset.course);
          if (!c || !lessonFormWrap) return;
          const idx = parseInt(btn.dataset.idx);
          const l = c.lessons[idx];
          if (!l) return;
          editingCourseId = c.id;
          editingLessonIdx = idx;
          lessonFormWrap.querySelector('[name="lesTitle"]').value = l.title;
          lessonFormWrap.querySelector('[name="lesType"]').value = l.type;
          lessonFormWrap.querySelector('[name="lesDuration"]').value = l.duration || '';
          lessonFormWrap.querySelector('[name="lesVideoUrl"]').value = l.videoUrl || '';
          lessonFormWrap.querySelector('[name="lesDescription"]').value = l.description || '';
          lessonFormWrap.querySelector('[name="lesCoachTip"]').value = l.coachTip || '';
          lessonFormWrap.querySelector('[name="lesContent"]').value = l.content || '';
          await populateResourceDropdown(l.resourceId || '');
          lessonFormWrap.querySelector('h3').textContent = 'Edit Lesson';
          if (courseForm) courseForm.style.display = 'none';
          lessonFormWrap.style.display = 'block';
          lessonFormWrap.scrollIntoView({ behavior: 'smooth' });
        });
      });

      // Bind lesson delete
      coursesList.querySelectorAll('.delete-lesson-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Remove this lesson?')) return;
          const course = await CMS.getById(CMS.KEYS.courses, btn.dataset.course);
          if (!course) return;
          course.lessons.splice(parseInt(btn.dataset.idx), 1);
          await CMS.update(CMS.KEYS.courses, course.id, { lessons: course.lessons });
          await renderCourses();
          showToast('Lesson removed');
        });
      });

      // Bind add lesson
      coursesList.querySelectorAll('.add-lesson-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!lessonFormWrap) return;
          editingCourseId = btn.dataset.course;
          editingLessonIdx = -1;
          lessonFormWrap.querySelectorAll('input, textarea, select').forEach(el => { el.value = ''; });
          lessonFormWrap.querySelector('[name="lesType"]').value = 'video';
          await populateResourceDropdown('');
          lessonFormWrap.querySelector('h3').textContent = 'New Lesson';
          if (courseForm) courseForm.style.display = 'none';
          lessonFormWrap.style.display = 'block';
          lessonFormWrap.scrollIntoView({ behavior: 'smooth' });
        });
      });
    }

    await renderCourses();

    // Add course button
    document.getElementById('addCourseBtn')?.addEventListener('click', () => {
      if (!courseForm) return;
      editingCourseId = null;
      courseForm.querySelectorAll('input, textarea, select').forEach(el => { el.value = ''; });
      courseForm.querySelector('[name="phase"]').value = 'restore';
      courseForm.querySelector('h3').textContent = 'New Course';
      if (lessonFormWrap) lessonFormWrap.style.display = 'none';
      courseForm.style.display = 'block';
      courseForm.scrollIntoView({ behavior: 'smooth' });
    });

    // Save course
    if (courseForm) {
      courseForm.querySelector('.btn-primary')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const title = courseForm.querySelector('[name="title"]').value.trim();
        const phase = courseForm.querySelector('[name="phase"]').value;
        const description = courseForm.querySelector('[name="description"]').value.trim();
        if (!title) { showToast('Title is required', 'error'); return; }
        if (editingCourseId) {
          await CMS.update(CMS.KEYS.courses, editingCourseId, { title, phase, description });
          showToast('Course updated');
        } else {
          await CMS.add(CMS.KEYS.courses, { title, phase, description, lessons: [] });
          showToast('Course added');
        }
        courseForm.style.display = 'none';
        await renderCourses();
      });
      courseForm.querySelector('.btn-secondary')?.addEventListener('click', (e) => {
        e.preventDefault();
        courseForm.style.display = 'none';
      });
    }

    // Save lesson
    if (lessonFormWrap) {
      lessonFormWrap.querySelector('.btn-primary')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const lesTitle = lessonFormWrap.querySelector('[name="lesTitle"]').value.trim();
        if (!lesTitle) { showToast('Lesson title is required', 'error'); return; }
        const resourceId = lessonFormWrap.querySelector('[name="lesResourceId"]')?.value || '';
        const lessonData = {
          title: lesTitle,
          type: lessonFormWrap.querySelector('[name="lesType"]').value,
          duration: lessonFormWrap.querySelector('[name="lesDuration"]').value.trim(),
          videoUrl: lessonFormWrap.querySelector('[name="lesVideoUrl"]').value.trim(),
          description: lessonFormWrap.querySelector('[name="lesDescription"]').value.trim(),
          coachTip: lessonFormWrap.querySelector('[name="lesCoachTip"]').value.trim(),
          content: lessonFormWrap.querySelector('[name="lesContent"]').value.trim(),
          resourceId: resourceId
        };
        const course = await CMS.getById(CMS.KEYS.courses, editingCourseId);
        if (!course) return;
        if (editingLessonIdx >= 0) {
          lessonData.id = course.lessons[editingLessonIdx].id;
          course.lessons[editingLessonIdx] = lessonData;
          showToast('Lesson updated');
        } else {
          lessonData.id = 'les-' + Date.now().toString(36);
          course.lessons.push(lessonData);
          showToast('Lesson added');
        }
        await CMS.update(CMS.KEYS.courses, course.id, { lessons: course.lessons });
        lessonFormWrap.style.display = 'none';
        await renderCourses();
      });
      lessonFormWrap.querySelector('.btn-secondary')?.addEventListener('click', (e) => {
        e.preventDefault();
        lessonFormWrap.style.display = 'none';
      });
    }
  }

  // =============================================
  // STORIES CMS (cms-stories.html)
  // =============================================

  const storiesList = document.getElementById('storiesList');
  const storyForm = document.getElementById('storyForm');

  if (storiesList && storyForm) {
    let allStories = [];

    async function loadStories() {
      allStories = (await CMS.getAll(CMS.KEYS.stories)) || [];
      allStories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      renderStories();
    }

    function renderStories() {
      if (!allStories.length) {
        storiesList.innerHTML = '<p class="text-small text-muted">No stories yet. Click "+ Add Story" to create one.</p>';
        return;
      }
      let html = '';
      allStories.forEach(s => {
        const featBadge = s.featured ? '<span style="background:var(--green);color:#fff;padding:2px 8px;border-radius:4px;font-size:0.7rem;margin-left:8px;">FEATURED</span>' : '';
        const activeBadge = s.active === false ? '<span style="background:#c0392b;color:#fff;padding:2px 8px;border-radius:4px;font-size:0.7rem;margin-left:8px;">HIDDEN</span>' : '';
        const imgPreview = s.imgBefore ? `<img src="${s.imgBefore}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin-right:10px;">` : '';
        html += `<div class="cms-item" style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;">
            ${imgPreview}
            <div>
              <strong>${s.authorName || 'Unnamed'}</strong>${featBadge}${activeBadge}
              <div style="font-size:0.8rem;color:#999;">${s.badge || ''} · ${s.result || ''}</div>
            </div>
          </div>
          <button class="btn btn-secondary edit-story-btn" data-id="${s.id}" style="font-size:0.8rem;padding:4px 12px;">Edit</button>
        </div>`;
      });
      storiesList.innerHTML = html;

      // Bind edit buttons
      storiesList.querySelectorAll('.edit-story-btn').forEach(btn => {
        btn.addEventListener('click', () => editStory(btn.dataset.id));
      });
    }

    function resetForm() {
      storyForm.style.display = 'none';
      document.getElementById('storyEditId').value = '';
      document.getElementById('storyBadge').value = '';
      document.getElementById('storyResult').value = '';
      document.getElementById('storyQuote').value = '';
      document.getElementById('storyBefore').value = '';
      document.getElementById('storyAfter').value = '';
      document.getElementById('storyAuthor').value = '';
      document.getElementById('storyRole').value = '';
      document.getElementById('storyImgBefore').value = '';
      document.getElementById('storyImgAfter').value = '';
      document.getElementById('storyVideoUrl').value = '';
      document.getElementById('storySortOrder').value = '0';
      document.getElementById('storyFeatured').checked = false;
      document.getElementById('storyImgBeforePreview').innerHTML = '<span style="color:#999;font-size:0.8rem;">No image</span>';
      document.getElementById('storyImgAfterPreview').innerHTML = '<span style="color:#999;font-size:0.8rem;">No image</span>';
      document.getElementById('storyVideoPreview').innerHTML = '<span style="color:#999;font-size:0.8rem;">No video</span>';
      document.getElementById('deleteStoryBtn').style.display = 'none';
      document.getElementById('storyFormTitle').textContent = 'Add New Story';
    }

    function editStory(id) {
      const s = allStories.find(x => x.id === id);
      if (!s) return;
      document.getElementById('storyEditId').value = s.id;
      document.getElementById('storyBadge').value = s.badge || '';
      document.getElementById('storyResult').value = s.result || '';
      document.getElementById('storyQuote').value = s.quote || '';
      document.getElementById('storyBefore').value = s.beforeText || '';
      document.getElementById('storyAfter').value = s.afterText || '';
      document.getElementById('storyAuthor').value = s.authorName || '';
      document.getElementById('storyRole').value = s.authorRole || '';
      document.getElementById('storyImgBefore').value = s.imgBefore || '';
      document.getElementById('storyImgAfter').value = s.imgAfter || '';
      document.getElementById('storyVideoUrl').value = s.videoUrl || '';
      document.getElementById('storySortOrder').value = s.sortOrder || 0;
      document.getElementById('storyFeatured').checked = !!s.featured;
      document.getElementById('storyImgBeforePreview').innerHTML = s.imgBefore ? `<img src="${s.imgBefore}" style="max-height:100px;border-radius:6px;">` : '<span style="color:#999;font-size:0.8rem;">No image</span>';
      document.getElementById('storyImgAfterPreview').innerHTML = s.imgAfter ? `<img src="${s.imgAfter}" style="max-height:100px;border-radius:6px;">` : '<span style="color:#999;font-size:0.8rem;">No image</span>';
      document.getElementById('storyVideoPreview').innerHTML = s.videoUrl ? `<video src="${s.videoUrl}" style="max-height:100px;border-radius:6px;" controls></video>` : '<span style="color:#999;font-size:0.8rem;">No video</span>';
      document.getElementById('deleteStoryBtn').style.display = 'inline-block';
      document.getElementById('storyFormTitle').textContent = 'Edit Story';
      storyForm.style.display = 'block';
      storyForm.scrollIntoView({ behavior: 'smooth' });
    }

    // Add story button
    document.getElementById('addStoryBtn')?.addEventListener('click', () => {
      resetForm();
      storyForm.style.display = 'block';
      storyForm.scrollIntoView({ behavior: 'smooth' });
    });

    // Cancel
    document.getElementById('cancelStoryBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      resetForm();
    });

    // Save story
    document.getElementById('saveStoryBtn')?.addEventListener('click', async (e) => {
      e.preventDefault();
      const authorName = document.getElementById('storyAuthor').value.trim();
      if (!authorName) { showToast('Author name is required', 'error'); return; }

      const data = {
        badge: document.getElementById('storyBadge').value.trim(),
        result: document.getElementById('storyResult').value.trim(),
        quote: document.getElementById('storyQuote').value.trim(),
        beforeText: document.getElementById('storyBefore').value.trim(),
        afterText: document.getElementById('storyAfter').value.trim(),
        authorName,
        authorRole: document.getElementById('storyRole').value.trim(),
        imgBefore: document.getElementById('storyImgBefore').value.trim(),
        imgAfter: document.getElementById('storyImgAfter').value.trim(),
        videoUrl: document.getElementById('storyVideoUrl').value.trim(),
        sortOrder: parseInt(document.getElementById('storySortOrder').value) || 0,
        featured: document.getElementById('storyFeatured').checked,
      };

      const editId = document.getElementById('storyEditId').value;
      if (editId) {
        await CMS.update(CMS.KEYS.stories, editId, data);
        showToast('Story updated');
      } else {
        await CMS.add(CMS.KEYS.stories, data);
        showToast('Story added');
      }
      resetForm();
      await loadStories();
    });

    // Delete story
    document.getElementById('deleteStoryBtn')?.addEventListener('click', async () => {
      const editId = document.getElementById('storyEditId').value;
      if (!editId) return;
      if (!confirm('Delete this story permanently?')) return;
      await CMS.remove(CMS.KEYS.stories, editId);
      showToast('Story deleted');
      resetForm();
      await loadStories();
    });

    loadStories();
  }

  // =============================================
  // CONTACT SUBMISSIONS (cms-contacts.html)
  // =============================================

  const contactsList = document.getElementById('contactsList');
  if (contactsList) {
    let allContacts = [];

    async function loadContacts() {
      try {
        allContacts = (await CMS.getAll(CMS.KEYS.contactSubmissions)) || [];
        allContacts.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
      } catch (e) { allContacts = []; }
      renderContacts();
      renderContactStats();
    }

    function renderContactStats() {
      const statsEl = document.getElementById('contactStats');
      if (!statsEl) return;
      const total = allContacts.length;
      const newCount = allContacts.filter(c => c.status === 'new').length;
      const responded = allContacts.filter(c => c.status === 'responded').length;
      const archived = allContacts.filter(c => c.status === 'archived').length;
      const waitlist = allContacts.filter(c => (c.interest || '').includes('waitlist')).length;
      statsEl.innerHTML = `
        <div class="stat-card"><p class="label">Total</p><p class="stat-value">${total}</p></div>
        <div class="stat-card"><p class="label">New</p><p class="stat-value" style="color:var(--green);">${newCount}</p></div>
        <div class="stat-card"><p class="label">Waitlist</p><p class="stat-value" style="color:#e67e22;">${waitlist}</p></div>
        <div class="stat-card"><p class="label">Responded</p><p class="stat-value">${responded}</p></div>
        <div class="stat-card"><p class="label">Archived</p><p class="stat-value">${archived}</p></div>
      `;
    }

    function renderContacts() {
      const filterVal = document.getElementById('contactStatusFilter')?.value || 'all';
      const filtered = filterVal === 'all' ? allContacts : allContacts.filter(c => c.status === filterVal);

      if (!filtered.length) {
        contactsList.innerHTML = '<p class="text-small text-muted" style="padding:16px;">No submissions found.</p>';
        return;
      }
      let html = '';
      filtered.forEach(c => {
        const date = new Date(c.createdAt || c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const statusColor = c.status === 'new' ? 'var(--green)' : c.status === 'responded' ? '#3498db' : '#999';
        html += `<div class="cms-item" style="display:flex;align-items:center;justify-content:space-between;padding:14px;border-bottom:1px solid var(--border);cursor:pointer;" data-contact-id="${c.id}">
          <div>
            <strong>${c.name || 'Unknown'}</strong>
            <span style="background:${statusColor};color:#fff;padding:2px 8px;border-radius:4px;font-size:0.7rem;margin-left:8px;text-transform:uppercase;">${c.status || 'new'}</span>
            <div style="font-size:0.8rem;color:#999;margin-top:4px;">${c.email || ''} · ${c.interest || ''} · ${date}</div>
            ${(c.interest || '').includes('waitlist') ? '<span style="background:#e67e22;color:#fff;padding:2px 8px;border-radius:4px;font-size:0.65rem;text-transform:uppercase;margin-top:4px;display:inline-block;">Waitlist</span>' : ''}
            ${c.message ? `<div style="font-size:0.82rem;color:var(--charcoal);margin-top:6px;max-width:600px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">"${c.message}"</div>` : ''}
          </div>
          <span style="font-size:0.8rem;color:var(--green);font-weight:500;">View →</span>
        </div>`;
      });
      contactsList.innerHTML = html;

      contactsList.querySelectorAll('[data-contact-id]').forEach(el => {
        el.addEventListener('click', () => showContactDetail(el.dataset.contactId));
      });
    }

    function showContactDetail(id) {
      const c = allContacts.find(x => x.id === id);
      if (!c) return;
      const detail = document.getElementById('contactDetail');
      if (!detail) return;
      document.getElementById('cdName').textContent = c.name || '';
      document.getElementById('cdEmail').textContent = c.email || '';
      document.getElementById('cdPhone').textContent = c.phone || 'Not provided';
      document.getElementById('cdInterest').textContent = c.interest || 'Not specified';
      document.getElementById('cdMessage').textContent = c.message || 'No message';
      document.getElementById('cdDate').textContent = new Date(c.createdAt || c.created_at).toLocaleString();
      document.getElementById('cdStatus').value = c.status || 'new';
      detail.style.display = 'block';
      detail.scrollIntoView({ behavior: 'smooth' });

      // Reply via Email button
      document.getElementById('emailContactBtn').onclick = () => {
        const replyCard = document.getElementById('emailReplyCard');
        if (!replyCard) return;
        document.getElementById('replyTo').value = c.email || '';
        document.getElementById('replySubject').value = 'Re: Your inquiry — Samatvam Living';
        document.getElementById('replyBody').value = '';
        replyCard.style.display = 'block';
        replyCard.scrollIntoView({ behavior: 'smooth' });
      };

      // Send reply
      document.getElementById('sendReplyBtn').onclick = async () => {
        const toEmail = document.getElementById('replyTo').value;
        const subject = document.getElementById('replySubject').value;
        const body = document.getElementById('replyBody').value;
        if (!body.trim()) { showToast('Please type a reply', 'error'); return; }

        const btn = document.getElementById('sendReplyBtn');
        btn.textContent = 'Sending...';
        btn.disabled = true;

        if (typeof SamatvamEmail !== 'undefined') {
          await SamatvamEmail.init();
          const result = await SamatvamEmail.sendManualEmail({ toEmail, subject, body });
          if (result.success) {
            showToast('Email sent to ' + toEmail);
            // Auto-update status to responded
            await CMS.update(CMS.KEYS.contactSubmissions, id, { status: 'responded' });
            document.getElementById('emailReplyCard').style.display = 'none';
            detail.style.display = 'none';
            await loadContacts();
          } else {
            showToast('Failed to send: ' + (result.reason || 'unknown error'), 'error');
          }
        } else {
          // Fallback to mailto
          window.open('mailto:' + toEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body));
          showToast('Email client opened');
          document.getElementById('emailReplyCard').style.display = 'none';
        }
        btn.textContent = 'Send Email →';
        btn.disabled = false;
      };

      // Cancel reply
      document.getElementById('cancelReplyBtn').onclick = () => {
        document.getElementById('emailReplyCard').style.display = 'none';
      };

      document.getElementById('updateContactBtn').onclick = async () => {
        const newStatus = document.getElementById('cdStatus').value;
        await CMS.update(CMS.KEYS.contactSubmissions, id, { status: newStatus });
        showToast('Status updated');
        detail.style.display = 'none';
        document.getElementById('emailReplyCard').style.display = 'none';
        await loadContacts();
      };

      document.getElementById('closeContactBtn').onclick = (e) => {
        e.preventDefault();
        detail.style.display = 'none';
        document.getElementById('emailReplyCard').style.display = 'none';
      };
    }

    document.getElementById('contactStatusFilter')?.addEventListener('change', renderContacts);
    loadContacts();
  }

  })(); // end async IIFE
});
